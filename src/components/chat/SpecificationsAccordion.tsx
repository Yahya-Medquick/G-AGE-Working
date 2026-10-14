import React, { useEffect } from 'react';
import {
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  RotateCcw,
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

const STORAGE_KEY = 'gage_specs_prefs';

function loadSavedSpecs() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch { return null; }
}

function saveSpecs(specs: any) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(specs));
  } catch {}
}

const DEFAULT_SPECS = {
  concept: { level: 'intermediate' as const },
  exam: { targetExam: '', subject: '', questionNature: 'short', className: '' },
  research: { recency: '5_years' as const, minCitations: 'any' as const, includeCode: true, includeDatasets: false },
};

export const SpecificationsAccordion: React.FC<SpecificationsAccordionProps> = ({
  mode,
  specs,
  onChangeSpecs,
  isOpen,
  onToggle,
}) => {
  useEffect(() => {
    const saved = loadSavedSpecs();
    if (saved) {
      onChangeSpecs({
        concept: { ...DEFAULT_SPECS.concept, ...saved.concept, ...specs.concept },
        exam: { ...DEFAULT_SPECS.exam, ...saved.exam, ...specs.exam },
        research: { ...DEFAULT_SPECS.research, ...saved.research, ...specs.research },
      });
    }
  }, []);

  const concept = specs.concept || DEFAULT_SPECS.concept;
  const exam = specs.exam || DEFAULT_SPECS.exam;
  const research = specs.research || DEFAULT_SPECS.research;

  const handleConceptChange = (key: keyof ConceptSpecs, val: any) => {
    const next = { ...specs, concept: { ...concept, [key]: val } };
    onChangeSpecs(next);
    saveSpecs(next);
  };

  const handleExamChange = (key: keyof ExamSpecs, val: any) => {
    const next = { ...specs, exam: { ...exam, [key]: val } };
    onChangeSpecs(next);
    saveSpecs(next);
  };

  const handleResearchChange = (key: keyof ResearchSpecs, val: any) => {
    const next = { ...specs, research: { ...research, [key]: val } };
    onChangeSpecs(next);
    saveSpecs(next);
  };

  const handleReset = () => {
    onChangeSpecs(DEFAULT_SPECS);
    saveSpecs(DEFAULT_SPECS);
  };

  return (
    <div className="specifications-accordion border-b border-[#D5E0D8] dark:border-[#27403A] bg-[#FFFFFF] dark:bg-[#12231C] shrink-0 transition-all">
      <div className="px-4 py-2 flex items-center justify-between max-[768px]:gap-2 max-[768px]:px-2">
        <button
          onClick={onToggle}
          className="min-h-[44px] flex items-center gap-2 text-xs font-bold text-[#10231C] dark:text-[#E8F2EC] hover:text-[#0A5C45] dark:hover:text-[#5BE0A5] cursor-pointer max-[768px]:min-w-0 max-[768px]:text-left"
        >
          <SlidersHorizontal className="w-4 h-4 text-[#0A5C45] dark:text-[#5BE0A5]" />
          <span className="max-[768px]:min-w-0 max-[768px]:whitespace-normal">Specifications &amp; Filters ({mode.toUpperCase()} MODE)</span>
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        {isOpen && (
          <button
            onClick={handleReset}
            className="min-h-[44px] flex items-center gap-1.5 text-xs text-[#4F6359] hover:text-[#10231C] dark:text-[#9DB5A8] dark:hover:text-[#E8F2EC] cursor-pointer max-[768px]:shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        )}
      </div>

      {isOpen && (
        <div className="px-4 pb-4 pt-1 border-t border-[#D5E0D8] dark:border-[#27403A] text-xs animate-in slide-in-from-top-1 duration-150">

          {mode === 'concept' && (
            <div className="max-w-md space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-[#4F6359] dark:text-[#9DB5A8]">
                Target Depth / Level
              </label>
              <div className="flex rounded-[14px] bg-[#F3F6F1] dark:bg-[#0B1612] p-1 border border-[#D5E0D8] dark:border-[#27403A]">
                {(['beginner', 'intermediate', 'advanced', 'expert'] as const).map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => handleConceptChange('level', lvl)}
                    className={`flex-1 min-h-[44px] py-1.5 text-xs font-semibold rounded-[12px] capitalize transition-colors cursor-pointer ${
                      concept.level === lvl
                        ? 'bg-[#0A5C45] dark:bg-[#0F8056] text-white font-bold'
                        : 'text-[#4F6359] dark:text-[#9DB5A8] hover:text-[#10231C] dark:hover:text-[#E8F2EC]'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>
          )}

          {mode === 'exam' && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-[#4F6359] dark:text-[#9DB5A8]">
                  Target Board / University
                </label>
                <input
                  type="text"
                  value={exam.targetExam || ''}
                  onChange={(e) => handleExamChange('targetExam', e.target.value)}
                  placeholder="e.g. Federal Board, Cambridge, NUST..."
                  className="w-full min-h-[44px] px-3 py-2 rounded-[14px] border border-[#D5E0D8] dark:border-[#27403A] bg-[#F3F6F1] dark:bg-[#0B1612] text-[#10231C] dark:text-[#E8F2EC] placeholder:text-[#4F6359] dark:placeholder:text-[#9DB5A8] text-sm focus:border-[#0A5C45] dark:focus:border-[#0F8056] focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-[#4F6359] dark:text-[#9DB5A8]">
                  Subject
                </label>
                <input
                  type="text"
                  value={exam.subject || ''}
                  onChange={(e) => handleExamChange('subject', e.target.value)}
                  placeholder="e.g. Physics, Chemistry, Maths, Biology..."
                  className="w-full min-h-[44px] px-3 py-2 rounded-[14px] border border-[#D5E0D8] dark:border-[#27403A] bg-[#F3F6F1] dark:bg-[#0B1612] text-[#10231C] dark:text-[#E8F2EC] placeholder:text-[#4F6359] dark:placeholder:text-[#9DB5A8] text-sm focus:border-[#0A5C45] dark:focus:border-[#0F8056] focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-[#4F6359] dark:text-[#9DB5A8]">
                  Question Nature
                </label>
                <div className="flex rounded-[14px] bg-[#F3F6F1] dark:bg-[#0B1612] p-1 border border-[#D5E0D8] dark:border-[#27403A]">
                  {([
                    { id: 'long', label: 'Long Question' },
                    { id: 'short', label: 'Short Question' },
                    { id: 'mcq', label: 'MCQs' },
                  ] as const).map((nature) => (
                    <button
                      key={nature.id}
                      onClick={() => handleExamChange('questionNature', nature.id)}
                      className={`flex-1 min-h-[44px] py-1 text-xs font-semibold rounded-[12px] transition-colors cursor-pointer ${
                        (exam.questionNature || 'short') === nature.id
                          ? 'bg-[#0A5C45] dark:bg-[#0F8056] text-white font-bold'
                          : 'text-[#4F6359] dark:text-[#9DB5A8] hover:text-[#10231C] dark:hover:text-[#E8F2EC]'
                      }`}
                    >
                      {nature.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-[#4F6359] dark:text-[#9DB5A8]">
                  Class / Grade Level
                </label>
                <input
                  type="text"
                  value={exam.className || ''}
                  onChange={(e) => handleExamChange('className', e.target.value)}
                  placeholder="e.g. 9th, 10th, FSc, BS / Undergrad..."
                  className="w-full min-h-[44px] px-3 py-2 rounded-[14px] border border-[#D5E0D8] dark:border-[#27403A] bg-[#F3F6F1] dark:bg-[#0B1612] text-[#10231C] dark:text-[#E8F2EC] placeholder:text-[#4F6359] dark:placeholder:text-[#9DB5A8] text-sm focus:border-[#0A5C45] dark:focus:border-[#0F8056] focus:outline-none"
                />
              </div>
            </div>
          )}

          {mode === 'research' && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-[#4F6359] dark:text-[#9DB5A8]">
                  Paper Recency
                </label>
                <div className="flex rounded-[14px] bg-[#F3F6F1] dark:bg-[#0B1612] p-1 border border-[#D5E0D8] dark:border-[#27403A]">
                  {([
                    { id: '2_years', label: '2024-26' },
                    { id: '5_years', label: 'Last 5 Yrs' },
                    { id: 'all_time', label: 'All-Time' },
                  ] as const).map((rec) => (
                    <button
                      key={rec.id}
                      onClick={() => handleResearchChange('recency', rec.id)}
                      className={`flex-1 min-h-[44px] py-1 text-xs font-semibold rounded-[12px] transition-colors cursor-pointer ${
                        research.recency === rec.id
                          ? 'bg-[#0A5C45] dark:bg-[#0F8056] text-white font-bold'
                          : 'text-[#4F6359] dark:text-[#9DB5A8] hover:text-[#10231C] dark:hover:text-[#E8F2EC]'
                      }`}
                    >
                      {rec.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-[#4F6359] dark:text-[#9DB5A8]">
                  Min Citations
                </label>
                <div className="flex rounded-[14px] bg-[#F3F6F1] dark:bg-[#0B1612] p-1 border border-[#D5E0D8] dark:border-[#27403A]">
                  {(['any', '50+', '500+'] as const).map((cit) => (
                    <button
                      key={cit}
                      onClick={() => handleResearchChange('minCitations', cit)}
                      className={`flex-1 min-h-[44px] py-1 text-xs font-semibold rounded-[12px] transition-colors cursor-pointer ${
                        research.minCitations === cit
                          ? 'bg-[#0A5C45] dark:bg-[#0F8056] text-white font-bold'
                          : 'text-[#4F6359] dark:text-[#9DB5A8] hover:text-[#10231C] dark:hover:text-[#E8F2EC]'
                      }`}
                    >
                      {cit}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-[#4F6359] dark:text-[#9DB5A8]">
                  GitHub Codebases
                </label>
                <button
                  onClick={() => handleResearchChange('includeCode', !research.includeCode)}
                  className={`w-full min-h-[44px] py-2 px-3 rounded-[14px] border text-xs font-bold flex items-center justify-between transition-colors cursor-pointer ${
                    research.includeCode
                      ? 'bg-[#DDEFE6] dark:bg-[#17352A] border-[#0A5C45]/40 text-[#0A5C45] dark:text-[#5BE0A5]'
                      : 'bg-white dark:bg-[#12231C] border-[#D5E0D8] dark:border-[#27403A] text-[#4F6359] dark:text-[#9DB5A8]'
                  }`}
                >
                  <span>Include Repos</span>
                  {research.includeCode && <Check className="w-4 h-4 text-[#0A5C45] dark:text-[#5BE0A5]" />}
                </button>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-[#4F6359] dark:text-[#9DB5A8]">
                  Datasets / Benchmarks
                </label>
                <button
                  onClick={() => handleResearchChange('includeDatasets', !research.includeDatasets)}
                  className={`w-full min-h-[44px] py-2 px-3 rounded-[14px] border text-xs font-bold flex items-center justify-between transition-colors cursor-pointer ${
                    research.includeDatasets
                      ? 'bg-[#DDEFE6] dark:bg-[#17352A] border-[#0A5C45]/40 text-[#0A5C45] dark:text-[#5BE0A5]'
                      : 'bg-white dark:bg-[#12231C] border-[#D5E0D8] dark:border-[#27403A] text-[#4F6359] dark:text-[#9DB5A8]'
                  }`}
                >
                  <span>Include Data</span>
                  {research.includeDatasets && <Check className="w-4 h-4 text-[#0A5C45] dark:text-[#5BE0A5]" />}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
