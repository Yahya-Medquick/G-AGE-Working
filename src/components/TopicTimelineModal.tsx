import React, { useState, useEffect } from "react";
import { X, History, Sparkles, Milestone, ExternalLink, RefreshCw } from "lucide-react";
import { TopicTimelineEvent } from "../types";
import { getAuthHeaders } from "../services/api";

interface TopicTimelineModalProps {
  isOpen: boolean;
  onClose: () => void;
  topic: string;
}

export const TopicTimelineModal: React.FC<TopicTimelineModalProps> = ({ isOpen, onClose, topic }) => {
  const [timeline, setTimeline] = useState<TopicTimelineEvent[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && topic) {
      setLoading(true);
      fetch(`/api/timeline?topic=${encodeURIComponent(topic)}`, {
        credentials: "include",
        headers: { ...getAuthHeaders() },
      })
        .then((res) => res.json())
        .then((data) => {
          setTimeline(data.timeline || []);
        })
        .catch((err) => console.warn("Error fetching timeline:", err))
        .finally(() => setLoading(false));
    }
  }, [isOpen, topic]);

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
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden text-slate-800 dark:text-slate-100">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white font-bold flex items-center justify-center shadow-md">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 capitalize">
                {topic} Chronological Timeline
              </h2>
              <p className="text-xs text-slate-500">Milestone discoveries, theoretical shifts, and breakthroughs</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Timeline Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 dark:bg-slate-950/50">
          {loading ? (
            <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
              <RefreshCw className="w-6 h-6 animate-spin text-indigo-500" />
              <span className="text-xs">Constructing historical timeline...</span>
            </div>
          ) : timeline.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs italic">No timeline events recorded for this topic.</div>
          ) : (
            <div className="relative border-l-2 border-indigo-200 dark:border-indigo-800/80 ml-4 space-y-8 pl-6 my-2">
              {timeline.map((event, idx) => (
                <div key={idx} className="relative group">
                  {/* Dot icon */}
                  <div className={`absolute -left-[31px] top-0.5 w-4 h-4 rounded-full border-2 border-white dark:border-slate-900 ${
                    event.impact === "breakthrough" ? "bg-amber-500 ring-4 ring-amber-500/20" : "bg-indigo-600"
                  }`} />

                  <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 text-xs shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 text-xs">
                        {event.year}
                      </span>
                      {event.impact === "breakthrough" && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800 text-[10px] font-bold uppercase">
                          Breakthrough
                        </span>
                      )}
                    </div>

                    <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                      {event.title}
                    </h3>

                    <p className="text-slate-600 dark:text-slate-300 text-xs leading-relaxed">
                      {event.description}
                    </p>

                    {event.keyFigure && (
                      <div className="text-[11px] text-slate-500 font-medium pt-1 border-t border-slate-100 dark:border-slate-800/80">
                        Key Figure / Collaboration: <span className="font-semibold text-slate-800 dark:text-slate-200">{event.keyFigure}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
