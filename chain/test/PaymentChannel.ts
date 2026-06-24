import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.connect();

describe("PaymentChannel", function () {
  async function deployWithAave() {
    const paymentChannel = await ethers.deployContract("PaymentChannel");
    const usdt = await ethers.deployContract("MockUSDT");
    const mockAToken = await ethers.deployContract("MockAToken");
    const mockPool = await ethers.deployContract("MockAavePool", [
      await usdt.getAddress(),
      await mockAToken.getAddress(),
    ]);
    await mockAToken.setPool(await mockPool.getAddress());

    await paymentChannel.setUsdtToken(await usdt.getAddress());
    await paymentChannel.setAUsdtToken(await mockAToken.getAddress());
    await paymentChannel.setAavePool(await mockPool.getAddress());

    return { paymentChannel, usdt, mockAToken, mockPool };
  }

  async function signUsdtWithdraw(
    owner: any,
    user: string,
    amount: bigint,
    orderId: string,
    nonce: bigint,
    deadline: bigint,
    contractAddress: string
  ) {
    const chainId = (await ethers.provider.getNetwork()).chainId;
    const messageHash = ethers.solidityPackedKeccak256(
      ["address", "uint256", "string", "uint256", "uint256", "uint256", "address"],
      [user, amount, orderId, nonce, deadline, chainId, contractAddress]
    );
    return owner.signMessage(ethers.getBytes(messageHash));
  }

  it("Should deposit and update balance", async function () {
    const paymentChannel = await ethers.deployContract("PaymentChannel");
    const [, addr1] = await ethers.getSigners();

    const depositAmount = ethers.parseEther("1.0");
    const orderId = "ORDER-" + Date.now();
    await paymentChannel.connect(addr1).deposit(orderId, { value: depositAmount });

    expect(await paymentChannel.balances(addr1.address)).to.equal(depositAmount);
  });

  it("Should deposit USDT and supply to Aave", async function () {
    const { paymentChannel, usdt, mockAToken } = await deployWithAave();
    const [, user] = await ethers.getSigners();

    const amount = 1000n * 1_000_000n;
    const orderId = "DEPOSIT-" + Date.now();
    await usdt.mint(user.address, amount);
    await usdt.connect(user).approve(await paymentChannel.getAddress(), amount);

    await expect(paymentChannel.connect(user).depositUsdt(amount, orderId))
      .to.emit(paymentChannel, "USDTDeposited")
      .withArgs(user.address, amount, orderId)
      .and.to.emit(paymentChannel, "SuppliedToAave")
      .withArgs(user.address, amount, orderId);

    expect(await paymentChannel.balances(user.address)).to.equal(amount);
    expect(await mockAToken.balanceOf(await paymentChannel.getAddress())).to.equal(amount);
    expect(await paymentChannel.getTotalUsdtManaged()).to.equal(amount);
  });

  it("Should withdraw USDT from Aave with owner signature", async function () {
    const { paymentChannel, usdt } = await deployWithAave();
    const [owner, user] = await ethers.getSigners();

    const amount = 1000n * 1_000_000n;
    const orderId = "WITHDRAW-" + Date.now();
    await usdt.mint(user.address, amount);
    await usdt.connect(user).approve(await paymentChannel.getAddress(), amount);
    await paymentChannel.connect(user).depositUsdt(amount, orderId);

    const nonce = 1n;
    const latestBlock = await ethers.provider.getBlock("latest");
    const deadline = BigInt((latestBlock?.timestamp ?? Math.floor(Date.now() / 1000)) + 480);
    const signature = await signUsdtWithdraw(
      owner,
      user.address,
      amount,
      orderId,
      nonce,
      deadline,
      await paymentChannel.getAddress()
    );

    const before = await usdt.balanceOf(user.address);
    await expect(
      paymentChannel.connect(user).withdrawWithSignature(amount, orderId, nonce, deadline, signature)
    )
      .to.emit(paymentChannel, "Withdrawn")
      .withArgs(user.address, amount, orderId, nonce)
      .and.to.emit(paymentChannel, "WithdrawnFromAave")
      .withArgs(user.address, amount, orderId, nonce);

    const after = await usdt.balanceOf(user.address);
    expect(after - before).to.equal(amount);
    expect(await paymentChannel.getTotalUsdtManaged()).to.equal(0n);
  });

  it("Should reject invalid signature", async function () {
    const { paymentChannel, usdt } = await deployWithAave();
    const [, addr1, addr2] = await ethers.getSigners();

    const amount = 1000n * 1_000_000n;
    const orderId = "BAD-SIG-" + Date.now();
    await usdt.mint(addr1.address, amount);
    await usdt.connect(addr1).approve(await paymentChannel.getAddress(), amount);
    await paymentChannel.connect(addr1).depositUsdt(amount, orderId);

    const nonce = 1n;
    const latestBlock = await ethers.provider.getBlock("latest");
    const deadline = BigInt((latestBlock?.timestamp ?? Math.floor(Date.now() / 1000)) + 480);
    const badSig = await signUsdtWithdraw(
      addr2,
      addr1.address,
      amount,
      orderId,
      nonce,
      deadline,
      await paymentChannel.getAddress()
    );

    await expect(
      paymentChannel.connect(addr1).withdrawWithSignature(amount, orderId, nonce, deadline, badSig)
    ).to.be.revertedWith("Invalid signature");
  });

  it("Should emit Deposited event on deposit", async function () {
    const paymentChannel = await ethers.deployContract("PaymentChannel");
    const [, addr1] = await ethers.getSigners();

    const depositAmount = ethers.parseEther("0.1");
    const orderId = "ORDER-" + Date.now();
    await expect(paymentChannel.connect(addr1).deposit(orderId, { value: depositAmount }))
      .to.emit(paymentChannel, "Deposited")
      .withArgs(addr1.address, depositAmount, orderId);
  });

  it("Should prevent replay for same signature", async function () {
    const { paymentChannel, usdt } = await deployWithAave();
    const [owner, addr1] = await ethers.getSigners();

    const amount = 500n * 1_000_000n;
    const orderId = "REPLAY-" + Date.now();
    await usdt.mint(addr1.address, amount);
    await usdt.connect(addr1).approve(await paymentChannel.getAddress(), amount);
    await paymentChannel.connect(addr1).depositUsdt(amount, orderId);

    const nonce = 7n;
    const latestBlock = await ethers.provider.getBlock("latest");
    const deadline = BigInt((latestBlock?.timestamp ?? Math.floor(Date.now() / 1000)) + 480);
    const signature = await signUsdtWithdraw(
      owner,
      addr1.address,
      amount,
      orderId,
      nonce,
      deadline,
      await paymentChannel.getAddress()
    );

    await paymentChannel.connect(addr1).withdrawWithSignature(amount, orderId, nonce, deadline, signature);
    await expect(
      paymentChannel.connect(addr1).withdrawWithSignature(amount, orderId, nonce, deadline, signature)
    ).to.be.revertedWith("Nonce already used");
  });

  it("Should reject expired signature", async function () {
    const { paymentChannel, usdt } = await deployWithAave();
    const [owner, addr1] = await ethers.getSigners();

    const amount = 100n * 1_000_000n;
    const orderId = "EXPIRED-" + Date.now();
    await usdt.mint(addr1.address, amount);
    await usdt.connect(addr1).approve(await paymentChannel.getAddress(), amount);
    await paymentChannel.connect(addr1).depositUsdt(amount, orderId);

    const nonce = 9n;
    const latestBlock = await ethers.provider.getBlock("latest");
    const expiredDeadline = BigInt((latestBlock?.timestamp ?? Math.floor(Date.now() / 1000)) - 1);
    const signature = await signUsdtWithdraw(
      owner,
      addr1.address,
      amount,
      orderId,
      nonce,
      expiredDeadline,
      await paymentChannel.getAddress()
    );

    await expect(
      paymentChannel.connect(addr1).withdrawWithSignature(amount, orderId, nonce, expiredDeadline, signature)
    ).to.be.revertedWith("Signature expired");
  });

  it("Should require order ID for deposit", async function () {
    const paymentChannel = await ethers.deployContract("PaymentChannel");
    const [, addr1] = await ethers.getSigners();

    const depositAmount = ethers.parseEther("0.1");
    await expect(paymentChannel.connect(addr1).deposit("", { value: depositAmount }))
      .to.be.revertedWith("Order ID is required");
  });

  it("Should emergency withdraw USDT from Aave", async function () {
    const { paymentChannel, usdt } = await deployWithAave();
    const [owner, user] = await ethers.getSigners();

    const amount = 2000n * 1_000_000n;
    const orderId = "EMERGENCY-" + Date.now();
    await usdt.mint(user.address, amount);
    await usdt.connect(user).approve(await paymentChannel.getAddress(), amount);
    await paymentChannel.connect(user).depositUsdt(amount, orderId);

    const ownerBefore = await usdt.balanceOf(owner.address);
    await expect(paymentChannel.connect(owner).emergencyWithdrawUsdt(0))
      .to.emit(paymentChannel, "EmergencyUsdtWithdrawn")
      .withArgs(owner.address, amount);

    const ownerAfter = await usdt.balanceOf(owner.address);
    expect(ownerAfter - ownerBefore).to.equal(amount);
    expect(await paymentChannel.getTotalUsdtManaged()).to.equal(0n);
  });

  it("Should emergency withdraw USDT to arbitrary address", async function () {
    const { paymentChannel, usdt } = await deployWithAave();
    const [owner, user, recipient] = await ethers.getSigners();

    const amount = 1500n * 1_000_000n;
    const orderId = "EMERGENCY-TO-" + Date.now();
    await usdt.mint(user.address, amount);
    await usdt.connect(user).approve(await paymentChannel.getAddress(), amount);
    await paymentChannel.connect(user).depositUsdt(amount, orderId);

    const recipientBefore = await usdt.balanceOf(recipient.address);
    await expect(paymentChannel.connect(owner).emergencyWithdrawUsdtTo(recipient.address, amount))
      .to.emit(paymentChannel, "EmergencyUsdtWithdrawn")
      .withArgs(recipient.address, amount);

    const recipientAfter = await usdt.balanceOf(recipient.address);
    expect(recipientAfter - recipientBefore).to.equal(amount);
    expect(await paymentChannel.getTotalUsdtManaged()).to.equal(0n);
  });
});
