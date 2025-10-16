'use client';

import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  className?: string;
  text?: string;
}

export default function LoadingSpinner({ 
  size = 'md', 
  variant = 'default',
  className = '',
  text
}: LoadingSpinnerProps) {
  const sizeClasses = {
    xs: 'h-3 w-3',
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12',
  };

  const variantClasses = {
    default: 'border-primary',
    primary: 'border-primary',
    secondary: 'border-secondary',
    success: 'border-green-500',
    warning: 'border-yellow-500',
    error: 'border-red-500',
  };

  return (
    <div className={cn('flex flex-col items-center justify-center gap-2', className)}>
      <div 
        className={cn(
          'animate-spin rounded-full border-2 border-transparent',
          sizeClasses[size],
          variantClasses[variant]
        )}
        style={{
          borderTopColor: 'currentColor',
          borderRightColor: 'currentColor',
        }}
      />
      {text && (
        <p className="text-sm text-muted-foreground animate-pulse">
          {text}
        </p>
      )}
    </div>
  );
}
