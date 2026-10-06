import type { ReactNode } from 'react';

export function Callout({
  kind,
  title,
  children,
}: {
  kind: 'equation' | 'examtip';
  title: string;
  children: ReactNode;
}) {
  const tint = kind === 'equation'
    ? 'border-l-success bg-[var(--tint-equation)] text-[var(--tint-equation-text)]'
    : 'border-l-warning bg-[var(--tint-examtip)] text-[var(--tint-examtip-text)]';
  return (
    <aside className={`my-4 rounded-control border-l-4 px-4 py-3 ${tint}`}>
      <h3 className="mb-1 text-sm font-semibold">{title}</h3>
      <div className="text-base leading-relaxed">{children}</div>
    </aside>
  );
}
