import { describe, expect, it } from "bun:test";

import { ITEMS as PREVIEW_ITEMS } from "@/components/docs/examples/check-list-example";
import { checkListConfig } from "../config";
import {
  type CheckListBeat,
  checkListDuration,
  checkListEnterEnd,
  checkListGeometry,
  checkListRowWidth,
  checkListSchedule,
  checkListStrikeWidth,
  normalizeCheckListItems,
} from "../index";

const tickWindow = (beat: CheckListBeat) => {
  if (beat.tickFrom === undefined || beat.tickTo === undefined) {
    throw new Error(`expected a tick window at frame ${beat.boxFrom}`);
  }
  return { from: beat.tickFrom, to: beat.tickTo };
};

const numberControl = (name: string) => {
  const control = checkListConfig.controls[name];
  if (control.type !== "number") {
    throw new Error(`${name} is not a number control`);
  }
  return control;
};

const PREVIEW_WORST_CASE = {
  itemGap: numberControl("itemGap").max,
  perStep: numberControl("perStep").min,
  step: numberControl("step").max,
};

describe("normalizeCheckListItems", () => {
  it("treats a bare string as a checked item", () => {
    expect(normalizeCheckListItems(["Ship faster"])).toEqual([
      { text: "Ship faster", checked: true },
    ]);
  });

  it("defaults an object without checked to true", () => {
    expect(normalizeCheckListItems([{ text: "Ship faster" }])).toEqual([
      { text: "Ship faster", checked: true },
    ]);
  });

  it("preserves checked: false", () => {
    expect(
      normalizeCheckListItems([{ text: "Ships as source", checked: false }]),
    ).toEqual([{ text: "Ships as source", checked: false }]);
  });

  it("mixes both spellings in one list", () => {
    expect(
      normalizeCheckListItems(["a", { text: "b", checked: false }, "c"]),
    ).toEqual([
      { text: "a", checked: true },
      { text: "b", checked: false },
      { text: "c", checked: true },
    ]);
  });
});

describe("checkListSchedule", () => {
  it("starts items itemGap apart", () => {
    const beats = checkListSchedule(["a", "b", "c"], { itemGap: 18 });
    expect(beats.map((b) => b.boxFrom)).toEqual([0, 18, 36]);
  });

  it("offsets every start by delay", () => {
    const beats = checkListSchedule(["a", "b"], { delay: 30, itemGap: 18 });
    expect(beats.map((b) => b.boxFrom)).toEqual([30, 48]);
  });

  it("defaults itemGap to step * 6", () => {
    expect(
      checkListSchedule(["a", "b"], { step: 5 }).map((b) => b.boxFrom),
    ).toEqual([0, 30]);
  });

  it("orders every window box < label < tick < strike", () => {
    const beats = checkListSchedule(
      ["Render on your own machine", "No watermark, ever", "MIT"],
      { itemGap: 12 },
    );
    for (const beat of beats) {
      const tick = tickWindow(beat);
      expect(beat.boxFrom).toBeLessThan(beat.labelAt);
      expect(beat.labelAt).toBeLessThan(beat.labelEnd);
      expect(beat.labelEnd).toBeLessThanOrEqual(tick.from);
      expect(tick.from).toBeLessThan(tick.to);
      expect(tick.to).toBe(beat.strikeFrom);
      expect(beat.strikeFrom).toBeLessThan(beat.strikeTo as number);
    }
  });

  it("starts no tick until the whole list has finished writing", () => {
    const items = [
      "Render on your own machine",
      "No watermark, ever",
      "Every component MIT",
    ];
    const beats = checkListSchedule(items, { itemGap: 12 });
    const enterEnd = checkListEnterEnd(items, { itemGap: 12 });
    expect(enterEnd).toBe(Math.max(...beats.map((b) => b.labelEnd)));
    for (const beat of beats) {
      expect(tickWindow(beat).from).toBeGreaterThanOrEqual(enterEnd);
    }
  });

  it("closes items in list order, closeGap apart, skipping unchecked ones", () => {
    const beats = checkListSchedule(
      ["a", { text: "b", checked: false }, "c", "d"],
      { closeGap: 10 },
    );
    const enterEnd = checkListEnterEnd([
      "a",
      { text: "b", checked: false },
      "c",
      "d",
    ]);
    expect(beats[1].tickFrom).toBeUndefined();
    expect(beats[0].tickFrom).toBe(enterEnd);
    expect(beats[2].tickFrom).toBe(enterEnd + 10);
    expect(beats[3].tickFrom).toBe(enterEnd + 20);
  });

  it("closes the box before the first character is written", () => {
    const [beat] = checkListSchedule(["Ship faster"], { step: 4 });
    expect(beat.boxTo).toBe(8);
    expect(beat.labelAt).toBe(beat.boxTo);
  });

  it("lets one long label delay the close phase for every item", () => {
    const short = checkListSchedule(["Ship", "Ship"], { itemGap: 18 });
    const long = checkListSchedule(
      ["Zero configuration required for teams", "Ship"],
      { itemGap: 18 },
    );
    expect(long[1].boxFrom).toBe(short[1].boxFrom);
    expect(long[1].labelEnd).toBe(short[1].labelEnd);
    expect(tickWindow(long[1]).from).toBeGreaterThan(tickWindow(short[1]).from);
  });

  it("gives an unchecked item no tick and no strike", () => {
    const [checked, unchecked] = checkListSchedule([
      "Ship faster",
      { text: "Ships as source", checked: false },
    ]);
    expect(checked.tickFrom).toBeNumber();
    expect(checked.strikeTo).toBeNumber();
    expect(unchecked.tickFrom).toBeUndefined();
    expect(unchecked.tickTo).toBeUndefined();
    expect(unchecked.strikeFrom).toBeUndefined();
    expect(unchecked.strikeTo).toBeUndefined();
    expect(unchecked.labelEnd).toBeGreaterThan(unchecked.labelAt);
  });

  it("matches the plan's two-item counterexample exactly", () => {
    const items = ["Zero configuration required for teams", "Ship faster"];
    expect(checkListEnterEnd(items)).toBe(81);
    const beats = checkListSchedule(items);
    expect(beats[0]).toEqual({
      boxFrom: 0,
      boxTo: 6,
      labelAt: 6,
      labelEnd: 81,
      tickFrom: 81,
      tickTo: 87,
      strikeFrom: 87,
      strikeTo: 93,
    });
    expect(beats[1]).toEqual({
      boxFrom: 18,
      boxTo: 24,
      labelAt: 24,
      labelEnd: 48,
      tickFrom: 90,
      tickTo: 96,
      strikeFrom: 96,
      strikeTo: 102,
    });
  });
});

describe("checkListStrikeWidth", () => {
  it("grows with the glyph count", () => {
    expect(checkListStrikeWidth("ab", 40, 800)).toBeLessThan(
      checkListStrikeWidth("abcd", 40, 800),
    );
  });

  it("never overruns the label cell", () => {
    expect(checkListStrikeWidth("x".repeat(200), 40, 300)).toBe(300);
  });

  it("counts unicode glyphs, not UTF-16 code units", () => {
    expect("👋".length).toBe(2);
    expect(checkListStrikeWidth("👋", 40, 800)).toBe(
      checkListStrikeWidth("a", 40, 800),
    );
  });
});

describe("checkListGeometry", () => {
  it("derives the box and row from fontSize", () => {
    expect(checkListGeometry(820, 40)).toEqual({
      boxSize: 25,
      boxGap: 16,
      rowHeight: 46,
      labelWidth: 779,
    });
  });

  it("tracks boxSize to fontSize, not width", () => {
    expect(checkListGeometry(200, 40).boxSize).toBe(
      checkListGeometry(2000, 40).boxSize,
    );
    expect(checkListGeometry(820, 64).boxSize).toBeGreaterThan(
      checkListGeometry(820, 24).boxSize,
    );
  });

  it("engages the clamp at the extreme corner", () => {
    const clamped = checkListGeometry(100, 64);
    expect(100 - clamped.boxSize - clamped.boxGap).toBeLessThan(64 * 2);
    expect(clamped.labelWidth).toBe(128);
  });

  it("leaves the clamp idle at a comfortable width", () => {
    expect(checkListGeometry(820, 64).labelWidth).toBe(820 - 40 - 26);
  });

  it("widens the row the layout renders when the clamp fires", () => {
    expect(checkListRowWidth(100, 64)).toBeGreaterThan(100);
    expect(checkListRowWidth(100, 64)).toBe(40 + 26 + 128);
    expect(checkListRowWidth(60, 64)).toBeGreaterThan(60);
  });

  it("renders a row exactly as wide as width whenever the clamp is idle", () => {
    for (const width of [420, 620, 820, 1200]) {
      for (const fontSize of [24, 32, 40, 48, 56, 64]) {
        const { labelWidth } = checkListGeometry(width, fontSize);
        expect(labelWidth).toBeGreaterThan(fontSize * 2);
        expect(checkListRowWidth(width, fontSize)).toBe(width);
      }
    }
  });
});

describe("checkListDuration", () => {
  it("ends on the last strike, not the last item's label", () => {
    const items = ["Zero configuration required for teams", "Ship faster"];
    expect(checkListDuration(items)).toBe(102);
  });

  it("lets an unchecked item decide when the writing phase ends", () => {
    expect(PREVIEW_WORST_CASE).toEqual({ itemGap: 48, perStep: 0.8, step: 6 });
    const beats = checkListSchedule(PREVIEW_ITEMS, PREVIEW_WORST_CASE);
    expect(checkListEnterEnd(PREVIEW_ITEMS, PREVIEW_WORST_CASE)).toBe(276);
    expect(beats[3].tickTo).toBeUndefined();
    expect(beats[3].labelEnd).toBe(276);
    expect(beats.map((b) => b.labelEnd)).toEqual([216, 204, 258, 276]);
    expect(checkListDuration(PREVIEW_ITEMS, PREVIEW_WORST_CASE)).toBe(336);
  });

  it("falls back to the writing phase when nothing is checked", () => {
    const items = [
      { text: "Ships as source", checked: false },
      { text: "Landing next", checked: false },
    ];
    expect(checkListDuration(items)).toBe(checkListEnterEnd(items));
  });

  it("fits the preview duration anywhere in the control matrix", () => {
    const values = (name: string) => {
      const { min, max, step } = numberControl(name);
      return Array.from(
        { length: Math.floor((max - min) / step + 1e-9) + 1 },
        (_, i) => min + i * step,
      );
    };
    const paces = values("perStep");
    expect(paces.at(0)).toBeCloseTo(0.8);
    expect(paces.at(-1)).toBeCloseTo(3);
    for (const itemGap of values("itemGap")) {
      for (const perStep of paces) {
        for (const step of values("step")) {
          for (const closeGap of values("closeGap")) {
            expect(
              checkListDuration(PREVIEW_ITEMS, {
                itemGap,
                closeGap,
                perStep,
                step,
              }),
            ).toBeLessThanOrEqual(checkListConfig.durationInFrames);
          }
        }
      }
    }
  });

  it("runs 123 frames at the defaults, the length the skill reference quotes", () => {
    expect(checkListDuration(PREVIEW_ITEMS)).toBe(123);
    expect(checkListEnterEnd(PREVIEW_ITEMS)).toBe(93);
  });

  it("grows with closeGap", () => {
    expect(checkListDuration(PREVIEW_ITEMS, { closeGap: 18 })).toBeGreaterThan(
      checkListDuration(PREVIEW_ITEMS, { closeGap: 9 }),
    );
  });

  it("includes delay as an absolute frame", () => {
    expect(checkListDuration(["Ship faster"], { delay: 30 })).toBe(
      checkListDuration(["Ship faster"]) + 30,
    );
  });

  it("grows with itemGap", () => {
    const items = ["Ship faster", "No watermark, ever", "Every component MIT"];
    expect(checkListDuration(items, { itemGap: 36 })).toBeGreaterThan(
      checkListDuration(items, { itemGap: 18 }),
    );
    expect(checkListDuration(items, { itemGap: 48 })).toBeGreaterThan(
      checkListDuration(items, { itemGap: 36 }),
    );
  });

  it("returns 0 for an empty list", () => {
    expect(checkListDuration([])).toBe(0);
  });
});
