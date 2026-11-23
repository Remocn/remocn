/**
 * Undo/redo for the docs customizer, as plain data so the hook stays thin.
 * Each entry holds the values from before a change. A slider drag or a typed
 * word sends many changes to one control; they merge into one entry while
 * they keep coming within `MERGE_MS` of each other.
 */

export type Values = Record<string, unknown>;

type Entry = { before: Values; key: string | null; at: number };

export type UndoHistory = { past: Entry[]; future: Values[] };

export const EMPTY_HISTORY: UndoHistory = { past: [], future: [] };

const MERGE_MS = 1000;
const LIMIT = 100;

/** `key` is the control that changed, or null for a change to many at once. */
export function record(
  history: UndoHistory,
  before: Values,
  key: string | null,
  at: number,
): UndoHistory {
  const last = history.past.at(-1);
  if (last && key !== null && last.key === key && at - last.at < MERGE_MS) {
    return {
      past: [...history.past.slice(0, -1), { ...last, at }],
      future: [],
    };
  }
  return {
    past: [...history.past, { before, key, at }].slice(-LIMIT),
    future: [],
  };
}

export function undo(
  history: UndoHistory,
  current: Values,
): { history: UndoHistory; values: Values } | null {
  const last = history.past.at(-1);
  if (!last) return null;
  return {
    history: {
      past: history.past.slice(0, -1),
      future: [...history.future, current],
    },
    values: last.before,
  };
}

export function redo(
  history: UndoHistory,
  current: Values,
): { history: UndoHistory; values: Values } | null {
  const next = history.future.at(-1);
  if (next === undefined) return null;
  return {
    history: {
      past: [...history.past, { before: current, key: null, at: 0 }],
      future: history.future.slice(0, -1),
    },
    values: next,
  };
}
