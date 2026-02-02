import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import logoWhite from "@/assets/images/logo-white.svg";
import logoDark from "@/assets/images/logo-dark.svg";
import { Globe, ChevronLeft, Wallet, Menu, X, Home, CreditCard, Users, Share2, HelpCircle, HeadphonesIcon, Lock, Building2, LogOut, Sun, Moon, SunMoon, Trophy } from "lucide-react";
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
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const resolvedTheme =
    theme === "system"
      ? typeof window !== "undefined" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
      : theme;
  const logo = resolvedTheme === "dark" ? logoDark : logoWhite;

  useEffect(() => {
    setIsMounted(true);
  }, []);

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
              <Button variant="ghost" size="icon" className="h-10 w-10 border border-border/70 rounded-xl">
                <Globe className="h-[1.35rem] w-[1.35rem]" />
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
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 border border-border/70 rounded-xl"
            onClick={() => setIsMenuOpen(true)}
          >
            <Menu className="h-[1.35rem] w-[1.35rem]" />
            <span className="sr-only">打开菜单</span>
          </Button>
        </div>
      </div>

      {/* 右侧滑出菜单 Panel */}
      {isMounted &&
        isMenuOpen &&
        createPortal(
          <div className="fixed inset-0 z-[60]">
            {/* 背景遮罩 */}
            <div
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setIsMenuOpen(false)}
            />
            {/* 右侧 Panel */}
            <div className="absolute right-0 top-0 h-full w-72 max-w-[80%] bg-background border-l border-border shadow-xl flex flex-col animate-in slide-in-from-right">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border/60">
                <span className="text-sm font-semibold text-foreground">菜单</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex-1 overflow-y-auto py-2">
                <div className="px-2 py-1">
                  {NAV_ITEMS.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentTab === item.id;
                    const onClick =
                      item.id === "about"
                        ? () => {}
                        : () => {
                            onTabChange?.(item.id);
                            setIsMenuOpen(false);
                          };
                    return (
                      <button
                        key={item.id}
                        onClick={onClick}
                        className={cn(
                          "w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-muted text-left",
                          isActive && "bg-primary/10 text-primary"
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
                <div className="px-2 pt-2">
                  <button
                    onClick={() => {
                      onOpenCustomerService?.();
                      setIsMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-muted text-left"
                  >
                    <HeadphonesIcon className="h-4 w-4" />
                    <span>联系客服</span>
                  </button>
                </div>
                <div className="px-2 pt-4">
                  <p className="px-3 pb-1 text-xs text-muted-foreground">主题</p>
                  <div className="space-y-1">
                    <button
                      onClick={() => setTheme("light")}
                      className={cn(
                        "w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-muted text-left",
                        theme === "light" && "bg-primary/10 text-primary"
                      )}
                    >
                      <Sun className="h-4 w-4" />
                      <span>浅色</span>
                    </button>
                    <button
                      onClick={() => setTheme("dark")}
                      className={cn(
                        "w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-muted text-left",
                        theme === "dark" && "bg-primary/10 text-primary"
                      )}
                    >
                      <Moon className="h-4 w-4" />
                      <span>深色</span>
                    </button>
                    <button
                      onClick={() => setTheme("system")}
                      className={cn(
                        "w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-muted text-left",
                        theme === "system" && "bg-primary/10 text-primary"
                      )}
                    >
                      <SunMoon className="h-4 w-4" />
                      <span>跟随系统</span>
                    </button>
                  </div>
                </div>
                {isConnected && (
                  <div className="px-2 pt-4">
                    <button
                      onClick={() => {
                        disconnect();
                        setIsMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-destructive/10 text-destructive text-left"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>断开钱包连接</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}
    </header>
  );
}
