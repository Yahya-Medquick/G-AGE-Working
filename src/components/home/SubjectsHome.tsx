import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BookOpen, GraduationCap, RotateCw, Search, X } from 'lucide-react';
import { useCatalog } from '../../hooks/useCatalog';
import { useUser } from '../../context/UserContext';
import { getAuthHeaders } from '../../services/api';
import { CLASS_LEVELS, isClassLevelId, type ClassLevelId } from '../../data/classLevels';
import type { ExpertPersona } from '../../types';
import type { CatalogBook } from '../../types/catalog';
import { uiCopy, type UiLanguage } from '../../i18n/ui';
import { EmptyState } from '../ui/EmptyState';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { VariantBadge } from '../ui/Badge';

const RECENT_TEACHERS_KEY = 'gage_recent_personas';

interface SubjectsHomeProps {
  globalPersonas: Record<string, ExpertPersona>;
  pkPersonas: Record<string, ExpertPersona>;
  language: UiLanguage;
  onOpenPractice?: () => void;
  onStartChat: (persona: ExpertPersona, topic: string, starterTopics?: string[]) => void;
  focusSearchRequest?: number;
}

function readRecentSlugs(): string[] {
  try {
    const saved = localStorage.getItem(RECENT_TEACHERS_KEY);
    const parsed: unknown = saved ? JSON.parse(saved) : [];
    return Array.isArray(parsed) ? parsed.filter((value): value is string => typeof value === 'string') : [];
  } catch {
    return [];
  }
}

function subjectTint(subjectKey: string) {
  const key = subjectKey.toLowerCase();
  if (key.includes('bio')) return 'bg-tint-bio text-[var(--tint-bio-text)]';
  if (key.includes('chem')) return 'bg-tint-chem text-[var(--tint-chem-text)]';
  if (key.includes('english') || key.includes('language')) return 'bg-tint-eng text-[var(--tint-eng-text)]';
  if (key.includes('econom')) return 'bg-tint-eco text-[var(--tint-eco-text)]';
  return 'bg-surface-2 text-text';
}

export function SubjectsHome({ globalPersonas, pkPersonas, language, onStartChat, onOpenPractice, focusSearchRequest = 0 }: SubjectsHomeProps) {
  const { user, updateClassLevel } = useUser();
  const [classLevel, setClassLevel] = useState<ClassLevelId | null>(() => {
    const saved = user?.class_level || localStorage.getItem('gage_class_level');
    return isClassLevelId(saved) ? saved : null;
  });
  const [classError, setClassError] = useState('');
  const [voteError, setVoteError] = useState('');
  const [voteCounts, setVoteCounts] = useState<Record<string, number>>({});
  const [votedBookIds, setVotedBookIds] = useState<Set<string>>(new Set());
  const [recentSlugs, setRecentSlugs] = useState<string[]>(readRecentSlugs);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { catalog, loading, stale, error, reload } = useCatalog(classLevel);

  const t = useCallback((key: Parameters<typeof uiCopy>[1]) => uiCopy(language, key), [language]);
  const personas = useMemo(() => {
    const unique = new Map<string, ExpertPersona>();
    for (const [variant, record] of [['global', globalPersonas], ['pk', pkPersonas]] as const) {
      for (const persona of Object.values(record)) {
        const key = `${variant}:${persona.slug || persona.id}`;
        if (persona.name && persona.is_active !== false) unique.set(key, { ...persona, variant });
      }
    }
    return Array.from(unique.values());
  }, [globalPersonas, pkPersonas]);
  const recentPersonas = useMemo(() => recentSlugs
    .map((slug) => personas.find((persona) => persona.slug === slug || persona.id === slug))
    .filter((persona): persona is ExpertPersona => Boolean(persona))
    .slice(0, 3), [personas, recentSlugs]);
  const featuredPersonas = recentPersonas.length
    ? recentPersonas
    : personas.slice(0, 4);
  const normalizedSearch = searchQuery.trim().toLocaleLowerCase();
  const displayedPersonas = useMemo(() => {
    if (!normalizedSearch) return featuredPersonas;
    return personas.filter((persona) => [
      persona.name,
      persona.role,
      persona.group_name,
      persona.badge,
      ...(persona.specialties || []),
    ].some((value) => value?.toLocaleLowerCase().includes(normalizedSearch)));
  }, [featuredPersonas, normalizedSearch, personas]);
  const displayedSubjects = useMemo(() => {
    if (!catalog) return [];
    if (!normalizedSearch) return catalog.subjects;
    return catalog.subjects.map((subject) => ({
      ...subject,
      books: subject.books.filter((book) => [
        subject.key,
        book.title,
        book.board,
        book.publisher,
        book.personaGroup,
        ...book.starterTopics,
      ].some((value) => value?.toLocaleLowerCase().includes(normalizedSearch))),
    })).filter((subject) => subject.books.length > 0);
  }, [catalog, normalizedSearch]);

  useEffect(() => {
    if (isClassLevelId(user?.class_level)) setClassLevel(user.class_level);
  }, [user?.class_level]);

  useEffect(() => {
    if (!user) {
      setRecentSlugs(readRecentSlugs());
      return;
    }
    let active = true;
    fetch('/api/v1/personas/recent', { credentials: 'include', headers: getAuthHeaders() })
      .then(async (response) => {
        if (!response.ok) throw new Error(`Recent teacher request failed (${response.status})`);
        return response.json();
      })
      .then((data) => {
        if (active && data.success && Array.isArray(data.personas)) {
          setRecentSlugs(data.personas.map((persona: { slug?: string; id?: string }) => persona.slug || persona.id).filter(Boolean));
        }
      })
      .catch((fetchError) => console.warn('Unable to load recent teachers:', fetchError));
    return () => { active = false; };
  }, [user]);

  useEffect(() => {
    if (focusSearchRequest > 0) searchInputRef.current?.focus();
  }, [focusSearchRequest]);

  const handleClassLevelChange = async (value: string) => {
    if (!isClassLevelId(value)) return;
    setClassLevel(value);
    setClassError('');
    try {
      await updateClassLevel(value);
    } catch (saveError) {
      console.error('Unable to save selected class:', saveError);
      setClassError(t('classSaveError'));
    }
  };

  const handleVote = async (book: CatalogBook) => {
    setVoteError('');
    try {
      const response = await fetch(`/api/catalog/${encodeURIComponent(book.id)}/vote`, {
        method: 'POST',
        credentials: 'include',
        headers: getAuthHeaders(),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.success) throw new Error(data.error || `Vote request failed (${response.status})`);
      setVoteCounts((current) => ({ ...current, [book.id]: Number(data.voteCount) || 0 }));
      setVotedBookIds((current) => new Set(current).add(book.id));
    } catch (voteRequestError) {
      console.error('Unable to save catalog request:', voteRequestError);
      setVoteError(t('requestError'));
    }
  };

  const handleStartTeacher = (persona: ExpertPersona, topic: string, starterTopics?: string[]) => {
    const slug = persona.slug || persona.id;
    const nextRecent = [slug, ...recentSlugs.filter((entry) => entry !== slug)].slice(0, 3);
    setRecentSlugs(nextRecent);
    try {
      localStorage.setItem(RECENT_TEACHERS_KEY, JSON.stringify(nextRecent));
    } catch (storageError) {
      console.warn('Unable to cache recent teachers:', storageError);
    }
    fetch(`/api/v1/personas/${encodeURIComponent(slug)}/used`, {
      method: 'POST',
      credentials: 'include',
      headers: getAuthHeaders(),
    }).catch((usageError) => console.warn('Unable to record teacher usage:', usageError));
    onStartChat(persona, topic, starterTopics);
  };

  const findTeacher = (groupName?: string | null) => personas.find((persona) => {
    const personaGroup = persona.group_name || persona.badge;
    return groupName && personaGroup.toLowerCase() === groupName.toLowerCase();
  });

  const dir = language === 'urdu' ? 'rtl' : 'ltr';
  return (
    <main dir={dir} className="h-full min-w-0 overflow-y-auto bg-bg px-4 py-6 text-text sm:px-6 sm:py-8">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <header className="space-y-2">
          <div className="flex items-center gap-2 text-accent-text">
            <GraduationCap aria-hidden="true" className="h-5 w-5" />
            <span className="text-sm font-medium">{t('subjects')}</span>
            {classLevel && (
              <Badge className="border-accent/20 bg-accent-soft text-accent-text">
                {CLASS_LEVELS.find((level) => level.id === classLevel)?.label}
              </Badge>
            )}
          </div>
          <h1 className="text-2xl font-semibold leading-tight text-text sm:text-3xl">{t('homeTitle')}</h1>
          <p className="max-w-2xl text-base leading-relaxed text-muted">{t('homeSubtitle')}</p>
        </header>

        <div className="flex min-h-12 items-center gap-3 rounded-control border border-border bg-surface px-3 shadow-lift focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-accent">
          <Search aria-hidden="true" className="h-5 w-5 shrink-0 text-muted" />
          <input
            ref={searchInputRef}
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder={t('subjectsSearchPlaceholder')}
            aria-label={t('subjectsSearchLabel')}
            className="min-w-0 flex-1 bg-transparent py-2 text-base text-text placeholder:text-muted focus:outline-none"
          />
          {searchQuery && (
            <button type="button" onClick={() => setSearchQuery('')} aria-label={t('clearSearch')} className="flex h-11 w-11 items-center justify-center rounded-pill text-muted hover:bg-surface-2">
              <X aria-hidden="true" className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="max-w-sm">
          <label htmlFor="subjects-class-level" className="mb-2 block text-sm font-medium text-text">
            {t('chooseClassLabel')}
          </label>
          <select
            id="subjects-class-level"
            value={classLevel || ''}
            onChange={(event) => void handleClassLevelChange(event.target.value)}
            className="min-h-11 w-full rounded-control border border-border bg-surface px-3 text-base text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <option value="" disabled>{t('selectClass')}</option>
            {CLASS_LEVELS.map((level) => <option key={level.id} value={level.id}>{level.label}</option>)}
          </select>
          {classError && <p role="alert" className="mt-2 text-sm text-danger">{classError}</p>}
        </div>

        {onOpenPractice && (
          <button
            type="button"
            onClick={onOpenPractice}
            className="flex min-h-12 w-full max-w-sm items-center justify-between gap-3 rounded-tile border border-border bg-surface px-4 text-start text-sm font-semibold text-text shadow-lift hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-accent"
          >
            <span className="flex items-center gap-2">
              <GraduationCap aria-hidden="true" className="h-5 w-5 text-accent-text" />
              {t('practiceOpen')}
            </span>
          </button>
        )}

        {classLevel && (
          <section aria-labelledby="catalog-heading" className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h2 id="catalog-heading" className="text-xl font-semibold text-text">{t('subjects')}</h2>
              {stale && <span className="text-sm text-muted">{t('catalogError')}</span>}
            </div>
            {loading && !catalog && (
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="h-28 animate-pulse rounded-tile bg-surface-2 motion-reduce:animate-none" />
                <div className="h-28 animate-pulse rounded-tile bg-surface-2 motion-reduce:animate-none" />
              </div>
            )}
            {error && (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-tile border border-border bg-surface p-4">
                <p role="alert" className="text-sm text-muted">{t('catalogError')}</p>
                <Button variant="secondary" size="sm" onClick={() => void reload()}>
                  <RotateCw aria-hidden="true" className="h-4 w-4" />
                  {t('retry')}
                </Button>
              </div>
            )}
            {catalog && displayedSubjects.length > 0 && (
              <div className="grid gap-3 sm:grid-cols-2">
                {displayedSubjects.map((subject) => (
                  <article key={subject.key} className={`min-w-0 rounded-tile p-4 shadow-lift ${subjectTint(subject.key)}`}>
                    <div className="mb-3 flex items-center gap-2">
                      <BookOpen aria-hidden="true" className="h-5 w-5 shrink-0" />
                      <h3 className="min-w-0 break-words text-lg font-semibold">{subject.key}</h3>
                    </div>
                    <ul className="space-y-3">
                      {subject.books.map((book) => {
                        const teacher = findTeacher(book.personaGroup);
                        const canStart = book.available && teacher;
                        return (
                          <li key={book.id} className="flex min-w-0 flex-col gap-2 border-t border-current/10 pt-3">
                            <span className="break-words text-sm font-medium">{book.title}</span>
                            {(book.board || book.publisher) && (
                              <span className="break-words text-xs opacity-80">{[book.board, book.publisher].filter(Boolean).join(' · ')}</span>
                            )}
                            {canStart ? (
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => handleStartTeacher(teacher, book.starterTopics[0] || book.title, book.starterTopics)}
                              >
                                {t('startLearning')}
                              </Button>
                            ) : (
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <span className="text-xs font-medium">{t('comingSoon')}</span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  disabled={votedBookIds.has(book.id)}
                                  onClick={() => void handleVote(book)}
                                >
                                  {votedBookIds.has(book.id) ? t('requestSaved') : t('requestBook')}
                                  <span className="text-xs text-muted">
                                    {voteCounts[book.id] ?? book.voteCount} {t('requestCount')}
                                  </span>
                                </Button>
                              </div>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </article>
                ))}
              </div>
            )}
            {catalog && catalog.subjects.length === 0 && !normalizedSearch && (
              <EmptyState
                icon={<BookOpen className="h-8 w-8" />}
                title={t('catalogEmptyTitle')}
                description={t('catalogEmptyDescription')}
              />
            )}
            {catalog && normalizedSearch && displayedSubjects.length === 0 && (
              <EmptyState title={t('searchNoResults')} description={t('searchNoResultsDescription')} />
            )}
            {voteError && <p role="alert" className="text-sm text-danger">{voteError}</p>}
          </section>
        )}

        <section aria-labelledby="teachers-heading" className="space-y-3">
          <div>
            <h2 id="teachers-heading" className="text-xl font-semibold text-text">
              {normalizedSearch ? t('searchResults') : recentPersonas.length ? t('recentTeachers') : t('teachers')}
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-muted">{t('teachersDescription')}</p>
          </div>
          {displayedPersonas.length > 0 ? (
            <ul className="divide-y divide-border overflow-hidden rounded-tile border border-border bg-surface">
              {displayedPersonas.map((persona) => (
                <li key={`${persona.variant}:${persona.slug || persona.id}`}>
                  <button
                    type="button"
                    onClick={() => handleStartTeacher(persona, persona.specialties?.[0] || persona.name)}
                    className="flex min-h-16 w-full min-w-0 items-center gap-3 px-4 py-3 text-start transition-colors hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent"
                  >
                    <span
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-pill bg-accent-soft text-sm font-semibold text-accent-text"
                      aria-hidden="true"
                    >
                      {persona.initials || 'GA'}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-base font-medium text-text">{persona.name}</span>
                      <span className="block truncate text-sm text-muted">{persona.role}</span>
                    </span>
                    <VariantBadge
                      variant={persona.variant === 'pk' ? 'pk' : 'global'}
                      label={t(persona.variant === 'pk' ? 'variantPk' : 'variantGlobal')}
                    />
                    <span className="hidden shrink-0 rounded-pill bg-surface-2 px-2 py-1 text-xs text-muted sm:inline">
                      {persona.group_name || persona.badge}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              title={normalizedSearch ? t('searchNoResults') : t('teachers')}
              description={normalizedSearch ? t('searchNoResultsDescription') : t('teachersDescription')}
            />
          )}
        </section>
      </div>
    </main>
  );
}
