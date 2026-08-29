export interface ModelNotificationEntry {
  id: string;
  name: string;
}

export interface ModelSnapshot {
  trending: ModelNotificationEntry[];
  recent: ModelNotificationEntry[];
}

export function diffModelSnapshots(
  previous: ModelSnapshot | null,
  current: ModelSnapshot,
): ModelNotificationEntry[] {
  if (!previous) return [];

  const seen = new Set([...previous.trending, ...previous.recent].map((model) => model.id));
  const changed = new Map<string, ModelNotificationEntry>();
  for (const model of [...current.trending, ...current.recent]) {
    if (!seen.has(model.id)) changed.set(model.id, model);
  }
  return [...changed.values()].slice(0, 3);
}
