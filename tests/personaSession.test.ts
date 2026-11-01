import { describe, expect, it } from 'vitest';
import type { ChatSession } from '../src/types/chat';
import { isOpenerOnlySession } from '../src/utils/personaSession';

const session = (messages: ChatSession['messages']): ChatSession => ({
  id: 'session_test',
  title: 'Test',
  personaId: 'hamza',
  mode: 'concept',
  variant: 'global',
  createdAt: '',
  updatedAt: '',
  messages,
});

describe('isOpenerOnlySession', () => {
  it('accepts a single assistant opener', () => {
    expect(isOpenerOnlySession(session([{ id: '1', role: 'assistant', content: '', timestamp: '' }]))).toBe(true);
  });

  it('rejects empty or started conversations', () => {
    expect(isOpenerOnlySession(session([]))).toBe(false);
    expect(isOpenerOnlySession(session([
      { id: '1', role: 'assistant', content: '', timestamp: '' },
      { id: '2', role: 'user', content: 'Question', timestamp: '' },
    ]))).toBe(false);
    expect(isOpenerOnlySession(null)).toBe(false);
  });
});