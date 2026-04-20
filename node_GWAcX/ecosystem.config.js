/**
 * PM2 配置文件
 * 用于生产环境部署
 */

module.exports = {
  apps: [{
    name: 'signature-verify',
    script: './signature-verify.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '200M',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      HOST: '127.0.0.1',
      OWNER_PRIVATE_KEY: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',       // 合约 owner 私钥，部署时配置
      CONTRACT_ADDRESS: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',         // PaymentChannel 合约地址
      CHAIN_ID: '31337',                // BSC mainnet=56, testnet=97, hardhat=31337
      USDT_DECIMALS: '6'             // USDT token decimals
    },
    error_file: './logs/error.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    min_uptime: '10s',
    max_restarts: 10,
    restart_delay: 4000
  }]
};
