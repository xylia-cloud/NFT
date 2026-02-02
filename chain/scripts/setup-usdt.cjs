const hre = require("hardhat");

async function main() {
  const [signer] = await hre.ethers.getSigners();
  console.log("Signer:", signer.address);

  // USDT 合约地址
  const usdtAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
  const usdt = await hre.ethers.getContractAt("MockUSDT", usdtAddress);

  // 测试账户地址
  const testAddr = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";

  // 铸造 10000 USDT 给测试账户
  const tx1 = await usdt.mint(testAddr, BigInt(10000) * BigInt(1e6));
  await tx1.wait();
  console.log("Minted 10000 USDT to:", testAddr);

  // 查询余额
  const balance = await usdt.balanceOf(testAddr);
  console.log("Test account USDT balance:", balance.toString());

  // 设置 PaymentChannel 的 USDT 地址
  const paymentChannelAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const paymentChannel = await hre.ethers.getContractAt("PaymentChannel", paymentChannelAddress);

  const tx2 = await paymentChannel.setUsdtToken(usdtAddress);
  await tx2.wait();
  console.log("USDT token set in PaymentChannel");

  // 确认设置成功
  const usdtTokenAddr = await paymentChannel.usdtToken();
  console.log("PaymentChannel usdtToken:", usdtTokenAddr);
}

main().catch(console.error);
