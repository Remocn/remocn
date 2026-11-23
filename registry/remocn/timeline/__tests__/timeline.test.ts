import { describe, expect, it } from "bun:test";
import { resolve, type TimelineElement } from "../index";

type Id = `line:${number}` | "finale";

// Three lines back to back with a 4-frame gap before the finale.
const chain: TimelineElement<Id>[] = [
  {
    id: "line:0",
    lane: "Lines",
    label: "a",
    start: 0,
    length: 10,
    beats: { roll: 6 },
  },
  {
    id: "line:1",
    lane: "Lines",
    label: "b",
    start: 10,
    length: 10,
    follows: "line:0",
    beats: { roll: 6 },
  },
  {
    id: "line:2",
    lane: "Lines",
    label: "c",
    start: 20,
    length: 10,
    follows: "line:1",
    beats: { roll: 6 },
  },
  {
    id: "finale",
    lane: "Finale",
    label: "d",
    start: 34,
    length: 20,
    follows: "line:2",
  },
];

const starts = (timing: Parameters<typeof resolve<Id>>[1]) =>
  resolve(chain, timing).elements.map((e) => [e.id, e.start, e.length]);

describe("resolve", () => {
  it("returns the schedule as is without timing", () => {
    const tl = resolve(chain);
    expect(tl.elements.map((e) => [e.start, e.length, e.end])).toEqual([
      [0, 10, 10],
      [10, 10, 20],
      [20, 10, 30],
      [34, 20, 54],
    ]);
    expect(tl.get("line:1").beat("roll")).toBe(6);
    expect(tl.lane("Lines").map((e) => e.label)).toEqual(["a", "b", "c"]);
  });

  it("moves the rest of a chain with a moved element, keeping the gaps", () => {
    expect(starts({ "line:1": { start: 15 } })).toEqual([
      ["line:0", 0, 10],
      ["line:1", 15, 10],
      ["line:2", 25, 10],
      ["finale", 39, 20],
    ]);
  });

  it("carries a change of length down the chain", () => {
    expect(starts({ "line:0": { length: 4 } })).toEqual([
      ["line:0", 0, 4],
      ["line:1", 4, 10],
      ["line:2", 14, 10],
      ["finale", 28, 20],
    ]);
  });

  it("keeps a detached element where it was", () => {
    expect(
      starts({ "line:0": { start: 5 }, "line:2": { detach: true } }),
    ).toEqual([
      ["line:0", 5, 10],
      ["line:1", 15, 10],
      ["line:2", 20, 10],
      ["finale", 34, 20],
    ]);
  });

  it("lets a detached element move on its own and leads its followers", () => {
    expect(starts({ "line:2": { detach: true, start: 40 } })).toEqual([
      ["line:0", 0, 10],
      ["line:1", 10, 10],
      ["line:2", 40, 10],
      ["finale", 54, 20],
    ]);
  });

  it("stretches the length and every beat", () => {
    const tl = resolve(chain, { "line:0": { stretch: 2 } });
    const line = tl.get("line:0");
    expect([line.length, line.beat("roll")]).toEqual([20, 12]);
    expect(tl.get("line:1").start).toBe(20);
    expect(tl.get("line:1").beat("roll")).toBe(6);
  });

  it("lets explicit start and length win over the chain and the stretch", () => {
    const tl = resolve(chain, {
      "line:0": { stretch: 3 },
      "line:1": { start: 12, length: 5, stretch: 2 },
    });
    const line = tl.get("line:1");
    expect([line.start, line.length, line.beat("roll")]).toEqual([12, 5, 12]);
    expect(tl.get("line:2").start).toBe(17);
  });

  it("measures progress over the element or over a beat", () => {
    const line = resolve(chain).get("line:1");
    expect(line.progress(5)).toBe(0);
    expect(line.progress(15)).toBe(0.5);
    expect(line.progress(40)).toBe(1);
    expect(line.progress(13, "roll")).toBe(0.5);
  });

  it("throws on an unknown beat or id", () => {
    const tl = resolve(chain);
    expect(() => tl.get("line:1").beat("nope")).toThrow();
    expect(() => tl.get("line:9")).toThrow();
  });

  it("throws on a cycle instead of looping", () => {
    const loop: TimelineElement<"a" | "b">[] = [
      { id: "a", lane: "x", label: "a", start: 0, length: 1, follows: "b" },
      { id: "b", lane: "x", label: "b", start: 1, length: 1, follows: "a" },
    ];
    expect(() => resolve(loop)).toThrow();
  });
});
