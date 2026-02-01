import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Copy, 
  Share2, 
  Trophy, 
  Twitter,
  Send,
  QrCode
} from "lucide-react";
import { useState } from "react";

interface InviteViewProps {
  onBack?: () => void;
}

export function InviteView({ onBack }: InviteViewProps) {
  const [copied, setCopied] = useState(false);
  const inviteLink = "https://plasma.to/register?code=PLM888";

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const level = "Lv.3 黄金合伙人";

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-500 max-w-4xl mx-auto pt-4">
      
      {/* 1. 顶部邀请卡片 (Hero) */}
      <Card className="bg-primary text-primary-foreground border-none shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute bottom-0 left-0 -mb-8 -ml-8 h-48 w-48 rounded-full bg-black/10 blur-3xl" />
        
        <CardContent className="p-6 relative z-10">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">邀请好友</h2>
              <p className="text-primary-foreground/80 text-sm mt-1">赚取高达 15% 的质押佣金</p>
            </div>
            <Badge variant="secondary" className="bg-white/20 hover:bg-white/30 text-white border-transparent backdrop-blur-sm">
              <Trophy className="mr-1 h-3 w-3 text-yellow-300" />
              {level}
            </Badge>
          </div>

          <div className="flex flex-col md:flex-row gap-6 items-center">
            {/* QR Code Area */}
            <div className="bg-white p-2 rounded-xl shrink-0 shadow-sm">
               <img 
                 src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(inviteLink)}`} 
                 alt="Invite QR Code" 
                 className="w-[100px] h-[100px]"
               />
            </div>

            <div className="flex-1 w-full space-y-4">
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 flex items-center gap-3 border border-white/10">
                <div className="flex-1 truncate text-sm font-mono text-white/90">
                  {inviteLink}
                </div>
                <Button 
                  size="sm" 
                  variant="secondary" 
                  className="h-8 shrink-0 bg-white text-primary hover:bg-white/90 font-medium"
                  onClick={handleCopy}
                >
                  {copied ? "已复制" : "复制"}
                </Button>
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="h-8 w-8 shrink-0 text-white hover:bg-white/20"
                >
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>

              {/* Social Share Buttons */}
              <div className="flex gap-3">
                <Button variant="secondary" className="flex-1 bg-[#1DA1F2] hover:bg-[#1DA1F2]/90 text-white border-none h-9">
                  <Twitter className="h-4 w-4 mr-2" />
                  Twitter
                </Button>
                <Button variant="secondary" className="flex-1 bg-[#0088cc] hover:bg-[#0088cc]/90 text-white border-none h-9">
                  <Send className="h-4 w-4 mr-2" />
                  Telegram
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. 邀请规则说明 */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground px-1">邀请规则</h3>
        <Card className="border-border/40 shadow-sm bg-card/50">
          <CardContent className="p-6 space-y-6">
            <div className="flex gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
                <Share2 className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-medium">1. 分享链接</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  复制您的专属邀请链接或二维码，分享给好友或社交媒体群组。
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Users className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-medium">2. 好友注册并质押</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  好友通过您的链接注册并完成首次质押，即可绑定为您的团队成员。
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-orange-500/10 text-orange-500">
                <Coins className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-medium">3. 获得佣金奖励</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  您将获得好友质押收益的 10% 作为直推奖励，以及二级好友收益的 5% 作为间推奖励。
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
