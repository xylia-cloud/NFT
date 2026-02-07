/**
 * 后端错误码定义和处理
 * 统一管理所有后端返回的错误码及其对应的中文提示信息
 */

export interface ErrorCodeInfo {
  code: number;
  message: string;
  category: string;
}

/**
 * 错误码映射表
 */
export const ERROR_CODES: Record<number, ErrorCodeInfo> = {
  // ==================== 登录相关 (101-129) ====================
  101: { code: 101, message: '用户名不能为空', category: 'auth' },
  102: { code: 102, message: '密码不能为空', category: 'auth' },
  103: { code: 103, message: '用户或密码错误', category: 'auth' },
  104: { code: 104, message: '登录次数过多，请稍后再试', category: 'auth' },
  105: { code: 105, message: '账号已冻结，请联系客服', category: 'auth' },
  106: { code: 106, message: '账号未填写邀请码', category: 'auth' },
  100: { code: 100, message: '登录异常，请重试', category: 'auth' },
  110: { code: 110, message: 'Token 错误，请重新登录', category: 'auth' },
  111: { code: 111, message: '用户不存在', category: 'auth' },
  112: { code: 112, message: '重置密码类型错误', category: 'auth' },
  113: { code: 113, message: '确认密码不能为空', category: 'auth' },
  114: { code: 114, message: '密码长度为 8-18 位', category: 'auth' },
  115: { code: 115, message: '密码与确认密码不一致', category: 'auth' },
  120: { code: 120, message: '邀请码错误', category: 'auth' },
  121: { code: 121, message: '推荐关系异常', category: 'auth' },
  122: { code: 122, message: '已经绑定过推荐人', category: 'auth' },
  123: { code: 123, message: '身份为代理，不能再绑定推荐人', category: 'auth' },

  // ==================== 作战英雄相关 (130-139) ====================
  130: { code: 130, message: '作战英雄ID传参错误', category: 'hero' },
  131: { code: 131, message: '选择的英雄状态无效', category: 'hero' },
  132: { code: 132, message: '作战天数选择错误', category: 'hero' },

  // ==================== 提现相关 (140-149) ====================
  140: { code: 140, message: '提现钱包地址必填', category: 'withdraw' },
  141: { code: 141, message: '提现数量必填', category: 'withdraw' },
  142: { code: 142, message: '提现资产密码必填', category: 'withdraw' },
  143: { code: 143, message: '资产密码错误', category: 'withdraw' },
  144: { code: 144, message: '提现金额不在规定范围内', category: 'withdraw' },
  145: { code: 145, message: '余额不足', category: 'withdraw' },
  146: { code: 146, message: '提现失败，请重试', category: 'withdraw' },

  // ==================== 通用错误 (10001-19999) ====================
  10001: { code: 10001, message: 'JSON 解析失败', category: 'common' },
  10002: { code: 10002, message: '参数错误', category: 'common' },
  10003: { code: 10003, message: '操作失败', category: 'common' },
  99: { code: 99, message: '系统错误', category: 'common' },
  999: { code: 999, message: '参数错误', category: 'common' },

  // ==================== 图片上传/客服相关 (10101-10106) ====================
  10101: { code: 10101, message: '图片上传失败', category: 'upload' },
  10102: { code: 10102, message: '客服问题提交失败，每天只能提交5次', category: 'support' },
  10103: { code: 10103, message: '图片内容错误', category: 'upload' },
  10104: { code: 10104, message: '客服问题提交失败，内容不能为空', category: 'support' },
  10105: { code: 10105, message: '内容不能超过500字', category: 'support' },
  10106: { code: 10106, message: '图片不能超过3张', category: 'upload' },

  // ==================== 道具/能量相关 (10201-10202) ====================
  10201: { code: 10201, message: '道具量不足', category: 'resource' },
  10202: { code: 10202, message: '能量不足', category: 'resource' },

  // ==================== 账号管理相关 (10301-10315) ====================
  10301: { code: 10301, message: '公会账号不能注销', category: 'account' },
  10302: { code: 10302, message: '账号已经申请注销', category: 'account' },
  10303: { code: 10303, message: '存在战斗中的卡牌，不能注销', category: 'account' },
  10311: { code: 10311, message: '今日已签到', category: 'account' },
  10312: { code: 10312, message: '今日已领取收益', category: 'account' },
  10313: { code: 10313, message: '已达到最大英雄数量限制', category: 'account' },
  10314: { code: 10314, message: '抽奖积分不足', category: 'account' },
  10315: { code: 10315, message: '英雄数量无效（1-10）', category: 'account' },

  // ==================== 用户相关 (20001-29999) ====================
  20001: { code: 20001, message: '用户不存在', category: 'user' },
  20002: { code: 20002, message: '账户已冻结', category: 'user' },
  20003: { code: 20003, message: '已暂停注册', category: 'user' },
  20004: { code: 20004, message: '注册失败', category: 'user' },
  20005: { code: 20005, message: '登录失败', category: 'user' },

  // ==================== 充值相关 (20130, 20501-20599) ====================
  20130: { code: 20130, message: '充值包不存在', category: 'recharge' },
  20501: { code: 20501, message: '充值金额无效（必须是500或1000的倍数，范围500-30000）', category: 'recharge' },
  20505: { code: 20505, message: '用户资产不存在', category: 'recharge' },
  20506: { code: 20506, message: '总资产不能超过30000', category: 'recharge' },

  // ==================== 订单相关 (20400, 20500-20506) ====================
  20400: { code: 20400, message: '订单ID必填或订单不存在', category: 'order' },
  20500: { code: 20500, message: '订单创建失败', category: 'order' },
  20502: { code: 20502, message: '投资金额超出范围', category: 'order' },
  20503: { code: 20503, message: '投资金额必须是指定倍数', category: 'order' },
  20504: { code: 20504, message: '充值信息不存在', category: 'order' },

  // ==================== 收益复投相关 (20701-20799) ====================
  20701: { code: 20701, message: '复投金额必填', category: 'reinvest' },
  20702: { code: 20702, message: '复投金额必须是100的倍数', category: 'reinvest' },
  20703: { code: 20703, message: '最小复投金额为100', category: 'reinvest' },
  20704: { code: 20704, message: '收益余额不足', category: 'reinvest' },
  20705: { code: 20705, message: '复投失败', category: 'reinvest' },
  20706: { code: 20706, message: '复投异常', category: 'reinvest' },

  // ==================== 领袖激活相关 (21001-21099) ====================
  21001: { code: 21001, message: '获取汇率失败', category: 'leader' },
  21002: { code: 21002, message: '激活码必填', category: 'leader' },
  21003: { code: 21003, message: '激活码格式错误', category: 'leader' },
  21004: { code: 21004, message: '激活码不存在', category: 'leader' },
  21005: { code: 21005, message: '激活码已被使用', category: 'leader' },
  21006: { code: 21006, message: '当前账号已经是领袖', category: 'leader' },
  21007: { code: 21007, message: '激活异常', category: 'leader' },

  // ==================== 钱包相关 (30001-39999) ====================
  30001: { code: 30001, message: '钱包地址必填', category: 'wallet' },
  30002: { code: 30002, message: '钱包地址格式错误', category: 'wallet' },
  30003: { code: 30003, message: '签名必填', category: 'wallet' },
  30004: { code: 30004, message: '签名验证失败', category: 'wallet' },
  30005: { code: 30005, message: 'Redis连接失败', category: 'wallet' },

  // ==================== 邀请相关 (40001-49999) ====================
  40001: { code: 40001, message: '邀请人必填', category: 'invite' },
  40002: { code: 40002, message: '邀请人格式错误', category: 'invite' },
  40003: { code: 40003, message: '邀请人不存在或未激活', category: 'invite' },
};

/**
 * 根据错误码获取错误信息
 * @param code 错误码
 * @returns 错误信息对象，如果找不到则返回默认错误信息
 */
export function getErrorMessage(code: number): ErrorCodeInfo {
  return ERROR_CODES[code] || {
    code,
    message: `未知错误 (${code})`,
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
  return Object.values(ERROR_CODES).filter((error) => error.category === category);
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
