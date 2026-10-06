import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Plus,
  Search,
  Pin,
  MoreHorizontal,
  Check,
  X,
  MessageSquare,
  FileText,
  Sun,
  Moon,
  LogIn,
  LogOut,
  PanelLeftClose,
  Shield,
  Sparkles,
  Compass,
  HelpCircle,
  Smartphone,
  BookOpen,
  ChevronDown,
  UserRound,
  Crown,
  Settings,
  LayoutDashboard,
  BarChart3,
  GitCompare,
  LineChart,
  Code2,
} from 'lucide-react';
import { ChatSession } from '../../types/chat';
import { useUser } from '../../context/UserContext';
import { ExpertPersona } from '../../data/experts';
import { appEnvironment } from '../../config/env';
import { VariantBadge } from '../ui/Badge';
import { uiCopy, type UiLanguage } from '../../i18n/ui';
import { getWhatsAppSupportUrl } from '../../utils/support';

interface ChatSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  sessions: ChatSession[];
  globalPersonas: Record<string, ExpertPersona>;
  pkPersonas: Record<string, ExpertPersona>;
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onRenameSession: (id: string, newTitle: string) => void;
  onDeleteSession: (id: string) => void;
  onPinSession: (id: string) => void;
  onOpenNotes: () => void;
  notesCount: number;
  onOpenAdmin: () => void;
  onOpenApiDocs: () => void;
  onOpenProfile: (tab?: 'profile' | 'preferences') => void;
  onOpenExplore: () => void;
  onOpenKnowledgeGraph: () => void;
  onOpenCompare: () => void;
  onOpenTimeline: () => void;
  onOpenLogin: () => void;
  onOpenPlanUsage: () => void;
  onOpenDownload?: () => void;
  queryUsage: {
    count: number;
    limit: number;
    remaining: number;
    tier: string;
    isLoggedIn: boolean;
  };
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  language: UiLanguage;
}

export const ChatSidebar: React.FC<ChatSidebarProps> = ({
  isOpen,
  onToggle,
  sessions,
  globalPersonas,
  pkPersonas,
  activeSessionId,
  onSelectSession,
  onNewChat,
  onRenameSession,
  onDeleteSession,
  onPinSession,
  onOpenNotes,
  notesCount,
  onOpenAdmin,
  onOpenApiDocs,
  onOpenProfile,
  onOpenExplore,
  onOpenKnowledgeGraph,
  onOpenCompare,
  onOpenTimeline,
  onOpenLogin,
  onOpenPlanUsage,
  onOpenDownload,
  queryUsage,
  theme,
  toggleTheme,
  language,
}) => {
  const { user, isLoggedIn, logout, replayTour } = useUser();
  const [searchQuery, setSearchQuery] = useState('');
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [openSessionMenuId, setOpenSessionMenuId] = useState<string | null>(null);
  const [isToolsExpanded, setIsToolsExpanded] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const supportUrl = getWhatsAppSupportUrl(uiCopy(language, 'sidebarSupportMessage'));
  const isPaid = queryUsage.tier === 'paid' || queryUsage.tier === 'pro' || queryUsage.tier === 'unlimited' || user?.tier === 'paid' || user?.tier === 'pro' || user?.tier === 'unlimited';

  useEffect(() => {
    if (!isProfileMenuOpen) return;
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (event.target instanceof Node && !profileMenuRef.current?.contains(event.target)) {
        setIsProfileMenuOpen(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsProfileMenuOpen(false);
    };
    document.addEventListener('mousedown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [isProfileMenuOpen]);

  // Filter sessions by search query
  const filteredSessions = useMemo(() => {
    if (!searchQuery.trim()) return sessions;
    const lower = searchQuery.toLowerCase().trim();
    return sessions.filter((s) => {
      const matchTitle = s.title.toLowerCase().includes(lower);
      const matchPersona = s.personaId.toLowerCase().includes(lower);
      const matchMessage = s.messages.some((m) => m.content.toLowerCase().includes(lower));
      return matchTitle || matchPersona || matchMessage;
    });
  }, [sessions, searchQuery]);

  // Group filtered sessions
  const grouped = useMemo(() => {
    const pinned: ChatSession[] = [];
    const today: ChatSession[] = [];
    const yesterday: ChatSession[] = [];
    const previous7Days: ChatSession[] = [];
    const older: ChatSession[] = [];

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfYesterday = startOfToday - 86400000;
    const startOf7Days = startOfToday - 7 * 86400000;

    for (const session of filteredSessions) {
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
  }, [filteredSessions]);

  const handleStartRename = (session: ChatSession, e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenSessionMenuId(null);
    setEditingSessionId(session.id);
    setEditTitle(session.title);
  };

  const handleSaveRename = (sessionId: string, e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (editTitle.trim()) {
      onRenameSession(sessionId, editTitle.trim());
    }
    setEditingSessionId(null);
  };

  const renderSessionItem = (session: ChatSession) => {
    const isActive = session.id === activeSessionId;
    const isEditing = editingSessionId === session.id;
    const latestAssistant = [...session.messages].reverse().find((message) => message.role === 'assistant');
    const personaId = latestAssistant?.personaId || session.personaId;
    const variant = latestAssistant?.personaVariant || session.variant;
    const personaSet = variant === 'pk' ? pkPersonas : globalPersonas;
    const persona = personaSet[personaId];
    const personaName = latestAssistant?.personaName || persona?.name || personaId;
    const initials = latestAssistant?.personaInitials || persona?.initials
      || personaName.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase()
      || personaId.slice(0, 2).toUpperCase()
      || '?';
    const color = persona?.avatar_color || '#6366f1';

    return (
      <div
        key={session.id}
        onClick={() => onSelectSession(session.id)}
        className={`group relative flex items-center gap-2.5 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-150 select-none ${
          isActive
            ? 'bg-slate-200/80 dark:bg-slate-800/90 text-slate-900 dark:text-white font-medium shadow-xs'
            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/50'
        }`}
      >
        {/* Persona Initials Badge */}
        <div
          className="w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold text-white shrink-0 shadow-2xs"
          style={{ backgroundColor: color }}
        >
          {initials}
        </div>

        {/* Title or Inline Edit Input */}
        <div className="flex-1 min-w-0 pr-1">
          {isEditing ? (
            <form
              onSubmit={(e) => handleSaveRename(session.id, e)}
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1"
            >
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                autoFocus
                className="w-full text-xs px-2 py-0.5 rounded bg-white dark:bg-slate-900 border border-indigo-500 text-slate-900 dark:text-white focus:outline-none"
              />
              <button
                type="submit"
                className="p-1 text-emerald-600 hover:text-emerald-500"
                title="Save"
              >
                <Check className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={() => setEditingSessionId(null)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                title="Cancel"
              >
                <X className="w-3 h-3" />
              </button>
            </form>
          ) : (
            <div className="flex flex-col">
              <span className="text-xs truncate font-medium">{session.title}</span>
              <VariantBadge
                variant={variant === 'pk' ? 'pk' : 'global'}
                label={uiCopy(language, variant === 'pk' ? 'variantPk' : 'variantGlobal')}
              />
              <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                <span className="capitalize">{session.mode}</span>
                {session.isPinned && <Pin className="w-2.5 h-2.5 text-amber-500 fill-amber-500" />}
              </div>
            </div>
          )}
        </div>

        {!isEditing && (
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                setOpenSessionMenuId((current) => current === session.id ? null : session.id);
              }}
              aria-label={uiCopy(language, 'sidebarProfileMenu')}
              aria-haspopup="menu"
              aria-expanded={openSessionMenuId === session.id}
              className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-300 dark:text-slate-400 dark:hover:bg-slate-700"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
            {openSessionMenuId === session.id && (
              <div role="menu" className="absolute right-0 top-full z-popover mt-1 min-w-40 rounded-xl border border-border bg-surface p-1 shadow-popover">
                <button type="button" role="menuitem" onClick={(event) => { event.stopPropagation(); setOpenSessionMenuId(null); onPinSession(session.id); }} className="flex min-h-10 w-full items-center gap-2 rounded-lg px-3 text-start text-xs text-text hover:bg-surface-2">
                  <Pin className="h-3.5 w-3.5" />{uiCopy(language, session.isPinned ? 'sidebarUnpin' : 'sidebarPin')}
                </button>
                <button type="button" role="menuitem" onClick={(event) => handleStartRename(session, event)} className="flex min-h-10 w-full items-center gap-2 rounded-lg px-3 text-start text-xs text-text hover:bg-surface-2">
                  <Settings className="h-3.5 w-3.5" />{uiCopy(language, 'sidebarRename')}
                </button>
                <button type="button" role="menuitem" onClick={(event) => { event.stopPropagation(); setOpenSessionMenuId(null); onDeleteSession(session.id); }} className="flex min-h-10 w-full items-center gap-2 rounded-lg px-3 text-start text-xs text-danger hover:bg-surface-2">
                  <X className="h-3.5 w-3.5" />{uiCopy(language, 'sidebarDelete')}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          onClick={onToggle}
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs lg:hidden animate-in fade-in"
        />
      )}

      {/* Main Sidebar Panel */}
      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-40 flex flex-col w-[260px] bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-300 ease-in-out shrink-0 overflow-hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:w-0 lg:border-r-0'
        }`}
      >
        {/* Top Header: Brand & Collapse Toggle */}
        <div className="h-14 px-4 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between shrink-0 bg-white/70 dark:bg-slate-950/70">
          <div className="flex items-center gap-2 select-none">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-sm tracking-tight text-slate-900 dark:text-white leading-tight">
                G-AGE <span className="text-indigo-600 dark:text-indigo-400 font-normal">AI</span>
              </div>
              <div className="text-[10px] text-slate-400 dark:text-slate-500 font-medium leading-none">
                The Next Age of Intelligence
              </div>
            </div>
          </div>

          <button
            onClick={onToggle}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title={uiCopy(language, 'sidebarCollapse')}
            aria-label={uiCopy(language, 'sidebarCollapse')}
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        </div>

        {/* New Chat & Search Stage */}
        <div className="p-3 space-y-2 border-b border-slate-200/60 dark:border-slate-800/60 bg-white/40 dark:bg-slate-950/40 shrink-0">
          {/* New Chat Primary Button */}
          <button
            onClick={onNewChat}
            className="w-full py-2.5 px-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white text-xs font-semibold shadow-xs flex items-center justify-between transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-2">
              <Plus className="w-4 h-4 transition-transform group-hover:rotate-90 duration-200" />
              <span>{uiCopy(language, 'sidebarNewChat')}</span>
            </div>
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-indigo-700/80 text-[10px] text-indigo-200 font-mono">
              Ctrl+K
            </kbd>
          </button>

          {/* Search Chat History Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={uiCopy(language, 'sidebarSearchChats')}
              aria-label={uiCopy(language, 'sidebarSearchChats')}
              className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            {searchQuery && (
              <button
                aria-label={uiCopy(language, 'sidebarSearchChats')}
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto px-2 py-3 space-y-3 text-xs">
            <div className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">{uiCopy(language, 'sidebarRecentChats')}</div>
            {filteredSessions.length === 0 ? (
              <div className="p-4 text-center text-slate-400 space-y-2">
                <MessageSquare className="w-6 h-6 mx-auto opacity-40" />
                <p className="text-xs">{uiCopy(language, 'sidebarNoChats')}</p>
                <p className="text-[11px] text-slate-500">{uiCopy(language, 'sidebarBeginChat')}</p>
              </div>
            ) : (
              <>
                {grouped.pinned.length > 0 && (
                  <div className="space-y-1">
                    <div className="px-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <Pin className="w-2.5 h-2.5 text-amber-500" /><span>{uiCopy(language, 'sidebarPinned')}</span>
                    </div>
                    {grouped.pinned.map(renderSessionItem)}
                  </div>
                )}
                {grouped.today.length > 0 && (
                  <div className="space-y-1">
                    <div className="px-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">{uiCopy(language, 'sidebarToday')}</div>
                    {grouped.today.map(renderSessionItem)}
                  </div>
                )}
                {grouped.yesterday.length > 0 && (
                  <div className="space-y-1">
                    <div className="px-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">{uiCopy(language, 'sidebarYesterday')}</div>
                    {grouped.yesterday.map(renderSessionItem)}
                  </div>
                )}
                {grouped.previous7Days.length > 0 && (
                  <div className="space-y-1">
                    <div className="px-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">{uiCopy(language, 'sidebarPrevious7Days')}</div>
                    {grouped.previous7Days.map(renderSessionItem)}
                  </div>
                )}
                {grouped.older.length > 0 && (
                  <div className="space-y-1">
                    <div className="px-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">{uiCopy(language, 'sidebarOlder')}</div>
                    {grouped.older.map(renderSessionItem)}
                  </div>
                )}
              </>
            )}
          </div>

          <nav aria-label={uiCopy(language, 'primaryNavigation')} className="shrink-0 space-y-1 border-t border-slate-200/80 bg-slate-100/60 p-2 dark:border-slate-800 dark:bg-slate-950/60">
            <button type="button" onClick={onNewChat} className="flex min-h-10 w-full items-center gap-3 rounded-lg px-3 text-start text-sm text-slate-700 hover:bg-white dark:text-slate-200 dark:hover:bg-slate-800">
              <BookOpen className="h-4 w-4" />{uiCopy(language, 'navSubjects')}
            </button>
            <button id="tour-notes-btn" type="button" onClick={onOpenNotes} className="flex min-h-10 w-full items-center gap-3 rounded-lg px-3 text-start text-sm text-slate-700 hover:bg-white dark:text-slate-200 dark:hover:bg-slate-800">
              <FileText className="h-4 w-4" />{uiCopy(language, 'navNotes')}
              {notesCount > 0 && <span className="ml-auto rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold text-on-accent">{notesCount}</span>}
            </button>
            <button type="button" disabled title={uiCopy(language, 'sidebarNotReady')} className="flex min-h-10 w-full items-center gap-3 rounded-lg px-3 text-start text-sm text-slate-400">
              <Check className="h-4 w-4" />{uiCopy(language, 'sidebarPractice')}<span className="ml-auto text-[10px]">{uiCopy(language, 'sidebarNotReady')}</span>
            </button>
            <button
              type="button"
              onClick={() => setIsToolsExpanded((expanded) => !expanded)}
              aria-expanded={isToolsExpanded}
              className="flex min-h-10 w-full items-center gap-3 rounded-lg px-3 text-start text-sm text-slate-700 hover:bg-white dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <LayoutDashboard className="h-4 w-4" />{uiCopy(language, 'sidebarTools')}
              <ChevronDown className={`ml-auto h-4 w-4 transition-transform ${isToolsExpanded ? 'rotate-180' : ''}`} />
            </button>
            {isToolsExpanded && (
              <div className="space-y-1 pl-4">
                <button type="button" onClick={onOpenExplore} className="flex min-h-10 w-full items-center gap-3 rounded-lg px-3 text-start text-sm text-slate-600 hover:bg-white dark:text-slate-300 dark:hover:bg-slate-800"><Compass className="h-4 w-4" />{uiCopy(language, 'sidebarExplore')}</button>
                <button type="button" onClick={onOpenKnowledgeGraph} className="flex min-h-10 w-full items-center gap-3 rounded-lg px-3 text-start text-sm text-slate-600 hover:bg-white dark:text-slate-300 dark:hover:bg-slate-800"><BarChart3 className="h-4 w-4" />{uiCopy(language, 'sidebarGraph')}</button>
                <button type="button" onClick={onOpenCompare} className="flex min-h-10 w-full items-center gap-3 rounded-lg px-3 text-start text-sm text-slate-600 hover:bg-white dark:text-slate-300 dark:hover:bg-slate-800"><GitCompare className="h-4 w-4" />{uiCopy(language, 'sidebarCompare')}</button>
                <button type="button" onClick={onOpenTimeline} className="flex min-h-10 w-full items-center gap-3 rounded-lg px-3 text-start text-sm text-slate-600 hover:bg-white dark:text-slate-300 dark:hover:bg-slate-800"><LineChart className="h-4 w-4" />{uiCopy(language, 'sidebarTimeline')}</button>
              </div>
            )}
          </nav>
        </div>

        <div className="shrink-0 border-t border-slate-200/80 bg-slate-100/60 p-2 dark:border-slate-800 dark:bg-slate-950/60">
          {appEnvironment !== 'production' && (
            <div className="mb-1 flex justify-start px-1 py-0.5" aria-label={import.meta.env.VITE_PR_NUMBER ? `Staging preview pull request ${import.meta.env.VITE_PR_NUMBER}` : 'Staging preview'}>
              <span className="rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-100">
                {import.meta.env.VITE_PR_NUMBER ? `PR #${import.meta.env.VITE_PR_NUMBER}` : 'Staging'}
              </span>
            </div>
          )}
          <div ref={profileMenuRef} className="relative">
            {isLoggedIn && user ? (
              <button
                type="button"
                onClick={() => setIsProfileMenuOpen((open) => !open)}
                aria-label={uiCopy(language, 'sidebarProfileMenu')}
                aria-haspopup="menu"
                aria-expanded={isProfileMenuOpen}
                className="flex min-h-12 w-full items-center gap-2 rounded-xl border border-slate-200/70 bg-white px-2 text-start hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800/80 dark:hover:bg-slate-800"
              >
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt="" className="h-8 w-8 shrink-0 rounded-full object-cover" />
                ) : (
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent-text"><UserRound className="h-4 w-4" /></span>
                )}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-semibold text-slate-900 dark:text-white">{user.name}</span>
                  <span className="block truncate text-[10px] text-slate-500">{user.email || user.username || user.phone}</span>
                </span>
                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold ${isPaid ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200' : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-200'}`}>
                  {isPaid && <Crown className="h-3 w-3" />}{uiCopy(language, isPaid ? 'sidebarTierPro' : 'sidebarTierFree')}
                </span>
              </button>
            ) : (
              <button type="button" onClick={onOpenLogin} className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700">
                <LogIn className="h-4 w-4" />{uiCopy(language, 'sidebarSignIn')}
              </button>
            )}

            {isProfileMenuOpen && isLoggedIn && user && (
              <div role="menu" aria-label={uiCopy(language, 'sidebarProfileMenu')} className="absolute bottom-full left-0 z-popover mb-2 max-h-[70dvh] w-[min(18rem,calc(100vw-2rem))] overflow-y-auto rounded-xl border border-border bg-surface p-2 shadow-popover">
                <div className="border-b border-border px-3 py-2">
                  <p className="truncate text-sm font-semibold text-text">{user.name}</p>
                  <p className="text-xs text-muted">{uiCopy(language, isPaid ? 'sidebarTierPro' : 'sidebarTierFree')}</p>
                </div>
                <button type="button" role="menuitem" onClick={() => { setIsProfileMenuOpen(false); onOpenProfile('profile'); }} className="flex min-h-10 w-full items-center gap-2 rounded-lg px-3 text-start text-sm text-text hover:bg-surface-2"><UserRound className="h-4 w-4" />{uiCopy(language, 'sidebarProfile')}</button>
                <button type="button" role="menuitem" onClick={() => { setIsProfileMenuOpen(false); onOpenProfile('profile'); }} className="flex min-h-10 w-full items-center gap-2 rounded-lg px-3 text-start text-sm text-text hover:bg-surface-2"><BookOpen className="h-4 w-4" />{uiCopy(language, 'sidebarClass')}</button>
                <button type="button" role="menuitem" onClick={() => { setIsProfileMenuOpen(false); onOpenPlanUsage(); }} className="flex min-h-10 w-full items-center gap-2 rounded-lg px-3 text-start text-sm text-text hover:bg-surface-2"><Crown className="h-4 w-4" />{uiCopy(language, 'sidebarPlanUsage')}</button>
                <button type="button" role="menuitem" onClick={() => { setIsProfileMenuOpen(false); onOpenProfile('preferences'); }} className="flex min-h-10 w-full items-center gap-2 rounded-lg px-3 text-start text-sm text-text hover:bg-surface-2"><Settings className="h-4 w-4" />{uiCopy(language, 'sidebarSettings')}</button>
                <button type="button" role="menuitem" onClick={() => { setIsProfileMenuOpen(false); toggleTheme(); }} className="flex min-h-10 w-full items-center gap-2 rounded-lg px-3 text-start text-sm text-text hover:bg-surface-2">{theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}{uiCopy(language, 'sidebarNightMode')}</button>
                <button type="button" role="menuitem" disabled title={uiCopy(language, 'sidebarNotReady')} className="flex min-h-10 w-full items-center gap-2 rounded-lg px-3 text-start text-sm text-muted"><BarChart3 className="h-4 w-4" />{uiCopy(language, 'sidebarProgress')}<span className="ml-auto text-[10px]">{uiCopy(language, 'sidebarNotReady')}</span></button>
                {onOpenDownload && <button type="button" role="menuitem" onClick={() => { setIsProfileMenuOpen(false); onOpenDownload(); }} className="flex min-h-10 w-full items-center gap-2 rounded-lg px-3 text-start text-sm text-text hover:bg-surface-2"><Smartphone className="h-4 w-4" />{uiCopy(language, 'sidebarInstallApp')}</button>}
                <button type="button" role="menuitem" onClick={() => { setIsProfileMenuOpen(false); replayTour(); }} className="flex min-h-10 w-full items-center gap-2 rounded-lg px-3 text-start text-sm text-text hover:bg-surface-2"><Compass className="h-4 w-4" />{uiCopy(language, 'sidebarTour')}</button>
                {supportUrl ? (
                  <a role="menuitem" href={supportUrl} target="_blank" rel="noreferrer" onClick={() => setIsProfileMenuOpen(false)} className="flex min-h-10 items-center gap-2 rounded-lg px-3 text-sm text-text hover:bg-surface-2"><HelpCircle className="h-4 w-4" />{uiCopy(language, 'sidebarSupport')}</a>
                ) : (
                  <div className="px-3 py-2 text-xs text-muted">{uiCopy(language, 'sidebarSupportMissing')}</div>
                )}
                <button type="button" role="menuitem" disabled title={uiCopy(language, 'sidebarNotReady')} className="flex min-h-10 w-full items-center gap-2 rounded-lg px-3 text-start text-sm text-muted"><Shield className="h-4 w-4" />{uiCopy(language, 'sidebarPrivacy')}<span className="ml-auto text-[10px]">{uiCopy(language, 'sidebarNotReady')}</span></button>
                <button type="button" role="menuitem" disabled title={uiCopy(language, 'sidebarNotReady')} className="flex min-h-10 w-full items-center gap-2 rounded-lg px-3 text-start text-sm text-muted"><FileText className="h-4 w-4" />{uiCopy(language, 'sidebarTerms')}<span className="ml-auto text-[10px]">{uiCopy(language, 'sidebarNotReady')}</span></button>
                <div className="my-1 border-t border-border" />
                <button type="button" role="menuitem" onClick={() => { setIsProfileMenuOpen(false); onOpenApiDocs(); }} className="flex min-h-10 w-full items-center gap-2 rounded-lg px-3 text-start text-sm text-text hover:bg-surface-2"><Code2 className="h-4 w-4" />{uiCopy(language, 'sidebarDeveloperApi')}</button>
                <button type="button" role="menuitem" onClick={() => { setIsProfileMenuOpen(false); onOpenAdmin(); }} className="flex min-h-10 w-full items-center gap-2 rounded-lg px-3 text-start text-sm text-text hover:bg-surface-2"><Shield className="h-4 w-4" />{uiCopy(language, 'sidebarAdmin')}</button>
                <button type="button" role="menuitem" onClick={() => { setIsProfileMenuOpen(false); void logout(); }} className="flex min-h-10 w-full items-center gap-2 rounded-lg px-3 text-start text-sm text-danger hover:bg-surface-2"><LogOut className="h-4 w-4" />{uiCopy(language, 'sidebarSignOut')}</button>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};
