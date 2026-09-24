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
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [versionFilter, setVersionFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

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
  const categoryOptions = [...new Set(rows.map((row) => row.category))].sort((a, b) => a.localeCompare(b));
  const versionOptions = [...new Set(rows.map((row) => row.version))].sort((a, b) => String(a).localeCompare(String(b), undefined, { numeric: true }));
  const scopedRows = rows.filter((row) => (
    (categoryFilter === 'all' || row.category === categoryFilter)
    && (versionFilter === 'all' || row.version === versionFilter)
  ));
  const filteredRows = scopedRows.filter((row) => statusFilter === 'all' || row.status === statusFilter);
  const sortedRows = [...filteredRows].sort((first, second) => {
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

  const summary = scopedRows.reduce((counts, row) => ({ ...counts, [row.status]: (counts[row.status] || 0) + 1 }), {});

  function changeCategoryFilter(value) {
    setCategoryFilter(value);
    setPage(1);
  }

  function changeVersionFilter(value) {
    setVersionFilter(value);
    setPage(1);
  }

  function toggleStatusFilter(status) {
    setStatusFilter((current) => (current === status ? 'all' : status));
    setPage(1);
  }

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
          <button
            type="button"
            className={`summary-item${statusFilter === status ? ' summary-item-active' : ''}`}
            key={status}
            onClick={() => toggleStatusFilter(status)}
            aria-pressed={statusFilter === status}
            title={`Show ${status} pipelines`}
          >
            <StatusBadge status={status} />
            <strong>{summary[status] || 0}</strong>
          </button>
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

        {payload && <div className="filters">
          <label className="filter">
            <span>Category</span>
            <select value={categoryFilter} onChange={(event) => changeCategoryFilter(event.target.value)}>
              <option value="all">All categories</option>
              {categoryOptions.map((category) => <option key={category} value={category}>{category}</option>)}
            </select>
          </label>
          <label className="filter">
            <span>Release version</span>
            <select value={versionFilter} onChange={(event) => changeVersionFilter(event.target.value)}>
              <option value="all">All versions</option>
              {versionOptions.map((version) => <option key={version} value={version}>{version}</option>)}
            </select>
          </label>
          {(categoryFilter !== 'all' || versionFilter !== 'all' || statusFilter !== 'all') && (
            <div className="filter-status">
              {statusFilter !== 'all' && <span className="filter-chip">Status: <strong>{statusFilter}</strong></span>}
              <button type="button" className="clear-filters" onClick={() => { changeCategoryFilter('all'); changeVersionFilter('all'); toggleStatusFilter('all'); }}>Clear filters</button>
            </div>
          )}
        </div>}

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
          <span>{filteredRows.length} expected pipelines</span>
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