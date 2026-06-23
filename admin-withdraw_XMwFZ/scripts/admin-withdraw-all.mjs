/**
 * 管理员提取合约资产（USDT / XPL / Native）
 * 
 * 使用方法:
 * npx hardhat run scripts/admin-withdraw-all.mjs --network plasmaMainnet
 * 
 * 环境变量:
 * - ADMIN_PRIVATE_KEY: 管理员私钥
 * - NETWORK: 网络名称 (plasmaMainnet, bscTestnet, bscMainnet, localhost)
 * - ASSET: 提取资产 (usdt | xpl | native | all)，默认 usdt
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
    paymentChannel: "0xf4dAC0648D90b9F2D108e43aCf1526AfA71aC403",
    usdt: "0xb8ce59fc3717ada4c02eadf9682a9e934f625ebb", // PLASMA 链真实 USDT0
    xpl: "0x6100e367285b01f48d07953803a2d8dca5d19873"   // PLASMA 链 WXPL
  },
  bscTestnet: {
    paymentChannel: "0x...", // 填入 BSC 测试网地址
    usdt: "0x...",
    xpl: "0x..."
  },
  bscMainnet: {
    paymentChannel: "0x...", // 填入 BSC 主网地址
    usdt: "0x...",
    xpl: "0x..."
  },
  localhost: {
    paymentChannel: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
    usdt: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
    xpl: "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0"
  }
};

// ERC20 ABI (只需要 balanceOf / decimals / symbol)
const ERC20_ABI = [
  "function balanceOf(address account) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)"
];

async function withdrawToken({
  paymentChannel,
  tokenAddress,
  label,
  withdrawFnName,
  adminAddress,
  adminWallet
}) {
  if (!tokenAddress || tokenAddress === "0x...") {
    console.log(`\n⚠️  ${label} 地址未配置，跳过`);
    return;
  }

  const token = new ethers.Contract(tokenAddress, ERC20_ABI, adminWallet);
  const symbol = await token.symbol();
  const decimals = await token.decimals();
  const contractBalance = await token.balanceOf(await paymentChannel.getAddress());
  const contractBalanceFmt = ethers.formatUnits(contractBalance, decimals);

  console.log(`\n📊 ${label} 合约余额:`);
  console.log(`   Token: ${symbol} (${decimals} decimals)`);
  console.log(`   地址: ${tokenAddress}`);
  console.log(`   余额: ${contractBalanceFmt} ${symbol}`);
  console.log(`   原始值: ${contractBalance.toString()}`);

  if (contractBalance === 0n) {
    console.log(`✅ ${label} 余额为 0，无需提取`);
    return;
  }

  const adminBefore = await token.balanceOf(adminAddress);
  console.log(`👤 管理员当前 ${symbol} 余额: ${ethers.formatUnits(adminBefore, decimals)} ${symbol}`);

  console.log(`\n⚠️  即将提取 ${contractBalanceFmt} ${symbol} 到管理员账户`);
  console.log(`   从: ${await paymentChannel.getAddress()}`);
  console.log(`   到: ${adminAddress}`);

  const tx = await paymentChannel[withdrawFnName](0);
  console.log(`🚀 ${label} 提取交易: ${tx.hash}`);
  const receipt = await tx.wait();
  console.log(`✅ 交易已确认! Gas 使用: ${receipt.gasUsed.toString()}`);

  const adminAfter = await token.balanceOf(adminAddress);
  const received = adminAfter - adminBefore;
  console.log(`✅ ${label} 提取完成: +${ethers.formatUnits(received, decimals)} ${symbol}`);
}

async function withdrawNative({ paymentChannel, adminAddress, adminWallet }) {
  const contractAddress = await paymentChannel.getAddress();
  const contractBalance = await ethers.provider.getBalance(contractAddress);
  const contractBalanceFmt = ethers.formatEther(contractBalance);

  console.log(`\n📊 Native 合约余额:`);
  console.log(`   地址: ${contractAddress}`);
  console.log(`   余额: ${contractBalanceFmt}`);
  console.log(`   原始值: ${contractBalance.toString()}`);

  if (contractBalance === 0n) {
    console.log("✅ Native 余额为 0，无需提取");
    return;
  }

  const adminBefore = await ethers.provider.getBalance(adminAddress);
  const tx = await paymentChannel.emergencyWithdrawNative();
  console.log(`🚀 Native 提取交易: ${tx.hash}`);
  const receipt = await tx.wait();
  console.log(`✅ 交易已确认! Gas 使用: ${receipt.gasUsed.toString()}`);
  const adminAfter = await ethers.provider.getBalance(adminAddress);
  console.log(`✅ Native 提取完成: +${ethers.formatEther(adminAfter - adminBefore)}`);
}

async function main() {
  // 获取网络配置
  const selectedNetwork = process.env.NETWORK || "plasmaMainnet";
  const selectedAsset = (process.env.ASSET || "usdt").toLowerCase();
  console.log(`\n🌐 网络: ${selectedNetwork}`);
  console.log(`💼 资产类型: ${selectedAsset}`);
  
  const config = CONTRACTS[selectedNetwork];
  if (!config) {
    throw new Error(`未找到网络配置: ${selectedNetwork}`);
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

  const paymentChannel = new ethers.Contract(config.paymentChannel, PaymentChannel_ABI, adminWallet);
  const owner = await paymentChannel.owner();
  if (owner.toLowerCase() !== adminAddress.toLowerCase()) {
    throw new Error(`当前私钥地址不是合约 owner。owner=${owner}, current=${adminAddress}`);
  }

  if (!["usdt", "xpl", "native", "all"].includes(selectedAsset)) {
    throw new Error(`无效 ASSET: ${selectedAsset}，可选 usdt/xpl/native/all`);
  }

  console.log(`\n⚠️  即将提取合约资产到管理员账户 ${adminAddress}`);
  console.log(`   PaymentChannel: ${config.paymentChannel}`);
  console.log(`\n⏳ 3 秒后开始执行... (Ctrl+C 取消)`);
  await new Promise(resolve => setTimeout(resolve, 3000));

  if (selectedAsset === "usdt" || selectedAsset === "all") {
    await withdrawToken({
      paymentChannel,
      tokenAddress: config.usdt,
      label: "USDT",
      withdrawFnName: "emergencyWithdrawUsdt",
      adminAddress,
      adminWallet
    });
  }

  if (selectedAsset === "xpl" || selectedAsset === "all") {
    await withdrawToken({
      paymentChannel,
      tokenAddress: config.xpl,
      label: "XPL/WXPL",
      withdrawFnName: "emergencyWithdrawXpl",
      adminAddress,
      adminWallet
    });
  }

  if (selectedAsset === "native" || selectedAsset === "all") {
    await withdrawNative({ paymentChannel, adminAddress, adminWallet });
  }

  console.log("\n✅ 全部操作完成");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ 错误:", error);
    process.exit(1);
  });
