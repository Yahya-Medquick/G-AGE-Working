import type { ReactNode } from 'react';

export function Badge({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <span className={`inline-flex min-h-6 items-center rounded-pill border border-border bg-surface-2 px-2 text-xs font-medium leading-none text-muted ${className}`}>
      {children}
    </span>
  );
}

export function VariantBadge({
  variant,
  label,
}: {
  variant: 'pk' | 'global';
  label: string;
}) {
  return (
    <Badge aria-label={label} data-variant={variant}>
      {label}
    </Badge>
  );
}
