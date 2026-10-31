import type { ChatSession } from '../types/chat';

export type ExamDefaults = {
  level: string;
  board: string;
};

export const DEFAULT_EXAM_DEFAULTS: ExamDefaults = {
  level: '10th',
  board: 'Punjab Board',
};

export const EXAM_DEFAULTS_STORAGE_KEY = 'gage_exam_defaults';

const VALID_LEVELS = new Set(['9th', '10th', '11th', '12th', 'Undergrad', 'Postgrad', 'General']);

function isValidLevel(value: unknown): value is string {
  return typeof value === 'string' && VALID_LEVELS.has(value.trim());
}

function isValidBoard(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

export function normalizeExamDefaults(candidate?: Partial<ExamDefaults>): ExamDefaults {
  const level = isValidLevel(candidate?.level) ? candidate.level.trim() : DEFAULT_EXAM_DEFAULTS.level;
  const board = isValidBoard(candidate?.board) ? candidate.board.trim() : DEFAULT_EXAM_DEFAULTS.board;
  return { level, board };
}

export function readExamDefaults(overrides?: Partial<ExamDefaults>): ExamDefaults {
  const storage = typeof globalThis !== 'undefined' ? globalThis.localStorage : undefined;
  if (!storage) {
    return normalizeExamDefaults(overrides);
  }

  try {
    const raw = storage.getItem(EXAM_DEFAULTS_STORAGE_KEY);
    if (!raw) {
      return normalizeExamDefaults(overrides);
    }

    const parsed = JSON.parse(raw) as Partial<ExamDefaults>;
    return normalizeExamDefaults({ ...parsed, ...overrides });
  } catch {
    return normalizeExamDefaults(overrides);
  }
}

export function writeExamDefaults(value: Partial<ExamDefaults>): ExamDefaults {
  const normalized = normalizeExamDefaults(value);
  const storage = typeof globalThis !== 'undefined' ? globalThis.localStorage : undefined;
  if (storage) {
    storage.setItem(EXAM_DEFAULTS_STORAGE_KEY, JSON.stringify(normalized));
  }
  return normalized;
}

export function applyExamDefaults(
  sessionLike: Partial<ChatSession> | { exam?: Partial<{ targetExam?: string; className?: string }> } | undefined,
  defaults: Partial<ExamDefaults> = readExamDefaults()
): Partial<{ targetExam?: string; className?: string }> {
  const normalizedDefaults = normalizeExamDefaults(defaults);
  const exam = (sessionLike as { exam?: Partial<{ targetExam?: string; className?: string }> } | undefined)?.exam ?? {};
  const next: Partial<{ targetExam?: string; className?: string }> = { ...exam };

  if (!next.targetExam) {
    next.targetExam = normalizedDefaults.board;
  }

  if (!next.className) {
    next.className = normalizedDefaults.level;
  }

  return next;
}
