import React, { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  Pin,
  Edit2,
  Trash2,
  Check,
  X,
  MessageSquare,
  FileText,
  Code2,
  Cpu,
  Sun,
  Moon,
  LogIn,
  LogOut,
  Zap,
  PanelLeftClose,
  Shield,
  Sparkles,
  CheckCircle2,
  Compass,
  HelpCircle,
  Smartphone,
  Download,
} from 'lucide-react';
import { ChatSession } from '../../types/chat';
import { useUser } from '../../context/UserContext';
import { EXPERTS, EXPERTS_PK } from '../../data/experts';

interface ChatSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  sessions: ChatSession[];
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
  onOpenProfile: () => void;
  onOpenLogin: () => void;
  onOpenPaywall: () => void;
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
}

export const ChatSidebar: React.FC<ChatSidebarProps> = ({
  isOpen,
  onToggle,
  sessions,
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
  onOpenLogin,
  onOpenPaywall,
  onOpenDownload,
  queryUsage,
  theme,
  toggleTheme,
}) => {
  const { user, isLoggedIn, logout, replayTour } = useUser();
  const [searchQuery, setSearchQuery] = useState('');
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

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

  const getPersonaColor = (personaId: string, variant: 'global' | 'pk' = 'global') => {
    const expertSet = variant === 'pk' ? EXPERTS_PK : EXPERTS;
    return expertSet[personaId]?.avatar_color || '#6366f1';
  };

  const getPersonaInitials = (personaId: string, variant: 'global' | 'pk' = 'global') => {
    const expertSet = variant === 'pk' ? EXPERTS_PK : EXPERTS;
    return expertSet[personaId]?.initials || 'AI';
  };

  const renderSessionItem = (session: ChatSession) => {
    const isActive = session.id === activeSessionId;
    const isEditing = editingSessionId === session.id;
    const color = getPersonaColor(session.personaId, session.variant);
    const initials = getPersonaInitials(session.personaId, session.variant);

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
              <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                <span className="capitalize">{session.mode}</span>
                {session.isPinned && <Pin className="w-2.5 h-2.5 text-amber-500 fill-amber-500" />}
              </div>
            </div>
          )}
        </div>

        {/* Hover Actions (Pin, Rename, Delete) */}
        {!isEditing && (
          <div className="hidden group-hover:flex items-center gap-0.5 shrink-0">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onPinSession(session.id);
              }}
              className={`p-1 rounded hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors ${
                session.isPinned ? 'text-amber-500' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
              }`}
              title={session.isPinned ? 'Unpin Chat' : 'Pin Chat'}
            >
              <Pin className="w-3 h-3" />
            </button>
            <button
              onClick={(e) => handleStartRename(session, e)}
              className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
              title="Rename Chat"
            >
              <Edit2 className="w-3 h-3" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDeleteSession(session.id);
              }}
              className="p-1 rounded text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
              title="Delete Chat"
            >
              <Trash2 className="w-3 h-3" />
            </button>
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
            title="Collapse Sidebar"
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
              <span>New Chat</span>
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
              placeholder="Search chat history..."
              className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Sessions List (Scrollable Area) */}
        <div className="flex-1 overflow-y-auto px-2 py-3 space-y-4 text-xs">
          {sessions.length === 0 ? (
            <div className="p-4 text-center text-slate-400 space-y-2">
              <MessageSquare className="w-6 h-6 mx-auto opacity-40" />
              <p className="text-xs">No previous chats yet.</p>
              <p className="text-[11px] text-slate-500">Click &quot;New Chat&quot; to begin exploration.</p>
            </div>
          ) : (
            <>
              {/* Pinned Group */}
              {grouped.pinned.length > 0 && (
                <div className="space-y-1">
                  <div className="px-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <Pin className="w-2.5 h-2.5 text-amber-500" />
                    <span>Pinned</span>
                  </div>
                  {grouped.pinned.map(renderSessionItem)}
                </div>
              )}

              {/* Today Group */}
              {grouped.today.length > 0 && (
                <div className="space-y-1">
                  <div className="px-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Today
                  </div>
                  {grouped.today.map(renderSessionItem)}
                </div>
              )}

              {/* Yesterday Group */}
              {grouped.yesterday.length > 0 && (
                <div className="space-y-1">
                  <div className="px-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Yesterday
                  </div>
                  {grouped.yesterday.map(renderSessionItem)}
                </div>
              )}

              {/* Previous 7 Days */}
              {grouped.previous7Days.length > 0 && (
                <div className="space-y-1">
                  <div className="px-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Previous 7 Days
                  </div>
                  {grouped.previous7Days.map(renderSessionItem)}
                </div>
              )}

              {/* Older */}
              {grouped.older.length > 0 && (
                <div className="space-y-1">
                  <div className="px-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Older
                  </div>
                  {grouped.older.map(renderSessionItem)}
                </div>
              )}
            </>
          )}
        </div>

        {/* Query Limits & Upgrade Banner */}
        <div id="tour-quota-badge" className="p-3 border-t border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-950/70 shrink-0 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>Queries</span>
            </div>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
              {queryUsage.tier === 'paid' ? 'Unlimited' : `${queryUsage.remaining}/${queryUsage.limit}`}
            </span>
          </div>

          {/* Usage Progress Bar */}
          {queryUsage.tier !== 'paid' && (
            <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  queryUsage.remaining <= 1
                    ? 'bg-rose-500'
                    : queryUsage.remaining <= 3
                    ? 'bg-amber-500'
                    : 'bg-indigo-600'
                }`}
                style={{
                  width: `${Math.max(0, Math.min(100, (queryUsage.remaining / queryUsage.limit) * 100))}%`,
                }}
              />
            </div>
          )}

          {queryUsage.tier !== 'paid' && (
            <button
              onClick={onOpenPaywall}
              className="w-full py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-600 hover:to-indigo-700 text-white font-semibold text-[11px] shadow-xs flex items-center justify-center gap-1 transition-all cursor-pointer"
            >
              <Sparkles className="w-3 h-3" />
              <span>Upgrade to Pro</span>
            </button>
          )}
        </div>

        {/* Bottom Quick Tools & User Profile */}
        <div className="p-2.5 border-t border-slate-200/80 dark:border-slate-800 bg-slate-100/60 dark:bg-slate-950/60 shrink-0 space-y-1.5">
          {/* Action Row: Notes, Product Tour, Admin, Theme */}
          <div className="grid grid-cols-4 gap-1">
            <button
              id="tour-notes-btn"
              onClick={onOpenNotes}
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:text-indigo-500 transition-colors flex items-center justify-center relative cursor-pointer"
              title="Compiled Notes"
            >
              <FileText className="w-4 h-4" />
              {notesCount > 0 && (
                <span className="absolute top-0.5 right-0.5 w-3.5 h-3.5 bg-indigo-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {notesCount}
                </span>
              )}
            </button>

            <button
              onClick={replayTour}
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:text-emerald-500 transition-colors flex items-center justify-center cursor-pointer"
              title="Guided Product Tour (Replay)"
            >
              <Compass className="w-4 h-4" />
            </button>

            <button
              onClick={onOpenAdmin}
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:text-purple-500 transition-colors flex items-center justify-center cursor-pointer"
              title="Admin Dashboard"
            >
              <Cpu className="w-4 h-4" />
            </button>

            <button
              onClick={toggleTheme}
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:text-cyan-500 transition-colors flex items-center justify-center cursor-pointer"
              title={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>

          {/* Android APK Download Quick Button */}
          {onOpenDownload && (
            <button
              onClick={onOpenDownload}
              className="w-full py-1.5 px-2.5 rounded-xl bg-slate-200/70 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-800 border border-slate-300/80 dark:border-slate-700/80 text-slate-800 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer group"
              title="Download Android App (.APK)"
            >
              <div className="flex items-center gap-2">
                <Smartphone className="w-3.5 h-3.5 text-emerald-500 group-hover:scale-110 transition-transform" />
                <span className="text-[11px]">Android App (.APK)</span>
              </div>
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                v1.2
              </span>
            </button>
          )}

          {/* User Account / Sign In Footer */}
          {isLoggedIn && user ? (
            <div className="flex items-center justify-between p-1.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60">
              <div
                onClick={onOpenProfile}
                className="flex items-center gap-2 cursor-pointer min-w-0 flex-1"
              >
                <img
                  src={user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`}
                  alt={user.name}
                  className="w-7 h-7 rounded-full object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                />
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {user.name}
                    </span>
                    {(user.tier === 'paid' || user.tier === 'pro' || user.tier === 'unlimited') && (
                      <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-300/80 dark:border-amber-700/80 shrink-0 shadow-2xs">
                        PRO
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 truncate">{user.email || user.username || user.phone}</span>
                </div>
              </div>

              <button
                onClick={logout}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shrink-0"
                title="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenLogin}
              className="w-full py-2 px-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-750 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
            >
              <LogIn className="w-3.5 h-3.5 text-indigo-600" />
              <span>Sign In / Register</span>
            </button>
          )}
        </div>
      </aside>
    </>
  );
};
