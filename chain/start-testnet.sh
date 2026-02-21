#!/bin/bash

# 启动本地测试链并部署合约的快速脚本

echo "🚀 启动 Hardhat 本地测试链..."
echo "📍 RPC URL: http://127.0.0.1:8546"
echo "🔗 Chain ID: 31337"
echo ""
echo "⚠️  注意：请在新终端中运行部署脚本"
echo "   部署命令: npm run deploy:local"
echo ""
echo "📋 固定的合约地址："
echo "   MockUSDT: 0x5FbDB2315678afecb367f032d93F642f64180aa3"
echo "   MockXPL: 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"
echo "   PaymentChannel: 0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0"
echo ""
echo "按 Ctrl+C 停止节点"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

npx hardhat node --hostname 127.0.0.1 --port 8546
