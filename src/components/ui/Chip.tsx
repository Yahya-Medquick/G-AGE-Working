import type { ButtonHTMLAttributes, ReactNode } from 'react';

type ChipProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> & {
  children: ReactNode;
  selected?: boolean;
};

export function Chip({ children, selected = false, className = '', ...props }: ChipProps) {
  return (
    <button
      {...props}
      type={props.type || 'button'}
      aria-pressed={selected}
      className={[
        'inline-flex min-h-11 items-center justify-center rounded-pill border px-3 text-sm font-medium transition-colors duration-[var(--dur-fast)]',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
        selected
          ? 'border-transparent bg-accent-soft text-accent-text'
          : 'border-border bg-surface text-muted hover:bg-surface-2 hover:text-text',
        className,
      ].join(' ')}
    >
      {children}
    </button>
  );
}
