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
import { ExpertPersona } from '../../data/experts';

export function getBrandPersonaColor(id: string): { bg: string; text: string } {
  let hash = 0;
  for (let i = 0; i < (id || '').length; i++) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
    hash |= 0;
  }
  const colors = [
    { bg: '#0A5C45', text: '#FFFFFF' },
    { bg: '#F4B400', text: '#10231C' },
    { bg: '#0F8056', text: '#FFFFFF' },
    { bg: '#7A5200', text: '#FFFFFF' },
  ];
  return colors[Math.abs(hash) % colors.length];
}

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
    const brandColor = getBrandPersonaColor(personaId || session.id);

    return (
      <div
        key={session.id}
        onClick={() => onSelectSession(session.id)}
        className={`group relative flex items-center gap-2.5 px-3 py-2.5 rounded-[14px] min-h-[44px] cursor-pointer transition-all duration-150 select-none border ${
          isActive
            ? 'bg-[#DDEFE6] dark:bg-[#17352A] text-[#0A5C45] dark:text-[#5BE0A5] font-bold border-[#0A5C45]/20 dark:border-[#5BE0A5]/20'
            : 'text-[#10231C] dark:text-[#E8F2EC] hover:bg-[#F3F6F1] dark:hover:bg-[#17352A]/40 border-transparent hover:border-[#D5E0D8] dark:hover:border-[#27403A]'
        }`}
      >
        {/* Persona Initials Badge */}
        <div
          className="w-7 h-7 rounded-[10px] flex items-center justify-center text-xs font-bold shrink-0"
          style={{ backgroundColor: brandColor.bg, color: brandColor.text }}
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
                className="w-full text-xs px-2 py-1 rounded-[10px] bg-white dark:bg-[#12231C] border border-[#0A5C45] dark:border-[#0F8056] text-[#10231C] dark:text-[#E8F2EC] focus:outline-none"
              />
              <button
                type="submit"
                className="min-h-[44px] min-w-[32px] p-1 text-[#0A5C45] dark:text-[#5BE0A5] hover:opacity-80 flex items-center justify-center"
                title="Save"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setEditingSessionId(null)}
                className="min-h-[44px] min-w-[32px] p-1 text-[#4F6359] dark:text-[#9DB5A8] hover:text-[#10231C] dark:hover:text-[#E8F2EC] flex items-center justify-center"
                title="Cancel"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </form>
          ) : (
            <div className="flex flex-col">
              <span className="text-xs truncate font-medium">{session.title}</span>
              <div className="flex items-center gap-1.5 text-xs text-[#4F6359] dark:text-[#9DB5A8]">
                <span className="capitalize">{session.mode}</span>
                {session.isPinned && <Pin className="w-3 h-3 text-[#F4B400] fill-[#F4B400]" />}
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
        className={`fixed lg:static top-0 bottom-0 left-0 z-40 flex flex-col w-[270px] bg-[#FFFFFF] dark:bg-[#12231C] border-r border-[#D5E0D8] dark:border-[#27403A] transition-all duration-300 ease-in-out shrink-0 overflow-hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:w-0 lg:border-r-0'
        }`}
      >
        {/* Top Header: Brand & Collapse Toggle */}
        <div className="h-16 px-4 border-b border-[#D5E0D8] dark:border-[#27403A] flex items-center justify-between shrink-0 bg-[#FFFFFF] dark:bg-[#12231C]">
          <div className="flex items-center gap-2.5 select-none">
            <div className="w-8 h-8 rounded-[10px] bg-[#0A5C45] dark:bg-[#0F8056] text-white flex items-center justify-center font-bold text-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="font-heading font-bold text-base tracking-tight text-[#10231C] dark:text-[#E8F2EC] leading-tight">
                G-AGE <span className="text-[#0A5C45] dark:text-[#5BE0A5] font-semibold">AI</span>
              </div>
              <div className="text-xs text-[#4F6359] dark:text-[#9DB5A8] font-medium leading-none">
                The Next Age of Intelligence
              </div>
            </div>
          </div>

          <button
            onClick={onToggle}
            className="min-h-[44px] min-w-[44px] p-2 rounded-[14px] text-[#4F6359] dark:text-[#9DB5A8] hover:text-[#10231C] dark:hover:text-[#E8F2EC] hover:bg-[#DDEFE6] dark:hover:bg-[#17352A] transition-colors flex items-center justify-center cursor-pointer border border-transparent hover:border-[#D5E0D8] dark:hover:border-[#27403A]"
            title="Collapse Sidebar"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        </div>

        {/* New Chat & Search Stage */}
        <div className="p-3 space-y-2 border-b border-[#D5E0D8] dark:border-[#27403A] bg-[#FFFFFF] dark:bg-[#12231C] shrink-0">
          {/* New Chat Primary Button */}
          <button
            onClick={onNewChat}
            className="w-full min-h-[44px] py-2.5 px-3.5 rounded-[14px] bg-[#0A5C45] dark:bg-[#0F8056] hover:brightness-110 active:scale-[0.98] text-white text-xs font-bold flex items-center justify-between transition-all cursor-pointer border border-[#0A5C45] dark:border-[#0F8056] group"
          >
            <div className="flex items-center gap-2">
              <Plus className="w-4 h-4 transition-transform group-hover:rotate-90 duration-200" />
              <span>New Chat</span>
            </div>
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-white/20 text-xs text-white font-mono">
              Ctrl+K
            </kbd>
          </button>

          {/* Search Chat History Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-[#4F6359] dark:text-[#9DB5A8] absolute left-3 top-3.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search chat history..."
              className="w-full min-h-[44px] pl-9 pr-3 py-2 rounded-[14px] border border-[#D5E0D8] dark:border-[#27403A] bg-[#F3F6F1] dark:bg-[#0B1612] text-sm text-[#10231C] dark:text-[#E8F2EC] placeholder:text-[#4F6359] dark:placeholder:text-[#9DB5A8] focus:outline-none focus:border-[#0A5C45] dark:focus:border-[#0F8056]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 min-h-[32px] min-w-[32px] text-[#4F6359] hover:text-[#10231C] dark:text-[#9DB5A8] dark:hover:text-[#E8F2EC] flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Sessions List (Scrollable Area) */}
        <div className="flex-1 overflow-y-auto px-2 py-3 space-y-4 text-xs">
          {sessions.length === 0 ? (
            <div className="p-4 text-center text-[#4F6359] dark:text-[#9DB5A8] space-y-2">
              <MessageSquare className="w-6 h-6 mx-auto opacity-40 text-[#0A5C45] dark:text-[#5BE0A5]" />
              <p className="text-xs font-semibold">No previous chats yet.</p>
              <p className="text-xs">Click &quot;New Chat&quot; to begin exploration.</p>
            </div>
          ) : (
            <>
              {/* Pinned Group */}
              {grouped.pinned.length > 0 && (
                <div className="space-y-1">
                  <div className="px-2 text-xs font-bold text-[#4F6359] dark:text-[#9DB5A8] uppercase tracking-wider flex items-center gap-1">
                    <Pin className="w-3 h-3 text-[#F4B400]" />
                    <span>Pinned</span>
                  </div>
                  {grouped.pinned.map(renderSessionItem)}
                </div>
              )}

              {/* Today Group */}
              {grouped.today.length > 0 && (
                <div className="space-y-1">
                  <div className="px-2 text-xs font-bold text-[#4F6359] dark:text-[#9DB5A8] uppercase tracking-wider">
                    Today
                  </div>
                  {grouped.today.map(renderSessionItem)}
                </div>
              )}

              {/* Yesterday Group */}
              {grouped.yesterday.length > 0 && (
                <div className="space-y-1">
                  <div className="px-2 text-xs font-bold text-[#4F6359] dark:text-[#9DB5A8] uppercase tracking-wider">
                    Yesterday
                  </div>
                  {grouped.yesterday.map(renderSessionItem)}
                </div>
              )}

              {/* Previous 7 Days */}
              {grouped.previous7Days.length > 0 && (
                <div className="space-y-1">
                  <div className="px-2 text-xs font-bold text-[#4F6359] dark:text-[#9DB5A8] uppercase tracking-wider">
                    Previous 7 Days
                  </div>
                  {grouped.previous7Days.map(renderSessionItem)}
                </div>
              )}

              {/* Older */}
              {grouped.older.length > 0 && (
                <div className="space-y-1">
                  <div className="px-2 text-xs font-bold text-[#4F6359] dark:text-[#9DB5A8] uppercase tracking-wider">
                    Older
                  </div>
                  {grouped.older.map(renderSessionItem)}
                </div>
              )}
            </>
          )}
        </div>

        {/* Query Limits & Upgrade Banner */}
        <div id="tour-quota-badge" className="p-3 border-t border-[#D5E0D8] dark:border-[#27403A] bg-[#FFFFFF] dark:bg-[#12231C] shrink-0 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 font-bold text-[#10231C] dark:text-[#E8F2EC]">
              <Zap className="w-4 h-4 text-[#F4B400]" />
              <span>Queries</span>
            </div>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#DDEFE6] dark:bg-[#17352A] text-[#0A5C45] dark:text-[#5BE0A5] border border-[#0A5C45]/20 dark:border-[#5BE0A5]/20">
              {queryUsage.tier === 'paid' ? 'Unlimited' : `${queryUsage.remaining}/${queryUsage.limit}`}
            </span>
          </div>

          {/* Usage Progress Bar */}
          {queryUsage.tier !== 'paid' && (
            <div className="w-full bg-[#DDEFE6] dark:bg-[#17352A] h-2 rounded-full overflow-hidden border border-[#D5E0D8] dark:border-[#27403A]">
              <div
                className={`h-full transition-all duration-300 ${
                  queryUsage.remaining <= 1
                    ? 'bg-rose-500'
                    : queryUsage.remaining <= 3
                    ? 'bg-[#F4B400]'
                    : 'bg-[#0A5C45] dark:bg-[#0F8056]'
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
              className="w-full min-h-[44px] py-2.5 rounded-[14px] bg-[#F4B400] text-[#10231C] hover:bg-[#e0a500] font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-[#d49b00]"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Upgrade to Pro</span>
            </button>
          )}
        </div>

        {/* Bottom Quick Tools & User Profile */}
        <div className="p-2.5 border-t border-[#D5E0D8] dark:border-[#27403A] bg-[#FFFFFF] dark:bg-[#12231C] shrink-0 space-y-2">
          {/* Action Row: Notes, Product Tour, Admin, Theme */}
          <div className="grid grid-cols-4 gap-1.5">
            <button
              id="tour-notes-btn"
              onClick={onOpenNotes}
              className="min-h-[44px] min-w-[44px] rounded-[14px] border border-[#D5E0D8] dark:border-[#27403A] bg-white dark:bg-[#12231C] text-[#4F6359] dark:text-[#9DB5A8] hover:bg-[#DDEFE6] dark:hover:bg-[#17352A] hover:text-[#0A5C45] dark:hover:text-[#5BE0A5] transition-colors flex flex-col items-center justify-center p-1 relative cursor-pointer"
              title="Notes"
            >
              <FileText className="w-3.5 h-3.5" />
              <span className="text-[12px] font-semibold mt-0.5 leading-none">Notes</span>
              {notesCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-[#0A5C45] dark:bg-[#0F8056] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {notesCount}
                </span>
              )}
            </button>

            <button
              onClick={replayTour}
              className="min-h-[44px] min-w-[44px] rounded-[14px] border border-[#D5E0D8] dark:border-[#27403A] bg-white dark:bg-[#12231C] text-[#4F6359] dark:text-[#9DB5A8] hover:bg-[#DDEFE6] dark:hover:bg-[#17352A] hover:text-[#0A5C45] dark:hover:text-[#5BE0A5] transition-colors flex flex-col items-center justify-center p-1 cursor-pointer"
              title="Tour"
            >
              <Compass className="w-3.5 h-3.5" />
              <span className="text-[12px] font-semibold mt-0.5 leading-none">Tour</span>
            </button>

            <button
              onClick={onOpenAdmin}
              className="min-h-[44px] min-w-[44px] rounded-[14px] border border-[#D5E0D8] dark:border-[#27403A] bg-white dark:bg-[#12231C] text-[#4F6359] dark:text-[#9DB5A8] hover:bg-[#DDEFE6] dark:hover:bg-[#17352A] hover:text-[#0A5C45] dark:hover:text-[#5BE0A5] transition-colors flex flex-col items-center justify-center p-1 cursor-pointer"
              title="Admin"
            >
              <Cpu className="w-3.5 h-3.5" />
              <span className="text-[12px] font-semibold mt-0.5 leading-none">Admin</span>
            </button>

            <button
              onClick={toggleTheme}
              className="min-h-[44px] min-w-[44px] rounded-[14px] border border-[#D5E0D8] dark:border-[#27403A] bg-white dark:bg-[#12231C] text-[#4F6359] dark:text-[#9DB5A8] hover:bg-[#DDEFE6] dark:hover:bg-[#17352A] hover:text-[#0A5C45] dark:hover:text-[#5BE0A5] transition-colors flex flex-col items-center justify-center p-1 cursor-pointer"
              title={theme === 'dark' ? 'Light' : 'Dark'}
            >
              {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
              <span className="text-[12px] font-semibold mt-0.5 leading-none">{theme === 'dark' ? 'Light' : 'Dark'}</span>
            </button>
          </div>

          {/* Android APK Download Quick Button */}
          {onOpenDownload && (
            <button
              onClick={onOpenDownload}
              className="w-full min-h-[44px] py-2 px-3 rounded-[14px] bg-white dark:bg-[#12231C] hover:bg-[#DDEFE6] dark:hover:bg-[#17352A] border border-[#D5E0D8] dark:border-[#27403A] text-[#10231C] dark:text-[#E8F2EC] hover:text-[#0A5C45] dark:hover:text-[#5BE0A5] text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer group"
              title="Download Android App (.APK)"
            >
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-[#0A5C45] dark:text-[#5BE0A5] group-hover:scale-110 transition-transform" />
                <span className="text-xs">Android App (.APK)</span>
              </div>
              <span className="text-xs font-bold px-2 py-0.5 rounded-[10px] bg-[#DDEFE6] dark:bg-[#17352A] text-[#0A5C45] dark:text-[#5BE0A5] border border-[#0A5C45]/20 dark:border-[#5BE0A5]/20">
                v1.2
              </span>
            </button>
          )}

          {/* User Account / Sign In Footer */}
          {isLoggedIn && user ? (
            <div className="flex items-center justify-between p-2 rounded-[14px] bg-white dark:bg-[#12231C] border border-[#D5E0D8] dark:border-[#27403A]">
              <div
                onClick={onOpenProfile}
                className="flex items-center gap-2.5 cursor-pointer min-w-0 flex-1"
              >
                <img
                  src={user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`}
                  alt={user.name}
                  className="w-8 h-8 rounded-full object-cover border border-[#D5E0D8] dark:border-[#27403A] shrink-0"
                />
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-xs font-bold text-[#10231C] dark:text-[#E8F2EC] truncate">
                      {user.name}
                    </span>
                    {(user.tier === 'paid' || user.tier === 'pro' || user.tier === 'unlimited') && (
                      <span className="inline-flex items-center px-1.5 py-0.2 rounded-[8px] text-[10px] font-extrabold bg-[#F4B400] text-[#10231C] border border-[#d49b00] shrink-0">
                        PRO
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-[#4F6359] dark:text-[#9DB5A8] truncate">{user.email || user.username || user.phone}</span>
                </div>
              </div>

              <button
                onClick={logout}
                className="min-h-[44px] min-w-[36px] p-2 rounded-[10px] text-[#4F6359] hover:text-rose-600 dark:hover:text-rose-400 hover:bg-[#F3F6F1] dark:hover:bg-[#17352A] transition-colors shrink-0 flex items-center justify-center cursor-pointer"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenLogin}
              className="w-full min-h-[44px] py-2.5 px-3 rounded-[14px] bg-[#0A5C45] dark:bg-[#0F8056] text-white hover:brightness-110 border border-[#0A5C45] dark:border-[#0F8056] text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In / Register</span>
            </button>
          )}
        </div>
      </aside>
    </>
  );
};
