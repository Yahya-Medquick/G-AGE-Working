import React, { useState, useEffect } from "react";
import { X, ArrowLeftRight, CheckCircle2, Sparkles, Scale, RefreshCw } from "lucide-react";
import { EntityComparison } from "../types";
import { getAuthHeaders } from "../services/api";

interface TopicCompareModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTopicA?: string;
  onSelectTopic?: (topic: string) => void;
}

export const TopicCompareModal: React.FC<TopicCompareModalProps> = ({
  isOpen,
  onClose,
  defaultTopicA = "Gravity",
  onSelectTopic,
}) => {
  const [topicA, setTopicA] = useState(defaultTopicA);
  const [topicB, setTopicB] = useState("Quantum Computing");
  const [data, setData] = useState<EntityComparison | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchComparison = async () => {
    if (!topicA || !topicB) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/compare?a=${encodeURIComponent(topicA)}&b=${encodeURIComponent(topicB)}`, {
        credentials: "include",
        headers: { ...getAuthHeaders() },
      });
      if (res.ok) {
        const json = await res.json();
        setData(json.comparison);
      }
    } catch (err) {
      console.warn("Failed to fetch entity comparison:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setTopicA(defaultTopicA);
      fetchComparison();
    }
  }, [isOpen, defaultTopicA]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden text-slate-800 dark:text-slate-100">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-600 text-white font-bold flex items-center justify-center shadow-md">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Entity & Concept Comparison Matrix
              </h2>
              <p className="text-xs text-slate-500">Cross-dimensional feature differential and metric comparison</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Selection */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col sm:flex-row items-center gap-4 text-xs">
          <div className="flex-1 w-full">
            <label className="block font-semibold mb-1 text-slate-500 uppercase text-[10px]">Topic A</label>
            <input
              type="text"
              value={topicA}
              onChange={(e) => setTopicA(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold text-slate-900 dark:text-white"
            />
          </div>

          <div className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 shrink-0">
            <ArrowLeftRight className="w-4 h-4" />
          </div>

          <div className="flex-1 w-full">
            <label className="block font-semibold mb-1 text-slate-500 uppercase text-[10px]">Topic B</label>
            <input
              type="text"
              value={topicB}
              onChange={(e) => setTopicB(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold text-slate-900 dark:text-white"
            />
          </div>

          <button
            onClick={fetchComparison}
            disabled={loading}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold transition-colors flex items-center justify-center gap-1.5 shrink-0"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            <span>Compare Topics</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50 dark:bg-slate-950/50">
          {data && (
            <div className="space-y-6 text-xs">
              
              {/* Summary Takeaway Card */}
              <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-purple-900 dark:text-purple-200 space-y-2">
                <div className="font-bold flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-purple-600" />
                  Comparative Metric Synthesis
                </div>
                <p className="leading-relaxed text-xs">{data.keyTakeaway}</p>
              </div>

              {/* Similarity Score Card */}
              <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">Semantic Similarity Score</div>
                  <div className="text-[11px] text-slate-500">Overlap index based on categories and research citations</div>
                </div>
                <div className="text-2xl font-black text-purple-600 dark:text-purple-400">
                  {data.similarityScore} / 100
                </div>
              </div>

              {/* Differences Matrix Table */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold uppercase text-[10px]">
                      <th className="p-3.5">Feature Metric</th>
                      <th className="p-3.5 text-indigo-600 dark:text-indigo-400">{data.entityA.title}</th>
                      <th className="p-3.5 text-purple-600 dark:text-purple-400">{data.entityB.title}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {data.differences.map((diff, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                        <td className="p-3.5 font-bold text-slate-700 dark:text-slate-300">{diff.feature}</td>
                        <td className="p-3.5 text-slate-800 dark:text-slate-200">{diff.valueA}</td>
                        <td className="p-3.5 text-slate-800 dark:text-slate-200">{diff.valueB}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

            </div>
          )}
        </div>

      </div>
    </div>
  );
};
