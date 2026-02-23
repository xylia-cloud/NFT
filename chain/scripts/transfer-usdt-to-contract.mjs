/**
 * 从管理员账户转 USDT0 到 PaymentChannel 合约
 * 用于测试提取功能
 */

import { network } from "hardhat";
const { ethers } = await network.connect();

const USDT_ADDRESS = "0xb8ce59fc3717ada4c02eadf9682a9e934f625ebb";
const CONTRACT_ADDRESS = "0x13dFde78A02C4138FD6aaAdd795FA11471CcfE54";
const AMOUNT = "1"; // 1 USDT0

const USDT_ABI = [
  "function balanceOf(address account) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function transfer(address to, uint256 amount) returns (bool)"
];

async function main() {
  console.log("\n💸 从管理员账户转 USDT0 到合约\n");
  
  // 获取管理员账户
  const [admin] = await ethers.getSigners();
  console.log("👤 管理员地址:", admin.address);
  
  // 连接到 USDT 合约
  const usdt = await ethers.getContractAt(USDT_ABI, USDT_ADDRESS);
  
  // 获取代币信息
  const symbol = await usdt.symbol();
  const decimals = await usdt.decimals();
  
  // 查询管理员余额
  const adminBalance = await usdt.balanceOf(admin.address);
  const adminBalanceFormatted = ethers.formatUnits(adminBalance, decimals);
  console.log(`💰 管理员余额: ${adminBalanceFormatted} ${symbol}`);
  
  // 计算转账金额
  const transferAmount = ethers.parseUnits(AMOUNT, decimals);
  console.log(`📤 转账金额: ${AMOUNT} ${symbol}`);
  
  // 检查余额是否足够
  if (adminBalance < transferAmount) {
    throw new Error(`余额不足！需要 ${AMOUNT} ${symbol}，但只有 ${adminBalanceFormatted} ${symbol}`);
  }
  
  // 查询合约当前余额
  const contractBalanceBefore = await usdt.balanceOf(CONTRACT_ADDRESS);
  const contractBalanceBeforeFormatted = ethers.formatUnits(contractBalanceBefore, decimals);
  console.log(`\n📊 转账前合约余额: ${contractBalanceBeforeFormatted} ${symbol}`);
  
  // 执行转账
  console.log(`\n🚀 开始转账...`);
  console.log(`   从: ${admin.address}`);
  console.log(`   到: ${CONTRACT_ADDRESS}`);
  console.log(`   金额: ${AMOUNT} ${symbol}`);
  
  const tx = await usdt.transfer(CONTRACT_ADDRESS, transferAmount);
  console.log(`   交易哈希: ${tx.hash}`);
  
  console.log(`⏳ 等待交易确认...`);
  const receipt = await tx.wait();
  console.log(`✅ 交易已确认! Gas 使用: ${receipt.gasUsed.toString()}`);
  
  // 查询转账后的余额
  console.log(`\n📊 转账后余额:`);
  
  const adminBalanceAfter = await usdt.balanceOf(admin.address);
  const adminBalanceAfterFormatted = ethers.formatUnits(adminBalanceAfter, decimals);
  console.log(`   管理员余额: ${adminBalanceAfterFormatted} ${symbol}`);
  
  const contractBalanceAfter = await usdt.balanceOf(CONTRACT_ADDRESS);
  const contractBalanceAfterFormatted = ethers.formatUnits(contractBalanceAfter, decimals);
  console.log(`   合约余额: ${contractBalanceAfterFormatted} ${symbol}`);
  
  console.log(`\n✅ 转账成功!`);
  console.log(`\n📝 现在可以测试提取脚本:`);
  console.log(`   npx hardhat run scripts/admin-withdraw-all.mjs --network plasmaMainnet`);
  console.log(`\n🔗 查看交易:`);
  console.log(`   https://plasmascan.to/tx/${tx.hash}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ 错误:", error);
    process.exit(1);
  });
