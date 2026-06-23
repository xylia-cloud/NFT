import 'dotenv/config';
import "@nomicfoundation/hardhat-toolbox-mocha-ethers";

// 固定的助记词，确保每次重启后账户和合约地址不变
const FIXED_MNEMONIC = "test test test test test test test test test test test junk";

const config = {
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {
      type: "edr-simulated" as const,
      chainType: "l1" as const,
      accounts: {
        mnemonic: FIXED_MNEMONIC,
        path: "m/44'/60'/0'/0",
        initialIndex: 0,
        count: 20,
      },
    },
    bscTestnet: {
      type: "http" as const,
      chainType: "l1" as const,
      url: process.env.BSC_TESTNET_RPC_URL || "https://data-seed-prebsc-1-s1.binance.org:8545",
      accounts: process.env.BSC_TESTNET_PRIVATE_KEY ? [process.env.BSC_TESTNET_PRIVATE_KEY] : [],
    },
    plasmaMainnet: {
      type: "http" as const,
      chainType: "l1" as const,
      url: process.env.PLASMA_MAINNET_RPC_URL || "https://lb.drpc.org/ogrpc?network=plasma&dkey=AuS7VtXAMEbYsrJ8OzeHL7gpVtT7ELUR8by2-uF7NYYO",
      accounts: process.env.PLASMA_MAINNET_PRIVATE_KEY ? [process.env.PLASMA_MAINNET_PRIVATE_KEY] : [],
      chainId: 9745,
    },
    localhost: {
      type: "http" as const,
      chainType: "l1" as const,
      url: "http://127.0.0.1:8546",
      accounts: {
        mnemonic: FIXED_MNEMONIC,
        path: "m/44'/60'/0'/0",
        initialIndex: 0,
        count: 20,
      },
    },
  },
};

export default config;
