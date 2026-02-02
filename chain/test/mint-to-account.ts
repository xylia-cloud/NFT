import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.connect();

describe("Mint to account", function () {
  it("Mint XPL and USDT", async function () {
    const [signer] = await ethers.getSigners();
    console.log("Signer:", await signer.getAddress());
    
    const target = "0x7c852118294e51e653712a81e05800f419141751be58f605c0e0b9a11c3cc530";
    
    // 1. 发送 XPL
    console.log("Sending 100 XPL...");
    const tx1 = await signer.sendTransaction({
      to: target,
      value: ethers.parseEther("100")
    });
    await tx1.wait();
    console.log("✓ 100 XPL sent");
    
    // 2. 铸造 USDT
    const usdtAddr = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
    const usdt = await ethers.getContractAt("MockUSDT", usdtAddr);
    
    console.log("Minting 10000 USDT...");
    const tx2 = await usdt.mint(target, BigInt(10000) * BigInt(1e6));
    await tx2.wait();
    console.log("✓ 10000 USDT minted");
    
    // 查询余额
    const balance = await usdt.balanceOf(target);
    console.log(`\nUSDT Balance: ${Number(balance) / 1e6}`);
    
    console.log("\nDone!");
  });
});
