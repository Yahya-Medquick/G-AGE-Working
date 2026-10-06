import { isClassLevelId, type ClassLevelId } from '../data/classLevels';

export type CatalogStatus = 'available' | 'coming_soon';

export interface CatalogWriteInput {
  classLevel: ClassLevelId;
  subjectKey: string;
  title: string;
  board: string | null;
  publisher: string | null;
  personaGroup: string | null;
  status: CatalogStatus;
  starterTopics: string[];
}

function optionalText(value: unknown, maxLength: number): string | null | undefined {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value !== 'string') return undefined;
  const text = value.trim();
  return text.length <= maxLength ? text || null : undefined;
}

export function parseCatalogWriteInput(value: unknown): CatalogWriteInput | null {
  if (!value || typeof value !== 'object') return null;
  const input = value as Record<string, unknown>;
  const subjectKey = typeof input.subjectKey === 'string' ? input.subjectKey.trim() : '';
  const title = typeof input.title === 'string' ? input.title.trim() : '';
  const board = optionalText(input.board, 255);
  const publisher = optionalText(input.publisher, 255);
  const personaGroup = optionalText(input.personaGroup, 100);
  const starterTopics = input.starterTopics === undefined ? [] : input.starterTopics;

  if (
    !isClassLevelId(input.classLevel)
    || !subjectKey || subjectKey.length > 100
    || !title || title.length > 255
    || board === undefined || publisher === undefined || personaGroup === undefined
    || (input.status !== 'available' && input.status !== 'coming_soon')
    || !Array.isArray(starterTopics)
    || starterTopics.length > 20
    || starterTopics.some((topic) => typeof topic !== 'string' || !topic.trim() || topic.trim().length > 120)
  ) {
    return null;
  }

  return {
    classLevel: input.classLevel,
    subjectKey,
    title,
    board,
    publisher,
    personaGroup,
    status: input.status,
    starterTopics: starterTopics.map((topic) => typeof topic === 'string' ? topic.trim() : ''),
  };
}

export function isCatalogBookAvailable(status: unknown, personaGroup: unknown, hasActiveTeacher: boolean): boolean {
  return status === 'available'
    && typeof personaGroup === 'string'
    && personaGroup.trim().length > 0
    && hasActiveTeacher;
}
