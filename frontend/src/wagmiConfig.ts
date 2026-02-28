import { http, createStorage } from 'wagmi'
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

// PLASMA 主网配置
const plasmaMainnet = {
  id: 9745,
  name: 'PLASMA Mainnet',
  nativeCurrency: { name: 'XPL', symbol: 'XPL', decimals: 18 },
  rpcUrls: {
    default: { 
      http: ['https://lb.drpc.org/ogrpc?network=plasma&dkey=AuS7VtXAMEbYsrJ8OzeHL7gpVtT7ELUR8by2-uF7NYYO'],
      webSocket: ['wss://lb.drpc.live/plasma/AuS7VtXAMEbYsrJ8OzeHL7gpVtT7ELUR8by2-uF7NYYO']
    },
    public: { 
      http: ['https://lb.drpc.org/ogrpc?network=plasma&dkey=AuS7VtXAMEbYsrJ8OzeHL7gpVtT7ELUR8by2-uF7NYYO'],
      webSocket: ['wss://lb.drpc.live/plasma/AuS7VtXAMEbYsrJ8OzeHL7gpVtT7ELUR8by2-uF7NYYO']
    },
  },
  blockExplorers: {
    default: { name: 'PlasmaExplorer', url: 'https://plasmascan.to' },
  },
  testnet: false,
}

// 使用 sessionStorage 替代 localStorage，关闭页面自动清除连接状态
const sessionStorageAdapter = createStorage({
  storage: {
    getItem: (key) => sessionStorage.getItem(key),
    setItem: (key, value) => sessionStorage.setItem(key, value),
    removeItem: (key) => sessionStorage.removeItem(key),
  },
})

export const config = getDefaultConfig({
  appName: 'PLASMA',
  projectId,
  // 使用 PLASMA 主网
  chains: [plasmaMainnet],
  transports: {
    [plasmaMainnet.id]: http('https://lb.drpc.org/ogrpc?network=plasma&dkey=AuS7VtXAMEbYsrJ8OzeHL7gpVtT7ELUR8by2-uF7NYYO'),
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
  storage: sessionStorageAdapter, // 使用 sessionStorage
  // @ts-ignore - initialChainId 是有效的配置项
  initialChainId: 9745, // 强制使用 PLASMA 网络作为初始网络
})

// PaymentChannel 合约地址（PLASMA 主网 - v2 with emergency withdraw）
export const CONTRACT_ADDRESS = '0x13dFde78A02C4138FD6aaAdd795FA11471CcfE54' as `0x${string}`
export const paymentChannelAddress = CONTRACT_ADDRESS; // 别名，保持兼容

// USDT 合约地址 (PLASMA 主网真实 USDT0)
export const USDT_ADDRESS = '0xb8ce59fc3717ada4c02eadf9682a9e934f625ebb' as `0x${string}`

// WXPL Token 合约地址 (Wrapped XPL - 用于收益提现)
export const WXPL_ADDRESS = '0x6100e367285b01f48d07953803a2d8dca5d19873' as `0x${string}`
// 保持向后兼容
export const XPL_ADDRESS = WXPL_ADDRESS

export const CONTRACT_ABI = [
  // Events
  { anonymous: false, inputs: [{ indexed: true, name: 'user', type: 'address' }, { indexed: false, name: 'amount', type: 'uint256' }, { indexed: false, name: 'orderId', type: 'string' }], name: 'Deposited', type: 'event' },
  { anonymous: false, inputs: [{ indexed: true, name: 'user', type: 'address' }, { indexed: false, name: 'amount', type: 'uint256' }, { indexed: false, name: 'orderId', type: 'string' }], name: 'Withdrawn', type: 'event' },
  { anonymous: false, inputs: [{ indexed: true, name: 'user', type: 'address' }, { indexed: false, name: 'amount', type: 'uint256' }, { indexed: false, name: 'orderId', type: 'string' }], name: 'USDTDeposited', type: 'event' },
  { anonymous: false, inputs: [{ indexed: true, name: 'user', type: 'address' }, { indexed: false, name: 'xplAmount', type: 'uint256' }, { indexed: false, name: 'usdtValue', type: 'uint256' }, { indexed: false, name: 'orderId', type: 'string' }], name: 'XplWithdrawn', type: 'event' },
  // Functions
  { inputs: [{ name: 'orderId', type: 'string' }], name: 'deposit', outputs: [], stateMutability: 'payable', type: 'function' },
  { inputs: [{ name: 'amount', type: 'uint256' }, { name: 'orderId', type: 'string' }], name: 'depositUsdt', outputs: [], stateMutability: 'nonpayable', type: 'function' },
  { inputs: [{ name: 'user', type: 'address' }], name: 'getBalance', outputs: [{ name: '', type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [{ name: 'to', type: 'address' }, { name: 'amount', type: 'uint256' }, { name: 'orderId', type: 'string' }], name: 'withdrawTo', outputs: [], stateMutability: 'nonpayable', type: 'function' },
  { inputs: [], name: 'usdtToken', outputs: [{ name: '', type: 'address' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'xplToken', outputs: [{ name: '', type: 'address' }], stateMutability: 'view', type: 'function' },
  { inputs: [{ name: '_usdtToken', type: 'address' }], name: 'setUsdtToken', outputs: [], stateMutability: 'nonpayable', type: 'function' },
  { inputs: [{ name: '_xplToken', type: 'address' }], name: 'setXplToken', outputs: [], stateMutability: 'nonpayable', type: 'function' },
  // 收益提现（WXPL，带签名验证）
  { inputs: [{ name: 'xplAmount', type: 'uint256' }, { name: 'usdtValue', type: 'uint256' }, { name: 'orderId', type: 'string' }, { name: 'nonce', type: 'uint256' }, { name: 'signature', type: 'bytes' }], name: 'withdrawXplWithSignature', outputs: [], stateMutability: 'nonpayable', type: 'function' },
  // 本金提现（USDT，带签名验证）
  { inputs: [{ name: 'amount', type: 'uint256' }, { name: 'orderId', type: 'string' }, { name: 'nonce', type: 'uint256' }, { name: 'signature', type: 'bytes' }], name: 'withdrawWithSignature', outputs: [], stateMutability: 'nonpayable', type: 'function' },
] as const

// PaymentChannel ABI（提现合约）
export const paymentChannelABI = CONTRACT_ABI

export const USDT_ABI = [
  { inputs: [{ name: 'spender', type: 'address' }, { name: 'amount', type: 'uint256' }], name: 'approve', outputs: [{ name: '', type: 'bool' }], stateMutability: 'nonpayable', type: 'function' },
  { inputs: [{ name: 'account', type: 'address' }], name: 'balanceOf', outputs: [{ name: '', type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'decimals', outputs: [{ name: '', type: 'uint8' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'symbol', outputs: [{ name: '', type: 'string' }], stateMutability: 'view', type: 'function' },
  { inputs: [{ name: 'to', type: 'address' }, { name: 'amount', type: 'uint256' }], name: 'transfer', outputs: [{ name: '', type: 'bool' }], stateMutability: 'nonpayable', type: 'function' },
  { inputs: [{ name: 'from', type: 'address' }, { name: 'to', type: 'address' }, { name: 'amount', type: 'uint256' }], name: 'transferFrom', outputs: [{ name: '', type: 'bool' }], stateMutability: 'nonpayable', type: 'function' },
] as const
