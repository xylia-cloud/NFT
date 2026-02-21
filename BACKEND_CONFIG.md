# 后端配置说明

## 问题诊断
如果充值后后端没有监控到，可能是以下原因：

### 1. 后端监控的合约地址不正确
后端需要监控的 **PaymentChannel 合约地址**：
```
0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0
```

### 2. 检查后端配置
请检查后端代码中的以下配置项：

#### PHP 后端
查找类似这样的配置：
```php
// 可能在 config.php 或环境变量中
$contractAddress = '0x...'; // 确保这里是 0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0
```

#### Node.js 后端
查找类似这样的配置：
```javascript
// 可能在 .env 或 config.js 中
const CONTRACT_ADDRESS = '0x...'; // 确保这里是 0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0
```

### 3. 需要监听的事件
后端应该监听 PaymentChannel 合约的以下事件：

#### USDTDeposited 事件（用户充值）
```solidity
event USDTDeposited(
    address indexed user,
    uint256 amount,
    string orderId
)
```

**事件签名哈希**：
```
keccak256("USDTDeposited(address,uint256,string)")
```

#### Withdrawn 事件（提现本金）
```solidity
event Withdrawn(
    address indexed user,
    uint256 amount,
    string orderId
)
```

#### XplWithdrawn 事件（提现收益）
```solidity
event XplWithdrawn(
    address indexed user,
    uint256 xplAmount,
    uint256 usdtValue,
    string orderId
)
```

## 完整配置信息

### 网络配置
```json
{
  "rpcUrl": "http://127.0.0.1:8546",
  "chainId": 31337
}
```

### 合约地址
```json
{
  "PaymentChannel": "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0",
  "USDT": "0x5FbDB2315678afecb367f032d93F642f64180aa3",
  "XPL": "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"
}
```

### 管理员账户（用于签名）
```json
{
  "address": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
  "privateKey": "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
}
```

## 故障排查步骤

### 步骤 1：确认合约地址
在后端日志中查找监控的合约地址，确保是：
```
0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0
```

### 步骤 2：重启后端服务
修改配置后，必须重启后端服务才能生效：
```bash
# 停止后端服务
# 重新启动后端服务
```

### 步骤 3：测试充值
1. 在前端进行一笔小额充值（如 500 USDT0）
2. 查看后端日志，应该能看到 `USDTDeposited` 事件
3. 检查数据库，订单状态应该更新

### 步骤 4：查看区块链浏览器
如果后端仍然没有监控到，可以通过以下方式验证交易是否成功：

#### 使用 Hardhat Console
```bash
cd chain
npx hardhat console --network localhost
```

```javascript
// 获取 PaymentChannel 合约
const PaymentChannel = await ethers.getContractFactory("PaymentChannel");
const contract = await PaymentChannel.attach("0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0");

// 查询最近的事件
const filter = contract.filters.USDTDeposited();
const events = await contract.queryFilter(filter);
console.log(events);
```

#### 使用 ethers.js 脚本
```javascript
const { ethers } = require('ethers');

const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8546');
const contractAddress = '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0';

// 监听事件
const abi = [
  'event USDTDeposited(address indexed user, uint256 amount, string orderId)'
];
const contract = new ethers.Contract(contractAddress, abi, provider);

contract.on('USDTDeposited', (user, amount, orderId, event) => {
  console.log('充值事件:', {
    user,
    amount: amount.toString(),
    orderId,
    blockNumber: event.blockNumber,
    transactionHash: event.transactionHash
  });
});

console.log('开始监听充值事件...');
```

## 常见问题

### Q1: 后端监控不到事件
**原因**：
1. 合约地址配置错误
2. RPC 节点连接失败
3. 事件监听器未正确启动
4. 区块同步延迟

**解决方案**：
1. 确认合约地址为 `0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0`
2. 测试 RPC 连接：`curl http://127.0.0.1:8546 -X POST -H "Content-Type: application/json" --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'`
3. 重启后端服务
4. 检查后端日志

### Q2: 事件监听延迟
**原因**：后端轮询间隔太长

**解决方案**：
- 减少轮询间隔（建议 1-3 秒）
- 使用 WebSocket 连接代替 HTTP 轮询

### Q3: 历史事件丢失
**原因**：后端重启后没有从上次区块继续监听

**解决方案**：
- 在数据库中记录最后处理的区块号
- 重启时从上次区块号继续监听

## 监控脚本示例

### Node.js 监控脚本
```javascript
const { ethers } = require('ethers');

// 配置
const RPC_URL = 'http://127.0.0.1:8546';
const CONTRACT_ADDRESS = '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0';
const POLL_INTERVAL = 2000; // 2秒轮询一次

// ABI
const ABI = [
  'event USDTDeposited(address indexed user, uint256 amount, string orderId)',
  'event Withdrawn(address indexed user, uint256 amount, string orderId)',
  'event XplWithdrawn(address indexed user, uint256 xplAmount, uint256 usdtValue, string orderId)'
];

// 初始化
const provider = new ethers.JsonRpcProvider(RPC_URL);
const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);

let lastBlock = 0;

// 监听函数
async function pollEvents() {
  try {
    const currentBlock = await provider.getBlockNumber();
    
    if (lastBlock === 0) {
      lastBlock = currentBlock - 100; // 从最近100个区块开始
    }
    
    if (currentBlock > lastBlock) {
      console.log(`检查区块 ${lastBlock + 1} 到 ${currentBlock}`);
      
      // 查询充值事件
      const depositFilter = contract.filters.USDTDeposited();
      const depositEvents = await contract.queryFilter(depositFilter, lastBlock + 1, currentBlock);
      
      for (const event of depositEvents) {
        console.log('充值事件:', {
          user: event.args.user,
          amount: ethers.formatUnits(event.args.amount, 6), // USDT 6位小数
          orderId: event.args.orderId,
          blockNumber: event.blockNumber,
          txHash: event.transactionHash
        });
        
        // TODO: 更新数据库订单状态
      }
      
      lastBlock = currentBlock;
    }
  } catch (error) {
    console.error('监听错误:', error);
  }
}

// 启动监听
console.log(`开始监听合约: ${CONTRACT_ADDRESS}`);
setInterval(pollEvents, POLL_INTERVAL);
pollEvents(); // 立即执行一次
```

### PHP 监控脚本
```php
<?php
// 配置
$rpcUrl = 'http://127.0.0.1:8546';
$contractAddress = '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0';
$pollInterval = 2; // 2秒

// 事件签名
$eventSignature = '0x' . hash('sha3-256', 'USDTDeposited(address,uint256,string)');

$lastBlock = 0;

while (true) {
    try {
        // 获取当前区块号
        $currentBlock = hexdec(rpcCall($rpcUrl, 'eth_blockNumber', []));
        
        if ($lastBlock === 0) {
            $lastBlock = $currentBlock - 100;
        }
        
        if ($currentBlock > $lastBlock) {
            echo "检查区块 " . ($lastBlock + 1) . " 到 $currentBlock\n";
            
            // 查询事件日志
            $logs = rpcCall($rpcUrl, 'eth_getLogs', [[
                'address' => $contractAddress,
                'fromBlock' => '0x' . dechex($lastBlock + 1),
                'toBlock' => '0x' . dechex($currentBlock),
                'topics' => [$eventSignature]
            ]]);
            
            foreach ($logs as $log) {
                echo "充值事件:\n";
                echo "  用户: " . substr($log['topics'][1], 26) . "\n";
                echo "  交易哈希: " . $log['transactionHash'] . "\n";
                
                // TODO: 解析 data 字段获取 amount 和 orderId
                // TODO: 更新数据库订单状态
            }
            
            $lastBlock = $currentBlock;
        }
    } catch (Exception $e) {
        echo "监听错误: " . $e->getMessage() . "\n";
    }
    
    sleep($pollInterval);
}

function rpcCall($url, $method, $params) {
    $data = json_encode([
        'jsonrpc' => '2.0',
        'method' => $method,
        'params' => $params,
        'id' => 1
    ]);
    
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    
    $response = curl_exec($ch);
    curl_close($ch);
    
    $result = json_decode($response, true);
    return $result['result'];
}
```

## 总结

**关键配置项**：
1. ✅ 合约地址：`0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0`
2. ✅ RPC URL：`http://127.0.0.1:8546`
3. ✅ Chain ID：`31337`
4. ✅ 管理员私钥：`0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`

**修改配置后必须重启后端服务！**
