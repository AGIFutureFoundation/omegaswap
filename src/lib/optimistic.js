// Applies optimistic cache updates and returns snapshots for rollback.
// updates: [[queryKey, (old) => next], ...]
export async function applyOptimistic(qc, updates) {
  const snaps = [];
  for (const [key, fn] of updates) {
    await qc.cancelQueries({ queryKey: key });
    snaps.push(qc.getQueriesData({ queryKey: key }));
    qc.setQueriesData({ queryKey: key }, (old) => (old === undefined ? old : fn(old)));
  }
  return snaps;
}

export function rollback(qc, snaps = []) {
  snaps.flat().forEach(([key, data]) => qc.setQueryData(key, data));
}