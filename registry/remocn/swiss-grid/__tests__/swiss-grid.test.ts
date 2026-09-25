import { describe, expect, it } from "bun:test";
import {
  Children,
  type CSSProperties,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from "react";
import {
  breakSwissGridTitle,
  getSwissGridDuration,
  getSwissGridLayout,
  getSwissGridState,
  getSwissGridTimeline,
  renderSwissGrid,
  type SwissGridBand,
  type SwissGridLayout,
  type SwissGridOptions,
  type SwissGridState,
  swissGridDefaults,
  swissGridHold,
  swissGridLength,
  swissGridPaper,
} from "..";
import { swissGridConfig } from "../config";

interface Props {
  "data-part"?: string;
  style?: CSSProperties;
  children?: ReactNode;
}

interface Found {
  element: ReactElement<Props>;
  parent: ReactElement<Props> | null;
}

const SIZES = [
  { width: 1280, height: 720 },
  { width: 720, height: 720 },
  { width: 720, height: 1280 },
  { width: 1920, height: 1080 },
  { width: 2560, height: 1080 },
];
const TITLES = [
  swissGridDefaults.title,
  "Changelog",
  "Faster renders for every frame",
  "Chapter one\nThe grid",
];
const CASES: SwissGridOptions[] = SIZES.flatMap((size) =>
  TITLES.map((title) => ({ ...size, title })),
);

function walk(node: ReactNode, parent: ReactElement<Props> | null = null) {
  const out: Found[] = [];
  for (const child of Children.toArray(node)) {
    if (!isValidElement<Props>(child)) continue;
    out.push({ element: child, parent });
    out.push(...walk(child.props.children, child));
  }
  return out;
}

function textOf(node: ReactNode): string {
  return Children.toArray(node)
    .map((child) => {
      if (typeof child === "string" || typeof child === "number") {
        return String(child);
      }
      return isValidElement<Props>(child) ? textOf(child.props.children) : "";
    })
    .join("");
}

const partsOf = (found: Found[], part: string) =>
  found.filter(({ element }) => element.props["data-part"] === part);

function only(found: Found[], part: string) {
  const matches = partsOf(found, part);
  expect(matches.length).toBe(1);
  return matches[0];
}

const styleOf = (element: ReactElement<Props>) => element.props.style ?? {};

const everyAmount = (state: SwissGridState, value: number) =>
  Object.values(state.amounts).every((amount) => amount === value);

const toY = (layout: SwissGridLayout, row: number) =>
  Math.round(layout.offsetY + row * layout.unit);
const toX = (layout: SwissGridLayout, column: number) =>
  Math.round(layout.offsetX + column * layout.unit);

function bandsOf(layout: SwissGridLayout): SwissGridBand[] {
  return [
    ...layout.kicker,
    ...layout.headline.lines,
    ...(layout.numeral ? [layout.numeral] : []),
    ...layout.meta,
  ];
}

function series(
  options: SwissGridOptions,
  id: string,
  from: number,
  to: number,
) {
  const out: number[] = [];
  for (let frame = from; frame <= to; frame += 1) {
    out.push(getSwissGridState(frame, options).amounts[id]);
  }
  return out;
}

function withExit(options: SwissGridOptions, exitEnd: number) {
  return (frame: number) => getSwissGridState(frame, { ...options, exitEnd });
}

describe("swiss grid timeline", () => {
  it("lands every element in reading order, three to six frames apart", () => {
    for (const options of CASES) {
      const layout = getSwissGridLayout(options);
      const { cues, length } = getSwissGridTimeline(layout);
      const words = layout.headline.lines.flatMap((line) =>
        line.words.map((word) => word.id),
      );
      expect(cues.map((cue) => cue.id)).toEqual([
        "columns",
        "baselines",
        "spine",
        ...layout.kicker.map((line) => line.id),
        "heavy-rule",
        ...words,
        ...(layout.numeral ? ["numeral"] : []),
        "square",
        "thin-rule",
        ...layout.meta.map((item) => item.id),
      ]);
      expect(cues[0].enter.start).toBe(0);
      for (const cue of cues) {
        expect(cue.enter.start).toBeGreaterThanOrEqual(0);
        expect(cue.enter.end).toBeGreaterThan(cue.enter.start);
      }
      const lands = cues.map((cue) => cue.enter.end);
      const gaps = lands.slice(1).map((land, index) => land - lands[index]);
      expect(gaps.every((gap) => gap >= 3 && gap <= 6)).toBe(true);
      expect(length).toBe(lands[lands.length - 1]);
    }
  });

  it("matches the default timeline quoted in the docs", () => {
    const timeline = getSwissGridTimeline();
    const span = (id: string) => {
      const cue = timeline.cues.find((item) => item.id === id);
      if (!cue) throw new Error(`missing ${id}`);
      return [cue.enter.start, cue.enter.end];
    };
    expect(timeline.length).toBe(swissGridLength);
    expect(swissGridLength).toBe(63);
    expect(span("columns")).toEqual([0, 9]);
    expect(span("baselines")).toEqual([1, 13]);
    expect(span("spine")).toEqual([10, 17]);
    expect(span("kicker-0")).toEqual([15, 21]);
    expect(span("kicker-1")).toEqual([18, 24]);
    expect(span("heavy-rule")).toEqual([20, 28]);
    expect(span("word-0")).toEqual([25, 32]);
    expect(span("word-4")).toEqual([37, 44]);
    expect(span("numeral")).toEqual([40, 48]);
    expect(span("square")).toEqual([48, 52]);
    expect(span("thin-rule")).toEqual([48, 56]);
    expect(span("meta-start")).toEqual([54, 60]);
    expect(span("meta-end")).toEqual([57, 63]);
    expect(timeline.fade).toEqual({ start: 44, end: 56 });
    expect(timeline.exitLength).toBe(52);
  });

  it("draws the guides before anything lands and clears them before the hold", () => {
    for (const options of CASES) {
      const layout = getSwissGridLayout(options);
      const { cues, fade, length } = getSwissGridTimeline(layout);
      const guides = cues.filter((cue) => cue.group === "guides");
      const content = cues.filter((cue) => cue.group !== "guides");
      const drawn = Math.max(...guides.map((cue) => cue.enter.end));
      const landed = Math.min(...content.map((cue) => cue.enter.end));
      expect(drawn).toBeLessThan(landed);
      const words = cues.filter((cue) => cue.group === "headline");
      expect(fade.start).toBe(words[words.length - 1].enter.end);
      expect(fade.end).toBeGreaterThan(fade.start);
      expect(fade.end).toBeLessThanOrEqual(length);
      const before = getSwissGridState(fade.start - 1, options);
      expect(before.guideOpacity).toBe(0.2);
      expect(getSwissGridState(fade.end, options).guideOpacity).toBe(0);
      expect(getSwissGridState(length, options).guideOpacity).toBe(0);
    }
    expect(getSwissGridLayout().hairline).toBe(2);
    expect(getSwissGridLayout({ modules: 36 }).hairline).toBe(1);
  });

  it("opens on an empty frame and holds the finished card", () => {
    for (const options of CASES) {
      const { length } = getSwissGridTimeline(getSwissGridLayout(options));
      const first = getSwissGridState(0, options);
      expect(everyAmount(first, 0)).toBe(true);
      expect(first.spine.current.height).toBe(0);
      expect(first.square.current.height).toBe(0);
      for (const frame of [length, length + 40, 5000]) {
        const held = getSwissGridState(frame, options);
        expect(everyAmount(held, 1)).toBe(true);
        expect(held.spine.current).toEqual(held.spine.rect);
        expect(held.square.current).toEqual(held.square.rect);
      }
    }
  });

  it("sizes the preview from the content, the exit and the speed", () => {
    const base = swissGridLength + swissGridHold + 1;
    const preview = swissGridConfig.getDurationInFrames;
    expect(getSwissGridDuration()).toBe(100);
    expect(getSwissGridDuration()).toBe(base);
    expect(swissGridConfig.durationInFrames).toBe(base);
    expect(getSwissGridDuration({ exit: true })).toBe(base + 52);
    expect(preview?.({ exit: true })).toBe(152);
    expect(preview?.({ speed: 2 })).toBe(51);
    expect(getSwissGridDuration({ speed: 0.5 })).toBe(199);
    expect(getSwissGridDuration({ speed: 0 })).toBe(1);
    expect(getSwissGridDuration({ speed: -1 })).toBe(1);
    expect(getSwissGridDuration({ speed: Number.NaN })).toBe(base);
    const longer = `${swissGridDefaults.title} today`;
    expect(getSwissGridDuration({ title: longer })).toBe(base + 3);
    expect(getSwissGridDuration({ kicker: "" })).toBe(base - 7);
    const quiet = { metaStart: "", metaEnd: "" };
    expect(getSwissGridDuration(quiet)).toBe(base - 7);
    expect(getSwissGridDuration({ number: "" })).toBe(base - 4);
  });
});

describe("swiss grid exit", () => {
  it("plays the build in reverse order and ends on an empty frame", () => {
    for (const options of CASES) {
      const timeline = getSwissGridTimeline(getSwissGridLayout(options));
      const exitOf = (id: string) => {
        const cue = timeline.cues.find((item) => item.id === id);
        return cue?.exit?.end ?? 0;
      };
      const entering = timeline.cues.filter((cue) => cue.group !== "guides");
      const leaving = timeline.cues
        .filter((cue) => cue.exit !== null)
        .map((cue) => cue.id)
        .sort((a, b) => exitOf(a) - exitOf(b));
      expect(leaving).toEqual(entering.map((cue) => cue.id).reverse());
      const ends = leaving.map(exitOf);
      const gaps = ends.slice(1).map((end, index) => end - ends[index]);
      expect(gaps.every((gap) => gap >= 3 && gap <= 6)).toBe(true);
      expect(ends[ends.length - 1]).toBe(timeline.exitLength);

      const exitEnd = timeline.length + 30 + timeline.exitLength;
      const at = withExit(options, exitEnd);
      const start = exitEnd - timeline.exitLength;
      const held = at(start);
      expect(held.exitStart).toBe(start);
      expect(everyAmount(held, 1)).toBe(true);
      const last = at(exitEnd);
      for (const cue of entering) expect(last.amounts[cue.id]).toBe(0);
      expect(last.guideOpacity).toBe(0);
      expect(last.spine.current.height).toBe(0);
    }
  });

  it("never starts the exit before the build has landed", () => {
    const early = getSwissGridState(40, { exitEnd: 20 });
    expect(early.exitStart).toBe(swissGridLength);
    const endless = getSwissGridState(40, {
      exitEnd: Number.POSITIVE_INFINITY,
    });
    expect(endless.exitStart).toBeNull();
    expect(getSwissGridState(40, { exitEnd: null }).exitStart).toBeNull();
  });
});

describe("swiss snap", () => {
  it("accelerates every element into a one-frame landing with no overshoot", () => {
    for (const options of CASES) {
      const { cues } = getSwissGridTimeline(getSwissGridLayout(options));
      for (const cue of cues) {
        const { start, end } = cue.enter;
        const frames = end - start;
        const values = series(options, cue.id, start, end + 2);
        expect(values[0]).toBe(0);
        expect(values[1]).toBeGreaterThan(0);
        expect(values[frames - 1]).toBeLessThan(1);
        expect(values.slice(frames)).toEqual([1, 1, 1]);
        expect(Math.max(...values)).toBe(1);
        for (let step = 2; step <= frames; step += 1) {
          const now = values[step] - values[step - 1];
          const before = values[step - 1] - values[step - 2];
          expect(now).toBeGreaterThan(before);
        }
      }
    }
  });

  it("leaves with the same snap into the pinned edge", () => {
    for (const options of CASES) {
      const timeline = getSwissGridTimeline(getSwissGridLayout(options));
      const exitEnd = timeline.length + 30 + timeline.exitLength;
      const exitStart = exitEnd - timeline.exitLength;
      const at = withExit(options, exitEnd);
      for (const cue of timeline.cues) {
        if (cue.exit === null) continue;
        const start = exitStart + cue.exit.start;
        const frames = cue.exit.end - cue.exit.start;
        const values: number[] = [];
        for (let frame = start; frame <= start + frames + 1; frame += 1) {
          values.push(at(frame).amounts[cue.id]);
        }
        expect(values[0]).toBe(1);
        expect(values[frames - 1]).toBeGreaterThan(0);
        expect(values.slice(frames)).toEqual([0, 0]);
        for (let step = 2; step <= frames; step += 1) {
          const now = values[step - 1] - values[step];
          const before = values[step - 2] - values[step - 1];
          expect(now).toBeGreaterThan(before);
        }
      }
    }
  });

  it("keeps the pinned top edge of the spine and the square on every frame", () => {
    for (const options of CASES) {
      const timeline = getSwissGridTimeline(getSwissGridLayout(options));
      const exitEnd = timeline.length + 10 + timeline.exitLength;
      const at = withExit(options, exitEnd);
      for (let frame = 0; frame <= exitEnd; frame += 1) {
        const state = at(frame);
        for (const bar of [state.spine, state.square]) {
          const full = bar.rect.height * bar.extension;
          expect(bar.current.x).toBe(bar.rect.x);
          expect(bar.current.y).toBe(bar.rect.y);
          expect(bar.current.width).toBe(bar.rect.width);
          expect(bar.current.height).toBeCloseTo(full, 9);
          expect(bar.current.height).toBeLessThanOrEqual(bar.rect.height);
        }
      }
    }
  });

  it("moves type by translation only, never by fading or typing", () => {
    const layout = getSwissGridLayout();
    const { cues } = getSwissGridTimeline(layout);
    const texts = layout.headline.lines.flatMap((line) =>
      line.words.map((word) => word.text),
    );
    const frames = cues.map((cue) =>
      Math.ceil((cue.enter.start + cue.enter.end) / 2),
    );
    for (const frame of [...frames, 0, swissGridLength]) {
      const found = walk(renderSwissGrid(getSwissGridState(frame)));
      const words = partsOf(found, "word");
      expect(words.map(({ element }) => textOf(element))).toEqual(texts);
      for (const { element } of found) {
        if (element.props["data-part"] === "guides") continue;
        expect(styleOf(element).opacity).toBeUndefined();
        expect(styleOf(element).filter).toBeUndefined();
      }
      for (const { element } of words) {
        const transform = String(styleOf(element).transform);
        expect(transform).toMatch(/^translateY\(-?[\d.e-]+px\)$/);
      }
    }
  });
});

describe("rules sized by their text", () => {
  const found = walk(renderSwissGrid(getSwissGridState(swissGridLength)));

  it("hangs the heavy rule in the shrink-wrapped headline block", () => {
    const headline = only(found, "headline");
    const heavy = only(found, "heavy-rule");
    expect(heavy.parent).toBe(headline.element);
    expect(styleOf(headline.element).width).toBe("max-content");
    expect(styleOf(headline.element).position).toBe("absolute");
    const lines = partsOf(found, "line");
    expect(lines.every(({ parent }) => parent === headline.element)).toBe(true);
    expect(lines.map(({ element }) => textOf(element))).toEqual([
      "Pricing that",
      "scales with you",
    ]);
    const rule = styleOf(heavy.element);
    expect(rule.width).toBe("100%");
    expect(rule.left).toBe(0);
    expect(rule.transformOrigin).toBe("left center");
    expect(rule.transform).toBe("scaleX(1)");
  });

  it("hangs the thin rule in the shrink-wrapped last line", () => {
    const lines = partsOf(found, "line");
    const last = lines[lines.length - 1];
    const thin = only(found, "thin-rule");
    expect(getSwissGridLayout().thinRule.span).toBe("line");
    expect(partsOf(found, "column")).toEqual([]);
    expect(thin.parent).toBe(last.element);
    expect(styleOf(last.element).width).toBe("max-content");
    expect(textOf(last.element)).toBe("scales with you");
    const rule = styleOf(thin.element);
    expect(rule.width).toBe("100%");
    expect(rule.left).toBe(0);
    expect(rule.transformOrigin).toBe("left center");
    for (const { element } of lines.slice(0, -1)) {
      const inside = walk(element.props.children);
      expect(partsOf(inside, "thin-rule")).toEqual([]);
    }
  });

  it("spans the thin rule across the column when the numeral drops below", () => {
    const options = { width: 720, height: 1280 };
    const layout = getSwissGridLayout(options);
    const state = getSwissGridState(swissGridLength, options);
    const tree = walk(renderSwissGrid(state));
    const thin = only(tree, "thin-rule");
    const column = only(tree, "column");
    expect(layout.placement).toBe("below");
    expect(layout.thinRule.span).toBe("column");
    expect(layout.thinRule.estimate).toBe(layout.measure);
    expect(thin.parent).toBe(column.element);
    const block = styleOf(column.element);
    expect(block.position).toBe("absolute");
    expect(block.left).toBe(layout.thinRule.x);
    expect(block.top).toBe(layout.thinRule.y);
    expect(block.width).toBe(layout.measure);
    const rule = styleOf(thin.element);
    expect(rule.width).toBe("100%");
    expect(rule.left).toBe(0);
    expect(rule.top).toBe(0);
    expect(rule.transformOrigin).toBe("left center");
    expect(rule.transform).toBe("scaleX(1)");
    for (const { element } of partsOf(tree, "line")) {
      const inside = walk(element.props.children);
      expect(partsOf(inside, "thin-rule")).toEqual([]);
    }
  });

  it("grows the heavy rule from its pinned left edge with the snap", () => {
    const state = getSwissGridState(24);
    const growth = state.amounts["heavy-rule"];
    const heavy = only(walk(renderSwissGrid(state)), "heavy-rule");
    const rule = styleOf(heavy.element);
    expect(growth).toBeGreaterThan(0);
    expect(growth).toBeLessThan(1);
    expect(rule.transform).toBe(`scaleX(${growth})`);
    expect(rule.left).toBe(0);
    expect(rule.transformOrigin).toBe("left center");
  });

  it("paints no background of its own", () => {
    const style = styleOf(only(found, "root").element);
    expect(style.background).toBeUndefined();
    expect(style.backgroundColor).toBeUndefined();
    expect(style.position).toBe("absolute");
  });
});

describe("swiss grid geometry", () => {
  it("fits square modules to the shorter side", () => {
    for (const size of SIZES) {
      for (const modules of [16, 24, 36]) {
        const layout = getSwissGridLayout({ ...size, modules });
        const short = Math.min(size.width, size.height);
        const spareX = size.width - layout.columns * layout.unit;
        const spareY = size.height - layout.rows * layout.unit;
        expect(layout.unit * modules).toBeCloseTo(short, 6);
        expect(spareX).toBeLessThan(layout.unit);
        expect(spareY).toBeLessThan(layout.unit);
      }
    }
  });

  it("sets every kicker line, headline line, numeral and meta item on a grid baseline", () => {
    for (const options of CASES) {
      for (const modules of [16, 24, 36]) {
        const layout = getSwissGridLayout({ ...options, modules });
        const rows = new Set(
          layout.guides
            .filter((guide) => guide.axis === "baseline")
            .map((guide) => guide.index),
        );
        for (const band of bandsOf(layout)) {
          const steps = band.rise / layout.unit;
          const drift = Math.abs(steps - Math.round(steps));
          expect(Number.isInteger(band.row)).toBe(true);
          expect(band.baseline).toBe(toY(layout, band.row));
          expect(band.top + band.ascent).toBeCloseTo(band.baseline, 9);
          expect(band.height).toBe(band.rise);
          expect(drift).toBeLessThan(1 / layout.unit);
          expect(rows.has(band.row)).toBe(true);
        }
        for (const rule of [layout.heavyRule, layout.thinRule]) {
          expect(Number.isInteger(rule.row)).toBe(true);
          expect(rule.y).toBe(toY(layout, rule.row));
          expect(rule.x).toBe(toX(layout, layout.column));
          expect(rows.has(rule.row)).toBe(true);
        }
      }
    }
  });

  it("stacks headline lines one pitch apart so the flow matches the grid", () => {
    for (const options of CASES) {
      const layout = getSwissGridLayout(options);
      const { lines } = layout.headline;
      expect(lines[0].row).toBe(layout.heavyRule.row + layout.pitch);
      expect(layout.headline.top).toBeCloseTo(lines[0].top, 9);
      expect(layout.headline.x).toBe(toX(layout, layout.column));
      lines.forEach((line, index) => {
        const above = toY(layout, line.row - layout.pitch);
        expect(line.rise).toBe(toY(layout, line.row) - above);
        if (index === 0) return;
        const previous = lines[index - 1];
        expect(line.row - previous.row).toBe(layout.pitch);
        expect(line.top).toBeCloseTo(previous.top + previous.height, 9);
      });
      expect(layout.thinRule.row).toBeGreaterThan(lines[lines.length - 1].row);
    }
  });

  it("aligns the text column, the right edge and the bars to grid lines", () => {
    for (const options of CASES) {
      const layout = getSwissGridLayout(options);
      const column = toX(layout, layout.column);
      const edge = toX(layout, layout.edge);
      expect(layout.measure).toBe(edge - column);
      for (const line of layout.kicker) expect(line.x).toBe(column);
      for (const item of layout.meta) {
        expect(item.x).toBe(item.align === "start" ? column : edge);
      }
      expect(layout.numeral?.x).toBe(edge);
      expect(layout.numeral?.align).toBe("end");
      for (const { cells, rect } of [layout.spine, layout.square]) {
        expect(rect.x).toBe(toX(layout, cells.left));
        expect(rect.y).toBe(toY(layout, cells.top));
        expect(rect.x + rect.width).toBe(toX(layout, cells.right));
        expect(rect.y + rect.height).toBe(toY(layout, cells.bottom));
      }
      expect(layout.spine.cells.top).toBe(layout.square.cells.top);
      expect(layout.square.cells.right).toBe(layout.edge);
      expect(layout.spine.cells.right).toBeLessThan(layout.column);
      expect(layout.spine.cells.bottom).toBe(layout.bottom);
      const columns = layout.guides
        .filter((guide) => guide.axis === "column")
        .map((guide) => guide.index);
      expect(columns).toEqual([layout.margin, layout.column, layout.edge]);
    }
  });

  it("keeps the default card inside the frame at every aspect ratio", () => {
    for (const size of SIZES) {
      const layout = getSwissGridLayout(size);
      expect(layout.fits).toBe(true);
      expect(layout.top).toBeGreaterThanOrEqual(0);
      expect(layout.bottom).toBeLessThanOrEqual(layout.rows);
      for (const { rect } of [layout.spine, layout.square]) {
        expect(rect.x).toBeGreaterThanOrEqual(0);
        expect(rect.x + rect.width).toBeLessThanOrEqual(size.width);
        expect(rect.y + rect.height).toBeLessThanOrEqual(size.height);
      }
    }
  });

  it("sets the numeral beside the headline in landscape and below it in portrait", () => {
    const wide = getSwissGridLayout();
    const lastWide = wide.headline.lines[wide.headline.lines.length - 1];
    expect(wide.placement).toBe("beside");
    expect(wide.pitch).toBe(3);
    expect(wide.numeral?.row).toBe(lastWide.row);
    expect(wide.thinRule.span).toBe("line");
    expect(wide.thinRule.estimate).toBe(lastWide.estimate);
    const tall = getSwissGridLayout({ width: 720, height: 1280 });
    const lastTall = tall.headline.lines[tall.headline.lines.length - 1];
    const numeralRow = tall.numeral?.row ?? 0;
    expect(tall.placement).toBe("below");
    expect(numeralRow).toBeGreaterThan(lastTall.row);
    expect(tall.thinRule.row).toBeGreaterThan(numeralRow);
    expect(tall.thinRule.span).toBe("column");
    expect(tall.heavyRule.span).toBe("headline");
  });
});

describe("swiss grid content", () => {
  it("breaks the default title into the approved two lines", () => {
    const layout = getSwissGridLayout();
    const kicker = layout.kicker.map((line) => line.text);
    const meta = layout.meta.map((item) => item.text);
    expect(layout.headline.lines.map((line) => line.text)).toEqual([
      "Pricing that",
      "scales with you",
    ]);
    expect(kicker).toEqual(["Launch week", "Day 02"]);
    expect(layout.numeral?.text).toBe("02");
    expect(meta).toEqual(["remocn.dev", "Sep 2026"]);
  });

  it("balances automatic breaks and keeps explicit ones", () => {
    const title = swissGridDefaults.title;
    expect(breakSwissGridTitle(title, 1)).toEqual([title.split(" ")]);
    expect(breakSwissGridTitle(title, 2)).toEqual([
      ["Pricing", "that"],
      ["scales", "with", "you"],
    ]);
    expect(breakSwissGridTitle(title, 3)).toEqual([
      ["Pricing"],
      ["that", "scales"],
      ["with", "you"],
    ]);
    expect(breakSwissGridTitle("One", 3)).toEqual([["One"]]);
    expect(breakSwissGridTitle("   ", 2)).toEqual([]);
    const explicit = getSwissGridLayout({ title: "Chapter one\nThe grid" });
    const set = explicit.headline.lines.map((line) => line.text);
    expect(set).toEqual(["Chapter one", "The grid"]);
    const capped = getSwissGridLayout({ title: "A\nB\nC\nD\nE" });
    const three = capped.headline.lines.map((line) => line.text);
    expect(three).toEqual(["A", "B", "C D E"]);
    for (const options of CASES) {
      const { lines } = getSwissGridLayout(options).headline;
      expect(lines.length).toBeLessThanOrEqual(3);
    }
  });

  it("drops the optional parts cleanly", () => {
    const options = { kicker: "", number: "", metaStart: "", metaEnd: "  " };
    const bare = getSwissGridLayout(options);
    expect(bare.kicker).toEqual([]);
    expect(bare.numeral).toBeNull();
    expect(bare.meta).toEqual([]);
    expect(bare.spine.cells.bottom).toBe(bare.thinRule.row);
    const ids = getSwissGridTimeline(bare).cues.map((cue) => cue.id);
    expect(ids).not.toContain("numeral");
    expect(ids).not.toContain("kicker-0");
    expect(ids).not.toContain("meta-start");
    const tree = walk(renderSwissGrid(getSwissGridState(100, options)));
    expect(partsOf(tree, "numeral")).toEqual([]);
    expect(partsOf(tree, "kicker")).toEqual([]);
    const lines = getSwissGridLayout({ kicker: "One\nTwo\nThree" }).kicker;
    expect(lines.map((line) => line.text)).toEqual(["One", "Two Three"]);
  });
});

describe("swiss grid determinism", () => {
  it("renders any frame the same in any sampling order", () => {
    for (const options of CASES.slice(0, 6)) {
      const first = getSwissGridState(37, options);
      const tree = JSON.stringify(renderSwissGrid(first));
      getSwissGridState(90, options);
      getSwissGridState(5, { ...options, modules: 30 });
      getSwissGridState(12.5, { ...options, exitEnd: 140 });
      const again = getSwissGridState(37, options);
      expect(again).toEqual(first);
      expect(JSON.stringify(renderSwissGrid(again))).toBe(tree);
    }
  });

  it("samples fractional times between frames", () => {
    const before = getSwissGridState(30).amounts["word-0"];
    const between = getSwissGridState(30.5).amounts["word-0"];
    const after = getSwissGridState(31).amounts["word-0"];
    expect(between).toBeGreaterThan(before);
    expect(between).toBeLessThan(after);
  });

  it("normalizes invalid input", () => {
    expect(getSwissGridLayout({ modules: 4 }).unit).toBe(720 / 16);
    expect(getSwissGridLayout({ modules: 90 }).unit).toBe(20);
    const invalid = getSwissGridLayout({
      modules: Number.NaN,
      width: Number.NaN,
      height: Number.NaN,
    });
    expect(invalid).toEqual(getSwissGridLayout());
    expect(everyAmount(getSwissGridState(Number.NaN), 0)).toBe(true);
  });
});

describe("swiss grid config", () => {
  const control = (name: string) => swissGridConfig.controls[name];
  const defaultOf = (name: string) => {
    const field = control(name);
    return "default" in field ? field.default : undefined;
  };

  it("matches the component defaults and the paper backdrop", () => {
    expect(swissGridConfig.componentName).toBe("SwissGrid");
    expect(swissGridConfig.importPath).toBe("@/components/remocn/swiss-grid");
    const texts: (keyof typeof swissGridDefaults)[] = [
      "kicker",
      "title",
      "number",
      "metaStart",
      "metaEnd",
      "fontFamily",
    ];
    for (const name of texts) {
      expect(control(name).type).toBe("text-content");
      expect(defaultOf(name)).toBe(swissGridDefaults[name]);
    }
    expect(defaultOf("inkColor")).toBe(swissGridDefaults.inkColor);
    expect(defaultOf("accentColor")).toBe(swissGridDefaults.accentColor);
    expect(defaultOf("modules")).toBe(swissGridDefaults.modules);
    expect(defaultOf("exit")).toBe(swissGridDefaults.exit);
    expect(swissGridDefaults.speed).toBe(1);
    expect(swissGridConfig.previewBackdrop).toEqual({
      type: "color",
      value: swissGridPaper,
    });
    expect(swissGridConfig.fps).toBe(30);
  });

  it("exposes the grid density as a visible slider", () => {
    const modules = control("modules");
    if (modules.type !== "number") throw new Error("modules is not a number");
    expect(modules.hiddenFromList).toBe(false);
    expect(modules.min).toBe(16);
    expect(modules.max).toBe(36);
  });

  it("builds the default card from the config defaults", () => {
    const text = (name: string) => String(defaultOf(name));
    const configured = getSwissGridLayout({
      kicker: text("kicker"),
      title: text("title"),
      number: text("number"),
      metaStart: text("metaStart"),
      metaEnd: text("metaEnd"),
      modules: Number(defaultOf("modules")),
    });
    expect(configured).toEqual(getSwissGridLayout());
  });
});
