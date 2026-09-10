import React, { useState } from 'react';
import {
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Sparkles,
  GraduationCap,
  BookOpen,
  FlaskConical,
  Check,
} from 'lucide-react';
import { ChatMode, ConceptSpecs, ExamSpecs, ResearchSpecs } from '../../types/chat';

interface SpecificationsAccordionProps {
  mode: ChatMode;
  specs: {
    concept?: Partial<ConceptSpecs>;
    exam?: Partial<ExamSpecs>;
    research?: Partial<ResearchSpecs>;
  };
  onChangeSpecs: (specs: {
    concept?: Partial<ConceptSpecs>;
    exam?: Partial<ExamSpecs>;
    research?: Partial<ResearchSpecs>;
  }) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export const SpecificationsAccordion: React.FC<SpecificationsAccordionProps> = ({
  mode,
  specs,
  onChangeSpecs,
  isOpen,
  onToggle,
}) => {
  const concept = specs.concept || {
    level: 'intermediate',
  };

  const exam = specs.exam || {
    targetExam: '',
    questionNature: 'short',
    className: '',
  };

  const research = specs.research || {
    recency: '5_years',
    minCitations: 'any',
    includeCode: true,
    includeDatasets: false,
  };

  const handleConceptChange = (key: keyof ConceptSpecs, val: any) => {
    onChangeSpecs({
      ...specs,
      concept: { ...concept, [key]: val },
    });
  };

  const handleExamChange = (key: keyof ExamSpecs, val: any) => {
    onChangeSpecs({
      ...specs,
      exam: { ...exam, [key]: val },
    });
  };

  const handleResearchChange = (key: keyof ResearchSpecs, val: any) => {
    onChangeSpecs({
      ...specs,
      research: { ...research, [key]: val },
    });
  };

  const handleReset = () => {
    onChangeSpecs({
      concept: { level: 'intermediate' },
      exam: { targetExam: '', questionNature: 'short', className: '' },
      research: { recency: '5_years', minCitations: 'any', includeCode: true, includeDatasets: false },
    });
  };

  return (
    <div className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70 shrink-0 transition-all">
      {/* Accordion Toggle Bar */}
      <div className="px-4 py-2 flex items-center justify-between">
        <button
          onClick={onToggle}
          className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>Specifications & Filters ({mode.toUpperCase()} MODE)</span>
          {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {isOpen && (
          <button
            onClick={handleReset}
            className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            title="Reset filters to defaults"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* Accordion Body */}
      {isOpen && (
        <div className="px-4 pb-3 pt-1 border-t border-slate-200/60 dark:border-slate-800/60 text-xs animate-in slide-in-from-top-1 duration-150">
          {/* 1. CONCEPT MODE SPECIFICATIONS */}
          {mode === 'concept' && (
            <div className="max-w-md space-y-1">
              {/* Depth / Level */}
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Target Depth / Level
              </label>
              <div className="flex rounded-lg bg-slate-200/70 dark:bg-slate-800 p-0.5 border border-slate-200 dark:border-slate-700">
                {(['beginner', 'intermediate', 'advanced', 'expert'] as const).map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => handleConceptChange('level', lvl)}
                    className={`flex-1 py-1.5 text-[11px] font-medium rounded-md capitalize transition-colors ${
                      concept.level === lvl
                        ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 font-bold shadow-2xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 2. EXAM MODE SPECIFICATIONS */}
          {mode === 'exam' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Target Board / University */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Target Board / University
                </label>
                <input
                  type="text"
                  value={exam.targetExam || ''}
                  onChange={(e) => handleExamChange('targetExam', e.target.value)}
                  placeholder="e.g. Federal Board, Cambridge A-Levels, MIT, Punjab Board, NUST..."
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 text-xs focus:ring-1 focus:ring-amber-500 focus:border-amber-500 focus:outline-none"
                />
              </div>

              {/* Question Nature */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Question Nature
                </label>
                <div className="flex rounded-lg bg-slate-200/70 dark:bg-slate-800 p-0.5 border border-slate-200 dark:border-slate-700">
                  {(
                    [
                      { id: 'long', label: 'Long Question' },
                      { id: 'short', label: 'Short Question' },
                      { id: 'mcq', label: 'MCQs' },
                    ] as const
                  ).map((nature) => (
                    <button
                      key={nature.id}
                      onClick={() => handleExamChange('questionNature', nature.id)}
                      className={`flex-1 py-1 text-[10px] font-medium rounded-md transition-colors ${
                        (exam.questionNature || 'short') === nature.id
                          ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-300 font-bold shadow-2xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                    >
                      {nature.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Class */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Class / Grade Level
                </label>
                <input
                  type="text"
                  value={exam.className || ''}
                  onChange={(e) => handleExamChange('className', e.target.value)}
                  placeholder="e.g. 9th, 10th, 11th / 1st Year, 12th, BS / Undergrad..."
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 text-xs focus:ring-1 focus:ring-amber-500 focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* 3. RESEARCH MODE SPECIFICATIONS */}
          {mode === 'research' && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              {/* Publication Recency */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Paper Recency
                </label>
                <div className="flex rounded-lg bg-slate-200/70 dark:bg-slate-800 p-0.5 border border-slate-200 dark:border-slate-700">
                  {(
                    [
                      { id: '2_years', label: '2024-26' },
                      { id: '5_years', label: 'Last 5 Yrs' },
                      { id: 'all_time', label: 'All-Time' },
                    ] as const
                  ).map((rec) => (
                    <button
                      key={rec.id}
                      onClick={() => handleResearchChange('recency', rec.id)}
                      className={`flex-1 py-1 text-[10px] font-medium rounded-md transition-colors ${
                        research.recency === rec.id
                          ? 'bg-white dark:bg-slate-700 text-cyan-600 dark:text-cyan-300 font-bold shadow-2xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                    >
                      {rec.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Min Citations */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Min Citations
                </label>
                <div className="flex rounded-lg bg-slate-200/70 dark:bg-slate-800 p-0.5 border border-slate-200 dark:border-slate-700">
                  {(['any', '50+', '500+'] as const).map((cit) => (
                    <button
                      key={cit}
                      onClick={() => handleResearchChange('minCitations', cit)}
                      className={`flex-1 py-1 text-[10px] font-medium rounded-md transition-colors ${
                        research.minCitations === cit
                          ? 'bg-white dark:bg-slate-700 text-cyan-600 dark:text-cyan-300 font-bold shadow-2xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                    >
                      {cit}
                    </button>
                  ))}
                </div>
              </div>

              {/* Include Codebases */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  GitHub Codebases
                </label>
                <button
                  onClick={() => handleResearchChange('includeCode', !research.includeCode)}
                  className={`w-full py-1 px-2 rounded-lg border text-xs font-semibold flex items-center justify-between transition-colors ${
                    research.includeCode
                      ? 'bg-cyan-50 dark:bg-cyan-950/40 border-cyan-300 dark:border-cyan-800 text-cyan-700 dark:text-cyan-300'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'
                  }`}
                >
                  <span>Include Repos</span>
                  {research.includeCode && <Check className="w-3.5 h-3.5 text-cyan-600" />}
                </button>
              </div>

              {/* Include Datasets */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Datasets / Benchmarks
                </label>
                <button
                  onClick={() => handleResearchChange('includeDatasets', !research.includeDatasets)}
                  className={`w-full py-1 px-2 rounded-lg border text-xs font-semibold flex items-center justify-between transition-colors ${
                    research.includeDatasets
                      ? 'bg-cyan-50 dark:bg-cyan-950/40 border-cyan-300 dark:border-cyan-800 text-cyan-700 dark:text-cyan-300'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'
                  }`}
                >
                  <span>Include Data</span>
                  {research.includeDatasets && <Check className="w-3.5 h-3.5 text-cyan-600" />}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
