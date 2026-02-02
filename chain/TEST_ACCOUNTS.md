# 测试账号（含 USDT 与 XPL 手续费）

本地链（Hardhat / localhost:8546）使用的测试账号如下。**仅用于本地测试，切勿用于主网或带真钱的网络。**

---

## ⚠️ 重要提示

如果你在导入账户时遇到 **"KeyringController - The account you are trying to import is a duplicate"** 错误，说明这些 Hardhat 默认账户已经在你的钱包中了。

**解决方案：** 使用下面的 **"新生成的测试账户"**（第 2 部分），这些账户不会与现有账户冲突。

---

## 1. Hardhat 默认测试账号（可能已存在）

| 序号 | 地址 | 私钥 |
|------|------|------|
| **#0** | `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266` | `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80` |
| **#1** | `0x70997970C51812dc3A010C7d01b50e0d17dc79C8` | `0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d` |
| **#2** | `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC` | `0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a` |
| **#3** | `0x90F79bf6EB2c3fA5C1Fa9Cc50c1162607B9E6fA5` | `0x7c852118294e51e653712a81e05800f419141751be58f605c0e0b9a11c3cc530` |
| **#4** | `0x15d34AAf54267DB7D7c53783971a1Dc9eAd9F7cA` | `0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a` |

---

## 使用前准备

1. **启动本地链**（若尚未启动）  
   ```bash
   cd chain && npx hardhat node
   ```
   或使用你项目里启动 8546 的方式。

2. **设置 PaymentChannel 的 USDT 地址**（首次或重部署后执行一次）  
   ```bash
   node scripts/setup-usdt.cjs
   ```

3. **给测试账号发 XPL（手续费）**  
   ```bash
   node scripts/mint-xpl.cjs
   ```
   会给 #0、#1、#2 各转 100 XPL（本地原生币）。

4. **给测试账号铸造 USDT**  
   ```bash
   node scripts/mint-usdt.cjs
   ```
   会给上述 5 个账号各铸造 10,000 USDT。

---

## 在 MetaMask / 钱包里导入

- **网络**：本地 RPC，例如 `http://127.0.0.1:8546`（链 ID 一般为 31337）。
- **账号**：在钱包里「导入账户」→ 选「私钥」→ 粘贴上表对应私钥即可。

**注意**：账号 #0 通常是部署合约、执行脚本的默认账户，本地链启动时已有大量 XPL（如 10000 ETH 量级）。若你只用前端测试，用 #1～#4 即可，避免和部署账户混用。

---

## 复制用（地址 + 私钥）

**账号 #1**  
`0x70997970C51812dc3A010C7d01b50e0d17dc79C8`  
`0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d`

**账号 #2**  
`0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC`  
`0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a`

**账号 #3**  
`0x90F79bf6EB2c3fA5C1Fa9Cc50c1162607B9E6fA5`  
`0x7c852118294e51e653712a81e05800f419141751be58f605c0e0b9a11c3cc530`

**账号 #4**  
`0x15d34AAf54267DB7D7c53783971a1Dc9eAd9F7cA`  
`0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a`

---

## 2. 新生成的测试账户（推荐使用，不会冲突）✅

如果默认账户已存在，可以使用这些新生成的账户：

| 序号 | 地址 | 私钥 |
|------|------|------|
| **#1** | `0x13Fbcb8d3Eaed18b48463eBf97Dc30ec188646c0` | `0x3119b1273bb7c22696e5927f2afa8e72ad209be223f892e03901e7df1db8476f` |
| **#2** | `0xB98206b71CBB413b4e80954017c2bbfAf1c01F6C` | `0xa36d0cb7df7dec5e2b8a0fd2dde9034f056127d519dff9a2f6d57e7fd4b777c1` |
| **#3** | `0x4D3FEe017eCFFC7e83cD9dcC0AFee3239Cb12129` | `0x854d350c3a199ef21d6c9205c44c215d392bad6bff831e0312015022756bedf3` |
| **#4** | `0x32ad0545aa4D360d6b882f83c7Db7B73C3c9824D` | `0xf0607ea62acf0b3035bc0d8e1fecd5b8138d1be9fe30dfd6394917b6bfc12087` |
| **#5** | `0x1414300DAC6838510a21A870c4Af4a4EE88fA0d4` | `0x05a95a8e59a732ea9a7867cf2f606b15ab75e8ca7544dc566a912d64debba561` |

**✅ 这些账户已经充值完成：**
- 每个账户都有 **100-200 XPL**（用于支付 gas 费）
- 每个账户都有 **10,000 USDT**（用于测试质押）

**可以直接导入使用，无需额外充值！**
