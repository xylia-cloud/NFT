import { useState, useMemo } from "react";
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
import { Wallet, Trophy, TrendingUp, CalendarDays, Gift, Loader2, CheckCircle2, ArrowRight } from "lucide-react";
import iconManager from "@/assets/images/icon-manager.webp";

// 模拟用户数据
const MOCK_USER = {
  isLeader: false,
  totalLeaderRewards: 214.80,
  teamCount: 5,
  totalTeamStake: 25000,
};

export function LeaderRewardView() {
  const { isConnected } = useAccount();
  const [inviteCode, setInviteCode] = useState("");
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [isLeader, setIsLeader] = useState(MOCK_USER.isLeader);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  // 模拟每日领袖收益（当前月份）
  const LEADER_DAILY_REWARDS: Record<string, number> = useMemo(() => {
    const map: Record<string, number> = {};
    [
      { day: 5, reward: 12.50 },
      { day: 8, reward: 15.20 },
      { day: 10, reward: 11.80 },
      { day: 12, reward: 18.50 },
      { day: 15, reward: 14.30 },
      { day: 18, reward: 16.90 },
      { day: 20, reward: 13.20 },
      { day: 22, reward: 19.80 },
      { day: 25, reward: 15.60 },
      { day: 28, reward: 17.40 },
    ].forEach(({ day, reward }) => {
      map[`${currentMonth}-${String(day).padStart(2, "0")}`] = reward;
    });
    return map;
  }, [currentMonth]);

  // 选中日期的收益
  const selectedDateReward = useMemo(() => {
    if (!selectedDate) return null;
    const str = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, "0")}-${String(selectedDate.getDate()).padStart(2, "0")}`;
    return LEADER_DAILY_REWARDS[str] ?? null;
  }, [selectedDate, LEADER_DAILY_REWARDS]);

  const handleUpgrade = async () => {
    if (!inviteCode.trim()) return;
    setIsUpgrading(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsLeader(true);
    setIsUpgrading(false);
    setInviteCode("");
    setShowSuccessDialog(true);
  };

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
      {/* 领袖状态卡片 - 仅激活后显示 */}
      {isLeader && (
        <Card className="bg-primary/5 border-primary/10 shadow-sm overflow-hidden relative">
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <Trophy className="h-24 w-24 -mr-6 -mt-6 rotate-12" />
          </div>
          <CardContent className="p-6">
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-1 min-w-0">
                <span className="text-sm font-medium text-muted-foreground">领袖状态</span>
                <div className="flex items-baseline gap-3">
                  <span className="text-4xl font-bold tracking-tight text-primary tabular-nums">已激活</span>
                  <Badge className="bg-primary text-primary-foreground">+10% 收益加成</Badge>
                </div>
              </div>
              <img src={iconManager} alt="领袖" className="h-14 w-14 object-contain shrink-0" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* 领袖收益概览 */}
      {isLeader ? (
        <>
          {/* 收益统计 */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="border-border/40 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <TrendingUp className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">累计领袖奖励</p>
                    <p className="text-xl font-bold text-primary">+{MOCK_USER.totalLeaderRewards.toFixed(2)} USDT00</p>
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
                    <p className="text-xs text-muted-foreground">团队人数</p>
                    <p className="text-xl font-bold">{MOCK_USER.teamCount} 人</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          {/* 收益日历 */}
                    </div>

<div className="space-y-4">
            <h3 className="text-lg font-semibold tracking-tight px-1 flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-primary" />
              每日领袖奖励
            </h3>
            <Card className="border-border/40 shadow-sm">
              <CardContent className="p-4">
                <Calendar
                  selectedDate={selectedDate ?? undefined}
                  onSelectDate={(date) => setSelectedDate(date ?? null)}
                  flowByDate={LEADER_DAILY_REWARDS}
                  showAmount
                />
                {selectedDate && selectedDateReward && (
                  <div className="mt-4 pt-4 border-t border-border/40">
                    <p className="text-sm text-muted-foreground mb-2">
                      {selectedDate.getFullYear()}/{selectedDate.getMonth() + 1}/{selectedDate.getDate()} 领袖奖励
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-primary">
                        +{selectedDateReward.toFixed(2)} USDT0
                      </span>
                      <Badge variant="outline" className="text-xs">额外10%收益</Badge>
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
                <h3 className="text-2xl font-bold">升级为领袖</h3>
                <p className="text-sm text-muted-foreground">解锁额外收益加成，享受专属权益</p>
              </div>
            </div>

            <div className="space-y-3">
              <Label htmlFor="inviteCode" className="text-sm font-medium">邀请码</Label>
              <Input
                id="inviteCode"
                placeholder="请输入邀请码"
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
                  验证中...
                </>
              ) : (
                <>
                  确认升级
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
            领袖可享受额外 10% 收益加成，收益每日发放
          </p>
          <div className="rounded-xl bg-muted/30 p-4 space-y-2">
            <div className="flex items-start gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
              <span>升级后立即享受额外 10% 收益</span>
            </div>
            <div className="flex items-start gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
              <span>可查看每日领袖奖励明细</span>
            </div>
            <div className="flex items-start gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
              <span>团队成员越多，奖励越丰厚</span>
            </div>
          </div>
          <Card className="border-border/40 shadow-sm">
            <CardContent className="p-4">
              <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <Trophy className="h-4 w-4 text-primary" />
                领袖权益说明
              </h4>
              <div className="space-y-3 text-sm text-muted-foreground">
                <div className="flex items-start gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary mt-2 shrink-0" />
                  <span>领袖在基础收益上额外获得 10% 收益加成</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary mt-2 shrink-0" />
                  <span>每日收益自动结算，可在日历中查看明细</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary mt-2 shrink-0" />
                  <span>邀请码由管理员发放，升级后立即生效</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary mt-2 shrink-0" />
                  <span>领袖奖励可随时提取至钱包</span>
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
            <DialogTitle className="text-xl">升级成功！</DialogTitle>
            <DialogDescription className="text-base">
              恭喜您已成为领袖，享受额外 10% 收益加成
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              className="w-full h-11 rounded-xl"
              onClick={() => setShowSuccessDialog(false)}
            >
              开始享受领袖权益
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
