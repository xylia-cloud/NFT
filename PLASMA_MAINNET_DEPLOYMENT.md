# PLASMA 主网部署文档

## 部署信息

**部署日期**: 2025-02-22  
**网络**: PLASMA Mainnet  
**Chain ID**: 9745  
**RPC URL**: https://rpc.plasma.to  
**区块浏览器**: https://plasmascan.to

## 部署的合约

### 1. PaymentChannel v2 (支付通道合约 - 当前版本)
- **合约地址**: `0x13dFde78A02C4138FD6aaAdd795FA11471CcfE54`
- **版本**: v2-with-emergency-withdraw
- **部署时间**: 2025-02-22
- **功能**: 
  - 用户充值 (USDT)
  - 用户提现 (USDT 本金 / XPL 收益)
  - 带签名验证的提现功能
  - **新增**: 管理员紧急提取功能
    - `emergencyWithdrawUsdt(uint256 amount)` - 提取 USDT
    - `emergencyWithdrawXpl(uint256 amount)` - 提取 XPL
    - `emergencyWithdrawNative()` - 提取原生代币
- **浏览器链接**: https://plasmascan.to/address/0x13dFde78A02C4138FD6aaAdd795FA11471CcfE54

### 1.1 PaymentChannel v1 (已废弃)
- **合约地址**: `0x2f5A81181CF28653B8254C67cb76B232B48A7397`
- **状态**: 已废弃，请使用 v2
- **浏览器链接**: https://plasmascan.to/address/0x2f5A81181CF28653B8254C67cb76B232B48A7397

### 2. MockUSDT (USDT 代币合约)
- **合约地址**: `0x3F1Eb88219A75b82906F0844A339BA4C8a74d14E`
- **代币符号**: USDT0
- **精度**: 18
- **功能**: ERC20 标准代币
- **浏览器链接**: https://plasmascan.to/address/0x3F1Eb88219A75b82906F0844A339BA4C8a74d14E

## 管理员账户

- **地址**: `0xA4a7747C9241ba5A9AF9137bb662f38F463Fdf1B`
- **权限**: 
  - 合约所有者 (owner)
  - 可以设置 USDT/XPL 代币地址
  - 可以执行管理员提现
  - 可以执行紧急提取操作

### 旧管理员账户 (v1)
- **地址**: `0x70997970C51812dc3A010C7d01b50e0d17dc79C8`
- **状态**: 仅用于 v1 合约

## 前端配置

前端已更新为连接 PLASMA 主网：

```typescript
// frontend/src/wagmiConfig.ts
const plasmaMainnet = {
  id: 9745,
  name: 'PLASMA Mainnet',
  nativeCurrency: { name: 'XPL', symbol: 'XPL', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.plasma.to'] },
    public: { http: ['https://rpc.plasma.to'] },
  },
}

export const CONTRACT_ADDRESS = '0x2f5A81181CF28653B8254C67cb76B232B48A7397'
export const USDT_ADDRESS = '0x3F1Eb88219A75b82906F0844A339BA4C8a74d14E'
```

## 后续步骤

### 1. 设置 USDT 代币地址（如果需要）
```bash
cd chain
npx hardhat run scripts/set-usdt-token.js --network plasmaMainnet
```

### 2. 铸造测试 USDT（如果需要）
```bash
npx hardhat run scripts/mint-usdt.js --network plasmaMainnet
```

### 3. 验证合约（可选）
```bash
npx hardhat verify --network plasmaMainnet 0x2f5A81181CF28653B8254C67cb76B232B48A7397
npx hardhat verify --network plasmaMainnet 0x3F1Eb88219A75b82906F0844A339BA4C8a74d14E
```

## 安全注意事项

⚠️ **重要**: 
- 管理员私钥已在配置文件中，请确保 `.env` 文件不会被提交到公开仓库
- 建议在生产环境中使用硬件钱包或多签钱包管理管理员权限
- 定期审计合约和监控异常交易

## 测试

部署完成后，建议进行以下测试：

1. ✅ 连接钱包到 PLASMA 主网
2. ✅ 测试 USDT 充值功能
3. ✅ 测试 USDT 提现功能
4. ✅ 测试 XPL 收益提现功能
5. ✅ 验证事件日志是否正确记录

## 联系方式

如有问题，请联系开发团队。
