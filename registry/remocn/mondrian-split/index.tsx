"use client";

import { type CSSProperties, type ReactNode, useMemo } from "react";
import { Easing, random, useCurrentFrame, useVideoConfig } from "remotion";

export type MondrianSplitAxis = "x" | "y";
export type MondrianSplitSlot = "red" | "yellow" | "blue";
export type MondrianSplitSide = "left" | "top" | "right" | "bottom";

export interface MondrianSplitProps {
  children?: ReactNode;
  seed?: number;
  splits?: number;
  lineWeight?: number;
  expandCell?: number;
  lineColor?: string;
  redColor?: string;
  yellowColor?: string;
  blueColor?: string;
  fieldColor?: string;
  speed?: number;
  className?: string;
}

export type MondrianSplitOptions = Pick<
  MondrianSplitProps,
  "seed" | "splits" | "lineWeight" | "expandCell"
> & {
  width?: number;
  height?: number;
};

export interface MondrianSplitBox {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

export interface MondrianSplitRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface GridNode {
  box: MondrianSplitBox;
  bounds: Record<MondrianSplitSide, number>;
  line: number;
}

interface GridCut {
  axis: MondrianSplitAxis;
  position: number;
  node: number;
}

interface GridMove {
  track: number;
  from: number;
  to: number;
  start: number;
}

interface GridWipe {
  axis: MondrianSplitAxis;
  fromEnd: boolean;
}

export const mondrianSplitDefaults = {
  seed: 7,
  splits: 7,
  lineWeight: 14,
  expandCell: 0,
  lineColor: "#121212",
  redColor: "#d62d20",
  yellowColor: "#f4c20d",
  blueColor: "#1f4e9e",
  fieldColor: "#d62d20",
};

const LINE_START = 3;
const LINE_GAP = 5;
const LINE_DRAW = 10;
const FILL_LAG = 7;
const FILL_GAP = 4;
const FILL_WIPE = 9;
const FIELD_LAG = 6;
const FIELD_WIPE = 12;
const HOLD = 14;
const TRACK_COUNT = 3;
const TRACK_GAP = 5;
const TRACK_SLIDE = 20;
const EXPAND_LEAD = 4;
const SIDE_GAP = 3;
const SIDE_PUSH = 22;
const TAIL = 12;
const SLIDE_PEAK = 0.72;
const SLIDE_OVER = 0.035;
const RESERVE = 0.045;
const WIND = 0.22;
const DIP = 0.035;
const DIP_SHARE = 0.2;
const SIDES: MondrianSplitSide[] = ["left", "top", "right", "bottom"];
const SLOTS: MondrianSplitSlot[] = ["blue", "yellow", "red", "blue", "yellow"];
const FALLBACK_CUTS = [0.38, 0.62, 0.3, 0.7, 0.5];

const drawEase = Easing.bezier(0.16, 1, 0.3, 1);
const wipeEase = Easing.bezier(0.7, 0, 0.2, 1);
const riseEase = Easing.bezier(0.65, 0, 0.3, 1);
const settleEase = Easing.bezier(0.4, 0, 0.6, 1);
const windEase = Easing.bezier(0.45, 0, 0.55, 1);
const pushEase = Easing.poly(2.5);
const layer: CSSProperties = { position: "absolute", inset: 0 };

const finite = (value: number, fallback: number) =>
  Number.isFinite(value) ? value : fallback;
const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));
const mix = (from: number, to: number, amount: number) =>
  from + (to - from) * amount;
const progress = (time: number, start: number, duration: number) =>
  clamp((time - start) / duration, 0, 1);
const other = (axis: MondrianSplitAxis): MondrianSplitAxis =>
  axis === "x" ? "y" : "x";
const lowEdge = (box: MondrianSplitBox, axis: MondrianSplitAxis) =>
  axis === "x" ? box.x0 : box.y0;
const extent = (box: MondrianSplitBox, axis: MondrianSplitAxis) =>
  axis === "x" ? box.x1 - box.x0 : box.y1 - box.y0;
const area = (box: MondrianSplitBox) => extent(box, "x") * extent(box, "y");
const splitCount = (splits: number) =>
  Math.round(clamp(finite(splits, mondrianSplitDefaults.splits), 3, 12));
const coloredCount = (count: number) => clamp(Math.round(count * 0.3), 1, 5);

const touches = (a: MondrianSplitBox, b: MondrianSplitBox) => {
  const overlapX = Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0);
  const overlapY = Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0);
  const beside = Math.abs(a.x1 - b.x0) < 0.5 || Math.abs(b.x1 - a.x0) < 0.5;
  const stacked = Math.abs(a.y1 - b.y0) < 0.5 || Math.abs(b.y1 - a.y0) < 0.5;
  return (beside && overlapY > 0.5) || (stacked && overlapX > 0.5);
};

const choose = (weights: readonly number[], roll: number) => {
  let remaining = roll * weights.reduce((sum, value) => sum + value, 0);
  for (let index = 0; index < weights.length; index++) {
    remaining -= weights[index];
    if (remaining <= 0) return index;
  }
  return weights.length - 1;
};

const slide = (amount: number) => {
  if (amount >= 1) return 1;
  if (amount <= SLIDE_PEAK) {
    return (1 + SLIDE_OVER) * riseEase(amount / SLIDE_PEAK);
  }
  const settle = settleEase((amount - SLIDE_PEAK) / (1 - SLIDE_PEAK));
  return mix(1 + SLIDE_OVER, 1, settle);
};

const push = (amount: number, dip: number) => {
  if (amount >= 1) return 1;
  if (amount <= 0) return 0;
  if (amount < WIND) return -dip * windEase(amount / WIND);
  return mix(-dip, 1, pushEase((amount - WIND) / (1 - WIND)));
};

const stretch = (
  from0: number,
  from1: number,
  to0: number,
  to1: number,
  min: number,
  max: number,
) => {
  if (from0 === to0 && from1 === to1) return (value: number) => value;
  return (value: number) => {
    if (value <= from0) {
      return min + (value - min) * ((to0 - min) / (from0 - min));
    }
    if (value >= from1) {
      return max - (max - value) * ((max - to1) / (max - from1));
    }
    return to0 + (value - from0) * ((to1 - to0) / (from1 - from0));
  };
};

const wipe = (
  box: MondrianSplitBox,
  { axis, fromEnd }: GridWipe,
  amount: number,
): MondrianSplitRect => {
  const width = box.x1 - box.x0;
  const height = box.y1 - box.y0;
  if (axis === "x") {
    const span = width * amount;
    return {
      x: fromEnd ? box.x1 - span : box.x0,
      y: box.y0,
      width: span,
      height,
    };
  }
  const span = height * amount;
  return {
    x: box.x0,
    y: fromEnd ? box.y1 - span : box.y0,
    width,
    height: span,
  };
};

const inFrame = (rect: MondrianSplitRect, width: number, height: number) =>
  rect.width > 0.01 &&
  rect.height > 0.01 &&
  rect.x < width &&
  rect.y < height &&
  rect.x + rect.width > 0 &&
  rect.y + rect.height > 0;

const placeBoxes = (
  cuts: readonly Pick<GridCut, "axis" | "node">[],
  positions: readonly number[],
  width: number,
  height: number,
) => {
  const boxes: MondrianSplitBox[] = [{ x0: 0, y0: 0, x1: width, y1: height }];
  for (let id = 0; id < cuts.length; id++) {
    const { axis, node } = cuts[id];
    const box = boxes[node];
    const at = positions[id];
    boxes.push(
      axis === "x" ? { ...box, x1: at } : { ...box, y1: at },
      axis === "x" ? { ...box, x0: at } : { ...box, y0: at },
    );
  }
  return boxes;
};

const percent = (value: number, size: number) =>
  `${(clamp(value / size, 0, 1) * 100).toFixed(4)}%`;

export function getMondrianSplitTimeline({
  splits = mondrianSplitDefaults.splits,
}: Pick<MondrianSplitProps, "splits"> = {}) {
  const count = splitCount(splits);
  const fill = LINE_START + (count - 1) * LINE_GAP + FILL_LAG;
  const field = fill + (coloredCount(count) - 1) * FILL_GAP + FIELD_LAG;
  const reflow = field + FIELD_WIPE + HOLD;
  const settled = reflow + (TRACK_COUNT - 1) * TRACK_GAP + TRACK_SLIDE;
  const expand = settled - EXPAND_LEAD;
  const end = expand + (SIDES.length - 1) * SIDE_GAP + SIDE_PUSH;
  return { lines: LINE_START, fill, field, reflow, expand, end };
}

export const mondrianSplitLength = getMondrianSplitTimeline().end;

export function getMondrianSplitDuration({
  speed = 1,
  splits = mondrianSplitDefaults.splits,
}: Pick<MondrianSplitProps, "speed" | "splits"> = {}) {
  const rate = Math.max(0, finite(speed, 1));
  const frames = getMondrianSplitTimeline({ splits }).end + TAIL;
  return rate === 0 ? 1 : Math.max(1, Math.ceil(frames / rate));
}

export function getMondrianSplitLayout({
  seed = mondrianSplitDefaults.seed,
  splits = mondrianSplitDefaults.splits,
  lineWeight = mondrianSplitDefaults.lineWeight,
  expandCell = mondrianSplitDefaults.expandCell,
  width = 1280,
  height = 720,
}: MondrianSplitOptions = {}) {
  const w = Math.max(1, finite(width, 1280));
  const h = Math.max(1, finite(height, 720));
  const short = Math.min(w, h);
  const weight = clamp(finite(lineWeight, 14), 2, 48) * (short / 720);
  const count = splitCount(splits);
  const timeline = getMondrianSplitTimeline({ splits: count });
  const salt = Math.round(finite(seed, mondrianSplitDefaults.seed));
  const roll = (name: string) => random(`mondrian-split-${salt}-${name}`);
  const minSide = Math.max(short * 0.1, weight * 3);
  const snap = short * 0.045;
  const align = short * 0.075;
  const gap = Math.max(short * 0.07, weight * 2.5);
  const minMove = short * 0.06;
  const overscan = weight + short * 0.04;
  const nodes: GridNode[] = [
    {
      box: { x0: 0, y0: 0, x1: w, y1: h },
      bounds: { left: -1, top: -1, right: -1, bottom: -1 },
      line: -1,
    },
  ];
  const cuts: GridCut[] = [];

  const lean = (
    box: MondrianSplitBox,
    ratio: number,
    name: string,
  ): MondrianSplitAxis => {
    const wide = extent(box, "x");
    const tall = extent(box, "y");
    if (wide > tall * ratio) return "x";
    if (tall > wide * ratio) return "y";
    return roll(name) < 0.5 ? "x" : "y";
  };

  const cut = (node: number, axis: MondrianSplitAxis, position: number) => {
    const id = cuts.length;
    const { box, bounds: edges } = nodes[node];
    const vertical = axis === "x";
    nodes[node].line = id;
    cuts.push({ axis, position, node });
    nodes.push(
      {
        box: vertical ? { ...box, x1: position } : { ...box, y1: position },
        bounds: vertical ? { ...edges, right: id } : { ...edges, bottom: id },
        line: -1,
      },
      {
        box: vertical ? { ...box, x0: position } : { ...box, y0: position },
        bounds: vertical ? { ...edges, left: id } : { ...edges, top: id },
        line: -1,
      },
    );
  };

  const snapTo = (axis: MondrianSplitAxis, position: number) => {
    let best = position;
    let distance = snap;
    for (const line of cuts) {
      const offset = Math.abs(line.position - position);
      if (line.axis === axis && offset < distance) {
        best = line.position;
        distance = offset;
      }
    }
    return best;
  };

  const nearMiss = (axis: MondrianSplitAxis, position: number) =>
    cuts.some(
      (line) =>
        line.axis === axis &&
        line.position !== position &&
        Math.abs(line.position - position) < snap,
    );

  const tryCut = (
    node: number,
    axis: MondrianSplitAxis,
    fraction: number,
    strict: boolean,
  ) => {
    const { box } = nodes[node];
    const low = lowEdge(box, axis);
    const length = extent(box, axis);
    if (length < minSide * 2) return false;
    const position = clamp(
      snapTo(axis, low + length * fraction),
      low + minSide,
      low + length - minSide,
    );
    if (strict && nearMiss(axis, position)) return false;
    cut(node, axis, position);
    return true;
  };

  let anchor = -1;
  const longAxis = lean(nodes[0].box, 1.05, "square");
  const rootAxis = roll("root-axis") < 0.75 ? longAxis : other(longAxis);
  const rootFraction =
    roll("root-side") < 0.5
      ? mix(0.3, 0.4, roll("root-at"))
      : mix(0.6, 0.7, roll("root-at"));
  if (tryCut(0, rootAxis, rootFraction, false)) {
    const share = mix(0.6, 0.76, roll("anchor-at"));
    const anchorLow = roll("anchor-side") < 0.5;
    const big = rootFraction < 0.5 ? 2 : 1;
    if (tryCut(big, other(rootAxis), anchorLow ? share : 1 - share, false)) {
      anchor = anchorLow ? nodes.length - 2 : nodes.length - 1;
    }
  }

  const splittable = (index: number) => {
    const { box, line } = nodes[index];
    return (
      line === -1 &&
      index !== anchor &&
      Math.max(extent(box, "x"), extent(box, "y")) >= minSide * 2
    );
  };

  const budget = count * 24;
  for (let attempt = 0; cuts.length < count && attempt < budget; attempt++) {
    const tag = `${cuts.length}-${attempt}`;
    const pool = nodes.flatMap((_, index) =>
      splittable(index) ? [index] : [],
    );
    if (pool.length === 0) break;
    const weights = pool.map((index) => area(nodes[index].box) ** 1.2);
    const node = pool[choose(weights, roll(`${tag}-cell`))];
    const { box } = nodes[node];
    const preferred = lean(box, 1.25, `${tag}-axis`);
    const fits = extent(box, preferred) >= minSide * 2;
    const at = roll(`${tag}-at`);
    const fraction = at < 0.5 ? 0.28 + at * 0.34 : 0.55 + (at - 0.5) * 0.34;
    tryCut(node, fits ? preferred : other(preferred), fraction, true);
  }

  const byPriority = (a: number, b: number) =>
    Number(a === anchor) - Number(b === anchor) ||
    area(nodes[b].box) - area(nodes[a].box);
  const fallback = () => {
    const pool = nodes.flatMap((node, index) =>
      node.line === -1 ? [index] : [],
    );
    pool.sort(byPriority);
    for (const strict of [true, false]) {
      for (const node of pool) {
        const { box } = nodes[node];
        const first: MondrianSplitAxis =
          extent(box, "x") >= extent(box, "y") ? "x" : "y";
        for (const axis of [first, other(first)]) {
          for (const fraction of FALLBACK_CUTS) {
            if (tryCut(node, axis, fraction, strict)) return true;
          }
        }
      }
    }
    return false;
  };
  while (cuts.length < count) {
    if (!fallback()) break;
  }

  const trackKeys: string[] = [];
  const lines = cuts.map((draft, id) => {
    const key = `${draft.axis}:${draft.position}`;
    if (!trackKeys.includes(key)) trackKeys.push(key);
    const { bounds } = nodes[draft.node];
    const vertical = draft.axis === "x";
    const near = vertical ? bounds.top : bounds.left;
    const far = vertical ? bounds.bottom : bounds.right;
    return {
      id,
      axis: draft.axis,
      position: draft.position,
      node: draft.node,
      track: trackKeys.indexOf(key),
      lowBound: vertical ? bounds.left : bounds.top,
      highBound: vertical ? bounds.right : bounds.bottom,
      fromEnd: near === far ? roll(`draw-${id}`) < 0.5 : far < near,
      start: LINE_START + id * LINE_GAP,
    };
  });

  const leaves = nodes.flatMap((node, index) =>
    node.line === -1 ? [index] : [],
  );
  const ranked = [...leaves].sort(
    (a, b) => area(nodes[b].box) - area(nodes[a].box) || a - b,
  );
  const pick = clamp(Math.round(finite(expandCell, 0)), 0, ranked.length - 1);
  const target = ranked[pick];
  const targetBox = nodes[target].box;

  const others = leaves.filter((index) => index !== target);
  const largest = Math.max(1, ...others.map((index) => area(nodes[index].box)));
  const candidates = others
    .map((index) => ({
      index,
      score:
        roll(`fill-${index}`) +
        (touches(nodes[index].box, targetBox) ? 0.45 : 0) +
        (0.3 * area(nodes[index].box)) / largest,
    }))
    .sort((a, b) => a.score - b.score);
  const painted: { index: number; slot: MondrianSplitSlot }[] = [];
  const quota = Math.min(coloredCount(count), candidates.length);
  for (let order = 0; order < quota; order++) {
    const slot = SLOTS[order];
    const free = candidates.filter(
      ({ index }) => !painted.some((cell) => cell.index === index),
    );
    const clean = free.find(
      ({ index }) =>
        !painted.some(
          (cell) =>
            cell.slot === slot &&
            touches(nodes[cell.index].box, nodes[index].box),
        ) &&
        !(slot === "red" && touches(nodes[index].box, targetBox)),
    );
    const choice = clean ?? free[0];
    if (choice) painted.push({ index: choice.index, slot });
  }

  const wipeOf = (index: number): GridWipe => {
    const { box } = nodes[index];
    const axis = extent(box, "x") >= extent(box, "y") ? "x" : "y";
    const middle = axis === "x" ? box.x0 + box.x1 : box.y0 + box.y1;
    return { axis, fromEnd: middle < (axis === "x" ? w : h) };
  };
  const diagonal = (index: number) => {
    const { box } = nodes[index];
    return (box.x0 + box.x1) / w + (box.y0 + box.y1) / h;
  };
  const fills = [...painted]
    .sort((a, b) => diagonal(a.index) - diagonal(b.index))
    .map((cell, order) => ({
      node: cell.index,
      slot: cell.slot,
      ...wipeOf(cell.index),
      start: timeline.fill + order * FILL_GAP,
    }));
  const field = { node: target, ...wipeOf(target), start: timeline.field };

  const tracks = trackKeys.map((_, track) => {
    const members = lines.filter((line) => line.track === track);
    return {
      track,
      axis: members[0].axis,
      position: members[0].position,
      length: members.reduce(
        (sum, line) => sum + extent(nodes[line.node].box, other(line.axis)),
        0,
      ),
    };
  });
  const reserveLow = lines.map((line) => line.position);
  const reserveHigh = lines.map((line) => line.position);
  const limits = (track: number) => {
    let low = Number.NEGATIVE_INFINITY;
    let high = Number.POSITIVE_INFINITY;
    for (const line of lines) {
      if (line.track === track) {
        const size = line.axis === "x" ? w : h;
        const floor = line.lowBound === -1 ? 0 : reserveHigh[line.lowBound];
        const ceiling =
          line.highBound === -1 ? size : reserveLow[line.highBound];
        low = Math.max(low, floor + gap);
        high = Math.min(high, ceiling - gap);
      } else {
        if (line.lowBound !== -1 && lines[line.lowBound].track === track) {
          high = Math.min(high, reserveLow[line.id] - gap);
        }
        if (line.highBound !== -1 && lines[line.highBound].track === track) {
          low = Math.max(low, reserveHigh[line.id] + gap);
        }
      }
    }
    return { low, high };
  };
  const moves: GridMove[] = [];
  const settledAt = (track: number, position: number) =>
    moves.find((move) => move.track === track)?.to ?? position;
  const borders = (side: MondrianSplitSide, track: number) => {
    const id = nodes[target].bounds[side];
    return id !== -1 && lines[id].track === track;
  };
  const inward = (track: number) => {
    if (borders("left", track) || borders("top", track)) return 1;
    if (borders("right", track) || borders("bottom", track)) return -1;
    return 0;
  };
  const heading = (track: number, down: number, up: number) => {
    const squeeze = inward(track);
    if (squeeze !== 0) {
      return (squeeze > 0 ? up : down) >= minMove ? squeeze : 0;
    }
    if (down < minMove) return up >= minMove ? 1 : 0;
    if (up < minMove) return -1;
    return roll(`track-way-${track}`) < up / (up + down) ? 1 : -1;
  };
  const order = tracks
    .map((track) => ({
      ...track,
      weight: track.length * (0.6 + 0.8 * roll(`track-${track.track}`)),
    }))
    .sort((a, b) => b.weight - a.weight);
  for (const track of order) {
    if (moves.length >= TRACK_COUNT) break;
    const { low, high } = limits(track.track);
    const down = (track.position - low) / (1 + RESERVE);
    const up = (high - track.position) / (1 + RESERVE);
    const direction = heading(track.track, down, up);
    if (direction === 0) continue;
    const span = track.axis === "x" ? w : h;
    const room = Math.min(direction > 0 ? up : down, span * 0.2);
    const stride = mix(0.6, 0.95, roll(`track-far-${track.track}`));
    const reach = track.position + direction * Math.max(minMove, room * stride);
    const nearest = tracks
      .filter((rival) => rival.axis === track.axis)
      .filter((rival) => rival.track !== track.track)
      .map((rival) => settledAt(rival.track, rival.position))
      .reduce(
        (best, position) =>
          Math.abs(position - reach) < Math.abs(best - reach) ? position : best,
        Number.POSITIVE_INFINITY,
      );
    const to = Math.abs(nearest - reach) < align ? nearest : reach;
    const margin = Math.abs(to - track.position) * RESERVE;
    if (
      Math.abs(to - track.position) < minMove ||
      to - margin < low ||
      to + margin > high
    ) {
      continue;
    }
    for (const line of lines) {
      if (line.track === track.track) {
        reserveLow[line.id] = Math.min(track.position, to) - margin;
        reserveHigh[line.id] = Math.max(track.position, to) + margin;
      }
    }
    moves.push({
      track: track.track,
      from: track.position,
      to,
      start: timeline.reflow + moves.length * TRACK_GAP,
    });
  }

  const settled = lines.map((line) => settledAt(line.track, line.position));
  const home = placeBoxes(lines, settled, w, h)[target];
  const travel: Record<MondrianSplitSide, number> = {
    left: home.x0 + overscan,
    top: home.y0 + overscan,
    right: w + overscan - home.x1,
    bottom: h + overscan - home.y1,
  };
  const ranking = [...SIDES].sort((a, b) => travel[a] - travel[b]);
  const side = (name: MondrianSplitSide) => {
    const across = name === "left" || name === "right" ? "x" : "y";
    const share = (extent(home, across) * DIP_SHARE) / travel[name];
    return {
      start: timeline.expand + ranking.indexOf(name) * SIDE_GAP,
      dip: nodes[target].bounds[name] === -1 ? 0 : Math.min(DIP, share),
    };
  };

  return {
    width: w,
    height: h,
    weight,
    minSide,
    gap,
    minMove,
    align,
    overscan,
    timeline,
    nodes,
    lines,
    leaves,
    target,
    fills,
    field,
    moves,
    sides: {
      left: side("left"),
      top: side("top"),
      right: side("right"),
      bottom: side("bottom"),
    },
  };
}

export type MondrianSplitLayout = ReturnType<typeof getMondrianSplitLayout>;

export function getMondrianSplitState(
  frame: number,
  layout: MondrianSplitLayout = getMondrianSplitLayout(),
) {
  const time = Math.max(0, finite(frame, 0));
  const { width, height, weight, overscan } = layout;
  const positions = layout.lines.map((line) => {
    const move = layout.moves.find((item) => item.track === line.track);
    if (!move) return line.position;
    const amount = slide(progress(time, move.start, TRACK_SLIDE));
    return line.position + (move.to - move.from) * amount;
  });
  const boxes = placeBoxes(layout.lines, positions, width, height);
  const home = boxes[layout.target];
  const reach = (name: MondrianSplitSide) => {
    const { start, dip } = layout.sides[name];
    return push(progress(time, start, SIDE_PUSH), dip);
  };
  const mapX = stretch(
    home.x0,
    home.x1,
    mix(home.x0, -overscan, reach("left")),
    mix(home.x1, width + overscan, reach("right")),
    -overscan,
    width + overscan,
  );
  const mapY = stretch(
    home.y0,
    home.y1,
    mix(home.y0, -overscan, reach("top")),
    mix(home.y1, height + overscan, reach("bottom")),
    -overscan,
    height + overscan,
  );
  const project = (box: MondrianSplitBox): MondrianSplitBox => ({
    x0: mapX(box.x0),
    y0: mapY(box.y0),
    x1: mapX(box.x1),
    y1: mapY(box.y1),
  });

  const lines = layout.lines.flatMap((line) => {
    const drawn = drawEase(progress(time, line.start, LINE_DRAW));
    if (drawn <= 0) return [];
    const box = boxes[line.node];
    const vertical = line.axis === "x";
    const low = vertical ? box.y0 : box.x0;
    const high = vertical ? box.y1 : box.x1;
    const along = vertical ? mapY : mapX;
    const start = along(line.fromEnd ? high - (high - low) * drawn : low);
    const end = along(line.fromEnd ? high : low + (high - low) * drawn);
    const position = (vertical ? mapX : mapY)(positions[line.id]);
    const half = weight / 2;
    const length = end - start;
    const rect: MondrianSplitRect = vertical
      ? { x: position - half, y: start, width: weight, height: length }
      : { x: start, y: position - half, width: length, height: weight };
    return inFrame(rect, width, height)
      ? [{ id: line.id, axis: line.axis, position, drawn, ...rect }]
      : [];
  });

  const fills = layout.fills.flatMap((fill) => {
    const amount = wipeEase(progress(time, fill.start, FILL_WIPE));
    if (amount <= 0) return [];
    const rect = wipe(project(boxes[fill.node]), fill, amount);
    return inFrame(rect, width, height)
      ? [{ id: fill.node, slot: fill.slot, ...rect }]
      : [];
  });

  const reveal = wipeEase(progress(time, layout.field.start, FIELD_WIPE));
  const field = reveal > 0 ? wipe(project(home), layout.field, reveal) : null;

  return {
    time,
    lines,
    fills,
    field: field && inFrame(field, width, height) ? field : null,
    cells: layout.leaves.map((id) => ({ id, ...project(boxes[id]) })),
  };
}

export type MondrianSplitState = ReturnType<typeof getMondrianSplitState>;

export function getMondrianSplitClip(
  field: MondrianSplitRect | null,
  width: number,
  height: number,
) {
  if (!field) return "inset(50%)";
  const top = percent(field.y, height);
  const right = percent(width - field.x - field.width, width);
  const bottom = percent(height - field.y - field.height, height);
  const left = percent(field.x, width);
  return `inset(${top} ${right} ${bottom} ${left})`;
}

export function MondrianSplit({
  children,
  seed = mondrianSplitDefaults.seed,
  splits = mondrianSplitDefaults.splits,
  lineWeight = mondrianSplitDefaults.lineWeight,
  expandCell = mondrianSplitDefaults.expandCell,
  lineColor = mondrianSplitDefaults.lineColor,
  redColor = mondrianSplitDefaults.redColor,
  yellowColor = mondrianSplitDefaults.yellowColor,
  blueColor = mondrianSplitDefaults.blueColor,
  fieldColor = mondrianSplitDefaults.fieldColor,
  speed = 1,
  className,
}: MondrianSplitProps) {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const layout = useMemo(
    () =>
      getMondrianSplitLayout({
        seed,
        splits,
        lineWeight,
        expandCell,
        width,
        height,
      }),
    [seed, splits, lineWeight, expandCell, width, height],
  );
  const time = frame * (30 / fps) * Math.max(0, finite(speed, 1));
  const state = getMondrianSplitState(time, layout);
  const palette: Record<MondrianSplitSlot, string> = {
    red: redColor,
    yellow: yellowColor,
    blue: blueColor,
  };
  const viewBox = `0 0 ${width} ${height}`;

  return (
    <div
      className={className}
      style={{ position: "absolute", inset: 0, overflow: "hidden" }}
    >
      <svg
        width="100%"
        height="100%"
        viewBox={viewBox}
        preserveAspectRatio="none"
        aria-hidden="true"
        style={layer}
      >
        {state.fills.map((fill) => (
          <rect
            key={fill.id}
            x={fill.x}
            y={fill.y}
            width={fill.width}
            height={fill.height}
            fill={palette[fill.slot]}
          />
        ))}
        {state.field ? (
          <rect
            x={state.field.x}
            y={state.field.y}
            width={state.field.width}
            height={state.field.height}
            fill={fieldColor}
          />
        ) : null}
      </svg>
      {children == null ? null : (
        <div
          style={{
            ...layer,
            clipPath: getMondrianSplitClip(state.field, width, height),
          }}
        >
          {children}
        </div>
      )}
      <svg
        width="100%"
        height="100%"
        viewBox={viewBox}
        preserveAspectRatio="none"
        role="img"
        aria-label="De Stijl grid"
        style={layer}
      >
        {state.lines.map((line) => (
          <rect
            key={line.id}
            x={line.x}
            y={line.y}
            width={line.width}
            height={line.height}
            fill={lineColor}
          />
        ))}
      </svg>
    </div>
  );
}
