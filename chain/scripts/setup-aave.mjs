/**
 * 部署后配置 Aave 集成
 *
 * 使用方法:
 * npx hardhat run scripts/setup-aave.mjs --network plasmaMainnet
 *
 * 环境变量:
 * - ADMIN_PRIVATE_KEY 或 PLASMA_MAINNET_PRIVATE_KEY
 */

import { network } from "hardhat";
import fs from "fs";
import { fileURLToPath } from "url";
import path from "path";

const { ethers } = await network.connect();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const configPath = path.join(__dirname, "../plasma-mainnet-config.json");
const plasmaConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));

const AAVE = {
  pool: plasmaConfig.contracts.AaveV3Pool.address,
  aUsdt: plasmaConfig.contracts.aPlaUSDT0.address,
  usdt: plasmaConfig.contracts.USDT0.address,
};

async function main() {
  const paymentChannelAddress = plasmaConfig.contracts.PaymentChannel.address;
  const adminPrivateKey = process.env.ADMIN_PRIVATE_KEY || process.env.PLASMA_MAINNET_PRIVATE_KEY;
  if (!adminPrivateKey) {
    throw new Error("请设置 ADMIN_PRIVATE_KEY 环境变量");
  }

  const adminWallet = new ethers.Wallet(adminPrivateKey, ethers.provider);
  console.log(`👤 管理员: ${adminWallet.address}`);
  console.log(`📄 PaymentChannel: ${paymentChannelAddress}`);

  const artifactPath = path.join(__dirname, "../artifacts/contracts/PaymentChannel.sol/PaymentChannel.json");
  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
  const paymentChannel = new ethers.Contract(paymentChannelAddress, artifact.abi, adminWallet);

  console.log("\n⚙️  配置 Aave 集成...");
  console.log(`   Pool:    ${AAVE.pool}`);
  console.log(`   aUSDT0:  ${AAVE.aUsdt}`);
  console.log(`   USDT0:   ${AAVE.usdt}`);

  let tx = await paymentChannel.setUsdtToken(AAVE.usdt);
  await tx.wait();
  console.log("✅ setUsdtToken");

  tx = await paymentChannel.setAUsdtToken(AAVE.aUsdt);
  await tx.wait();
  console.log("✅ setAUsdtToken");

  tx = await paymentChannel.setAavePool(AAVE.pool);
  await tx.wait();
  console.log("✅ setAavePool (含 USDT approve)");

  const totalManaged = await paymentChannel.getTotalUsdtManaged();
  console.log(`\n📊 合约管理的 USDT 总量: ${ethers.formatUnits(totalManaged, 6)} USDT0`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ 错误:", error);
    process.exit(1);
  });
