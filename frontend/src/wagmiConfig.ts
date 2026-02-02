import { http, createStorage, cookieStorage } from 'wagmi'
import { plasma } from 'wagmi/chains'
import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import {
  okxWallet,
  tokenPocketWallet,
  bitgetWallet,
  metaMaskWallet,
  walletConnectWallet,
  injectedWallet,
} from '@rainbow-me/rainbowkit/wallets'

const projectId = '497f09c5a7528641d51b5996281682eb'

function getStorage() {
  if (typeof window !== 'undefined') {
    try {
      return createStorage({
        storage: window.localStorage,
      });
    } catch {
      return createStorage({
        storage: cookieStorage,
      });
    }
  }
  return createStorage({
    storage: cookieStorage,
  });
}

export const config = getDefaultConfig({
  appName: 'PLASMA',
  projectId,
  chains: [plasma],
  transports: {
    [plasma.id]: http(),
  },
  wallets: [
    {
      groupName: '常用钱包',
      wallets: [okxWallet, tokenPocketWallet, bitgetWallet, metaMaskWallet],
    },
    {
      groupName: '其他',
      wallets: [walletConnectWallet, injectedWallet],
    },
  ],
  syncConnectedChain: true,
  ssr: false,
})
