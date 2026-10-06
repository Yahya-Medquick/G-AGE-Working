import type { ClassLevelId } from '../data/classLevels';

export type CatalogBookStatus = 'available' | 'coming_soon';

export interface CatalogBook {
  id: string;
  classLevel: ClassLevelId;
  subjectKey: string;
  title: string;
  board?: string | null;
  publisher?: string | null;
  personaGroup?: string | null;
  status: CatalogBookStatus;
  available: boolean;
  starterTopics: string[];
  voteCount: number;
  displayOrder?: number;
}

export interface CatalogSubject {
  key: string;
  books: CatalogBook[];
}

export interface CatalogResponse {
  success: boolean;
  classLevel: ClassLevelId | null;
  subjects: CatalogSubject[];
}
