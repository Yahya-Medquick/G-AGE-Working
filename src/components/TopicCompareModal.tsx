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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B1612]/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#FFFFFF] dark:bg-[#12231C] border border-[#D5E0D8] dark:border-[#27403A] rounded-[20px] w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden text-[#10231C] dark:text-[#E8F2EC]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#D5E0D8] dark:border-[#27403A] flex items-center justify-between bg-[#F3F6F1] dark:bg-[#0B1612]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[12px] bg-[#0A5C45] dark:bg-[#0F8056] text-white font-bold flex items-center justify-center">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#10231C] dark:text-[#E8F2EC] flex items-center gap-2">
                Entity &amp; Concept Comparison Matrix
              </h2>
              <p className="text-xs text-[#4F6359] dark:text-[#9DB5A8]">Cross-dimensional feature differential and metric comparison</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] p-2 rounded-[14px] text-[#4F6359] hover:text-[#10231C] dark:text-[#9DB5A8] dark:hover:text-[#E8F2EC] hover:bg-[#DDEFE6] dark:hover:bg-[#17352A] transition-colors cursor-pointer flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Selection */}
        <div className="p-6 border-b border-[#D5E0D8] dark:border-[#27403A] bg-[#FFFFFF] dark:bg-[#12231C] flex flex-col sm:flex-row items-center gap-4 text-xs">
          <div className="flex-1 w-full">
            <label className="block font-semibold mb-1 text-[#4F6359] dark:text-[#9DB5A8] uppercase text-xs">Topic A</label>
            <input
              type="text"
              value={topicA}
              onChange={(e) => setTopicA(e.target.value)}
              className="w-full min-h-[44px] px-3.5 py-2.5 rounded-[14px] border border-[#D5E0D8] dark:border-[#27403A] bg-[#F3F6F1] dark:bg-[#0B1612] font-bold text-[#10231C] dark:text-[#E8F2EC] focus:outline-none focus:border-[#0A5C45]"
            />
          </div>

          <div className="p-3 rounded-full bg-[#F3F6F1] dark:bg-[#0B1612] text-[#4F6359] dark:text-[#9DB5A8] shrink-0 border border-[#D5E0D8] dark:border-[#27403A]">
            <ArrowLeftRight className="w-4 h-4" />
          </div>

          <div className="flex-1 w-full">
            <label className="block font-semibold mb-1 text-[#4F6359] dark:text-[#9DB5A8] uppercase text-xs">Topic B</label>
            <input
              type="text"
              value={topicB}
              onChange={(e) => setTopicB(e.target.value)}
              className="w-full min-h-[44px] px-3.5 py-2.5 rounded-[14px] border border-[#D5E0D8] dark:border-[#27403A] bg-[#F3F6F1] dark:bg-[#0B1612] font-bold text-[#10231C] dark:text-[#E8F2EC] focus:outline-none focus:border-[#0A5C45]"
            />
          </div>

          <button
            onClick={fetchComparison}
            disabled={loading}
            className="w-full sm:w-auto min-h-[44px] px-6 py-2.5 rounded-[14px] bg-[#0A5C45] dark:bg-[#0F8056] hover:brightness-110 text-white font-bold transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer border border-[#0A5C45] dark:border-[#0F8056]"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            <span>Compare Topics</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#F3F6F1]/50 dark:bg-[#0B1612]/50">
          {data && (
            <div className="space-y-6 text-xs">
              
              {/* Summary Takeaway Card */}
              <div className="p-4 rounded-[14px] bg-[#FFF3CC] dark:bg-[#3A2F0B] border border-[#F4B400]/40 text-[#10231C] dark:text-[#E8F2EC] space-y-2">
                <div className="font-bold flex items-center gap-2 text-sm text-[#10231C] dark:text-[#E8F2EC]">
                  <CheckCircle2 className="w-4 h-4 text-[#0A5C45] dark:text-[#5BE0A5]" />
                  Comparative Metric Synthesis
                </div>
                <p className="leading-relaxed text-xs">{data.keyTakeaway}</p>
              </div>

              {/* Similarity Score Card */}
              <div className="p-4 rounded-[14px] bg-[#FFFFFF] dark:bg-[#12231C] border border-[#D5E0D8] dark:border-[#27403A] flex items-center justify-between">
                <div>
                  <div className="font-bold text-[#10231C] dark:text-[#E8F2EC]">Semantic Similarity Score</div>
                  <div className="text-xs text-[#4F6359] dark:text-[#9DB5A8]">Overlap index based on categories and research citations</div>
                </div>
                <div className="text-2xl font-black text-[#0A5C45] dark:text-[#5BE0A5]">
                  {data.similarityScore} / 100
                </div>
              </div>

              {/* Differences Matrix Table */}
              <div className="bg-[#FFFFFF] dark:bg-[#12231C] border border-[#D5E0D8] dark:border-[#27403A] rounded-[14px] overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#F3F6F1] dark:bg-[#0B1612] border-b border-[#D5E0D8] dark:border-[#27403A] text-[#4F6359] dark:text-[#9DB5A8] font-bold uppercase text-xs">
                      <th className="p-3.5">Feature Metric</th>
                      <th className="p-3.5 text-[#0A5C45] dark:text-[#5BE0A5]">{data.entityA.title}</th>
                      <th className="p-3.5 text-[#0A5C45] dark:text-[#5BE0A5]">{data.entityB.title}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#D5E0D8] dark:divide-[#27403A]">
                    {data.differences.map((diff, idx) => (
                      <tr key={idx} className="hover:bg-[#DDEFE6]/40 dark:hover:bg-[#17352A]/40">
                        <td className="p-3.5 font-bold text-[#10231C] dark:text-[#E8F2EC]">{diff.feature}</td>
                        <td className="p-3.5 text-[#10231C] dark:text-[#E8F2EC]">{diff.valueA}</td>
                        <td className="p-3.5 text-[#10231C] dark:text-[#E8F2EC]">{diff.valueB}</td>
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
