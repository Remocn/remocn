import { describe, expect, it } from "bun:test";
import {
  EMPTY_HISTORY,
  record,
  redo,
  type UndoHistory,
  undo,
  type Values,
} from "./undo-history";

function step(result: { history: UndoHistory; values: Values } | null): {
  history: UndoHistory;
  values: Values;
} {
  if (!result) throw new Error("nothing to step to");
  return result;
}

describe("undo history", () => {
  it("undoes and redoes one change at a time", () => {
    let h = record(EMPTY_HISTORY, { speed: 1, loop: false }, "speed", 0);
    h = record(h, { speed: 2, loop: false }, "loop", 5000);
    const first = step(undo(h, { speed: 2, loop: true }));
    expect(first.values).toEqual({ speed: 2, loop: false });
    const second = step(undo(first.history, first.values));
    expect(second.values).toEqual({ speed: 1, loop: false });
    expect(undo(second.history, second.values)).toBeNull();
    const again = step(redo(second.history, second.values));
    expect(again.values).toEqual({ speed: 2, loop: false });
    expect(redo(again.history, again.values)?.values).toEqual({
      speed: 2,
      loop: true,
    });
  });

  it("merges a burst of changes to one control", () => {
    let h = record(EMPTY_HISTORY, { speed: 1 }, "speed", 0);
    h = record(h, { speed: 1.1 }, "speed", 400);
    h = record(h, { speed: 1.2 }, "speed", 800);
    expect(h.past).toHaveLength(1);
    expect(undo(h, { speed: 1.3 })?.values).toEqual({ speed: 1 });
  });

  it("starts a new entry after a pause or on another control", () => {
    let h = record(EMPTY_HISTORY, { a: 1, b: 1 }, "a", 0);
    h = record(h, { a: 2, b: 1 }, "a", 1500);
    h = record(h, { a: 3, b: 1 }, "b", 1600);
    expect(h.past).toHaveLength(3);
  });

  it("never merges a change to many controls, like a reset", () => {
    let h = record(EMPTY_HISTORY, { a: 1 }, null, 0);
    h = record(h, { a: 1 }, null, 10);
    expect(h.past).toHaveLength(2);
  });

  it("drops the redo branch on a new change", () => {
    let h = record(EMPTY_HISTORY, { a: 1 }, "a", 0);
    h = step(undo(h, { a: 2 })).history;
    expect(h.future).toHaveLength(1);
    h = record(h, { a: 1 }, "a", 5000);
    expect(h.future).toHaveLength(0);
  });
});
