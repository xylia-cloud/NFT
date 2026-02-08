# 错误码系统实现总结

## ✅ 已完成的工作

### 1. 核心文件

#### `src/lib/errorCodes.ts` - 错误码定义
- ✅ 完整的错误码映射表（101-40003）
- ✅ 错误码分类系统（15个类别）
- ✅ 工具函数：
  - `getErrorMessage(code)` - 获取错误信息
  - `isAuthError(code)` - 判断认证错误
  - `isInsufficientBalanceError(code)` - 判断余额不足
  - `isAccountFrozenError(code)` - 判断账号冻结
  - `getErrorsByCategory(category)` - 按类别获取错误

#### `src/lib/api.ts` - API 请求封装
- ✅ 统一的 API 请求方法（get, post, put, delete, upload）
- ✅ 自动错误处理和错误码转换
- ✅ Token 管理（getToken, setToken, clearToken）
- ✅ 认证过期自动处理
- ✅ 请求超时控制（30秒）
- ✅ 完整的 API 接口定义：
  - 登录/注册
  - 充值/提现
  - 复投
  - 用户资产查询
  - 质押订单查询
  - 团队信息
  - 邀请绑定
  - 修改密码
  - 客服工单
  - 领袖激活

#### `src/hooks/useApiError.ts` - 错误处理 Hook
- ✅ `useApiError` - 完整的错误处理 Hook
  - 支持自定义回调（认证错误、余额不足、账号冻结）
  - 自动错误分类和处理
- ✅ `useSimpleError` - 简化版错误处理
  - 仅返回错误消息，适合简单场景

#### `src/components/ui/error-alert.tsx` - 错误提示组件
- ✅ `ErrorAlert` - 卡片式错误提示
  - 根据错误类别自动调整样式和图标
  - 支持关闭按钮
- ✅ `InlineError` - 内联错误提示
  - 适合表单字段验证
- ✅ `ErrorToast` - Toast 风格提示
  - 固定在页面顶部
  - 支持自动关闭（可配置时长）

### 2. 示例和文档

#### `src/components/features/examples/ErrorHandlingExample.tsx`
- ✅ 登录表单示例 - 完整错误处理
- ✅ 充值表单示例 - 简化错误处理
- ✅ 提现表单示例 - Toast 风格提示
- ✅ 复投表单示例 - 多种验证场景

#### `src/components/features/examples/ErrorCodeTestPage.tsx`
- ✅ 错误码测试页面
- ✅ 按类别展示所有错误码
- ✅ 一键测试错误提示效果

#### `ERROR_HANDLING_GUIDE.md`
- ✅ 完整的使用指南
- ✅ 快速开始教程
- ✅ 错误码分类说明
- ✅ API 工具函数文档
- ✅ 高级用法示例
- ✅ 最佳实践建议

## 📊 错误码统计

### 按类别分布
- 认证相关 (auth): 15个错误码
- 提现相关 (withdraw): 7个错误码
- 充值相关 (recharge): 3个错误码
- 复投相关 (reinvest): 6个错误码
- 订单相关 (order): 5个错误码
- 用户相关 (user): 5个错误码
- 钱包相关 (wallet): 5个错误码
- 邀请相关 (invite): 3个错误码
- 领袖相关 (leader): 7个错误码
- 英雄相关 (hero): 3个错误码
- 资源相关 (resource): 2个错误码
- 账号管理 (account): 8个错误码
- 上传相关 (upload): 2个错误码
- 客服相关 (support): 3个错误码
- 通用错误 (common): 4个错误码

**总计**: 78个错误码

## 🎯 核心特性

### 1. 类型安全
- 完整的 TypeScript 类型定义
- API 请求和响应类型化
- 错误对象类型化

### 2. 自动化处理
- 自动识别错误类型
- 自动触发特定回调
- 自动清理过期 Token

### 3. 灵活配置
- 支持自定义 API 地址
- 支持自定义超时时间
- 支持自定义错误回调

### 4. 用户体验
- 友好的错误提示
- 多种提示样式（Alert、Inline、Toast）
- 根据错误类别自动调整样式

## 🔧 使用方式

### 基础用法
```tsx
import { useApiError } from '@/hooks/useApiError';
import { ErrorAlert } from '@/components/ui/error-alert';
import { login } from '@/lib/api';

const { error, handleError, clearError } = useApiError();

try {
  await login({ username, password });
} catch (err) {
  handleError(err);
}
```

### 前端验证
```tsx
if (!username) {
  handleError(new ApiError(101, '用户名不能为空', 'auth'));
  return;
}
```

### 自定义回调
```tsx
const { error, handleError } = useApiError(
  () => router.push('/login'),  // 认证错误
  () => setShowRecharge(true),  // 余额不足
  () => setShowSupport(true)    // 账号冻结
);
```

## 📝 下一步集成建议

### 1. 在现有组件中集成

#### StakeView.tsx
```tsx
// 添加错误处理
import { useApiError } from '@/hooks/useApiError';
import { ErrorAlert } from '@/components/ui/error-alert';
import { recharge } from '@/lib/api';

const { error, handleError, clearError } = useApiError();

// 在质押成功后调用后端 API
const handleStake = async () => {
  try {
    // 1. 先执行链上交易
    const txHash = await depositUsdt(amount);
    
    // 2. 调用后端 API 记录订单
    await recharge({ amount, txHash });
    
    // 3. 显示成功提示
  } catch (err) {
    handleError(err);
  }
};
```

#### WithdrawView.tsx
```tsx
import { withdraw } from '@/lib/api';

const handleWithdraw = async () => {
  try {
    await withdraw({
      walletAddress,
      amount,
      assetPassword
    });
  } catch (err) {
    handleError(err);
  }
};
```

### 2. 添加登录/注册页面
- 使用 `login` 和 `register` API
- 集成错误处理
- Token 自动管理

### 3. 添加全局认证监听
```tsx
// 在 App.tsx 中
useEffect(() => {
  const handleAuthExpired = () => {
    clearToken();
    router.push('/login');
  };
  window.addEventListener('auth:expired', handleAuthExpired);
  return () => window.removeEventListener('auth:expired', handleAuthExpired);
}, []);
```

### 4. 配置环境变量
```env
# .env.local
VITE_API_BASE_URL=https://api.plasma.com
```

## 🧪 测试建议

### 1. 测试错误码显示
访问测试页面查看所有错误码的显示效果

### 2. 测试 API 集成
```tsx
// 模拟 API 调用
import { login, recharge } from '@/lib/api';

// 测试登录
await login({ username: 'test', password: '12345678' });

// 测试充值
await recharge({ amount: 1000, txHash: '0x...' });
```

### 3. 测试错误回调
```tsx
// 模拟认证错误
handleError(new ApiError(110, 'Token错误', 'auth'));
// 应该触发认证回调

// 模拟余额不足
handleError(new ApiError(145, '余额不足', 'withdraw'));
// 应该触发余额不足回调
```

## 📚 相关文档

- 详细使用指南: `ERROR_HANDLING_GUIDE.md`
- 错误码定义: `src/lib/errorCodes.ts`
- API 接口文档: `src/lib/api.ts`
- 使用示例: `src/components/features/examples/`

## 🎉 总结

已完成一套完整的错误码处理系统，包括：
- ✅ 78个错误码的完整定义
- ✅ 统一的 API 请求封装
- ✅ 灵活的错误处理 Hook
- ✅ 美观的错误提示组件
- ✅ 完整的使用示例和文档
- ✅ 类型安全的 TypeScript 实现

系统已经可以直接使用，只需要配置后端 API 地址即可开始集成！
