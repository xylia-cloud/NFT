import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, type FlowByDate } from "@/components/ui/calendar";
import { 
  Users, 
  Target,
  TrendingUp,
  CalendarDays,
} from "lucide-react";

export function TeamView() {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  // 模拟团队数据
  const teamStats = {
    totalMembers: 128,
    activeMembers: 45,
    totalCommission: "2,450.00",
    todayCommission: "+125.80",
    level: "Lv.3 黄金合伙人",
    level1Members: 80,
    level2Members: 48
  };

  // 模拟每日团队业绩（佣金）
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const commissionByDate: FlowByDate = useMemo(() => {
    const map: FlowByDate = {};
    [
      { date: `${currentMonth}-01`, income: 85.5 },
      { date: `${currentMonth}-05`, income: 120.0 },
      { date: `${currentMonth}-10`, income: 156.8 },
      { date: `${currentMonth}-12`, income: 98.2 },
      { date: `${currentMonth}-14`, income: 125.8 },
      { date: `${currentMonth}-18`, income: 142.0 },
      { date: `${currentMonth}-22`, income: 168.5 },
      { date: `${currentMonth}-25`, income: 95.0 },
    ].forEach(({ date, income }) => {
      map[date] = { income, expense: 0 };
    });
    return map;
  }, [currentMonth]);

  const selectedDateCommission = useMemo(() => {
    if (!selectedDate) return null;
    const str = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, "0")}-${String(selectedDate.getDate()).padStart(2, "0")}`;
    const flow = commissionByDate[str] ?? { income: 0, expense: 0 };
    return flow.income;
  }, [selectedDate, commissionByDate]);

  // 模拟成员列表
  const members = [
    { id: 1, address: "0x1234...5678", level: "Lv.2", stake: "5,000", commission: "120.50", status: "active", joinDate: "2024-03-15" },
    { id: 2, address: "0x8765...4321", level: "Lv.1", stake: "1,000", commission: "25.00", status: "inactive", joinDate: "2024-03-14" },
    { id: 3, address: "0xabcd...efgh", level: "Lv.1", stake: "500", commission: "12.50", status: "active", joinDate: "2024-03-12" },
    { id: 4, address: "0x9876...5432", level: "Lv.3", stake: "10,000", commission: "450.00", status: "active", joinDate: "2024-03-10" },
    { id: 5, address: "0xijkl...mnop", level: "Lv.1", stake: "200", commission: "5.00", status: "inactive", joinDate: "2024-03-08" },
  ];

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-500 max-w-4xl mx-auto pt-4">
      {/* 1. 团队数据统计 (Grid) */}
      <div className="grid grid-cols-2 gap-4">
        {/* 成员统计卡片 */}
        <Card className="shadow-sm border-border/60">
          <CardContent className="p-4 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">团队总人数</span>
              <div className="p-1.5 rounded-full bg-blue-500/10 text-blue-500">
                <Users className="h-3.5 w-3.5" />
              </div>
            </div>
            <div>
              <div className="text-xl font-bold tracking-tight">{teamStats.totalMembers}</div>
              <div className="flex items-center gap-3 mt-1.5 text-[10px] text-muted-foreground">
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  <span>一级: {teamStats.level1Members}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                  <span>二级: {teamStats.level2Members}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 佣金统计卡片 */}
        <Card className="shadow-sm border-border/60">
          <CardContent className="p-4 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-full bg-orange-500/10 text-orange-500">
                <Target className="h-3.5 w-3.5" />
              </div>
              <span className="text-xs font-medium text-muted-foreground">累计佣金</span>
            </div>
            <div>
              <div className="text-xl font-bold tracking-tight text-orange-600">{teamStats.totalCommission}</div>
              <div className="text-[10px] text-muted-foreground mt-1.5 flex items-center gap-2 flex-wrap">
                <span className="flex items-center gap-1">
                  <span className="text-primary font-medium flex items-center">
                    <TrendingUp className="h-3 w-3 mr-0.5" />
                    {teamStats.todayCommission}
                  </span>
                  <span className="opacity-60">今日新增</span>
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 2. 团队业绩日历 */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold tracking-tight px-1 flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-primary" />
          团队业绩
        </h3>
        <Card className="border-border/40 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-end gap-4 mb-2 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" /> 佣金
              </span>
            </div>
            <Calendar
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
              flowByDate={commissionByDate}
            />
            {selectedDate && selectedDateCommission !== null && (
              <div className="mt-4 pt-4 border-t border-border/40 space-y-2">
                <p className="text-xs text-muted-foreground">
                  {selectedDate.getFullYear()}/{selectedDate.getMonth() + 1}/{selectedDate.getDate()} 业绩
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">佣金</span>
                  <span className="text-xl font-bold text-primary">
                    +{selectedDateCommission.toFixed(2)} USDT
                  </span>
                  <span className="text-xs text-muted-foreground">
                    (领袖奖励 +{(selectedDateCommission * 0.1).toFixed(2)} USDT)
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 3. 成员列表 (Tabs & List) */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold tracking-tight px-1 flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          团队成员
        </h3>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-3 h-9 p-1 bg-muted/50 rounded-lg mb-4">
            <TabsTrigger value="all" className="text-xs rounded-md h-7">全部成员</TabsTrigger>
            <TabsTrigger value="active" className="text-xs rounded-md h-7">活跃中</TabsTrigger>
            <TabsTrigger value="inactive" className="text-xs rounded-md h-7">未激活</TabsTrigger>
          </TabsList>

          <Card className="border-border/40 shadow-sm bg-card">
            <ScrollArea className="h-[400px]">
              <div className="flex flex-col divide-y divide-border/40">
                {members.map((member) => (
                  <div key={member.id} className="p-4 hover:bg-muted/30 transition-colors flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9 border border-border/50">
                        <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${member.id}`} />
                        <AvatarFallback>M</AvatarFallback>
                      </Avatar>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm text-foreground">{member.address}</span>
                          <Badge variant="outline" className="text-[10px] h-4 px-1 py-0 border-border/50 bg-secondary/30 text-muted-foreground">
                            {member.level}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-2">
                          <span>加入: {member.joinDate}</span>
                          {member.status === 'active' ? (
                            <span className="flex items-center gap-1 text-primary text-[10px]">
                              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                              活跃
                            </span>
                          ) : (
                            <span className="text-muted-foreground/50 text-[10px]">离线</span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-sm font-bold text-foreground">{member.stake} <span className="text-[10px] font-normal text-muted-foreground">USDT</span></div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">
                        贡献佣金: <span className="text-orange-500 font-medium">+{member.commission}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </Card>
        </Tabs>
      </div>
    </div>
  );
}
