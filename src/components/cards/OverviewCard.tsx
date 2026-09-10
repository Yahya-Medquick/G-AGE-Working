import React, { useState } from "react";
import { OverviewData } from "../../types";
import { ExternalLink, Calendar, Users, Cpu, ChevronDown, ChevronUp, Sparkles, Network, Plus, Check } from "lucide-react";
import { MarkdownRenderer } from "../MarkdownRenderer";
import { useNotes } from "../../hooks/useNotes";

interface OverviewCardProps {
  data: OverviewData;
  entity?: any;
  rankingScore?: number;
  synonymsConnected?: string[];
  onBookmark?: (title: string, category: any, url: string, desc?: string) => void;
  isBookmarked?: boolean;
}

export const OverviewCard: React.FC<OverviewCardProps> = ({
  data,
  entity,
  rankingScore = 95,
  synonymsConnected = [],
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const { addNote } = useNotes();
  const [addedMap, setAddedMap] = useState<Record<string, boolean>>({});

  const popularityScore = entity?.popularityScore ?? 94;
  const authorityScore = entity?.authorityScore ?? 98;
  const freshnessScore = entity?.freshnessScore ?? 91;
  const aliases = entity?.aliases || synonymsConnected || ["gravitation", "Newtonian Physics", "General Relativity"];

  const triggerToast = (msg: string) => {
    const toast = document.createElement("div");
    toast.className = "fixed bottom-24 right-6 z-50 bg-slate-900 text-white text-xs px-3.5 py-2.5 rounded-xl border border-slate-700 shadow-xl flex items-center gap-1.5 font-medium";
    toast.innerHTML = `<span>✓</span> <span>${msg}</span>`;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transition = "opacity 0.5s ease";
      setTimeout(() => toast.remove(), 500);
    }, 2000);
  };

  const handleAddNote = async (key: string, title: string, content: string) => {
    try {
      await addNote(title, content, data.topic || "Overview");
      setAddedMap((prev) => ({ ...prev, [key]: true }));
      triggerToast("Added to Notes ✓");
      setTimeout(() => setAddedMap((prev) => ({ ...prev, [key]: false })), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-300">
      {/* Primary Summary Block - Clean & Uncluttered */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Summary
          </h3>
          <button
            onClick={() => handleAddNote("summary", `Summary: ${data.topic || "Topic"}`, data.summary)}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
          >
            {addedMap["summary"] ? <Check className="w-3 h-3 text-emerald-500" /> : <Plus className="w-3 h-3" />}
            <span>{addedMap["summary"] ? "Added" : "+ Notes"}</span>
          </button>
        </div>
        <div className="flex flex-col lg:flex-row gap-6 items-start justify-between">
          <div className="flex-1 space-y-3">
            <MarkdownRenderer content={data.summary} className="text-lg sm:text-xl text-slate-800 dark:text-slate-100" />

            {data.wikiUrl && (
              <a
                href={data.wikiUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors pt-1"
              >
                <span>Wikipedia Reference</span>
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </a>
            )}

            {data.wikiExtract && data.wikiExtract !== data.summary && (
              <p className="text-xs text-slate-500 dark:text-slate-400 italic border-l-2 border-slate-300 dark:border-slate-700 pl-3 py-1 mt-2">
                "{data.wikiExtract}"
              </p>
            )}
          </div>

          {data.wikiThumbnail && (
            <div className="w-full lg:w-44 h-44 rounded-xl overflow-hidden border border-slate-200/80 dark:border-slate-800 shrink-0 bg-slate-100 dark:bg-slate-900">
              <img
                src={data.wikiThumbnail}
                alt={data.topic}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
          )}
        </div>

        {/* Expandable "More details & metrics" Section (Progressive Disclosure) */}
        <div className="pt-2">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="inline-flex items-center gap-2 text-xs font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white py-1 transition-colors select-none"
          >
            <span>{showDetails ? "Hide secondary metrics & metadata" : "More details & metrics"}</span>
            {showDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {showDetails && (
            <div className="mt-3 p-5 rounded-2xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/60 space-y-5 animate-in fade-in duration-200">
              {/* Consolidated Metrics Badges */}
              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                  System Intelligence Metrics
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-800/60">
                    <span className="text-[10px] text-slate-400 block font-medium">Rank Score</span>
                    <span className="text-sm font-semibold text-slate-900 dark:text-white">{rankingScore}/100</span>
                  </div>
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-800/60">
                    <span className="text-[10px] text-slate-400 block font-medium">Popularity Metric</span>
                    <span className="text-sm font-semibold text-slate-900 dark:text-white">{popularityScore}%</span>
                  </div>
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-800/60">
                    <span className="text-[10px] text-slate-400 block font-medium">Academic Authority</span>
                    <span className="text-sm font-semibold text-slate-900 dark:text-white">{authorityScore}/100</span>
                  </div>
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-800/60">
                    <span className="text-[10px] text-slate-400 block font-medium">Freshness Index</span>
                    <span className="text-sm font-semibold text-slate-900 dark:text-white">{freshnessScore}%</span>
                  </div>
                </div>
              </div>

              {/* Quick Metadata Facts */}
              {data.quickFacts && data.quickFacts.length > 0 && (
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                    Metadata & Quick Facts
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {data.quickFacts.map((fact, idx) => (
                      <div key={idx} className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-800/60">
                        <span className="text-[10px] text-slate-400 block font-medium">{fact.label}</span>
                        <span className="text-xs font-semibold text-slate-900 dark:text-white truncate block">{fact.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Connected Synonyms & Aliases */}
              {aliases.length > 0 && (
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                    Connected Synonyms & Aliases
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {aliases.map((alias, idx) => (
                      <span key={idx} className="px-2.5 py-1 rounded-full text-xs bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-300">
                        {alias}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Core Concepts - Spacious & Clean */}
      {data.coreConcepts && data.coreConcepts.length > 0 && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Core Principles
            </h3>
            <button
              onClick={() => {
                const content = data.coreConcepts.map(c => `### ${c.title}\n${c.description}\nTags: ${c.tags.join(', ')}`).join('\n\n');
                handleAddNote("concepts", `Core Principles: ${data.topic || "Topic"}`, content);
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
            >
              {addedMap["concepts"] ? <Check className="w-3 h-3 text-emerald-500" /> : <Plus className="w-3 h-3" />}
              <span>{addedMap["concepts"] ? "Added" : "+ Notes"}</span>
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {data.coreConcepts.map((concept, idx) => (
              <div
                key={idx}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800/70 space-y-2.5"
              >
                <h4 className="font-semibold text-slate-900 dark:text-white text-base">
                  {concept.title}
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {concept.description}
                </p>
                <div className="flex flex-wrap gap-1 pt-1">
                  {concept.tags.map((tag, tIdx) => (
                    <span
                      key={tIdx}
                      className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Timeline Section - Elegant Minimalist Vertical Line */}
      {data.timeline && data.timeline.length > 0 && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Evolution & History
            </h3>
            <button
              onClick={() => {
                const content = data.timeline.map(t => `* **${t.year}**: ${t.title} - ${t.description}`).join('\n');
                handleAddNote("timeline", `Timeline: ${data.topic || "Topic"}`, content);
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
            >
              {addedMap["timeline"] ? <Check className="w-3 h-3 text-emerald-500" /> : <Plus className="w-3 h-3" />}
              <span>{addedMap["timeline"] ? "Added" : "+ Notes"}</span>
            </button>
          </div>
          <div className="relative border-l border-slate-200 dark:border-slate-800 ml-3 pl-5 space-y-6">
            {data.timeline.map((item, idx) => (
              <div key={idx} className="relative">
                <div className="absolute -left-[25px] top-1.5 w-2 h-2 rounded-full bg-slate-400 dark:bg-slate-600" />
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {item.year}
                </span>
                <h4 className="font-semibold text-slate-900 dark:text-white text-sm mt-0.5">
                  {item.title}
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Key Figures - Clean Grid */}
      {data.keyFigures && data.keyFigures.length > 0 && (
        <div className="space-y-4 pt-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Key Figures
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {data.keyFigures.map((person, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl border border-slate-200/70 dark:border-slate-800/70 bg-white dark:bg-slate-900 flex items-start gap-3"
              >
                <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold text-xs shrink-0">
                  {person.name.charAt(0)}
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-white text-sm">
                    {person.name}
                  </h4>
                  <p className="text-[11px] text-slate-400 font-medium">
                    {person.role}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                    {person.contribution}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
