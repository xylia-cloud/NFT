import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { AssetCard } from "@/components/ui/asset-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  Settings, 
  HelpCircle, 
  Users, 
  Share2, 
  Building2, 
  Lock, 
  HeadphonesIcon,
  Wallet,
  Coins,
  Copy,
  ArrowUpRight,
  LogOut,
  ChevronRight,
  X
} from "lucide-react";
import { useAccount, useDisconnect } from "wagmi";
import { cn } from "@/lib/utils";

const VOCECHAT_URL = "http://67.215.229.143:3009";
const REINVEST_THRESHOLD = 100;

export function ProfileView({ onNavigate }: { onNavigate?: (tab: string) => void }) {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const [showVoceChat, setShowVoceChat] = useState(false);
  const [rewards, setRewards] = useState(345.80);
  const [stakedAmount, setStakedAmount] = useState(12500);
  const [isReinvesting, setIsReinvesting] = useState(false);

  const reinvestProgress = rewards % REINVEST_THRESHOLD;
  const canReinvest = rewards >= REINVEST_THRESHOLD;

  const handleReinvest = () => {
    if (!canReinvest || isReinvesting) return;
    setIsReinvesting(true);
    setRewards((r) => r - REINVEST_THRESHOLD);
    setStakedAmount((s) => s + REINVEST_THRESHOLD);
    setTimeout(() => setIsReinvesting(false), 800);
  };

  // 模拟数据（复投会更新收益与本金）
  const userData = {
    level: "A3",
    stakedAmount: stakedAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    rewards: rewards.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    inviteCode: "PLM888"
  };

  const menuItems = [
    {
      title: "我的团队",
      icon: Users,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      desc: "查看团队收益",
      action: () => onNavigate?.('team')
    },
    {
      title: "邀请好友",
      icon: Share2,
      color: "text-purple-500",
      bg: "bg-purple-500/10",
      desc: "赚取更多佣金",
      action: () => onNavigate?.('invite')
    },
    {
      title: "联系客服",
      icon: HeadphonesIcon,
      color: "text-primary",
      bg: "bg-primary/10",
      desc: "7x24小时支持",
      action: () => setShowVoceChat(true)
    },
    {
      title: "修改密码",
      icon: Lock,
      color: "text-orange-500",
      bg: "bg-orange-500/10",
      desc: "保护账户安全",
      action: () => onNavigate?.('change-password')
    },
    {
      title: "关于我们",
      icon: Building2,
      color: "text-indigo-500",
      bg: "bg-indigo-500/10",
      desc: "了解平台背景",
      action: () => onNavigate?.('about')
    },
    {
      title: "帮助中心",
      icon: HelpCircle,
      color: "text-cyan-500",
      bg: "bg-cyan-500/10",
      desc: "常见问题解答",
      action: () => onNavigate?.('help-center')
    }
  ];

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-500 relative max-w-4xl mx-auto">
      {/* VoceChat 客服弹窗 - 点击联系客服时弹出 */}
      {showVoceChat && (
        <div className="fixed inset-0 z-[100] flex flex-col bg-background">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30 shrink-0">
            <span className="text-sm font-semibold text-foreground">在线客服</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 shrink-0"
              onClick={() => setShowVoceChat(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          <iframe
            title="VoceChat 在线客服"
            src={VOCECHAT_URL}
            className="flex-1 w-full min-h-0 border-0"
          />
        </div>
      )}

      {/* 顶部背景装饰 */}
      <div className="absolute top-0 left-0 right-0 h-[280px] bg-gradient-to-b from-secondary/50 via-secondary/20 to-transparent -z-10" />

      {/* 1. 个人信息卡片 (Flat & Clean) */}
      <div>
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold tracking-tight text-foreground">
                  {isConnected ? `${address?.slice(0, 6)}...${address?.slice(-4)}` : "未连接钱包"}
                </h2>
                {isConnected && (
                  <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full text-muted-foreground hover:text-foreground">
                    <Copy className="h-3 w-3" />
                  </Button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="font-mono font-normal text-xs text-muted-foreground bg-secondary/50 hover:bg-secondary">
                  ID: {userData.inviteCode}
                </Badge>
                <Badge className="px-1.5 py-0.5 h-5 min-w-0 text-[10px] bg-primary border-background text-primary-foreground shadow-sm">
                  {userData.level}
                </Badge>
                <Badge variant="outline" className="px-1.5 py-0.5 h-5 min-w-0 text-[10px] border-primary/30 bg-primary/10 text-primary">
                  领袖奖励 10%
                </Badge>
              </div>
            </div>

            <Button variant="outline" size="icon" className="rounded-full h-10 w-10 border-border/50 bg-background/50 backdrop-blur-sm">
              <Settings className="h-5 w-5 text-muted-foreground" />
            </Button>
          </div>

          {/* 资产统计 */}
          <div className="grid grid-cols-2 gap-4">
            <AssetCard
              title="质押本金"
              amount={userData.stakedAmount}
              icon={Wallet}
              iconBg="bg-blue-500/10"
              iconColor="text-blue-500"
              subtitle={
                <>
                  <span className="text-primary flex items-center font-medium">
                    <ArrowUpRight className="h-3 w-3" /> 2.5%
                  </span>
                  <span className="opacity-60">周环比</span>
                </>
              }
            />
            <AssetCard
              title="累计收益"
              amount={userData.rewards}
              icon={Coins}
              iconBg="bg-primary/10"
              iconColor="text-primary"
              subtitle={
                <>
                  <span className="text-primary flex items-center font-medium">
                    <ArrowUpRight className="h-3 w-3" /> 12.8%
                  </span>
                  <span className="opacity-60">周环比</span>
                </>
              }
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
      </div>

      {/* 2. 功能菜单 (Shadcn Style) */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-muted-foreground px-1">常用服务</h3>
        <Card className="border-border/40 shadow-sm bg-card">
          <CardContent className="p-0">
            <div className="flex flex-col divide-y divide-border/40">
              {menuItems.map((item, index) => (
                <Button 
                  key={index}
                  variant="ghost" 
                  className="flex items-center justify-between p-4 h-auto rounded-none hover:bg-muted/50 w-full font-normal"
                  onClick={item.action}
                >
                  <div className="flex items-center gap-4">
                    <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg transition-colors", item.bg, item.color)}>
                      <item.icon className="h-4 w-4" />
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-medium text-foreground">{item.title}</div>
                      <div className="text-xs text-muted-foreground">{item.desc}</div>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3. 退出登录 */}
      <div>
        {isConnected && (
          <Button 
            variant="destructive" 
            className="w-full h-12 rounded-xl text-sm font-medium shadow-sm"
            onClick={() => disconnect()}
          >
            <LogOut className="mr-2 h-4 w-4" />
            断开钱包连接
          </Button>
        )}
        
        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground/40">
          <span>PLASMA</span>
          <Separator orientation="vertical" className="h-3" />
          <span className="font-mono">v1.0.2</span>
        </div>
      </div>
    </div>
  );
}
