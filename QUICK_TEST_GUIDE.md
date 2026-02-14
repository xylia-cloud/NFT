# 提现功能快速测试指南

## 部署信息

✅ 合约已成功部署到本地测试链！

### 合约地址
- **MockUSDT**: `0x5FbDB2315678afecb367f032d93F642f64180aa3`
- **MockXPL**: `0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512`
- **PaymentChannel**: `0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0`

### 网络信息
- **RPC URL**: `http://127.0.0.1:8546`
- **链 ID**: `31337`
- **网络名称**: `Hardhat Local`

### 测试账户

#### 账户 1（管理员）
- **地址**: `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`
- **私钥**: `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`
- **余额**:
  - Native XPL: 10,000
  - XPL Token: 100,000
  - USDT: 1,010,000

#### 账户 2
- **地址**: `0x70997970C51812dc3A010C7d01b50e0d17dc79C8`
- **私钥**: `0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d`
- **余额**:
  - Native XPL: 10,000
  - XPL Token: 100,000
  - USDT: 10,000

#### 账户 3
- **地址**: `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC`
- **私钥**: `0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a`
- **余额**:
  - Native XPL: 10,000
  - XPL Token: 100,000
  - USDT: 10,000

### PaymentChannel 合约余额
- **XPL Token**: 1,000,000（用于收益提现）

## 测试步骤

### 1. 在 MetaMask 中添加本地测试网络

1. 打开 MetaMask
2. 点击网络下拉菜单
3. 点击"添加网络"
4. 手动添加网络：
   - **网络名称**: Hardhat Local
   - **RPC URL**: `http://127.0.0.1:8546`
   - **链 ID**: `31337`
   - **货币符号**: XPL
5. 保存

### 2. 导入测试账户

1. 在 MetaMask 中点击账户图标
2. 选择"导入账户"
3. 粘贴上面的私钥（建议使用账户 2 或 3 进行测试）
4. 导入

### 3. 添加 XPL Token 到 MetaMask

1. 在 MetaMask 中点击"导入代币"
2. 选择"自定义代币"
3. 输入 XPL Token 地址: `0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512`
4. 代币符号会自动填充为 XPL
5. 点击"添加自定义代币"

### 4. 启动前端应用

```bash
cd frontend
pnpm dev
```

### 5. 测试提现功能

1. 打开浏览器访问前端应用
2. 连接 MetaMask 钱包（确保选择了 Hardhat Local 网络）
3. 进入"我的钱包"页面
4. 在提现区域输入金额（例如：500）
5. 点击"确认提现"按钮

### 6. 预期结果

#### 前端流程：
1. ✅ 调用后端 API `/Api/Wallet/profit_withdraw`
2. ✅ 后端返回签名数据
3. ✅ MetaMask 弹出交易确认
4. ✅ 显示转账的 XPL 数量（根据汇率计算）
5. ✅ 用户确认交易
6. ✅ 等待交易确认
7. ✅ 显示"提现成功"提示
8. ✅ 自动刷新钱包余额和提现记录

#### 合约事件：
- 触发 `XplWithdrawn` 事件
- 参数：用户地址、XPL 数量、USDT 价值、订单号

#### 后端流程：
- 监听 `XplWithdrawn` 事件
- 根据订单号更新提现订单状态

## 注意事项

### MetaMask 显示 0 XPL 是正常的
- 因为是从合约余额转账给用户，不是用户发送
- 实际转账的 XPL 数量在交易详情中可以看到
- 交易完成后，用户的 XPL Token 余额会增加

### 后端 API 模拟
目前后端 API 还未实现签名功能，前端调用会失败。需要后端：

1. **实现签名生成**:
```javascript
// 使用管理员私钥签名
const privateKey = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
const message = ethers.solidityPackedKeccak256(
  ['address', 'uint256', 'string', 'uint256', 'uint256', 'address'],
  [userAddress, xplAmount, orderId, nonce, chainId, contractAddress]
);
const signature = await wallet.signMessage(ethers.getBytes(message));
```

2. **返回签名数据**:
```json
{
  "transaction_id": "xxx",
  "fee": 0,
  "receipt_amount": 500,
  "amount": 500,
  "xpl_rate": 0.18,
  "xpl_amount": 2777.777778,
  "withdraw_signature": {
    "signature": "0x...",
    "nonce": "123456789",
    "amount_wei": "2777777778000000000000",
    "contract_address": "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0",
    "chain_id": 31337
  }
}
```

3. **监听合约事件**:
```javascript
const contract = new ethers.Contract(contractAddress, abi, provider);
contract.on('XplWithdrawn', (user, xplAmount, usdtValue, orderId) => {
  console.log('提现事件:', { user, xplAmount, usdtValue, orderId });
  // 更新订单状态
});
```

## 故障排查

### 问题 1: MetaMask 无法连接
- 确保本地测试链正在运行（`npm run node`）
- 检查 RPC URL 是否正确：`http://127.0.0.1:8546`
- 尝试重启 MetaMask

### 问题 2: 交易失败
- 检查账户是否有足够的 Native XPL 支付 Gas
- 检查合约地址是否正确
- 查看 MetaMask 错误信息

### 问题 3: 后端 API 调用失败
- 这是正常的，因为后端还未实现签名功能
- 需要等待后端实现签名生成逻辑

### 问题 4: 合约余额不足
- PaymentChannel 合约已预充 1,000,000 XPL
- 如果不够，可以使用以下命令铸造更多：
```bash
cd chain
node -e "
const ethers = require('ethers');
const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8546');
const wallet = new ethers.Wallet('0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80', provider);
const xplAddress = '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512';
const contractAddress = '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0';
const abi = ['function mint(address to, uint256 amount) external'];
const xpl = new ethers.Contract(xplAddress, abi, wallet);
xpl.mint(contractAddress, ethers.parseEther('1000000')).then(tx => tx.wait()).then(() => console.log('铸造成功'));
"
```

## 下一步

1. ✅ 前端已完成更新
2. ✅ 合约已部署并配置
3. ⏳ 等待后端实现签名功能
4. ⏳ 后端实现事件监听
5. ⏳ 完整的端到端测试

## 相关文档

- 详细更新说明：`WITHDRAW_UPDATE.md`
- 合约源码：`chain/contracts/PaymentChannel.sol`
- 前端提现组件：`frontend/src/components/features/withdraw/WithdrawView.tsx`
- 后端签名示例：`chain/examples/backend-withdraw-signature.js`
