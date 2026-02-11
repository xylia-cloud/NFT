import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.connect();

describe("PaymentChannel", function () {
  it("Should deposit and update balance", async function () {
    const paymentChannel = await ethers.deployContract("PaymentChannel");
    const [owner, addr1] = await ethers.getSigners();
    
    const depositAmount = ethers.parseEther("1.0");
    const orderId = "ORDER-" + Date.now();
    await paymentChannel.connect(addr1).deposit(orderId, { value: depositAmount });
    
    expect(await paymentChannel.balances(addr1.address)).to.equal(depositAmount);
  });
  
  it("Should withdraw and reduce balance", async function () {
    const paymentChannel = await ethers.deployContract("PaymentChannel");
    const [owner, addr1] = await ethers.getSigners();
    
    const depositAmount = ethers.parseEther("2.0");
    const depositOrderId = "DEPOSIT-" + Date.now();
    await paymentChannel.connect(addr1).deposit(depositOrderId, { value: depositAmount });
    
    const withdrawAmount = ethers.parseEther("1.0");
    const withdrawOrderId = "WITHDRAW-" + Date.now();
    await paymentChannel.connect(addr1).withdraw(withdrawAmount, withdrawOrderId);
    
    expect(await paymentChannel.balances(addr1.address)).to.equal(depositAmount - withdrawAmount);
  });
  
  it("Should not allow withdrawal exceeding balance", async function () {
    const paymentChannel = await ethers.deployContract("PaymentChannel");
    const [owner, addr1] = await ethers.getSigners();
    
    const depositAmount = ethers.parseEther("0.5");
    const depositOrderId = "DEPOSIT-" + Date.now();
    await paymentChannel.connect(addr1).deposit(depositOrderId, { value: depositAmount });
    
    const withdrawAmount = ethers.parseEther("1.0");
    const withdrawOrderId = "WITHDRAW-" + Date.now();
    await expect(paymentChannel.connect(addr1).withdraw(withdrawAmount, withdrawOrderId)).to.be.revertedWith("Insufficient balance");
  });
  
  it("Should emit Deposited event on deposit", async function () {
    const paymentChannel = await ethers.deployContract("PaymentChannel");
    const [owner, addr1] = await ethers.getSigners();
    
    const depositAmount = ethers.parseEther("0.1");
    const orderId = "ORDER-" + Date.now();
    await expect(paymentChannel.connect(addr1).deposit(orderId, { value: depositAmount }))
      .to.emit(paymentChannel, "Deposited")
      .withArgs(addr1.address, depositAmount, orderId);
  });
  
  it("Should emit Withdrawn event on withdraw", async function () {
    const paymentChannel = await ethers.deployContract("PaymentChannel");
    const [owner, addr1] = await ethers.getSigners();
    
    const depositAmount = ethers.parseEther("0.2");
    const depositOrderId = "DEPOSIT-" + Date.now();
    await paymentChannel.connect(addr1).deposit(depositOrderId, { value: depositAmount });
    
    const withdrawAmount = ethers.parseEther("0.1");
    const withdrawOrderId = "WITHDRAW-" + Date.now();
    await expect(paymentChannel.connect(addr1).withdraw(withdrawAmount, withdrawOrderId))
      .to.emit(paymentChannel, "Withdrawn")
      .withArgs(addr1.address, withdrawAmount, withdrawOrderId);
  });
  
  it("Should require order ID for deposit", async function () {
    const paymentChannel = await ethers.deployContract("PaymentChannel");
    const [owner, addr1] = await ethers.getSigners();
    
    const depositAmount = ethers.parseEther("0.1");
    await expect(paymentChannel.connect(addr1).deposit("", { value: depositAmount }))
      .to.be.revertedWith("Order ID is required");
  });
});