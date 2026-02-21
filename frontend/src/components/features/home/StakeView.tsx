import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from 'react-i18next';
import { Plus, Minus, Loader2, Wallet, TrendingUp, Shield, Users, Activity, Zap, ChevronLeft, ChevronRight, Lock, PiggyBank, Calendar, Unlock, Clock, ArrowDownToLine, AlertTriangle, Twitter, ArrowUp, FileText, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { cn } from "@/lib/utils";
import { Usdt0 } from "@/components/ui/usdt0";
import { CONTRACT_ADDRESS, CONTRACT_ABI, USDT_ADDRESS, USDT_ABI } from "../../../wagmiConfig";
import { getGlobalConfig, rechargePreorder, type GlobalConfigResponse } from "@/lib/api";
import bannerSpline from "@/assets/images/banner.splinecode?url";
import partner1 from "@/assets/images/partners_1.svg";
import partner2 from "@/assets/images/partners_2.svg";
import partner3 from "@/assets/images/partners_3.svg";
import partner4 from "@/assets/images/partners_4.webp";
import partner5 from "@/assets/images/partners_5.png";
import partner6 from "@/assets/images/partners_6.svg";
import partner7 from "@/assets/images/partners_7.svg";
import partner8 from "@/assets/images/partners_8.png";
import partner9 from "@/assets/images/partners_9.svg";
import partner10 from "@/assets/images/partners_10.svg";
import certikAudit from "@/assets/images/CERTIK.webp";
import certikPdfImg from "@/assets/images/CERTIK2.webp";
import certikPdf from "@/assets/images/REP-PLASMA--28Threshold-lib-29__final-20231011T224322Z__02.pdf";
import githubImg from "@/assets/images/GitHub.webp";
import video01 from "@/assets/images/01.mp4";
import video02 from "@/assets/images/02.mp4";

// 声明 spline-viewer 自定义元素类型
/* eslint-disable @typescript-eslint/no-namespace */
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'spline-viewer': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        url?: string;
      };
    }
  }
}
/* eslint-enable @typescript-eslint/no-namespace */

// 质押金额档位 (500 ~ 30,000 USDT，1000 之后每次 +1000)
const STAKE_AMOUNTS = [500, ...Array.from({ length: 30 }, (_, i) => (i + 1) * 1000)];

// 质押订单类型
export interface StakeOrder {
  id: number;
  amount: number;
  startDate: string;
  lockEndDate: string;
  lockDays: number;
  accruedInterest: number;
  status: "locked" | "unlocked";
  dailyRate?: number; // 日化收益 %
}

// 模拟质押订单数据（锁仓 180 天，利息每日发放可单独提取，到期日为 2026 年）
export const INITIAL_STAKE_ORDERS: StakeOrder[] = [
  { id: 1, amount: 5000, startDate: "2026-01-16", lockEndDate: "2026-07-14", lockDays: 180, accruedInterest: 125.80, status: "locked", dailyRate: 0.67 },
  { id: 2, amount: 2000, startDate: "2025-12-21", lockEndDate: "2026-06-18", lockDays: 180, accruedInterest: 82.50, status: "locked", dailyRate: 0.67 },
  { id: 3, amount: 500, startDate: "2024-08-01", lockEndDate: "2025-01-28", lockDays: 180, accruedInterest: 28.30, status: "unlocked", dailyRate: 0.67 },
];

// 单个质押订单卡片（含倒计时、提现）
export function StakeOrderItem({
  order,
  onWithdraw,
  isWithdrawing,
}: {
  order: StakeOrder;
  onWithdraw: (order: StakeOrder) => void;
  isWithdrawing: boolean;
}) {
  const { t } = useTranslation();
  // 按天计算倒计时
  const [remainingDays, setRemainingDays] = useState<number>(0);
  const isLocked = order.status === "locked";

  useEffect(() => {
    if (!isLocked) return;
    const update = () => {
      const end = new Date(order.lockEndDate + " 23:59:59").getTime();
      const now = Date.now();
      const diff = end - now;
      if (diff <= 0) {
        setRemainingDays(0);
        return;
      }
      // 向上取整，按天计算剩余时间
      const days = Math.max(0, Math.ceil(diff / (24 * 60 * 60 * 1000)));
      setRemainingDays(days);
    };
    update();
    const timer = setInterval(update, 60000);
    return () => clearInterval(timer);
  }, [order.lockEndDate, isLocked]);

  return (
    <div className="p-5 md:p-6 hover:bg-muted/20 transition-colors space-y-5">
      {/* 顶部：金额 + 状态 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0 p-1.5">
            <Usdt0 iconSize="xl" iconOnly />
          </div>
          <div className="space-y-2 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-lg text-foreground">{order.amount.toLocaleString()} USDT0</span>
              <Badge
                variant="outline"
                className={cn(
                  "text-[10px] h-5 px-2",
                  isLocked ? "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400" : "border-primary/30 bg-primary/10 text-primary"
                )}
              >
                {isLocked ? <><Lock className="h-2.5 w-2.5 mr-0.5 inline" /> {t('stake.cooldownPeriod')}</> : <><Unlock className="h-2.5 w-2.5 mr-0.5 inline" /> {t('stake.withdrawable')}</>}
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                {order.startDate} ~ {order.lockEndDate}
              </span>
              <span className="hidden sm:inline">·</span>
              <span>{order.lockDays} {t('home.days')}</span>
            </div>
          </div>
        </div>
        <div className="flex-1 min-w-0 flex flex-row items-end justify-end gap-2 sm:gap-4">
          <div className="flex-1 min-w-0 text-left sm:text-right">
            <div className="text-xs text-muted-foreground mb-0.5">{t('stake.accruedInterest')}</div>
            <div className="text-lg font-bold text-primary">+{order.accruedInterest.toFixed(2)} USDT0</div>
          </div>
          {isLocked && (
            <div className="flex-1 min-w-0 text-left sm:text-right">
              <div className="text-xs text-muted-foreground mb-0.5">{t('stake.cooldownCountdown')}</div>
              <div className="text-lg font-bold text-foreground flex items-center gap-1 sm:justify-end">
                <Clock className="h-4 w-4 shrink-0" />
                {remainingDays} {t('home.days')}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 可提取时：提现区域（仅提取本金，利息每日发放可单独提取） */}
      {!isLocked && (
        <div className="flex items-center justify-between gap-4 pt-4 border-t border-border/70">
          <div className="text-sm text-muted-foreground">
            {t('stake.principalWithdrawable', { amount: order.amount.toLocaleString() })}
          </div>
          <Button
            size="sm"
            className="gap-1.5 rounded-lg shrink-0"
            onClick={() => onWithdraw(order)}
            disabled={isWithdrawing}
          >
            {isWithdrawing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ArrowDownToLine className="h-3.5 w-3.5" />}
            {t('stake.withdrawPrincipal')}
          </Button>
        </div>
      )}
    </div>
  );
}

// 数字滚动组件
function CountUp({ end, duration = 2000, suffix = "" }: { end: number, duration?: number, suffix?: string }) {
  const [count, setCount] = useState(0);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    const animate = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const progress = timestamp - startTimeRef.current;
      const percentage = Math.min(progress / duration, 1);
      
      // Easing function (easeOutExpo)
      const ease = percentage === 1 ? 1 : 1 - Math.pow(2, -10 * percentage);
      
      const currentCount = Math.floor(ease * end);
      setCount(currentCount);

      if (percentage < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  }, [end, duration]);

  return <span>{count.toLocaleString()}{suffix}</span>;
}

export function StakeView() {
  const [stepIndex, setStepIndex] = useState(0);
  const amount = STAKE_AMOUNTS[stepIndex];
  const { isConnected, address } = useAccount();
  const { t } = useTranslation();
  
  // 获取全局配置
  const [globalConfig, setGlobalConfig] = useState<GlobalConfigResponse | null>(null);
  
  useEffect(() => {
    const fetchGlobalConfig = async () => {
      try {
        const data = await getGlobalConfig();
        setGlobalConfig(data);
        console.log('✅ 全局配置获取成功:', data);
      } catch (err) {
        console.error('❌ 获取全局配置失败:', err);
        // 静默处理错误
      }
    };
    
    fetchGlobalConfig();
    // 每30秒刷新一次
    const interval = setInterval(fetchGlobalConfig, 30000);
    return () => clearInterval(interval);
  }, []);
  
  // 查询 USDT 余额
  const { data: usdtBalance, refetch: refetchUsdtBalance } = useReadContract({
    address: USDT_ADDRESS,
    abi: USDT_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
  });
  
  const [mounted, setMounted] = useState(false);
  const [depositStep, setDepositStep] = useState<'idle' | 'approving' | 'depositing'>('idle');
  const [pendingDepositAmount, setPendingDepositAmount] = useState<bigint | null>(null);
  const [showInsufficientDialog, setShowInsufficientDialog] = useState(false);
  const [insufficientInfo, setInsufficientInfo] = useState<{ balanceUsdt: string; requiredUsdt: string } | null>(null);
  const [showDepositSuccessDialog, setShowDepositSuccessDialog] = useState(false);
  const [depositSuccessInfo, setDepositSuccessInfo] = useState<{ amountUsdt: string; txHash?: string } | null>(null);
  const [showStakeConfirmDialog, setShowStakeConfirmDialog] = useState(false);
  const [showTxErrorDialog, setShowTxErrorDialog] = useState(false);
  const [txErrorInfo, setTxErrorInfo] = useState<{ title: string; description: string; detail?: string } | null>(null);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [certikCarouselIndex, setCertikCarouselIndex] = useState(0);
  const video1Ref = useRef<HTMLVideoElement>(null);
  const video2Ref = useRef<HTMLVideoElement>(null);

  const partnersRow1 = [partner1, partner2, partner3, partner4, partner5];
  const partnersRow2 = [partner6, partner7, partner8, partner9, partner10];
  
  const { data: hash, isPending, writeContract, error: writeError, reset: resetWrite } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });

  useEffect(() => {
    const timer = setTimeout(() => {
        setMounted(true);
    }, 0)
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const main = document.querySelector("main");
    if (!main) return;
    const onScroll = () => setShowBackToTop(main.scrollTop > 300);
    main.addEventListener("scroll", onScroll, { passive: true });
    return () => main.removeEventListener("scroll", onScroll);
  }, []);

  // CertiK 三图移动端自动轮播，每 4 秒切换
  useEffect(() => {
    const timer = setInterval(() => {
      setCertikCarouselIndex((prev) => (prev + 1) % 3);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  // 当 approve 交易确认后，自动调用 depositUsdt
  useEffect(() => {
    if (isConfirmed && depositStep === 'approving' && pendingDepositAmount) {
      setDepositStep('depositing');
      // 使用预下单获取的订单号
      const orderId = (window as any).__currentOrderId || `DEPOSIT-${Date.now()}-${address?.slice(-6)}`;
      console.log('💰 调用链上充值，订单号:', orderId);
      writeContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'depositUsdt',
        args: [pendingDepositAmount, orderId],
      });
      setPendingDepositAmount(null);
    }
  }, [isConfirmed, depositStep, pendingDepositAmount, writeContract, address]);

  // 当 depositUsdt 交易确认后，重置状态
  useEffect(() => {
    if (isConfirmed && depositStep === 'depositing') {
      const orderId = (window as any).__currentOrderId;
      
      // 充值成功：弹窗提示 + 刷新余额
      console.log('✅ 链上充值成功！');
      console.log('- 订单号:', orderId);
      console.log('- 交易哈希:', hash);
      console.log('- 金额:', amount, 'USDT');
      
      setDepositSuccessInfo({
        amountUsdt: amount.toLocaleString(),
        txHash: hash,
      });
      setShowDepositSuccessDialog(true);
      setDepositStep('idle');
      setPendingDepositAmount(null);
      resetWrite();
      
      // 清理订单号
      delete (window as any).__currentOrderId;
      
      // 刷新顶部余额显示
      void refetchUsdtBalance();
      
      // 可选：查询订单状态（后端会监听链上事件并更新订单状态）
      // 这里可以添加轮询逻辑，定期查询订单状态直到变为 'finished'
    }
  }, [isConfirmed, depositStep, resetWrite, refetchUsdtBalance, amount, hash]);

  // 当交易失败时，重置状态
  useEffect(() => {
    if (writeError) {
      const stepLabel = depositStep === 'approving' ? t('common.approving').replace('...', '') : depositStep === 'depositing' ? t('common.depositing').replace('...', '') : t('common.transaction');
      const msg = (writeError as any)?.shortMessage ?? (writeError as any)?.message ?? String(writeError);
      const isUserRejected =
        (writeError as any)?.name === 'UserRejectedRequestError' ||
        /user rejected|rejected|denied|取消|拒绝/i.test(msg);

      console.error('❌ 交易失败:', msg);
      
      setTxErrorInfo({
        title: isUserRejected ? t('home.txCancelled') : t('home.txFailed', { action: stepLabel }),
        description: isUserRejected
          ? t('home.txCancelledDesc', { action: stepLabel })
          : t('home.txFailedDesc', { action: stepLabel }),
        detail: msg,
      });
      setShowTxErrorDialog(true);
      setDepositStep('idle');
      setPendingDepositAmount(null);
      resetWrite();
      
      // 清理订单号
      delete (window as any).__currentOrderId;
    }
  }, [writeError, depositStep, resetWrite]);

  // 加载 Spline Viewer 脚本
  useEffect(() => {
    const script = document.createElement('script');
    script.type = 'module';
    script.src = 'https://unpkg.com/@splinetool/viewer@1.12.32/build/spline-viewer.js';
    document.head.appendChild(script);

    // 添加 CSS 隐藏 Spline 水印
    const style = document.createElement('style');
    style.textContent = `
      spline-viewer {
        width: 100%;
        height: 100%;
      }
      spline-viewer #logo,
      spline-viewer .logo,
      spline-viewer [id*="logo"],
      spline-viewer [class*="logo"],
      spline-viewer a[href*="spline"] {
        display: none !important;
        opacity: 0 !important;
        visibility: hidden !important;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(script);
      document.head.removeChild(style);
    };
  }, []);

  const handleDecrease = () => {
    if (stepIndex > 0) {
      setStepIndex(stepIndex - 1);
    }
  };

  const handleIncrease = () => {
    if (stepIndex < STAKE_AMOUNTS.length - 1) {
      setStepIndex(stepIndex + 1);
    }
  };

  const handleStake = async () => {
    if (!isConnected || !address) return;
    
    const usdtAmount = BigInt(amount * 1e6); // USDT decimals = 6
    
    // 检查余额是否足够（前端提示更友好；最终仍以链上为准）
    const balance = usdtBalance != null ? BigInt(usdtBalance.toString()) : 0n;
    if (balance < usdtAmount) {
      setInsufficientInfo({
        balanceUsdt: (Number(balance) / 1e6).toFixed(2),
        requiredUsdt: amount.toLocaleString(),
      });
      setShowInsufficientDialog(true);
      return;
    }
    
    try {
      // 1. 先调用后端预下单接口获取订单号
      console.log('📝 调用预下单接口，金额:', amount);
      const preorderResult = await rechargePreorder({ amount: amount.toString() });
      console.log('✅ 预下单成功，订单号:', preorderResult.order_id);
      
      // 2. 使用订单号作为链上充值的订单号
      const orderId = preorderResult.order_id;
      
      // 重置状态
      resetWrite();
      setDepositStep('approving');
      setPendingDepositAmount(usdtAmount);
      
      // 3. 先 approve，等待交易确认后再调用 depositUsdt（在 useEffect 中处理）
      // 将订单号保存到状态中，供后续使用
      (window as any).__currentOrderId = orderId;
      
      writeContract({
        address: USDT_ADDRESS,
        abi: USDT_ABI,
        functionName: 'approve',
        args: [CONTRACT_ADDRESS, usdtAmount],
      });
    } catch (error) {
      console.error('❌ 预下单失败:', error);
      // 显示错误提示
      setTxErrorInfo({
        title: t('home.preorderFailed'),
        description: t('home.preorderFailedDesc'),
        detail: error instanceof Error ? error.message : String(error),
      });
      setShowTxErrorDialog(true);
    }
  };

  // 动态计算预估收益（使用真实的月化收益率）
  const monthlyRate = parseFloat(globalConfig?.monthly_return_rate || "20") / 100;
  const estimatedDailyReward = (amount * monthlyRate / 30).toFixed(2);

  if (!mounted) return null;

  return (
    <div className="space-y-4 animate-in fade-in duration-700 pb-20 relative max-w-4xl mx-auto">
      {/* 背景装饰 (Subtle) */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-500/5 blur-[120px]" />
      </div>

      {/* 1. 顶部 Hero 区域 - 未连接状态 */}
      {!isConnected && (
        <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-black/80 backdrop-blur-md shadow-none min-h-[200px]">
          <div className="absolute inset-0 bg-grid-white/5 [mask-image:linear-gradient(0deg,transparent,black)]" />

          {/* Spline 3D 动画背景 */}
          <div className="absolute inset-0 bottom-[-60px] right-[-60px] overflow-hidden rounded-2xl pointer-events-none">
            {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
            {/* @ts-expect-error */}
            <spline-viewer
              url={bannerSpline}
              style={{
                pointerEvents: 'none',
                width: '100%',
                height: '100%',
                display: 'block'
              }}
            />
          </div>

          <div className="absolute inset-0 flex items-center p-4 md:p-5 z-10">
            <div className="space-y-2 text-center md:text-left max-w-2xl w-full">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/40 text-xs font-medium text-blue-300 w-fit mx-auto md:mx-0">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-400"></span>
                </span>
                {t('home.liveStatus')}
              </div>
              <h2 className="text-2xl md:text-4xl font-bold tracking-tight text-white leading-tight">
                {t('home.heroTitle').split(' ').map((word, i) => 
                  word === 'Web3' || word === '财富' ? (
                    <span key={i} className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-blue-400 to-primary drop-shadow-[0_0_12px_rgba(34,211,238,0.5)]">{word} </span>
                  ) : word + ' '
                )}
              </h2>
              <p className="text-xs text-gray-300 leading-relaxed">
                {t('home.heroSubtitle', { rate: globalConfig?.monthly_return_rate || "20" })}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 1. 顶部 Hero 区域 - 已连接状态 */}
      {isConnected && (
        <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-card/40 backdrop-blur-md shadow-none">
          <div className="absolute inset-0 bg-grid-white/5 [mask-image:linear-gradient(0deg,transparent,black)]" />

          <div className="relative p-4 md:p-4">
            <ConnectButton.Custom>
              {({
                account,
                chain,
                openAccountModal,
                mounted,
              }) => {
                if (!mounted || !account || !chain) return null;

                return (
                  <div className="flex flex-col space-y-6 animate-in slide-in-from-top-4 duration-500">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="relative group cursor-pointer">
                          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary to-primary/80 p-[1.5px] shadow-sm transition-transform group-hover:scale-105">
                            <div className="h-full w-full rounded-[7px] bg-card flex items-center justify-center">
                              <Wallet className="h-5 w-5 text-primary" />
                            </div>
                          </div>
                          <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-primary rounded-full border-[1.5px] border-card flex items-center justify-center ring-1 ring-background/50">
                            <div className="h-1 w-1 bg-white rounded-full animate-pulse" />
                          </div>
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">{t('common.connected')}</p>
                          <h3 className="font-bold text-sm tracking-tight text-foreground">{account.displayName}</h3>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-card/40 border border-border/20 backdrop-blur-md">
                          <div className="flex items-center gap-1.5">
                            <div className="relative flex h-1.5 w-1.5">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary"></span>
                            </div>
                            <span className="font-medium text-xs">{chain.name}</span>
                          </div>
                          <div className="w-px h-3 bg-border/50 mx-1"></div>
                          <span className="text-[10px] font-medium text-muted-foreground">{t('common.connected')}</span>
                        </div>

                          <Button
                          variant="secondary"
                          onClick={openAccountModal}
                          className="rounded-lg px-3 h-9 font-medium bg-secondary/80 hover:bg-secondary border border-border/10 transition-all shadow-sm"
                        >
                          <span className="font-mono text-xs inline-flex items-center gap-1">
                            {usdtBalance ? (Number(usdtBalance) / 1e6).toFixed(2) : '0.00'} <Usdt0 iconSize="sm" />
                          </span>
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              }}
            </ConnectButton.Custom>
          </div>
        </div>
      )}

      {/* 2. 数据指标 (Glassmorphism) */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: TrendingUp, label: t('home.monthlyReturn'), value: `${globalConfig?.monthly_return_rate || "20"}%`, sub: t('home.stableReturn'), color: "text-primary", bg: "bg-primary/10" },
          { icon: Activity, label: t('home.totalStaking'), value: `${globalConfig?.total_staking || "0"}`, sub: t('home.continuousGrowth'), color: "text-blue-500", bg: "bg-blue-500/10" },
          { icon: Users, label: t('home.totalParticipants'), value: <CountUp end={globalConfig?.total_participants_raw || 0} />, sub: t('home.globalUsers'), color: "text-violet-500", bg: "bg-violet-500/10" },
        ].map((item, index) => (
          <div 
            key={index} 
            className="group relative overflow-hidden rounded-xl border border-border/70 bg-card/40 p-4 hover:bg-card/60 transition-all duration-300 shadow-none"
          >
            <div className="relative z-10 flex flex-col h-full justify-between gap-3">
              <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", item.bg, item.color)}>
                <item.icon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-0.5">{item.label}</p>
                <p className="text-xl font-bold tracking-tight text-foreground">{item.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                  <span className="inline-block w-1 h-1 rounded-full bg-primary" />
                  {item.sub}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 3. 核心质押面板 */}
      <Card className="border border-border/70 shadow-none bg-card/30 rounded-2xl overflow-hidden backdrop-blur-sm">
        <CardHeader className="p-6 pb-0">
          <div className="flex items-center justify-between mb-1">
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              {t('home.stakeMining')}
              <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold tracking-wide uppercase border border-primary/20">Live</span>
            </CardTitle>
            <Lock className="h-4 w-4 text-muted-foreground/50" />
          </div>
          <CardDescription className="text-sm">
            {t('home.selectStakeAmount')}
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6 pt-8 space-y-8">
          <div className="space-y-6">
            {/* 金额选择器 */}
            <div className="flex items-center justify-between gap-4">
              <Button
                variant="outline"
                size="icon"
                className="h-12 w-12 rounded-xl border border-border/50 hover:border-primary hover:text-primary transition-all disabled:opacity-20 active:scale-95 bg-transparent shadow-none"
                onClick={handleDecrease}
                disabled={stepIndex === 0}
              >
                <Minus className="h-5 w-5" />
              </Button>

              <div className="flex-1 flex flex-col items-center justify-center relative py-1">
                <span className="text-4xl md:text-5xl font-bold tracking-tighter text-foreground tabular-nums animate-in zoom-in-50 duration-200 key-[amount] relative z-10 inline-flex items-center justify-center gap-2">
                  <Usdt0 iconSize="xl" iconOnly />
                  {amount}
                </span>
                <span className="text-xs font-semibold text-muted-foreground mt-1 bg-secondary/50 px-3 py-1 rounded-full border border-border/50">
                  USDT0
                </span>
              </div>

              <Button
                variant="outline"
                size="icon"
                className="h-12 w-12 rounded-xl border border-border/50 hover:border-primary hover:text-primary transition-all disabled:opacity-20 active:scale-95 bg-transparent shadow-none"
                onClick={handleIncrease}
                disabled={stepIndex === STAKE_AMOUNTS.length - 1}
              >
                <Plus className="h-5 w-5" />
              </Button>
            </div>

            {/* 进度条与刻度 */}
            <div className="space-y-3">
              <div className="relative h-3 w-full bg-secondary/50 rounded-full overflow-hidden p-0.5">
                <div 
                  className="h-full bg-primary rounded-full transition-all duration-500 ease-out relative"
                  style={{ width: `${((stepIndex) / (STAKE_AMOUNTS.length - 1)) * 100}%` }}
                >
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 h-1.5 w-1.5 bg-white rounded-full opacity-50" />
                </div>
              </div>
              <div className="flex justify-between text-xs font-medium text-muted-foreground px-1">
                <span>500 USDT0</span>
                <span>15,000 USDT0</span>
                <span>30,000 USDT0</span>
              </div>
            </div>

            {/* 收益预估卡片 */}
            <div className="bg-secondary/20 rounded-xl p-4 border border-border/30 flex items-center justify-between">
              <div className="flex flex-col gap-0.5">
                <span className="text-sm text-muted-foreground font-medium">{t('home.estimatedDailyReward')}</span>
                <span className="text-xs text-muted-foreground/60">{t('home.basedOnApy')}</span>
              </div>
              <div className="text-right">
                <span className="block text-2xl font-bold text-foreground">
                  +{estimatedDailyReward}
                </span>
                <span className="text-sm font-medium text-primary">USDT0 / Day</span>
              </div>
            </div>

            {/* 复投提示 */}
            <p className="text-xs text-muted-foreground/80 flex items-center gap-2">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary text-[10px]">i</span>
              {t('home.reinvestTip')}
            </p>
          </div>
        </CardContent>

        <CardFooter className="p-6 pt-0">
          <ConnectButton.Custom>
            {({ mounted, account }) => {
              if (!mounted || !account) {
                return (
                  <p className="w-full text-center py-4 text-sm text-muted-foreground">
                    {t('home.connectWalletFirst')}
                  </p>
                )
              }
              return (
                <Button 
                  className="w-full h-14 rounded-xl text-base font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition-all active:scale-[0.98] shadow-none relative overflow-hidden group"
                  onClick={() => setShowStakeConfirmDialog(true)}
                  disabled={isPending || isConfirming || depositStep !== 'idle'}
                >
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                  <span className="relative flex items-center justify-center gap-2">
                    {isPending && depositStep === 'approving' ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        {t('common.approving')}
                      </>
                    ) : isPending && depositStep === 'depositing' ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        {t('common.depositing')}
                      </>
                    ) : isConfirming ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        {t('common.packaging')}
                      </>
                    ) : (
                      <>
                        {t('home.stakeNow')}
                        <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </span>
                </Button>
              )
            }}
          </ConnectButton.Custom>
        </CardFooter>
      </Card>

      {/* 余额不足弹窗 */}
      <Dialog open={showInsufficientDialog} onOpenChange={setShowInsufficientDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="text-center">
            <div className="mx-auto mb-4 h-14 w-14 rounded-full bg-amber-500/10 flex items-center justify-center">
              <AlertTriangle className="h-7 w-7 text-amber-500" />
            </div>
            <DialogTitle className="text-xl">{t('home.insufficientBalance')}</DialogTitle>
            <DialogDescription className="text-base">
              {t('home.insufficientBalanceDesc')}
            </DialogDescription>
          </DialogHeader>
          <div className="px-6 pb-2">
            <div className="rounded-xl border border-border/70 bg-muted/20 p-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t('home.currentBalance')}</span>
                <span className="font-semibold">{insufficientInfo?.balanceUsdt ?? "0.00"} USDT0</span>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-muted-foreground">{t('home.requiredAmount')}</span>
                <span className="font-semibold">{insufficientInfo?.requiredUsdt ?? amount.toLocaleString()} USDT0</span>
              </div>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              {t('home.insufficientTip')}
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="secondary"
              className="w-full h-11 rounded-xl"
              onClick={() => setShowInsufficientDialog(false)}
            >
              {t('common.iKnow')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 质押确认弹窗 */}
      <Dialog open={showStakeConfirmDialog} onOpenChange={setShowStakeConfirmDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="text-center">
            <div className="mx-auto mb-4 h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
              <PiggyBank className="h-7 w-7 text-primary" />
            </div>
            <DialogTitle className="text-xl">{t("home.confirmStake")}</DialogTitle>
            <DialogDescription className="text-base">
              {t("home.stakeAmountText")} <span className="font-bold text-foreground">{amount.toLocaleString()} USDT0</span>
            </DialogDescription>
          </DialogHeader>
          <div className="px-6 pb-2">
            <div className="rounded-xl border border-border/70 bg-muted/20 p-4 text-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t("home.walletBalance")}</span>
                <span className="font-semibold">{usdtBalance ? (Number(usdtBalance) / 1e6).toFixed(2) : "0.00"} USDT0</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t("home.contractAddress")}</span>
                <span className="font-mono text-xs truncate max-w-[180px] text-right">{CONTRACT_ADDRESS}</span>
              </div>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              {t("home.confirmStakeTip")}
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="secondary"
              className="w-full h-11 rounded-xl"
              onClick={() => setShowStakeConfirmDialog(false)}
            >
              {t("common.cancel")}
            </Button>
            <Button
              className="w-full h-11 rounded-xl"
              onClick={async () => {
                setShowStakeConfirmDialog(false);
                await handleStake();
              }}
            >
              {t("home.confirmStake")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 充值成功弹窗 */}
      <Dialog open={showDepositSuccessDialog} onOpenChange={setShowDepositSuccessDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="text-center">
            <div className="mx-auto mb-4 h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
              <PiggyBank className="h-7 w-7 text-primary" />
            </div>
            <DialogTitle className="text-xl">{t("home.stakeSuccess")}</DialogTitle>
            <DialogDescription className="text-base">
              已成功充值 <span className="font-bold text-foreground">{depositSuccessInfo?.amountUsdt ?? amount.toLocaleString()} USDT0</span> 到合约
            </DialogDescription>
          </DialogHeader>
          <div className="px-6 pb-2">
            <div className="rounded-xl border border-border/70 bg-muted/20 p-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t("home.txHash")}</span>
                <span className="font-mono text-xs truncate max-w-[180px] text-right">
                  {depositSuccessInfo?.txHash ?? "-"}
                </span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              className="w-full h-11 rounded-xl"
              onClick={() => setShowDepositSuccessDialog(false)}
            >
              {t("common.ok")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 交易失败/取消弹窗 */}
      <Dialog open={showTxErrorDialog} onOpenChange={setShowTxErrorDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="text-center">
            <div className="mx-auto mb-4 h-14 w-14 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="h-7 w-7 text-destructive" />
            </div>
            <DialogTitle className="text-xl">{txErrorInfo?.title ?? t("home.txNotCompleted")}</DialogTitle>
            <DialogDescription className="text-base">
              {txErrorInfo?.description ?? t("home.txFailedGeneric")}
            </DialogDescription>
          </DialogHeader>
          {txErrorInfo?.detail && (
            <div className="px-6 pb-2">
              <div className="rounded-xl border border-border/70 bg-muted/20 p-4 text-xs font-mono text-muted-foreground break-words">
                {txErrorInfo.detail}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button className="w-full h-11 rounded-xl" onClick={() => setShowTxErrorDialog(false)}>
              {t("common.ok")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 4. 安全与合规 */}
      <div className="mt-6 space-y-5">
        <div className="space-y-1 text-center">
          <h3 className="text-xl font-semibold text-foreground">{t("home.securityCompliance")}</h3>
          <p className="text-sm text-muted-foreground">
            {t('home.securityDesc')}
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-sm text-muted-foreground">
          <div className="space-y-2.5 rounded-xl bg-background/60 border border-border/70 p-4">
            <p className="text-sm font-semibold text-foreground">{t("home.assetSecurity")}</p>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary/70" />
                <span>{t("home.assetSecurityItem1")}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary/70" />
                <span>{t("home.assetSecurityItem2")}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary/70" />
                <span>{t("home.assetSecurityItem3")}</span>
              </li>
            </ul>
          </div>
          <div className="space-y-2.5 rounded-xl bg-background/60 border border-border/70 p-4">
            <p className="text-sm font-semibold text-foreground">{t("home.complianceSystem")}</p>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary/70" />
                <span>{t("home.complianceItem1")}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary/70" />
                <span>{t("home.complianceItem2")}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary/70" />
                <span>{t("home.complianceItem3")}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary/70" />
                <span>{t("home.complianceItem4")}</span>
              </li>
            </ul>
          </div>
          <div className="space-y-2.5 rounded-xl bg-background/60 border border-border/70 p-4">
            <p className="text-sm font-semibold text-foreground">{t("home.userProtection")}</p>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary/70" />
                <span>{t("home.userProtectionItem1")}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary/70" />
                <span>{t("home.userProtectionItem2")}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary/70" />
                <span>{t("home.userProtectionItem3")}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary/70" />
                <span>{t("home.userProtectionItem4")}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* 视频展示区域 */}
      <div className="space-y-3 mt-8">
        <div className="text-center space-y-1">
          <p className="text-xl font-semibold text-foreground">
            {t("home.platformIntro")}
          </p>
          <p className="text-sm text-muted-foreground">
            {t("home.platformIntroDesc")}
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 视频 1 */}
          <div
            onClick={() => {
              if (video1Ref.current) {
                if (video1Ref.current.paused) {
                  video1Ref.current.play();
                } else {
                  video1Ref.current.pause();
                }
              }
            }}
            className="relative rounded-xl overflow-hidden border border-border/40 bg-card/50 shadow-sm hover:shadow-md transition-all group cursor-pointer"
          >
            <video
              ref={video1Ref}
              className="w-full h-auto"
              preload="metadata"
              controls
              poster={`${video01}#t=0.1`}
            >
              <source src={video01} type="video/mp4" />
            </video>
          </div>
          {/* 视频 2 */}
          <div
            onClick={() => {
              if (video2Ref.current) {
                if (video2Ref.current.paused) {
                  video2Ref.current.play();
                } else {
                  video2Ref.current.pause();
                }
              }
            }}
            className="relative rounded-xl overflow-hidden border border-border/40 bg-card/50 shadow-sm hover:shadow-md transition-all group cursor-pointer"
          >
            <video
              ref={video2Ref}
              className="w-full h-auto"
              preload="metadata"
              controls
              poster={`${video02}#t=0.1`}
            >
              <source src={video02} type="video/mp4" />
            </video>
          </div>
        </div>
      </div>

      {/* 5. 投资人 & 合作伙伴 Logo 滚动展示 */}
      <div className="space-y-3 mt-4">
        <div className="text-center space-y-1">
          <p className="text-xl font-semibold text-foreground">
            {t("home.partners")}
          </p>
          <p className="text-sm text-muted-foreground">
            {t("home.partnersDesc")}
          </p>
        </div>
        <div className="partner-container relative overflow-hidden">
          <div className="partner-row">
            {[...partnersRow1, ...partnersRow1].map((src, idx) => (
              <div
                key={`p1-${idx}`}
                className="flex items-center justify-center opacity-90 border border-border/70 rounded-lg w-24 h-14 shrink-0"
              >
                <img src={src} alt="partner" className="w-16 h-8 object-contain" />
              </div>
            ))}
          </div>
        </div>
        <div className="partner-container relative overflow-hidden">
          <div className="partner-row-reverse">
            {[...partnersRow2, ...partnersRow2].map((src, idx) => (
              <div
                key={`p2-${idx}`}
                className="flex items-center justify-center opacity-90 border border-border/70 rounded-lg w-24 h-14 shrink-0"
              >
                <img src={src} alt="partner" className="w-16 h-8 object-contain" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 5. 特性说明 (Minimalist) */}
      <div className="opacity-80 mt-2 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex gap-3 p-3">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <Shield className="h-4 w-4" />
            </div>
            <div>
              <h4 className="font-semibold text-foreground text-sm mb-0.5">{t('home.certikAudit')}</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {t('home.certikAuditDesc')}
              </p>
            </div>
          </div>
          <div className="flex gap-3 p-3">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <Zap className="h-4 w-4" />
            </div>
            <div>
              <h4 className="font-semibold text-foreground text-sm mb-0.5">{t('home.fastSettlement')}</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {t('home.fastSettlementDesc')}
              </p>
            </div>
          </div>
        </div>
        {/* 审计图、PDF图、GitHub 图 - 移动端 100% 宽度 + 左右手动切换，桌面端三列网格 */}
        <div className="md:hidden overflow-hidden -mx-4 relative">
          <div
            className="flex transition-transform duration-500 ease-out"
            style={{ transform: `translateX(-${certikCarouselIndex * 100}%)` }}
          >
            <div className="flex-shrink-0 w-full flex flex-col items-center gap-2 p-4 rounded-xl">
              <img src={certikAudit} alt="CertiK 审计" className="w-full h-auto object-contain rounded border border-border/60 bg-background/60" />
              <span className="text-sm text-muted-foreground">{t("home.certikAuditLabel")}</span>
            </div>
            <a
              href={certikPdf}
              target="_blank"
              rel="noreferrer"
              className="flex-shrink-0 w-full flex flex-col items-center gap-2 p-4 rounded-xl group"
            >
              <div className="relative w-full">
                <img src={certikPdfImg} alt="CertiK 审计报告 PDF" className="w-full h-auto object-contain rounded border border-border/60 bg-background/60 group-hover:opacity-90 transition-opacity" />
                <span className="absolute bottom-1 right-1 flex items-center justify-center w-6 h-6 rounded-full bg-primary/90 text-primary-foreground">
                  <FileText className="h-3 w-3" />
                </span>
              </div>
              <span className="text-sm text-muted-foreground">{t("home.viewPdf")}</span>
            </a>
            <a
              href="https://github.com/plasma-disassembler/plasma"
              target="_blank"
              rel="noreferrer"
              className="flex-shrink-0 w-full flex flex-col items-center gap-2 p-4 rounded-xl group"
            >
              <img src={githubImg} alt="GitHub 仓库" className="w-full h-auto object-contain rounded border border-border/60 bg-background/60 group-hover:opacity-90 transition-opacity" />
              <span className="text-sm text-muted-foreground flex items-center gap-1">GitHub <ExternalLink className="h-3.5 w-3.5" /></span>
            </a>
          </div>
          <button
            type="button"
            onClick={() => setCertikCarouselIndex((prev) => (prev === 0 ? 2 : prev - 1))}
            className="absolute left-1 top-1/2 -translate-y-1/2 z-10 h-9 w-9 rounded-full bg-background/90 border border-border/70 shadow-sm flex items-center justify-center text-foreground hover:bg-muted transition-colors"
            aria-label="上一张"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => setCertikCarouselIndex((prev) => (prev + 1) % 3)}
            className="absolute right-1 top-1/2 -translate-y-1/2 z-10 h-9 w-9 rounded-full bg-background/90 border border-border/70 shadow-sm flex items-center justify-center text-foreground hover:bg-muted transition-colors"
            aria-label="下一张"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          <div className="flex justify-center gap-1.5 pt-2">
            {[0, 1, 2].map((i) => (
              <button
                key={i}
                type="button"
                onClick={() => setCertikCarouselIndex(i)}
                className={cn("h-1.5 rounded-full transition-all", i === certikCarouselIndex ? "w-4 bg-primary" : "w-1.5 bg-muted-foreground/30")}
                aria-label={`切换到第 ${i + 1} 张`}
              />
            ))}
          </div>
        </div>
        <div className="hidden md:grid grid-cols-3 gap-3 md:gap-4">
          <div className="flex flex-col items-center gap-2">
            <img src={certikAudit} alt="CertiK 审计" className="w-full h-auto object-contain rounded border border-border/60 bg-background/60" />
            <span className="text-sm text-muted-foreground">{t("home.certikAuditLabel")}</span>
          </div>
          <a
            href={certikPdf}
            target="_blank"
            rel="noreferrer"
            className="flex flex-col items-center gap-2 group relative"
          >
            <div className="relative w-full">
              <img src={certikPdfImg} alt="CertiK 审计报告 PDF" className="w-full h-auto object-contain rounded border border-border/60 bg-background/60 group-hover:border-primary/50 transition-colors" />
              <span className="absolute bottom-1 right-1 flex items-center justify-center w-6 h-6 rounded-full bg-primary/90 text-primary-foreground">
                <FileText className="h-3 w-3" />
              </span>
            </div>
            <span className="text-sm text-muted-foreground">{t("home.viewPdf")}</span>
          </a>
          <a
            href="https://github.com/plasma-disassembler/plasma"
            target="_blank"
            rel="noreferrer"
            className="flex flex-col items-center gap-2 group"
          >
            <img src={githubImg} alt="GitHub 仓库" className="w-full h-auto object-contain rounded border border-border/60 bg-background/60 group-hover:border-primary/50 transition-colors" />
            <span className="text-sm text-muted-foreground flex items-center gap-1">GitHub <ExternalLink className="h-3.5 w-3.5" /></span>
          </a>
        </div>
      </div>

      {/* 6. PLASMA 官方社交媒体 */}
      <div className="mt-8 pt-6 border-t border-border/70 flex justify-center">
        <a
          href="https://x.com/Plasma"
          target="_blank"
          rel="noopener noreferrer"
          className="h-10 w-10 rounded-xl border border-border/50 bg-card/40 flex items-center justify-center text-black hover:opacity-80 transition-opacity"
          aria-label="X (Twitter)"
        >
          <Twitter className="h-5 w-5" />
        </a>
      </div>

      {/* 返回顶部 - 下滑时显示 */}
      {showBackToTop && (
        <button
          type="button"
          onClick={() => {
          document.querySelector("main")?.scrollTo({ top: 0, behavior: "smooth" });
          window.scrollTo({ top: 0, behavior: "smooth" });
          document.documentElement.scrollTo({ top: 0, behavior: "smooth" });
          document.body.scrollTo({ top: 0, behavior: "smooth" });
        }}
          className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 h-10 w-10 rounded-xl border border-border/50 bg-background/90 backdrop-blur-md flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/50 transition-colors shadow-sm z-40 animate-in fade-in slide-in-from-bottom-2 duration-200"
          aria-label="返回顶部"
        >
          <ArrowUp className="h-5 w-5" />
        </button>
      )}

    </div>
  );
}
