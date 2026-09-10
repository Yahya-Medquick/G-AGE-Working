import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Sparkles,
  RotateCcw,
  Copy,
  Check,
  CheckCheck,
  FileText,
  PanelLeft,
  PanelRight,
  GraduationCap,
  Lightbulb,
  BookOpen,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  ExternalLink,
  Edit2,
  Share2,
  Zap,
  ArrowRight,
  Code2,
  Atom,
  Eye,
  EyeOff,
  Star,
  CheckCircle2,
  Compass,
  Network,
  Layers,
  Play,
  Newspaper,
  Smile,
  Paperclip,
  Mic,
  MoreVertical,
  Image as ImageIcon,
  Camera,
  X,
  Lock,
  Crown,
  Loader2,
} from 'lucide-react';
import { ChatSession, ChatMessage, ChatMode, ConceptSpecs, ExamSpecs, ResearchSpecs } from '../../types/chat';
import { ExpertPersona, EXPERTS, EXPERTS_PK } from '../../data/experts';
import { useUser } from '../../context/UserContext';
import { MarkdownRenderer } from '../MarkdownRenderer';
import { SpecificationsAccordion } from './SpecificationsAccordion';
import { MCQCard } from '../cards/MCQCard';
import { VideoCard } from '../cards/VideoCard';
import { NewsCard } from '../cards/NewsCard';
import { MultiLevelDefinitionCard } from '../MultiLevelDefinitionCard';

// Helper component for YouTube Video Guides (backend YouTube Data API integration)
const ExploreVideosSection: React.FC<{ topic: string; query?: string }> = ({ topic, query }) => {
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const searchQuery = query || topic;

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    fetch(`/api/category/videos?q=${encodeURIComponent(searchQuery)}`)
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data && Array.isArray(data.items)) {
          console.log(`[ExploreVideosSection] Fetched ${data.items.length} videos for topic "${searchQuery}":`, data.items);
          setVideos(data.items);
        }
      })
      .catch((err) => console.error("Error fetching YouTube videos:", err))
      .finally(() => { if (isMounted) setLoading(false); });
    return () => { isMounted = false; };
  }, [searchQuery]);

  if (loading) {
    return (
      <div className="py-6 text-center text-xs text-slate-500 dark:text-slate-400 flex items-center justify-center gap-2">
        <div className="w-3 h-3 rounded-full bg-rose-500 animate-ping" />
        <span>Loading YouTube video guides for {topic}...</span>
      </div>
    );
  }

  if (!videos || videos.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
        <span className="flex items-center gap-1.5">
          <Play className="w-4 h-4 text-rose-500 fill-rose-500" />
          YouTube Video Guides ({topic})
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {videos.slice(0, 4).map((video: any, idx: number) => (
          <VideoCard key={video.id || idx} video={video} />
        ))}
      </div>
    </div>
  );
};

// Helper component for Recent News (backend News API integration with pagination)
const ExploreNewsSection: React.FC<{ topic: string; query?: string }> = ({ topic, query }) => {
  const [news, setNews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const searchQuery = query || topic;
  const limit = 6;

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setPage(1);
    fetch(`/api/category/news?q=${encodeURIComponent(searchQuery)}&page=1&limit=${limit}&offset=0`)
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data && Array.isArray(data.items)) {
          setNews(data.items);
          setHasMore(data.pagination?.hasMore ?? (data.items.length >= limit));
        }
      })
      .catch((err) => console.error("Error fetching news:", err))
      .finally(() => { if (isMounted) setLoading(false); });
    return () => { isMounted = false; };
  }, [searchQuery]);

  const handleLoadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    const nextOffset = (nextPage - 1) * limit;

    try {
      const res = await fetch(`/api/category/news?q=${encodeURIComponent(searchQuery)}&page=${nextPage}&limit=${limit}&offset=${nextOffset}`);
      const data = await res.json();
      if (data && Array.isArray(data.items) && data.items.length > 0) {
        setNews((prev) => [...prev, ...data.items]);
        setPage(nextPage);
        setHasMore(data.pagination?.hasMore ?? (data.items.length >= limit));
      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.error("Error loading more news:", err);
    } finally {
      setLoadingMore(false);
    }
  };

  if (loading) {
    return (
      <div className="py-6 text-center text-xs text-slate-500 dark:text-slate-400 flex items-center justify-center gap-2">
        <div className="w-3 h-3 rounded-full bg-blue-500 animate-ping" />
        <span>Fetching recent news about {topic}...</span>
      </div>
    );
  }

  if (news.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
        <span className="flex items-center gap-1.5">
          <Newspaper className="w-4 h-4 text-blue-500" />
          Recent News ({topic})
        </span>
        <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
          Showing {news.length} items
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {news.map((article: any, idx: number) => (
          <NewsCard key={article.id || `news-card-${idx}`} article={article} />
        ))}
      </div>
      {hasMore && (
        <div className="pt-2 flex justify-center">
          <button
            id="load-more-chat-news-btn"
            type="button"
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="px-4 py-2 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/50 border border-blue-200 dark:border-blue-800/60 rounded-xl transition-all flex items-center gap-2 cursor-pointer disabled:opacity-60 shadow-xs"
          >
            {loadingMore ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600 dark:text-blue-400" />
                <span>Loading more news...</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-3.5 h-3.5" />
                <span>Load More News</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

interface ChatStageProps {
  session: ChatSession | null;
  activePersona: ExpertPersona;
  variant: 'global' | 'pk';
  onSendMessage: (content: string, modeOverride?: ChatMode, imageBase64?: string) => Promise<void>;
  isLoading: boolean;
  onToggleLeftPanel: () => void;
  isLeftPanelOpen: boolean;
  onToggleRightPanel: () => void;
  isRightPanelOpen: boolean;
  onUpdateSessionMeta: (sessionId: string, updates: Partial<Pick<ChatSession, 'mode' | 'personaId' | 'variant' | 'specs' | 'title'>>) => void;
  onSaveToNotes: (content: string, title?: string) => void;
  onOpenPaywall: () => void;
  onOpenKnowledgeGraph?: () => void;
  queryUsage: {
    count: number;
    limit: number;
    remaining: number;
    tier: string;
    isLoggedIn: boolean;
  };
}

export const ChatStage: React.FC<ChatStageProps> = ({
  session,
  activePersona,
  variant,
  onSendMessage,
  isLoading,
  onToggleLeftPanel,
  isLeftPanelOpen,
  onToggleRightPanel,
  isRightPanelOpen,
  onUpdateSessionMeta,
  onSaveToNotes,
  onOpenPaywall,
  onOpenKnowledgeGraph,
  queryUsage,
}) => {
  const { user } = useUser();
  const isPaid = queryUsage.tier === 'paid' || user?.tier === 'paid' || user?.tier === 'pro' || user?.tier === 'unlimited';

  const [inputText, setInputText] = useState('');
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [imageFileName, setImageFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isSpecsOpen, setIsSpecsOpen] = useState(false);
  const [showMCQCard, setShowMCQCard] = useState<boolean>(false);
  const [showDefinitionCard, setShowDefinitionCard] = useState<boolean>(false);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);
  const [savedNotesMsgId, setSavedNotesMsgId] = useState<string | null>(null);
  const [revealedSolutions, setRevealedSolutions] = useState<Record<string, boolean>>({});
  const [activeLevelTabs, setActiveLevelTabs] = useState<Record<string, 'eli5' | 'highSchool' | 'undergrad' | 'phd'>>({});
  const [expandedExploreMsgIds, setExpandedExploreMsgIds] = useState<Record<string, boolean>>({});
  const [activeExploreMsgId, setActiveExploreMsgId] = useState<string | null>(null);
  const [activeExploreTab, setActiveExploreTab] = useState<'videos' | 'news' | 'mcqs' | null>(null);
  const [extractedTopics, setExtractedTopics] = useState<
    Record<
      string,
      {
        displayTopic: string;
        videoQuery: string;
        newsQuery: string;
        mcqTopic: string;
        loading?: boolean;
      }
    >
  >({});

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const latestTurnRef = useRef<HTMLDivElement>(null);
  const prevMsgLenRef = useRef<number>(session?.messages.length || 0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const activeMode: ChatMode = session?.mode || 'concept';

  // Auto-scroll to start of response when user asks a query
  useEffect(() => {
    const currentLen = session?.messages.length || 0;
    if (currentLen > prevMsgLenRef.current) {
      setTimeout(() => {
        latestTurnRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 50);
    }
    prevMsgLenRef.current = currentLen;
  }, [session?.messages.length, isLoading]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [inputText]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (JPG, PNG, WebP).');
      return;
    }
    setImageFileName(file.name);

    // Read and compress image client-side to ensure fast transmission and avoid payload errors
    const reader = new FileReader();
    reader.onloadend = () => {
      const rawDataUrl = reader.result as string;
      const img = new Image();
      img.onload = () => {
        const MAX_WIDTH = 1200;
        const MAX_HEIGHT = 1200;
        let { width, height } = img;

        if (width > MAX_WIDTH || height > MAX_HEIGHT) {
          if (width > height) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          } else {
            width = Math.round((width * MAX_HEIGHT) / height);
            height = MAX_HEIGHT;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
          setAttachedImage(compressedDataUrl);
        } else {
          setAttachedImage(rawDataUrl);
        }
      };
      img.onerror = () => {
        setAttachedImage(rawDataUrl);
      };
      img.src = rawDataUrl;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleImageButtonClick = () => {
    if (!isPaid) {
      onOpenPaywall();
      return;
    }
    fileInputRef.current?.click();
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if ((!inputText.trim() && !attachedImage) || isLoading) return;
    const msg = inputText.trim();
    const img = attachedImage;
    setInputText('');
    setAttachedImage(null);
    setImageFileName(null);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    await onSendMessage(msg, activeMode, img || undefined);
  };

  const handleCopyMessage = (msgId: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedMsgId(msgId);
    setTimeout(() => setCopiedMsgId(null), 2000);
  };

  const handleSaveNote = (msgId: string, content: string) => {
    const title = session?.title ? `${activePersona.name} on ${session.title}` : `Note from ${activePersona.name}`;
    onSaveToNotes(content, title);
    setSavedNotesMsgId(msgId);
    setTimeout(() => setSavedNotesMsgId(null), 2500);
  };

  const handleModeChange = (mode: ChatMode) => {
    if (session) {
      onUpdateSessionMeta(session.id, { mode });
    }
  };

  const handleSpecsChange = (newSpecs: any) => {
    if (session) {
      onUpdateSessionMeta(session.id, { specs: newSpecs });
    }
  };

  const toggleSolutionReveal = (msgId: string) => {
    setRevealedSolutions((prev) => ({ ...prev, [msgId]: !prev[msgId] }));
  };

  const setLevelTab = (msgId: string, lvl: 'eli5' | 'highSchool' | 'undergrad' | 'phd') => {
    setActiveLevelTabs((prev) => ({ ...prev, [msgId]: lvl }));
  };

  const extractTopicForMessage = async (msgId: string, msgContent: string, msgIndex: number) => {
    if (extractedTopics[msgId] && !extractedTopics[msgId].loading) {
      return;
    }

    const userMsg = session?.messages
      .slice(0, msgIndex)
      .reverse()
      .find((m) => m.role === 'user');

    const cleanFallback = (str?: string) => {
      if (!str) return '';
      return str
        .replace(/\b(hi|hello|hey|salam|assalam|aoa|greetings|please|pls|thanks|thank you|can you|explain|what is|tell me about|how to|i want to know|bro|sir|mam|help me with)\b/gi, '')
        .replace(/[^\w\s-]/gi, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    };

    const rawSubject =
      cleanFallback(userMsg?.content) ||
      cleanFallback(session?.title && session.title !== 'New Consultation' ? session.title : '') ||
      cleanFallback(msgContent.slice(0, 100)) ||
      activePersona.specialties?.[0] ||
      activePersona.name ||
      'Core Fundamentals';

    const defaultTopic = rawSubject.length > 2 ? rawSubject.split(' ').slice(0, 4).join(' ') : 'Core Concepts';
    const initialDisplayTopic = defaultTopic.charAt(0).toUpperCase() + defaultTopic.slice(1);

    setExtractedTopics((prev) => ({
      ...prev,
      [msgId]: {
        displayTopic: initialDisplayTopic,
        videoQuery: `${defaultTopic} lecture guide`,
        newsQuery: `${defaultTopic} research news`,
        mcqTopic: defaultTopic,
        loading: true,
      },
    }));

    try {
      const res = await fetch('/api/explore/extract-topic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userQuery: userMsg?.content || '',
          assistantReply: msgContent,
          sessionTitle: session?.title || '',
          personaName: activePersona.name,
          personaSpecialties: activePersona.specialties || [],
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data && data.displayTopic) {
          setExtractedTopics((prev) => ({
            ...prev,
            [msgId]: {
              displayTopic: data.displayTopic,
              videoQuery: data.videoQuery || `${data.displayTopic} lecture`,
              newsQuery: data.newsQuery || `${data.displayTopic} news`,
              mcqTopic: data.mcqTopic || data.displayTopic,
              loading: false,
            },
          }));
          return;
        }
      }
    } catch (err) {
      console.warn('Failed to extract AI topic:', err);
    }

    setExtractedTopics((prev) => ({
      ...prev,
      [msgId]: {
        ...(prev[msgId] || {
          displayTopic: initialDisplayTopic,
          videoQuery: defaultTopic,
          newsQuery: defaultTopic,
          mcqTopic: defaultTopic,
        }),
        loading: false,
      },
    }));
  };

  const toggleExploreSection = (msgId: string, msgContent: string, msgIndex: number) => {
    setExpandedExploreMsgIds((prev) => {
      const willBeExpanded = !prev[msgId];
      if (willBeExpanded) {
        extractTopicForMessage(msgId, msgContent, msgIndex);
      } else if (activeExploreMsgId === msgId) {
        setActiveExploreMsgId(null);
        setActiveExploreTab(null);
      }
      return { ...prev, [msgId]: willBeExpanded };
    });
  };

  const handleToggleExploreTab = (msgId: string, tab: 'videos' | 'news' | 'mcqs') => {
    if (activeExploreMsgId === msgId && activeExploreTab === tab) {
      setActiveExploreMsgId(null);
      setActiveExploreTab(null);
    } else {
      setActiveExploreMsgId(msgId);
      setActiveExploreTab(tab);
    }
  };

  const currentTopic = session?.title && session.title !== 'New Consultation' ? session.title : 'this topic';

  return (
    <div className="flex-1 flex flex-col h-full min-w-0 bg-[#efeae2] dark:bg-[#0b141a] overflow-hidden relative selection:bg-[#00a884]/20 selection:text-[#005c4b] dark:selection:text-[#00a884]">
      {/* WhatsApp Doodle Pattern Subtle Background Overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.04] dark:opacity-[0.025] bg-[radial-gradient(#00a884_1px,transparent_1px)] [background-size:16px_16px]"
        aria-hidden="true"
      />

      {/* 1. TOP WHATSAPP HEADER BAR */}
      <header className="h-15 px-3 sm:px-4 border-b border-[#e9edef] dark:border-[#2a3942] bg-[#f0f2f5] dark:bg-[#202c33] shadow-xs flex items-center justify-between shrink-0 z-10 gap-2">
        {/* Left Section: Back/Sidebar Toggle & Active Group Profile */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {!isLeftPanelOpen && (
            <button
              onClick={onToggleLeftPanel}
              className="p-1.5 rounded-full text-slate-600 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
              title="Open Chat Sessions"
            >
              <PanelLeft className="w-5 h-5" />
            </button>
          )}

          {/* WhatsApp Group / Contact Profile Pill */}
          <div
            id="tour-persona-toggle"
            onClick={onToggleRightPanel}
            className="flex items-center gap-2.5 min-w-0 cursor-pointer hover:opacity-90 transition-opacity"
            title="Click to view specialists and switch persona"
          >
            <div className="relative">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-xs border border-white/20"
                style={{ backgroundColor: activePersona.avatar_color || '#00a884' }}
              >
                {activePersona.initials}
              </div>
              {/* Online Green Indicator Dot */}
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[#25D366] border-2 border-[#f0f2f5] dark:border-[#202c33]" />
            </div>

            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-[#111b21] dark:text-[#e9edef] truncate">
                  {activePersona.name}
                </span>
                <span
                  className="hidden md:inline-block text-[9px] font-bold px-1.5 py-0.5 rounded-full border"
                  style={{
                    color: activePersona.avatar_color || '#00a884',
                    borderColor: `${activePersona.avatar_color || '#00a884'}40`,
                    backgroundColor: `${activePersona.avatar_color || '#00a884'}15`,
                  }}
                >
                  {activePersona.badge || 'Academic Mentor'}
                </span>
              </div>
              <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 truncate">
                <span className="text-[#00a884] dark:text-[#25d366] font-semibold">online</span>
                <span>•</span>
                <span className="truncate">{isLoading ? 'typing...' : activePersona.role}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Center/Right Section: WhatsApp Style Mode Tabs & Quick Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Mode Switcher Tabs */}
          <div id="tour-mode-switcher" className="flex items-center p-0.5 rounded-xl bg-slate-200/70 dark:bg-[#111b21] border border-slate-300/60 dark:border-[#2a3942] text-xs">
            <button
              onClick={() => handleModeChange('concept')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeMode === 'concept'
                  ? 'bg-white dark:bg-[#202c33] text-[#00a884] dark:text-[#25d366] shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Concept Mode: Deep Intuition & Derivations"
            >
              <Lightbulb className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Concept</span>
            </button>

            <button
              onClick={() => handleModeChange('exam')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeMode === 'exam'
                  ? 'bg-white dark:bg-[#202c33] text-amber-600 dark:text-amber-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Exam Mode: Practice Problems & Marking Rubrics"
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Exam</span>
            </button>

            <button
              onClick={() => handleModeChange('research')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeMode === 'research'
                  ? 'bg-white dark:bg-[#202c33] text-cyan-600 dark:text-cyan-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Research Mode: Literature, Citations & Deep Dives"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Research</span>
            </button>
          </div>

          {/* Quick Tools: MCQ Quiz, Rigor Definitions, Knowledge Graph */}
          <div id="tour-quick-tools" className="hidden lg:flex items-center gap-1 border-l border-slate-300 dark:border-[#2a3942] pl-2">
            <button
              onClick={() => setShowMCQCard(!showMCQCard)}
              className={`p-1.5 px-2 rounded-lg border transition-colors flex items-center gap-1 text-xs font-semibold cursor-pointer ${
                showMCQCard
                  ? 'bg-amber-100/70 dark:bg-amber-950/60 border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-300 shadow-2xs'
                  : 'bg-white/80 dark:bg-[#202c33] border-slate-300 dark:border-[#2a3942] text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#2a3942]'
              }`}
              title="Toggle Interactive MCQ Quiz"
            >
              <GraduationCap className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-[11px]">MCQs</span>
            </button>

            <button
              onClick={() => setShowDefinitionCard(!showDefinitionCard)}
              className={`p-1.5 px-2 rounded-lg border transition-colors flex items-center gap-1 text-xs font-semibold cursor-pointer ${
                showDefinitionCard
                  ? 'bg-[#00a884]/15 border-[#00a884]/40 text-[#00a884] dark:text-[#25d366] shadow-2xs'
                  : 'bg-white/80 dark:bg-[#202c33] border-slate-300 dark:border-[#2a3942] text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#2a3942]'
              }`}
              title="Toggle Multi-Level Rigorous Definitions"
            >
              <Layers className="w-3.5 h-3.5 text-[#00a884]" />
              <span className="text-[11px]">Rigor</span>
            </button>

            {onOpenKnowledgeGraph && (
              <button
                onClick={onOpenKnowledgeGraph}
                className="p-1.5 px-2 rounded-lg border border-slate-300 dark:border-[#2a3942] bg-white/80 dark:bg-[#202c33] text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#2a3942] transition-colors flex items-center gap-1 text-xs font-semibold cursor-pointer"
                title="Open Interactive Knowledge Graph"
              >
                <Network className="w-3.5 h-3.5 text-purple-500" />
                <span className="text-[11px]">Graph</span>
              </button>
            )}
          </div>

          {/* Specifications Accordion Button */}
          <button
            id="tour-specs-btn"
            onClick={() => setIsSpecsOpen(!isSpecsOpen)}
            className={`p-1.5 rounded-lg border transition-colors flex items-center gap-1 text-xs font-semibold cursor-pointer ${
              isSpecsOpen
                ? 'bg-[#00a884]/15 border-[#00a884]/40 text-[#00a884] dark:text-[#25d366]'
                : 'bg-white/80 dark:bg-[#202c33] border-slate-300 dark:border-[#2a3942] text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#2a3942]'
            }`}
            title="Toggle Mode Filters & Specifications"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span className="hidden md:inline text-[11px]">Filters</span>
          </button>

          {/* Query Usage Pill / Upgrade CTA */}
          <button
            onClick={onOpenPaywall}
            className={`px-2 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
              queryUsage.tier === 'paid'
                ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                : queryUsage.remaining <= 1
                ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800 animate-pulse'
                : 'bg-white/90 dark:bg-[#202c33] text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-[#2a3942] hover:border-[#00a884]'
            }`}
          >
            <Zap className="w-3 h-3 text-amber-500" />
            <span className="hidden sm:inline">
              {queryUsage.tier === 'paid' ? 'Pro' : `${queryUsage.remaining} Left`}
            </span>
          </button>

          {!isRightPanelOpen && (
            <button
              onClick={onToggleRightPanel}
              className="p-1.5 rounded-full text-slate-600 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
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

      {/* 3. MESSAGES STREAM (WHATSAPP GROUP CHAT STYLING) */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-4 relative z-0">
        {/* Toggleable MCQ Quiz Card */}
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

        {/* Toggleable Multi-Level Definition Card */}
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

        {/* WhatsApp Centered Date Separator Pill */}
        <div className="flex justify-center my-2">
          <div className="bg-white/90 dark:bg-[#182229]/95 text-slate-600 dark:text-slate-400 text-[11px] font-semibold px-3 py-1 rounded-lg shadow-[0_1px_0.5px_rgba(11,20,26,0.13)] dark:shadow-[0_1px_0.5px_rgba(11,20,26,0.3)] uppercase tracking-wider">
            TODAY • {activePersona.name} Group
          </div>
        </div>

        {/* Initial Group Welcome Card if brand new chat */}
        {(!session || session.messages.length <= 1) && (
          <div className="max-w-xl mx-auto py-4 space-y-4 animate-in fade-in duration-300">
            {/* WhatsApp System Encryption / Encryption Style Banner */}
            <div className="bg-[#ffeecd] dark:bg-[#182229] border border-[#f5c369]/40 dark:border-[#2a3942] rounded-xl p-3 text-center text-xs text-[#54656f] dark:text-[#8696a0] shadow-xs space-y-1">
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

        {/* Render WhatsApp Message Bubbles */}
        {session?.messages.map((msg, idx) => {
          const isAssistant = msg.role === 'assistant';
          const isLatestTurnStart = idx === Math.max(0, (session?.messages.length || 0) - (isLoading ? 1 : 2));
          const msgPersona = isAssistant
            ? (variant === 'pk' ? EXPERTS_PK : EXPERTS)[msg.personaId || activePersona.id] || activePersona
            : null;

          return (
            <div
              key={msg.id || idx}
              ref={isLatestTurnStart ? latestTurnRef : null}
              className={`flex flex-col ${isAssistant ? 'items-start' : 'items-end'} max-w-3xl mx-auto w-full`}
            >
              {/* WhatsApp Message Bubble Container */}
              <div
                className={`relative px-4 py-3 text-sm transition-all shadow-[0_1px_0.5px_rgba(11,20,26,0.13)] dark:shadow-[0_1px_0.5px_rgba(11,20,26,0.3)] ${
                  isAssistant
                    ? 'w-full bg-white dark:bg-[#202c33] text-[#111b21] dark:text-[#e9edef] rounded-2xl rounded-tl-xs border border-black/5 dark:border-white/5'
                    : 'bg-[#d9fdd3] dark:bg-[#005c4b] text-[#111b21] dark:text-[#e9edef] font-normal max-w-[85%] sm:max-w-[75%] rounded-2xl rounded-tr-xs'
                }`}
              >
                {/* Assistant Group Participant Header */}
                {isAssistant && msgPersona && (
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-[#2a3942]/60">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-bold"
                        style={{ backgroundColor: msgPersona.avatar_color || '#00a884' }}
                      >
                        {msgPersona.initials}
                      </div>
                      <span
                        className="font-bold text-xs"
                        style={{ color: msgPersona.avatar_color || '#00a884' }}
                      >
                        ~ {msgPersona.name}
                      </span>
                      {msg.mode && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-[#111b21] text-slate-500 dark:text-slate-400 font-semibold uppercase">
                          {msg.mode}
                        </span>
                      )}
                    </div>

                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                      {msg.timestamp}
                    </span>
                  </div>
                )}

                {/* Bubble Content Body */}
                {isAssistant ? (
                  <div className="space-y-3">
                    <MarkdownRenderer content={msg.content} />

                    {/* Interactive Multi-Level Explanation Switcher if present */}
                    {msg.metadata?.multiLevel && (
                      <div className="mt-3 pt-3 border-t border-slate-100 dark:border-[#2a3942] space-y-2">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">
                          Rigor Level Switcher
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {(['eli5', 'highSchool', 'undergrad', 'phd'] as const).map((lvl) => (
                            <button
                              key={lvl}
                              onClick={() => setLevelTab(msg.id, lvl)}
                              className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase transition-colors cursor-pointer ${
                                (activeLevelTabs[msg.id] || 'undergrad') === lvl
                                  ? 'bg-[#00a884] text-white shadow-2xs'
                                  : 'bg-slate-100 dark:bg-[#111b21] text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-[#2a3942]'
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

                    {/* Interactive Exam Question Solution Reveal Box */}
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
                              <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mb-1 uppercase">
                                Model Answer & Derivation
                              </div>
                              <MarkdownRenderer content={msg.metadata.examQuestion.solution} />
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Cited Literature & Papers */}
                    {msg.metadata?.papers && msg.metadata.papers.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-slate-100 dark:border-[#2a3942] space-y-2">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">
                          Cited Literature & Papers
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {msg.metadata.papers.map((paper, pIdx) => (
                            <div
                              key={pIdx}
                              className="p-2.5 rounded-lg bg-slate-50 dark:bg-[#111b21]/60 border border-slate-200/80 dark:border-[#2a3942] text-xs space-y-1"
                            >
                              <a
                                href={paper.url || '#'}
                                target="_blank"
                                rel="noreferrer"
                                className="font-bold text-slate-900 dark:text-white hover:text-[#00a884] dark:hover:text-[#25d366] flex items-start justify-between gap-1"
                              >
                                <span className="line-clamp-2">{paper.title}</span>
                                <ExternalLink className="w-3 h-3 shrink-0 text-slate-400" />
                              </a>
                              <div className="flex items-center gap-2 text-[10px] text-slate-400">
                                <span>{paper.year}</span>
                                {paper.citationCount !== undefined && (
                                  <span>· {paper.citationCount} Citations</span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* EXPLORE MORE INTERACTIVE WHATSAPP-STYLE ATTACHMENT CARD - Only for valid non-error responses */}
                    {!msg.content.startsWith('⚠️') && (() => {
                      const msgTopicData = extractedTopics[msg.id];
                      const targetTopic = msgTopicData?.displayTopic || currentTopic;
                      const targetVideoQuery = msgTopicData?.videoQuery || targetTopic;
                      const targetNewsQuery = msgTopicData?.newsQuery || targetTopic;
                      const targetMcqTopic = msgTopicData?.mcqTopic || targetTopic;

                      return (
                        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-[#2a3942]">
                          {/* Minimalist Explore Toggle Bar */}
                          <button
                            onClick={() => toggleExploreSection(msg.id, msg.content, idx)}
                            aria-expanded={!!expandedExploreMsgIds[msg.id]}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl border transition-all cursor-pointer group text-left ${
                              expandedExploreMsgIds[msg.id]
                                ? 'bg-[#00a884]/10 border-[#00a884]/30 dark:bg-[#00a884]/15 dark:border-[#00a884]/40'
                                : 'bg-slate-50/90 dark:bg-[#111b21]/70 border-slate-200/80 dark:border-[#2a3942] hover:bg-slate-100/90 dark:hover:bg-[#111b21]'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div
                                className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors ${
                                  expandedExploreMsgIds[msg.id]
                                    ? 'bg-[#00a884] text-white'
                                    : 'bg-slate-200 dark:bg-[#2a3942] text-slate-600 dark:text-slate-300 group-hover:bg-[#00a884]/20 group-hover:text-[#00a884]'
                                }`}
                              >
                                <Compass className="w-3.5 h-3.5" />
                              </div>
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-[#00a884] dark:group-hover:text-[#25d366] transition-colors">
                                  Explore More
                                </span>
                                <span className="hidden sm:inline-flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate">
                                  <span>•</span>
                                  {msgTopicData?.displayTopic ? (
                                    <span className="font-semibold text-[#00a884] dark:text-[#25d366] truncate max-w-[200px]">
                                      {msgTopicData.displayTopic}
                                    </span>
                                  ) : (
                                    <span>Video Guides, Recent News & MCQs</span>
                                  )}
                                  {msgTopicData?.loading && (
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#00a884] animate-pulse" title="AI extracting topic..." />
                                  )}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className="text-[10px] font-semibold text-slate-400 group-hover:text-[#00a884] transition-colors">
                                {expandedExploreMsgIds[msg.id] ? 'Hide' : 'Open'}
                              </span>
                              <div
                                className={`p-0.5 rounded transition-transform duration-200 ${
                                  expandedExploreMsgIds[msg.id]
                                    ? 'rotate-180 text-[#00a884]'
                                    : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'
                                }`}
                              >
                                <ChevronDown className="w-3.5 h-3.5" />
                              </div>
                            </div>
                          </button>

                          {/* Expanded Content Drawer */}
                          {expandedExploreMsgIds[msg.id] && (
                            <div className="mt-2.5 space-y-2.5 animate-in fade-in slide-in-from-top-1 duration-200">
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                {/* 1. Video Guide */}
                                <button
                                  onClick={() => handleToggleExploreTab(msg.id, 'videos')}
                                  className={`p-2.5 rounded-xl border text-left transition-all group cursor-pointer space-y-1 ${
                                    activeExploreMsgId === msg.id && activeExploreTab === 'videos'
                                      ? 'border-[#00a884] bg-[#00a884]/10 dark:bg-[#00a884]/20'
                                      : 'border-slate-200/80 dark:border-[#2a3942] bg-slate-50 dark:bg-[#111b21] hover:bg-slate-100 dark:hover:bg-[#202c33]'
                                  }`}
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-rose-600 dark:group-hover:text-rose-400 flex items-center gap-1.5">
                                      <Play className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
                                      Video Guides
                                    </span>
                                    <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-rose-500" />
                                  </div>
                                  <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1">
                                    YouTube lecture guides
                                  </p>
                                </button>

                                {/* 2. Recent News */}
                                <button
                                  onClick={() => handleToggleExploreTab(msg.id, 'news')}
                                  className={`p-2.5 rounded-xl border text-left transition-all group cursor-pointer space-y-1 ${
                                    activeExploreMsgId === msg.id && activeExploreTab === 'news'
                                      ? 'border-[#00a884] bg-[#00a884]/10 dark:bg-[#00a884]/20'
                                      : 'border-slate-200/80 dark:border-[#2a3942] bg-slate-50 dark:bg-[#111b21] hover:bg-slate-100 dark:hover:bg-[#202c33]'
                                  }`}
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 flex items-center gap-1.5">
                                      <Newspaper className="w-3.5 h-3.5 text-blue-500" />
                                      Recent News
                                    </span>
                                    <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-blue-500" />
                                  </div>
                                  <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1">
                                    Articles & research updates
                                  </p>
                                </button>

                                {/* 3. Practice MCQs ("Test your grip") */}
                                <button
                                  onClick={() => handleToggleExploreTab(msg.id, 'mcqs')}
                                  className={`p-2.5 rounded-xl border text-left transition-all group cursor-pointer space-y-1 ${
                                    activeExploreMsgId === msg.id && activeExploreTab === 'mcqs'
                                      ? 'border-[#00a884] bg-[#00a884]/10 dark:bg-[#00a884]/20'
                                      : 'border-slate-200/80 dark:border-[#2a3942] bg-slate-50 dark:bg-[#111b21] hover:bg-slate-100 dark:hover:bg-[#202c33]'
                                  }`}
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-amber-600 dark:group-hover:text-amber-400 flex items-center gap-1.5">
                                      <GraduationCap className="w-3.5 h-3.5 text-amber-500" />
                                      Test Your Grip
                                    </span>
                                    <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-amber-500" />
                                  </div>
                                  <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1">
                                    Interactive practice MCQs
                                  </p>
                                </button>
                              </div>

                              {/* Section Details Drawer */}
                              {activeExploreMsgId === msg.id && activeExploreTab && (
                                <div className="mt-2 p-3.5 rounded-xl bg-white dark:bg-[#111b21] border border-slate-200/80 dark:border-[#2a3942] space-y-2.5 relative animate-in fade-in duration-200 shadow-xs">
                                  <button
                                    onClick={() => {
                                      setActiveExploreMsgId(null);
                                      setActiveExploreTab(null);
                                    }}
                                    className="absolute top-2.5 right-2.5 p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#202c33] transition-colors cursor-pointer text-xs font-bold"
                                    title="Close drawer"
                                  >
                                    ✕
                                  </button>

                                  {activeExploreTab === 'videos' && (
                                    <ExploreVideosSection topic={targetTopic} query={targetVideoQuery} />
                                  )}

                                  {activeExploreTab === 'news' && (
                                    <ExploreNewsSection topic={targetTopic} query={targetNewsQuery} />
                                  )}

                                  {activeExploreTab === 'mcqs' && (
                                    <MCQCard
                                      topic={targetMcqTopic}
                                      onSaveToNotes={onSaveToNotes}
                                      onClose={() => {
                                        setActiveExploreMsgId(null);
                                        setActiveExploreTab(null);
                                      }}
                                      onOpenPaywall={onOpenPaywall}
                                    />
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                ) : (
                  <div>
                    {msg.imageBase64 && (
                      <div className="mb-2.5 max-w-sm rounded-xl overflow-hidden border border-emerald-500/30 dark:border-emerald-400/20 bg-black/5 dark:bg-black/20 shadow-xs">
                        <img
                          src={msg.imageBase64}
                          alt="Attached diagram or notes"
                          className="w-full max-h-60 object-contain rounded-xl"
                        />
                      </div>
                    )}
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                    {/* User Message Timestamp with Double Blue Tick */}
                    <div className="flex items-center justify-end gap-1 text-[10px] text-[#54656f] dark:text-emerald-200/80 font-medium mt-1">
                      <span>{msg.timestamp}</span>
                      <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb]" />
                    </div>
                  </div>
                )}

                {/* Minimalist Interactive Message Action Bar */}
                {isAssistant && (
                  <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-[#2a3942]/70 flex items-center justify-between text-xs text-slate-400">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleCopyMessage(msg.id, msg.content)}
                        className="px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-[#111b21] hover:text-slate-800 dark:hover:text-slate-200 transition-colors flex items-center gap-1 text-[11px] font-medium cursor-pointer"
                        title="Copy message to clipboard"
                      >
                        {copiedMsgId === msg.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                            <span className="text-emerald-500 font-bold">Copied</span>
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
                        className="px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-[#111b21] hover:text-[#00a884] dark:hover:text-[#25d366] transition-colors flex items-center gap-1 text-[11px] font-medium cursor-pointer"
                        title="Save to compiled notes"
                      >
                        {savedNotesMsgId === msg.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-[#00a884]" />
                            <span className="text-[#00a884] font-bold">Saved Note ✓</span>
                          </>
                        ) : (
                          <>
                            <FileText className="w-3.5 h-3.5" />
                            <span>Save Note</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onSendMessage(`Regenerate response with greater depth and detailed step-by-step mathematical rigor.`)}
                        className="px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-[#111b21] hover:text-slate-800 dark:hover:text-slate-200 transition-colors flex items-center gap-1 text-[11px] font-medium cursor-pointer group"
                        title="Regenerate response"
                      >
                        <RotateCcw className="w-3.5 h-3.5 group-hover:-rotate-45 transition-transform" />
                        <span className="hidden sm:inline">Regenerate</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Typing / Synthesis Status Bubble */}
        {isLoading && (
          <div className="flex items-start gap-2 max-w-3xl mx-auto w-full animate-in fade-in">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0 shadow-xs"
              style={{ backgroundColor: activePersona.avatar_color || '#00a884' }}
            >
              {activePersona.initials}
            </div>
            <div className="px-4 py-3 rounded-2xl rounded-tl-xs bg-white dark:bg-[#202c33] border border-black/5 dark:border-white/5 shadow-xs text-xs text-slate-500 dark:text-slate-300 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#00a884] animate-bounce" />
              <div className="w-2 h-2 rounded-full bg-[#00a884] animate-bounce [animation-delay:0.2s]" />
              <div className="w-2 h-2 rounded-full bg-[#00a884] animate-bounce [animation-delay:0.4s]" />
              <span className="font-semibold text-slate-700 dark:text-slate-200">
                {activePersona.name} is typing...
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 4. WHATSAPP CHAT COMPOSER STAGE */}
      <div className="p-2 sm:p-3 border-t border-[#e9edef] dark:border-[#2a3942] bg-[#f0f2f5] dark:bg-[#202c33] shadow-md shrink-0 z-10">
        <div className="max-w-3xl mx-auto space-y-2">
          {/* Hidden File Input for Image Upload */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageSelect}
            accept="image/*"
            className="hidden"
          />

          {/* Attached Image Preview Strip */}
          {attachedImage && (
            <div className="p-2 rounded-2xl bg-white dark:bg-[#2a3942] border border-emerald-500/40 shadow-xs flex items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-1">
              <div className="flex items-center gap-2.5 min-w-0">
                <img
                  src={attachedImage}
                  alt="Thumbnail preview"
                  className="w-12 h-12 object-cover rounded-xl border border-emerald-500/30 shrink-0"
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                      {imageFileName || 'Attached Image Question'}
                    </span>
                    <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[9px] font-bold border border-emerald-500/30 shrink-0">
                      PRO VISION
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                    Gemini will read handwritten notes, past papers, or diagrams.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setAttachedImage(null);
                  setImageFileName(null);
                }}
                className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-[#32424b] text-slate-400 hover:text-rose-500 transition-colors cursor-pointer shrink-0"
                title="Remove Image"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Main Rounded Input Box & Actions */}
          <div className="flex items-end gap-2">
            <form
              onSubmit={handleSubmit}
              className="flex-1 flex items-end gap-2 px-3 py-1.5 rounded-3xl bg-white dark:bg-[#2a3942] border border-slate-300/70 dark:border-transparent shadow-xs focus-within:ring-2 focus-within:ring-[#00a884]/30 transition-all"
            >
              {/* Pro Image / Vision Attachment Button */}
              <div className="relative flex items-center shrink-0 self-center pb-0.5">
                <button
                  type="button"
                  onClick={handleImageButtonClick}
                  className={`p-1.5 rounded-full transition-all flex items-center justify-center cursor-pointer ${
                    attachedImage
                      ? 'bg-emerald-500 text-white shadow-xs'
                      : isPaid
                      ? 'text-slate-500 hover:text-[#00a884] hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-[#32424b]'
                      : 'text-amber-600 dark:text-amber-400 hover:bg-amber-500/10'
                  }`}
                  title={isPaid ? "Read image / diagram (Pro Vision)" : "Read Image (Pro Feature - Click to Upgrade)"}
                >
                  <Camera className="w-5 h-5" />
                </button>
                {!isPaid && (
                  <span
                    onClick={handleImageButtonClick}
                    className="absolute -top-1.5 -right-1 px-1 py-0.2 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-white font-black text-[8px] flex items-center gap-0.5 shadow-xs cursor-pointer tracking-tighter"
                    title="Pro Feature"
                  >
                    <Crown className="w-2 h-2" />
                    <span>PRO</span>
                  </span>
                )}
              </div>

              {/* Auto-growing Textarea */}
              <textarea
                id="tour-chat-input"
                ref={textareaRef}
                rows={1}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  attachedImage
                    ? "Ask a specific question about this image, or hit Send to transcribe & solve..."
                    : `Message ${activePersona.name} (English or Roman Urdu / Hinglish)...`
                }
                className="flex-1 max-h-36 py-1.5 px-1 bg-transparent text-sm text-[#111b21] dark:text-[#e9edef] placeholder:text-slate-400 dark:placeholder:text-slate-400 resize-none focus:outline-none leading-relaxed"
              />
            </form>

            {/* WhatsApp Signature Circular Green Send Button */}
            <button
              onClick={handleSubmit}
              type="button"
              disabled={(!inputText.trim() && !attachedImage) || isLoading}
              className="w-11 h-11 rounded-full bg-[#00a884] hover:bg-[#029676] active:scale-95 text-white disabled:opacity-40 disabled:pointer-events-none transition-all flex items-center justify-center shrink-0 shadow-sm cursor-pointer"
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

