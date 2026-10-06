import { useState } from 'react';
import { GraduationCap } from 'lucide-react';
import { CLASS_LEVELS, isClassLevelId, type ClassLevelId } from '../../data/classLevels';
import { uiCopy, type UiLanguage } from '../../i18n/ui';
import { Button } from '../ui/Button';

interface ClassLevelPromptProps {
  language: UiLanguage;
  onSave: (classLevel: ClassLevelId) => Promise<void>;
  onDismiss: () => void;
}

export function ClassLevelPrompt({ language, onSave, onDismiss }: ClassLevelPromptProps) {
  const [classLevel, setClassLevel] = useState<ClassLevelId | ''>('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!classLevel || saving) return;
    setSaving(true);
    setError('');
    try {
      await onSave(classLevel);
    } catch (saveError) {
      console.error('Unable to save class selection:', saveError);
      setError(uiCopy(language, 'classSaveError'));
    } finally {
      setSaving(false);
    }
  };

  const dir = language === 'urdu' ? 'rtl' : 'ltr';
  return (
    <div className="fixed inset-0 z-modal flex items-center justify-center bg-text/50 p-4 backdrop-blur-sm">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="class-prompt-title"
        dir={dir}
        className="w-full max-w-md space-y-4 rounded-sheet border border-border bg-surface p-6 text-text shadow-modal"
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-tile bg-accent-soft text-accent-text">
          <GraduationCap aria-hidden="true" className="h-6 w-6" />
        </div>
        <div className="space-y-2">
          <h2 id="class-prompt-title" className="text-xl font-semibold">{uiCopy(language, 'classPromptTitle')}</h2>
          <p className="text-sm leading-relaxed text-muted">{uiCopy(language, 'classPromptDescription')}</p>
        </div>
        <label htmlFor="class-level-prompt-select" className="block space-y-2 text-sm font-medium">
          <span>{uiCopy(language, 'chooseClassLabel')}</span>
          <select
            id="class-level-prompt-select"
            value={classLevel}
            onChange={(event) => setClassLevel(isClassLevelId(event.target.value) ? event.target.value : '')}
            className="min-h-11 w-full rounded-control border border-border bg-surface px-3 text-base text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <option value="">{uiCopy(language, 'selectClass')}</option>
            {CLASS_LEVELS.map((level) => <option key={level.id} value={level.id}>{level.label}</option>)}
          </select>
        </label>
        {error && <p role="alert" className="text-sm text-danger">{error}</p>}
        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="ghost" onClick={onDismiss}>{uiCopy(language, 'later')}</Button>
          <Button variant="primary" disabled={!classLevel} loading={saving} onClick={() => void handleSubmit()}>
            {uiCopy(language, 'saveClass')}
          </Button>
        </div>
      </section>
    </div>
  );
}
