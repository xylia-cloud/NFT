import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAccount } from "wagmi";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  Wallet, 
  Coins, 
  History, 
  ArrowRightLeft,
  PiggyBank
} from "lucide-react";

export function WalletView() {
  const { isConnected } = useAccount();

  // 模拟资产数据
  const assets = {
    principal: "12,500.00",
    interest: "345.80",
    total: "12,845.80",
    todayInterest: "+12.50"
  };

  // 模拟交易记录数据
  const transactions = [
    { id: 1, type: "stake", amount: "5,000.00", currency: "USDT", date: "2024-03-15 14:30", status: "completed" },
    { id: 2, type: "interest", amount: "12.50", currency: "USDT", date: "2024-03-14 00:00", status: "completed" },
    { id: 3, type: "withdraw", amount: "100.00", currency: "USDT", date: "2024-03-12 09:15", status: "processing" },
    { id: 4, type: "stake", amount: "2,000.00", currency: "USDT", date: "2024-03-10 16:45", status: "completed" },
    { id: 5, type: "interest", amount: "10.20", currency: "USDT", date: "2024-03-13 00:00", status: "completed" },
  ];

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
          <Card className="shadow-sm border-border/60">
            <CardContent className="p-4 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">质押本金</span>
                <div className="p-1.5 rounded-full bg-blue-500/10 text-blue-500">
                  <PiggyBank className="h-3.5 w-3.5" />
                </div>
              </div>
              <div>
                <div className="text-xl font-bold tracking-tight">{assets.principal}</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">当前锁仓中</div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-border/60">
            <CardContent className="p-4 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">累计利息</span>
                <div className="p-1.5 rounded-full bg-primary/10 text-primary">
                  <Coins className="h-3.5 w-3.5" />
                </div>
              </div>
              <div>
                <div className="text-xl font-bold tracking-tight text-primary">{assets.interest}</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">可随时提取</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 2. 交易明细 Tabs */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-lg font-semibold tracking-tight">资金明细</h3>
          <Button variant="ghost" size="sm" className="text-xs h-8">
            查看全部 <ArrowRightLeft className="ml-1 h-3 w-3" />
          </Button>
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-4 h-9 p-1 bg-muted/50 rounded-lg">
            <TabsTrigger value="all" className="rounded-md text-xs h-7">全部</TabsTrigger>
            <TabsTrigger value="stake" className="rounded-md text-xs h-7">质押</TabsTrigger>
            <TabsTrigger value="interest" className="rounded-md text-xs h-7">收益</TabsTrigger>
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
                  'bg-orange-500/10 border-orange-500/20 text-orange-500'
                }`}>
                  {tx.type === 'stake' && <PiggyBank className="h-4 w-4" />}
                  {tx.type === 'interest' && <Coins className="h-4 w-4" />}
                  {tx.type === 'withdraw' && <ArrowDownLeft className="h-4 w-4" />}
                </div>
                <div>
                  <div className="font-medium text-sm">
                    {tx.type === 'stake' ? '质押本金' :
                     tx.type === 'interest' ? '每日收益' : '余额提现'}
                  </div>
                  <div className="text-xs text-muted-foreground">{tx.date}</div>
                </div>
              </div>
              <div className="text-right">
                <div className={`font-bold text-sm ${
                  tx.type === 'stake' ? 'text-foreground' :
                  tx.type === 'interest' ? 'text-primary' : 'text-foreground'
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
