import { useState } from "react";
import { PiggyBank } from "lucide-react";
import type { StakeOrder } from "./StakeView";
import { INITIAL_STAKE_ORDERS, StakeOrderItem } from "./StakeView";

export function StakeOrdersView() {
  const [stakeOrders, setStakeOrders] = useState<StakeOrder[]>(INITIAL_STAKE_ORDERS);
  const [withdrawingOrderId, setWithdrawingOrderId] = useState<number | null>(null);

  const handleWithdrawStakeOrder = async (order: StakeOrder) => {
    setWithdrawingOrderId(order.id);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setStakeOrders((prev) => prev.filter((o) => o.id !== order.id));
    setWithdrawingOrderId(null);
    alert(`已提取本金 ${order.amount.toLocaleString()} USDT0 至钱包 (模拟)`);
  };

  return (
    <div className="space-y-4 max-w-3xl mx-auto pb-16">
      {stakeOrders.length > 0 ? (
        <div className="space-y-4">
          {stakeOrders.map((order) => (
            <div key={order.id} className="rounded-xl border border-border/40 bg-card/50 overflow-hidden">
              <StakeOrderItem
                order={order}
                onWithdraw={handleWithdrawStakeOrder}
                isWithdrawing={withdrawingOrderId === order.id}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground rounded-xl border border-dashed border-border/40">
          <PiggyBank className="h-12 w-12 opacity-20 mb-3" />
          <p className="text-sm">暂无质押订单</p>
          <p className="text-xs mt-1">完成首次质押后订单将显示在此处</p>
        </div>
      )}
    </div>
  );
}

