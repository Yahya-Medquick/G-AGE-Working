import { describe, expect, it } from 'vitest';
import { CLASS_LEVELS, isClassLevelId, shouldPromptForClass } from './classLevels';

describe('class levels', () => {
  it('accepts only levels in the shared catalog', () => {
    expect(isClassLevelId('10')).toBe(true);
    expect(isClassLevelId('o_level')).toBe(true);
    expect(isClassLevelId('graduate')).toBe(false);
    expect(isClassLevelId(undefined)).toBe(false);
  });

  it('keeps identifiers unique', () => {
    const ids = CLASS_LEVELS.map(({ id }) => id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('prompts signed-in non-guests without a valid class after auth loads', () => {
    expect(shouldPromptForClass({
      isLoading: false,
      isLoggedIn: true,
      isGuest: false,
      classLevel: null,
      dismissed: false,
    })).toBe(true);
    expect(shouldPromptForClass({
      isLoading: false,
      isLoggedIn: true,
      isGuest: false,
      classLevel: '10',
      dismissed: false,
    })).toBe(false);
    expect(shouldPromptForClass({
      isLoading: false,
      isLoggedIn: false,
      isGuest: true,
      classLevel: null,
      dismissed: false,
    })).toBe(false);
    expect(shouldPromptForClass({
      isLoading: true,
      isLoggedIn: true,
      isGuest: false,
      classLevel: null,
      dismissed: false,
    })).toBe(false);
  });
});
