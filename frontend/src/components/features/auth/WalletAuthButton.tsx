/**
 * 钱包认证按钮组件
 * 集成钱包连接和签名登录功能
 */

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ErrorAlert } from '@/components/ui/error-alert';
import { useWalletAuth, useIsAuthenticated } from '@/hooks/useWalletAuth';
import { Loader2, Shield, CheckCircle2 } from 'lucide-react';

export interface WalletAuthButtonProps {
  inviteAddress?: string; // 邀请人钱包地址
  onSuccess?: () => void;
  className?: string;
}

/**
 * 钱包认证按钮
 * 
 * 功能：
 * 1. 未连接钱包时显示"连接钱包"按钮
 * 2. 已连接但未认证时显示"签名登录"按钮
 * 3. 已认证时显示"已登录"状态
 * 
 * @example
 * ```tsx
 * <WalletAuthButton
 *   inviteAddress="0x742d35cc6634c0532925a3b844bc9e7595f0beb4"
 *   onSuccess={() => router.push('/dashboard')}
 * />
 * ```
 */
export function WalletAuthButton({ inviteAddress, onSuccess, className }: WalletAuthButtonProps) {
  const { isConnected, address } = useAccount();
  const isAuthenticated = useIsAuthenticated();
  const [showAuthDialog, setShowAuthDialog] = useState(false);

  const { authenticate, isAuthenticating, error, clearError } = useWalletAuth({
    inviteAddress,
    onSuccess: (result) => {
      console.log('登录成功:', result);
      setShowAuthDialog(false);
      onSuccess?.();
    },
  });

  // 未连接钱包
  if (!isConnected) {
    return (
      <ConnectButton.Custom>
        {({ openConnectModal }) => (
          <Button onClick={openConnectModal} className={className}>
            连接钱包
          </Button>
        )}
      </ConnectButton.Custom>
    );
  }

  // 已连接但未认证
  if (!isAuthenticated) {
    return (
      <>
        <Button
          onClick={() => setShowAuthDialog(true)}
          className={className}
        >
          <Shield className="mr-2 h-4 w-4" />
          签名登录
        </Button>

        {/* 认证对话框 */}
        <Dialog open={showAuthDialog} onOpenChange={setShowAuthDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader className="text-center">
              <div className="mx-auto mb-4 h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
                <Shield className="h-7 w-7 text-primary" />
              </div>
              <DialogTitle className="text-xl">钱包签名验证</DialogTitle>
              <DialogDescription className="text-base">
                为了验证您的钱包所有权，请在钱包中签署消息
              </DialogDescription>
            </DialogHeader>

            <div className="px-6 pb-2 space-y-4">
              {/* 错误提示 */}
              {error.message && (
                <ErrorAlert
                  code={error.code}
                  message={error.message}
                  category={error.category}
                  onClose={clearError}
                />
              )}

              {/* 钱包地址 */}
              <div className="rounded-xl border border-border/70 bg-muted/20 p-4 text-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-muted-foreground">钱包地址</span>
                </div>
                <div className="font-mono text-xs break-all">{address}</div>
              </div>

              {/* 说明 */}
              <div className="text-xs text-muted-foreground space-y-2">
                <p className="flex items-start gap-2">
                  <span className="inline-block w-1 h-1 rounded-full bg-primary mt-1.5" />
                  签名不会产生任何费用
                </p>
                <p className="flex items-start gap-2">
                  <span className="inline-block w-1 h-1 rounded-full bg-primary mt-1.5" />
                  签名仅用于验证钱包所有权
                </p>
                <p className="flex items-start gap-2">
                  <span className="inline-block w-1 h-1 rounded-full bg-primary mt-1.5" />
                  您的私钥始终安全保存在钱包中
                </p>
              </div>
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button
                variant="secondary"
                className="w-full sm:w-auto"
                onClick={() => setShowAuthDialog(false)}
                disabled={isAuthenticating}
              >
                取消
              </Button>
              <Button
                className="w-full sm:w-auto"
                onClick={authenticate}
                disabled={isAuthenticating}
              >
                {isAuthenticating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    认证中...
                  </>
                ) : (
                  <>
                    <Shield className="mr-2 h-4 w-4" />
                    签名验证
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // 已认证
  return (
    <Button variant="outline" className={className} disabled>
      <CheckCircle2 className="mr-2 h-4 w-4 text-primary" />
      已登录
    </Button>
  );
}

/**
 * 简化版钱包认证按钮（无对话框）
 */
export function SimpleWalletAuthButton({ inviteAddress, onSuccess, className }: WalletAuthButtonProps) {
  const { isConnected } = useAccount();
  const isAuthenticated = useIsAuthenticated();
  const { authenticate, isAuthenticating, error, clearError } = useWalletAuth({
    inviteAddress,
    onSuccess,
  });

  if (!isConnected) {
    return (
      <ConnectButton.Custom>
        {({ openConnectModal }) => (
          <Button onClick={openConnectModal} className={className}>
            连接钱包
          </Button>
        )}
      </ConnectButton.Custom>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="space-y-2">
        {error.message && (
          <ErrorAlert
            code={error.code}
            message={error.message}
            category={error.category}
            onClose={clearError}
          />
        )}
        <Button
          onClick={authenticate}
          disabled={isAuthenticating}
          className={className}
        >
          {isAuthenticating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              认证中...
            </>
          ) : (
            <>
              <Shield className="mr-2 h-4 w-4" />
              签名登录
            </>
          )}
        </Button>
      </div>
    );
  }

  return (
    <Button variant="outline" className={className} disabled>
      <CheckCircle2 className="mr-2 h-4 w-4 text-primary" />
      已登录
    </Button>
  );
}
