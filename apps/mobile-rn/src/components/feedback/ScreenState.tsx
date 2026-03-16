import React from 'react';
import { LoadingOverlay } from './LoadingOverlay';
import { ErrorCard } from '../cards/ErrorCard';

interface ScreenStateProps {
  loading?: boolean;
  error?: unknown;
  empty?: boolean;
  emptyComponent?: React.ReactNode;
  errorComponent?: React.ReactNode;
  children: React.ReactNode;
}

export function ScreenState({
  loading,
  error,
  empty,
  emptyComponent,
  errorComponent,
  children,
}: ScreenStateProps) {
  if (loading) return <LoadingOverlay />;
  if (error) return errorComponent ?? <ErrorCard message="Something went wrong." />;
  if (empty) return <>{emptyComponent}</>;
  return <>{children}</>;
}

