export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`block animate-pulse rounded-control bg-surface-2 motion-reduce:animate-none ${className}`}
    />
  );
}
