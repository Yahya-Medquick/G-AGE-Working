import React, { useEffect, useState } from "react";
import {
  BookOpen,
  GraduationCap,
  Newspaper,
  Code2,
  Video,
  Library,
  FileText,
  MessageSquare,
  Network,
  Sparkles,
  History,
  Lock,
  Activity,
  Compass,
  Brain,
} from "lucide-react";
import { CategoryInfo, CategoryType, TabUsage } from "../types";
import { useUser } from "../context/UserContext";
import { fetchTabUsage } from "../services/api";

export const CATEGORIES: CategoryInfo[] = [
  { id: "overview", label: "Overview", shortLabel: "Overview", iconName: "BookOpen", description: "Synthesis, facts, timeline & key figures" },
  { id: "education", label: "Education", shortLabel: "Education", iconName: "GraduationCap", description: "Learning roadmaps & interactive quizzes" },
  { id: "news", label: "News", shortLabel: "News", iconName: "Newspaper", description: "Recent discoveries & news articles" },
  { id: "software", label: "Software", shortLabel: "Software", iconName: "Code2", description: "GitHub repos, tools & frameworks" },
  { id: "videos", label: "Videos", shortLabel: "Videos", iconName: "Video", description: "Lectures, documentaries & video explainers" },
  { id: "books", label: "Books", shortLabel: "Books", iconName: "Library", description: "Google Books, textbooks & previews" },
  { id: "research", label: "Research Papers", shortLabel: "Research", iconName: "FileText", description: "OpenAlex peer-reviewed paper archive" },
  { id: "communities", label: "Communities", shortLabel: "Communities", iconName: "MessageSquare", description: "Reddit discussions, forums & Q&A" },
  { id: "related", label: "Related Topics", shortLabel: "Graph", iconName: "Network", description: "Knowledge graph & connected node network" },
  { id: "recommendations", label: "Recommendations", shortLabel: "Recs", iconName: "Sparkles", description: "Smart AI recommendations & curated topics" },
  { id: "history", label: "History", shortLabel: "History", iconName: "History", description: "Your persistent search history, pins & stars" },
  // Learning Mode Custom/Specialist Tabs
  { id: "qa", label: "Learning Q&A", shortLabel: "Q&A", iconName: "MessageSquare", description: "Syllabus learning & interactive QA chatbot" },
  { id: "counseling", label: "Expert", shortLabel: "Expert", iconName: "Brain", description: "1-on-1 discussion with domain research specialists" },
  { id: "notes", label: "Notes", shortLabel: "Notes", iconName: "FileText", description: "Notes taking and summary generator" },
];

const RESEARCH_TABS = ["overview", "research", "software", "news", "communities", "related"];
const LEARNING_TABS = ["overview", "education", "videos", "qa", "counseling"];

interface CategoryTabsProps {
  activeCategory: CategoryType;
  onSelectCategory: (category: CategoryType) => void;
  loadedCategories?: Set<CategoryType>;
  currentTopic?: string;
  dataTrigger?: any;
}

export const CategoryTabs: React.FC<CategoryTabsProps> = ({
  activeCategory,
  onSelectCategory,
  loadedCategories = new Set(),
  currentTopic,
  dataTrigger,
}) => {
  const { isLoggedIn, mode } = useUser();
  const [usageInfo, setUsageInfo] = useState<TabUsage | null>(null);

  const isGatedTab = activeCategory === "research" || activeCategory === "software";

  useEffect(() => {
    let isMounted = true;
    if (isGatedTab && isLoggedIn) {
      fetchTabUsage(activeCategory).then((data) => {
        if (isMounted && data) {
          setUsageInfo(data);
        }
      });
    } else {
      setUsageInfo(null);
    }
    return () => {
      isMounted = false;
    };
  }, [activeCategory, isLoggedIn, currentTopic, dataTrigger]);

  const formatResetTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}h ${m}m`;
  };

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case "BookOpen": return <BookOpen className="w-4 h-4" />;
      case "GraduationCap": return <GraduationCap className="w-4 h-4" />;
      case "Newspaper": return <Newspaper className="w-4 h-4" />;
      case "Code2": return <Code2 className="w-4 h-4" />;
      case "Video": return <Video className="w-4 h-4" />;
      case "Library": return <Library className="w-4 h-4" />;
      case "FileText": return <FileText className="w-4 h-4" />;
      case "MessageSquare": return <MessageSquare className="w-4 h-4" />;
      case "Network": return <Network className="w-4 h-4" />;
      case "Sparkles": return <Sparkles className="w-4 h-4" />;
      case "History": return <History className="w-4 h-4 text-amber-500" />;
      case "Compass": return <Compass className="w-4 h-4" />;
      case "Brain": return <Brain className="w-4 h-4 text-indigo-500" />;
      default: return <BookOpen className="w-4 h-4" />;
    }
  };

  const allowedTabs = mode === "research" ? RESEARCH_TABS : LEARNING_TABS;
  const filteredCategories = CATEGORIES.filter((cat) => allowedTabs.includes(cat.id));

  return (
    <div className="w-full border-b border-slate-200/60 dark:border-slate-800/60 bg-white/95 dark:bg-slate-950/95 sticky top-14 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row md:items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-2.5">
          {filteredCategories.map((cat) => {
            const isActive = activeCategory === cat.id;
            const isLoaded = loadedCategories.has(cat.id);
            const isProtected = (cat.id === "research" || cat.id === "software") && !isLoggedIn;

            return (
              <button
                key={cat.id}
                onClick={() => onSelectCategory(cat.id)}
                aria-label={`Switch to ${cat.label} tab`}
                className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all shrink-0 select-none cursor-pointer ${
                  isActive
                    ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 font-semibold shadow-xs"
                    : isProtected
                    ? "text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100/60 dark:hover:bg-slate-900/60"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/60 dark:hover:bg-slate-900/60"
                }`}
                title={cat.description}
              >
                <span>{getIcon(cat.iconName)}</span>
                <span>{cat.label}</span>

                {/* Protected tab lock icon */}
                {isProtected && <Lock className="w-3 h-3 text-amber-500 shrink-0" />}

                {/* Loaded Indicator Dot */}
                {isLoaded && !isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/70 dark:bg-indigo-400/70" title="Loaded" />
                )}
              </button>
            );
          })}
        </div>

        {/* Real-time Usage Display Indicator for Gated Tabs */}
        {isGatedTab && isLoggedIn && usageInfo && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-50 dark:bg-purple-950/40 text-[11px] text-purple-700 dark:text-purple-300 font-medium shrink-0 self-start md:self-auto">
            <Activity className="w-3 h-3 text-purple-500 animate-pulse shrink-0" />
            <span>
              {usageInfo.limit >= 1000 ? (
                <span>Unlimited Searches Today</span>
              ) : (
                <>
                  {usageInfo.count}/{usageInfo.limit} searches today · resets in {formatResetTime(usageInfo.resetInSeconds)}
                </>
              )}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
