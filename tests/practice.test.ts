import { describe, expect, it } from 'vitest';
import {
  parsePracticeAttemptInput,
  parsePracticeAttempts,
  parsePracticeProgress,
  parsePracticeQuestions,
} from '../src/utils/practice';

describe('practice attempt validation', () => {
  it('trims topic names and accepts valid attempt scores', () => {
    expect(parsePracticeAttemptInput({ topic: '  Cell biology  ', correctCount: 2, totalCount: 3 }))
      .toEqual({ topic: 'Cell biology', correctCount: 2, totalCount: 3 });
  });

  it.each([
    null,
    [],
    { topic: ' ', correctCount: 0, totalCount: 3 },
    { topic: 'x'.repeat(256), correctCount: 0, totalCount: 3 },
    { topic: 'Biology', correctCount: -1, totalCount: 3 },
    { topic: 'Biology', correctCount: 4, totalCount: 3 },
    { topic: 'Biology', correctCount: 0, totalCount: 0 },
    { topic: 'Biology', correctCount: 0, totalCount: 51 },
    { topic: 'Biology', correctCount: 1.5, totalCount: 3 },
  ])('rejects invalid attempt payloads: %j', (payload) => {
    expect(parsePracticeAttemptInput(payload)).toBeNull();
  });
});

describe('practice question response validation', () => {
  it('accepts valid multiple-choice questions', () => {
    expect(parsePracticeQuestions([{
      id: 'question-1',
      question: 'Which structure contains DNA?',
      options: ['Nucleus', 'Membrane'],
      answerIndex: 0,
      explanation: 'The nucleus contains most of the cell DNA.',
    }])).toHaveLength(1);
  });

  it('rejects invalid answer indexes and malformed options', () => {
    expect(() => parsePracticeQuestions([{
      id: 'question-1',
      question: 'Question',
      options: ['Only one'],
      answerIndex: 1,
      explanation: '',
    }])).toThrow('Practice question response is invalid.');
  });
});

describe('practice history response validation', () => {
  it('accepts valid attempt history and all-time totals', () => {
    const attempt = {
      id: 'attempt-1',
      topic: 'Cell biology',
      correct_count: 2,
      total_count: 3,
      created_at: '2025-01-01T12:00:00.000Z',
    };

    expect(parsePracticeProgress({
      attempts: [attempt],
      summary: { attempts: 1, questions: 3, correctAnswers: 2 },
    })).toEqual({
      attempts: [attempt],
      totalAttempts: 1,
      totalQuestions: 3,
      correctAnswers: 2,
    });
  });

  it('rejects malformed attempt history', () => {
    expect(() => parsePracticeAttempts([{ id: 'attempt-1' }])).toThrow('Practice history response is invalid.');
  });

  it('rejects invalid summary totals', () => {
    expect(() => parsePracticeProgress({
      attempts: [],
      summary: { attempts: 0, questions: 2, correctAnswers: 3 },
    })).toThrow('Practice history response is invalid.');
  });
});
