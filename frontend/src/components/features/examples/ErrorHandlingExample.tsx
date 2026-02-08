/**
 * 错误处理使用示例
 * 展示如何在组件中使用错误码处理系统
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ErrorAlert, InlineError, ErrorToast } from '@/components/ui/error-alert';
import { useApiError, useSimpleError } from '@/hooks/useApiError';
import { login, recharge, withdraw, reinvest, ApiError } from '@/lib/api';
import { Loader2 } from 'lucide-react';

/**
 * 示例 1: 登录表单 - 使用完整的错误处理
 */
export function LoginExample() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { error, handleError, clearError } = useApiError(
    // 认证错误回调
    () => {
      console.log('认证失败，跳转到登录页');
      // 可以在这里执行跳转逻辑
    }
  );

  const handleLogin = async () => {
    clearError();
    
    // 前端验证
    if (!username) {
      handleError(new ApiError(101, '用户名不能为空', 'auth'));
      return;
    }
    if (!password) {
      handleError(new ApiError(102, '密码不能为空', 'auth'));
      return;
    }

    setIsLoading(true);
    try {
      const result = await login({ username, password });
      console.log('登录成功:', result);
      // 处理登录成功逻辑
    } catch (err) {
      handleError(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>登录示例</CardTitle>
        <CardDescription>展示完整的错误处理流程</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 错误提示 */}
        {error.message && (
          <ErrorAlert
            code={error.code}
            message={error.message}
            category={error.category}
            onClose={clearError}
          />
        )}

        {/* 表单 */}
        <div className="space-y-2">
          <Label htmlFor="username">用户名</Label>
          <Input
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="请输入用户名"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">密码</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="请输入密码"
          />
        </div>

        <Button
          className="w-full"
          onClick={handleLogin}
          disabled={isLoading}
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          登录
        </Button>
      </CardContent>
    </Card>
  );
}

/**
 * 示例 2: 充值表单 - 使用简化的错误处理
 */
export function RechargeExample() {
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { errorMessage, handleError, clearError } = useSimpleError();

  const handleRecharge = async () => {
    clearError();

    const amountNum = Number(amount);
    
    // 前端验证
    if (!amount || amountNum <= 0) {
      handleError(new ApiError(20501, '充值金额无效', 'recharge'));
      return;
    }

    if (amountNum < 500 || amountNum > 30000) {
      handleError(new ApiError(20501, '充值金额必须在 500-30000 范围内', 'recharge'));
      return;
    }

    if (amountNum % 500 !== 0 && amountNum % 1000 !== 0) {
      handleError(new ApiError(20501, '充值金额必须是 500 或 1000 的倍数', 'recharge'));
      return;
    }

    setIsLoading(true);
    try {
      const result = await recharge({ amount: amountNum });
      console.log('充值成功:', result);
      setAmount('');
      // 显示成功提示
    } catch (err) {
      handleError(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>充值示例</CardTitle>
        <CardDescription>展示简化的错误处理</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="amount">充值金额 (USDT0)</Label>
          <Input
            id="amount"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="500-30000，必须是500或1000的倍数"
          />
          {/* 内联错误提示 */}
          <InlineError message={errorMessage} />
        </div>

        <Button
          className="w-full"
          onClick={handleRecharge}
          disabled={isLoading}
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          充值
        </Button>
      </CardContent>
    </Card>
  );
}

/**
 * 示例 3: 提现表单 - 使用 Toast 风格错误提示
 */
export function WithdrawExample() {
  const [walletAddress, setWalletAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  
  const { error, handleError, clearError } = useApiError(
    undefined,
    // 余额不足回调
    () => {
      console.log('余额不足，引导用户充值');
    }
  );

  const handleWithdraw = async () => {
    clearError();
    setShowToast(false);

    // 前端验证
    if (!walletAddress) {
      const err = new ApiError(140, '提现钱包地址必填', 'withdraw');
      handleError(err);
      setShowToast(true);
      return;
    }
    if (!amount) {
      const err = new ApiError(141, '提现数量必填', 'withdraw');
      handleError(err);
      setShowToast(true);
      return;
    }
    if (!password) {
      const err = new ApiError(142, '提现资产密码必填', 'withdraw');
      handleError(err);
      setShowToast(true);
      return;
    }

    setIsLoading(true);
    try {
      const result = await withdraw({
        walletAddress,
        amount: Number(amount),
        assetPassword: password,
      });
      console.log('提现成功:', result);
      // 清空表单
      setWalletAddress('');
      setAmount('');
      setPassword('');
    } catch (err) {
      handleError(err);
      setShowToast(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Toast 错误提示 */}
      {showToast && error.message && (
        <ErrorToast
          code={error.code}
          message={error.message}
          category={error.category}
          onClose={() => {
            setShowToast(false);
            clearError();
          }}
          duration={5000}
        />
      )}

      <Card>
        <CardHeader>
          <CardTitle>提现示例</CardTitle>
          <CardDescription>展示 Toast 风格的错误提示</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="wallet">钱包地址</Label>
            <Input
              id="wallet"
              value={walletAddress}
              onChange={(e) => setWalletAddress(e.target.value)}
              placeholder="请输入提现钱包地址"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="withdraw-amount">提现金额</Label>
            <Input
              id="withdraw-amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="请输入提现金额"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="asset-password">资产密码</Label>
            <Input
              id="asset-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入资产密码"
            />
          </div>

          <Button
            className="w-full"
            onClick={handleWithdraw}
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            提现
          </Button>
        </CardContent>
      </Card>
    </>
  );
}

/**
 * 示例 4: 复投 - 展示多种验证场景
 */
export function ReinvestExample() {
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { error, handleError, clearError } = useApiError();

  const handleReinvest = async () => {
    clearError();

    const amountNum = Number(amount);

    // 前端验证（按照后端错误码顺序）
    if (!amount) {
      handleError(new ApiError(20701, '复投金额必填', 'reinvest'));
      return;
    }

    if (amountNum < 100) {
      handleError(new ApiError(20703, '最小复投金额为100', 'reinvest'));
      return;
    }

    if (amountNum % 100 !== 0) {
      handleError(new ApiError(20702, '复投金额必须是100的倍数', 'reinvest'));
      return;
    }

    setIsLoading(true);
    try {
      const result = await reinvest({ amount: amountNum });
      console.log('复投成功:', result);
      setAmount('');
    } catch (err) {
      handleError(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>复投示例</CardTitle>
        <CardDescription>展示多种验证场景</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error.message && (
          <ErrorAlert
            code={error.code}
            message={error.message}
            category={error.category}
            onClose={clearError}
          />
        )}

        <div className="space-y-2">
          <Label htmlFor="reinvest-amount">复投金额</Label>
          <Input
            id="reinvest-amount"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="最小100，必须是100的倍数"
          />
          <p className="text-xs text-muted-foreground">
            从收益余额中复投，最小金额 100 USDT0
          </p>
        </div>

        <Button
          className="w-full"
          onClick={handleReinvest}
          disabled={isLoading}
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          复投
        </Button>
      </CardContent>
    </Card>
  );
}

/**
 * 完整示例页面
 */
export function ErrorHandlingExamples() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">错误处理示例</h1>
        <p className="text-muted-foreground">
          展示如何在不同场景下使用错误码处理系统
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <LoginExample />
        <RechargeExample />
        <WithdrawExample />
        <ReinvestExample />
      </div>
    </div>
  );
}
