import { useState, useMemo, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { useAccount } from "wagmi";
import { Wallet, Server, CalendarDays, Gift, CheckCircle2 } from "lucide-react";
import iconSuperNode from "@/assets/images/icon-manager.webp"; // 暂时使用领袖图标，后续可替换
import { Usdt0 } from "@/components/ui/usdt0";

export function SuperNodeView() {
  const { isConnected } = useAccount();
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  
  // TODO: 后续接入真实 API
  // 模拟数据：个人账户总金额（质押 + 复投）
  const totalAccountAmount = 35000; // 示例：已达到超级节点门槛
  
  // 判断是否为超级节点（个人账户金额 >= 30000）
  const isSuperNode = totalAccountAmount >= 30000;
  
  // 模拟数据：累计节点分红
  const totalNodeReward = 1250.50;
  
  // 模拟数据：节点团队人数（可选，如果有的话）
  const nodeTeamCount = 0;

  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  // TODO: 后续接入真实 API
  // 模拟每日节点分红数据
  const NODE_DAILY_REWARDS: Record<string, number> = {
    "2026-02-01": 45.20,
    "2026-02-02": 52.80,
    "2026-02-03": 48.50,
    "2026-02-04": 51.30,
    "2026-02-05": 49.70,
    "2026-02-06": 53.20,
    "2026-02-07": 47.90,
    "2026-02-08": 50.40,
    "2026-02-09": 54.10,
    "2026-02-10": 46.80,
    "2026-02-11": 52.30,
    "2026-02-12": 48.90,
    "2026-02-13": 51.70,
    "2026-02-14": 49.20,
  };

  // 选中日期的收益
  const selectedDateReward = useMemo(() => {
    if (!selectedDate) return null;
    const str = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, "0")}-${String(selectedDate.getDate()).padStart(2, "0")}`;
    return NODE_DAILY_REWARDS[str] ?? null;
  }, [selectedDate, NODE_DAILY_REWARDS]);

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-muted-foreground space-y-4">
        <Wallet className="h-16 w-16 opacity-20" />
        <p>请先在首页连接钱包</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-500 max-w-4xl mx-auto pt-5">
      {/* 超级节点状态卡片 */}
      {isSuperNode ? (
        <Card className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 border-purple-500/20 shadow-sm overflow-hidden relative">
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <Server className="h-24 w-24 -mr-6 -mt-6 rotate-12" />
          </div>
          <CardContent className="p-6">
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-1 min-w-0">
                <span className="text-sm font-medium text-muted-foreground">超级节点状态</span>
                <div className="flex items-baseline gap-3">
                  <span className="text-4xl font-bold tracking-tight bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent tabular-nums">已激活</span>
                  <Badge className="bg-gradient-to-r from-purple-600 to-blue-600 text-white border-0">节点分红</Badge>
                </div>
              </div>
              <img src={iconSuperNode} alt="超级节点" className="h-14 w-14 object-contain shrink-0" />
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-muted/30 border-border/40 shadow-sm overflow-hidden relative">
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <Server className="h-24 w-24 -mr-6 -mt-6 rotate-12" />
          </div>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-1 min-w-0">
                  <span className="text-sm font-medium text-muted-foreground">超级节点状态</span>
                  <div className="flex items-baseline gap-3">
                    <span className="text-4xl font-bold tracking-tight text-muted-foreground tabular-nums">未激活</span>
                    <Badge variant="outline" className="text-xs">需达到 30,000 USDT0</Badge>
                  </div>
                </div>
                <img src={iconSuperNode} alt="超级节点" className="h-14 w-14 object-contain shrink-0 opacity-30" />
              </div>
              
              {/* 进度条 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">当前账户金额</span>
                  <span className="font-semibold">{totalAccountAmount.toLocaleString()} / 30,000 USDT0</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-purple-600 to-blue-600 transition-all duration-500"
                    style={{ width: `${Math.min((totalAccountAmount / 30000) * 100, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {totalAccountAmount >= 30000 
                    ? '已达到超级节点门槛！' 
                    : `还需 ${(30000 - totalAccountAmount).toLocaleString()} USDT0 即可成为超级节点`
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 节点分红概览 */}
      {isSuperNode && (
        <>
          {/* 收益统计 */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="border-border/40 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center p-1.5">
                    <Usdt0 iconSize="lg" iconOnly />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">累计节点分红</p>
                    <p className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent inline-flex items-center gap-1.5">
                      +{totalNodeReward.toFixed(2)} <Usdt0 iconSize="default" />
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-border/40 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                    <Gift className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">账户总金额</p>
                    <p className="text-xl font-bold">{totalAccountAmount.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 收益日历 */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold tracking-tight px-1 flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-purple-600" />
              每日节点分红
            </h3>
            <Card className="border-border/40 shadow-sm">
              <CardContent className="p-4">
                <Calendar
                  selectedDate={selectedDate ?? undefined}
                  onSelectDate={(date) => setSelectedDate(date ?? null)}
                  flowByDate={NODE_DAILY_REWARDS}
                  showAmount
                />
                {selectedDate && selectedDateReward && (
                  <div className="mt-4 pt-4 border-t border-border/40">
                    <p className="text-sm text-muted-foreground mb-2">
                      {selectedDate.getFullYear()}/{selectedDate.getMonth() + 1}/{selectedDate.getDate()} 节点分红
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                        +{selectedDateReward.toFixed(2)} USDT0
                      </span>
                      <Badge variant="outline" className="text-xs">节点奖励</Badge>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* 超级节点说明 */}
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          {isSuperNode 
            ? '超级节点可享受平台节点分红，收益每日发放' 
            : '个人账户金额达到 30,000 USDT0 即可自动成为超级节点'
          }
        </p>
        <div className="rounded-xl bg-muted/30 p-4 space-y-2">
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-purple-600" />
            <span>个人账户金额达到 30,000 USDT0 自动激活</span>
          </div>
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-purple-600" />
            <span>享受平台节点分红奖励</span>
          </div>
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-purple-600" />
            <span>可查看每日节点分红明细</span>
          </div>
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-purple-600" />
            <span>质押和复投金额均计入账户总额</span>
          </div>
        </div>
        <Card className="border-border/40 shadow-sm">
          <CardContent className="p-4">
            <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <Server className="h-4 w-4 text-purple-600" />
              超级节点权益说明
            </h4>
            <div className="space-y-3 text-sm text-muted-foreground">
              <div className="flex items-start gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-purple-600 mt-2 shrink-0" />
                <span>个人账户金额（质押 + 复投）达到 30,000 USDT0 即可自动成为超级节点</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-purple-600 mt-2 shrink-0" />
                <span>超级节点享受平台节点分红，分红比例根据平台收益动态调整</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-purple-600 mt-2 shrink-0" />
                <span>每日分红自动结算，可在日历中查看明细</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-purple-600 mt-2 shrink-0" />
                <span>节点分红可随时提取至钱包</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-purple-600 mt-2 shrink-0" />
                <span>账户金额低于 30,000 USDT0 时自动失去超级节点资格</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
