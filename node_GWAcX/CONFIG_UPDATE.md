# 配置更新说明

## ⚠️ 重要：合约地址已更新

后端签名服务的合约地址需要与前端保持一致。

### 当前配置

请确保 `node_GWAcX/.env` 文件中的配置如下：

```env
# PLASMA Mainnet 配置
OWNER_PRIVATE_KEY=0x31bf522e8fee305993cd08120a28c3681fabc4a64cd62ed246e0ef80e9e89000
CONTRACT_ADDRESS=0xf4dAC0648D90b9F2D108e43aCf1526AfA71aC403
CHAIN_ID=9745
USDT_DECIMALS=6
ADMIN_ADDRESS=0xA4a7747C9241ba5A9AF9137bb662f38F463Fdf1B
USDT_ADDRESS=0xB8CE59FC3717ada4C02eaDF9682A9e934F625ebb
RPC_URL=wss://lb.drpc.live/plasma/AuS7VtXAMEbYsrJ8OzeHL7gpVtT7ELUR8by2-uF7NYYO

# 服务端口
PORT=3000
HOST=127.0.0.1
```

### 关键变更

**合约地址已更新**：
- ❌ 旧地址: `0x13dFde78A02C4138FD6aaAdd795FA11471CcfE54`
- ✅ 新地址: `0xf4dAC0648D90b9F2D108e43aCf1526AfA71aC403`

### 前后端地址对照

| 配置项 | 前端 | 后端 | 状态 |
|--------|------|------|------|
| 合约地址 | `0xf4dAC0648D90b9F2D108e43aCf1526AfA71aC403` | `0xf4dAC0648D90b9F2D108e43aCf1526AfA71aC403` | ✅ 一致 |
| USDT地址 | `0xb8ce59fc3717ada4c02eadf9682a9e934f625ebb` | `0xB8CE59FC3717ada4C02eaDF9682A9e934F625ebb` | ✅ 一致 |
| 链ID | `9745` | `9745` | ✅ 一致 |

### 部署步骤

1. **更新服务器上的 .env 文件**
   ```bash
   cd node_GWAcX
   nano .env
   # 修改 CONTRACT_ADDRESS 为新地址
   ```

2. **重启签名服务**
   ```bash
   # 使用 PM2
   pm2 restart signature-verify
   
   # 或直接运行
   node signature-verify.js
   ```

3. **验证配置**
   ```bash
   # 查看服务启动日志，确认合约地址正确
   pm2 logs signature-verify
   
   # 或查看控制台输出
   # 应该显示: 📄 Contract: 0xf4dAC0648D90b9F2D108e43aCf1526AfA71aC403
   ```

4. **测试签名生成**
   ```bash
   curl -X POST http://127.0.0.1:3000/sign-withdraw \
     -H "Content-Type: application/json" \
     -d '{
       "user": "0xA4a7747C9241ba5A9AF9137bb662f38F463Fdf1B",
       "amount": "1",
       "orderId": "TEST001"
     }'
   ```

   响应中的 `contractAddress` 应该是 `0xf4dAC0648D90b9F2D108e43aCf1526AfA71aC403`

### 为什么需要一致？

签名消息中包含合约地址：
```javascript
keccak256(abi.encodePacked(
  user,
  amount,
  orderId,
  nonce,
  deadline,
  chainId,
  contractAddress  // ⚠️ 必须与前端调用的合约地址一致
))
```

如果地址不一致，智能合约验证签名时会失败，导致提现无法完成。

### 故障排查

如果提现失败，检查：

1. **合约地址是否一致**
   - 前端: `frontend/src/wagmiConfig.ts` 中的 `CONTRACT_ADDRESS`
   - 后端: `node_GWAcX/.env` 中的 `CONTRACT_ADDRESS`

2. **签名服务是否重启**
   ```bash
   pm2 status
   # 或
   ps aux | grep signature-verify
   ```

3. **查看签名服务日志**
   ```bash
   pm2 logs signature-verify --lines 50
   ```

4. **测试签名生成**
   - 确认返回的 `contractAddress` 字段正确
   - 确认 `deadline` 字段存在

### 安全提示

⚠️ `.env` 文件包含私钥，请勿提交到 Git 仓库！

- 已添加到 `.gitignore`
- 仅在服务器上手动配置
- 定期更换私钥（如有泄露风险）
