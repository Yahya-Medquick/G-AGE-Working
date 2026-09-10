export type CategoryType = 
  | 'overview' 
  | 'education' 
  | 'news' 
  | 'software' 
  | 'videos' 
  | 'books' 
  | 'research' 
  | 'communities' 
  | 'related'
  | 'recommendations'
  | 'history'
  | 'qa'
  | 'counseling'
  | 'notes';

export interface UserAuth {
  id: string;
  username?: string;
  phone?: string;
  google_id?: string;
  email?: string;
  name?: string;
  avatar_url?: string;
  tier: 'free' | 'logged_out' | 'paid' | 'pro' | 'unlimited';
  has_seen_onboarding?: boolean;
  created_at?: string;
  preferred_mode?: 'research' | 'learning';
  is_guest?: boolean;
}

export interface TabUsage {
  tab: CategoryType;
  count: number;
  limit: number;
  remaining: number;
  resetInSeconds: number;
}

export interface HistoryItem {
  id: string;
  userId: string;
  query: string;
  category: CategoryType;
  isPinned: boolean;
  isStarred: boolean;
  displayOrder: number;
  createdAt: string;
}

export interface RecommendationItem {
  id: string;
  title: string;
  category: string;
  reason: string;
  url: string;
  relevanceScore: number;
}

export interface CategoryInfo {
  id: CategoryType;
  label: string;
  shortLabel: string;
  iconName: string;
  description: string;
  badge?: string;
}

export interface OverviewData {
  topic: string;
  summary: string;
  wikiExtract?: string;
  wikiUrl?: string;
  wikiThumbnail?: string;
  quickFacts: Array<{ label: string; value: string }>;
  timeline: Array<{ year: string; title: string; description: string }>;
  keyFigures: Array<{ name: string; role: string; contribution: string; imageUrl?: string }>;
  coreConcepts: Array<{ title: string; description: string; tags: string[] }>;
}

export interface ResearchPaper {
  id: string;
  title: string;
  authors: string[];
  publicationYear: number;
  journalOrVenue: string;
  doi?: string;
  url: string;
  citationCount: number;
  abstract: string;
  openAccess: boolean;
  pdfUrl?: string;
}

export interface SoftwareRepo {
  id: string;
  name: string;
  fullName: string;
  description: string;
  url: string;
  stars: number;
  forks: number;
  language: string;
  ownerAvatar?: string;
  topics: string[];
  updatedAt: string;
}

export interface BookItem {
  id: string;
  title: string;
  subtitle?: string;
  authors: string[];
  publishedDate: string;
  description: string;
  thumbnail?: string;
  categories: string[];
  previewLink: string;
  pageCount?: number;
  rating?: number;
}

export interface VideoItem {
  id: string;
  videoId?: string;
  url?: string;
  videoUrl?: string;
  link?: string;
  title: string;
  channelTitle: string;
  description: string;
  thumbnailUrl: string;
  publishedAt: string;
  duration?: string;
  views?: string;
}

export interface LearningStep {
  step: number;
  title: string;
  summary: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  keyTakeaways: string[];
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  answerIndex: number;
  explanation: string;
}

export interface CourseItem {
  title: string;
  platform: string;
  url: string;
  rating: number;
  level: string;
  description: string;
}

export interface EducationData {
  learningPath: LearningStep[];
  quizQuestions: QuizQuestion[];
  freeCourses: CourseItem[];
}

export interface NewsArticle {
  id: string;
  title: string;
  source: string;
  description: string;
  url: string;
  imageUrl?: string;
  publishedAt: string;
  author?: string;
}

export interface CommunityDiscussion {
  id: string;
  title: string;
  platform: 'Reddit' | 'StackExchange' | 'Forum';
  communityName: string;
  author: string;
  url: string;
  score: number;
  commentsCount: number;
  snippet: string;
  createdAt: string;
}

export interface SimControl {
  id: string;
  label: string;
  min: number;
  max: number;
  defaultVal: number;
  step: number;
  unit?: string;
}

export interface InteractiveSimulation {
  id: string;
  title: string;
  type: 'physics' | 'logic' | 'visualizer' | 'interactive_diagram' | 'math_sandbox';
  description: string;
  instructions: string;
  controls: SimControl[];
  presetValues: Record<string, number>;
}

export interface KnowledgeNode {
  id: string;
  label: string;
  category: string;
  summary: string;
  relevanceScore: number;
}

export interface KnowledgeEdge {
  source: string;
  target: string;
  relationship: string;
}

export interface KnowledgeGraphData {
  nodes: KnowledgeNode[];
  edges: KnowledgeEdge[];
}

export interface CategoryApiResponse<T = any> {
  topic: string;
  category: CategoryType;
  items: T[];
  overviewData?: OverviewData;
  educationData?: EducationData;
  simulationData?: InteractiveSimulation;
  knowledgeGraph?: KnowledgeGraphData;
  strictFiltered?: boolean;
  filterInfo?: {
    term: string;
    mode: 'all' | 'any' | 'phrase';
    strictCount: number;
    totalFetched: number;
    fallbackToBroad: boolean;
  };
  pagination: {
    page: number;
    limit: number;
    hasMore: boolean;
    total?: number;
  };
  cached: boolean;
  timestamp: number;
}

export interface Entity {
  id: string;
  slug: string;
  title: string;
  description: string;
  aliases: string[];
  categoriesAvailable: CategoryType[];
  popularityScore: number;
  freshnessScore: number;
  authorityScore: number;
  relatedEntities: string[];
  lastUpdated: string;
}

export interface SearchSuggestion {
  title: string;
  description: string;
  type: 'topic' | 'entity' | 'synonym';
  matchedAlias?: string;
  targetEntitySlug?: string;
}

export interface AdminStats {
  totalSearches: number;
  cacheHitRate: number;
  totalCachedKeys: number;
  memoryUsageMb: number;
  apiCalls: {
    openAlex: number;
    wikipedia: number;
    gemini: number;
    github: number;
    reddit: number;
  };
  topQueries: Array<{ query: string; count: number }>;
  backgroundJobsStatus: {
    running: boolean;
    lastRunAt: string;
    entitiesRefreshed: number;
    nextRunSeconds: number;
  };
}

export interface UserProfile {
  name: string;
  username?: string;
  phone?: string;
  email?: string;
  role: 'Explorer' | 'Researcher' | 'Admin';
  savedSearches: string[];
  recentSearches: string[];
  preferences: {
    defaultSort: 'citations' | 'relevance' | 'freshness';
    autoExpandSynonyms: boolean;
    compactView: boolean;
  };
}

export interface WorkspaceCollection {
  id: string;
  name: string;
  description: string;
  color: string;
  createdAt: number;
  itemsCount: number;
}

export interface TopicTimelineEvent {
  year: string;
  title: string;
  description: string;
  keyFigure?: string;
  impact: 'low' | 'medium' | 'high' | 'breakthrough';
  sourceUrl?: string;
}

export interface EntityComparison {
  entityA: Entity;
  entityB: Entity;
  commonCategories: CategoryType[];
  differences: Array<{
    feature: string;
    valueA: string;
    valueB: string;
  }>;
  similarityScore: number; // 0 to 100
  keyTakeaway: string;
}

export interface AIQuestionAnswer {
  question: string;
  answer: string;
  confidence: number;
  sources: Array<{ title: string; url: string }>;
  relatedFollowups: string[];
  modelUsed?: string;
  isBackupModel?: boolean;
  backupNotice?: string;
}

export interface ContentQualityScore {
  isSpam: boolean;
  isDuplicate: boolean;
  qualityScore: number; // 0 to 100
  authorityFactor: number;
  relevanceScore: number;
  flags: string[];
}

export interface DeveloperApiEndpoint {
  method: 'GET' | 'POST';
  path: string;
  description: string;
  parameters: Array<{ name: string; type: string; required: boolean; description: string }>;
  exampleResponse: string;
}

export interface Persona {
  id: string;
  name: string;
  avatar_emoji: string;
  subject_tag: string;
  system_prompt: string;
  is_active: boolean;
  created_at?: string;
}

export interface ExpertPersona {
  id: string;
  slug?: string;
  name: string;
  initials: string;
  role: string;
  affiliation?: string | null;
  badge: string;
  status?: string;
  avatar_color?: string;
  specialties: string[];
  domains: string[];
  description?: string | null;
  personality?: string | null;
  opener_template?: string | null;
  opener?: (topic: string) => string;
  system_prompt: string;
  is_active?: boolean;
  is_default?: boolean;
  display_order?: number;
  variant?: 'global' | 'pk';
  match_score?: number | string;
  created_at?: string;
  updated_at?: string;
}


