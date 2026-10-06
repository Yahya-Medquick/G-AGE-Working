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

  // Load the fallback Urdu font on first render.
  React.useEffect(() => {
    if (!document.getElementById('urdu-font-link')) {
      const link = document.createElement('link');
      link.id = 'urdu-font-link';
      link.rel = 'stylesheet';
      link.href = 'https://fonts.googleapis.com/css2?family=Noto+Naskh+Arabic:wght@400;700&display=swap';
      document.head.appendChild(link);
    }
  }, []);

  return (
    <div className={`prose dark:prose-invert max-w-none [overflow-wrap:anywhere] text-base leading-relaxed text-text [&_.urdu-block]:font-['Noto_Naskh_Arabic',serif] [&_.urdu-block]:text-right [&_.urdu-block]:leading-loose [&_.urdu-block]:text-base
      prose-headings:text-text prose-headings:font-semibold prose-headings:tracking-tight
      prose-p:text-text prose-p:leading-relaxed prose-p:mb-3
      prose-strong:text-text prose-strong:font-semibold
      prose-ul:text-text prose-ul:pl-5 prose-ul:mb-3
      prose-ol:text-text prose-ol:pl-5 prose-ol:mb-3
      prose-li:mb-1.5 prose-li:marker:text-accent
      prose-code:text-accent-text prose-code:bg-surface-2 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-control prose-code:font-mono prose-code:text-xs
      prose-blockquote:border-l-4 prose-blockquote:border-accent prose-blockquote:text-muted prose-blockquote:italic prose-blockquote:pl-4
      prose-hr:border-border
      ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          h1: ({ ...props }) => <h1 className="mb-2 mt-4 text-lg font-semibold text-text sm:text-xl" {...props} />,
          h2: ({ ...props }) => <h2 className="mb-1.5 mt-3 text-base font-semibold text-text sm:text-lg" {...props} />,
          h3: ({ ...props }) => <h3 className="mb-1 mt-2.5 text-base font-semibold text-text" {...props} />,
          p: ({ children, ...props }) => {
            const text = typeof children === 'string' ? children :
              (Array.isArray(children) ? children.join('') : '');
            const isUrdu = hasUrdu(text);
            return (
              <p
                className={`mb-2.5 last:mb-0 leading-relaxed ${
                  isUrdu
                    ? 'urdu-block text-right text-base leading-loose'
                    : 'text-text'
                }`}
                dir={isUrdu ? 'rtl' : 'ltr'}
                style={isUrdu ? {
                  fontFamily: "'Noto Naskh Arabic', serif",
                  lineHeight: '2.2',
                  textAlign: 'right',
                } : {}}
                {...props}
              >
                {isUrdu ? processUrduText(text) : children}
              </p>
            );
          },
          ul: ({ ...props }) => <ul className="mb-2.5 list-disc space-y-1 pl-5 text-text" {...props} />,
          ol: ({ ...props }) => <ol className="mb-2.5 list-decimal space-y-1 pl-5 text-text" {...props} />,
          li: ({ ...props }) => <li className="mb-1 text-text" {...props} />,
          strong: ({ ...props }) => <strong className="font-semibold text-text" {...props} />,
          pre: ({ ...props }) => <pre className="my-3 max-w-full overflow-x-auto rounded-tile bg-surface-2 p-3 text-sm" {...props} />,
          code: ({ ...props }) => <code className="break-words rounded-control bg-surface-2 px-1.5 py-0.5 font-mono text-xs text-accent-text" {...props} />,
          table: ({ children, node: _node, ...props }) => (
            <div className="my-3 max-w-full overflow-x-auto rounded-control border border-border">
              <table
                dir={containsUrdu ? 'rtl' : 'ltr'}
                className={`w-max min-w-full border-collapse text-sm ${containsUrdu ? 'text-right' : 'text-left'}`}
                {...props}
              >
                {children}
              </table>
            </div>
          ),
          thead: ({ node: _node, ...props }) => <thead className="sticky top-0 bg-surface-2 text-text" {...props} />,
          tbody: ({ node: _node, ...props }) => <tbody className="[&_tr:nth-child(even)]:bg-surface-2" {...props} />,
          tr: ({ node: _node, ...props }) => <tr className="border-b border-border last:border-b-0" {...props} />,
          th: ({ node: _node, ...props }) => (
            <th
              className={`max-w-[18rem] border-r border-border px-3 py-2 font-semibold last:border-r-0 ${containsUrdu ? 'text-right' : 'text-left'}`}
              style={containsUrdu ? { fontFamily: "'Noto Naskh Arabic', serif", lineHeight: '2' } : undefined}
              {...props}
            />
          ),
          td: ({ node: _node, ...props }) => (
            <td
              className={`max-w-[18rem] break-words border-r border-border px-3 py-2 align-top last:border-r-0 ${containsUrdu ? 'text-right' : 'text-left'}`}
              style={containsUrdu ? { fontFamily: "'Noto Naskh Arabic', serif", lineHeight: '2' } : undefined}
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
