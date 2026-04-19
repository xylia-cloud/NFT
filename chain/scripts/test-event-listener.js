/**
 * 测试事件监听脚本
 * 用于验证 PaymentChannel 合约的事件是否能被正确监听
 */

import { ethers } from 'ethers';

// 配置
const RPC_URL = 'http://127.0.0.1:8546';
const CONTRACT_ADDRESS = '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0';

// ABI
const ABI = [
  'event USDTDeposited(address indexed user, uint256 amount, string orderId)',
  'event Withdrawn(address indexed user, uint256 amount, string orderId, uint256 nonce)',
  'event XplWithdrawn(address indexed user, uint256 amount, string orderId, uint256 nonce)'
];

async function main() {
  console.log('='.repeat(60));
  console.log('PaymentChannel 事件监听测试');
  console.log('='.repeat(60));
  console.log();
  
  // 连接到节点
  console.log('📡 连接到 RPC 节点...');
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  
  try {
    const network = await provider.getNetwork();
    console.log('✅ 连接成功');
    console.log(`   Chain ID: ${network.chainId}`);
    console.log(`   RPC URL: ${RPC_URL}`);
    console.log();
  } catch (error) {
    console.error('❌ 连接失败:', error.message);
    console.log();
    console.log('请确保 Hardhat 节点正在运行：');
    console.log('   cd chain && npm run node');
    process.exit(1);
  }
  
  // 获取当前区块号
  const currentBlock = await provider.getBlockNumber();
  console.log(`📦 当前区块号: ${currentBlock}`);
  console.log();
  
  // 创建合约实例
  console.log('📄 合约地址:', CONTRACT_ADDRESS);
  const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);
  console.log();
  
  // 查询历史事件（最近100个区块）
  const fromBlock = Math.max(0, currentBlock - 100);
  console.log(`🔍 查询历史事件 (区块 ${fromBlock} - ${currentBlock})...`);
  console.log();
  
  // 查询充值事件
  try {
    const depositFilter = contract.filters.USDTDeposited();
    const depositEvents = await contract.queryFilter(depositFilter, fromBlock, currentBlock);
    
    console.log(`💰 USDTDeposited 事件: ${depositEvents.length} 条`);
    if (depositEvents.length > 0) {
      console.log('-'.repeat(60));
      depositEvents.forEach((event, index) => {
        console.log(`事件 #${index + 1}:`);
        console.log(`   用户: ${event.args.user}`);
        console.log(`   金额: ${ethers.formatUnits(event.args.amount, 6)} USDT0`);
        console.log(`   订单ID: ${event.args.orderId}`);
        console.log(`   Nonce: ${event.args.nonce}`);
        console.log(`   区块: ${event.blockNumber}`);
        console.log(`   交易哈希: ${event.transactionHash}`);
        console.log();
      });
    }
  } catch (error) {
    console.error('❌ 查询充值事件失败:', error.message);
  }
  
  // 查询提现事件
  try {
    const withdrawFilter = contract.filters.Withdrawn();
    const withdrawEvents = await contract.queryFilter(withdrawFilter, fromBlock, currentBlock);
    
    console.log(`💸 Withdrawn 事件: ${withdrawEvents.length} 条`);
    if (withdrawEvents.length > 0) {
      console.log('-'.repeat(60));
      withdrawEvents.forEach((event, index) => {
        console.log(`事件 #${index + 1}:`);
        console.log(`   用户: ${event.args.user}`);
        console.log(`   金额: ${ethers.formatUnits(event.args.amount, 6)} USDT0`);
        console.log(`   订单ID: ${event.args.orderId}`);
        console.log(`   区块: ${event.blockNumber}`);
        console.log(`   交易哈希: ${event.transactionHash}`);
        console.log();
      });
    }
  } catch (error) {
    console.error('❌ 查询提现事件失败:', error.message);
  }
  
  // 查询 XPL 提现事件
  try {
    const xplWithdrawFilter = contract.filters.XplWithdrawn();
    const xplWithdrawEvents = await contract.queryFilter(xplWithdrawFilter, fromBlock, currentBlock);
    
    console.log(`🎁 XplWithdrawn 事件: ${xplWithdrawEvents.length} 条`);
    if (xplWithdrawEvents.length > 0) {
      console.log('-'.repeat(60));
      xplWithdrawEvents.forEach((event, index) => {
        console.log(`事件 #${index + 1}:`);
        console.log(`   用户: ${event.args.user}`);
        console.log(`   XPL 金额: ${ethers.formatEther(event.args.amount)} XPL`);
        console.log(`   订单ID: ${event.args.orderId}`);
        console.log(`   Nonce: ${event.args.nonce}`);
        console.log(`   区块: ${event.blockNumber}`);
        console.log(`   交易哈希: ${event.transactionHash}`);
        console.log();
      });
    }
  } catch (error) {
    console.error('❌ 查询 XPL 提现事件失败:', error.message);
  }
  
  console.log('='.repeat(60));
  console.log('📊 测试完成');
  console.log('='.repeat(60));
  console.log();
  
  // 开始实时监听
  console.log('👂 开始实时监听新事件...');
  console.log('   (按 Ctrl+C 停止)');
  console.log();
  
  contract.on('USDTDeposited', (user, amount, orderId, event) => {
    console.log('🔔 新充值事件:');
    console.log(`   用户: ${user}`);
    console.log(`   金额: ${ethers.formatUnits(amount, 6)} USDT0`);
    console.log(`   订单ID: ${orderId}`);
    console.log(`   区块: ${event.log.blockNumber}`);
    console.log(`   交易哈希: ${event.log.transactionHash}`);
    console.log();
  });
  
  contract.on('Withdrawn', (user, amount, orderId, nonce, event) => {
    console.log('🔔 新提现事件:');
    console.log(`   用户: ${user}`);
    console.log(`   金额: ${ethers.formatUnits(amount, 6)} USDT0`);
    console.log(`   订单ID: ${orderId}`);
    console.log(`   Nonce: ${nonce}`);
    console.log(`   区块: ${event.log.blockNumber}`);
    console.log(`   交易哈希: ${event.log.transactionHash}`);
    console.log();
  });
  
  contract.on('XplWithdrawn', (user, amount, orderId, nonce, event) => {
    console.log('🔔 新 XPL 提现事件:');
    console.log(`   用户: ${user}`);
    console.log(`   XPL 金额: ${ethers.formatEther(amount)} XPL`);
    console.log(`   订单ID: ${orderId}`);
    console.log(`   Nonce: ${nonce}`);
    console.log(`   区块: ${event.log.blockNumber}`);
    console.log(`   交易哈希: ${event.log.transactionHash}`);
    console.log();
  });
}

main().catch((error) => {
  console.error('❌ 脚本执行失败:', error);
  process.exit(1);
});
