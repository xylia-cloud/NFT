import { useEffect, useRef } from 'react';
import { useAccount, useSwitchChain, useChainId } from 'wagmi';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

const PLASMA_CHAIN_ID = 9745;

export function NetworkGuard() {
  const { isConnected, address } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const { t } = useTranslation();
  const hasShownToast = useRef(false);
  const isSwitching = useRef(false);

  useEffect(() => {
    // 重置 toast 标记当断开连接时
    if (!isConnected) {
      hasShownToast.current = false;
      isSwitching.current = false;
    }
  }, [isConnected]);

  useEffect(() => {
    // 只在已连接且网络不正确时提示切换
    if (isConnected && chainId !== PLASMA_CHAIN_ID && !isSwitching.current) {
      console.log('⚠️ 检测到错误的网络:', chainId, '期望:', PLASMA_CHAIN_ID);
      
      // 自动尝试切换网络
      if (switchChain) {
        isSwitching.current = true;
        
        // 只显示一次提示
        if (!hasShownToast.current) {
          toast.info(t('network.switching'), {
            duration: 2000,
          });
          hasShownToast.current = true;
        }
        
        // 延迟一点再切换，确保钱包已完全连接
        setTimeout(() => {
          switchChain(
            { chainId: PLASMA_CHAIN_ID },
            {
              onSuccess: () => {
                console.log('✅ 网络切换成功');
                toast.success(t('network.switchSuccess'));
                isSwitching.current = false;
                hasShownToast.current = false;
              },
              onError: (error) => {
                console.error('❌ 网络切换失败:', error);
                toast.error(t('network.switchFailed'), {
                  description: t('network.switchManually'),
                  duration: 5000,
                });
                isSwitching.current = false;
                hasShownToast.current = false;
              },
            }
          );
        }, 500);
      } else {
        // 如果不支持自动切换，提示用户手动切换
        if (!hasShownToast.current) {
          toast.error(t('network.wrongNetwork'), {
            description: t('network.switchManually'),
            duration: 5000,
          });
          hasShownToast.current = true;
        }
      }
    }
  }, [isConnected, chainId, switchChain, t, address]);

  return null;
}
