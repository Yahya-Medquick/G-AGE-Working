import React, { useState, useEffect, useMemo, lazy, Suspense, useCallback, useRef } from 'react';
import { Check } from 'lucide-react';
import { useTheme } from './hooks/useTheme';
import { useNotes } from './hooks/useNotes';
import { useUser } from './context/UserContext';
import { useChatSessions } from './hooks/useChatSessions';
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
import { ProductTour } from './components/ProductTour';
import { ExpertPersona, matchExpert } from './data/experts';
import { usePersonas } from './hooks/usePersonas';
import { ChatMode, ChatMessage } from './types/chat';

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

export default function App() {
  const { theme, toggleTheme } = useTheme();
  const { notes, addNote } = useNotes();
  const { user, isLoggedIn } = useUser();

  // Chat sessions state manager
  const {
    sessions,
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

  // Active persona region variant ('global' | 'pk') - default to Pakistani first
  const [expertVariant, setExpertVariant] = useState<'global' | 'pk'>('pk');

  // Loading state for Gemini stream
  const [isLoadingMessage, setIsLoadingMessage] = useState<boolean>(false);

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
  const activeExpertSet = expertVariant === 'pk' ? pkExperts : globalExperts;
  const currentPersonaId = activeSession?.personaId || 'hamza';
  const activePersona: ExpertPersona =
    activeExpertSet[currentPersonaId] || activeExpertSet['hamza'] || Object.values(activeExpertSet)[0];

  // Best domain match persona suggestion
  const suggestedPersona = useMemo(() => {
    if (!activeSession?.title) return undefined;
    const match = matchExpert(activeSession.title, activeExpertSet);
    return match?.id;
  }, [activeSession?.title, activeExpertSet]);

  const hasInitializedRef = useRef(false);

  // Initial bootstrap: create initial session if none exists or parse URL params
  useEffect(() => {
    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;

    const urlParams = new URLSearchParams(window.location.search);
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
          selectSession(existingSession.id);
          return;
        }

        createSession(
          matched.id,
          urlMode,
          `${matched.name} Session`,
          `${matched.name} Session`,
          isPk ? 'pk' : 'global'
        );
        return;
      }
    }

    if (urlSession && sessions.some((s) => s.id === urlSession)) {
      selectSession(urlSession);
      return;
    }

    if (sessions.length === 0) {
      const initialPersonaId = urlPersona || 'hamza';
      createSession(initialPersonaId, urlMode, 'General Discussion', 'General Discussion', expertVariant);
    } else if (!activeSessionId) {
      selectSession(sessions[0].id);
    }
  }, []);

  // Synchronize active persona with browser URL query parameter for PWA shortcut capture
  useEffect(() => {
    if (activePersona) {
      const personaKey = activePersona.slug || activePersona.id;
      const currentUrl = new URL(window.location.href);
      if (currentUrl.searchParams.get('persona') !== personaKey) {
        currentUrl.searchParams.set('persona', personaKey);
        window.history.replaceState(null, '', `${currentUrl.pathname}?${currentUrl.searchParams.toString()}`);
      }
    }
  }, [activePersona?.id, activePersona?.slug]);

  // Handle window resize to auto-adapt sidebars
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsLeftPanelOpen(false);
      }
      if (window.innerWidth < 1280) {
        setIsRightPanelOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Create new chat
  const handleNewChat = useCallback(() => {
    createSession('hamza', 'concept', 'General Discussion', 'New Chat', expertVariant);
    if (window.innerWidth < 1024) {
      setIsLeftPanelOpen(false);
    }
  }, [createSession, expertVariant]);

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
        });
      }
      if (window.innerWidth < 1024) {
        setIsRightPanelOpen(false);
      }
    },
    [activeSessionId, pkExperts, globalExperts, updateSessionMeta]
  );

  // Send message handler (invokes /api/chat/message with mode, specs, and persona prompt)
  const handleSendMessage = async (content: string, modeOverride?: ChatMode, imageBase64?: string) => {
    if (!content.trim() && !imageBase64) return;

    if (!canExecuteQuery()) {
      triggerPaywall();
      return;
    }

    const currentSession = activeSession || createSession('hamza', 'concept', (content || "Image Analysis").slice(0, 32));
    const targetMode = modeOverride || currentSession.mode || 'concept';

    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}_u`,
      role: 'user',
      content: content.trim() || (imageBase64 ? "Please analyze this attached image/diagram." : ""),
      timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
      mode: targetMode,
      personaId: currentSession.personaId,
      imageBase64: imageBase64 || undefined,
    };

    const newMessages = [...currentSession.messages, userMessage];

    // If first user message, update session title
    const isFirstUserMsg = currentSession.messages.filter((m) => m.role === 'user').length === 0;
    const newTitle = isFirstUserMsg ? (content.trim() || "Image Analysis").slice(0, 36) : currentSession.title;

    updateSessionMessages(currentSession.id, newMessages, newTitle);
    setIsLoadingMessage(true);

    try {
      const response = await fetch('/api/chat/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({
          sessionId: currentSession.id,
          personaId: currentSession.personaId,
          mode: targetMode,
          specs: currentSession.specs || {},
          variant: currentSession.variant || expertVariant,
          messages: newMessages.map((m) => ({ role: m.role, content: m.content, imageBase64: m.imageBase64 })),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 429 || response.status === 403 || errorData.isPaywall || errorData.paywallTrigger) {
          triggerPaywall();
          // Remove the loading user message or show clear message
          const limitMsg: ChatMessage = {
            id: `msg_${Date.now()}_a`,
            role: 'assistant',
            content: `⚠️ **Query Limit Reached**\n\n${errorData.message || errorData.error || 'You have reached your daily query allowance. Please upgrade to Pro for unlimited AI queries and vision analysis.'}`,
            timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
            mode: targetMode,
            personaId: currentSession.personaId,
          };
          updateSessionMessages(currentSession.id, [...newMessages, limitMsg], newTitle);
          return;
        }
        throw new Error(errorData.error || `Server returned ${response.status}`);
      }

      const data = await response.json();
      refreshUsage();

      const assistantMessage: ChatMessage = {
        id: `msg_${Date.now()}_a`,
        role: 'assistant',
        content: data.reply || 'No response received.',
        timestamp: data.timestamp || new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
        mode: targetMode,
        personaId: currentSession.personaId,
      };

      updateSessionMessages(currentSession.id, [...newMessages, assistantMessage], newTitle);
    } catch (err: any) {
      console.warn('Chat error:', err);
      const errorMsg: ChatMessage = {
        id: `msg_${Date.now()}_a`,
        role: 'assistant',
        content: `⚠️ **Connection Error**\n\nUnable to generate response: ${err.message || 'Please check your connection and try again.'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
        mode: targetMode,
        personaId: currentSession.personaId,
      };

      updateSessionMessages(currentSession.id, [...newMessages, errorMsg], newTitle);
    } finally {
      setIsLoadingMessage(false);
    }

  };

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
    <div className="h-screen w-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex overflow-hidden font-sans selection:bg-indigo-500 selection:text-white transition-colors duration-200">
      {/* 1. LEFT PANEL: CHAT HISTORY SIDEBAR */}
      <ChatSidebar
        isOpen={isLeftPanelOpen}
        onToggle={() => setIsLeftPanelOpen(!isLeftPanelOpen)}
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={(id) => {
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
      <ChatStage
        session={activeSession}
        activePersona={activePersona}
        variant={expertVariant}
        onSendMessage={handleSendMessage}
        isLoading={isLoadingMessage}
        onToggleLeftPanel={() => setIsLeftPanelOpen(!isLeftPanelOpen)}
        isLeftPanelOpen={isLeftPanelOpen}
        onToggleRightPanel={() => setIsRightPanelOpen(!isRightPanelOpen)}
        isRightPanelOpen={isRightPanelOpen}
        onUpdateSessionMeta={updateSessionMeta}
        onSaveToNotes={handleSaveToNotes}
        onOpenPaywall={triggerPaywall}
        onOpenKnowledgeGraph={() => setIsKnowledgeGraphOpen(true)}
        queryUsage={usage}
      />

      {/* 3. RIGHT PANEL: EXPERT PERSONA SELECTOR */}
      <PersonaPanel
        isOpen={isRightPanelOpen}
        onToggle={() => setIsRightPanelOpen(!isRightPanelOpen)}
        selectedPersonaId={currentPersonaId}
        onSelectPersona={handleSelectPersona}
        variant={expertVariant}
        onToggleVariant={(v) => {
          setExpertVariant(v);
          if (activeSession) {
            updateSessionMeta(activeSession.id, { variant: v });
          }
        }}
        onOpenPwaShortcut={(persona) => setPwaPersona(persona)}
        suggestedPersonaId={suggestedPersona}
        onSelectPrompt={(prompt) => handleSendMessage(prompt)}
        onSelectTopic={(topic) => createSession(currentPersonaId, 'concept', topic, topic, expertVariant)}
        onOpenPaywall={triggerPaywall}
      />

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
        isOpen={isNotesOpen}
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
            createSession(currentPersonaId, 'concept', topic, topic, expertVariant);
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
            createSession(currentPersonaId, 'concept', topic, topic, expertVariant);
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
            createSession(currentPersonaId, 'concept', topic, topic, expertVariant);
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
      <ProductTour />

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
