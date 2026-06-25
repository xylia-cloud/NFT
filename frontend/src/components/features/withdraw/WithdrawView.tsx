import { useState, useEffect, useRef, useCallback } from "react";
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useAccount, useSignMessage } from "wagmi";
import { Wallet, ArrowDownToLine, Shield, AlertCircle, Loader2, History, CheckCircle2 } from "lucide-react";
import { Usdt0 } from "@/components/ui/usdt0";
import { getWalletInfo, getXplRate, profitWithdraw, getTransactionDetails, ApiError, type TransactionDetail, type ProfitWithdrawResponse } from "@/lib/api";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";

/** 后端处理提现预计耗时（毫秒） */
const WITHDRAW_PROCESS_DURATION_MS = 8000;

/** 展示用提现流程（与真实后端逻辑无关，仅 UX） */
const WITHDRAW_DISPLAY_STEPS = [
  { key: 'stepVerify', threshold: 0 },
  { key: 'stepRisk', threshold: 16 },
  { key: 'stepQuote', threshold: 34 },
  { key: 'stepSwap', threshold: 52 },
  { key: 'stepBroadcast', threshold: 72 },
  { key: 'stepConfirm', threshold: 88 },
] as const;

type WithdrawStepStatus = 'pending' | 'active' | 'done';

function getWithdrawStepStatus(stepIndex: number, progress: number): WithdrawStepStatus {
  const current = WITHDRAW_DISPLAY_STEPS[stepIndex];
  const next = WITHDRAW_DISPLAY_STEPS[stepIndex + 1];
  if (progress >= 100 && stepIndex === WITHDRAW_DISPLAY_STEPS.length - 1) return 'done';
  if (next && progress >= next.threshold) return 'done';
  if (progress >= current.threshold) return 'active';
  return 'pending';
}

function WithdrawProcessingSteps({ progress }: { progress: number }) {
  const { t } = useTranslation();

  return (
    <div className="rounded-xl border border-border/50 bg-muted/20 p-3 space-y-0">
      <p className="text-xs font-medium text-muted-foreground mb-3 px-1">
        {t('withdraw.processStepsTitle')}
      </p>
      <ul className="space-y-2">
        {WITHDRAW_DISPLAY_STEPS.map((step, index) => {
          const status = getWithdrawStepStatus(index, progress);
          const isLast = index === WITHDRAW_DISPLAY_STEPS.length - 1;

          return (
            <li key={step.key} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition-colors duration-300 ${
                    status === 'done'
                      ? 'border-primary/30 bg-primary/15 text-primary'
                      : status === 'active'
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border bg-background text-muted-foreground'
                  }`}
                >
                  {status === 'done' ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : status === 'active' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <span className="text-[10px] font-semibold tabular-nums">{index + 1}</span>
                  )}
                </div>
                {!isLast && (
                  <div
                    className={`mt-1 w-px flex-1 min-h-3 transition-colors duration-300 ${
                      status === 'done' ? 'bg-primary/40' : 'bg-border'
                    }`}
                  />
                )}
              </div>
              <div className={`pb-2 flex-1 min-w-0 ${isLast ? 'pb-0' : ''}`}>
                <p
                  className={`text-sm leading-snug transition-colors duration-300 ${
                    status === 'active'
                      ? 'font-medium text-foreground'
                      : status === 'done'
                        ? 'text-foreground/80'
                        : 'text-muted-foreground'
                  }`}
                >
                  {t(`withdraw.${step.key}`)}
                </p>
                {status === 'active' && (
                  <p className="text-xs text-primary/80 mt-0.5 animate-pulse">
                    {t('withdraw.stepInProgress')}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

type WithdrawDialogPhase = 'idle' | 'processing' | 'success';

function animateProgress(durationMs: number, onUpdate: (percent: number) => void): Promise<void> {
  return new Promise((resolve) => {
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const percent = Math.min(100, (elapsed / durationMs) * 100);
      onUpdate(percent);
      if (elapsed >= durationMs) {
        onUpdate(100);
        resolve();
      } else {
        requestAnimationFrame(tick);
      }
    };
    requestAnimationFrame(tick);
  });
}

export function WithdrawView() {
  const { isConnected, address } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const { t } = useTranslation();
  const [amount, setAmount] = useState("");
  const [isSigning, setIsSigning] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [withdrawableAmount, setWithdrawableAmount] = useState(0);
  const [xplRate, setXplRate] = useState(0);
  const [withdrawHistory, setWithdrawHistory] = useState<TransactionDetail[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogPhase, setDialogPhase] = useState<WithdrawDialogPhase>('idle');
  const [progress, setProgress] = useState(0);
  const [withdrawResult, setWithdrawResult] = useState<ProfitWithdrawResponse | null>(null);
  const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const getTransactionTypeName = (protype: string) => {
    const typeMap: Record<string, string> = {
      '1': t('transaction.deposit'),
      '6': t('transaction.dailyReward'),
      '8': t('transaction.referralReward'),
      '9': t('transaction.teamReward'),
      '10': t('transaction.teamBonus'),
      '16': t('transaction.inviteBonus'),
      '20': t('transaction.withdraw'),
      '2001': t('transaction.leaderReward'),
      '2003': t('transaction.reinvest'),
      '2004': t('transaction.supernodeReward'),
    };
    return typeMap[protype] || protype;
  };

  const inputAmount = parseFloat(amount);
  const MIN_WITHDRAW_AMOUNT = 3;
  const isValidAmount = !isNaN(inputAmount) && inputAmount >= MIN_WITHDRAW_AMOUNT && inputAmount <= withdrawableAmount;
  const estimatedXpl = isNaN(inputAmount) || inputAmount <= 0 || xplRate <= 0 ? 0 : inputAmount / xplRate;

  const fetchWalletInfo = async () => {
    if (!isConnected) return;
    try {
      const data = await getWalletInfo();
      setWithdrawableAmount(parseFloat(data.profit || "0"));
    } catch (err) {
      console.error('❌ 获取可提取金额失败:', err);
    }
  };

  const fetchXplRate = async () => {
    try {
      const data = await getXplRate();
      setXplRate(data.rate || 0);
    } catch (err) {
      console.error('❌ 获取 XPL 汇率失败:', err);
    }
  };

  const fetchWithdrawHistory = async () => {
    if (!isConnected) return;
    try {
      const data = await getTransactionDetails({ page: 1, category: 'withdraw' });
      setWithdrawHistory(data.list);
    } catch (err) {
      console.error('❌ 获取提现记录失败:', err);
    }
  };

  useEffect(() => {
    if (isConnected) {
      fetchWalletInfo();
      fetchXplRate();
      fetchWithdrawHistory();
    }
  }, [isConnected]);

  useEffect(() => {
    const handleLogin = () => {
      fetchWalletInfo();
      fetchXplRate();
      fetchWithdrawHistory();
    };
    window.addEventListener('auth:login', handleLogin);
    return () => window.removeEventListener('auth:login', handleLogin);
  }, []);

  useEffect(() => {
    return () => {
      if (successTimerRef.current) clearTimeout(successTimerRef.current);
    };
  }, []);

  const closeDialog = useCallback(() => {
    if (dialogPhase === 'processing') return;
    setDialogOpen(false);
    setDialogPhase('idle');
    setProgress(0);
    setWithdrawResult(null);
  }, [dialogPhase]);

  const handleWithdraw = async () => {
    if (!isValidAmount || !address) return;

    setIsSigning(true);
    try {
      const message = `Confirm withdrawal of ${inputAmount} USDT0\nTimestamp: ${Date.now()}`;
      const signature = await signMessageAsync({ message });

      setIsSigning(false);
      setIsWithdrawing(true);
      setDialogOpen(true);
      setDialogPhase('processing');
      setProgress(0);
      setWithdrawResult(null);

      const [, result] = await Promise.all([
        animateProgress(WITHDRAW_PROCESS_DURATION_MS, setProgress),
        profitWithdraw({ amount: inputAmount.toString(), signature }),
      ]);

      setWithdrawResult(result);
      setProgress(100);
      setDialogPhase('success');
      setAmount("");
      fetchWalletInfo();
      fetchWithdrawHistory();
      toast.success(t('wallet.withdrawSuccess'));

      successTimerRef.current = setTimeout(() => {
        setDialogOpen(false);
        setDialogPhase('idle');
        setProgress(0);
      }, 2000);
    } catch (err: unknown) {
      console.error('❌ 提现失败:', err);
      setDialogOpen(false);
      setDialogPhase('idle');
      setProgress(0);
      setWithdrawResult(null);

      const isUserRejected =
        err instanceof Error &&
        (err.message?.includes('User rejected') ||
          err.message?.includes('user rejected') ||
          err.message?.includes('User denied'));

      if (isUserRejected) {
        toast.error(t('withdraw.userCancelled'));
      } else if (err instanceof ApiError) {
        toast.error(err.localizedMessage);
      } else if (err instanceof Error) {
        toast.error(err.message || t('withdraw.createOrderFailed'));
      } else {
        toast.error(t('withdraw.createOrderFailed'));
      }
    } finally {
      setIsSigning(false);
      setIsWithdrawing(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-muted-foreground space-y-4">
        <Wallet className="h-16 w-16 opacity-20" />
        <p>{t('home.connectWalletFirst')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-8 animate-in fade-in duration-500 max-w-4xl mx-auto pt-2">
      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) closeDialog(); else setDialogOpen(true); }}>
        <DialogContent className="p-6 max-w-md w-[calc(100%-2rem)]">
          {dialogPhase === 'processing' && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center justify-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  {t('withdraw.processingTitle')}
                </DialogTitle>
                <DialogDescription className="text-center pt-1">
                  {t('withdraw.processingDesc')}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <p className="text-center text-sm font-medium text-primary tabular-nums">
                  {t('withdraw.processingProgress', { percent: Math.round(progress) })}
                </p>
                <WithdrawProcessingSteps progress={progress} />
              </div>
            </>
          )}
          {dialogPhase === 'success' && (
            <DialogHeader>
              <div className="flex justify-center mb-2">
                <CheckCircle2 className="h-12 w-12 text-green-500" />
              </div>
              <DialogTitle className="text-center">{t('wallet.withdrawSuccess')}</DialogTitle>
              <div className="space-y-2 text-center pt-1 text-sm text-muted-foreground">
                <p>{t('withdraw.processingSuccessDesc')}</p>
                {withdrawResult?.wxpl_received != null && (
                  <p className="font-semibold text-primary">
                    {t('withdraw.receivedWxpl', {
                      amount: parseFloat(withdrawResult.wxpl_received).toLocaleString(undefined, {
                        maximumFractionDigits: 4,
                      }),
                    })}
                  </p>
                )}
                {withdrawResult?.tx_hash && (
                  <a
                    href={`https://plasmascan.to/tx/${withdrawResult.tx_hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block text-xs text-primary hover:underline break-all"
                  >
                    {t('withdraw.viewTx')}
                  </a>
                )}
              </div>
            </DialogHeader>
          )}
        </DialogContent>
      </Dialog>

      <Card className="border-border/40 shadow-sm overflow-hidden">
        <div className="bg-primary/5 border-b border-primary/10 px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-medium text-muted-foreground shrink-0">{t('withdraw.availableAmount')}</span>
            <span className="text-2xl font-bold tracking-tight text-primary tabular-nums inline-flex items-center gap-1.5">
              <Usdt0 iconSize="lg" iconOnly />
              {withdrawableAmount.toLocaleString()}
            </span>
          </div>
        </div>

        <CardContent className="p-4 space-y-3">
          <div className="space-y-2">
            <Label htmlFor="amount" className="text-sm font-medium">{t('withdraw.withdrawAmount')}</Label>
            <div className="relative">
              <Input
                id="amount"
                type="number"
                placeholder={t('withdraw.enterAmount')}
                value={amount}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '' || /^\d+$/.test(value)) {
                    setAmount(value);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === '.' || e.key === 'e' || e.key === 'E' || e.key === '+' || e.key === '-') {
                    e.preventDefault();
                  }
                }}
                min="3"
                step="1"
                className="h-10 text-base pr-16"
                disabled={isSigning || isWithdrawing}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                USDT0
              </div>
            </div>
            <div className="flex items-center justify-between text-xs">
              <button
                type="button"
                className="text-primary hover:underline disabled:opacity-50"
                onClick={() => setAmount(withdrawableAmount.toString())}
                disabled={isSigning || isWithdrawing}
              >
                {t('withdraw.withdrawAll')}
              </button>
              <span className="text-muted-foreground">
                {t('withdraw.minAmount')}
              </span>
            </div>
            {inputAmount > 0 && inputAmount < MIN_WITHDRAW_AMOUNT && (
              <div className="flex items-center gap-1.5 text-xs text-destructive">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                <span>{t('withdraw.minAmountError')}</span>
              </div>
            )}
            {inputAmount > 0 && xplRate > 0 && (
              <div className="rounded-lg bg-primary/5 border border-primary/10 px-3 py-2">
                <p className="text-xs text-muted-foreground">
                  {t('withdraw.currentRate', { rate: xplRate.toLocaleString(undefined, { maximumFractionDigits: 4 }) })}
                </p>
                <p className="text-sm font-semibold text-primary">
                  {t('withdraw.estimatedXpl', { amount: estimatedXpl.toLocaleString(undefined, { maximumFractionDigits: 4 }) })}
                </p>
              </div>
            )}
            {inputAmount > 0 && xplRate <= 0 && (
              <p className="text-xs text-muted-foreground">
                {t('withdraw.fetchingRate')}
              </p>
            )}
          </div>

          <div className="rounded-lg bg-muted/30 px-3 py-2 space-y-1">
            <p className="flex items-start gap-1.5 text-xs text-red-500 leading-snug">
              <Shield className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              <span>{t('withdraw.feeNotice')}</span>
            </p>
            <p className="flex items-start gap-1.5 text-xs text-muted-foreground leading-snug">
              <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              <span>{t('withdraw.rateNotice')}</span>
            </p>
            <p className="flex items-start gap-1.5 text-xs text-muted-foreground leading-snug">
              <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              <span>{t('withdraw.backendProcessNotice')}</span>
            </p>
          </div>

          <Button
            className="w-full h-11 rounded-xl text-sm font-bold"
            onClick={handleWithdraw}
            disabled={!isValidAmount || isSigning || isWithdrawing}
          >
            {isSigning ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                {t('withdraw.waitingWallet')}
              </>
            ) : isWithdrawing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                {t('withdraw.processingTitle')}
              </>
            ) : (
              <>
                <ArrowDownToLine className="h-4 w-4 mr-2" />
                {t('withdraw.confirmWithdraw')} {isValidAmount && estimatedXpl > 0 ? `${estimatedXpl.toLocaleString(undefined, { maximumFractionDigits: 4 })} WXPL` : ""}
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <h3 className="text-base font-semibold tracking-tight px-1 flex items-center gap-2">
          <History className="h-4 w-4 text-primary" />
          {t('withdraw.history')}
        </h3>
        {withdrawHistory.length === 0 ? (
          <Card className="border-border/40 shadow-sm">
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <History className="h-8 w-8 opacity-20 mb-2" />
              <p className="text-sm">{t('withdraw.noHistory')}</p>
            </div>
          </Card>
        ) : (
          <Card className="border-border/40 shadow-sm">
            <ScrollArea className="h-[280px]">
              <div className="divide-y divide-border/40">
                {withdrawHistory.map((item, index) => {
                  const translatedName = getTransactionTypeName(item.protype);
                  return (
                    <div key={`${item.time}-${index}`} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-500">
                          <ArrowDownToLine className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="font-medium text-sm">{translatedName}</div>
                          <div className="text-xs text-muted-foreground">{item.time_format}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-sm text-foreground inline-flex items-center gap-1">
                          -{parseFloat(item.fee).toFixed(2)} <span className="text-xs font-normal text-muted-foreground"><Usdt0 iconSize="sm" /></span>
                        </div>
                        <div className="text-[10px] text-muted-foreground">{t('wallet.completed')}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </Card>
        )}
      </div>
    </div>
  );
}
