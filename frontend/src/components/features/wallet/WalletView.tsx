import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { AssetCard } from "@/components/ui/asset-card";
import { useAccount } from "wagmi";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar, type FlowByDate } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
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
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isReinvesting, setIsReinvesting] = useState(false);
  const [showReinvestDialog, setShowReinvestDialog] = useState(false);
  const [reinvestStepIndex, setReinvestStepIndex] = useState(0);

  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const formatDate = () => `${currentMonth}-${String(now.getDate()).padStart(2, "0")} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  // 模拟资产数据（复投会更新）
  const [principal, setPrincipal] = useState(12500);
  const [interest, setInterest] = useState(345.80);
  const todayInterest = 12.50;
  const assets = {
    principal: principal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    interest: interest.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    total: (principal + interest).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    todayInterest: `+${todayInterest}`
  };

  // 复投进度
  const reinvestProgress = interest % REINVEST_THRESHOLD;
  const canReinvest = interest >= REINVEST_THRESHOLD;

  // 复投可选金额：100, 200, 300, ... 最大为当前利息向下取整到百位
  const maxReinvest = Math.max(100, Math.floor(interest / 100) * 100);
  const reinvestAmountOptions = useMemo(() => {
    const list: number[] = [];
    for (let a = 100; a <= maxReinvest; a += 100) list.push(a);
    return list;
  }, [maxReinvest]);
  const reinvestAmount = reinvestAmountOptions[Math.min(reinvestStepIndex, reinvestAmountOptions.length - 1)] ?? 100;

  const handleReinvest = (amount: number) => {
    if (!canReinvest || isReinvesting || amount > interest) return;
    setIsReinvesting(true);
    setShowReinvestDialog(false);
    setPrincipal((p) => p + amount);
    setInterest((i) => i - amount);
    setTransactions((prev) => [
      {
        id: Date.now(),
        type: "reinvest",
        amount: amount.toFixed(2),
        currency: "USDT",
        date: formatDate(),
        status: "completed"
      },
      ...prev
    ]);
    setTimeout(() => setIsReinvesting(false), 800);
  };

  const handleReinvestDecrease = () => {
    if (reinvestStepIndex > 0) setReinvestStepIndex(reinvestStepIndex - 1);
  };
  const handleReinvestIncrease = () => {
    if (reinvestStepIndex < reinvestAmountOptions.length - 1) setReinvestStepIndex(reinvestStepIndex + 1);
  };

  // 模拟交易记录数据（含领袖奖励）
  const [transactions, setTransactions] = useState([
    { id: 1, type: "stake", amount: "5,000.00", currency: "USDT", date: `${currentMonth}-15 14:30`, status: "completed" },
    { id: 2, type: "interest", amount: "12.50", currency: "USDT", date: `${currentMonth}-14 00:00`, status: "completed" },
    { id: 3, type: "withdraw", amount: "100.00", currency: "USDT", date: `${currentMonth}-12 09:15`, status: "processing" },
    { id: 4, type: "stake", amount: "2,000.00", currency: "USDT", date: "2024-03-10 16:45", status: "completed" },
    { id: 5, type: "interest", amount: "10.20", currency: "USDT", date: `${currentMonth}-13 00:00`, status: "completed" },
    { id: 6, type: "interest", amount: "11.80", currency: "USDT", date: `${currentMonth}-01 00:00`, status: "completed" },
    { id: 7, type: "leader", amount: "88.00", currency: "USDT", date: `${currentMonth}-10 00:00`, status: "completed" },
    { id: 8, type: "leader", amount: "56.50", currency: "USDT", date: `${currentMonth}-05 00:00`, status: "completed" },
    { id: 9, type: "leader", amount: "120.00", currency: "USDT", date: "2024-12-28 00:00", status: "completed" },
  ]);

  // 从交易记录提取每日收支数据
  const flowByDate = useMemo<FlowByDate>(() => {
    const map: FlowByDate = {};
    transactions.forEach((t) => {
      const dateStr = t.date.split(" ")[0];
      if (!map[dateStr]) map[dateStr] = { income: 0, expense: 0 };
      const amount = parseFloat(t.amount.replace(/,/g, ""));
      const entry = map[dateStr] as { income: number; expense: number };
      if (t.type === "stake" || t.type === "interest" || t.type === "reinvest" || t.type === "leader") {
        entry.income += amount;
      } else if (t.type === "withdraw") {
        entry.expense += amount;
      }
    });
    return map;
  }, [transactions]);

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
        <p>请先在首页连接钱包</p>
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
            <div className="space-y-1">
              <span className="text-sm font-medium">总资产估值 (USDT)</span>
              <p className="text-xs opacity-80 mt-0.5">充币请走 Plasma 网络</p>
              <div className="flex items-baseline gap-3">
                <span className="text-4xl font-bold tracking-tight tabular-nums">
                  {assets.total}
                </span>
                <Badge variant="outline" className="bg-background/50 border-black/20 text-black h-6 gap-1 px-2 font-normal">
                  <ArrowUpRight className="h-3 w-3" />
                  今日 +{assets.todayInterest}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 分项资产 (Grid) */}
        <div className="grid grid-cols-2 gap-4">
          <AssetCard
            title="质押本金"
            amount={assets.principal}
            icon={PiggyBank}
            iconBg="bg-blue-500/10"
            iconColor="text-blue-500"
            subtitle="当前锁仓中"
          />
          <AssetCard
            title="累计利息"
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

      {/* 复投弹窗 */}
      <Dialog open={showReinvestDialog} onOpenChange={setShowReinvestDialog}>
        <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-2 text-left">
            <DialogTitle>复投</DialogTitle>
            <p className="text-sm text-muted-foreground mt-1.5">选择复投金额，将利息转为本金</p>
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
                  USDT
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
              取消
            </Button>
            <Button
              className="h-11 flex-1 rounded-xl font-medium bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => handleReinvest(reinvestAmount)}
            >
              确认复投
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 2. 收支日历 */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold tracking-tight px-1 flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-primary" />
          收支日历
        </h3>
        <Card className="border-border/40 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-end gap-4 mb-2 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" /> 收入
              </span>
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500" /> 支出
              </span>
            </div>
            <Calendar
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
              flowByDate={flowByDate}
            />
            {selectedDate && selectedDateFlow && (
              <div className="mt-4 pt-4 border-t border-border/40 space-y-2">
                <p className="text-xs text-muted-foreground">
                  {selectedDate.getFullYear()}/{selectedDate.getMonth() + 1}/{selectedDate.getDate()} 收支
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">收入</span>
                    <span className="text-base font-bold text-primary">
                      +{selectedDateFlow.income.toFixed(2)} USDT
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">支出</span>
                    <span className="text-base font-bold text-orange-500">
                      -{selectedDateFlow.expense.toFixed(2)} USDT
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
          资金明细
        </h3>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-5 h-9 p-1 bg-muted/50 rounded-lg">
            <TabsTrigger value="all" className="rounded-md text-xs h-7">全部</TabsTrigger>
            <TabsTrigger value="stake" className="rounded-md text-xs h-7">质押</TabsTrigger>
            <TabsTrigger value="interest" className="rounded-md text-xs h-7">收益</TabsTrigger>
            <TabsTrigger value="reinvest" className="rounded-md text-xs h-7">复投</TabsTrigger>
            <TabsTrigger value="leader" className="rounded-md text-xs h-7">领袖</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-4">
            <TransactionList transactions={transactions} />
          </TabsContent>
          <TabsContent value="stake" className="mt-4">
            <TransactionList transactions={transactions.filter(t => t.type === 'stake')} />
          </TabsContent>
          <TabsContent value="interest" className="mt-4">
            <TransactionList transactions={transactions.filter(t => t.type === 'interest')} />
          </TabsContent>
          <TabsContent value="reinvest" className="mt-4">
            <TransactionList transactions={transactions.filter(t => t.type === 'reinvest')} />
          </TabsContent>
          <TabsContent value="leader" className="mt-4">
            <TransactionList transactions={transactions.filter(t => t.type === 'leader')} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// 交易列表组件
function TransactionList({ transactions }: { transactions: any[] }) {
  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground bg-card rounded-xl border border-dashed">
        <History className="h-10 w-10 opacity-20 mb-2" />
        <p className="text-sm">暂无记录</p>
      </div>
    );
  }

  return (
    <Card className="border-border/40 shadow-sm">
      <ScrollArea className="h-[400px]">
        <div className="divide-y divide-border/40">
          {transactions.map((tx) => (
            <div key={tx.id} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
              <div className="flex items-center gap-4">
                <div className={`flex h-9 w-9 items-center justify-center rounded-full border ${
                  tx.type === 'stake' ? 'bg-blue-500/10 border-blue-500/20 text-blue-500' :
                  tx.type === 'interest' ? 'bg-primary/10 border-primary/20 text-primary' :
                  tx.type === 'reinvest' ? 'bg-primary/10 border-primary/20 text-primary' :
                  tx.type === 'leader' ? 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400' :
                  'bg-orange-500/10 border-orange-500/20 text-orange-500'
                }`}>
                  {tx.type === 'stake' && <PiggyBank className="h-4 w-4" />}
                  {tx.type === 'interest' && <Coins className="h-4 w-4" />}
                  {tx.type === 'reinvest' && <RefreshCw className="h-4 w-4" />}
                  {tx.type === 'leader' && <Trophy className="h-4 w-4" />}
                  {tx.type === 'withdraw' && <ArrowDownLeft className="h-4 w-4" />}
                </div>
                <div>
                  <div className="font-medium text-sm">
                    {tx.type === 'stake' ? '质押本金' :
                     tx.type === 'interest' ? '每日收益' :
                     tx.type === 'reinvest' ? '收益复投' :
                     tx.type === 'leader' ? '领袖奖励' : '余额提现'}
                  </div>
                  <div className="text-xs text-muted-foreground">{tx.date}</div>
                </div>
              </div>
              <div className="text-right">
                <div className={`font-bold text-sm ${
                  tx.type === 'stake' ? 'text-foreground' :
                  tx.type === 'interest' || tx.type === 'reinvest' || tx.type === 'leader' ? 'text-primary' : 'text-foreground'
                }`}>
                  {tx.type === 'withdraw' ? '-' : '+'}{tx.amount} <span className="text-xs font-normal text-muted-foreground">{tx.currency}</span>
                </div>
                <div className="text-[10px]">
                  {tx.status === 'completed' ? (
                    <span className="text-muted-foreground">已完成</span>
                  ) : (
                    <span className="text-orange-500">处理中</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </Card>
  );
}
