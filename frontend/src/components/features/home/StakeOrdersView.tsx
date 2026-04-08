import { useState, useEffect } from "react";
import { useTranslation } from 'react-i18next';
import { PiggyBank, Loader2 } from "lucide-react";
import type { StakeOrder } from "./StakeView";
import { StakeOrderItem } from "./StakeView";
import { getMyRecords, capitalWithdraw, ApiError, type StakeRecord } from "@/lib/api";
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useSignMessage } from "wagmi";
import { paymentChannelABI, paymentChannelAddress } from "@/wagmiConfig";
import { toast } from "sonner";

// 将后端返回的记录转换为前端 StakeOrder 格式
function convertToStakeOrder(record: StakeRecord): StakeOrder {
  const addDate = new Date(parseInt(record.addtime) * 1000);
  const lockEndDate = new Date(parseInt(record.lockin_time) * 1000);
  
  // 计算锁定天数
  const lockDays = Math.ceil((lockEndDate.getTime() - addDate.getTime()) / (1000 * 60 * 60 * 24));
  
  // 根据状态判断是否锁定或已提取
  // withdrawn: 已提取本金
  // lockin/withdrawing: 锁定期
  // normal: 可提取
  let status: 'locked' | 'unlocked' | 'withdrawn';
  if (record.status === 'withdrawn') {
    status = 'withdrawn';
  } else if (record.status === 'lockin' || record.status === 'withdrawing') {
    status = 'locked';
  } else {
    status = 'unlocked';
  }
  
  // 安全地解析数字，避免 NaN
  const amount = parseFloat(record.amount) || 0;
  const totalProfit = parseFloat(record.total_profit) || 0;
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
    status: status,
    dailyRate: dailyRate,
  };
}

export function StakeOrdersView() {
  const { address } = useAccount();
  const { t } = useTranslation();
  const [stakeOrders, setStakeOrders] = useState<StakeOrder[]>([]);
  const [withdrawingOrderId, setWithdrawingOrderId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentWithdrawOrderId, setCurrentWithdrawOrderId] = useState<string>("");
  
  // 合约交互
  const { writeContract, data: hash } = useWriteContract();
  const { isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });
  
  // 消息签名 hook
  const { signMessageAsync } = useSignMessage();

  // 获取质押订单列表
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // 获取所有状态的订单（锁定期、正常、提现中、已提取）
        const data = await getMyRecords({
          page: '1',
          size: '100',
          status: ['lockin', 'normal', 'withdrawing', 'withdrawn'],
        });
        
        // 转换为前端格式
        const orders = data.list.map(convertToStakeOrder);
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
    if (!address) {
      toast.error("请先连接钱包");
      return;
    }
    
    setWithdrawingOrderId(order.id);
    
    try {
      // 步骤1: 先让用户签名确认提取本金意图
      console.log('📝 请求用户签名确认提取本金...', { orderId: order.id, amount: order.amount });
      
      // 提示用户需要两次签名
      toast.info("提取本金需要两次签名确认", {
        description: "第一次确认提取意图，第二次确认链上交易",
        duration: 4000,
      });
      
      const message = `Confirm capital withdrawal for order ${order.id}\nAmount: ${order.amount} USDT0\nTimestamp: ${Date.now()}`;
      
      let userSignature: string;
      try {
        userSignature = await signMessageAsync({ message });
        console.log('✅ 用户第一次签名成功');
      } catch (signError: any) {
        console.log('❌ 用户取消第一次签名或签名失败:', signError);
        setWithdrawingOrderId(null);
        
        if (signError.message?.includes('User rejected') || signError.message?.includes('user rejected')) {
          toast.error("您已取消提取本金操作");
        } else {
          toast.error(signError.message || "签名失败");
        }
        return;
      }
      
      // 步骤2: 签名成功后，从后端订单列表中找到对应的原始订单数据
      const data = await getMyRecords({
        page: '1',
        size: '100',
        status: ['lockin', 'normal', 'withdrawing', 'withdrawn'],
      });
      
      const originalOrder = data.list.find(r => parseInt(r.id) === order.id);
      if (!originalOrder) {
        throw new Error('订单不存在');
      }
      
      // 步骤3: 调用后端本金提现接口
      const withdrawResult = await capitalWithdraw({ order_id: originalOrder.order_id });
      
      setCurrentWithdrawOrderId(withdrawResult.transaction_id);
      
      // 提示用户即将进行第二次签名
      toast.info("请确认第二次签名以完成链上交易", {
        duration: 3000,
      });
      
      // 步骤4: 调用智能合约提现（使用后端返回的签名）
      const { withdraw_signature } = withdrawResult;
      
      // USDT 金额（已经是 wei 格式，6位精度）
      const usdtAmountWei = BigInt(withdraw_signature.amount_wei);
      
      // 调用 withdrawWithSignature 函数（本金提现，转 USDT）
      writeContract({
        address: paymentChannelAddress,
        abi: paymentChannelABI,
        functionName: 'withdrawWithSignature',
        args: [
          usdtAmountWei,
          withdrawResult.transaction_id,
          BigInt(withdraw_signature.nonce),
          withdraw_signature.signature as `0x${string}`,
        ],
      }, {
        onError: (error) => {
          console.error('❌ 合约调用失败:', error);
          setWithdrawingOrderId(null);
          setCurrentWithdrawOrderId("");
          
          // 检查是否是用户拒绝
          const isUserRejected = error.message?.includes('User rejected') || 
                                 error.message?.includes('user rejected') ||
                                 error.message?.includes('User denied');
          
          if (isUserRejected) {
            toast.error("您已取消链上交易签名", {
              description: "订单已创建但交易未完成，请联系客服处理",
              duration: 5000,
            });
          } else {
            toast.error(error.message || "合约调用失败");
          }
        }
      });
      
    } catch (err: any) {
      console.error('❌ 本金提现失败:', err);
      setWithdrawingOrderId(null);
      setCurrentWithdrawOrderId("");
      
      // 如果是 ApiError，使用本地化的错误信息
      if (err instanceof ApiError) {
        toast.error(err.localizedMessage);
      } else {
        toast.error(err.message || "提现失败，请稍后重试");
      }
    }
  };
  
  // 监听交易确认
  useEffect(() => {
    if (isConfirmed && hash && currentWithdrawOrderId) {
      toast.success("本金提现成功");
      
      // 清空状态
      setCurrentWithdrawOrderId("");
      setWithdrawingOrderId(null);
      
      // 刷新订单列表
      const fetchOrders = async () => {
        try {
          const data = await getMyRecords({
            page: '1',
            size: '100',
            status: ['lockin', 'normal', 'withdrawing', 'withdrawn'],
          });
          const orders = data.list.map(convertToStakeOrder);
          setStakeOrders(orders);
        } catch (err) {
          console.error('❌ 刷新订单列表失败:', err);
        }
      };
      fetchOrders();
    }
  }, [isConfirmed, hash, currentWithdrawOrderId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin mb-3" />
        <p className="text-sm">{t('common.loading')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground rounded-xl border border-dashed border-border/70">
        <PiggyBank className="h-12 w-12 opacity-20 mb-3" />
        <p className="text-sm text-destructive">{t('stake.loadFailed')}: {error}</p>
        <p className="text-xs mt-1">{t('stake.refreshPage')}</p>
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
          <p className="text-sm">{t('stake.noOrders')}</p>
          <p className="text-xs mt-1">{t('stake.noOrdersDesc')}</p>
        </div>
      )}
    </div>
  );
}

