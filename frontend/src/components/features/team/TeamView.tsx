import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  Target,
  TrendingUp,
} from "lucide-react";

export function TeamView() {
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
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">累计佣金</span>
              <div className="p-1.5 rounded-full bg-orange-500/10 text-orange-500">
                <Target className="h-3.5 w-3.5" />
              </div>
            </div>
            <div>
              <div className="text-xl font-bold tracking-tight text-orange-600">{teamStats.totalCommission}</div>
              <div className="text-[10px] text-muted-foreground mt-1.5 flex items-center gap-1">
                <span className="text-primary font-medium flex items-center">
                  <TrendingUp className="h-3 w-3 mr-0.5" />
                  {teamStats.todayCommission}
                </span>
                <span className="opacity-60">今日新增</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3. 成员列表 (Tabs & List) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-muted-foreground px-1">团队成员</h3>
        </div>

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
