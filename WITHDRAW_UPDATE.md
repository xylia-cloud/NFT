# 提现功能更新说明

## 更新时间
2026-02-13

## 更新内容

### 1. 合约更新（PaymentChannel v2）

#### 新增功能
- **收益提现（XPL）**: `withdrawXplWithSignature` - 使用签名验证，转 XPL token
- **本金提现（USDT）**: `withdrawWithSignature` - 使用签名验证，转 USDT token
- **XPL Token 支持**: 新增 `xplToken` 状态变量和 `setXplToken` 配置方法

#### 安全机制
- **签名验证**: 后端使用管理员私钥签名，合约验证签名
- **防重放攻击**: 使用 nonce 和 usedSignatures mapping
- **跨链保护**: 签名包含 chainId 和 contractAddress

#### 签名消息格式
```solidity
keccak256(abi.encodePacked(user, amount, orderId, nonce, chainId, contractAddress))
```

### 2. 后端接口变更

#### 收益提现接口
**接口**: `POST /Api/Wallet/profit_withdraw`

**请求参数**:
```json
{
  "amount": "500"
}
```

**响应数据**:
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
    "contract_address": "0x...",
    "chain_id": 56
  }
}
```

#### 本金提现接口
**接口**: `POST /Api/Recharge/withdraw`

**响应数据**:
```json
{
  "transaction_id": "RI20260213-xxxx-1234",
  "fee": 0,
  "mum": 1000,
  "withdraw_signature": {
    "signature": "0x...",
    "nonce": "123456789",
    "amount_wei": "1000000000",
    "contract_address": "0x...",
    "chain_id": 56
  }
}
```

### 3. 前端更新

#### 合约调用变更

**收益提现** - 调用 `withdrawXplWithSignature`:
```typescript
await contract.withdrawXplWithSignature(
  amount_wei,        // withdraw_signature.amount_wei (XPL 数量，18位精度)
  usdtValueWei,      // receipt_amount 转 wei（6位精度）
  transaction_id,    // 订单号
  nonce,             // withdraw_signature.nonce
  signature          // withdraw_signature.signature
)
```

**本金提现** - 调用 `withdrawWithSignature`:
```typescript
await contract.withdrawWithSignature(
  amount_wei,        // withdraw_signature.amount_wei (USDT，6位精度)
  transaction_id,    // 订单号
  nonce,
  signature
)
```

#### 流程简化
- ✅ 移除了 `confirmWithdraw` 调用（后端监听合约事件）
- ✅ 交易确认后直接显示成功提示
- ✅ 自动刷新钱包信息和提现记录

### 4. 部署更新

#### 新增 XPL Token
- 部署 MockXPL 合约（使用 MockUSDT 合约代码）
- 配置 PaymentChannel 的 xplToken 地址
- 给 PaymentChannel 合约预充 1,000,000 XPL 用于提现

#### 部署命令
```bash
cd chain
npm run deploy:local
```

#### 部署后配置
1. 更新前端 `wagmiConfig.ts` 中的 `paymentChannelAddress`
2. 后端使用 `local-testnet-config.json` 中的配置
3. 后端使用 `adminAccount.privateKey` 进行签名

## 测试步骤

### 1. 启动本地测试链
```bash
cd chain
npm run node
```

### 2. 部署合约
```bash
cd chain
npm run deploy:local
```

### 3. 更新前端配置
编辑 `frontend/src/wagmiConfig.ts`，更新 `paymentChannelAddress` 为部署输出的地址。

### 4. 测试收益提现
1. 连接钱包
2. 进入"我的钱包"页面
3. 输入提现金额
4. 点击"确认提现"
5. MetaMask 弹出交易确认（显示 XPL 数量）
6. 确认交易
7. 等待交易完成
8. 查看提现记录

## 注意事项

1. **MetaMask 显示 0 XPL 是正常的**
   - 因为是从合约余额转账，不是用户发送
   - 实际转账的 XPL 数量在交易详情中可以看到

2. **后端监听合约事件**
   - 后端会监听 `XplWithdrawn` 和 `Withdrawn` 事件
   - 前端不需要调用 `confirmWithdraw`

3. **签名验证**
   - 后端必须使用管理员私钥签名
   - 签名消息格式必须严格按照合约要求
   - nonce 必须唯一，防止重放攻击

4. **合约余额**
   - PaymentChannel 合约需要有足够的 XPL 余额用于收益提现
   - PaymentChannel 合约需要有足够的 USDT 余额用于本金提现
   - 部署脚本已自动给合约充值 1,000,000 XPL

## 文件变更清单

### 合约
- ✅ `chain/contracts/PaymentChannel.sol` - 更新为 v2 版本
- ✅ `chain/package.json` - 添加 @openzeppelin/contracts 依赖
- ❌ `chain/contracts/PaymentChannelV2.sol` - 已删除（合并到 PaymentChannel.sol）

### 前端
- ✅ `frontend/src/wagmiConfig.ts` - 更新 ABI，添加新函数
- ✅ `frontend/src/components/features/withdraw/WithdrawView.tsx` - 更新提现逻辑
- ✅ `frontend/src/lib/api.ts` - 添加签名相关类型定义

### 部署脚本
- ✅ `chain/scripts/deploy-local.mjs` - 添加 XPL token 部署和配置

## 后续工作

1. **本金提现功能**（如需要）
   - 创建本金提现组件
   - 调用 `capitalWithdraw` 接口
   - 使用 `withdrawWithSignature` 合约方法

2. **生产环境部署**
   - 部署到 BSC 主网或测试网
   - 配置真实的 XPL 和 USDT token 地址
   - 更新前端配置

3. **后端集成**
   - 实现签名生成逻辑
   - 监听合约事件
   - 更新订单状态
