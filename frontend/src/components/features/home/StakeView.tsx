import { useState, useEffect, useRef } from "react";
import { Plus, Minus, Loader2, Wallet, TrendingUp, Shield, Users, Activity, Zap, ChevronRight, Lock, PiggyBank, Calendar, Unlock, Clock, ArrowDownToLine, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { cn } from "@/lib/utils";
import { CONTRACT_ADDRESS, CONTRACT_ABI, USDT_ADDRESS, USDT_ABI } from "../../../wagmiConfig";
import bannerSpline from "@/assets/images/banner.splinecode?url";

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
interface StakeOrder {
  id: number;
  amount: number;
  startDate: string;
  lockEndDate: string;
  lockDays: number;
  accruedInterest: number;
  status: "locked" | "unlocked";
  dailyRate?: number; // 日化收益 %
}

// 模拟质押订单数据（锁仓 180 天，利息每日发放可单独提取）
const INITIAL_STAKE_ORDERS: StakeOrder[] = [
  { id: 1, amount: 5000, startDate: "2025-01-15", lockEndDate: "2025-07-14", lockDays: 180, accruedInterest: 125.80, status: "locked", dailyRate: 0.67 },
  { id: 2, amount: 2000, startDate: "2024-12-20", lockEndDate: "2025-06-18", lockDays: 180, accruedInterest: 82.50, status: "locked", dailyRate: 0.67 },
  { id: 3, amount: 500, startDate: "2024-08-01", lockEndDate: "2025-01-28", lockDays: 180, accruedInterest: 28.30, status: "unlocked", dailyRate: 0.67 },
];

// 单个质押订单卡片（含倒计时、提现）
function StakeOrderItem({
  order,
  onWithdraw,
  isWithdrawing,
}: {
  order: StakeOrder;
  onWithdraw: (order: StakeOrder) => void;
  isWithdrawing: boolean;
}) {
  const [remaining, setRemaining] = useState<{ days: number; hours: number; mins: number } | null>(null);
  const isLocked = order.status === "locked";

  useEffect(() => {
    if (!isLocked) return;
    const update = () => {
      const end = new Date(order.lockEndDate + " 23:59:59").getTime();
      const now = Date.now();
      const diff = end - now;
      if (diff <= 0) {
        setRemaining(null);
        return;
      }
      const days = Math.floor(diff / (24 * 60 * 60 * 1000));
      const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
      const mins = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));
      setRemaining({ days, hours, mins });
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
          <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
            <PiggyBank className="h-6 w-6" />
          </div>
          <div className="space-y-2 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-lg text-foreground">{order.amount.toLocaleString()} USDT</span>
              <Badge
                variant="outline"
                className={cn(
                  "text-[10px] h-5 px-2",
                  isLocked ? "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400" : "border-primary/30 bg-primary/10 text-primary"
                )}
              >
                {isLocked ? <><Lock className="h-2.5 w-2.5 mr-0.5 inline" /> 锁仓中</> : <><Unlock className="h-2.5 w-2.5 mr-0.5 inline" /> 可提取</>}
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                {order.startDate} ~ {order.lockEndDate}
              </span>
              <span className="hidden sm:inline">·</span>
              <span>{order.lockDays} 天锁仓</span>
            </div>
          </div>
        </div>
        <div className="text-left sm:text-right shrink-0">
          <div className="text-xs text-muted-foreground mb-0.5">累计收益</div>
          <div className="text-lg font-bold text-primary">+{order.accruedInterest.toFixed(2)} USDT</div>
        </div>
      </div>

      {/* 中部：倒计时 */}
      {isLocked && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-xl bg-muted/30 px-4 py-3 text-sm">
          <span className="text-muted-foreground flex items-center gap-2">
            <Clock className="h-4 w-4 shrink-0" />
            {remaining ? (
              <>剩余 <span className="font-semibold text-foreground">{remaining.days} 天 {remaining.hours} 时 {remaining.mins} 分</span> 解锁</>
            ) : (
              <span className="text-primary font-medium">即将到期</span>
            )}
          </span>
          {order.dailyRate != null && <span className="text-muted-foreground">日化 {order.dailyRate}%</span>}
        </div>
      )}

      {/* 可提取时：提现区域（仅提取本金，利息每日发放可单独提取） */}
      {!isLocked && (
        <div className="flex items-center justify-between gap-4 pt-4 border-t border-border/40">
          <div className="text-sm text-muted-foreground">
            本金 <span className="font-semibold text-foreground">{order.amount.toLocaleString()} USDT</span> 可提至钱包
          </div>
          <Button
            size="sm"
            className="gap-1.5 rounded-lg shrink-0"
            onClick={() => onWithdraw(order)}
            disabled={isWithdrawing}
          >
            {isWithdrawing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ArrowDownToLine className="h-3.5 w-3.5" />}
            提取本金
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
  
  // 查询 USDT 余额
  const { data: usdtBalance } = useReadContract({
    address: USDT_ADDRESS,
    abi: USDT_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
  });
  
  const [mounted, setMounted] = useState(false);
  const [stakeOrders, setStakeOrders] = useState<StakeOrder[]>(INITIAL_STAKE_ORDERS);
  const [withdrawingOrderId, setWithdrawingOrderId] = useState<number | null>(null);
  const [depositStep, setDepositStep] = useState<'idle' | 'approving' | 'depositing'>('idle');
  const [pendingDepositAmount, setPendingDepositAmount] = useState<bigint | null>(null);
  const [showInsufficientDialog, setShowInsufficientDialog] = useState(false);
  const [insufficientInfo, setInsufficientInfo] = useState<{ balanceUsdt: string; requiredUsdt: string } | null>(null);
  
  const { data: hash, isPending, writeContract, error: writeError, reset: resetWrite } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });

  useEffect(() => {
    const timer = setTimeout(() => {
        setMounted(true);
    }, 0)
    return () => clearTimeout(timer);
  }, []);

  // 当 approve 交易确认后，自动调用 depositUsdt
  useEffect(() => {
    if (isConfirmed && depositStep === 'approving' && pendingDepositAmount) {
      setDepositStep('depositing');
      writeContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'depositUsdt',
        args: [pendingDepositAmount],
      });
      setPendingDepositAmount(null);
    }
  }, [isConfirmed, depositStep, pendingDepositAmount, writeContract]);

  // 当 depositUsdt 交易确认后，重置状态
  useEffect(() => {
    if (isConfirmed && depositStep === 'depositing') {
      // 延迟重置，让用户看到成功提示
      const timer = setTimeout(() => {
        setDepositStep('idle');
        setPendingDepositAmount(null);
        resetWrite();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isConfirmed, depositStep, resetWrite]);

  // 当交易失败时，重置状态
  useEffect(() => {
    if (writeError) {
      const timer = setTimeout(() => {
        setDepositStep('idle');
        setPendingDepositAmount(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [writeError]);

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
    
    // 重置状态
    resetWrite();
    setDepositStep('approving');
    setPendingDepositAmount(usdtAmount);
    
    // 先 approve，等待交易确认后再调用 depositUsdt（在 useEffect 中处理）
    writeContract({
      address: USDT_ADDRESS,
      abi: USDT_ABI,
      functionName: 'approve',
      args: [CONTRACT_ADDRESS, usdtAmount],
    });
  };

  const handleWithdrawStakeOrder = async (order: StakeOrder) => {
    setWithdrawingOrderId(order.id);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setStakeOrders((prev) => prev.filter((o) => o.id !== order.id));
    setWithdrawingOrderId(null);
    alert(`已提取本金 ${order.amount.toLocaleString()} USDT 至钱包 (模拟)`);
  };

  // 动态计算预估收益 (月化 20%)
  const estimatedDailyReward = (amount * 0.20 / 30).toFixed(2);

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
        <div className="relative overflow-hidden rounded-2xl border border-border/40 bg-black/80 backdrop-blur-md shadow-none min-h-[200px]">
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
                Plasma 链上质押正在进行中
              </div>
              <h2 className="text-2xl md:text-4xl font-bold tracking-tight text-white leading-tight">
                开启 <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-blue-400 to-primary drop-shadow-[0_0_12px_rgba(34,211,238,0.5)]">Web3 财富</span> 之旅
              </h2>
              <p className="text-xs text-gray-300 leading-relaxed">
                安全、透明的去中心化质押协议。充币请走 Plasma 网络。即刻参与，享受高达 <span className="text-white font-semibold">20%</span> 的月化稳定收益。请点击右上角连接钱包开始。
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 1. 顶部 Hero 区域 - 已连接状态 */}
      {isConnected && (
        <div className="relative overflow-hidden rounded-2xl border border-border/40 bg-card/40 backdrop-blur-md shadow-none">
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
                          <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Connected</p>
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
                          <span className="text-[10px] font-medium text-muted-foreground">已连接</span>
                        </div>

                          <Button
                          variant="secondary"
                          onClick={openAccountModal}
                          className="rounded-lg px-3 h-9 font-medium bg-secondary/80 hover:bg-secondary border border-border/10 transition-all shadow-sm"
                        >
                          <span className="font-mono text-xs">
                            {usdtBalance ? `${(Number(usdtBalance) / 1e6).toFixed(2)} USDT` : '0.00 USDT'}
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
          { icon: TrendingUp, label: "月化收益", value: "20%", sub: "稳定回报", color: "text-primary", bg: "bg-primary/10" },
          { icon: Activity, label: "总质押量", value: "$2.8M", sub: "持续增长", color: "text-blue-500", bg: "bg-blue-500/10" },
          { icon: Users, label: "参与人数", value: <CountUp end={12500} />, sub: "全球用户", color: "text-violet-500", bg: "bg-violet-500/10" },
        ].map((item, index) => (
          <div 
            key={index} 
            className="group relative overflow-hidden rounded-xl border border-border/40 bg-card/40 p-4 hover:bg-card/60 transition-all duration-300 shadow-none"
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
      <Card className="border border-border/40 shadow-none bg-card/30 rounded-2xl overflow-hidden backdrop-blur-sm">
        <CardHeader className="p-6 pb-0">
          <div className="flex items-center justify-between mb-1">
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              质押挖矿
              <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold tracking-wide uppercase border border-primary/20">Live</span>
            </CardTitle>
            <Lock className="h-4 w-4 text-muted-foreground/50" />
          </div>
          <CardDescription className="text-sm">
            选择质押金额，即刻开始赚取被动收益
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
                <span className="text-4xl md:text-5xl font-bold tracking-tighter text-foreground tabular-nums animate-in zoom-in-50 duration-200 key-[amount] relative z-10">
                  {amount}
                </span>
                <span className="text-xs font-semibold text-muted-foreground mt-1 bg-secondary/50 px-3 py-1 rounded-full border border-border/50">
                  USDT
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
                <span>500 USDT</span>
                <span>15,000 USDT</span>
                <span>30,000 USDT</span>
              </div>
            </div>

            {/* 收益预估卡片 */}
            <div className="bg-secondary/20 rounded-xl p-4 border border-border/30 flex items-center justify-between">
              <div className="flex flex-col gap-0.5">
                <span className="text-sm text-muted-foreground font-medium">每日预估收益</span>
                <span className="text-xs text-muted-foreground/60">基于当前 APY 实时计算</span>
              </div>
              <div className="text-right">
                <span className="block text-2xl font-bold text-foreground">
                  +{estimatedDailyReward}
                </span>
                <span className="text-sm font-medium text-primary">USDT / Day</span>
              </div>
            </div>

            {/* 复投提示 */}
            <p className="text-xs text-muted-foreground/80 flex items-center gap-2">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary text-[10px]">i</span>
              利息累计满 100 USDT 可复投一次，收益自动滚入本金
            </p>
          </div>
        </CardContent>

        <CardFooter className="p-6 pt-0">
          <ConnectButton.Custom>
            {({ mounted, account }) => {
              if (!mounted || !account) {
                return (
                  <p className="w-full text-center py-4 text-sm text-muted-foreground">
                    请先在顶部连接钱包后即可质押
                  </p>
                )
              }
              return (
                <Button 
                  className="w-full h-14 rounded-xl text-base font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition-all active:scale-[0.98] shadow-none relative overflow-hidden group"
                  onClick={handleStake}
                  disabled={isPending || isConfirming || depositStep !== 'idle'}
                >
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                  <span className="relative flex items-center justify-center gap-2">
                    {isPending && depositStep === 'approving' ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        授权中...
                      </>
                    ) : isPending && depositStep === 'depositing' ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        充值中...
                      </>
                    ) : isConfirming ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        打包中...
                      </>
                    ) : isConfirmed && depositStep === 'depositing' ? (
                      <>
                        <span>充值成功!</span>
                      </>
                    ) : writeError ? (
                      <>
                        <span>失败: {writeError.message.slice(0, 15)}...</span>
                      </>
                    ) : (
                      <>
                        立即质押
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
            <DialogTitle className="text-xl">余额不足</DialogTitle>
            <DialogDescription className="text-base">
              当前 USDT 余额不足以完成本次质押。
            </DialogDescription>
          </DialogHeader>
          <div className="px-6 pb-2">
            <div className="rounded-xl border border-border/40 bg-muted/20 p-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">当前余额</span>
                <span className="font-semibold">{insufficientInfo?.balanceUsdt ?? "0.00"} USDT</span>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-muted-foreground">需要金额</span>
                <span className="font-semibold">{insufficientInfo?.requiredUsdt ?? amount.toLocaleString()} USDT</span>
              </div>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              请先获取/充值测试 USDT 后再尝试质押（必要时刷新页面以更新余额）。
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="secondary"
              className="w-full h-11 rounded-xl"
              onClick={() => setShowInsufficientDialog(false)}
            >
              我知道了
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 4. 质押订单列表 - 仅已连接时显示 */}
      {isConnected && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold tracking-tight px-1 flex items-center gap-2">
            <PiggyBank className="h-5 w-5 text-primary" />
            质押订单
          </h3>
          {stakeOrders.length > 0 ? (
            <div className="space-y-4">
              {stakeOrders.map((order) => (
                <div key={order.id} className="rounded-xl border border-border/40 bg-card/50 overflow-hidden">
                  <StakeOrderItem
                    order={order}
                    onWithdraw={handleWithdrawStakeOrder}
                    isWithdrawing={withdrawingOrderId === order.id}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground rounded-xl border border-dashed border-border/40">
              <PiggyBank className="h-12 w-12 opacity-20 mb-3" />
              <p className="text-sm">暂无质押订单</p>
              <p className="text-xs mt-1">完成首次质押后订单将显示在此处</p>
            </div>
          )}
        </div>
      )}

      {/* 5. 特性说明 (Minimalist) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 opacity-80">
        <div className="flex gap-3 p-3">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
            <Shield className="h-4 w-4" />
          </div>
          <div>
            <h4 className="font-semibold text-foreground text-sm mb-0.5">CertiK 权威审计</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              智能合约代码已通过 CertiK 全面安全审计，多重签名机制保护，确保资金绝对安全。
            </p>
          </div>
        </div>
        <div className="flex gap-3 p-3">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
            <Zap className="h-4 w-4" />
          </div>
          <div>
            <h4 className="font-semibold text-foreground text-sm mb-0.5">极速链上结算</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              基于 Plasma 高性能网络，收益实时计算，秒级到账，低至 $0.01 的交互手续费。
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}
