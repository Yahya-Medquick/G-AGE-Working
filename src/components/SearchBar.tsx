import React, { useState, useRef, useEffect } from "react";
import {
  Search,
  X,
  Sparkles,
  ArrowRight,
  Loader2,
  Compass,
  ChevronDown,
  BookOpen,
  FileText,
  Code2,
  Newspaper,
  MessageSquare,
  Network,
  GraduationCap,
  Video,
  Check,
} from "lucide-react";
import { useAutocomplete } from "../hooks/useAutocomplete";
import { CategoryType } from "../types";
import { useUser } from "../context/UserContext";

export interface SearchCategoryOption {
  id: CategoryType | "all";
  label: string;
  shortLabel: string;
  iconName: string;
  description: string;
}

const RESEARCH_OPTIONS: SearchCategoryOption[] = [
  { id: "all", label: "All Categories", shortLabel: "All", iconName: "Sparkles", description: "Search across all research sources" },
  { id: "overview", label: "Overview", shortLabel: "Overview", iconName: "BookOpen", description: "Synthesis, facts & timeline" },
  { id: "research", label: "Research Papers", shortLabel: "Papers", iconName: "FileText", description: "Peer-reviewed paper archive" },
  { id: "software", label: "Code & Software", shortLabel: "Code", iconName: "Code2", description: "GitHub repos & tools" },
  { id: "news", label: "News", shortLabel: "News", iconName: "Newspaper", description: "Latest science & tech articles" },
  { id: "communities", label: "Communities", shortLabel: "Forums", iconName: "MessageSquare", description: "Discussions & forums" },
  { id: "related", label: "Knowledge Graph", shortLabel: "Graph", iconName: "Network", description: "Connected topic network" },
];

const LEARNING_OPTIONS: SearchCategoryOption[] = [
  { id: "all", label: "All Categories", shortLabel: "All", iconName: "Sparkles", description: "Search all learning modules" },
  { id: "overview", label: "Overview & Explanation", shortLabel: "Overview", iconName: "BookOpen", description: "Core concepts & explanations" },
  { id: "education", label: "Education Roadmap", shortLabel: "Roadmap", iconName: "GraduationCap", description: "Learning roadmaps & quizzes" },
  { id: "qa", label: "Learning Q&A", shortLabel: "Q&A", iconName: "MessageSquare", description: "Syllabus textbook solver" },
  { id: "videos", label: "Videos", shortLabel: "Videos", iconName: "Video", description: "Lectures & video explainers" },
  { id: "counseling", label: "Expert Counseling", shortLabel: "Counseling", iconName: "Compass", description: "1-on-1 subject advisors" },
];

interface SearchBarProps {
  onSearch: (query: string, category?: CategoryType | "all") => void;
  initialQuery?: string;
  placeholder?: string;
  isCompact?: boolean;
  selectedCategory?: CategoryType | "all";
  onSelectCategory?: (category: CategoryType | "all") => void;
  mode?: "research" | "learning";
}

const FEATURED_TOPICS = [
  "Gravity",
  "Quantum Computing",
  "Photosynthesis",
  "Machine Learning",
  "Black Holes",
  "Gene Editing",
  "Special Relativity",
  "Dark Matter",
];

const renderCategoryIcon = (iconName: string, className = "w-4 h-4") => {
  switch (iconName) {
    case "Sparkles": return <Sparkles className={className} />;
    case "BookOpen": return <BookOpen className={className} />;
    case "FileText": return <FileText className={className} />;
    case "Code2": return <Code2 className={className} />;
    case "Newspaper": return <Newspaper className={className} />;
    case "MessageSquare": return <MessageSquare className={className} />;
    case "Network": return <Network className={className} />;
    case "GraduationCap": return <GraduationCap className={className} />;
    case "Video": return <Video className={className} />;
    case "Compass": return <Compass className={className} />;
    default: return <Sparkles className={className} />;
  }
};

export const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  initialQuery = "",
  placeholder = "Search any topic (e.g., Gravity, Quantum Mechanics, Photosynthesis)...",
  isCompact = false,
  selectedCategory,
  onSelectCategory,
  mode: propMode,
}) => {
  const { mode: contextMode } = useUser();
  const currentMode = propMode || contextMode;

  const [query, setQuery] = useState(initialQuery);
  const [isOpen, setIsOpen] = useState(false);
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);
  const [internalCategory, setInternalCategory] = useState<CategoryType | "all">("all");
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const categoryMenuRef = useRef<HTMLDivElement>(null);

  const activeCategory = selectedCategory !== undefined ? selectedCategory : internalCategory;

  const { suggestions, isLoading } = useAutocomplete(query);

  const categoryOptions = currentMode === "research" ? RESEARCH_OPTIONS : LEARNING_OPTIONS;
  const currentOption = categoryOptions.find((opt) => opt.id === activeCategory) || categoryOptions[0];

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  // Handle click outside to close suggestion dropdown and category menu
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setIsCategoryMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleChooseCategory = (catId: CategoryType | "all") => {
    if (onSelectCategory) {
      onSelectCategory(catId);
    } else {
      setInternalCategory(catId);
    }
    setIsCategoryMenuOpen(false);
  };

  const handleSubmit = (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) return;
    setIsOpen(false);
    setIsCategoryMenuOpen(false);
    onSearch(trimmed, activeCategory);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setIsOpen(true);
      setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (selectedIndex >= 0 && suggestions[selectedIndex]) {
        handleSubmit(suggestions[selectedIndex].title);
      } else {
        handleSubmit(query);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
      setIsCategoryMenuOpen(false);
    }
  };

  return (
    <div ref={containerRef} className="w-full max-w-3xl mx-auto relative">
      <div className="relative group">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit(query);
          }}
          className={`relative flex items-center bg-white dark:bg-slate-900 rounded-full border ${
            isOpen || isCategoryMenuOpen
              ? "border-slate-400 dark:border-slate-600 shadow-md"
              : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
          } transition-all duration-200 ${
            isCompact ? "p-1.5" : "p-2"
          }`}
        >
          {/* Left Search Icon */}
          <div className="pl-3 text-slate-400 group-focus-within:text-indigo-500 transition-colors">
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
            ) : (
              <Search className="w-5 h-5" />
            )}
          </div>

          {/* Input field */}
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
              setIsCategoryMenuOpen(false);
              setSelectedIndex(-1);
            }}
            onFocus={() => {
              setIsOpen(true);
              setIsCategoryMenuOpen(false);
            }}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className={`w-full bg-transparent border-0 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-0 ${
              isCompact ? "px-2.5 py-1.5 text-sm" : "px-3.5 py-3 text-base"
            } font-medium min-w-0`}
          />

          {/* Clear button */}
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                inputRef.current?.focus();
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors mr-1 shrink-0"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {/* Category Dropdown Selector Attached Before Search Button */}
          <div className="relative shrink-0 mr-1.5">
            <button
              type="button"
              onClick={() => {
                setIsCategoryMenuOpen((prev) => !prev);
                setIsOpen(false);
              }}
              className={`h-8 sm:h-9 px-2 sm:px-3 text-xs font-medium rounded-full border transition-all flex items-center gap-1.5 shrink-0 whitespace-nowrap cursor-pointer select-none ${
                activeCategory !== "all"
                  ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/80"
                  : "bg-slate-100 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 border-slate-200/80 dark:border-slate-700/80 hover:bg-slate-200/80 dark:hover:bg-slate-700"
              }`}
              title="Filter search by category"
            >
              <span className={activeCategory !== "all" ? "text-indigo-600 dark:text-indigo-400" : "text-slate-500 dark:text-slate-400"}>
                {renderCategoryIcon(currentOption.iconName, "w-3.5 h-3.5")}
              </span>
              <span className="hidden sm:inline font-semibold">
                {currentOption.label}
              </span>
              <span className="sm:hidden font-semibold">
                {currentOption.shortLabel}
              </span>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isCategoryMenuOpen ? "rotate-180" : ""}`} />
            </button>

            {/* Desktop Category Menu Popup */}
            {isCategoryMenuOpen && (
              <div
                ref={categoryMenuRef}
                className="hidden sm:block absolute right-0 top-full mt-2 w-64 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl z-50 overflow-hidden py-1.5 animate-in fade-in zoom-in-95 duration-150"
              >
                <div className="px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 mb-1">
                  <span>Filter by Category</span>
                  <span className="text-indigo-500 font-semibold">{currentMode === "research" ? "Research" : "Learning"}</span>
                </div>
                <div className="max-h-72 overflow-y-auto py-0.5">
                  {categoryOptions.map((opt) => {
                    const isSelected = activeCategory === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => handleChooseCategory(opt.id)}
                        className={`w-full text-left px-3.5 py-2 flex items-center justify-between gap-2.5 transition-colors cursor-pointer ${
                          isSelected
                            ? "bg-indigo-50/90 dark:bg-indigo-950/50 text-indigo-900 dark:text-indigo-200 font-semibold"
                            : "hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className={`p-1 rounded-md shrink-0 ${isSelected ? "bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-300" : "text-slate-400 dark:text-slate-500"}`}>
                            {renderCategoryIcon(opt.iconName, "w-3.5 h-3.5")}
                          </span>
                          <div className="min-w-0">
                            <div className="text-xs truncate">{opt.label}</div>
                            <div className="text-[10px] text-slate-400 dark:text-slate-500 truncate">{opt.description}</div>
                          </div>
                        </div>
                        {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Submit Search Button */}
          <button
            type="submit"
            disabled={!query.trim()}
            className={`rounded-full bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 font-medium flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed transition-all shrink-0 cursor-pointer ${
              isCompact ? "px-3 py-1.5 text-xs" : "px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm"
            }`}
          >
            <span>Search</span>
            <ArrowRight className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
          </button>
        </form>
      </div>

      {/* Mobile Bottom Sheet Category Selector */}
      {isCategoryMenuOpen && (
        <div className="sm:hidden fixed inset-0 z-50 flex flex-col justify-end animate-in fade-in duration-200">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsCategoryMenuOpen(false)}
          />

          {/* Bottom Sheet Card */}
          <div className="relative bg-white dark:bg-slate-900 rounded-t-3xl border-t border-slate-200 dark:border-slate-800 shadow-2xl p-5 max-h-[85vh] flex flex-col z-10 animate-in slide-in-from-bottom duration-300">
            {/* Drag handle */}
            <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mb-4" />

            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Select Search Category
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {currentMode === "research" ? "Research Mode" : "Learning Mode"} categories
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCategoryMenuOpen(false)}
                className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Category Options List with Touch Target Optimization (min 44px) */}
            <div className="overflow-y-auto py-2 space-y-1.5 flex-1">
              {categoryOptions.map((opt) => {
                const isSelected = activeCategory === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleChooseCategory(opt.id)}
                    className={`w-full text-left px-4 py-3 rounded-2xl flex items-center justify-between gap-3 min-h-[48px] transition-all cursor-pointer ${
                      isSelected
                        ? "bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200"
                        : "bg-slate-50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`p-2 rounded-xl shrink-0 ${isSelected ? "bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-300" : "bg-white dark:bg-slate-800 text-slate-500"}`}>
                        {renderCategoryIcon(opt.iconName, "w-4 h-4")}
                      </span>
                      <div>
                        <div className="text-sm font-semibold">{opt.label}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">{opt.description}</div>
                      </div>
                    </div>
                    {isSelected ? (
                      <Check className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-slate-300 dark:border-slate-600" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Autocomplete Dropdown */}
      {isOpen && (query.trim().length >= 2 || suggestions.length > 0) && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl z-50 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800/60 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5 bg-slate-50/50 dark:bg-slate-950/50">
            <Sparkles className="w-3 h-3 text-indigo-500" />
            <span>Intelligent Suggestions</span>
          </div>

          <div className="max-h-72 overflow-y-auto py-1">
            {suggestions.length > 0 ? (
              suggestions.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => handleSubmit(item.title)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`px-4 py-3 flex items-start gap-3 cursor-pointer transition-colors ${
                    selectedIndex === idx
                      ? "bg-indigo-50/80 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-100"
                      : "hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-200"
                  }`}
                >
                  <Compass className="w-4 h-4 text-indigo-500 mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-slate-900 dark:text-white truncate">
                      {item.title}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div
                onClick={() => handleSubmit(query)}
                className="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 text-sm font-medium text-indigo-600 dark:text-indigo-400"
              >
                <span>Search knowledge for "{query}"</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Featured Suggestion Chips on Home view */}
      {!isCompact && (
        <div className="mt-4 flex items-center flex-wrap justify-center gap-2 text-xs">
          <span className="text-slate-500 dark:text-slate-400 font-medium">Popular Topics:</span>
          {FEATURED_TOPICS.map((topic) => (
            <button
              key={topic}
              type="button"
              onClick={() => {
                setQuery(topic);
                handleSubmit(topic);
              }}
              className="px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800/80 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950/60 dark:hover:text-indigo-300 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700/60 font-medium transition-colors cursor-pointer"
            >
              {topic}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
