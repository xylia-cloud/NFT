#!/bin/bash

# NFT支付通道前端部署脚本
# 使用方法: ./deploy.sh [选项]
# 选项:
#   --build   重新构建项目
#   --docker  使用Docker部署
#   --nginx   使用Nginx部署（默认）

set -e  # 遇到错误退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 函数：打印带颜色的消息
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 默认选项
BUILD=false
DOCKER=false
NGINX=true
SERVER_IP=""
DOMAIN=""

# 解析参数
while [[ $# -gt 0 ]]; do
    case $1 in
        --build)
            BUILD=true
            shift
            ;;
        --docker)
            DOCKER=true
            NGINX=false
            shift
            ;;
        --nginx)
            NGINX=true
            DOCKER=false
            shift
            ;;
        --ip=*)
            SERVER_IP="${1#*=}"
            shift
            ;;
        --domain=*)
            DOMAIN="${1#*=}"
            shift
            ;;
        --help)
            echo "用法: $0 [选项]"
            echo "选项:"
            echo "  --build           重新构建项目"
            echo "  --docker          使用Docker部署"
            echo "  --nginx           使用Nginx部署（默认）"
            echo "  --ip=SERVER_IP    服务器IP地址"
            echo "  --domain=DOMAIN   域名"
            echo "  --help            显示帮助信息"
            exit 0
            ;;
        *)
            print_error "未知选项: $1"
            exit 1
            ;;
    esac
done

# 检查是否已构建
if [ ! -d "dist" ] || [ "$BUILD" = true ]; then
    print_info "构建前端项目..."
    npm run build
    print_info "构建完成！"
else
    print_info "使用已存在的构建文件"
fi

# 检查构建目录
if [ ! -f "dist/index.html" ]; then
    print_error "构建失败：dist/index.html 不存在"
    exit 1
fi

print_info "构建文件统计:"
du -sh dist/
find dist/ -type f -name "*.js" | wc -l | xargs echo "JavaScript文件数:"
find dist/ -type f -name "*.css" | wc -l | xargs echo "CSS文件数:"

# Docker部署
if [ "$DOCKER" = true ]; then
    print_info "使用Docker部署..."
    
    # 检查Docker是否安装
    if ! command -v docker &> /dev/null; then
        print_error "Docker未安装，请先安装Docker"
        exit 1
    fi
    
    # 构建Docker镜像
    print_info "构建Docker镜像..."
    docker build -t nft-payment-frontend:latest .
    
    # 检查是否已有运行中的容器
    if docker ps -a --format '{{.Names}}' | grep -q '^nft-payment$'; then
        print_warn "停止并移除现有容器..."
        docker stop nft-payment || true
        docker rm nft-payment || true
    fi
    
    # 运行新容器
    print_info "启动Docker容器..."
    docker run -d \
        --name nft-payment \
        --restart unless-stopped \
        -p 80:80 \
        -p 443:443 \
        nft-payment-frontend:latest
    
    print_info "Docker容器已启动！"
    print_info "容器状态:"
    docker ps --filter "name=nft-payment"
    
    print_info "访问地址: http://localhost"
    
# Nginx部署
elif [ "$NGINX" = true ]; then
    print_info "使用Nginx部署..."
    
    if [ -z "$SERVER_IP" ]; then
        read -p "请输入服务器IP地址: " SERVER_IP
    fi
    
    if [ -z "$DOMAIN" ]; then
        DOMAIN="$SERVER_IP"
    fi
    
    # 打包构建文件
    print_info "打包构建文件..."
    tar -czf dist.tar.gz dist/
    
    # 上传到服务器
    print_info "上传文件到服务器 $SERVER_IP..."
    scp dist.tar.gz nginx.conf DEPLOYMENT.md root@$SERVER_IP:/tmp/
    
    # 在服务器上执行部署
    print_info "在服务器上执行部署..."
    ssh root@$SERVER_IP << EOF
        set -e
        
        echo "创建网站目录..."
        mkdir -p /var/www/nft-payment
        
        echo "解压构建文件..."
        tar -xzf /tmp/dist.tar.gz -C /var/www/nft-payment/
        
        echo "设置文件权限..."
        chown -R www-data:www-data /var/www/nft-payment
        chmod -R 755 /var/www/nft-payment
        
        echo "配置Nginx..."
        # 备份原有配置
        if [ -f /etc/nginx/sites-available/nft-payment ]; then
            cp /etc/nginx/sites-available/nft-payment /etc/nginx/sites-available/nft-payment.backup-\$(date +%Y%m%d-%H%M%S)
        fi
        
        # 创建Nginx配置
        cat > /etc/nginx/sites-available/nft-payment << NGINX_CONFIG
server {
    listen 80;
    server_name $DOMAIN;
    
    root /var/www/nft-payment/dist;
    index index.html;
    
    # Gzip压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
    
    # SPA路由支持
    location / {
        try_files \$uri \$uri/ /index.html;
    }
    
    # 静态资源缓存
    location ~* \\.(js|css|png|jpg|jpeg|gif|ico|svg)\$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
NGINX_CONFIG
        
        echo "启用站点..."
        ln -sf /etc/nginx/sites-available/nft-payment /etc/nginx/sites-enabled/
        
        echo "测试Nginx配置..."
        nginx -t
        
        echo "重启Nginx..."
        systemctl reload nginx
        
        echo "清理临时文件..."
        rm -f /tmp/dist.tar.gz
        
        echo "部署完成！"
EOF
    
    print_info "Nginx部署完成！"
    print_info "访问地址: http://$DOMAIN"
    
    # 清理本地临时文件
    rm -f dist.tar.gz
fi

print_info "部署完成！"
print_info "详细部署指南请查看: DEPLOYMENT.md"