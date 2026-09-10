import React, { useState, useEffect, useMemo } from "react";
import { useUser } from "../../context/UserContext";
import { getAuthHeaders } from "../../services/api";
import {
  FileText,
  Plus,
  Trash2,
  Edit,
  Sparkles,
  Copy,
  ExternalLink,
  X,
  Check,
  Filter,
  CheckSquare,
  Square,
  RefreshCw,
  AlertCircle
} from "lucide-react";
import { MarkdownRenderer } from "../MarkdownRenderer";
import { CompiledNotesModal } from "../CompiledNotesModal";
import { ExpertPersona } from "../../types";

interface Note {
  id: string;
  title: string;
  content: string;
  subject_tag: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}

const SUBJECT_SUGGESTIONS = [
  "Physics",
  "Chemistry",
  "Biology",
  "Math",
  "English",
  "Urdu",
  "Pakistan Studies",
  "Islamiat"
];

interface NotesCardProps {
  persona?: ExpertPersona | null;
}

export const NotesCard: React.FC<NotesCardProps> = ({ persona }) => {
  const { isLoggedIn } = useUser();

  // State Management
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Note form state
  const [title, setTitle] = useState("");
  const [subjectTag, setSubjectTag] = useState("");
  const [content, setContent] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  // Multi-select and Filter states
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [subjectFilter, setSubjectFilter] = useState("All");

  // Compiled Result Modal
  const [compiledText, setCompiledText] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [subjectTags, setSubjectTags] = useState<string[]>([]);
  const [compiling, setCompiling] = useState(false);

  // Toast alert system
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Local storage guest notes detection (for migration offer)
  const [hasLocalNotes, setHasLocalNotes] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // Fetch or load notes
  const loadNotes = async () => {
    setLoading(true);
    setError(null);
    try {
      if (isLoggedIn) {
        const response = await fetch("/api/notes", {
          credentials: "include",
          headers: { ...getAuthHeaders() }
        });
        if (!response.ok) {
          throw new Error("Failed to load notes from the server.");
        }
        const data = await response.json();
        setNotes(data);
      } else {
        const local = localStorage.getItem("bifrost_notes");
        if (local) {
          setNotes(JSON.parse(local));
        } else {
          setNotes([]);
        }
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred loading notes.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotes();
  }, [isLoggedIn]);

  // Check for local guest notes to offer sync when logged in
  useEffect(() => {
    if (isLoggedIn) {
      const local = localStorage.getItem("bifrost_notes");
      if (local) {
        try {
          const parsed = JSON.parse(local);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setHasLocalNotes(true);
          }
        } catch {
          setHasLocalNotes(false);
        }
      }
    } else {
      setHasLocalNotes(false);
    }
  }, [isLoggedIn]);

  // Show Toast / Notification alert
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Sync Guest Notes to Server
  const handleSyncNotes = async () => {
    const local = localStorage.getItem("bifrost_notes");
    if (!local) return;
    setSyncing(true);
    try {
      const guestNotes: Note[] = JSON.parse(local);
      let successCount = 0;

      for (const note of guestNotes) {
        const response = await fetch("/api/notes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: note.title,
            content: note.content,
            subject_tag: note.subject_tag,
            tags: note.tags || []
          })
        });
        if (response.ok) {
          successCount++;
        }
      }

      triggerToast(`Successfully synced ${successCount} notes to your cloud account!`);
      localStorage.removeItem("bifrost_notes");
      setHasLocalNotes(false);
      loadNotes();
    } catch (err) {
      console.error("Migration error:", err);
      triggerToast("An error occurred during note synchronization.");
    } finally {
      setSyncing(false);
    }
  };

  const handleDiscardLocalNotes = () => {
    localStorage.removeItem("bifrost_notes");
    setHasLocalNotes(false);
    triggerToast("Guest notes discarded.");
  };

  // Unique list of subject tags in the current user's notes
  const uniqueSubjects = useMemo(() => {
    const subs = new Set<string>();
    notes.forEach((n) => {
      if (n.subject_tag) {
        subs.add(n.subject_tag);
      }
    });
    return Array.from(subs);
  }, [notes]);

  // Filtered Notes List
  const filteredNotes = useMemo(() => {
    if (subjectFilter === "All") return notes;
    return notes.filter((n) => n.subject_tag === subjectFilter);
  }, [notes, subjectFilter]);

  // Clear Form fields
  const handleClearForm = () => {
    setTitle("");
    setSubjectTag("");
    setContent("");
    setEditingId(null);
  };

  // Create or Update Note Action
  const handleSaveNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    const selectedSubject = subjectTag.trim() || "General";

    if (isLoggedIn) {
      setLoading(true);
      try {
        if (editingId) {
          // Update Note on Server
          const response = await fetch(`/api/notes/${editingId}`, {
            method: "PATCH",
            credentials: "include",
            headers: { "Content-Type": "application/json", ...getAuthHeaders() },
            body: JSON.stringify({
              title: title.trim(),
              content: content.trim(),
              subject_tag: selectedSubject
            })
          });

          if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.error || "Failed to update note.");
          }

          triggerToast("Note updated successfully!");
        } else {
          // Create Note on Server
          const response = await fetch("/api/notes", {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json", ...getAuthHeaders() },
            body: JSON.stringify({
              title: title.trim(),
              content: content.trim(),
              subject_tag: selectedSubject,
              tags: []
            })
          });

          if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.error || "Failed to save note.");
          }

          triggerToast("Note created successfully!");
        }

        handleClearForm();
        loadNotes();
      } catch (err: any) {
        console.error(err);
        triggerToast(err.message || "Failed to save note.");
      } finally {
        setLoading(false);
      }
    } else {
      // LocalStorage Guest Note Logic
      const localNotesStr = localStorage.getItem("bifrost_notes");
      let localNotes: Note[] = localNotesStr ? JSON.parse(localNotesStr) : [];

      if (editingId) {
        // Edit existing local note
        localNotes = localNotes.map((n) =>
          n.id === editingId
            ? {
                ...n,
                title: title.trim(),
                content: content.trim(),
                subject_tag: selectedSubject,
                updated_at: new Date().toISOString()
              }
            : n
        );
        triggerToast("Local note updated!");
      } else {
        // Add new guest note
        const newLocalNote: Note = {
          id: "local-" + Math.random().toString(36).substring(7),
          title: title.trim(),
          content: content.trim(),
          subject_tag: selectedSubject,
          tags: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        localNotes.push(newLocalNote);
        triggerToast("Local note saved!");
      }

      localStorage.setItem("bifrost_notes", JSON.stringify(localNotes));
      setNotes(localNotes);
      handleClearForm();
    }
  };

  // Populate form with note values for editing
  const handleEditNote = (note: Note) => {
    setTitle(note.title);
    setSubjectTag(note.subject_tag || "");
    setContent(note.content);
    setEditingId(note.id);
  };

  // Delete Note Action
  const handleDelete = async (noteId: string) => {
    try {
      const token = localStorage.getItem('bifrost_session_token');
      const response = await fetch(`/api/notes/${noteId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) {
        const err = await response.json();
        console.error('Delete failed:', err);
        return;
      }
      setNotes(prev => prev.filter(n => n.id !== noteId));
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  // Toggle checkbox selection for compiling
  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Select all or Clear select convenience
  const handleSelectAll = () => {
    if (selectedIds.length === filteredNotes.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredNotes.map((n) => n.id));
    }
  };

  // Compile selected notes action
  const handleCompileNotes = async () => {
    if (selectedIds.length < 2) return;
    setCompiling(true);
    setError(null);

    try {
      const selectedNotes = notes.filter((n) => selectedIds.includes(n.id));
      const payload = {
        noteIds: selectedIds,
        notes: selectedNotes.map((n) => ({
          title: n.title,
          content: n.content,
          subject_tag: n.subject_tag || "General"
        }))
      };

      const response = await fetch("/api/notes/compile", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to compile notes.");
      }

      const data = await response.json();
      setCompiledText(data.compiled);
      
      // Extract unique subject tags of selected notes
      const selectedSubjects = Array.from(new Set(selectedNotes.map((n) => n.subject_tag).filter(Boolean))) as string[];
      setSubjectTags(selectedSubjects);
      setModalOpen(true);
    } catch (err: any) {
      console.error(err);
      triggerToast(err.message || "Failed to compile selected notes.");
    } finally {
      setCompiling(false);
    }
  };

  // Copy to Clipboard helper
  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    triggerToast("Copied to clipboard!");
  };

  // Open in Google Docs
  const handleOpenGoogleDocs = (text: string) => {
    navigator.clipboard.writeText(text);
    triggerToast("Text copied — paste it into your new Google Doc!");
    window.open("https://docs.google.com/document/create", "_blank");
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-300">
      
      {/* Toast Alert Banner */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-950 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 border border-slate-800 animate-bounce">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Migration offer banner */}
      {hasLocalNotes && (
        <div className="bg-gradient-to-r from-indigo-50 to-indigo-100/50 dark:from-slate-900 dark:to-slate-850 border border-indigo-200/60 dark:border-indigo-950 p-5 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
              <RefreshCw className={`w-5 h-5 ${syncing ? "animate-spin" : ""}`} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100">
                Sync Guest Notes Available
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed mt-0.5">
                We detected notes saved during your guest session. Would you like to securely synchronize them to your cloud account so you don't lose them?
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleSyncNotes}
              disabled={syncing}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold shadow-xs cursor-pointer disabled:opacity-50 transition-colors"
            >
              {syncing ? "Syncing..." : "Sync Notes"}
            </button>
            <button
              onClick={handleDiscardLocalNotes}
              disabled={syncing}
              className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-bold hover:bg-slate-50 dark:hover:bg-slate-900 cursor-pointer disabled:opacity-50 transition-colors"
            >
              Discard
            </button>
          </div>
        </div>
      )}

      {/* Header Info */}
      <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
          <FileText className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
            Smart Student Notes & Compilation
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Take notes categorized by curriculum subjects, organize, and compile multiple study files into coherent study sheets.
          </p>
        </div>
      </div>

      {/* Two Column Layout on Desktop, Single Column on Mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: Note Creation / Editor */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800/70 rounded-2xl p-5 space-y-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              {editingId ? "Edit Student Note" : "Create Student Note"}
            </h4>
            {editingId && (
              <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-100/30">
                EDITING MODE
              </span>
            )}
          </div>

          <form onSubmit={handleSaveNote} className="space-y-4 text-xs">
            {/* Title field */}
            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                Note Title
              </label>
              <input
                type="text"
                placeholder="e.g. Newton's Second Law of Motion"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                required
              />
            </div>

            {/* Subject tag field */}
            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                Subject Tag
              </label>
              <input
                type="text"
                placeholder="e.g. Physics"
                value={subjectTag}
                onChange={(e) => setSubjectTag(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
              />

              {/* Suggestions row */}
              <div className="flex flex-wrap gap-1.5 mt-2">
                {SUBJECT_SUGGESTIONS.map((subj) => (
                  <button
                    key={subj}
                    type="button"
                    onClick={() => setSubjectTag(subj)}
                    className="text-[10px] px-2 py-0.5 rounded-md bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                  >
                    {subj}
                  </button>
                ))}
              </div>
            </div>

            {/* Content field */}
            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                Content
              </label>
              <textarea
                rows={10}
                placeholder="Type or paste your notes here..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 font-mono text-xs focus:outline-hidden focus:ring-1 focus:ring-indigo-500 leading-relaxed"
                required
              />
            </div>

            {/* Form actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-850">
              <button
                type="button"
                onClick={handleClearForm}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900 font-semibold cursor-pointer"
              >
                Clear Form
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{editingId ? "Update Note" : "Save Note"}</span>
              </button>
            </div>
          </form>
        </div>

        {/* RIGHT COLUMN: Saved Notes List */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* List Toolbar */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800/70 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xs text-xs">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="w-4 h-4 text-slate-400 shrink-0" />
              <select
                value={subjectFilter}
                onChange={(e) => setSubjectFilter(e.target.value)}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs px-3 py-1.5 rounded-lg text-slate-700 dark:text-slate-200 focus:outline-hidden"
              >
                <option value="All">All Subjects</option>
                {uniqueSubjects.map((sub) => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              {filteredNotes.length > 0 && (
                <button
                  onClick={handleSelectAll}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-300 font-semibold cursor-pointer flex items-center gap-1"
                >
                  {selectedIds.length === filteredNotes.length ? "Deselect All" : "Select All"}
                </button>
              )}

              <button
                onClick={handleCompileNotes}
                disabled={compiling || selectedIds.length < 2}
                className="px-3.5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold flex items-center gap-1.5 disabled:opacity-40 shadow-xs cursor-pointer transition-colors"
                title="Select at least 2 notes to compile"
              >
                <Sparkles className={`w-4 h-4 ${compiling ? "animate-spin" : ""}`} />
                <span>{compiling ? "Compiling..." : `Compile Selected (${selectedIds.length})`}</span>
              </button>
            </div>
          </div>

          {/* List display */}
          {loading && notes.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 dark:border-indigo-400 mx-auto"></div>
              <p className="text-xs text-slate-400">Loading your notes...</p>
            </div>
          ) : filteredNotes.length === 0 ? (
            <div className="text-center p-12 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900">
              <p className="text-xs text-slate-400 font-medium">
                No notes found matching current filters.
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Create a new note in the left panel to begin.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredNotes.map((note) => {
                const isChecked = selectedIds.includes(note.id);
                return (
                  <div
                    key={note.id}
                    className={`bg-white dark:bg-slate-900 border rounded-xl p-4 flex gap-3 transition-all ${
                      isChecked
                        ? "border-indigo-500/80 bg-indigo-50/10 dark:bg-indigo-950/10"
                        : "border-slate-200/60 dark:border-slate-800/80"
                    }`}
                  >
                    {/* Checkbox trigger */}
                    <div
                      onClick={() => handleToggleSelect(note.id)}
                      className="cursor-pointer shrink-0 mt-0.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                    >
                      {isChecked ? (
                        <CheckSquare className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </div>

                    {/* Note details */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                          {note.title}
                        </h4>
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-slate-50 dark:bg-slate-950 text-slate-500 uppercase tracking-wide border border-slate-100 dark:border-slate-800">
                          {note.subject_tag || "General"}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                        {note.content}
                      </p>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-2 border-t border-slate-50 dark:border-slate-850">
                        <span>
                          Updated: {new Date(note.updated_at).toLocaleDateString()}
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEditNote(note)}
                            className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
                            title="Edit note"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(note.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
                            title="Delete note"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>
      </div>

      <CompiledNotesModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        compiledText={compiledText}
        subjectTags={subjectTags}
        persona={persona}
      />

    </div>
  );
};
