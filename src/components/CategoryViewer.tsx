import React, { lazy, Suspense, useState, useEffect } from "react";
import { CategoryApiResponse, CategoryType, ResearchPaper, SoftwareRepo, BookItem, NewsArticle, CommunityDiscussion } from "../types";
import { CardSkeleton } from "./CardSkeleton";
import { OverviewCard } from "./cards/OverviewCard";
import { PaperCard } from "./cards/PaperCard";
import { SoftwareCard } from "./cards/SoftwareCard";
import { BookCard } from "./cards/BookCard";
import { VideoCard } from "./cards/VideoCard";
import { EducationCard } from "./cards/EducationCard";
import { NewsCard } from "./cards/NewsCard";
import { CommunityCard } from "./cards/CommunityCard";
import { AIQuestionAnswerCard } from "./AIQuestionAnswerCard";
import { MultiLevelDefinitionCard } from "./MultiLevelDefinitionCard";
import { HistoryViewer } from "./HistoryViewer";
import { AlertCircle, RefreshCw, ArrowDown, FolderOpen, Lock, LogIn, Clock, ShieldAlert, MessageSquare, Compass, FileText, Loader2 } from "lucide-react";
import { useUser } from "../context/UserContext";

const KnowledgeGraph = lazy(() =>
  import("./KnowledgeGraph").then((m) => ({ default: m.KnowledgeGraph }))
);

const LearningQACard = lazy(() =>
  import("./cards/LearningQACard").then((m) => ({ default: m.LearningQACard }))
);

interface CategoryViewerProps {
  category: CategoryType;
  topic: string;
  data: CategoryApiResponse | null;
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
  isAutoRetrying?: boolean;
  retryCountdown?: number;
  autoRetryCount?: number;
  hasMore: boolean;
  entity?: any;
  rankingScore?: number;
  synonymsConnected?: string[];
  onLoadMore: () => void;
  onRetry: () => void;
  onSelectTopic: (topic: string) => void;
  onOpenLogin?: () => void;
  matchMode?: 'all' | 'any' | 'phrase';
  onMatchModeChange?: (mode: 'all' | 'any' | 'phrase') => void;
}

export const CategoryViewer: React.FC<CategoryViewerProps> = ({
  category,
  topic,
  data,
  isLoading,
  isLoadingMore,
  error,
  isAutoRetrying = false,
  retryCountdown = 0,
  autoRetryCount = 0,
  hasMore,
  entity,
  rankingScore,
  synonymsConnected,
  onLoadMore,
  onRetry,
  onSelectTopic,
  onOpenLogin,
  matchMode = 'all',
  onMatchModeChange,
}) => {
  const { isLoggedIn } = useUser();
  const [resetTimer, setResetTimer] = useState<number>(86400);

  // Live countdown timer for daily limits
  useEffect(() => {
    if (!error || !error.includes("LIMIT_EXCEEDED")) return;
    const interval = setInterval(() => {
      setResetTimer((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [error]);

  if (category === "history") {
    return (
      <HistoryViewer
        onSelectSearch={(q, c) => onSelectTopic(q)}
        onOpenLogin={onOpenLogin || (() => {})}
      />
    );
  }

  // Access Control: Protected Tabs when Logged Out
  if ((category === "research" || category === "software") && !isLoggedIn) {
    return (
      <div className="rounded-3xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/30 p-10 text-center space-y-6 max-w-lg mx-auto my-12 shadow-sm">
        <div className="w-16 h-16 rounded-3xl bg-amber-100 dark:bg-amber-900/50 border border-amber-300 dark:border-amber-800 flex items-center justify-center text-amber-600 dark:text-amber-400 mx-auto">
          <Lock className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h3 className="font-extrabold text-slate-900 dark:text-white text-xl">
            {category === "research" ? "Research Papers" : "Software Repositories"} Access Restricted
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Please sign in with Google to explore peer-reviewed academic papers, DOIs, GitHub repositories, and open source tools for <strong>"{topic}"</strong>.
          </p>
        </div>
        <button
          onClick={onOpenLogin}
          className="px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs inline-flex items-center gap-2 shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
        >
          <LogIn className="w-4 h-4" />
          <span>Sign in with Google</span>
        </button>
      </div>
    );
  }

  if (isLoading) {
    return <CardSkeleton count={6} />;
  }

  if (error) {
    const isLoginReq = error.includes("LOGIN_REQUIRED");
    const isLimitExceeded = error.includes("LIMIT_EXCEEDED") || error.includes("used your 5 free searches");

    if (isLoginReq) {
      return (
        <div className="rounded-3xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/30 p-10 text-center space-y-6 max-w-lg mx-auto my-12 shadow-sm">
          <div className="w-16 h-16 rounded-3xl bg-amber-100 dark:bg-amber-900/50 border border-amber-300 dark:border-amber-800 flex items-center justify-center text-amber-600 dark:text-amber-400 mx-auto">
            <Lock className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h3 className="font-extrabold text-slate-900 dark:text-white text-xl">
              Sign in Required
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Sign in to access search results for this tab.
            </p>
          </div>
          <button
            onClick={onOpenLogin}
            className="px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs inline-flex items-center gap-2 shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
          >
            <LogIn className="w-4 h-4" />
            <span>Sign in with Google</span>
          </button>
        </div>
      );
    }

    if (isLimitExceeded) {
      const hours = Math.floor(resetTimer / 3600);
      const mins = Math.floor((resetTimer % 3600) / 60);
      const secs = resetTimer % 60;

      return (
        <div className="rounded-3xl border border-purple-200 dark:border-purple-900/60 bg-purple-50/50 dark:bg-purple-950/30 p-10 text-center space-y-6 max-w-lg mx-auto my-12 shadow-sm">
          <div className="w-16 h-16 rounded-3xl bg-purple-100 dark:bg-purple-900/50 border border-purple-300 dark:border-purple-800 flex items-center justify-center text-purple-600 dark:text-purple-400 mx-auto">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h3 className="font-extrabold text-slate-900 dark:text-white text-xl">
              Daily Limit Reached (5/5 Free Searches)
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              You've used your 5 free searches for the <strong className="capitalize">{category}</strong> tab today. Your daily search limit resets automatically at midnight UTC.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 font-bold text-xs shadow-xs">
            <Clock className="w-4 h-4 text-purple-600 animate-pulse" />
            <span>Resets in: {hours}h {mins}m {secs}s</span>
          </div>
        </div>
      );
    }

    return (
      <div className="rounded-3xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/30 p-8 text-center space-y-4 max-w-xl mx-auto my-12 shadow-sm">
        <div className="relative inline-block">
          <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
          {isAutoRetrying && (
            <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-rose-500"></span>
            </span>
          )}
        </div>
        <h3 className="font-bold text-slate-900 dark:text-white text-lg">
          Failed to load {category}
        </h3>
        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{error}</p>

        {isAutoRetrying ? (
          <div className="space-y-3 pt-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-200 text-xs font-medium">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-rose-600 dark:text-rose-400" />
              <span>Auto-reloading page in <strong className="font-bold">{retryCountdown}s</strong> (Attempt {autoRetryCount}/3)...</span>
            </div>
            <div>
              <button
                onClick={onRetry}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs inline-flex items-center gap-2 transition-colors cursor-pointer shadow-xs"
              >
                <span>Reload Now</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="pt-2">
            <button
              onClick={onRetry}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs inline-flex items-center gap-2 transition-colors shadow-xs cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Reload Tab Data</span>
            </button>
          </div>
        )}
      </div>
    );
  }

  if (!data) return null;

  // Render Empty State Helper Component
  const renderEmptyState = (categoryName: string) => (
    <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-12 text-center space-y-4 max-w-xl mx-auto my-8 shadow-xs">
      <FolderOpen className="w-12 h-12 text-slate-400 mx-auto" />
      <h3 className="font-bold text-slate-900 dark:text-white text-base">
        No {categoryName} found for "{topic}"
      </h3>
      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
        We couldn't retrieve items for this category right now. You can retry fetching or search for another term.
      </p>
      <button
        onClick={onRetry}
        className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs inline-flex items-center gap-2 transition-colors shadow-xs cursor-pointer"
      >
        <RefreshCw className="w-4 h-4" />
        <span>Refresh {categoryName} Data</span>
      </button>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* 1. OVERVIEW */}
      {category === "overview" && (
        <div className="space-y-6">
          <AIQuestionAnswerCard topic={topic} />
          {data.overviewData ? (
            <OverviewCard
              data={data.overviewData}
              entity={entity}
              rankingScore={rankingScore}
              synonymsConnected={synonymsConnected}
            />
          ) : (
            renderEmptyState("Overview")
          )}
        </div>
      )}

      {/* 2. EDUCATION */}
      {category === "education" && (
        data.educationData ? (
          <EducationCard educationData={data.educationData} topic={topic} />
        ) : (
          renderEmptyState("Education Roadmap")
        )
      )}

      {/* 3. RESEARCH PAPERS */}
      {category === "research" && (
        <div className="space-y-6">
          {/* Filtering Control Panel */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-xs">
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">Strict Keyword Filtering</h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Filter peer-reviewed papers by matching search term in title or abstract.</p>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">Mode:</span>
              <div className="inline-flex rounded-xl p-0.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <button
                  onClick={() => onMatchModeChange?.('all')}
                  className={`px-3 py-1 text-[11px] font-semibold rounded-lg transition-all cursor-pointer ${
                    matchMode === 'all'
                      ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-xs font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  Require ALL Words
                </button>
                <button
                  onClick={() => onMatchModeChange?.('any')}
                  className={`px-3 py-1 text-[11px] font-semibold rounded-lg transition-all cursor-pointer ${
                    matchMode === 'any'
                      ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-xs font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  Match ANY Word
                </button>
                <button
                  onClick={() => onMatchModeChange?.('phrase')}
                  className={`px-3 py-1 text-[11px] font-semibold rounded-lg transition-all cursor-pointer ${
                    matchMode === 'phrase'
                      ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-xs font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  Exact Phrase
                </button>
              </div>
            </div>
          </div>

          {/* Fallback Warning Banner if needed */}
          {data.filterInfo?.fallbackToBroad && (
            <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40 text-amber-800 dark:text-amber-300">
              <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-xs font-bold">No papers found containing "{data.filterInfo.term}"</p>
                <p className="text-[11px] text-amber-700/90 dark:text-amber-400/90 leading-relaxed">
                  No matches found under the <strong>{matchMode === 'all' ? 'Require ALL words' : matchMode === 'any' ? 'Match ANY word' : 'Exact phrase'}</strong> criteria. Showing related scientific results for this topic instead.
                </p>
              </div>
            </div>
          )}

          {/* Active Strict Match Indicator when successful */}
          {!data.filterInfo?.fallbackToBroad && data.filterInfo && data.items && data.items.length > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 text-emerald-800 dark:text-emerald-300">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <p className="text-[11px] font-medium">
                Strictly showing <strong>{data.items.length}</strong> papers matching "{data.filterInfo.term}" (from {data.filterInfo.totalFetched} fetched papers).
              </p>
            </div>
          )}

          {data.items && data.items.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {data.items.map((paper: ResearchPaper, idx: number) => (
                <PaperCard
                  key={paper.id ? `paper-${paper.id}-${idx}` : `paper-${idx}`}
                  paper={paper}
                />
              ))}
            </div>
          ) : (
            renderEmptyState("Research Papers")
          )}
        </div>
      )}

      {/* 4. SOFTWARE */}
      {category === "software" && (
        data.items && data.items.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.items.map((repo: SoftwareRepo, idx: number) => (
              <SoftwareCard
                key={repo.id ? `repo-${repo.id}-${idx}` : `repo-${idx}`}
                repo={repo}
              />
            ))}
          </div>
        ) : (
          renderEmptyState("Software Repositories")
        )
      )}

      {/* 5. BOOKS */}
      {category === "books" && (
        data.items && data.items.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.items.map((book: BookItem, idx: number) => (
              <BookCard
                key={book.id ? `book-${book.id}-${idx}` : `book-${idx}`}
                book={book}
              />
            ))}
          </div>
        ) : (
          renderEmptyState("Books & Literature")
        )
      )}

      {/* 6. VIDEOS */}
      {category === "videos" && (
        data.items && data.items.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {data.items.map((video, idx: number) => (
              <VideoCard key={video.id ? `video-${video.id}-${idx}` : `video-${idx}`} video={video} />
            ))}
          </div>
        ) : (
          renderEmptyState("Video Lectures")
        )
      )}

      {/* 7. NEWS */}
      {category === "news" && (
        data.items && data.items.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.items.map((article: NewsArticle, idx: number) => (
              <NewsCard
                key={article.id ? `news-${article.id}-${idx}` : `news-${idx}`}
                article={article}
              />
            ))}
          </div>
        ) : (
          renderEmptyState("News Articles")
        )
      )}

      {/* 8. COMMUNITIES */}
      {category === "communities" && (
        data.items && data.items.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.items.map((discussion: CommunityDiscussion, idx: number) => (
              <CommunityCard
                key={discussion.id ? `community-${discussion.id}-${idx}` : `community-${idx}`}
                discussion={discussion}
              />
            ))}
          </div>
        ) : (
          renderEmptyState("Community Discussions")
        )
      )}

      {/* 9. RELATED TOPICS KNOWLEDGE GRAPH */}
      {category === "related" && (
        data.knowledgeGraph ? (
          <Suspense fallback={<CardSkeleton count={1} />}>
            <KnowledgeGraph
              graphData={data.knowledgeGraph}
              onSelectTopic={onSelectTopic}
            />
          </Suspense>
        ) : (
          renderEmptyState("Knowledge Graph")
        )
      )}

      {/* 11. RECOMMENDATIONS */}
      {category === "recommendations" && (
        data.items && data.items.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.items.map((item: any, idx: number) => (
              <div
                key={item.id || idx}
                onClick={() => onSelectTopic(item.title)}
                className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600 cursor-pointer shadow-xs hover:shadow-md transition-all space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                    {item.category || "Recommended Topic"}
                  </span>
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    {item.relevanceScore ? `${item.relevanceScore}% Match` : "Recommended"}
                  </span>
                </div>
                <h4 className="font-bold text-slate-900 dark:text-white text-base hover:text-indigo-600 transition-colors">
                  {item.title}
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {item.reason || item.description || "Curated based on your interests and related search patterns."}
                </p>
                <div className="pt-2 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                  <span>Explore Topic</span> &rarr;
                </div>
              </div>
            ))}
          </div>
        ) : (
          renderEmptyState("Recommendations")
        )
      )}

      {/* 12. LEARNING Q&A CARD */}
      {category === "qa" && (
        <Suspense fallback={
          <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800/70 rounded-2xl p-8 text-center space-y-4 shadow-xs">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 dark:border-indigo-400 mx-auto"></div>
            <p className="text-xs text-slate-500">Loading AI Learning Q&A...</p>
          </div>
        }>
          <LearningQACard />
        </Suspense>
      )}

      {/* 13. COUNSELING PLACEHOLDER */}
      {category === "counseling" && (
        <div className="rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-12 text-center space-y-4 max-w-xl mx-auto my-8 shadow-xs">
          <div className="w-16 h-16 rounded-full bg-teal-50 dark:bg-teal-950 flex items-center justify-center text-teal-600 dark:text-teal-400 mx-auto">
            <Compass className="w-8 h-8" />
          </div>
          <h3 className="font-bold text-slate-900 dark:text-white text-base">
            Counseling Advisor Coming Soon
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Receive personalized subject selection advice, board exam strategies, and career planning insights optimized for Pakistani secondary and higher secondary education tracks.
          </p>
        </div>
      )}

      {/* 14. NOTES PLACEHOLDER */}
      {category === "notes" && (
        <div className="rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-12 text-center space-y-4 max-w-xl mx-auto my-8 shadow-xs">
          <div className="w-16 h-16 rounded-full bg-amber-50 dark:bg-amber-950 flex items-center justify-center text-amber-600 dark:text-amber-400 mx-auto">
            <FileText className="w-8 h-8" />
          </div>
          <h3 className="font-bold text-slate-900 dark:text-white text-base">
            Syllabus Notes Coming Soon
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Generate customized FSc/Matric revision summaries, highlight key board formulas, and organize personalized lecture notes to study smarter.
          </p>
        </div>
      )}

      {/* Infinite Scroll / Load More Action */}
      {hasMore && (
        <div className="pt-8 text-center">
          <button
            id="load-more-results-btn"
            type="button"
            onClick={onLoadMore}
            disabled={isLoadingMore}
            className="px-6 py-3 rounded-2xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-white transition-colors font-semibold text-xs inline-flex items-center gap-2 shadow-md disabled:opacity-50 cursor-pointer"
          >
            {isLoadingMore ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white dark:text-slate-900" />
                <span>Loading more {category === "news" ? "news" : "results"}...</span>
              </>
            ) : (
              <>
                <ArrowDown className="w-4 h-4" />
                <span>Load More {category === "news" ? "News" : "Results"}</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};
