import React from "react";

export const CardSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-6 shadow-sm flex flex-col justify-between h-64 space-y-4"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-md w-24" />
              <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-md w-12" />
            </div>
            <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded-md w-3/4" />
            <div className="space-y-2 pt-2">
              <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded-md w-full" />
              <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded-md w-5/6" />
              <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded-md w-4/6" />
            </div>
          </div>
          <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
            <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-md w-20" />
            <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-lg w-24" />
          </div>
        </div>
      ))}
    </div>
  );
};
