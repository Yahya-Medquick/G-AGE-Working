import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, BarChart3, BookOpen, CheckCircle2, GraduationCap, Loader2, RotateCw, Trophy, XCircle } from 'lucide-react';
import { useNotes } from '../hooks/useNotes';
import { useQueryLimits } from '../hooks/useQueryLimits';
import { useUser } from '../context/UserContext';
import { fetchPracticeProgress, getAuthHeaders, savePracticeAttempt } from '../services/api';
import { uiCopy, type UiLanguage } from '../i18n/ui';
import { parsePracticeQuestions, type PracticeProgress, type PracticeQuestion } from '../utils/practice';
import { MarkdownRenderer } from './MarkdownRenderer';

type PracticeTab = 'practice' | 'progress';

interface PracticeScreenProps {
  language: UiLanguage;
  initialTopic?: string;
  initialTab?: PracticeTab;
  onClose: () => void;
  onOpenLogin: () => void;
  onOpenPaywall: () => void;
}

export function PracticeScreen({
  language,
  initialTopic = '',
  initialTab = 'practice',
  onClose,
  onOpenLogin,
  onOpenPaywall,
}: PracticeScreenProps) {
  const { user } = useUser();
  const { addNote } = useNotes();
  const { refreshUsage } = useQueryLimits();
  const [activeTab, setActiveTab] = useState<PracticeTab>(initialTab);
  const [topic, setTopic] = useState(initialTopic);
  const [questions, setQuestions] = useState<PracticeQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [isComplete, setIsComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [attemptStatus, setAttemptStatus] = useState<'idle' | 'saving' | 'saved' | 'failed' | 'guest'>('idle');
  const [notesStatus, setNotesStatus] = useState<'idle' | 'saving' | 'saved' | 'failed'>('idle');
  const [progress, setProgress] = useState<PracticeProgress | null>(null);
  const [progressLoading, setProgressLoading] = useState(false);
  const [progressError, setProgressError] = useState('');
  const [progressReload, setProgressReload] = useState(0);
  const t = (key: Parameters<typeof uiCopy>[1]) => uiCopy(language, key);

  const score = useMemo(() => questions.reduce((correct, question, index) => (
    answers[index] === question.answerIndex ? correct + 1 : correct
  ), 0), [answers, questions]);
  const mistakes = useMemo(() => questions.flatMap((question, index) => {
    const selected = answers[index];
    return selected !== undefined && selected !== question.answerIndex
      ? [{ question, selected }]
      : [];
  }), [answers, questions]);

  useEffect(() => {
    if (activeTab !== 'progress' || !user) return;
    let mounted = true;
    setProgressLoading(true);
    setProgressError('');
    fetchPracticeProgress()
      .then((history) => {
        if (mounted) setProgress(history);
      })
      .catch((loadError) => {
        console.error('Unable to load practice progress:', loadError);
        if (mounted) setProgressError(t('practiceProgressLoadError'));
      })
      .finally(() => {
        if (mounted) setProgressLoading(false);
      });
    return () => { mounted = false; };
  }, [activeTab, user, language, progressReload]);

  const startQuiz = async () => {
    const cleanTopic = topic.trim();
    if (!cleanTopic) {
      setError(t('practiceTopicRequired'));
      return;
    }
    if (cleanTopic.length > 255) {
      setError(t('practiceTopicTooLong'));
      return;
    }

    setIsLoading(true);
    setError('');
    setQuestions([]);
    setAnswers({});
    setIsComplete(false);
    setAttemptStatus('idle');
    setNotesStatus('idle');
    try {
      const response = await fetch(
        `/api/mcqs?topic=${encodeURIComponent(cleanTopic)}&trackUsage=true`,
        { credentials: 'include', headers: getAuthHeaders() },
      );
      if (response.status === 429) {
        onOpenPaywall();
        throw new Error(t('practiceLimitReached'));
      }
      const data: unknown = await response.json().catch(() => null);
      if (!response.ok || !data || typeof data !== 'object' || !('questions' in data)) {
        throw new Error(t('practiceLoadError'));
      }
      setQuestions(parsePracticeQuestions(data.questions));
      setCurrentIndex(0);
      setTopic(cleanTopic);
      refreshUsage();
    } catch (loadError) {
      console.error('Unable to load practice questions:', loadError);
      setError(loadError instanceof Error ? loadError.message : t('practiceLoadError'));
    } finally {
      setIsLoading(false);
    }
  };

  const persistAttempt = async () => {
    if (!user) {
      setAttemptStatus('guest');
      return;
    }
    setAttemptStatus('saving');
    try {
      await savePracticeAttempt({ topic: topic.trim(), correctCount: score, totalCount: questions.length });
      setAttemptStatus('saved');
    } catch (saveError) {
      console.error('Unable to save practice attempt:', saveError);
      setAttemptStatus('failed');
    }
  };

  const finishQuiz = async () => {
    if (Object.keys(answers).length !== questions.length || isComplete) return;
    setIsComplete(true);
    await persistAttempt();
  };

  const saveMistakes = async () => {
    if (!mistakes.length) return;
    setNotesStatus('saving');
    const content = mistakes.map(({ question, selected }, index) => {
      const selectedOption = question.options[selected];
      const correctOption = question.options[question.answerIndex];
      return [
        `## ${t('practiceQuestion')} ${index + 1}`,
        question.question,
        `**${t('practiceYourAnswer')}:** ${selectedOption}`,
        `**${t('practiceCorrectAnswer')}:** ${correctOption}`,
        `**${t('practiceExplanation')}:** ${question.explanation}`,
      ].join('\n\n');
    }).join('\n\n---\n\n');
    try {
      await addNote(
        `${t('practiceMistakesNoteTitle')}: ${topic.trim().slice(0, 160)}`,
        content,
        topic.trim().slice(0, 100) || t('practiceTitle'),
      );
      setNotesStatus('saved');
    } catch (saveError) {
      console.error('Unable to save practice mistakes to Notes:', saveError);
      setNotesStatus('failed');
    }
  };

  const startAnotherQuiz = () => {
    setQuestions([]);
    setAnswers({});
    setCurrentIndex(0);
    setIsComplete(false);
    setAttemptStatus('idle');
    setNotesStatus('idle');
    setError('');
  };

  const attempts = progress?.attempts || [];
  const totalQuestions = progress?.totalQuestions || 0;
  const totalCorrect = progress?.correctAnswers || 0;
  const average = totalQuestions ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

  return (
    <main dir={language === 'urdu' ? 'rtl' : 'ltr'} className="h-full min-w-0 overflow-y-auto bg-bg px-4 py-5 text-text sm:px-6">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-5 pb-6">
        <header className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            aria-label={t('close')}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-control border border-border bg-surface text-text hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-accent"
          >
            <ArrowLeft aria-hidden="true" className="h-5 w-5" />
          </button>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 text-accent-text">
              <GraduationCap aria-hidden="true" className="h-5 w-5" />
              <span className="text-sm font-semibold">{t('practiceTitle')}</span>
            </div>
            <h1 className="mt-1 text-2xl font-semibold text-text">{t('practiceSubtitle')}</h1>
          </div>
        </header>

        <div role="tablist" aria-label={t('practiceNavigation')} className="flex w-full gap-2 rounded-tile border border-border bg-surface p-1">
          {(['practice', 'progress'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={activeTab === tab}
              onClick={() => setActiveTab(tab)}
              className={`min-h-11 flex-1 rounded-control px-3 text-sm font-medium focus-visible:outline-2 focus-visible:outline-accent ${activeTab === tab ? 'bg-accent text-on-accent' : 'text-muted hover:bg-surface-2 hover:text-text'}`}
            >
              {t(tab === 'practice' ? 'practiceTab' : 'practiceProgressTab')}
            </button>
          ))}
        </div>

        {activeTab === 'practice' ? (
          <section className="space-y-4">
            {!questions.length && (
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  void startQuiz();
                }}
                className="space-y-4 rounded-tile border border-border bg-surface p-5 shadow-lift"
              >
                <div>
                  <h2 className="text-lg font-semibold text-text">{t('practiceChooseTopic')}</h2>
                  <p className="mt-1 text-sm leading-relaxed text-muted">{t('practiceTopicDescription')}</p>
                </div>
                <label htmlFor="practice-topic" className="block text-sm font-medium text-text">{t('practiceTopicLabel')}</label>
                <input
                  id="practice-topic"
                  type="text"
                  maxLength={255}
                  value={topic}
                  onChange={(event) => setTopic(event.target.value)}
                  placeholder={t('practiceTopicPlaceholder')}
                  className="min-h-12 w-full rounded-control border border-border bg-bg px-3 text-base text-text placeholder:text-muted focus-visible:outline-2 focus-visible:outline-accent"
                />
                {error && <p role="alert" className="text-sm text-danger">{error}</p>}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-control bg-accent px-4 text-sm font-semibold text-on-accent hover:opacity-90 disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                >
                  {isLoading ? <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" /> : <BookOpen aria-hidden="true" className="h-4 w-4" />}
                  {isLoading ? t('practiceLoading') : t('practiceStart')}
                </button>
              </form>
            )}

            {questions.length > 0 && !isComplete && (
              <section className="space-y-4 rounded-tile border border-border bg-surface p-5 shadow-lift">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
                  <div>
                    <p className="text-xs font-medium text-muted">{t('practiceTopicLabel')}</p>
                    <h2 className="text-lg font-semibold text-text">{topic}</h2>
                  </div>
                  <span className="rounded-pill bg-accent-soft px-3 py-1 text-sm font-semibold text-accent-text">
                    {t('practiceQuestionCount').replace('{current}', String(currentIndex + 1)).replace('{total}', String(questions.length))}
                  </span>
                </div>
                <div className="space-y-4">
                  <div className="text-base font-medium leading-relaxed text-text">
                    <MarkdownRenderer content={questions[currentIndex].question} />
                  </div>
                  <div className="grid gap-2">
                    {questions[currentIndex].options.map((option, optionIndex) => {
                      const selected = answers[currentIndex] === optionIndex;
                      const answered = answers[currentIndex] !== undefined;
                      const isCorrect = questions[currentIndex].answerIndex === optionIndex;
                      const statusClass = answered && isCorrect
                        ? 'border-accent bg-accent-soft text-accent-text'
                        : answered && selected
                          ? 'border-danger bg-danger/10 text-danger'
                          : 'border-border bg-bg text-text hover:bg-surface-2';
                      return (
                        <button
                          key={optionIndex}
                          type="button"
                          disabled={answered}
                          onClick={() => setAnswers((current) => ({ ...current, [currentIndex]: optionIndex }))}
                          className={`flex min-h-12 items-start gap-3 rounded-control border p-3 text-left text-sm focus-visible:outline-2 focus-visible:outline-accent disabled:cursor-default ${statusClass}`}
                        >
                          <span className="font-semibold">{String.fromCharCode(65 + optionIndex)}.</span>
                          <span className="min-w-0 flex-1"><MarkdownRenderer content={option} /></span>
                          {answered && isCorrect && <CheckCircle2 aria-hidden="true" className="h-5 w-5 shrink-0" />}
                          {answered && selected && !isCorrect && <XCircle aria-hidden="true" className="h-5 w-5 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                  {answers[currentIndex] !== undefined && (
                    <div className="rounded-control border border-border bg-surface-2 p-3 text-sm leading-relaxed text-text">
                      <p className="mb-1 font-semibold">{t('practiceExplanation')}</p>
                      <MarkdownRenderer content={questions[currentIndex].explanation} />
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap justify-between gap-2 border-t border-border pt-3">
                  <button
                    type="button"
                    onClick={() => setCurrentIndex((index) => Math.max(0, index - 1))}
                    disabled={currentIndex === 0}
                    className="min-h-11 rounded-control border border-border px-4 text-sm font-medium text-text hover:bg-surface-2 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-accent"
                  >
                    {t('practicePrevious')}
                  </button>
                  {currentIndex < questions.length - 1 ? (
                    <button
                      type="button"
                      onClick={() => setCurrentIndex((index) => Math.min(questions.length - 1, index + 1))}
                      disabled={answers[currentIndex] === undefined}
                      className="min-h-11 rounded-control bg-accent px-4 text-sm font-semibold text-on-accent hover:opacity-90 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-accent"
                    >
                      {t('practiceNext')}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => void finishQuiz()}
                      disabled={answers[currentIndex] === undefined || attemptStatus === 'saving'}
                      className="min-h-11 rounded-control bg-accent px-4 text-sm font-semibold text-on-accent hover:opacity-90 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-accent"
                    >
                      {t('practiceFinish')}
                    </button>
                  )}
                </div>
              </section>
            )}

            {isComplete && (
              <section aria-live="polite" className="space-y-4 rounded-tile border border-border bg-surface p-5 shadow-lift">
                <div className="text-center">
                  <Trophy aria-hidden="true" className="mx-auto h-10 w-10 text-accent-text" />
                  <h2 className="mt-2 text-xl font-semibold text-text">{t('practiceResultTitle')}</h2>
                  <p className="mt-1 text-3xl font-bold text-accent-text">{score}/{questions.length}</p>
                  <p className="text-sm text-muted">{t('practiceResultPercent').replace('{percent}', String(Math.round((score / questions.length) * 100)))}</p>
                </div>
                {mistakes.length > 0 ? (
                  <>
                    <div className="space-y-3">
                      <h3 className="font-semibold text-text">{t('practiceMistakesTitle')}</h3>
                      {mistakes.map(({ question, selected }, index) => (
                        <article key={question.id} className="space-y-2 rounded-control border border-border bg-bg p-3 text-sm">
                          <h4 className="font-medium text-text">{index + 1}. <MarkdownRenderer content={question.question} /></h4>
                          <p className="text-danger">{t('practiceYourAnswer')}: {question.options[selected]}</p>
                          <p className="text-accent-text">{t('practiceCorrectAnswer')}: {question.options[question.answerIndex]}</p>
                          <div className="text-muted"><MarkdownRenderer content={question.explanation} /></div>
                        </article>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => void saveMistakes()}
                      disabled={notesStatus === 'saving' || notesStatus === 'saved'}
                      className="min-h-11 w-full rounded-control border border-accent/40 bg-accent-soft px-4 text-sm font-semibold text-accent-text hover:opacity-90 disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-accent"
                    >
                      {notesStatus === 'saving' ? t('practiceSavingMistakes') : notesStatus === 'saved' ? t('practiceMistakesSaved') : t('practiceSaveMistakes')}
                    </button>
                    {notesStatus === 'failed' && <p role="alert" className="text-sm text-danger">{t('practiceSaveMistakesError')}</p>}
                  </>
                ) : (
                  <p className="rounded-control bg-accent-soft p-3 text-center text-sm font-medium text-accent-text">{t('practiceAllCorrect')}</p>
                )}
                {attemptStatus === 'saving' && <p role="status" className="text-center text-sm text-muted">{t('practiceSavingProgress')}</p>}
                {attemptStatus === 'saved' && <p role="status" className="text-center text-sm text-accent-text">{t('practiceProgressSaved')}</p>}
                {attemptStatus === 'guest' && (
                  <p className="text-center text-sm text-muted">
                    {t('practiceSignInForProgress')}{' '}
                    <button type="button" onClick={onOpenLogin} className="font-semibold text-accent-text underline">{t('signIn')}</button>
                  </p>
                )}
                {attemptStatus === 'failed' && (
                  <div className="space-y-2 text-center">
                    <p role="alert" className="text-sm text-danger">{t('practiceSaveProgressError')}</p>
                    <button type="button" onClick={() => void persistAttempt()} className="min-h-11 rounded-control border border-border px-4 text-sm font-medium text-text hover:bg-surface-2">
                      {t('retry')}
                    </button>
                  </div>
                )}
                <button
                  type="button"
                  onClick={startAnotherQuiz}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-control bg-accent px-4 text-sm font-semibold text-on-accent hover:opacity-90 focus-visible:outline-2 focus-visible:outline-accent"
                >
                  <RotateCw aria-hidden="true" className="h-4 w-4" />
                  {t('practiceAnother')}
                </button>
              </section>
            )}
          </section>
        ) : (
          <section className="space-y-4">
            {!user ? (
              <div className="rounded-tile border border-border bg-surface p-5 text-center">
                <BarChart3 aria-hidden="true" className="mx-auto h-8 w-8 text-muted" />
                <h2 className="mt-2 font-semibold text-text">{t('practiceSignInForProgress')}</h2>
                <button type="button" onClick={onOpenLogin} className="mt-3 min-h-11 rounded-control bg-accent px-4 text-sm font-semibold text-on-accent">
                  {t('signIn')}
                </button>
              </div>
            ) : progressLoading ? (
              <div role="status" className="flex items-center justify-center gap-2 rounded-tile border border-border bg-surface p-8 text-sm text-muted">
                <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
                {t('practiceProgressLoading')}
              </div>
            ) : progressError ? (
              <div className="rounded-tile border border-danger/30 bg-danger/10 p-4 text-sm text-danger">
                <p role="alert">{progressError}</p>
                <button type="button" onClick={() => setProgressReload((reload) => reload + 1)} className="mt-2 min-h-11 rounded-control border border-border px-3 text-text">
                  {t('retry')}
                </button>
              </div>
            ) : (
              <>
                <div className="grid gap-3 sm:grid-cols-3">
                  <article className="rounded-tile border border-border bg-surface p-4">
                    <p className="text-sm text-muted">{t('practiceAttemptsTotal')}</p>
                    <p className="mt-1 text-2xl font-semibold text-text">{progress?.totalAttempts || 0}</p>
                  </article>
                  <article className="rounded-tile border border-border bg-surface p-4">
                    <p className="text-sm text-muted">{t('practiceQuestionsTotal')}</p>
                    <p className="mt-1 text-2xl font-semibold text-text">{totalQuestions}</p>
                  </article>
                  <article className="rounded-tile border border-border bg-surface p-4">
                    <p className="text-sm text-muted">{t('practiceAverage')}</p>
                    <p className="mt-1 text-2xl font-semibold text-text">{totalQuestions ? `${average}%` : '—'}</p>
                  </article>
                </div>
                {attempts.length === 0 ? (
                  <div className="rounded-tile border border-dashed border-border bg-surface p-8 text-center">
                    <BookOpen aria-hidden="true" className="mx-auto h-8 w-8 text-muted" />
                    <h2 className="mt-2 font-semibold text-text">{t('practiceProgressEmpty')}</h2>
                    <button type="button" onClick={() => setActiveTab('practice')} className="mt-3 min-h-11 rounded-control bg-accent px-4 text-sm font-semibold text-on-accent">
                      {t('practiceStart')}
                    </button>
                  </div>
                ) : (
                  <div className="overflow-hidden rounded-tile border border-border bg-surface">
                    <h2 className="border-b border-border px-4 py-3 font-semibold text-text">{t('practiceRecentAttempts')}</h2>
                    <ul className="divide-y divide-border">
                      {attempts.map((attempt) => (
                        <li key={attempt.id} className="flex flex-wrap items-center justify-between gap-2 p-4">
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-medium text-text">{attempt.topic}</span>
                            <time className="block text-xs text-muted" dateTime={attempt.created_at}>
                              {new Date(attempt.created_at).toLocaleDateString(language === 'urdu' ? 'ur-PK' : language === 'roman-urdu' ? 'en-PK' : 'en')}
                            </time>
                          </span>
                          <span className="rounded-pill bg-accent-soft px-3 py-1 text-sm font-semibold text-accent-text">
                            {attempt.correct_count}/{attempt.total_count}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
