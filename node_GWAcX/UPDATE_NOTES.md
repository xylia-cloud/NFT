# 签名服务更新说明

## 更新内容

### 1. 添加 deadline 参数支持

签名消息现在包含 `deadline` 参数，与智能合约的签名验证逻辑保持一致。

### 2. 签名有效期

- **有效期**: 8分钟（480秒）
- **自动过期**: 签名在 deadline 时间戳后失效
- **防重放**: 结合 nonce 和 deadline 双重保护

### 3. 签名消息格式

```solidity
keccak256(abi.encodePacked(
    user,           // 用户地址
    amount,         // 金额（wei格式）
    orderId,        // 订单号
    nonce,          // 唯一随机数
    deadline,       // 签名过期时间戳（秒）
    chainId,        // 链ID
    contractAddress // 合约地址
))
```

### 4. API 响应格式

```json
{
  "success": true,
  "signature": "0x...",
  "nonce": "123456789...",
  "amountWei": "1000000",
  "deadline": "1234567890",
  "contractAddress": "0x...",
  "chainId": 9745,
  "signatureTTL": 480,
  "signatureExpiresAt": 1234567890
}
```

## 使用方法

### 请求示例

```bash
curl -X POST http://127.0.0.1:3000/sign-withdraw \
  -H "Content-Type: application/json" \
  -d '{
    "user": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    "amount": "100",
    "orderId": "ORDER123456",
    "tokenDecimals": 6
  }'
```

### 响应示例

```json
{
  "success": true,
  "signature": "0x1234...",
  "nonce": "1234567890abcdef",
  "amountWei": "100000000",
  "deadline": "1234567890",
  "contractAddress": "0x13dFde78A02C4138FD6aaAdd795FA11471CcfE54",
  "chainId": 9745,
  "signatureTTL": 480,
  "signatureExpiresAt": 1234567890
}
```

## 重启服务

```bash
# 使用 PM2 重启
pm2 restart signature-verify

# 或者直接运行
node signature-verify.js
```

## 验证

1. 检查服务状态：
```bash
curl http://127.0.0.1:3000/health
```

2. 测试签名生成：
```bash
curl -X POST http://127.0.0.1:3000/sign-withdraw \
  -H "Content-Type: application/json" \
  -d '{
    "user": "0xA4a7747C9241ba5A9AF9137bb662f38F463Fdf1B",
    "amount": "1",
    "orderId": "TEST001"
  }'
```

## 注意事项

1. **签名有效期**: 签名在8分钟后自动过期，需要重新获取
2. **Nonce 唯一性**: 每次签名都会生成唯一的 nonce，防止重放攻击
3. **链ID 匹配**: 签名中包含链ID，确保跨链安全
4. **合约地址**: 签名绑定到特定合约地址，防止跨合约攻击

## 与智能合约的对应关系

智能合约验证函数：
```solidity
function _verifySignature(
    address user,
    uint256 amount,
    string calldata orderId,
    uint256 nonce,
    uint256 deadline,
    bytes calldata signature
) internal view returns (bool) {
    bytes32 messageHash = keccak256(
        abi.encodePacked(user, amount, orderId, nonce, deadline, block.chainid, address(this))
    );
    bytes32 ethSignedHash = MessageHashUtils.toEthSignedMessageHash(messageHash);
    address signer = ECDSA.recover(ethSignedHash, signature);
    return signer == owner;
}
```

签名服务生成的签名与合约验证逻辑完全一致。
