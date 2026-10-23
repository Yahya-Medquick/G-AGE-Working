import React, { useState, useEffect, useMemo, lazy, Suspense, useCallback, useRef } from 'react';
import { BookOpen, Check, ChevronRight, Code2, FileText, MessageCircle, Send, Sparkles } from 'lucide-react';
import { useTheme } from './hooks/useTheme';
import { useNotes } from './hooks/useNotes';
import { useUser } from './context/UserContext';
import { useChatSessions } from './hooks/useChatSessions';
import { useSwipeDrawers } from './hooks/useSwipeDrawers';
import { useQueryLimits } from './hooks/useQueryLimits';
import { initPersistentDeviceId } from './utils/deviceFingerprint';
import { getAuthHeaders } from './services/api';
import { ChatSidebar } from './components/chat/ChatSidebar';
import { PersonaPanel } from './components/chat/PersonaPanel';
import { ChatStage } from './components/chat/ChatStage';
import { PaywallModal } from './components/chat/PaywallModal';
import { PwaShortcutModal } from './components/chat/PwaShortcutModal';
import { AuthModal } from './components/AuthModal';
import { NotesSidePanel } from './components/NotesSidePanel';
import { ExpertPersona } from './data/experts';
import { usePersonas } from './hooks/usePersonas';
import { ChatMode, ChatMessage, ChatSession } from './types/chat';
import { PublicQAPage } from './components/PublicQAPage';
import { PersonaQuestionsPage } from './components/PersonaQuestionsPage';
import { MobileShell, type MobileScreen } from './components/MobileShell';

// Lazy-loaded secondary modals for optimal performance
const AdminDashboardModal = lazy(() =>
  import('./components/AdminDashboardModal').then((m) => ({ default: m.AdminDashboardModal }))
);
const UserProfileModal = lazy(() =>
  import('./components/UserProfileModal').then((m) => ({ default: m.UserProfileModal }))
);
const TopicCompareModal = lazy(() =>
  import('./components/TopicCompareModal').then((m) => ({ default: m.TopicCompareModal }))
);
const TopicTimelineModal = lazy(() =>
  import('./components/TopicTimelineModal').then((m) => ({ default: m.TopicTimelineModal }))
);
const DeveloperApiModal = lazy(() =>
  import('./components/DeveloperApiModal').then((m) => ({ default: m.DeveloperApiModal }))
);
const CompiledNotesModal = lazy(() =>
  import('./components/CompiledNotesModal').then((m) => ({ default: m.CompiledNotesModal }))
);
const KnowledgeGraphModal = lazy(() =>
  import('./components/KnowledgeGraphModal').then((m) => ({ default: m.KnowledgeGraphModal }))
);
const AndroidDownloadPage = lazy(() =>
  import('./components/AndroidDownloadPage').then((m) => ({ default: m.AndroidDownloadPage }))
);
const ProductTour = lazy(() =>
  import('./components/ProductTour').then((m) => ({ default: m.ProductTour }))
);

export default function App() {
  if (window.location.pathname.startsWith('/q/')) return <PublicQAPage />;
  if (/^\/persona\/[^/]+\/questions\/?$/.test(window.location.pathname)) return <PersonaQuestionsPage />;

  const [isMobile, setIsMobile] = useState(() => window.matchMedia('(max-width: 768px)').matches);
  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 768px)');
    const handleChange = (event: MediaQueryListEvent) => setIsMobile(event.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const { theme, toggleTheme } = useTheme();
  const { notes, addNote, loading: notesLoading, error: notesError } = useNotes();
  const { user, profile, isLoggedIn, isLoadingAuth, hasSeenOnboarding, isTourOpen } = useUser();

  // Chat sessions state manager
  const {
    sessions,
    isSessionStorageReady,
    activeSessionId,
    activeSession,
    selectSession,
    createSession,
    updateSessionMessages,
    updateSessionMeta,
    togglePinSession,
    renameSession,
    deleteSession,
  } = useChatSessions();

  // Query usage & paywall tracker
  const {
    usage,
    canExecuteQuery,
    refreshUsage,
    isPaywallOpen,
    triggerPaywall,
    closePaywall,
  } = useQueryLimits();

  // Initialize device fingerprinting on first app load
  useEffect(() => {
    initPersistentDeviceId().catch((err) => {
      console.warn("Device fingerprint init warning:", err);
    });
  }, []);

  // Layout panel collapse states (responsive defaults: open on desktop, closed on mobile)
  const [isLeftPanelOpen, setIsLeftPanelOpen] = useState<boolean>(() => window.innerWidth >= 1024);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState<boolean>(() => window.innerWidth >= 1280);
  const [initialPersonaGroup, setInitialPersonaGroup] = useState<string | null>(null);
  const handleToggleLeftPanel = useCallback(() => {
    const nextOpen = !isLeftPanelOpen;
    setIsLeftPanelOpen(nextOpen);
    if (nextOpen && window.innerWidth < 1024) setIsRightPanelOpen(false);
  }, [isLeftPanelOpen]);
  const handleToggleRightPanel = useCallback(() => {
    const nextOpen = !isRightPanelOpen;
    setIsRightPanelOpen(nextOpen);
    if (nextOpen && window.innerWidth < 1024) setIsLeftPanelOpen(false);
  }, [isRightPanelOpen]);
  const handleSwipeOpenLeft = useCallback(() => {
    setIsRightPanelOpen(false);
    setIsLeftPanelOpen(true);
  }, []);
  const handleSwipeOpenRight = useCallback(() => {
    setIsLeftPanelOpen(false);
    setIsRightPanelOpen(true);
  }, []);
  const handleSwipeCloseLeft = useCallback(() => setIsLeftPanelOpen(false), []);
  const handleSwipeCloseRight = useCallback(() => setIsRightPanelOpen(false), []);
  const swipeRootRef = useSwipeDrawers<HTMLDivElement>({
    isLeftOpen: isLeftPanelOpen,
    isRightOpen: isRightPanelOpen,
    viewportWidth: window.innerWidth,
    onOpenLeft: handleSwipeOpenLeft,
    onOpenRight: handleSwipeOpenRight,
    onCloseLeft: handleSwipeCloseLeft,
    onCloseRight: handleSwipeCloseRight,
  });

  // Active persona region variant ('global' | 'pk') - default to Pakistani first
  const [expertVariant, setExpertVariant] = useState<'global' | 'pk'>('pk');
  const [language, setLanguage] = useState<'english' | 'roman-urdu' | 'urdu'>(() => {
    return (localStorage.getItem('gage_language') as 'english' | 'roman-urdu' | 'urdu') || 'english';
  });

  const handleLanguageChange = useCallback((lang: 'english' | 'roman-urdu' | 'urdu') => {
    setLanguage(lang);
    localStorage.setItem('gage_language', lang);
  }, []);

  // Loading state for Gemini stream
  const [loadingSessionIds, setLoadingSessionIds] = useState<Set<string>>(new Set());
  const homePromptRef = useRef<{ sessionId: string; prompt: string } | null>(null);
  const inFlightSessionsRef = useRef(new Set<string>());
  const [pendingReplyMessageIds, setPendingReplyMessageIds] = useState<Set<string>>(new Set());
  const [chatErrorToast, setChatErrorToast] = useState('');
  const lastRegenerateAtRef = useRef(0);
  const [revealingReply, setRevealingReply] = useState<{ sessionId: string; message: ChatMessage } | null>(null);
  const activeSessionIdRef = useRef(activeSessionId);
  activeSessionIdRef.current = activeSessionId;
  const revealIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const revealFinishRef = useRef<(() => { sessionId: string; messages: ChatMessage[] } | null) | null>(null);
  const skipReveal = useCallback(() => revealFinishRef.current?.() || null, []);

  useEffect(() => () => {
    skipReveal();
  }, [skipReveal]);

  const previousActiveSessionIdRef = useRef(activeSessionId);
  useEffect(() => {
    if (previousActiveSessionIdRef.current !== activeSessionId) {
      skipReveal();
      previousActiveSessionIdRef.current = activeSessionId;
    }
  }, [activeSessionId, skipReveal]);

  // Modals state
  const [isLoginOpen, setIsLoginOpen] = useState<boolean>(false);
  const [isAdminOpen, setIsAdminOpen] = useState<boolean>(false);
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);
  const [isCompareOpen, setIsCompareOpen] = useState<boolean>(false);
  const [isTimelineOpen, setIsTimelineOpen] = useState<boolean>(false);
  const [isApiDocsOpen, setIsApiDocsOpen] = useState<boolean>(false);
  const [isNotesOpen, setIsNotesOpen] = useState<boolean>(false);
  const [isDownloadOpen, setIsDownloadOpen] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return (
      window.location.pathname.startsWith('/download') ||
      window.location.search.includes('view=download') ||
      window.location.search.includes('action=download')
    );
  });
  const [savedNotesCount, setSavedNotesCount] = useState<number>(0);
  const [saveNoteToast, setSaveNoteToast] = useState<boolean>(false);
  const [isKnowledgeGraphOpen, setIsKnowledgeGraphOpen] = useState<boolean>(false);
  const [compiledNotesModalState, setCompiledNotesModalState] = useState<{
    isOpen: boolean;
    compiledText: string;
    subjectTags: string[];
  }>({ isOpen: false, compiledText: '', subjectTags: [] });
  const [pwaPersona, setPwaPersona] = useState<ExpertPersona | null>(null);

  const handleOpenDownload = useCallback(() => {
    setIsDownloadOpen(true);
    if (window.location.pathname !== '/download') {
      window.history.pushState({}, '', '/download');
    }
  }, []);

  const handleOpenPersonaGroup = (groupName: string) => {
    setInitialPersonaGroup(groupName);
    setIsRightPanelOpen(true);
    if (window.innerWidth < 1024) setIsLeftPanelOpen(false);
  };

  const handleCloseDownload = useCallback(() => {
    setIsDownloadOpen(false);
    if (window.location.pathname === '/download') {
      window.history.pushState({}, '', '/');
    }
  }, []);

  // Listen to popstate for /download browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      if (
        window.location.pathname.startsWith('/download') ||
        window.location.search.includes('view=download')
      ) {
        setIsDownloadOpen(true);
      } else {
        setIsDownloadOpen(false);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // TWA/Android back button: press twice to exit, once to close panels
  useEffect(() => {
    let lastBackPress = 0;
    let toastTimeout: ReturnType<typeof setTimeout> | null = null;

    const handleTwaBack = (e: PopStateEvent) => {
      // If any panel/modal is open, let it close naturally via popstate
      const anyPanelOpen = isLeftPanelOpen || document.querySelector('[data-modal="open"]');
      if (anyPanelOpen) return;

      // Nothing open — handle exit with double-back toast
      const now = Date.now();
      if (now - lastBackPress < 2000) {
        // Second back press within 2s — exit
        if (toastTimeout) clearTimeout(toastTimeout);
        window.history.go(-(window.history.length));
        return;
      }

      // First back press — push a dummy state to intercept, show toast
      lastBackPress = now;
      window.history.pushState({ twaBack: true }, '');

      // Show toast
      const existing = document.getElementById('twa-exit-toast');
      if (existing) existing.remove();
      const toast = document.createElement('div');
      toast.id = 'twa-exit-toast';
      toast.textContent = 'Press back again to exit';
      toast.style.cssText = [
        'position:fixed', 'bottom:80px', 'left:50%', 'transform:translateX(-50%)',
        'background:rgba(15,23,42,0.92)', 'color:#f1f5f9', 'padding:10px 22px',
        'border-radius:24px', 'font-size:13px', 'font-weight:600',
        'z-index:99999', 'pointer-events:none', 'box-shadow:0 4px 24px rgba(0,0,0,0.3)',
        'border:1px solid rgba(255,255,255,0.08)', 'backdrop-filter:blur(8px)',
        'transition:opacity 0.3s ease', 'opacity:1'
      ].join(';');
      document.body.appendChild(toast);

      toastTimeout = setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
        lastBackPress = 0;
      }, 2000);
    };

    window.addEventListener('popstate', handleTwaBack);
    // Push initial state so first back press is intercepted
    window.history.pushState({ twaInit: true }, '');

    return () => {
      window.removeEventListener('popstate', handleTwaBack);
      if (toastTimeout) clearTimeout(toastTimeout);
      const toast = document.getElementById('twa-exit-toast');
      if (toast) toast.remove();
    };
  }, [isLeftPanelOpen]);

  // Selected persona resolution
  const { globalExperts, pkExperts } = usePersonas();
  const activeVariant = activeSession?.variant || expertVariant;
  const activeExpertSet = activeVariant === 'pk' ? pkExperts : globalExperts;
  const currentPersonaId = activeSession?.personaId || 'hamza';
  const activePersona: ExpertPersona =
    activeExpertSet[currentPersonaId] || Object.values(activeExpertSet)[0];
  const displayedSession = activeSession && revealingReply?.sessionId === activeSession.id
    ? { ...activeSession, messages: [...activeSession.messages, revealingReply.message] }
    : activeSession;
  const isSubjectPromptActive = Boolean(
    activeSession?.subjectPromptStatus === 'pending' &&
    !isLoadingAuth &&
    hasSeenOnboarding &&
    !isTourOpen
  );

  const bootstrapStoragePrefixRef = useRef<string | null>(null);
  const initialSearchRef = useRef(window.location.search);

  // Initial bootstrap: create initial session if none exists or parse URL params
  useEffect(() => {
    const storagePrefix = user?.id ? `user_${user.id}` : 'guest';
    if (isLoadingAuth || !isSessionStorageReady || bootstrapStoragePrefixRef.current === storagePrefix) return;

    const urlParams = new URLSearchParams(initialSearchRef.current);
    const urlSession = urlParams.get('session');
    const urlPersona = urlParams.get('persona');
    const urlMode = (urlParams.get('mode') || 'concept') as ChatMode;

    if (urlPersona) {
      const allExperts = { ...globalExperts, ...pkExperts };
      const matched =
        allExperts[urlPersona] ||
        Object.values(allExperts).find((p) => p.slug === urlPersona || p.id === urlPersona);

      if (matched) {
        const isPk = !!pkExperts[matched.id] || matched.variant === 'pk';
        if (isPk) {
          setExpertVariant('pk');
        }

        const existingSession = sessions.find((s) => s.personaId === matched.id);
        if (existingSession) {
          bootstrapStoragePrefixRef.current = storagePrefix;
          selectSession(existingSession.id);
          if (existingSession.subjectPromptStatus === 'pending') {
            updateSessionMeta(existingSession.id, { subjectPromptStatus: 'chosen' });
          }
          return;
        }

        bootstrapStoragePrefixRef.current = storagePrefix;
        createSession(
          matched.id,
          urlMode,
          `${matched.name} Session`,
          `${matched.name} Session`,
          isPk ? 'pk' : 'global',
          matched
        );
        return;
      }
    }

    if (urlSession && sessions.some((s) => s.id === urlSession)) {
      bootstrapStoragePrefixRef.current = storagePrefix;
      selectSession(urlSession);
      return;
    }

    if (sessions.length === 0) {
      bootstrapStoragePrefixRef.current = storagePrefix;
      const initialPersonaId = urlPersona || 'hamza';
      const initialSession = createSession(initialPersonaId, urlMode, 'General Discussion', 'General Discussion', expertVariant, activePersona);
      if (!urlPersona) {
        updateSessionMeta(initialSession.id, { subjectPromptStatus: 'pending' });
      }
    } else if (!activeSessionId) {
      bootstrapStoragePrefixRef.current = storagePrefix;
      selectSession(sessions[0].id);
    } else {
      bootstrapStoragePrefixRef.current = storagePrefix;
    }
  }, [
    activeSessionId,
    activePersona,
    createSession,
    expertVariant,
    globalExperts,
    isLoadingAuth,
    isSessionStorageReady,
    pkExperts,
    selectSession,
    sessions,
    updateSessionMeta,
    user?.id,
  ]);

  // Synchronize active persona with browser URL query parameter for PWA shortcut capture
  useEffect(() => {
    if (activePersona && activeSession && activeSession.subjectPromptStatus !== 'pending') {
      const personaKey = activePersona.slug || activePersona.id;
      const currentUrl = new URL(window.location.href);
      if (currentUrl.searchParams.get('persona') !== personaKey) {
        currentUrl.searchParams.set('persona', personaKey);
        window.history.replaceState(null, '', `${currentUrl.pathname}?${currentUrl.searchParams.toString()}`);
      }
    }
  }, [activePersona?.id, activePersona?.slug, activeSession?.id, activeSession?.subjectPromptStatus]);

  // Handle window resize to auto-adapt sidebars
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsLeftPanelOpen(false);
        setIsRightPanelOpen(isSubjectPromptActive);
      } else if (window.innerWidth < 1280) {
        setIsRightPanelOpen(isSubjectPromptActive);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isSubjectPromptActive]);

  // Create new chat
  const handleNewChat = useCallback(() => {
    skipReveal();
    const newSession = createSession('hamza', 'concept', 'General Discussion', 'New Chat', activeVariant);
    updateSessionMeta(newSession.id, { subjectPromptStatus: 'pending' });
    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.delete('persona');
    window.history.replaceState(null, '', `${currentUrl.pathname}${currentUrl.search}${currentUrl.hash}`);
    if (window.innerWidth < 1024) {
      setIsLeftPanelOpen(false);
      setIsRightPanelOpen(true);
    } else {
      setIsRightPanelOpen(true);
    }
    return newSession.id;
  }, [createSession, activeVariant, skipReveal, updateSessionMeta]);

  useEffect(() => {
    if (!isSubjectPromptActive) return;
    setIsRightPanelOpen(true);
    if (window.innerWidth < 1024) setIsLeftPanelOpen(false);
  }, [isSubjectPromptActive, activeSessionId]);

  const handleSkipSubjectPrompt = useCallback(() => {
    if (activeSessionId) {
      updateSessionMeta(activeSessionId, { subjectPromptStatus: 'skipped' });
    }
    setIsRightPanelOpen(false);
  }, [activeSessionId, updateSessionMeta]);

  // Keyboard shortcut: Ctrl+K or Cmd+K for New Chat
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        handleNewChat();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNewChat]);

  // Switch persona in ongoing chat session
  const handleSelectPersona = useCallback(
    (personaId: string, variant: 'global' | 'pk') => {
      setExpertVariant(variant);
      if (activeSessionId) {
        const expertSet = variant === 'pk' ? pkExperts : globalExperts;
        const persona = expertSet[personaId] || Object.values(expertSet)[0];
        updateSessionMeta(activeSessionId, {
          personaId: persona.id,
          variant,
          ...(activeSession?.subjectPromptStatus === 'pending' ? { subjectPromptStatus: 'chosen' as const } : {}),
        });
        if (
          activeSession.messages.length === 1 &&
          activeSession.messages[0].role === 'assistant'
        ) {
          const opener = persona.opener
            ? persona.opener(activeSession.title)
            : `Hello! How can I assist your ${activeSession.mode} exploration on ${activeSession.title}?`;
          updateSessionMessages(activeSessionId, [{
            ...activeSession.messages[0],
            content: opener,
            personaId: persona.id,
            personaVariant: variant,
            personaName: persona.name,
            personaInitials: persona.initials,
          }]);
        }
      }
      if (window.innerWidth < 1024) {
        setIsRightPanelOpen(false);
      }
    },
    [activeSession, activeSessionId, pkExperts, globalExperts, updateSessionMeta, updateSessionMessages]
  );

  const requestReplyAt = async (
    sessionId: string,
    historyUpToIndex: number,
    options: {
      session: ChatSession;
      messages: ChatMessage[];
      newTitle?: string;
      savePublic?: boolean;
      isRegenerate?: boolean;
      isEdit?: boolean;
      previousQuestion?: string;
      onEditFailure?: () => void;
      animate?: boolean;
    }
  ) => {
    if (inFlightSessionsRef.current.has(sessionId)) return false;
    const { session: requestSession, messages, newTitle = options.session.title } = options;
    const userMessage = messages[historyUpToIndex];
    if (!userMessage || userMessage.role !== 'user') return false;

    const targetMode = userMessage.mode || requestSession.mode || 'concept';
    const replyIndex = historyUpToIndex + 1;
    const priorAssistant = messages[replyIndex]?.role === 'assistant' ? messages[replyIndex] : undefined;
    const history = messages.slice(0, historyUpToIndex + 1);
    inFlightSessionsRef.current.add(sessionId);
    setLoadingSessionIds((current) => new Set(current).add(sessionId));
    if (priorAssistant) setPendingReplyMessageIds((current) => new Set(current).add(priorAssistant.id));

    try {
      const response = await fetch('/api/chat/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({
          sessionId,
          personaId: requestSession.personaId,
          mode: targetMode,
          specs: requestSession.specs || {},
          variant: requestSession.variant || expertVariant,
          savePublic: options.savePublic ?? true,
          isRegenerate: options.isRegenerate ?? false,
          isEdit: options.isEdit ?? false,
          previousQuestion: options.previousQuestion,
          language,
          messages: history.map((message) => ({
            id: message.id,
            role: message.role,
            content: message.content,
            images: message.images?.length ? message.images : message.imageBase64 ? [message.imageBase64] : undefined,
          })),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 429 || response.status === 403 || errorData.isPaywall || errorData.paywallTrigger) {
          triggerPaywall();
          if (!options.isRegenerate && !options.isEdit) {
            const limitMessage: ChatMessage = {
              id: `msg_${Date.now()}_a`,
              role: 'assistant',
              content: `⚠️ **Query Limit Reached**\n\n${errorData.message || errorData.error || 'You have reached your daily query allowance. Please upgrade to Pro for unlimited AI queries and vision analysis.'}`,
              timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
              mode: targetMode,
              personaId: requestSession.personaId,
              personaVariant: requestSession.variant || expertVariant,
            };
            const updatedMessages = [...messages];
            updatedMessages.splice(replyIndex, priorAssistant ? 1 : 0, limitMessage);
            updateSessionMessages(sessionId, updatedMessages, newTitle);
          } else if (options.isEdit) {
            options.onEditFailure?.();
            setChatErrorToast(`Unable to save edit: ${errorData.message || errorData.error || 'Please try again.'}`);
          }
          return false;
        }
        throw new Error(errorData.error || `Server returned ${response.status}`);
      }

      const data = await response.json();
      const assistantMessage: ChatMessage = {
        id: priorAssistant?.id || `msg_${Date.now()}_a`,
        role: 'assistant',
        content: data.reply || 'No response received.',
        timestamp: data.timestamp || new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
        mode: targetMode,
        personaId: typeof data.personaId === 'string' && data.personaId
          ? data.personaId
          : requestSession.personaId,
        personaVariant: data.personaVariant === 'pk' || data.personaVariant === 'global'
          ? data.personaVariant
          : requestSession.variant || expertVariant,
        personaName: typeof data.persona_name === 'string' ? data.persona_name : '',
        personaInitials: typeof data.initials === 'string' ? data.initials : '',
        metadata: {
          ...(typeof data.suggestedGroup === 'string' && data.suggestedGroup
            ? { suggestedGroup: data.suggestedGroup }
            : {}),
          ...(targetMode === 'research' && data.sources ? { sources: data.sources } : {}),
        },
      };
      const updatedMessages = [...messages];
      updatedMessages.splice(replyIndex, priorAssistant ? 1 : 0, assistantMessage);

      if (options.animate && activeSessionIdRef.current === sessionId) {
        const fullReply = assistantMessage.content;
        setRevealingReply({ sessionId, message: { ...assistantMessage, content: '' } });
        let completed = false;
        const finishReveal = () => {
          if (completed) return { sessionId, messages: updatedMessages };
          completed = true;
          if (revealIntervalRef.current) clearInterval(revealIntervalRef.current);
          revealIntervalRef.current = null;
          revealFinishRef.current = null;
          setRevealingReply(null);
          updateSessionMessages(sessionId, updatedMessages, newTitle);
          refreshUsage();
          return { sessionId, messages: updatedMessages };
        };
        revealFinishRef.current = finishReveal;
        const tokens = fullReply.match(/\s+|\S+/g) || [];
        const totalWords = tokens.filter((token: string) => /\S/.test(token)).length;
        const wordsPerTick = Math.max(1, Math.ceil(totalWords / 60));
        let tokenIndex = 0;
        revealIntervalRef.current = setInterval(() => {
          let wordsRevealed = 0;
          while (tokenIndex < tokens.length && wordsRevealed < wordsPerTick) {
            if (/\S/.test(tokens[tokenIndex])) wordsRevealed += 1;
            tokenIndex += 1;
          }
          while (tokenIndex < tokens.length && /^\s+$/.test(tokens[tokenIndex])) tokenIndex += 1;
          if (tokenIndex >= tokens.length) {
            finishReveal();
            return;
          }
          setRevealingReply({ sessionId, message: { ...assistantMessage, content: tokens.slice(0, tokenIndex).join('') } });
        }, 40);
      } else {
        updateSessionMessages(sessionId, updatedMessages, newTitle);
        if (!options.isRegenerate && !options.isEdit) refreshUsage();
      }
      return true;
    } catch (err: any) {
      console.warn('Chat error:', err);
      const errorText = err.message || 'Please check your connection and try again.';
      if (options.isRegenerate || options.isEdit) {
        if (options.isEdit) options.onEditFailure?.();
        setChatErrorToast(`Unable to ${options.isEdit ? 'save edit' : 'regenerate response'}: ${errorText}`);
      } else {
        const errorMessage: ChatMessage = {
          id: `msg_${Date.now()}_a`,
          role: 'assistant',
          content: `⚠️ **Connection Error**\n\nUnable to generate response: ${errorText}`,
          timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
          mode: targetMode,
          personaId: requestSession.personaId,
          personaVariant: requestSession.variant || expertVariant,
        };
        const failedMessages = [...messages];
        failedMessages.splice(replyIndex, priorAssistant ? 1 : 0, errorMessage);
        updateSessionMessages(sessionId, failedMessages, newTitle);
      }
      return false;
    } finally {
      inFlightSessionsRef.current.delete(sessionId);
      setLoadingSessionIds((current) => {
        const next = new Set(current);
        next.delete(sessionId);
        return next;
      });
      if (priorAssistant) {
        setPendingReplyMessageIds((current) => {
          const next = new Set(current);
          next.delete(priorAssistant.id);
          return next;
        });
      }
    }
  };

  // Normal sends append a user message, then share the indexed request flow.
  const handleSendMessage = async (content: string, modeOverride?: ChatMode, images?: string[], savePublic = true) => {
    if (!content.trim() && !images?.length) return;
    if (activeSession?.subjectPromptStatus === 'pending') {
      updateSessionMeta(activeSession.id, { subjectPromptStatus: 'skipped' });
      if (window.innerWidth < 1024) setIsRightPanelOpen(false);
    }
    const finalizedReveal = skipReveal();
    if (!canExecuteQuery()) {
      triggerPaywall();
      return;
    }
    const currentSession = activeSession || createSession('hamza', 'concept', (content || 'Image Analysis').slice(0, 32), undefined, activeVariant, activePersona);
    if (inFlightSessionsRef.current.has(currentSession.id)) return;
    const targetMode = modeOverride || currentSession.mode || 'concept';
    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}_u`,
      role: 'user',
      content: content.trim() || (images?.length ? 'Please analyze these attached images/diagrams.' : ''),
      timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
      mode: targetMode,
      personaId: currentSession.personaId,
      images: images?.length ? images : undefined,
    };
    const currentMessages = finalizedReveal?.sessionId === currentSession.id ? finalizedReveal.messages : currentSession.messages;
    const messages = [...currentMessages, userMessage];
    const isFirstUserMsg = currentSession.messages.filter((message) => message.role === 'user').length === 0;
    const newTitle = isFirstUserMsg ? (content.trim() || 'Image Analysis').slice(0, 36) : currentSession.title;
    updateSessionMessages(currentSession.id, messages, newTitle);
    await requestReplyAt(currentSession.id, messages.length - 1, {
      session: { ...currentSession, mode: targetMode },
      messages,
      newTitle,
      savePublic,
      animate: true,
    });
  };

  useEffect(() => {
    const pendingPrompt = homePromptRef.current;
    if (!pendingPrompt || !activeSessionId) return;
    if (pendingPrompt.sessionId !== activeSessionId) {
      homePromptRef.current = null;
      return;
    }
    homePromptRef.current = null;
    void handleSendMessage(pendingPrompt.prompt);
  }, [activeSessionId]);

  const handleRegenerateMessage = async (assistantId: string, userMessageIndex: number) => {
    const now = Date.now();
    if (now - lastRegenerateAtRef.current < 3000) return;
    const currentSession = sessions.find((session) => session.id === activeSessionId);
    if (!currentSession || inFlightSessionsRef.current.has(currentSession.id)) return;
    const lastAssistantIndex = currentSession.messages.reduce(
      (latestIndex, message, index) => message.role === 'assistant' ? index : latestIndex,
      -1
    );
    if (
      currentSession.messages[userMessageIndex]?.role !== 'user' ||
      userMessageIndex + 1 !== lastAssistantIndex ||
      currentSession.messages[userMessageIndex + 1]?.id !== assistantId
    ) return;
    lastRegenerateAtRef.current = now;
    setChatErrorToast('');
    await requestReplyAt(currentSession.id, userMessageIndex, {
      session: currentSession,
      messages: currentSession.messages,
      savePublic: true,
      isRegenerate: true,
    });
  };

  const handleEditMessage = async (messageId: string, content: string, images: string[]) => {
    const currentSession = sessions.find((session) => session.id === activeSessionId);
    if (!currentSession || inFlightSessionsRef.current.has(currentSession.id)) return false;
    const messageIndex = currentSession.messages.findIndex((message) => message.id === messageId);
    const originalMessage = currentSession.messages[messageIndex];
    if (!originalMessage || originalMessage.role !== 'user') return false;

    const previousMessages = currentSession.messages;
    const editedMessage: ChatMessage = {
      ...originalMessage,
      content: content.trim(),
      images: images.length ? images : undefined,
      edited: true,
    };
    delete editedMessage.imageBase64;
    const truncatedMessages = [...previousMessages.slice(0, messageIndex), editedMessage];
    updateSessionMessages(currentSession.id, truncatedMessages);
    return requestReplyAt(currentSession.id, messageIndex, {
      session: currentSession,
      messages: truncatedMessages,
      savePublic: true,
      isEdit: true,
      previousQuestion: originalMessage.content,
      onEditFailure: () => updateSessionMessages(currentSession.id, previousMessages),
    });
  };

  useEffect(() => {
    if (!chatErrorToast) return;
    const timer = setTimeout(() => setChatErrorToast(''), 5000);
    return () => clearTimeout(timer);
  }, [chatErrorToast]);

  // Auto-dismiss save note toast notification after 2 seconds
  useEffect(() => {
    if (!saveNoteToast) return;
    const timer = setTimeout(() => {
      setSaveNoteToast(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, [saveNoteToast]);

  // Save to Notes callback (silent save with badge count increment and toast notification)
  const handleSaveToNotes = (content: string, title?: string) => {
    const noteTitle = title || `${activePersona.name} Note`;
    const subject = activeSession?.mode || 'General';
    addNote(noteTitle, content, subject);
    setSavedNotesCount((prev) => prev + 1);
    setSaveNoteToast(true);
  };

  return (
    <div ref={swipeRootRef} className={isMobile ? 'mobile-app-root' : 'h-screen w-screen bg-[#F3F6F1] dark:bg-[#0B1612] text-[#10231C] dark:text-[#E8F2EC] flex overflow-hidden font-body selection:bg-[#0A5C45] dark:selection:bg-[#0F8056] selection:text-white transition-colors duration-200'}>
      {chatErrorToast && (
        <div role="alert" className="fixed top-4 right-4 z-[100] max-w-sm rounded-lg border border-rose-300 bg-white px-4 py-3 text-sm text-rose-700 shadow-lg dark:border-rose-900 dark:bg-slate-900 dark:text-rose-300">
          <div className="flex items-start gap-3">
            <span>{chatErrorToast}</span>
            <button type="button" onClick={() => setChatErrorToast('')} className="shrink-0 font-semibold" aria-label="Dismiss error">×</button>
          </div>
        </div>
      )}
      {isMobile ? (
        <MobileShell
          renderScreen={(screen: MobileScreen, navigate) => {
            if (screen === 'home') {
              const personaMap = new Map<string, ExpertPersona>();
              for (const persona of Object.values(activeExpertSet)) {
                personaMap.set(persona.slug || persona.id, persona);
              }
              const mentorGroups = Array.from(
                new Set(
                  Array.from(personaMap.values()).map(
                    (mentor) => mentor.group_name || mentor.badge || 'General'
                  )
                )
              )
                .sort((a, b) => a.localeCompare(b))
                .slice(0, 8);
              const recentNotes = [...notes]
                .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
                .slice(0, 3);
              const recentSessions = [...sessions]
                .sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime())
                .slice(0, 3);

              return (
                <div className="mobile-home-content" dir={language === 'urdu' ? 'rtl' : 'ltr'}>
                  <header className="mobile-home-greeting">
                    <span>Assalam-o-Alaikum</span>
                    <h1>{user?.name || profile.name}</h1>
                    <p>How can I help you learn today?</p>
                  </header>

                  <form
                    className="mobile-home-ask"
                    onSubmit={(event) => {
                      event.preventDefault();
                      const input = event.currentTarget.elements.namedItem('home-prompt');
                      const value = input instanceof HTMLInputElement ? input.value.trim() : '';
                      if (!value) return;
                      const sessionId = handleNewChat();
                      homePromptRef.current = { sessionId, prompt: value };
                      navigate('chat');
                    }}
                  >
                    <Sparkles aria-hidden="true" className="mobile-home-ask-sparkle" />
                    <input
                      name="home-prompt"
                      type="text"
                      placeholder="Ask any study question..."
                      aria-label="Ask a study question"
                      dir={language === 'urdu' ? 'rtl' : 'auto'}
                    />
                    <button type="submit" aria-label="Send question">
                      <Send aria-hidden="true" />
                    </button>
                  </form>

                  <section className="mobile-home-section" aria-labelledby="mobile-mentors-heading">
                    <div className="mobile-home-section-heading">
                      <h2 id="mobile-mentors-heading">Specialist Mentors</h2>
                      <button type="button" onClick={() => navigate('mentors')}>
                        View all <ChevronRight aria-hidden="true" />
                      </button>
                    </div>
                    <div className="mobile-home-carousel" dir="ltr">
                      {Array.from(personaMap.values()).map((mentor) => (
                        <button
                          type="button"
                          className="mobile-mentor-card"
                          key={mentor.id}
                          onClick={() => {
                            handleSelectPersona(mentor.id, activeVariant);
                            navigate('chat');
                          }}
                        >
                          <span
                            className="mobile-mentor-avatar"
                            style={{ backgroundColor: mentor.avatar_color || 'var(--color-primary)' }}
                            aria-hidden="true"
                          >
                            {mentor.initials}
                          </span>
                          <strong>{mentor.name}</strong>
                          <span>{mentor.badge}</span>
                        </button>
                      ))}
                    </div>
                  </section>

                  <section className="mobile-home-section" aria-labelledby="mobile-subjects-heading">
                    <div className="mobile-home-section-heading">
                      <h2 id="mobile-subjects-heading">Quick Subjects</h2>
                      <button type="button" onClick={() => navigate('mentors')}>
                        See all subjects <ChevronRight aria-hidden="true" />
                      </button>
                    </div>
                    <div className="mobile-subject-chips">
                      {mentorGroups.map((group) => (
                        <button
                          type="button"
                          className="mobile-subject-chip"
                          key={group}
                          onClick={() => {
                            setInitialPersonaGroup(group);
                            navigate('mentors');
                          }}
                        >
                          <BookOpen aria-hidden="true" />
                          <span>{group}</span>
                        </button>
                      ))}
                    </div>
                  </section>

                  <section className="mobile-home-section" aria-labelledby="mobile-notes-heading">
                    <div className="mobile-home-section-heading">
                      <h2 id="mobile-notes-heading">Recent Notes</h2>
                      <button type="button" onClick={() => navigate('notes')}>
                        View all <ChevronRight aria-hidden="true" />
                      </button>
                    </div>
                    {notesError && <p className="mobile-home-message" role="status">{notesError}</p>}
                    {notesLoading && notes.length === 0 ? (
                      <p className="mobile-home-message">Loading notes...</p>
                    ) : recentNotes.length === 0 ? (
                      <p className="mobile-home-message">Your saved notes will appear here.</p>
                    ) : (
                      <div className="mobile-home-note-list">
                        {recentNotes.map((note) => (
                          <button
                            type="button"
                            className="mobile-home-note"
                            key={note.id}
                            onClick={() => navigate('notes')}
                          >
                            <FileText aria-hidden="true" />
                            <span className="mobile-home-note-copy">
                              <strong>{note.title}</strong>
                              <span>{note.subject_tag || 'General'} · {new Date(note.updated_at).toLocaleDateString()}</span>
                              <span className="mobile-home-note-preview">{note.content}</span>
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </section>

                  <section className="mobile-home-section mobile-home-recent-chats" aria-labelledby="mobile-chats-heading">
                    <div className="mobile-home-section-heading">
                      <h2 id="mobile-chats-heading">Recent Chats</h2>
                      <button
                        type="button"
                        onClick={() => {
                          handleNewChat();
                          navigate('chat');
                        }}
                      >
                        New chat <ChevronRight aria-hidden="true" />
                      </button>
                    </div>
                    {recentSessions.length === 0 ? (
                      <p className="mobile-home-message">Your recent chats will appear here.</p>
                    ) : (
                      recentSessions.map((session) => (
                        <button
                          type="button"
                          className="mobile-home-chat"
                          key={session.id}
                          onClick={() => {
                            skipReveal();
                            selectSession(session.id);
                            navigate('chat');
                          }}
                        >
                          <MessageCircle aria-hidden="true" />
                          <span>{session.title}</span>
                          <ChevronRight aria-hidden="true" />
                        </button>
                      ))
                    )}
                  </section>
                </div>
              );
            }
            if (screen === 'chat') {
              return (
                <div className="mobile-chat-stage">
                  <ChatStage
                    session={displayedSession}
                    activePersona={activePersona}
                    variant={activeVariant}
                    globalPersonas={globalExperts}
                    pkPersonas={pkExperts}
                    language={language}
                    isStreamingReply={revealingReply?.sessionId === activeSessionId}
                    onLanguageChange={handleLanguageChange}
                    onSendMessage={handleSendMessage}
                    onRegenerateMessage={handleRegenerateMessage}
                    onEditMessage={handleEditMessage}
                    pendingReplyMessageIds={pendingReplyMessageIds}
                    isLoading={!!activeSessionId && loadingSessionIds.has(activeSessionId)}
                    onToggleLeftPanel={() => navigate('profile')}
                    isLeftPanelOpen={false}
                    onToggleRightPanel={() => navigate('mentors')}
                    isRightPanelOpen={false}
                    onUpdateSessionMeta={updateSessionMeta}
                    onSaveToNotes={handleSaveToNotes}
                    onOpenPaywall={triggerPaywall}
                    onOpenPersonaGroup={handleOpenPersonaGroup}
                    onOpenKnowledgeGraph={() => setIsKnowledgeGraphOpen(true)}
                    queryUsage={usage}
                  />
                </div>
              );
            }
            if (screen === 'mentors') {
              return (
                <PersonaPanel
                  isOpen
                  subjectPromptActive={isSubjectPromptActive}
                  onSkipSubjectPrompt={handleSkipSubjectPrompt}
                  initialGroup={initialPersonaGroup}
                  onGroupConsumed={() => setInitialPersonaGroup(null)}
                  onToggle={() => navigate('home')}
                  selectedPersonaId={currentPersonaId}
                  onSelectPersona={(id, variant) => {
                    handleSelectPersona(id, variant);
                    navigate('chat');
                  }}
                  variant={activeVariant}
                  onToggleVariant={(variant) => {
                    setExpertVariant(variant);
                    if (activeSession) updateSessionMeta(activeSession.id, { variant });
                  }}
                  onOpenPwaShortcut={(persona) => setPwaPersona(persona)}
                  onSelectPrompt={(prompt) => {
                    navigate('chat');
                    void handleSendMessage(prompt);
                  }}
                  onSelectTopic={(topic) => {
                    createSession(currentPersonaId, 'concept', topic, topic, activeVariant, activePersona);
                    navigate('chat');
                  }}
                  onOpenPaywall={triggerPaywall}
                />
              );
            }
            if (screen === 'notes') {
              return <NotesSidePanel isOpen onClose={() => navigate('home')} persona={activePersona} />;
            }
            return (
              <div className="mobile-profile-content">
                <label className="mobile-profile-language">
                  <span>Language</span>
                  <select
                    value={language}
                    onChange={(event) => handleLanguageChange(event.target.value as 'english' | 'roman-urdu' | 'urdu')}
                    aria-label="Language"
                  >
                    <option value="english">English</option>
                    <option value="roman-urdu">Roman Urdu</option>
                    <option value="urdu">اردو</option>
                  </select>
                </label>
                <ChatSidebar
                  isOpen
                  onToggle={() => navigate('home')}
                  sessions={sessions}
                  globalPersonas={globalExperts}
                  pkPersonas={pkExperts}
                  activeSessionId={activeSessionId}
                  onSelectSession={(id) => {
                    skipReveal();
                    selectSession(id);
                    navigate('chat');
                  }}
                  onNewChat={() => {
                    handleNewChat();
                    navigate('chat');
                  }}
                  onRenameSession={renameSession}
                  onDeleteSession={deleteSession}
                  onPinSession={togglePinSession}
                  onOpenNotes={() => {
                    setSavedNotesCount(0);
                    navigate('notes');
                  }}
                  notesCount={savedNotesCount}
                  onOpenAdmin={() => setIsAdminOpen(true)}
                  onOpenApiDocs={() => setIsApiDocsOpen(true)}
                  onOpenProfile={() => setIsProfileOpen(true)}
                  onOpenLogin={() => setIsLoginOpen(true)}
                  onOpenPaywall={triggerPaywall}
                  onOpenDownload={handleOpenDownload}
                  queryUsage={usage}
                  theme={theme}
                  toggleTheme={toggleTheme}
                  showAdminButton={Boolean(localStorage.getItem('admin_token'))}
                  showBrandHeader={false}
                />
                <button
                  type="button"
                  className="mobile-profile-api"
                  onClick={() => setIsApiDocsOpen(true)}
                >
                  <Code2 aria-hidden="true" />
                  <span>Developer API</span>
                  <ChevronRight aria-hidden="true" />
                </button>
              </div>
            );
          }}
        />
      ) : (
      <>
      {/* 1. LEFT PANEL: CHAT HISTORY SIDEBAR */}
      <ChatSidebar
        isOpen={isLeftPanelOpen}
        onToggle={handleToggleLeftPanel}
        sessions={sessions}
        globalPersonas={globalExperts}
        pkPersonas={pkExperts}
        activeSessionId={activeSessionId}
        onSelectSession={(id) => {
          skipReveal();
          selectSession(id);
          if (window.innerWidth < 1024) setIsLeftPanelOpen(false);
        }}
        onNewChat={handleNewChat}
        onRenameSession={renameSession}
        onDeleteSession={deleteSession}
        onPinSession={togglePinSession}
        onOpenNotes={() => {
          setIsNotesOpen(true);
          setSavedNotesCount(0);
        }}
        notesCount={savedNotesCount}
        onOpenAdmin={() => setIsAdminOpen(true)}
        onOpenApiDocs={() => setIsApiDocsOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
        onOpenLogin={() => setIsLoginOpen(true)}
        onOpenPaywall={triggerPaywall}
        onOpenDownload={handleOpenDownload}
        queryUsage={usage}
        theme={theme}
        toggleTheme={toggleTheme}
      />

      {/* 2. CENTER PANEL: MAIN CHAT STAGE */}
      <div
        className="flex-1 min-w-0 h-full"
        data-swipe-stage
        style={{ touchAction: 'pan-y' }}
        onClickCapture={(event) => {
          if (event.target instanceof Element && event.target.closest('div.flex.flex-col.max-w-3xl.mx-auto.w-full')) {
            skipReveal();
          }
        }}
      >
        <ChatStage
          session={displayedSession}
          activePersona={activePersona}
          variant={activeVariant}
          globalPersonas={globalExperts}
          pkPersonas={pkExperts}
          language={language}
          isStreamingReply={revealingReply?.sessionId === activeSessionId}
          onLanguageChange={handleLanguageChange}
          onSendMessage={handleSendMessage}
          onRegenerateMessage={handleRegenerateMessage}
          onEditMessage={handleEditMessage}
          pendingReplyMessageIds={pendingReplyMessageIds}
          isLoading={!!activeSessionId && loadingSessionIds.has(activeSessionId)}
          onToggleLeftPanel={handleToggleLeftPanel}
          isLeftPanelOpen={isLeftPanelOpen}
          onToggleRightPanel={handleToggleRightPanel}
          isRightPanelOpen={isRightPanelOpen}
          onUpdateSessionMeta={updateSessionMeta}
          onSaveToNotes={handleSaveToNotes}
          onOpenPaywall={triggerPaywall}
          onOpenPersonaGroup={handleOpenPersonaGroup}
          onOpenKnowledgeGraph={() => setIsKnowledgeGraphOpen(true)}
          queryUsage={usage}
        />
      </div>

      {/* 3. RIGHT PANEL: EXPERT PERSONA SELECTOR */}
      <PersonaPanel
        isOpen={isRightPanelOpen}
        subjectPromptActive={isSubjectPromptActive}
        onSkipSubjectPrompt={handleSkipSubjectPrompt}
        initialGroup={initialPersonaGroup}
        onGroupConsumed={() => setInitialPersonaGroup(null)}
        onToggle={handleToggleRightPanel}
        selectedPersonaId={currentPersonaId}
        onSelectPersona={handleSelectPersona}
        variant={activeVariant}
        onToggleVariant={(v) => {
          setExpertVariant(v);
          if (activeSession) {
            updateSessionMeta(activeSession.id, { variant: v });
          }
        }}
        onOpenPwaShortcut={(persona) => setPwaPersona(persona)}
        onSelectPrompt={(prompt) => handleSendMessage(prompt)}
        onSelectTopic={(topic) => createSession(currentPersonaId, 'concept', topic, topic, activeVariant, activePersona)}
        onOpenPaywall={triggerPaywall}
      />
      </>
      )}

      {/* MODALS & OVERLAYS */}
      <PaywallModal
        isOpen={isPaywallOpen}
        onClose={closePaywall}
        queryUsage={usage}
        onOpenLogin={() => {
          closePaywall();
          setIsLoginOpen(true);
        }}
      />

      <PwaShortcutModal
        persona={pwaPersona}
        isOpen={!!pwaPersona}
        onClose={() => setPwaPersona(null)}
        onOpenDownload={handleOpenDownload}
      />

      <AuthModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
      />

      <NotesSidePanel
        isOpen={!isMobile && isNotesOpen}
        onClose={() => setIsNotesOpen(false)}
        persona={activePersona}
      />

      <Suspense fallback={null}>
        {isDownloadOpen && (
          <AndroidDownloadPage
            isOpen={isDownloadOpen}
            onClose={handleCloseDownload}
          />
        )}

        <KnowledgeGraphModal
          isOpen={isKnowledgeGraphOpen}
          onClose={() => setIsKnowledgeGraphOpen(false)}
          initialTopic={activeSession?.title || 'Quantum Mechanics'}
          onSelectTopic={(topic) => {
            setIsKnowledgeGraphOpen(false);
            createSession(currentPersonaId, 'concept', topic, topic, expertVariant, activePersona);
          }}
        />

        <CompiledNotesModal
          isOpen={compiledNotesModalState.isOpen}
          onClose={() => setCompiledNotesModalState({ isOpen: false, compiledText: '', subjectTags: [] })}
          compiledText={compiledNotesModalState.compiledText}
          subjectTags={compiledNotesModalState.subjectTags}
          persona={activePersona}
        />

        <AdminDashboardModal
          isOpen={isAdminOpen}
          onClose={() => setIsAdminOpen(false)}
        />

        <UserProfileModal
          isOpen={isProfileOpen}
          onClose={() => setIsProfileOpen(false)}
          recentSearches={sessions.map((s) => s.title).slice(0, 10)}
          onSelectSearch={(topic) => {
            setIsProfileOpen(false);
            createSession(currentPersonaId, 'concept', topic, topic, expertVariant, activePersona);
          }}
          onClearHistory={() => {}}
          onOpenDownload={handleOpenDownload}
        />

        <TopicCompareModal
          isOpen={isCompareOpen}
          onClose={() => setIsCompareOpen(false)}
          defaultTopicA={activeSession?.title || 'Quantum Mechanics'}
          onSelectTopic={(topic) => {
            setIsCompareOpen(false);
            createSession(currentPersonaId, 'concept', topic, topic, expertVariant, activePersona);
          }}
        />

        <TopicTimelineModal
          isOpen={isTimelineOpen}
          onClose={() => setIsTimelineOpen(false)}
          topic={activeSession?.title || 'Quantum Mechanics'}
        />

        <DeveloperApiModal
          isOpen={isApiDocsOpen}
          onClose={() => setIsApiDocsOpen(false)}
        />
      </Suspense>

      {/* Guided Product Tour */}
      <Suspense fallback={null}>
        <ProductTour />
      </Suspense>

      {/* Subtle Save Note Toast Notification */}
      {saveNoteToast && (
        <div
          id="save-note-toast"
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900/90 dark:bg-slate-800/95 text-white text-xs font-semibold shadow-xl border border-slate-700/60 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-2 duration-200 pointer-events-none"
        >
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <Check className="w-3.5 h-3.5 text-emerald-400" />
          <span>Note saved</span>
        </div>
      )}
    </div>
  );
}
