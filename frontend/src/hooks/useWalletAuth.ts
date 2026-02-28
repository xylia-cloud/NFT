/**
 * 钱包认证 Hook
 * 处理钱包连接、签名和登录流程
 */

import { useState, useCallback, useEffect } from 'react';
import { useAccount, useSignMessage, useSwitchChain, useChainId } from 'wagmi';
import { getNonce, walletLogin, setToken, setUserInfo, type WalletLoginResponse } from '@/lib/api';
import { useApiError } from './useApiError';

const PLASMA_CHAIN_ID = 9745;

export interface UseWalletAuthOptions {
  inviteAddress?: string; // 邀请人钱包地址
  onSuccess?: (result: WalletLoginResponse) => void;
  onError?: (error: Error) => void;
  autoLogin?: boolean; // 是否自动登录（默认 false）
}

export interface UseWalletAuthReturn {
  isAuthenticating: boolean;
  authenticate: () => Promise<void>;
  error: ReturnType<typeof useApiError>['error'];
  clearError: () => void;
}

/**
 * 钱包认证 Hook
 * 
 * 使用流程：
 * 1. 用户连接钱包（通过 RainbowKit）
 * 2. 调用 authenticate() 开始认证
 * 3. 获取 nonce
 * 4. 请求用户签名
 * 5. 提交签名到后端验证
 * 6. 保存 token
 * 
 * @example
 * ```tsx
 * const { authenticate, isAuthenticating, error } = useWalletAuth({
 *   inviteAddress: '0x742d35cc6634c0532925a3b844bc9e7595f0beb4',
 *   onSuccess: (result) => {
 *     console.log('登录成功:', result);
 *     router.push('/dashboard');
 *   }
 * });
 * 
 * // 在用户点击登录按钮时调用
 * <Button onClick={authenticate} disabled={isAuthenticating}>
 *   {isAuthenticating ? '认证中...' : '签名登录'}
 * </Button>
 * ```
 */
export function useWalletAuth(options: UseWalletAuthOptions = {}): UseWalletAuthReturn {
  const { inviteAddress, onSuccess, onError, autoLogin = false } = options;
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const { signMessageAsync } = useSignMessage();
  const { error, handleError, clearError } = useApiError();
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [hasAttempted, setHasAttempted] = useState(false); // 防止无限重试

  const authenticate = useCallback(async () => {
    if (!isConnected || !address) {
      const error = new Error('请先连接钱包');
      handleError(error);
      onError?.(error);
      return;
    }

    setIsAuthenticating(true);
    setHasAttempted(true); // 标记已尝试过
    clearError();

    try {
      // 0. 检查并切换到 PLASMA 网络
      if (chainId !== PLASMA_CHAIN_ID) {
        console.log('⚠️ 当前网络不是 PLASMA，正在切换...', { current: chainId, target: PLASMA_CHAIN_ID });
        
        if (!switchChain) {
          throw new Error('钱包不支持切换网络，请手动切换到 PLASMA 网络');
        }

        try {
          await new Promise<void>((resolve, reject) => {
            switchChain(
              { chainId: PLASMA_CHAIN_ID },
              {
                onSuccess: () => {
                  console.log('✅ 网络切换成功');
                  resolve();
                },
                onError: (error) => {
                  console.error('❌ 网络切换失败:', error);
                  reject(new Error('请在钱包中切换到 PLASMA 网络后重试'));
                },
              }
            );
          });

          // 等待网络切换完成
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (switchError) {
          throw switchError;
        }
      }

      // 1. 获取 nonce（使用小写地址）
      const walletAddress = address.toLowerCase();
      console.log('🔐 步骤 1: 获取 nonce...');
      console.log('📍 钱包地址:', walletAddress);
      const nonceData = await getNonce({ wallet_address: walletAddress });
      console.log('✅ Nonce 获取成功:', nonceData.nonce);
      
      // 直接使用后端返回的消息（不添加换行符）
      const message = nonceData.message;
      console.log('📝 签名消息:', message);
      console.log('📏 消息长度:', message.length);
      console.log('⏰ Nonce 过期时间:', new Date(nonceData.expire_time * 1000).toLocaleString());

      // 2. 请求用户签名
      console.log('✍️ 步骤 2: 请求签名...');
      const signStartTime = Date.now();
      const signature = await signMessageAsync({
        message: message,
      });
      const signDuration = Date.now() - signStartTime;
      console.log('✅ 签名成功:', signature);
      console.log('⏱️ 签名耗时:', signDuration, 'ms');
      
      // 检查 nonce 是否过期
      const now = Math.floor(Date.now() / 1000);
      if (now > nonceData.expire_time) {
        console.warn('⚠️ 警告: Nonce 已过期！');
      }

      // 3. 提交签名到后端验证并登录（使用小写地址）
      console.log('🔑 步骤 3: 验证签名并登录...');
      console.log('📤 提交数据:', {
        wallet_address: walletAddress,
        signature,
        invit: inviteAddress || '(无邀请人)',
      });
      
      const loginResult = await walletLogin({
        wallet_address: walletAddress,
        signature,
        invit: inviteAddress,
      });
      console.log('✅ 登录成功:', loginResult);

      // 4. 保存 token 和用户信息
      setToken(loginResult.token);
      setUserInfo(loginResult);
      console.log('💾 Token 和用户信息已保存');

      // 5. 触发全局登录事件，通知其他组件刷新数据
      window.dispatchEvent(new CustomEvent('auth:login', { detail: loginResult }));

      // 6. 触发成功回调
      onSuccess?.(loginResult);
    } catch (err) {
      console.error('❌ 认证失败:', err);
      handleError(err);
      onError?.(err as Error);
    } finally {
      setIsAuthenticating(false);
    }
  }, [isConnected, address, chainId, switchChain, signMessageAsync, inviteAddress, onSuccess, onError, handleError, clearError]);

  // 自动登录：当钱包连接且未登录时自动触发（只尝试一次）
  useEffect(() => {
    if (autoLogin && isConnected && address && !hasAttempted && !isAuthenticating) {
      const token = sessionStorage.getItem('auth_token');
      if (!token) {
        console.log('🔄 检测到钱包连接，自动触发登录...');
        authenticate();
      }
    }
  }, [autoLogin, isConnected, address, hasAttempted, isAuthenticating]);

  // 当钱包地址变化时，重置尝试标记
  useEffect(() => {
    if (address) {
      setHasAttempted(false);
    }
  }, [address]);

  return {
    isAuthenticating,
    authenticate,
    error,
    clearError,
  };
}

/**
 * 检查用户是否已登录
 * 使用 sessionStorage，关闭页面自动清除
 */
export function useIsAuthenticated(): boolean {
  const token = sessionStorage.getItem('auth_token');
  return !!token;
}

/**
 * 获取当前登录的钱包地址
 */
export function useAuthWalletAddress(): string | null {
  const { address, isConnected } = useAccount();
  const isAuthenticated = useIsAuthenticated();
  
  return isConnected && isAuthenticated ? address || null : null;
}
