import { type LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Usdt0 } from "@/components/ui/usdt0";

export interface AssetCardProps {
  title: string;
  amount: string;
  icon: LucideIcon;
  iconBg?: string;
  iconColor?: string;
  subtitle?: React.ReactNode;
  /** 复投相关：不传则不显示复投区域 */
  reinvest?: {
    progress: number;
    threshold: number;
    canReinvest: boolean;
    isReinvesting: boolean;
    onReinvest: () => void;
  };
  /** 点击提现时回调，不传则不显示提现按钮 */
  onWithdraw?: () => void;
}

export function AssetCard({
  title,
  amount,
  icon: Icon,
  iconBg = "bg-blue-500/10",
  iconColor = "text-blue-500",
  subtitle,
  reinvest,
  onWithdraw,
}: AssetCardProps) {
  return (
    <Card className="border-border/40 shadow-sm bg-card/50">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className={`p-1.5 rounded-md ${iconBg} ${iconColor}`}>
              <Icon className="h-4 w-4" />
            </div>
            <span className="text-xs font-medium">{title}</span>
          </div>
        </div>
        <div className="space-y-3">
          <div>
            <div className="text-2xl font-bold tracking-tight text-foreground inline-flex items-center gap-2">
            <Usdt0 iconSize="default" iconOnly />
            {amount}
          </div>
            {subtitle && (
              <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                {subtitle}
              </div>
            )}
          </div>
          {(reinvest || onWithdraw) && (
            <div className="flex items-center gap-2 w-full">
              {reinvest && (
                <Button
                  variant="destructive"
                  size="sm"
                  className="h-8 flex-1 min-w-0 text-xs"
                  disabled={!reinvest.canReinvest || reinvest.isReinvesting}
                  onClick={reinvest.onReinvest}
                >
                  {reinvest.isReinvesting ? "处理中" : "复投"}
                </Button>
              )}
              {onWithdraw && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 flex-1 min-w-0 text-xs"
                  onClick={onWithdraw}
                >
                  提现
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
