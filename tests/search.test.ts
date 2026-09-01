import { describe, expect, it } from 'vitest';
import { findUniversities, normalizeReading } from '../src/search';
import type { University } from '../src/types';

const universities: University[] = [
  { code: '1005', name: '旭川医大', reading: 'あさひかわいだい', aliases: ['あさひかわいかだいがく'], records: [] },
  { code: '1070', name: '東北大', reading: 'とうほくだい', aliases: ['とうほくだいがく'], records: [] },
];

describe('normalizeReading', () => {
  it('空白を除去してカタカナをひらがなへ正規化する', () => {
    expect(normalizeReading(' トウホク ')).toBe('とうほく');
  });
});

describe('findUniversities', () => {
  it('1文字の部分一致で候補を返す', () => {
    expect(findUniversities(universities, 'あ')).toHaveLength(1);
  });

  it('別名の読みでも候補を返す', () => {
    expect(findUniversities(universities, 'あさひかわいか')).toEqual([universities[0]]);
  });

  it('大学名の漢字を1文字から部分一致で検索できる', () => {
    expect(findUniversities(universities, '東')).toEqual([universities[1]]);
  });

  it('候補がなければ空配列を返す', () => {
    expect(findUniversities(universities, 'なし')).toEqual([]);
  });
});
