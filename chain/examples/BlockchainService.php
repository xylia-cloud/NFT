<?php
/**
 * 区块链服务类 - PHP 实现
 * 
 * 功能：
 * 1. 连接到测试链
 * 2. 轮询充值事件
 * 3. 执行提现操作
 * 
 * 依赖：composer require guzzlehttp/guzzle
 */

require_once __DIR__ . '/../vendor/autoload.php';

use GuzzleHttp\Client;

class BlockchainService {
    private $client;
    private $rpcUrl;
    private $adminPrivateKey;
    private $adminAddress;
    private $usdtAddress;
    private $paymentChannelAddress;
    private $lastProcessedBlock = 0;
    
    public function __construct() {
        // 从配置文件读取
        $configPath = __DIR__ . '/../local-testnet-config.json';
        if (!file_exists($configPath)) {
            throw new Exception("配置文件不存在: {$configPath}");
        }
        
        $config = json_decode(file_get_contents($configPath), true);
        
        $this->rpcUrl = $config['network']['rpcUrl'];
        $this->usdtAddress = $config['contracts']['USDT'];
        $this->paymentChannelAddress = $config['contracts']['PaymentChannel'];
        $this->adminPrivateKey = $config['adminAccount']['privateKey'];
        $this->adminAddress = $config['adminAccount']['address'];
        
        $this->client = new Client([
            'base_uri' => $this->rpcUrl,
            'timeout' => 30.0,
        ]);
        
        echo "📋 配置加载成功:\n";
        echo "- RPC URL: {$this->rpcUrl}\n";
        echo "- USDT: {$this->usdtAddress}\n";
        echo "- PaymentChannel: {$this->paymentChannelAddress}\n";
        echo "- 管理员: {$this->adminAddress}\n\n";
    }
    
    /**
     * JSON-RPC 调用
     */
    private function rpcCall($method, $params = []) {
        try {
            $response = $this->client->post('', [
                'json' => [
                    'jsonrpc' => '2.0',
                    'method' => $method,
                    'params' => $params,
                    'id' => 1
                ]
            ]);
            
            $result = json_decode($response->getBody(), true);
            
            if (isset($result['error'])) {
                throw new Exception($result['error']['message']);
            }
            
            return $result['result'];
        } catch (Exception $e) {
            throw new Exception("RPC 调用失败 ({$method}): " . $e->getMessage());
        }
    }
    
    /**
     * 测试连接
     */
    public function testConnection() {
        try {
            $blockNumber = $this->rpcCall('eth_blockNumber');
            $blockNumberDec = hexdec($blockNumber);
            echo "✅ 已连接到测试链，当前区块: {$blockNumberDec}\n\n";
            return true;
        } catch (Exception $e) {
            echo "❌ 连接失败: " . $e->getMessage() . "\n\n";
            return false;
        }
    }
    
    /**
     * 获取区块号
     */
    public function getBlockNumber() {
        $blockNumber = $this->rpcCall('eth_blockNumber');
        return hexdec($blockNumber);
    }
    
    /**
     * 轮询充值事件
     */
    public function pollDepositEvents() {
        try {
            $currentBlock = $this->getBlockNumber();
            
            if ($this->lastProcessedBlock == 0) {
                // 首次运行，从最近 100 个区块开始
                $this->lastProcessedBlock = max(0, $currentBlock - 100);
            }
            
            if ($currentBlock <= $this->lastProcessedBlock) {
                return []; // 没有新区块
            }
            
            // USDTDeposited 事件签名: keccak256("USDTDeposited(address,uint256)")
            $eventSignature = '0x' . substr(hash('sha3-256', 'USDTDeposited(address,uint256)'), 0, 64);
            
            // 获取事件日志
            $logs = $this->rpcCall('eth_getLogs', [[
                'fromBlock' => '0x' . dechex($this->lastProcessedBlock + 1),
                'toBlock' => '0x' . dechex($currentBlock),
                'address' => $this->paymentChannelAddress,
                'topics' => [$eventSignature]
            ]]);
            
            $deposits = [];
            foreach ($logs as $log) {
                $deposits[] = $this->parseDepositEvent($log);
            }
            
            $this->lastProcessedBlock = $currentBlock;
            
            return $deposits;
            
        } catch (Exception $e) {
            echo "❌ 轮询事件失败: " . $e->getMessage() . "\n";
            return [];
        }
    }
    
    /**
     * 解析充值事件
     */
    private function parseDepositEvent($log) {
        // 解析事件数据
        // topics[0] = 事件签名
        // topics[1] = 用户地址（indexed）
        // data = 金额
        
        $userAddress = '0x' . substr($log['topics'][1], 26); // 去掉前面的 0 填充
        $amount = hexdec($log['data']); // USDT 金额（6 位小数）
        
        return [
            'userAddress' => strtolower($userAddress),
            'amount' => $amount / 1000000, // 转换为 USDT
            'txHash' => $log['transactionHash'],
            'blockNumber' => hexdec($log['blockNumber']),
            'timestamp' => time()
        ];
    }
    
    /**
     * 处理充值
     */
    public function handleDeposit($depositData) {
        echo "💰 检测到充值:\n";
        echo "- 用户: {$depositData['userAddress']}\n";
        echo "- 金额: {$depositData['amount']} USDT\n";
        echo "- 交易: {$depositData['txHash']}\n";
        echo "- 区块: {$depositData['blockNumber']}\n\n";
        
        // TODO: 更新数据库
        // 1. 查找或创建用户（通过钱包地址）
        // 2. 增加用户的 USDT 余额
        // 3. 记录充值交易
        
        /*
        $db = new PDO('mysql:host=localhost;dbname=your_db', 'user', 'pass');
        
        // 查找用户
        $stmt = $db->prepare("SELECT id FROM users WHERE wallet_address = ?");
        $stmt->execute([$depositData['userAddress']]);
        $user = $stmt->fetch();
        
        if (!$user) {
            // 创建用户
            $stmt = $db->prepare("INSERT INTO users (wallet_address) VALUES (?)");
            $stmt->execute([$depositData['userAddress']]);
            $userId = $db->lastInsertId();
        } else {
            $userId = $user['id'];
        }
        
        // 增加余额
        $stmt = $db->prepare("UPDATE users SET usdt_balance = usdt_balance + ? WHERE id = ?");
        $stmt->execute([$depositData['amount'], $userId]);
        
        // 记录交易
        $stmt = $db->prepare("
            INSERT INTO transactions (user_id, type, coin, amount, tx_hash, block_number, status)
            VALUES (?, 'deposit', 'USDT', ?, ?, ?, 'confirmed')
        ");
        $stmt->execute([
            $userId,
            $depositData['amount'],
            $depositData['txHash'],
            $depositData['blockNumber']
        ]);
        */
        
        echo "✅ 充值已处理\n\n";
    }
    
    /**
     * 执行提现（简化版 - 需要实现交易签名）
     * 
     * 注意：这是一个简化示例，实际需要使用 web3.php 或其他库来签名交易
     */
    public function withdraw($userAddress, $amount) {
        echo "💸 执行提现:\n";
        echo "- 用户: {$userAddress}\n";
        echo "- 金额: {$amount} XPL\n\n";
        
        echo "⚠️  警告: 提现功能需要实现交易签名\n";
        echo "推荐使用 web3.php 库或调用外部签名服务\n\n";
        
        // TODO: 实现交易签名和发送
        // 1. 构建交易数据
        // 2. 使用私钥签名交易
        // 3. 发送签名后的交易
        // 4. 等待交易确认
        
        return [
            'success' => false,
            'error' => '需要实现交易签名功能'
        ];
    }
    
    /**
     * 验证地址格式
     */
    private function isValidAddress($address) {
        return preg_match('/^0x[a-fA-F0-9]{40}$/', $address);
    }
}

// 使用示例
if (php_sapi_name() === 'cli') {
    echo "🚀 区块链服务测试\n";
    echo str_repeat("=", 60) . "\n\n";
    
    try {
        $blockchain = new BlockchainService();
        $blockchain->testConnection();
        
        echo "📊 开始轮询充值事件...\n";
        echo "按 Ctrl+C 停止\n\n";
        
        while (true) {
            $deposits = $blockchain->pollDepositEvents();
            
            foreach ($deposits as $deposit) {
                $blockchain->handleDeposit($deposit);
            }
            
            // 每 3 秒轮询一次
            sleep(3);
        }
        
    } catch (Exception $e) {
        echo "❌ 错误: " . $e->getMessage() . "\n";
        exit(1);
    }
}
