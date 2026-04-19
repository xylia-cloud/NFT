import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.connect();

describe("PaymentChannel", function () {
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
  
  it("Should withdraw USDT with owner signature", async function () {
    const paymentChannel = await ethers.deployContract("PaymentChannel");
    const usdt = await ethers.deployContract("MockUSDT");
    const [owner, addr1] = await ethers.getSigners();

    await paymentChannel.setUsdtToken(await usdt.getAddress());
    await usdt.mint(await paymentChannel.getAddress(), 10_000n * 1_000_000n);

    const amount = 1000n * 1_000_000n;
    const orderId = "WITHDRAW-" + Date.now();
    const nonce = 1n;
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

    const before = await usdt.balanceOf(addr1.address);
    await expect(
      paymentChannel.connect(addr1).withdrawWithSignature(amount, orderId, nonce, deadline, signature)
    )
      .to.emit(paymentChannel, "Withdrawn")
      .withArgs(addr1.address, amount, orderId, nonce);
    const after = await usdt.balanceOf(addr1.address);

    expect(after - before).to.equal(amount);
  });
  
  it("Should reject invalid signature", async function () {
    const paymentChannel = await ethers.deployContract("PaymentChannel");
    const usdt = await ethers.deployContract("MockUSDT");
    const [, addr1, addr2] = await ethers.getSigners();

    await paymentChannel.setUsdtToken(await usdt.getAddress());
    await usdt.mint(await paymentChannel.getAddress(), 10_000n * 1_000_000n);

    const amount = 1000n * 1_000_000n;
    const orderId = "BAD-SIG-" + Date.now();
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
    const paymentChannel = await ethers.deployContract("PaymentChannel");
    const usdt = await ethers.deployContract("MockUSDT");
    const [owner, addr1] = await ethers.getSigners();

    await paymentChannel.setUsdtToken(await usdt.getAddress());
    await usdt.mint(await paymentChannel.getAddress(), 10_000n * 1_000_000n);

    const amount = 500n * 1_000_000n;
    const orderId = "REPLAY-" + Date.now();
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
    const paymentChannel = await ethers.deployContract("PaymentChannel");
    const usdt = await ethers.deployContract("MockUSDT");
    const [owner, addr1] = await ethers.getSigners();

    await paymentChannel.setUsdtToken(await usdt.getAddress());
    await usdt.mint(await paymentChannel.getAddress(), 10_000n * 1_000_000n);

    const amount = 100n * 1_000_000n;
    const orderId = "EXPIRED-" + Date.now();
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
});
