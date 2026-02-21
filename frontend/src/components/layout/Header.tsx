import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from 'react-i18next';
import logoWhite from "@/assets/images/logo-white.svg";
import logoDark from "@/assets/images/logo-dark.svg";
import { Globe, ChevronLeft, Wallet, Menu, X, Home, CreditCard, Users, Share2, HelpCircle, HeadphonesIcon, Building2, LogOut, Trophy, PiggyBank, Sparkles, Server, Check } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { useAccount, useDisconnect } from "wagmi";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { id: "home", labelKey: "nav.home", icon: Home },
  { id: "wallet", labelKey: "nav.wallet", icon: CreditCard },
  { id: "leader", labelKey: "nav.leader", icon: Trophy },
  { id: "supernode", labelKey: "nav.supernode", icon: Server },
  { id: "orders", labelKey: "nav.orders", icon: PiggyBank },
  { id: "team", labelKey: "nav.team", icon: Users },
  { id: "invite", labelKey: "nav.invite", icon: Share2 },
  { id: "help-center", labelKey: "nav.helpCenter", icon: HelpCircle },
  { id: "about", labelKey: "nav.about", icon: Building2 },
  { id: "plasma-one", labelKey: "nav.plasmaOne", icon: Sparkles },
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
  const { theme } = useTheme();
  const { isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const { t, i18n } = useTranslation();
  
  const languages = [
    { code: 'en', name: 'English' },
    { code: 'zh-CN', name: '简体中文' },
    { code: 'zh-TW', name: '繁體中文' },
    { code: 'ja', name: '日本語' },
    { code: 'ko', name: '한국어' },
    { code: 'es', name: 'Español' },
    { code: 'fr', name: 'Français' },
    { code: 'de', name: 'Deutsch' },
  ];
  
  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('i18nextLng', lng);
  };
  
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
          ) : title ? (
              <span className="text-lg font-bold">{title}</span>
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
                  {t('common.connectWallet')}
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
            <DropdownMenuContent align="end" className="w-48">
              {languages.map((lang) => (
                <DropdownMenuItem
                  key={lang.code}
                  onClick={() => changeLanguage(lang.code)}
                  className="flex items-center justify-between cursor-pointer"
                >
                  <span>{lang.name}</span>
                  {i18n.language === lang.code && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 border border-border/70 rounded-xl"
            onClick={() => setIsMenuOpen(true)}
          >
            <Menu className="h-[1.35rem] w-[1.35rem]" />
            <span className="sr-only">{t("nav.openMenu")}</span>
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
                <span className="text-sm font-semibold text-foreground">{t("nav.menu")}</span>
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
                      () => {
                        onTabChange?.(item.id);
                        setIsMenuOpen(false);
                      };
                    return (
                      <button
                        key={item.id}
                        onClick={onClick}
                        className={cn(
                          "w-full flex items-center gap-2 px-3 py-2 text-base rounded-md hover:bg-muted text-left",
                          isActive && "bg-primary/10 text-primary"
                        )}
                      >
                        <Icon className="h-5 w-5" />
                        <span>{t(item.labelKey)}</span>
                      </button>
                    );
                  })}
                </div>
                <div className="px-2 py-1">
                  <button
                    onClick={() => {
                      onOpenCustomerService?.();
                      setIsMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-base rounded-md hover:bg-muted text-left"
                  >
                    <HeadphonesIcon className="h-5 w-5" />
                    <span>{t('nav.customerService')}</span>
                  </button>
                </div>
                {isConnected && (
                  <div className="px-2 pt-4">
                    <button
                      onClick={() => {
                        disconnect();
                        setIsMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-base rounded-md hover:bg-destructive/10 text-destructive text-left"
                    >
                      <LogOut className="h-5 w-5" />
                      <span>{t('common.disconnect')}</span>
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
