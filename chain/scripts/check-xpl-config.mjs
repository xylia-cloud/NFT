/**
 * 检查 PaymentChannel 合约的 XPL 配置
 */

import { network } from "hardhat";
const { ethers } = await network.connect();

const PAYMENT_CHANNEL = "0x13dFde78A02C4138FD6aaAdd795FA11471CcfE54";

async function main() {
  console.log("\n🔍 检查 XPL 配置\n");
  
  const paymentChannel = await ethers.getContractAt("PaymentChannel", PAYMENT_CHANNEL);
  
  // 查询 XPL 地址
  const xplAddress = await paymentChannel.xplToken();
  console.log("📄 PaymentChannel 合约:", PAYMENT_CHANNEL);
  console.log("💎 配置的 XPL 地址:", xplAddress);
  
  if (xplAddress === ethers.ZeroAddress || xplAddress === "0x0000000000000000000000000000000000000000") {
    console.log("\n❌ XPL 地址未配置！");
    console.log("\n📝 需要执行:");
    console.log("   1. 找到 PLASMA 链的 XPL 代币地址");
    console.log("   2. 调用 setXplToken(XPL地址) 配置");
    console.log("   3. 给合约转入 XPL 代币");
    return;
  }
  
  // 查询 XPL 余额
  try {
    const xpl = await ethers.getContractAt("IERC20", xplAddress);
    const symbol = await xpl.symbol();
    const decimals = await xpl.decimals();
    const balance = await xpl.balanceOf(PAYMENT_CHANNEL);
    const formatted = ethers.formatUnits(balance, decimals);
    
    console.log(`\n💰 XPL 代币信息:`);
    console.log(`   符号: ${symbol}`);
    console.log(`   精度: ${decimals}`);
    console.log(`   合约余额: ${formatted} ${symbol}`);
    
    if (balance === 0n) {
      console.log(`\n⚠️  合约中没有 XPL 代币！`);
      console.log(`\n📝 需要执行:`);
      console.log(`   管理员转 XPL 到合约:`);
      console.log(`   await xpl.transfer("${PAYMENT_CHANNEL}", "XPL数量")`);
    } else {
      console.log(`\n✅ 合约中有 XPL 代币，可以正常提现！`);
    }
  } catch (error) {
    console.log(`\n❌ 查询 XPL 信息失败:`, error.message);
    console.log(`\n可能原因:`);
    console.log(`   1. XPL 地址配置错误`);
    console.log(`   2. XPL 合约不是标准 ERC20`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ 错误:", error);
    process.exit(1);
  });
