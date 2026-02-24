import { useState, useMemo, useEffect } from "react";
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from "@/components/ui/card";
import { AssetCard } from "@/components/ui/asset-card";
import { useAccount } from "wagmi";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar, type FlowByDate } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Usdt0 } from "@/components/ui/usdt0";
import { getTransactionCalendar, getTransactionDetails, getWalletInfo, profitReinvest, ApiError, type TransactionDetail, type WalletInfoResponse } from "@/lib/api";
import { useApiError } from "@/hooks/useApiError";
import { toast } from "sonner";
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  Wallet, 
  Coins, 
  History, 
  PiggyBank,
  CalendarDays,
  RefreshCw,
  Plus,
  Minus,
  Trophy
} from "lucide-react";

const REINVEST_THRESHOLD = 100;

export function WalletView() {
  const { isConnected } = useAccount();
  const { handleError } = useApiError();
  const { t } = useTranslation();
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isReinvesting, setIsReinvesting] = useState(false);
  const [showReinvestDialog, setShowReinvestDialog] = useState(false);
  const [reinvestStepIndex, setReinvestStepIndex] = useState(0);
  const [calendarData, setCalendarData] = useState<FlowByDate>({});
  const [rawCalendarData, setRawCalendarData] = useState<any[]>([]); // 保存原始日历数据
  const [transactions, setTransactions] = useState<TransactionDetail[]>([]);
  const [currentCategory, setCurrentCategory] = useState<'all' | 'deposit' | 'profit' | 'reinvest' | 'withdraw'>('all');
  const [walletInfo, setWalletInfo] = useState<WalletInfoResponse | null>(null);

  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  // 获取钱包信息
  const fetchWalletInfo = async () => {
    if (!isConnected) return;
    
    try {
      const data = await getWalletInfo();
      setWalletInfo(data);
      console.log('✅ 钱包信息获取成功:', data);
    } catch (err) {
      console.error('❌ 获取钱包信息失败:', err);
      // 静默处理错误
    }
  };

  // 获取交易日历
  const fetchTransactionCalendar = async (month: string) => {
    if (!isConnected) return;
    
    try {
      const data = await getTransactionCalendar({ month });
      
      // 保存原始日历数据
      setRawCalendarData(data.calendar);
      
      // 转换日历数据为 FlowByDate 格式
      const calendarMap: FlowByDate = {};
      data.calendar.forEach(day => {
        const income = parseFloat(day.total_increase);
        const expense = parseFloat(day.total_decrease);
        
        if (income > 0 || expense > 0) {
          calendarMap[day.date] = {
            income,
            expense,
          };
        }
      });
      
      setCalendarData(calendarMap);
      console.log('✅ 交易日历获取成功:', data);
    } catch (err) {
      console.error('❌ 获取交易日历失败:', err);
      // 静默处理错误
    }
  };

  // 获取交易记录
  const fetchTransactionDetails = async (page: number, category: 'all' | 'deposit' | 'profit' | 'reinvest' | 'withdraw') => {
    if (!isConnected) return;
    
    try {
      const data = await getTransactionDetails({ page, category });
      setTransactions(data.list);
      console.log('✅ 交易记录获取成功:', data);
    } catch (err) {
      console.error('❌ 获取交易记录失败:', err);
      // 静默处理错误
    }
  };

  // 组件加载时获取数据
  useEffect(() => {
    if (isConnected) {
      fetchWalletInfo();
      fetchTransactionCalendar(currentMonth);
      fetchTransactionDetails(1, 'all');
    }
  }, [isConnected]);

  // 监听登录事件，登录后刷新数据
  useEffect(() => {
    const handleLogin = () => {
      console.log('🔄 检测到登录，刷新钱包数据...');
      fetchWalletInfo();
      fetchTransactionCalendar(currentMonth);
      fetchTransactionDetails(1, 'all');
    };
    
    window.addEventListener('auth:login', handleLogin);
    return () => window.removeEventListener('auth:login', handleLogin);
  }, []);

  // 切换分类时重新获取交易记录
  const handleCategoryChange = (category: 'all' | 'deposit' | 'profit' | 'reinvest' | 'withdraw') => {
    setCurrentCategory(category);
    fetchTransactionDetails(1, category);
  };

  // 计算今日收益（从日历数据中获取）
  const todayIncome = useMemo(() => {
    if (rawCalendarData.length === 0) return 0;
    
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    
    const todayData = rawCalendarData.find(day => day.date === todayStr);
    return parseFloat(todayData?.total_increase || "0");
  }, [rawCalendarData]);

  // 资产数据（使用真实数据）
  const principal = parseFloat(walletInfo?.capital || "0");
  const interest = parseFloat(walletInfo?.profit || "0");
  
  const assets = {
    principal: principal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    interest: interest.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    total: (principal + interest).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    todayInterest: `+${todayIncome.toFixed(2)}`
  };

  // {t("wallet.reinvest")}进度
  const reinvestProgress = interest % REINVEST_THRESHOLD;
  const canReinvest = interest >= REINVEST_THRESHOLD;

  // {t("wallet.reinvest")}可选金额：100, 200, 300, ... 最大为当前利息向下取整到百位
  const maxReinvest = Math.max(100, Math.floor(interest / 100) * 100);
  const reinvestAmountOptions = useMemo(() => {
    const list: number[] = [];
    for (let a = 100; a <= maxReinvest; a += 100) list.push(a);
    return list;
  }, [maxReinvest]);
  const reinvestAmount = reinvestAmountOptions[Math.min(reinvestStepIndex, reinvestAmountOptions.length - 1)] ?? 100;

  const handleReinvest = async (amount: number) => {
    if (!canReinvest || isReinvesting || amount > interest) return;
    
    setIsReinvesting(true);
    setShowReinvestDialog(false);
    
    try {
      console.log('🔄 开始复投:', { amount });
      
      // 调用复投接口
      const result = await profitReinvest({ amount: amount.toString() });
      
      console.log('✅ 复投成功:', result);
      
      // 显示成功提示
      toast.success(t("wallet.reinvestSuccess"));
      
      // 刷新钱包信息和交易记录
      await Promise.all([
        fetchWalletInfo(),
        fetchTransactionCalendar(currentMonth),
        fetchTransactionDetails(1, currentCategory),
      ]);
      
    } catch (error) {
      console.error('❌ 复投失败:', error);
      
      // 使用 handleError 处理错误
      handleError(error);
      
      // 显示错误提示
      if (error instanceof ApiError) {
        toast.error(error.localizedMessage);
      } else {
        const errorMessage = error instanceof Error ? error.message : t("errors.reinvest.failed");
        toast.error(errorMessage);
      }
    } finally {
      setIsReinvesting(false);
    }
  };

  const handleReinvestDecrease = () => {
    if (reinvestStepIndex > 0) setReinvestStepIndex(reinvestStepIndex - 1);
  };
  const handleReinvestIncrease = () => {
    if (reinvestStepIndex < reinvestAmountOptions.length - 1) setReinvestStepIndex(reinvestStepIndex + 1);
  };

  // 从交易日历获取每日收支数据（使用真实数据）
  const flowByDate = calendarData;

  const selectedDateFlow = useMemo(() => {
    if (!selectedDate) return null;
    const str = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, "0")}-${String(selectedDate.getDate()).padStart(2, "0")}`;
    const flow = flowByDate[str];
    if (flow === undefined) return { income: 0, expense: 0 };
    if (typeof flow === "number") return { income: flow, expense: 0 };
    return flow as { income: number; expense: number };
  }, [selectedDate, flowByDate]);

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-muted-foreground space-y-4">
        <Wallet className="h-16 w-16 opacity-20" />
        <p>{t('wallet.connectWalletFirst')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-500 max-w-4xl mx-auto pt-6">
      
      {/* 1. 总资产概览卡片 (Compact) */}
      <div className="space-y-4">
        {/* 总资产 (Hero) */}
        <Card className="bg-primary/5 border-primary/10 shadow-sm overflow-hidden relative">
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <Wallet className="h-24 w-24 -mr-6 -mt-6 rotate-12" />
          </div>
          <CardContent className="p-6 text-black">
            <div className="space-y-2">
              <span className="text-sm font-medium">{t('wallet.totalAssets')}</span>
              <p className="text-xs opacity-80">{t('wallet.depositTip')}</p>
              <div className="space-y-2">
                <span className="text-4xl font-bold tracking-tight tabular-nums inline-flex items-center gap-2">
                  <Usdt0 iconSize="lg" iconOnly />
                  {assets.total}
                </span>
                <div>
                  <Badge variant="outline" className="bg-background/50 border-black/20 text-black h-6 gap-1 px-2 font-normal whitespace-nowrap">
                    <ArrowUpRight className="h-3 w-3 shrink-0" />
                    {t('wallet.today')} {assets.todayInterest}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 分项资产 (Grid) */}
        <div className="grid grid-cols-2 gap-4">
          <AssetCard
            title={t("wallet.capital")}
            amount={assets.principal}
            icon={PiggyBank}
            iconBg="bg-blue-500/10"
            iconColor="text-blue-500"
            subtitle={t("wallet.currentlyLocked")}
          />
          <AssetCard
            title={t("wallet.accumulatedInterest")}
            amount={assets.interest}
            icon={Coins}
            iconBg="bg-primary/10"
            iconColor="text-primary"
            reinvest={{
              progress: reinvestProgress,
              threshold: REINVEST_THRESHOLD,
              canReinvest,
              isReinvesting,
              onReinvest: () => {
              setReinvestStepIndex(0);
              setShowReinvestDialog(true);
            },
            }}
            onWithdraw={() => {
              window.location.hash = "withdraw";
            }}
          />
        </div>
      </div>

      {/* {t("wallet.reinvest")}弹窗 */}
      <Dialog open={showReinvestDialog} onOpenChange={setShowReinvestDialog}>
        <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-2 text-left">
            <DialogTitle>{t("wallet.reinvest")}</DialogTitle>
            <p className="text-sm text-muted-foreground mt-1.5">{t("wallet.reinvestDesc")}</p>
          </DialogHeader>
          <div className="px-6 pb-6 space-y-5">
            <div className="flex items-center justify-between gap-4">
              <Button
                variant="outline"
                size="icon"
                className="h-11 w-11 shrink-0 rounded-xl border border-border/50 hover:border-primary hover:text-primary transition-all disabled:opacity-20 active:scale-95 bg-transparent shadow-none"
                onClick={handleReinvestDecrease}
                disabled={reinvestStepIndex === 0}
              >
                <Minus className="h-5 w-5" />
              </Button>
              <div className="flex-1 flex flex-col items-center justify-center min-w-0 py-1">
                <span className="text-3xl sm:text-4xl font-bold tracking-tighter text-foreground tabular-nums">
                  {reinvestAmount}
                </span>
                <span className="text-xs font-medium text-muted-foreground mt-1 bg-secondary/50 px-3 py-1 rounded-full border border-border/50">
                  USDT0
                </span>
              </div>
              <Button
                variant="outline"
                size="icon"
                className="h-11 w-11 shrink-0 rounded-xl border border-border/50 hover:border-primary hover:text-primary transition-all disabled:opacity-20 active:scale-95 bg-transparent shadow-none"
                onClick={handleReinvestIncrease}
                disabled={reinvestStepIndex === reinvestAmountOptions.length - 1}
              >
                <Plus className="h-5 w-5" />
              </Button>
            </div>
            <div className="space-y-2">
              <div className="relative h-2.5 w-full bg-secondary/50 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
                  style={{
                    width: `${reinvestAmountOptions.length <= 1 ? 100 : (reinvestStepIndex / (reinvestAmountOptions.length - 1)) * 100}%`,
                  }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground px-0.5">
                <span>100</span>
                <span>{maxReinvest}</span>
              </div>
            </div>
          </div>
          <DialogFooter className="px-6 pb-6 pt-0 gap-3 flex-row">
            <Button
              variant="secondary"
              className="h-11 flex-1 rounded-xl font-medium"
              onClick={() => setShowReinvestDialog(false)}
            >
              {t('common.cancel')}
            </Button>
            <Button
              className="h-11 flex-1 rounded-xl font-medium bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => handleReinvest(reinvestAmount)}
            >
              {t("wallet.confirmReinvest")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 2. 收支日历 */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold tracking-tight px-1 flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-primary" />
          {t('wallet.calendar')}
        </h3>
        <Card className="border-border/40 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-end gap-4 mb-2 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" /> {t('wallet.income')}
              </span>
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500" /> {t('wallet.expense')}
              </span>
            </div>
            <Calendar
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
              flowByDate={flowByDate}
            />
            {selectedDate && selectedDateFlow && (
              <div className="mt-4 pt-4 border-t border-border/40 space-y-3">
                <p className="text-xs text-muted-foreground">
                  {selectedDate.getFullYear()}/{selectedDate.getMonth() + 1}/{selectedDate.getDate()} {t('wallet.dailyFlow')}
                </p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{t('wallet.income')}</span>
                    <span className="text-base font-bold text-primary">
                      +{selectedDateFlow.income.toFixed(2)} USDT0
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{t('wallet.expense')}</span>
                    <span className="text-base font-bold text-orange-500">
                      -{selectedDateFlow.expense.toFixed(2)} USDT0
                    </span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 3. 交易明细 Tabs */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold tracking-tight px-1 flex items-center gap-2">
          <History className="h-5 w-5 text-primary" />
          {t('wallet.transactions')}
        </h3>

        <Tabs value={currentCategory} onValueChange={(value) => handleCategoryChange(value as any)} className="w-full">
          <TabsList className="grid w-full grid-cols-5 h-9 p-1 bg-muted/50 rounded-lg">
            <TabsTrigger value="all" className="rounded-md text-xs h-7">{t("common.all")}</TabsTrigger>
            <TabsTrigger value="deposit" className="rounded-md text-xs h-7">{t("wallet.deposit")}</TabsTrigger>
            <TabsTrigger value="profit" className="rounded-md text-xs h-7">{t("wallet.profit")}</TabsTrigger>
            <TabsTrigger value="reinvest" className="rounded-md text-xs h-7">{t("wallet.reinvest")}</TabsTrigger>
            <TabsTrigger value="withdraw" className="rounded-md text-xs h-7">{t("wallet.withdraw")}</TabsTrigger>
          </TabsList>

          <TabsContent value={currentCategory} className="mt-4">
            <TransactionList transactions={transactions} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// 交易列表组件
function TransactionList({ transactions }: { transactions: TransactionDetail[] }) {
  const { t } = useTranslation();
  
  // 交易类型翻译映射
  const getTransactionTypeName = (protype: string) => {
    const typeMap: Record<string, string> = {
      '1': t('transaction.deposit'),        // 入金
      '6': t('transaction.dailyReward'),    // 日收益
      '8': t('transaction.referralReward'), // 推荐收益
      '9': t('transaction.teamReward'),     // 团队收益
      '10': t('transaction.teamBonus'),     // 团队奖励
      '16': t('transaction.inviteBonus'),   // 推荐奖励
      '20': t('transaction.withdraw'),      // 提现
      '2001': t('transaction.leaderReward'),// 领袖奖励
      '2003': t('transaction.reinvest'),    // 复投
      '2004': t('transaction.supernodeReward'), // 超级节点奖励
    };
    
    return typeMap[protype] || protype;
  };
  
  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground bg-card rounded-xl border border-dashed">
        <History className="h-10 w-10 opacity-20 mb-2" />
        <p className="text-sm">{t('wallet.noRecords')}</p>
      </div>
    );
  }

  // 根据 protype_name 映射图标和颜色
  const getTransactionStyle = (protypeName: string, type: string) => {
    const isIncome = type === '1';
    
    // 根据业务类型名称判断
    if (protypeName.includes('入金') || protypeName.includes('充值') || protypeName.includes('Deposit')) {
      return {
        icon: PiggyBank,
        bgColor: 'bg-blue-500/10',
        borderColor: 'border-blue-500/20',
        textColor: 'text-blue-500',
      };
    } else if (protypeName.includes('收益') || protypeName.includes('利息') || protypeName.includes('Reward') || protypeName.includes('Interest')) {
      return {
        icon: Coins,
        bgColor: 'bg-primary/10',
        borderColor: 'border-primary/20',
        textColor: 'text-primary',
      };
    } else if (protypeName.includes('复投') || protypeName.includes('Reinvest')) {
      return {
        icon: RefreshCw,
        bgColor: 'bg-primary/10',
        borderColor: 'border-primary/20',
        textColor: 'text-primary',
      };
    } else if (protypeName.includes('提现') || protypeName.includes('出金') || protypeName.includes('Withdraw')) {
      return {
        icon: ArrowDownLeft,
        bgColor: 'bg-orange-500/10',
        borderColor: 'border-orange-500/20',
        textColor: 'text-orange-500',
      };
    } else if (protypeName.includes('领袖') || protypeName.includes('Leader')) {
      return {
        icon: Trophy,
        bgColor: 'bg-amber-500/10',
        borderColor: 'border-amber-500/20',
        textColor: 'text-amber-600 dark:text-amber-400',
      };
    }
    
    // 默认样式
    return {
      icon: isIncome ? ArrowUpRight : ArrowDownLeft,
      bgColor: isIncome ? 'bg-primary/10' : 'bg-orange-500/10',
      borderColor: isIncome ? 'border-primary/20' : 'border-orange-500/20',
      textColor: isIncome ? 'text-primary' : 'text-orange-500',
    };
  };

  return (
    <Card className="border-border/40 shadow-sm">
      <ScrollArea className="h-[400px]">
        <div className="divide-y divide-border/40">
          {transactions.map((tx, index) => {
            const translatedName = getTransactionTypeName(tx.protype);
            const style = getTransactionStyle(translatedName, tx.type);
            const Icon = style.icon;
            const isIncome = tx.type === '1';
            
            // 推荐收益特殊处理
            const isReferralReward = tx.protype === '8';
            const referralLevelText = isReferralReward && tx.referral_level 
              ? (tx.referral_level === 1 ? t('transaction.level1User') : t('transaction.level2User'))
              : '';
            const sourceUserShort = isReferralReward && tx.source_user
              ? `${tx.source_user.slice(0, 6)}****${tx.source_user.slice(-6)}`
              : '';
            
            return (
              <div key={`${tx.time}-${index}`} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-full border ${style.bgColor} ${style.borderColor} ${style.textColor}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="font-medium text-sm">{translatedName}</div>
                    {isReferralReward && (
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {referralLevelText} · {sourceUserShort}
                      </div>
                    )}
                    {!isReferralReward && (
                      <div className="text-xs text-muted-foreground">{tx.time_format}</div>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className={`font-bold text-sm ${isIncome ? 'text-primary' : 'text-foreground'}`}>
                    {isIncome ? '+' : '-'}{parseFloat(tx.fee).toFixed(2)} <span className="text-xs font-normal text-muted-foreground inline-flex items-center gap-0.5"><Usdt0 iconSize="sm" /></span>
                  </div>
                  <div className="text-[10px]">
                    {isReferralReward ? (
                      <span className="text-muted-foreground">{tx.time_format}</span>
                    ) : (
                      <span className="text-muted-foreground">{t('wallet.completed')}</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </Card>
  );
}
