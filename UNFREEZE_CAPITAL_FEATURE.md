# 解压本金功能实现说明

## 功能概述

原质押订单页面逻辑为"质押180天后直接提现"，现已修改为"添加解压本金按钮 → 48小时冷冻期 → 提取本金"的流程。

## 重要更新

### API 基础地址变更
所有后端接口地址已统一更改为：`https://api.plasma1.online`

### 提现接口更新
- **签名有效期**: 8分钟（480秒）
- **自动回滚**: 12分钟无链上确认自动回滚到 freezing 状态
- **前置条件**: 订单状态必须为 `freezing` 且冷冻期已过48h

## 修改内容

### 1. API 配置更新 (`frontend/src/lib/api.ts`)

#### 基础地址变更
```typescript
const API_CONFIG = {
  baseURL: import.meta.env.VITE_API_BASE_URL || 'https://api.plasma1.online',
  timeout: 30000,
};
```

#### 新增接口：解压本金
```typescript
export interface UnfreezeCapitalRequest {
  order_id: string;  // 订单号
}

export interface UnfreezeCapitalResponse {
  order_id: string;           // 订单号
  status: 'freezing';         // 状态：freezing-冷冻中
  freeze_end_time: number;    // 冷冻结束时间戳（48h后）
}

export async function unfreezeCapital(params: UnfreezeCapitalRequest): Promise<UnfreezeCapitalResponse>
```

**接口地址**: `POST /Api/Recharge/unfreeze`

**前置条件**: 订单状态为 `normal` 且已过入金次日01:00

#### 更新接口：本金提现
```typescript
export interface CapitalWithdrawResponse {
  transaction_id: string;           // 交易ID（订单号）
  fee: number;                      // 手续费（按 withdraw_fee_rate 配置，默认5%）
  mum: number;                      // 实际到账 USDT 金额
  signature_expires_at: number;     // 签名过期时间戳
  signature_ttl: number;            // 签名有效期（秒，默认480秒=8分钟）
  withdraw_signature: WithdrawSignature; // 签名数据
}
```

**接口地址**: `POST /Api/Recharge/withdraw`

**前置条件**: 订单状态必须为 `freezing` 且冷冻期已过48h

**注意事项**:
- 签名8分钟有效，超时需重新调用
- 12分钟无链上确认自动回滚到 freezing 状态

#### 更新类型定义
- `StakeRecord` 新增字段：
  - `status` 类型新增 `'freezing'` 状态
  - `freeze_end_time?: string` - 冷冻结束时间戳

### 2. 订单数据模型更新 (`frontend/src/components/features/home/StakeView.tsx`)

#### StakeOrder 接口更新
```typescript
export interface StakeOrder {
  id: number;
  amount: number;
  startDate: string;
  lockEndDate: string;
  lockDays: number;
  accruedInterest: number;
  status: "locked" | "unlocked" | "withdrawn" | "freezing";  // 新增 freezing 状态
  dailyRate?: number;
  freezeEndTime?: number;  // 新增：冷冻结束时间戳
}
```

### 3. 订单卡片组件更新 (`StakeOrderItem`)

#### 新增功能
1. **解压本金按钮**: 订单状态为 `unlocked` 时显示
2. **48小时倒计时**: 订单状态为 `freezing` 时显示实时倒计时
3. **提取本金按钮**: 倒计时结束后显示

#### 状态流转
```
locked (锁定期) 
  ↓ 
unlocked (可解压) → 点击"解压本金"
  ↓
freezing (冷冻中，48小时倒计时)
  ↓
倒计时结束 → 显示"提取本金"按钮
  ↓
withdrawn (已提现)
```

#### UI 变化
- **unlocked 状态**: 显示"解压本金"按钮（蓝色解锁图标）
- **freezing 状态**: 
  - 状态徽章显示"冷冻中"（蓝色）
  - 显示实时倒计时（格式：Xh Ym Zs）
  - 倒计时结束后显示"提取本金"按钮

### 4. 订单列表页面更新 (`frontend/src/components/features/home/StakeOrdersView.tsx`)

#### 新增功能
1. **解压本金处理函数** `handleUnfreezeCapital`:
   - 调用后端 `/Api/Recharge/unfreeze` 接口
   - 成功后刷新订单列表
   - 显示成功提示和48小时倒计时说明

2. **提现前置条件检查**:
   - 验证订单状态必须为 `freezing`
   - 验证冷冻期已结束（当前时间 >= freeze_end_time）
   - 不满足条件时显示友好提示

3. **签名有效期提示**:
   - 显示签名有效期（8分钟）
   - 提示用户在有效期内完成交易
   - 用户取消时提示12分钟自动回滚机制

4. **订单状态查询更新**:
   - 查询参数新增 `'freezing'` 状态
   - 每30秒自动刷新订单列表（包含冷冻状态订单）

5. **数据转换逻辑更新**:
   - `convertToStakeOrder` 函数支持 `freezing` 状态
   - 解析 `freeze_end_time` 字段

#### 模拟数据说明
为方便测试，当前使用模拟数据：
- 订单3的冷冻时间设置为2分钟（方便快速测试）
- 生产环境需将 `USE_MOCK_DATA` 改为 `false`

### 5. 国际化翻译新增

#### 英文 (`frontend/src/i18n/locales/en.json`)
```json
{
  "stake": {
    "statusFreezing": "Freezing",
    "unfreezeCapital": "Unfreeze Principal",
    "unfreezing": "Unfreezing...",
    "unfreezeDesc": "Click to start 48-hour cooldown period for principal {{amount}} USDT0",
    "unfreezeSuccess": "Unfreeze Initiated",
    "unfreezeSuccessDesc": "48-hour cooldown period started. You can withdraw after the countdown ends.",
    "freezing": "Freezing",
    "freezeCountdown": "Freeze Countdown",
    "freezingDesc": "Principal is in 48-hour cooldown period. You can withdraw after the countdown ends.",
    "freezeEnded": "Cooldown Ended"
  }
}
```

#### 中文 (`frontend/src/i18n/locales/zh-CN.json`)
```json
{
  "stake": {
    "statusFreezing": "冷冻中",
    "unfreezeCapital": "解压本金",
    "unfreezing": "解压中...",
    "unfreezeDesc": "点击开始 48 小时冷冻期，本金 {{amount}} USDT0",
    "unfreezeSuccess": "解压成功",
    "unfreezeSuccessDesc": "已开始 48 小时冷冻期，倒计时结束后可提取本金",
    "freezing": "冷冻中",
    "freezeCountdown": "冷冻倒计时",
    "freezingDesc": "本金正在 48 小时冷冻期中，倒计时结束后可提取",
    "freezeEnded": "冷冻结束"
  }
}
```

## 用户操作流程

### 正常流程
1. 用户在订单列表看到状态为"可提取"的订单
2. 点击"解压本金"按钮
3. 系统调用后端接口，订单进入"冷冻中"状态
4. 页面显示48小时实时倒计时
5. 倒计时结束后，显示"提取本金"按钮
6. 点击"提取本金"，系统验证前置条件
7. 调用 `/Api/Recharge/withdraw` 接口获取签名（8分钟有效）
8. 用户在8分钟内完成链上交易
9. 本金提现成功

### 异常处理
- **冷冻期未结束**: 提示"冷冻期未结束，请等待倒计时结束"
- **签名过期**: 提示"签名过期后需要重新获取"
- **用户取消**: 提示"12分钟无链上确认将自动回滚到冷冻状态"
- **12分钟无确认**: 后端自动回滚订单到 freezing 状态

### 技术细节
- **倒计时更新频率**: 每秒更新一次（1000ms）
- **订单列表刷新**: 每30秒自动刷新
- **时间格式**: `Xh Ym Zs` (小时h 分钟m 秒s)
- **倒计时结束判断**: 当剩余时间 ≤ 0 时显示"冷冻结束"
- **签名有效期**: 480秒（8分钟）
- **自动回滚时间**: 720秒（12分钟）

## 后端接口要求

### 解压本金接口
- **路径**: `POST https://api.plasma1.online/Api/Recharge/unfreeze`
- **请求参数**: `{ order_id: string }`
- **返回字段**:
  - `order_id`: 订单号
  - `status`: "freezing"
  - `freeze_end_time`: 冷冻结束时间戳（秒）

### 订单查询接口更新
- `GET https://api.plasma1.online/Api/Recharge/my_records` 需支持返回 `freezing` 状态的订单
- 订单记录需包含 `freeze_end_time` 字段（仅 freezing 状态）

### 提现接口
- **路径**: `POST https://api.plasma1.online/Api/Recharge/withdraw`
- **前置条件**: 订单状态为 `freezing` 且冷冻期已结束
- **请求参数**: `{ order_id: string }`
- **返回字段**:
  - `transaction_id`: 交易ID
  - `fee`: 手续费（默认5%）
  - `mum`: 实际到账金额
  - `signature_expires_at`: 签名过期时间戳
  - `signature_ttl`: 480秒（8分钟）
  - `withdraw_signature`: 链上签名数据
- **注意**: 
  - 签名8分钟有效
  - 12分钟无链上确认自动回滚到 freezing 状态

## 测试要点

1. ✅ 解压本金按钮仅在 `unlocked` 状态显示
2. ✅ 点击解压后订单状态变为 `freezing`
3. ✅ 48小时倒计时正确显示并实时更新
4. ✅ 倒计时结束后显示"提取本金"按钮
5. ✅ 冷冻期未结束时点击提现显示错误提示
6. ✅ 提现流程正常（签名 → 链上交易）
7. ✅ 签名有效期提示正确显示（8分钟）
8. ✅ 用户取消时提示12分钟自动回滚
9. ✅ 错误处理：接口失败时显示友好提示
10. ✅ 多语言支持：中英文翻译正确显示
11. ✅ 订单列表自动刷新包含冷冻状态订单

## 注意事项

1. **前置条件检查**: 
   - 解压：后端需验证订单状态为 `normal` 且已过入金次日01:00
   - 提现：前端和后端都需验证订单状态为 `freezing` 且冷冻期已结束

2. **时间戳格式**: 后端返回的 `freeze_end_time` 为秒级时间戳，前端需转换为毫秒

3. **状态同步**: 冷冻期结束后，用户需手动点击"提取本金"，不会自动提现

4. **并发控制**: 同一订单不能重复解压，后端需做幂等性处理

5. **签名有效期**: 
   - 签名8分钟有效，前端需提示用户尽快完成交易
   - 超时需重新调用接口获取新签名

6. **自动回滚机制**: 
   - 12分钟无链上确认，后端自动回滚订单到 freezing 状态
   - 用户可重新点击"提取本金"获取新签名

7. **模拟数据**: 
   - 当前代码使用模拟数据，冷冻时间设置为2分钟方便测试
   - 生产环境需将 `USE_MOCK_DATA` 改为 `false`
   - 生产环境冷冻时间应为48小时

