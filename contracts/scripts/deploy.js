const hre = require("hardhat");

async function main() {
  console.log("开始部署NFT合约...");

  // 获取合约工厂
  const NFT = await hre.ethers.getContractFactory("NFT");
  
  // 部署合约
  const nft = await NFT.deploy();
  
  await nft.waitForDeployment();
  
  const address = await nft.getAddress();
  console.log("NFT合约已部署到:", address);
  
  // 保存部署信息
  const fs = require("fs");
  const deploymentInfo = {
    address: address,
    network: hre.network.name,
    deployer: (await hre.ethers.getSigners())[0].address,
    timestamp: new Date().toISOString()
  };
  
  fs.writeFileSync(
    "./deployment.json",
    JSON.stringify(deploymentInfo, null, 2)
  );
  
  console.log("部署信息已保存到 deployment.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

