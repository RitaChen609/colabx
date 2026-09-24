const statusPriority = {
  Failed: 0,
  Stale: 1,
  Missing: 2,
  'In Progress': 3,
  Unknown: 4,
  Healthy: 5
};

export function createRows(payload) {
  return payload.rows || [];
}

export { statusPriority };