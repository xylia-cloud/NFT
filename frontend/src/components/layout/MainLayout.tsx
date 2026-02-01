import { ReactNode } from "react";
import { Header } from "./Header";
import { TabBar } from "./TabBar";

interface MainLayoutProps {
  children: ReactNode;
  currentTab: string;
  onTabChange: (tab: string) => void;
}

export function MainLayout({ children, currentTab, onTabChange }: MainLayoutProps) {
  // 判断是否为二级页面
  const isSecondaryPage = ['team', 'invite', 'change-password', 'help-center'].includes(currentTab);
  
  const getPageTitle = () => {
    switch(currentTab) {
      case 'team': return '我的团队';
      case 'invite': return '邀请好友';
      case 'change-password': return '修改提现密码';
      case 'help-center': return '帮助中心';
      default: return undefined;
    }
  };

  const handleBack = () => {
    onTabChange('profile');
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <Header 
        title={getPageTitle()} 
        showBack={isSecondaryPage} 
        onBack={handleBack}
      />
      <main className="flex-1 container px-4 pb-6 overflow-y-auto">
        {children}
      </main>
      {!isSecondaryPage && <TabBar currentTab={currentTab} onTabChange={onTabChange} />}
    </div>
  );
}
