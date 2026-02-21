import { useState, useMemo, useEffect } from "react";
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { useAccount } from "wagmi";
import { Wallet, Server, CalendarDays, Gift, CheckCircle2 } from "lucide-react";
import iconSuperNode from "@/assets/images/icon-cjjd.webp";
import { Usdt0 } from "@/components/ui/usdt0";
import { getSuperNodeInfo, getSuperNodeCalendar, getUserInfo, getWalletInfo, type SuperNodeInfoResponse, type WalletInfoResponse } from "@/lib/api";

export function SuperNodeView() {
  const { isConnected } = useAccount();
  const { t } = useTranslation();
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [superNodeInfo, setSuperNodeInfo] = useState<SuperNodeInfoResponse | null>(null);
  const [walletInfo, setWalletInfo] = useState<WalletInfoResponse | null>(null);
  const [calendarData, setCalendarData] = useState<Record<string, number>>({});
  
  // 从本地存储的用户信息判断是否为超级节点
  const isSuperNode = useMemo(() => {
    const userInfo = getUserInfo();
    return userInfo?.is_super_node === 1;
  }, [superNodeInfo]); // 依赖 superNodeInfo 以便在数据更新后重新计算
  
  // 计算账户总金额（本金 + 收益）
  const totalAccountAmount = useMemo(() => {
    if (!walletInfo) return 0;
    const capital = parseFloat(walletInfo.capital || "0");
    const profit = parseFloat(walletInfo.profit || "0");
    return capital + profit;
  }, [walletInfo]);
  
  // 从 API 获取的累计节点分红
  const totalNodeReward = parseFloat(superNodeInfo?.total_reward || "0");

  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  // 获取超级节点详情
  const fetchSuperNodeInfo = async () => {
    if (!isConnected) return;
    
    try {
      const data = await getSuperNodeInfo();
      setSuperNodeInfo(data);
      console.log('✅ 超级节点详情获取成功:', data);
    } catch (err) {
      console.error('❌ 获取超级节点详情失败:', err);
      // 静默处理错误
    }
  };

  // 获取钱包信息（用于计算账户总金额）
  const fetchWalletInfo = async () => {
    if (!isConnected) return;
    
    try {
      const data = await getWalletInfo();
      setWalletInfo(data);
      console.log('✅ 钱包信息获取成功:', data);
    } catch (err) {
      console.error('❌ 获取钱包信息失败:', err);
      // 静默处理错误
    }
  };

  // 获取超级节点收益日历
  const fetchSuperNodeCalendar = async (month: string) => {
    if (!isConnected) return;
    
    const userInfo = getUserInfo();
    if (!userInfo || userInfo.is_super_node !== 1) {
      console.log('⏭️ 非超级节点用户，跳过获取日历数据');
      return;
    }
    
    try {
      const data = await getSuperNodeCalendar({ month });
      
      // 转换日历数据为 Record<string, number> 格式
      const calendarMap: Record<string, number> = {};
      data.calendar.forEach(day => {
        const reward = parseFloat(day.leader_performance); // 使用 leader_performance 字段
        if (reward > 0) {
          calendarMap[day.date] = reward;
        }
      });
      
      setCalendarData(calendarMap);
      console.log('✅ 超级节点日历获取成功:', data);
    } catch (err) {
      console.error('❌ 获取超级节点日历失败:', err);
      // 静默处理错误
    }
  };

  // 组件加载时获取数据
  useEffect(() => {
    if (isConnected) {
      fetchSuperNodeInfo();
      fetchWalletInfo();
      fetchSuperNodeCalendar(currentMonth);
    }
  }, [isConnected]);

  // 监听登录事件，登录后刷新数据
  useEffect(() => {
    const handleLogin = () => {
      console.log('🔄 检测到登录，刷新超级节点详情...');
      fetchSuperNodeInfo();
      fetchWalletInfo();
      fetchSuperNodeCalendar(currentMonth);
    };
    
    window.addEventListener('auth:login', handleLogin);
    return () => window.removeEventListener('auth:login', handleLogin);
  }, []);

  // 使用真实 API 数据替代模拟数据
  const NODE_DAILY_REWARDS: Record<string, number> = calendarData;

  // 选中日期的收益
  const selectedDateReward = useMemo(() => {
    if (!selectedDate) return null;
    const str = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, "0")}-${String(selectedDate.getDate()).padStart(2, "0")}`;
    return NODE_DAILY_REWARDS[str] ?? null;
  }, [selectedDate, NODE_DAILY_REWARDS]);

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-muted-foreground space-y-4">
        <Wallet className="h-16 w-16 opacity-20" />
        <p>{t("home.connectWalletFirst")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-500 max-w-4xl mx-auto pt-5">
      {/* {t("supernode.status")}卡片 */}
      {isSuperNode ? (
        <Card className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 border-purple-500/20 shadow-sm overflow-hidden relative">
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <Server className="h-24 w-24 -mr-6 -mt-6 rotate-12" />
          </div>
          <CardContent className="p-6">
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-1 min-w-0">
                <span className="text-sm font-medium text-muted-foreground">{t("supernode.status")}</span>
                <div className="flex items-baseline gap-3">
                  <span className="text-4xl font-bold tracking-tight bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent tabular-nums">{t("supernode.activated")}</span>
                  <Badge className="bg-gradient-to-r from-purple-600 to-blue-600 text-white border-0">{t("supernode.nodeReward")}</Badge>
                </div>
              </div>
              <img src={iconSuperNode} alt={t("supernode.title")} className="h-14 w-14 object-contain shrink-0" />
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-muted/30 border-border/40 shadow-sm overflow-hidden relative">
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <Server className="h-24 w-24 -mr-6 -mt-6 rotate-12" />
          </div>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="space-y-1">
                <span className="text-sm font-medium text-muted-foreground">{t("supernode.status")}</span>
                <div className="flex items-baseline gap-3">
                  <span className="text-4xl font-bold tracking-tight text-muted-foreground tabular-nums">{t("supernode.notActivated")}</span>
                  <Badge variant="outline" className="text-xs">{t("supernode.threshold")}</Badge>
                </div>
              </div>
              
              {/* 进度条 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{t("supernode.currentAmount")}</span>
                  <span className="font-semibold">{totalAccountAmount.toLocaleString()} / 30,000 USDT0</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-purple-600 to-blue-600 transition-all duration-500"
                    style={{ width: `${Math.min((totalAccountAmount / 30000) * 100, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {totalAccountAmount >= 30000 
                    ? t('supernode.reached') 
                    : t('supernode.progress', { amount: (30000 - totalAccountAmount).toLocaleString() })
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* {t("supernode.nodeReward")}概览 */}
      {isSuperNode && (
        <>
          {/* 收益统计 */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="border-border/40 shadow-sm">
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center p-1.5">
                      <Usdt0 iconSize="lg" iconOnly />
                    </div>
                    <p className="text-xs text-muted-foreground">{t("supernode.totalReward")}</p>
                  </div>
                  <p className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent flex items-center gap-1.5 flex-wrap">
                    +{totalNodeReward.toFixed(2)}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-border/40 shadow-sm">
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                      <Gift className="h-5 w-5" />
                    </div>
                    <p className="text-xs text-muted-foreground">{t("supernode.accountAmount")}</p>
                  </div>
                  <p className="text-xl font-bold">{totalAccountAmount.toLocaleString()}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 收益日历 */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold tracking-tight px-1 flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-purple-600" />
              {t("supernode.dailyReward")}
            </h3>
            <Card className="border-border/40 shadow-sm">
              <CardContent className="p-4">
                <Calendar
                  selectedDate={selectedDate ?? undefined}
                  onSelectDate={(date) => setSelectedDate(date ?? null)}
                  flowByDate={NODE_DAILY_REWARDS}
                  showAmount
                />
                {selectedDate && selectedDateReward && (
                  <div className="mt-4 pt-4 border-t border-border/40">
                    <p className="text-sm text-muted-foreground mb-2">
                      {selectedDate.getFullYear()}/{selectedDate.getMonth() + 1}/{selectedDate.getDate()} {t("supernode.nodeReward")}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                        +{selectedDateReward.toFixed(2)} USDT0
                      </span>
                      <Badge variant="outline" className="text-xs">{t("supernode.nodeReward")}</Badge>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* 超级节点说明 */}
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          {isSuperNode 
            ? t('supernode.desc1') 
            : t('supernode.desc2')
          }
        </p>
        <div className="rounded-xl bg-muted/30 p-4 space-y-2">
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-purple-600" />
            <span>{t("supernode.autoActivate")}</span>
          </div>
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-purple-600" />
            <span>{t("supernode.benefit1")}</span>
          </div>
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-purple-600" />
            <span>{t("supernode.benefit2")}</span>
          </div>
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-purple-600" />
            <span>{t("supernode.benefit3")}</span>
          </div>
        </div>
        <Card className="border-border/40 shadow-sm">
          <CardContent className="p-4">
            <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <Server className="h-4 w-4 text-purple-600" />
              {t("supernode.rightsDesc")}
            </h4>
            <div className="space-y-3 text-sm text-muted-foreground">
              <div className="flex items-start gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-purple-600 mt-2 shrink-0" />
                <span>{t("supernode.right1")}</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-purple-600 mt-2 shrink-0" />
                <span>{t("supernode.note1")}</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-purple-600 mt-2 shrink-0" />
                <span>{t("supernode.right3")}</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-purple-600 mt-2 shrink-0" />
                <span>{t("supernode.right4")}</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-purple-600 mt-2 shrink-0" />
                <span>{t("supernode.right5")}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
