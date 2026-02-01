#!/bin/bash

echo "🚀 启动 PLASMA 前端 (Plasma 网络)"
echo "===================================="

# 检查是否在 frontend 目录
if [ ! -f "index.html" ]; then
    echo "📁 切换到 frontend 目录..."
    cd frontend || { echo "❌ 无法进入 frontend 目录"; exit 1; }
fi

echo ""
echo "📋 网络信息:"
echo "  网络: Plasma 主网 (链ID: 9745)"
echo "  充币请走 Plasma 网络"
echo "  Gas 费: XPL"
echo ""

echo "🌐 启动前端服务器..."
echo "  访问: http://localhost:8080"
echo ""

echo "📝 操作步骤:"
echo "  1. 访问 http://localhost:8080"
echo "  2. 确保钱包已切换到 Plasma 主网"
echo "  3. 充币请走 Plasma 网络，勿使用其他网络"
echo "  4. 点击右上角「连接钱包」连接"
echo ""

echo "⚠️  重要提醒:"
echo "  - 充币必须走 Plasma 网络，其他网络充币将无法到账"
echo "  - 链上交易需要 XPL 作为 Gas 费"
echo "  - 确保钱包已切换到 Plasma 主网 (链ID: 9745)"
echo ""

echo "🔗 相关链接:"
echo "  - Plasma 区块浏览器: https://plasmascan.to"
echo "  - Plasma 网络配置: https://chainlist.org/chain/9745"
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