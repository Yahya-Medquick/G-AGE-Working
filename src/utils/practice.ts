export interface PracticeAttemptInput {
  topic: string;
  correctCount: number;
  totalCount: number;
}

export interface PracticeAttempt {
  id: string;
  topic: string;
  correct_count: number;
  total_count: number;
  created_at: string;
}

export interface PracticeQuestion {
  id: string;
  question: string;
  options: string[];
  answerIndex: number;
  explanation: string;
}

export interface PracticeProgress {
  attempts: PracticeAttempt[];
  totalAttempts: number;
  totalQuestions: number;
  correctAnswers: number;
}

export function parsePracticeProgress(value: unknown): PracticeProgress {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Practice history response is invalid.');
  }
  const record = value as Record<string, unknown>;
  const attempts = parsePracticeAttempts(record.attempts);
  const summary = record.summary;
  if (!summary || typeof summary !== 'object' || Array.isArray(summary)) {
    throw new Error('Practice history response is invalid.');
  }
  const totals = summary as Record<string, unknown>;
  if (
    typeof totals.attempts !== 'number' ||
    !Number.isInteger(totals.attempts) ||
    typeof totals.questions !== 'number' ||
    !Number.isInteger(totals.questions) ||
    typeof totals.correctAnswers !== 'number' ||
    !Number.isInteger(totals.correctAnswers) ||
    totals.attempts < attempts.length ||
    totals.questions < 0 ||
    totals.correctAnswers < 0 ||
    totals.correctAnswers > totals.questions
  ) {
    throw new Error('Practice history response is invalid.');
  }
  return {
    attempts,
    totalAttempts: totals.attempts,
    totalQuestions: totals.questions,
    correctAnswers: totals.correctAnswers,
  };
}

export function parsePracticeQuestions(value: unknown): PracticeQuestion[] {
  if (!Array.isArray(value) || value.length < 1 || value.length > 10) {
    throw new Error('Practice question response is invalid.');
  }

  return value.map((question) => {
    if (!question || typeof question !== 'object' || Array.isArray(question)) {
      throw new Error('Practice question response is invalid.');
    }
    const record = question as Record<string, unknown>;
    if (
      typeof record.id !== 'string' ||
      typeof record.question !== 'string' ||
      !record.question.trim() ||
      !Array.isArray(record.options) ||
      record.options.length < 2 ||
      record.options.length > 6 ||
      !record.options.every((option) => typeof option === 'string' && option.trim()) ||
      typeof record.answerIndex !== 'number' ||
      !Number.isInteger(record.answerIndex) ||
      record.answerIndex < 0 ||
      record.answerIndex >= record.options.length ||
      typeof record.explanation !== 'string'
    ) {
      throw new Error('Practice question response is invalid.');
    }

    return {
      id: record.id,
      question: record.question,
      options: record.options,
      answerIndex: record.answerIndex,
      explanation: record.explanation,
    };
  });
}

export function parsePracticeAttemptInput(value: unknown): PracticeAttemptInput | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;

  const input = value as Record<string, unknown>;
  if (typeof input.topic !== 'string') return null;
  const topic = input.topic.trim();
  if (!topic || topic.length > 255) return null;
  if (
    typeof input.correctCount !== 'number' ||
    typeof input.totalCount !== 'number' ||
    !Number.isInteger(input.correctCount) ||
    !Number.isInteger(input.totalCount)
  ) return null;

  const correctCount = input.correctCount;
  const totalCount = input.totalCount;
  if (totalCount < 1 || totalCount > 50 || correctCount < 0 || correctCount > totalCount) return null;

  return { topic, correctCount, totalCount };
}

export function parsePracticeAttempts(value: unknown): PracticeAttempt[] {
  if (!Array.isArray(value)) throw new Error('Practice history response is invalid.');

  return value.map((attempt) => {
    if (!attempt || typeof attempt !== 'object' || Array.isArray(attempt)) {
      throw new Error('Practice history response is invalid.');
    }
    const record = attempt as Record<string, unknown>;
    if (
      typeof record.id !== 'string' ||
      typeof record.topic !== 'string' ||
      typeof record.correct_count !== 'number' ||
      !Number.isInteger(record.correct_count) ||
      typeof record.total_count !== 'number' ||
      !Number.isInteger(record.total_count) ||
      typeof record.created_at !== 'string'
    ) {
      throw new Error('Practice history response is invalid.');
    }

    const correctCount = record.correct_count;
    const totalCount = record.total_count;
    if (totalCount < 1 || correctCount < 0 || correctCount > totalCount || !Number.isFinite(Date.parse(record.created_at))) {
      throw new Error('Practice history response is invalid.');
    }

    return {
      id: record.id,
      topic: record.topic,
      correct_count: correctCount,
      total_count: totalCount,
      created_at: record.created_at,
    };
  });
}
