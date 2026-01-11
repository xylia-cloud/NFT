import { Card, CardContent } from "@/components/ui/card";
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
  ChevronRight
} from "lucide-react";
import { useAccount, useDisconnect } from "wagmi";
import { cn } from "@/lib/utils";

export function ProfileView({ onNavigate }: { onNavigate?: (tab: string) => void }) {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();

  // 模拟数据
  const userData = {
    level: "VIP 3",
    stakedAmount: "12,500.00",
    rewards: "345.80",
    inviteCode: "BSC888"
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
      color: "text-green-500",
      bg: "bg-green-500/10",
      desc: "7x24小时支持"
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
      desc: "了解平台背景"
    },
    {
      title: "帮助中心",
      icon: HelpCircle,
      color: "text-cyan-500",
      bg: "bg-cyan-500/10",
      desc: "常见问题解答"
    }
  ];

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-500 relative max-w-4xl mx-auto">
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
              </div>
            </div>

            <Button variant="outline" size="icon" className="rounded-full h-10 w-10 border-border/50 bg-background/50 backdrop-blur-sm">
              <Settings className="h-5 w-5 text-muted-foreground" />
            </Button>
          </div>

          {/* 资产统计 */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="border-border/40 shadow-sm bg-card/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3 text-muted-foreground">
                  <div className="p-1.5 rounded-md bg-blue-500/10 text-blue-500">
                    <Wallet className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-medium">质押本金</span>
                </div>
                <div className="text-2xl font-bold tracking-tight text-foreground">{userData.stakedAmount}</div>
                <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <span className="text-green-500 flex items-center font-medium">
                    <ArrowUpRight className="h-3 w-3" /> 2.5%
                  </span>
                  <span className="opacity-60">周环比</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/40 shadow-sm bg-card/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3 text-muted-foreground">
                  <div className="p-1.5 rounded-md bg-green-500/10 text-green-500">
                    <Coins className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-medium">累计收益</span>
                </div>
                <div className="text-2xl font-bold tracking-tight text-foreground">{userData.rewards}</div>
                <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <span className="text-green-500 flex items-center font-medium">
                    <ArrowUpRight className="h-3 w-3" /> 12.8%
                  </span>
                  <span className="opacity-60">周环比</span>
                </div>
              </CardContent>
            </Card>
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
          <span>BSC Pay</span>
          <Separator orientation="vertical" className="h-3" />
          <span className="font-mono">v1.0.2</span>
        </div>
      </div>
    </div>
  );
}
