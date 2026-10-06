import { useEffect, useRef } from 'react';
import { GraduationCap } from 'lucide-react';
import { uiCopy, type UiLanguage } from '../../i18n/ui';
import { Button } from '../ui/Button';

interface FirstRunOverlayProps {
  language: UiLanguage;
  onContinueAsGuest: () => void;
  onSignIn: () => void;
}

export function FirstRunOverlay({ language, onContinueAsGuest, onSignIn }: FirstRunOverlayProps) {
  const dialogRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    dialogRef.current?.querySelector<HTMLElement>('button:not([disabled])')?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        return;
      }
      if (event.key !== 'Tab' || !dialogRef.current) return;
      const controls = Array.from(dialogRef.current.querySelectorAll<HTMLElement>('button:not([disabled])'));
      if (!controls.length) return;
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      previousFocus?.focus();
    };
  }, []);

  const dir = language === 'urdu' ? 'rtl' : 'ltr';
  return (
    <div className="fixed inset-0 z-modal flex items-center justify-center bg-text/50 p-4 backdrop-blur-sm">
      <section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="first-run-title"
        aria-describedby="first-run-description"
        dir={dir}
        className="w-full max-w-md rounded-sheet border border-border bg-surface p-6 text-text shadow-modal sm:p-8"
      >
        <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-tile bg-accent-soft text-accent-text">
          <GraduationCap aria-hidden="true" className="h-6 w-6" />
        </div>
        <h1 id="first-run-title" className="text-2xl font-semibold leading-tight">
          {uiCopy(language, 'welcomeTitle')}
        </h1>
        <p id="first-run-description" className="mt-3 text-base leading-relaxed text-muted">
          {uiCopy(language, 'welcomeDescription')}
        </p>
        <div className="mt-6 flex flex-col gap-3">
          <Button
            variant="primary"
            size="lg"
            className="w-full"
            onClick={onContinueAsGuest}
          >
            {uiCopy(language, 'continueAsGuest')}
          </Button>
          <Button variant="secondary" size="lg" className="w-full" onClick={onSignIn}>
            {uiCopy(language, 'signIn')}
          </Button>
        </div>
      </section>
    </div>
  );
}
