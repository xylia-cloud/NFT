import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { StakeView } from '@/components/features/home/StakeView';
import { WalletView } from '@/components/features/wallet/WalletView';
import { ProfileView } from '@/components/features/profile/ProfileView';
import { TeamView } from '@/components/features/team/TeamView';
import { InviteView } from '@/components/features/invite/InviteView';
import { ChangePasswordView } from '@/components/features/profile/ChangePasswordView';

export default function App() {
  const [currentTab, setCurrentTab] = useState("home");

  const renderContent = () => {
    switch (currentTab) {
      case "home":
        return <StakeView />;
      case "wallet":
        return <WalletView />;
      case "profile":
        return <ProfileView onNavigate={setCurrentTab} />;
      case "team":
        return <TeamView />;
      case "invite":
        return <InviteView />;
      case "change-password":
        return <ChangePasswordView onBack={() => setCurrentTab('profile')} />;
      default:
        return <StakeView />;
    }
  };

  return (
    <MainLayout currentTab={currentTab} onTabChange={setCurrentTab}>
      {renderContent()}
    </MainLayout>
  );
}
