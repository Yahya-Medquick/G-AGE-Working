import { describe, expect, it, beforeEach, vi } from 'vitest';
import { applyExamDefaults, normalizeExamDefaults, readExamDefaults, DEFAULT_EXAM_DEFAULTS } from '../src/utils/examDefaults';

describe('examDefaults', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    });
  });

  it('normalizes partial defaults to known values', () => {
    expect(normalizeExamDefaults({ level: '9th' })).toMatchObject({
      level: '9th',
      board: DEFAULT_EXAM_DEFAULTS.board,
    });

    expect(normalizeExamDefaults({ board: 'Cambridge' })).toMatchObject({
      level: DEFAULT_EXAM_DEFAULTS.level,
      board: 'Cambridge',
    });
  });

  it('reads stored defaults from localStorage and falls back safely', () => {
    const getItem = vi.fn((key: string) => {
      if (key === 'gage_exam_defaults') {
        return JSON.stringify({ level: '12th', board: 'Federal Board' });
      }
      return null;
    });

    vi.stubGlobal('localStorage', { getItem, setItem: vi.fn(), removeItem: vi.fn() });

    expect(readExamDefaults()).toEqual({ level: '12th', board: 'Federal Board' });
    expect(readExamDefaults({ level: 'bogus' } as any)).toEqual({
      level: DEFAULT_EXAM_DEFAULTS.level,
      board: 'Federal Board',
    });
  });

  it('keeps explicit session values while applying saved defaults', () => {
    const defaults = { level: '11th', board: 'Punjab Board' };

    expect(applyExamDefaults({ exam: { targetExam: 'Cambridge', className: '10th' } }, defaults)).toEqual({
      targetExam: 'Cambridge',
      className: '10th',
    });

    expect(applyExamDefaults({ exam: {} }, defaults)).toEqual({
      targetExam: 'Punjab Board',
      className: '11th',
    });
  });
});
