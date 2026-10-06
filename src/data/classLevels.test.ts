import { describe, expect, it } from 'vitest';
import { CLASS_LEVELS, isClassLevelId } from './classLevels';

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
});
