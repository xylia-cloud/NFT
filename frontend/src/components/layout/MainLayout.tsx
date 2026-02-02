import type { ReactNode } from "react";
import { Header } from "./Header";

interface MainLayoutProps {
  children: ReactNode;
  currentTab: string;
  onTabChange: (tab: string) => void;
  onOpenCustomerService?: () => void;
}

export function MainLayout({ children, currentTab, onTabChange, onOpenCustomerService }: MainLayoutProps) {
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
    onTabChange('home');
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <Header 
        title={getPageTitle()} 
        showBack={isSecondaryPage} 
        onBack={handleBack}
        currentTab={currentTab}
        onTabChange={onTabChange}
        onOpenCustomerService={onOpenCustomerService}
      />
      <main className="flex-1 container px-4 pb-6 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
