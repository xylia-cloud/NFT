import { useState, useEffect } from "react";
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { Wallet, ArrowDownToLine, Shield, AlertCircle, Loader2, History } from "lucide-react";
import { Usdt0 } from "@/components/ui/usdt0";
import { getWalletInfo, getXplRate, profitWithdraw, getTransactionDetails, ApiError, type TransactionDetail } from "@/lib/api";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { paymentChannelABI, paymentChannelAddress } from "@/wagmiConfig";

export function WithdrawView() {
  const { isConnected, address } = useAccount();
  const { t } = useTranslation();
  const [amount, setAmount] = useState("");
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [withdrawableAmount, setWithdrawableAmount] = useState(0);
  const [xplRate, setXplRate] = useState(0); // XPL 汇率
  const [withdrawHistory, setWithdrawHistory] = useState<TransactionDetail[]>([]);
  const [currentOrderId, setCurrentOrderId] = useState<string>("");
  
  // 交易类型翻译映射
  const getTransactionTypeName = (protype: string) => {
    const typeMap: Record<string, string> = {
      '1': t('transaction.deposit'),        // 入金
      '6': t('transaction.dailyReward'),    // 日收益
      '8': t('transaction.referralReward'), // 推荐收益
      '9': t('transaction.teamReward'),     // 团队收益
      '10': t('transaction.teamBonus'),     // 团队奖励
      '16': t('transaction.inviteBonus'),   // 推荐奖励
      '20': t('transaction.withdraw'),      // 提现
      '2001': t('transaction.leaderReward'),// 领袖奖励
      '2003': t('transaction.reinvest'),    // 复投
      '2004': t('transaction.supernodeReward'), // 超级节点奖励
    };
    
    return typeMap[protype] || protype;
  };
  
  // 合约交互
  const { writeContract, data: hash, isPending: isContractPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  const inputAmount = parseFloat(amount);
  const MIN_WITHDRAW_AMOUNT = 3; // 最低提现金额
  const isValidAmount = !isNaN(inputAmount) && inputAmount >= MIN_WITHDRAW_AMOUNT && inputAmount <= withdrawableAmount;
  // 根据输入的 USDT0 和真实汇率计算 XPL 数量
  // xplRate 是 XPL 的 USDT 价格（1 XPL = xplRate USDT）
  // 所以 XPL 数量 = USDT 数量 / xplRate
  const estimatedXpl = isNaN(inputAmount) || inputAmount <= 0 || xplRate <= 0 ? 0 : inputAmount / xplRate;

  // 获取钱包信息
  const fetchWalletInfo = async () => {
    if (!isConnected) return;
    
    try {
      const data = await getWalletInfo();
      const profit = parseFloat(data.profit || "0");
      setWithdrawableAmount(profit);
      console.log('✅ 可提取金额获取成功:', profit);
    } catch (err) {
      console.error('❌ 获取可提取金额失败:', err);
      // 静默处理错误
    }
  };

  // 获取 XPL 汇率
  const fetchXplRate = async () => {
    try {
      const data = await getXplRate();
      const rate = data.rate || 0;
      setXplRate(rate);
      console.log('✅ XPL 汇率获取成功:', rate, '来源:', data.source, '更新时间:', data.update_time);
    } catch (err) {
      console.error('❌ 获取 XPL 汇率失败:', err);
      // 静默处理错误，使用默认值 0
    }
  };

  // 获取提现记录
  const fetchWithdrawHistory = async () => {
    if (!isConnected) return;
    
    try {
      const data = await getTransactionDetails({ page: 1, category: 'withdraw' });
      setWithdrawHistory(data.list);
      console.log('✅ 提现记录获取成功:', data.list.length, '条');
    } catch (err) {
      console.error('❌ 获取提现记录失败:', err);
      // 静默处理错误
    }
  };

  // 组件加载时获取钱包信息和汇率
  useEffect(() => {
    if (isConnected) {
      fetchWalletInfo();
      fetchXplRate();
      fetchWithdrawHistory();
    }
  }, [isConnected]);

  // 监听登录事件，登录后刷新数据
  useEffect(() => {
    const handleLogin = () => {
      console.log('🔄 检测到登录，刷新可提取金额和汇率...');
      fetchWalletInfo();
      fetchXplRate();
      fetchWithdrawHistory();
    };
    
    window.addEventListener('auth:login', handleLogin);
    return () => window.removeEventListener('auth:login', handleLogin);
  }, []);

  const handleWithdraw = async () => {
    if (!isValidAmount || !address) return;
    
    setIsWithdrawing(true);
    try {
      // 步骤1: 调用后端创建提现订单并获取签名
      console.log('📝 创建提现订单...', { amount: inputAmount });
      const orderResult = await profitWithdraw({ amount: inputAmount.toString() });
      
      console.log('✅ 订单创建成功:', orderResult);
      console.log('📊 订单详情:', {
        transaction_id: orderResult.transaction_id,
        amount: orderResult.amount,
        fee: orderResult.fee,
        receipt_amount: orderResult.receipt_amount,
        xpl_rate: orderResult.xpl_rate,
        xpl_amount: orderResult.xpl_amount,
        withdraw_signature: orderResult.withdraw_signature,
      });
      
      setCurrentOrderId(orderResult.transaction_id);
      
      // 步骤2: 调用智能合约提现（使用签名验证）
      console.log('🔗 调用智能合约 withdrawXplWithSignature...');
      
      const { withdraw_signature } = orderResult;
      
      // XPL 金额（已经是 wei 格式，18位精度）
      const xplAmountWei = BigInt(withdraw_signature.amount_wei);
      
      // USDT 价值（需要转换为 wei，6位精度）
      const usdtValueWei = BigInt(Math.floor(orderResult.receipt_amount * 1e6));
      
      console.log('🔢 合约参数:', {
        xplAmountWei: xplAmountWei.toString(),
        usdtValueWei: usdtValueWei.toString(),
        orderId: orderResult.transaction_id,
        nonce: withdraw_signature.nonce,
        signature: withdraw_signature.signature,
      });
      
      // 调用 withdrawXplWithSignature 函数（收益提现，转 XPL）
      writeContract({
        address: paymentChannelAddress,
        abi: paymentChannelABI,
        functionName: 'withdrawXplWithSignature',
        args: [
          xplAmountWei,
          usdtValueWei,
          orderResult.transaction_id,
          BigInt(withdraw_signature.nonce),
          withdraw_signature.signature as `0x${string}`,
        ],
      });
      
    } catch (err: any) {
      console.error('❌ 提现失败:', err);
      setIsWithdrawing(false);
      
      if (err instanceof ApiError) {
        toast.error(err.localizedMessage);
      } else {
        toast.error(err.message || t('withdraw.createOrderFailed'));
      }
    }
  };
  
  // 监听交易确认
  useEffect(() => {
    if (isConfirmed && hash && currentOrderId) {
      console.log('✅ 交易已确认:', hash);
      
      toast.success(t('wallet.withdrawSuccess'));
      
      // 清空输入和状态
      setAmount("");
      setCurrentOrderId("");
      setIsWithdrawing(false);
      
      // 刷新数据
      fetchWalletInfo();
      fetchWithdrawHistory();
    }
  }, [isConfirmed, hash, currentOrderId]);

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-muted-foreground space-y-4">
        <Wallet className="h-16 w-16 opacity-20" />
        <p>{t('home.connectWalletFirst')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-500 max-w-4xl mx-auto pt-6">
      {/* 可提取金额卡片 */}
      <Card className="bg-primary/5 border-primary/10 shadow-sm overflow-hidden relative">
        <div className="absolute top-0 right-0 p-4 opacity-5">
          <Wallet className="h-24 w-24 -mr-6 -mt-6 rotate-12" />
        </div>
        <CardContent className="p-6">
          <div className="space-y-1">
            <span className="text-sm font-medium text-muted-foreground">{t('withdraw.availableAmount')}</span>
            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-bold tracking-tight text-primary tabular-nums inline-flex items-center gap-2">
                <Usdt0 iconSize="xl" iconOnly />
                {withdrawableAmount.toLocaleString()}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 提现表单 */}
      <Card className="border-border/40 shadow-sm">
        <CardContent className="p-6 space-y-6">
          <div className="space-y-3">
            <Label htmlFor="amount" className="text-sm font-medium">{t('withdraw.withdrawAmount')}</Label>
            <div className="relative">
              <Input
                id="amount"
                type="number"
                placeholder={t('withdraw.enterAmount')}
                value={amount}
                onChange={(e) => {
                  const value = e.target.value;
                  // 只允许整数，过滤掉小数点和小数部分
                  if (value === '' || /^\d+$/.test(value)) {
                    setAmount(value);
                  }
                }}
                onKeyDown={(e) => {
                  // 阻止输入小数点、e、+、- 等字符
                  if (e.key === '.' || e.key === 'e' || e.key === 'E' || e.key === '+' || e.key === '-') {
                    e.preventDefault();
                  }
                }}
                min="3"
                step="1"
                className="h-12 text-lg pr-16"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                USDT0
              </div>
            </div>
            <div className="flex items-center justify-between text-xs">
              <button
                type="button"
                className="text-primary hover:underline"
                onClick={() => setAmount(withdrawableAmount.toString())}
              >
                {t('withdraw.withdrawAll')}
              </button>
              <span className="text-muted-foreground">
                {t('withdraw.minAmount')}
              </span>
            </div>
            {inputAmount > 0 && inputAmount < MIN_WITHDRAW_AMOUNT && (
              <div className="flex items-center gap-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{t('withdraw.minAmountError')}</span>
              </div>
            )}
            {inputAmount > 0 && xplRate > 0 && (
              <div className="rounded-lg bg-primary/5 border border-primary/10 p-3">
                <p className="text-sm text-muted-foreground">
                  {t('withdraw.currentRate', { rate: xplRate.toLocaleString(undefined, { maximumFractionDigits: 4 }) })}
                </p>
                <p className="text-base font-semibold text-primary mt-1">
                  {t('withdraw.estimatedXpl', { amount: estimatedXpl.toLocaleString(undefined, { maximumFractionDigits: 4 }) })}
                </p>
              </div>
            )}
            {inputAmount > 0 && xplRate <= 0 && (
              <p className="text-sm text-muted-foreground">
                {t('withdraw.fetchingRate')}
              </p>
            )}
          </div>

          {/* 提现说明 */}
          <div className="rounded-xl bg-muted/30 p-4 space-y-2">
            <div className="flex items-start gap-2 text-sm text-muted-foreground">
              <Shield className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
              <span>{t('withdraw.feeNotice')}</span>
            </div>
            <div className="flex items-start gap-2 text-sm text-muted-foreground">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{t('withdraw.rateNotice')}</span>
            </div>
          </div>

          <Button
            className="w-full h-12 rounded-xl text-base font-bold"
            onClick={handleWithdraw}
            disabled={!isValidAmount || isWithdrawing || isContractPending || isConfirming}
          >
            {isWithdrawing && !hash ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                {t('withdraw.creatingOrder')}
              </>
            ) : isContractPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                {t('withdraw.waitingWallet')}
              </>
            ) : isConfirming ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                {t('withdraw.confirming')}
              </>
            ) : (
              <>
                <ArrowDownToLine className="h-4 w-4 mr-2" />
                {t('withdraw.confirmWithdraw')} {isValidAmount && estimatedXpl > 0 ? `${estimatedXpl.toLocaleString(undefined, { maximumFractionDigits: 4 })} XPL` : ""}
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* 提现记录 */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold tracking-tight px-1 flex items-center gap-2">
          <History className="h-5 w-5 text-primary" />
          {t('withdraw.history')}
        </h3>
        {withdrawHistory.length === 0 ? (
          <Card className="border-border/40 shadow-sm">
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <History className="h-10 w-10 opacity-20 mb-2" />
              <p className="text-sm">{t('withdraw.noHistory')}</p>
            </div>
          </Card>
        ) : (
          <Card className="border-border/40 shadow-sm">
            <ScrollArea className="h-[400px]">
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
