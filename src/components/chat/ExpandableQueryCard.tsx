import React, { useState } from 'react';
import {
  ChevronDown,
  Sparkles,
  ArrowRight,
  GraduationCap,
  Lightbulb,
  BookOpen,
  Compass,
} from 'lucide-react';
import { ChatMode } from '../../types/chat';

export interface QueryCardData {
  id: string;
  title: string;
  subtitle: string;
  mode: ChatMode;
  details: string;
  focusPoints: string[];
  prompt: string;
}

interface ExpandableQueryCardProps {
  card: QueryCardData;
  personaName: string;
  onSelect: (prompt: string, mode?: ChatMode) => void;
  defaultExpanded?: boolean;
}

export const ExpandableQueryCard: React.FC<ExpandableQueryCardProps> = ({
  card,
  personaName,
  onSelect,
  defaultExpanded = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const getModeIcon = () => {
    switch (card.mode) {
      case 'exam':
        return <GraduationCap className="w-3.5 h-3.5 text-amber-500" />;
      case 'research':
        return <BookOpen className="w-3.5 h-3.5 text-cyan-500" />;
      default:
        return <Lightbulb className="w-3.5 h-3.5 text-indigo-500" />;
    }
  };

  const getModeBadgeClass = () => {
    switch (card.mode) {
      case 'exam':
        return 'bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-300 border-amber-200 dark:border-amber-900';
      case 'research':
        return 'bg-cyan-50 dark:bg-cyan-950/50 text-cyan-600 dark:text-cyan-300 border-cyan-200 dark:border-cyan-900';
      default:
        return 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-300 border-indigo-200 dark:border-indigo-900';
    }
  };

  return (
    <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs hover:border-indigo-400 dark:hover:border-indigo-600/60 transition-all overflow-hidden group">
      {/* Card Header Bar */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="p-3.5 flex items-start justify-between gap-3 cursor-pointer select-none hover:bg-slate-50/80 dark:hover:bg-slate-850/80 transition-colors"
      >
        <div className="flex items-start gap-2.5 min-w-0">
          <div className="mt-0.5 p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 shrink-0">
            {getModeIcon()}
          </div>
          <div className="space-y-0.5 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                {card.title}
              </span>
              <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border uppercase ${getModeBadgeClass()}`}>
                {card.mode}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
              {card.subtitle}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0 pt-0.5">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelect(card.prompt, card.mode);
            }}
            className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-600 text-indigo-600 dark:text-indigo-300 text-[10px] font-bold transition-all flex items-center gap-1 border border-indigo-200 dark:border-indigo-800"
            title="Dive in directly"
          >
            <span>Dive In</span>
            <ArrowRight className="w-3 h-3" />
          </button>

          <button
            type="button"
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-transform"
            aria-label={isExpanded ? 'Collapse query details' : 'Expand query details'}
          >
            <ChevronDown
              className={`w-4 h-4 transition-transform duration-200 ${
                isExpanded ? 'rotate-180 text-indigo-600 dark:text-indigo-400' : ''
              }`}
            />
          </button>
        </div>
      </div>

      {/* Expandable Body */}
      {isExpanded && (
        <div className="px-4 pb-4 pt-1 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/40 text-xs space-y-3 animate-in slide-in-from-top-2 duration-150">
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[11.5px]">
            {card.details}
          </p>

          {card.focusPoints && card.focusPoints.length > 0 && (
            <div className="space-y-1.5">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Key Exploration Areas
              </div>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {card.focusPoints.map((point, pIdx) => (
                  <li
                    key={pIdx}
                    className="flex items-center gap-1.5 text-[11px] text-slate-700 dark:text-slate-300"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="pt-2 flex items-center justify-between">
            <div className="text-[10px] text-slate-400 italic">
              Consults {personaName} directly
            </div>
            <button
              onClick={() => onSelect(card.prompt, card.mode)}
              className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
            >
              <span>Ask {personaName} this Inquiry</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
