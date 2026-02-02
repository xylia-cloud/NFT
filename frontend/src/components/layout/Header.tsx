import logoWhite from "@/assets/images/logo-white.svg";
import logoDark from "@/assets/images/logo-dark.svg";
import { Globe, ChevronLeft, Wallet, Menu, Home, CreditCard, Users, Share2, HelpCircle, HeadphonesIcon, Lock, Building2, LogOut, Sun, Moon, SunMoon, Trophy } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { useAccount, useDisconnect } from "wagmi";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { id: "home", label: "首页", icon: Home },
  { id: "wallet", label: "钱包", icon: CreditCard },
  { id: "withdraw", label: "提现", icon: LogOut },
  { id: "leader", label: "领袖奖励", icon: Trophy },
  { id: "team", label: "我的团队", icon: Users },
  { id: "invite", label: "邀请好友", icon: Share2 },
  { id: "help-center", label: "帮助中心", icon: HelpCircle },
  { id: "change-password", label: "修改密码", icon: Lock },
  { id: "about", label: "关于我们", icon: Building2 },
] as const;

interface HeaderProps {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  currentTab?: string;
  onTabChange?: (tab: string) => void;
  onOpenCustomerService?: () => void;
}

export function Header({ title, showBack, onBack, currentTab, onTabChange, onOpenCustomerService }: HeaderProps) {
  const { theme, setTheme } = useTheme();
  const { isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const resolvedTheme =
    theme === "system"
      ? typeof window !== "undefined" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
      : theme;
  const logo = resolvedTheme === "dark" ? logoDark : logoWhite;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/90 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-2 font-bold text-xl tracking-tighter text-foreground pl-2">
          {showBack ? (
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="-ml-2 h-9 w-9" onClick={onBack}>
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <span className="text-lg font-bold">{title}</span>
            </div>
          ) : (
            <img src={logo} alt="PLASMA Logo" className="h-6" />
          )}
        </div>
        <div className="flex items-center gap-2">
          <ConnectButton.Custom>
            {({ openConnectModal, mounted, account }) => {
              if (!mounted) return null;
              if (account) return null;
              return (
                <Button
                  variant="ghost"
                  onClick={openConnectModal}
                  className="h-9 gap-2 px-3"
                >
                  <Wallet className="h-[1.2rem] w-[1.2rem]" />
                  连接钱包
                </Button>
              );
            }}
          </ConnectButton.Custom>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <Globe className="h-[1.2rem] w-[1.2rem]" />
                <span className="sr-only">切换语言</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>English</DropdownMenuItem>
              <DropdownMenuItem>简体中文</DropdownMenuItem>
              <DropdownMenuItem>繁體中文</DropdownMenuItem>
              <DropdownMenuItem>日本語</DropdownMenuItem>
              <DropdownMenuItem>한국어</DropdownMenuItem>
              <DropdownMenuItem>Español</DropdownMenuItem>
              <DropdownMenuItem>Français</DropdownMenuItem>
              <DropdownMenuItem>Deutsch</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <Menu className="h-[1.2rem] w-[1.2rem]" />
                <span className="sr-only">打开菜单</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                const onClick = item.id === "about" ? () => {} : () => onTabChange?.(item.id);
                return (
                  <DropdownMenuItem
                    key={item.id}
                    onClick={onClick}
                    className={cn(isActive && "bg-primary/10 text-primary")}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </DropdownMenuItem>
                );
              })}
              <DropdownMenuItem onClick={() => onOpenCustomerService?.()}>
                <HeadphonesIcon className="h-4 w-4" />
                联系客服
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="pointer-events-none">
                <span className="text-muted-foreground">主题</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setTheme("light")}
                className={cn(theme === "light" && "bg-primary/10 text-primary")}
              >
                <Sun className="h-4 w-4" />
                浅色
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setTheme("dark")}
                className={cn(theme === "dark" && "bg-primary/10 text-primary")}
              >
                <Moon className="h-4 w-4" />
                深色
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setTheme("system")}
                className={cn(theme === "system" && "bg-primary/10 text-primary")}
              >
                <SunMoon className="h-4 w-4" />
                跟随系统
              </DropdownMenuItem>
              {isConnected && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => disconnect()} className="text-destructive focus:text-destructive">
                    <LogOut className="h-4 w-4" />
                    断开钱包连接
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
