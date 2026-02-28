import { useState, useEffect, useCallback } from 'react';
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
import { Toaster } from '@/components/ui/sonner';
import { GlobalLoading } from '@/components/ui/GlobalLoading';
import { NetworkGuard } from '@/components/NetworkGuard';
import { useWalletAuth } from '@/hooks/useWalletAuth';
import { useLoadingStore } from '@/store/loadingStore';
import { clearToken, getUserInfo, createVoceChatToken } from '@/lib/api';
import { Wallet, X, Loader2 } from 'lucide-react';

const CUSTOMER_SERVICE_BASE_URL = "https://service.plasma.email";
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
  const { t } = useTranslation();
  const [currentTab, setCurrentTab] = useState(() => hashToTab(window.location.hash));
  const [showCustomerService, setShowCustomerService] = useState(false);
  const [voceChatUrl, setVoceChatUrl] = useState<string>('');
  const [isLoadingVoceChat, setIsLoadingVoceChat] = useState(false);
  const { isConnected } = useAccount();
  const { isLoading } = useLoadingStore();

  // 打开客服对话框
  const handleOpenCustomerService = async () => {
    setShowCustomerService(true);
    setIsLoadingVoceChat(true);
    
    try {
      // 获取当前登录用户信息
      const userInfo = getUserInfo();
      
      if (!userInfo) {
        console.warn('⚠️ 用户未登录，使用默认 VoceChat URL');
        setVoceChatUrl(CUSTOMER_SERVICE_BASE_URL);
        setIsLoadingVoceChat(false);
        return;
      }
      
      console.log('🔑 创建 VoceChat token...');
      console.log('👤 用户信息:', { uid: userInfo.uid, username: userInfo.username });
      
      // 使用用户 ID 和用户名创建 VoceChat token
      const userid = userInfo.uid;
      let username = userInfo.username || userInfo.wallet_address;
      
      // 如果用户名是钱包地址（以0x开头且长度大于20），则缩短显示
      if (username && username.startsWith('0x') && username.length > 20) {
        username = `${username.slice(0, 6)}...${username.slice(-4)}`;
        console.log('📝 钱包地址已缩短:', username);
      }
      
      const token = await createVoceChatToken(userid, username);
      console.log('✅ VoceChat token 创建成功');
      
      // 构建自动登录 URL
      const autoLoginUrl = `${CUSTOMER_SERVICE_BASE_URL}/#/oauth/${token}`;
      setVoceChatUrl(autoLoginUrl);
      console.log('🔗 VoceChat 自动登录 URL:', autoLoginUrl);
    } catch (error) {
      console.error('❌ 创建 VoceChat token 失败:', error);
      // 如果创建 token 失败，使用默认 URL
      setVoceChatUrl(CUSTOMER_SERVICE_BASE_URL);
    } finally {
      setIsLoadingVoceChat(false);
    }
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
      {showCustomerService && (
        <div className="fixed inset-0 z-[100] flex flex-col bg-background">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30 shrink-0">
            <span className="text-sm font-semibold text-foreground">{t('nav.customerService')}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 shrink-0"
              onClick={() => {
                setShowCustomerService(false);
                setVoceChatUrl(''); // 清除 URL，下次重新获取
              }}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          {isLoadingVoceChat ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
              </div>
            </div>
          ) : (
            <iframe
              title={t('nav.customerService')}
              src={voceChatUrl}
              className="flex-1 w-full min-h-0 border-0"
            />
          )}
        </div>
      )}
      <GlobalLoading isLoading={isLoading} />
      <Toaster />
    </>
  );
}
