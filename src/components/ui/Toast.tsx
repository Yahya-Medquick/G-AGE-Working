import type { ReactNode } from 'react';

export function Toast({
  kind = 'status',
  message,
  action,
}: {
  kind?: 'status' | 'error';
  message: string;
  action?: ReactNode;
}) {
  return (
    <div
      role={kind === 'error' ? 'alert' : 'status'}
      aria-live={kind === 'error' ? 'assertive' : 'polite'}
      className={[
        'flex max-w-sm items-center gap-3 rounded-tile border bg-surface px-4 py-3 text-sm text-text shadow-popover',
        kind === 'error' ? 'border-danger' : 'border-border',
      ].join(' ')}
    >
      <span className="min-w-0 flex-1">{message}</span>
      {action}
    </div>
  );
}
