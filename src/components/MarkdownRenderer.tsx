import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

interface Props {
  content: string;
  className?: string;
}

export const MarkdownRenderer = ({ content, className = '' }: Props) => {
  if (!content || content.trim() === '') return null;
  return (
    <div className={`prose dark:prose-invert max-w-none text-sm leading-relaxed text-slate-800 dark:text-slate-200
      prose-headings:text-slate-900 dark:prose-headings:text-slate-100 prose-headings:font-bold prose-headings:tracking-tight
      prose-p:text-slate-700 dark:prose-p:text-slate-300 prose-p:leading-relaxed prose-p:mb-3
      prose-strong:text-slate-900 dark:prose-strong:text-slate-100 prose-strong:font-bold
      prose-ul:text-slate-700 dark:prose-ul:text-slate-300 prose-ul:pl-5 prose-ul:mb-3
      prose-ol:text-slate-700 dark:prose-ol:text-slate-300 prose-ol:pl-5 prose-ol:mb-3
      prose-li:mb-1.5 prose-li:marker:text-indigo-500 dark:prose-li:marker:text-indigo-400
      prose-code:text-indigo-700 dark:prose-code:text-indigo-300 prose-code:bg-indigo-50 dark:prose-code:bg-indigo-950/60 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:font-mono prose-code:text-[12px]
      prose-blockquote:border-l-4 prose-blockquote:border-indigo-500 dark:prose-blockquote:border-indigo-400 prose-blockquote:text-slate-600 dark:prose-blockquote:text-slate-400 prose-blockquote:italic prose-blockquote:pl-4
      prose-hr:border-slate-200 dark:prose-hr:border-slate-800
      ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          h1: ({ ...props }) => <h1 className="text-base sm:text-lg font-bold mt-4 mb-2 text-slate-900 dark:text-white" {...props} />,
          h2: ({ ...props }) => <h2 className="text-sm sm:text-base font-bold mt-3 mb-1.5 text-slate-900 dark:text-white" {...props} />,
          h3: ({ ...props }) => <h3 className="text-xs sm:text-sm font-bold mt-2.5 mb-1 text-slate-800 dark:text-slate-100" {...props} />,
          p: ({ ...props }) => <p className="mb-2.5 last:mb-0 leading-relaxed text-slate-700 dark:text-slate-300" {...props} />,
          ul: ({ ...props }) => <ul className="list-disc pl-5 mb-2.5 space-y-1 text-slate-700 dark:text-slate-300" {...props} />,
          ol: ({ ...props }) => <ol className="list-decimal pl-5 mb-2.5 space-y-1 text-slate-700 dark:text-slate-300" {...props} />,
          li: ({ ...props }) => <li className="mb-1 text-slate-700 dark:text-slate-300" {...props} />,
          strong: ({ ...props }) => <strong className="font-bold text-slate-900 dark:text-white" {...props} />,
          code: ({ ...props }) => <code className="bg-slate-100 dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.5 rounded font-mono text-[11px] border border-slate-200/60 dark:border-slate-700/60" {...props} />
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};
