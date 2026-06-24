# PaymentChannel v4 后端对接说明

> 更新：2026-06-23  
> v4 相比 v3：**USDT 自动存 Aave**，**签名逻辑不变**，主要换合约地址。

---

## 1. 基础配置

| 项 | 值 |
|----|-----|
| Chain ID | `9745` |
| RPC | `https://rpc.plasma.to` |
| **合约地址（新）** | `0x65401FFB46EA856525cD040d35fEEEB7b9Ab0894` |
| 旧合约（废弃） | `0x5cCeD445D87eBc7F6D736E5Bb97689914F2A2afa` |
| USDT0 | `0xb8ce59fc3717ada4c02eadf9682a9e934f625ebb`（6 位） |
| WXPL | `0x6100e367285b01f48d07953803a2d8dca5d19873`（18 位） |
| Owner（签名地址） | `0xA4a7747C9241ba5A9AF9137bb662f38F463Fdf1B` |

---

## 2. 三个流程

### 充值
1. 后端返回 `order_id`（`/Api/Recharge/recharge_preorder`）
2. 用户调用 `depositUsdt(amount, orderId)`
3. 后端监听 `USDTDeposited` → 更新订单

> 用户必须走 `depositUsdt`，直接 transfer 不会触发事件、也不会进 Aave。

### 本金提现（USDT）
1. 解押 + 冷冻期结束后，后端返回签名（`/Api/Recharge/withdraw`）
2. 用户调用 `withdrawWithSignature(amount, orderId, nonce, deadline, signature)`
3. 后端监听 `Withdrawn` → 订单完成

### 收益提现（WXPL）
1. 后端返回签名（`/Api/Wallet/profit_withdraw`）
2. 用户调用 `withdrawXplWithSignature(amount, orderId, nonce, deadline, signature)`
3. 后端监听 `XplWithdrawn` → 订单完成

---

## 3. 签名生成

```javascript
const CHAIN_ID = 9745;
const CONTRACT = '0x65401FFB46EA856525cD040d35fEEEB7b9Ab0894';

const messageHash = ethers.solidityPackedKeccak256(
  ['address', 'uint256', 'string', 'uint256', 'uint256', 'uint256', 'address'],
  [userAddress, amountWei, orderId, nonce, deadline, CHAIN_ID, CONTRACT]
);
const signature = wallet.signMessageSync(ethers.getBytes(messageHash));
```

要点：
- 私钥必须对应 Owner 地址
- `nonce` 全局唯一，`deadline` 建议 `now + 480` 秒
- USDT 用 6 位精度，WXPL 用 18 位精度
- **contractAddress 必须改成新合约地址**

---

## 4. 监听事件

| 事件 | 用途 |
|------|------|
| `USDTDeposited(user, amount, orderId)` | 充值到账 |
| `Withdrawn(user, amount, orderId, nonce)` | 本金提现完成 |
| `XplWithdrawn(user, amount, orderId, nonce)` | 收益提现完成 |

---

## 5. 后端要改的

- [ ] 合约地址改为 `0x65401FFB46EA856525cD040d35fEEEB7b9Ab0894`
- [ ] 签名和 API 返回里的 `contract_address` 改为新地址
- [ ] 事件监听从旧合约切到新合约

**不用改的：** 签名算法、API 字段结构、提现函数参数。

---

## 6. ABI 与参考文件

**发给后端用这个文件：**

`chain/PaymentChannel.abi.json`

内含 `address`、`chainId`、`abi`，可直接用于 ethers/web3.php 初始化合约。

纯 ABI 数组也可从 Hardhat 编译产物取：`chain/artifacts/contracts/PaymentChannel.sol/PaymentChannel.json` 里的 `abi` 字段。

其他：
- 地址汇总：`chain/plasma-mainnet-config.json`
- 合约浏览器：https://plasmascan.to/address/0x65401FFB46EA856525cD040d35fEEEB7b9Ab0894
