# 错误处理系统使用指南

本项目实现了一套完整的后端错误码处理系统，统一管理所有 API 错误并提供友好的用户提示。

## 📁 文件结构

```
frontend/src/
├── lib/
│   ├── errorCodes.ts          # 错误码定义和工具函数
│   └── api.ts                 # API 请求封装
├── hooks/
│   └── useApiError.ts         # 错误处理 Hook
├── components/
│   ├── ui/
│   │   └── error-alert.tsx    # 错误提示组件
│   └── features/
│       └── examples/
│           └── ErrorHandlingExample.tsx  # 使用示例
```

## 🚀 快速开始

### 1. 基础使用

```tsx
import { useApiError } from '@/hooks/useApiError';
import { ErrorAlert } from '@/components/ui/error-alert';
import { login } from '@/lib/api';

function LoginForm() {
  const { error, handleError, clearError } = useApiError();

  const handleLogin = async () => {
    try {
      await login({ username, password });
    } catch (err) {
      handleError(err); // 自动处理错误
    }
  };

  return (
    <>
      {error.message && (
        <ErrorAlert
          code={error.code}
          message={error.message}
          category={error.category}
          onClose={clearError}
        />
      )}
      {/* 表单内容 */}
    </>
  );
}
```

### 2. 前端验证

```tsx
import { ApiError } from '@/lib/api';

// 在调用 API 前进行前端验证
if (!username) {
  handleError(new ApiError(101, '用户名不能为空', 'auth'));
  return;
}

if (!password) {
  handleError(new ApiError(102, '密码不能为空', 'auth'));
  return;
}
```

### 3. 简化版错误处理

```tsx
import { useSimpleError } from '@/hooks/useApiError';
import { InlineError } from '@/components/ui/error-alert';

function SimpleForm() {
  const { errorMessage, handleError, clearError } = useSimpleError();

  return (
    <div>
      <Input {...props} />
      <InlineError message={errorMessage} />
    </div>
  );
}
```

### 4. Toast 风格提示

```tsx
import { ErrorToast } from '@/components/ui/error-alert';

function WithdrawForm() {
  const [showToast, setShowToast] = useState(false);
  const { error, handleError } = useApiError();

  return (
    <>
      {showToast && error.message && (
        <ErrorToast
          code={error.code}
          message={error.message}
          category={error.category}
          onClose={() => setShowToast(false)}
          duration={5000} // 5秒后自动关闭
        />
      )}
      {/* 表单内容 */}
    </>
  );
}
```

## 📋 错误码分类

### 认证相关 (101-129)
- `101` - 用户名不能为空
- `102` - 密码不能为空
- `103` - 用户或密码错误
- `110` - Token 错误，请重新登录
- `120` - 邀请码错误

### 提现相关 (140-149)
- `140` - 提现钱包地址必填
- `141` - 提现数量必填
- `143` - 资产密码错误
- `145` - 余额不足

### 充值相关 (20501-20599)
- `20501` - 充值金额无效（必须是500或1000的倍数，范围500-30000）
- `20506` - 总资产不能超过30000

### 复投相关 (20701-20799)
- `20701` - 复投金额必填
- `20702` - 复投金额必须是100的倍数
- `20703` - 最小复投金额为100
- `20704` - 收益余额不足

### 钱包相关 (30001-39999)
- `30001` - 钱包地址必填
- `30002` - 钱包地址格式错误
- `30004` - 签名验证失败

### 邀请相关 (40001-49999)
- `40001` - 邀请人必填
- `40003` - 邀请人不存在或未激活

完整错误码列表请查看 `src/lib/errorCodes.ts`

## 🛠️ API 工具函数

### 错误码查询

```tsx
import { getErrorMessage, isAuthError, isInsufficientBalanceError } from '@/lib/errorCodes';

// 获取错误信息
const errorInfo = getErrorMessage(101);
// { code: 101, message: '用户名不能为空', category: 'auth' }

// 判断错误类型
if (isAuthError(110)) {
  // 跳转到登录页
}

if (isInsufficientBalanceError(145)) {
  // 引导用户充值
}
```

### 按类别获取错误

```tsx
import { getErrorsByCategory, ERROR_CATEGORIES } from '@/lib/errorCodes';

// 获取所有认证相关错误
const authErrors = getErrorsByCategory(ERROR_CATEGORIES.AUTH);
```

## 🎯 高级用法

### 1. 自定义错误回调

```tsx
const { error, handleError } = useApiError(
  // 认证错误回调
  () => {
    console.log('Token 过期，跳转登录');
    router.push('/login');
  },
  // 余额不足回调
  () => {
    console.log('余额不足，引导充值');
    setShowRechargeDialog(true);
  },
  // 账号冻结回调
  () => {
    console.log('账号已冻结，联系客服');
    setShowContactSupport(true);
  }
);
```

### 2. 全局错误监听

```tsx
// 在 App.tsx 中监听认证过期事件
useEffect(() => {
  const handleAuthExpired = () => {
    // 清除本地数据
    clearToken();
    // 跳转到登录页
    router.push('/login');
  };

  window.addEventListener('auth:expired', handleAuthExpired);
  return () => window.removeEventListener('auth:expired', handleAuthExpired);
}, []);
```

### 3. API 请求配置

```tsx
// 在 .env 文件中配置 API 地址
VITE_API_BASE_URL=https://api.plasma.com

// 使用 API 函数
import { login, recharge, withdraw } from '@/lib/api';

// 登录
const result = await login({ username, password });

// 充值
const order = await recharge({ amount: 1000, txHash: '0x...' });

// 提现
const withdraw = await withdraw({
  walletAddress: '0x...',
  amount: 500,
  assetPassword: 'password123'
});
```

## 📝 最佳实践

### 1. 前端验证优先

在调用 API 前进行前端验证，提供即时反馈：

```tsx
// ✅ 好的做法
if (!amount || amount < 100) {
  handleError(new ApiError(20703, '最小复投金额为100', 'reinvest'));
  return;
}

// 然后再调用 API
await reinvest({ amount });
```

### 2. 统一错误处理

使用 `handleError` 统一处理所有错误：

```tsx
// ✅ 好的做法
try {
  await someApiCall();
} catch (err) {
  handleError(err); // 自动识别 ApiError 或普通 Error
}

// ❌ 不好的做法
try {
  await someApiCall();
} catch (err) {
  alert(err.message); // 不统一，用户体验差
}
```

### 3. 清理错误状态

在适当的时机清理错误状态：

```tsx
// 表单提交前清理
const handleSubmit = () => {
  clearError(); // 清除之前的错误
  // 执行提交逻辑
};

// 输入变化时清理
<Input
  onChange={(e) => {
    setValue(e.target.value);
    clearError(); // 用户开始输入时清除错误
  }}
/>
```

### 4. 错误提示位置

根据场景选择合适的错误提示方式：

- **表单验证错误**: 使用 `InlineError` 显示在字段下方
- **操作失败错误**: 使用 `ErrorAlert` 显示在表单顶部
- **全局提示**: 使用 `ErrorToast` 固定在页面顶部

## 🔧 环境配置

在 `.env.local` 文件中配置：

```env
# API 基础地址
VITE_API_BASE_URL=http://localhost:3000/api

# 或生产环境
VITE_API_BASE_URL=https://api.plasma.com
```

## 📚 完整示例

查看 `src/components/features/examples/ErrorHandlingExample.tsx` 获取完整的使用示例，包括：

- 登录表单示例
- 充值表单示例
- 提现表单示例
- 复投表单示例

## 🐛 调试技巧

### 1. 查看错误详情

```tsx
const { error } = useApiError();

console.log('错误码:', error.code);
console.log('错误消息:', error.message);
console.log('错误类别:', error.category);
```

### 2. 模拟错误

```tsx
// 模拟特定错误码
handleError(new ApiError(145, '余额不足', 'withdraw'));

// 测试错误回调
handleError(new ApiError(110, 'Token错误', 'auth')); // 触发认证回调
```

## 🎨 自定义样式

错误提示组件支持自定义样式：

```tsx
<ErrorAlert
  message="错误消息"
  className="my-custom-class"
/>

<InlineError
  message="字段错误"
  className="text-red-500"
/>
```

## 📞 技术支持

如有问题，请查看：
- 错误码定义: `src/lib/errorCodes.ts`
- API 文档: `src/lib/api.ts`
- 使用示例: `src/components/features/examples/ErrorHandlingExample.tsx`
