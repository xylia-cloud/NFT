<?php
/**
 * 后端提现签名示例（PHP）
 * 
 * 依赖：
 * composer require web3p/web3.php
 * composer require kornrunner/keccak
 */

require_once 'vendor/autoload.php';

use kornrunner\Keccak;
use Elliptic\EC;

class WithdrawSignature {
    
    private $adminPrivateKey;
    
    public function __construct($privateKey) {
        // 移除 0x 前缀
        $this->adminPrivateKey = str_replace('0x', '', $privateKey);
    }
    
    /**
     * 生成提现签名
     * 
     * @param string $userAddress 用户钱包地址
     * @param string $amount XPL 金额（wei 格式，字符串）
     * @param string $orderId 订单号
     * @return string 签名（0x开头）
     */
    public function generateWithdrawSignature($userAddress, $amount, $orderId) {
        // 1. 构造消息哈希（与合约中的逻辑一致）
        $messageHash = $this->solidityKeccak256(
            ['address', 'uint256', 'string'],
            [$userAddress, $amount, $orderId]
        );
        
        // 2. 添加以太坊签名前缀
        $ethSignedMessageHash = $this->hashMessage($messageHash);
        
        // 3. 使用私钥签名
        $signature = $this->sign($ethSignedMessageHash, $this->adminPrivateKey);
        
        return '0x' . $signature;
    }
    
    /**
     * Solidity keccak256 编码
     */
    private function solidityKeccak256($types, $values) {
        $encoded = '';
        
        for ($i = 0; $i < count($types); $i++) {
            $type = $types[$i];
            $value = $values[$i];
            
            if ($type === 'address') {
                // 地址：移除 0x，补齐到 32 字节
                $encoded .= str_pad(str_replace('0x', '', $value), 64, '0', STR_PAD_LEFT);
            } elseif ($type === 'uint256') {
                // uint256：转换为十六进制，补齐到 32 字节
                $hex = gmp_strval(gmp_init($value, 10), 16);
                $encoded .= str_pad($hex, 64, '0', STR_PAD_LEFT);
            } elseif ($type === 'string') {
                // string：先 keccak256，再补齐
                $stringHash = Keccak::hash($value, 256);
                $encoded .= $stringHash;
            }
        }
        
        return Keccak::hash(hex2bin($encoded), 256);
    }
    
    /**
     * 添加以太坊签名消息前缀
     */
    private function hashMessage($messageHash) {
        $prefix = "\x19Ethereum Signed Message:\n32";
        $prefixedMessage = $prefix . hex2bin($messageHash);
        return Keccak::hash($prefixedMessage, 256);
    }
    
    /**
     * ECDSA 签名
     */
    private function sign($messageHash, $privateKey) {
        $ec = new EC('secp256k1');
        $key = $ec->keyFromPrivate($privateKey, 'hex');
        $signature = $key->sign($messageHash, ['canonical' => true]);
        
        $r = str_pad($signature->r->toString(16), 64, '0', STR_PAD_LEFT);
        $s = str_pad($signature->s->toString(16), 64, '0', STR_PAD_LEFT);
        $v = dechex($signature->recoveryParam + 27);
        
        return $r . $s . $v;
    }
}

/**
 * API 接口示例：POST /Api/Wallet/profit_withdraw
 */
function profitWithdrawAPI() {
    // 从请求中获取参数
    $amount = $_POST['amount']; // USDT0 金额
    $userId = $_SESSION['user_id']; // 从 session 获取用户 ID
    $userAddress = $_SESSION['wallet_address']; // 用户钱包地址
    
    try {
        // 1. 验证用户余额
        $userBalance = getUserBalance($userId);
        if ($userBalance < floatval($amount)) {
            return json_encode([
                'status' => 0,
                'code' => 1001,
                'info' => '余额不足'
            ]);
        }
        
        // 2. 计算手续费和实际到账金额
        $fee = 1; // 手续费 1 USDT0
        $receiptAmount = floatval($amount) - $fee;
        
        // 3. 获取 XPL 汇率
        $xplRate = getXplRate(); // 例如：0.0914
        
        // 4. 计算 XPL 金额（wei 格式）
        $xplInEther = $receiptAmount * $xplRate;
        $xplAmount = gmp_strval(gmp_mul(gmp_init($xplInEther * 1e9, 10), gmp_init('1000000000', 10)), 10);
        
        // 5. 生成订单号
        $orderId = bin2hex(random_bytes(16));
        
        // 6. 生成签名
        $adminPrivateKey = getenv('ADMIN_PRIVATE_KEY') ?: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
        $signer = new WithdrawSignature($adminPrivateKey);
        $signature = $signer->generateWithdrawSignature($userAddress, $xplAmount, $orderId);
        
        // 7. 锁定用户余额
        lockUserBalance($userId, floatval($amount));
        
        // 8. 创建提现订单
        createWithdrawOrder([
            'user_id' => $userId,
            'order_id' => $orderId,
            'amount' => floatval($amount),
            'fee' => $fee,
            'receipt_amount' => $receiptAmount,
            'xpl_amount' => $xplAmount,
            'user_address' => $userAddress,
            'status' => 'pending'
        ]);
        
        // 9. 返回签名给前端
        return json_encode([
            'status' => 1,
            'info' => 'success',
            'data' => [
                'transaction_id' => $orderId,
                'fee' => strval($fee),
                'receipt_amount' => $receiptAmount,
                'amount' => floatval($amount),
                'signature' => $signature
            ]
        ]);
        
    } catch (Exception $e) {
        error_log('提现失败: ' . $e->getMessage());
        return json_encode([
            'status' => 0,
            'code' => 999,
            'info' => '系统错误'
        ]);
    }
}

// ============ 辅助函数（需要根据实际数据库实现） ============

function getUserBalance($userId) {
    // 从数据库查询用户余额
    return 1000; // 示例
}

function getXplRate() {
    // 从 API 获取 XPL 汇率
    return 0.0914; // 示例
}

function lockUserBalance($userId, $amount) {
    // 锁定用户余额（可用余额 -> 冻结余额）
    error_log("锁定用户 {$userId} 的 {$amount} USDT0");
}

function createWithdrawOrder($orderData) {
    // 创建提现订单记录
    error_log('创建提现订单: ' . json_encode($orderData));
}

// ============ 测试代码 ============

if (php_sapi_name() === 'cli') {
    // 测试签名生成
    $testAddress = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';
    $testAmount = '9548100000000000000'; // 9.5481 XPL in wei
    $testOrderId = 'test-order-123';
    $testPrivateKey = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
    
    echo "测试签名生成:\n";
    echo "用户地址: {$testAddress}\n";
    echo "XPL 金额: 9.5481 XPL\n";
    echo "订单号: {$testOrderId}\n\n";
    
    $signer = new WithdrawSignature($testPrivateKey);
    $signature = $signer->generateWithdrawSignature($testAddress, $testAmount, $testOrderId);
    
    echo "签名: {$signature}\n";
    echo "签名长度: " . strlen($signature) . " 字符\n";
}
?>
