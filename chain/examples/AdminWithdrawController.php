<?php
namespace Admin\Controller;

/**
 * 管理员提取合约余额控制器
 * 一键提取合约中的 USDT0 到管理员账号
 * 
 * 部署说明：
 * 1. 将此文件放到 Application/Admin/Controller/ 目录
 * 2. 在数据库中执行 admin_withdraw_log.sql 创建日志表
 * 3. 修改下面的配置项
 * 4. 确保 Node 服务正在运行（用于查询余额）
 */
class AdminWithdrawController extends AdminController
{
    // ==================== 配置项 ====================
    
    /**
     * admin-withdraw 项目路径
     */
    private $projectDir = '/www/wwwroot/admin-withdraw';
    
    /**
     * Node.js 可执行文件路径
     */
    private $nodePath = '/www/server/nodejs/v24.13.1/bin';
    
    /**
     * Node 服务配置（用于查询余额）
     */
    private $nodeServiceHost = '127.0.0.1';
    private $nodeServicePort = '3000';
    
    // ==================== 配置项结束 ====================

    /**
     * 初始化方法
     */
    protected function _initialize()
    {
        parent::_initialize();
        $allow_action = array('index', 'doWithdraw');
        if (!in_array(ACTION_NAME, $allow_action)) {
            $this->error("页面不存在！" . ACTION_NAME);
        }
    }

    /**
     * 提取余额页面
     */
    public function index()
    {
        // 从 node 服务获取管理员信息
        $admin_info = $this->getAdminInfo();

        // 获取最近提取记录
        $records = M('admin_withdraw_log')->order('id desc')->limit(10)->select();

        $this->assign('admin_info', $admin_info);
        $this->assign('records', $records);
        $this->display();
    }

    /**
     * 执行提取操作
     * POST 请求，通过 shell_exec 执行 node 脚本
     */
    public function doWithdraw()
    {
        if (!IS_POST) {
            $this->error('非法请求');
        }

        // 使用配置的路径
        $projectDir = $this->projectDir;
        $nodePath = $this->nodePath;

        // 设置执行超时时间（60秒）
        set_time_limit(60);

        // 执行命令 - 直接使用项目内的 hardhat
        $command = "cd {$projectDir} && {$nodePath}/node {$projectDir}/node_modules/.bin/hardhat run scripts/admin-withdraw-all.mjs --network plasmaMainnet 2>&1";

        minfo('管理员提取执行命令: %s', $command);
        $output = shell_exec($command);
        minfo('管理员提取输出: %s', json_encode($output));

        // 解析结果
        $tx_hash = '';
        $amount = '';
        $status = 0;

        if (strpos($output, '✅ 提取成功') !== false || strpos($output, '提取成功') !== false) {
            $status = 1;
            // 提取交易哈希
            if (preg_match('/交易哈希:\s*(0x[a-fA-F0-9]+)/', $output, $matches)) {
                $tx_hash = $matches[1];
            }
            // 提取金额（支持 USDT 和 USDT0）
            if (preg_match('/提取金额:\s*([\d.]+)\s*USDT0?/', $output, $matches)) {
                $amount = $matches[1];
            }
        } elseif (strpos($output, '合约余额为 0') !== false) {
            $status = 1;
            $amount = '0';
        }

        // 记录到数据库（过滤 emoji）
        $output_clean = preg_replace('/[\x{10000}-\x{10FFFF}]/u', '', $output);
        $log_data = array(
            'network' => 'plasmaMainnet',
            'tx_hash' => $tx_hash,
            'amount' => $amount,
            'status' => $status,
            'output' => mb_substr($output_clean, 0, 2000),
            'admin_id' => session('user_auth.uid') ? session('user_auth.uid') : 0,
            'addtime' => time()
        );
        M('admin_withdraw_log')->add($log_data);

        if ($status == 1) {
            if ($amount == '0' || empty($amount)) {
                $this->success('合约余额为 0，无需提取');
            } else {
                $this->success('提取成功！金额: ' . $amount . ' USDT0，交易哈希: ' . $tx_hash);
            }
        } else {
            $this->error('提取失败，请查看日志');
        }
    }

    /**
     * 从 node 服务获取管理员信息
     * @return array
     */
    private function getAdminInfo()
    {
        // 使用配置的 Node 服务地址
        $node_host = $this->nodeServiceHost;
        $node_port = $this->nodeServicePort;
        $url = 'http://' . $node_host . ':' . $node_port . '/admin/info';

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 10);
        $response = curl_exec($ch);
        curl_close($ch);

        $default = array(
            'admin_address' => '0xA4a7747C9241ba5A9AF9137bb662f38F463Fdf1B',
            'contract_address' => '0x13dFde78A02C4138FD6aaAdd795FA11471CcfE54',
            'contract_balance' => '0',
            'admin_balance' => '0',
            'admin_xpl_balance' => '0',
            'error' => ''
        );

        if ($response === false) {
            $default['error'] = 'Node 服务连接失败';
            return $default;
        }

        $result = json_decode($response, true);
        if (!is_array($result) || !isset($result['success']) || !$result['success']) {
            $default['error'] = isset($result['error']) ? $result['error'] : '获取信息失败';
            return $default;
        }

        return array(
            'admin_address' => isset($result['admin_address']) ? $result['admin_address'] : $default['admin_address'],
            'contract_address' => isset($result['contract_address']) ? $result['contract_address'] : $default['contract_address'],
            'contract_balance' => isset($result['contract_balance']) ? $result['contract_balance'] : '0',
            'admin_balance' => isset($result['admin_balance']) ? $result['admin_balance'] : '0',
            'admin_xpl_balance' => isset($result['admin_xpl_balance']) ? $result['admin_xpl_balance'] : '0',
            'error' => ''
        );
    }
}
