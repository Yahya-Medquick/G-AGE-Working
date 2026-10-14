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
import { ProExpiryBadge } from '../ProExpiryBadge';
import { getBrandPersonaColor } from './ChatSidebar';

interface PersonaPanelProps {
  isOpen: boolean;
  onToggle: () => void;
  selectedPersonaId: string;
  onSelectPersona: (personaId: string, variant: 'global' | 'pk') => void;
  variant: 'global' | 'pk';
  onToggleVariant: (variant: 'global' | 'pk') => void;
  onOpenPwaShortcut?: (persona: ExpertPersona) => void;
  onSelectPrompt?: (prompt: string) => void;
  onSelectTopic?: (topic: string) => void;
  onOpenPaywall?: () => void;
  initialGroup?: string | null;
  onGroupConsumed?: () => void;
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
  onSelectPrompt,
  onSelectTopic,
  onOpenPaywall,
  initialGroup,
  onGroupConsumed,
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

  // Handle initialGroup from domain redirect
  useEffect(() => {
    if (initialGroup && isOpen) {
      setActiveGroup(initialGroup);
      setView('personas');
      onGroupConsumed?.();
    }
  }, [initialGroup, isOpen]);

  // Load recent personas
  useEffect(() => {
    if (user) {
      fetch(`/api/v1/personas/recent?variant=${variant}`, { credentials: 'include' })
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
  }, [user, isOpen, variant]);

  // Derive groups from personas
  const groups = useMemo(() => {
    const groupMap = new Map<string, { name: string; count: number; color: string }>();
    for (const p of personaList) {
      const gName = (p as any).group_name || p.badge || 'General';
      const brandCol = getBrandPersonaColor(p.id || gName);
      if (!groupMap.has(gName)) {
        groupMap.set(gName, { name: gName, count: 0, color: brandCol.bg });
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
    const cleanSubject = (value?: string) => {
      if (!value) return '';
      const subject = value
        .replace(/\([^)]*\)/g, ' ')
        .split(/\s+(?:&|\/|\||and)\s+/i)[0]
        .replace(/\b(bilingual|english|hinglish|urdu|roman)\b/gi, ' ')
        .replace(/[^\p{L}\p{N}\s'-]/gu, ' ')
        .trim()
        .replace(/\s+/g, ' ')
        .split(' ')
        .slice(0, 3)
        .join(' ');
      return /^(general|conversation|chat|help|study|basics|concepts?|questions?|advice)$/i.test(subject) ? '' : subject;
    };
    const subject = [activePersona.specialties?.[0], activePersona.domains?.[0], activePersona.group_name]
      .map(cleanSubject)
      .find(Boolean);

    return subject
      ? [
          `Explain ${subject} in simple words`,
          `What are common exam mistakes in ${subject}?`,
          `Give me 5 practice MCQs on ${subject}`,
        ]
      : [
          'Explain this topic in simple words',
          'What are common exam mistakes?',
          'Give me 5 practice MCQs',
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

    if (user) {
      fetch(`/api/v1/personas/${slug}/used`, { method: 'POST', credentials: 'include' }).catch(() => {});
    } else {
      saveGuestRecent(slug);
    }
    setRecentSlugs(prev => [slug, ...prev.filter(s => s !== slug)].slice(0, 3));

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
      {isOpen && (
        <div
          onClick={onToggle}
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs lg:hidden animate-in fade-in"
        />
      )}

      <aside
        className={`fixed lg:static top-0 bottom-0 right-0 z-40 flex flex-col w-[300px] sm:w-[320px] bg-[#FFFFFF] dark:bg-[#12231C] border-l border-[#D5E0D8] dark:border-[#27403A] transition-all duration-300 ease-in-out shrink-0 overflow-hidden ${
          isOpen ? 'translate-x-0' : 'translate-x-full lg:w-0 lg:border-l-0'
        }`}
      >
        {/* Header */}
        <div className="h-16 px-4 border-b border-[#D5E0D8] dark:border-[#27403A] flex items-center justify-between shrink-0 bg-[#FFFFFF] dark:bg-[#12231C]">
          <div className="flex items-center gap-2.5 select-none">
            {view === 'personas' && !isSearching ? (
              <button
                onClick={handleBackToGroups}
                className="min-h-[44px] min-w-[44px] p-2 rounded-[14px] text-[#4F6359] hover:text-[#10231C] dark:text-[#9DB5A8] dark:hover:text-[#E8F2EC] hover:bg-[#DDEFE6] dark:hover:bg-[#17352A] transition-colors cursor-pointer flex items-center justify-center border border-transparent hover:border-[#D5E0D8] dark:hover:border-[#27403A]"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            ) : (
              <div className="w-8 h-8 rounded-[10px] bg-[#0A5C45] dark:bg-[#0F8056] text-white flex items-center justify-center font-bold text-xs">
                <UserCheck className="w-4 h-4" />
              </div>
            )}
            <div>
              <h2 className="font-heading font-bold text-base tracking-tight text-[#10231C] dark:text-[#E8F2EC]">
                {view === 'personas' && !isSearching && activeGroup ? activeGroup : 'Expert Personas'}
              </h2>
              {view === 'personas' && !isSearching && activeGroup && (
                <p className="text-xs text-[#4F6359] dark:text-[#9DB5A8]">{groupPersonas.length} specialist{groupPersonas.length !== 1 ? 's' : ''}</p>
              )}
            </div>
          </div>
          <button
            onClick={onToggle}
            className="min-h-[44px] min-w-[44px] p-2 rounded-[14px] text-[#4F6359] hover:text-[#10231C] dark:text-[#9DB5A8] dark:hover:text-[#E8F2EC] hover:bg-[#DDEFE6] dark:hover:bg-[#17352A] transition-colors cursor-pointer flex items-center justify-center border border-transparent hover:border-[#D5E0D8] dark:hover:border-[#27403A]"
            title="Collapse Persona Panel"
          >
            <PanelRightClose className="w-4 h-4" />
          </button>
        </div>

        {/* Region Toggle + Search */}
        <div className="p-3 border-b border-[#D5E0D8] dark:border-[#27403A] bg-[#FFFFFF] dark:bg-[#12231C] shrink-0 space-y-2.5">
          <div className="flex items-center p-1 rounded-[14px] bg-[#F3F6F1] dark:bg-[#0B1612] border border-[#D5E0D8] dark:border-[#27403A] text-xs">
            <button
              onClick={() => onToggleVariant('pk')}
              className={`flex-1 min-h-[44px] py-1.5 px-2 rounded-[12px] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                variant === 'pk'
                  ? 'bg-[#0A5C45] dark:bg-[#0F8056] text-white'
                  : 'text-[#4F6359] dark:text-[#9DB5A8] hover:text-[#10231C] dark:hover:text-[#E8F2EC]'
              }`}
            >
              <span>🇵🇰</span><span>Pakistani</span>
            </button>
            <button
              onClick={() => onToggleVariant('global')}
              className={`flex-1 min-h-[44px] py-1.5 px-2 rounded-[12px] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                variant === 'global'
                  ? 'bg-[#0A5C45] dark:bg-[#0F8056] text-white'
                  : 'text-[#4F6359] dark:text-[#9DB5A8] hover:text-[#10231C] dark:hover:text-[#E8F2EC]'
              }`}
            >
              <Globe className="w-3.5 h-3.5" /><span>Global</span>
            </button>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-[#4F6359] dark:text-[#9DB5A8] absolute left-3 top-3.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search specialists & domains..."
              className="w-full min-h-[44px] pl-9 pr-3 py-2 rounded-[14px] border border-[#D5E0D8] dark:border-[#27403A] bg-[#F3F6F1] dark:bg-[#0B1612] text-sm text-[#10231C] dark:text-[#E8F2EC] placeholder:text-[#4F6359] dark:placeholder:text-[#9DB5A8] focus:outline-none focus:border-[#0A5C45] dark:focus:border-[#0F8056]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 min-h-[32px] min-w-[32px] text-[#4F6359] hover:text-[#10231C] dark:text-[#9DB5A8] dark:hover:text-[#E8F2EC] text-xs cursor-pointer flex items-center justify-center"
              >✕</button>
            )}
          </div>
        </div>

        {/* Scrollable Content */}
        <div ref={listRef} className="flex-1 overflow-y-auto p-3 space-y-3">

          {/* SEARCH MODE — flat list across all groups */}
          {isSearching && (
            <>
              <div className="text-xs font-bold uppercase tracking-wider text-[#4F6359] dark:text-[#9DB5A8] px-1 flex items-center justify-between">
                <span>Results ({searchResults.length})</span>
                <span className="font-normal">across all groups</span>
              </div>
              {searchResults.length === 0 && (
                <div className="text-center py-8 text-[#4F6359] dark:text-[#9DB5A8] text-xs">No specialists found</div>
              )}
              {searchResults.map(persona => (
                <PersonaCard
                  key={persona.id}
                  persona={persona}
                  isSelected={persona.id === selectedPersonaId}
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
              {activePersona && (() => {
                const brandCol = getBrandPersonaColor(activePersona.id);
                return (
                  <div className="p-3.5 rounded-[20px] bg-[#FFFFFF] dark:bg-[#12231C] border border-[#D5E0D8] dark:border-[#27403A] space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-7 h-7 rounded-[10px] flex items-center justify-center text-xs font-bold"
                          style={{ backgroundColor: brandCol.bg, color: brandCol.text }}
                        >
                          {activePersona.initials}
                        </div>
                        <span className="text-xs font-bold text-[#0A5C45] dark:text-[#5BE0A5]">
                          {activePersona.name} — Active
                        </span>
                      </div>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-[12px] border bg-[#DDEFE6] dark:bg-[#17352A] text-[#0A5C45] dark:text-[#5BE0A5] border-[#0A5C45]/30 dark:border-[#5BE0A5]/30">
                        {(activePersona as any).group_name || activePersona.badge}
                      </span>
                    </div>
                    {onSelectPrompt && dynamicSuggestedPrompts.length > 0 && (
                      <div className="space-y-1.5 pt-2 border-t border-[#D5E0D8] dark:border-[#27403A]">
                        <span className="text-xs font-bold uppercase tracking-wider text-[#4F6359] dark:text-[#9DB5A8] flex items-center gap-1">
                          <MessageSquare className="w-3.5 h-3.5 text-[#0A5C45] dark:text-[#5BE0A5]" />
                          <span>Suggested Inquiries</span>
                        </span>
                        <div className="space-y-1.5">
                          {dynamicSuggestedPrompts.map((promptText, pIdx) => (
                            <button
                              key={pIdx}
                              onClick={() => onSelectPrompt(promptText)}
                              className="w-full min-h-[44px] text-left p-2 rounded-[12px] bg-[#F3F6F1] dark:bg-[#0B1612] hover:bg-[#DDEFE6] dark:hover:bg-[#17352A] border border-[#D5E0D8] dark:border-[#27403A] text-xs text-[#10231C] dark:text-[#E8F2EC] font-medium transition-all group/p flex items-start gap-1.5 cursor-pointer"
                            >
                              <ArrowRight className="w-3.5 h-3.5 text-[#0A5C45] dark:text-[#5BE0A5] group-hover/p:translate-x-0.5 transition-all shrink-0 mt-0.5" />
                              <span className="line-clamp-2">{promptText}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Recent Personas Row */}
              {recentPersonas.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-xs font-bold uppercase tracking-wider text-[#4F6359] dark:text-[#9DB5A8] px-1 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /><span>Recently Used</span>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {recentPersonas.map(p => {
                      const brandCol = getBrandPersonaColor(p.id);
                      return (
                        <button
                          key={p.id}
                          onClick={() => handleSelectPersona(p)}
                          className="min-h-[44px] flex items-center gap-2 px-3 py-2 rounded-[14px] border border-[#D5E0D8] dark:border-[#27403A] bg-[#FFFFFF] dark:bg-[#12231C] hover:bg-[#DDEFE6] dark:hover:bg-[#17352A] hover:border-[#0A5C45] transition-all text-xs font-medium text-[#10231C] dark:text-[#E8F2EC] cursor-pointer group"
                        >
                          <div
                            className="w-6 h-6 rounded-[8px] flex items-center justify-center text-xs font-bold shrink-0"
                            style={{ backgroundColor: brandCol.bg, color: brandCol.text }}
                          >
                            {p.initials}
                          </div>
                          <span className="truncate max-w-[85px]">{p.name}</span>
                          {isAnimating && selectedSlug === ((p as any).slug || p.id) && (
                            <span className="w-3 h-3 rounded-full border-2 border-[#0A5C45] border-t-transparent animate-spin" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Groups Grid (Larger rounded cards with coloured initials badge, group name, and "N specialist(s)") */}
              <div className="space-y-2">
                <div className="text-xs font-bold uppercase tracking-wider text-[#4F6359] dark:text-[#9DB5A8] px-1 flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5" /><span>Subject Groups</span>
                </div>
                <div className="space-y-3">
                  {groups.map(group => {
                    const brandCol = getBrandPersonaColor(group.name);
                    return (
                      <button
                        key={group.name}
                        onClick={() => handleGroupClick(group.name)}
                        className="min-h-[56px] w-full flex items-center justify-between p-4 rounded-[20px] border border-[#D5E0D8] dark:border-[#27403A] bg-[#FFFFFF] dark:bg-[#12231C] hover:bg-[#DDEFE6] dark:hover:bg-[#17352A] transition-all cursor-pointer group shadow-xs"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-[12px] flex items-center justify-center text-xs font-bold shrink-0"
                            style={{ backgroundColor: brandCol.bg, color: brandCol.text }}
                          >
                            {group.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="text-left">
                            <div className="text-sm font-bold text-[#10231C] dark:text-[#E8F2EC]">{group.name}</div>
                            <div className="text-xs text-[#4F6359] dark:text-[#9DB5A8]">{group.count} specialist{group.count !== 1 ? 's' : ''}</div>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-[#4F6359] dark:text-[#9DB5A8] group-hover:text-[#0A5C45] dark:group-hover:text-[#5BE0A5] group-hover:translate-x-0.5 transition-all" />
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {/* PERSONAS VIEW — within a group */}
          {!isSearching && view === 'personas' && (
            <>
              <div className="text-xs font-bold uppercase tracking-wider text-[#4F6359] dark:text-[#9DB5A8] px-1 flex items-center justify-between">
                <span>Specialists</span>
                <span className="font-normal">Click to switch</span>
              </div>
              {groupPersonas.length === 0 && (
                <div className="text-center py-8 text-[#4F6359] dark:text-[#9DB5A8] text-xs">No specialists in this group</div>
              )}
              {groupPersonas.map(persona => (
                <PersonaCard
                  key={persona.id}
                  persona={persona}
                  isSelected={persona.id === selectedPersonaId}
                  isAnimating={isAnimating && selectedSlug === ((persona as any).slug || persona.id)}
                  isLastUsed={recentSlugs[0] === ((persona as any).slug || persona.id)}
                  onClick={() => handleSelectPersona(persona)}
                />
              ))}
            </>
          )}

          {/* WhatsApp Card */}
          <div className="mt-4 p-3.5 rounded-[20px] bg-[#FFF3CC] dark:bg-[#3A2F0B] border border-[#F4B400]/40 dark:border-[#27403A] text-[#10231C] dark:text-[#E8F2EC] space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-[12px] ${isPaid ? 'bg-[#0A5C45] dark:bg-[#0F8056]' : 'bg-[#F4B400] text-[#10231C]'} text-white flex items-center justify-center font-bold`}>
                  {isPaid ? <MessageCircle className="w-4 h-4" /> : <Crown className="w-4 h-4" />}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#10231C] dark:text-[#E8F2EC]">
                    {variant === 'pk' ? '🇵🇰 Student WhatsApp Help' : 'WhatsApp Study Desk'}
                  </h4>
                  <span className={`text-xs ${isPaid ? 'text-[#0A5C45] dark:text-[#5BE0A5]' : 'text-[#F4B400]'} font-semibold`}>
                    {isPaid ? 'Direct Academic Counselor' : 'Pro Member Feature'}
                  </span>
                </div>
              </div>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-[10px] ${
                isPaid
                  ? 'bg-[#DDEFE6] dark:bg-[#17352A] text-[#0A5C45] dark:text-[#5BE0A5] border border-[#0A5C45]/20'
                  : 'bg-[#F4B400] text-[#10231C] border border-[#d49b00]'
              }`}>
                {isPaid ? 'PRO ACTIVE' : 'PRO ONLY'}
              </span>
              {isPaid && <ProExpiryBadge />}
            </div>
            <p className="text-xs text-[#10231C] dark:text-[#E8F2EC] leading-relaxed">
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
              className={`w-full min-h-[44px] py-2.5 px-3 rounded-[14px] ${
                isPaid
                  ? 'bg-[#0A5C45] dark:bg-[#0F8056] text-white hover:brightness-110 border border-[#0A5C45] dark:border-[#0F8056]'
                  : 'bg-[#F4B400] text-[#10231C] hover:bg-[#e0a500] border border-[#d49b00]'
              } text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer`}
            >
              {isPaid ? (
                <><MessageCircle className="w-4 h-4" /><span>Chat on WhatsApp Desk</span><ExternalLink className="w-3.5 h-3.5 opacity-70" /></>
              ) : (
                <><Lock className="w-4 h-4" /><span>Unlock Pro WhatsApp Desk</span><Crown className="w-3.5 h-3.5 opacity-70" /></>
              )}
            </button>
            <div className="flex items-center justify-between text-xs text-[#4F6359] dark:text-[#9DB5A8] pt-1 border-t border-[#F4B400]/20">
              <span className="flex items-center gap-1"><HelpCircle className="w-3.5 h-3.5" /> Mon-Sat (9 AM - 9 PM PKT)</span>
              <span className={`font-mono text-xs ${isPaid ? 'text-[#0A5C45] dark:text-[#5BE0A5] font-semibold' : 'text-[#F4B400] font-semibold'}`}>
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
  isAnimating: boolean;
  isLastUsed: boolean;
  onClick: () => void;
}

const PersonaCard: React.FC<PersonaCardProps> = ({
  persona, isSelected, isAnimating, isLastUsed, onClick
}) => {
  const brandCol = getBrandPersonaColor(persona.id);
  return (
    <div
      onClick={onClick}
      className={`relative rounded-[20px] border p-3.5 cursor-pointer transition-all duration-200 select-none min-h-[44px] ${
        isAnimating
          ? 'scale-95 opacity-60 border-[#0A5C45] bg-[#DDEFE6] dark:bg-[#17352A]'
          : isSelected
          ? 'bg-[#DDEFE6] dark:bg-[#17352A] border-[#0A5C45] dark:border-[#5BE0A5]'
          : 'bg-[#FFFFFF] dark:bg-[#12231C] border-[#D5E0D8] dark:border-[#27403A] hover:border-[#0A5C45]/50 hover:bg-[#F3F6F1] dark:hover:bg-[#17352A]/40'
      }`}
    >
      {/* Ribbons */}
      <div className="flex items-center gap-1.5 mb-1.5">
        {isLastUsed && !isSelected && (
          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[8px] bg-[#DDEFE6] dark:bg-[#17352A] border border-[#0A5C45]/30 dark:border-[#5BE0A5]/30 text-xs font-bold text-[#0A5C45] dark:text-[#5BE0A5]">
            <Clock className="w-3 h-3" /><span>LAST USED</span>
          </div>
        )}
      </div>

      {/* Avatar + Name */}
      <div className="flex items-start gap-2.5">
        <div
          className={`w-10 h-10 rounded-[12px] flex items-center justify-center text-xs font-bold shrink-0 transition-transform duration-200 ${isAnimating ? 'scale-110' : ''}`}
          style={{ backgroundColor: brandCol.bg, color: brandCol.text }}
        >
          {isAnimating
            ? <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
            : persona.initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1">
            <h3 className="text-xs font-bold text-[#0A5C45] dark:text-[#5BE0A5] truncate">{persona.name}</h3>
            {isSelected && (
              <span className="flex items-center gap-0.5 text-xs font-bold text-[#0A5C45] dark:text-[#5BE0A5]">
                <CheckCircle2 className="w-3.5 h-3.5" /> Active
              </span>
            )}
          </div>
          <p className="text-xs font-medium text-[#4F6359] dark:text-[#9DB5A8] truncate">{persona.role}</p>
          <p className="text-xs text-[#4F6359]/80 dark:text-[#9DB5A8]/80 truncate">{persona.affiliation}</p>
        </div>
      </div>

      {/* Badge (Tint green background with primary text) */}
      <div className="mt-2.5 flex items-center justify-between">
        <span className="text-xs font-bold px-2 py-0.5 rounded-[10px] border bg-[#DDEFE6] dark:bg-[#17352A] text-[#0A5C45] dark:text-[#5BE0A5] border-[#0A5C45]/30 dark:border-[#5BE0A5]/30">
          {persona.badge}
        </span>
      </div>

      {/* Specialties */}
      <div className="mt-2 flex flex-wrap gap-1">
        {persona.specialties.slice(0, 3).map((spec, i) => (
          <span key={i} className="text-xs px-2 py-0.5 rounded-[8px] bg-[#F3F6F1] dark:bg-[#0B1612] text-[#4F6359] dark:text-[#9DB5A8] border border-[#D5E0D8] dark:border-[#27403A]">
            {spec}
          </span>
        ))}
      </div>
    </div>
  );
};
