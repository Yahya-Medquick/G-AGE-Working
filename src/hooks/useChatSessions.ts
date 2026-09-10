import { useState, useEffect, useCallback, useMemo } from 'react';
import { ChatSession, ChatMessage, ChatMode } from '../types/chat';
import { useUser } from '../context/UserContext';
import { EXPERTS, EXPERTS_PK } from '../data/experts';

const SESSIONS_STORAGE_KEY = 'bifrost_chat_sessions_v2';
const ACTIVE_SESSION_ID_KEY = 'bifrost_active_session_id_v2';

export function useChatSessions() {
  const { user } = useUser();
  const storageUserPrefix = user?.id ? `user_${user.id}` : 'guest';

  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    try {
      const saved = localStorage.getItem(`${SESSIONS_STORAGE_KEY}_${storageUserPrefix}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to load chat sessions:', e);
    }
    return [];
  });

  const [activeSessionId, setActiveSessionId] = useState<string | null>(() => {
    try {
      const saved = localStorage.getItem(`${ACTIVE_SESSION_ID_KEY}_${storageUserPrefix}`);
      return saved || null;
    } catch {
      return null;
    }
  });

  // Reload sessions when user changes (guest vs logged in)
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`${SESSIONS_STORAGE_KEY}_${storageUserPrefix}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setSessions(parsed);
          const savedActive = localStorage.getItem(`${ACTIVE_SESSION_ID_KEY}_${storageUserPrefix}`);
          if (savedActive && parsed.some((s) => s.id === savedActive)) {
            setActiveSessionId(savedActive);
          } else if (parsed.length > 0) {
            setActiveSessionId(parsed[0].id);
          } else {
            setActiveSessionId(null);
          }
          return;
        }
      }
    } catch (e) {
      console.error('Error reloading sessions on auth change:', e);
    }
    setSessions([]);
    setActiveSessionId(null);
  }, [storageUserPrefix]);

  // Persist sessions
  const persistSessions = useCallback(
    (newSessions: ChatSession[]) => {
      setSessions(newSessions);
      try {
        localStorage.setItem(`${SESSIONS_STORAGE_KEY}_${storageUserPrefix}`, JSON.stringify(newSessions));
      } catch (e) {
        console.error('Failed to persist sessions:', e);
      }
    },
    [storageUserPrefix]
  );

  // Set & persist active session ID
  const selectSession = useCallback(
    (sessionId: string | null) => {
      setActiveSessionId(sessionId);
      try {
        if (sessionId) {
          localStorage.setItem(`${ACTIVE_SESSION_ID_KEY}_${storageUserPrefix}`, sessionId);
          // Sync URL with sessionId without full reload
          const params = new URLSearchParams(window.location.search);
          params.set('session', sessionId);
          window.history.replaceState({}, '', `${window.location.pathname}?${params.toString()}`);
        } else {
          localStorage.removeItem(`${ACTIVE_SESSION_ID_KEY}_${storageUserPrefix}`);
          const params = new URLSearchParams(window.location.search);
          params.delete('session');
          const queryStr = params.toString() ? `?${params.toString()}` : '';
          window.history.replaceState({}, '', `${window.location.pathname}${queryStr}`);
        }
      } catch (e) {}
    },
    [storageUserPrefix]
  );

  // Active session object
  const activeSession = useMemo(() => {
    return sessions.find((s) => s.id === activeSessionId) || null;
  }, [sessions, activeSessionId]);

  // Create new session
  const createSession = useCallback(
    (
      personaId: string = 'hamza',
      mode: ChatMode = 'concept',
      initialTopic: string = 'General Discussion',
      customTitle?: string,
      variant: 'global' | 'pk' = 'global'
    ): ChatSession => {
      const expertSet = variant === 'pk' ? EXPERTS_PK : EXPERTS;
      const persona = expertSet[personaId] || expertSet['hamza'] || Object.values(expertSet)[0];
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const now = new Date().toISOString();

      const opener = persona.opener ? persona.opener(initialTopic) : `Hello! How can I assist your ${mode} exploration on ${initialTopic}?`;

      const initialMessage: ChatMessage = {
        id: `msg_${Date.now()}_0`,
        role: 'assistant',
        content: opener,
        timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
        mode,
        personaId: persona.id,
      };

      const newSession: ChatSession = {
        id: sessionId,
        title: customTitle || initialTopic || `Chat with ${persona.name}`,
        personaId: persona.id,
        mode,
        variant,
        isPinned: false,
        createdAt: now,
        updatedAt: now,
        messages: [initialMessage],
        specs: {
          concept: { level: 'intermediate', mathRigor: 'standard', explanationStyle: 'socratic' },
          exam: { targetExam: 'University / AP', difficulty: 'standard', questionFormat: 'step_by_step' },
          research: { recency: '5_years', minCitations: 'any', includeCode: true, includeDatasets: false },
        },
      };

      setSessions((prev) => {
        const updated = [newSession, ...prev];
        try {
          localStorage.setItem(`${SESSIONS_STORAGE_KEY}_${storageUserPrefix}`, JSON.stringify(updated));
        } catch (e) {
          console.error('Failed to persist sessions:', e);
        }
        return updated;
      });
      selectSession(sessionId);
      return newSession;
    },
    [selectSession, storageUserPrefix]
  );

  // Update session messages
  const updateSessionMessages = useCallback(
    (sessionId: string, newMessages: ChatMessage[], newTitle?: string) => {
      setSessions((prev) => {
        const index = prev.findIndex((s) => s.id === sessionId);
        if (index === -1) return prev;

        const current = prev[index];
        const updatedTitle = newTitle || current.title;

        const updatedSession: ChatSession = {
          ...current,
          title: updatedTitle,
          messages: newMessages,
          updatedAt: new Date().toISOString(),
        };

        const updatedList = [...prev];
        updatedList[index] = updatedSession;
        try {
          localStorage.setItem(`${SESSIONS_STORAGE_KEY}_${storageUserPrefix}`, JSON.stringify(updatedList));
        } catch (e) {}
        return updatedList;
      });
    },
    [storageUserPrefix]
  );

  // Update session mode or specs
  const updateSessionMeta = useCallback(
    (sessionId: string, updates: Partial<Pick<ChatSession, 'mode' | 'personaId' | 'variant' | 'specs' | 'title'>>) => {
      setSessions((prev) => {
        const index = prev.findIndex((s) => s.id === sessionId);
        if (index === -1) return prev;

        const current = prev[index];
        const updatedSession: ChatSession = {
          ...current,
          ...updates,
          specs: {
            ...current.specs,
            ...(updates.specs || {}),
          },
          updatedAt: new Date().toISOString(),
        };

        const updatedList = [...prev];
        updatedList[index] = updatedSession;
        try {
          localStorage.setItem(`${SESSIONS_STORAGE_KEY}_${storageUserPrefix}`, JSON.stringify(updatedList));
        } catch (e) {}
        return updatedList;
      });
    },
    [storageUserPrefix]
  );

  // Pin / Unpin session
  const togglePinSession = useCallback(
    (sessionId: string) => {
      setSessions((prev) => {
        const updated = prev.map((s) => (s.id === sessionId ? { ...s, isPinned: !s.isPinned } : s));
        try {
          localStorage.setItem(`${SESSIONS_STORAGE_KEY}_${storageUserPrefix}`, JSON.stringify(updated));
        } catch (e) {}
        return updated;
      });
    },
    [storageUserPrefix]
  );

  // Rename session
  const renameSession = useCallback(
    (sessionId: string, newTitle: string) => {
      if (!newTitle.trim()) return;
      setSessions((prev) => {
        const updated = prev.map((s) => (s.id === sessionId ? { ...s, title: newTitle.trim() } : s));
        try {
          localStorage.setItem(`${SESSIONS_STORAGE_KEY}_${storageUserPrefix}`, JSON.stringify(updated));
        } catch (e) {}
        return updated;
      });
    },
    [storageUserPrefix]
  );

  // Delete session
  const deleteSession = useCallback(
    (sessionId: string) => {
      setSessions((prev) => {
        const updated = prev.filter((s) => s.id !== sessionId);
        try {
          localStorage.setItem(`${SESSIONS_STORAGE_KEY}_${storageUserPrefix}`, JSON.stringify(updated));
        } catch (e) {}
        if (activeSessionId === sessionId) {
          const nextActive = updated.length > 0 ? updated[0].id : null;
          selectSession(nextActive);
        }
        return updated;
      });
    },
    [activeSessionId, selectSession, storageUserPrefix]
  );

  // Clear all sessions
  const clearAllSessions = useCallback(() => {
    persistSessions([]);
    selectSession(null);
  }, [persistSessions, selectSession]);

  // Grouped sessions for Left Sidebar
  const groupedSessions = useMemo(() => {
    const pinned: ChatSession[] = [];
    const today: ChatSession[] = [];
    const yesterday: ChatSession[] = [];
    const previous7Days: ChatSession[] = [];
    const older: ChatSession[] = [];

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfYesterday = startOfToday - 86400000;
    const startOf7Days = startOfToday - 7 * 86400000;

    for (const session of sessions) {
      if (session.isPinned) {
        pinned.push(session);
        continue;
      }
      const time = new Date(session.updatedAt || session.createdAt).getTime();
      if (time >= startOfToday) {
        today.push(session);
      } else if (time >= startOfYesterday) {
        yesterday.push(session);
      } else if (time >= startOf7Days) {
        previous7Days.push(session);
      } else {
        older.push(session);
      }
    }

    return { pinned, today, yesterday, previous7Days, older };
  }, [sessions]);

  return {
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
    clearAllSessions,
    groupedSessions,
  };
}
