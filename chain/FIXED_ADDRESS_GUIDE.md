# 固定合约地址指南

## 问题
每次重启 Hardhat 测试链后，合约地址会改变，需要重新配置前端和后端。

## 解决方案
使用固定的助记词（mnemonic）来确保每次启动 Hardhat 节点时，账户和合约地址保持一致。

## 配置说明

### 1. 固定助记词
在 `hardhat.config.ts` 中已配置固定助记词：
```typescript
const FIXED_MNEMONIC = "test test test test test test test test test test test junk";
```

这是 Hardhat 的默认测试助记词，会生成固定的账户地址。

### 2. 固定的账户地址
使用固定助记词后，前 3 个账户地址始终为：

| 账户 | 地址 | 私钥 |
|------|------|------|
| 账户 0 | `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266` | `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80` |
| 账户 1 | `0x70997970C51812dc3A010C7d01b50e0d17dc79C8` | `0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d` |
| 账户 2 | `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC` | `0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a` |

### 3. 固定的合约地址
由于账户地址固定，且部署顺序固定，合约地址也会保持一致：

| 合约 | 地址 |
|------|------|
| MockUSDT | `0x5FbDB2315678afecb367f032d93F642f64180aa3` |
| MockXPL | `0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512` |
| PaymentChannel | `0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0` |

## 使用步骤

### 1. 启动 Hardhat 节点
```bash
cd chain
npm run node
```

### 2. 部署合约（新终端）
```bash
cd chain
npm run deploy:local
```

### 3. 验证合约地址
部署完成后，检查输出的合约地址是否与上表一致。

## 重要说明

### ⚠️ 注意事项
1. **必须按顺序部署**：合约地址取决于部署顺序，必须按照 `deploy-local.mjs` 中的顺序部署
2. **不要修改部署脚本**：修改部署顺序会导致合约地址改变
3. **清空区块链数据**：如果需要完全重置，删除 Hardhat 的缓存目录后重新启动

### 🔄 重启流程
每次电脑重启后：
1. 启动 Hardhat 节点：`npm run node`
2. 部署合约：`npm run deploy:local`
3. 合约地址保持不变，无需修改前端和后端配置

### 📝 配置文件
合约地址已保存在：
- `chain/local-testnet-config.json` - 本地配置文件
- `frontend/src/wagmiConfig.ts` - 前端配置
- 后端配置文件（根据后端项目而定）

## 故障排除

### 问题：合约地址仍然改变
**原因**：可能是部署顺序改变或使用了不同的账户

**解决方案**：
1. 确保使用 `npm run deploy:local` 部署
2. 检查 `deploy-local.mjs` 中的部署顺序
3. 确认 `hardhat.config.ts` 中的助记词未被修改

### 问题：部署失败
**原因**：Hardhat 节点未启动或端口被占用

**解决方案**：
1. 确保 Hardhat 节点正在运行（`npm run node`）
2. 检查端口 8546 是否被占用
3. 如果端口被占用，修改 `hardhat.config.ts` 中的端口号

## 技术原理

### 为什么地址会固定？
1. **确定性派生**：以太坊账户地址由助记词通过 BIP-44 标准确定性派生
2. **固定 nonce**：合约地址 = keccak256(部署者地址 + nonce)
3. **相同顺序**：每次部署顺序相同，nonce 相同，合约地址相同

### 助记词路径
```
m/44'/60'/0'/0/0  -> 账户 0
m/44'/60'/0'/0/1  -> 账户 1
m/44'/60'/0'/0/2  -> 账户 2
...
```

## 安全提示

⚠️ **警告**：这个助记词仅用于本地测试，切勿在生产环境或主网使用！

这是 Hardhat 的公开测试助记词，任何人都知道对应的私钥。在生产环境中必须使用安全的助记词。
