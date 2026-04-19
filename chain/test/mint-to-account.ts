import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.connect();

describe("Mint to account", function () {
  it("Mint XPL and USDT", async function () {
    const [signer, receiver] = await ethers.getSigners();
    console.log("Signer:", await signer.getAddress());
    
    const target = receiver.address;
    const receiverXplBefore = await ethers.provider.getBalance(target);
    
    // 1. 发送 XPL
    console.log("Sending 100 XPL...");
    const tx1 = await signer.sendTransaction({
      to: target,
      value: ethers.parseEther("100")
    });
    await tx1.wait();
    console.log("✓ 100 XPL sent");
    const receiverXplAfter = await ethers.provider.getBalance(target);
    expect(receiverXplAfter - receiverXplBefore).to.equal(ethers.parseEther("100"));
    
    // 2. 铸造 USDT
    const usdt = await ethers.deployContract("MockUSDT");
    
    console.log("Minting 10000 USDT...");
    const tx2 = await usdt.mint(target, BigInt(10000) * BigInt(1e6));
    await tx2.wait();
    console.log("✓ 10000 USDT minted");
    
    // 查询余额
    const balance = await usdt.balanceOf(target);
    console.log(`\nUSDT Balance: ${Number(balance) / 1e6}`);
    expect(balance).to.equal(10000n * 1_000_000n);
    
    console.log("\nDone!");
  });
});
