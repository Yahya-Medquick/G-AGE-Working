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
  LockOpen,
  Crown,
  Loader2,
} from 'lucide-react';
import { ChatSession, ChatMessage, ChatMode, ConceptSpecs, ExamSpecs, ResearchSpecs } from '../../types/chat';
import { type PixelCrop } from 'react-image-crop';
import { ImageCropModal } from './ImageCropModal';
import { ExpertPersona } from '../../data/experts';
import { useUser } from '../../context/UserContext';
import { MarkdownRenderer } from '../MarkdownRenderer';
import { ProExpiryBadge } from '../ProExpiryBadge';
import { SpecificationsAccordion } from './SpecificationsAccordion';
import { MCQCard } from '../cards/MCQCard';
import { VideoCard } from '../cards/VideoCard';
import { NewsCard } from '../cards/NewsCard';
import { MultiLevelDefinitionCard } from '../MultiLevelDefinitionCard';
import { resolvePersonaIdentity } from '../../utils/resolvePersonaIdentity';
import { uiCopy } from '../../i18n/ui';

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


// ─── Research Mode: Papers Section ───────────────────────────────────────────
const ExplorePapersSection: React.FC<{
  topic: string;
  recency: ResearchSpecs['recency'];
  minCitations: ResearchSpecs['minCitations'];
}> = ({ topic, recency, minCitations }) => {
  const [papers, setPapers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    const params = new URLSearchParams({ q: topic, recency, minCitations });
    fetch(`/api/explore/papers?${params.toString()}`)
      .then(r => r.json())
      .then(data => { if (isMounted) setPapers(data.papers || []); })
      .catch(err => console.error("Papers error:", err))
      .finally(() => { if (isMounted) setLoading(false); });
    return () => { isMounted = false; };
  }, [topic, recency, minCitations]);

  if (loading) return (
    <div className="py-6 text-center text-xs text-slate-500 dark:text-slate-400 flex items-center justify-center gap-2">
      <div className="w-3 h-3 rounded-full bg-violet-500 animate-ping" />
      <span>Fetching research papers for {topic}...</span>
    </div>
  );
  if (!papers.length) return <p className="text-center text-xs text-slate-400 py-4">No papers found.</p>;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200 mb-2">
        <BookOpen className="w-4 h-4 text-violet-500" />
        Research Papers ({topic})
      </div>
      {papers.map((p: any) => (
        <a key={p.id} href={p.url} target="_blank" rel="noopener noreferrer"
          className="block p-3 rounded-xl bg-slate-50 dark:bg-[#111b21] border border-slate-200/80 dark:border-[#2a3942] hover:border-violet-400/50 dark:hover:border-violet-500/40 transition-all group">
          <div className="flex items-start justify-between gap-2">
            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 group-hover:text-violet-600 dark:group-hover:text-violet-400 line-clamp-2 leading-snug">
              {p.title}
            </p>
            <ExternalLink className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" />
          </div>
          <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-slate-500 dark:text-slate-400">
            {p.authors.length > 0 && <span>{p.authors.join(', ')}{p.authors.length === 3 ? ' et al.' : ''}</span>}
            {p.year && <span>{p.year}</span>}
            {p.journal && <span className="italic truncate max-w-[160px]">{p.journal}</span>}
            {p.citations > 0 && <span className="text-violet-500 font-medium">{p.citations.toLocaleString()} citations</span>}
            {p.isOpenAccess && <span className="text-emerald-500 font-semibold">Open Access</span>}
          </div>
        </a>
      ))}
    </div>
  );
};

// ─── Research Mode: GitHub Repos Section ─────────────────────────────────────
const ExploreReposSection: React.FC<{ topic: string }> = ({ topic }) => {
  const [repos, setRepos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    fetch(`/api/explore/repos?q=${encodeURIComponent(topic)}`)
      .then(r => r.json())
      .then(data => { if (isMounted) setRepos(data.repos || []); })
      .catch(err => console.error("Repos error:", err))
      .finally(() => { if (isMounted) setLoading(false); });
    return () => { isMounted = false; };
  }, [topic]);

  if (loading) return (
    <div className="py-6 text-center text-xs text-slate-500 dark:text-slate-400 flex items-center justify-center gap-2">
      <div className="w-3 h-3 rounded-full bg-slate-500 animate-ping" />
      <span>Finding open source repos for {topic}...</span>
    </div>
  );
  if (!repos.length) return <p className="text-center text-xs text-slate-400 py-4">No repositories found.</p>;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200 mb-2">
        <Code2 className="w-4 h-4 text-slate-600 dark:text-slate-300" />
        Open Source Repos ({topic})
      </div>
      {repos.map((r: any) => (
        <a key={r.id} href={r.url} target="_blank" rel="noopener noreferrer"
          className="block p-3 rounded-xl bg-slate-50 dark:bg-[#111b21] border border-slate-200/80 dark:border-[#2a3942] hover:border-slate-400/50 dark:hover:border-slate-500/40 transition-all group">
          <div className="flex items-start justify-between gap-2">
            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 group-hover:text-[#00a884] dark:group-hover:text-[#25d366] truncate">
              {r.name}
            </p>
            <div className="flex items-center gap-1 text-[10px] text-amber-500 font-semibold shrink-0">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              {r.stars.toLocaleString()}
            </div>
          </div>
          {r.description && <p className="mt-1 text-[10px] text-slate-500 dark:text-slate-400 line-clamp-2">{r.description}</p>}
          <div className="mt-1.5 flex flex-wrap gap-1">
            {r.language && <span className="px-1.5 py-0.5 rounded-md bg-slate-200 dark:bg-[#2a3942] text-[10px] text-slate-600 dark:text-slate-300">{r.language}</span>}
            {r.topics.map((t: string) => <span key={t} className="px-1.5 py-0.5 rounded-md bg-[#00a884]/10 dark:bg-[#25d366]/10 text-[10px] text-[#00a884] dark:text-[#25d366]">{t}</span>)}
          </div>
        </a>
      ))}
    </div>
  );
};

// ─── Research Mode: Research News Section ────────────────────────────────────
const ExploreResearchNewsSection: React.FC<{
  topic: string;
  recency: ResearchSpecs['recency'];
}> = ({ topic, recency }) => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    const params = new URLSearchParams({ q: topic, recency });
    fetch(`/api/explore/research-news?${params.toString()}`)
      .then(r => r.json())
      .then(data => { if (isMounted) setItems(data.items || []); })
      .catch(err => console.error("Research news error:", err))
      .finally(() => { if (isMounted) setLoading(false); });
    return () => { isMounted = false; };
  }, [topic, recency]);

  if (loading) return (
    <div className="py-6 text-center text-xs text-slate-500 dark:text-slate-400 flex items-center justify-center gap-2">
      <div className="w-3 h-3 rounded-full bg-blue-500 animate-ping" />
      <span>Loading recent research news for {topic}...</span>
    </div>
  );
  if (!items.length) return <p className="text-center text-xs text-slate-400 py-4">No recent research found.</p>;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200 mb-2">
        <Newspaper className="w-4 h-4 text-blue-500" />
        Recent Research ({topic})
      </div>
      {items.map((item: any) => (
        <a key={item.id} href={item.url} target="_blank" rel="noopener noreferrer"
          className="block p-3 rounded-xl bg-slate-50 dark:bg-[#111b21] border border-slate-200/80 dark:border-[#2a3942] hover:border-blue-400/50 dark:hover:border-blue-500/40 transition-all group">
          <div className="flex items-start justify-between gap-2">
            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 line-clamp-2 leading-snug">
              {item.title}
            </p>
            <ExternalLink className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" />
          </div>
          <div className="mt-1 flex flex-wrap gap-x-3 text-[10px] text-slate-500 dark:text-slate-400">
            {item.authors.length > 0 && <span>{item.authors.join(', ')}</span>}
            {item.year && <span>{item.year}</span>}
            {item.journal && <span className="italic">{item.journal}</span>}
          </div>
        </a>
      ))}
    </div>
  );
};

interface ChatStageProps {
  session: ChatSession | null;
  activePersona: ExpertPersona;
  variant: 'global' | 'pk';
  globalPersonas: Record<string, ExpertPersona>;
  pkPersonas: Record<string, ExpertPersona>;
  language?: 'english' | 'roman-urdu' | 'urdu';
  isStreamingReply?: boolean;
  onLanguageChange?: (lang: 'english' | 'roman-urdu' | 'urdu') => void;
  onSendMessage: (content: string, modeOverride?: ChatMode, images?: string[], savePublic?: boolean) => Promise<void>;
  onRegenerateMessage: (assistantId: string, userMessageIndex: number) => void;
  onEditMessage: (messageId: string, content: string, images: string[]) => Promise<boolean>;
  pendingReplyMessageIds: Set<string>;
  isLoading: boolean;
  onToggleLeftPanel: () => void;
  isLeftPanelOpen: boolean;
  onToggleRightPanel: () => void;
  isRightPanelOpen: boolean;
  onUpdateSessionMeta: (sessionId: string, updates: Partial<Pick<ChatSession, 'mode' | 'personaId' | 'variant' | 'specs' | 'title'>>) => void;
  onSaveToNotes: (content: string, title?: string) => void;
  onOpenPaywall: () => void;
  onOpenPersonaGroup?: (groupName: string) => void;
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
  globalPersonas,
  pkPersonas,
  language = 'english',
  isStreamingReply = false,
  onLanguageChange,
  onSendMessage,
  onRegenerateMessage,
  onEditMessage,
  pendingReplyMessageIds,
  isLoading,
  onToggleLeftPanel,
  isLeftPanelOpen,
  onToggleRightPanel,
  isRightPanelOpen,
  onUpdateSessionMeta,
  onSaveToNotes,
  onOpenPaywall,
  onOpenPersonaGroup,
  onOpenKnowledgeGraph,
  queryUsage,
}) => {
  const { user } = useUser();
  const isPaid = queryUsage.tier === 'paid' || user?.tier === 'paid' || user?.tier === 'pro' || user?.tier === 'unlimited';

  const [inputText, setInputText] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [attachedImages, setAttachedImages] = useState<string[]>([]);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [editImages, setEditImages] = useState<string[]>([]);
  const [cropSource, setCropSource] = useState<string | null>(null);
  const [imageNotice, setImageNotice] = useState('');
  const [isImageProcessing, setIsImageProcessing] = useState(false);
  const imageQueueRef = useRef<File[]>([]);
  const cropProcessingRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [isSpecsOpen, setIsSpecsOpen] = useState(false);
  const [showMCQCard, setShowMCQCard] = useState<boolean>(false);
  const [showModeSwitcher, setShowModeSwitcher] = useState(false);
  const [showLangSwitcher, setShowLangSwitcher] = useState(false);
  const [showDefinitionCard, setShowDefinitionCard] = useState<boolean>(false);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);
  const [savedNotesMsgId, setSavedNotesMsgId] = useState<string | null>(null);
  const [revealedSolutions, setRevealedSolutions] = useState<Record<string, boolean>>({});
  const [activeLevelTabs, setActiveLevelTabs] = useState<Record<string, 'eli5' | 'highSchool' | 'undergrad' | 'phd'>>({});
  const [expandedExploreMsgIds, setExpandedExploreMsgIds] = useState<Record<string, boolean>>({});
  const [activeExploreMsgId, setActiveExploreMsgId] = useState<string | null>(null);
  const [activeExploreTab, setActiveExploreTab] = useState<'videos' | 'news' | 'mcqs' | 'papers' | 'repos' | 'research-news' | null>(null);
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

  useEffect(() => {
    if (!showModeSwitcher) return;
    const close = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-mode-switcher]')) {
        setShowModeSwitcher(false);
      }
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [showModeSwitcher]);

  useEffect(() => {
    if (!showLangSwitcher) return;
    const close = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-lang-switcher]')) {
        setShowLangSwitcher(false);
      }
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [showLangSwitcher]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const compressImage = (source: string, crop?: PixelCrop) => new Promise<string>((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const sourceX = crop ? Math.max(0, crop.x) : 0;
      const sourceY = crop ? Math.max(0, crop.y) : 0;
      const sourceWidth = crop ? Math.min(crop.width, image.naturalWidth - sourceX) : image.naturalWidth;
      const sourceHeight = crop ? Math.min(crop.height, image.naturalHeight - sourceY) : image.naturalHeight;
      const scale = Math.min(1, 1600 / Math.max(sourceWidth, sourceHeight));
      const width = Math.max(1, Math.round(sourceWidth * scale));
      const height = Math.max(1, Math.round(sourceHeight * scale));
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext('2d');
      if (!context) {
        reject(new Error('Canvas is unavailable'));
        return;
      }
      context.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', 0.8).split(',')[1]);
    };
    image.onerror = () => reject(new Error('Image could not be decoded'));
    image.src = source;
  });

  const readNextImageForCrop = (file?: File) => {
    if (!file) {
      cropProcessingRef.current = false;
      setIsImageProcessing(false);
      setCropSource(null);
      return;
    }
    cropProcessingRef.current = true;
    setIsImageProcessing(true);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setCropSource(reader.result);
      } else {
        setImageNotice('This image could not be opened.');
        readNextImageForCrop(imageQueueRef.current.shift());
      }
    };
    reader.onerror = () => {
      setImageNotice('This image could not be opened.');
      readNextImageForCrop(imageQueueRef.current.shift());
    };
    reader.readAsDataURL(file);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    e.target.value = '';
    const validFiles = selectedFiles.filter((file) => file.type.startsWith('image/'));
    const activeImages = editingMessageId ? editImages : attachedImages;
    const slots = Math.max(0, 4 - activeImages.length - imageQueueRef.current.length - Number(cropProcessingRef.current));
    if (validFiles.length > slots) setImageNotice('You can attach up to 4 images per message.');
    if (validFiles.length < selectedFiles.length) setImageNotice('Please select image files only.');
    const acceptedFiles = validFiles.slice(0, slots);
    imageQueueRef.current.push(...acceptedFiles);
    if (!cropProcessingRef.current && imageQueueRef.current.length > 0) {
      readNextImageForCrop(imageQueueRef.current.shift());
    }
  };

  const finishImageCrop = async (crop?: PixelCrop) => {
    if (!cropSource) return;
    const source = cropSource;
    setCropSource(null);
    try {
      if (crop) {
        const compressed = await compressImage(source, crop);
        if (editingMessageId) setEditImages((current) => current.length < 4 ? [...current, compressed] : current);
        else setAttachedImages((current) => current.length < 4 ? [...current, compressed] : current);
        setImageNotice('');
      } else if (crop === undefined && source) {
        const compressed = await compressImage(source);
        if (editingMessageId) setEditImages((current) => current.length < 4 ? [...current, compressed] : current);
        else setAttachedImages((current) => current.length < 4 ? [...current, compressed] : current);
        setImageNotice('');
      }
    } catch {
      setImageNotice('This image could not be processed. Please try another image.');
    }
    readNextImageForCrop(imageQueueRef.current.shift());
  };

  const cancelCurrentImage = () => {
    setCropSource(null);
    readNextImageForCrop(imageQueueRef.current.shift());
  };

  const handleImageButtonClick = (source: 'files' | 'camera') => {
    if (!isPaid) {
      onOpenPaywall();
      return;
    }
    (source === 'files' ? fileInputRef : cameraInputRef).current?.click();
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (editingMessageId || (!inputText.trim() && attachedImages.length === 0) || isLoading || isImageProcessing) return;
    const msg = inputText.trim();
    const images = attachedImages;
    const savePublic = !isPrivate;
    setInputText('');
    setAttachedImages([]);
    setIsPrivate(false);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    await onSendMessage(msg, activeMode, images.length ? images : undefined, savePublic);
  };

  const startEditMessage = (message: ChatMessage, images: string[]) => {
    if (isLoading || isImageProcessing || editingMessageId) return;
    setEditingMessageId(message.id);
    setEditText(message.content);
    setEditImages(images);
    setImageNotice('');
  };

  const cancelEditMessage = () => {
    if (isImageProcessing) return;
    setEditingMessageId(null);
    setEditText('');
    setEditImages([]);
    setImageNotice('');
  };

  const saveEditMessage = async (messageId: string) => {
    if (!editText.trim() && editImages.length === 0) return;
    if (isLoading || isImageProcessing) return;
    await onEditMessage(messageId, editText, editImages);
    setEditingMessageId(null);
    setEditText('');
    setEditImages([]);
    setImageNotice('');
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

  const handleToggleExploreTab = (
    msgId: string,
    tab: 'videos' | 'news' | 'mcqs' | 'papers' | 'repos' | 'research-news'
  ) => {
    if (activeExploreMsgId === msgId && activeExploreTab === tab) {
      setActiveExploreMsgId(null);
      setActiveExploreTab(null);
    } else {
      setActiveExploreMsgId(msgId);
      setActiveExploreTab(tab);
    }
  };

  const currentTopic = session?.title && session.title !== 'New Consultation' ? session.title : 'this topic';
  const isWelcomeHero = session?.messages.length === 1 && session.messages[0].role === 'assistant';
  const welcomeSuggestions = session?.starterTopics?.filter((topic) => topic.trim()).slice(0, 4) || [
    uiCopy(language, 'explainSomething'),
    uiCopy(language, 'helpMeStudy'),
    uiCopy(language, 'writeSomething'),
    uiCopy(language, 'analyzeSomething'),
  ];
  const activeModeLabel = activeMode === 'concept'
    ? uiCopy(language, 'modeConcept')
    : activeMode === 'exam'
      ? uiCopy(language, 'modeExam')
      : uiCopy(language, 'modeResearch');

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
          {/* Mode Switcher — single dropdown button */}
          <div className="relative" data-mode-switcher>
            <button
              onClick={() => setShowModeSwitcher(!showModeSwitcher)}
              className="px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer bg-white dark:bg-[#202c33] border border-slate-300 dark:border-[#2a3942] text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#2a3942] shadow-xs"
              title="Switch Mode"
            >
              {activeMode === 'concept' && <Lightbulb className="w-3.5 h-3.5 text-[#00a884]" />}
              {activeMode === 'exam' && <GraduationCap className="w-3.5 h-3.5 text-amber-500" />}
              {activeMode === 'research' && <BookOpen className="w-3.5 h-3.5 text-cyan-500" />}
              <span className="hidden sm:inline capitalize">{activeMode}</span>
              <ChevronDown className="w-3 h-3 opacity-60" />
            </button>

            {showModeSwitcher && (
              <div className="absolute top-full left-0 mt-1 z-50 bg-white dark:bg-[#202c33] border border-slate-200 dark:border-[#2a3942] rounded-xl shadow-lg overflow-hidden min-w-[140px]">
                {[
                  { mode: 'concept' as ChatMode, icon: <Lightbulb className="w-3.5 h-3.5 text-[#00a884]" />, label: 'Concept', desc: 'Deep understanding' },
                  { mode: 'exam' as ChatMode, icon: <GraduationCap className="w-3.5 h-3.5 text-amber-500" />, label: 'Exam', desc: 'Practice & problems' },
                  { mode: 'research' as ChatMode, icon: <BookOpen className="w-3.5 h-3.5 text-cyan-500" />, label: 'Research', desc: 'Papers & citations' },
                ].map(({ mode, icon, label, desc }) => (
                  <button
                    key={mode}
                    onClick={() => { handleModeChange(mode); setShowModeSwitcher(false); }}
                    className={`w-full px-3 py-2 flex items-center gap-2 text-left text-xs transition-colors cursor-pointer
                      ${activeMode === mode
                        ? 'bg-[#00a884]/10 dark:bg-[#25d366]/10 text-[#00a884] dark:text-[#25d366]'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#2a3942]'
                      }`}
                  >
                    {icon}
                    <div>
                      <div className="font-bold">{label}</div>
                      <div className="text-[10px] opacity-60">{desc}</div>
                    </div>
                    {activeMode === mode && <CheckCircle2 className="w-3 h-3 ml-auto" />}
                  </button>
                ))}
                <div className="border-t border-slate-100 dark:border-[#2a3942] px-3 py-2 flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500 cursor-not-allowed">
                  <Compass className="w-3.5 h-3.5" />
                  <div>
                    <div className="font-bold text-slate-500">Courses</div>
                    <div className="text-[10px]">Coming soon</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Language Switcher */}
          <div className="relative" data-lang-switcher>
            <button
              onClick={() => setShowLangSwitcher(!showLangSwitcher)}
              className="px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer bg-white dark:bg-[#202c33] border border-slate-300 dark:border-[#2a3942] text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#2a3942] shadow-xs"
              title="Switch Response Language"
            >
              <span className="text-[11px]">
                {language === 'english' ? '🇬🇧 EN' : language === 'roman-urdu' ? '🇵🇰 UR' : '🇵🇰 اردو'}
              </span>
              <ChevronDown className="w-3 h-3 opacity-60" />
            </button>

            {showLangSwitcher && (
              <div className="absolute top-full right-0 mt-1 z-50 bg-white dark:bg-[#202c33] border border-slate-200 dark:border-[#2a3942] rounded-xl shadow-lg overflow-hidden min-w-[160px]">
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
                    className={`w-full px-3 py-2 flex items-center gap-2 text-left text-xs transition-colors cursor-pointer
                      ${language === lang
                        ? 'bg-[#00a884]/10 dark:bg-[#25d366]/10 text-[#00a884] dark:text-[#25d366]'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#2a3942]'
                      }`}
                  >
                    <span>{flag}</span>
                    <div>
                      <div className="font-bold">{label}</div>
                      <div className="text-[10px] opacity-60">{desc}</div>
                    </div>
                    {language === lang && <CheckCircle2 className="w-3 h-3 ml-auto" />}
                  </button>
                ))}
              </div>
            )}
          </div>

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
          {isPaid && <ProExpiryBadge />}

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

        {!isWelcomeHero && (
          <div className="flex justify-center my-2">
            <div className="rounded-pill bg-surface px-3 py-1 text-xs font-medium text-muted shadow-lift">
              {activePersona.name} · {activeModeLabel}
            </div>
          </div>
        )}

        {isWelcomeHero && (
          <section className="mx-auto flex w-full max-w-3xl flex-col items-center gap-5 py-8 text-center sm:py-12">
            <div className="flex items-center gap-2 text-sm text-muted">
              <span
                className="flex h-8 w-8 items-center justify-center rounded-pill bg-accent-soft text-xs font-semibold text-accent-text"
                aria-hidden="true"
              >
                {activePersona.initials || 'GA'}
              </span>
              <span>{activePersona.name} · {activeModeLabel}</span>
            </div>
            <h1 className="text-2xl font-semibold leading-tight text-text sm:text-3xl">
              {uiCopy(language, 'welcomeHeroTitle')}
            </h1>
            <div className="flex max-w-2xl flex-wrap justify-center gap-2">
              {welcomeSuggestions.map((suggestion, index) => (
                <button
                  key={`${suggestion}-${index}`}
                  type="button"
                  onClick={() => {
                    setInputText(suggestion);
                    requestAnimationFrame(() => textareaRef.current?.focus());
                  }}
                  className="min-h-11 max-w-full break-words rounded-pill border border-border bg-surface px-4 py-2 text-sm text-text transition-colors hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Render messages, omitting the persona opener while the welcome hero is active */}
        {session?.messages.map((msg, idx) => {
          if (isWelcomeHero && idx === 0) return null;
          const isAssistant = msg.role === 'assistant';
          const messageImages = msg.images?.length ? msg.images : msg.imageBase64 ? [msg.imageBase64] : [];
          const latestAssistantIndex = session.messages.reduce(
            (latestIndex, message, index) => message.role === 'assistant' ? index : latestIndex,
            -1
          );
          const isLatestTurnStart = idx === Math.max(0, (session?.messages.length || 0) - (isLoading ? 1 : 2));
          const savedPersona = resolvePersonaIdentity(
            msg,
            session?.variant || variant,
            globalPersonas,
            pkPersonas,
          );
          const msgPersona = isAssistant ? {
            name: savedPersona.name,
            initials: savedPersona.initials,
            avatar_color: savedPersona.avatarColor,
            group_name: savedPersona.groupName,
          } : null;

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
                    {pendingReplyMessageIds.has(msg.id) && (
                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-300" role="status">
                        <span className="flex items-center gap-1">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#00a884] animate-bounce" />
                          <span className="h-1.5 w-1.5 rounded-full bg-[#00a884] animate-bounce [animation-delay:0.15s]" />
                          <span className="h-1.5 w-1.5 rounded-full bg-[#00a884] animate-bounce [animation-delay:0.3s]" />
                        </span>
                        Regenerating response...
                      </div>
                    )}
                    {(() => {
                      const cleanContent = msg.content.replace(/\[\[SUGGEST_GROUP:[^\]]*\]\]/g, '').trim();
                      const suggestedGroup = msg.metadata?.suggestedGroup;
                      const isActiveGroup = suggestedGroup?.trim().toLocaleLowerCase()
                        === msgPersona?.group_name.trim().toLocaleLowerCase();
                      return (
                        <>
                          <MarkdownRenderer content={cleanContent} isStreaming={isStreamingReply && idx === session?.messages.length - 1} />
                          {suggestedGroup && !isActiveGroup && onOpenPersonaGroup && (
                            <div className="mt-3 flex flex-wrap items-center gap-2 p-2.5 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/80 dark:bg-indigo-950/40">
                              <span className="text-sm" aria-hidden="true">🎯</span>
                              <button
                                key={suggestedGroup}
                                onClick={() => onOpenPersonaGroup(suggestedGroup)}
                                className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold underline underline-offset-2 hover:text-indigo-800 dark:hover:text-indigo-200 cursor-pointer transition-colors"
                              >
                                Try the {suggestedGroup} specialists -&gt;
                              </button>
                            </div>
                          )}
                        </>
                      );
                    })()}

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

                    {msg.mode === 'research' && msg.metadata?.sources && (
                      <details className="mt-3 pt-3 border-t border-slate-100 dark:border-[#2a3942] group">
                        <summary className="flex items-center justify-between cursor-pointer list-none text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          <span>Sources</span>
                          <ChevronDown className="w-4 h-4 transition-transform group-open:rotate-180" />
                        </summary>
                        <div className="mt-2 space-y-2 text-xs">
                          {msg.metadata.sources.papers.length > 0 && (
                            <div className="space-y-1.5">
                              <div className="text-[10px] font-semibold uppercase text-slate-400">Academic Papers</div>
                              {msg.metadata.sources.papers.map((paper, paperIndex) => (
                                <a
                                  key={`source-paper-${paperIndex}`}
                                  href={paper.doi || undefined}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="flex items-start gap-2 text-slate-700 dark:text-slate-200 hover:text-[#00a884] dark:hover:text-[#25d366]"
                                >
                                  <ExternalLink className="w-3 h-3 mt-0.5 shrink-0" />
                                  <span>{paper.title} ({paper.year || 'n.d.'}) by {paper.author}</span>
                                </a>
                              ))}
                            </div>
                          )}
                          {msg.metadata.sources.wikipedia && (
                            <div>
                              <div className="text-[10px] font-semibold uppercase text-slate-400 mb-1">Wikipedia</div>
                              <a
                                href={msg.metadata.sources.wikipedia.url}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-2 text-slate-700 dark:text-slate-200 hover:text-[#00a884] dark:hover:text-[#25d366]"
                              >
                                <ExternalLink className="w-3 h-3 shrink-0" />
                                <span>{msg.metadata.sources.wikipedia.title}</span>
                              </a>
                            </div>
                          )}
                          {msg.metadata.sources.news.length > 0 && (
                            <div className="space-y-1.5">
                              <div className="text-[10px] font-semibold uppercase text-slate-400">Recent News</div>
                              {msg.metadata.sources.news.map((article, articleIndex) => (
                                <a
                                  key={`source-news-${articleIndex}`}
                                  href={article.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="flex items-start gap-2 text-slate-700 dark:text-slate-200 hover:text-[#00a884] dark:hover:text-[#25d366]"
                                >
                                  <ExternalLink className="w-3 h-3 mt-0.5 shrink-0" />
                                  <span>{article.title} <span className="text-slate-400">({article.source})</span></span>
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                      </details>
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
                                {activeMode === 'research' ? (
                                  <>
                                    {/* Research Mode Tab 1: Papers */}
                                    <button
                                      onClick={() => handleToggleExploreTab(msg.id, 'papers')}
                                      className={`p-2.5 rounded-xl border text-left transition-all group cursor-pointer space-y-1 ${
                                        activeExploreMsgId === msg.id && activeExploreTab === 'papers'
                                          ? 'border-violet-500 bg-violet-500/10 dark:bg-violet-500/20'
                                          : 'border-slate-200/80 dark:border-[#2a3942] bg-slate-50 dark:bg-[#111b21] hover:bg-slate-100 dark:hover:bg-[#202c33]'
                                      }`}
                                    >
                                      <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-violet-600 dark:group-hover:text-violet-400 flex items-center gap-1.5">
                                          <BookOpen className="w-3.5 h-3.5 text-violet-500" />
                                          Research Papers
                                        </span>
                                        <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-violet-500" />
                                      </div>
                                      <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1">
                                        OpenAlex open access papers
                                      </p>
                                    </button>

                                    {/* Research Mode Tab 2: Repos */}
                                    <button
                                      onClick={() => handleToggleExploreTab(msg.id, 'repos')}
                                      className={`p-2.5 rounded-xl border text-left transition-all group cursor-pointer space-y-1 ${
                                        activeExploreMsgId === msg.id && activeExploreTab === 'repos'
                                          ? 'border-[#00a884] bg-[#00a884]/10 dark:bg-[#00a884]/20'
                                          : 'border-slate-200/80 dark:border-[#2a3942] bg-slate-50 dark:bg-[#111b21] hover:bg-slate-100 dark:hover:bg-[#202c33]'
                                      }`}
                                    >
                                      <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-[#00a884] dark:group-hover:text-[#25d366] flex items-center gap-1.5">
                                          <Code2 className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
                                          Open Source
                                        </span>
                                        <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-[#00a884]" />
                                      </div>
                                      <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1">
                                        GitHub repos by topic
                                      </p>
                                    </button>

                                    {/* Research Mode Tab 3: Research News */}
                                    <button
                                      onClick={() => handleToggleExploreTab(msg.id, 'research-news')}
                                      className={`p-2.5 rounded-xl border text-left transition-all group cursor-pointer space-y-1 ${
                                        activeExploreMsgId === msg.id && activeExploreTab === 'research-news'
                                          ? 'border-blue-500 bg-blue-500/10 dark:bg-blue-500/20'
                                          : 'border-slate-200/80 dark:border-[#2a3942] bg-slate-50 dark:bg-[#111b21] hover:bg-slate-100 dark:hover:bg-[#202c33]'
                                      }`}
                                    >
                                      <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 flex items-center gap-1.5">
                                          <Newspaper className="w-3.5 h-3.5 text-blue-500" />
                                          Recent Research
                                        </span>
                                        <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-blue-500" />
                                      </div>
                                      <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1">
                                        Latest publications & updates
                                      </p>
                                    </button>
                                  </>
                                ) : (
                                  <>
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

                                    {/* 3. Practice MCQs */}
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
                                  </>
                                )}
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

                                  {activeMode === 'research' ? (
                                    <>
                                      {activeExploreTab === 'papers' && (
                                        <ExplorePapersSection
                                          topic={targetTopic}
                                          recency={session?.specs?.research?.recency || '5_years'}
                                          minCitations={session?.specs?.research?.minCitations || 'any'}
                                        />
                                      )}
                                      {activeExploreTab === 'repos' && <ExploreReposSection topic={targetTopic} />}
                                      {activeExploreTab === 'research-news' && (
                                        <ExploreResearchNewsSection
                                          topic={targetTopic}
                                          recency={session?.specs?.research?.recency || '5_years'}
                                        />
                                      )}
                                    </>
                                  ) : (
                                    <>
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
                                    </>
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
                    {editingMessageId === msg.id ? (
                      <div className="min-w-[min(80vw,28rem)] space-y-2">
                        <textarea
                          value={editText}
                          onChange={(event) => setEditText(event.target.value)}
                          disabled={isLoading || isImageProcessing}
                          rows={3}
                          className="w-full resize-y rounded-md border border-emerald-600/40 bg-white p-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500/30 dark:bg-slate-900 dark:text-slate-100"
                          aria-label="Edit your message"
                        />
                        {editImages.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {editImages.map((image, imageIndex) => (
                              <div key={imageIndex} className="relative h-14 w-14">
                                <img src={image.startsWith('data:') ? image : `data:image/jpeg;base64,${image}`} alt={`Edit attachment ${imageIndex + 1}`} className="h-full w-full rounded-md object-cover" />
                                <button type="button" onClick={() => setEditImages((current) => current.filter((_, index) => index !== imageIndex))} disabled={isLoading || isImageProcessing} className="absolute -right-1 -top-1 rounded-full bg-slate-800 p-0.5 text-white disabled:opacity-40" aria-label={`Remove image ${imageIndex + 1}`}>
                                  <X className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                        <div className="flex flex-wrap items-center justify-end gap-2">
                          <span className="mr-auto text-[10px] text-slate-500">{editImages.length}/4 images</span>
                          <button type="button" onClick={() => handleImageButtonClick('files')} disabled={!isPaid || isLoading || isImageProcessing || editImages.length >= 4} className="rounded-md border border-slate-300 px-2 py-1 text-xs disabled:opacity-40 dark:border-slate-600" title="Add images">
                            <Paperclip className="inline h-3.5 w-3.5" /> Add images
                          </button>
                          <button type="button" onClick={() => handleImageButtonClick('camera')} disabled={!isPaid || isLoading || isImageProcessing || editImages.length >= 4} className="rounded-md border border-slate-300 px-2 py-1 text-xs disabled:opacity-40 dark:border-slate-600" title="Take a photo">
                            <Camera className="inline h-3.5 w-3.5" /> Photo
                          </button>
                          <button type="button" onClick={cancelEditMessage} disabled={isLoading || isImageProcessing} className="rounded-md px-2 py-1 text-xs text-slate-600 disabled:opacity-40 dark:text-slate-300">Cancel</button>
                          <button type="button" onClick={() => void saveEditMessage(msg.id)} disabled={isLoading || isImageProcessing || (!editText.trim() && editImages.length === 0)} className="rounded-md bg-emerald-600 px-3 py-1 text-xs font-semibold text-white disabled:opacity-40">Save</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {messageImages.length > 0 && (
                          <div className="mb-2.5 flex flex-wrap gap-2">
                            {messageImages.map((image, imageIndex) => (
                              <div key={imageIndex} className="h-20 w-20 overflow-hidden rounded-xl border border-emerald-500/30 bg-black/5 shadow-xs dark:border-emerald-400/20 dark:bg-black/20">
                                <img
                                  src={image.startsWith('data:') ? image : `data:image/jpeg;base64,${image}`}
                                  alt={`Attached diagram or notes ${imageIndex + 1}`}
                                  className="h-full w-full rounded-xl object-cover"
                                />
                              </div>
                            ))}
                          </div>
                        )}
                        <div className="whitespace-pre-wrap">{msg.content}</div>
                        <div className="mt-1 flex items-center justify-end gap-1 text-[10px] font-medium text-[#54656f] dark:text-emerald-200/80">
                          {msg.edited && <span className="mr-auto text-slate-500 dark:text-slate-300">edited</span>}
                          <span>{msg.timestamp}</span>
                          <CheckCheck className="h-3.5 w-3.5 text-[#53bdeb]" />
                          {!isLoading && (
                            <button type="button" onClick={() => startEditMessage(msg, messageImages)} disabled={!!editingMessageId || isImageProcessing} className="ml-1 rounded p-1 text-slate-500 hover:bg-black/5 hover:text-slate-800 disabled:opacity-40 dark:text-slate-300 dark:hover:bg-white/10" title="Edit message" aria-label="Edit message">
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </>
                    )}
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

                    {idx === latestAssistantIndex && (
                      <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          let userMessageIndex = -1;
                          for (let messageIndex = idx - 1; messageIndex >= 0; messageIndex -= 1) {
                            if (session?.messages[messageIndex]?.role === 'user') {
                              userMessageIndex = messageIndex;
                              break;
                            }
                          }
                          if (userMessageIndex >= 0) onRegenerateMessage(msg.id, userMessageIndex);
                        }}
                        disabled={isLoading || pendingReplyMessageIds.has(msg.id)}
                        className="px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-[#111b21] hover:text-slate-800 dark:hover:text-slate-200 transition-colors flex items-center gap-1 text-[11px] font-medium cursor-pointer group disabled:opacity-40 disabled:pointer-events-none"
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
      <div className="px-2 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] sm:px-3 sm:pt-3 sm:pb-[calc(0.75rem+env(safe-area-inset-bottom))] border-t border-[#e9edef] dark:border-[#2a3942] bg-[#f0f2f5] dark:bg-[#202c33] shadow-md shrink-0 z-10">
        <div className="max-w-3xl mx-auto space-y-2">
          {/* Hidden File Input for Image Upload */}
          <input type="file" ref={fileInputRef} onChange={handleImageSelect} accept="image/*" multiple className="hidden" />
          <input type="file" ref={cameraInputRef} onChange={handleImageSelect} accept="image/*" capture="environment" className="hidden" />

          {/* Attached Image Preview Strip */}
          {attachedImages.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 rounded-xl border border-emerald-500/40 bg-white p-2 dark:bg-[#2a3942]">
              {attachedImages.map((image, index) => (
                <div key={`${index}-${image.slice(0, 12)}`} className="relative h-14 w-14">
                  <img
                    src={image.startsWith('data:') ? image : `data:image/jpeg;base64,${image}`}
                    alt={`Image attachment ${index + 1}`}
                    className="h-full w-full rounded-lg border border-emerald-500/30 object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setAttachedImages((current) => current.filter((_, imageIndex) => imageIndex !== index))}
                    className="absolute -right-1.5 -top-1.5 rounded-full bg-slate-800 p-0.5 text-white"
                    title="Remove image"
                    aria-label={`Remove image ${index + 1}`}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              <span className="text-xs text-slate-500 dark:text-slate-300">{attachedImages.length}/4 PRO VISION</span>
            </div>
          )}
          {imageNotice && <p role="status" className="text-xs text-rose-600 dark:text-rose-400">{imageNotice}</p>}

          {/* Main Rounded Input Box & Actions */}
          <div className="flex min-w-0 items-end gap-1.5">
            <form
              onSubmit={handleSubmit}
              className="min-w-0 flex-1 flex items-end gap-1.5 px-2 py-1 rounded-3xl bg-white dark:bg-[#2a3942] border border-slate-300/70 dark:border-transparent shadow-xs focus-within:ring-2 focus-within:ring-[#00a884]/30 transition-all"
            >
              {/* Pro Image / Vision Attachment Button */}
              <div className="relative flex shrink-0 self-end">
                <button
                  type="button"
                  onClick={() => handleImageButtonClick('files')}
                  className={`h-10 w-10 shrink-0 rounded-full transition-all flex items-center justify-center cursor-pointer ${
                    attachedImages.length > 0
                      ? 'bg-emerald-500 text-white shadow-xs'
                      : isPaid
                      ? 'text-slate-500 hover:text-[#00a884] hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-[#32424b]'
                      : 'text-amber-600 dark:text-amber-400 hover:bg-amber-500/10'
                  }`}
                  title={isPaid ? 'Choose images (Pro Vision)' : 'Choose images (Pro Feature - Click to Upgrade)'}
                >
                  <Paperclip className="w-5 h-5" />
                </button>
                {!isPaid && (
                  <span
                    onClick={() => handleImageButtonClick('files')}
                    className="absolute -top-1.5 -right-1 px-1 py-0.2 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-white font-black text-[8px] flex items-center gap-0.5 shadow-xs cursor-pointer tracking-tighter"
                    title="Pro Feature"
                  >
                    <Crown className="w-2 h-2" />
                    <span>PRO</span>
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => handleImageButtonClick('camera')}
                className="h-10 w-10 shrink-0 rounded-full flex items-center justify-center text-slate-500 hover:text-[#00a884] hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-[#32424b]"
                title={isPaid ? 'Take a photo (Pro Vision)' : 'Take a photo (Pro Feature)'}
                aria-label="Take a photo"
              >
                <Camera className="h-5 w-5" />
              </button>

              {/* Auto-growing Textarea */}
              <textarea
                id="tour-chat-input"
                ref={textareaRef}
                rows={1}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={!!editingMessageId || isLoading || isImageProcessing}
                placeholder={
                  attachedImages.length > 0
                    ? "Ask a specific question about this image, or hit Send to transcribe & solve..."
                    : `Message ${activePersona.name} (English or Roman Urdu / Hinglish)...`
                }
                className="min-w-0 flex-1 max-h-36 py-1.5 px-1 bg-transparent text-sm text-[#111b21] dark:text-[#e9edef] placeholder:text-slate-400 dark:placeholder:text-slate-400 resize-none focus:outline-none leading-relaxed"
                dir={language === 'urdu' ? 'rtl' : 'ltr'}
              />
            </form>

            <button
              onClick={() => setIsPrivate((value) => !value)}
              type="button"
              className={`mb-1 h-10 w-10 shrink-0 rounded-full border flex items-center justify-center transition-colors cursor-pointer ${
                isPrivate
                  ? 'bg-rose-100 border-rose-300 text-rose-600 dark:bg-rose-950/50 dark:border-rose-800 dark:text-rose-300'
                  : 'bg-white/80 border-slate-300 text-slate-500 dark:bg-[#202c33] dark:border-[#2a3942] dark:text-slate-300'
              }`}
              title={isPrivate ? 'Private question' : 'Public question'}
              aria-label={isPrivate ? 'Private question' : 'Public question'}
            >
              {isPrivate ? <Lock className="w-5 h-5" /> : <LockOpen className="w-5 h-5" />}
            </button>

            {/* WhatsApp Signature Circular Green Send Button */}
            <button
              onClick={handleSubmit}
              type="button"
              disabled={(!inputText.trim() && attachedImages.length === 0) || isLoading || isImageProcessing || !!editingMessageId}
              className="mb-1 h-10 w-10 shrink-0 rounded-full bg-[#00a884] hover:bg-[#029676] active:scale-95 text-white disabled:opacity-40 disabled:pointer-events-none transition-all flex items-center justify-center shadow-sm cursor-pointer"
              title="Send Message (Enter)"
            >
              <Send className="w-5 h-5 ml-0.5" />
            </button>
          </div>
        </div>
      </div>
      {cropSource && (
        <ImageCropModal
          src={cropSource}
          onUseCrop={(crop) => void finishImageCrop(crop)}
          onUseFullImage={() => void finishImageCrop()}
          onCancel={cancelCurrentImage}
        />
      )}
    </div>
  );
};
