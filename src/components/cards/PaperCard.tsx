import React, { useState } from "react";
import { ResearchPaper } from "../../types";
import { ExternalLink, Check, Award, FileText, Download, Plus } from "lucide-react";
import { useNotes } from "../../hooks/useNotes";

interface PaperCardProps {
  paper: ResearchPaper;
}

export const PaperCard: React.FC<PaperCardProps> = ({
  paper,
}) => {
  const { addNote } = useNotes();
  const [added, setAdded] = useState(false);

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

  const handleAddNote = async () => {
    try {
      const content = `Title: ${paper.title}\nAuthors: ${paper.authors?.join(", ") || "Unknown"}\nYear: ${paper.publicationYear}\nAbstract: ${paper.abstract}\nURL: ${paper.url}`;
      await addNote(`Paper: ${paper.title}`, content, "Research");
      setAdded(true);
      triggerToast("Added to Notes ✓");
      setTimeout(() => setAdded(false), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="group rounded-2xl border border-slate-200/70 dark:border-slate-800/70 bg-white dark:bg-slate-900 p-6 hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-200 flex flex-col justify-between space-y-4">
      <div className="space-y-3">
        {/* Header Metadata Badges */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              {paper.publicationYear ?? "N/A"}
            </span>
            {paper.openAccess && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400">
                Open Access
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 text-amber-500 text-xs font-medium">
            <Award className="w-3.5 h-3.5" />
            <span>{(paper.citationCount ?? 0).toLocaleString()} citations</span>
          </div>
        </div>

        {/* Paper Title */}
        <h3 className="font-semibold text-slate-900 dark:text-white text-base group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors line-clamp-2">
          {paper.title || "Untitled Paper"}
        </h3>

        {/* Authors & Journal */}
        <div className="text-xs text-slate-500 dark:text-slate-400 space-y-0.5">
          <p className="font-medium text-slate-700 dark:text-slate-300 line-clamp-1">
            {Array.isArray(paper.authors) && paper.authors.length > 0
              ? paper.authors.join(", ")
              : "Unknown Author(s)"}
          </p>
          <p className="italic line-clamp-1 text-[11px] text-slate-400">
            {paper.journalOrVenue || "Academic Repository"}
          </p>
        </div>

        {/* Abstract */}
        <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-3 leading-relaxed pt-0.5">
          {paper.abstract || "No abstract available for this paper."}
        </p>
      </div>

      {/* Action Links */}
      <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleAddNote}
            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1 font-medium cursor-pointer"
            title="Add Abstract to Notes"
          >
            {added ? (
              <div className="flex items-center gap-1">
                <Check className="w-4 h-4 text-emerald-500" />
                <span className="text-emerald-500 font-semibold">Added</span>
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <Plus className="w-4 h-4" />
                <span>+ Notes</span>
              </div>
            )}
          </button>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          {paper.pdfUrl && (
            <a
              href={paper.pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors font-medium flex items-center gap-1"
            >
              <Download className="w-3.5 h-3.5" />
              <span>PDF</span>
            </a>
          )}

          <a
            href={paper.url}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-1.5 rounded-full bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-white font-medium flex items-center gap-1 transition-colors"
          >
            <span>Article</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
};
