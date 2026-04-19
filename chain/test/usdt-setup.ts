import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.connect();

describe("USDT Setup", function () {
  it("Setup USDT and PaymentChannel", async function () {
    const [signer] = await ethers.getSigners();
    console.log("Signer:", await signer.getAddress());

    const usdt = await ethers.deployContract("MockUSDT");
    const paymentChannel = await ethers.deployContract("PaymentChannel");
    const usdtAddress = await usdt.getAddress();

    const testAddr = await signer.getAddress();
    const before = await usdt.balanceOf(testAddr);

    // 铸造 10000 USDT 给测试账户
    const tx1 = await usdt.mint(testAddr, BigInt(10000) * BigInt(1e6));
    await tx1.wait();
    console.log("Minted 10000 USDT to:", testAddr);

    // 查询余额
    const balance = await usdt.balanceOf(testAddr);
    console.log("Test account USDT balance:", balance.toString());
    expect(balance - before).to.equal(10000n * 1_000_000n);

    // 设置 PaymentChannel 的 USDT 地址
    const tx2 = await paymentChannel.setUsdtToken(usdtAddress);
    await tx2.wait();
    console.log("USDT token set in PaymentChannel");

    // 确认设置成功
    const usdtTokenAddr = await paymentChannel.usdtToken();
    console.log("PaymentChannel usdtToken:", usdtTokenAddr);

    expect(await paymentChannel.usdtToken()).to.equal(usdtAddress);
  });
});
