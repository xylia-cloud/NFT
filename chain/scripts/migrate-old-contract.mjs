/**
 * 将旧 PaymentChannel 合约中的资产迁移到新合约
 *
 * npx hardhat run scripts/migrate-old-contract.mjs --network plasmaMainnet
 *
 * 需使用旧合约 Owner 私钥: PLASMA_MAINNET_PRIVATE_KEY
 */

import { network } from "hardhat";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const { ethers } = await network.connect();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const CONFIG_PATH = path.join(__dirname, "../plasma-mainnet-config.json");
const ARTIFACT_PATH = path.join(__dirname, "../artifacts/contracts/PaymentChannel.sol/PaymentChannel.json");

const ERC20_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
];

async function main() {
  const config = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8"));
  const oldAddress = config.contracts.PaymentChannel.previousAddress;
  const newAddress = config.contracts.PaymentChannel.address;
  const usdtAddress = config.contracts.USDT0.address;
  const wxplAddress = config.contracts.WXPL.address;
  const aUsdtAddress = config.contracts.aPlaUSDT0.address;

  const privateKey = process.env.PLASMA_MAINNET_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error("请设置 PLASMA_MAINNET_PRIVATE_KEY（旧合约 Owner 私钥）");
  }

  const wallet = new ethers.Wallet(privateKey, ethers.provider);
  const artifact = JSON.parse(fs.readFileSync(ARTIFACT_PATH, "utf8"));
  const oldContract = new ethers.Contract(oldAddress, artifact.abi, wallet);

  const owner = await oldContract.owner();
  if (owner.toLowerCase() !== wallet.address.toLowerCase()) {
    throw new Error(`当前钱包 ${wallet.address} 不是旧合约 Owner ${owner}`);
  }

  const usdt = new ethers.Contract(usdtAddress, ERC20_ABI, wallet);
  const wxpl = new ethers.Contract(wxplAddress, ERC20_ABI, wallet);
  const aUsdt = new ethers.Contract(aUsdtAddress, ERC20_ABI, wallet);

  const usdtDecimals = await usdt.decimals();
  const wxplDecimals = await wxpl.decimals();

  const oldIdle = await usdt.balanceOf(oldAddress);
  const oldAave = await aUsdt.balanceOf(oldAddress);
  const oldWxpl = await wxpl.balanceOf(oldAddress);
  const oldNative = await ethers.provider.getBalance(oldAddress);
  const totalUsdt = oldIdle + oldAave;

  console.log("\n📦 旧合约迁移");
  console.log(`   旧: ${oldAddress}`);
  console.log(`   新: ${newAddress}`);
  console.log(`   操作者: ${wallet.address}`);
  console.log(`\n📊 旧合约余额:`);
  console.log(`   USDT 闲置: ${ethers.formatUnits(oldIdle, usdtDecimals)}`);
  console.log(`   USDT Aave: ${ethers.formatUnits(oldAave, usdtDecimals)}`);
  console.log(`   WXPL:      ${ethers.formatUnits(oldWxpl, wxplDecimals)}`);
  console.log(`   原生 XPL:  ${ethers.formatEther(oldNative)}`);

  if (totalUsdt === 0n && oldWxpl === 0n && oldNative === 0n) {
    console.log("\n✅ 旧合约无余额，无需迁移");
    return;
  }

  if (totalUsdt > 0n) {
    console.log(`\n🚀 迁移 USDT → 新合约 (${ethers.formatUnits(totalUsdt, usdtDecimals)} USDT)...`);
    const tx = await oldContract.emergencyWithdrawUsdtTo(newAddress, 0);
    console.log(`   tx: ${tx.hash}`);
    await tx.wait();
    console.log("✅ USDT 已迁移");
  }

  const wxplAfterUsdt = await wxpl.balanceOf(oldAddress);
  if (wxplAfterUsdt > 0n) {
    console.log(`\n🚀 迁移 WXPL → 新合约 (${ethers.formatUnits(wxplAfterUsdt, wxplDecimals)} WXPL)...`);
    const tx = await oldContract.emergencyWithdrawXplTo(newAddress, 0);
    console.log(`   tx: ${tx.hash}`);
    await tx.wait();
    console.log("✅ WXPL 已迁移");
  }

  const nativeAfter = await ethers.provider.getBalance(oldAddress);
  if (nativeAfter > 0n) {
    console.log(`\n🚀 迁移原生 XPL → 新合约 (${ethers.formatEther(nativeAfter)} XPL)...`);
    const tx = await oldContract.emergencyWithdrawNativeTo(newAddress);
    console.log(`   tx: ${tx.hash}`);
    await tx.wait();
    console.log("✅ 原生 XPL 已迁移");
  }

  const newIdle = await usdt.balanceOf(newAddress);
  const newAave = await aUsdt.balanceOf(newAddress);
  const newWxpl = await wxpl.balanceOf(newAddress);
  const newNative = await ethers.provider.getBalance(newAddress);

  console.log("\n📊 迁移后新合约余额:");
  console.log(`   USDT 闲置: ${ethers.formatUnits(newIdle, usdtDecimals)}`);
  console.log(`   USDT Aave: ${ethers.formatUnits(newAave, usdtDecimals)}`);
  console.log(`   WXPL:      ${ethers.formatUnits(newWxpl, wxplDecimals)}`);
  console.log(`   原生 XPL:  ${ethers.formatEther(newNative)}`);
  console.log(`\n🔗 https://plasmascan.to/address/${newAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ 迁移失败:", error);
    process.exit(1);
  });
