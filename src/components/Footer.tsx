import React from "react";

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-slate-200/80 dark:border-slate-800/80 bg-white/50 dark:bg-slate-950/50 py-6 px-4 sm:px-6 lg:px-8 mt-16 text-xs text-slate-500 dark:text-slate-400">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <span className="font-semibold text-slate-700 dark:text-slate-300">G-AGE AI</span> • The Next Age of Knowledge &amp; Intelligence
        </div>

        <div className="flex items-center gap-4 text-slate-400 dark:text-slate-500 font-medium">
          <a
            href="/robots.txt"
            target="_blank"
            className="hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
          >
            Robots.txt
          </a>
          <a
            href="/sitemap.xml"
            target="_blank"
            className="hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
          >
            Sitemap.xml
          </a>
          <a
            href="https://openalex.org"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
          >
            OpenAlex
          </a>
        </div>
      </div>
    </footer>
  );
};

