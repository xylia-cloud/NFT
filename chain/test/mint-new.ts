import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.connect();

describe("Mint to new account", function () {
  it("Mint XPL and USDT to 0x7c852118294e51e653712a81e05800f419141751be58f605c0e0b9a11c3cc530", async function () {
    const [signer] = await ethers.getSigners();
    console.log("Signer:", await signer.getAddress());
    
    const target = "0x7c852118294e51e653712a81e05800f419141751be58f605c0e0b9a11c3cc530";
    
    // 1. 发送 XPL - 使用 lowercase 地址
    console.log("Sending 100 XPL...");
    const tx1 = await signer.sendTransaction({
      to: "0x90f79bf6eb2c3fa5c1fa9cc50c1162607b9e6fa5",
      value: ethers.parseEther("100")
    });
    await tx1.wait();
    console.log("✓ 100 XPL sent to 0x90f79bf6...");
    
    // 2. 铸造 USDT
    const usdtAddr = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
    const usdt = await ethers.getContractAt("MockUSDT", usdtAddr);
    
    // 给三个账户都铸造 10000 USDT
    const accounts = [
      "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266",
      "0x70997970c51812dc3a010c7d01b50e0d17dc79c8",
      "0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc",
      "0x90f79bf6eb2c3fa5c1fa9cc50c1162607b9e6fa5"
    ];
    
    for (const acc of accounts) {
      console.log(`Minting 10000 USDT to ${acc.slice(0, 10)}...`);
      const tx = await usdt.mint(acc, 10000n * 1000000n);
      await tx.wait();
      console.log("✓ USDT minted");
    }
    
    console.log("\nDone!");
  });
});
