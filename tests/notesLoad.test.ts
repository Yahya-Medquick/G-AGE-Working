import { describe, expect, it } from 'vitest';
import { getNotesSource, needsNotesLoad } from '../src/utils/notesLoad';

describe('notes load source', () => {
  it('loads on first mount', () => {
    expect(needsNotesLoad(null, false)).toBe(true);
    expect(getNotesSource(false)).toBe('guest');
  });

  it('does not reload when the source is unchanged', () => {
    expect(needsNotesLoad('guest', false)).toBe(false);
    expect(needsNotesLoad('user', true)).toBe(false);
  });

  it('reloads when a guest signs in', () => {
    expect(needsNotesLoad('guest', true)).toBe(true);
    expect(getNotesSource(true)).toBe('user');
  });

  it('reloads when a user signs out', () => {
    expect(needsNotesLoad('user', false)).toBe(true);
    expect(getNotesSource(false)).toBe('guest');
  });
});
