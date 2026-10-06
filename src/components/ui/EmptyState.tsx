import type { ReactNode } from 'react';

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <section className="mx-auto flex max-w-md flex-col items-center gap-3 px-6 py-12 text-center" aria-label={title}>
      {icon && <div className="text-muted" aria-hidden="true">{icon}</div>}
      <h2 className="text-lg font-semibold leading-tight text-text">{title}</h2>
      {description && <p className="text-base leading-relaxed text-muted">{description}</p>}
      {action}
    </section>
  );
}
