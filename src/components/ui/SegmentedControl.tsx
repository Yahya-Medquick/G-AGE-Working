import type { KeyboardEvent } from 'react';

export type SegmentedOption<T extends string> = {
  value: T;
  label: string;
};

export function SegmentedControl<T extends string>({
  label,
  value,
  options,
  onChange,
  className = '',
}: {
  label: string;
  value: T;
  options: SegmentedOption<T>[];
  onChange: (value: T) => void;
  className?: string;
}) {
  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const nextIndex = event.key === 'Home'
      ? 0
      : event.key === 'End'
        ? options.length - 1
        : (index + (event.key === 'ArrowRight' ? 1 : -1) + options.length) % options.length;
    const nextValue = options[nextIndex]?.value;
    if (nextValue) onChange(nextValue);
    const group = event.currentTarget.parentElement;
    group?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[nextIndex]?.focus();
  };

  return (
    <div role="tablist" aria-label={label} className={`inline-flex gap-1 rounded-control bg-surface-2 p-1 ${className}`}>
      {options.map((option, index) => (
        <button
          key={option.value}
          type="button"
          role="tab"
          aria-selected={option.value === value}
          tabIndex={option.value === value ? 0 : -1}
          onClick={() => onChange(option.value)}
          onKeyDown={(event) => handleKeyDown(event, index)}
          className={[
            'min-h-11 rounded-control px-3 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
            option.value === value ? 'bg-surface text-text shadow-lift' : 'text-muted hover:text-text',
          ].join(' ')}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
