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
  Flag,
  Zap,
  ArrowRight,
  Code2,
  Atom,
  Eye,
  EyeOff,
  Star,
  CheckCircle2,
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
  Plus,
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
import { SegmentedControl } from '../ui/SegmentedControl';
import { getWhatsAppSupportUrl } from '../../utils/support';

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
  const replyActionClass = 'inline-flex min-h-11 items-center gap-2 rounded-control px-2.5 text-xs text-muted transition-colors hover:bg-surface-2 hover:text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent';
  const { user } = useUser();
  const isPaid = queryUsage.tier === 'paid' || user?.tier === 'paid' || user?.tier === 'pro' || user?.tier === 'unlimited';

  const [inputText, setInputText] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [attachedImages, setAttachedImages] = useState<string[]>([]);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
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
  const [showLangSwitcher, setShowLangSwitcher] = useState(false);
  const [showDefinitionCard, setShowDefinitionCard] = useState<boolean>(false);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);
  const [savedNotesMsgId, setSavedNotesMsgId] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<{ messageId: string; text: string } | null>(null);
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
      const maxHeight = window.innerHeight * 0.4;
      textareaRef.current.style.maxHeight = '40dvh';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, maxHeight)}px`;
      textareaRef.current.style.overflowY = textareaRef.current.scrollHeight > maxHeight ? 'auto' : 'hidden';
    }
  }, [inputText]);

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
    if (e.key === 'Enter' && !e.shiftKey && window.matchMedia('(min-width: 768px)').matches && !e.nativeEvent.isComposing) {
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

  const handleCopyMessage = async (msgId: string, content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setActionNotice(null);
      setCopiedMsgId(msgId);
      setTimeout(() => setCopiedMsgId(null), 2000);
    } catch (error) {
      console.error('Could not copy assistant response', error);
      setActionNotice({ messageId: msgId, text: uiCopy(language, 'copyFailed') });
    }
  };

  const handleShareMessage = async (msgId: string, content: string) => {
    setActionNotice(null);
    if (navigator.share) {
      try {
        await navigator.share({ title: session?.title || activePersona.name, text: content });
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        console.error('Could not share assistant response', error);
        setActionNotice({ messageId: msgId, text: uiCopy(language, 'shareFailed') });
        return;
      }
    }
    await handleCopyMessage(msgId, content);
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
  const reportSupportUrl = getWhatsAppSupportUrl(uiCopy(language, 'reportSupportMessage'));

  return (
    <div className="flex h-full min-w-0 flex-1 flex-col overflow-hidden bg-bg text-text">
      <header className="sticky top-0 z-sticky flex shrink-0 flex-col gap-2 border-b border-border bg-surface px-3 pb-2 pt-[calc(0.5rem+env(safe-area-inset-top))] text-text sm:flex-row sm:items-center sm:justify-between sm:px-4">
        {/* Left Section: Back/Sidebar Toggle & Active Group Profile */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {!isLeftPanelOpen && (
            <button
              onClick={onToggleLeftPanel}
              className="flex h-11 w-11 items-center justify-center rounded-pill text-muted transition-colors hover:bg-surface-2 hover:text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              aria-label="Open recent chats"
              title="Open Chat Sessions"
            >
              <PanelLeft className="w-5 h-5" />
            </button>
          )}

          {/* WhatsApp Group / Contact Profile Pill */}
          <button
            type="button"
            id="tour-persona-toggle"
            onClick={onToggleRightPanel}
            className="flex min-h-11 min-w-0 items-center gap-2.5 text-start transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            aria-label={`Choose a teacher. Current teacher: ${activePersona.name}`}
            title="View teachers"
          >
            <div className="relative">
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-pill bg-accent-soft text-xs font-semibold text-accent-text"
              >
                {activePersona.initials}
              </div>
            </div>

            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="truncate text-sm font-semibold text-text">
                  {activePersona.name}
                </span>
                <span
                  className="hidden rounded-pill bg-surface-2 px-2 py-1 text-xs font-medium text-muted md:inline-block"
                >
                  {activePersona.variant === 'pk' ? 'PK' : 'Global'}
                </span>
              </div>
              <div className="truncate text-sm text-muted">
                {isLoading ? uiCopy(language, 'typing') : activePersona.role}
              </div>
            </div>
          </button>
        </div>

        <div className="flex min-w-0 flex-wrap items-center justify-between gap-2 sm:justify-end">
          <SegmentedControl
            label={uiCopy(language, 'chatModeLabel')}
            value={activeMode}
            options={[
              { value: 'concept', label: uiCopy(language, 'modeConcept') },
              { value: 'exam', label: uiCopy(language, 'modeExam') },
              { value: 'research', label: uiCopy(language, 'modeResearch') },
            ]}
            onChange={handleModeChange}
            className="max-w-full"
          />

          {/* Language Switcher */}
          <div className="relative" data-lang-switcher>
            <button
              onClick={() => setShowLangSwitcher(!showLangSwitcher)}
              className="flex min-h-11 items-center gap-1.5 rounded-control border border-border bg-surface px-3 text-sm font-medium text-text transition-colors hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              title="Switch Response Language"
              aria-label="Switch response language"
              aria-haspopup="menu"
              aria-expanded={showLangSwitcher}
            >
              <span className="text-sm">{language === 'english' ? 'EN' : language === 'roman-urdu' ? 'RU' : 'اردو'}</span>
              <ChevronDown className="w-3 h-3 opacity-60" />
            </button>

            {showLangSwitcher && (
              <div role="menu" className="absolute right-0 top-full z-popover mt-1 min-w-40 overflow-hidden rounded-tile border border-border bg-surface p-1 shadow-popover">
                {[
                  { lang: 'english' as const, label: 'English', desc: 'Full English responses' },
                  { lang: 'roman-urdu' as const, label: 'Roman Urdu', desc: 'Urdu in English script' },
                  { lang: 'urdu' as const, label: 'اردو', desc: 'Urdu script' },
                ].map(({ lang, label, desc }) => (
                  <button
                    key={lang}
                    onClick={() => {
                      onLanguageChange?.(lang);
                      setShowLangSwitcher(false);
                    }}
                    role="menuitem"
                    className={`flex min-h-11 w-full items-center gap-2 rounded-control px-3 text-start text-sm transition-colors focus-visible:outline-2 focus-visible:outline-accent
                      ${language === lang
                        ? 'bg-accent-soft text-accent-text'
                        : 'text-text hover:bg-surface-2'
                      }`}
                  >
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

          {!isRightPanelOpen && (
            <button
              onClick={onToggleRightPanel}
              className="flex h-11 w-11 items-center justify-center rounded-pill text-muted transition-colors hover:bg-surface-2 hover:text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              aria-label="Open teacher list"
              title="Open Personas & Mentors"
            >
              <PanelRight className="w-5 h-5" />
            </button>
          )}
        </div>
      </header>

      {/* 3. MESSAGES STREAM (WHATSAPP GROUP CHAT STYLING) */}
      <div className="relative z-base flex-1 space-y-6 overflow-y-auto px-4 py-6 sm:px-6">
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
              className={`mx-auto flex w-full max-w-reading min-w-0 flex-col ${isAssistant ? 'items-start' : 'items-end'}`}
            >
              <div
                className={`min-w-0 [overflow-wrap:anywhere] ${
                  isAssistant
                    ? 'w-full px-0 py-2 text-text'
                    : 'max-w-[80%] rounded-2xl rounded-tr-md bg-accent-soft px-4 py-3 text-base text-text'
                }`}
              >
                {isAssistant && msgPersona && (
                  <div className="mb-3 flex items-center gap-2">
                    <div className="flex items-center gap-2">
                      <div
                        className="flex h-6 w-6 items-center justify-center rounded-pill bg-accent-soft text-xs font-semibold text-accent-text"
                      >
                        {msgPersona.initials}
                      </div>
                      <span className="text-sm font-medium text-muted">
                        {msgPersona.name} · {msg.mode ? uiCopy(language, msg.mode === 'concept' ? 'modeConcept' : msg.mode === 'exam' ? 'modeExam' : 'modeResearch') : activeModeLabel}
                      </span>
                    </div>
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
                        <div className="mt-3">
                          <button
                            onClick={() => toggleExploreSection(msg.id, msg.content, idx)}
                            aria-expanded={!!expandedExploreMsgIds[msg.id]}
                            className="inline-flex min-h-11 items-center gap-2 rounded-control px-2 text-sm text-muted transition-colors hover:bg-surface-2 hover:text-accent-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                          >
                            <span>{uiCopy(language, 'exploreLabel')}</span>
                            <ChevronDown className={`h-4 w-4 transition-transform ${expandedExploreMsgIds[msg.id] ? 'rotate-180' : ''}`} />
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

                {isAssistant && (
                  <div className="mt-2 flex flex-wrap items-center gap-1 text-xs text-muted">
                      <button
                        type="button"
                        aria-label={uiCopy(language, 'copyReply')}
                        title={uiCopy(language, 'copyReply')}
                        onClick={() => {
                          void handleCopyMessage(msg.id, msg.content);
                        }}
                        className={replyActionClass}
                      >
                        {copiedMsgId === msg.id ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        <span>{copiedMsgId === msg.id ? uiCopy(language, 'replyCopied') : uiCopy(language, 'copyReply')}</span>
                      </button>
                      <button
                        type="button"
                        aria-label={uiCopy(language, 'saveNote')}
                        title={uiCopy(language, 'saveNote')}
                        onClick={() => handleSaveNote(msg.id, msg.content)}
                        className={replyActionClass}
                      >
                        {savedNotesMsgId === msg.id ? <Check className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                        <span>{savedNotesMsgId === msg.id ? uiCopy(language, 'noteSaved') : uiCopy(language, 'saveNote')}</span>
                      </button>
                      <button
                        type="button"
                        aria-label={uiCopy(language, 'shareReply')}
                        title={uiCopy(language, 'shareReply')}
                        onClick={() => void handleShareMessage(msg.id, msg.content)}
                        className={replyActionClass}
                      >
                        <Share2 className="h-4 w-4" />
                        <span>{uiCopy(language, 'shareReply')}</span>
                      </button>
                      {reportSupportUrl && (
                        <a
                          href={reportSupportUrl}
                          target="_blank"
                          rel="noreferrer"
                          className={replyActionClass}
                          aria-label={uiCopy(language, 'reportReply')}
                        >
                          <Flag className="h-4 w-4" />
                          <span>{uiCopy(language, 'reportReply')}</span>
                        </a>
                      )}
                      {idx === latestAssistantIndex && (
                        <button
                          type="button"
                          aria-label={uiCopy(language, 'regenerateReply')}
                          title={uiCopy(language, 'regenerateReply')}
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
                          className={`${replyActionClass} disabled:pointer-events-none disabled:opacity-40`}
                        >
                          <RotateCcw className="h-4 w-4" />
                          <span>{uiCopy(language, 'regenerateReply')}</span>
                        </button>
                      )}
                      {actionNotice?.messageId === msg.id && (
                        <span className="basis-full px-2 text-xs text-danger" role="status">{actionNotice.text}</span>
                      )}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Typing / Synthesis Status Bubble */}
        {isLoading && (
          <div className="mx-auto flex w-full max-w-reading items-start gap-3" role="status" aria-live="polite">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-pill bg-accent-soft text-xs font-semibold text-accent-text">
              {activePersona.initials}
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-3 py-1">
              <p className="text-sm font-medium text-muted">{activePersona.name} · {uiCopy(language, 'typing')}</p>
              <span className="flex items-center gap-1" aria-hidden="true">
                <span className="h-2 w-2 animate-pulse rounded-pill bg-accent motion-reduce:animate-none" />
                <span className="h-2 w-2 animate-pulse rounded-pill bg-accent motion-reduce:animate-none" />
                <span className="h-2 w-2 animate-pulse rounded-pill bg-accent motion-reduce:animate-none" />
              </span>
              <div className="space-y-2" aria-hidden="true">
                <div className="h-3 w-3/4 animate-pulse rounded-pill bg-surface-2 motion-reduce:animate-none" />
                <div className="h-3 w-1/2 animate-pulse rounded-pill bg-surface-2 motion-reduce:animate-none" />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 4. WHATSAPP CHAT COMPOSER STAGE */}
      <div className="z-sticky shrink-0 border-t border-border bg-bg px-3 pt-3 pb-[calc(0.5rem+env(safe-area-inset-bottom))] sm:px-4">
        <div className="mx-auto max-w-reading space-y-2">
          {/* Hidden File Input for Image Upload */}
          <input type="file" ref={fileInputRef} onChange={handleImageSelect} accept="image/*" multiple className="hidden" />
          <input type="file" ref={cameraInputRef} onChange={handleImageSelect} accept="image/*" capture="environment" className="hidden" />

          {/* Attached Image Preview Strip */}
          {attachedImages.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 rounded-tile border border-border bg-surface p-2">
              {attachedImages.map((image, index) => (
                <div key={`${index}-${image.slice(0, 12)}`} className="relative h-14 w-14">
                  <img
                    src={image.startsWith('data:') ? image : `data:image/jpeg;base64,${image}`}
                    alt={`Image attachment ${index + 1}`}
                    className="h-full w-full rounded-control border border-border object-cover"
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
              <span className="text-sm text-muted">{attachedImages.length}/4</span>
            </div>
          )}
          {imageNotice && <p role="status" className="text-sm text-danger">{imageNotice}</p>}

          <div className="flex min-w-0 items-end gap-2">
            <form
              onSubmit={handleSubmit}
              className="flex min-w-0 flex-1 items-end gap-2 rounded-composer border border-border bg-surface px-2 py-2 shadow-lift transition-shadow focus-within:ring-2 focus-within:ring-accent/30"
            >
              <div className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => setShowAttachmentMenu((open) => !open)}
                  className="flex h-11 w-11 items-center justify-center rounded-pill text-muted transition-colors hover:bg-surface-2 hover:text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                  title={uiCopy(language, 'addImage')}
                  aria-label={uiCopy(language, 'addImage')}
                  aria-haspopup="menu"
                  aria-expanded={showAttachmentMenu}
                >
                  <Plus className="h-5 w-5" />
                </button>
                {showAttachmentMenu && (
                  <div role="menu" aria-label={uiCopy(language, 'attachmentMenu')} className="absolute bottom-full left-0 z-popover mb-2 min-w-48 rounded-tile border border-border bg-surface p-1 shadow-popover">
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setShowAttachmentMenu(false);
                        handleImageButtonClick('files');
                      }}
                      className="flex min-h-11 w-full items-center gap-2 rounded-control px-3 text-start text-sm text-text hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-accent"
                    >
                      <ImageIcon aria-hidden="true" className="h-4 w-4" />
                      {uiCopy(language, 'choosePhoto')}
                      {!isPaid && <><Lock aria-hidden="true" className="ml-auto h-3.5 w-3.5" /><span className="text-xs text-muted">Pro</span></>}
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setShowAttachmentMenu(false);
                        handleImageButtonClick('camera');
                      }}
                      className="flex min-h-11 w-full items-center gap-2 rounded-control px-3 text-start text-sm text-text hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-accent"
                    >
                      <Camera aria-hidden="true" className="h-4 w-4" />
                      {uiCopy(language, 'takePhoto')}
                      {!isPaid && <><Lock aria-hidden="true" className="ml-auto h-3.5 w-3.5" /><span className="text-xs text-muted">Pro</span></>}
                    </button>
                  </div>
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
                disabled={!!editingMessageId || isLoading || isImageProcessing}
                placeholder={
                  attachedImages.length > 0
                    ? uiCopy(language, 'imageQuestionPlaceholder')
                    : `${uiCopy(language, 'composerPlaceholder')} (${activePersona.name})`
                }
                className="min-h-11 min-w-0 max-h-[40dvh] flex-1 resize-none bg-transparent px-1 py-2 text-base leading-relaxed text-text placeholder:text-muted focus:outline-none"
                dir={language === 'urdu' ? 'rtl' : 'ltr'}
              />
            </form>

            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => setIsSpecsOpen((open) => !open)}
                aria-label={uiCopy(language, 'tuneSettings')}
                title={uiCopy(language, 'tuneSettings')}
                aria-expanded={isSpecsOpen}
                className="flex h-11 w-11 items-center justify-center rounded-pill text-muted transition-colors hover:bg-surface-2 hover:text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                <SlidersHorizontal className="h-5 w-5" />
              </button>
              {isSpecsOpen && (
                <div className="fixed inset-x-3 bottom-[calc(var(--space-12)+env(safe-area-inset-bottom))] z-modal max-h-[70dvh] overflow-y-auto rounded-sheet border border-border bg-surface shadow-modal sm:absolute sm:inset-x-auto sm:bottom-full sm:right-0 sm:mb-2 sm:w-[min(42rem,calc(100vw-2rem))]">
                  <SpecificationsAccordion
                    mode={activeMode}
                    specs={session?.specs || {}}
                    onChangeSpecs={handleSpecsChange}
                    isOpen={isSpecsOpen}
                    onToggle={() => setIsSpecsOpen(false)}
                  />
                </div>
              )}
            </div>

            <button
              onClick={() => setIsPrivate((value) => !value)}
              type="button"
              className={`mb-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-pill border transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                isPrivate
                  ? 'border-accent bg-accent-soft text-accent-text'
                  : 'border-border bg-surface text-muted'
              }`}
              title={isPrivate ? uiCopy(language, 'privateQuestion') : uiCopy(language, 'publicQuestion')}
              aria-label={isPrivate ? uiCopy(language, 'privateQuestion') : uiCopy(language, 'publicQuestion')}
            >
              {isPrivate ? <Lock className="w-5 h-5" /> : <LockOpen className="w-5 h-5" />}
            </button>

            {/* WhatsApp Signature Circular Green Send Button */}
            <button
              onClick={handleSubmit}
              type="button"
              disabled={(!inputText.trim() && attachedImages.length === 0) || isLoading || isImageProcessing || !!editingMessageId}
              className="mb-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-pill bg-accent text-on-accent shadow-lift transition-colors hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:pointer-events-none disabled:opacity-40"
              title={uiCopy(language, 'sendMessage')}
              aria-label={uiCopy(language, 'sendMessage')}
            >
              <Send className="h-5 w-5" />
            </button>
          </div>
          {!(isPaid && !user?.pro_expires_at) && (
            <p className="px-2 text-xs text-muted" aria-live="polite">
              {isPaid
                ? uiCopy(language, 'proQuotaLabel')
                : `${queryUsage.remaining} / ${queryUsage.limit} ${uiCopy(language, 'queriesRemaining')}`}
              {isPaid && user?.pro_expires_at && <ProExpiryBadge />}
            </p>
          )}
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
