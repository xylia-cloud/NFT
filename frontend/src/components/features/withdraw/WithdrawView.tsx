import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAccount } from "wagmi";
import { Wallet, ArrowDownToLine, Shield, AlertCircle, Loader2, History } from "lucide-react";

// 模拟可提取金额
const WITHDRAWABLE_AMOUNT = 12500;
// USDT0 兑 XPL 参考汇率（示例：1 USDT0 ≈ 10 XPL，可按实际接口替换）
const USDT0_TO_XPL_RATE = 10;

export function WithdrawView() {
  const { isConnected } = useAccount();
  const [amount, setAmount] = useState("");
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [withdrawHistory] = useState([
    { id: 1, amount: 500, date: "2025-01-28 14:30", status: "completed" },
    { id: 2, amount: 200, date: "2025-01-20 09:15", status: "completed" },
    { id: 3, amount: 1000, date: "2025-01-15 16:45", status: "completed" },
  ]);

  const inputAmount = parseFloat(amount);
  const isValidAmount = !isNaN(inputAmount) && inputAmount > 0 && inputAmount <= WITHDRAWABLE_AMOUNT;
  // 根据输入的 USDT0 实时估算约等于的 XPL 数量
  const estimatedXpl = isNaN(inputAmount) || inputAmount <= 0 ? 0 : inputAmount * USDT0_TO_XPL_RATE;

  const handleWithdraw = async () => {
    if (!isValidAmount) return;
    setIsWithdrawing(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsWithdrawing(false);
    setAmount("");
    alert(`成功提现 ${inputAmount} USDT0 至钱包 (模拟)`);
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
              <span className="text-4xl font-bold tracking-tight text-primary tabular-nums">
                {WITHDRAWABLE_AMOUNT.toLocaleString()}
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
                onClick={() => setAmount(WITHDRAWABLE_AMOUNT.toString())}
              >
                全部提取
              </button>
              <span className="text-muted-foreground">
                最小提取: 100 USDT0
              </span>
            </div>
            {inputAmount > 0 && (
              <p className="text-sm text-muted-foreground">
                约 <span className="font-semibold text-foreground tabular-nums">{estimatedXpl.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span> XPL
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
                onClick={() => setAmount(Math.min(preset, WITHDRAWABLE_AMOUNT).toString())}
                disabled={preset > WITHDRAWABLE_AMOUNT}
              >
                {preset > WITHDRAWABLE_AMOUNT ? "MAX" : preset.toLocaleString()}
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
                确认提现 {isValidAmount ? `${inputAmount.toLocaleString()} USDT0` : ""}
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
                  <div className="font-bold text-sm text-foreground">
                    -{item.amount.toLocaleString()} <span className="text-xs font-normal text-muted-foreground">USDT0</span>
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
