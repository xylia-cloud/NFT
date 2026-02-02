import { http } from 'wagmi'
import { hardhat } from 'wagmi/chains'
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

export const config = getDefaultConfig({
  appName: 'PLASMA',
  projectId,
  // 本地测试链（Hardhat，chainId=31337）
  // NOTE: 为了让 MetaMask 的 Gas 币种显示为 XPL，这里覆盖 nativeCurrency
  chains: [
    {
      ...hardhat,
      name: 'Hardhat Local',
      nativeCurrency: { name: 'XPL', symbol: 'XPL', decimals: 18 },
      rpcUrls: {
        ...hardhat.rpcUrls,
        default: { http: ['http://127.0.0.1:8546'] },
        public: { http: ['http://127.0.0.1:8546'] },
      },
    },
  ],
  transports: {
    [hardhat.id]: http('http://127.0.0.1:8546'),
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
})

export const CONTRACT_ADDRESS = '0x5FbDB2315678afecb367f032d93F642f64180aa3' as `0x${string}`

// USDT 合约地址 (本地 Mock USDT)
export const USDT_ADDRESS = '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512' as `0x${string}`

export const CONTRACT_ABI = [
  { anonymous: false, inputs: [{ indexed: true, name: 'user', type: 'address' }, { indexed: false, name: 'amount', type: 'uint256' }], name: 'Deposited', type: 'event' },
  { anonymous: false, inputs: [{ indexed: true, name: 'user', type: 'address' }, { indexed: false, name: 'amount', type: 'uint256' }], name: 'Withdrawn', type: 'event' },
  { anonymous: false, inputs: [{ indexed: true, name: 'user', type: 'address' }, { indexed: false, name: 'amount', type: 'uint256' }], name: 'USDTDeposited', type: 'event' },
  { inputs: [], name: 'deposit', outputs: [], stateMutability: 'payable', type: 'function' },
  { inputs: [{ name: 'amount', type: 'uint256' }], name: 'depositUsdt', outputs: [], stateMutability: 'nonpayable', type: 'function' },
  { inputs: [{ name: 'user', type: 'address' }], name: 'getBalance', outputs: [{ name: '', type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [{ name: 'amount', type: 'uint256' }], name: 'withdraw', outputs: [], stateMutability: 'nonpayable', type: 'function' },
  { inputs: [{ name: 'to', type: 'address' }, { name: 'amount', type: 'uint256' }], name: 'withdrawTo', outputs: [], stateMutability: 'nonpayable', type: 'function' },
  { inputs: [], name: 'usdtToken', outputs: [{ name: '', type: 'address' }], stateMutability: 'view', type: 'function' },
  { inputs: [{ name: '_usdtToken', type: 'address' }], name: 'setUsdtToken', outputs: [], stateMutability: 'nonpayable', type: 'function' },
] as const

export const USDT_ABI = [
  { inputs: [{ name: 'spender', type: 'address' }, { name: 'amount', type: 'uint256' }], name: 'approve', outputs: [{ name: '', type: 'bool' }], stateMutability: 'nonpayable', type: 'function' },
  { inputs: [{ name: 'account', type: 'address' }], name: 'balanceOf', outputs: [{ name: '', type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'decimals', outputs: [{ name: '', type: 'uint8' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'symbol', outputs: [{ name: '', type: 'string' }], stateMutability: 'view', type: 'function' },
  { inputs: [{ name: 'to', type: 'address' }, { name: 'amount', type: 'uint256' }], name: 'transfer', outputs: [{ name: '', type: 'bool' }], stateMutability: 'nonpayable', type: 'function' },
  { inputs: [{ name: 'from', type: 'address' }, { name: 'to', type: 'address' }, { name: 'amount', type: 'uint256' }], name: 'transferFrom', outputs: [{ name: '', type: 'bool' }], stateMutability: 'nonpayable', type: 'function' },
] as const
