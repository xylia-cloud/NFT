const { ethers, getAddress } = require("ethers");

async function main() {
  const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8546");
  const signer = await provider.getSigner();
  
  const usdtAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
  const usdtAbi = [
    "function mint(address to, uint256 amount) external",
    "function balanceOf(address account) view returns (uint256)"
  ];
  const usdt = new ethers.Contract(usdtAddress, usdtAbi, signer);

  // 多个测试账户地址
  const testAccounts = [
    "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
    "0x90F79bf6EB2c3fA5C1Fa9Cc50c1162607B9E6fA5",
    "0x15d34AAf54267DB7D7c53783971a1Dc9eAd9F7cA",
  ];

  console.log("Minting USDT to test accounts...\n");

  for (const account of testAccounts) {
    const addr = getAddress(account); // 规范化地址
    const tx = await usdt.mint(addr, BigInt(10000) * BigInt(1e6));
    await tx.wait();
    
    const balance = await usdt.balanceOf(addr);
    console.log(`✓ ${addr}`);
    console.log(`  Balance: ${(Number(balance) / 1e6).toLocaleString()} USDT\n`);
  }

  console.log("Done!");
}

main().catch(console.error);
