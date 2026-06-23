/**
 * 简化版WXPL提取脚本
 */

import hre from "hardhat";
import fs from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 读取 PaymentChannel ABI
const artifactPath = path.join(__dirname, "../artifacts/contracts/PaymentChannel.sol/PaymentChannel.json");
const PaymentChannelArtifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
const PaymentChannel_ABI = PaymentChannelArtifact.abi;

// ERC20 ABI
const ERC20_ABI = [
  "function balanceOf(address account) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)"
];

// PLASMA Mainnet 配置
const PAYMENT_CHANNEL = "0xf4dAC0648D90b9F2D108e43aCf1526AfA71aC403";
const WXPL_ADDRESS = "0x6100e367285b01f48d07953803a2d8dca5d19873";

async function main() {
  console.log("\n🌐 网络: PLASMA Mainnet");
  console.log("💼 资产类型: WXPL");
  
  // 获取管理员私钥
  const adminPrivateKey = process.env.ADMIN_PRIVATE_KEY || process.env.PLASMA_MAINNET_PRIVATE_KEY;
  if (!adminPrivateKey) {
    throw new Error("请设置 ADMIN_PRIVATE_KEY 环境变量");
  }
  
  // 连接到网络
  const provider = hre.ethers.provider;
  const adminWallet = new hre.ethers.Wallet(adminPrivateKey, provider);
  const adminAddress = adminWallet.address;
  
  console.log(`👤 管理员地址: ${adminAddress}`);

  // 连接合约
  const paymentChannel = new hre.ethers.Contract(PAYMENT_CHANNEL, PaymentChannel_ABI, adminWallet);
  const wxpl = new hre.ethers.Contract(WXPL_ADDRESS, ERC20_ABI, adminWallet);
  
  // 验证owner
  const owner = await paymentChannel.owner();
  if (owner.toLowerCase() !== adminAddress.toLowerCase()) {
    throw new Error(`当前私钥地址不是合约 owner。owner=${owner}, current=${adminAddress}`);
  }
  
  // 查询余额
  const symbol = await wxpl.symbol();
  const decimals = await wxpl.decimals();
  const contractBalance = await wxpl.balanceOf(PAYMENT_CHANNEL);
  const contractBalanceFmt = hre.ethers.formatUnits(contractBalance, decimals);
  
  console.log(`\n📊 WXPL 合约余额:`);
  console.log(`   Token: ${symbol} (${decimals} decimals)`);
  console.log(`   地址: ${WXPL_ADDRESS}`);
  console.log(`   余额: ${contractBalanceFmt} ${symbol}`);
  console.log(`   原始值: ${contractBalance.toString()}`);
  
  if (contractBalance === 0n) {
    console.log(`✅ WXPL 余额为 0，无需提取`);
    return;
  }
  
  const adminBefore = await wxpl.balanceOf(adminAddress);
  console.log(`👤 管理员当前 ${symbol} 余额: ${hre.ethers.formatUnits(adminBefore, decimals)} ${symbol}`);
  
  console.log(`\n⚠️  即将提取 ${contractBalanceFmt} ${symbol} 到管理员账户`);
  console.log(`   从: ${PAYMENT_CHANNEL}`);
  console.log(`   到: ${adminAddress}`);
  console.log(`\n⏳ 3 秒后开始执行... (Ctrl+C 取消)`);
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // 执行提取
  console.log(`\n🚀 正在提取...`);
  const tx = await paymentChannel.emergencyWithdrawXpl(0);
  console.log(`📝 交易哈希: ${tx.hash}`);
  console.log(`⏳ 等待确认...`);
  
  const receipt = await tx.wait();
  console.log(`✅ 交易已确认! Gas 使用: ${receipt.gasUsed.toString()}`);
  
  const adminAfter = await wxpl.balanceOf(adminAddress);
  const received = adminAfter - adminBefore;
  console.log(`✅ WXPL 提取完成: +${hre.ethers.formatUnits(received, decimals)} ${symbol}`);
  console.log(`\n🎉 操作成功完成!`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ 错误:", error.message);
    console.error(error);
    process.exit(1);
  });
