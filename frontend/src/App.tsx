import { useState, useEffect, useCallback, useId } from 'react';
import { useTranslation } from 'react-i18next';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { MainLayout } from '@/components/layout/MainLayout';
import { StakeView } from '@/components/features/home/StakeView';
import { StakeOrdersView } from '@/components/features/home/StakeOrdersView';
import { WalletView } from '@/components/features/wallet/WalletView';
import { WithdrawView } from '@/components/features/withdraw/WithdrawView';
import { LeaderRewardView } from '@/components/features/leader/LeaderRewardView';
import { SuperNodeView } from '@/components/features/supernode/SuperNodeView';
import { TeamView } from '@/components/features/team/TeamView';
import { InviteView } from '@/components/features/invite/InviteView';
import { HelpCenterView } from '@/components/features/profile/HelpCenterView';
import { AboutView } from '@/components/features/about/AboutView';
import { PlasmaOneView } from '@/components/features/plasma-one/PlasmaOneView';
import { NewsView } from '@/components/features/news/NewsView';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Toaster } from '@/components/ui/sonner';
import { GlobalLoading } from '@/components/ui/GlobalLoading';
import { NetworkGuard } from '@/components/NetworkGuard';
import { useWalletAuth } from '@/hooks/useWalletAuth';
import { useLoadingStore } from '@/store/loadingStore';
import { clearToken } from '@/lib/api';
import { Wallet } from 'lucide-react';

// Crisp 在线客服（唯一客服入口，替换原 VoceChat）
const CRISP_CHAT_URL = "https://go.crisp.chat/chat/embed/?website_id=073d33e8-a907-4dfc-a78e-c2edba682900";
const CRISP_CHAT_TITLE = "在线客服";
// Crisp embed 自带对话框，此处仅作为宿主容器尺寸
const CRISP_IFRAME_WIDTH = "350px";
const CRISP_IFRAME_HEIGHT = "600px";
const VALID_TABS = ['home', 'wallet', 'withdraw', 'leader', 'supernode', 'team', 'invite', 'help-center', 'orders', 'about', 'plasma-one', 'news'] as const;

function ConnectWalletGate() {
  const { t } = useTranslation();
  
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 space-y-6">
      <div className="rounded-2xl bg-primary/10 p-6 border border-primary/20">
        <Wallet className="h-16 w-16 text-primary mx-auto mb-4" />
        <h2 className="text-lg font-semibold text-foreground mb-2">{t('common.connectWalletToAccess')}</h2>
        <p className="text-sm text-muted-foreground mb-6 max-w-sm">
          {t('common.connectWalletDesc')}
        </p>
        <ConnectButton.Custom>
          {({ openConnectModal }) => (
            <Button onClick={openConnectModal} className="gap-2 rounded-xl">
              <Wallet className="h-4 w-4" />
              {t('common.connectWallet')}
            </Button>
          )}
        </ConnectButton.Custom>
      </div>
    </div>
  );
}

function hashToTab(hash: string): string {
  // 移除 # 并提取路径部分（忽略查询参数）
  const path = hash.replace(/^#/, '').split('?')[0].toLowerCase() || 'home';
  return VALID_TABS.includes(path as typeof VALID_TABS[number]) ? path : 'home';
}

export default function App() {
  const [currentTab, setCurrentTab] = useState(() => hashToTab(window.location.hash));
  const [showCustomerService, setShowCustomerService] = useState(false);
  // Crisp iframe 首帧不加载，对话窗口完全展开后再挂载，避免初始化时被测量成错误的高度
  const [crispReady, setCrispReady] = useState(false);
  const crispIframeId = useId();
  const { isConnected } = useAccount();
  const { isLoading } = useLoadingStore();

  // 打开客服对话框
  const handleOpenCustomerService = () => {
    setShowCustomerService(true);
    // 等下一帧（Dialog 完成挂载并拿到最终尺寸）再加载 Crisp
    requestAnimationFrame(() => requestAnimationFrame(() => setCrispReady(true)));
  };

  // 从 URL 中提取邀请人地址（只在应用启动时提取一次）
  const [inviteAddress] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const invit = params.get('invit');
    if (invit) {
      console.log('🔗 检测到邀请链接，邀请人地址:', invit);
      // 保存到 sessionStorage，关闭页面自动清除
      sessionStorage.setItem('invite_address', invit);
      return invit;
    }
    // 如果 URL 中没有，尝试从 sessionStorage 读取
    const savedInvit = sessionStorage.getItem('invite_address');
    if (savedInvit) {
      console.log('📦 从缓存读取邀请人地址:', savedInvit);
    }
    return savedInvit || undefined;
  });

  // 自动登录：钱包连接后自动触发登录，传入邀请人地址
  useWalletAuth({
    autoLogin: true,
    inviteAddress,
    onSuccess: (result) => {
      console.log('🎉 自动登录成功:', result);
    },
    onError: (error) => {
      console.error('❌ 自动登录失败:', error);
    },
  });

  // 监听钱包断开，清除 token
  useEffect(() => {
    if (!isConnected) {
      const token = sessionStorage.getItem('auth_token');
      if (token) {
        console.log('🔌 钱包已断开，清除 token');
        clearToken();
      }
    }
  }, [isConnected]);

  // 从 URL hash 同步 tab，并监听 hashchange（浏览器前进/后退、刷新）
  useEffect(() => {
    const tab = hashToTab(window.location.hash);
    if (!window.location.hash && tab === 'home') {
      window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}#home`);
    }
    const onHashChange = () => setCurrentTab(hashToTab(window.location.hash));
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const handleTabChange = useCallback((tab: string) => {
    setCurrentTab(tab);
    const newHash = `#${tab}`;
    if (window.location.hash !== newHash) {
      window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}${newHash}`);
    }
  }, []);

  const renderContent = () => {
    switch (currentTab) {
      case "home":
        return <StakeView />;
      case "wallet":
        return isConnected ? <WalletView /> : <ConnectWalletGate />;
      case "withdraw":
        return isConnected ? <WithdrawView /> : <ConnectWalletGate />;
      case "leader":
        return isConnected ? <LeaderRewardView /> : <ConnectWalletGate />;
      case "supernode":
        return isConnected ? <SuperNodeView /> : <ConnectWalletGate />;
      case "team":
        return isConnected ? <TeamView /> : <ConnectWalletGate />;
      case "invite":
        return isConnected ? <InviteView /> : <ConnectWalletGate />;
      case "help-center":
        return <HelpCenterView />;
      case "orders":
        return isConnected ? <StakeOrdersView /> : <ConnectWalletGate />;
      case "about":
        return <AboutView />;
      case "plasma-one":
        return <PlasmaOneView />;
      case "news":
        return <NewsView />;
      default:
        return <StakeView />;
    }
  };

  return (
    <>
      <NetworkGuard />
      <MainLayout
        currentTab={currentTab}
        onTabChange={handleTabChange}
        onOpenCustomerService={handleOpenCustomerService}
      >
        {renderContent()}
      </MainLayout>
      <Dialog open={showCustomerService} onOpenChange={setShowCustomerService}>
        {/* Dialog 自带标题栏关闭按钮，内容区仅放 Crisp iframe */}
        <DialogContent className="w-fit max-w-[calc(100vw-2rem)] overflow-hidden p-0">
          <div
            style={{
              width: `min(${CRISP_IFRAME_WIDTH}, calc(100vw - 2rem))`,
              height: CRISP_IFRAME_HEIGHT,
            }}
          >
            {crispReady && (
              <iframe
                id={crispIframeId}
                title={CRISP_CHAT_TITLE}
                src={CRISP_CHAT_URL}
                width={CRISP_IFRAME_WIDTH}
                height={CRISP_IFRAME_HEIGHT}
                className="block h-full w-full border-0"
                allow="clipboard-write"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
      <GlobalLoading isLoading={isLoading} />
      <Toaster />
    </>
  );
}
