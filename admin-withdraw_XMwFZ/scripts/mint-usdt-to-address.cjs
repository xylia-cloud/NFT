/**
 * 给指定地址铸造 USDT
 * 使用方法: node scripts/mint-usdt-to-address.cjs <地址> <数量>
 * 例如: node scripts/mint-usdt-to-address.cjs 0x1234... 10000
 */

const hre = require("hardhat");

async function main() {
  const targetAddress = process.argv[2];
  const amount = process.argv[3] || "10000";

  if (!targetAddress) {
    console.error("❌ 请提供目标地址");
    console.log("使用方法: node scripts/mint-usdt-to-address.cjs <地址> <数量>");
    process.exit(1);
  }

  console.log("\n🪙 开始铸造 USDT...");
  console.log("目标地址:", targetAddress);
  console.log("数量:", amount, "USDT\n");

  // USDT 合约地址
  const USDT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

  // 获取 USDT 合约
  const usdt = await hre.ethers.getContractAt("MockUSDT", USDT_ADDRESS);

  // 铸造 USDT (6位精度)
  const mintAmount = hre.ethers.parseUnits(amount, 6);
  console.log("📝 铸造中...");
  const tx = await usdt.mint(targetAddress, mintAmount);
  await tx.wait();

  // 查询余额
  const balance = await usdt.balanceOf(targetAddress);
  const balanceFormatted = hre.ethers.formatUnits(balance, 6);

  console.log("✅ 铸造成功！");
  console.log("当前余额:", balanceFormatted, "USDT\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ 铸造失败:", error);
    process.exit(1);
  });
