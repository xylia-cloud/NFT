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
  // 本地测试链（通过 ngrok 暴露到公网）
  // NOTE: 为了让 MetaMask 的 Gas 币种显示为 XPL，这里覆盖 nativeCurrency
  chains: [
    {
      ...hardhat,
      name: 'Hardhat Local',
      nativeCurrency: { name: 'XPL', symbol: 'XPL', decimals: 18 },
      rpcUrls: {
        ...hardhat.rpcUrls,
        default: { http: ['https://hamza-quartermasterlike-kamron.ngrok-free.dev'] },
        public: { http: ['https://hamza-quartermasterlike-kamron.ngrok-free.dev'] },
      },
    },
  ],
  transports: {
    [hardhat.id]: http('https://hamza-quartermasterlike-kamron.ngrok-free.dev'),
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

// PaymentChannel 合约地址（充值和提现合约）
export const CONTRACT_ADDRESS = '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0' as `0x${string}`
export const paymentChannelAddress = CONTRACT_ADDRESS; // 别名，保持兼容

// USDT 合约地址 (本地 Mock USDT)
export const USDT_ADDRESS = '0x5FbDB2315678afecb367f032d93F642f64180aa3' as `0x${string}`

// XPL Token 合约地址 (本地 Mock XPL)
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
