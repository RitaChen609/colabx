import { useEffect, useState } from 'react';
import { createRows, statusPriority } from './status.js';

const pageSize = 6;

function formatDate(value) {
  if (!value) return 'Not available';
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'UTC'
  }).format(new Date(value));
}

function StatusBadge({ status }) {
  return <span className={`status status-${status.toLowerCase().replace(' ', '-')}`}>{status}</span>;
}

function App() {
  const [payload, setPayload] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState({ key: 'status', direction: 'asc' });
  const [page, setPage] = useState(1);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/pipeline-status');
      if (!response.ok) throw new Error(`Request failed with ${response.status}`);
      setPayload(await response.json());
      setPage(1);
    } catch (requestError) {
      setError('Pipeline status data could not be loaded. Confirm that the API is running.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const rows = payload ? createRows(payload) : [];
  const sortedRows = [...rows].sort((first, second) => {
    const firstValue = sort.key === 'status' ? statusPriority[first.status] : first[sort.key] ?? '';
    const secondValue = sort.key === 'status' ? statusPriority[second.status] : second[sort.key] ?? '';
    const comparison = String(firstValue).localeCompare(String(secondValue), undefined, { numeric: true });
    return sort.direction === 'asc' ? comparison : -comparison;
  });
  const pageCount = Math.max(1, Math.ceil(sortedRows.length / pageSize));
  const visibleRows = sortedRows.slice((page - 1) * pageSize, page * pageSize);

  function changeSort(key) {
    setSort((current) => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }));
    setPage(1);
  }

  const summary = rows.reduce((counts, row) => ({ ...counts, [row.status]: (counts[row.status] || 0) + 1 }), {});

  return (
    <main>
      <header className="app-header">
        <div>
          <p className="eyebrow">Performance Engineering</p>
          <h1>Pipeline Pulse</h1>
          <p className="subtitle">Latest expected pipeline coverage across Nightly and Release builds.</p>
        </div>
        <button className="refresh" type="button" onClick={loadData} disabled={loading} aria-label="Refresh pipeline status">
          <span aria-hidden="true">↻</span> Refresh
        </button>
      </header>

      {payload && <section className="summary" aria-label="Pipeline status summary">
        {['Healthy', 'Failed', 'Stale', 'Missing', 'In Progress', 'Unknown'].map((status) => (
          <div className="summary-item" key={status}>
            <StatusBadge status={status} />
            <strong>{summary[status] || 0}</strong>
          </div>
        ))}
      </section>}

      <section className="panel" aria-live="polite">
        <div className="table-heading">
          <div>
            <h2>Expected pipeline coverage</h2>
            <p>{payload ? `Data refreshed ${formatDate(payload.refreshedAt)} UTC` : 'Loading latest status...'}</p>
          </div>
          {payload && <span className="threshold">Stale after {payload.staleAfterHours} hours</span>}
        </div>

        {error && <div className="error">{error}</div>}
        {loading && !payload && <div className="loading">Loading pipeline status...</div>}
        {payload && <div className="table-wrap">
          <table>
            <thead>
              <tr>
                {[
                  ['status', 'Status'], ['category', 'Category'], ['buildType', 'Build'], ['platform', 'Platform'],
                  ['architecture', 'Architecture'], ['version', 'Version'], ['jobName', 'Pipeline'], ['lastRun', 'Last run'], ['lastSuccessfulRun', 'Last success']
                ].map(([key, label]) => (
                  <th key={key} aria-sort={sort.key === key ? `${sort.direction}ending` : 'none'}>
                    <button type="button" onClick={() => changeSort(key)}>{label}{sort.key === key ? (sort.direction === 'asc' ? ' ↑' : ' ↓') : ''}</button>
                  </th>
                ))}
                <th>Investigation</th>
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((row) => (
                <tr key={row.id}>
                  <td><StatusBadge status={row.status} /></td>
                  <td>{row.category}</td>
                  <td>{row.buildType}</td>
                  <td>{row.platform}</td>
                  <td>{row.architecture}</td>
                  <td>{row.version}</td>
                  <td><code>{row.jobName}</code></td>
                  <td>{formatDate(row.lastRun)}</td>
                  <td>{formatDate(row.lastSuccessfulRun)}</td>
                  <td className="investigation">
                    <span>{row.details}</span>
                    {row.jobUrl && <a href={row.jobUrl} target="_blank" rel="noreferrer">Open job</a>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>}

        {payload && <footer className="pagination">
          <span>{rows.length} expected pipelines</span>
          <div>
            <button type="button" onClick={() => setPage(page - 1)} disabled={page === 1}>Previous</button>
            <span>Page {page} of {pageCount}</span>
            <button type="button" onClick={() => setPage(page + 1)} disabled={page === pageCount}>Next</button>
          </div>
        </footer>}
      </section>
    </main>
  );
}

export default App;