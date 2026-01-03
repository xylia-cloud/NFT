const fs = require("fs");
const path = require("path");

// 读取部署信息
const deploymentPath = path.join(__dirname, "../deployment.json");
if (!fs.existsSync(deploymentPath)) {
  console.error("错误: 找不到 deployment.json 文件，请先部署合约");
  process.exit(1);
}

const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
const contractAddress = deployment.address;

// 读取合约ABI
const artifactPath = path.join(__dirname, "../artifacts/contracts/NFT.sol/NFT.json");
if (!fs.existsSync(artifactPath)) {
  console.error("错误: 找不到合约编译文件，请先运行 npm run compile");
  process.exit(1);
}

const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
const abi = artifact.abi;

// 更新前端App.js中的合约地址
const frontendAppPath = path.join(__dirname, "../../frontend/src/App.js");
if (fs.existsSync(frontendAppPath)) {
  let appContent = fs.readFileSync(frontendAppPath, "utf8");
  // 替换合约地址
  appContent = appContent.replace(
    /const CONTRACT_ADDRESS = ['"][^'"]*['"];.*/,
    `const CONTRACT_ADDRESS = '${contractAddress}'; // 自动更新`
  );
  fs.writeFileSync(frontendAppPath, appContent);
  console.log("✅ 已更新 frontend/src/App.js 中的合约地址");
} else {
  console.warn("⚠️  未找到 frontend/src/App.js，请手动更新合约地址");
}

// 更新前端NFT.json中的ABI
const frontendContractPath = path.join(__dirname, "../../frontend/src/contracts/NFT.json");
if (fs.existsSync(frontendContractPath)) {
  const contractJson = {
    abi: abi,
    address: contractAddress,
    network: deployment.network
  };
  fs.writeFileSync(frontendContractPath, JSON.stringify(contractJson, null, 2));
  console.log("✅ 已更新 frontend/src/contracts/NFT.json 中的ABI");
} else {
  console.warn("⚠️  未找到 frontend/src/contracts/NFT.json");
}

console.log("\n📋 部署信息:");
console.log(`   合约地址: ${contractAddress}`);
console.log(`   网络: ${deployment.network}`);
console.log(`   部署者: ${deployment.deployer}`);
console.log("\n✨ 前端配置已自动更新！");

