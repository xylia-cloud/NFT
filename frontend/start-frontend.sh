#!/bin/bash

echo "🚀 启动 BSC 主网支付通道前端"
echo "===================================="

# 检查是否在 frontend 目录
if [ ! -f "index.html" ]; then
    echo "📁 切换到 frontend 目录..."
    cd frontend || { echo "❌ 无法进入 frontend 目录"; exit 1; }
fi

echo ""
echo "📋 部署信息:"
echo "  合约地址: 0xDC8eAbca4665b57Aae33d99394b92D0c9C3AF39b"
echo "  网络: BSC 主网 (链ID: 56)"
echo "  部署账户: 0xDDD41A9b717088Da9E1ea6ba618e73c9301DdAE3"
echo "  剩余余额: ~0.002875 BNB"
echo ""

echo "🌐 启动前端服务器..."
echo "  访问: http://localhost:8080"
echo ""

echo "📝 操作步骤:"
echo "  1. 访问 http://localhost:8080"
echo "  2. 在 'Set Contract Address' 输入框中输入: 0xDC8eAbca4665b57Aae33d99394b92D0c9C3AF39b"
echo "  3. 点击 'Update Contract' 按钮"
echo "  4. 确保 MetaMask 连接到 BSC 主网"
echo "  5. 点击 'Connect MetaMask'"
echo "  6. 使用最小金额 (0.0001 BNB) 测试存款和提现"
echo ""

echo "⚠️  重要提醒:"
echo "  - 这是真实的 BNB 交易，不可撤销"
echo "  - 从小额开始测试 (0.0001 BNB)"
echo "  - 确保 MetaMask 连接到 BSC 主网"
echo "  - 确认网络名称: Binance Smart Chain (链ID: 56)"
echo ""

echo "🔗 相关链接:"
echo "  - 合约地址: https://bscscan.com/address/0xDC8eAbca4665b57Aae33d99394b92D0c9C3AF39b"
echo "  - BSC 主网配置: https://chainlist.org/chain/56"
echo ""

# 检查 Python3
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 未安装"
    echo "请安装 Python3 或使用其他 HTTP 服务器"
    exit 1
fi

echo "✅ 正在启动服务器..."
echo "按 Ctrl+C 停止服务器"
echo "===================================="

# 启动服务器
python3 -m http.server 8080