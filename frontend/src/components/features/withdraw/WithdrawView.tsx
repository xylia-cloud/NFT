import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAccount } from "wagmi";
import { Wallet, ArrowDownToLine, Shield, AlertCircle, Loader2, History } from "lucide-react";
import { Usdt0 } from "@/components/ui/usdt0";
import { getWalletInfo, getXplRate, profitWithdraw } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export function WithdrawView() {
  const { isConnected } = useAccount();
  const { toast } = useToast();
  const [amount, setAmount] = useState("");
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [withdrawableAmount, setWithdrawableAmount] = useState(0);
  const [xplRate, setXplRate] = useState(0); // XPL 汇率
  const [withdrawHistory] = useState([
    { id: 1, amount: 500, date: "2025-01-28 14:30", status: "completed" },
    { id: 2, amount: 200, date: "2025-01-20 09:15", status: "completed" },
    { id: 3, amount: 1000, date: "2025-01-15 16:45", status: "completed" },
  ]);

  const inputAmount = parseFloat(amount);
  const isValidAmount = !isNaN(inputAmount) && inputAmount > 0 && inputAmount <= withdrawableAmount;
  // 根据输入的 USDT0 和真实汇率计算 XPL 数量
  const estimatedXpl = isNaN(inputAmount) || inputAmount <= 0 || xplRate <= 0 ? 0 : inputAmount * xplRate;

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

  // 组件加载时获取钱包信息和汇率
  useEffect(() => {
    if (isConnected) {
      fetchWalletInfo();
      fetchXplRate();
    }
  }, [isConnected]);

  // 监听登录事件，登录后刷新数据
  useEffect(() => {
    const handleLogin = () => {
      console.log('🔄 检测到登录，刷新可提取金额和汇率...');
      fetchWalletInfo();
      fetchXplRate();
    };
    
    window.addEventListener('auth:login', handleLogin);
    return () => window.removeEventListener('auth:login', handleLogin);
  }, []);

  const handleWithdraw = async () => {
    if (!isValidAmount) return;
    
    setIsWithdrawing(true);
    try {
      const result = await profitWithdraw({ amount: inputAmount.toString() });
      
      console.log('✅ 提现成功:', result);
      
      // 显示成功提示
      toast({
        title: "提现成功",
        description: `已提现 ${result.amount} USDT0，实际到账 ${result.receipt_amount} USDT0 (约 ${(result.receipt_amount * xplRate).toLocaleString(undefined, { maximumFractionDigits: 4 })} XPL)，手续费 ${result.fee} USDT0`,
      });
      
      // 清空输入
      setAmount("");
      
      // 刷新钱包信息
      fetchWalletInfo();
      
    } catch (err: any) {
      console.error('❌ 提现失败:', err);
      
      // 显示错误提示
      toast({
        title: "提现失败",
        description: err.message || "提现失败，请稍后重试",
        variant: "destructive",
      });
    } finally {
      setIsWithdrawing(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-muted-foreground space-y-4">
        <Wallet className="h-16 w-16 opacity-20" />
        <p>请先在首页连接钱包</p>
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
            <span className="text-sm font-medium text-muted-foreground">可提取金额 (USDT0)</span>
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
            <Label htmlFor="amount" className="text-sm font-medium">提取金额</Label>
            <div className="relative">
              <Input
                id="amount"
                type="number"
                placeholder="请输入提取金额"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
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
                全部提取
              </button>
              <span className="text-muted-foreground">
                最小提取: 100 USDT0
              </span>
            </div>
            {inputAmount > 0 && xplRate > 0 && (
              <div className="rounded-lg bg-primary/5 border border-primary/10 p-3">
                <p className="text-sm text-muted-foreground">
                  按当前汇率 (1 USDT0 = {xplRate.toLocaleString(undefined, { maximumFractionDigits: 4 })} XPL)
                </p>
                <p className="text-base font-semibold text-primary mt-1">
                  约 {estimatedXpl.toLocaleString(undefined, { maximumFractionDigits: 4 })} XPL
                </p>
              </div>
            )}
            {inputAmount > 0 && xplRate <= 0 && (
              <p className="text-sm text-muted-foreground">
                正在获取汇率...
              </p>
            )}
          </div>

          {/* 快捷金额 */}
          <div className="grid grid-cols-4 gap-2">
            {[1000, 2000, 5000, 10000].map((preset) => (
              <Button
                key={preset}
                type="button"
                variant={amount === preset.toString() ? "default" : "outline"}
                size="sm"
                className="rounded-lg"
                onClick={() => setAmount(Math.min(preset, withdrawableAmount).toString())}
                disabled={preset > withdrawableAmount}
              >
                {preset > withdrawableAmount ? "MAX" : preset.toLocaleString()}
              </Button>
            ))}
          </div>

          {/* 提现说明 */}
          <div className="rounded-xl bg-muted/30 p-4 space-y-2">
            <div className="flex items-start gap-2 text-sm text-muted-foreground">
              <Shield className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
              <span>提现手续费 1 USDT0，24小时到账</span>
            </div>
            <div className="flex items-start gap-2 text-sm text-muted-foreground">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>本次提现将按实时汇率折算为 XPL 发送，请务必确认地址正确</span>
            </div>
          </div>

          <Button
            className="w-full h-12 rounded-xl text-base font-bold"
            onClick={handleWithdraw}
            disabled={!isValidAmount || isWithdrawing}
          >
            {isWithdrawing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                处理中...
              </>
            ) : (
              <>
                <ArrowDownToLine className="h-4 w-4 mr-2" />
                确认提现 {isValidAmount && estimatedXpl > 0 ? `${estimatedXpl.toLocaleString(undefined, { maximumFractionDigits: 4 })} XPL` : ""}
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* 提现记录 */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold tracking-tight px-1 flex items-center gap-2">
          <History className="h-5 w-5 text-primary" />
          提现记录
        </h3>
        <Card className="border-border/40 shadow-sm">
          <div className="divide-y divide-border/40">
            {withdrawHistory.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-500">
                    <ArrowDownToLine className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="font-medium text-sm">余额提现</div>
                    <div className="text-xs text-muted-foreground">{item.date}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-sm text-foreground inline-flex items-center gap-1">
                    -{item.amount.toLocaleString()} <span className="text-xs font-normal text-muted-foreground"><Usdt0 iconSize="sm" /></span>
                  </div>
                  <div className="text-[10px] text-muted-foreground">已完成</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
