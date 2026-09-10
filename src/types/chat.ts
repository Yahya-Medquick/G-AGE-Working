export type ChatMode = 'concept' | 'exam' | 'research';

export interface ConceptSpecs {
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  mathRigor?: 'intuitive' | 'standard' | 'rigorous';
  explanationStyle?: 'socratic' | 'comprehensive' | 'bulleted';
}

export interface ExamSpecs {
  targetExam?: string;
  questionNature?: 'long' | 'short' | 'mcq' | string;
  className?: string;
  difficulty?: 'standard' | 'challenging' | 'olympiad' | string;
  questionFormat?: 'step_by_step' | 'mcq_analysis' | 'proof' | string;
}

export interface ResearchSpecs {
  recency: '2_years' | '5_years' | 'all_time';
  minCitations: 'any' | '50+' | '500+';
  includeCode: boolean;
  includeDatasets: boolean;
}

export interface ChatMessageMetadata {
  multiLevel?: {
    eli5?: string;
    highSchool?: string;
    undergrad?: string;
    phd?: string;
  };
  examQuestion?: {
    question?: string;
    marks?: number;
    targetExam?: string;
    solution?: string;
    commonPitfalls?: string;
    rubric?: string;
  };
  sources?: Array<{
    title: string;
    url?: string;
    snippet?: string;
  }>;
  papers?: Array<{
    title: string;
    authors?: string[];
    year?: number;
    url?: string;
    citationCount?: number;
    abstract?: string;
    doi?: string;
  }>;
  repos?: Array<{
    name: string;
    url: string;
    stars?: number;
    description?: string;
    language?: string;
  }>;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  mode?: ChatMode;
  personaId?: string;
  imageBase64?: string;
  metadata?: ChatMessageMetadata;
}

export interface ChatSession {
  id: string;
  title: string;
  personaId: string;
  mode: ChatMode;
  variant: 'global' | 'pk';
  isPinned?: boolean;
  createdAt: string;
  updatedAt: string;
  messages: ChatMessage[];
  specs?: {
    concept?: Partial<ConceptSpecs>;
    exam?: Partial<ExamSpecs>;
    research?: Partial<ResearchSpecs>;
  };
}

export interface QueryUsageState {
  isLoggedIn: boolean;
  tier: 'free' | 'logged_out' | 'paid';
  count: number;
  limit: number;
  remaining: number;
  resetInSeconds: number;
}
