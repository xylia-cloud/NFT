-- 管理员提取日志表
CREATE TABLE IF NOT EXISTS `admin_withdraw_log` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `network` varchar(50) NOT NULL DEFAULT '' COMMENT '网络名称 (plasmaMainnet, bscMainnet等)',
  `tx_hash` varchar(100) NOT NULL DEFAULT '' COMMENT '交易哈希',
  `amount` varchar(50) NOT NULL DEFAULT '' COMMENT '提取金额',
  `status` tinyint(1) NOT NULL DEFAULT '0' COMMENT '状态: 0-失败, 1-成功',
  `output` text COMMENT '脚本输出内容',
  `admin_id` int(11) NOT NULL DEFAULT '0' COMMENT '操作管理员ID',
  `addtime` int(11) NOT NULL DEFAULT '0' COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_network` (`network`),
  KEY `idx_status` (`status`),
  KEY `idx_addtime` (`addtime`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='管理员提取日志表';
