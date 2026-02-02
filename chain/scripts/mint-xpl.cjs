const { ethers } = require("ethers");

async function main() {
  const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8546");
  const signer = await provider.getSigner();

  // 要铸造 XPL 的账户（与 mint-usdt.cjs 一致，共 5 个测试账号）
  const accounts = [
    "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
    "0x90F79bf6EB2c3fA5C1Fa9Cc50c1162607B9E6fA5",
    "0x15d34AAf54267DB7D7c53783971a1Dc9eAd9F7cA",
  ];

  console.log("Minting XPL to test accounts...\n");

  for (const account of accounts) {
    // 直接转账 100 XPL 给账户（从有钱的账户）
    const tx = await signer.sendTransaction({
      to: account,
      value: ethers.parseEther("100")
    });
    await tx.wait();
    console.log(`✓ Minted 100 XPL to: ${account}`);
  }

  console.log("\nDone!");
}

main().catch(console.error);
