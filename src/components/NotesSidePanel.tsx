import React, { useState, useMemo } from "react";
import { X, Trash2, Filter, Sparkles, CheckSquare, Square, AlertCircle, FileText } from "lucide-react";
import { useNotes } from "../hooks/useNotes";
import { CompiledNotesModal } from "./CompiledNotesModal";
import { ExpertPersona } from "../types";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  persona?: ExpertPersona | null;
}

export const NotesSidePanel = ({ isOpen, onClose, persona }: Props) => {
  const { notes, loading, error, deleteNote, compileNotes } = useNotes();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [subjectFilter, setSubjectFilter] = useState("All");
  
  // Compilation modal state inside the sidepanel
  const [compiledText, setCompiledText] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [subjectTags, setSubjectTags] = useState<string[]>([]);
  const [compiling, setCompiling] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Extract unique subject tags for filtering dropdown
  const uniqueSubjects = useMemo(() => {
    const subs = new Set<string>();
    notes.forEach((n) => {
      if (n.subject_tag) {
        subs.add(n.subject_tag);
      }
    });
    return Array.from(subs);
  }, [notes]);

  // Filter notes array
  const filteredNotes = useMemo(() => {
    if (subjectFilter === "All") return notes;
    return notes.filter((n) => n.subject_tag === subjectFilter);
  }, [notes, subjectFilter]);

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this note?")) return;
    try {
      await deleteNote(id);
      setSelectedIds((prev) => prev.filter((i) => i !== id));
    } catch (err: any) {
      alert(err.message || "Failed to delete note");
    }
  };

  const handleCompile = async () => {
    if (selectedIds.length < 2) return;
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
      setErrorMessage(err.message || "Compilation failed");
    } finally {
      setCompiling(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col text-slate-100">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-850">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base font-bold text-white">📝 My Notes</h3>
            <span className="bg-indigo-500/20 text-indigo-300 text-xs px-2 py-0.5 rounded-full font-semibold">
              {notes.length}
            </span>
          </div>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-white p-1 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Toolbar */}
        <div className="p-4 bg-slate-950 border-b border-slate-850 flex items-center gap-2 text-xs">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <span className="text-slate-400 font-medium">Filter:</span>
          <select
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            className="flex-1 bg-slate-900 border border-slate-800 text-xs px-2.5 py-1.5 rounded-lg text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="All">All Subjects</option>
            {uniqueSubjects.map((sub) => (
              <option key={sub} value={sub}>{sub}</option>
            ))}
          </select>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {error && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {loading && notes.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400 space-y-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-400 mx-auto"></div>
              <p>Loading notes...</p>
            </div>
          ) : filteredNotes.length === 0 ? (
            <div className="py-16 text-center border border-dashed border-slate-800 rounded-xl bg-slate-950 p-6 space-y-2">
              <p className="text-xs text-slate-400 font-medium">No notes found.</p>
              <p className="text-[11px] text-slate-500">
                Click "+ Notes" on any roadmap, Q&A, or resource to save notes here.
              </p>
            </div>
          ) : (
            filteredNotes.map((note) => {
              const isChecked = selectedIds.includes(note.id);
              return (
                <div
                  key={note.id}
                  onClick={() => handleToggleSelect(note.id)}
                  className={`cursor-pointer rounded-xl p-3 border transition-all flex gap-3 text-left ${
                    isChecked
                      ? "border-indigo-500/60 bg-indigo-950/20"
                      : "border-slate-800 bg-slate-950 hover:bg-slate-900"
                  }`}
                >
                  <div className="shrink-0 mt-0.5 text-slate-500">
                    {isChecked ? (
                      <CheckSquare className="w-4 h-4 text-indigo-400" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-xs font-bold text-slate-200 truncate">
                        {note.title}
                      </h4>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-slate-900 text-slate-400 uppercase tracking-wide border border-slate-800">
                        {note.subject_tag || "General"}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                      {note.content}
                    </p>
                    <div className="flex justify-end pt-1">
                      <button
                        onClick={(e) => handleDelete(note.id, e)}
                        className="p-1 text-slate-500 hover:text-rose-400 rounded-md hover:bg-slate-900 transition-colors"
                        title="Delete note"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Compile Footer Button */}
        <div className="p-4 border-t border-slate-850 bg-slate-950 space-y-2">
          <button
            onClick={handleCompile}
            disabled={compiling || selectedIds.length < 2}
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-md"
          >
            <Sparkles className={`w-4 h-4 ${compiling ? "animate-spin" : ""}`} />
            <span>{compiling ? "Compiling with AI..." : `Compile Selected (${selectedIds.length})`}</span>
          </button>
          <p className="text-[10px] text-slate-500 text-center">
            Select 2+ notes to compile into a comprehensive study sheet via Gemini AI.
          </p>
        </div>

      </div>

      <CompiledNotesModal 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)} 
        compiledText={compiledText} 
        subjectTags={subjectTags} 
        persona={persona}
      />
    </>
  );
};
