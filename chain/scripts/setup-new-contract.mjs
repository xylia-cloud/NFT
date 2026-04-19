/**
 * 设置新部署的 PaymentChannel 合约
 * 1. 设置 USDT 代币地址
 * 2. 验证配置
 */

import { network } from "hardhat";
const { ethers } = await network.connect();

async function main() {
  const newContractAddress = "0xf4dAC0648D90b9F2D108e43aCf1526AfA71aC403";
  const usdtAddress = "0x3F1Eb88219A75b82906F0844A339BA4C8a74d14E";
  
  console.log("\n🔧 设置新合约配置...");
  console.log("合约地址:", newContractAddress);
  console.log("USDT 地址:", usdtAddress);
  
  // 获取合约实例
  const PaymentChannel = await ethers.getContractFactory("PaymentChannel");
  const paymentChannel = PaymentChannel.attach(newContractAddress);
  
  // 获取部署者账户
  const [deployer] = await ethers.getSigners();
  console.log("\n👤 部署者地址:", deployer.address);
  
  // 验证 owner
  const owner = await paymentChannel.owner();
  console.log("合约 owner:", owner);
  
  if (owner.toLowerCase() !== deployer.address.toLowerCase()) {
    throw new Error("当前账户不是合约 owner");
  }
  
  // 设置 USDT 地址
  console.log("\n🚀 设置 USDT 代币地址...");
  const tx = await paymentChannel.setUsdtToken(usdtAddress);
  console.log("交易哈希:", tx.hash);
  
  console.log("⏳ 等待交易确认...");
  const receipt = await tx.wait();
  console.log("✅ 交易已确认! Gas 使用:", receipt.gasUsed.toString());
  
  // 验证配置
  console.log("\n📊 验证配置...");
  const configuredUsdt = await paymentChannel.usdtToken();
  console.log("已配置的 USDT 地址:", configuredUsdt);
  
  if (configuredUsdt.toLowerCase() === usdtAddress.toLowerCase()) {
    console.log("✅ USDT 地址配置成功!");
  } else {
    throw new Error("USDT 地址配置失败");
  }
  
  // 测试紧急提取函数是否存在
  console.log("\n🧪 测试紧急提取函数...");
  try {
    // 只是检查函数是否存在，不实际调用
    const hasFunction = typeof paymentChannel.emergencyWithdrawUsdt === 'function';
    if (hasFunction) {
      console.log("✅ emergencyWithdrawUsdt 函数存在");
    } else {
      console.log("❌ emergencyWithdrawUsdt 函数不存在");
    }
  } catch (error) {
    console.log("❌ 紧急提取函数检查失败:", error.message);
  }
  
  console.log("\n✅ 新合约配置完成!");
  console.log("\n📝 请更新以下文件中的合约地址:");
  console.log("   - chain/plasma-mainnet-config.json");
  console.log("   - frontend/src/wagmiConfig.ts");
  console.log("   - chain/scripts/admin-withdraw-all.cjs");
  console.log("\n新合约地址:", newContractAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ 错误:", error);
    process.exit(1);
  });
