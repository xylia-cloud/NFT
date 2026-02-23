# 服务器部署指南

## 部署步骤

### 1. 上传项目文件到服务器

将以下文件/目录上传到 `/www/wwwroot/admin-withdraw/`：

```
admin-withdraw/
├── contracts/              # 合约源码
├── scripts/               # 脚本文件
│   └── admin-withdraw-all.mjs
├── hardhat.config.ts      # Hardhat 配置
├── package.json           # 依赖配置
├── .env                   # 环境变量（包含私钥）
└── tsconfig.json          # TypeScript 配置
```

### 2. 安装依赖

```bash
cd /www/wwwroot/admin-withdraw
npm install
```

### 3. 编译合约（生成 artifacts）

```bash
cd /www/wwwroot/admin-withdraw
npx hardhat compile
```

这会生成 `artifacts` 目录，包含合约的 ABI 和字节码。

### 4. 验证 .env 文件

确保 `.env` 文件包含正确的配置：

```bash
cat /www/wwwroot/admin-withdraw/.env
```

应该包含：

```env
PLASMA_MAINNET_RPC_URL=https://rpc.plasma.to
PLASMA_MAINNET_PRIVATE_KEY=31bf522e8fee305993cd08120a28c3681fabc4a64cd62ed246e0ef80e9e89000
ADMIN_PRIVATE_KEY=0x31bf522e8fee305993cd08120a28c3681fabc4a64cd62ed246e0ef80e9e89000
```

### 5. 测试提取脚本

```bash
cd /www/wwwroot/admin-withdraw
/www/server/nodejs/v24.13.1/bin/node /www/wwwroot/admin-withdraw/node_modules/.bin/hardhat run scripts/admin-withdraw-all.mjs --network plasmaMainnet
```

如果成功，应该看到类似输出：

```
🌐 网络: plasmaMainnet
👤 管理员地址: 0xA4a7747C9241ba5A9AF9137bb662f38F463Fdf1B
💰 代币: USDT0 (6 decimals)
📊 合约余额:
   地址: 0x13dFde78A02C4138FD6aaAdd795FA11471CcfE54
   余额: 0.0 USDT0
✅ 合约余额为 0，无需提取
```

### 6. 部署 PHP 控制器

将 `AdminWithdrawController.php` 复制到你的 PHP 项目：

```bash
cp /www/wwwroot/admin-withdraw/examples/AdminWithdrawController.php /path/to/your/php/project/Application/Admin/Controller/
```

### 7. 创建数据库表

```bash
mysql -u root -p your_database < /www/wwwroot/admin-withdraw/examples/admin_withdraw_log.sql
```

### 8. 设置文件权限

```bash
cd /www/wwwroot/admin-withdraw
chmod 600 .env  # 保护私钥文件
chmod +x scripts/*.mjs
```

## 快速部署脚本

如果你想一键部署，可以使用以下脚本：

```bash
#!/bin/bash

# 服务器快速部署脚本
PROJECT_DIR="/www/wwwroot/admin-withdraw"
NODE_PATH="/www/server/nodejs/v24.13.1/bin"

echo "开始部署..."

# 1. 进入项目目录
cd $PROJECT_DIR || exit 1

# 2. 安装依赖
echo "安装依赖..."
$NODE_PATH/npm install

# 3. 编译合约
echo "编译合约..."
$NODE_PATH/npx hardhat compile

# 4. 设置权限
echo "设置文件权限..."
chmod 600 .env
chmod +x scripts/*.mjs

# 5. 测试脚本
echo "测试提取脚本..."
$NODE_PATH/node $PROJECT_DIR/node_modules/.bin/hardhat run scripts/admin-withdraw-all.mjs --network plasmaMainnet

echo "部署完成！"
```

保存为 `deploy.sh`，然后运行：

```bash
chmod +x deploy.sh
./deploy.sh
```

## 故障排查

### 问题 1: hardhat: command not found

**解决方案**：
```bash
cd /www/wwwroot/admin-withdraw
npm install
```

### 问题 2: artifacts 目录不存在

**解决方案**：
```bash
cd /www/wwwroot/admin-withdraw
npx hardhat compile
```

### 问题 3: 权限问题

**解决方案**：
```bash
chmod 600 /www/wwwroot/admin-withdraw/.env
chown -R www:www /www/wwwroot/admin-withdraw
```

### 问题 4: Node 版本不对

**解决方案**：
```bash
# 检查 Node 版本
/www/server/nodejs/v24.13.1/bin/node --version

# 如果版本不对，更新 PHP 控制器中的 $nodePath
```

## 目录结构检查

部署完成后，目录结构应该是：

```
/www/wwwroot/admin-withdraw/
├── artifacts/              # ✓ 编译生成
│   └── contracts/
│       └── PaymentChannel.sol/
│           └── PaymentChannel.json
├── contracts/              # ✓ 合约源码
│   └── PaymentChannel.sol
├── scripts/               # ✓ 脚本
│   └── admin-withdraw-all.mjs
├── node_modules/          # ✓ 依赖
├── .env                   # ✓ 环境变量
├── hardhat.config.ts      # ✓ 配置
├── package.json           # ✓ 依赖配置
└── tsconfig.json          # ✓ TS 配置
```

## 维护

### 更新合约

如果合约有更新：

```bash
cd /www/wwwroot/admin-withdraw
npx hardhat compile --force
```

### 查看日志

PHP 日志位置（根据你的配置）：
- ThinkPHP: `Application/Runtime/Logs/`
- 自定义日志: `Application/Runtime/Logs/admin_withdraw_*.log`

### 备份私钥

```bash
cp /www/wwwroot/admin-withdraw/.env /backup/location/.env.backup
```

## 安全建议

1. 确保 `.env` 文件权限为 600
2. 定期备份私钥
3. 监控提取日志
4. 限制 PHP 后台访问权限
5. 使用 HTTPS

## 联系支持

如有问题，请联系开发团队。
