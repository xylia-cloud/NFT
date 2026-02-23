#!/bin/bash

###############################################################################
# 服务器快速部署脚本
# 用于在服务器上快速部署管理员提取功能
###############################################################################

set -e  # 遇到错误立即退出

echo "=== 服务器部署脚本 ==="
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查是否为 root 用户
if [ "$EUID" -eq 0 ]; then 
    echo -e "${YELLOW}警告: 不建议使用 root 用户运行此脚本${NC}"
    read -p "是否继续? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# 1. 检查 Node.js
echo "📦 检查 Node.js..."
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js 未安装${NC}"
    echo "正在安装 Node.js..."
    
    # 检测操作系统
    if [ -f /etc/debian_version ]; then
        # Debian/Ubuntu
        curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
        sudo apt-get install -y nodejs
    elif [ -f /etc/redhat-release ]; then
        # CentOS/RHEL
        curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
        sudo yum install -y nodejs
    else
        echo -e "${RED}不支持的操作系统，请手动安装 Node.js${NC}"
        exit 1
    fi
else
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✅ Node.js 已安装: $NODE_VERSION${NC}"
fi

# 2. 检查 npm
echo ""
echo "📦 检查 npm..."
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm 未安装${NC}"
    exit 1
else
    NPM_VERSION=$(npm --version)
    echo -e "${GREEN}✅ npm 已安装: $NPM_VERSION${NC}"
fi

# 3. 安装项目依赖
echo ""
echo "📦 安装项目依赖..."
if [ ! -d "node_modules" ]; then
    npm install
    echo -e "${GREEN}✅ 依赖安装完成${NC}"
else
    echo -e "${GREEN}✅ 依赖已存在${NC}"
fi

# 4. 配置环境变量
echo ""
echo "🔧 配置环境变量..."
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠️  .env 文件不存在${NC}"
    read -p "是否创建 .env 文件? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        read -p "请输入管理员私钥 (0x...): " PRIVATE_KEY
        echo "ADMIN_PRIVATE_KEY=$PRIVATE_KEY" > .env
        echo "PLASMA_MAINNET_PRIVATE_KEY=$PRIVATE_KEY" >> .env
        chmod 600 .env
        echo -e "${GREEN}✅ .env 文件创建成功${NC}"
    fi
else
    echo -e "${GREEN}✅ .env 文件已存在${NC}"
    
    # 检查是否包含私钥
    if ! grep -q "ADMIN_PRIVATE_KEY" .env; then
        echo -e "${YELLOW}⚠️  .env 文件中未找到 ADMIN_PRIVATE_KEY${NC}"
        read -p "是否添加? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            read -p "请输入管理员私钥 (0x...): " PRIVATE_KEY
            echo "ADMIN_PRIVATE_KEY=$PRIVATE_KEY" >> .env
            echo -e "${GREEN}✅ 私钥已添加${NC}"
        fi
    fi
fi

# 5. 测试脚本
echo ""
echo "🧪 测试提取脚本..."
if [ -f "scripts/admin-withdraw-all.cjs" ]; then
    echo -e "${GREEN}✅ 提取脚本存在${NC}"
    
    # 询问是否测试运行
    read -p "是否测试运行脚本? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo ""
        echo "运行测试..."
        NETWORK=plasmaMainnet node scripts/admin-withdraw-all.cjs || true
    fi
else
    echo -e "${RED}❌ 提取脚本不存在${NC}"
    exit 1
fi

# 6. 创建便捷命令
echo ""
echo "🔧 创建便捷命令..."
read -p "是否创建全局命令 'withdraw-usdt'? (需要 sudo) (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    PROJECT_DIR=$(pwd)
    
    sudo tee /usr/local/bin/withdraw-usdt > /dev/null <<EOF
#!/bin/bash
cd "$PROJECT_DIR" || exit 1
if [ -f .env ]; then
    export \$(cat .env | grep -v '^#' | xargs)
fi
NETWORK="\${1:-plasmaMainnet}" node scripts/admin-withdraw-all.cjs
EOF
    
    sudo chmod +x /usr/local/bin/withdraw-usdt
    echo -e "${GREEN}✅ 全局命令创建成功${NC}"
    echo "使用方法: withdraw-usdt [network]"
fi

# 7. 配置日志
echo ""
echo "📝 配置日志..."
LOG_DIR="/var/log/blockchain"
if [ ! -d "$LOG_DIR" ]; then
    read -p "是否创建日志目录 $LOG_DIR? (需要 sudo) (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        sudo mkdir -p "$LOG_DIR"
        sudo chown $USER:$USER "$LOG_DIR"
        echo -e "${GREEN}✅ 日志目录创建成功${NC}"
    fi
fi

# 8. 完成
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✅ 部署完成！${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "使用方法:"
echo "  1. 命令行运行:"
echo "     cd $(pwd)"
echo "     NETWORK=plasmaMainnet node scripts/admin-withdraw-all.cjs"
echo ""
if [ -f "/usr/local/bin/withdraw-usdt" ]; then
    echo "  2. 使用便捷命令:"
    echo "     withdraw-usdt plasmaMainnet"
    echo ""
fi
echo "相关文档:"
echo "  - 服务器部署指南: SERVER_DEPLOYMENT_GUIDE.md"
echo "  - 管理员提取指南: ADMIN_WITHDRAW_GUIDE.md"
echo "  - 快速参考: QUICK_WITHDRAW.md"
echo ""
