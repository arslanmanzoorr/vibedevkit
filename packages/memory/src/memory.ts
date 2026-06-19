// NOTE: operations follow load -> modify -> save against the injected store.
// The jsonFileStore has no locking, so truly concurrent tool calls are last-write-wins.
// MCP clients serialize tool calls, so this is acceptable for the current single-writer usage.
import type { ContextRecord, DecisionRecord, HistoryKind, HistoryRecord, MemoryStore } from "./types.js";

const KINDS: HistoryKind[] = ["bug", "incident", "bottleneck"];

export async function recordDecision(
  store: MemoryStore,
  input: { decision: string; reason: string; date: string },
): Promise<DecisionRecord> {
  const state = await store.load();
  const record: DecisionRecord = { id: `d${state.decisions.length + 1}`, ...input };
  state.decisions.push(record);
  await store.save(state);
  return record;
}

export async function queryDecisions(store: MemoryStore, query?: string): Promise<DecisionRecord[]> {
  const { decisions } = await store.load();
  if (!query) return decisions;
  const q = query.toLowerCase();
  return decisions.filter((d) => d.decision.toLowerCase().includes(q) || d.reason.toLowerCase().includes(q));
}

export async function setContext(store: MemoryStore, partial: ContextRecord): Promise<ContextRecord> {
  const state = await store.load();
  state.context = { ...state.context, ...partial };
  await store.save(state);
  return state.context;
}

export async function getContext(store: MemoryStore): Promise<ContextRecord> {
  return (await store.load()).context;
}

export async function recordHistory(
  store: MemoryStore,
  input: { type: HistoryKind; summary: string; date: string },
): Promise<HistoryRecord> {
  const state = await store.load();
  const record: HistoryRecord = { id: `h${state.history.length + 1}`, ...input };
  state.history.push(record);
  await store.save(state);
  return record;
}

export async function searchHistory(store: MemoryStore, query: string): Promise<HistoryRecord[]> {
  const { history } = await store.load();
  const q = query.toLowerCase();
  const isKind = (KINDS as string[]).includes(q);
  return history.filter((h) => h.summary.toLowerCase().includes(q) || (isKind && h.type === q));
}
