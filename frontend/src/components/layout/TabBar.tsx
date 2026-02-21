import { Wallet, Home, User } from "lucide-react";
import { useTranslation } from 'react-i18next';

interface TabBarProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
}

export function TabBar({ currentTab, onTabChange }: TabBarProps) {
  const { t } = useTranslation();
  
  const tabs = [
    { id: "home", labelKey: "nav.home", icon: Home },
    { id: "wallet", labelKey: "nav.wallet", icon: Wallet },
    { id: "profile", labelKey: "common.profile", icon: User },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 border-t border-border bg-background/90 backdrop-blur-md pb-safe">
      <div className="flex justify-around items-center h-16">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-xs font-medium">{t(tab.labelKey)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
