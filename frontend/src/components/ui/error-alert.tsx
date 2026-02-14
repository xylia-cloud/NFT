/**
 * 错误提示组件
 * 用于显示 API 错误信息
 */

import { AlertTriangle, X, Info, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ERROR_CATEGORIES } from '@/lib/errorCodes';

export interface ErrorAlertProps {
  code?: number | null;
  message?: string | null;
  category?: string | null;
  onClose?: () => void;
  className?: string;
}

/**
 * 根据错误类别获取图标和样式
 */
function getErrorStyle(category: string | null) {
  switch (category) {
    case ERROR_CATEGORIES.AUTH:
    case ERROR_CATEGORIES.USER:
      return {
        icon: AlertCircle,
        bgColor: 'bg-amber-500/10',
        borderColor: 'border-amber-500/30',
        textColor: 'text-amber-600 dark:text-amber-400',
        iconColor: 'text-amber-500',
      };
    case ERROR_CATEGORIES.WITHDRAW:
    case ERROR_CATEGORIES.RECHARGE:
    case ERROR_CATEGORIES.REINVEST:
      return {
        icon: AlertTriangle,
        bgColor: 'bg-destructive/10',
        borderColor: 'border-destructive/30',
        textColor: 'text-destructive',
        iconColor: 'text-destructive',
      };
    default:
      return {
        icon: Info,
        bgColor: 'bg-muted/50',
        borderColor: 'border-border/70',
        textColor: 'text-foreground',
        iconColor: 'text-muted-foreground',
      };
  }
}

export function ErrorAlert({
  code,
  message,
  category,
  onClose,
  className,
}: ErrorAlertProps) {
  if (!message) return null;

  const style = getErrorStyle(category || null);
  const Icon = style.icon;

  return (
    <div
      className={cn(
        'rounded-xl border p-4 animate-in fade-in slide-in-from-top-2 duration-300',
        style.bgColor,
        style.borderColor,
        className
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn('mt-0.5 shrink-0', style.iconColor)}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className={cn('text-sm font-medium', style.textColor)}>
                {message}
              </p>
              {code && (
                <p className="text-xs text-muted-foreground mt-1">
                  错误码: {code}
                </p>
              )}
            </div>
            {onClose && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 shrink-0 hover:bg-transparent"
                onClick={onClose}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * 内联错误提示（用于表单字段下方）
 */
export interface InlineErrorProps {
  message?: string | null;
  className?: string;
}

export function InlineError({ message, className }: InlineErrorProps) {
  if (!message) return null;

  return (
    <p
      className={cn(
        'text-xs text-destructive mt-1.5 flex items-center gap-1 animate-in fade-in slide-in-from-top-1 duration-200',
        className
      )}
    >
      <AlertCircle className="h-3 w-3 shrink-0" />
      {message}
    </p>
  );
}

/**
 * Toast 风格的错误提示（固定在顶部）
 */
export interface ErrorToastProps {
  code?: number | null;
  message?: string | null;
  category?: string | null;
  onClose?: () => void;
  duration?: number; // 自动关闭时间（毫秒），0 表示不自动关闭
}

export function ErrorToast({
  code,
  message,
  category,
  onClose,
  duration = 5000,
}: ErrorToastProps) {
  if (!message) return null;

  const style = getErrorStyle(category || null);
  const Icon = style.icon;

  // 自动关闭
  if (duration > 0 && onClose) {
    setTimeout(onClose, duration);
  }

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] w-full max-w-md px-4 animate-in fade-in slide-in-from-top-4 duration-300">
      <div
        className={cn(
          'rounded-xl border p-4 shadow-lg backdrop-blur-md',
          style.bgColor,
          style.borderColor,
          'bg-background/95'
        )}
      >
        <div className="flex items-start gap-3">
          <div className={cn('mt-0.5 shrink-0', style.iconColor)}>
            <Icon className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className={cn('text-sm font-medium', style.textColor)}>
                  {message}
                </p>
                {code && (
                  <p className="text-xs text-muted-foreground mt-1">
                    错误码: {code}
                  </p>
                )}
              </div>
              {onClose && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 shrink-0 hover:bg-transparent"
                  onClick={onClose}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
