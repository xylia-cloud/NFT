import { http } from 'wagmi'
import { bsc } from 'wagmi/chains'
import { getDefaultConfig } from '@rainbow-me/rainbowkit'

// WalletConnect project ID - you can get one from https://cloud.walletconnect.com
// Using a demo project ID for development
const projectId = 'demo-project-id'

export const config = getDefaultConfig({
  appName: 'BSC Payment Channel',
  projectId,
  chains: [bsc],
  transports: {
    [bsc.id]: http(),
  },
})