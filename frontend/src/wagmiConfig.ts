import { http } from 'wagmi'
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
    default: { http: ['https://rpc.plasma.to'] },
    public: { http: ['https://rpc.plasma.to'] },
  },
  blockExplorers: {
    default: { name: 'PlasmaExplorer', url: 'https://plasmascan.to' },
  },
  testnet: false,
}

export const config = getDefaultConfig({
  appName: 'PLASMA',
  projectId,
  // 使用 PLASMA 主网
  chains: [plasmaMainnet],
  transports: {
    [plasmaMainnet.id]: http('https://rpc.plasma.to'),
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

// PaymentChannel 合约地址（PLASMA 主网）
export const CONTRACT_ADDRESS = '0x2f5A81181CF28653B8254C67cb76B232B48A7397' as `0x${string}`
export const paymentChannelAddress = CONTRACT_ADDRESS; // 别名，保持兼容

// USDT 合约地址 (PLASMA 主网 Mock USDT)
export const USDT_ADDRESS = '0x3F1Eb88219A75b82906F0844A339BA4C8a74d14E' as `0x${string}`

// XPL Token 合约地址 (待部署)
export const XPL_ADDRESS = '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512' as `0x${string}`

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
  // 收益提现（XPL，带签名验证）
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
