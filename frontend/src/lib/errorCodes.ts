/**
 * 后端错误码定义和处理
 * 统一管理所有后端返回的错误码及其对应的提示信息
 */

import i18n from '../i18n/config';

export interface ErrorCodeInfo {
  code: number;
  message: string;
  category: string;
}

/**
 * 错误码映射表（使用翻译键）
 */
export const ERROR_CODE_KEYS: Record<number, { key: string; category: string }> = {
  // ==================== 登录相关 (101-129) ====================
  101: { key: 'errors.auth.usernameRequired', category: 'auth' },
  102: { key: 'errors.auth.passwordRequired', category: 'auth' },
  103: { key: 'errors.auth.invalidCredentials', category: 'auth' },
  104: { key: 'errors.auth.tooManyAttempts', category: 'auth' },
  105: { key: 'errors.auth.accountFrozen', category: 'auth' },
  106: { key: 'errors.auth.inviteCodeRequired', category: 'auth' },
  100: { key: 'errors.auth.loginFailed', category: 'auth' },
  110: { key: 'errors.auth.tokenInvalid', category: 'auth' },
  111: { key: 'errors.auth.userNotFound', category: 'auth' },
  112: { key: 'errors.auth.resetPasswordTypeError', category: 'auth' },
  113: { key: 'errors.auth.confirmPasswordRequired', category: 'auth' },
  114: { key: 'errors.auth.passwordLength', category: 'auth' },
  115: { key: 'errors.auth.passwordMismatch', category: 'auth' },
  120: { key: 'errors.auth.inviteCodeInvalid', category: 'auth' },
  121: { key: 'errors.auth.referralError', category: 'auth' },
  122: { key: 'errors.auth.alreadyBound', category: 'auth' },
  123: { key: 'errors.auth.agentCannotBind', category: 'auth' },

  // ==================== 提现相关 (140-149) ====================
  140: { key: 'errors.withdraw.addressRequired', category: 'withdraw' },
  141: { key: 'errors.withdraw.amountRequired', category: 'withdraw' },
  142: { key: 'errors.withdraw.passwordRequired', category: 'withdraw' },
  143: { key: 'errors.withdraw.passwordInvalid', category: 'withdraw' },
  144: { key: 'errors.withdraw.amountOutOfRange', category: 'withdraw' },
  145: { key: 'errors.withdraw.insufficientBalance', category: 'withdraw' },
  146: { key: 'errors.withdraw.failed', category: 'withdraw' },

  // ==================== 通用错误 (10001-19999) ====================
  10001: { key: 'errors.common.jsonParseFailed', category: 'common' },
  10002: { key: 'errors.common.invalidParams', category: 'common' },
  10003: { key: 'errors.common.operationFailed', category: 'common' },
  99: { key: 'errors.common.systemError', category: 'common' },
  999: { key: 'errors.common.invalidParams', category: 'common' },

  // ==================== 充值相关 (20130, 20501-20599) ====================
  20130: { key: 'errors.recharge.packageNotFound', category: 'recharge' },
  20501: { key: 'errors.recharge.invalidAmount', category: 'recharge' },
  20505: { key: 'errors.recharge.assetNotFound', category: 'recharge' },
  20506: { key: 'errors.recharge.exceedsLimit', category: 'recharge' },

  // ==================== 订单相关 (20400, 20500-20506) ====================
  20400: { key: 'errors.order.notFound', category: 'order' },
  20500: { key: 'errors.order.createFailed', category: 'order' },
  20502: { key: 'errors.order.amountOutOfRange', category: 'order' },
  20503: { key: 'errors.order.invalidMultiple', category: 'order' },
  20504: { key: 'errors.order.rechargeNotFound', category: 'order' },

  // ==================== 收益复投相关 (20701-20799) ====================
  20701: { key: 'errors.reinvest.amountRequired', category: 'reinvest' },
  20702: { key: 'errors.reinvest.invalidMultiple', category: 'reinvest' },
  20703: { key: 'errors.reinvest.minAmount', category: 'reinvest' },
  20704: { key: 'errors.reinvest.insufficientBalance', category: 'reinvest' },
  20705: { key: 'errors.reinvest.failed', category: 'reinvest' },
  20706: { key: 'errors.reinvest.exception', category: 'reinvest' },

  // ==================== 领袖激活相关 (21001-21099) ====================
  21001: { key: 'errors.leader.rateFailed', category: 'leader' },
  21002: { key: 'errors.leader.codeRequired', category: 'leader' },
  21003: { key: 'errors.leader.codeInvalid', category: 'leader' },
  21004: { key: 'errors.leader.codeNotFound', category: 'leader' },
  21005: { key: 'errors.leader.codeUsed', category: 'leader' },
  21006: { key: 'errors.leader.alreadyLeader', category: 'leader' },
  21007: { key: 'errors.leader.activationFailed', category: 'leader' },

  // ==================== 钱包相关 (30001-39999) ====================
  30001: { key: 'errors.wallet.addressRequired', category: 'wallet' },
  30002: { key: 'errors.wallet.addressInvalid', category: 'wallet' },
  30003: { key: 'errors.wallet.signatureRequired', category: 'wallet' },
  30004: { key: 'errors.wallet.signatureInvalid', category: 'wallet' },
  30005: { key: 'errors.wallet.redisConnectionFailed', category: 'wallet' },

  // ==================== 邀请相关 (40001-49999) ====================
  40001: { key: 'errors.invite.inviterRequired', category: 'invite' },
  40002: { key: 'errors.invite.inviterInvalid', category: 'invite' },
  40003: { key: 'errors.invite.inviterNotFound', category: 'invite' },
};

/**
 * 根据错误码获取错误信息
 * @param code 错误码
 * @returns 错误信息对象，如果找不到则返回默认错误信息
 */
export function getErrorMessage(code: number): ErrorCodeInfo {
  const errorKey = ERROR_CODE_KEYS[code];
  
  if (errorKey) {
    return {
      code,
      message: i18n.t(errorKey.key, { defaultValue: `Error ${code}` }),
      category: errorKey.category,
    };
  }
  
  return {
    code,
    message: i18n.t('errors.common.unknownError', { code, defaultValue: `Unknown error (${code})` }),
    category: 'unknown',
  };
}

/**
 * 判断是否为认证相关错误（需要重新登录）
 * @param code 错误码
 * @returns 是否为认证错误
 */
export function isAuthError(code: number): boolean {
  return code === 110 || code === 111 || code === 20001;
}

/**
 * 判断是否为余额不足错误
 * @param code 错误码
 * @returns 是否为余额不足
 */
export function isInsufficientBalanceError(code: number): boolean {
  return code === 145 || code === 20704;
}

/**
 * 判断是否为账号冻结错误
 * @param code 错误码
 * @returns 是否为账号冻结
 */
export function isAccountFrozenError(code: number): boolean {
  return code === 105 || code === 20002;
}

/**
 * 根据错误类别获取所有错误码
 * @param category 错误类别
 * @returns 该类别下的所有错误码信息
 */
export function getErrorsByCategory(category: string): ErrorCodeInfo[] {
  return Object.entries(ERROR_CODE_KEYS)
    .filter(([_, info]) => info.category === category)
    .map(([code, info]) => ({
      code: Number(code),
      message: i18n.t(info.key),
      category: info.category
    }));
}

/**
 * 错误类别枚举
 */
export const ERROR_CATEGORIES = {
  AUTH: 'auth',           // 认证相关
  USER: 'user',           // 用户相关
  WALLET: 'wallet',       // 钱包相关
  INVITE: 'invite',       // 邀请相关
  RECHARGE: 'recharge',   // 充值相关
  WITHDRAW: 'withdraw',   // 提现相关
  ORDER: 'order',         // 订单相关
  REINVEST: 'reinvest',   // 复投相关
  LEADER: 'leader',       // 领袖相关
  HERO: 'hero',           // 英雄相关
  RESOURCE: 'resource',   // 资源相关
  ACCOUNT: 'account',     // 账号管理
  UPLOAD: 'upload',       // 上传相关
  SUPPORT: 'support',     // 客服相关
  COMMON: 'common',       // 通用错误
  UNKNOWN: 'unknown',     // 未知错误
} as const;

export type ErrorCategory = typeof ERROR_CATEGORIES[keyof typeof ERROR_CATEGORIES];
