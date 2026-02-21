import { useEffect } from 'react';
import { useLoadingStore } from '@/store/loadingStore';

/**
 * 全局 Loading Hook
 * 
 * 使用方式：
 * 1. 简单使用：const { showLoading, hideLoading } = useGlobalLoading();
 * 2. 自动管理：useGlobalLoading(isLoading); // 根据 isLoading 状态自动显示/隐藏
 */
export function useGlobalLoading(autoLoading?: boolean) {
  const { showLoading, hideLoading, setLoading } = useLoadingStore();

  useEffect(() => {
    if (autoLoading !== undefined) {
      setLoading(autoLoading);
    }
  }, [autoLoading, setLoading]);

  return {
    showLoading,
    hideLoading,
    setLoading,
  };
}

/**
 * 异步操作 Loading 包装器
 * 
 * 使用方式：
 * const result = await withLoading(async () => {
 *   return await someAsyncOperation();
 * });
 */
export async function withLoading<T>(
  asyncFn: () => Promise<T>
): Promise<T> {
  const { showLoading, hideLoading } = useLoadingStore.getState();
  
  try {
    showLoading();
    return await asyncFn();
  } finally {
    hideLoading();
  }
}
