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
import { Button } from '@/components/ui/button';
import { Toaster } from '@/components/ui/sonner';
import { GlobalLoading } from '@/components/ui/GlobalLoading';
import { useWalletAuth } from '@/hooks/useWalletAuth';
import { useLoadingStore } from '@/store/loadingStore';
import { clearToken } from '@/lib/api';
import { Wallet, X } from 'lucide-react';

const VOCECHAT_URL = "http://67.215.229.143:3009";
const VALID_TABS = ['home', 'wallet', 'withdraw', 'leader', 'supernode', 'team', 'invite', 'help-center', 'orders', 'about', 'plasma-one'] as const;

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
  const tab = hash.replace(/^#/, '').toLowerCase() || 'home';
  return VALID_TABS.includes(tab as typeof VALID_TABS[number]) ? tab : 'home';
}

export default function App() {
  const { t } = useTranslation();
  const [currentTab, setCurrentTab] = useState(() => hashToTab(window.location.hash));
  const [showVoceChat, setShowVoceChat] = useState(false);
  const { isConnected } = useAccount();
  const { isLoading } = useLoadingStore();

  // 自动登录：钱包连接后自动触发登录
  useWalletAuth({
    autoLogin: true,
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
      const token = localStorage.getItem('auth_token');
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
      default:
        return <StakeView />;
    }
  };

  return (
    <>
      <MainLayout
        currentTab={currentTab}
        onTabChange={handleTabChange}
        onOpenCustomerService={() => setShowVoceChat(true)}
      >
        {renderContent()}
      </MainLayout>
      {showVoceChat && (
        <div className="fixed inset-0 z-[100] flex flex-col bg-background">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30 shrink-0">
            <span className="text-sm font-semibold text-foreground">{t('nav.customerService')}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 shrink-0"
              onClick={() => setShowVoceChat(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          <iframe
            title={t('nav.customerService')}
            src={VOCECHAT_URL}
            className="flex-1 w-full min-h-0 border-0"
          />
        </div>
      )}
      <GlobalLoading isLoading={isLoading} />
      <Toaster />
    </>
  );
}
