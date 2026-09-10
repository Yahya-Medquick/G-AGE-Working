import React, { useState, useEffect } from 'react';
import { X, Network, Search, Sparkles, Compass, RefreshCw, Layers } from 'lucide-react';
import { KnowledgeGraph } from './KnowledgeGraph';
import { KnowledgeGraphData } from '../types';

interface KnowledgeGraphModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTopic: string;
  onSelectTopic: (topic: string) => void;
}

export const KnowledgeGraphModal: React.FC<KnowledgeGraphModalProps> = ({
  isOpen,
  onClose,
  initialTopic,
  onSelectTopic,
}) => {
  const [topic, setTopic] = useState<string>(initialTopic || 'Quantum Mechanics');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [graphData, setGraphData] = useState<KnowledgeGraphData | null>(null);
  const [trendingEntities, setTrendingEntities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialTopic) {
      setTopic(initialTopic);
    }
  }, [initialTopic]);

  const fetchGraphForTopic = async (targetTopic: string) => {
    if (!targetTopic) return;
    setIsLoading(true);
    setError(null);
    try {
      // 1. Fetch semantic entity search for connected nodes
      const res = await fetch(`/api/entities/search?q=${encodeURIComponent(targetTopic)}`);
      let connectedEntities: any[] = [];
      let matchedEntity: any = null;

      if (res.ok) {
        const json = await res.json();
        connectedEntities = json.connectedEntities || [];
        matchedEntity = json.matchedEntity || null;
      }

      // 2. Fetch trending entities if connected are fewer than 4
      if (connectedEntities.length < 4) {
        try {
          const trendRes = await fetch('/api/entities/trending');
          if (trendRes.ok) {
            const trendJson = await trendRes.json();
            const trending = (trendJson.trending || []).filter(
              (t: any) => t.title.toLowerCase() !== targetTopic.toLowerCase()
            );
            setTrendingEntities(trending);
            connectedEntities = [...connectedEntities, ...trending.slice(0, 5 - connectedEntities.length)];
          }
        } catch (e) {
          console.warn('Failed to fetch trending entities for graph:', e);
        }
      }

      // Fallback nodes if empty
      if (connectedEntities.length === 0) {
        connectedEntities = [
          { title: `${targetTopic} Foundations`, description: `Fundamental paradigms and core principles of ${targetTopic}`, slug: 'foundations' },
          { title: `${targetTopic} Applied Models`, description: `Practical implementations and computational structures`, slug: 'applied' },
          { title: `${targetTopic} Modern Research`, description: `Emerging peer-reviewed breakthroughs and active frontiers`, slug: 'research' },
          { title: `${targetTopic} Mathematical Rigor`, description: `Formal derivations, equations, and analytical frameworks`, slug: 'rigor' },
        ];
      }

      // Construct KnowledgeGraphData schema
      const centerNode = {
        id: 'center',
        label: matchedEntity?.title || targetTopic,
        category: 'Target Domain',
        summary: matchedEntity?.description || `Primary conceptual hub for ${targetTopic}`,
        relevanceScore: 100,
      };

      const outerNodes = connectedEntities.map((ent: any, idx: number) => ({
        id: `node-${idx}-${ent.slug || idx}`,
        label: ent.title || ent.name || `Related Topic ${idx + 1}`,
        category: ent.category || 'Connected Concept',
        summary: ent.description || `Exploratory node connected to ${targetTopic}`,
        relevanceScore: ent.popularityScore || Math.max(60, 95 - idx * 7),
      }));

      const edges = outerNodes.map((node: any) => ({
        source: 'center',
        target: node.id,
        relationship: 'semantic_association',
      }));

      setGraphData({
        nodes: [centerNode, ...outerNodes],
        edges,
      });
    } catch (err: any) {
      console.warn('Graph generation error:', err);
      setError('Unable to load graph connections for this topic.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && topic) {
      fetchGraphForTopic(topic);
    }
  }, [isOpen, topic]);

  if (!isOpen) return null;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setTopic(searchQuery.trim());
      setSearchQuery('');
    }
  };

  const handleSelectConnected = (selected: string) => {
    setTopic(selected);
    onSelectTopic(selected);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden text-slate-800 dark:text-slate-100">
        {/* Modal Top Bar */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/80 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-md shadow-indigo-500/20 shrink-0">
              <Network className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 truncate">
                <span>Semantic Knowledge Graph</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  Interactive Network
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                Radial entity relationships, cross-disciplinary associations, and discovery pathways
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search / Topic Switcher Toolbar */}
        <div className="p-4 border-b border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col sm:flex-row items-center gap-3">
          <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search another topic (currently: ${topic})...`}
              className="w-full pl-10 pr-24 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="submit"
              disabled={!searchQuery.trim()}
              className="absolute right-1.5 top-1.5 px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-bold text-xs cursor-pointer transition-colors"
            >
              Explore
            </button>
          </form>

          <button
            onClick={() => fetchGraphForTopic(topic)}
            disabled={isLoading}
            className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-xs font-semibold flex items-center gap-1.5 shrink-0 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Regenerate Network</span>
          </button>
        </div>

        {/* Graph Stage Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/50 dark:bg-slate-950/50">
          {isLoading && !graphData ? (
            <div className="py-24 text-center space-y-3">
              <div className="w-9 h-9 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin mx-auto" />
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                Synthesizing semantic graph vectors for &ldquo;{topic}&rdquo;...
              </p>
            </div>
          ) : error ? (
            <div className="p-8 text-center space-y-3">
              <p className="text-sm font-semibold text-rose-600 dark:text-rose-400">{error}</p>
              <button
                onClick={() => fetchGraphForTopic(topic)}
                className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold"
              >
                Try Again
              </button>
            </div>
          ) : graphData ? (
            <KnowledgeGraph
              graphData={graphData}
              onSelectTopic={(selected) => handleSelectConnected(selected)}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
};
