import { useState, useEffect, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { MainLayout } from '@/components/layout/MainLayout';
import { StakeView } from '@/components/features/home/StakeView';
import { WalletView } from '@/components/features/wallet/WalletView';
import { ProfileView } from '@/components/features/profile/ProfileView';
import { TeamView } from '@/components/features/team/TeamView';
import { InviteView } from '@/components/features/invite/InviteView';
import { ChangePasswordView } from '@/components/features/profile/ChangePasswordView';
import { HelpCenterView } from '@/components/features/profile/HelpCenterView';
import { Button } from '@/components/ui/button';
import { Wallet } from 'lucide-react';

const VALID_TABS = ['home', 'wallet', 'profile', 'team', 'invite', 'change-password', 'help-center'] as const;

function ConnectWalletGate() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 space-y-6">
      <div className="rounded-2xl bg-primary/10 p-6 border border-primary/20">
        <Wallet className="h-16 w-16 text-primary mx-auto mb-4" />
        <h2 className="text-lg font-semibold text-foreground mb-2">连接钱包以访问</h2>
        <p className="text-sm text-muted-foreground mb-6 max-w-sm">
          请先连接您的钱包（OKX、TokenPocket、MetaMask 等）以使用 PLASMA 平台的完整功能
        </p>
        <ConnectButton.Custom>
          {({ openConnectModal }) => (
            <Button onClick={openConnectModal} className="gap-2 rounded-xl">
              <Wallet className="h-4 w-4" />
              连接钱包
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
  const [currentTab, setCurrentTab] = useState(() => hashToTab(window.location.hash));
  const { isConnected } = useAccount();

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
    if (!isConnected) {
      return <ConnectWalletGate />;
    }
    switch (currentTab) {
      case "home":
        return <StakeView />;
      case "wallet":
        return <WalletView />;
      case "profile":
        return <ProfileView onNavigate={handleTabChange} />;
      case "team":
        return <TeamView />;
      case "invite":
        return <InviteView />;
      case "change-password":
        return <ChangePasswordView onBack={() => handleTabChange('profile')} />;
      case "help-center":
        return <HelpCenterView />;
      default:
        return <StakeView />;
    }
  };

  return (
    <MainLayout currentTab={currentTab} onTabChange={handleTabChange}>
      {renderContent()}
    </MainLayout>
  );
}
