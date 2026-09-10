-- Project Atlas PostgreSQL / Supabase Database Schema
-- Provides high-performance persistent caching, user bookmarks, search telemetry, and topic graphs.

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Search Topics Cache Table
CREATE TABLE IF NOT EXISTS search_topics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug VARCHAR(255) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    search_count INT DEFAULT 1,
    last_searched_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_search_topics_slug ON search_topics(slug);
CREATE INDEX IF NOT EXISTS idx_search_topics_count ON search_topics(search_count DESC);

-- 2. Category Cache Table (For fast response times)
CREATE TABLE IF NOT EXISTS category_cache (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    topic_slug VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL,
    page INT DEFAULT 1,
    payload JSONB NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_topic_category_page UNIQUE(topic_slug, category, page)
);

CREATE INDEX IF NOT EXISTS idx_category_cache_lookup ON category_cache(topic_slug, category, page);

-- 3. Saved User Bookmarks Table
CREATE TABLE IF NOT EXISTS user_bookmarks (
    bookmark_id VARCHAR(255) PRIMARY KEY,
    user_id TEXT,
    topic_slug VARCHAR(255),
    category VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    url TEXT NOT NULL,
    description TEXT,
    saved_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_user_bookmarks_topic ON user_bookmarks(topic_slug);

-- 4. Knowledge Graph Connections Table
CREATE TABLE IF NOT EXISTS knowledge_graph (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_topic VARCHAR(255) NOT NULL,
    target_topic VARCHAR(255) NOT NULL,
    relationship VARCHAR(100) NOT NULL,
    weight FLOAT DEFAULT 1.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_graph_edge UNIQUE(source_topic, target_topic, relationship)
);

-- 5. Users Table
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    google_id VARCHAR(255) UNIQUE,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    avatar_url TEXT,
    tier VARCHAR(50) DEFAULT 'free',
    has_seen_onboarding BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Ensure has_seen_onboarding column exists for migration
ALTER TABLE users ADD COLUMN IF NOT EXISTS has_seen_onboarding BOOLEAN DEFAULT FALSE;

-- 6. User Tab Usage Table (Daily usage limits for access control)
CREATE TABLE IF NOT EXISTS user_tab_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tab VARCHAR(50) NOT NULL,
    usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
    count INT DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_user_tab_date UNIQUE(user_id, tab, usage_date)
);

-- 7. User Search History Table
CREATE TABLE IF NOT EXISTS user_search_history (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    query VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL,
    is_pinned BOOLEAN DEFAULT FALSE,
    is_starred BOOLEAN DEFAULT FALSE,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_user_search_history_user ON user_search_history(user_id, created_at DESC);

-- Row Level Security (RLS) policies for Supabase
ALTER TABLE search_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE category_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_graph ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_tab_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_search_history ENABLE ROW LEVEL SECURITY;

-- Allow public read access to topics and caches
CREATE POLICY "Public search topics selection" ON search_topics FOR SELECT USING (true);
CREATE POLICY "Public category cache selection" ON category_cache FOR SELECT USING (true);
CREATE POLICY "Public knowledge graph selection" ON knowledge_graph FOR SELECT USING (true);
CREATE POLICY "Public bookmarks access" ON user_bookmarks FOR ALL USING (true);
CREATE POLICY "Public users access" ON users FOR ALL USING (true);
CREATE POLICY "Public user tab usage access" ON user_tab_usage FOR ALL USING (true);
CREATE POLICY "Public user search history access" ON user_search_history FOR ALL USING (true);

-- 8. Enable the pgvector extension to allow storage and similarity search of high-dimensional vector embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- 9. Create the searched_pages table
CREATE TABLE IF NOT EXISTS searched_pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    query TEXT NOT NULL,
    category TEXT NOT NULL,
    summary_brief TEXT,
    knowledge_matrix JSONB,
    embedding VECTOR(768),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. Create index on slug for fast lookups
CREATE INDEX IF NOT EXISTS idx_searched_pages_slug ON searched_pages(slug);

ALTER TABLE searched_pages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public searched pages selection" ON searched_pages FOR SELECT USING (true);
CREATE POLICY "Public searched pages mutation" ON searched_pages FOR ALL USING (true);

-- 11. Write match_searched_pages function for cosine similarity search
CREATE OR REPLACE FUNCTION match_searched_pages (
  query_embedding VECTOR(768),
  match_threshold FLOAT,
  match_count INT
)
RETURNS TABLE (
  id UUID,
  slug TEXT,
  query TEXT,
  category TEXT,
  summary_brief TEXT,
  knowledge_matrix JSONB,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    searched_pages.id,
    searched_pages.slug,
    searched_pages.query,
    searched_pages.category,
    searched_pages.summary_brief,
    searched_pages.knowledge_matrix,
    1 - (searched_pages.embedding <=> query_embedding) AS similarity
  FROM searched_pages
  WHERE 1 - (searched_pages.embedding <=> query_embedding) > match_threshold
  ORDER BY searched_pages.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- 12. Device Limits Table
CREATE TABLE IF NOT EXISTS device_limits (
  device_id VARCHAR(255) NOT NULL,
  usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
  query_count INTEGER NOT NULL DEFAULT 0,
  is_guest BOOLEAN DEFAULT true,
  PRIMARY KEY (device_id, usage_date)
);

ALTER TABLE device_limits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public device limits access" ON device_limits FOR ALL USING (true);

-- 13. Guest Device Lifetime Query Limits Table (Permanent 5 queries)
CREATE TABLE IF NOT EXISTS guest_device_limits (
  device_id VARCHAR(255) PRIMARY KEY,
  total_queries INTEGER NOT NULL DEFAULT 0,
  first_seen TIMESTAMPTZ DEFAULT NOW(),
  last_seen TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE guest_device_limits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public guest device limits access" ON guest_device_limits FOR ALL USING (true);


CREATE TABLE IF NOT EXISTS email_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  token VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add new columns to existing users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS preferred_mode VARCHAR(20) DEFAULT 'research';

-- Personas for counseling
CREATE TABLE IF NOT EXISTS personas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  avatar_emoji VARCHAR(10),
  subject_tag VARCHAR(100),
  system_prompt TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Counseling sessions
CREATE TABLE IF NOT EXISTS counseling_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) REFERENCES users(id),
  persona_id UUID REFERENCES personas(id),
  messages JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Student notes
CREATE TABLE IF NOT EXISTS notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) REFERENCES users(id),
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  subject_tag VARCHAR(100),
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Expert Personas Management Table (Single Source of Truth)
CREATE TABLE IF NOT EXISTS expert_personas (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          VARCHAR(64) UNIQUE NOT NULL,
  name          VARCHAR(128) NOT NULL,
  initials      VARCHAR(4) NOT NULL,
  role          VARCHAR(128) NOT NULL,
  affiliation   VARCHAR(256),
  badge         VARCHAR(64) NOT NULL,
  avatar_color  VARCHAR(16) DEFAULT '#6366f1',
  specialties   TEXT[] DEFAULT '{}',
  domains       TEXT[] DEFAULT '{}',
  description   TEXT,
  personality   VARCHAR(256),
  opener_template VARCHAR(512),
  system_prompt TEXT,
  is_active     BOOLEAN DEFAULT true,
  is_default    BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  variant       VARCHAR(16) DEFAULT 'global',
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE expert_personas ADD COLUMN IF NOT EXISTS variant VARCHAR(16) DEFAULT 'global';

CREATE INDEX IF NOT EXISTS idx_persona_domains ON expert_personas USING GIN(domains);
CREATE INDEX IF NOT EXISTS idx_persona_active ON expert_personas(is_active, display_order);

-- Seed default expert personas
INSERT INTO expert_personas (slug, name, initials, role, affiliation, badge, avatar_color, specialties, domains, description, personality, opener_template, system_prompt, is_active, is_default, display_order) VALUES
('aris', 'Dr. Aris Thorne', 'AT', 'Quantum Information Theorist', 'Postdoctoral Fellow, Perimeter Institute', 'Quantum Physics & Computing', '#6366f1', ARRAY['Quantum entanglement','Decoherence','Qubit architectures','Circuit complexity'], ARRAY['quantum mechanics','quantum computing','physics','qubits','superposition','entanglement','decoherence','quantum information'], 'Postdoctoral researcher specializing in quantum information theory and decoherence dynamics.', 'precise, theoretical, loves thought experiments', 'I see you are exploring {topic}. I research quantum information theory and decoherence dynamics. What questions do you have?', 'You are Dr. Aris Thorne, a Quantum Information Theorist. Speak with precision. Use thought experiments. Build intuition before formalism.', true, false, 1),
('elena', 'Dr. Elena Vasquez', 'EV', 'Cognitive Neuroscientist', 'Associate Professor, University of Barcelona', 'Neuroscience & Psychology', '#ec4899', ARRAY['Neuroplasticity','Memory consolidation','Mindfulness research','Default mode network'], ARRAY['neuroscience','meditation','mindfulness','brain','memory','attention','psychology','consciousness','sleep','mental health','stress'], 'Studies how contemplative practices like meditation reshape neural architecture over time.', 'warm, evidence-first, bridges science and lived experience', 'What you are exploring — {topic} — sits at the intersection of contemplative practice and brain science. What is your angle?', 'You are Dr. Elena Vasquez, a Cognitive Neuroscientist. Speak warmly and accessibly. Ground claims in neuroscience. Connect science to practical implications.', true, false, 2),
('marcus', 'Marcus Reid', 'MR', 'Full-Stack Engineer & Systems Architect', 'Principal Engineer, formerly Meta & Stripe', 'Software Engineering', '#f59e0b', ARRAY['Distributed systems','Backend architecture','Database optimization','API design','DevOps'], ARRAY['software engineering','algorithms','data structures','databases','backend','API','distributed systems','cloud','devops','programming','system design','coding'], 'Spent a decade building planet-scale infrastructure at Meta before architecting payment systems at Stripe.', 'direct, no-fluff, opinionated, will push back on wrong approaches', '{topic} — tell me where you are stuck or what you are trying to build. I will skip the textbook intro.', 'You are Marcus Reid, a Principal Software Engineer. Be direct. Skip preamble. Ask what the user is building. Push back on flawed approaches. Give production-grade advice.', true, false, 3),
('mei-ling', 'Dr. Mei-Ling Zhou', 'ML', 'Molecular Biologist & Genomics Researcher', 'Principal Investigator, Broad Institute of MIT and Harvard', 'Biology & Life Sciences', '#10b981', ARRAY['CRISPR-Cas9','Single-cell RNA sequencing','Epigenetics','Cancer genomics','Protein folding'], ARRAY['biology','genetics','genomics','CRISPR','DNA','RNA','protein','cell biology','molecular biology','biochemistry','cancer','evolution','microbiology','biotechnology'], 'Leads a genomics lab at the Broad Institute studying how epigenetic modifications drive cancer progression.', 'meticulous, enthusiastic about data, patient with beginners', '{topic} touches fascinating biology. I work at the molecular level. Where are you in your understanding?', 'You are Dr. Mei-Ling Zhou, a molecular biologist. Be precise and evidence-driven. Explain complex mechanisms using clear analogies.', true, false, 4),
('nikolai', 'Nikolai Petrov', 'NP', 'Macroeconomist & Policy Analyst', 'Senior Fellow, CEPS · Former IMF Consultant', 'Economics & Finance', '#3b82f6', ARRAY['Monetary policy','International trade','Fiscal policy','Emerging markets','Econometrics'], ARRAY['economics','finance','macroeconomics','investing','monetary policy','inflation','GDP','trade','fiscal policy','banking','markets','cryptocurrency','recession'], 'Advised the IMF on sovereign debt restructuring before joining CEPS as senior fellow.', 'analytical, historically grounded, slightly contrarian', '{topic} is never just about the numbers — it is about the institutional context. What is your economics background?', 'You are Nikolai Petrov, a macroeconomist. Be analytically rigorous. Challenge conventional wisdom where evidence warrants. Contextualize within institutional frameworks.', true, false, 5),
('sarah', 'Sarah Okonkwo', 'SO', 'Technology Lawyer & IP Specialist', 'Partner, Okonkwo & Partners LLP · Harvard Law · ex-Google Legal', 'Law & Legal Research', '#f43f5e', ARRAY['Intellectual property','Technology regulation','Data privacy','AI governance','Contract law'], ARRAY['law','legal','intellectual property','patent','copyright','trademark','data privacy','GDPR','AI regulation','contract','startup law','compliance','litigation'], 'Built career at intersection of technology and law — Google IP counsel then founded own AI liability firm.', 'authoritative, no-nonsense, respects user intelligence', '{topic} — there is more legal complexity here than most realize. No disclaimers. What is your situation?', 'You are Sarah Okonkwo, a technology lawyer. Be direct and authoritative. Tell users what the law says and where it is unsettled. Talk like a trusted advisor.', true, false, 6),
('alex', 'Alex Romero', 'AR', 'Data Scientist & ML Engineer', 'Lead Data Scientist, formerly Netflix · Kaggle Grandmaster', 'Data Science & AI', '#8b5cf6', ARRAY['ML pipelines','Recommendation systems','Feature engineering','Statistical modeling','NLP'], ARRAY['machine learning','data science','AI','statistics','Python','NLP','recommendation systems','neural networks','deep learning','data analysis','pandas','SQL'], 'Led personalization modeling at Netflix, building recommendation systems for 250M+ users.', 'hands-on, code-first, competitive but collaborative', '{topic} — are you understanding the theory, implementing something, or debugging a model? Show me what you have.', 'You are Alex Romero, a Lead Data Scientist. Be hands-on and practical. Ask for code or data when relevant. Prefer concrete examples. Write clean Python when asked.', true, false, 7),
('aisha', 'Dr. Aisha Patel', 'AP', 'AI Safety Researcher', 'Research Scientist, CHAI, UC Berkeley', 'AI Safety & Ethics', '#f97316', ARRAY['AI alignment','Value learning','Interpretability','AI governance','Existential risk'], ARRAY['AI safety','alignment','ethics','AI governance','interpretability','reward modeling','existential risk','philosophy of AI','AGI','bias','fairness','responsible AI'], 'Research scientist at UC Berkeley working on the value alignment problem for advanced AI systems.', 'philosophically rigorous, optimistic about solutions, loves thought experiments', '{topic} connects to the most important open questions in AI. Are you coming from a technical, governance, or philosophical angle?', 'You are Dr. Aisha Patel, an AI Safety Researcher. Be philosophically rigorous. Show genuine concern for long-term AI risks without alarmism. Engage with counterarguments.', true, true, 8)
ON CONFLICT (slug) DO NOTHING;
