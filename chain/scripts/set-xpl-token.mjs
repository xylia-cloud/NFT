/**
 * 设置 PaymentChannel 合约的 XPL 代币地址
 * 
 * 使用方法:
 * npx hardhat run scripts/set-xpl-token.mjs --network plasmaMainnet
 */

import { network } from "hardhat";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const { ethers } = await network.connect();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 读取 PaymentChannel ABI
const artifactPath = path.join(__dirname, "../artifacts/contracts/PaymentChannel.sol/PaymentChannel.json");
const PaymentChannelArtifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
const PaymentChannel_ABI = PaymentChannelArtifact.abi;

// 合约地址配置
const CONTRACTS = {
  paymentChannel: "0x13dFde78A02C4138FD6aaAdd795FA11471CcfE54",
  xpl: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"  // 请替换为实际的 XPL 代币地址
};

async function main() {
  console.log("\n⚙️  设置 XPL 代币地址\n");
  
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
  
  // 连接到 PaymentChannel 合约
  const paymentChannel = new ethers.Contract(CONTRACTS.paymentChannel, PaymentChannel_ABI, adminWallet);
  
  // 查询当前 XPL 代币地址
  const currentXplToken = await paymentChannel.xplToken();
  console.log(`📊 当前 XPL 代币地址: ${currentXplToken}`);
  
  if (currentXplToken.toLowerCase() === CONTRACTS.xpl.toLowerCase()) {
    console.log(`\n✅ XPL 代币地址已经设置正确，无需更新`);
    return;
  }
  
  // 设置新的 XPL 代币地址
  console.log(`\n⚠️  即将设置新的 XPL 代币地址`);
  console.log(`   旧地址: ${currentXplToken}`);
  console.log(`   新地址: ${CONTRACTS.xpl}`);
  
  // 等待 3 秒
  console.log(`\n⏳ 3 秒后开始设置... (Ctrl+C 取消)`);
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // 执行设置
  console.log(`\n🚀 开始设置...`);
  const tx = await paymentChannel.setXplToken(CONTRACTS.xpl);
  console.log(`   交易哈希: ${tx.hash}`);
  
  console.log(`⏳ 等待交易确认...`);
  const receipt = await tx.wait();
  console.log(`✅ 交易已确认! Gas 使用: ${receipt.gasUsed.toString()}`);
  
  // 验证设置
  const newXplToken = await paymentChannel.xplToken();
  console.log(`\n✅ XPL 代币地址设置成功!`);
  console.log(`   新地址: ${newXplToken}`);
  
  console.log(`\n🔗 在区块浏览器查看:`);
  console.log(`   https://plasmascan.to/tx/${tx.hash}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ 错误:", error);
    process.exit(1);
  });
