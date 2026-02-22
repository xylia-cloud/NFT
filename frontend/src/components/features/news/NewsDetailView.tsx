import { useState, useEffect } from "react";
import { useTranslation } from 'react-i18next';
import { Loader2, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getNewsDetail, type NewsDetail } from "@/lib/api";

interface NewsDetailViewProps {
  newsId: string;
  onBack: () => void;
}

export function NewsDetailView({ newsId, onBack }: NewsDetailViewProps) {
  const { t } = useTranslation();
  const [newsDetail, setNewsDetail] = useState<NewsDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNewsDetail = async () => {
      try {
        setLoading(true);
        const data = await getNewsDetail({ id: newsId });
        setNewsDetail(data.detail);
        console.log('✅ 通知详情获取成功:', data.detail);
      } catch (err) {
        console.error('❌ 获取通知详情失败:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchNewsDetail();
  }, [newsId]);

  if (loading) {
    return (
      <div className="space-y-4 animate-in fade-in duration-700 pb-20 pt-4 relative max-w-4xl mx-auto">
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin mb-3" />
          <p className="text-sm">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (!newsDetail) {
    return (
      <div className="space-y-4 animate-in fade-in duration-700 pb-20 pt-4 relative max-w-4xl mx-auto">
        <Card className="border border-border/70 shadow-none bg-card/30">
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">{t('news.notFound')}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-700 pb-20 pt-4 relative max-w-4xl mx-auto">
      {/* 通知详情 */}
      <Card className="border border-border/70 shadow-none bg-card/30">
        <CardContent className="p-6">
          {/* 标题 */}
          <h1 className="text-2xl font-bold text-foreground mb-3">
            {newsDetail.title}
          </h1>

          {/* 时间 */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6 pb-6 border-b border-border/50">
            <Calendar className="h-4 w-4" />
            <span>{newsDetail.addtime}</span>
          </div>

          {/* 内容 */}
          <div 
            className="prose prose-sm max-w-none dark:prose-invert prose-headings:text-foreground prose-p:text-foreground prose-a:text-primary prose-strong:text-foreground prose-ul:text-foreground prose-ol:text-foreground"
            dangerouslySetInnerHTML={{ __html: newsDetail.content }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
