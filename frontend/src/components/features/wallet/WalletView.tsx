import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { AssetCard } from "@/components/ui/asset-card";
import { useAccount } from "wagmi";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar, type FlowByDate } from "@/components/ui/calendar";
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  Wallet, 
  Coins, 
  History, 
  PiggyBank,
  CalendarDays,
  RefreshCw
} from "lucide-react";

const REINVEST_THRESHOLD = 100;

export function WalletView() {
  const { isConnected } = useAccount();
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isReinvesting, setIsReinvesting] = useState(false);

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

  const handleReinvest = () => {
    if (!canReinvest || isReinvesting) return;
    setIsReinvesting(true);
    setPrincipal((p) => p + REINVEST_THRESHOLD);
    setInterest((i) => i - REINVEST_THRESHOLD);
    setTransactions((prev) => [
      {
        id: Date.now(),
        type: "reinvest",
        amount: "100.00",
        currency: "USDT",
        date: formatDate(),
        status: "completed"
      },
      ...prev
    ]);
    setTimeout(() => setIsReinvesting(false), 800);
  };

  // 模拟交易记录数据
  const [transactions, setTransactions] = useState([
    { id: 1, type: "stake", amount: "5,000.00", currency: "USDT", date: `${currentMonth}-15 14:30`, status: "completed" },
    { id: 2, type: "interest", amount: "12.50", currency: "USDT", date: `${currentMonth}-14 00:00`, status: "completed" },
    { id: 3, type: "withdraw", amount: "100.00", currency: "USDT", date: `${currentMonth}-12 09:15`, status: "processing" },
    { id: 4, type: "stake", amount: "2,000.00", currency: "USDT", date: "2024-03-10 16:45", status: "completed" },
    { id: 5, type: "interest", amount: "10.20", currency: "USDT", date: `${currentMonth}-13 00:00`, status: "completed" },
    { id: 6, type: "interest", amount: "11.80", currency: "USDT", date: `${currentMonth}-01 00:00`, status: "completed" },
  ]);

  // 从交易记录提取每日收支数据
  const flowByDate: FlowByDate = useMemo(() => {
    const map: FlowByDate = {};
    transactions.forEach((t) => {
      const dateStr = t.date.split(" ")[0];
      if (!map[dateStr]) map[dateStr] = { income: 0, expense: 0 };
      const amount = parseFloat(t.amount.replace(/,/g, ""));
      if (t.type === "stake" || t.type === "interest" || t.type === "reinvest") {
        map[dateStr].income += amount;
      } else if (t.type === "withdraw") {
        map[dateStr].expense += amount;
      }
    });
    return map;
  }, [transactions]);

  const selectedDateFlow = useMemo(() => {
    if (!selectedDate) return null;
    const str = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, "0")}-${String(selectedDate.getDate()).padStart(2, "0")}`;
    return flowByDate[str] ?? { income: 0, expense: 0 };
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
          <CardContent className="p-6">
            <div className="space-y-1">
              <span className="text-sm font-medium text-muted-foreground">总资产估值 (USDT)</span>
              <p className="text-xs text-primary/80 mt-0.5">充币请走 Plasma 网络</p>
              <div className="flex items-baseline gap-3">
                <span className="text-4xl font-bold tracking-tight text-primary tabular-nums">
                  {assets.total}
                </span>
                <Badge variant="outline" className="bg-background/50 border-primary/20 text-primary h-6 gap-1 px-2 font-normal">
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
            subtitle="可随时提取"
            reinvest={{
              progress: reinvestProgress,
              threshold: REINVEST_THRESHOLD,
              canReinvest,
              isReinvesting,
              onReinvest: handleReinvest,
            }}
          />
        </div>
      </div>

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
            <TabsTrigger value="withdraw" className="rounded-md text-xs h-7">提现</TabsTrigger>
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
          <TabsContent value="withdraw" className="mt-4">
            <TransactionList transactions={transactions.filter(t => t.type === 'withdraw')} />
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
                  'bg-orange-500/10 border-orange-500/20 text-orange-500'
                }`}>
                  {tx.type === 'stake' && <PiggyBank className="h-4 w-4" />}
                  {tx.type === 'interest' && <Coins className="h-4 w-4" />}
                  {tx.type === 'reinvest' && <RefreshCw className="h-4 w-4" />}
                  {tx.type === 'withdraw' && <ArrowDownLeft className="h-4 w-4" />}
                </div>
                <div>
                  <div className="font-medium text-sm">
                    {tx.type === 'stake' ? '质押本金' :
                     tx.type === 'interest' ? '每日收益' :
                     tx.type === 'reinvest' ? '收益复投' : '余额提现'}
                  </div>
                  <div className="text-xs text-muted-foreground">{tx.date}</div>
                </div>
              </div>
              <div className="text-right">
                <div className={`font-bold text-sm ${
                  tx.type === 'stake' ? 'text-foreground' :
                  tx.type === 'interest' || tx.type === 'reinvest' ? 'text-primary' : 'text-foreground'
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
