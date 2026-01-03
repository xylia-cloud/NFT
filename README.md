# NFT DApp 项目

一个基于 Solidity 和 React 的区块链去中心化应用（DApp）项目。

## 技术栈

- **智能合约**: Solidity 0.8.20
- **开发框架**: Hardhat
- **前端**: React 18
- **Web3库**: Ethers.js 6.x
- **NFT标准**: ERC-721 (OpenZeppelin)

## 项目结构

```
NFT/
├── contracts/          # 智能合约目录
│   ├── contracts/      # Solidity合约文件
│   ├── scripts/        # 部署脚本
│   ├── test/           # 测试文件
│   └── hardhat.config.js
├── frontend/           # React前端应用
│   ├── src/
│   │   ├── App.js      # 主应用组件
│   │   └── contracts/  # 合约ABI
│   └── public/
└── README.md
```

## 快速开始

### 1. 安装依赖

```bash
# 安装根目录依赖
npm install

# 安装所有子项目依赖（包括合约和前端）
npm run install:all
```

或者分别安装：

```bash
# 安装合约依赖
cd contracts
npm install

# 安装前端依赖
cd ../frontend
npm install
```

### 2. 编译智能合约

```bash
cd contracts
npm run compile
```

### 3. 启动本地区块链节点

在一个终端窗口中运行：

```bash
cd contracts
npm run node
```

这将启动一个本地的Hardhat网络，默认运行在 `http://127.0.0.1:8545`

### 4. 部署智能合约

在另一个终端窗口中运行：

```bash
cd contracts
npm run deploy:local
```

部署成功后，会生成 `deployment.json` 文件，其中包含合约地址。

**重要**: 将部署得到的合约地址更新到 `frontend/src/App.js` 中的 `CONTRACT_ADDRESS` 变量。

同时，将 `contracts/artifacts/contracts/NFT.sol/NFT.json` 中的 `abi` 复制到 `frontend/src/contracts/NFT.json` 中。

### 5. 配置MetaMask

1. 打开MetaMask钱包
2. 添加网络：
   - 网络名称: Hardhat Local
   - RPC URL: http://127.0.0.1:8545
   - 链ID: 1337
   - 货币符号: ETH
3. 导入测试账户（Hardhat会提供10个测试账户，私钥在终端输出中）

### 6. 启动前端应用

```bash
cd frontend
npm start
```

应用将在 `http://localhost:3000` 启动。

## 功能特性

- ✅ ERC-721 NFT标准实现
- ✅ 钱包连接（MetaMask）
- ✅ NFT铸造功能
- ✅ NFT查询功能
- ✅ 现代化的React UI界面

## 开发说明

### 运行测试

```bash
cd contracts
npm test
```

### 合约功能

- `mintNFT(address to, string tokenURI)`: 铸造新的NFT
- `totalSupply()`: 获取已铸造的NFT总数
- `balanceOf(address owner)`: 获取指定地址拥有的NFT数量

## 注意事项

1. **合约地址**: 每次重新部署合约后，需要更新前端中的合约地址
2. **合约ABI**: 编译合约后，需要将ABI复制到前端项目中
3. **网络配置**: 确保MetaMask连接到正确的网络（本地Hardhat网络）
4. **Gas费用**: 本地网络不需要真实的ETH，但需要确保账户有足够的测试ETH

## 下一步开发建议

- [ ] 添加NFT元数据存储（IPFS集成）
- [ ] 实现NFT交易功能
- [ ] 添加NFT展示画廊
- [ ] 实现批量铸造功能
- [ ] 添加权限管理
- [ ] 集成更多钱包（WalletConnect等）

## 许可证

MIT

