/**
 * 后端提现签名示例（Node.js）
 * 
 * 功能：
 * 1. 用户请求提现时，后端生成签名
 * 2. 前端使用签名调用合约
 * 3. 合约验证签名是否来自管理员
 */

const { ethers } = require('ethers');

// 管理员私钥（从环境变量读取，不要硬编码！）
const ADMIN_PRIVATE_KEY = process.env.ADMIN_PRIVATE_KEY || '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';

/**
 * 生成提现签名
 * @param {string} userAddress - 用户钱包地址
 * @param {string} amount - XPL 金额（wei 格式，字符串）
 * @param {string} orderId - 订单号
 * @returns {string} 签名（0x开头的十六进制字符串）
 */
function generateWithdrawSignature(userAddress, amount, orderId) {
  // 1. 创建钱包实例
  const wallet = new ethers.Wallet(ADMIN_PRIVATE_KEY);
  
  // 2. 构造消息哈希（与合约中的逻辑一致）
  const messageHash = ethers.solidityPackedKeccak256(
    ['address', 'uint256', 'string'],
    [userAddress, amount, orderId]
  );
  
  // 3. 签名（ethers.js 会自动添加 "\x19Ethereum Signed Message:\n32" 前缀）
  const signature = wallet.signMessageSync(ethers.getBytes(messageHash));
  
  return signature;
}

/**
 * API 接口示例：POST /Api/Wallet/profit_withdraw
 */
async function profitWithdrawAPI(req, res) {
  try {
    const { amount } = req.body; // USDT0 金额
    const userAddress = req.user.wallet_address; // 从 token 中获取用户地址
    
    // 1. 验证用户余额
    const userBalance = await getUserBalance(req.user.id);
    if (userBalance < parseFloat(amount)) {
      return res.json({
        status: 0,
        code: 1001,
        info: '余额不足'
      });
    }
    
    // 2. 计算手续费和实际到账金额
    const fee = 1; // 手续费 1 USDT0
    const receiptAmount = parseFloat(amount) - fee;
    
    // 3. 获取 XPL 汇率
    const xplRate = await getXplRate(); // 例如：0.0914
    
    // 4. 计算 XPL 金额（wei 格式）
    const xplAmount = ethers.parseEther((receiptAmount * xplRate).toString());
    
    // 5. 生成订单号
    const orderId = generateOrderId();
    
    // 6. 生成签名
    const signature = generateWithdrawSignature(
      userAddress,
      xplAmount.toString(),
      orderId
    );
    
    // 7. 锁定用户余额
    await lockUserBalance(req.user.id, parseFloat(amount));
    
    // 8. 创建提现订单
    await createWithdrawOrder({
      userId: req.user.id,
      orderId: orderId,
      amount: parseFloat(amount),
      fee: fee,
      receiptAmount: receiptAmount,
      xplAmount: xplAmount.toString(),
      userAddress: userAddress,
      status: 'pending'
    });
    
    // 9. 返回签名给前端
    return res.json({
      status: 1,
      info: 'success',
      data: {
        transaction_id: orderId,
        fee: fee.toString(),
        receipt_amount: receiptAmount,
        amount: parseFloat(amount),
        signature: signature // 签名
      }
    });
    
  } catch (error) {
    console.error('提现失败:', error);
    return res.json({
      status: 0,
      code: 999,
      info: '系统错误'
    });
  }
}

/**
 * 监听合约事件
 */
async function listenWithdrawEvents() {
  const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8546');
  const contractAddress = '0x3Aa5ebB10DC797CAC828524e59A333d0A371443c';
  
  const contractABI = [
    'event UserWithdraw(address indexed to, uint256 amount, string orderId)'
  ];
  
  const contract = new ethers.Contract(contractAddress, contractABI, provider);
  
  // 监听 UserWithdraw 事件
  contract.on('UserWithdraw', async (to, amount, orderId, event) => {
    console.log('🎉 检测到提现事件:');
    console.log('  用户地址:', to);
    console.log('  XPL 金额:', ethers.formatEther(amount));
    console.log('  订单号:', orderId);
    console.log('  交易哈希:', event.log.transactionHash);
    
    // 更新订单状态
    await updateWithdrawOrder(orderId, {
      status: 'completed',
      txHash: event.log.transactionHash,
      completedAt: new Date()
    });
    
    // 扣除冻结余额
    await deductFrozenBalance(orderId);
    
    console.log('✅ 订单已完成:', orderId);
  });
  
  console.log('👂 开始监听提现事件...');
}

// ============ 辅助函数（需要根据实际数据库实现） ============

function generateOrderId() {
  return require('crypto').randomBytes(16).toString('hex');
}

async function getUserBalance(userId) {
  // 从数据库查询用户余额
  return 1000; // 示例
}

async function getXplRate() {
  // 从 API 获取 XPL 汇率
  return 0.0914; // 示例
}

async function lockUserBalance(userId, amount) {
  // 锁定用户余额（可用余额 -> 冻结余额）
  console.log(`锁定用户 ${userId} 的 ${amount} USDT0`);
}

async function createWithdrawOrder(orderData) {
  // 创建提现订单记录
  console.log('创建提现订单:', orderData);
}

async function updateWithdrawOrder(orderId, updates) {
  // 更新订单状态
  console.log(`更新订单 ${orderId}:`, updates);
}

async function deductFrozenBalance(orderId) {
  // 扣除冻结余额
  console.log(`扣除订单 ${orderId} 的冻结余额`);
}

// ============ 测试代码 ============

if (require.main === module) {
  // 测试签名生成
  const testAddress = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';
  const testAmount = ethers.parseEther('9.5481').toString();
  const testOrderId = 'test-order-123';
  
  console.log('测试签名生成:');
  console.log('用户地址:', testAddress);
  console.log('XPL 金额:', ethers.formatEther(testAmount), 'XPL');
  console.log('订单号:', testOrderId);
  
  const signature = generateWithdrawSignature(testAddress, testAmount, testOrderId);
  console.log('签名:', signature);
  console.log('\n签名长度:', signature.length, '字符');
  
  // 启动事件监听
  // listenWithdrawEvents();
}

module.exports = {
  generateWithdrawSignature,
  profitWithdrawAPI,
  listenWithdrawEvents
};
