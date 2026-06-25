/**
 * 钱包认证 Hook
 * 处理钱包连接、签名和登录流程
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { useAccount, useSwitchChain, useConnectorClient } from 'wagmi';
import { getChainId, signMessage } from 'wagmi/actions';
import { getNonce, walletLogin, setToken, setUserInfo, type WalletLoginResponse } from '@/lib/api';
import { config } from '@/wagmiConfig';
import { useApiError } from './useApiError';

const PLASMA_CHAIN_ID = 9745;
const AUTO_LOGIN_DELAY_MS = 800;
const CONNECTOR_READY_RETRIES = 5;

function isConnectorNotReadyError(error: unknown): boolean {
  const name = (error as Error)?.name ?? '';
  const message = (error as Error)?.message ?? '';
  return name === 'ConnectorNotConnectedError' || message.includes('Connector not connected');
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface UseWalletAuthOptions {
  inviteAddress?: string;
  onSuccess?: (result: WalletLoginResponse) => void;
  onError?: (error: Error) => void;
  autoLogin?: boolean;
}

export interface UseWalletAuthReturn {
  isAuthenticating: boolean;
  authenticate: () => Promise<void>;
  error: ReturnType<typeof useApiError>['error'];
  clearError: () => void;
}

export function useWalletAuth(options: UseWalletAuthOptions = {}): UseWalletAuthReturn {
  const { inviteAddress, onSuccess, onError, autoLogin = false } = options;
  const { address, isConnected, status, connector } = useAccount();
  const { switchChain } = useSwitchChain();
  const { data: connectorClient } = useConnectorClient();
  const { error, handleError, clearError } = useApiError();
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [hasAttempted, setHasAttempted] = useState(false);
  const authInFlightRef = useRef(false);
  const previousAddressRef = useRef<string | undefined>(undefined);

  const waitForPlasmaChain = useCallback(async () => {
    if (getChainId(config) === PLASMA_CHAIN_ID) return;

    for (let i = 0; i < 20; i += 1) {
      await sleep(500);
      if (getChainId(config) === PLASMA_CHAIN_ID) return;
    }

    if (!switchChain) {
      throw new Error('钱包不支持切换网络，请手动切换到 PLASMA 网络');
    }

    await new Promise<void>((resolve, reject) => {
      switchChain(
        { chainId: PLASMA_CHAIN_ID },
        {
          onSuccess: () => resolve(),
          onError: () => reject(new Error('请在钱包中切换到 PLASMA 网络后重试')),
        }
      );
    });
    await sleep(500);
  }, [switchChain]);

  const signAuthMessage = useCallback(async (message: string, account: `0x${string}`) => {
    for (let attempt = 0; attempt < CONNECTOR_READY_RETRIES; attempt += 1) {
      try {
        return await signMessage(config, { account, message });
      } catch (err) {
        if (attempt < CONNECTOR_READY_RETRIES - 1 && isConnectorNotReadyError(err)) {
          await sleep(400 * (attempt + 1));
          continue;
        }
        throw err;
      }
    }
    throw new Error('钱包尚未就绪，请稍后重试');
  }, []);

  const authenticate = useCallback(async () => {
    if (status !== 'connected' || !isConnected || !address || !connector) {
      const authError = new Error('请先连接钱包');
      handleError(authError);
      onError?.(authError);
      return;
    }

    if (authInFlightRef.current) return;

    authInFlightRef.current = true;
    setIsAuthenticating(true);
    clearError();

    try {
      for (let attempt = 0; attempt < CONNECTOR_READY_RETRIES; attempt += 1) {
        if (connectorClient) break;
        await sleep(400 * (attempt + 1));
      }
      if (!connectorClient) {
        throw new Error('钱包尚未就绪，请稍后重试');
      }

      setHasAttempted(true);
      await waitForPlasmaChain();

      const walletAddress = address.toLowerCase();
      console.log('🔐 步骤 1: 获取 nonce...');
      console.log('📍 钱包地址:', walletAddress);
      const nonceData = await getNonce({ wallet_address: walletAddress });
      console.log('✅ Nonce 获取成功:', nonceData.nonce);

      const message = nonceData.message;
      console.log('📝 签名消息:', message);

      console.log('✍️ 步骤 2: 请求签名...');
      const signature = await signAuthMessage(message, address);
      console.log('✅ 签名成功:', signature);

      const now = Math.floor(Date.now() / 1000);
      if (now > nonceData.expire_time) {
        console.warn('⚠️ 警告: Nonce 已过期！');
      }

      console.log('🔑 步骤 3: 验证签名并登录...');
      const loginResult = await walletLogin({
        wallet_address: walletAddress,
        signature,
        invit: inviteAddress,
      });
      console.log('✅ 登录成功:', loginResult);

      setToken(loginResult.token);
      setUserInfo(loginResult);
      window.dispatchEvent(new CustomEvent('auth:login', { detail: loginResult }));
      onSuccess?.(loginResult);
    } catch (err) {
      console.error('❌ 认证失败:', err);
      if (isConnectorNotReadyError(err)) {
        setHasAttempted(false);
      }
      handleError(err);
      onError?.(err as Error);
    } finally {
      authInFlightRef.current = false;
      setIsAuthenticating(false);
    }
  }, [
    status,
    isConnected,
    address,
    connector,
    connectorClient,
    inviteAddress,
    onSuccess,
    onError,
    handleError,
    clearError,
    waitForPlasmaChain,
    signAuthMessage,
  ]);

  useEffect(() => {
    if (!autoLogin) return;
    if (status !== 'connected' || !address || !connector || !connectorClient) return;
    if (hasAttempted || isAuthenticating || authInFlightRef.current) return;
    if (sessionStorage.getItem('auth_token')) return;

    const timer = window.setTimeout(() => {
      console.log('🔄 钱包就绪，自动触发登录...');
      authenticate();
    }, AUTO_LOGIN_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, [autoLogin, status, address, connector, connectorClient, hasAttempted, isAuthenticating, authenticate]);

  useEffect(() => {
    if (!address) {
      previousAddressRef.current = undefined;
      return;
    }

    const normalized = address.toLowerCase();
    if (previousAddressRef.current && previousAddressRef.current !== normalized) {
      setHasAttempted(false);
    }
    previousAddressRef.current = normalized;
  }, [address]);

  return {
    isAuthenticating,
    authenticate,
    error,
    clearError,
  };
}

export function useIsAuthenticated(): boolean {
  return !!sessionStorage.getItem('auth_token');
}

export function useAuthWalletAddress(): string | null {
  const { address, isConnected } = useAccount();
  const isAuthenticated = useIsAuthenticated();

  return isConnected && isAuthenticated ? address || null : null;
}
