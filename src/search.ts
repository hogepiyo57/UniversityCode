import type { University } from './types';

export function normalizeReading(value: string): string {
  return value
    .normalize('NFKC')
    .replace(/[\s　]+/g, '')
    .replace(/[ァ-ヶ]/g, (character) => String.fromCharCode(character.charCodeAt(0) - 0x60));
}

export function findUniversities(universities: University[], input: string): University[] {
  const query = normalizeReading(input);
  if (!query) return [];

  return universities.filter((university) => [university.reading, ...university.aliases]
    .some((reading) => normalizeReading(reading).includes(query)));
}
