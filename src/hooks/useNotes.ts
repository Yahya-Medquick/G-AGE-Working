import { useState, useEffect } from "react";
import { useUser } from "../context/UserContext";
import { getAuthHeaders } from "../services/api";

export interface Note {
  id: string;
  title: string;
  content: string;
  subject_tag: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}

const LOCAL_NOTE_IMPORT_TAG = "__gage_local_note:";

// Global state variables for sharing note lists and loading state across components
let globalNotes: Note[] = [];
let globalLoading = false;
let globalError: string | null = null;
let initialized = false;
const listeners = new Set<() => void>();

const notify = () => {
  listeners.forEach((listener) => listener());
};

const fetchNotesFromServerOrLocal = async (isLoggedIn: boolean) => {
  globalLoading = true;
  globalError = null;
  notify();

  try {
    if (isLoggedIn) {
      const response = await fetch("/api/notes", {
        credentials: "include",
        headers: { ...getAuthHeaders() }
      });
      if (response.ok) {
        const data = await response.json();
        globalNotes = data;
      } else {
        throw new Error("Failed to load notes from the server.");
      }
    } else {
      const local = localStorage.getItem("bifrost_notes");
      globalNotes = local ? JSON.parse(local) : [];
    }
  } catch (err: any) {
    console.error(err);
    globalError = err.message || "An unexpected error occurred loading notes.";
  } finally {
    globalLoading = false;
    notify();
  }
};

export const useNotes = () => {
  const { isLoggedIn } = useUser();
  const [notes, setNotes] = useState<Note[]>(globalNotes);
  const [loading, setLoading] = useState<boolean>(globalLoading);
  const [error, setError] = useState<string | null>(globalError);

  useEffect(() => {
    const handleUpdate = () => {
      setNotes([...globalNotes]);
      setLoading(globalLoading);
      setError(globalError);
    };

    listeners.add(handleUpdate);

    // Initial load on first render or when login state transitions
    if (!initialized || (isLoggedIn && globalNotes.some(n => n.id.startsWith("local-")))) {
      initialized = true;
      fetchNotesFromServerOrLocal(isLoggedIn);
    }

    return () => {
      listeners.delete(handleUpdate);
    };
  }, [isLoggedIn]);

  const fetchNotes = async () => {
    await fetchNotesFromServerOrLocal(isLoggedIn);
  };

  const addNote = async (title: string, content: string, subject_tag: string = "General") => {
    globalLoading = true;
    globalError = null;
    notify();

    try {
      const selectedSubject = subject_tag.trim() || "General";
      if (isLoggedIn) {
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
        
        await fetchNotesFromServerOrLocal(isLoggedIn);
      } else {
        const newLocalNote: Note = {
          id: "local-" + Math.random().toString(36).substring(7),
          title: title.trim(),
          content: content.trim(),
          subject_tag: selectedSubject,
          tags: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        globalNotes = [...globalNotes, newLocalNote];
        localStorage.setItem("bifrost_notes", JSON.stringify(globalNotes));
        notify();
      }
    } catch (err: any) {
      console.error(err);
      globalError = err.message || "Failed to save note.";
      notify();
      throw err;
    } finally {
      globalLoading = false;
      notify();
    }
  };

  const deleteNote = async (id: string) => {
    globalLoading = true;
    globalError = null;
    notify();

    try {
      if (isLoggedIn) {
        const response = await fetch(`/api/notes/${id}`, {
          method: "DELETE",
          credentials: "include",
          headers: { ...getAuthHeaders() }
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || "Failed to delete note.");
        }

        await fetchNotesFromServerOrLocal(isLoggedIn);
      } else {
        globalNotes = globalNotes.filter((n) => n.id !== id);
        localStorage.setItem("bifrost_notes", JSON.stringify(globalNotes));
        notify();
      }
    } catch (err: any) {
      console.error(err);
      globalError = err.message || "Failed to delete note.";
      notify();
      throw err;
    } finally {
      globalLoading = false;
      notify();
    }
  };

  // NEW: Export notes as PDF (1 or more notes, no AI rewriting)
  const exportNotesPDF = async (
    noteIds: string[],
    mode: "clean" | "qa" | "exam" = "clean"
  ): Promise<{ notes: Note[]; questions?: string[] }> => {
    if (noteIds.length < 1) {
      throw new Error("Select at least 1 note to export");
    }

    const selectedNotes = notes.filter((n) => noteIds.includes(n.id));

    // For clean mode: no AI needed, just return notes as-is
    if (mode === "clean") {
      return { notes: selectedNotes };
    }

    // For Q&A and Exam modes: batch generate questions for all notes in one AI call
    const response = await fetch("/api/notes/generate-questions", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      body: JSON.stringify({
        notes: selectedNotes.map((n) => ({
          title: n.title,
          content: n.content,
          subject_tag: n.subject_tag || "General"
        }))
      })
    });

    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.error || "Failed to generate questions.");
    }

    const data = await response.json();
    return { notes: selectedNotes, questions: data.questions };
  };

  // KEPT for backward compatibility but restriction removed (now allows 1+)
  const compileNotes = async (noteIds: string[]) => {
    if (noteIds.length < 1) {
      throw new Error("Select at least 1 note to compile");
    }

    try {
      const selectedNotes = notes.filter((n) => noteIds.includes(n.id));
      const payload: any = {
        noteIds,
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
      return data.compiled;
    } catch (err: any) {
      console.error(err);
      throw err;
    }
  };

  const migrateLocalNotes = async () => {
    if (!isLoggedIn) throw new Error("NOTES_SIGN_IN_REQUIRED");
    const raw = localStorage.getItem("bifrost_notes");
    if (!raw) return 0;

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new Error("NOTES_LOCAL_UNREADABLE");
    }
    if (!Array.isArray(parsed)) {
      throw new Error("NOTES_LOCAL_UNREADABLE");
    }
    const localNotes: Note[] = parsed.map((value) => {
      if (!value || typeof value !== "object") {
        throw new Error("NOTES_LOCAL_INVALID");
      }
      const candidate = value as Record<string, unknown>;
      if (typeof candidate.id !== "string" || typeof candidate.title !== "string" || typeof candidate.content !== "string") {
        throw new Error("NOTES_LOCAL_INVALID");
      }
      return {
        id: candidate.id,
        title: candidate.title,
        content: candidate.content,
        subject_tag: typeof candidate.subject_tag === "string" ? candidate.subject_tag : "General",
        tags: Array.isArray(candidate.tags) ? candidate.tags.filter((tag): tag is string => typeof tag === "string") : [],
        created_at: typeof candidate.created_at === "string" ? candidate.created_at : new Date().toISOString(),
        updated_at: typeof candidate.updated_at === "string" ? candidate.updated_at : new Date().toISOString(),
      };
    });
    const remoteResponse = await fetch("/api/notes", {
      credentials: "include",
      headers: { ...getAuthHeaders() },
    });
    if (!remoteResponse.ok) throw new Error("NOTES_MIGRATION_FAILED");
    const remoteNotes: unknown = await remoteResponse.json();
    if (!Array.isArray(remoteNotes)) throw new Error("NOTES_MIGRATION_FAILED");
    const importedIds = new Set(
      remoteNotes.flatMap((value: unknown) => {
        if (!value || typeof value !== "object" || !("tags" in value) || !Array.isArray(value.tags)) return [];
        return value.tags.filter((tag: unknown): tag is string => typeof tag === "string");
      })
        .filter((tag) => tag.startsWith(LOCAL_NOTE_IMPORT_TAG))
        .map((tag) => tag.slice(LOCAL_NOTE_IMPORT_TAG.length))
    );
    let migratedCount = 0;

    for (let index = 0; index < localNotes.length; index += 1) {
      const note = localNotes[index];
      const localId = typeof note.id === "string" ? note.id : `legacy-${index}`;
      if (!importedIds.has(localId)) {
        const response = await fetch("/api/notes", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json", ...getAuthHeaders() },
          body: JSON.stringify({
            title: note.title,
            content: note.content,
            subject_tag: note.subject_tag || "General",
            tags: [...(Array.isArray(note.tags) ? note.tags : []), `${LOCAL_NOTE_IMPORT_TAG}${localId}`],
          }),
        });
        if (!response.ok) {
          throw new Error("NOTES_MIGRATION_FAILED");
        }
        importedIds.add(localId);
        migratedCount += 1;
      }

      const remaining = localNotes.slice(index + 1);
      if (remaining.length > 0) localStorage.setItem("bifrost_notes", JSON.stringify(remaining));
      else localStorage.removeItem("bifrost_notes");
    }

    await fetchNotesFromServerOrLocal(true);
    return migratedCount;
  };

  return {
    notes,
    loading,
    error,
    addNote,
    deleteNote,
    fetchNotes,
    compileNotes,
    exportNotesPDF,
    migrateLocalNotes
  };
};
