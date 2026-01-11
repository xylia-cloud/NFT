# 前端部署指南

本文档详细说明如何将NFT支付通道前端部署到云服务器。

## 构建状态

✅ 项目已成功构建，输出目录：`frontend/dist/`

## 部署选项

### 选项1：Nginx静态文件托管（推荐）

这是最简单、最常用的部署方式。

#### 步骤

1. **准备服务器**
   ```bash
   # 更新系统
   sudo apt update && sudo apt upgrade -y
   
   # 安装Nginx
   sudo apt install nginx -y
   
   # 启动Nginx
   sudo systemctl start nginx
   sudo systemctl enable nginx
   ```

2. **上传构建文件**
   ```bash
   # 在本地打包构建文件
   cd /Users/wangqinglei/工作/Synchronize-folders/赵长鹏/NFT/frontend
   tar -czf dist.tar.gz dist/
   
   # 上传到服务器（使用scp）
   scp dist.tar.gz user@your-server-ip:/tmp/
   
   # 在服务器上解压
   ssh user@your-server-ip
   sudo mkdir -p /var/www/nft-payment
   sudo tar -xzf /tmp/dist.tar.gz -C /var/www/nft-payment/
   sudo chown -R www-data:www-data /var/www/nft-payment
   ```

3. **配置Nginx**
   创建文件 `/etc/nginx/sites-available/nft-payment`：
   ```nginx
   server {
       listen 80;
       server_name your-domain.com; # 替换为您的域名或IP
       
       root /var/www/nft-payment/dist;
       index index.html;
       
       # Gzip压缩
       gzip on;
       gzip_vary on;
       gzip_min_length 1024;
       gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
       
       # 缓存静态资源
       location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
           expires 1y;
           add_header Cache-Control "public, immutable";
       }
       
       # SPA路由支持
       location / {
           try_files $uri $uri/ /index.html;
       }
       
       # 安全头部
       add_header X-Frame-Options "SAMEORIGIN" always;
       add_header X-XSS-Protection "1; mode=block" always;
       add_header X-Content-Type-Options "nosniff" always;
       add_header Referrer-Policy "no-referrer-when-downgrade" always;
       add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
   }
   ```

4. **启用站点并重启Nginx**
   ```bash
   sudo ln -s /etc/nginx/sites-available/nft-payment /etc/nginx/sites-enabled/
   sudo nginx -t  # 测试配置
   sudo systemctl reload nginx
   ```

5. **配置防火墙**
   ```bash
   sudo ufw allow 'Nginx Full'
   sudo ufw enable
   ```

### 选项2：Docker部署

适合需要容器化部署的场景。

#### Dockerfile
在项目根目录创建 `Dockerfile`：
```dockerfile
# 使用Nginx Alpine作为基础镜像
FROM nginx:alpine

# 复制构建文件到Nginx默认目录
COPY dist/ /usr/share/nginx/html/

# 复制自定义Nginx配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 暴露80端口
EXPOSE 80

# 启动Nginx
CMD ["nginx", "-g", "daemon off;"]
```

#### nginx.conf
创建 `nginx.conf`：
```nginx
server {
    listen 80;
    server_name localhost;
    
    root /usr/share/nginx/html;
    index index.html;
    
    # SPA路由支持
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

#### 构建和运行
```bash
# 构建镜像
docker build -t nft-payment-frontend .

# 运行容器
docker run -d -p 80:80 --name nft-payment nft-payment-frontend

# 查看日志
docker logs nft-payment
```

### 选项3：使用PM2 + Serve（Node.js方式）

适合已有Node.js环境的服务器。

#### 安装依赖
```bash
npm install -g serve pm2
```

#### 使用Serve启动
```bash
# 直接启动
serve -s dist -l 3000

# 或使用PM2管理
pm2 serve dist 3000 --name "nft-payment"
pm2 save
pm2 startup
```

## 环境配置

### 生产环境注意事项

1. **合约地址**：已硬编码为最新合约地址 `0x2bBb92EAd42Bf0B73DA8a9Ed60E04842e2419c50`

2. **HTTPS配置**（强烈推荐）：
   ```bash
   # 安装Certbot
   sudo apt install certbot python3-certbot-nginx -y
   
    #获取证书
   sudo certbot --nginx -d your-domain.com
   
   # 自动续期
   sudo certbot renew --dry-run
   ```

3. **域名配置**：
   - 在DNS服务商处添加A记录指向服务器IP
   - 等待DNS传播（通常需要几分钟到几小时）

## 监控和维护

### 查看Nginx日志
```bash
# 访问日志
sudo tail -f /var/log/nginx/access.log

# 错误日志
sudo tail -f /var/log/nginx/error.log
```

### 性能监控
```bash
# 查看服务器资源使用
htop

# 查看Nginx状态
sudo systemctl status nginx
```

## 故障排除

### 常见问题

1. **403 Forbidden**
   ```bash
   # 检查文件权限
   sudo chown -R www-data:www-data /var/www/nft-payment
   sudo chmod -R 755 /var/www/nft-payment
   ```

2. **502 Bad Gateway**
   ```bash
   # 检查Nginx是否运行
   sudo systemctl status nginx
   
   # 重启Nginx
   sudo systemctl restart nginx
   ```

3. **SPA路由404**
   - 确保Nginx配置中包含 `try_files $uri $uri/ /index.html;`

4. **静态资源加载失败**
   ```bash
   # 检查文件是否存在
   ls -la /var/www/nft-payment/dist/
   
   # 检查Nginx配置的root路径
   ```

### 更新部署
当代码更新时：
```bash
# 1. 本地重新构建
npm run build

# 2. 上传新文件
scp -r dist/* user@your-server-ip:/var/www/nft-payment/dist/

# 3. 重启Nginx
ssh user@your-server-ip "sudo systemctl reload nginx"
```

## 安全建议

1. **定期更新**：保持系统和Nginx最新
2. **使用防火墙**：只开放必要端口（80, 443）
3. **启用HTTPS**：保护数据传输安全
4. **监控日志**：及时发现异常访问
5. **备份配置**：定期备份Nginx配置和网站文件

## 联系支持

如有部署问题，请检查：
- 服务器网络连接
- 防火墙设置
- 文件权限
- Nginx配置语法

参考文档：
- [Nginx官方文档](https://nginx.org/en/docs/)
- [Vite部署指南](https://vitejs.dev/guide/static-deploy.html)
- [Let's Encrypt文档](https://letsencrypt.org/docs/)