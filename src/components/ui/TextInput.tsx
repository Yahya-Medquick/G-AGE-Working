import type { InputHTMLAttributes } from 'react';

type TextInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> & {
  id: string;
  label: string;
  error?: string;
};

export function TextInput({ id, label, error, className = '', ...props }: TextInputProps) {
  const errorId = error ? `${id}-error` : undefined;
  return (
    <div className="grid gap-2">
      <label htmlFor={id} className="text-sm font-medium text-text">{label}</label>
      <input
        {...props}
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={errorId}
        className={[
          'min-h-11 w-full rounded-control border border-border bg-surface px-3 text-base text-text placeholder:text-muted',
          'focus-visible:border-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
          className,
        ].join(' ')}
      />
      {error && <p id={errorId} className="text-sm text-danger">{error}</p>}
    </div>
  );
}
