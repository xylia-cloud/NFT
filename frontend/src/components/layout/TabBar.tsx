import { Wallet, Home, User } from "lucide-react";

interface TabBarProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
}

export function TabBar({ currentTab, onTabChange }: TabBarProps) {
  const tabs = [
    { id: "home", label: "首页", icon: Home },
    { id: "wallet", label: "钱包", icon: Wallet },
    { id: "profile", label: "我的", icon: User },
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
              <span className="text-xs font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
