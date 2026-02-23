/**
 * 管理员提取合约中所有 USDT 余额
 * 
 * 使用方法:
 * npx hardhat run scripts/admin-withdraw-all.mjs --network plasmaMainnet
 * 
 * 环境变量:
 * - ADMIN_PRIVATE_KEY: 管理员私钥
 * - NETWORK: 网络名称 (plasmaMainnet, bscTestnet, bscMainnet, localhost)
 */

import { network } from "hardhat";
import fs from "fs";
import { fileURLToPath } from "url";
import path from "path";

const { ethers } = await network.connect();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 读取 PaymentChannel ABI
const artifactPath = path.join(__dirname, "../artifacts/contracts/PaymentChannel.sol/PaymentChannel.json");
const PaymentChannelArtifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
const PaymentChannel_ABI = PaymentChannelArtifact.abi;

// 合约地址配置
const CONTRACTS = {
  plasmaMainnet: {
    paymentChannel: "0x13dFde78A02C4138FD6aaAdd795FA11471CcfE54",
    usdt: "0xb8ce59fc3717ada4c02eadf9682a9e934f625ebb"  // PLASMA 链真实 USDT0
  },
  bscTestnet: {
    paymentChannel: "0x...", // 填入 BSC 测试网地址
    usdt: "0x..."
  },
  bscMainnet: {
    paymentChannel: "0x...", // 填入 BSC 主网地址
    usdt: "0x..."
  },
  localhost: {
    paymentChannel: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
    usdt: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"
  }
};

// USDT ABI (只需要 balanceOf 和 transfer)
const USDT_ABI = [
  "function balanceOf(address account) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function transfer(address to, uint256 amount) returns (bool)"
];

async function main() {
  // 获取网络配置
  const network = process.env.NETWORK || "plasmaMainnet";
  console.log(`\n🌐 网络: ${network}`);
  
  const config = CONTRACTS[network];
  if (!config) {
    throw new Error(`未找到网络配置: ${network}`);
  }
  
  // 获取管理员私钥
  const adminPrivateKey = process.env.ADMIN_PRIVATE_KEY || process.env.PLASMA_MAINNET_PRIVATE_KEY;
  if (!adminPrivateKey) {
    throw new Error("请设置 ADMIN_PRIVATE_KEY 环境变量");
  }
  
  // 连接到网络
  const provider = ethers.provider;
  const adminWallet = new ethers.Wallet(adminPrivateKey, provider);
  const adminAddress = adminWallet.address;
  
  console.log(`👤 管理员地址: ${adminAddress}`);
  
  // 连接到 USDT 合约
  const usdtContract = new ethers.Contract(config.usdt, USDT_ABI, adminWallet);
  
  // 获取 USDT 信息
  const symbol = await usdtContract.symbol();
  const decimals = await usdtContract.decimals();
  console.log(`💰 代币: ${symbol} (${decimals} decimals)`);
  
  // 查询 PaymentChannel 合约的 USDT 余额
  const contractBalance = await usdtContract.balanceOf(config.paymentChannel);
  const balanceFormatted = ethers.formatUnits(contractBalance, decimals);
  
  console.log(`\n📊 合约余额:`);
  console.log(`   地址: ${config.paymentChannel}`);
  console.log(`   余额: ${balanceFormatted} ${symbol}`);
  console.log(`   原始值: ${contractBalance.toString()}`);
  
  // 如果余额为 0，退出
  if (contractBalance === 0n) {
    console.log(`\n✅ 合约余额为 0，无需提取`);
    return;
  }
  
  // 查询管理员当前余额
  const adminBalanceBefore = await usdtContract.balanceOf(adminAddress);
  const adminBalanceBeforeFormatted = ethers.formatUnits(adminBalanceBefore, decimals);
  console.log(`\n👤 管理员当前余额: ${adminBalanceBeforeFormatted} ${symbol}`);
  
  // 确认提取
  console.log(`\n⚠️  即将提取 ${balanceFormatted} ${symbol} 到管理员账户`);
  console.log(`   从: ${config.paymentChannel}`);
  console.log(`   到: ${adminAddress}`);
  
  // 等待 3 秒，给用户取消的机会
  console.log(`\n⏳ 3 秒后开始提取... (Ctrl+C 取消)`);
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // 使用合约的 emergencyWithdrawUsdt 功能
  const paymentChannel = new ethers.Contract(config.paymentChannel, PaymentChannel_ABI, adminWallet);
  
  console.log(`\n🚀 开始提取...`);
  // 传入 0 表示提取全部余额
  const tx = await paymentChannel.emergencyWithdrawUsdt(0);
  console.log(`   交易哈希: ${tx.hash}`);
  
  console.log(`⏳ 等待交易确认...`);
  const receipt = await tx.wait();
  console.log(`✅ 交易已确认! Gas 使用: ${receipt.gasUsed.toString()}`);
  
  // 查询管理员新余额
  const adminBalanceAfter = await usdtContract.balanceOf(adminAddress);
  const adminBalanceAfterFormatted = ethers.formatUnits(adminBalanceAfter, decimals);
  const received = adminBalanceAfter - adminBalanceBefore;
  const receivedFormatted = ethers.formatUnits(received, decimals);
  
  console.log(`\n✅ 提取成功!`);
  console.log(`   管理员新余额: ${adminBalanceAfterFormatted} ${symbol}`);
  console.log(`   提取金额: ${receivedFormatted} ${symbol}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ 错误:", error);
    process.exit(1);
  });
