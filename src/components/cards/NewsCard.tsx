import React, { useState } from "react";
import { NewsArticle } from "../../types";
import { ExternalLink, Newspaper, Clock, Check, Plus } from "lucide-react";
import { useNotes } from "../../hooks/useNotes";

interface NewsCardProps {
  article: NewsArticle;
}

export const NewsCard: React.FC<NewsCardProps> = ({
  article,
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
      const content = `Title: ${article.title}\nSource: ${article.source}\nPublished: ${article.publishedAt ? new Date(article.publishedAt).toLocaleDateString() : "Recent"}\nDescription: ${article.description}\nLink: ${article.url}`;
      await addNote(`News: ${article.title}`, content, "News");
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
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-900 dark:text-slate-100">
            {article.source}
          </span>
          <span className="flex items-center gap-1 text-slate-400">
            <Clock className="w-3.5 h-3.5" />
            {article.publishedAt ? new Date(article.publishedAt).toLocaleDateString() : "Recent"}
          </span>
        </div>

        <h3 className="font-semibold text-slate-900 dark:text-white text-base group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors line-clamp-2">
          {article.title}
        </h3>

        <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-3 leading-relaxed">
          {article.description}
        </p>
      </div>

      <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleAddNote}
            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1 font-medium cursor-pointer"
            title="Add News to Notes"
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

        <a
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto px-3.5 py-1.5 rounded-full bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-white font-medium flex items-center gap-1 transition-colors"
        >
          <span>Read Story</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
};
