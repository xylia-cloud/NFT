import { useState, useEffect } from "react";
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { 
  Users, 
  Target,
  CalendarDays,
  Wallet,
} from "lucide-react";
import { Usdt0 } from "@/components/ui/usdt0";
import { getTeamInfo, getTeamCalendar, getTeamMembers, type TeamInfoResponse, type TeamMember } from "@/lib/api";
import { useAccount } from "wagmi";
import DiamondIcon from "@/assets/images/Diamond.webp";

export function TeamView() {
  const { isConnected } = useAccount();
  const { t } = useTranslation();
  const [teamInfo, setTeamInfo] = useState<TeamInfoResponse | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [currentTab, setCurrentTab] = useState<"all" | "active">("all");

  // 获取团队详情
  const fetchTeamInfo = async () => {
    if (!isConnected) return;
    
    try {
      const data = await getTeamInfo();
      setTeamInfo(data);
      console.log('✅ 团队详情获取成功:', data);
    } catch (err) {
      console.error('❌ 获取团队详情失败:', err);
      // 静默处理错误
    }
  };

  // 获取团队日历（仅用于刷新日历可用性，页面不再展示任何明细）
  const fetchTeamCalendar = async (month: string) => {
    if (!isConnected) return;
    
    try {
      const data = await getTeamCalendar({ month });
      console.log('✅ 团队日历获取成功:', data);
    } catch (err) {
      console.error('❌ 获取团队日历失败:', err);
      // 静默处理错误
    }
  };

  // 获取团队成员列表
  const fetchTeamMembers = async (page: number, activity?: number) => {
    if (!isConnected) return;
    
    try {
      const data = await getTeamMembers({ page, activity });
      setMembers(data.list);
      console.log('✅ 团队成员获取成功:', data);
    } catch (err) {
      console.error('❌ 获取团队成员失败:', err);
      // 静默处理错误
    }
  };

  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  // 组件加载时获取数据
  useEffect(() => {
    if (isConnected) {
      fetchTeamInfo();
      fetchTeamCalendar(currentMonth);
      fetchTeamMembers(1); // 默认获取第一页全部成员
    }
  }, [isConnected]);

  // 监听登录事件，登录后刷新数据
  useEffect(() => {
    const handleLogin = () => {
      console.log('🔄 检测到登录，刷新团队详情...');
      fetchTeamInfo();
      fetchTeamCalendar(currentMonth);
      fetchTeamMembers(1);
    };
    
    window.addEventListener('auth:login', handleLogin);
    return () => window.removeEventListener('auth:login', handleLogin);
  }, []);

  // 切换标签时重新获取成员列表
  const handleTabChange = (tab: "all" | "active") => {
    setCurrentTab(tab);
    const activity = tab === "active" ? 1 : undefined;
    fetchTeamMembers(1, activity);
  };

  // 团队数据统计（使用真实数据，仅展示汇总值，不再展示任何明细）
  const teamStats = {
    totalMembers: teamInfo?.total_count || 0,
    level1Members: parseInt(teamInfo?.level1_count || "0"),
    level2Members: parseInt(teamInfo?.level2_count || "0"),
    totalPerformance: parseFloat(teamInfo?.team_performance || "0").toFixed(2),
    totalCommission: parseFloat(teamInfo?.team_earnings || "0").toFixed(2),
    myAccountBalance: parseFloat(teamInfo?.capital_total || "0").toFixed(2), // 本人账户金额
  };

  // 格式化钱包地址（显示前6位和后4位）
  const formatAddress = (address?: string) => {
    if (!address) return t("team.unknownAddress");
    if (address.length <= 10) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className="space-y-4 pb-20 animate-in fade-in duration-500 max-w-4xl mx-auto pt-4">
      {/* 团队等级展示 - 仅当等级大于0时显示 */}
      {teamInfo?.level_user !== undefined && parseInt(teamInfo.level_user) > 0 && (
        <Card className="shadow-sm border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{t("team.teamLevel")}</span>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="border-blue-500 text-blue-600 bg-blue-50 hover:bg-blue-100 text-sm h-6 px-2.5">
                  A{teamInfo.level_user}
                </Badge>
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: parseInt(teamInfo.level_user) }).map((_, index) => (
                    <img 
                      key={index} 
                      src={DiamondIcon} 
                      alt="Diamond" 
                      className="h-4 w-4"
                    />
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 1. {t("team.teamPerformance")}、本人账户金额 */}
      <div className="grid grid-cols-2 gap-4">
        {/* {t("team.teamPerformance")} */}
        <Card className="shadow-sm border-border/60">
          <CardContent className="p-4 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">{t("team.teamPerformance")}</span>
            </div>
            <div>
              <div className="text-xl font-bold tracking-tight inline-flex items-center gap-1.5"><Usdt0 iconSize="sm" iconOnly />{teamStats.totalPerformance}</div>
            </div>
          </CardContent>
        </Card>

        {/* 本人账户金额 */}
        <Card className="shadow-sm border-border/60">
          <CardContent className="p-4 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">{t("team.myAccountBalance")}</span>
              <div className="p-1.5 rounded-full bg-primary/10 text-primary">
                <Wallet className="h-3.5 w-3.5" />
              </div>
            </div>
            <div>
              <div className="text-xl font-bold tracking-tight inline-flex items-center gap-1.5"><Usdt0 iconSize="sm" iconOnly />{teamStats.myAccountBalance}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 2. 团队数据统计 (Grid) */}
      <div className="grid grid-cols-2 gap-4">
        {/* 成员统计卡片 */}
        <Card className="shadow-sm border-border/60">
          <CardContent className="p-4 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">{t("team.totalCount")}</span>
              <div className="p-1.5 rounded-full bg-blue-500/10 text-blue-500">
                <Users className="h-3.5 w-3.5" />
              </div>
            </div>
            <div>
              <div className="text-xl font-bold tracking-tight">{teamStats.totalMembers}</div>
              <div className="flex items-center gap-3 mt-1.5 text-[10px] text-muted-foreground">
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  <span>{t("team.level1")}: {teamStats.level1Members}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                  <span>{t("team.level2")}: {teamStats.level2Members}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 佣金统计卡片 */}
        <Card className="shadow-sm border-border/60">
          <CardContent className="p-4 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">{t("team.totalCommission")}</span>
              <div className="p-1.5 rounded-full bg-orange-500/10 text-orange-500">
                <Target className="h-3.5 w-3.5" />
              </div>
            </div>
            <div>
              <div className="text-xl font-bold tracking-tight text-orange-600 inline-flex items-center gap-1.5"><Usdt0 iconSize="sm" iconOnly />{teamStats.totalCommission}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3. 团队业绩日历 */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold tracking-tight px-1 flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-primary" />
          {t("team.teamPerformance")}
        </h3>
        <Card className="border-border/40 shadow-sm">
          <CardContent className="p-4">
            <Calendar
              showIndicators={false}
              onMonthChange={(year, month) => {
                const monthStr = `${year}-${String(month).padStart(2, "0")}`;
                fetchTeamCalendar(monthStr);
              }}
            />
          </CardContent>
        </Card>
      </div>

      {/* 4. 成员列表 (Tabs & List) */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold tracking-tight px-1 flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          {t("team.members")}
        </h3>

        <Tabs value={currentTab} onValueChange={(value) => handleTabChange(value as "all" | "active")} className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-9 p-1 bg-muted/50 rounded-lg mb-4">
            <TabsTrigger value="all" className="text-xs rounded-md h-7">{t("team.allMembers")}</TabsTrigger>
            <TabsTrigger value="active" className="text-xs rounded-md h-7">{t("team.activeMembers")}</TabsTrigger>
          </TabsList>

          <Card className="border-border/40 shadow-sm bg-card">
            <ScrollArea className="h-[400px]">
              {members.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[400px] text-muted-foreground">
                  <Users className="h-16 w-16 opacity-20 mb-4" />
                  <p className="text-sm">{t("team.noMembers")}</p>
                </div>
              ) : (
                <div className="flex flex-col divide-y divide-border/40">
                  {members.map((member, index) => {
                    // 推荐层级标签 - 改为 Lv.1 和 Lv.2 格式
                    const referralLevelBadge = member.referral_level === 1 
                      ? 'Lv.1'
                      : member.referral_level === 2 
                      ? 'Lv.2'
                      : '';
                    
                    return (
                      <div key={member.id || index} className="p-4 hover:bg-muted/30 transition-colors flex items-center justify-between group">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9 border border-border/50">
                            <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${member.username || member.wallet_address || index}`} />
                            <AvatarFallback>M</AvatarFallback>
                          </Avatar>
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm text-foreground">{member.username || formatAddress(member.wallet_address)}</span>
                              {referralLevelBadge && (
                                <Badge variant="outline" className={`text-[10px] h-4 px-1 py-0 ${member.referral_level === 1 ? 'border-blue-500/50 bg-blue-500/10 text-blue-600' : 'border-indigo-500/50 bg-indigo-500/10 text-indigo-600'}`}>
                                  {referralLevelBadge}
                                </Badge>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground flex items-center gap-2">
                              {member.addtime_format && <span>{member.addtime_format}</span>}
                              {member.status === 'active' ? (
                                <span className="flex items-center gap-1 text-primary text-[10px]">
                                  <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                                  {t("team.active")}
                                </span>
                              ) : (
                                <span className="text-muted-foreground/50 text-[10px]">{t("team.offline")}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <Badge
                          variant="outline"
                          className={`text-[10px] h-5 px-2 py-0 shrink-0 ${member.status === 'active'
                            ? 'border-primary/40 bg-primary/10 text-primary'
                            : 'border-border/60 text-muted-foreground/70'}`}
                        >
                          {member.status === 'active' ? t("team.active") : t("team.offline")}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </Card>
        </Tabs>
      </div>
    </div>
  );
}
