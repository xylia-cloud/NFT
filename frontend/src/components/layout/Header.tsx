import { ModeToggle } from "@/components/mode-toggle";
import logoWhite from "@/assets/images/logo-white.svg";
import logoDark from "@/assets/images/logo-dark.svg";
import { Languages, ChevronLeft, Wallet } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConnectButton } from "@rainbow-me/rainbowkit";

interface HeaderProps {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
}

export function Header({ title, showBack, onBack }: HeaderProps) {
  const { theme } = useTheme();
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
            <img src={logo} alt="BSC Pay Logo" className="h-6" />
          )}
        </div>
        <div className="flex items-center gap-2">
          <ConnectButton.Custom>
            {({ openConnectModal, openAccountModal, mounted, account }) => {
              if (!mounted) return null;
              if (account) {
                return (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={openAccountModal}
                    className="h-9 w-9 relative"
                  >
                    <Wallet className="h-[1.2rem] w-[1.2rem]" />
                    <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-primary ring-2 ring-background" />
                    <span className="sr-only">钱包账户</span>
                  </Button>
                );
              }
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
                <Languages className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all" />
                <span className="sr-only">Toggle language</span>
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
          <ModeToggle />
        </div>
      </div>
    </header>
  );
}
