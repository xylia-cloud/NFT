/**
 * 错误码测试页面
 * 用于快速测试所有错误码的显示效果
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ErrorAlert, ErrorToast } from '@/components/ui/error-alert';
import { ApiError } from '@/lib/api';
import { ERROR_CODES, ERROR_CATEGORIES } from '@/lib/errorCodes';
import { useApiError } from '@/hooks/useApiError';

export function ErrorCodeTestPage() {
  const [showToast, setShowToast] = useState(false);
  const { error, handleError, clearError } = useApiError();

  const testError = (code: number) => {
    const errorInfo = ERROR_CODES[code];
    if (errorInfo) {
      handleError(new ApiError(code, errorInfo.message, errorInfo.category));
    }
  };

  const errorsByCategory = Object.entries(ERROR_CATEGORIES).map(([key, category]) => ({
    name: key,
    category,
    errors: Object.values(ERROR_CODES).filter(e => e.category === category)
  }));

  return (
    <div className="container mx-auto p-6 space-y-6">
      {showToast && error.message && (
        <ErrorToast
          code={error.code}
          message={error.message}
          category={error.category}
          onClose={() => {
            setShowToast(false);
            clearError();
          }}
        />
      )}

      <div>
        <h1 className="text-3xl font-bold mb-2">错误码测试页面</h1>
        <p className="text-muted-foreground">点击按钮测试不同的错误提示效果</p>
      </div>

      {error.message && !showToast && (
        <ErrorAlert
          code={error.code}
          message={error.message}
          category={error.category}
          onClose={clearError}
        />
      )}

      {errorsByCategory.map(({ name, category, errors }) => (
        errors.length > 0 && (
          <Card key={category}>
            <CardHeader>
              <CardTitle>{name} ({errors.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {errors.map(err => (
                  <div key={err.code} className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 justify-start text-left"
                      onClick={() => testError(err.code)}
                    >
                      <span className="font-mono text-xs mr-2">{err.code}</span>
                      <span className="truncate text-xs">{err.message}</span>
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )
      ))}
    </div>
  );
}
