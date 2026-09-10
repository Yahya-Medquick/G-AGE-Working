import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import {
  FileText,
  Copy,
  Printer,
  Download,
  Check,
  Building2,
  User,
  Sparkles,
  X
} from 'lucide-react';
import { MarkdownRenderer } from './MarkdownRenderer';
import { ExpertPersona } from '../types';
import { EXPERTS } from '../data/experts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  compiledText: string;
  subjectTags: string[];
  persona?: ExpertPersona | null;
  personaName?: string;
  personaAffiliation?: string;
  appName?: string;
}

export const CompiledNotesModal: React.FC<Props> = ({
  isOpen,
  onClose,
  compiledText,
  subjectTags = [],
  persona,
  personaName: propPersonaName,
  personaAffiliation: propAffiliation,
  appName = 'G-AGE AI'
}) => {
  const [editableContent, setEditableContent] = useState(compiledText);
  const [viewMode, setViewMode] = useState<'edit' | 'preview'>('preview');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  // Derive persona details
  const activeExpert = persona || EXPERTS['hamza'];
  const personaName = propPersonaName || activeExpert?.name || 'Hamza Tariq';
  const personaRole = activeExpert?.role || 'Academic Mentor & Concept Guide';
  const institute = propAffiliation || activeExpert?.affiliation || 'G-AGE Academic Institute';
  const avatarColor = activeExpert?.avatar_color || '#00a884';
  const initials = activeExpert?.initials || 'GA';

  useEffect(() => {
    setEditableContent(compiledText);
    setViewMode('preview');
  }, [compiledText]);

  if (!isOpen) return null;

  const today = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const cleanSubject = subjectTags[0] ? subjectTags[0].replace(/[^a-zA-Z0-9]/g, '_') : 'Study';
  const fileName = `${appName.replace(/\s+/g, '_')}_Notes_${cleanSubject}_${new Date().toISOString().split('T')[0]}.pdf`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(editableContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.warn('Copy failed:', e);
    }
  };

  // Plain text / markdown stripper for PDF rendering
  const stripMarkdown = (text: string): string => {
    let clean = text;

    // Convert LaTeX equations if present
    const convertLatex = (latex: string): string => {
      let eq = latex.trim();
      eq = eq.replace(/^\$\$|\$\$$/g, '').replace(/^\$|\$$/g, '');
      eq = eq.replace(/\\times/g, '×');
      eq = eq.replace(/\\approx/g, '≈');
      eq = eq.replace(/\\to/g, '→');
      eq = eq.replace(/\\infty/g, '∞');
      eq = eq.replace(/\\cdot/g, '·');
      eq = eq.replace(/\\pm/g, '±');
      eq = eq.replace(/\\geq/g, '≥');
      eq = eq.replace(/\\leq/g, '≤');
      eq = eq.replace(/\\neq/g, '≠');
      eq = eq.replace(/\\alpha/g, 'α');
      eq = eq.replace(/\\beta/g, 'β');
      eq = eq.replace(/\\gamma/g, 'γ');
      eq = eq.replace(/\\Delta/g, 'Δ');
      eq = eq.replace(/\\pi/g, 'π');
      for (let i = 0; i < 5; i++) {
        eq = eq.replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, '($1)/($2)');
      }
      for (let i = 0; i < 3; i++) {
        eq = eq.replace(/\\sqrt\{([^{}]+)\}/g, '√($1)');
      }
      eq = eq.replace(/\^\{([^{}]+)\}/g, '^$1');
      eq = eq.replace(/\^(\w)/g, '^$1');
      eq = eq.replace(/_\{([^{}]+)\}/g, '_$1');
      eq = eq.replace(/_(\w)/g, '_$1');
      eq = eq.replace(/\\[a-zA-Z]+/g, '');
      eq = eq.replace(/\{([^{}]*)\}/g, '$1');
      eq = eq.replace(/\s+/g, ' ').trim();
      return eq;
    };

    clean = clean.replace(/\$\$([^$]+)\$\$/g, (_match, eq) => `\n[Formula: ${convertLatex(eq)}]\n`);
    clean = clean.replace(/\$([^$\n]+)\$/g, (_match, eq) => convertLatex(eq));
    clean = clean.replace(/^#{1,6}\s+(.+)$/gm, '### $1');
    clean = clean.replace(/\*\*\*(.+?)\*\*\*/g, '$1');
    clean = clean.replace(/\*\*(.+?)\*\*/g, '$1');
    clean = clean.replace(/\*(.+?)\*/g, '$1');
    clean = clean.replace(/__(.+?)__/g, '$1');
    clean = clean.replace(/_(.+?)_/g, '$1');
    clean = clean.replace(/^\s*[-*+]\s+/gm, '• ');
    clean = clean.replace(/^[-*_]{3,}$/gm, '---HRULE---');
    clean = clean.replace(/```[\s\S]*?```/gm, '');
    clean = clean.replace(/`([^`]+)`/g, '$1');
    clean = clean.replace(/^\s*>\s*/gm, '');
    clean = clean.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
    clean = clean.replace(/!\[([^\]]*)\]\([^)]+\)/g, '');
    clean = clean.replace(/<[^>]+>/g, '');
    clean = clean.replace(/\n{3,}/g, '\n\n');
    return clean.trim();
  };

  // High-fidelity jsPDF export with persona header, institute, and proper page numbers
  const handleDownloadPDF = async () => {
    setIsGenerating(true);
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 16;
      const contentWidth = pageWidth - margin * 2;
      const headerTopY = 12;
      const headerBottomY = 25;
      const startContentY = 32;
      const bottomLimitY = pageHeight - 20;

      // Draw header function
      const drawHeader = () => {
        // Top line
        pdf.setDrawColor(30, 58, 95);
        pdf.setLineWidth(0.8);
        pdf.line(margin, headerTopY, pageWidth - margin, headerTopY);

        // Persona Name & Title (Left)
        pdf.setTextColor(30, 58, 95);
        pdf.setFontSize(10.5);
        pdf.setFont('helvetica', 'bold');
        pdf.text(personaName, margin, headerTopY + 5.5);

        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(100, 116, 139);
        pdf.text(`${appName} Study Notes • ${personaRole}`, margin, headerTopY + 9.5);

        // Institute & Date (Right)
        pdf.setFontSize(8.5);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(30, 58, 95);
        const instituteClean = institute.length > 45 ? institute.slice(0, 42) + '...' : institute;
        pdf.text(instituteClean, pageWidth - margin, headerTopY + 5.5, { align: 'right' });

        pdf.setFontSize(7.5);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(100, 116, 139);
        const rightMeta = `${today}${subjectTags.length > 0 ? ' • ' + subjectTags.join(', ') : ''}`;
        pdf.text(rightMeta, pageWidth - margin, headerTopY + 9.5, { align: 'right' });

        // Divider
        pdf.setDrawColor(226, 232, 240);
        pdf.setLineWidth(0.3);
        pdf.line(margin, headerBottomY, pageWidth - margin, headerBottomY);
      };

      // Draw initial header
      drawHeader();
      let y = startContentY;

      // Process content
      const cleanContent = stripMarkdown(editableContent);
      const paragraphs = cleanContent.split('\n');

      paragraphs.forEach((paragraph: string) => {
        const trimmed = paragraph.trim();

        if (y > bottomLimitY) {
          pdf.addPage();
          drawHeader();
          y = startContentY;
        }

        // Empty line
        if (trimmed === '') {
          y += 3.5;
          return;
        }

        // Horizontal rule
        if (trimmed === '---HRULE---') {
          pdf.setDrawColor(203, 213, 225);
          pdf.setLineWidth(0.3);
          pdf.line(margin, y, pageWidth - margin, y);
          y += 5;
          return;
        }

        // Heading detection
        const isH1 = trimmed.startsWith('### # ') || (trimmed.startsWith('# ') && !trimmed.startsWith('### '));
        const isH2 = trimmed.startsWith('### ## ');
        const isH3 = trimmed.startsWith('### ') && !isH1 && !isH2;
        const isBullet = trimmed.startsWith('•');
        const isFormula = trimmed.startsWith('[Formula:');

        if (isFormula) {
          pdf.setFillColor(248, 250, 252);
          const formulaLines = pdf.splitTextToSize(trimmed, contentWidth - 8);
          const boxHeight = formulaLines.length * 5 + 4;
          if (y + boxHeight > bottomLimitY) {
            pdf.addPage();
            drawHeader();
            y = startContentY;
          }
          pdf.rect(margin, y - 3, contentWidth, boxHeight, 'F');
          pdf.setFont('courier', 'normal');
          pdf.setFontSize(8.5);
          pdf.setTextColor(30, 41, 59);
          formulaLines.forEach((line: string) => {
            pdf.text(line, margin + 4, y);
            y += 5;
          });
          y += 3;
          return;
        }

        if (isH1) {
          y += 4;
          if (y > bottomLimitY) {
            pdf.addPage();
            drawHeader();
            y = startContentY;
          }
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(13);
          pdf.setTextColor(15, 23, 42);
          const headingText = trimmed.replace(/^###\s*#*\s*/, '').replace(/^#\s*/, '');
          const lines = pdf.splitTextToSize(headingText, contentWidth);
          lines.forEach((line: string) => {
            pdf.text(line, margin, y);
            y += 6.5;
          });
          y += 2;
          return;
        }

        if (isH2) {
          y += 3;
          if (y > bottomLimitY) {
            pdf.addPage();
            drawHeader();
            y = startContentY;
          }
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(11);
          pdf.setTextColor(30, 58, 95);
          const headingText = trimmed.replace(/^###\s*##\s*/, '');
          const lines = pdf.splitTextToSize(headingText, contentWidth);
          lines.forEach((line: string) => {
            pdf.text(line, margin, y);
            y += 5.5;
          });
          y += 1.5;
          return;
        }

        if (isH3) {
          y += 2;
          if (y > bottomLimitY) {
            pdf.addPage();
            drawHeader();
            y = startContentY;
          }
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(9.5);
          pdf.setTextColor(51, 65, 85);
          const headingText = trimmed.replace(/^###\s*/, '');
          const lines = pdf.splitTextToSize(headingText, contentWidth);
          lines.forEach((line: string) => {
            pdf.text(line, margin, y);
            y += 5;
          });
          y += 1;
          return;
        }

        // Regular Text or Bullets
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(9);
        pdf.setTextColor(51, 65, 85);

        const lines = pdf.splitTextToSize(trimmed, isBullet ? contentWidth - 4 : contentWidth);
        lines.forEach((line: string) => {
          if (y > bottomLimitY) {
            pdf.addPage();
            drawHeader();
            y = startContentY;
          }
          pdf.text(line, isBullet ? margin + 3.5 : margin, y);
          y += 4.8;
        });
        y += 1;
      });

      // Proper Page Number Rendering on Every Page
      const totalPages = (pdf as any).internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);

        // Footer divider line
        pdf.setDrawColor(226, 232, 240);
        pdf.setLineWidth(0.3);
        pdf.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);

        // Footer left: App Name & Persona
        pdf.setFontSize(7.5);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(148, 163, 184);
        pdf.text(`Generated by ${appName} • Academic Intelligence Engine`, margin, pageHeight - 6);

        // Footer right: Page X of Y
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(100, 116, 139);
        pdf.text(`Page ${i} of ${totalPages}`, pageWidth - margin, pageHeight - 6, { align: 'right' });
      }

      pdf.save(fileName);
    } catch (err) {
      console.error('PDF generation error:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  // High-fidelity Print / Save as PDF view
  const handlePrintView = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>${fileName}</title>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
        <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js"><\/script>
        <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js"><\/script>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            font-size: 10.5pt;
            color: #1e293b;
            padding: 20mm 18mm;
            line-height: 1.65;
            background: #fff;
          }
          .header {
            border-bottom: 2px solid #1e3a5f;
            padding-bottom: 10px;
            margin-bottom: 24px;
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
          }
          .header-left {
            display: flex;
            flex-direction: column;
            gap: 2px;
          }
          .persona-name {
            font-size: 13pt;
            font-weight: 700;
            color: #1e3a5f;
          }
          .header-brand {
            font-size: 9pt;
            color: #64748b;
            font-weight: 500;
          }
          .header-right {
            text-align: right;
            display: flex;
            flex-direction: column;
            gap: 2px;
          }
          .institute-name {
            font-size: 10pt;
            font-weight: 600;
            color: #1e3a5f;
          }
          .header-meta {
            font-size: 8pt;
            color: #64748b;
          }
          h1 { font-size: 16pt; font-weight: 700; color: #0f172a; margin: 20px 0 10px; page-break-after: avoid; }
          h2 { font-size: 13pt; font-weight: 700; color: #1e3a5f; margin: 16px 0 8px; page-break-after: avoid; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }
          h3 { font-size: 11pt; font-weight: 600; color: #334155; margin: 12px 0 6px; page-break-after: avoid; }
          p { margin-bottom: 10px; page-break-inside: avoid; }
          ul, ol { padding-left: 20px; margin-bottom: 12px; page-break-inside: avoid; }
          li { margin-bottom: 4px; }
          strong { font-weight: 600; color: #0f172a; }
          hr { border: none; border-top: 1px solid #cbd5e1; margin: 16px 0; }
          .toolbar {
            position: fixed;
            top: 12px;
            right: 18mm;
            background: #1e3a5f;
            color: #fff;
            padding: 8px 16px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 9.5pt;
            font-weight: 600;
            border: none;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            display: flex;
            align-items: center;
            gap: 6px;
            z-index: 1000;
          }
          .toolbar:hover { background: #152942; }
          .footer-note {
            margin-top: 30px;
            padding-top: 10px;
            border-top: 1px solid #e2e8f0;
            display: flex;
            justify-content: space-between;
            font-size: 8pt;
            color: #94a3b8;
          }
          @page {
            size: A4;
            margin: 18mm 16mm 18mm 16mm;
            @bottom-left {
              content: "Generated by ${appName} • Academic Intelligence Engine";
              font-family: Arial, sans-serif;
              font-size: 7.5pt;
              color: #94a3b8;
            }
            @bottom-right {
              content: "Page " counter(page) " of " counter(pages);
              font-family: Arial, sans-serif;
              font-size: 7.5pt;
              font-weight: bold;
              color: #64748b;
            }
          }
          @media print {
            body { padding: 0; }
            .no-print { display: none !important; }
          }
        </style>
      </head>
      <body>
        <button class="toolbar no-print" onclick="window.print()">
          🖨️ Print / Save PDF with ${appName}
        </button>

        <div class="header">
          <div class="header-left">
            <div class="persona-name">👨‍🏫 ${personaName}</div>
            <div class="header-brand">${appName} Study Notes • ${personaRole}</div>
          </div>
          <div class="header-right">
            <div class="institute-name">🏛️ ${institute}</div>
            <div class="header-meta">${today}${subjectTags.length > 0 ? ' • ' + subjectTags.join(', ') : ''}</div>
          </div>
        </div>

        <div id="content"></div>

        <div class="footer-note no-print">
          <span>Generated by ${appName} • Page numbers render automatically in print</span>
          <span>${today}</span>
        </div>

        <script>
          let content = ${JSON.stringify(editableContent)};
          content = content
            .replace(/^### (.+)$/gm, '<h3>$1</h3>')
            .replace(/^## (.+)$/gm, '<h2>$1</h2>')
            .replace(/^# (.+)$/gm, '<h1>$1</h1>')
            .replace(/\\*\\*\\*(.+?)\\*\\*\\*/g, '<strong><em>$1</em></strong>')
            .replace(/\\*\\*(.+?)\\*\\*/g, '<strong>$1</strong>')
            .replace(/\\*(.+?)\\*/g, '<em>$1</em>')
            .replace(/^[-*+] (.+)$/gm, '<li>$1</li>')
            .replace(/(<li>[\\s\\S]*?<\\/li>)/g, '<ul>$1</ul>')
            .replace(/^---$/gm, '<hr>')
            .replace(/\\n\\n/g, '</p><p>')
            .replace(/^(?!<[hupli]|<hr)(.+)$/gm, '<p>$1</p>');
          document.getElementById('content').innerHTML = content;

          function tryRender(attempts) {
            if (typeof renderMathInElement !== 'undefined') {
              renderMathInElement(document.body, {
                delimiters: [
                  {left: '$$', right: '$$', display: true},
                  {left: '$', right: '$', display: false}
                ],
                throwOnError: false
              });
            } else if (attempts > 0) {
              setTimeout(() => tryRender(attempts - 1), 200);
            }
          }
          setTimeout(() => tryRender(10), 300);
        <\/script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div
      id="compiled-notes-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-3 sm:p-5 animate-in fade-in duration-150"
    >
      <div
        id="compiled-notes-modal-container"
        className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden"
      >
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between gap-4">
          {/* Persona Header Left */}
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white text-xs shrink-0 shadow-xs ring-1 ring-white/10"
              style={{ backgroundColor: avatarColor }}
            >
              {initials}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm font-bold text-white truncate flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span>{personaName}</span>
                </h2>
                <span className="text-[10px] font-semibold px-2 py-0.2 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                  Compiled Study Notes
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate mt-0.5">
                {personaRole}
              </p>
            </div>
          </div>

          {/* Top Right Section: Institute, Date & Close */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="hidden sm:flex flex-col items-end text-right">
              <div className="flex items-center gap-1 text-xs font-semibold text-slate-200">
                <Building2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="max-w-[220px] truncate" title={institute}>
                  {institute}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5">
                {today}
                {subjectTags.length > 0 && ` • ${subjectTags.join(', ')}`}
              </span>
            </div>

            <button
              id="close-compiled-notes-modal-btn"
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* View Mode Toggle Bar */}
        <div className="flex items-center justify-between px-5 py-2.5 bg-slate-900/90 border-b border-slate-800 text-xs">
          <div className="flex items-center gap-1.5">
            <button
              id="toggle-preview-mode-btn"
              type="button"
              onClick={() => setViewMode('preview')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'preview'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Sparkles className="w-3 h-3" />
              <span>Preview</span>
            </button>
            <button
              id="toggle-edit-mode-btn"
              type="button"
              onClick={() => setViewMode('edit')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'edit'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <FileText className="w-3 h-3" />
              <span>Edit Document</span>
            </button>
          </div>

          <div className="text-[11px] text-slate-400 hidden md:flex items-center gap-1">
            <span>Compiled seamlessly from student notes</span>
          </div>
        </div>

        {/* Document Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 min-h-[380px] bg-slate-950/40">
          {viewMode === 'preview' ? (
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 sm:p-7 min-h-[380px] text-slate-200 leading-relaxed shadow-inner">
              <MarkdownRenderer content={editableContent} />
            </div>
          ) : (
            <textarea
              id="compiled-notes-editor-textarea"
              className="w-full h-full min-h-[380px] bg-slate-900 text-slate-100 rounded-xl p-4 text-xs sm:text-sm leading-relaxed resize-none border border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none font-mono"
              value={editableContent}
              onChange={(e) => setEditableContent(e.target.value)}
              placeholder="Your compiled notes will appear here..."
            />
          )}
        </div>

        {/* Action Buttons Footer with App Name */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 p-4 sm:p-5 border-t border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-2">
            <button
              id="copy-compiled-notes-btn"
              type="button"
              onClick={handleCopy}
              className="px-3.5 py-2 rounded-xl border border-slate-700 hover:border-slate-500 bg-slate-800/80 text-slate-300 hover:text-white transition-colors text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400 font-bold">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Notes</span>
                </>
              )}
            </button>

            <button
              id="print-compiled-notes-btn"
              type="button"
              onClick={handlePrintView}
              className="px-3.5 py-2 rounded-xl border border-amber-600/40 hover:border-amber-500 bg-amber-500/10 text-amber-300 hover:text-amber-200 transition-colors text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              title={`Print or Save PDF with ${appName}`}
            >
              <Printer className="w-3.5 h-3.5 text-amber-400" />
              <span>Print View ({appName})</span>
            </button>
          </div>

          <button
            id="download-compiled-pdf-btn"
            type="button"
            onClick={handleDownloadPDF}
            disabled={isGenerating}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-md disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Generating PDF with {appName}...</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5" />
                <span>Download PDF with {appName}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
