/**
 * API 请求封装
 * 统一处理后端 API 请求和错误码
 */

import { getErrorMessage, isAuthError } from './errorCodes';

/**
 * API 响应基础结构
 */
export interface ApiResponse<T = any> {
  status: number;  // 1 表示成功，其他表示失败
  info?: string;   // 响应信息
  code?: number;   // 错误码（失败时）
  data?: T;        // 响应数据
}

/**
 * API 错误类
 */
export class ApiError extends Error {
  code: number;
  category: string;
  originalMessage?: string;

  constructor(code: number, message: string, category: string, originalMessage?: string) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.category = category;
    this.originalMessage = originalMessage;
  }
}

/**
 * API 配置
 */
const API_CONFIG = {
  baseURL: import.meta.env.VITE_API_BASE_URL || 'https://api.plasma.email',
  timeout: 30000,
};

/**
 * 用户信息接口
 */
export interface UserInfo {
  uid: string;
  token: string;
  username: string;
  wallet_address: string;
  leve_user: string;
  status: number;
  is_leader: number;  // 0: 非领袖, 1: 领袖
  login_time: number;
  login: boolean;
}

/**
 * 获取存储的 token
 */
function getToken(): string | null {
  return localStorage.getItem('auth_token');
}

/**
 * 设置 token
 */
export function setToken(token: string): void {
  localStorage.setItem('auth_token', token);
}

/**
 * 清除 token
 */
export function clearToken(): void {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('user_info');
}

/**
 * 获取用户信息
 */
export function getUserInfo(): UserInfo | null {
  const userInfoStr = localStorage.getItem('user_info');
  if (!userInfoStr) return null;
  
  try {
    return JSON.parse(userInfoStr) as UserInfo;
  } catch (err) {
    console.error('解析用户信息失败:', err);
    return null;
  }
}

/**
 * 设置用户信息
 */
export function setUserInfo(userInfo: UserInfo): void {
  localStorage.setItem('user_info', JSON.stringify(userInfo));
}

/**
 * 更新用户信息（部分更新）
 */
export function updateUserInfo(updates: Partial<UserInfo>): void {
  const currentInfo = getUserInfo();
  if (!currentInfo) return;
  
  const updatedInfo = { ...currentInfo, ...updates };
  setUserInfo(updatedInfo);
}

/**
 * 通用请求方法
 */
async function request<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_CONFIG.baseURL}${endpoint}`;
  const token = getToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['token'] = token;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout);

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // 解析响应
    const result: ApiResponse<T> = await response.json();

    // 处理业务错误码（status !== 1 表示失败）
    if (result.status !== 1) {
      // 错误码可能在 code 字段或 status 字段中
      const code = result.code || result.status;
      const errorInfo = getErrorMessage(code);
      
      // 如果是认证错误，清除 token
      if (isAuthError(code)) {
        clearToken();
        // 可以在这里触发全局的登录跳转
        window.dispatchEvent(new CustomEvent('auth:expired'));
      }

      throw new ApiError(
        code,
        result.info || errorInfo.message,
        errorInfo.category,
        result.info
      );
    }

    return result.data as T;
  } catch (error) {
    clearTimeout(timeoutId);

    // 处理网络错误
    if (error instanceof ApiError) {
      throw error;
    }

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new ApiError(999, '请求超时，请检查网络连接', 'common');
      }
      throw new ApiError(999, error.message || '网络请求失败', 'common');
    }

    throw new ApiError(999, '未知错误', 'common');
  }
}

/**
 * GET 请求
 */
export async function get<T = any>(endpoint: string, params?: Record<string, any>): Promise<T> {
  const queryString = params
    ? '?' + new URLSearchParams(params as Record<string, string>).toString()
    : '';
  return request<T>(`${endpoint}${queryString}`, { method: 'GET' });
}

/**
 * POST 请求
 */
export async function post<T = any>(endpoint: string, data?: any): Promise<T> {
  return request<T>(endpoint, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * PUT 请求
 */
export async function put<T = any>(endpoint: string, data?: any): Promise<T> {
  return request<T>(endpoint, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/**
 * DELETE 请求
 */
export async function del<T = any>(endpoint: string): Promise<T> {
  return request<T>(endpoint, { method: 'DELETE' });
}

/**
 * 上传文件
 */
export async function upload<T = any>(
  endpoint: string,
  file: File,
  additionalData?: Record<string, any>
): Promise<T> {
  const formData = new FormData();
  formData.append('file', file);

  if (additionalData) {
    Object.entries(additionalData).forEach(([key, value]) => {
      formData.append(key, String(value));
    });
  }

  const token = getToken();
  const headers: Record<string, string> = {};
  if (token) {
    headers['token'] = token;
  }

  const response = await fetch(`${API_CONFIG.baseURL}${endpoint}`, {
    method: 'POST',
    headers,
    body: formData,
  });

  const result: ApiResponse<T> = await response.json();

  if (result.status !== 1) {
    const code = result.code || result.status;
    const errorInfo = getErrorMessage(code);
    throw new ApiError(
      code,
      result.info || errorInfo.message,
      errorInfo.category,
      result.info
    );
  }

  return result.data as T;
}

// ==================== API 接口定义 ====================

/**
 * 获取 Nonce（用于钱包签名）
 */
export interface GetNonceParams {
  wallet_address: string;
}

export interface GetNonceResponse {
  nonce: string;
  message: string;
  expire_time: number;
  timestamp: number;
}

export async function getNonce(params: GetNonceParams): Promise<GetNonceResponse> {
  return post<GetNonceResponse>('/Api/Auth/get_nonce', params);
}

/**
 * 钱包登录（使用签名验证）
 */
export interface WalletLoginParams {
  wallet_address: string;
  signature: string;
  invit?: string; // 邀请人钱包地址（可选）
}

export type WalletLoginResponse = UserInfo;

export async function walletLogin(params: WalletLoginParams): Promise<WalletLoginResponse> {
  return post<WalletLoginResponse>('/Api/Auth/login', params);
}

/**
 * 用户登录
 */
export interface LoginParams {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: {
    id: string;
    username: string;
    walletAddress?: string;
  };
}

export async function login(params: LoginParams): Promise<LoginResponse> {
  return post<LoginResponse>('/auth/login', params);
}

/**
 * 用户注册
 */
export interface RegisterParams {
  username: string;
  password: string;
  confirmPassword: string;
  inviteCode?: string;
  walletAddress?: string;
}

export async function register(params: RegisterParams): Promise<LoginResponse> {
  return post<LoginResponse>('/auth/register', params);
}

/**
 * 充值预下单（获取订单号）
 */
export interface RechargePreorderParams {
  amount: string; // 充值金额（字符串格式）
}

export interface RechargePreorderResponse {
  order_id: string; // 订单号
  amount: number;   // 充值金额
}

export async function rechargePreorder(params: RechargePreorderParams): Promise<RechargePreorderResponse> {
  return post<RechargePreorderResponse>('/Api/Recharge/recharge_preorder', params);
}

/**
 * 查询订单状态
 */
export interface OrderStatusParams {
  order_id: string; // 订单号
}

export interface OrderStatusResponse {
  order_id: string;
  buy_id: string;
  name: string;
  status: 'pending' | 'paid' | 'finished'; // pending: 预下单, paid: 已到账质押处理中, finished: 已质押
  amount: string;
  num: string;
  addtime: string;
  paytime: string | null;
  add_date_time: string;
  pay_date_time: string | null;
}

export async function getOrderStatus(params: OrderStatusParams): Promise<OrderStatusResponse> {
  return get<OrderStatusResponse>('/Api/Recharge/order_status', params);
}

/**
 * 充值/质押（旧接口，保留兼容）
 */
export interface RechargeParams {
  amount: number; // 充值金额（500-30000，必须是500或1000的倍数）
  txHash?: string; // 链上交易哈希
}

export interface RechargeResponse {
  orderId: string;
  amount: number;
  status: string;
}

export async function recharge(params: RechargeParams): Promise<RechargeResponse> {
  return post<RechargeResponse>('/recharge', params);
}

/**
 * 提现
 */
export interface WithdrawParams {
  walletAddress: string;
  amount: number;
  assetPassword: string;
}

export interface WithdrawResponse {
  orderId: string;
  amount: number;
  status: string;
}

export async function withdraw(params: WithdrawParams): Promise<WithdrawResponse> {
  return post<WithdrawResponse>('/withdraw', params);
}

/**
 * 收益复投
 */
export interface ReinvestParams {
  amount: number; // 复投金额（必须是100的倍数，最小100）
}

export interface ReinvestResponse {
  orderId: string;
  amount: number;
  status: string;
}

export async function reinvest(params: ReinvestParams): Promise<ReinvestResponse> {
  return post<ReinvestResponse>('/reinvest', params);
}

/**
 * 获取用户资产
 */
export interface UserAsset {
  totalAsset: number;      // 总资产
  principalBalance: number; // 本金余额
  profitBalance: number;    // 收益余额
  frozenAmount: number;     // 冻结金额
}

export async function getUserAsset(): Promise<UserAsset> {
  return get<UserAsset>('/user/asset');
}

/**
 * 获取质押订单列表
 */
export interface MyRecordsParams {
  page?: string;      // 页码，默认 1
  size?: string;      // 每页数量，默认 100
  status?: string[];  // 状态筛选：lockin-锁定期, normal-正常, withdrawn-已提现, withdrawing-提现中
}

export interface StakeRecord {
  id: string;
  userid: string;
  name: string;
  coinname: string;
  order_id: string;
  num: string;
  amount: string;                      // 质押金额
  fee: string;
  addtime: string;                     // 添加时间戳
  withdrawntime: string;               // 提现时间戳
  withdrawn_id: string | null;
  status: 'lockin' | 'normal' | 'withdrawn' | 'withdrawing'; // 状态
  lockin_time: string;                 // 锁定期结束时间戳
  withdrawn_addr: string | null;
  total_profit: string;                // 累计收益
  current_withdrawn_fee: number;       // 当前可提现金额
  today_profit: string;                // 今日收益
  total_profit_with_today: string;     // 累计收益（含今日）
  add_date_time: string;               // 添加时间（格式化）
  withdrawn_date_time: string | null;  // 提现时间（格式化）
  lockin_date_time: string;            // 锁定期结束时间（格式化）
}

export interface MyRecordsResponse {
  list: StakeRecord[];
  count: number;
  page: number;
}

export async function getMyRecords(params?: MyRecordsParams): Promise<MyRecordsResponse> {
  // 构建查询参数
  const queryParams: Record<string, any> = {
    page: params?.page || '1',
    size: params?.size || '100',
  };
  
  // status[] 参数作为 JSON 数组字符串传递
  if (params?.status && params.status.length > 0) {
    queryParams['status[]'] = JSON.stringify(params.status);
  }
  
  return get<MyRecordsResponse>('/Api/Recharge/my_records', queryParams);
}

/**
 * 获取质押订单列表（旧接口，保留兼容）
 */
export interface StakeOrder {
  id: string;
  amount: number;
  startDate: string;
  lockEndDate: string;
  lockDays: number;
  accruedInterest: number;
  status: 'locked' | 'unlocked';
  dailyRate: number;
}

export async function getStakeOrders(): Promise<StakeOrder[]> {
  return get<StakeOrder[]>('/orders/stake');
}

/**
 * 绑定邀请人
 */
export interface BindInviterParams {
  inviteCode: string;
}

export async function bindInviter(params: BindInviterParams): Promise<void> {
  return post<void>('/user/bind-inviter', params);
}

/**
 * 修改密码
 */
export interface ChangePasswordParams {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export async function changePassword(params: ChangePasswordParams): Promise<void> {
  return post<void>('/user/change-password', params);
}

/**
 * 提交客服问题
 */
export interface SupportTicketParams {
  content: string;
  images?: string[]; // 图片 URL 数组（最多3张）
}

export async function submitSupportTicket(params: SupportTicketParams): Promise<void> {
  return post<void>('/support/ticket', params);
}

/**
 * 领袖激活
 */
export interface ActivateLeaderParams {
  code: string; // 激活码
}

export interface ActivateLeaderResponse {
  expire_time: number;
  expire_date: string;
  message: string;
}

export async function activateLeader(params: ActivateLeaderParams): Promise<ActivateLeaderResponse> {
  return post<ActivateLeaderResponse>('/Api/Leader/activate_leader', params);
}

/**
 * 获取领袖详情
 */
export interface LeaderInfoResponse {
  total_reward: string;      // 累计领袖奖励
  leader_team_count: number; // 领袖团队人数
  uid: string;               // 用户 ID
}

export async function getLeaderInfo(): Promise<LeaderInfoResponse> {
  return post<LeaderInfoResponse>('/Api/Leader/info');
}

/**
 * 获取领袖收益日历
 */
export interface LeaderCalendarParams {
  month: string; // 月份，格式：YYYY-MM
}

export interface LeaderCalendarDay {
  date: string;                  // 日期，格式：YYYY-MM-DD
  leader_performance: string;    // 当日领袖收益
}

export interface LeaderCalendarResponse {
  month: string;
  calendar: LeaderCalendarDay[];
  uid: string;
}

export async function getLeaderCalendar(params: LeaderCalendarParams): Promise<LeaderCalendarResponse> {
  return post<LeaderCalendarResponse>('/Api/Leader/calendar', params);
}

/**
 * 获取团队详情
 */
export interface TeamInfoResponse {
  total_count: number;        // 团队总人数
  level1_count: string;       // 一级成员数量
  level2_count: string;       // 二级成员数量
  team_performance: string;   // 团队总业绩
  team_earnings: string;      // 团队累计收益（佣金）
  capital_total?: string;     // 本人账户金额
  uid: string;                // 用户 ID
}

export async function getTeamInfo(): Promise<TeamInfoResponse> {
  return post<TeamInfoResponse>('/Api/Team/info');
}

/**
 * 获取团队日历
 */
export interface TeamCalendarParams {
  month: string; // 月份，格式：YYYY-MM
}

export interface TeamCalendarDay {
  date: string;                           // 日期，格式：YYYY-MM-DD
  team_performance: string;               // 团队业绩
  team_daily_income_commission: string;   // 团队每日收益佣金
}

export interface TeamCalendarResponse {
  month: string;
  calendar: TeamCalendarDay[];
  uid: string;
}

export async function getTeamCalendar(params: TeamCalendarParams): Promise<TeamCalendarResponse> {
  return post<TeamCalendarResponse>('/Api/Team/calendar', params);
}

/**
 * 获取团队成员列表
 */
export interface TeamMembersParams {
  page: number;      // 页码
  activity?: number; // 只查活跃传入1，全部不用传此参数
}

export interface TeamMember {
  // 根据实际返回的数据结构定义，目前返回的 list 为空，暂时定义基础字段
  id?: string;
  wallet_address?: string;
  level?: number;
  stake_amount?: string;
  commission?: string;
  status?: string;
  join_date?: string;
  [key: string]: any; // 允许其他字段
}

export interface TeamMembersResponse {
  list: TeamMember[];
  page: number;
  page_size: number;
  total: number;
  uid: string;
}

export async function getTeamMembers(params: TeamMembersParams): Promise<TeamMembersResponse> {
  return post<TeamMembersResponse>('/Api/Team/members', params);
}

/**
 * 获取交易日历（我的钱包 - 收支日历）
 */
export interface TransactionCalendarParams {
  month: string; // 月份，格式：YYYY-MM
}

export interface TransactionCalendarDay {
  date: string;              // 日期，格式：YYYY-MM-DD
  profit_increase: string;   // 收益增
  profit_decrease: string;   // 收益减
  capital_increase: string;  // 本金增
  capital_decrease: string;  // 本金减
  total_increase: string;    // 总增（收益增 + 本金增）
  total_decrease: string;    // 总减（收益减 + 本金减）
}

export interface TransactionCalendarResponse {
  month: string;
  calendar: TransactionCalendarDay[];
  uid: string;
}

export async function getTransactionCalendar(params: TransactionCalendarParams): Promise<TransactionCalendarResponse> {
  return post<TransactionCalendarResponse>('/Api/Transaction/calendar', params);
}

/**
 * 获取交易记录（我的钱包 - 资金明细）
 */
export interface TransactionDetailsParams {
  page: number;                                                    // 页码
  category: 'all' | 'deposit' | 'profit' | 'reinvest' | 'withdraw'; // 分类
}

export interface TransactionDetail {
  time: string;           // 时间戳
  time_format: string;    // 格式化时间
  type: string;           // 类型：1-收入，2-支出
  type_text: string;      // 类型文本
  coin: string;           // 币种
  fee: string;            // 金额
  protype: string;        // 业务类型
  protype_name: string;   // 业务类型名称
  remark: string;         // 备注
  source_uid: string;     // 来源用户ID
}

export interface TransactionDetailsResponse {
  list: TransactionDetail[];
  page: number;
  page_size: number;
  total: string;
  category: string;
  uid: string;
}

export async function getTransactionDetails(params: TransactionDetailsParams): Promise<TransactionDetailsResponse> {
  return post<TransactionDetailsResponse>('/Api/Transaction/details', params);
}

/**
 * 获取钱包信息
 */
export interface WalletInfoResponse {
  capital: string;                          // 本金
  capital_freeze: string;                   // 提现中本金
  capital_wallet_address: string;           // 本金钱包地址
  profit: string;                           // 可用收益
  profit_freeze: string;                    // 冻结中收益
  profit_withdrawal_rate: number;           // 收益执行提现手续费
  profit_wallet_address: string;            // 收益钱包地址
  profit_min_withdrawal: number;            // 最小提现金额
  profit_max_withdrawal: number;            // 最大提现金额
  profit_withdrawal_multiple: string;       // 提现倍数
  profit_withdrawal_limit: number;          // 当前用户收益提现总额度
  profit_withdrawn_total: number;           // 当前用户收益提现已用额度
  profit_remaining_withdrawal_limit: number; // 当前用户收益提现剩余额度
  today: {
    lottery_records: any[];
    lottery_total_amount: string;
    consume_points: number;
    remaining_points: number;
    total_points: number;
  };
}

export async function getWalletInfo(): Promise<WalletInfoResponse> {
  return get<WalletInfoResponse>('/Api/Wallet/info');
}

/**
 * 获取 XPL 汇率
 */
export interface XplRateResponse {
  rate: number;           // XPL 汇率（1 USDT0 = rate XPL）
  rate_format: string;    // 格式化的汇率
  source: string;         // 数据源（如 binance）
  update_time: string;    // 更新时间
}

export async function getXplRate(): Promise<XplRateResponse> {
  return get<XplRateResponse>('/Api/Common/get_xpl_rate');
}

/**
 * 收益提现
 */
export interface ProfitWithdrawRequest {
  amount: string;  // 提现金额
}

export interface ProfitWithdrawResponse {
  transaction_id: string;   // 交易ID
  fee: string;              // 手续费
  receipt_amount: number;   // 实际到账金额
  amount: number;           // 提现金额
}

export async function profitWithdraw(params: ProfitWithdrawRequest): Promise<ProfitWithdrawResponse> {
  return post<ProfitWithdrawResponse>('/Api/Wallet/profit_withdraw', params);
}

/**
 * 获取全局配置（首页系统信息）
 */
export interface GlobalConfigResponse {
  monthly_return_rate: string;      // 月化收益率
  total_staking: string;            // 总质押量
  total_participants: string;       // 参与人数（格式化）
  total_participants_raw: number;   // 参与人数（原始值）
  timestamp: number;                // 时间戳
}

export async function getGlobalConfig(): Promise<GlobalConfigResponse> {
  return get<GlobalConfigResponse>('/Api/Index/global_config');
}
