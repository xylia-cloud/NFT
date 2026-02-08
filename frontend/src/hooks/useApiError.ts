/**
 * API 错误处理 Hook
 * 提供统一的错误处理和提示功能
 */

import { useState, useCallback } from 'react';
import { ApiError } from '@/lib/api';
import { getErrorMessage, isAuthError, isInsufficientBalanceError, isAccountFrozenError } from '@/lib/errorCodes';

export interface ErrorState {
  code: number | null;
  message: string | null;
  category: string | null;
}

export interface UseApiErrorReturn {
  error: ErrorState;
  setError: (error: ApiError | Error | null) => void;
  clearError: () => void;
  handleError: (error: unknown) => void;
  isError: boolean;
}

/**
 * API 错误处理 Hook
 * @param onAuthError 认证错误回调（可选）
 * @param onBalanceError 余额不足错误回调（可选）
 * @param onFrozenError 账号冻结错误回调（可选）
 */
export function useApiError(
  onAuthError?: () => void,
  onBalanceError?: () => void,
  onFrozenError?: () => void
): UseApiErrorReturn {
  const [error, setErrorState] = useState<ErrorState>({
    code: null,
    message: null,
    category: null,
  });

  const setError = useCallback(
    (err: ApiError | Error | null) => {
      if (!err) {
        setErrorState({ code: null, message: null, category: null });
        return;
      }

      if (err instanceof ApiError) {
        setErrorState({
          code: err.code,
          message: err.message,
          category: err.category,
        });

        // 触发特定错误回调
        if (isAuthError(err.code) && onAuthError) {
          onAuthError();
        } else if (isInsufficientBalanceError(err.code) && onBalanceError) {
          onBalanceError();
        } else if (isAccountFrozenError(err.code) && onFrozenError) {
          onFrozenError();
        }
      } else {
        setErrorState({
          code: 999,
          message: err.message || '未知错误',
          category: 'common',
        });
      }
    },
    [onAuthError, onBalanceError, onFrozenError]
  );

  const clearError = useCallback(() => {
    setErrorState({ code: null, message: null, category: null });
  }, []);

  const handleError = useCallback(
    (err: unknown) => {
      if (err instanceof ApiError) {
        setError(err);
      } else if (err instanceof Error) {
        setError(err);
      } else {
        setError(new Error('未知错误'));
      }
    },
    [setError]
  );

  return {
    error,
    setError,
    clearError,
    handleError,
    isError: error.code !== null,
  };
}

/**
 * 简化版错误处理 Hook（仅返回错误消息）
 */
export function useSimpleError() {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleError = useCallback((err: unknown) => {
    if (err instanceof ApiError) {
      setErrorMessage(err.message);
    } else if (err instanceof Error) {
      setErrorMessage(err.message);
    } else {
      setErrorMessage('未知错误');
    }
  }, []);

  const clearError = useCallback(() => {
    setErrorMessage(null);
  }, []);

  return {
    errorMessage,
    handleError,
    clearError,
    isError: errorMessage !== null,
  };
}
