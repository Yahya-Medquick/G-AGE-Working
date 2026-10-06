export const CLASS_LEVELS = [
  { id: '1', label: 'Class 1' },
  { id: '2', label: 'Class 2' },
  { id: '3', label: 'Class 3' },
  { id: '4', label: 'Class 4' },
  { id: '5', label: 'Class 5' },
  { id: '6', label: 'Class 6' },
  { id: '7', label: 'Class 7' },
  { id: '8', label: 'Class 8' },
  { id: '9', label: 'Class 9' },
  { id: '10', label: 'Class 10' },
  { id: '11', label: 'Class 11' },
  { id: '12', label: 'Class 12' },
  { id: 'o_level', label: 'O Level' },
  { id: 'a_level', label: 'A Level' },
  { id: 'university', label: 'University' },
] as const;

export type ClassLevelId = (typeof CLASS_LEVELS)[number]['id'];

export function isClassLevelId(value: unknown): value is ClassLevelId {
  return typeof value === 'string' && CLASS_LEVELS.some((level) => level.id === value);
}
