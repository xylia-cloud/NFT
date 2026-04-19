/**
 * 从管理员账户转 XPL 代币到 PaymentChannel 合约
 * 用于给用户提供 XPL 收益提现
 * 
 * 使用方法:
 * npx hardhat run scripts/transfer-xpl-to-contract.mjs --network plasmaMainnet
 */

import { network } from "hardhat";
const { ethers } = await network.connect();

// 合约地址配置
const CONTRACTS = {
  paymentChannel: "0xf4dAC0648D90b9F2D108e43aCf1526AfA71aC403",
  xpl: "0x6100e367285b01f48d07953803a2d8dca5d19873"  // PLASMA 链 WXPL 地址
};

// 管理员地址
const ADMIN_ADDRESS = "0xA4a7747C9241ba5A9AF9137bb662f38F463Fdf1B";

// ERC20 ABI
const ERC20_ABI = [
  "function balanceOf(address account) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function approve(address spender, uint256 amount) returns (bool)"
];

async function main() {
  console.log("\n💎 转入 XPL 到 PaymentChannel 合约\n");
  
  // 获取管理员私钥
  const adminPrivateKey = process.env.ADMIN_PRIVATE_KEY || process.env.PLASMA_MAINNET_PRIVATE_KEY;
  if (!adminPrivateKey) {
    throw new Error("请设置 ADMIN_PRIVATE_KEY 环境变量");
  }
  
  // 连接到网络
  const provider = ethers.provider;
  const adminWallet = new ethers.Wallet(adminPrivateKey, provider);
  
  console.log(`👤 管理员地址: ${adminWallet.address}`);
  console.log(`📄 合约地址: ${CONTRACTS.paymentChannel}`);
  console.log(`💎 XPL 代币地址: ${CONTRACTS.xpl}\n`);
  
  // 连接到 XPL 代币合约
  const xplContract = new ethers.Contract(CONTRACTS.xpl, ERC20_ABI, adminWallet);
  
  // 获取 XPL 信息
  const symbol = await xplContract.symbol();
  const decimals = await xplContract.decimals();
  console.log(`💰 代币信息: ${symbol} (${decimals} decimals)`);
  
  // 查询管理员 XPL 余额
  const adminBalance = await xplContract.balanceOf(adminWallet.address);
  const adminBalanceFormatted = ethers.formatUnits(adminBalance, decimals);
  console.log(`\n👤 管理员当前余额: ${adminBalanceFormatted} ${symbol}`);
  console.log(`   原始值: ${adminBalance.toString()}`);
  
  if (adminBalance === 0n) {
    console.log(`\n⚠️  管理员没有 ${symbol}，无法转账`);
    return;
  }
  
  // 查询合约当前 XPL 余额
  const contractBalance = await xplContract.balanceOf(CONTRACTS.paymentChannel);
  const contractBalanceFormatted = ethers.formatUnits(contractBalance, decimals);
  console.log(`\n📄 合约当前余额: ${contractBalanceFormatted} ${symbol}`);
  console.log(`   原始值: ${contractBalance.toString()}`);
  
  // 询问转账金额（这里设置为转入 1000 XPL，你可以修改）
  const transferAmount = ethers.parseUnits("1000", decimals);  // 转入 1000 XPL
  const transferAmountFormatted = ethers.formatUnits(transferAmount, decimals);
  
  console.log(`\n⚠️  即将转入 ${transferAmountFormatted} ${symbol} 到合约`);
  console.log(`   从: ${adminWallet.address}`);
  console.log(`   到: ${CONTRACTS.paymentChannel}`);
  
  // 检查余额是否足够
  if (adminBalance < transferAmount) {
    console.log(`\n❌ 管理员余额不足！`);
    console.log(`   需要: ${transferAmountFormatted} ${symbol}`);
    console.log(`   当前: ${adminBalanceFormatted} ${symbol}`);
    return;
  }
  
  // 等待 3 秒，给用户取消的机会
  console.log(`\n⏳ 3 秒后开始转账... (Ctrl+C 取消)`);
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // 执行转账
  console.log(`\n🚀 开始转账...`);
  const tx = await xplContract.transfer(CONTRACTS.paymentChannel, transferAmount);
  console.log(`   交易哈希: ${tx.hash}`);
  
  console.log(`⏳ 等待交易确认...`);
  const receipt = await tx.wait();
  console.log(`✅ 交易已确认! Gas 使用: ${receipt.gasUsed.toString()}`);
  
  // 查询转账后的余额
  const newAdminBalance = await xplContract.balanceOf(adminWallet.address);
  const newAdminBalanceFormatted = ethers.formatUnits(newAdminBalance, decimals);
  
  const newContractBalance = await xplContract.balanceOf(CONTRACTS.paymentChannel);
  const newContractBalanceFormatted = ethers.formatUnits(newContractBalance, decimals);
  
  console.log(`\n✅ 转账成功!`);
  console.log(`   管理员新余额: ${newAdminBalanceFormatted} ${symbol}`);
  console.log(`   合约新余额: ${newContractBalanceFormatted} ${symbol}`);
  console.log(`   转账金额: ${transferAmountFormatted} ${symbol}`);
  
  console.log(`\n🔗 在区块浏览器查看:`);
  console.log(`   https://plasmascan.to/tx/${tx.hash}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ 错误:", error);
    process.exit(1);
  });
