export interface DecisionRecord {
  id: string;
  decision: string;
  reason: string;
  date: string; // ISO date
}

export type HistoryKind = "bug" | "incident" | "bottleneck";

export interface HistoryRecord {
  id: string;
  type: HistoryKind;
  summary: string;
  date: string;
}

export interface ContextRecord {
  architecture?: string;
  constraints?: string[];
  businessGoals?: string[];
  techStack?: string[];
}

export interface MemoryState {
  decisions: DecisionRecord[];
  context: ContextRecord;
  history: HistoryRecord[];
}

export interface MemoryStore {
  load(): Promise<MemoryState>;
  save(state: MemoryState): Promise<void>;
}

export function emptyState(): MemoryState {
  return { decisions: [], context: {}, history: [] };
}
