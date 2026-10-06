import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useUser } from '../context/UserContext';
import { CLASS_LEVELS, isClassLevelId } from '../data/classLevels';
import { DEFAULT_SPECS, SPECS_STORAGE_KEY } from './chat/SpecificationsAccordion';
import { uiCopy, type UiLanguage } from '../i18n/ui';
import type { ChatSession } from '../types/chat';
import type { ThemePreference } from '../hooks/useTheme';

type Specs = NonNullable<ChatSession['specs']>;
type LanguageChoice = UiLanguage | 'same';

interface SettingsScreenProps {
  isOpen: boolean;
  onClose: () => void;
  language: UiLanguage;
  responseLanguage: UiLanguage;
  appLanguageFollowsResponse: boolean;
  onResponseLanguageChange: (language: UiLanguage) => void;
  onAppLanguageChange: (language: LanguageChoice) => void;
  themePreference: ThemePreference;
  onThemePreferenceChange: (theme: ThemePreference) => void;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readSpecs(): Specs {
  try {
    const saved = localStorage.getItem(SPECS_STORAGE_KEY);
    if (!saved) return DEFAULT_SPECS;
    const parsed: unknown = JSON.parse(saved);
    if (!isRecord(parsed)) return DEFAULT_SPECS;
    return {
      concept: { ...DEFAULT_SPECS.concept, ...(isRecord(parsed.concept) ? parsed.concept : {}) },
      exam: { ...DEFAULT_SPECS.exam, ...(isRecord(parsed.exam) ? parsed.exam : {}) },
      research: { ...DEFAULT_SPECS.research, ...(isRecord(parsed.research) ? parsed.research : {}) },
    } as Specs;
  } catch (error) {
    console.warn('Unable to read saved chat filters:', error);
    return DEFAULT_SPECS;
  }
}

export function SettingsScreen({
  isOpen,
  onClose,
  language,
  responseLanguage,
  appLanguageFollowsResponse,
  onResponseLanguageChange,
  onAppLanguageChange,
  themePreference,
  onThemePreferenceChange,
}: SettingsScreenProps) {
  const { user, mode, setMode, updateClassLevel } = useUser();
  const [specs, setSpecs] = useState<Specs>(readSpecs);
  const [classError, setClassError] = useState('');
  const [filterError, setFilterError] = useState('');
  const t = (key: Parameters<typeof uiCopy>[1]) => uiCopy(language, key);

  useEffect(() => {
    if (!isOpen) return;
    setSpecs(readSpecs());
    setClassError('');
    setFilterError('');
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const saveSpecs = (next: Specs) => {
    setSpecs(next);
    try {
      localStorage.setItem(SPECS_STORAGE_KEY, JSON.stringify(next));
      setFilterError('');
    } catch (error) {
      console.error('Unable to save default chat filters:', error);
      setFilterError(t('settingsFilterSaveError'));
    }
  };

  const updateConceptLevel = (level: NonNullable<Specs['concept']>['level']) => {
    saveSpecs({ ...specs, concept: { ...specs.concept, level } });
  };
  const updateExam = (key: 'targetExam' | 'subject' | 'questionNature' | 'className', value: string) => {
    saveSpecs({ ...specs, exam: { ...specs.exam, [key]: value } });
  };
  const updateResearch = (key: 'recency' | 'minCitations' | 'includeCode' | 'includeDatasets', value: string | boolean) => {
    saveSpecs({ ...specs, research: { ...specs.research, [key]: value } });
  };

  return (
    <div className="fixed inset-0 z-modal flex items-center justify-center bg-black/50 p-3 sm:p-6">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-screen-title"
        className="flex max-h-[min(92dvh,52rem)] w-full max-w-2xl flex-col overflow-hidden rounded-tile border border-border bg-surface text-text shadow-popover"
      >
        <header className="flex items-center justify-between border-b border-border px-4 py-3 sm:px-6">
          <div>
            <h1 id="settings-screen-title" className="text-lg font-semibold">{t('settingsTitle')}</h1>
            <p className="text-sm text-muted">{t('settingsDescription')}</p>
          </div>
          <button type="button" onClick={onClose} aria-label={t('close')} className="flex h-11 w-11 items-center justify-center rounded-pill text-muted hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-accent">
            <X aria-hidden="true" className="h-5 w-5" />
          </button>
        </header>

        <div className="space-y-5 overflow-y-auto p-4 sm:p-6">
          <section className="space-y-3">
            <h2 className="text-sm font-semibold">{t('settingsLanguage')}</h2>
            <label className="block space-y-1.5 text-sm">
              <span className="text-muted">{t('settingsResponseLanguage')}</span>
              <select
                value={responseLanguage}
                onChange={(event) => onResponseLanguageChange(event.target.value as UiLanguage)}
                className="min-h-11 w-full rounded-control border border-border bg-bg px-3 text-text focus-visible:outline-2 focus-visible:outline-accent"
              >
                <option value="english">{t('languageEnglish')}</option>
                <option value="roman-urdu">{t('languageRomanUrdu')}</option>
                <option value="urdu">{t('languageUrdu')}</option>
              </select>
            </label>
            <label className="block space-y-1.5 text-sm">
              <span className="text-muted">{t('settingsAppLanguage')}</span>
              <select
                value={appLanguageFollowsResponse ? 'same' : language}
                onChange={(event) => onAppLanguageChange(event.target.value as LanguageChoice)}
                className="min-h-11 w-full rounded-control border border-border bg-bg px-3 text-text focus-visible:outline-2 focus-visible:outline-accent"
              >
                <option value="same">{t('settingsSameAsResponse')}</option>
                <option value="english">{t('languageEnglish')}</option>
                <option value="roman-urdu">{t('languageRomanUrdu')}</option>
                <option value="urdu">{t('languageUrdu')}</option>
              </select>
            </label>
          </section>

          <section className="space-y-3 border-t border-border pt-4">
            <h2 className="text-sm font-semibold">{t('settingsStudyMode')}</h2>
            <div className="grid grid-cols-2 gap-2">
              {(['learning', 'research'] as const).map((nextMode) => (
                <button
                  key={nextMode}
                  type="button"
                  aria-pressed={mode === nextMode}
                  onClick={() => void setMode(nextMode)}
                  className={`min-h-11 rounded-control border px-3 text-sm font-medium focus-visible:outline-2 focus-visible:outline-accent ${
                    mode === nextMode ? 'border-accent bg-accent-soft text-accent-text' : 'border-border bg-bg text-text hover:bg-surface-2'
                  }`}
                >
                  {t(nextMode === 'learning' ? 'settingsLearning' : 'settingsResearch')}
                </button>
              ))}
            </div>
          </section>

          <section className="space-y-3 border-t border-border pt-4">
            <h2 className="text-sm font-semibold">{t('settingsClass')}</h2>
            <label className="block space-y-1.5 text-sm">
              <span className="text-muted">{t('chooseClassLabel')}</span>
              <select
                value={isClassLevelId(user?.class_level) ? user.class_level : ''}
                onChange={(event) => {
                  if (!isClassLevelId(event.target.value)) return;
                  setClassError('');
                  void updateClassLevel(event.target.value).catch((error) => {
                    console.error('Unable to save class from settings:', error);
                    setClassError(t('classSaveError'));
                  });
                }}
                className="min-h-11 w-full rounded-control border border-border bg-bg px-3 text-text"
              >
                <option value="">{t('selectClass')}</option>
                {CLASS_LEVELS.map((level) => <option key={level.id} value={level.id}>{level.label}</option>)}
              </select>
              {classError && <span role="alert" className="text-sm text-danger">{classError}</span>}
            </label>
          </section>

          <section className="space-y-3 border-t border-border pt-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold">{t('settingsDefaultFilters')}</h2>
              <button type="button" onClick={() => saveSpecs(DEFAULT_SPECS)} className="min-h-10 rounded-control px-3 text-sm font-medium text-accent-text hover:bg-accent-soft focus-visible:outline-2 focus-visible:outline-accent">
                {t('reset')}
              </button>
            </div>
            <label className="block space-y-1.5 text-sm">
              <span className="text-muted">{t('settingsConceptDepth')}</span>
              <select value={specs.concept?.level || DEFAULT_SPECS.concept.level} onChange={(event) => updateConceptLevel(event.target.value as NonNullable<Specs['concept']>['level'])} className="min-h-11 w-full rounded-control border border-border bg-bg px-3 text-text">
                <option value="beginner">{t('settingsBeginner')}</option>
                <option value="intermediate">{t('settingsIntermediate')}</option>
                <option value="advanced">{t('settingsAdvanced')}</option>
                <option value="expert">{t('settingsExpert')}</option>
              </select>
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-1.5 text-sm">
                <span className="text-muted">{t('settingsBoard')}</span>
                <input value={specs.exam?.targetExam || ''} onChange={(event) => updateExam('targetExam', event.target.value)} className="min-h-11 w-full rounded-control border border-border bg-bg px-3 text-text" />
              </label>
              <label className="space-y-1.5 text-sm">
                <span className="text-muted">{t('settingsSubject')}</span>
                <input value={specs.exam?.subject || ''} onChange={(event) => updateExam('subject', event.target.value)} className="min-h-11 w-full rounded-control border border-border bg-bg px-3 text-text" />
              </label>
              <label className="space-y-1.5 text-sm">
                <span className="text-muted">{t('settingsQuestionType')}</span>
                <select value={specs.exam?.questionNature || 'short'} onChange={(event) => updateExam('questionNature', event.target.value)} className="min-h-11 w-full rounded-control border border-border bg-bg px-3 text-text">
                  <option value="long">{t('settingsLong')}</option>
                  <option value="short">{t('settingsShort')}</option>
                  <option value="mcq">{t('settingsMcq')}</option>
                </select>
              </label>
              <label className="space-y-1.5 text-sm">
                <span className="text-muted">{t('settingsClassLevel')}</span>
                <input value={specs.exam?.className || ''} onChange={(event) => updateExam('className', event.target.value)} className="min-h-11 w-full rounded-control border border-border bg-bg px-3 text-text" />
              </label>
            </div>
            <label className="block space-y-1.5 text-sm">
              <span className="text-muted">{t('settingsResearchRecency')}</span>
              <select value={specs.research?.recency || DEFAULT_SPECS.research.recency} onChange={(event) => updateResearch('recency', event.target.value)} className="min-h-11 w-full rounded-control border border-border bg-bg px-3 text-text">
                <option value="2_years">{t('settingsLast2Years')}</option>
                <option value="5_years">{t('settingsLast5Years')}</option>
                <option value="all_time">{t('settingsAllTime')}</option>
              </select>
            </label>
            <label className="block space-y-1.5 text-sm">
              <span className="text-muted">{t('settingsMinCitations')}</span>
              <select value={specs.research?.minCitations || DEFAULT_SPECS.research.minCitations} onChange={(event) => updateResearch('minCitations', event.target.value)} className="min-h-11 w-full rounded-control border border-border bg-bg px-3 text-text">
                <option value="any">{t('settingsAny')}</option>
                <option value="50+">{t('settingsCitations50')}</option>
                <option value="500+">{t('settingsCitations500')}</option>
              </select>
            </label>
            <div className="grid gap-2 sm:grid-cols-2">
              <label className="flex min-h-11 items-center gap-3 rounded-control border border-border bg-bg px-3 text-sm">
                <input type="checkbox" checked={specs.research?.includeCode ?? DEFAULT_SPECS.research.includeCode} onChange={(event) => updateResearch('includeCode', event.target.checked)} />
                <span>{t('settingsIncludeRepos')}</span>
              </label>
              <label className="flex min-h-11 items-center gap-3 rounded-control border border-border bg-bg px-3 text-sm">
                <input type="checkbox" checked={specs.research?.includeDatasets ?? DEFAULT_SPECS.research.includeDatasets} onChange={(event) => updateResearch('includeDatasets', event.target.checked)} />
                <span>{t('settingsIncludeDatasets')}</span>
              </label>
            </div>
            {filterError && <p role="alert" className="text-sm text-danger">{filterError}</p>}
          </section>

          <section className="space-y-3 border-t border-border pt-4">
            <h2 className="text-sm font-semibold">{t('settingsTheme')}</h2>
            <select value={themePreference} onChange={(event) => onThemePreferenceChange(event.target.value as ThemePreference)} className="min-h-11 w-full rounded-control border border-border bg-bg px-3 text-text">
              <option value="system">{t('settingsThemeSystem')}</option>
              <option value="light">{t('settingsThemeLight')}</option>
              <option value="dark">{t('settingsThemeDark')}</option>
            </select>
          </section>
        </div>
      </section>
    </div>
  );
}
