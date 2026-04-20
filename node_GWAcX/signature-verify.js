/**
 * 以太坊签名服务
 * 1. 验证 MetaMask 签名 (POST /verify-signature)
 * 2. 生成提现签名 (POST /sign-withdraw) — owner 私钥签名，用于 withdrawWithSignature
 */

require('dotenv').config();

const express = require('express');
const { ethers } = require('ethers');

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '127.0.0.1';

// 合约 owner 私钥（从环境变量读取）
const OWNER_PRIVATE_KEY = process.env.OWNER_PRIVATE_KEY || '';
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || '';
const CHAIN_ID = parseInt(process.env.CHAIN_ID || '31337');
const USDT_DECIMALS = parseInt(process.env.USDT_DECIMALS || '6');
const ADMIN_ADDRESS = process.env.ADMIN_ADDRESS || '';
const USDT_ADDRESS = process.env.USDT_ADDRESS || '';
const RPC_URL = process.env.RPC_URL || 'http://127.0.0.1:8545';

// 解析 JSON 请求体
app.use(express.json());

// 日志中间件
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

// 验证签名接口
app.post('/verify-signature', async (req, res) => {
  try {
    const { message, signature } = req.body;

    if (!message || !signature) {
      return res.status(400).json({
        success: false,
        error: 'Missing message or signature'
      });
    }

    // 从签名中恢复地址
    const recoveredAddress = ethers.utils.verifyMessage(message, signature);

    console.log(`✓ Signature verified: ${recoveredAddress}`);

    res.json({
      success: true,
      address: recoveredAddress.toLowerCase()
    });

  } catch (error) {
    console.error('✗ Signature verification error:', error.message);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// 提现签名接口 — 后端调用，生成 owner 签名给前端
app.post('/sign-withdraw', async (req, res) => {
  try {
    if (!OWNER_PRIVATE_KEY) {
      return res.status(500).json({ success: false, error: 'OWNER_PRIVATE_KEY not configured' });
    }
    if (!CONTRACT_ADDRESS) {
      return res.status(500).json({ success: false, error: 'CONTRACT_ADDRESS not configured' });
    }

    const { user, amount, orderId, tokenDecimals } = req.body;

    if (!user || !amount || !orderId) {
      return res.status(400).json({ success: false, error: 'Missing user, amount, or orderId' });
    }

    // tokenDecimals: 调用方指定精度，默认用 USDT_DECIMALS (6)
    const decimals = tokenDecimals !== undefined ? parseInt(tokenDecimals) : USDT_DECIMALS;

    // 将人类可读金额转为 wei
    const amountWei = ethers.utils.parseUnits(amount.toString(), decimals);

    // 生成唯一 nonce
    const nonce = Date.now().toString() + Math.random().toString(36).substr(2, 8);
    const nonceUint = ethers.BigNumber.from(ethers.utils.id(nonce));

    // 签名有效期：8分钟（480秒）
    const signatureTTL = 480;
    const deadline = Math.floor(Date.now() / 1000) + signatureTTL;

    // 构造与合约一致的签名消息
    // keccak256(abi.encodePacked(user, amount, orderId, nonce, deadline, chainId, contractAddress))
    const messageHash = ethers.utils.solidityKeccak256(
      ['address', 'uint256', 'string', 'uint256', 'uint256', 'uint256', 'address'],
      [user, amountWei, orderId, nonceUint, deadline, CHAIN_ID, CONTRACT_ADDRESS]
    );

    // 用 owner 私钥签名
    const wallet = new ethers.Wallet(OWNER_PRIVATE_KEY);
    const signature = await wallet.signMessage(ethers.utils.arrayify(messageHash));

    console.log(`✓ Withdraw signed: user=${user}, amount=${amount}, amountWei=${amountWei.toString()}, orderId=${orderId}, deadline=${deadline}`);

    res.json({
      success: true,
      signature: signature,
      nonce: nonceUint.toString(),
      amountWei: amountWei.toString(),
      deadline: deadline.toString(),
      contractAddress: CONTRACT_ADDRESS,
      chainId: CHAIN_ID,
      signatureTTL: signatureTTL,
      signatureExpiresAt: deadline
    });

  } catch (error) {
    console.error('✗ Sign withdraw error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 管理员信息接口 — 返回管理员地址和合约余额
app.get('/admin/info', async (req, res) => {
  try {
    if (!ADMIN_ADDRESS) {
      return res.status(500).json({ success: false, error: 'ADMIN_ADDRESS not configured' });
    }

    let contract_balance = '0';
    let admin_balance = '0';
    let admin_xpl_balance = '0';
    
    // 如果配置了 RPC 和 USDT 地址，查询余额
    if (RPC_URL && USDT_ADDRESS && CONTRACT_ADDRESS) {
      try {
        // 根据 URL 协议选择 Provider
        let provider;
        const network = { chainId: CHAIN_ID, name: 'plasma' };
        
        if (RPC_URL.startsWith('wss://') || RPC_URL.startsWith('ws://')) {
          provider = new ethers.providers.WebSocketProvider(RPC_URL, network);
        } else {
          provider = new ethers.providers.JsonRpcProvider(RPC_URL, network);
        }
        
        // 查询 XPL 原生代币余额
        const xplBalance = await provider.getBalance(ADMIN_ADDRESS);
        admin_xpl_balance = ethers.utils.formatEther(xplBalance);
        
        const usdtAbi = [
          'function balanceOf(address) view returns (uint256)',
          'function decimals() view returns (uint8)'
        ];
        const usdt = new ethers.Contract(USDT_ADDRESS, usdtAbi, provider);
        
        // 获取实际精度
        const decimals = await usdt.decimals();
        
        // 合约余额
        const cBalance = await usdt.balanceOf(CONTRACT_ADDRESS);
        contract_balance = ethers.utils.formatUnits(cBalance, decimals);
        
        // 管理员余额
        const aBalance = await usdt.balanceOf(ADMIN_ADDRESS);
        admin_balance = ethers.utils.formatUnits(aBalance, decimals);
        
        // 关闭 WebSocket 连接
        if (provider.destroy) {
          provider.destroy();
        }
      } catch (e) {
        console.error('查询余额失败:', e.message);
      }
    }

    res.json({
      success: true,
      admin_address: ADMIN_ADDRESS,
      contract_address: CONTRACT_ADDRESS,
      contract_balance: contract_balance,
      admin_balance: admin_balance,
      admin_xpl_balance: admin_xpl_balance
    });
  } catch (error) {
    console.error('✗ Admin info error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 健康检查接口
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'signature-verify',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// 根路径
app.get('/', (req, res) => {
  res.json({
    service: 'Ethereum Signature Service',
    version: '2.0.0',
    endpoints: {
      'POST /verify-signature': 'Verify Ethereum signature',
      'POST /sign-withdraw': 'Sign withdrawal for withdrawWithSignature',
      'GET /health': 'Health check'
    }
  });
});

// 启动服务
app.listen(PORT, HOST, () => {
  console.log('='.repeat(60));
  console.log('🚀 Ethereum Signature Service Started');
  console.log('='.repeat(60));
  console.log(`📍 URL: http://${HOST}:${PORT}`);
  console.log(`⏰ Time: ${new Date().toISOString()}`);
  console.log(`🔑 Owner key: ${OWNER_PRIVATE_KEY ? 'configured' : 'NOT SET'}`);
  console.log(`📄 Contract: ${CONTRACT_ADDRESS || 'NOT SET'}`);
  console.log(`🔗 Chain ID: ${CHAIN_ID}`);
  console.log('');
  console.log('📌 Endpoints:');
  console.log(`   POST http://${HOST}:${PORT}/verify-signature`);
  console.log(`   POST http://${HOST}:${PORT}/sign-withdraw`);
  console.log(`   GET  http://${HOST}:${PORT}/health`);
  console.log('='.repeat(60));
});

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('\n⚠️  SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\n⚠️  SIGINT received, shutting down gracefully...');
  process.exit(0);
});
