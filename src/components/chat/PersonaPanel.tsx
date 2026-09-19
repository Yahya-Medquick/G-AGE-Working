import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  PanelRightClose,
  Search,
  Globe,
  Sparkles,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  UserCheck,
  Compass,
  MessageSquare,
  ArrowRight,
  MessageCircle,
  HelpCircle,
  Lock,
  Crown,
  Clock,
  Layers,
} from 'lucide-react';
import { ExpertPersona } from '../../data/experts';
import { usePersonas } from '../../hooks/usePersonas';
import { useUser } from '../../context/UserContext';

interface PersonaPanelProps {
  isOpen: boolean;
  onToggle: () => void;
  selectedPersonaId: string;
  onSelectPersona: (personaId: string, variant: 'global' | 'pk') => void;
  variant: 'global' | 'pk';
  onToggleVariant: (variant: 'global' | 'pk') => void;
  onOpenPwaShortcut?: (persona: ExpertPersona) => void;
  suggestedPersonaId?: string;
  onSelectPrompt?: (prompt: string) => void;
  onSelectTopic?: (topic: string) => void;
  onOpenPaywall?: () => void;
}

type PanelView = 'groups' | 'personas';

const GUEST_RECENT_KEY = 'gage_recent_personas';

function getGuestRecent(): string[] {
  try {
    const saved = localStorage.getItem(GUEST_RECENT_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch { return []; }
}

function saveGuestRecent(slug: string) {
  try {
    const current = getGuestRecent();
    const next = [slug, ...current.filter(s => s !== slug)].slice(0, 3);
    localStorage.setItem(GUEST_RECENT_KEY, JSON.stringify(next));
  } catch {}
}

export const PersonaPanel: React.FC<PersonaPanelProps> = ({
  isOpen,
  onToggle,
  selectedPersonaId,
  onSelectPersona,
  variant,
  onToggleVariant,
  onOpenPwaShortcut,
  suggestedPersonaId,
  onSelectPrompt,
  onSelectTopic,
  onOpenPaywall,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [view, setView] = useState<PanelView>('groups');
  const [activeGroup, setActiveGroup] = useState<string | null>(null);
  const [recentSlugs, setRecentSlugs] = useState<string[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const { user, profile } = useUser();
  const isPaid = user?.tier === 'paid' || user?.tier === 'pro' || user?.tier === 'unlimited';

  const { globalExperts, pkExperts } = usePersonas();
  const activeExpertSet = variant === 'pk' ? pkExperts : globalExperts;

  const personaList = useMemo(() => {
    const map = new Map<string, ExpertPersona>();
    for (const p of Object.values(activeExpertSet)) {
      map.set(p.id || (p as any).slug, p);
    }
    return Array.from(map.values());
  }, [activeExpertSet]);

  const activePersona = activeExpertSet[selectedPersonaId] || personaList[0];

  // Load recent personas
  useEffect(() => {
    if (user) {
      fetch('/api/v1/personas/recent', { credentials: 'include' })
        .then(r => r.json())
        .then(data => {
          if (data.success && data.personas) {
            setRecentSlugs(data.personas.map((p: any) => p.slug));
          }
        })
        .catch(() => {});
    } else {
      setRecentSlugs(getGuestRecent());
    }
  }, [user, isOpen]);

  // Derive groups from personas
  const groups = useMemo(() => {
    const groupMap = new Map<string, { name: string; count: number; color: string }>();
    for (const p of personaList) {
      const gName = (p as any).group_name || p.badge || 'General';
      if (!groupMap.has(gName)) {
        groupMap.set(gName, { name: gName, count: 0, color: p.avatar_color || '#6366f1' });
      }
      groupMap.get(gName)!.count++;
    }
    return Array.from(groupMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [personaList]);

  // Recent personas objects
  const recentPersonas = useMemo(() => {
    return recentSlugs
      .map(slug => personaList.find(p => (p as any).slug === slug || p.id === slug))
      .filter(Boolean) as ExpertPersona[];
  }, [recentSlugs, personaList]);

  // Personas in active group
  const groupPersonas = useMemo(() => {
    if (!activeGroup) return [];
    return personaList.filter(p => {
      const gName = (p as any).group_name || p.badge || 'General';
      return gName === activeGroup;
    }).sort((a, b) => {
      // Last used on top
      const aIdx = recentSlugs.indexOf((a as any).slug || a.id);
      const bIdx = recentSlugs.indexOf((b as any).slug || b.id);
      if (aIdx !== -1 && bIdx === -1) return -1;
      if (aIdx === -1 && bIdx !== -1) return 1;
      if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
      return 0;
    });
  }, [activeGroup, personaList, recentSlugs]);

  // Search flat list
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return personaList.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.role.toLowerCase().includes(q) ||
      p.badge.toLowerCase().includes(q) ||
      p.specialties.some(s => s.toLowerCase().includes(q)) ||
      p.domains.some(d => d.toLowerCase().includes(q)) ||
      ((p as any).group_name || '').toLowerCase().includes(q)
    );
  }, [personaList, searchQuery]);

  const dynamicSuggestedPrompts = useMemo(() => {
    if (!activePersona) return [];
    const specs = activePersona.specialties || [];
    return [
      `Explain the fundamental principles of ${specs[0] || 'this field'} with rigorous proofs and intuitive analogies.`,
      `What are the most common exam traps or misconceptions in ${specs[1] || specs[0] || 'this domain'}?`,
      `How do modern 2026 research breakthroughs connect to ${specs[0] || 'this concept'}?`,
    ];
  }, [activePersona]);

  const handleGroupClick = (groupName: string) => {
    setActiveGroup(groupName);
    setView('personas');
    if (listRef.current) listRef.current.scrollTop = 0;
  };

  const handleBackToGroups = () => {
    setView('groups');
    setActiveGroup(null);
  };

  const handleSelectPersona = async (persona: ExpertPersona) => {
    const slug = (persona as any).slug || persona.id;
    setSelectedSlug(slug);
    setIsAnimating(true);

    // Record usage
    if (user) {
      fetch(`/api/v1/personas/${slug}/used`, { method: 'POST', credentials: 'include' }).catch(() => {});
    } else {
      saveGuestRecent(slug);
    }
    setRecentSlugs(prev => [slug, ...prev.filter(s => s !== slug)].slice(0, 3));

    // Animate then switch
    setTimeout(() => {
      onSelectPersona(persona.id || slug, variant);
      setIsAnimating(false);
      setSelectedSlug(null);
      setView('groups');
      setActiveGroup(null);
    }, 500);
  };

  const isSearching = searchQuery.trim().length > 0;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onToggle}
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs lg:hidden animate-in fade-in"
        />
      )}

      {/* Main Panel */}
      <aside
        className={`fixed lg:static top-0 bottom-0 right-0 z-40 flex flex-col w-[300px] sm:w-[320px] bg-slate-50 dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 transition-all duration-300 ease-in-out shrink-0 overflow-hidden ${
          isOpen ? 'translate-x-0' : 'translate-x-full lg:w-0 lg:border-l-0'
        }`}
      >
        {/* Header */}
        <div className="h-14 px-4 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between shrink-0 bg-white/70 dark:bg-slate-950/70">
          <div className="flex items-center gap-2 select-none">
            {view === 'personas' && !isSearching ? (
              <button
                onClick={handleBackToGroups}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            ) : (
              <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                <UserCheck className="w-4 h-4" />
              </div>
            )}
            <div>
              <h2 className="font-bold text-sm tracking-tight text-slate-900 dark:text-white">
                {view === 'personas' && !isSearching && activeGroup ? activeGroup : 'Expert Personas'}
              </h2>
              {view === 'personas' && !isSearching && activeGroup && (
                <p className="text-[10px] text-slate-400">{groupPersonas.length} specialist{groupPersonas.length !== 1 ? 's' : ''}</p>
              )}
            </div>
          </div>
          <button
            onClick={onToggle}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Collapse Persona Panel"
          >
            <PanelRightClose className="w-4 h-4" />
          </button>
        </div>

        {/* Region Toggle + Search */}
        <div className="p-3 border-b border-slate-200/60 dark:border-slate-800/60 bg-white/40 dark:bg-slate-950/40 shrink-0 space-y-2.5">
          <div className="flex items-center p-1 rounded-xl bg-slate-200/70 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
            <button
              onClick={() => onToggleVariant('pk')}
              className={`flex-1 py-1.5 px-2 rounded-lg font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                variant === 'pk'
                  ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>🇵🇰</span><span>Pakistani</span>
            </button>
            <button
              onClick={() => onToggleVariant('global')}
              className={`flex-1 py-1.5 px-2 rounded-lg font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                variant === 'global'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Globe className="w-3.5 h-3.5" /><span>Global</span>
            </button>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search specialists & domains..."
              className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs cursor-pointer"
              >✕</button>
            )}
          </div>
        </div>

        {/* Scrollable Content */}
        <div ref={listRef} className="flex-1 overflow-y-auto p-3 space-y-3">

          {/* SEARCH MODE — flat list across all groups */}
          {isSearching && (
            <>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1 flex items-center justify-between">
                <span>Results ({searchResults.length})</span>
                <span className="font-normal">across all groups</span>
              </div>
              {searchResults.length === 0 && (
                <div className="text-center py-8 text-slate-400 text-xs">No specialists found</div>
              )}
              {searchResults.map(persona => (
                <PersonaCard
                  key={persona.id}
                  persona={persona}
                  isSelected={persona.id === selectedPersonaId}
                  isSuggested={suggestedPersonaId === persona.id}
                  isAnimating={isAnimating && selectedSlug === ((persona as any).slug || persona.id)}
                  isLastUsed={recentSlugs[0] === ((persona as any).slug || persona.id)}
                  onClick={() => handleSelectPersona(persona)}
                />
              ))}
            </>
          )}

          {/* GROUPS VIEW */}
          {!isSearching && view === 'groups' && (
            <>
              {/* Active Persona Focus */}
              {activePersona && (
                <div className="p-3 rounded-2xl bg-gradient-to-br from-indigo-50/90 to-purple-50/50 dark:from-indigo-950/40 dark:to-slate-900 border border-indigo-200/80 dark:border-indigo-800/60 shadow-xs space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-6 h-6 rounded-lg flex items-center justify-center text-white text-[10px] font-bold shadow-xs"
                        style={{ backgroundColor: activePersona.avatar_color }}
                      >
                        {activePersona.initials}
                      </div>
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {activePersona.name} — Active
                      </span>
                    </div>
                    <span
                      className="text-[9px] font-bold px-2 py-0.5 rounded-full border"
                      style={{
                        color: activePersona.avatar_color,
                        borderColor: `${activePersona.avatar_color}40`,
                        backgroundColor: `${activePersona.avatar_color}10`,
                      }}
                    >
                      {(activePersona as any).group_name || activePersona.badge}
                    </span>
                  </div>
                  {onSelectPrompt && dynamicSuggestedPrompts.length > 0 && (
                    <div className="space-y-1.5 pt-1 border-t border-indigo-100 dark:border-indigo-900/60">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        <MessageSquare className="w-3 h-3 text-indigo-500" />
                        <span>Suggested Inquiries</span>
                      </span>
                      <div className="space-y-1">
                        {dynamicSuggestedPrompts.map((promptText, pIdx) => (
                          <button
                            key={pIdx}
                            onClick={() => onSelectPrompt(promptText)}
                            className="w-full text-left p-1.5 rounded-lg bg-white/90 dark:bg-slate-800/80 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-600 dark:hover:text-white border border-indigo-100 dark:border-indigo-900 text-[10px] text-slate-700 dark:text-slate-200 font-medium transition-all group/p flex items-start gap-1.5 cursor-pointer shadow-2xs"
                          >
                            <ArrowRight className="w-3 h-3 text-indigo-500 group-hover/p:text-white group-hover/p:translate-x-0.5 transition-all shrink-0 mt-0.5" />
                            <span className="line-clamp-2">{promptText}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Recent Personas Row */}
              {recentPersonas.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1 flex items-center gap-1">
                    <Clock className="w-3 h-3" /><span>Recently Used</span>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {recentPersonas.map(p => (
                      <button
                        key={p.id}
                        onClick={() => handleSelectPersona(p)}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-emerald-400 dark:hover:border-emerald-500 transition-all text-xs font-medium text-slate-700 dark:text-slate-200 shadow-2xs cursor-pointer group"
                      >
                        <div
                          className="w-5 h-5 rounded-md flex items-center justify-center text-white text-[9px] font-bold shrink-0"
                          style={{ backgroundColor: p.avatar_color }}
                        >
                          {p.initials}
                        </div>
                        <span className="truncate max-w-[80px]">{p.name}</span>
                        {isAnimating && selectedSlug === ((p as any).slug || p.id) && (
                          <span className="w-3 h-3 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Groups Grid */}
              <div className="space-y-1.5">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1 flex items-center gap-1">
                  <Layers className="w-3 h-3" /><span>Subject Groups</span>
                </div>
                <div className="space-y-2">
                  {groups.map(group => (
                    <button
                      key={group.name}
                      onClick={() => handleGroupClick(group.name)}
                      className="w-full flex items-center justify-between p-3 rounded-xl border bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-2xs cursor-pointer group"
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-xs"
                          style={{ backgroundColor: group.color }}
                        >
                          {group.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="text-left">
                          <div className="text-xs font-bold text-slate-900 dark:text-white">{group.name}</div>
                          <div className="text-[10px] text-slate-400">{group.count} specialist{group.count !== 1 ? 's' : ''}</div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 group-hover:translate-x-0.5 transition-all" />
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* PERSONAS VIEW — within a group */}
          {!isSearching && view === 'personas' && (
            <>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1 flex items-center justify-between">
                <span>Specialists</span>
                <span className="font-normal text-slate-400">Click to switch</span>
              </div>
              {groupPersonas.length === 0 && (
                <div className="text-center py-8 text-slate-400 text-xs">No specialists in this group</div>
              )}
              {groupPersonas.map(persona => (
                <PersonaCard
                  key={persona.id}
                  persona={persona}
                  isSelected={persona.id === selectedPersonaId}
                  isSuggested={suggestedPersonaId === persona.id}
                  isAnimating={isAnimating && selectedSlug === ((persona as any).slug || persona.id)}
                  isLastUsed={recentSlugs[0] === ((persona as any).slug || persona.id)}
                  onClick={() => handleSelectPersona(persona)}
                />
              ))}
            </>
          )}

          {/* WhatsApp Card */}
          <div className={`mt-4 p-3.5 rounded-2xl bg-gradient-to-br ${
            isPaid
              ? 'from-emerald-500/10 via-teal-500/5 to-slate-900/50 border-emerald-500/30 dark:border-emerald-500/20'
              : 'from-amber-500/10 via-purple-500/5 to-slate-900/50 border-amber-500/30 dark:border-amber-500/20'
          } border text-slate-900 dark:text-slate-100 shadow-sm space-y-2.5`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-xl ${isPaid ? 'bg-emerald-500' : 'bg-gradient-to-br from-amber-500 to-purple-600'} text-white flex items-center justify-center shadow-xs`}>
                  {isPaid ? <MessageCircle className="w-4 h-4" /> : <Crown className="w-4 h-4" />}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    {variant === 'pk' ? '🇵🇰 Student WhatsApp Help' : 'WhatsApp Study Desk'}
                  </h4>
                  <span className={`text-[10px] ${isPaid ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'} font-medium`}>
                    {isPaid ? 'Direct Academic Counselor' : 'Pro Member Feature'}
                  </span>
                </div>
              </div>
              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                isPaid
                  ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30'
              }`}>
                {isPaid ? 'PRO ACTIVE' : 'PRO ONLY'}
              </span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
              {isPaid
                ? (variant === 'pk'
                    ? 'Get priority 1-on-1 guidance on Pakistani university admissions (FAST, NUST, LUMS, AKU), syllabus roadblocks, or career roadmaps.'
                    : 'Get priority 1-on-1 personalized research advice and study roadmaps with your Pro membership.')
                : (variant === 'pk'
                    ? 'Exclusive 1-on-1 WhatsApp academic counseling for Pakistani university admissions & syllabus roadblocks.'
                    : 'Exclusive 1-on-1 personalized academic mentorship and research roadmaps on WhatsApp for Pro subscribers.')}
            </p>
            <button
              onClick={() => {
                if (!isPaid) { if (onOpenPaywall) onOpenPaywall(); return; }
                const rawPhone = import.meta.env.VITE_WHATSAPP_SUPPORT_NUMBER || "923264397102";
                const phone = rawPhone.replace(/\D/g, "") || "923264397102";
                const currentUsername = user?.username || profile?.username || user?.name || profile?.name || 'Pro User';
                const message = encodeURIComponent(`Hi G-AGE AI Study Desk, I am a Pro subscriber (${currentUsername}). I need 1-on-1 academic mentorship.`);
                window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
              }}
              className={`w-full py-2 px-3 rounded-xl ${
                isPaid
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  : 'bg-gradient-to-r from-amber-500 to-purple-600 hover:from-amber-600 hover:to-purple-700 text-white'
              } text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer`}
            >
              {isPaid ? (
                <><MessageCircle className="w-3.5 h-3.5" /><span>Chat on WhatsApp Desk</span><ExternalLink className="w-3 h-3 opacity-70" /></>
              ) : (
                <><Lock className="w-3.5 h-3.5" /><span>Unlock Pro WhatsApp Desk</span><Crown className="w-3 h-3 opacity-70" /></>
              )}
            </button>
            <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-emerald-500/10">
              <span className="flex items-center gap-1"><HelpCircle className="w-3 h-3" /> Mon-Sat (9 AM - 9 PM PKT)</span>
              <span className={`font-mono text-[9px] ${isPaid ? 'text-emerald-500 font-semibold' : 'text-amber-500 font-semibold'}`}>
                {isPaid ? 'Pro 1-on-1 Desk' : 'Paid Feature'}
              </span>
            </div>
          </div>

        </div>
      </aside>
    </>
  );
};

// ── Persona Card Sub-component ──────────────────────────────────────────────
interface PersonaCardProps {
  persona: ExpertPersona;
  isSelected: boolean;
  isSuggested: boolean;
  isAnimating: boolean;
  isLastUsed: boolean;
  onClick: () => void;
}

const PersonaCard: React.FC<PersonaCardProps> = ({
  persona, isSelected, isSuggested, isAnimating, isLastUsed, onClick
}) => (
  <div
    onClick={onClick}
    className={`relative rounded-xl border p-3 cursor-pointer transition-all duration-200 select-none ${
      isAnimating
        ? 'scale-95 opacity-60 border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30'
        : isSelected
        ? 'bg-white dark:bg-slate-800/95 border-emerald-600 dark:border-emerald-400 shadow-sm ring-1 ring-emerald-500/20'
        : 'bg-white/80 dark:bg-slate-800/50 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-white dark:hover:bg-slate-800 shadow-2xs'
    }`}
  >
    {/* Ribbons */}
    <div className="flex items-center gap-1.5 mb-1.5">
      {isLastUsed && !isSelected && (
        <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-[9px] font-bold text-emerald-700 dark:text-emerald-300">
          <Clock className="w-2.5 h-2.5" /><span>LAST USED</span>
        </div>
      )}
      {isSuggested && !isSelected && (
        <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-[9px] font-bold text-indigo-700 dark:text-indigo-300">
          <Sparkles className="w-2.5 h-2.5" /><span>Best Match</span>
        </div>
      )}
    </div>

    {/* Avatar + Name */}
    <div className="flex items-start gap-2.5">
      <div
        className={`w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-xs transition-transform duration-200 ${isAnimating ? 'scale-110' : ''}`}
        style={{ backgroundColor: persona.avatar_color }}
      >
        {isAnimating
          ? <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
          : persona.initials}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1">
          <h3 className="text-xs font-bold text-slate-900 dark:text-white truncate">{persona.name}</h3>
          {isSelected && (
            <span className="flex items-center gap-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-3 h-3" /> Active
            </span>
          )}
        </div>
        <p className="text-[11px] font-medium text-slate-600 dark:text-slate-300 truncate">{persona.role}</p>
        <p className="text-[10px] text-slate-400 truncate">{persona.affiliation}</p>
      </div>
    </div>

    {/* Badge */}
    <div className="mt-2 flex items-center justify-between">
      <span
        className="text-[9px] font-bold px-2 py-0.5 rounded-full border"
        style={{
          color: persona.avatar_color,
          borderColor: `${persona.avatar_color}40`,
          backgroundColor: `${persona.avatar_color}10`,
        }}
      >
        {persona.badge}
      </span>
    </div>

    {/* Specialties */}
    <div className="mt-2 flex flex-wrap gap-1">
      {persona.specialties.slice(0, 3).map((spec, i) => (
        <span key={i} className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200/50 dark:border-slate-800">
          {spec}
        </span>
      ))}
    </div>
  </div>
);
