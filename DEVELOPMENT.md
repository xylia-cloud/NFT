# 开发指南

## 🚀 快速开发流程

### 第一步：启动本地节点（终端1）

```bash
cd contracts
npm run node
```

**保持这个终端窗口打开**，你会看到：
- 节点运行在 `http://127.0.0.1:8545`
- 20个测试账户及其私钥
- 每个账户有 10000 ETH

### 第二步：部署智能合约（新终端2）

```bash
cd contracts

# 方式1: 仅部署合约
npm run deploy:local

# 方式2: 部署并自动更新前端配置（推荐）
npm run deploy:full
```

部署成功后，你会看到：
- 合约地址
- 部署信息已保存到 `deployment.json`
- 前端配置已自动更新（如果使用 `deploy:full`）

### 第三步：配置MetaMask

> 📖 **详细步骤请查看 [METAMASK_SETUP.md](./METAMASK_SETUP.md)**

**快速步骤**：

1. **添加本地网络**：
   - 打开MetaMask → 点击网络下拉菜单 → "添加网络" → "手动添加网络"
   - 填写信息：
     ```
     网络名称: Hardhat Local
     RPC URL: http://127.0.0.1:8545
     链ID: 1337
     货币符号: ETH
     ```
   - 点击"保存"

2. **导入测试账户**：
   - 从终端1中复制 Account #0 的私钥：`0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`
   - MetaMask → 账户图标 → "导入账户" → 粘贴私钥 → 导入
   - 验证余额应该显示 10000 ETH

### 第四步：启动前端应用（新终端3）

```bash
cd frontend
npm start
```

前端会在 `http://localhost:3000` 自动打开。

### 第五步：测试功能

1. **连接钱包**：
   - 在浏览器中打开应用
   - 点击"连接钱包"按钮
   - 在MetaMask中确认连接

2. **铸造NFT**：
   - 输入Token URI（例如：`https://example.com/token/1`）
   - 点击"铸造NFT"
   - 在MetaMask中确认交易

3. **查看结果**：
   - 等待交易确认
   - 查看NFT总数更新
   - 查看你的NFT列表

## 📝 开发工作流

### 修改智能合约后

```bash
cd contracts

# 1. 重新编译
npm run compile

# 2. 重新部署（会自动更新前端）
npm run deploy:full

# 3. 如果前端正在运行，刷新浏览器即可
```

### 修改前端代码后

前端使用热重载，保存文件后会自动刷新。

### 运行测试

```bash
cd contracts
npm test
```

## 🔧 常用命令

### 合约相关

```bash
cd contracts

# 编译合约
npm run compile

# 运行测试
npm test

# 启动本地节点
npm run node

# 部署到本地网络
npm run deploy:local

# 部署并更新前端
npm run deploy:full
```

### 前端相关

```bash
cd frontend

# 启动开发服务器
npm start

# 构建生产版本
npm run build
```

## 🐛 常见问题

### 1. 合约部署失败

**问题**: 部署时提示网络错误

**解决**:
- 确保本地节点正在运行（终端1）
- 检查节点是否在 `http://127.0.0.1:8545`
- 尝试重启节点

### 2. 前端无法连接钱包

**问题**: 点击连接钱包没有反应

**解决**:
- 确保已安装MetaMask
- 确保MetaMask连接到正确的网络（Hardhat Local）
- 检查浏览器控制台是否有错误

### 3. 交易失败

**问题**: 铸造NFT时交易失败

**解决**:
- 确保账户有足够的ETH（测试账户应该有10000 ETH）
- 检查合约地址是否正确
- 查看MetaMask中的错误信息

### 4. 前端显示旧的合约地址

**问题**: 重新部署后前端仍使用旧地址

**解决**:
```bash
cd contracts
npm run deploy:full  # 这会自动更新前端配置
```

或者手动更新：
1. 查看 `contracts/deployment.json` 获取新地址
2. 更新 `frontend/src/App.js` 中的 `CONTRACT_ADDRESS`
3. 更新 `frontend/src/contracts/NFT.json` 中的 `abi`

## 📚 下一步开发

- [ ] 添加NFT元数据存储（IPFS）
- [ ] 实现NFT交易市场
- [ ] 添加NFT展示画廊
- [ ] 实现批量铸造
- [ ] 添加权限管理
- [ ] 集成更多钱包

## 💡 开发提示

1. **保持节点运行**: 开发时保持 `npm run node` 终端打开
2. **使用测试账户**: 使用Hardhat提供的测试账户，不要使用真实钱包
3. **查看日志**: 关注终端和浏览器控制台的输出
4. **测试驱动**: 先写测试，再实现功能
5. **版本控制**: 定期提交代码，特别是部署信息

