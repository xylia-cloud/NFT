/**
 * 部署 PaymentChannel 到 PLASMA 主网并完成 Aave + WXPL 配置
 *
 * npx hardhat run scripts/deploy-plasma-mainnet.mjs --network plasmaMainnet
 *
 * 环境变量: ADMIN_PRIVATE_KEY 或 PLASMA_MAINNET_PRIVATE_KEY
 */

import { network } from "hardhat";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const { ethers } = await network.connect();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONFIG_PATH = path.join(__dirname, "../plasma-mainnet-config.json");
const ABI_PATH = path.join(__dirname, "../PaymentChannel.abi.json");
const ARTIFACT_PATH = path.join(__dirname, "../artifacts/contracts/PaymentChannel.sol/PaymentChannel.json");
const REPO_ROOT = path.join(__dirname, "../..");

const VERSION = "v4-emergency-aave-direct";

function syncAddressInFile(filePath, oldAddress, newAddress) {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, "utf8");
  if (!content.includes(oldAddress)) return;
  fs.writeFileSync(filePath, content.replaceAll(oldAddress, newAddress));
  console.log(`✅ 已更新 ${path.relative(REPO_ROOT, filePath)}`);
}

function syncRepoAddresses(oldAddress, newAddress, oldAdmin, newAdmin) {
  const files = [
    path.join(REPO_ROOT, "frontend/src/wagmiConfig.ts"),
    path.join(REPO_ROOT, "chain/BACKEND_INTEGRATION.md"),
    path.join(REPO_ROOT, "chain/scripts/set-wxpl-token.mjs"),
    path.join(REPO_ROOT, "chain/scripts/transfer-xpl-to-contract.mjs"),
    path.join(REPO_ROOT, "chain/scripts/admin-withdraw-all.mjs"),
  ];

  for (const file of files) {
    syncAddressInFile(file, oldAddress, newAddress);
    if (oldAdmin && newAdmin && oldAdmin !== newAdmin) {
      syncAddressInFile(file, oldAdmin, newAdmin);
    }
  }
}

async function main() {
  const plasmaConfig = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8"));
  const previousAddress = plasmaConfig.contracts.PaymentChannel.address;

  const adminPrivateKey = process.env.ADMIN_PRIVATE_KEY || process.env.PLASMA_MAINNET_PRIVATE_KEY;
  if (!adminPrivateKey) {
    throw new Error("请设置 ADMIN_PRIVATE_KEY 或 PLASMA_MAINNET_PRIVATE_KEY");
  }

  const adminWallet = new ethers.Wallet(adminPrivateKey, ethers.provider);
  console.log("\n🚀 部署 PaymentChannel 到 PLASMA Mainnet\n");
  console.log(`👤 部署账户: ${adminWallet.address}`);

  const balance = await ethers.provider.getBalance(adminWallet.address);
  console.log(`💰 XPL 余额: ${ethers.formatEther(balance)}`);
  const minGas = ethers.parseEther("0.01");
  if (balance < minGas) {
    throw new Error(
      `部署账户 XPL 不足（需要 ≥ 0.01 XPL）。请向 ${adminWallet.address} 转入 XPL 后重试。`
    );
  }

  const artifact = JSON.parse(fs.readFileSync(ARTIFACT_PATH, "utf8"));
  const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, adminWallet);

  console.log("\n📦 部署合约...");
  const paymentChannel = await factory.deploy();
  await paymentChannel.waitForDeployment();
  const newAddress = await paymentChannel.getAddress();
  console.log(`✅ 部署成功: ${newAddress}`);

  const owner = await paymentChannel.owner();
  if (owner.toLowerCase() !== adminWallet.address.toLowerCase()) {
    throw new Error(`Owner 不匹配: ${owner} != ${adminWallet.address}`);
  }

  const aave = {
    pool: plasmaConfig.contracts.AaveV3Pool.address,
    aUsdt: plasmaConfig.contracts.aPlaUSDT0.address,
    usdt: plasmaConfig.contracts.USDT0.address,
    wxpl: plasmaConfig.contracts.WXPL.address,
  };

  console.log("\n⚙️  配置合约...");
  let tx = await paymentChannel.setUsdtToken(aave.usdt);
  await tx.wait();
  console.log("✅ setUsdtToken");

  tx = await paymentChannel.setAUsdtToken(aave.aUsdt);
  await tx.wait();
  console.log("✅ setAUsdtToken");

  tx = await paymentChannel.setAavePool(aave.pool);
  await tx.wait();
  console.log("✅ setAavePool");

  tx = await paymentChannel.setXplToken(aave.wxpl);
  await tx.wait();
  console.log("✅ setXplToken");

  const today = new Date().toISOString().slice(0, 10);
  const oldAdmin = plasmaConfig.admin?.address;
  plasmaConfig.contracts.PaymentChannel = {
    address: newAddress,
    deployedAt: today,
    version: VERSION,
    previousAddress,
  };
  plasmaConfig.admin = {
    address: adminWallet.address,
    note: "合约 Owner，提现签名私钥须对应此地址",
  };
  fs.writeFileSync(CONFIG_PATH, `${JSON.stringify(plasmaConfig, null, 2)}\n`);

  const abiDoc = JSON.parse(fs.readFileSync(ABI_PATH, "utf8"));
  abiDoc.version = VERSION;
  abiDoc.address = newAddress;
  abiDoc.abi = artifact.abi;
  fs.writeFileSync(ABI_PATH, `${JSON.stringify(abiDoc, null, 2)}\n`);

  console.log("\n📝 同步仓库地址...");
  syncRepoAddresses(previousAddress, newAddress, oldAdmin, adminWallet.address);

  console.log("\n📋 部署摘要");
  console.log(`   新合约: ${newAddress}`);
  console.log(`   旧合约: ${previousAddress}`);
  console.log(`   Owner:  ${adminWallet.address}`);
  console.log(`   版本:   ${VERSION}`);
  console.log(`\n🔗 https://plasmascan.to/address/${newAddress}`);
  console.log("\n⚠️  请通知后端更新 contract_address 与签名私钥（Owner 地址）");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ 部署失败:", error);
    process.exit(1);
  });
