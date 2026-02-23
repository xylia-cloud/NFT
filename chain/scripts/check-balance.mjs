/**
 * 查询地址余额
 */

import { network } from "hardhat";
const { ethers } = await network.connect();

const USDT_ADDRESS = "0xb8ce59fc3717ada4c02eadf9682a9e934f625ebb";  // PLASMA 链真实 USDT0
const ADMIN_ADDRESS = "0xA4a7747C9241ba5A9AF9137bb662f38F463Fdf1B";
const CONTRACT_ADDRESS = "0x13dFde78A02C4138FD6aaAdd795FA11471CcfE54";

const USDT_ABI = [
  "function balanceOf(address account) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function totalSupply() view returns (uint256)"
];

async function main() {
  console.log("\n🔍 查询余额信息\n");
  
  const usdt = await ethers.getContractAt(USDT_ABI, USDT_ADDRESS);
  
  // 获取代币信息
  const symbol = await usdt.symbol();
  const decimals = await usdt.decimals();
  const totalSupply = await usdt.totalSupply();
  
  console.log(`💰 代币信息:`);
  console.log(`   符号: ${symbol}`);
  console.log(`   精度: ${decimals}`);
  console.log(`   总供应量: ${ethers.formatUnits(totalSupply, decimals)} ${symbol}`);
  
  // 查询管理员余额
  const adminBalance = await usdt.balanceOf(ADMIN_ADDRESS);
  console.log(`\n👤 管理员余额:`);
  console.log(`   地址: ${ADMIN_ADDRESS}`);
  console.log(`   余额: ${ethers.formatUnits(adminBalance, decimals)} ${symbol}`);
  console.log(`   原始值: ${adminBalance.toString()}`);
  
  // 查询合约余额
  const contractBalance = await usdt.balanceOf(CONTRACT_ADDRESS);
  console.log(`\n📄 合约余额:`);
  console.log(`   地址: ${CONTRACT_ADDRESS}`);
  console.log(`   余额: ${ethers.formatUnits(contractBalance, decimals)} ${symbol}`);
  console.log(`   原始值: ${contractBalance.toString()}`);
  
  // 查询网络信息
  const network = await ethers.provider.getNetwork();
  console.log(`\n🌐 网络信息:`);
  console.log(`   Chain ID: ${network.chainId}`);
  console.log(`   名称: ${network.name}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ 错误:", error);
    process.exit(1);
  });
