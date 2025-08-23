import { cn } from '@/lib/cn';
import type { ReactNode } from 'react';

type BadgeVariant = 'default' | 'secondary' | 'success' | 'destructive' | 'outline';

interface BadgeProps {
  variant?: BadgeVariant;
  children: ReactNode;
  className?: string;
}

export default function Badge({ variant = 'default', children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        variant === 'default' && 'bg-gray-100 text-gray-800',
        variant === 'secondary' && 'bg-blue-100 text-blue-800',
        variant === 'success' && 'bg-green-100 text-green-800',
        variant === 'destructive' && 'bg-red-100 text-red-800',
        variant === 'outline' && 'border border-gray-200 text-gray-600',
        className,
      )}
    >
      {children}
    </span>
  );
}

export { Badge };
