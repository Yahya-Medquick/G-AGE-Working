import { LoaderCircle } from 'lucide-react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'icon' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

type ButtonBaseProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> & {
  children: ReactNode;
  loading?: boolean;
  size?: ButtonSize;
};

type ButtonProps = ButtonBaseProps & (
  | { variant: 'icon'; 'aria-label': string }
  | { variant?: Exclude<ButtonVariant, 'icon'>; 'aria-label'?: string }
);

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'border border-transparent bg-accent text-on-accent hover:bg-accent-hover shadow-lift',
  secondary: 'border border-border bg-surface text-text hover:bg-surface-2',
  ghost: 'border border-transparent bg-transparent text-text-2 hover:bg-surface-2 hover:text-text',
  icon: 'border border-transparent bg-transparent text-text-2 hover:bg-surface-2 hover:text-text',
  danger: 'border border-transparent bg-danger text-on-accent dark:text-bg hover:opacity-90',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'min-h-11 gap-2 px-3 text-sm md:min-h-9',
  md: 'min-h-11 gap-2 px-4 text-base',
  lg: 'min-h-12 gap-2 px-5 text-base',
};

export function Button({
  variant = 'secondary',
  size = 'md',
  loading = false,
  disabled,
  className = '',
  children,
  ...props
}: ButtonProps) {
  const iconSize = size === 'sm'
    ? 'h-11 w-11 md:h-9 md:w-9'
    : size === 'lg'
      ? 'h-12 w-12'
      : 'h-11 w-11 lg:h-9 lg:w-9';
  return (
    <button
      {...props}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={[
        'inline-flex shrink-0 items-center justify-center rounded-control font-medium transition-[background-color,color,transform] duration-[var(--dur-fast)] ease-[var(--ease-out)]',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50',
        variantClasses[variant],
        variant === 'icon' ? iconSize : sizeClasses[size],
        className,
      ].filter(Boolean).join(' ')}
    >
      {loading && <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}
