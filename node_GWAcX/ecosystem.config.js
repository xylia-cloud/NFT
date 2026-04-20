module.exports = {
  apps: [{
    name: 'signature-verify',
    script: './signature-verify.js',
    instances: 1,
    exec_mode: 'fork',
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    env: {
      NODE_ENV: 'production'
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    // 重启策略
    max_restarts: 10,
    min_uptime: '10s',
    restart_delay: 5000,
    // 监听端口冲突
    listen_timeout: 10000,
    kill_timeout: 5000
  }]
};
