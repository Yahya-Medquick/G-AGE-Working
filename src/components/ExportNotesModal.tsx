import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import {
  FileText, Download, X, Building2, User, Eye, BookOpen, GraduationCap, Check, Printer
} from 'lucide-react';
import { MarkdownRenderer } from './MarkdownRenderer';
import { ExpertPersona } from '../types';
import { EXPERTS } from '../data/experts';
import { Note } from '../hooks/useNotes';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  notes: Note[];
  questions?: string[];
  mode: 'clean' | 'qa' | 'exam';
  persona?: ExpertPersona | null;
  appName?: string;
}

export const ExportNotesModal: React.FC<Props> = ({
  isOpen,
  onClose,
  notes,
  questions,
  mode: initialMode,
  persona,
  appName = 'G-AGE AI'
}) => {
  const [mode, setMode] = useState(initialMode);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showAnswers, setShowAnswers] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setMode(initialMode);
    setShowAnswers(false);
  }, [initialMode, isOpen]);

  const activeExpert = persona || EXPERTS['hamza'];
  const personaName = activeExpert?.name || 'Hamza Tariq';
  const personaRole = activeExpert?.role || 'Academic Mentor & Concept Guide';
  const institute = activeExpert?.affiliation || 'G-AGE Academic Institute';
  const avatarColor = activeExpert?.avatar_color || '#00a884';
  const initials = activeExpert?.initials || 'GA';

  const today = new Date().toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric'
  });

  const allSubjects = Array.from(new Set(notes.map(n => n.subject_tag).filter(Boolean)));
  const cleanSubject = allSubjects[0]?.replace(/[^a-zA-Z0-9]/g, '_') || 'Study';
  const modeLabel = mode === 'clean' ? 'Notes' : mode === 'qa' ? 'QA' : 'Exam';
  const fileName = `${appName.replace(/\s+/g, '_')}_${modeLabel}_${cleanSubject}_${new Date().toISOString().split('T')[0]}.pdf`;

  if (!isOpen) return null;

  // Build preview content for each note based on mode
  const buildNoteContent = (note: Note, index: number) => {
    const question = questions?.[index];
    if (mode === 'clean') {
      return { question: null, answer: note.content };
    }
    if (mode === 'qa') {
      return { question: question || `What does "${note.title}" explain?`, answer: note.content };
    }
    // exam mode
    return { question: question || `What does "${note.title}" explain?`, answer: note.content };
  };

  // Strip markdown for PDF
  const stripMarkdown = (text: string): string => {
    let clean = text;
    const convertLatex = (latex: string): string => {
      let eq = latex.trim()
        .replace(/^\$\$|\$\$$/g, '').replace(/^\$|\$$/g, '')
        .replace(/\\times/g, '×').replace(/\\approx/g, '≈')
        .replace(/\\to/g, '→').replace(/\\infty/g, '∞')
        .replace(/\\cdot/g, '·').replace(/\\pm/g, '±')
        .replace(/\\geq/g, '≥').replace(/\\leq/g, '≤')
        .replace(/\\neq/g, '≠').replace(/\\alpha/g, 'α')
        .replace(/\\beta/g, 'β').replace(/\\gamma/g, 'γ')
        .replace(/\\Delta/g, 'Δ').replace(/\\pi/g, 'π');
      for (let i = 0; i < 5; i++) eq = eq.replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, '($1)/($2)');
      for (let i = 0; i < 3; i++) eq = eq.replace(/\\sqrt\{([^{}]+)\}/g, '√($1)');
      return eq.replace(/\^{([^{}]+)}/g, '^$1').replace(/_{([^{}]+)}/g, '_$1')
        .replace(/\\[a-zA-Z]+/g, '').replace(/\{([^{}]*)\}/g, '$1').trim();
    };
    clean = clean.replace(/\$\$([^$]+)\$\$/g, (_m, eq) => `\n[Formula: ${convertLatex(eq)}]\n`);
    clean = clean.replace(/\$([^$\n]+)\$/g, (_m, eq) => convertLatex(eq));
    clean = clean.replace(/^#{1,6}\s+(.+)$/gm, '### $1');
    clean = clean.replace(/\*\*\*(.+?)\*\*\*/g, '$1').replace(/\*\*(.+?)\*\*/g, '$1').replace(/\*(.+?)\*/g, '$1');
    clean = clean.replace(/__(.+?)__/g, '$1').replace(/_(.+?)_/g, '$1');
    clean = clean.replace(/^\s*[-*+]\s+/gm, '• ');
    clean = clean.replace(/^[-*_]{3,}$/gm, '---HRULE---');
    clean = clean.replace(/```[\s\S]*?```/gm, '').replace(/`([^`]+)`/g, '$1');
    clean = clean.replace(/^\s*>\s*/gm, '').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
    clean = clean.replace(/!\[([^\]]*)\]\([^)]+\)/g, '').replace(/<[^>]+>/g, '');
    clean = clean.replace(/\n{3,}/g, '\n\n');
    return clean.trim();
  };

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

      const drawHeader = () => {
        pdf.setDrawColor(30, 58, 95);
        pdf.setLineWidth(0.8);
        pdf.line(margin, headerTopY, pageWidth - margin, headerTopY);

        pdf.setTextColor(30, 58, 95);
        pdf.setFontSize(10.5);
        pdf.setFont('helvetica', 'bold');
        pdf.text(personaName, margin, headerTopY + 5.5);

        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(100, 116, 139);
        const modeStr = mode === 'clean' ? 'Study Notes' : mode === 'qa' ? 'Q&A Study Notes' : 'Exam Practice Sheet';
        pdf.text(`${appName} ${modeStr} • ${personaRole}`, margin, headerTopY + 9.5);

        pdf.setFontSize(8.5);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(30, 58, 95);
        const instituteClean = institute.length > 45 ? institute.slice(0, 42) + '...' : institute;
        pdf.text(instituteClean, pageWidth - margin, headerTopY + 5.5, { align: 'right' });

        pdf.setFontSize(7.5);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(100, 116, 139);
        const rightMeta = `${today}${allSubjects.length > 0 ? ' • ' + allSubjects.join(', ') : ''}`;
        pdf.text(rightMeta, pageWidth - margin, headerTopY + 9.5, { align: 'right' });

        pdf.setDrawColor(226, 232, 240);
        pdf.setLineWidth(0.3);
        pdf.line(margin, headerBottomY, pageWidth - margin, headerBottomY);
      };

      const renderTextBlock = (text: string, y: number): number => {
        const paragraphs = text.split('\n');
        paragraphs.forEach((paragraph) => {
          const trimmed = paragraph.trim();
          if (y > bottomLimitY) { pdf.addPage(); drawHeader(); y = startContentY; }
          if (trimmed === '') { y += 3.5; return; }
          if (trimmed === '---HRULE---') {
            pdf.setDrawColor(203, 213, 225); pdf.setLineWidth(0.3);
            pdf.line(margin, y, pageWidth - margin, y); y += 5; return;
          }
          const isH1 = trimmed.startsWith('### # ') || (trimmed.startsWith('# ') && !trimmed.startsWith('### '));
          const isH2 = trimmed.startsWith('### ## ');
          const isH3 = trimmed.startsWith('### ') && !isH1 && !isH2;
          const isBullet = trimmed.startsWith('•');

          if (isH1) {
            y += 4;
            pdf.setFont('helvetica', 'bold'); pdf.setFontSize(13); pdf.setTextColor(15, 23, 42);
            const lines = pdf.splitTextToSize(trimmed.replace(/^###\s*#*\s*/, '').replace(/^#\s*/, ''), contentWidth);
            lines.forEach((l: string) => { pdf.text(l, margin, y); y += 6.5; }); y += 2;
          } else if (isH2) {
            y += 3;
            pdf.setFont('helvetica', 'bold'); pdf.setFontSize(11); pdf.setTextColor(30, 58, 95);
            const lines = pdf.splitTextToSize(trimmed.replace(/^###\s*##\s*/, ''), contentWidth);
            lines.forEach((l: string) => { pdf.text(l, margin, y); y += 5.5; }); y += 1.5;
          } else if (isH3) {
            y += 2;
            pdf.setFont('helvetica', 'bold'); pdf.setFontSize(9.5); pdf.setTextColor(51, 65, 85);
            const lines = pdf.splitTextToSize(trimmed.replace(/^###\s*/, ''), contentWidth);
            lines.forEach((l: string) => { pdf.text(l, margin, y); y += 5; }); y += 1;
          } else {
            pdf.setFont('helvetica', 'normal'); pdf.setFontSize(9); pdf.setTextColor(51, 65, 85);
            const lines = pdf.splitTextToSize(trimmed, isBullet ? contentWidth - 4 : contentWidth);
            lines.forEach((l: string) => {
              if (y > bottomLimitY) { pdf.addPage(); drawHeader(); y = startContentY; }
              pdf.text(l, isBullet ? margin + 3.5 : margin, y); y += 4.8;
            }); y += 1;
          }
        });
        return y;
      };

      drawHeader();
      let y = startContentY;

      notes.forEach((note, index) => {
        const { question, answer } = buildNoteContent(note, index);

        // Note separator (except first)
        if (index > 0) {
          if (y > bottomLimitY - 20) { pdf.addPage(); drawHeader(); y = startContentY; }
          pdf.setDrawColor(203, 213, 225); pdf.setLineWidth(0.4);
          pdf.line(margin, y, pageWidth - margin, y); y += 8;
        }

        // Subject badge
        if (note.subject_tag) {
          pdf.setFillColor(239, 246, 255);
          pdf.setFont('helvetica', 'bold'); pdf.setFontSize(7.5); pdf.setTextColor(30, 58, 95);
          const badgeText = note.subject_tag.toUpperCase();
          pdf.text(badgeText, margin, y); y += 5;
        }

        // Question (Q&A and Exam modes)
        if (question && (mode === 'qa' || mode === 'exam')) {
          if (y > bottomLimitY) { pdf.addPage(); drawHeader(); y = startContentY; }
          pdf.setFillColor(254, 252, 232);
          pdf.setFont('helvetica', 'bold'); pdf.setFontSize(10); pdf.setTextColor(120, 53, 15);
          const qLines = pdf.splitTextToSize(`Q: ${question}`, contentWidth);
          const qBoxH = qLines.length * 5.5 + 6;
          pdf.rect(margin, y - 4, contentWidth, qBoxH, 'F');
          qLines.forEach((l: string) => { pdf.text(l, margin + 3, y); y += 5.5; });
          y += 4;
        }

        // Answer section header (exam mode)
        if (mode === 'exam') {
          pdf.setFont('helvetica', 'bold'); pdf.setFontSize(8.5); pdf.setTextColor(100, 116, 139);
          pdf.text('Answer:', margin, y); y += 5;
          pdf.setDrawColor(226, 232, 240); pdf.setLineWidth(0.2);
          pdf.line(margin, y, pageWidth - margin, y); y += 4;
        }

        // Answer content (raw, no AI rewriting)
        const cleanAnswer = stripMarkdown(answer);
        y = renderTextBlock(cleanAnswer, y);
        y += 4;
      });

      // Footer on all pages
      const totalPages = (pdf as any).internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setDrawColor(226, 232, 240); pdf.setLineWidth(0.3);
        pdf.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);
        pdf.setFontSize(7.5); pdf.setFont('helvetica', 'normal'); pdf.setTextColor(148, 163, 184);
        pdf.text(`Generated by ${appName} • Academic Intelligence Engine`, margin, pageHeight - 6);
        pdf.setFont('helvetica', 'bold'); pdf.setTextColor(100, 116, 139);
        pdf.text(`Page ${i} of ${totalPages}`, pageWidth - margin, pageHeight - 6, { align: 'right' });
      }

      pdf.save(fileName);
    } catch (err) {
      console.error('PDF generation error:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrintView = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    const modeStr = mode === 'clean' ? 'Study Notes' : mode === 'qa' ? 'Q&A Study Notes' : 'Exam Practice Sheet';

    const notesHTML = notes.map((note, index) => {
      const { question, answer } = buildNoteContent(note, index);
      const subjectBadge = note.subject_tag
        ? `<div class="subject-badge">${note.subject_tag}</div>` : '';
      const questionHtml = question && (mode === 'qa' || mode === 'exam')
        ? `<div class="question-box"><strong>Q:</strong> ${question}</div>` : '';
      const answerHeader = mode === 'exam'
        ? `<div class="answer-label">Answer:</div><hr class="answer-divider">` : '';
      const answerHtml = answer
        .replace(/^### (.+)$/gm, '<h3>$1</h3>')
        .replace(/^## (.+)$/gm, '<h2>$1</h2>')
        .replace(/^# (.+)$/gm, '<h1>$1</h1>')
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/^[-*+] (.+)$/gm, '<li>$1</li>')
        .replace(/(<li>[\s\S]*?<\/li>)/g, '<ul>$1</ul>')
        .replace(/^---$/gm, '<hr>')
        .replace(/\n\n/g, '</p><p>')
        .replace(/^(?!<[hupli]|<hr)(.+)$/gm, '<p>$1</p>');

      return `
        <div class="note-block ${index > 0 ? 'note-separator' : ''}">
          ${subjectBadge}
          ${questionHtml}
          ${answerHeader}
          <div class="answer-content">${answerHtml}</div>
        </div>
      `;
    }).join('');

    printWindow.document.write(`
      <!DOCTYPE html><html lang="en"><head>
        <meta charset="UTF-8">
        <title>${fileName}</title>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
        <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js"><\/script>
        <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js"><\/script>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; font-size: 10.5pt; color: #1e293b; padding: 20mm 18mm; line-height: 1.65; background: #fff; }
          .header { border-bottom: 2px solid #1e3a5f; padding-bottom: 10px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: flex-start; }
          .persona-name { font-size: 13pt; font-weight: 700; color: #1e3a5f; }
          .header-brand { font-size: 9pt; color: #64748b; }
          .institute-name { font-size: 10pt; font-weight: 600; color: #1e3a5f; text-align: right; }
          .header-meta { font-size: 8pt; color: #64748b; text-align: right; }
          .note-block { margin-bottom: 24px; }
          .note-separator { border-top: 1px solid #cbd5e1; padding-top: 20px; }
          .subject-badge { display: inline-block; font-size: 7.5pt; font-weight: 700; color: #1e3a5f; background: #eff6ff; border: 1px solid #bfdbfe; padding: 2px 8px; border-radius: 4px; margin-bottom: 8px; letter-spacing: 0.05em; text-transform: uppercase; }
          .question-box { background: #fefce8; border-left: 3px solid #f59e0b; padding: 8px 12px; margin-bottom: 12px; border-radius: 4px; font-weight: 600; color: #78350f; font-size: 10.5pt; page-break-inside: avoid; }
          .answer-label { font-size: 9pt; font-weight: 700; color: #64748b; margin-bottom: 4px; }
          .answer-divider { border: none; border-top: 1px dashed #e2e8f0; margin-bottom: 10px; }
          .answer-content h1 { font-size: 14pt; font-weight: 700; color: #0f172a; margin: 16px 0 8px; }
          .answer-content h2 { font-size: 12pt; font-weight: 700; color: #1e3a5f; margin: 12px 0 6px; border-bottom: 1px solid #e2e8f0; padding-bottom: 3px; }
          .answer-content h3 { font-size: 10.5pt; font-weight: 600; color: #334155; margin: 10px 0 5px; }
          .answer-content p { margin-bottom: 8px; }
          .answer-content ul { padding-left: 18px; margin-bottom: 10px; }
          .answer-content li { margin-bottom: 3px; }
          .answer-content strong { font-weight: 600; color: #0f172a; }
          .toolbar { position: fixed; top: 12px; right: 18mm; background: #1e3a5f; color: #fff; padding: 8px 16px; border-radius: 8px; cursor: pointer; font-size: 9.5pt; font-weight: 600; border: none; box-shadow: 0 4px 12px rgba(0,0,0,0.15); z-index: 1000; }
          @page { size: A4; margin: 18mm 16mm; @bottom-left { content: "Generated by ${appName} • Academic Intelligence Engine"; font-size: 7.5pt; color: #94a3b8; } @bottom-right { content: "Page " counter(page) " of " counter(pages); font-size: 7.5pt; font-weight: bold; color: #64748b; } }
          @media print { body { padding: 0; } .no-print { display: none !important; } }
        </style>
      </head><body>
        <button class="toolbar no-print" onclick="window.print()">🖨️ Print / Save PDF</button>
        <div class="header">
          <div>
            <div class="persona-name">👨‍🏫 ${personaName}</div>
            <div class="header-brand">${appName} ${modeStr} • ${personaRole}</div>
          </div>
          <div>
            <div class="institute-name">🏛️ ${institute}</div>
            <div class="header-meta">${today}${allSubjects.length > 0 ? ' • ' + allSubjects.join(', ') : ''}</div>
          </div>
        </div>
        ${notesHTML}
        <script>
          function tryRender(attempts) {
            if (typeof renderMathInElement !== 'undefined') {
              renderMathInElement(document.body, { delimiters: [{left:'$$',right:'$$',display:true},{left:'$',right:'$',display:false}], throwOnError: false });
            } else if (attempts > 0) { setTimeout(() => tryRender(attempts - 1), 200); }
          }
          setTimeout(() => tryRender(10), 300);
        <\/script>
      </body></html>
    `);
    printWindow.document.close();
  };

  const modeIcons = { clean: <Eye className="w-3.5 h-3.5" />, qa: <BookOpen className="w-3.5 h-3.5" />, exam: <GraduationCap className="w-3.5 h-3.5" /> };
  const modeLabels = { clean: 'Clean Notes', qa: 'Q&A Format', exam: 'Exam Style' };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-3 sm:p-5 animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white text-xs shrink-0 shadow-xs ring-1 ring-white/10" style={{ backgroundColor: avatarColor }}>
              {initials}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm font-bold text-white truncate flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span>{personaName}</span>
                </h2>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                  PDF Export • {notes.length} note{notes.length !== 1 ? 's' : ''}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate mt-0.5">{personaRole}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className="hidden sm:flex flex-col items-end text-right">
              <div className="flex items-center gap-1 text-xs font-semibold text-slate-200">
                <Building2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="max-w-[220px] truncate">{institute}</span>
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5">
                {today}{allSubjects.length > 0 && ` • ${allSubjects.join(', ')}`}
              </span>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mode Toggle */}
        <div className="flex items-center gap-2 px-5 py-3 bg-slate-900/90 border-b border-slate-800 text-xs">
          <span className="text-slate-400 font-medium mr-1">Format:</span>
          {(['clean', 'qa', 'exam'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                mode === m ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {modeIcons[m]}
              <span>{modeLabels[m]}</span>
            </button>
          ))}
          {mode === 'exam' && (
            <button
              onClick={() => setShowAnswers(!showAnswers)}
              className="ml-auto px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 transition-all"
            >
              {showAnswers ? '🙈 Hide Answers' : '👁️ Show Answers'}
            </button>
          )}
        </div>

        {/* Preview */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-950/40 space-y-4">
          {notes.map((note, index) => {
            const { question, answer } = buildNoteContent(note, index);
            return (
              <div key={note.id} className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-3">
                {/* Subject badge */}
                {note.subject_tag && (
                  <span className="inline-block text-[9px] font-bold px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800 uppercase tracking-wider">
                    {note.subject_tag}
                  </span>
                )}

                {/* Question (Q&A and Exam) */}
                {question && (mode === 'qa' || mode === 'exam') && (
                  <div className="bg-amber-950/30 border-l-2 border-amber-500 rounded-r-lg px-4 py-2.5">
                    <p className="text-xs font-bold text-amber-300">Q: {question}</p>
                  </div>
                )}

                {/* Answer */}
                {(mode !== 'exam' || showAnswers) && (
                  <div className="text-slate-200 leading-relaxed">
                    {mode === 'exam' && <p className="text-[10px] text-slate-500 font-semibold mb-2">Answer:</p>}
                    <MarkdownRenderer content={answer} />
                  </div>
                )}

                {mode === 'exam' && !showAnswers && (
                  <div className="border border-dashed border-slate-700 rounded-lg py-4 text-center text-xs text-slate-500">
                    Answer hidden — toggle "Show Answers" to reveal
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 p-4 sm:p-5 border-t border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrintView}
              className="px-3.5 py-2 rounded-xl border border-amber-600/40 hover:border-amber-500 bg-amber-500/10 text-amber-300 hover:text-amber-200 transition-colors text-xs font-semibold flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5 text-amber-400" />
              <span>Print View</span>
            </button>
          </div>

          <button
            onClick={handleDownloadPDF}
            disabled={isGenerating}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-md disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <><div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /><span>Generating PDF...</span></>
            ) : (
              <><Download className="w-3.5 h-3.5" /><span>Download PDF with {appName}</span></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
