export type NotesSource = "guest" | "user";

export const getNotesSource = (isLoggedIn: boolean): NotesSource =>
  isLoggedIn ? "user" : "guest";

export const needsNotesLoad = (
  loadedFor: NotesSource | null,
  isLoggedIn: boolean
): boolean => loadedFor !== getNotesSource(isLoggedIn);
