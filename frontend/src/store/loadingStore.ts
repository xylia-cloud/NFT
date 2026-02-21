import { create } from 'zustand';

interface LoadingState {
  isLoading: boolean;
  loadingCount: number;
  showLoading: () => void;
  hideLoading: () => void;
  setLoading: (loading: boolean) => void;
}

export const useLoadingStore = create<LoadingState>((set) => ({
  isLoading: false,
  loadingCount: 0,
  
  showLoading: () =>
    set((state) => ({
      loadingCount: state.loadingCount + 1,
      isLoading: true,
    })),
  
  hideLoading: () =>
    set((state) => {
      const newCount = Math.max(0, state.loadingCount - 1);
      return {
        loadingCount: newCount,
        isLoading: newCount > 0,
      };
    }),
  
  setLoading: (loading: boolean) =>
    set({
      isLoading: loading,
      loadingCount: loading ? 1 : 0,
    }),
}));
