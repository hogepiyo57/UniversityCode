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
      <header className="app-header">
        <div>
          <p className="eyebrow">UNIVERSITY CODE SEARCH</p>
          <div className="title-row">
            <h1>大学コード検索</h1>
            <p className="source-note">ベネッセ総合学力テスト（2025年高２生・１月）のコード番号表を参照</p>
          </div>
          <p className="lead">大学名のよみがなまたは漢字を入力して、学部・学科コードを確認できます。</p>
        </div>
      </header>

      <div className="search-workspace">
        <section className="search-panel" aria-labelledby="search-heading">
          <div className="section-heading">
            <span className="step-number">01</span>
            <div>
              <p className="eyebrow">SEARCH</p>
              <h2 id="search-heading">大学名を検索</h2>
            </div>
          </div>
          <label htmlFor="university-search">大学名のよみがな・漢字</label>
          <input
            id="university-search"
            type="search"
            value={query}
            onChange={(event) => handleQueryChange(event.target.value)}
            placeholder="例：とうきょう / 東京"
            autoComplete="off"
          />
          <div className="search-tip">
            <p>検索できる入力</p>
            <ul>
              <li>ひらがな・カタカナ・漢字を1文字から検索</li>
              <li>入力前後の空白は自動で除去</li>
            </ul>
          </div>
        </section>

        <section className="candidate-panel" aria-labelledby="candidate-heading">
          <div className="section-heading candidate-heading">
            <span className="step-number">02</span>
            <div>
              <p className="eyebrow">CANDIDATES</p>
              <h2 id="candidate-heading">検索された大学一覧</h2>
            </div>
            {loadState === 'ready' && normalizedQuery && <span className="candidate-count">{candidates.length}件</span>}
          </div>
          <div className="candidate-frame" aria-live="polite">
            {loadState === 'loading' && <p className="candidate-message" role="status">検索データを読み込んでいます…</p>}
            {loadState === 'error' && <p className="candidate-message error" role="alert">検索データを読み込めませんでした。データ生成後に再読み込みしてください。</p>}
            {loadState === 'ready' && !normalizedQuery && <p className="candidate-message">よみがなまたは漢字を入力すると、大学の候補を表示します。</p>}
            {loadState === 'ready' && normalizedQuery && candidates.length === 0 && <p className="candidate-message">該当する大学はありません。</p>}
            {loadState === 'ready' && candidates.length > 0 && (
              <ul className="candidate-list">
                {candidates.map((university) => (
                  <li key={university.code}>
                    <button
                      className={selected?.code === university.code ? 'is-selected' : undefined}
                      type="button"
                      onClick={() => setSelected(university)}
                      aria-pressed={selected?.code === university.code}
                    >
                      <span>{university.name}</span>
                      <small>{university.reading}</small>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>

      <section className="result-panel" aria-labelledby="result-heading" aria-live="polite">
        <div className="section-heading result-section-heading">
          <span className="step-number">03</span>
          <div>
            <p className="eyebrow">UNIVERSITY CODES</p>
            <h2 id="result-heading">大学コード一覧</h2>
          </div>
        </div>
        {!selected && (
          <div className="empty-result">
            <p>大学を選択すると、コード・学部・学科をこのエリアに表示します。</p>
          </div>
        )}
        {selected && (
          <>
            <div className="result-heading">
              <div>
                <h2>{selected.name}</h2>
                <p className="selected-caption">学部・学科コード一覧</p>
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
