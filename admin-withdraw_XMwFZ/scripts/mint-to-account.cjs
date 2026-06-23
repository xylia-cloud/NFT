const { ethers } = require("ethers");

async function main() {
  // 直接创建 provider，不使用签名者
  const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8546");
  
  // 部署者私钥
  const privateKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
  const wallet = new ethers.Wallet(privateKey, provider);
  
  const target = "0x7c852118294e51e653712a81e05800f419141751be58f605c0e0b9a11c3cc530";
  const usdtAddr = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
  
  console.log("Wallet:", await wallet.getAddress());
  
  // 1. 发送 XPL
  console.log("Sending 100 XPL...");
  const tx1 = await wallet.sendTransaction({
    to: target,
    value: ethers.parseEther("100")
  });
  await tx1.wait();
  console.log("✓ 100 XPL sent");
  
  // 2. 铸造 USDT
  console.log("Minting 10000 USDT...");
  const usdtAbi = [
    "function mint(address to, uint256 amount) external",
    "function balanceOf(address account) view returns (uint256)"
  ];
  const usdt = new ethers.Contract(usdtAddr, usdtAbi, wallet);
  const tx2 = await usdt.mint(target, BigInt(10000) * BigInt(1e6));
  await tx2.wait();
  console.log("✓ 10000 USDT minted");
  
  // 查询余额
  const balance = await usdt.balanceOf(target);
  console.log(`\nUSDT Balance: ${Number(balance) / 1e6}`);
  
  console.log("\nDone!");
}

main().catch(console.error);
