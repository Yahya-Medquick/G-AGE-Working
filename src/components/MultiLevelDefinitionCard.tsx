import React, { useState, useEffect } from "react";
import { Copy, Check, RefreshCw, BookOpen, Layers, Target, HelpCircle, Plus } from "lucide-react";
import { MarkdownRenderer } from "./MarkdownRenderer";
import { useNotes } from "../hooks/useNotes";

export type ComplexityLevel = "beginner" | "intermediate" | "advanced";

interface LevelDefinitionData {
  levelMeaning?: string;
  definition?: string;
  definingSkills?: string[];
  terms?: string[];
  expectedDepth?: string;
  keyTakeaway?: string;
  typicalProblems?: string;
  checkQuestion?: string;
  analogy?: string;
}

interface LevelDefinitionResponse {
  topic: string;
  beginner: LevelDefinitionData;
  intermediate: LevelDefinitionData;
  advanced: LevelDefinitionData;
}

interface MultiLevelDefinitionCardProps {
  topic: string;
}

export const MultiLevelDefinitionCard: React.FC<MultiLevelDefinitionCardProps> = ({ topic }) => {
  const [activeLevel, setActiveLevel] = useState<ComplexityLevel>("beginner");
  const [data, setData] = useState<LevelDefinitionResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  const { addNote } = useNotes();
  const [addedMap, setAddedMap] = useState<Record<string, boolean>>({});

  const triggerToast = (msg: string) => {
    const toast = document.createElement("div");
    toast.className = "fixed bottom-24 right-6 z-50 bg-slate-900 text-white text-xs px-3.5 py-2.5 rounded-xl border border-slate-700 shadow-xl flex items-center gap-1.5 font-medium animate-fade-in";
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
      await addNote(title, content, "Education");
      setAddedMap((prev) => ({ ...prev, [key]: true }));
      triggerToast("Added to Notes ✓");
      setTimeout(() => setAddedMap((prev) => ({ ...prev, [key]: false })), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchDefinition = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/definition?q=${encodeURIComponent(topic)}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      } else {
        setError("Could not load level definitions.");
      }
    } catch (err) {
      setError("Failed to connect to definition engine.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDefinition();
  }, [topic]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const currentLevelData: LevelDefinitionData | undefined = data ? data[activeLevel] : undefined;

  const levelConfigs = {
    beginner: {
      label: "Beginner",
      subtitle: "Foundational mental models & core terminology",
      badgeClass: "bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800/80",
    },
    intermediate: {
      label: "Intermediate",
      subtitle: "Working knowledge of mechanisms & practical application",
      badgeClass: "bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border-indigo-200/80 dark:border-indigo-800/80",
    },
    advanced: {
      label: "Advanced",
      subtitle: "Formal theory, edge cases & research frontiers",
      badgeClass: "bg-purple-50 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border-purple-200/80 dark:border-purple-800/80",
    },
  };

  const meaningText = currentLevelData?.levelMeaning || currentLevelData?.definition || "";
  const skillsList = currentLevelData?.definingSkills || currentLevelData?.terms || [];
  const depthText = currentLevelData?.expectedDepth || currentLevelData?.keyTakeaway || "";
  const problemsText = currentLevelData?.typicalProblems || currentLevelData?.checkQuestion || currentLevelData?.analogy || "";

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800/70 rounded-2xl p-6 space-y-5">
      {/* Top Header & Level Switcher Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800/80 pb-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-slate-500" />
            <span>Topic Proficiency Definitions</span>
          </h2>
          <p className="text-xs text-slate-400 font-normal mt-0.5">
            What proficiency actually means at each level for <strong className="text-slate-700 dark:text-slate-300 font-medium">{topic}</strong>
          </p>
        </div>

        {/* Level Switcher Segmented Control */}
        <div className="flex items-center gap-1 bg-slate-100/80 dark:bg-slate-800/60 p-1 rounded-full self-start sm:self-auto">
          {(["beginner", "intermediate", "advanced"] as ComplexityLevel[]).map((lvl) => {
            const isActive = activeLevel === lvl;
            const cfg = levelConfigs[lvl];
            return (
              <button
                key={lvl}
                onClick={() => setActiveLevel(lvl)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all select-none cursor-pointer ${
                  isActive
                    ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 font-semibold shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                {cfg.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content Body */}
      {loading ? (
        <div className="py-8 text-center space-y-2">
          <RefreshCw className="w-5 h-5 text-slate-400 animate-spin mx-auto" />
          <p className="text-xs text-slate-500">Generating level definitions for {topic}...</p>
        </div>
      ) : error ? (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-xs text-rose-600 dark:text-rose-300 flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={fetchDefinition}
            className="px-3 py-1 rounded-full bg-rose-600 text-white text-xs font-medium cursor-pointer"
          >
            Retry
          </button>
        </div>
      ) : currentLevelData ? (
        <div className="space-y-5 animate-in fade-in duration-200">
          {/* Level Badge Header */}
          <div className="flex items-center justify-between">
            <span
              className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${levelConfigs[activeLevel].badgeClass}`}
            >
              {levelConfigs[activeLevel].label} Level • {levelConfigs[activeLevel].subtitle}
            </span>

            {meaningText && (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    const content = `## ${levelConfigs[activeLevel].label} Definition: ${topic}\n\n${meaningText}\n\n### Skills:\n${skillsList.join(", ")}\n\n### Expected Depth:\n${depthText}`;
                    handleAddNote(activeLevel, `${levelConfigs[activeLevel].label} Definition: ${topic}`, content);
                  }}
                  className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-xs flex items-center gap-1 transition-colors cursor-pointer font-medium"
                >
                  {addedMap[activeLevel] ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-emerald-500 text-[11px] font-medium">Added</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" />
                      <span className="text-[11px]">+ Notes</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => handleCopy(`${levelConfigs[activeLevel].label} definition for ${topic}:\n${meaningText}`)}
                  className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-xs flex items-center gap-1 transition-colors cursor-pointer"
                  title="Copy definition text"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-emerald-500 text-[11px] font-medium">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span className="text-[11px]">Copy</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Primary Text: What this level means */}
          <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-950/50 border border-slate-200/60 dark:border-slate-800/60 space-y-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">
              What {levelConfigs[activeLevel].label} Means for {topic}
            </span>
            <MarkdownRenderer content={meaningText} className="text-sm text-slate-800 dark:text-slate-200" />
          </div>

          {/* Grid for Defining Concepts & Depth of Understanding */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Core Skills / Defining Concepts */}
            {skillsList.length > 0 && (
              <div className="p-4 rounded-xl bg-slate-50/50 dark:bg-slate-950/30 border border-slate-200/60 dark:border-slate-800/60 space-y-2">
                <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5 text-xs">
                  <Layers className="w-3.5 h-3.5 text-slate-400" />
                  <span>Defining Concepts & Skills</span>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {skillsList.map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-md bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 text-slate-700 dark:text-slate-300 text-[11px] font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Expected Depth of Understanding */}
            {depthText && (
              <div className="p-4 rounded-xl bg-slate-50/50 dark:bg-slate-950/30 border border-slate-200/60 dark:border-slate-800/60 space-y-1.5">
                <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5 text-xs">
                  <Target className="w-3.5 h-3.5 text-slate-400" />
                  <span>Expected Depth of Understanding</span>
                </div>
                <MarkdownRenderer content={depthText} className="text-xs text-slate-600 dark:text-slate-300" />
              </div>
            )}
          </div>

          {/* Typical Problems & Scenarios Tackled */}
          {problemsText && (
            <div className="p-4 rounded-xl bg-slate-50/50 dark:bg-slate-950/30 border border-slate-200/60 dark:border-slate-800/60 space-y-1.5 text-xs">
              <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5 text-xs">
                <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                <span>Typical Scenarios & Questions Tackled</span>
              </div>
              <MarkdownRenderer content={problemsText} className="text-xs text-slate-600 dark:text-slate-300" />
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
};
