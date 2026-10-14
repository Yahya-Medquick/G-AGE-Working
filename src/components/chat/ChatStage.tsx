import React, { useState, useRef, useEffect } from 'react';
import {
  PanelLeft,
  PanelRight,
  Send,
  Paperclip,
  Camera,
  Lock,
  LockOpen,
  Sparkles,
  CheckCircle2,
  Copy,
  Check,
  FileText,
  RotateCcw,
  Lightbulb,
  GraduationCap,
  BookOpen,
  ChevronDown,
  ExternalLink,
  Code2,
  Newspaper,
  Play,
  CheckCheck,
  Edit2,
  X,
  Eye,
  EyeOff,
  Zap,
  Crown,
} from 'lucide-react';
import { ChatMessage, ChatSession, ChatMode } from '../../types/chat';
import { ExpertPersona } from '../../data/experts';
import { SpecificationsAccordion } from './SpecificationsAccordion';
import { MarkdownRenderer } from '../MarkdownRenderer';
import { MCQCard } from '../cards/MCQCard';
import { MultiLevelDefinitionCard } from '../MultiLevelDefinitionCard';
import { ProExpiryBadge } from '../ProExpiryBadge';
import { getBrandPersonaColor } from './ChatSidebar';

interface ChatStageProps {
  isLeftPanelOpen?: boolean;
  onToggleLeftPanel?: () => void;
  isRightPanelOpen: boolean;
  onToggleRightPanel: () => void;
  session: ChatSession | null;
  activePersona: ExpertPersona;
  variant?: 'global' | 'pk';
  globalPersonas: Record<string, ExpertPersona>;
  pkPersonas: Record<string, ExpertPersona>;
  onSendMessage: (content: string, modeOverride?: ChatMode, images?: string[], savePublic?: boolean) => Promise<void>;
  isLoading: boolean;
  language: 'english' | 'roman-urdu' | 'urdu';
  onLanguageChange?: (lang: 'english' | 'roman-urdu' | 'urdu') => void;
  onSaveToNotes: (content: string, title?: string) => void;
  onOpenPaywall?: () => void;
  queryUsage: {
    count: number;
    limit: number;
    remaining: number;
    tier: string;
    isLoggedIn: boolean;
  };
  onOpenPersonaGroup?: (groupName: string) => void;
  onEditMessage?: (messageId: string, newContent: string, newImages: string[]) => void;
  onRegenerateMessage?: (messageId: string, userMessageIndex: number) => void;
  pendingReplyMessageIds?: Set<string>;
  isStreamingReply?: boolean;
  onUpdateSessionMeta?: (sessionId: string, updates: Partial<Pick<ChatSession, 'title' | 'mode' | 'personaId' | 'variant' | 'specs'>>) => void;
  onOpenKnowledgeGraph?: () => void;
}

const ExplorePapersSection = ({ topic, recency, minCitations }: any) => (
  <div className="p-3 bg-white dark:bg-[#12231C] rounded-xl border border-[#D5E0D8] dark:border-[#27403A] text-xs space-y-2">
    <div className="font-bold text-[#0A5C45] dark:text-[#5BE0A5]">Research Papers for {topic}</div>
    <p className="text-[#4F6359] dark:text-[#9DB5A8]">Recency: {recency}, Min Citations: {minCitations}</p>
    <a href={`https://scholar.google.com/scholar?q=${encodeURIComponent(topic)}`} target="_blank" rel="noreferrer" className="text-[#0A5C45] dark:text-[#5BE0A5] underline font-semibold flex items-center gap-1">
      <span>Search Google Scholar</span> <ExternalLink className="w-3 h-3" />
    </a>
  </div>
);

const ExploreReposSection = ({ topic }: any) => (
  <div className="p-3 bg-white dark:bg-[#12231C] rounded-xl border border-[#D5E0D8] dark:border-[#27403A] text-xs space-y-2">
    <div className="font-bold text-[#0A5C45] dark:text-[#5BE0A5]">Open Source Repositories for {topic}</div>
    <a href={`https://github.com/search?q=${encodeURIComponent(topic)}`} target="_blank" rel="noreferrer" className="text-[#0A5C45] dark:text-[#5BE0A5] underline font-semibold flex items-center gap-1">
      <span>Search GitHub Repos</span> <ExternalLink className="w-3 h-3" />
    </a>
  </div>
);

const ExploreResearchNewsSection = ({ topic, recency }: any) => (
  <div className="p-3 bg-white dark:bg-[#12231C] rounded-xl border border-[#D5E0D8] dark:border-[#27403A] text-xs space-y-2">
    <div className="font-bold text-[#0A5C45] dark:text-[#5BE0A5]">Recent Research on {topic} ({recency})</div>
    <a href={`https://news.google.com/search?q=${encodeURIComponent(topic)}`} target="_blank" rel="noreferrer" className="text-[#0A5C45] dark:text-[#5BE0A5] underline font-semibold flex items-center gap-1">
      <span>Search News</span> <ExternalLink className="w-3 h-3" />
    </a>
  </div>
);

const ExploreVideosSection = ({ topic, query }: any) => (
  <div className="p-3 bg-white dark:bg-[#12231C] rounded-xl border border-[#D5E0D8] dark:border-[#27403A] text-xs space-y-2">
    <div className="font-bold text-[#0A5C45] dark:text-[#5BE0A5]">Video Lectures for {query || topic}</div>
    <a href={`https://www.youtube.com/results?search_query=${encodeURIComponent(query || topic)}`} target="_blank" rel="noreferrer" className="text-[#0A5C45] dark:text-[#5BE0A5] underline font-semibold flex items-center gap-1">
      <span>Watch on YouTube</span> <ExternalLink className="w-3 h-3" />
    </a>
  </div>
);

const ExploreNewsSection = ({ topic, query }: any) => (
  <div className="p-3 bg-white dark:bg-[#12231C] rounded-xl border border-[#D5E0D8] dark:border-[#27403A] text-xs space-y-2">
    <div className="font-bold text-[#0A5C45] dark:text-[#5BE0A5]">Articles &amp; News for {query || topic}</div>
    <a href={`https://news.google.com/search?q=${encodeURIComponent(query || topic)}`} target="_blank" rel="noreferrer" className="text-[#0A5C45] dark:text-[#5BE0A5] underline font-semibold flex items-center gap-1">
      <span>Read Articles</span> <ExternalLink className="w-3 h-3" />
    </a>
  </div>
);

export const ChatStage: React.FC<ChatStageProps> = ({
  isLeftPanelOpen,
  onToggleLeftPanel,
  isRightPanelOpen,
  onToggleRightPanel,
  session,
  activePersona,
  variant = 'global',
  globalPersonas,
  pkPersonas,
  onSendMessage,
  isLoading,
  language,
  onLanguageChange,
  onSaveToNotes,
  onOpenPaywall,
  queryUsage,
  onOpenPersonaGroup,
  onEditMessage,
  onRegenerateMessage,
  pendingReplyMessageIds = new Set(),
  isStreamingReply = false,
}) => {
  const [inputText, setInputText] = useState('');
  const [attachedImages, setAttachedImages] = useState<string[]>([]);
  const [isPrivate, setIsPrivate] = useState(false);
  const [imageNotice, setImageNotice] = useState<string | null>(null);
  const [cropSource, setCropSource] = useState<string | null>(null);

  const [showModeSwitcher, setShowModeSwitcher] = useState(false);
  const [showLangSwitcher, setShowLangSwitcher] = useState(false);
  const [isSpecsOpen, setIsSpecsOpen] = useState(false);

  const [showMCQCard, setShowMCQCard] = useState(false);
  const [showDefinitionCard, setShowDefinitionCard] = useState(false);

  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);
  const [savedNotesMsgId, setSavedNotesMsgId] = useState<string | null>(null);

  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [editImages, setEditImages] = useState<string[]>([]);

  const [activeLevelTabs, setActiveLevelTabs] = useState<Record<string, 'eli5' | 'highSchool' | 'undergrad' | 'phd'>>({});
  const [revealedSolutions, setRevealedSolutions] = useState<Record<string, boolean>>({});

  const [expandedExploreMsgIds, setExpandedExploreMsgIds] = useState<Record<string, boolean>>({});
  const [activeExploreMsgId, setActiveExploreMsgId] = useState<string | null>(null);
  const [activeExploreTab, setActiveExploreTab] = useState<string | null>(null);
  const [extractedTopics, setExtractedTopics] = useState<Record<string, { displayTopic: string; videoQuery: string; newsQuery: string; mcqTopic: string; loading?: boolean }>>({});

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const latestTurnRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const isPaid = queryUsage.tier === 'paid' || queryUsage.tier === 'pro' || queryUsage.tier === 'unlimited';
  const activeMode = session?.mode || 'concept';

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [session?.messages.length, isLoading]);

  const handleSpecsChange = (newSpecs: any) => {
    if (session) {
      session.specs = newSpecs;
    }
  };

  const handleModeChange = (mode: ChatMode) => {
    // Mode changes handled via session/chat updates
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if ((!inputText.trim() && attachedImages.length === 0) || isLoading) return;
    onSendMessage(inputText.trim(), activeMode, attachedImages, !isPrivate);
    setInputText('');
    setAttachedImages([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleImageButtonClick = (type: 'files' | 'camera') => {
    if (!isPaid) {
      if (onOpenPaywall) onOpenPaywall();
      return;
    }
    if (type === 'files') fileInputRef.current?.click();
    else cameraInputRef.current?.click();
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setCropSource(result);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const finishImageCrop = (croppedBase64?: string) => {
    const imageToUse = croppedBase64 || cropSource;
    if (imageToUse) {
      setAttachedImages(prev => [...prev, imageToUse].slice(0, 4));
    }
    setCropSource(null);
  };

  const cancelCurrentImage = () => {
    setCropSource(null);
  };

  const handleCopyMessage = (msgId: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedMsgId(msgId);
    setTimeout(() => setCopiedMsgId(null), 2000);
  };

  const handleSaveNote = (msgId: string, content: string) => {
    onSaveToNotes(content, session?.title || 'Study Note');
    setSavedNotesMsgId(msgId);
    setTimeout(() => setSavedNotesMsgId(null), 2000);
  };

  const startEditMessage = (msg: ChatMessage, images: string[]) => {
    setEditingMessageId(msg.id);
    setEditText(msg.content);
    setEditImages(images);
  };

  const cancelEditMessage = () => {
    setEditingMessageId(null);
    setEditText('');
    setEditImages([]);
  };

  const saveEditMessage = (msgId: string) => {
    if (!editText.trim() && editImages.length === 0) return;
    if (onEditMessage) {
      onEditMessage(msgId, editText.trim(), editImages);
    }
    cancelEditMessage();
  };

  const setLevelTab = (msgId: string, level: 'eli5' | 'highSchool' | 'undergrad' | 'phd') => {
    setActiveLevelTabs(prev => ({ ...prev, [msgId]: level }));
  };

  const toggleSolutionReveal = (msgId: string) => {
    setRevealedSolutions(prev => ({ ...prev, [msgId]: !prev[msgId] }));
  };

  const brandCol = getBrandPersonaColor(activePersona.id);
  const currentTopic = session?.title || activePersona.badge || 'Fundamentals';

  return (
    <div className="flex-1 flex flex-col h-full bg-[#F3F6F1] dark:bg-[#0B1612] overflow-hidden relative">
      {/* 1. CHAT HEADER */}
      <header className="sticky top-0 z-30 h-16 px-4 bg-[#FFFFFF]/95 dark:bg-[#12231C]/95 backdrop-blur-md border-b border-[#D5E0D8] dark:border-[#27403A] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          {!isLeftPanelOpen && onToggleLeftPanel && (
            <button
              onClick={onToggleLeftPanel}
              className="min-h-[44px] min-w-[44px] p-2 rounded-[14px] text-[#4F6359] dark:text-[#9DB5A8] hover:bg-[#DDEFE6] dark:hover:bg-[#17352A] transition-colors cursor-pointer flex items-center justify-center border border-transparent hover:border-[#D5E0D8] dark:hover:border-[#27403A]"
              title="Open Chat Sessions"
            >
              <PanelLeft className="w-5 h-5" />
            </button>
          )}

          {/* Group / Contact Profile */}
          <div
            id="tour-persona-toggle"
            onClick={onToggleRightPanel}
            className="flex items-center gap-2.5 min-w-0 cursor-pointer hover:opacity-90 transition-opacity"
            title="Click to view specialists and switch persona"
          >
            <div className="relative">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold shrink-0 border border-white/20"
                style={{ backgroundColor: brandCol.bg, color: brandCol.text }}
              >
                {activePersona.initials}
              </div>
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[#5BE0A5] border-2 border-white dark:border-[#12231C]" />
            </div>

            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-heading text-base font-bold text-[#0A5C45] dark:text-[#5BE0A5] truncate">
                  {activePersona.name}
                </span>
                <span className="hidden md:inline-block text-xs font-bold px-2 py-0.5 rounded-[12px] border bg-[#DDEFE6] dark:bg-[#17352A] text-[#0A5C45] dark:text-[#5BE0A5] border-[#0A5C45]/30 dark:border-[#5BE0A5]/30">
                  {activePersona.badge || 'Academic Mentor'}
                </span>
              </div>
              <div className="flex items-center gap-1 text-xs text-[#4F6359] dark:text-[#9DB5A8] truncate">
                <span className="text-[#0A5C45] dark:text-[#5BE0A5] font-semibold">online</span>
                <span>•</span>
                <span className="truncate">{isLoading ? 'typing...' : activePersona.role}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Center/Right Section: Mode Tabs & Quick Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Mode Switcher */}
          <div className="relative" data-mode-switcher>
            <button
              onClick={() => setShowModeSwitcher(!showModeSwitcher)}
              className="px-3.5 py-2 min-h-[44px] rounded-[14px] text-xs font-bold flex items-center gap-2 transition-all cursor-pointer bg-[#FFFFFF] dark:bg-[#12231C] border border-[#D5E0D8] dark:border-[#27403A] text-[#10231C] dark:text-[#E8F2EC] hover:bg-[#DDEFE6] dark:hover:bg-[#17352A]"
              title="Switch Mode"
            >
              {activeMode === 'concept' && <Lightbulb className="w-4 h-4 text-[#0A5C45] dark:text-[#5BE0A5]" />}
              {activeMode === 'exam' && <GraduationCap className="w-4 h-4 text-[#F4B400]" />}
              {activeMode === 'research' && <BookOpen className="w-4 h-4 text-[#0A5C45] dark:text-[#5BE0A5]" />}
              <span className="hidden sm:inline capitalize">{activeMode}</span>
              <ChevronDown className="w-3.5 h-3.5 opacity-60" />
            </button>

            {showModeSwitcher && (
              <div className="absolute top-full left-0 mt-1.5 z-50 bg-[#FFFFFF] dark:bg-[#12231C] border border-[#D5E0D8] dark:border-[#27403A] rounded-[20px] p-1.5 min-w-[170px]">
                {[
                  { mode: 'concept' as ChatMode, icon: <Lightbulb className="w-4 h-4 text-[#0A5C45] dark:text-[#5BE0A5]" />, label: 'Concept', desc: 'Deep understanding' },
                  { mode: 'exam' as ChatMode, icon: <GraduationCap className="w-4 h-4 text-[#F4B400]" />, label: 'Exam', desc: 'Practice & problems' },
                  { mode: 'research' as ChatMode, icon: <BookOpen className="w-4 h-4 text-[#0A5C45] dark:text-[#5BE0A5]" />, label: 'Research', desc: 'Papers & citations' },
                ].map(({ mode, icon, label, desc }) => (
                  <button
                    key={mode}
                    onClick={() => { handleModeChange(mode); setShowModeSwitcher(false); }}
                    className={`w-full px-3 py-2.5 rounded-[12px] flex items-center gap-2.5 text-left text-xs transition-colors cursor-pointer min-h-[44px]
                      ${activeMode === mode
                        ? 'bg-[#DDEFE6] dark:bg-[#17352A] text-[#0A5C45] dark:text-[#5BE0A5] font-bold'
                        : 'text-[#10231C] dark:text-[#E8F2EC] hover:bg-[#F3F6F1] dark:hover:bg-[#17352A]'
                      }`}
                  >
                    {icon}
                    <div>
                      <div className="font-bold">{label}</div>
                      <div className="text-xs opacity-70">{desc}</div>
                    </div>
                    {activeMode === mode && <CheckCircle2 className="w-3.5 h-3.5 ml-auto" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Language Switcher */}
          <div className="relative" data-lang-switcher>
            <button
              onClick={() => setShowLangSwitcher(!showLangSwitcher)}
              className="px-3.5 py-2 min-h-[44px] rounded-[14px] text-xs font-bold flex items-center gap-2 transition-all cursor-pointer bg-[#FFFFFF] dark:bg-[#12231C] border border-[#D5E0D8] dark:border-[#27403A] text-[#10231C] dark:text-[#E8F2EC] hover:bg-[#DDEFE6] dark:hover:bg-[#17352A]"
              title="Switch Response Language"
            >
              <span className="text-xs">
                {language === 'english' ? '🇬🇧 EN' : language === 'roman-urdu' ? '🇵🇰 UR' : '🇵🇰 اردو'}
              </span>
              <ChevronDown className="w-3.5 h-3.5 opacity-60" />
            </button>

            {showLangSwitcher && (
              <div className="absolute top-full right-0 mt-1.5 z-50 bg-[#FFFFFF] dark:bg-[#12231C] border border-[#D5E0D8] dark:border-[#27403A] rounded-[20px] p-1.5 min-w-[180px]">
                {[
                  { lang: 'english' as const, flag: '🇬🇧', label: 'English', desc: 'Full English responses' },
                  { lang: 'roman-urdu' as const, flag: '🇵🇰', label: 'Roman Urdu', desc: 'Urdu in English script' },
                  { lang: 'urdu' as const, flag: '🇵🇰', label: 'اردو', desc: 'Proper Urdu script' },
                ].map(({ lang, flag, label, desc }) => (
                  <button
                    key={lang}
                    onClick={() => {
                      onLanguageChange?.(lang);
                      setShowLangSwitcher(false);
                    }}
                    className={`w-full px-3 py-2.5 rounded-[12px] flex items-center gap-2.5 text-left text-xs transition-colors cursor-pointer min-h-[44px]
                      ${language === lang
                        ? 'bg-[#DDEFE6] dark:bg-[#17352A] text-[#0A5C45] dark:text-[#5BE0A5] font-bold'
                        : 'text-[#10231C] dark:text-[#E8F2EC] hover:bg-[#F3F6F1] dark:hover:bg-[#17352A]'
                      }`}
                  >
                    <span>{flag}</span>
                    <div>
                      <div className="font-bold">{label}</div>
                      <div className="text-xs opacity-70">{desc}</div>
                    </div>
                    {language === lang && <CheckCircle2 className="w-3.5 h-3.5 ml-auto" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Query Usage Pill / Upgrade CTA */}
          <button
            onClick={onOpenPaywall}
            className={`px-3 py-1.5 min-h-[44px] rounded-[14px] text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              queryUsage.tier === 'paid'
                ? 'bg-[#DDEFE6] dark:bg-[#17352A] text-[#0A5C45] dark:text-[#5BE0A5] border border-[#0A5C45]/30'
                : queryUsage.remaining <= 1
                ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                : 'bg-[#FFFFFF] dark:bg-[#12231C] text-[#10231C] dark:text-[#E8F2EC] border border-[#D5E0D8] dark:border-[#27403A] hover:bg-[#DDEFE6] dark:hover:bg-[#17352A]'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-[#F4B400]" />
            <span className="hidden sm:inline">
              {queryUsage.tier === 'paid' ? 'Pro' : `${queryUsage.remaining} Left`}
            </span>
          </button>
          {isPaid && <ProExpiryBadge />}

          {!isRightPanelOpen && (
            <button
              onClick={onToggleRightPanel}
              className="min-h-[44px] min-w-[44px] p-2.5 rounded-[14px] text-[#4F6359] dark:text-[#9DB5A8] hover:bg-[#DDEFE6] dark:hover:bg-[#17352A] transition-colors cursor-pointer flex items-center justify-center border border-transparent hover:border-[#D5E0D8] dark:hover:border-[#27403A]"
              title="Open Personas & Mentors"
            >
              <PanelRight className="w-5 h-5" />
            </button>
          )}
        </div>
      </header>

      {/* 2. SPECIFICATIONS ACCORDION DRAWER */}
      <SpecificationsAccordion
        mode={activeMode}
        specs={session?.specs || {}}
        onChangeSpecs={handleSpecsChange}
        isOpen={isSpecsOpen}
        onToggle={() => setIsSpecsOpen(!isSpecsOpen)}
      />

      {/* 3. MESSAGES STREAM */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-4 relative z-0">
        {showMCQCard && (
          <div className="max-w-3xl mx-auto w-full">
            <MCQCard
              topic={session?.title || 'Core Fundamentals'}
              onSaveToNotes={onSaveToNotes}
              onClose={() => setShowMCQCard(false)}
              onOpenPaywall={onOpenPaywall}
            />
          </div>
        )}

        {showDefinitionCard && (
          <div className="max-w-3xl mx-auto w-full relative">
            <button
              onClick={() => setShowDefinitionCard(false)}
              className="absolute top-3 right-3 z-10 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Close Definition Breakdown"
            >
              ✕
            </button>
            <MultiLevelDefinitionCard topic={session?.title || 'Core Fundamentals'} />
          </div>
        )}

        <div className="flex justify-center my-2">
          <div className="bg-white/90 dark:bg-[#182229]/95 text-slate-600 dark:text-slate-400 text-[11px] font-semibold px-3 py-1 rounded-lg shadow-[0_1px_0.5px_rgba(11,20,26,0.13)] uppercase tracking-wider">
            TODAY • {activePersona.name} Group
          </div>
        </div>

        {(!session || session.messages.length <= 1) && (
          <div className="max-w-xl mx-auto py-4 space-y-4 animate-in fade-in duration-300">
            <div className="bg-[#ffeecd] dark:bg-[#182229] border border-[#f5c369]/40 dark:border-[#2a3942] rounded-xl p-3 text-center text-xs text-[#54656f] dark:text-[#8696a0] space-y-1">
              <div className="font-bold text-[#111b21] dark:text-[#e9edef] flex items-center justify-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Bilingual Conversational & Academic Mentorship</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                Messages with <strong>{activePersona.name}</strong> support instant queries in English or Roman Urdu / Hinglish. Ask study concepts, exam questions, or everyday problems.
              </p>
            </div>
          </div>
        )}

        {session?.messages.map((msg, idx) => {
          const isAssistant = msg.role === 'assistant';
          const messageImages = msg.images?.length ? msg.images : msg.imageBase64 ? [msg.imageBase64] : [];
          const latestAssistantIndex = session.messages.reduce(
            (latestIndex, message, index) => message.role === 'assistant' ? index : latestIndex,
            -1
          );
          const isLatestTurnStart = idx === Math.max(0, (session?.messages.length || 0) - (isLoading ? 1 : 2));
          const personaVariant = msg.personaVariant || session?.variant || variant;
          const personaSet = personaVariant === 'pk' ? pkPersonas : globalPersonas;
          const savedPersona = personaSet[msg.personaId || ''];
          const msgBrandCol = getBrandPersonaColor(msg.personaId || activePersona.id);
          const msgPersona = isAssistant ? {
            name: msg.personaName || savedPersona?.name || activePersona.name,
            initials: msg.personaInitials || savedPersona?.initials || activePersona.initials,
            avatar_color: msgBrandCol.bg,
            group_name: savedPersona?.group_name || '',
          } : null;

          return (
            <div
              key={msg.id || idx}
              ref={isLatestTurnStart ? latestTurnRef : null}
              className={`flex flex-col ${isAssistant ? 'items-start' : 'items-end'} max-w-3xl mx-auto w-full`}
            >
              <div
                className={`relative px-4 py-3.5 text-base transition-all ${
                  isAssistant
                    ? 'w-full bg-[#FFFFFF] dark:bg-[#12231C] text-[#10231C] dark:text-[#E8F2EC] rounded-[20px] rounded-bl-none border border-[#D5E0D8] dark:border-[#27403A]'
                    : 'bg-[#0A5C45] dark:bg-[#0F8056] text-white font-normal max-w-[85%] sm:max-w-[75%] rounded-[20px] rounded-br-none border border-[#0A5C45] dark:border-[#0F8056]'
                }`}
              >
                {isAssistant && msgPersona && (
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#D5E0D8] dark:border-[#27403A]">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-[12px] font-bold"
                        style={{ backgroundColor: msgPersona.avatar_color, color: msgBrandCol.text }}
                      >
                        {msgPersona.initials}
                      </div>
                      <span className="font-bold text-sm text-[#0A5C45] dark:text-[#5BE0A5]">
                        ~ {msgPersona.name}
                      </span>
                      {msg.mode && (
                        <span className="text-xs px-2 py-0.5 rounded-[12px] bg-[#DDEFE6] dark:bg-[#17352A] text-[#0A5C45] dark:text-[#5BE0A5] font-semibold uppercase">
                          {msg.mode}
                        </span>
                      )}
                    </div>

                    <span className="text-xs text-[#4F6359] dark:text-[#9DB5A8] font-medium">
                      {msg.timestamp}
                    </span>
                  </div>
                )}

                {isAssistant ? (
                  <div className="space-y-3">
                    {(() => {
                      const cleanContent = msg.content.replace(/\[\[SUGGEST_GROUP:[^\]]*\]\]/g, '').trim();
                      const suggestedGroup = msg.metadata?.suggestedGroup;
                      const isActiveGroup = suggestedGroup?.trim().toLocaleLowerCase()
                        === msgPersona?.group_name.trim().toLocaleLowerCase();
                      return (
                        <>
                          <MarkdownRenderer content={cleanContent} isStreaming={idx === session?.messages.length - 1} />
                          {suggestedGroup && !isActiveGroup && onOpenPersonaGroup && (
                            <div className="mt-3 flex flex-wrap items-center gap-2 p-2.5 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/80 dark:bg-emerald-950/40">
                              <span className="text-sm" aria-hidden="true">🎯</span>
                              <button
                                key={suggestedGroup}
                                onClick={() => onOpenPersonaGroup(suggestedGroup)}
                                className="text-[11px] text-[#0A5C45] dark:text-[#5BE0A5] font-semibold underline underline-offset-2 hover:opacity-85 cursor-pointer transition-colors"
                              >
                                Try the {suggestedGroup} specialists -&gt;
                              </button>
                            </div>
                          )}
                        </>
                      );
                    })()}

                    {msg.metadata?.multiLevel && (
                      <div className="mt-3 pt-3 border-t border-slate-100 dark:border-[#2a3942] space-y-2">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Rigor Level Switcher
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {(['eli5', 'highSchool', 'undergrad', 'phd'] as const).map((lvl) => (
                            <button
                              key={lvl}
                              onClick={() => setLevelTab(msg.id, lvl)}
                              className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase transition-colors cursor-pointer ${
                                (activeLevelTabs[msg.id] || 'undergrad') === lvl
                                  ? 'bg-[#0A5C45] dark:bg-[#0F8056] text-white shadow-2xs'
                                  : 'bg-slate-100 dark:bg-[#111b21] text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                              }`}
                            >
                              {lvl === 'eli5' ? 'ELI5' : lvl === 'highSchool' ? 'High School' : lvl === 'undergrad' ? 'Undergraduate' : 'PhD / Rigorous'}
                            </button>
                          ))}
                        </div>
                        {msg.metadata.multiLevel[activeLevelTabs[msg.id] || 'undergrad'] && (
                          <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#111b21]/70 border border-slate-200/80 dark:border-[#2a3942] text-xs">
                            <MarkdownRenderer content={msg.metadata.multiLevel[activeLevelTabs[msg.id] || 'undergrad']!} />
                          </div>
                        )}
                      </div>
                    )}

                    {msg.metadata?.examQuestion && (
                      <div className="mt-3 p-3.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 font-bold text-xs text-amber-800 dark:text-amber-300">
                            <GraduationCap className="w-4 h-4" />
                            <span>Exam Question Specification</span>
                          </div>
                          {msg.metadata.examQuestion.marks && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-200/60 dark:bg-amber-900/80 text-amber-900 dark:text-amber-200">
                              {msg.metadata.examQuestion.marks} Marks
                            </span>
                          )}
                        </div>

                        {msg.metadata.examQuestion.question && (
                          <div className="font-semibold text-xs text-slate-900 dark:text-white">
                            {msg.metadata.examQuestion.question}
                          </div>
                        )}

                        <div className="pt-1">
                          <button
                            onClick={() => toggleSolutionReveal(msg.id)}
                            className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            {revealedSolutions[msg.id] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            <span>{revealedSolutions[msg.id] ? 'Hide Full Derivation' : 'Reveal Step-by-Step Solution & Rubric'}</span>
                          </button>

                          {revealedSolutions[msg.id] && msg.metadata.examQuestion.solution && (
                            <div className="mt-2.5 p-3 rounded-lg bg-white dark:bg-[#111b21] border border-amber-300/60 dark:border-amber-800 text-xs animate-in fade-in">
                              <div className="text-[10px] font-bold text-[#0A5C45] dark:text-[#5BE0A5] mb-1 uppercase">
                                Model Answer & Derivation
                              </div>
                              <MarkdownRenderer content={msg.metadata.examQuestion.solution} />
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    {editingMessageId === msg.id ? (
                      <div className="min-w-[min(80vw,28rem)] space-y-2">
                        <textarea
                          value={editText}
                          onChange={(event) => setEditText(event.target.value)}
                          disabled={isLoading}
                          rows={3}
                          className="w-full resize-y rounded-md border border-[#0A5C45]/40 bg-white p-2 text-sm text-slate-900 outline-none dark:bg-slate-900 dark:text-slate-100"
                          aria-label="Edit your message"
                        />
                        {editImages.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {editImages.map((image, imageIndex) => (
                              <div key={imageIndex} className="relative h-14 w-14">
                                <img src={image.startsWith('data:') ? image : `data:image/jpeg;base64,${image}`} alt={`Edit attachment ${imageIndex + 1}`} className="h-full w-full rounded-md object-cover" />
                                <button type="button" onClick={() => setEditImages((current) => current.filter((_, index) => index !== imageIndex))} disabled={isLoading} className="absolute -right-1 -top-1 rounded-full bg-slate-800 p-0.5 text-white disabled:opacity-40" aria-label={`Remove image ${imageIndex + 1}`}>
                                  <X className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                        <div className="flex flex-wrap items-center justify-end gap-2">
                          <span className="mr-auto text-[10px] text-slate-500">{editImages.length}/4 images</span>
                          <button type="button" onClick={() => handleImageButtonClick('files')} disabled={!isPaid || isLoading || editImages.length >= 4} className="rounded-md border border-slate-300 px-2 py-1 text-xs disabled:opacity-40 dark:border-slate-600" title="Add images">
                            <Paperclip className="inline h-3.5 w-3.5" /> Add images
                          </button>
                          <button type="button" onClick={() => handleImageButtonClick('camera')} disabled={!isPaid || isLoading || editImages.length >= 4} className="rounded-md border border-slate-300 px-2 py-1 text-xs disabled:opacity-40 dark:border-slate-600" title="Take a photo">
                            <Camera className="inline h-3.5 w-3.5" /> Photo
                          </button>
                          <button type="button" onClick={cancelEditMessage} disabled={isLoading} className="rounded-md px-2 py-1 text-xs text-slate-600 disabled:opacity-40 dark:text-slate-300">Cancel</button>
                          <button type="button" onClick={() => void saveEditMessage(msg.id)} disabled={isLoading || (!editText.trim() && editImages.length === 0)} className="rounded-md bg-[#0A5C45] px-3 py-1 text-xs font-semibold text-white disabled:opacity-40">Save</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {messageImages.length > 0 && (
                          <div className="mb-2.5 flex flex-wrap gap-2">
                            {messageImages.map((image, imageIndex) => (
                              <div key={imageIndex} className="h-20 w-20 overflow-hidden rounded-[14px] border border-white/30 bg-black/10">
                                <img
                                  src={image.startsWith('data:') ? image : `data:image/jpeg;base64,${image}`}
                                  alt={`Attached diagram or notes ${imageIndex + 1}`}
                                  className="h-full w-full rounded-[14px] object-cover"
                                />
                              </div>
                            ))}
                          </div>
                        )}
                        <div className="whitespace-pre-wrap text-white font-normal text-base">{msg.content}</div>
                        <div className="mt-1 flex items-center justify-end gap-1.5 text-xs font-medium text-white/80">
                          {msg.edited && <span className="mr-auto text-white/70">edited</span>}
                          <span>{msg.timestamp}</span>
                          <CheckCheck className="h-3.5 w-3.5 text-white" />
                          {!isLoading && (
                            <button
                              type="button"
                              onClick={() => startEditMessage(msg, messageImages)}
                              disabled={!!editingMessageId}
                              className="ml-1 min-h-[44px] min-w-[44px] rounded-[12px] p-2 text-white/80 hover:bg-white/10 hover:text-white disabled:opacity-40 flex items-center justify-center cursor-pointer"
                              title="Edit message"
                              aria-label="Edit message"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Message action row (Copy, Save Note, Regenerate): 44px-high rounded buttons with 1px border */}
                {isAssistant && (
                  <div className="mt-3 pt-2.5 border-t border-[#D5E0D8] dark:border-[#27403A] flex items-center justify-between text-xs text-[#4F6359] dark:text-[#9DB5A8]">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleCopyMessage(msg.id, msg.content)}
                        className="min-h-[44px] px-3 py-1.5 rounded-[12px] border border-[#D5E0D8] dark:border-[#27403A] bg-white dark:bg-[#12231C] text-[#10231C] dark:text-[#E8F2EC] hover:bg-[#DDEFE6] dark:hover:bg-[#17352A] hover:text-[#0A5C45] dark:hover:text-[#5BE0A5] transition-colors flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
                        title="Copy message to clipboard"
                      >
                        {copiedMsgId === msg.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-[#0A5C45] dark:text-[#5BE0A5]" />
                            <span className="text-[#0A5C45] dark:text-[#5BE0A5] font-bold">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => handleSaveNote(msg.id, msg.content)}
                        className="min-h-[44px] px-3 py-1.5 rounded-[12px] border border-[#D5E0D8] dark:border-[#27403A] bg-white dark:bg-[#12231C] text-[#10231C] dark:text-[#E8F2EC] hover:bg-[#DDEFE6] dark:hover:bg-[#17352A] hover:text-[#0A5C45] dark:hover:text-[#5BE0A5] transition-colors flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
                        title="Save to compiled notes"
                      >
                        {savedNotesMsgId === msg.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-[#0A5C45] dark:text-[#5BE0A5]" />
                            <span className="text-[#0A5C45] dark:text-[#5BE0A5] font-bold">Saved Note ✓</span>
                          </>
                        ) : (
                          <>
                            <FileText className="w-3.5 h-3.5" />
                            <span>Save Note</span>
                          </>
                        )}
                      </button>
                    </div>

                    {idx === latestAssistantIndex && (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            let userMessageIndex = -1;
                            for (let messageIndex = idx - 1; messageIndex >= 0; messageIndex -= 1) {
                              if (session?.messages[messageIndex]?.role === 'user') {
                                userMessageIndex = messageIndex;
                                break;
                              }
                            }
                            if (userMessageIndex >= 0 && onRegenerateMessage) onRegenerateMessage(msg.id, userMessageIndex);
                          }}
                          disabled={isLoading}
                          className="min-h-[44px] px-3 py-1.5 rounded-[12px] border border-[#D5E0D8] dark:border-[#27403A] bg-white dark:bg-[#12231C] text-[#10231C] dark:text-[#E8F2EC] hover:bg-[#DDEFE6] dark:hover:bg-[#17352A] hover:text-[#0A5C45] dark:hover:text-[#5BE0A5] transition-colors flex items-center gap-1.5 text-xs font-semibold cursor-pointer group disabled:opacity-40 disabled:pointer-events-none"
                          title="Regenerate response"
                        >
                          <RotateCcw className="w-3.5 h-3.5 group-hover:-rotate-45 transition-transform" />
                          <span className="hidden sm:inline">Regenerate</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-start gap-2 max-w-3xl mx-auto w-full animate-in fade-in">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
              style={{ backgroundColor: brandCol.bg, color: brandCol.text }}
            >
              {activePersona.initials}
            </div>
            <div className="px-4 py-3 rounded-[20px] rounded-bl-none bg-white dark:bg-[#12231C] border border-[#D5E0D8] dark:border-[#27403A] text-xs text-[#4F6359] dark:text-[#9DB5A8] flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#0A5C45] dark:bg-[#0F8056] animate-bounce" />
              <div className="w-2 h-2 rounded-full bg-[#0A5C45] dark:bg-[#0F8056] animate-bounce [animation-delay:0.2s]" />
              <div className="w-2 h-2 rounded-full bg-[#0A5C45] dark:bg-[#0F8056] animate-bounce [animation-delay:0.4s]" />
              <span className="font-semibold text-[#10231C] dark:text-[#E8F2EC]">
                {activePersona.name} is typing...
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 4. CHAT COMPOSER STAGE */}
      <div className="px-2 pt-2.5 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:px-4 sm:pt-3 sm:pb-[calc(1rem+env(safe-area-inset-bottom))] border-t border-[#D5E0D8] dark:border-[#27403A] bg-[#FFFFFF] dark:bg-[#12231C] shrink-0 z-10">
        <div className="max-w-3xl mx-auto space-y-2.5">
          <input type="file" ref={fileInputRef} onChange={handleImageSelect} accept="image/*" multiple className="hidden" />
          <input type="file" ref={cameraInputRef} onChange={handleImageSelect} accept="image/*" capture="environment" className="hidden" />

          {attachedImages.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 rounded-[14px] border border-[#D5E0D8] dark:border-[#27403A] bg-[#F3F6F1] p-2 dark:bg-[#0B1612]">
              {attachedImages.map((image, index) => (
                <div key={`${index}-${image.slice(0, 12)}`} className="relative h-14 w-14">
                  <img
                    src={image.startsWith('data:') ? image : `data:image/jpeg;base64,${image}`}
                    alt={`Image attachment ${index + 1}`}
                    className="h-full w-full rounded-[10px] border border-[#D5E0D8] dark:border-[#27403A] object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setAttachedImages((current) => current.filter((_, imageIndex) => imageIndex !== index))}
                    className="absolute -right-1.5 -top-1.5 min-h-[24px] min-w-[24px] rounded-full bg-[#10231C] p-1 text-white flex items-center justify-center cursor-pointer"
                    title="Remove image"
                    aria-label={`Remove image ${index + 1}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              <span className="text-xs font-bold text-[#0A5C45] dark:text-[#5BE0A5]">{attachedImages.length}/4 PRO VISION</span>
            </div>
          )}
          {imageNotice && <p role="status" className="text-xs text-rose-600 dark:text-rose-400 font-semibold">{imageNotice}</p>}

          {/* Main Chat Input Bar + Buttons Row */}
          <div className="flex items-center gap-2 min-w-0">
            {/* Input Bar: 2px border and white (light) or #12231C (dark) background */}
            <form
              onSubmit={handleSubmit}
              className="min-h-[56px] min-w-0 flex-1 flex items-center gap-2 px-3 py-1 rounded-[14px] bg-[#FFFFFF] dark:bg-[#12231C] border-2 border-[#D5E0D8] dark:border-[#27403A] focus-within:border-[#0A5C45] dark:focus-within:border-[#0F8056] transition-colors"
            >
              <div className="relative flex shrink-0">
                <button
                  type="button"
                  onClick={() => handleImageButtonClick('files')}
                  className={`min-h-[44px] min-w-[44px] h-11 w-11 shrink-0 rounded-[12px] transition-all flex items-center justify-center cursor-pointer ${
                    attachedImages.length > 0
                      ? 'bg-[#0A5C45] dark:bg-[#0F8056] text-white'
                      : isPaid
                      ? 'text-[#4F6359] dark:text-[#9DB5A8] hover:text-[#0A5C45] dark:hover:text-[#5BE0A5] hover:bg-[#DDEFE6] dark:hover:bg-[#17352A]'
                      : 'text-[#F4B400] hover:bg-[#FFF3CC] dark:hover:bg-[#3A2F0B]'
                  }`}
                  title={isPaid ? 'Choose images (Pro Vision)' : 'Choose images (Pro Feature - Click to Upgrade)'}
                >
                  <Paperclip className="w-5 h-5" />
                </button>
                {!isPaid && (
                  <span
                    onClick={() => handleImageButtonClick('files')}
                    className="absolute -top-1 -right-1 px-1.5 py-0.2 rounded-full bg-[#F4B400] text-[#10231C] font-black text-[9px] flex items-center gap-0.5 border border-[#10231C]/20 cursor-pointer"
                    title="Pro Feature"
                  >
                    <Crown className="w-2.5 h-2.5" />
                    <span>PRO</span>
                  </span>
                )}
              </div>

              {/* Placeholder shortened to "Sawal likhein..." */}
              <textarea
                id="tour-chat-input"
                ref={textareaRef}
                rows={1}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={!!editingMessageId || isLoading}
                placeholder={
                  attachedImages.length > 0
                    ? "Ask a specific question about this image..."
                    : "Sawal likhein..."
                }
                className="min-w-0 flex-1 min-h-[44px] max-h-36 py-2 px-1 bg-transparent text-base text-[#10231C] dark:text-[#E8F2EC] placeholder:text-[#4F6359]/70 dark:placeholder:text-[#9DB5A8]/70 resize-none focus:outline-none leading-relaxed"
                dir={language === 'urdu' ? 'rtl' : 'ltr'}
              />
            </form>

            {/* Camera Button */}
            <button
              type="button"
              onClick={() => handleImageButtonClick('camera')}
              className="min-h-[56px] min-w-[44px] sm:min-w-[56px] h-14 w-11 sm:w-14 shrink-0 rounded-[14px] bg-[#FFFFFF] dark:bg-[#12231C] border border-[#D5E0D8] dark:border-[#27403A] text-[#10231C] dark:text-[#E8F2EC] hover:bg-[#DDEFE6] dark:hover:bg-[#17352A] hover:text-[#0A5C45] dark:hover:text-[#5BE0A5] flex items-center justify-center transition-colors cursor-pointer"
              title={isPaid ? 'Take a photo (Pro Vision)' : 'Take a photo (Pro Feature)'}
              aria-label="Take a photo"
            >
              <Camera className="w-5 h-5" />
            </button>

            {/* Lock Button */}
            <button
              onClick={() => setIsPrivate((value) => !value)}
              type="button"
              className={`min-h-[56px] min-w-[44px] sm:min-w-[56px] h-14 w-11 sm:w-14 shrink-0 rounded-[14px] border flex items-center justify-center transition-colors cursor-pointer ${
                isPrivate
                  ? 'bg-[#FFF3CC] border-[#F4B400] text-[#10231C] dark:bg-[#3A2F0B] dark:border-[#F4B400]/60 dark:text-[#E8F2EC]'
                  : 'bg-[#FFFFFF] border-[#D5E0D8] text-[#4F6359] dark:bg-[#12231C] dark:border-[#27403A] dark:text-[#9DB5A8] hover:bg-[#DDEFE6] dark:hover:bg-[#17352A]'
              }`}
              title={isPrivate ? 'Private question' : 'Public question'}
              aria-label={isPrivate ? 'Private question' : 'Public question'}
            >
              {isPrivate ? <Lock className="w-5 h-5" /> : <LockOpen className="w-5 h-5" />}
            </button>

            {/* Send Button: gold #F4B400 with dark icon when input has text, faded green when empty */}
            <button
              onClick={handleSubmit}
              type="button"
              disabled={(!inputText.trim() && attachedImages.length === 0) || isLoading || !!editingMessageId}
              className={`min-h-[56px] min-w-[44px] sm:min-w-[56px] h-14 w-11 sm:w-14 shrink-0 rounded-[14px] transition-all flex items-center justify-center cursor-pointer border ${
                inputText.trim() || attachedImages.length > 0
                  ? 'bg-[#F4B400] text-[#10231C] border-[#d49b00] hover:bg-[#e0a500]'
                  : 'bg-[#0A5C45]/40 dark:bg-[#0F8056]/40 text-white/80 border-transparent'
              }`}
              title="Send Message (Enter)"
            >
              <Send className="w-5 h-5 ml-0.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
