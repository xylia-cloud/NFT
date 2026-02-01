import { type LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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
}

export function AssetCard({
  title,
  amount,
  icon: Icon,
  iconBg = "bg-blue-500/10",
  iconColor = "text-blue-500",
  subtitle,
  reinvest,
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
          {reinvest && (
            <div className="relative h-7 w-7 shrink-0">
              <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
                <circle
                  cx="18"
                  cy="18"
                  r="14"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-muted/30"
                />
                <circle
                  cx="18"
                  cy="18"
                  r="14"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeDasharray={88}
                  strokeDashoffset={88 * (1 - Math.min(reinvest.progress / reinvest.threshold, 1))}
                  className="text-primary transition-all duration-500"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          )}
        </div>
        <div className="flex items-center justify-between gap-2">
          <div>
            <div className="text-2xl font-bold tracking-tight text-foreground">{amount}</div>
            {subtitle && (
              <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                {subtitle}
              </div>
            )}
          </div>
          {reinvest && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground shrink-0 self-end"
              disabled={!reinvest.canReinvest || reinvest.isReinvesting}
              onClick={reinvest.onReinvest}
            >
              {reinvest.isReinvesting ? "处理中" : reinvest.canReinvest ? "复投" : "满100"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
