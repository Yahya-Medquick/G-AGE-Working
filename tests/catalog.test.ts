import { describe, expect, it } from 'vitest';
import { isCatalogBookAvailable, parseCatalogWriteInput } from '../src/utils/catalog';

describe('catalog management validation', () => {
  it('accepts supported catalog records and normalizes optional fields', () => {
    expect(parseCatalogWriteInput({
      classLevel: '10',
      subjectKey: 'Physics',
      title: 'Verified owner title',
      board: '  ',
      status: 'coming_soon',
      starterTopics: ['  Motion  '],
    })).toEqual({
      classLevel: '10',
      subjectKey: 'Physics',
      title: 'Verified owner title',
      board: null,
      publisher: null,
      personaGroup: null,
      status: 'coming_soon',
      starterTopics: ['Motion'],
    });
  });

  it('rejects invalid class IDs, statuses, and malformed starter topics', () => {
    const valid = {
      classLevel: '10',
      subjectKey: 'Physics',
      title: 'Verified owner title',
      status: 'available',
      starterTopics: [],
    };
    expect(parseCatalogWriteInput({ ...valid, classLevel: 'grade_13' })).toBeNull();
    expect(parseCatalogWriteInput({ ...valid, status: 'published' })).toBeNull();
    expect(parseCatalogWriteInput({ ...valid, starterTopics: [''] })).toBeNull();
  });

  it('shows an available item as coming soon when its teacher group has no active teacher', () => {
    expect(isCatalogBookAvailable('available', 'Chemistry', false)).toBe(false);
    expect(isCatalogBookAvailable('available', 'Chemistry', true)).toBe(true);
    expect(isCatalogBookAvailable('coming_soon', 'Chemistry', true)).toBe(false);
  });
});
