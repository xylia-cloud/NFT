/**
 * 更新 PaymentChannel 合约的 USDT 地址
 * 将 MockUSDT 改为真实的 USDT0
 */

import { network } from "hardhat";
const { ethers } = await network.connect();

const PAYMENT_CHANNEL = "0x13dFde78A02C4138FD6aaAdd795FA11471CcfE54";
const OLD_USDT = "0x3F1Eb88219A75b82906F0844A339BA4C8a74d14E";  // MockUSDT
const NEW_USDT = "0xb8ce59fc3717ada4c02eadf9682a9e934f625ebb";  // 真实 USDT0

async function main() {
  console.log("\n🔧 更新 PaymentChannel 合约的 USDT 地址\n");
  
  // 获取合约实例
  const paymentChannel = await ethers.getContractAt("PaymentChannel", PAYMENT_CHANNEL);
  
  // 获取部署者账户
  const [deployer] = await ethers.getSigners();
  console.log("👤 操作账户:", deployer.address);
  
  // 验证 owner
  const owner = await paymentChannel.owner();
  console.log("📄 合约 owner:", owner);
  
  if (owner.toLowerCase() !== deployer.address.toLowerCase()) {
    throw new Error("当前账户不是合约 owner");
  }
  
  // 查询当前 USDT 地址
  const currentUsdt = await paymentChannel.usdtToken();
  console.log("\n📊 当前配置:");
  console.log("   当前 USDT 地址:", currentUsdt);
  console.log("   旧 USDT (MockUSDT):", OLD_USDT);
  console.log("   新 USDT (真实 USDT0):", NEW_USDT);
  
  if (currentUsdt.toLowerCase() === NEW_USDT.toLowerCase()) {
    console.log("\n✅ USDT 地址已经是最新的，无需更新");
    return;
  }
  
  // 更新 USDT 地址
  console.log("\n🚀 开始更新 USDT 地址...");
  const tx = await paymentChannel.setUsdtToken(NEW_USDT);
  console.log("   交易哈希:", tx.hash);
  
  console.log("⏳ 等待交易确认...");
  const receipt = await tx.wait();
  console.log("✅ 交易已确认! Gas 使用:", receipt.gasUsed.toString());
  
  // 验证更新
  console.log("\n📊 验证更新...");
  const updatedUsdt = await paymentChannel.usdtToken();
  console.log("   更新后的 USDT 地址:", updatedUsdt);
  
  if (updatedUsdt.toLowerCase() === NEW_USDT.toLowerCase()) {
    console.log("\n✅ USDT 地址更新成功!");
    console.log("\n📝 后续步骤:");
    console.log("   1. 前端配置已更新");
    console.log("   2. 提取脚本已更新");
    console.log("   3. 用户现在可以使用真实的 USDT0 充值");
    console.log("\n🔗 USDT0 合约:");
    console.log("   https://plasmascan.to/token/0xb8ce59fc3717ada4c02eadf9682a9e934f625ebb");
  } else {
    throw new Error("USDT 地址更新失败");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ 错误:", error);
    process.exit(1);
  });
