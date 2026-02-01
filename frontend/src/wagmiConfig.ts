import { http } from 'wagmi'
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

// WalletConnect project ID - you can get one from https://cloud.walletconnect.com
// Using a demo project ID for development
const projectId = 'demo-project-id'

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
})