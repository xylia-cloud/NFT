# 使用Nginx Alpine作为基础镜像 - 轻量级且安全
FROM nginx:alpine

# 设置工作目录
WORKDIR /usr/share/nginx/html

# 复制构建文件到Nginx默认目录
COPY dist/ .

# 复制自定义Nginx配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 暴露80端口（HTTP）和443端口（HTTPS）
EXPOSE 80 443

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1

# 以非root用户运行（安全最佳实践）
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chmod -R 755 /usr/share/nginx/html

USER nginx

# 启动Nginx
CMD ["nginx", "-g", "daemon off;"]