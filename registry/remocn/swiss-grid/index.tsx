"use client";

import { type CSSProperties, Fragment, type ReactElement } from "react";
import { Easing, useCurrentFrame, useVideoConfig } from "remotion";

export type SwissGridPlacement = "beside" | "below";
export type SwissGridAlign = "start" | "end";
export type SwissGridAxis = "column" | "baseline";
export type SwissGridRuleSpan = "headline" | "line" | "column";
export type SwissGridGroup =
  | "guides"
  | "spine"
  | "kicker"
  | "heavy-rule"
  | "headline"
  | "numeral"
  | "square"
  | "thin-rule"
  | "meta";

export interface SwissGridContent {
  kicker?: string;
  title?: string;
  number?: string;
  metaStart?: string;
  metaEnd?: string;
}

export interface SwissGridOptions extends SwissGridContent {
  modules?: number;
  width?: number;
  height?: number;
}

export interface SwissGridStateOptions extends SwissGridOptions {
  exitEnd?: number | null;
}

export interface SwissGridDurationOptions extends SwissGridOptions {
  exit?: boolean;
  speed?: number;
}

export interface SwissGridLook {
  fontFamily?: string;
  inkColor?: string;
  accentColor?: string;
  className?: string;
}

export interface SwissGridProps extends SwissGridContent, SwissGridLook {
  title: string;
  modules?: number;
  exit?: boolean;
  speed?: number;
}

export interface SwissGridCells {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export interface SwissGridRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SwissGridBand {
  row: number;
  baseline: number;
  top: number;
  height: number;
  ascent: number;
  rise: number;
  size: number;
}

export interface SwissGridText extends SwissGridBand {
  id: string;
  text: string;
  x: number;
  align: SwissGridAlign;
}

export interface SwissGridWord {
  id: string;
  text: string;
}

export interface SwissGridLine extends SwissGridBand {
  id: string;
  text: string;
  words: SwissGridWord[];
  estimate: number;
}

export interface SwissGridHeadline {
  x: number;
  top: number;
  size: number;
  lines: SwissGridLine[];
}

export interface SwissGridRule {
  row: number;
  x: number;
  y: number;
  thickness: number;
  span: SwissGridRuleSpan;
  estimate: number;
}

export interface SwissGridBar {
  cells: SwissGridCells;
  rect: SwissGridRect;
}

export interface SwissGridGuide {
  id: string;
  axis: SwissGridAxis;
  index: number;
  position: number;
}

export interface SwissGridLayout {
  width: number;
  height: number;
  unit: number;
  columns: number;
  rows: number;
  offsetX: number;
  offsetY: number;
  margin: number;
  column: number;
  edge: number;
  measure: number;
  top: number;
  bottom: number;
  pitch: number;
  placement: SwissGridPlacement;
  fits: boolean;
  hairline: number;
  spine: SwissGridBar;
  square: SwissGridBar;
  kicker: SwissGridText[];
  heavyRule: SwissGridRule;
  headline: SwissGridHeadline;
  thinRule: SwissGridRule;
  numeral: SwissGridText | null;
  meta: SwissGridText[];
  guides: SwissGridGuide[];
}

export interface SwissGridSpan {
  start: number;
  end: number;
}

export interface SwissGridCue {
  id: string;
  group: SwissGridGroup;
  enter: SwissGridSpan;
  exit: SwissGridSpan | null;
}

export interface SwissGridTimeline {
  cues: SwissGridCue[];
  length: number;
  exitLength: number;
  fade: SwissGridSpan;
}

export interface SwissGridBarState extends SwissGridBar {
  extension: number;
  current: SwissGridRect;
}

export interface SwissGridState {
  time: number;
  exitStart: number | null;
  layout: SwissGridLayout;
  timeline: SwissGridTimeline;
  amounts: Record<string, number>;
  guideOpacity: number;
  spine: SwissGridBarState;
  square: SwissGridBarState;
}

export const swissGridDefaults = {
  kicker: "Launch week\nDay 02",
  title: "Pricing that scales with you",
  number: "02",
  metaStart: "remocn.dev",
  metaEnd: "Sep 2026",
  fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
  inkColor: "#171717",
  accentColor: "#da291c",
  modules: 24,
  exit: false,
  speed: 1,
};

export const swissGridPaper = "#f1eee7";
export const swissGridLength = 63;
export const swissGridHold = 36;

const REFERENCE_WIDTH = 1280;
const REFERENCE_HEIGHT = 720;
const MIN_MODULES = 16;
const MAX_MODULES = 36;
const SQUARE = 2;
const PITCHES = [3, 2];
const HEADLINE = 0.95;
const SMALL = 0.8;
const CAP = 0.72;
const DESCENT = 0.25;
const TRACK_HEADLINE = -0.02;
const TRACK_NUMERAL = -0.04;
const FIT = 1.05;
const SPACE = 0.278;
const UNKNOWN_ADVANCE = 0.6;
const GUIDE_OPACITY = 0.2;
const BEAT = 3;
const STEP = 4;
const FADE_FRAMES = 12;
const GUIDE_FRAMES = { columns: 9, baselines: 12 };
const TYPE_FRAMES = { kicker: 6, headline: 7, numeral: 8, meta: 6 };
const TYPE_GROUPS = new Set<SwissGridGroup>(["kicker", "headline", "meta"]);
const SNAP = Easing.in(Easing.quad);
const FADE = Easing.inOut(Easing.quad);

const ADVANCES: [number, string][] = [
  [0.238, "'"],
  [0.278, " ijlI.,/\\‘’"],
  [0.28, "|"],
  [0.333, "ft!:;-()[]`"],
  [0.389, "r*{}"],
  [0.474, '"'],
  [0.5, "z"],
  [0.556, "acekvxysJ#$_0123456789–"],
  [0.584, "+<=>^~"],
  [0.611, "bdghnopquFLTZ?"],
  [0.667, "EPSVXY"],
  [0.722, "ABCDHKNRU&"],
  [0.778, "wGOQ"],
  [0.833, "M"],
  [0.889, "m%"],
  [0.944, "W"],
  [0.975, "@"],
  [1, "—"],
];

const ADVANCE = new Map(
  ADVANCES.flatMap(([advance, glyphs]) =>
    [...glyphs].map((glyph): [string, number] => [glyph, advance]),
  ),
);

const finite = (value: number, fallback: number) =>
  Number.isFinite(value) ? value : fallback;
const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));
const progress = (time: number, span: SwissGridSpan) =>
  clamp((time - span.start) / Math.max(1e-9, span.end - span.start), 0, 1);

function words(text: string) {
  return text.trim().split(/\s+/).filter(Boolean);
}

function textLines(text: string, limit: number) {
  const lines = text
    .split("\n")
    .map((line) => words(line).join(" "))
    .filter((line) => line.length > 0);
  if (lines.length <= limit) return lines;
  return [...lines.slice(0, limit - 1), lines.slice(limit - 1).join(" ")];
}

export function measureSwissGridText(text: string, tracking = 0) {
  let total = 0;
  for (const glyph of text) {
    total += (ADVANCE.get(glyph) ?? UNKNOWN_ADVANCE) + tracking;
  }
  return total;
}

function partitions(total: number, count: number, from = 0): number[][] {
  if (count <= 1) return [[total]];
  const out: number[][] = [];
  for (let cut = from + 1; cut <= total - count + 1; cut += 1) {
    for (const rest of partitions(total, count - 1, cut)) {
      out.push([cut, ...rest]);
    }
  }
  return out;
}

export function breakSwissGridTitle(title: string, count: number) {
  const list = words(title);
  const lines = clamp(Math.round(finite(count, 1)), 1, 3);
  if (list.length === 0) return [];
  if (lines === 1 || list.length === 1) return [list];
  const widths = list.map((word) => measureSwissGridText(word, TRACK_HEADLINE));
  const space = SPACE + TRACK_HEADLINE;
  const span = (from: number, to: number) =>
    widths.slice(from, to).reduce((sum, width) => sum + width, 0) +
    (to - from - 1) * space;
  let best: number[] = [list.length];
  let bestLongest = Number.POSITIVE_INFINITY;
  let bestSpread = Number.POSITIVE_INFINITY;
  for (const cuts of partitions(list.length, Math.min(lines, list.length))) {
    const spans = cuts.map((cut, index) =>
      span(index === 0 ? 0 : cuts[index - 1], cut),
    );
    const longest = Math.max(...spans);
    const spread = spans.reduce((sum, width) => sum + width * width, 0);
    if (
      longest < bestLongest - 1e-9 ||
      (Math.abs(longest - bestLongest) <= 1e-9 && spread < bestSpread)
    ) {
      best = cuts;
      bestLongest = longest;
      bestSpread = spread;
    }
  }
  return best.map((cut, index) =>
    list.slice(index === 0 ? 0 : best[index - 1], cut),
  );
}

interface Plan {
  pitch: number;
  placement: SwissGridPlacement;
  lines: string[][];
  size: number;
  numeralSize: number;
  numeralRise: number;
  heavy: number;
  numeralRow: number | null;
  thin: number;
  metaRow: number | null;
  bottom: number;
  overflow: number;
  fits: boolean;
}

export function getSwissGridLayout({
  kicker = swissGridDefaults.kicker,
  title = swissGridDefaults.title,
  number = swissGridDefaults.number,
  metaStart = swissGridDefaults.metaStart,
  metaEnd = swissGridDefaults.metaEnd,
  modules = swissGridDefaults.modules,
  width = REFERENCE_WIDTH,
  height = REFERENCE_HEIGHT,
}: SwissGridOptions = {}): SwissGridLayout {
  const frameWidth = Math.max(1, finite(width, REFERENCE_WIDTH));
  const frameHeight = Math.max(1, finite(height, REFERENCE_HEIGHT));
  const count = Math.round(
    clamp(finite(modules, swissGridDefaults.modules), MIN_MODULES, MAX_MODULES),
  );
  const unit = Math.min(frameWidth, frameHeight) / count;
  const columns = Math.max(count, Math.floor(frameWidth / unit + 1e-6));
  const rows = Math.max(count, Math.floor(frameHeight / unit + 1e-6));
  const offsetX = (frameWidth - columns * unit) / 2;
  const offsetY = (frameHeight - rows * unit) / 2;
  const toX = (index: number) => Math.round(offsetX + index * unit);
  const toY = (index: number) => Math.round(offsetY + index * unit);
  const margin = Math.max(2, Math.round(columns * 0.07));
  const marginY = Math.max(1, Math.round(rows * 0.08));
  const column = margin + 2;
  const edge = columns - margin;
  const room = (edge - column) * unit;

  const kickerLines = textLines(kicker, 2);
  const numeral = words(number).join(" ");
  const metaItems: { id: string; text: string; align: SwissGridAlign }[] = [
    { id: "meta-start", text: words(metaStart).join(" "), align: "start" },
    { id: "meta-end", text: words(metaEnd).join(" "), align: "end" },
  ];
  const meta = metaItems.filter((item) => item.text.length > 0);
  const lineSets = title.includes("\n")
    ? [textLines(title, 3).map((line) => line.split(" "))]
    : [1, 2, 3].map((lines) => breakSwissGridTitle(title, lines));
  const placements: SwissGridPlacement[] =
    numeral.length > 0 ? ["beside", "below"] : ["beside"];

  const plan = (
    pitch: number,
    placement: SwissGridPlacement,
    lines: string[][],
  ): Plan => {
    const size = HEADLINE * pitch * unit;
    const hasNumeral = numeral.length > 0;
    const numeralSize = hasNumeral ? (pitch * unit) / CAP + size : 0;
    const numeralWidth =
      measureSwissGridText(numeral, TRACK_NUMERAL) * numeralSize;
    const figure = (CAP * numeralSize) / unit;
    const beside = hasNumeral && placement === "beside";
    const stack = Math.max(1, lines.length);
    const heavy = Math.max(
      SQUARE + kickerLines.length + 1,
      beside ? Math.ceil(SQUARE + 1 + figure - stack * pitch) : 0,
    );
    const last = heavy + stack * pitch;
    const drop = Math.ceil(figure + (DESCENT * size) / unit + 0.5);
    const numeralRow = hasNumeral ? last + (beside ? 0 : drop) : null;
    const thin = (numeralRow ?? last) + 1;
    const metaRow = meta.length > 0 ? thin + 1 : null;
    const bottom = metaRow ?? thin;
    const longest = Math.max(
      0,
      ...lines.map(
        (line) => measureSwissGridText(line.join(" "), TRACK_HEADLINE) * size,
      ),
    );
    const available = beside ? room - numeralWidth * FIT - 2 * unit : room;
    const wide = Math.max(0, longest * FIT - available) / unit;
    const tall = Math.max(0, bottom - (rows - 2 * marginY));
    return {
      pitch,
      placement: hasNumeral ? placement : "beside",
      lines,
      size,
      numeralSize,
      numeralRise: Math.ceil(numeralSize / unit),
      heavy,
      numeralRow,
      thin,
      metaRow,
      bottom,
      overflow: wide + tall,
      fits: wide === 0 && tall === 0,
    };
  };

  const plans = PITCHES.flatMap((pitch) =>
    placements.flatMap((placement) =>
      lineSets.map((lines) => plan(pitch, placement, lines)),
    ),
  );
  const chosen =
    plans.find((candidate) => candidate.fits) ??
    plans.reduce((best, candidate) =>
      candidate.overflow < best.overflow ? candidate : best,
    );

  const top = Math.max(0, Math.floor((rows - chosen.bottom) / 2));
  const at = (row: number) => top + row;
  const measure = toX(edge) - toX(column);
  const underColumn = chosen.placement === "below";
  const band = (row: number, above: number, size: number): SwissGridBand => {
    const baseline = toY(row);
    const rise = baseline - toY(row - above);
    const descent = DESCENT * size;
    return {
      row,
      baseline,
      top: baseline - rise + descent,
      height: rise,
      ascent: rise - descent,
      rise,
      size,
    };
  };
  const bar = (cells: SwissGridCells): SwissGridBar => {
    const x = toX(cells.left);
    const y = toY(cells.top);
    return {
      cells,
      rect: {
        x,
        y,
        width: toX(cells.right) - x,
        height: toY(cells.bottom) - y,
      },
    };
  };

  const small = SMALL * unit;
  const kickerTexts = kickerLines.map(
    (text, index): SwissGridText => ({
      id: `kicker-${index}`,
      text,
      x: toX(column),
      align: "start",
      ...band(at(chosen.heavy - kickerLines.length + index), 1, small),
    }),
  );

  let counted = 0;
  const lines = chosen.lines.map((line, index): SwissGridLine => {
    const first = counted;
    counted += line.length;
    const text = line.join(" ");
    return {
      id: `line-${index}`,
      text,
      words: line.map((word, order) => ({
        id: `word-${first + order}`,
        text: word,
      })),
      estimate: measureSwissGridText(text, TRACK_HEADLINE) * chosen.size,
      ...band(
        at(chosen.heavy + (index + 1) * chosen.pitch),
        chosen.pitch,
        chosen.size,
      ),
    };
  });
  const estimates = lines.map((line) => line.estimate);
  const lastEstimate = estimates.at(-1) ?? 0;

  const numeralText: SwissGridText | null =
    numeral.length > 0 && chosen.numeralRow !== null
      ? {
          id: "numeral",
          text: numeral,
          x: toX(edge),
          align: "end",
          ...band(
            at(chosen.numeralRow),
            chosen.numeralRise,
            chosen.numeralSize,
          ),
        }
      : null;

  const metaTexts = meta.map(
    (item): SwissGridText => ({
      ...item,
      x: toX(item.align === "start" ? column : edge),
      ...band(at(chosen.metaRow ?? chosen.thin + 1), 1, small),
    }),
  );

  const guides: SwissGridGuide[] = [
    ...[margin, column, edge].map(
      (index): SwissGridGuide => ({
        id: `column-${index}`,
        axis: "column",
        index,
        position: toX(index),
      }),
    ),
    ...Array.from(
      { length: chosen.bottom + 1 },
      (_, row): SwissGridGuide => ({
        id: `baseline-${at(row)}`,
        axis: "baseline",
        index: at(row),
        position: toY(at(row)),
      }),
    ),
  ];

  return {
    width: frameWidth,
    height: frameHeight,
    unit,
    columns,
    rows,
    offsetX,
    offsetY,
    margin,
    column,
    edge,
    measure,
    top,
    bottom: at(chosen.bottom),
    pitch: chosen.pitch,
    placement: chosen.placement,
    fits: chosen.fits,
    hairline: Math.max(1, Math.round(unit / 20)),
    spine: bar({
      left: margin,
      right: margin + 1,
      top: at(0),
      bottom: at(chosen.bottom),
    }),
    square: bar({
      left: edge - SQUARE,
      right: edge,
      top: at(0),
      bottom: at(SQUARE),
    }),
    kicker: kickerTexts,
    heavyRule: {
      row: at(chosen.heavy),
      x: toX(column),
      y: toY(at(chosen.heavy)),
      thickness: Math.max(2, Math.round(unit / 2)),
      span: "headline",
      estimate: Math.max(0, ...estimates),
    },
    headline: {
      x: toX(column),
      top: toY(at(chosen.heavy)) + DESCENT * chosen.size,
      size: chosen.size,
      lines,
    },
    thinRule: {
      row: at(chosen.thin),
      x: toX(column),
      y: toY(at(chosen.thin)),
      thickness: Math.max(1, Math.round(unit / 15)),
      span: underColumn ? "column" : "line",
      estimate: underColumn ? measure : lastEstimate,
    },
    numeral: numeralText,
    meta: metaTexts,
    guides,
  };
}

interface Step {
  id: string;
  group: SwissGridGroup;
  frames: number;
}

const gapBetween = (previous: Step, next: Step) =>
  previous.group === next.group && TYPE_GROUPS.has(next.group) ? BEAT : STEP;

export function getSwissGridTimeline(
  layout: SwissGridLayout = getSwissGridLayout(),
): SwissGridTimeline {
  const short = Math.min(layout.width, layout.height);
  const travel = (distance: number) =>
    clamp(Math.round(9 * Math.sqrt(Math.max(0, distance) / short)), 4, 12);
  const headlineWords = layout.headline.lines.flatMap((line) => line.words);
  const numeralSteps: Step[] = layout.numeral
    ? [
        {
          id: layout.numeral.id,
          group: "numeral",
          frames: TYPE_FRAMES.numeral,
        },
      ]
    : [];
  const steps: Step[] = [
    { id: "columns", group: "guides", frames: GUIDE_FRAMES.columns },
    { id: "baselines", group: "guides", frames: GUIDE_FRAMES.baselines },
    { id: "spine", group: "spine", frames: travel(layout.spine.rect.height) },
    ...layout.kicker.map(
      (line): Step => ({
        id: line.id,
        group: "kicker",
        frames: TYPE_FRAMES.kicker,
      }),
    ),
    {
      id: "heavy-rule",
      group: "heavy-rule",
      frames: travel(layout.heavyRule.estimate),
    },
    ...headlineWords.map(
      (word): Step => ({
        id: word.id,
        group: "headline",
        frames: TYPE_FRAMES.headline,
      }),
    ),
    ...numeralSteps,
    {
      id: "square",
      group: "square",
      frames: travel(layout.square.rect.height),
    },
    {
      id: "thin-rule",
      group: "thin-rule",
      frames: travel(layout.thinRule.estimate),
    },
    ...layout.meta.map(
      (item): Step => ({
        id: item.id,
        group: "meta",
        frames: TYPE_FRAMES.meta,
      }),
    ),
  ];

  const lands: number[] = [];
  steps.forEach((step, index) => {
    const earliest =
      index === 0 ? 0 : lands[index - 1] + gapBetween(steps[index - 1], step);
    lands.push(Math.max(earliest, step.frames));
  });

  const leaving = steps.filter((step) => step.group !== "guides").reverse();
  const vanish = new Map<string, number>();
  let clock = 0;
  leaving.forEach((step, index) => {
    const earliest =
      index === 0 ? 0 : clock + gapBetween(leaving[index - 1], step);
    clock = Math.max(earliest, step.frames);
    vanish.set(step.id, clock);
  });

  const cues = steps.map((step, index): SwissGridCue => {
    const gone = vanish.get(step.id);
    return {
      id: step.id,
      group: step.group,
      enter: { start: lands[index] - step.frames, end: lands[index] },
      exit:
        gone === undefined ? null : { start: gone - step.frames, end: gone },
    };
  });

  const length = Math.max(...lands);
  const settled =
    [...cues].reverse().find((cue) => cue.group === "headline") ??
    cues.find((cue) => cue.id === "heavy-rule");
  const fadeStart = settled ? settled.enter.end : length;

  return {
    cues,
    length,
    exitLength: clock,
    fade: {
      start: fadeStart,
      end: Math.max(fadeStart, Math.min(length, fadeStart + FADE_FRAMES)),
    },
  };
}

function amountAt(
  time: number,
  enter: SwissGridSpan,
  exit: SwissGridSpan | null,
) {
  if (exit !== null && time >= exit.start) {
    return 1 - SNAP(progress(time, exit));
  }
  return SNAP(progress(time, enter));
}

export function getSwissGridState(
  time: number,
  options: SwissGridStateOptions = {},
): SwissGridState {
  const layout = getSwissGridLayout(options);
  const timeline = getSwissGridTimeline(layout);
  const now = Math.max(0, finite(time, 0));
  const end = options.exitEnd;
  const exitStart =
    typeof end === "number" && Number.isFinite(end)
      ? Math.max(timeline.length, end - timeline.exitLength)
      : null;
  const amounts: Record<string, number> = {};
  for (const cue of timeline.cues) {
    const exit =
      cue.exit !== null && exitStart !== null
        ? { start: exitStart + cue.exit.start, end: exitStart + cue.exit.end }
        : null;
    amounts[cue.id] = amountAt(now, cue.enter, exit);
  }
  const grow = (bar: SwissGridBar, extension: number): SwissGridBarState => ({
    ...bar,
    extension,
    current: { ...bar.rect, height: bar.rect.height * extension },
  });
  return {
    time: now,
    exitStart,
    layout,
    timeline,
    amounts,
    guideOpacity: GUIDE_OPACITY * (1 - FADE(progress(now, timeline.fade))),
    spine: grow(layout.spine, amounts.spine ?? 0),
    square: grow(layout.square, amounts.square ?? 0),
  };
}

export function getSwissGridDuration({
  speed = swissGridDefaults.speed,
  exit = swissGridDefaults.exit,
  ...options
}: SwissGridDurationOptions = {}) {
  const rate = Math.max(0, finite(speed, 1));
  if (rate === 0) return 1;
  const timeline = getSwissGridTimeline(getSwissGridLayout(options));
  const frames =
    timeline.length + swissGridHold + (exit ? timeline.exitLength : 0);
  return Math.max(1, Math.ceil(frames / rate) + 1);
}

function bandStyle(band: SwissGridBand): CSSProperties {
  return {
    display: "flex",
    alignItems: "baseline",
    height: band.height,
    whiteSpace: "nowrap",
    clipPath: `inset(${-band.height}px ${-band.size}px 0px ${-band.size}px)`,
  };
}

function anchor(band: SwissGridBand) {
  return (
    <span
      style={{ display: "block", flex: "none", width: 0, height: band.ascent }}
    />
  );
}

function typeStyle(
  size: number,
  weight: number,
  tracking: number,
): CSSProperties {
  return {
    display: "block",
    flex: "none",
    fontSize: size,
    fontWeight: weight,
    lineHeight: 0,
    letterSpacing: tracking === 0 ? "normal" : `${tracking}em`,
  };
}

function riseStyle(rise: number, amount: number): CSSProperties {
  return {
    transform: `translateY(${rise * (1 - amount)}px)`,
    visibility: amount > 0 ? "visible" : "hidden",
  };
}

function ruleStyle(
  top: number,
  thickness: number,
  amount: number,
  color: string,
): CSSProperties {
  return {
    position: "absolute",
    left: 0,
    top,
    width: "100%",
    height: thickness,
    background: color,
    transform: `scaleX(${amount})`,
    transformOrigin: "left center",
  };
}

function barStyle(rect: SwissGridRect, color: string): CSSProperties {
  return {
    position: "absolute",
    left: rect.x,
    top: rect.y,
    width: rect.width,
    height: rect.height,
    background: color,
  };
}

export function renderSwissGrid(
  state: SwissGridState,
  {
    fontFamily = swissGridDefaults.fontFamily,
    inkColor = swissGridDefaults.inkColor,
    accentColor = swissGridDefaults.accentColor,
    className,
  }: SwissGridLook = {},
): ReactElement {
  const { layout, amounts } = state;
  const { headline, heavyRule, thinRule } = layout;
  const amount = (id: string) => amounts[id] ?? 0;
  const last = headline.lines.length - 1;

  const typeBlock = (
    block: SwissGridText,
    part: string,
    weight: number,
    tracking: number,
  ) => (
    <div
      key={block.id}
      data-part={part}
      style={{
        position: "absolute",
        top: block.top,
        ...(block.align === "start"
          ? { left: block.x }
          : { right: layout.width - block.x }),
        ...bandStyle(block),
      }}
    >
      {anchor(block)}
      <span
        style={{
          ...typeStyle(block.size, weight, tracking),
          ...riseStyle(block.rise, amount(block.id)),
        }}
      >
        {block.text}
      </span>
    </div>
  );

  return (
    <div
      className={className}
      data-part="root"
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        color: inkColor,
        fontFamily,
        letterSpacing: "normal",
      }}
    >
      <div
        data-part="guides"
        style={{
          position: "absolute",
          inset: 0,
          opacity: state.guideOpacity,
          visibility: state.guideOpacity > 0 ? "visible" : "hidden",
        }}
      >
        {layout.guides.map((guide) =>
          guide.axis === "column" ? (
            <div
              key={guide.id}
              data-part="guide"
              style={{
                position: "absolute",
                left: guide.position,
                top: 0,
                width: layout.hairline,
                height: layout.height,
                background: inkColor,
                transform: `scaleY(${amount("columns")})`,
                transformOrigin: "center top",
              }}
            />
          ) : (
            <div
              key={guide.id}
              data-part="guide"
              style={{
                position: "absolute",
                left: 0,
                top: guide.position,
                width: layout.width,
                height: layout.hairline,
                background: inkColor,
                transform: `scaleX(${amount("baselines")})`,
                transformOrigin: "left center",
              }}
            />
          ),
        )}
      </div>
      <div data-part="spine" style={barStyle(state.spine.current, inkColor)} />
      <div
        data-part="square"
        style={barStyle(state.square.current, accentColor)}
      />
      {layout.kicker.map((line) => typeBlock(line, "kicker", 400, 0))}
      <div
        data-part="headline"
        style={{
          position: "absolute",
          left: headline.x,
          top: headline.top,
          width: "max-content",
        }}
      >
        <div
          data-part="heavy-rule"
          style={ruleStyle(
            heavyRule.y - headline.top,
            heavyRule.thickness,
            amount("heavy-rule"),
            inkColor,
          )}
        />
        {headline.lines.map((line, index) => (
          <div
            key={line.id}
            data-part="line"
            style={{
              position: "relative",
              width: "max-content",
              height: line.height,
            }}
          >
            <div style={bandStyle(line)}>
              {anchor(line)}
              <span style={typeStyle(line.size, 700, TRACK_HEADLINE)}>
                {line.words.map((word, order) => (
                  <Fragment key={word.id}>
                    {order > 0 ? " " : null}
                    <span
                      data-part="word"
                      style={{
                        display: "inline-block",
                        ...riseStyle(line.rise, amount(word.id)),
                      }}
                    >
                      {word.text}
                    </span>
                  </Fragment>
                ))}
              </span>
            </div>
            {index === last && thinRule.span === "line" ? (
              <div
                data-part="thin-rule"
                style={ruleStyle(
                  thinRule.y - line.top,
                  thinRule.thickness,
                  amount("thin-rule"),
                  inkColor,
                )}
              />
            ) : null}
          </div>
        ))}
      </div>
      {thinRule.span === "column" ? (
        <div
          data-part="column"
          style={{
            position: "absolute",
            left: thinRule.x,
            top: thinRule.y,
            width: layout.measure,
          }}
        >
          <div
            data-part="thin-rule"
            style={ruleStyle(
              0,
              thinRule.thickness,
              amount("thin-rule"),
              inkColor,
            )}
          />
        </div>
      ) : null}
      {layout.numeral
        ? typeBlock(layout.numeral, "numeral", 700, TRACK_NUMERAL)
        : null}
      {layout.meta.map((item) => typeBlock(item, "meta", 400, 0))}
    </div>
  );
}

export function SwissGrid({
  title,
  kicker = swissGridDefaults.kicker,
  number: numeral = swissGridDefaults.number,
  metaStart = swissGridDefaults.metaStart,
  metaEnd = swissGridDefaults.metaEnd,
  fontFamily = swissGridDefaults.fontFamily,
  inkColor = swissGridDefaults.inkColor,
  accentColor = swissGridDefaults.accentColor,
  modules = swissGridDefaults.modules,
  exit = swissGridDefaults.exit,
  speed = swissGridDefaults.speed,
  className,
}: SwissGridProps) {
  const frame = useCurrentFrame();
  const { width, height, fps, durationInFrames } = useVideoConfig();
  const scale = (30 / fps) * Math.max(0, finite(speed, 1));
  const state = getSwissGridState(frame * scale, {
    kicker,
    title,
    number: numeral,
    metaStart,
    metaEnd,
    modules,
    width,
    height,
    exitEnd: exit ? (durationInFrames - 1) * scale : null,
  });
  return renderSwissGrid(state, {
    fontFamily,
    inkColor,
    accentColor,
    className,
  });
}
