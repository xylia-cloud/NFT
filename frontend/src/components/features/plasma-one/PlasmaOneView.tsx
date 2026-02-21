import plasmaOneImage from "@/assets/images/Plasma One.webp";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from 'react-i18next';

export function PlasmaOneView() {
  const { t } = useTranslation();
  
  const handleOpenLink = () => {
    window.open('https://www.plasma.to/one?r=0', '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="-mx-4 -mb-6 flex flex-col items-center justify-center min-h-[calc(100vh-8rem)]">
      <div className="w-full space-y-6">
        {/* 图片容器 */}
        <div className="w-full">
          <img 
            src={plasmaOneImage} 
            alt="Plasma One" 
            className="w-full h-auto object-cover"
          />
        </div>

        {/* 官网链接按钮 */}
        <div className="flex justify-center px-4 py-8">
          <Button
            onClick={handleOpenLink}
            size="lg"
            className="gap-2 rounded-xl px-8 py-6 text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
          >
            <span>{t('plasmaOne.visitWebsite')}</span>
            <ExternalLink className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
