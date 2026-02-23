/**
 * 查询 XPL 代币余额
 * 
 * 使用方法:
 * npx hardhat run scripts/check-xpl-balance.mjs --network plasmaMainnet
 */

import { network } from "hardhat";
const { ethers } = await network.connect();

// 合约地址配置
const CONTRACTS = {
  paymentChannel: "0x13dFde78A02C4138FD6aaAdd795FA11471CcfE54",
  xpl: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"  // 请替换为实际的 XPL 代币地址
};

// 管理员地址
const ADMIN_ADDRESS = "0xA4a7747C9241ba5A9AF9137bb662f38F463Fdf1B";

// ERC20 ABI
const ERC20_ABI = [
  "function balanceOf(address account) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function totalSupply() view returns (uint256)"
];

async function main() {
  console.log("\n🔍 查询 XPL 余额信息\n");
  
  const provider = ethers.provider;
  
  // 连接到 XPL 代币合约
  const xplContract = new ethers.Contract(CONTRACTS.xpl, ERC20_ABI, provider);
  
  // 获取代币信息
  const symbol = await xplContract.symbol();
  const decimals = await xplContract.decimals();
  const totalSupply = await xplContract.totalSupply();
  
  console.log(`💎 代币信息:`);
  console.log(`   符号: ${symbol}`);
  console.log(`   精度: ${decimals}`);
  console.log(`   总供应量: ${ethers.formatUnits(totalSupply, decimals)} ${symbol}`);
  
  // 查询管理员余额
  const adminBalance = await xplContract.balanceOf(ADMIN_ADDRESS);
  console.log(`\n👤 管理员余额:`);
  console.log(`   地址: ${ADMIN_ADDRESS}`);
  console.log(`   余额: ${ethers.formatUnits(adminBalance, decimals)} ${symbol}`);
  console.log(`   原始值: ${adminBalance.toString()}`);
  
  // 查询合约余额
  const contractBalance = await xplContract.balanceOf(CONTRACTS.paymentChannel);
  console.log(`\n📄 合约余额:`);
  console.log(`   地址: ${CONTRACTS.paymentChannel}`);
  console.log(`   余额: ${ethers.formatUnits(contractBalance, decimals)} ${symbol}`);
  console.log(`   原始值: ${contractBalance.toString()}`);
  
  // 查询网络信息
  const networkInfo = await provider.getNetwork();
  console.log(`\n🌐 网络信息:`);
  console.log(`   Chain ID: ${networkInfo.chainId}`);
  console.log(`   名称: ${networkInfo.name}`);
  
  console.log(`\n🔗 在区块浏览器查看:`);
  console.log(`   XPL 代币: https://plasmascan.to/token/${CONTRACTS.xpl}`);
  console.log(`   合约地址: https://plasmascan.to/address/${CONTRACTS.paymentChannel}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ 错误:", error);
    process.exit(1);
  });
