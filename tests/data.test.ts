import { describe, expect, it } from 'vitest';
import data from '../public/data/universities.json';
import { findUniversities } from '../src/search';
import type { UniversityData } from '../src/types';

const universityData = data as UniversityData;

describe('生成済み大学コードデータ', () => {
  it('想定した大学数とコード行数を持つ', () => {
    expect(universityData.universities).toHaveLength(1369);
    expect(universityData.universities.flatMap((university) => university.records)).toHaveLength(7724);
  });

  it('全コードが4桁-2桁-2桁形式である', () => {
    for (const university of universityData.universities) {
      expect(university.reading.length).toBeGreaterThan(0);
      for (const record of university.records) {
        expect(record.code).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      }
    }
  });

  it('実データを1文字と読み仮名で検索できる', () => {
    expect(findUniversities(universityData.universities, 'あ').length).toBeGreaterThan(0);
    expect(findUniversities(universityData.universities, 'ほっかいどう').some((university) => university.code === '1025')).toBe(true);
  });
});
