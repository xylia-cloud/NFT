import { Card, CardContent } from "@/components/ui/card";
import { useTranslation } from 'react-i18next';
import { Button } from "@/components/ui/button";
import { Share2, Twitter, Send, User } from "lucide-react";
import { useState, useMemo } from "react";
import { useAccount } from "wagmi";
import { getUserInfo } from "@/lib/api";

export function InviteView() {
  const { address } = useAccount();
  const { t } = useTranslation();
  const [copiedLink, setCopiedLink] = useState(false);
  
  // 获取用户信息
  const userInfo = getUserInfo();
  
  // 自动获取前端域名并拼接邀请链接
  const inviteLink = useMemo(() => {
    if (!address) return "";
    
    // 获取当前域名（包括协议和端口）
    const origin = window.location.origin;
    
    // 拼接邀请链接，使用钱包地址作为邀请码
    return `${origin}/?invit=${address}`;
  }, [address]);
  
  // 上级用户钱包地址（从用户信息中获取 inviter 字段）
  const parentAddress = userInfo?.inviter || "";

  const handleCopy = () => {
    if (!inviteLink) return;
    navigator.clipboard.writeText(inviteLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Share on Twitter
  const handleShareTwitter = () => {
    if (!inviteLink) return;
    
    const text = t("invite.shareTwitterText");
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(inviteLink)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Share on Telegram
  const handleShareTelegram = () => {
    if (!inviteLink) return;
    
    const text = t("invite.shareTelegramText");
    const url = `https://t.me/share/url?url=${encodeURIComponent(inviteLink)}&text=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-500 max-w-4xl mx-auto pt-4">
      
      {/* 1. 顶部邀请卡片 (Hero) */}
      <Card className="bg-primary text-primary-foreground border-none shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute bottom-0 left-0 -mb-8 -ml-8 h-48 w-48 rounded-full bg-black/10 blur-3xl" />
        
        <CardContent className="p-6 relative z-10">
          <div className="mb-6">
            <p className="text-primary-foreground/80 text-sm">{t("invite.subtitle")}</p>
          </div>

          <div className="flex flex-col md:flex-row gap-6 items-center">
            {/* QR Code Area */}
            <div className="bg-white p-2 rounded-xl shrink-0 shadow-sm">
               {inviteLink && (
                 <img 
                   src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(inviteLink)}`} 
                   alt="Invite QR Code" 
                   className="w-[100px] h-[100px]"
                 />
               )}
            </div>

            <div className="flex-1 w-full space-y-4">
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 flex items-start gap-3 border border-white/10">
                <div className="flex-1 break-all text-sm font-mono text-white/90">
                  {inviteLink || t("invite.connectWalletFirst")}
                </div>
                <Button 
                  size="sm" 
                  variant="secondary" 
                  className="h-8 shrink-0 bg-white/20 hover:bg-white/30 text-white border border-white/20 backdrop-blur-sm font-medium"
                  onClick={handleCopy}
                  disabled={!inviteLink}
                >
                  {copiedLink ? t("common.copied") : t("common.copy")}
                </Button>
              </div>

              {/* Social Share Buttons */}
              <div className="flex gap-3">
                <Button 
                  variant="secondary" 
                  className="flex-1 bg-white/20 hover:bg-white/30 text-white border border-white/20 backdrop-blur-sm h-9"
                  onClick={handleShareTwitter}
                  disabled={!inviteLink}
                >
                  <Twitter className="h-4 w-4 mr-2" />
                  Twitter
                </Button>
                <Button 
                  variant="secondary" 
                  className="flex-1 bg-white/20 hover:bg-white/30 text-white border border-white/20 backdrop-blur-sm h-9"
                  onClick={handleShareTelegram}
                  disabled={!inviteLink}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Telegram
                </Button>
              </div>
            </div>
          </div>

          {/* 上级用户钱包地址 */}
          {parentAddress && (
            <div className="mt-6 pt-6 border-t border-white/20">
              <div className="flex items-center gap-2 mb-2">
                <User className="h-4 w-4 text-white/80" />
                <span className="text-sm text-white/80">{t("invite.parentUser")}</span>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10">
                <div className="break-all text-sm font-mono text-white/90">
                  {parentAddress}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 2. 邀请规则说明 */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground px-1">{t("invite.rules")}</h3>
        <Card className="border-border/40 shadow-sm bg-card/50">
          <CardContent className="p-6 space-y-6">
            <div className="flex gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
                <Share2 className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-medium">{t("invite.rule1")}</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {t("invite.rule1Desc")}
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Users className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-medium">{t("invite.rule2")}</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {t("invite.rule2Desc")}
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-orange-500/10 text-orange-500">
                <Coins className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-medium">{t("invite.rule3")}</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {t("invite.rule3Desc")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// 辅助图标组件
function Users(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}

function Coins(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="8" cy="8" r="6" />
      <path d="M18.09 10.37A6 6 0 1 1 10.34 18" />
      <path d="M7 6h1v4" />
      <path d="m16.71 13.88.7.71-2.82 2.82" />
    </svg>
  )
}
