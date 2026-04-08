import { useState, useMemo, useEffect } from "react";
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useAccount } from "wagmi";
import { Wallet, Trophy, CalendarDays, Loader2, CheckCircle2, ArrowRight, Clock } from "lucide-react";
import iconManager from "@/assets/images/icon-manager.webp";
import { Usdt0 } from "@/components/ui/usdt0";
import { activateLeader, getLeaderInfo, getLeaderCalendar, getUserInfo, updateUserInfo, type LeaderInfoResponse } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export function LeaderRewardView() {
  const { isConnected } = useAccount();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [inviteCode, setInviteCode] = useState("");
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [leaderInfo, setLeaderInfo] = useState<LeaderInfoResponse | null>(null);
  const [calendarData, setCalendarData] = useState<Record<string, number>>({});
  const [countdown, setCountdown] = useState<string>("");

  // 从本地存储的用户信息判断是否为领袖
  const isLeader = useMemo(() => {
    const userInfo = getUserInfo();
    return userInfo?.is_leader === 1;
  }, [leaderInfo]); // 依赖 leaderInfo 以便在激活后重新计算

  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  // 获取领袖详情（仅在是领袖时调用）
  const fetchLeaderInfo = async () => {
    if (!isConnected) return;
    
    const userInfo = getUserInfo();
    if (!userInfo || userInfo.is_leader !== 1) {
      console.log('⏭️ 非领袖用户，跳过获取领袖详情');
      return;
    }
    
    try {
      const data = await getLeaderInfo();
      setLeaderInfo(data);
      console.log('✅ 领袖详情获取成功:', data);
    } catch (err) {
      console.error('❌ 获取领袖详情失败:', err);
      // 静默处理错误
    }
  };

  // 获取领袖收益日历
  const fetchLeaderCalendar = async (month: string) => {
    if (!isConnected) return;
    
    const userInfo = getUserInfo();
    if (!userInfo || userInfo.is_leader !== 1) {
      console.log('⏭️ 非领袖用户，跳过获取日历数据');
      return;
    }
    
    try {
      const data = await getLeaderCalendar({ month });
      
      // 转换日历数据为 Record<string, number> 格式
      const calendarMap: Record<string, number> = {};
      data.calendar.forEach(day => {
        const reward = parseFloat(day.leader_performance);
        if (reward > 0) {
          calendarMap[day.date] = reward;
        }
      });
      
      setCalendarData(calendarMap);
      console.log('✅ 领袖日历获取成功:', data);
    } catch (err) {
      console.error('❌ 获取领袖日历失败:', err);
      // 静默处理错误
    }
  };

  // 组件加载时获取数据
  useEffect(() => {
    if (isConnected) {
      fetchLeaderInfo();
      fetchLeaderCalendar(currentMonth);
    }
  }, [isConnected]);

  // 监听登录事件，登录后刷新数据
  useEffect(() => {
    const handleLogin = () => {
      console.log('🔄 检测到登录，刷新领袖详情...');
      fetchLeaderInfo();
      fetchLeaderCalendar(currentMonth);
    };
    
    window.addEventListener('auth:login', handleLogin);
    return () => window.removeEventListener('auth:login', handleLogin);
  }, []);

  // 倒计时逻辑
  useEffect(() => {
    if (!leaderInfo?.leader_expire) {
      setCountdown("");
      return;
    }

    const updateCountdown = () => {
      const now = Math.floor(Date.now() / 1000);
      const expireTime = leaderInfo.leader_expire;
      const diff = expireTime - now;

      if (diff <= 0) {
        setCountdown(t('leader.expired'));
        return;
      }

      const days = Math.floor(diff / 86400);
      const hours = Math.floor((diff % 86400) / 3600);
      const minutes = Math.floor((diff % 3600) / 60);
      const seconds = diff % 60;

      setCountdown(`${days}${t('leader.days')} ${hours}${t('leader.hours')} ${minutes}${t('leader.minutes')} ${seconds}${t('leader.seconds')}`);
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);

    return () => clearInterval(timer);
  }, [leaderInfo, t]);

  // 模拟每日领袖收益（当前月份）- 已替换为真实数据
  const LEADER_DAILY_REWARDS: Record<string, number> = calendarData;

  // 选中日期的收益
  const selectedDateReward = useMemo(() => {
    if (!selectedDate) return null;
    const str = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, "0")}-${String(selectedDate.getDate()).padStart(2, "0")}`;
    return LEADER_DAILY_REWARDS[str] ?? null;
  }, [selectedDate, LEADER_DAILY_REWARDS]);

  const handleUpgrade = async () => {
    if (!inviteCode.trim()) {
      toast({
        variant: 'destructive',
        title: t('leader.activationFailed'),
        description: t('leader.enterCode'),
      });
      return;
    }

    setIsUpgrading(true);
    
    try {
      console.log('🔑 激活领袖中...', { code: inviteCode });
      const result = await activateLeader({ code: inviteCode });
      console.log('✅ 激活成功:', result);
      
      // 更新本地存储的用户信息，标记为领袖
      updateUserInfo({ is_leader: 1 });
      console.log('💾 用户信息已更新为领袖');
      
      // 激活成功，刷新领袖详情和日历
      await fetchLeaderInfo();
      await fetchLeaderCalendar(currentMonth);
      setInviteCode("");
      setShowSuccessDialog(true);
      
      // 显示成功提示
      toast({
        title: t('leader.activationSuccess'),
        description: `${t("leader.activated")}，${t("leader.validUntil")} ${result.expire_date}`,
      });
    } catch (err: any) {
      console.error('❌ 激活失败:', err);
      
      // 显示错误提示
      toast({
        variant: 'destructive',
        title: t('leader.activationFailed'),
        description: err.message || t('errors.leader.codeInvalid'),
      });
    } finally {
      setIsUpgrading(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-muted-foreground space-y-4">
        <Wallet className="h-16 w-16 opacity-20" />
        <p>{t('wallet.connectWalletFirst')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-500 max-w-4xl mx-auto pt-5">
      {/* {t("leader.status")}卡片 - 仅激活后显示 */}
      {isLeader && (
        <div className="space-y-3">
          <Card className="bg-primary/5 border-primary/10 shadow-sm overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-5">
              <Trophy className="h-24 w-24 -mr-6 -mt-6 rotate-12" />
            </div>
            <CardContent className="p-6">
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-1 min-w-0">
                  <span className="text-sm font-medium text-muted-foreground">{t("leader.status")}</span>
                  <div className="flex flex-col gap-2">
                    <span className="text-4xl font-bold tracking-tight text-primary tabular-nums">{t("leader.activated")}</span>
                    <Badge className="bg-primary text-primary-foreground w-fit">{t("leader.bonusRate")}</Badge>
                  </div>
                </div>
                <img src={iconManager} alt={t("leader.title")} className="h-14 w-14 object-contain shrink-0" />
              </div>
            </CardContent>
          </Card>

          {/* 到期倒计时卡片 */}
          {countdown && (
            <Card className="bg-gradient-to-br from-orange-500/10 to-red-500/10 border-orange-500/20 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-orange-500/20 flex items-center justify-center text-orange-600">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground mb-1">{t("leader.expiresIn")}</p>
                    <p className="text-sm font-semibold text-orange-600 tabular-nums">{countdown}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 当前业绩和累计领袖奖励 */}
          <div className="grid grid-cols-2 gap-3">
            <Card className="border-border/40 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  {/* 圆环进度条 */}
                  <div className="relative h-10 w-10 shrink-0">
                    <svg className="h-10 w-10 -rotate-90" viewBox="0 0 36 36">
                      {/* 背景圆环 */}
                      <circle
                        cx="18"
                        cy="18"
                        r="15.5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        className="text-blue-500/20"
                      />
                      {/* 进度圆环 */}
                      <circle
                        cx="18"
                        cy="18"
                        r="15.5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeDasharray={`${(parseFloat(leaderInfo?.current_performance || "0") / 20000) * 97.4} 97.4`}
                        strokeLinecap="round"
                        className="text-blue-500 transition-all duration-500"
                      />
                    </svg>
                    {/* 中心百分比 */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-[10px] font-bold text-blue-500">
                        {Math.min(Math.round((parseFloat(leaderInfo?.current_performance || "0") / 20000) * 100), 100)}%
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{t("leader.currentPerformance")}</p>
                    <p className="text-lg font-bold text-blue-500">
                      {parseFloat(leaderInfo?.current_performance || "0").toFixed(2)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-border/40 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary p-1.5">
                    <Usdt0 iconSize="lg" iconOnly />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{t("leader.totalReward")}</p>
                    <p className="text-lg font-bold text-primary">
                      +{parseFloat(leaderInfo?.total_reward || "0").toFixed(2)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* 领袖收益概览 */}
      {isLeader ? (
        <>
          {/* 收益日历 */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold tracking-tight px-1 flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-primary" />
              {t("leader.dailyReward")}
            </h3>
            <Card className="border-border/40 shadow-sm">
              <CardContent className="p-4">
                <Calendar
                  selectedDate={selectedDate ?? undefined}
                  onSelectDate={(date) => setSelectedDate(date ?? null)}
                  flowByDate={LEADER_DAILY_REWARDS}
                  showAmount
                  onMonthChange={(year, month) => {
                    const monthStr = `${year}-${String(month).padStart(2, "0")}`;
                    fetchLeaderCalendar(monthStr);
                  }}
                />
                {selectedDate && selectedDateReward && (
                  <div className="mt-4 pt-4 border-t border-border/40">
                    <p className="text-sm text-muted-foreground mb-2">
                      {selectedDate.getFullYear()}/{selectedDate.getMonth() + 1}/{selectedDate.getDate()} {t("leader.title")}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-primary">
                        +{selectedDateReward.toFixed(2)} USDT0
                      </span>
                      <Badge variant="outline" className="text-xs">{t("leader.extraBonus")}</Badge>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        /* 升级领袖 */
        <Card className="border-border/40 shadow-sm overflow-hidden relative bg-gradient-to-br from-primary/5 to-primary/10">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Trophy className="h-32 w-32 -mr-8 -mt-8 rotate-12" />
          </div>
          <CardContent className="p-8 space-y-6 relative">
            <div className="text-center space-y-4">
              <div className="h-20 w-20 rounded-2xl bg-primary/20 flex items-center justify-center text-primary mx-auto border-2 border-primary/30">
                <Trophy className="h-10 w-10" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold">{t("leader.upgradeToLeader")}</h3>
                <p className="text-sm text-muted-foreground">{t("leader.upgradeDesc")}</p>
              </div>
            </div>

            <div className="space-y-3">
              <Label htmlFor="inviteCode" className="text-sm font-medium">{t("leader.inviteCode")}</Label>
              <Input
                id="inviteCode"
                placeholder={t("leader.enterCode")}
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                className="h-12"
              />
            </div>

            <Button
              className="w-full h-12 rounded-xl text-base font-bold"
              onClick={handleUpgrade}
              disabled={!inviteCode.trim() || isUpgrading}
            >
              {isUpgrading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  {t("leader.activating")}
                </>
              ) : (
                <>
                  {t("leader.activate")}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* 领袖说明 - 仅激活后显示 */}
      {isLeader && (
        <>
          <p className="text-sm text-muted-foreground">
            {t("leader.leaderDesc")}
          </p>
          <div className="rounded-xl bg-muted/30 p-4 space-y-2">
            <div className="flex items-start gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
              <span>{t("leader.benefit1")}</span>
            </div>
            <div className="flex items-start gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
              <span>{t("leader.benefit2")}</span>
            </div>
            <div className="flex items-start gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
              <span>{t("leader.benefit3")}</span>
            </div>
          </div>
          <Card className="border-border/40 shadow-sm">
            <CardContent className="p-4">
              <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <Trophy className="h-4 w-4 text-primary" />
                {t("leader.rightsDesc")}
              </h4>
              <div className="space-y-3 text-sm text-muted-foreground">
                <div className="flex items-start gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary mt-2 shrink-0" />
                  <span>{t("leader.right1")}</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary mt-2 shrink-0" />
                  <span>{t("leader.right2")}</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary mt-2 shrink-0" />
                  <span>{t("leader.right3")}</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary mt-2 shrink-0" />
                  <span>{t("leader.right4")}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* 升级成功弹窗 */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="text-center">
            <div className="mx-auto mb-4 h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
              <Trophy className="h-7 w-7 text-primary" />
            </div>
            <DialogTitle className="text-xl">{t("leader.upgradeSuccess")}</DialogTitle>
            <DialogDescription className="text-base">
              {t("leader.upgradeSuccessDesc")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              className="w-full h-11 rounded-xl"
              onClick={() => setShowSuccessDialog(false)}
            >
              {t("leader.startEnjoy")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
