import React, { useState, useEffect } from "react";
import { Sparkles, Send, HelpCircle, ExternalLink, RefreshCw, CheckCircle2, Activity } from "lucide-react";
import { AIQuestionAnswer } from "../types";
import { getAuthHeaders, fetchTabUsage } from "../services/api";
import { MarkdownRenderer } from "./MarkdownRenderer";

interface AIQuestionAnswerCardProps {
  topic: string;
}

export const AIQuestionAnswerCard: React.FC<AIQuestionAnswerCardProps> = ({ topic }) => {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AIQuestionAnswer | null>(null);
  const [usageInfo, setUsageInfo] = useState<{ count: number; limit: number; loggedIn: boolean } | null>(null);

  const loadUsage = async () => {
    try {
      const data = await fetchTabUsage("qa" as any);
      setUsageInfo(data);
    } catch (e) {
      console.warn("Failed to load QA usage", e);
    }
  };

  useEffect(() => {
    loadUsage();
  }, []);

  const handleAsk = async (qToAsk?: string) => {
    const q = (qToAsk || question).trim();
    if (!q) return;

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/ask?q=${encodeURIComponent(q)}&topic=${encodeURIComponent(topic)}`, {
        credentials: "include",
        headers: { ...getAuthHeaders() },
      });
      if (res.ok) {
        const data = await res.json();
        setResult(data);
        loadUsage();
      } else {
        const errData = await res.json().catch(() => ({}));
        setError(errData.message || "Unable to synthesize answer at this moment.");
        loadUsage();
      }
    } catch (err: any) {
      console.warn("AI Q&A error:", err);
      setError("Network request failed. Please check connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-50/50 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            AI Assistant for "{topic}"
          </span>
        </div>

        {/* Real-time Usage Indicator for Q&A */}
        {usageInfo && usageInfo.loggedIn && (
          <span className="text-[11px] text-slate-400 font-medium">
            {usageInfo.limit >= 1000 ? "Unlimited Syntheses" : `${usageInfo.count}/${usageInfo.limit} used today`}
          </span>
        )}
      </div>

      {/* Input form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleAsk();
        }}
        className="flex items-center gap-2"
      >
        <div className="relative flex-1">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder={`Ask a question about ${topic}...`}
            className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
          />
          <HelpCircle className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
        </div>
        <button
          type="submit"
          disabled={loading || !question.trim()}
          className="px-3.5 py-2 rounded-xl bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white disabled:opacity-50 text-white dark:text-slate-900 font-medium text-xs transition-colors flex items-center gap-1.5 shrink-0"
        >
          {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
          <span>Ask</span>
        </button>
      </form>

      {/* Error display */}
      {error && (
        <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-xs text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Answer Output */}
      {result && (
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 space-y-3 animate-in fade-in text-xs">
          <div className="flex items-center justify-between text-slate-500 text-[11px] font-semibold border-b border-slate-200 dark:border-slate-800 pb-2">
            <span className="text-slate-900 dark:text-white font-bold">"{result.question}"</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Confidence: {result.confidence}%
            </span>
          </div>

          {/* Backup Model Transparency Indicator */}
          {(result.backupNotice || result.isBackupModel) && (
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 text-[11px] text-amber-800 dark:text-amber-300 font-medium">
              <Activity className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>{result.backupNotice || `Answered using backup model (${result.modelUsed}) due to high demand`}</span>
            </div>
          )}

          <MarkdownRenderer content={result.answer} className="text-xs text-slate-700 dark:text-slate-300" />

          {/* Source Citations */}
          {result.sources && result.sources.length > 0 && (
            <div className="pt-2 flex flex-wrap items-center gap-3 text-[11px]">
              <span className="font-bold text-slate-500">Verified Sources:</span>
              {result.sources.map((src, i) => (
                <a
                  key={i}
                  href={src.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5 font-medium"
                >
                  <span>{src.title}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              ))}
            </div>
          )}

          {/* Followup suggestions */}
          {result.relatedFollowups && result.relatedFollowups.length > 0 && (
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex flex-wrap gap-1.5">
              {result.relatedFollowups.map((f, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setQuestion(f);
                    handleAsk(f);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-400 text-[10px] text-slate-600 dark:text-slate-300 transition-colors text-left"
                >
                  {f}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
