import { useState, useEffect } from "react";
import { PiggyBank, Loader2 } from "lucide-react";
import type { StakeOrder } from "./StakeView";
import { StakeOrderItem } from "./StakeView";
import { getMyRecords, type StakeRecord } from "@/lib/api";

// 将后端返回的记录转换为前端 StakeOrder 格式
function convertToStakeOrder(record: StakeRecord): StakeOrder {
  const addDate = new Date(parseInt(record.addtime) * 1000);
  const lockEndDate = new Date(parseInt(record.lockin_time) * 1000);
  
  // 计算锁定天数
  const lockDays = Math.ceil((lockEndDate.getTime() - addDate.getTime()) / (1000 * 60 * 60 * 24));
  
  // 根据状态判断是否锁定
  const isLocked = record.status === 'lockin' || record.status === 'withdrawing';
  
  // 安全地解析数字，避免 NaN
  const amount = parseFloat(record.amount) || 0;
  const totalProfit = parseFloat(record.total_profit_with_today) || 0;
  const todayProfit = parseFloat(record.today_profit) || 0;
  
  // 计算日化收益率（避免除以 0）
  const dailyRate = amount > 0 ? (todayProfit / amount) * 100 : 0;
  
  return {
    id: parseInt(record.id),
    amount: amount,
    startDate: addDate.toISOString().split('T')[0],
    lockEndDate: lockEndDate.toISOString().split('T')[0],
    lockDays: lockDays,
    accruedInterest: totalProfit,
    status: isLocked ? 'locked' : 'unlocked',
    dailyRate: dailyRate,
  };
}

export function StakeOrdersView() {
  const [stakeOrders, setStakeOrders] = useState<StakeOrder[]>([]);
  const [withdrawingOrderId, setWithdrawingOrderId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 获取质押订单列表
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // 获取所有状态的订单（锁定期、正常、提现中）
        const data = await getMyRecords({
          page: '1',
          size: '100',
          status: ['lockin', 'normal', 'withdrawing'],
        });
        
        console.log('✅ 质押订单获取成功:', data);
        console.log('📋 订单列表:', data.list);
        
        // 转换为前端格式
        const orders = data.list.map((record, index) => {
          console.log(`📝 转换订单 ${index + 1}:`, {
            id: record.id,
            amount: record.amount,
            total_profit_with_today: record.total_profit_with_today,
            today_profit: record.today_profit,
            status: record.status,
          });
          return convertToStakeOrder(record);
        });
        
        console.log('✅ 转换后的订单:', orders);
        setStakeOrders(orders);
      } catch (err) {
        console.error('❌ 获取质押订单失败:', err);
        setError(err instanceof Error ? err.message : '获取订单失败');
      } finally {
        setLoading(false);
      }
    };
    
    fetchOrders();
    
    // 每 30 秒刷新一次
    const interval = setInterval(fetchOrders, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleWithdrawStakeOrder = async (order: StakeOrder) => {
    setWithdrawingOrderId(order.id);
    
    try {
      // TODO: 调用提现接口
      await new Promise((resolve) => setTimeout(resolve, 2000));
      
      // 提现成功后，重新获取订单列表
      const data = await getMyRecords({
        page: '1',
        size: '100',
        status: ['lockin', 'normal', 'withdrawing'],
      });
      
      const orders = data.list.map(convertToStakeOrder);
      setStakeOrders(orders);
      
      alert(`已提取本金 ${order.amount.toLocaleString()} USDT0 至钱包`);
    } catch (err) {
      console.error('❌ 提现失败:', err);
      alert('提现失败，请稍后重试');
    } finally {
      setWithdrawingOrderId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin mb-3" />
        <p className="text-sm">加载中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground rounded-xl border border-dashed border-border/70">
        <PiggyBank className="h-12 w-12 opacity-20 mb-3" />
        <p className="text-sm text-destructive">加载失败: {error}</p>
        <p className="text-xs mt-1">请刷新页面重试</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-3xl mx-auto pb-16 pt-4">
      {stakeOrders.length > 0 ? (
        <div className="space-y-4">
          {stakeOrders.map((order) => (
            <div key={order.id} className="rounded-xl border border-border/70 bg-card/50 overflow-hidden">
              <StakeOrderItem
                order={order}
                onWithdraw={handleWithdrawStakeOrder}
                isWithdrawing={withdrawingOrderId === order.id}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground rounded-xl border border-dashed border-border/70">
          <PiggyBank className="h-12 w-12 opacity-20 mb-3" />
          <p className="text-sm">暂无质押订单</p>
          <p className="text-xs mt-1">完成首次质押后订单将显示在此处</p>
        </div>
      )}
    </div>
  );
}

