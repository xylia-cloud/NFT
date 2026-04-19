/**
 * 查询 WXPL 代币余额
 */

import { network } from "hardhat";
const { ethers } = await network.connect();

const CONTRACTS = {
  paymentChannel: "0xf4dAC0648D90b9F2D108e43aCf1526AfA71aC403",
  wxpl: "0x6100e367285b01f48d07953803a2d8dca5d19873"
};

const ADMIN_ADDRESS = "0xA4a7747C9241ba5A9AF9137bb662f38F463Fdf1B";

const ERC20_ABI = [
  "function balanceOf(address account) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)"
];

async function main() {
  console.log("\n🔍 查询 WXPL 余额\n");
  
  const provider = ethers.provider;
  const wxplContract = new ethers.Contract(CONTRACTS.wxpl, ERC20_ABI, provider);
  
  const symbol = await wxplContract.symbol();
  const decimals = await wxplContract.decimals();
  
  console.log(`💎 代币: ${symbol} (${decimals} decimals)`);
  
  const adminBalance = await wxplContract.balanceOf(ADMIN_ADDRESS);
  console.log(`\n👤 管理员余额:`);
  console.log(`   地址: ${ADMIN_ADDRESS}`);
  console.log(`   余额: ${ethers.formatUnits(adminBalance, decimals)} ${symbol}`);
  
  const contractBalance = await wxplContract.balanceOf(CONTRACTS.paymentChannel);
  console.log(`\n📄 合约余额:`);
  console.log(`   地址: ${CONTRACTS.paymentChannel}`);
  console.log(`   余额: ${ethers.formatUnits(contractBalance, decimals)} ${symbol}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ 错误:", error);
    process.exit(1);
  });
