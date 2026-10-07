import React, { lazy, Suspense, useEffect, useState, useMemo } from "react";
import { X, Trash2, Sparkles, CheckSquare, Square, AlertCircle, FileText, Download, Search, Printer } from "lucide-react";
import { useNotes, Note } from "../hooks/useNotes";
import { ExportNotesModal } from "./ExportNotesModal";
import { ExpertPersona } from "../types";
import { useUser } from "../context/UserContext";
import { uiCopy, type UiLanguage } from "../i18n/ui";

const CompiledNotesModal = lazy(() =>
  import("./CompiledNotesModal").then((module) => ({ default: module.CompiledNotesModal }))
);

interface Props {
  isOpen: boolean;
  onClose: () => void;
  persona?: ExpertPersona | null;
  language: UiLanguage;
}

const escapeHtml = (value: string) => value
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;")
  .replace(/'/g, "&#39;");

export const NotesSidePanel = ({ isOpen, onClose, persona, language }: Props) => {
  const { notes, loading, error, deleteNote, compileNotes, exportNotesPDF, migrateLocalNotes } = useNotes();
  const { isLoggedIn } = useUser();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [subjectFilter, setSubjectFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [localNoteCount, setLocalNoteCount] = useState(0);
  const [migrating, setMigrating] = useState(false);
  const [migrationMessage, setMigrationMessage] = useState<string | null>(null);
  
  // Compilation modal state
  const [compiledText, setCompiledText] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [subjectTags, setSubjectTags] = useState<string[]>([]);
  const [compiling, setCompiling] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Export modal state (new)
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportNotes, setExportNotes] = useState<Note[]>([]);
  const [exportQuestions, setExportQuestions] = useState<string[] | undefined>(undefined);
  const [exportMode, setExportMode] = useState<"clean" | "qa" | "exam">("clean");
  const [exporting, setExporting] = useState(false);
  const t = (key: Parameters<typeof uiCopy>[1]) => uiCopy(language, key);

  useEffect(() => {
    if (!isOpen || !isLoggedIn) {
      setLocalNoteCount(0);
      return;
    }
    try {
      const raw = localStorage.getItem("bifrost_notes");
      if (!raw) {
        setLocalNoteCount(0);
        return;
      }
      const parsed: unknown = JSON.parse(raw);
      if (!Array.isArray(parsed)) throw new Error(t("notesLocalReadError"));
      setLocalNoteCount(parsed.length);
    } catch {
      setLocalNoteCount(0);
      setErrorMessage(t("notesLocalReadError"));
    }
  }, [isOpen, isLoggedIn, language]);

  const selectedNotes = useMemo(
    () => notes.filter((note) => selectedIds.includes(note.id)),
    [notes, selectedIds]
  );

  // Extract unique subject tags for filtering.
  const uniqueSubjects = useMemo(() => {
    const subs = new Set<string>();
    notes.forEach((n) => {
      if (n.subject_tag) subs.add(n.subject_tag);
    });
    return Array.from(subs);
  }, [notes]);

  // Filter notes by subject and text.
  const filteredNotes = useMemo(() => {
    const query = searchQuery.trim().toLocaleLowerCase();
    return notes.filter((note) => {
      const matchesSubject = subjectFilter === "All" || note.subject_tag === subjectFilter;
      const matchesQuery = !query || `${note.title}\n${note.content}`.toLocaleLowerCase().includes(query);
      return matchesSubject && matchesQuery;
    });
  }, [notes, searchQuery, subjectFilter]);

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(t("notesConfirmDelete"))) return;
    setErrorMessage(null);
    try {
      await deleteNote(id);
      setSelectedIds((prev) => prev.filter((i) => i !== id));
    } catch (err: any) {
      setErrorMessage(err instanceof Error ? err.message : t("notesDeleteError"));
    }
  };

  const handleCompile = async () => {
    if (selectedIds.length < 1) return;
    setCompiling(true);
    setErrorMessage(null);
    try {
      const text = await compileNotes(selectedIds);
      setCompiledText(text);
      const selectedNotes = notes.filter((n) => selectedIds.includes(n.id));
      const selectedSubjects = Array.from(
        new Set(selectedNotes.map((n) => n.subject_tag).filter(Boolean))
      ) as string[];
      setSubjectTags(selectedSubjects);
      setModalOpen(true);
    } catch (err: any) {
      setErrorMessage(err instanceof Error ? err.message : t("notesCompileError"));
    } finally {
      setCompiling(false);
    }
  };

  // NEW: Handle export PDF button
  const handleExport = async (mode: "clean" | "qa" | "exam") => {
    if (selectedIds.length < 1) return;
    setExporting(true);
    setErrorMessage(null);
    setExportMode(mode);
    try {
      const result = await exportNotesPDF(selectedIds, mode);
      setExportNotes(result.notes);
      setExportQuestions(result.questions);
      setExportModalOpen(true);
    } catch (err: any) {
      setErrorMessage(err instanceof Error ? err.message : t("notesExportError"));
    } finally {
      setExporting(false);
    }
  };

  const handleMigrateLocalNotes = async () => {
    setMigrating(true);
    setErrorMessage(null);
    setMigrationMessage(null);
    try {
      await migrateLocalNotes();
      setLocalNoteCount(0);
      setMigrationMessage(t("notesMigrated"));
    } catch (migrationError) {
      const errorCode = migrationError instanceof Error ? migrationError.message : "";
      const errorMessages: Record<string, string> = {
        NOTES_SIGN_IN_REQUIRED: t("notesSignInRequired"),
        NOTES_LOCAL_UNREADABLE: t("notesLocalReadError"),
        NOTES_LOCAL_INVALID: t("notesInvalidLocal"),
        NOTES_MIGRATION_FAILED: t("notesMigrationFailed"),
      };
      setErrorMessage(errorMessages[errorCode] || t("notesMigrationFailed"));
      try {
        const raw = localStorage.getItem("bifrost_notes");
        const parsed: unknown = raw ? JSON.parse(raw) : [];
        setLocalNoteCount(Array.isArray(parsed) ? parsed.length : 0);
      } catch {
        setLocalNoteCount(0);
      }
    } finally {
      setMigrating(false);
    }
  };

  const handleDownloadMarkdown = () => {
    if (!selectedNotes.length) return;
    try {
      const markdown = selectedNotes.map((note) =>
        `# ${note.title}\n\n_${note.subject_tag || "General"}_\n\n${note.content}`
      ).join("\n\n---\n\n");
      const url = URL.createObjectURL(new Blob([markdown], { type: "text/markdown;charset=utf-8" }));
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `gage-notes-${new Date().toISOString().slice(0, 10)}.md`;
      document.body.append(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      setErrorMessage(t("notesExportError"));
    }
  };

  const handlePrint = () => {
    if (!selectedNotes.length) return;
    try {
      const printWindow = window.open("", "_blank");
      if (!printWindow) {
        setErrorMessage(t("notesPrintBlocked"));
        return;
      }
      const sections = selectedNotes.map((note) => (
        `<article><h1>${escapeHtml(note.title)}</h1><p class="subject">${escapeHtml(note.subject_tag || "General")}</p><pre>${escapeHtml(note.content)}</pre></article>`
      )).join("");
      printWindow.opener = null;
      printWindow.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(t("notesPrintTitle"))}</title><style>body{font:16px/1.6 system-ui,sans-serif;color:#111;margin:2rem}article{break-after:page}h1{font-size:1.5rem}.subject{color:#555}pre{font:inherit;white-space:pre-wrap;overflow-wrap:anywhere}@media print{body{margin:1.5cm}}</style></head><body>${sections}</body></html>`);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
    } catch {
      setErrorMessage(t("notesExportError"));
    }
  };

  if (!isOpen) return null;

  const hasSelection = selectedIds.length >= 1;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 bottom-0 z-50 flex w-full max-w-md flex-col border-l border-border bg-surface text-text shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border p-5">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-accent-text" />
            <h3 className="text-base font-bold text-text">{t("notesTitle")}</h3>
            <span className="rounded-full bg-accent-soft px-2 py-0.5 text-xs font-semibold text-accent-text">
              {notes.length}
            </span>
          </div>
          <button 
            onClick={onClose} 
            aria-label={t("close")}
            className="flex h-11 w-11 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-2 hover:text-text focus-visible:outline-2 focus-visible:outline-accent"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Toolbar */}
        <div className="space-y-3 border-b border-border bg-surface-2 p-4">
          <div className="flex min-h-12 items-center gap-2 rounded-control border border-border bg-surface px-3 focus-within:outline-2 focus-within:outline-accent">
            <Search aria-hidden="true" className="h-4 w-4 shrink-0 text-muted" />
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              aria-label={t("notesSearchLabel")}
              placeholder={t("notesSearchPlaceholder")}
              className="min-w-0 flex-1 bg-transparent py-2 text-sm text-text placeholder:text-muted focus:outline-none"
            />
          </div>
          <div role="group" aria-label={t("notesFilterLabel")} className="flex gap-2 overflow-x-auto pb-1">
            <button
              type="button"
              aria-pressed={subjectFilter === "All"}
              onClick={() => setSubjectFilter("All")}
              className={`min-h-11 shrink-0 rounded-pill px-4 text-sm font-medium focus-visible:outline-2 focus-visible:outline-accent ${subjectFilter === "All" ? "bg-accent text-on-accent" : "bg-surface text-text hover:bg-surface-2"}`}
            >
              {t("notesFilterAll")}
            </button>
            {uniqueSubjects.map((subject) => (
              <button
                key={subject}
                type="button"
                aria-pressed={subjectFilter === subject}
                onClick={() => setSubjectFilter(subject)}
                className={`min-h-11 shrink-0 rounded-pill px-4 text-sm font-medium focus-visible:outline-2 focus-visible:outline-accent ${subjectFilter === subject ? "bg-accent text-on-accent" : "bg-surface text-text hover:bg-surface-2"}`}
              >
                {subject}
              </button>
            ))}
          </div>
        </div>

        {/* Content list */}
        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {localNoteCount > 0 && isLoggedIn && (
            <section className="space-y-2 rounded-tile border border-border bg-surface-2 p-4">
              <h4 className="font-semibold text-text">{t("notesMigrationTitle")}</h4>
              <p className="text-sm text-muted">{t("notesMigrationDescription")}</p>
              <button
                type="button"
                onClick={() => void handleMigrateLocalNotes()}
                disabled={migrating}
                className="min-h-11 rounded-control bg-accent px-4 text-sm font-semibold text-on-accent hover:opacity-90 disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                {migrating ? t("notesMigrating") : `${t("notesMigrationAction")} (${localNoteCount})`}
              </button>
            </section>
          )}
          {migrationMessage && <p role="status" className="rounded-control bg-accent-soft p-3 text-sm text-accent-text">{migrationMessage}</p>}
          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-danger/30 bg-danger/10 p-3 text-xs text-danger">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {errorMessage && (
            <div className="flex items-center gap-2 rounded-lg border border-danger/30 bg-danger/10 p-3 text-xs text-danger">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {loading && notes.length === 0 ? (
            <div className="space-y-2 py-12 text-center text-xs text-muted">
              <div className="mx-auto h-6 w-6 animate-spin rounded-full border-b-2 border-accent motion-reduce:animate-none"></div>
              <p>{t("notesLoading")}</p>
            </div>
          ) : filteredNotes.length === 0 ? (
            <div className="space-y-2 rounded-xl border border-dashed border-border bg-surface-2 p-6 py-16 text-center">
              <p className="text-xs font-medium text-muted">{t("notesEmptyTitle")}</p>
              <p className="text-[11px] text-muted">{t("notesEmptyDescription")}</p>
            </div>
          ) : (
            filteredNotes.map((note) => {
              const isChecked = selectedIds.includes(note.id);
              return (
                <article
                  key={note.id}
                  className={`flex gap-3 rounded-xl border p-3 transition-all ${
                    isChecked
                      ? "border-accent/60 bg-accent-soft"
                      : "border-border bg-surface hover:bg-surface-2"
                  }`}
                >
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={isChecked}
                    onClick={() => handleToggleSelect(note.id)}
                    className="flex min-w-0 flex-1 gap-3 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                  >
                    <span className="mt-0.5 shrink-0 text-muted">
                    {isChecked ? (
                      <CheckSquare className="h-4 w-4 text-accent-text" />
                    ) : (
                      <Square className="h-4 w-4" />
                    )}
                    </span>
                  <span className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="truncate text-xs font-bold text-text">
                        {note.title}
                      </h4>
                      <span className="rounded-full border border-border bg-surface-2 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-muted">
                        {note.subject_tag || "General"}
                      </span>
                    </div>
                    <p className="line-clamp-2 text-[11px] leading-relaxed text-muted">
                      {note.content}
                    </p>
                  </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleDelete(note.id)}
                    className="flex h-11 w-11 shrink-0 items-center justify-center self-center rounded-md text-muted transition-colors hover:bg-surface-2 hover:text-danger focus-visible:outline-2 focus-visible:outline-accent"
                    aria-label={t("notesDeleteAction")}
                  >
                    <Trash2 aria-hidden="true" className="h-4 w-4" />
                  </button>
                </article>
              );
            })
          )}
        </div>

        {/* Footer Action Buttons */}
        <div className="space-y-2 border-t border-border bg-surface-2 p-4">

          {/* Export PDF Button (new primary action) */}
          <div className="flex gap-2">
            <button
              onClick={() => handleExport("clean")}
              disabled={exporting || !hasSelection}
              className="flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-control bg-accent px-3 py-2.5 text-xs font-semibold text-on-accent shadow-lift transition-colors hover:opacity-90 disabled:opacity-40"
              aria-label={`${t("notesPdfExport")} (${selectedIds.length})`}
            >
              <Download className={`h-4 w-4 ${exporting ? "animate-bounce" : ""}`} />
              <span>{exporting ? t("notesPreparing") : `${t("notesPdfExport")} (${selectedIds.length})`}</span>
            </button>

            <select
              onChange={(e) => handleExport(e.target.value as "clean" | "qa" | "exam")}
              disabled={exporting || !hasSelection}
              value=""
              className="min-h-11 rounded-control border border-border bg-surface px-2 text-xs text-text focus-visible:outline-2 focus-visible:outline-accent disabled:opacity-40"
              aria-label={t("notesFormat")}
            >
              <option value="" disabled>{t("notesFormat")} ▾</option>
              <option value="clean">{t("notesClean")}</option>
              <option value="qa">{t("notesQA")}</option>
              <option value="exam">{t("notesExam")}</option>
            </select>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleDownloadMarkdown}
              disabled={!hasSelection}
              className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-control border border-border bg-surface px-3 text-xs font-medium text-text hover:bg-surface-2 disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-accent"
            >
              <Download aria-hidden="true" className="h-4 w-4" />
              {t("notesExportMarkdown")}
            </button>
            <button
              type="button"
              onClick={handlePrint}
              disabled={!hasSelection}
              className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-control border border-border bg-surface px-3 text-xs font-medium text-text hover:bg-surface-2 disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-accent"
            >
              <Printer aria-hidden="true" className="h-4 w-4" />
              {t("notesPrint")}
            </button>
          </div>

          <button
            onClick={handleCompile}
            disabled={compiling || !hasSelection}
            className="flex min-h-11 w-full items-center justify-center gap-1.5 rounded-control bg-accent-soft px-3 py-2.5 text-xs font-semibold text-accent-text shadow-lift transition-colors hover:opacity-90 disabled:opacity-40"
          >
            <Sparkles className={`h-4 w-4 ${compiling ? "animate-spin" : ""}`} />
            <span>{compiling ? t("notesCompiling") : `${t("notesCompile")} (${selectedIds.length})`}</span>
          </button>

          <p className="text-center text-[10px] text-muted">{t("notesFooterHint")}</p>
        </div>
      </div>

      {/* Existing AI Compile Modal */}
      <Suspense fallback={null}>
        <CompiledNotesModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          compiledText={compiledText}
          subjectTags={subjectTags}
          persona={persona}
        />
      </Suspense>

      {/* New Export PDF Modal */}
      <ExportNotesModal
        isOpen={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        notes={exportNotes}
        questions={exportQuestions}
        mode={exportMode}
        persona={persona}
      />
    </>
  );
};
