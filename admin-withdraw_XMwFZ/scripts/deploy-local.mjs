/**
 * 本地测试链一键部署脚本
 * 
 * 功能：
 * 1. 部署 MockUSDT 合约
 * 2. 部署 PaymentChannel 合约
 * 3. 配置 PaymentChannel 使用 USDT
 * 4. 给测试账户铸造 USDT
 * 5. 输出所有配置信息
 */

import { network } from "hardhat";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const { ethers } = await network.connect();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 测试账户列表（Hardhat 默认账户 - 只使用前3个避免校验和问题）
const TEST_ACCOUNTS = [
  {
    address: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    privateKey: "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
  },
  {
    address: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    privateKey: "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d"
  },
  {
    address: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
    privateKey: "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a"
  }
];

async function main() {
  console.log("\n🚀 开始部署本地测试链合约...\n");

  const [deployer] = await ethers.getSigners();
  console.log("📍 部署账户:", deployer.address);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 账户余额:", ethers.formatEther(balance), "XPL\n");

  // 1. 部署 MockUSDT
  console.log("📦 部署 MockUSDT 合约...");
  const MockUSDT = await ethers.getContractFactory("MockUSDT");
  const usdt = await MockUSDT.deploy();
  await usdt.waitForDeployment();
  const usdtAddress = await usdt.getAddress();
  console.log("✅ MockUSDT 已部署:", usdtAddress);

  // 2. 部署 MockXPL（使用 MockUSDT 合约，只是名称不同）
  console.log("\n📦 部署 MockXPL 合约...");
  const xpl = await MockUSDT.deploy();
  await xpl.waitForDeployment();
  const xplAddress = await xpl.getAddress();
  console.log("✅ MockXPL 已部署:", xplAddress);

  // 3. 部署 PaymentChannel
  console.log("\n📦 部署 PaymentChannel 合约...");
  const PaymentChannel = await ethers.getContractFactory("PaymentChannel");
  const paymentChannel = await PaymentChannel.deploy();
  await paymentChannel.waitForDeployment();
  const paymentChannelAddress = await paymentChannel.getAddress();
  console.log("✅ PaymentChannel 已部署:", paymentChannelAddress);

  // 4. 配置 PaymentChannel
  console.log("\n⚙️  配置 PaymentChannel...");
  const setUsdtTx = await paymentChannel.setUsdtToken(usdtAddress);
  await setUsdtTx.wait();
  console.log("✅ USDT 代币已设置");
  
  const setXplTx = await paymentChannel.setXplToken(xplAddress);
  await setXplTx.wait();
  console.log("✅ XPL 代币已设置");

  // 5. 给测试账户铸造 USDT 和 XPL
  console.log("\n💵 给测试账户铸造 USDT 和 XPL...");
  for (const account of TEST_ACCOUNTS) {
    const mintAmount = BigInt(10000) * BigInt(1e6); // 10000 USDT (6位精度)
    const xplMintAmount = BigInt(100000) * BigInt(10) ** BigInt(18); // 100000 XPL (18位精度)
    
    // 使用 ethers.getAddress 来获取正确的校验和地址
    const checksumAddress = ethers.getAddress(account.address);
    
    // 铸造 USDT
    const usdtTx = await usdt.mint(checksumAddress, mintAmount);
    await usdtTx.wait();
    
    // 铸造 XPL
    const xplTx = await xpl.mint(checksumAddress, xplMintAmount);
    await xplTx.wait();
    
    const usdtBalance = await usdt.balanceOf(checksumAddress);
    const xplBalance = await xpl.balanceOf(checksumAddress);
    console.log(`✅ ${checksumAddress}:`);
    console.log(`   - USDT: ${Number(usdtBalance) / 1e6}`);
    console.log(`   - XPL: ${Number(xplBalance) / 1e18}`);
  }

  // 6. 给 PaymentChannel 合约铸造 XPL（用于提现）
  console.log("\n💰 给 PaymentChannel 合约铸造 XPL...");
  const contractXplAmount = BigInt(1000000) * BigInt(10) ** BigInt(18); // 1,000,000 XPL
  const contractXplTx = await xpl.mint(paymentChannelAddress, contractXplAmount);
  await contractXplTx.wait();
  const contractXplBalance = await xpl.balanceOf(paymentChannelAddress);
  console.log(`✅ PaymentChannel 合约 XPL 余额: ${Number(contractXplBalance) / 1e18}`);

  // 7. 生成配置文件
  console.log("\n📝 生成配置文件...");
  
  const config = {
    network: {
      name: "Hardhat Local",
      rpcUrl: "http://127.0.0.1:8546",  // 如果后端需要远程访问，请改为 ngrok URL
      chainId: 31337,
      currency: {
        name: "XPL",
        symbol: "XPL",
        decimals: 18
      }
    },
    contracts: {
      USDT: usdtAddress,
      XPL: xplAddress,
      PaymentChannel: paymentChannelAddress
    },
    adminAccount: {
      address: ethers.getAddress(TEST_ACCOUNTS[0].address),
      privateKey: TEST_ACCOUNTS[0].privateKey,
      note: "管理员账户，用于后端签名授权提现操作"
    },
    testAccounts: TEST_ACCOUNTS.map(acc => ({
      address: ethers.getAddress(acc.address),
      privateKey: acc.privateKey,
      xplBalance: "100000",
      usdtBalance: "10000"
    }))
  };

  const configPath = path.join(__dirname, "../local-testnet-config.json");
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  console.log("✅ 配置文件已生成:", configPath);

  // 8. 输出摘要信息
  console.log("\n" + "=".repeat(60));
  console.log("✅ 部署完成！");
  console.log("=".repeat(60));
  
  console.log("\n📋 合约地址:");
  console.log("- MockUSDT:", usdtAddress);
  console.log("- MockXPL:", xplAddress);
  console.log("- PaymentChannel:", paymentChannelAddress);
  
  console.log("\n🔗 网络信息:");
  console.log("- RPC URL: http://127.0.0.1:8546");
  console.log("- 链 ID: 31337");
  console.log("- 网络名称: Hardhat Local");
  
  console.log("\n👛 测试账户 (前3个):");
  TEST_ACCOUNTS.forEach((acc, i) => {
    console.log(`\n${i + 1}. ${acc.address}`);
    console.log(`   - Native XPL: 10000`);
    console.log(`   - XPL Token: 100000`);
    console.log(`   - USDT: 10000`);
    console.log(`   - 私钥: ${acc.privateKey}`);
  });

  console.log("\n💰 PaymentChannel 合约余额:");
  console.log(`- XPL Token: ${Number(contractXplBalance) / 1e18} (用于收益提现)`);

  console.log("\n📄 配置文件:");
  console.log("- JSON: local-testnet-config.json");

  console.log("\n🎯 下一步:");
  console.log("1. 更新前端配置:");
  console.log("   - 编辑 frontend/src/wagmiConfig.ts");
  console.log("   - 更新 paymentChannelAddress 为:", paymentChannelAddress);
  console.log("2. 如果后端需要远程访问:");
  console.log("   - 启动 ngrok: ngrok http 8546");
  console.log("   - 复制 ngrok URL（如 https://abc123.ngrok.io）");
  console.log("   - 编辑 local-testnet-config.json，将 rpcUrl 改为 ngrok URL");
  console.log("3. 后端配置:");
  console.log("   - 使用 adminAccount 的私钥进行签名");
  console.log("   - 签名消息格式: keccak256(abi.encodePacked(user, amount, orderId, nonce, chainId, contractAddress))");
  
  console.log("\n💡 提示:");
  console.log("- 收益提现: 调用 withdrawXplWithSignature，转 XPL token");
  console.log("- 本金提现: 调用 withdrawWithSignature，转 USDT token");
  console.log("- PaymentChannel 合约已预充 1,000,000 XPL 用于提现测试");
  
  console.log("\n" + "=".repeat(60) + "\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ 部署失败:", error);
    process.exit(1);
  });
