import { useState, useEffect } from "react";
import { useTranslation } from 'react-i18next';
import { Bell, Loader2, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getNewsList, type NewsItem } from "@/lib/api";
import { cn } from "@/lib/utils";
import { NewsDetailView } from "./NewsDetailView";

export function NewsView() {
  const { t } = useTranslation();
  const [newsList, setNewsList] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [selectedNewsId, setSelectedNewsId] = useState<string | null>(null);

  // 从URL参数中读取通知ID
  useEffect(() => {
    const handleHashChange = () => {
      const params = new URLSearchParams(window.location.hash.split('?')[1]);
      const id = params.get('id');
      if (id) {
        setSelectedNewsId(id);
      } else if (window.location.hash === '#news') {
        setSelectedNewsId(null);
      }
    };
    
    // 初始加载时检查
    handleHashChange();
    
    // 监听hash变化
    window.addEventListener('hashchange', handleHashChange);
    
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  useEffect(() => {
    // 如果显示详情页，不需要加载列表
    if (selectedNewsId) return;
    
    const fetchNews = async () => {
      try {
        setLoading(true);
        const data = await getNewsList({ page: page.toString() });
        
        if (page === 1) {
          setNewsList(data.list);
        } else {
          setNewsList(prev => [...prev, ...data.list]);
        }
        
        // 如果返回的数据少于预期，说明没有更多了
        if (data.list.length < 10) {
          setHasMore(false);
        }
        
        console.log('✅ 通知列表获取成功:', data);
      } catch (err) {
        console.error('❌ 获取通知列表失败:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchNews();
  }, [page, selectedNewsId]);

  const loadMore = () => {
    if (!loading && hasMore) {
      setPage(prev => prev + 1);
    }
  };

  // 如果选中了通知，显示详情页
  if (selectedNewsId) {
    return (
      <NewsDetailView 
        newsId={selectedNewsId} 
        onBack={() => {
          window.location.hash = '#news';
        }} 
      />
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-700 pb-20 pt-4 relative max-w-4xl mx-auto">
      {/* 通知列表 */}
      <div className="space-y-3">
        {loading && page === 1 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin mb-3" />
            <p className="text-sm">{t('common.loading')}</p>
          </div>
        ) : newsList.length > 0 ? (
          <>
            {newsList.map((news) => (
              <Card
                key={news.id}
                onClick={() => {
                  window.location.hash = `#news?id=${news.id}`;
                }}
                className="border border-border/70 shadow-none bg-card/30 hover:bg-card/50 transition-all cursor-pointer"
              >
                <CardContent className="p-4 flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {!news.is_read && (
                        <Badge variant="destructive" className="h-5 px-2 text-[10px] flex-shrink-0">
                          {t('home.unread')}
                        </Badge>
                      )}
                      <p className={cn(
                        "text-sm font-medium leading-relaxed line-clamp-1",
                        !news.is_read ? "text-foreground" : "text-muted-foreground"
                      )}>
                        {news.title}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {news.addtime}
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                </CardContent>
              </Card>
            ))}
            
            {/* 加载更多按钮 */}
            {hasMore && (
              <div className="flex justify-center pt-4">
                <button
                  onClick={loadMore}
                  disabled={loading}
                  className="px-6 py-2 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {t('common.loading')}
                    </span>
                  ) : (
                    t('common.more')
                  )}
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground rounded-xl border border-dashed border-border/70">
            <Bell className="h-12 w-12 opacity-20 mb-3" />
            <p className="text-sm">{t('news.noNews')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
