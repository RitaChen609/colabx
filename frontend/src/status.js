const statusPriority = {
  Failed: 0,
  Stale: 1,
  Missing: 2,
  'In Progress': 3,
  Unknown: 4,
  Healthy: 5
};

function matchingRun(expected, runs) {
  const expectedParameters = JSON.stringify(expected.parameters);
  return runs.find((run) => (
    run.jobName === expected.jobName
    && JSON.stringify(run.parameters) === expectedParameters
  ));
}

function getStatus(run, staleAfterHours, now) {
  if (!run) return 'Missing';
  if (run.state === 'failed') return 'Failed';
  if (run.state === 'unknown') return 'Unknown';

  const lastRun = run.lastRun ? new Date(run.lastRun) : null;
  const hoursSinceRun = lastRun ? (now - lastRun) / 3_600_000 : Infinity;

  if (run.state === 'in_progress') {
    return hoursSinceRun > staleAfterHours ? 'Stale' : 'In Progress';
  }

  return hoursSinceRun > staleAfterHours ? 'Stale' : 'Healthy';
}

export function createRows(payload) {
  const now = new Date(payload.refreshedAt);
  return payload.categories.flatMap((category) => (
    category.expectedPipelines.map((expected) => {
      const run = matchingRun(expected, category.observedRuns);
      return {
        id: `${category.name}-${expected.jobName}-${JSON.stringify(expected.parameters)}`,
        category: category.name,
        ...expected,
        run,
        status: getStatus(run, payload.staleAfterHours, now),
        details: run?.details ?? 'No matching run was returned for this expected pipeline.',
        lastRun: run?.lastRun ?? null,
        lastSuccessfulRun: run?.lastSuccessfulRun ?? null,
        jobUrl: run?.jobUrl ?? null
      };
    })
  ));
}

export { statusPriority };