import { useEffect, useMemo, useState } from 'react';
import { findUniversities, normalizeReading } from './search';
import type { University, UniversityData } from './types';

type LoadState = 'loading' | 'ready' | 'error';

export default function App() {
  const [data, setData] = useState<UniversityData | null>(null);
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<University | null>(null);

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}data/universities.json`)
      .then((response) => {
        if (!response.ok) throw new Error('検索データを読み込めませんでした。');
        return response.json();
      })
      .then((value: UniversityData) => {
        setData(value);
        setLoadState('ready');
      })
      .catch(() => setLoadState('error'));
  }, []);

  const candidates = useMemo(() => findUniversities(data?.universities ?? [], query), [data, query]);
  const normalizedQuery = normalizeReading(query);

  function handleQueryChange(value: string) {
    setQuery(value);
    setSelected(null);
  }

  return (
    <main className="app-shell">
      <header>
        <p className="eyebrow">UNIVERSITY CODE SEARCH</p>
        <h1>大学コード検索</h1>
        <p className="lead">大学名のよみがなを入力して、学部・学科コードを確認できます。</p>
      </header>

      <section className="search-panel" aria-labelledby="search-heading">
        <h2 id="search-heading">大学を探す</h2>
        <label htmlFor="university-reading">大学名のよみがな</label>
        <input
          id="university-reading"
          type="search"
          value={query}
          onChange={(event) => handleQueryChange(event.target.value)}
          placeholder="例：とうきょう"
          autoComplete="off"
        />
        <p className="hint">ひらがな1文字から検索できます。カタカナでも検索できます。</p>

        {loadState === 'loading' && <p role="status">検索データを読み込んでいます…</p>}
        {loadState === 'error' && <p className="message error" role="alert">検索データを読み込めませんでした。データ生成後に再読み込みしてください。</p>}
        {loadState === 'ready' && !normalizedQuery && <p className="message">よみがなを入力すると大学の候補を表示します。</p>}
        {loadState === 'ready' && normalizedQuery && candidates.length === 0 && <p className="message">該当する大学はありません。</p>}
        {loadState === 'ready' && candidates.length > 0 && (
          <div className="candidate-area" aria-live="polite">
            <p className="candidate-count">{candidates.length}件の候補</p>
            <ul className="candidate-list">
              {candidates.map((university) => (
                <li key={university.code}>
                  <button type="button" onClick={() => setSelected(university)}>
                    <span>{university.name}</span>
                    <small>{university.reading}</small>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <section className="result-panel" aria-live="polite">
        {!selected && <p className="message">大学を選択すると、コード表を表示します。</p>}
        {selected && (
          <>
            <div className="result-heading">
              <div>
                <p className="eyebrow">SELECTED UNIVERSITY</p>
                <h2>{selected.name}</h2>
              </div>
              <span className="university-code">大学コード {selected.code}</span>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>コード</th><th>学部</th><th>学科</th></tr>
                </thead>
                <tbody>
                  {selected.records.map((record) => (
                    <tr key={record.code}>
                      <td className="code">{record.code}</td>
                      <td>{record.faculty || '—'}</td>
                      <td>{record.department || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>
    </main>
  );
}
