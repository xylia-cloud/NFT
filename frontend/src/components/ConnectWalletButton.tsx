import { useEffect } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useSwitchChain, useChainId } from 'wagmi';

const PLASMA_CHAIN_ID = 9745;

export function ConnectWalletButton() {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();

  // 连接后立即检查网络
  useEffect(() => {
    if (isConnected && chainId !== PLASMA_CHAIN_ID && switchChain) {
      console.log('🔄 连接后检测到错误网络，立即切换到 PLASMA...');
      
      // 立即切换，不显示提示（NetworkGuard 会处理提示）
      setTimeout(() => {
        switchChain({ chainId: PLASMA_CHAIN_ID });
      }, 100);
    }
  }, [isConnected, chainId, switchChain]);

  return <ConnectButton />;
}
