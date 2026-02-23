# PHP 后端部署指南

## 文件说明

- `AdminWithdrawController.php` - 管理员提取控制器
- `admin_withdraw_log.sql` - 数据库表结构
- `PHP_DEPLOYMENT_GUIDE.md` - 本部署指南

## 部署步骤

### 1. 创建数据库表

在你的数据库中执行 `admin_withdraw_log.sql`：

```bash
mysql -u root -p your_database < admin_withdraw_log.sql
```

或者在 phpMyAdmin 中导入该 SQL 文件。

### 2. 部署控制器文件

将 `AdminWithdrawController.php` 复制到你的 ThinkPHP 项目：

```bash
cp AdminWithdrawController.php /path/to/your/project/Application/Admin/Controller/
```

### 3. 配置项目路径

在你的配置文件中添加以下配置（通常是 `Application/Common/Conf/config.php`）：

```php
return array(
    // ... 其他配置 ...
    
    // 管理员提取配置
    'ADMIN_WITHDRAW_DIR' => '/www/wwwroot/admin-withdraw',  // admin-withdraw 项目路径
    'NODE_PATH' => '/www/server/nodejs/v24.13.1/bin',       // Node.js 可执行文件路径
    
    // 可选：Node 服务配置（如果需要实时查询余额）
    // 'NODE_SERVICE_HOST' => '127.0.0.1',
    // 'NODE_SERVICE_PORT' => '3000',
);
```

### 4. 确保 admin-withdraw 项目已部署

确保在服务器上已经部署了 admin-withdraw 项目：

```bash
# 检查项目目录
ls -la /www/wwwroot/admin-withdraw

# 应该包含以下文件：
# - package.json
# - hardhat.config.ts
# - scripts/admin-withdraw-all.mjs
# - node_modules/
# - .env
```

### 5. 检查 Node.js 路径

确认 Node.js 和 npx 的路径：

```bash
which node
# 输出: /www/server/nodejs/v24.13.1/bin/node

which npx
# 输出: /www/server/nodejs/v24.13.1/bin/npx
```

### 6. 测试命令执行

在命令行测试提取脚本是否能正常运行：

```bash
cd /www/wwwroot/admin-withdraw
/www/server/nodejs/v24.13.1/bin/npx hardhat run scripts/admin-withdraw-all.mjs --network plasmaMainnet
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

### 7. 访问后端页面

访问管理后台的提取页面：

```
http://your-domain.com/admin.php/Admin/AdminWithdraw/index
```

## 功能说明

### 主要功能

1. **index()** - 显示提取页面
   - 显示管理员信息（地址、余额等）
   - 显示最近 10 条提取记录

2. **doWithdraw()** - 执行提取操作
   - 调用 Node.js 脚本提取合约余额
   - 解析执行结果
   - 记录到数据库

3. **getLogs()** - 获取提取日志（AJAX）
   - 支持分页查询
   - 返回 JSON 格式数据

### 数据库字段说明

`admin_withdraw_log` 表字段：

- `id` - 主键
- `network` - 网络名称（plasmaMainnet）
- `tx_hash` - 交易哈希
- `amount` - 提取金额
- `status` - 状态（0-失败，1-成功）
- `output` - 脚本输出内容
- `admin_id` - 操作管理员 ID
- `addtime` - 创建时间

## 配置选项

### 必需配置

```php
'ADMIN_WITHDRAW_DIR' => '/www/wwwroot/admin-withdraw',  // 项目路径
'NODE_PATH' => '/www/server/nodejs/v24.13.1/bin',       // Node.js 路径
```

### 可选配置

```php
// 如果需要实时查询余额功能，需要配置 Node 服务
'NODE_SERVICE_HOST' => '127.0.0.1',
'NODE_SERVICE_PORT' => '3000',
```

如果不配置 Node 服务，`getAdminInfo()` 方法会返回默认的静态信息。

## 故障排查

### 问题 1: 命令执行失败，无输出

**原因**: PHP 没有权限执行 shell 命令或路径不正确

**解决方案**:
1. 检查 PHP 配置，确保 `shell_exec` 函数未被禁用
2. 检查项目路径和 Node.js 路径是否正确
3. 检查文件权限

### 问题 2: hardhat: command not found

**原因**: npx 路径不正确或 node_modules 未安装

**解决方案**:
```bash
cd /www/wwwroot/admin-withdraw
npm install
```

### 问题 3: 提取失败，请查看日志

**原因**: 合约调用失败或网络问题

**解决方案**:
1. 查看数据库中的 `output` 字段，查看详细错误信息
2. 检查 `.env` 文件中的管理员私钥是否正确
3. 检查网络连接是否正常

### 问题 4: emoji 显示乱码

**原因**: 数据库字符集不支持 emoji

**解决方案**:
- 代码已自动过滤 emoji，不会存储到数据库
- 如果仍有问题，确保数据库表使用 `utf8mb4` 字符集

## 安全建议

1. **限制访问权限**: 只允许超级管理员访问此功能
2. **操作日志**: 所有操作都会记录到数据库
3. **私钥安全**: 确保 `.env` 文件权限设置为 600
4. **定期审计**: 定期检查提取日志，防止异常操作

## 测试流程

1. 访问提取页面，查看管理员信息
2. 点击"提取"按钮
3. 等待执行完成（约 10-30 秒）
4. 查看提取结果和交易哈希
5. 在区块浏览器验证交易：https://plasmascan.to/tx/[交易哈希]

## 相关链接

- PLASMA 主网浏览器: https://plasmascan.to
- PaymentChannel 合约: https://plasmascan.to/address/0x13dFde78A02C4138FD6aaAdd795FA11471CcfE54
- USDT0 代币: https://plasmascan.to/token/0xb8ce59fc3717ada4c02eadf9682a9e934f625ebb
- 管理员地址: https://plasmascan.to/address/0xA4a7747C9241ba5A9AF9137bb662f38F463Fdf1B

## 联系支持

如有问题，请联系开发团队。
