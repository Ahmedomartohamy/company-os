import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/cn';

type Variant = 'primary' | 'secondary' | 'accent' | 'ghost' | 'destructive' | 'outline' | 'sidebar';
type Size = 'sm' | 'md' | 'lg';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { className, variant = 'accent', size = 'md', loading, children, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center rounded-xl font-medium transition-colors focus:outline-none disabled:opacity-60',
        size === 'sm' && 'h-9 px-3 text-sm',
        size === 'md' && 'h-10 px-4 text-sm',
        size === 'lg' && 'h-12 px-6 text-base',
        variant === 'accent' && 'bg-accent text-white hover:bg-accent-600',
        variant === 'primary' && 'bg-brand text-white hover:bg-brand-700',
        variant === 'secondary' && 'bg-surface text-brand border border-brand/20 hover:bg-brand/5',
        variant === 'ghost' && 'bg-transparent hover:bg-black/5',
        variant === 'outline' && 'border border-black/10 hover:bg-black/5',
        variant === 'destructive' && 'bg-red-600 text-white hover:bg-red-700',
        variant === 'sidebar' && 'text-white bg-white/10 hover:bg-white/20 border border-white/20',
        className,
      )}
      {...props}
    >
      {loading ? '...' : children}
    </button>
  );
});

export { Button };
export default Button;
