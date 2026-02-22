import type { ReactNode } from "react";
import { useTranslation } from 'react-i18next';
import { Header } from "./Header";

interface MainLayoutProps {
  children: ReactNode;
  currentTab: string;
  onTabChange: (tab: string) => void;
  onOpenCustomerService?: () => void;
}

export function MainLayout({ children, currentTab, onTabChange, onOpenCustomerService }: MainLayoutProps) {
  const { t } = useTranslation();
  
  const getPageTitle = () => {
    switch(currentTab) {
      case 'team': return t('nav.team');
      case 'invite': return t('nav.invite');
      case 'help-center': return t('nav.helpCenter');
      case 'orders': return t('nav.orders');
      case 'plasma-one': return t('nav.plasmaOne');
      case 'supernode': return t('nav.supernode');
      case 'news': return t('news.title');
      default: return undefined;
    }
  };

  const handleBack = () => {
    onTabChange('home');
  };

  // 检查是否在通知页面（包括列表和详情）
  const isNewsPage = currentTab === 'news';

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <Header 
        title={getPageTitle()} 
        showBack={isNewsPage} 
        onBack={handleBack}
        currentTab={currentTab}
        onTabChange={onTabChange}
        onOpenCustomerService={onOpenCustomerService}
      />
      <main className="flex-1 min-h-0 container px-4 pb-6 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
