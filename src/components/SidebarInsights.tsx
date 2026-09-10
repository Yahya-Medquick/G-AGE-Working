import React from "react";
import { Network, ArrowUpRight } from "lucide-react";
import { Entity } from "../types";

interface SidebarInsightsProps {
  entity?: Entity | null;
  query: string;
  matchedAlias?: string | null;
  rankingScore?: number;
  synonymsConnected?: string[];
  onSelectSynonym: (synonym: string) => void;
}

export const SidebarInsights: React.FC<SidebarInsightsProps> = ({
  entity,
  query,
  matchedAlias,
  synonymsConnected = [],
  onSelectSynonym,
}) => {
  if (!entity && !query) return null;

  const displayTitle = entity ? entity.title : query;
  const aliases = entity?.aliases || synonymsConnected || ["gravitation", "Newton", "General Relativity", "black holes"];

  return (
    <aside className="w-full lg:w-64 space-y-5 shrink-0">
      {/* Entity Overview */}
      <div className="space-y-2">
        <h3 className="text-base font-bold text-slate-900 dark:text-white capitalize">
          {displayTitle}
        </h3>
        {matchedAlias && (
          <p className="text-xs text-slate-400">
            Alias: <span className="text-slate-600 dark:text-slate-300 font-medium">"{matchedAlias}"</span>
          </p>
        )}
        {entity?.description && (
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed pt-1">
            {entity.description}
          </p>
        )}
      </div>

      {/* Connected Concepts / Synonyms */}
      {aliases.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-slate-200/60 dark:border-slate-800/60">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Related Concepts
          </span>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {aliases.map((alias, idx) => (
              <button
                key={idx}
                onClick={() => onSelectSynonym(alias)}
                className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-medium transition-colors flex items-center gap-1"
              >
                <span>{alias}</span>
                <ArrowUpRight className="w-3 h-3 text-slate-400" />
              </button>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
};

