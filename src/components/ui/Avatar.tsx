export function Avatar({
  initials,
  label,
  className = '',
}: {
  initials: string;
  label: string;
  className?: string;
}) {
  return (
    <span
      role="img"
      aria-label={label}
      className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-pill bg-surface-2 text-sm font-semibold text-muted ${className}`}
    >
      {initials}
    </span>
  );
}
