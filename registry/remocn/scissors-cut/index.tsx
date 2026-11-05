"use client";

import { loadFont } from "@remotion/google-fonts/Onest";
import { useLayoutEffect, useRef, useState } from "react";
import {
  AbsoluteFill,
  continueRender,
  delayRender,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const face = loadFont("normal", { weights: ["300"], subsets: ["latin"] });

export interface ScissorsCutProps {
  /** Text before the cut-out. Keep the trailing space. */
  before?: string;
  /** The words the scissors cut out. */
  cut?: string;
  /** Text after the cut-out. */
  after?: string;
  /** What slides into the gap. */
  replacement?: string;
  /** Scissor handles and the replacement word. */
  accent?: string;
  theme?: "dark" | "light";
  speed?: number;
}

const THEMES = {
  dark: {
    bg: "#0A0A0A",
    fg: "#F2F2F0",
    blade: "#D9D9D5",
    dash: "rgba(242,242,240,0.5)",
    edge: "rgba(242,242,240,0.62)",
  },
  light: {
    bg: "#FAFAF9",
    fg: "#0E0E0D",
    blade: "#3A3A37",
    dash: "rgba(14,14,13,0.45)",
    edge: "rgba(14,14,13,0.55)",
  },
} as const;

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_IN_OUT = Easing.bezier(0.65, 0, 0.35, 1);
const EASE_CUT = Easing.bezier(0.45, 0, 0.55, 1);
const EASE_IN = Easing.bezier(0.55, 0, 0.85, 0.35);
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// Beats, in frames at 30fps (before `speed`).
const IN = 0;
const IN_STAGGER = 1.5;
const ROOM = 14;
const ROOM_LEN = 20;
const DASH = 24;
const DASH_LEN = 24;
const SC_IN = 30;
const SC_IN_LEN = 24;
const CUT = 56;
const CUT_LEN = 62;
const SC_OUT = 120;
const SC_OUT_LEN = 22;
const LIFT = 120;
const LIFT_LEN = 8;
const FALL_LEN = 26;
const REFLOW = 142;
const REFLOW_LEN = 22;
const REPL = 152;
const REPL_LEN = 24;
const CLOSE = 180;
const CLOSE_LEN = 22;

const LINE_HEIGHT = 1.2;
/** Scissor blade length, in em. */
const SCISSORS = 1;
/** Travel per snip, in em. */
const SNIP = 0.5;

interface Row {
  xs: number[];
  ws: number[];
  w: number;
}

interface Layout {
  a: Row;
  b: Row;
  baseline: number;
}

function sameLayout(a: Layout | null, b: Layout) {
  return (
    a !== null &&
    a.a.xs.join() === b.a.xs.join() &&
    a.b.xs.join() === b.b.xs.join() &&
    a.baseline === b.baseline
  );
}

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Corner distances along the cut, which starts mid-way along the top edge and runs clockwise. */
function cornersOf(r: Rect) {
  return [r.w / 2, r.w / 2 + r.h, (3 * r.w) / 2 + r.h, (3 * r.w) / 2 + 2 * r.h];
}

/** Point at distance `s` along the cut. */
function along(r: Rect, s: number) {
  const P = 2 * (r.w + r.h);
  const d = (((s + r.w / 2) % P) + P) % P;
  if (d <= r.w) return { x: r.x + d, y: r.y };
  if (d <= r.w + r.h) return { x: r.x + r.w, y: r.y + (d - r.w) };
  if (d <= 2 * r.w + r.h)
    return { x: r.x + r.w - (d - r.w - r.h), y: r.y + r.h };
  return { x: r.x, y: r.y + r.h - (d - 2 * r.w - r.h) };
}

/** Points from `s0` to `s1` along the cut, corners included, as an SVG points list. */
function span(r: Rect, s0: number, s1: number) {
  const pts = [along(r, s0)];
  for (const c of cornersOf(r)) if (c > s0 && c < s1) pts.push(along(r, c));
  pts.push(along(r, s1));
  return pts.map((p) => `${p.x},${p.y}`).join(" ");
}

/** Heading (deg) that turns smoothly through each corner over `turn` px of travel. */
function heading(r: Rect, s: number, turn: number) {
  let a = 0;
  for (const c of cornersOf(r))
    a += 90 * EASE_IN_OUT(Math.max(0, Math.min(1, (s - c + turn / 2) / turn)));
  return a;
}

/** Flat scissors pointing along +x, pivot at the origin, blade length 1. */
function Scissors({
  open,
  blade,
  ring,
  bg,
}: {
  open: number;
  blade: string;
  ring: string;
  bg: string;
}) {
  const half = (sign: 1 | -1) => (
    <g transform={`rotate(${sign * open})`}>
      <path
        d={`M -0.12 ${0.02 * sign} C 0.2 ${0.11 * sign}, 0.68 ${0.07 * sign}, 1 0 L 0.05 ${-0.012 * sign} Z`}
        fill={blade}
      />
      <path
        d={`M -0.02 0 C -0.2 ${-0.02 * sign}, -0.34 ${-0.1 * sign}, -0.44 ${-0.17 * sign}`}
        fill="none"
        stroke={blade}
        strokeWidth={0.075}
        strokeLinecap="round"
      />
      <ellipse
        cx={-0.6}
        cy={-0.24 * sign}
        rx={0.17}
        ry={0.135}
        transform={`rotate(${-18 * sign} -0.6 ${-0.24 * sign})`}
        fill="none"
        stroke={ring}
        strokeWidth={0.07}
      />
    </g>
  );
  return (
    <>
      {half(1)}
      {half(-1)}
      <circle r={0.045} fill={bg} stroke={blade} strokeWidth={0.03} />
    </>
  );
}

export function ScissorsCut({
  before = "Launch ",
  cut = "next month",
  after = ".",
  replacement = "today",
  accent = "#3B5BFD",
  theme = "dark",
  speed = 1,
}: ScissorsCutProps) {
  const frame = useCurrentFrame() * speed;
  const { width, height } = useVideoConfig();
  const t = THEMES[theme];

  const em = Math.round(width * 0.08);
  const textStyle = {
    fontFamily: face.fontFamily,
    fontSize: em,
    fontWeight: 300,
    letterSpacing: "-0.035em",
    lineHeight: LINE_HEIGHT,
    whiteSpace: "pre",
  } as const;

  const pre = Array.from(before);
  const mid = Array.from(cut);
  const repl = Array.from(replacement);
  const post = Array.from(after);
  const rowA = [...pre, ...mid, ...post];
  const rowB = [...pre, ...repl, ...post];

  const aRef = useRef<HTMLDivElement>(null);
  const bRef = useRef<HTMLDivElement>(null);
  const baseRef = useRef<HTMLSpanElement>(null);
  const [layout, setLayout] = useState<Layout | null>(null);
  const [handle] = useState(() => delayRender("scissors-cut: measuring"));
  const released = useRef(false);

  // biome-ignore lint/correctness/useExhaustiveDependencies: re-measure when the copy or size changes
  useLayoutEffect(() => {
    let live = true;
    face
      .waitUntilDone()
      .catch(() => undefined)
      .then(() => document.fonts.ready)
      .then(() => {
        if (!live) return;
        const a = aRef.current;
        const b = bRef.current;
        const base = baseRef.current;
        if (a && b && base) {
          const read = (row: HTMLDivElement): Row => {
            const r = row.getBoundingClientRect();
            const scale = r.width / row.offsetWidth || 1;
            const spans = Array.from(row.querySelectorAll("[data-l]"));
            return {
              xs: spans.map(
                (el) => (el.getBoundingClientRect().left - r.left) / scale,
              ),
              ws: spans.map((el) => el.getBoundingClientRect().width / scale),
              w: row.offsetWidth,
            };
          };
          const next: Layout = {
            a: read(a),
            b: read(b),
            baseline: base.offsetTop,
          };
          setLayout((prev) => (sameLayout(prev, next) ? prev : next));
        }
        if (!released.current) {
          released.current = true;
          continueRender(handle);
        }
      });
    return () => {
      live = false;
    };
  }, [before, cut, after, replacement, em, handle]);

  const L = layout;
  const wA = L?.a.w ?? 0;
  const wB = L?.b.w ?? 0;
  const leftA = width / 2 - wA / 2;
  const leftB = width / 2 - wB / 2;
  const baseY = height / 2 + em * 0.3;
  const rowTop = baseY - (L?.baseline ?? em);

  const reflow = interpolate(frame, [REFLOW, REFLOW + REFLOW_LEN], [0, 1], {
    ...clamp,
    easing: EASE_IN_OUT,
  });

  const iA = pre.length;
  const iZ = pre.length + mid.length - 1;
  const jZ = pre.length + repl.length - 1;
  const ax = (i: number) => leftA + (L?.a.xs[i] ?? 0);
  const bx = (i: number) => leftB + (L?.b.xs[i] ?? 0);

  // Room: the neighbours step aside so the cut line has air, and close up
  // again once the new word is in.
  const padX = em * 0.14;
  const need = padX + em * 0.2;
  const room = (row: Row | undefined, chars: string[], end: number) => {
    if (!row) return { l: 0, r: 0, c: 0 };
    let k = iA - 1;
    while (k >= 0 && chars[k] === " ") k--;
    const gapL =
      k < 0 ? need : (row.xs[iA] ?? 0) - (row.xs[k] ?? 0) - (row.ws[k] ?? 0);
    const gapR =
      end + 1 >= chars.length
        ? need
        : (row.xs[end + 1] ?? 0) - (row.xs[end] ?? 0) - (row.ws[end] ?? 0);
    const l = Math.max(0, need - gapL);
    const r = Math.max(0, need - gapR);
    return { l, r, c: (r - l) / 2 };
  };
  const roomA = room(L?.a, rowA, iZ);
  const roomB = room(L?.b, rowB, jZ);
  const roomP =
    interpolate(frame, [ROOM, ROOM + ROOM_LEN], [0, 1], {
      ...clamp,
      easing: EASE_IN_OUT,
    }) *
    (1 -
      interpolate(frame, [CLOSE, CLOSE + CLOSE_LEN], [0, 1], {
        ...clamp,
        easing: EASE_IN_OUT,
      }));
  const lerpRoom = (pick: (r: { l: number; r: number; c: number }) => number) =>
    roomP * interpolate(reflow, [0, 1], [pick(roomA), pick(roomB)]);
  const preShift = lerpRoom((r) => -r.l - r.c);
  const postShift = lerpRoom((r) => r.r - r.c);
  const midShiftA = -roomA.c * roomP;
  const midShiftB = -roomB.c * roomP;

  // The slip around the cut-out, from cap height to just under the baseline.
  const slipA: Rect = {
    x: ax(iA) - padX + midShiftA,
    y: baseY - em * 0.98,
    w: ax(iZ) + (L?.a.ws[iZ] ?? 0) - ax(iA) + padX * 2,
    h: em * 1.26,
  };
  const slotB: Rect = {
    x: bx(iA) - padX + midShiftB,
    y: slipA.y,
    w: bx(jZ) + (L?.b.ws[jZ] ?? 0) - bx(iA) + padX * 2,
    h: slipA.h,
  };
  const P = 2 * (slipA.w + slipA.h);

  // Dashed cut line, drawn clockwise.
  const dashLen = em * 0.09;
  const dashGap = em * 0.075;
  const drawP = interpolate(frame, [DASH, DASH + DASH_LEN], [0, 1], {
    ...clamp,
    easing: EASE_OUT,
  });
  const cutP = interpolate(frame, [CUT, CUT + CUT_LEN], [0, 1], {
    ...clamp,
    easing: EASE_CUT,
  });
  const cutS = cutP * P;
  const dashes: { pts: string; k: number }[] = [];
  for (let s = 0, k = 0; s < P; s += dashLen + dashGap, k++) {
    if (s / P > drawP) break;
    if (s + dashLen < cutS) continue;
    dashes.push({
      pts: span(slipA, Math.max(s, cutS), Math.min(P, s + dashLen)),
      k,
    });
  }

  // Scissors: fly in to the top-left corner, cut once round, pull away.
  const turn = em * 0.5;
  const inP = interpolate(frame, [SC_IN, SC_IN + SC_IN_LEN], [0, 1], {
    ...clamp,
    easing: EASE_OUT,
  });
  const outP = interpolate(frame, [SC_OUT, SC_OUT + SC_OUT_LEN], [0, 1], {
    ...clamp,
    easing: EASE_IN,
  });
  const tip = along(slipA, cutS);
  let angle = heading(slipA, cutS, turn);
  let tipX = tip.x;
  let tipY = tip.y;
  if (frame < CUT) {
    tipX += -em * 2.4 * (1 - inP);
    tipY += -em * 0.9 * (1 - inP);
    angle = -24 * (1 - inP);
  }
  // On the way out the scissors carry on along the top edge and lift away.
  tipX += em * 1.8 * outP;
  tipY -= em * 1.3 * outP;
  angle -= 28 * outP;
  const S = SCISSORS * em;
  const pivotX = tipX - Math.cos((angle * Math.PI) / 180) * S * 0.22;
  const pivotY = tipY - Math.sin((angle * Math.PI) / 180) * S * 0.22;
  const travel = frame < CUT ? 0 : cutS;
  const snipping = frame >= CUT && frame <= CUT + CUT_LEN;
  const open = snipping
    ? 5 + 13 * (0.5 + 0.5 * Math.cos((2 * Math.PI * travel) / (SNIP * em)))
    : interpolate(frame, [SC_IN, SC_IN + 14], [3, 18], clamp) * (1 - outP) +
      3 * outP;
  const scOpacity =
    interpolate(frame, [SC_IN, SC_IN + 8], [0, 1], clamp) *
    (1 - interpolate(outP, [0.4, 1], [0, 1], clamp));

  // The cut slip lifts, then falls away and dissolves.
  const lift = interpolate(frame, [LIFT, LIFT + LIFT_LEN], [0, 1], {
    ...clamp,
    easing: EASE_OUT,
  });
  const fall = interpolate(
    frame,
    [LIFT + LIFT_LEN - 2, LIFT + LIFT_LEN - 2 + FALL_LEN],
    [0, 1],
    { ...clamp, easing: EASE_IN },
  );
  const slipDX = em * 0.35 * fall;
  const slipDY = -em * 0.1 * lift + em * 2.4 * fall;
  const slipRot = -1.5 * lift + 11 * fall;
  const slipOpacity = 1 - interpolate(fall, [0.35, 1], [0, 1], clamp);
  const slipBlur = interpolate(fall, [0.3, 1], [0, 9], clamp);

  // The slot the slip leaves: closes up to the new word, then fades.
  const slot: Rect = {
    x: interpolate(reflow, [0, 1], [slipA.x, slotB.x]),
    y: slipA.y,
    w: interpolate(reflow, [0, 1], [slipA.w, slotB.w]),
    h: slipA.h,
  };
  const slotOpacity =
    interpolate(frame, [LIFT, LIFT + 4], [0, 1], clamp) *
    (1 - interpolate(frame, [REPL + 6, REPL + REPL_LEN], [0, 1], clamp));
  const hair = Math.max(1.5, width / 720);
  const fadeIn = (i: number) =>
    interpolate(
      frame,
      [IN + i * IN_STAGGER, IN + i * IN_STAGGER + 18],
      [0, 1],
      {
        ...clamp,
        easing: EASE_OUT,
      },
    );
  const glyph = (
    ch: string,
    key: string,
    x: number,
    p: number,
    color: string,
    dy = 0,
  ) =>
    ch === " " ? null : (
      <span
        key={key}
        style={{
          ...textStyle,
          position: "absolute",
          left: x,
          top: rowTop,
          color,
          opacity: p,
          filter: p < 1 ? `blur(${(1 - p) * 8}px)` : undefined,
          transform: `translateY(${(1 - p) * em * 0.14 + dy}px)`,
        }}
      >
        {ch}
      </span>
    );

  const rectPath = (r: Rect) =>
    `M ${r.x + r.w / 2} ${r.y} H ${r.x + r.w} V ${r.y + r.h} H ${r.x} V ${r.y} Z`;
  const slipCx = slipA.x + slipA.w / 2;
  const slipCy = slipA.y + slipA.h / 2;

  return (
    <AbsoluteFill style={{ background: t.bg, overflow: "hidden" }}>
      {/* measuring rows: never shown */}
      <div style={{ position: "absolute", visibility: "hidden", top: 0 }}>
        <div ref={aRef} style={{ ...textStyle, display: "inline-block" }}>
          {rowA.map((ch, i) => (
            <span key={i} data-l="">
              {ch}
            </span>
          ))}
          <span
            ref={baseRef}
            style={{ display: "inline-block", width: 0, height: 0 }}
          />
        </div>
        <br />
        <div ref={bRef} style={{ ...textStyle, display: "inline-block" }}>
          {rowB.map((ch, i) => (
            <span key={i} data-l="">
              {ch}
            </span>
          ))}
        </div>
      </div>

      <div style={{ position: "absolute", inset: 0, opacity: L ? 1 : 0 }}>
        {/* the slot left behind */}
        <svg
          width={width}
          height={height}
          style={{ position: "absolute", inset: 0 }}
          aria-hidden
        >
          <path
            d={rectPath(slot)}
            fill="none"
            stroke={t.edge}
            strokeWidth={hair}
            strokeDasharray={`${dashLen} ${dashGap}`}
            opacity={slotOpacity * 0.7}
          />
        </svg>

        {pre.map((ch, i) =>
          glyph(
            ch,
            `p${i}`,
            interpolate(reflow, [0, 1], [ax(i), bx(i)]) + preShift,
            fadeIn(i),
            t.fg,
          ),
        )}
        {post.map((ch, i) =>
          glyph(
            ch,
            `q${i}`,
            interpolate(
              reflow,
              [0, 1],
              [
                ax(pre.length + mid.length + i),
                bx(pre.length + repl.length + i),
              ],
            ) + postShift,
            fadeIn(pre.length + mid.length + i),
            t.fg,
          ),
        )}
        {repl.map((ch, i) => {
          const p = interpolate(
            frame,
            [REPL + i * 2, REPL + i * 2 + REPL_LEN],
            [0, 1],
            { ...clamp, easing: EASE_OUT },
          );
          return glyph(
            ch,
            `r${i}`,
            bx(pre.length + i) + midShiftB,
            p,
            accent,
            (1 - p) * em * 0.3,
          );
        })}

        {/* the slip: cut-out words plus the edge cut so far */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: slipOpacity,
            filter: slipBlur > 0.05 ? `blur(${slipBlur}px)` : undefined,
            transformOrigin: `${slipCx}px ${slipCy}px`,
            transform: `translate(${slipDX}px, ${slipDY}px) rotate(${slipRot}deg)`,
          }}
        >
          <svg
            width={width}
            height={height}
            style={{ position: "absolute", inset: 0 }}
            aria-hidden
          >
            <path
              d={rectPath(slipA)}
              pathLength={1}
              fill="none"
              stroke={t.edge}
              strokeWidth={hair}
              strokeDasharray={`${cutP} 2`}
            />
          </svg>
          {mid.map((ch, i) =>
            glyph(ch, `m${i}`, ax(iA + i) + midShiftA, fadeIn(iA + i), t.fg),
          )}
        </div>

        <svg
          width={width}
          height={height}
          style={{ position: "absolute", inset: 0, overflow: "visible" }}
          aria-hidden
        >
          {dashes.map((d) => (
            <polyline
              key={d.k}
              points={d.pts}
              fill="none"
              stroke={t.dash}
              strokeWidth={hair}
            />
          ))}
          <g
            opacity={scOpacity}
            transform={`translate(${pivotX} ${pivotY}) rotate(${angle}) scale(${S})`}
          >
            <Scissors open={open} blade={t.blade} ring={accent} bg={t.bg} />
          </g>
        </svg>
      </div>
    </AbsoluteFill>
  );
}
