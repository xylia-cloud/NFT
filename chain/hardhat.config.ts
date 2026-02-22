import 'dotenv/config';
import hardhatToolboxMochaEthersPlugin from "@nomicfoundation/hardhat-toolbox-mocha-ethers";
import { configVariable, defineConfig } from "hardhat/config";

// 固定的助记词，确保每次重启后账户和合约地址不变
const FIXED_MNEMONIC = "test test test test test test test test test test test junk";

export default defineConfig({
  plugins: [hardhatToolboxMochaEthersPlugin],
  solidity: {
    profiles: {
      default: {
        version: "0.8.28",
      },
      production: {
        version: "0.8.28",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    },
  },
  networks: {
    hardhatMainnet: {
      type: "edr-simulated",
      chainType: "l1",
      accounts: {
        mnemonic: FIXED_MNEMONIC,
        path: "m/44'/60'/0'/0",
        initialIndex: 0,
        count: 20,
      },
    },
    hardhatOp: {
      type: "edr-simulated",
      chainType: "op",
      accounts: {
        mnemonic: FIXED_MNEMONIC,
        path: "m/44'/60'/0'/0",
        initialIndex: 0,
        count: 20,
      },
    },
    bscTestnet: {
      type: "http",
      chainType: "l1",
      url: process.env.BSC_TESTNET_RPC_URL || "https://data-seed-prebsc-1-s1.binance.org:8545",
      accounts: process.env.BSC_TESTNET_PRIVATE_KEY ? [process.env.BSC_TESTNET_PRIVATE_KEY] : [],
    },
    plasmaMainnet: {
      type: "http",
      chainType: "l1",
      url: process.env.PLASMA_MAINNET_RPC_URL || "https://rpc.plasma.to",
      accounts: process.env.PLASMA_MAINNET_PRIVATE_KEY ? [process.env.PLASMA_MAINNET_PRIVATE_KEY] : [],
      chainId: 9745, // PLASMA 主网 Chain ID
    },
    localhost: {
      type: "http",
      chainType: "l1",
      url: "http://127.0.0.1:8546",
      accounts: {
        mnemonic: FIXED_MNEMONIC,
        path: "m/44'/60'/0'/0",
        initialIndex: 0,
        count: 20,
      },
      mining: {
        auto: true,
        interval: 0
      }
    },
  },
});
