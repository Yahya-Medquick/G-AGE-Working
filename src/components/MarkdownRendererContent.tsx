import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

interface Props {
  content: string;
  className?: string;
  isStreaming?: boolean;
}

// Detect if text contains significant Urdu/Arabic script
function hasUrdu(text: string): boolean {
  const urduRange = /[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/;
  return urduRange.test(text);
}

// Keep first-use English technical terms in parentheses left-to-right.
function processUrduText(text: string): React.ReactNode {
  if (!hasUrdu(text)) return text;
  const parts = text.split(/(\([A-Za-z][A-Za-z0-9\s.,/+×÷=^_-]*\))/g);
  return parts.map((part, i) => {
    if (!part) return null;
    if (/^\([A-Za-z]/.test(part)) {
      return (
        <span
          key={i}
          dir="ltr"
          style={{ display: 'inline-block', unicodeBidi: 'embed' }}
          className="font-sans text-[0.9em] opacity-90"
        >
          {part}
        </span>
      );
    }
    return <span key={i} dir="rtl">{part}</span>;
  });
}

function splitIncompleteTable(content: string, isStreaming: boolean) {
  if (!isStreaming || content.endsWith('\n')) return { markdown: content, pendingTable: '' };

  const lines = content.split('\n');
  const isPipeRow = (line: string) => line.includes('|');
  const isSeparatorRow = (line: string) => /^\s*\|?\s*:?-{3,}:?\s*(?:\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(line);

  for (let start = lines.length - 2; start >= 0; start -= 1) {
    if (!isPipeRow(lines[start]) || !isSeparatorRow(lines[start + 1])) continue;
    const trailingLines = lines.slice(start);
    if (!trailingLines.every((line) => !line.trim() || isPipeRow(line))) continue;

    const prefix = lines.slice(0, start).join('\n');
    const startIndex = prefix.length + (start > 0 ? 1 : 0);
    return {
      markdown: content.slice(0, startIndex),
      pendingTable: content.slice(startIndex),
    };
  }

  return { markdown: content, pendingTable: '' };
}

export const MarkdownRendererContent = ({ content, className = '', isStreaming = false }: Props) => {
  const containsUrdu = hasUrdu(content);
  const { markdown, pendingTable } = splitIncompleteTable(content, isStreaming);

  // Load Urdu font on first render
  React.useEffect(() => {
    if (!document.getElementById('urdu-font-link')) {
      const link = document.createElement('link');
      link.id = 'urdu-font-link';
      link.rel = 'stylesheet';
      link.href = 'https://fonts.googleapis.com/css2?family=Noto+Nastaliq+Urdu:wght@400;700&display=swap';
      document.head.appendChild(link);
    }
  }, []);

  return (
    <div className={`prose dark:prose-invert max-w-none text-sm leading-relaxed text-slate-800 dark:text-slate-200 [&_.urdu-block]:font-[Jameel_Noori_Nastaleeq,Noto_Nastaliq_Urdu,serif] [&_.urdu-block]:text-right [&_.urdu-block]:leading-loose [&_.urdu-block]:text-base
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
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          h1: ({ ...props }) => <h1 className="text-base sm:text-lg font-bold mt-4 mb-2 text-slate-900 dark:text-white" {...props} />,
          h2: ({ ...props }) => <h2 className="text-sm sm:text-base font-bold mt-3 mb-1.5 text-slate-900 dark:text-white" {...props} />,
          h3: ({ ...props }) => <h3 className="text-xs sm:text-sm font-bold mt-2.5 mb-1 text-slate-800 dark:text-slate-100" {...props} />,
          p: ({ children, ...props }) => {
            const text = typeof children === 'string' ? children :
              (Array.isArray(children) ? children.join('') : '');
            const isUrdu = hasUrdu(text);
            return (
              <p
                className={`mb-2.5 last:mb-0 leading-relaxed ${
                  isUrdu
                    ? 'urdu-block text-right text-base leading-loose'
                    : 'text-slate-700 dark:text-slate-300'
                }`}
                dir={isUrdu ? 'rtl' : 'ltr'}
                style={isUrdu ? {
                  fontFamily: "'Jameel Noori Nastaleeq', 'Noto Nastaliq Urdu', serif",
                  lineHeight: '2.2',
                  textAlign: 'right',
                } : {}}
                {...props}
              >
                {isUrdu ? processUrduText(text) : children}
              </p>
            );
          },
          ul: ({ ...props }) => <ul className="list-disc pl-5 mb-2.5 space-y-1 text-slate-700 dark:text-slate-300" {...props} />,
          ol: ({ ...props }) => <ol className="list-decimal pl-5 mb-2.5 space-y-1 text-slate-700 dark:text-slate-300" {...props} />,
          li: ({ ...props }) => <li className="mb-1 text-slate-700 dark:text-slate-300" {...props} />,
          strong: ({ ...props }) => <strong className="font-bold text-slate-900 dark:text-white" {...props} />,
          code: ({ ...props }) => <code className="bg-slate-100 dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.5 rounded font-mono text-[11px] border border-slate-200/60 dark:border-slate-700/60" {...props} />,
          table: ({ children, node: _node, ...props }) => (
            <div className="my-3 max-w-full overflow-x-auto rounded-md border border-slate-200 dark:border-slate-700">
              <table
                dir={containsUrdu ? 'rtl' : 'ltr'}
                className={`w-max min-w-full border-collapse text-xs ${containsUrdu ? 'text-right' : 'text-left'}`}
                {...props}
              >
                {children}
              </table>
            </div>
          ),
          thead: ({ node: _node, ...props }) => <thead className="bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100" {...props} />,
          tbody: ({ node: _node, ...props }) => <tbody className="[&_tr:nth-child(even)]:bg-slate-50 dark:[&_tr:nth-child(even)]:bg-slate-800/40" {...props} />,
          tr: ({ node: _node, ...props }) => <tr className="border-b border-slate-200 last:border-b-0 dark:border-slate-700" {...props} />,
          th: ({ node: _node, ...props }) => (
            <th
              className={`max-w-[18rem] border-r border-slate-200 px-3 py-2 font-semibold last:border-r-0 dark:border-slate-700 ${containsUrdu ? 'text-right' : 'text-left'}`}
              style={containsUrdu ? { fontFamily: "'Jameel Noori Nastaleeq', 'Noto Nastaliq Urdu', serif", lineHeight: '2' } : undefined}
              {...props}
            />
          ),
          td: ({ node: _node, ...props }) => (
            <td
              className={`max-w-[18rem] break-words border-r border-slate-200 px-3 py-2 align-top last:border-r-0 dark:border-slate-700 ${containsUrdu ? 'text-right' : 'text-left'}`}
              style={containsUrdu ? { fontFamily: "'Jameel Noori Nastaleeq', 'Noto Nastaliq Urdu', serif", lineHeight: '2' } : undefined}
              {...props}
            />
          ),
        }}
      >
        {markdown}
      </ReactMarkdown>
      {pendingTable && (
        <div
          className={`whitespace-pre-wrap ${containsUrdu ? 'urdu-block text-right' : ''}`}
          dir={containsUrdu ? 'rtl' : 'ltr'}
          aria-live="polite"
        >
          {pendingTable}
        </div>
      )}
    </div>
  );
};
