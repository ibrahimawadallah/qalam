'use client';

import React, { ErrorInfo, ReactNode } from 'react';
import { useTranslations } from 'next-intl';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default function ErrorBoundary({ children }: Props) {
  const t = useTranslations('errorBoundary');
  const [hasError, setHasError] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  if (error) {
    console.error('Error caught by boundary:', error);
  }

  if (hasError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center text-foreground">
          <h1 className="text-2xl font-bold mb-2">{t('title')}</h1>
          <p className="text-muted-foreground mb-4">{t('description')}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 active:scale-95 transition-all touch-manipulation"
          >
            {t('refresh')}
          </button>
        </div>
      </div>
    );
  }

  return children;
}