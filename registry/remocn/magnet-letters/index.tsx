"use client";

import { loadFont } from "@remotion/google-fonts/Figtree";
import type React from "react";
import { useLayoutEffect, useRef, useState } from "react";
import {
  AbsoluteFill,
  continueRender,
  delayRender,
  Easing,
  interpolate,
} from "remotion";
import { useSceneConfig, useSceneFrame } from "@/lib/remocn/frame-rate";
import { useGlide } from "@/lib/remocn/glide";
import { type Timing, useTimeline } from "@/lib/remocn/timeline";
import {
  DEFAULT_WORD,
  type MagnetLettersElementId,
  magnetLettersTimeline,
} from "./timeline";

const face = loadFont("normal", { weights: ["400"], subsets: ["latin"] });

export interface MagnetLettersProps {
  /** Text before the word that gets swapped. Keep the trailing space. */
  before?: string;
  /** The right word. It drops in once the wrong one is repelled. */
  word?: string;
  /** Text after the swapped word. */
  after?: string;
  /** The wrong word the magnet pulls into line first, then repels. */
  wrongWord?: string;
  /** Magnet body, landing ticks and the right word. */
  accent?: string;
  /** Frames between letters of the right word dropping in. */
  stagger?: number;
  /** Text color; overrides the theme ink. */
  ink?: string;
  /** Background fill; "transparent" drops it. */
  background?: string;
  /** Typeface for the line. Load it yourself; Figtree by default. */
  fontFamily?: string;
  /** Size of the line and magnet, around the frame's center. */
  scale?: number;
  /** Frames to hold the first frame before anything moves. */
  delay?: number;
  theme?: "dark" | "light";
  speed?: number;
  /**
   * Moves, trims or stretches the magnet's moves, the flips, the repel, the
   * reflow and single letters of the right word dropping in, by the ids in
   * `./timeline`. Frames on the scene timeline, after `delay` and `speed`.
   */
  timing?: Timing<MagnetLettersElementId>;
}

const THEMES = {
  light: {
    bg: "#FAFAF9",
    fg: "#0E0E0D",
    tipA: "#C9C9C4",
    tipB: "#8F8F8A",
  },
  dark: {
    bg: "#0A0A0A",
    fg: "#F2F2F0",
    tipA: "#DCDCD8",
    tipB: "#8A8A86",
  },
} as const;

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_IN_OUT = Easing.bezier(0.65, 0, 0.35, 1);
const EASE_SWEEP = Easing.bezier(0.45, 0, 0.4, 1);
const EASE_PULL = Easing.bezier(0.55, 0, 0.9, 0.5);
const EASE_EXIT = Easing.bezier(0.55, 0, 0.8, 0.4);
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const LINE_HEIGHT = 1.2;

interface Row {
  xs: number[];
  ws: number[];
  w: number;
}

interface Layout {
  a: Row;
  b: Row;
  baseline: number;
  rowH: number;
}

type Kind = "pre" | "wrong" | "right" | "post";

interface Item {
  ch: string;
  kind: Kind;
  /** Index in the wrong row, or -1. */
  ia: number;
  /** Index in the right row, or -1. */
  ib: number;
  /** Index inside its own word, for staggers. */
  k: number;
  n: number;
}

/** Deterministic 0..1 noise. */
function hash(n: number) {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
}

function sameLayout(a: Layout | null, b: Layout) {
  return (
    a !== null &&
    a.a.xs.join() === b.a.xs.join() &&
    a.b.xs.join() === b.b.xs.join() &&
    a.baseline === b.baseline
  );
}

/** Flat horseshoe magnet, poles up, centred on x = 0, top of the poles at y = 0. */
function Magnet({
  size,
  body,
  tipA,
  tipB,
}: {
  size: number;
  body: string;
  tipA: string;
  tipB: string;
}) {
  const T = 0.2 * size;
  const r = 0.22 * size;
  const tip = 0.15 * size;
  const arm = 0.2 * size;
  const w = 2 * r + T;
  const h = tip + arm + r + T / 2;
  return (
    <svg
      viewBox={`${-w / 2} 0 ${w} ${h}`}
      width={w}
      height={h}
      style={{ display: "block", overflow: "visible" }}
      aria-hidden
    >
      <path
        d={`M ${-r} ${tip - 0.5} L ${-r} ${tip + arm} A ${r} ${r} 0 0 0 ${r} ${tip + arm} L ${r} ${tip - 0.5}`}
        fill="none"
        stroke={body}
        strokeWidth={T}
      />
      <rect x={-r - T / 2} y={0} width={T} height={tip} fill={tipA} />
      <rect x={r - T / 2} y={0} width={T} height={tip} fill={tipB} />
    </svg>
  );
}

/** The foreground at `scale`, around the frame's center; nothing extra at 1. */
function ScaleLayer({
  scale,
  children,
}: {
  scale: number;
  children: React.ReactNode;
}) {
  if (scale === 1) return children;
  return (
    <AbsoluteFill style={{ transform: `scale(${scale})` }}>
      {children}
    </AbsoluteFill>
  );
}

export function MagnetLetters(props: MagnetLettersProps) {
  const {
    before = "Launch ",
    word = DEFAULT_WORD,
    after = ", in code.",
    wrongWord = "slides",
    accent = "#3B5BFD",
    ink,
    background,
    fontFamily = face.fontFamily,
    scale = 1,
    delay = 0,
    theme = "dark",
    speed = 1,
    timing,
  } = props;
  const glide = useGlide();
  const frame = Math.max(0, useSceneFrame() - delay) * speed;
  const { width, height, durationInFrames } = useSceneConfig();
  const tl = useTimeline(
    magnetLettersTimeline,
    props,
    durationInFrames * speed,
    timing,
  );
  const eScatter = tl.get("scatter");
  const eEnter = tl.get("enter");
  const eSweep = tl.get("sweep");
  const eReturn = tl.get("return");
  const eFlip = tl.get("flip");
  const eRepel = tl.get("repel");
  const eReflow = tl.get("reflow");
  const eUnflip = tl.get("unflip");
  const eExit = tl.get("exit");
  const SNAP = eSweep.beat("snap");
  const t = THEMES[theme];
  const fg = ink ?? t.fg;

  const em = Math.round(width * 0.07);
  const textStyle = {
    fontFamily,
    fontSize: em,
    fontWeight: 400,
    letterSpacing: "-0.03em",
    lineHeight: LINE_HEIGHT,
    whiteSpace: "pre",
  } as const;

  const pre = Array.from(before);
  const wrong = Array.from(wrongWord);
  const right = Array.from(word);
  const post = Array.from(after);
  const rowA = [...pre, ...wrong, ...post];
  const rowB = [...pre, ...right, ...post];

  const aRef = useRef<HTMLDivElement>(null);
  const bRef = useRef<HTMLDivElement>(null);
  const baseRef = useRef<HTMLSpanElement>(null);
  const [layout, setLayout] = useState<Layout | null>(null);
  const [handle] = useState(() => delayRender("magnet-letters: measuring"));
  const released = useRef(false);

  // biome-ignore lint/correctness/useExhaustiveDependencies: re-measure when the copy or size changes
  useLayoutEffect(() => {
    let live = true;
    face
      .waitUntilDone()
      .catch(() => undefined)
      .then(() => document.fonts.load(`400 100px "${fontFamily}"`))
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
            rowH: a.offsetHeight,
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
  }, [before, word, after, wrongWord, em, fontFamily, handle]);

  const L = layout;
  const wA = L?.a.w ?? 0;
  const wB = L?.b.w ?? 0;
  const leftA = width / 2 - wA / 2;
  const leftB = width / 2 - wB / 2;
  const baseY = height / 2 + em * 0.2;
  const rowTop = baseY - (L?.baseline ?? em);

  const ax = (i: number) => leftA + (L?.a.xs[i] ?? 0);
  const bx = (i: number) => leftB + (L?.b.xs[i] ?? 0);
  const acx = (i: number) => ax(i) + (L?.a.ws[i] ?? 0) / 2;
  const bcx = (i: number) => bx(i) + (L?.b.ws[i] ?? 0) / 2;

  const items: Item[] = [];
  const push = (ch: string, kind: Kind, ia: number, ib: number, k: number) =>
    items.push({ ch, kind, ia, ib, k, n: items.length });
  pre.forEach((ch, i) => {
    push(ch, "pre", i, i, i);
  });
  wrong.forEach((ch, i) => {
    push(ch, "wrong", pre.length + i, -1, i);
  });
  right.forEach((ch, i) => {
    push(ch, "right", -1, pre.length + i, i);
  });
  post.forEach((ch, i) => {
    push(
      ch,
      "post",
      pre.length + wrong.length + i,
      pre.length + right.length + i,
      i,
    );
  });

  const wrongCentre =
    wrong.length > 0
      ? (ax(pre.length) +
          ax(pre.length + wrong.length - 1) +
          (L?.a.ws[pre.length + wrong.length - 1] ?? 0)) /
        2
      : leftA + wA / 2;
  const rightCentre =
    right.length > 0
      ? (bx(pre.length) +
          bx(pre.length + right.length - 1) +
          (L?.b.ws[pre.length + right.length - 1] ?? 0)) /
        2
      : leftB + wB / 2;

  // The magnet: glides in, sweeps the line, returns to the wrong word,
  // follows the reflow to the right word's slot, then glides off.
  const startX = leftA - em * 0.45;
  const endX = leftA + wA + em * 0.35;
  const magnetX = (f: number) => {
    if (f < eSweep.start)
      return interpolate(f, [eEnter.start, eEnter.end], [-em, startX], {
        ...clamp,
        easing: EASE_OUT,
      });
    if (f < eReturn.start)
      return interpolate(f, [eSweep.start, eSweep.end], [startX, endX], {
        ...clamp,
        easing: EASE_SWEEP,
      });
    if (f < eReflow.start)
      return interpolate(f, [eReturn.start, eReturn.end], [endX, wrongCentre], {
        ...clamp,
        easing: EASE_IN_OUT,
      });
    if (f < eExit.start)
      return interpolate(
        f,
        [eReflow.start, eReflow.end],
        [wrongCentre, rightCentre],
        { ...clamp, easing: EASE_IN_OUT },
      );
    return interpolate(f, [eExit.start, eExit.end], [rightCentre, width + em], {
      ...clamp,
      easing: EASE_EXIT,
    });
  };
  // A letter lands a couple of frames after the magnet passes under it.
  const landAt = (cx: number) => {
    for (let f = eSweep.start; f <= eSweep.end; f++)
      if (magnetX(f) >= cx) return f + eSweep.beat("land");
    return eSweep.end + eSweep.beat("land");
  };

  const flipAt = (f: number) =>
    interpolate(f, [eFlip.start, eFlip.end], [0, 1], {
      ...clamp,
      easing: EASE_IN_OUT,
    });
  const flipA = flipAt(frame);
  const flipB = interpolate(frame, [eUnflip.start, eUnflip.end], [0, 1], {
    ...clamp,
    easing: EASE_IN_OUT,
  });
  const magnetScaleX = Math.cos(Math.PI * (flipA + flipB));
  const reflowAt = (f: number) =>
    interpolate(f, [eReflow.start, eReflow.end], [0, 1], {
      ...clamp,
      easing: EASE_IN_OUT,
    });

  const bump = (land: number, f: number) => {
    const d = f - land;
    if (d < 0 || d > 7) return 0;
    return Math.sin((Math.PI * d) / 7) * (1 - d / 9);
  };

  const ticks: { x: number; land: number; key: string }[] = [];

  // Where a glyph sits on frame `f`, so a frame can be held against its
  // neighbours to tell whether the glyph is moving.
  const poseOf = (it: (typeof items)[number], f: number) => {
    const seed = it.n + 1;
    const wGlyph =
      it.kind === "right" ? (L?.b.ws[it.ib] ?? 0) : (L?.a.ws[it.ia] ?? 0);
    let x = 0;
    let y = 0;
    let rot = 0;
    let sx = 1;
    let sy = 1;
    let opacity = 1;
    let blur = 0;
    let tick: (typeof ticks)[number] | null = null;

    if (it.kind === "right") {
      const drop = tl.get(`drop:${it.k}`);
      const start = drop.start;
      const land = drop.end;
      const p = interpolate(f, [start, land], [0, 1], clamp);
      x = bx(it.ib);
      y = -em * 1.7 * (1 - p * p);
      rot = (hash(seed * 4.3) - 0.5) * 18 * (1 - p);
      opacity = interpolate(p, [0, 0.45], [0, 1], clamp);
      blur = (1 - opacity) * 6;
      const b = bump(land, f);
      sx = 1 + 0.03 * b;
      sy = 1 - 0.06 * b;
      tick = { x: bcx(it.ib), land, key: `r${it.n}` };
    } else {
      const land = landAt(acx(it.ia));
      const home =
        it.kind === "wrong"
          ? ax(it.ia)
          : interpolate(reflowAt(f), [0, 1], [ax(it.ia), bx(it.ib)]);
      // Scattered on three loose tiers so neighbours never sit on top of each other.
      const dx = (hash(seed * 3.1) - 0.5) * 0.35 * em;
      const dy = -(0.35 + (it.n % 3) * 0.62 + hash(seed * 7.7) * 0.3) * em;
      const r0 = (hash(seed * 5.3) - 0.5) * 40;
      const lean = interpolate(
        f,
        [land - SNAP - eSweep.beat("lean"), land - SNAP],
        [0, 1],
        {
          ...clamp,
          easing: EASE_IN_OUT,
        },
      );
      const q = interpolate(f, [land - SNAP, land], [0, 1], {
        ...clamp,
        easing: EASE_PULL,
      });
      const fadeIn = interpolate(
        f,
        [
          eScatter.start + hash(seed * 9.1) * eScatter.beat("spread"),
          eScatter.start +
            hash(seed * 9.1) * eScatter.beat("spread") +
            eScatter.beat("fade"),
        ],
        [0, 1],
        { ...clamp, easing: EASE_OUT },
      );
      x = home + (dx - dx * 0.1 * lean) * (1 - q);
      y = (dy + em * 0.08 * lean + em * 0.2 * (1 - fadeIn)) * (1 - q);
      rot = r0 * (1 - 0.18 * lean) * (1 - q);
      opacity = fadeIn;
      blur = (1 - fadeIn) * 8;
      const b = bump(land, f);
      sx = 1 + 0.03 * b;
      sy = 1 - 0.06 * b;
      tick = { x: acx(it.ia), land, key: `a${it.n}` };

      if (it.kind === "wrong") {
        // Repelled: the word lifts off the line as a unit, then the letters
        // fan out upwards from the magnet and dissolve.
        const n = wrong.length;
        const side = n > 1 ? it.k / (n - 1) - 0.5 : 0;
        const delay = Math.abs(side) * eRepel.beat("spread");
        const rp = interpolate(
          f,
          [eRepel.start + delay, eRepel.start + delay + eRepel.beat("letter")],
          [0, 1],
          clamp,
        );
        const e = EASE_OUT(rp);
        x += side * em * 1.1 * e;
        y +=
          -em * 0.06 * flipAt(f) -
          em * (1.6 + hash(seed * 2.9) * 0.6 - Math.abs(side) * 0.6) * e;
        rot += side * (30 + hash(seed * 6.1) * 20) * e;
        opacity *= 1 - interpolate(rp, [0.25, 0.85], [0, 1], clamp);
        blur += interpolate(rp, [0.2, 0.85], [0, 10], clamp);
      }
    }

    return { x, y, rot, sx, sy, opacity, blur, wGlyph, tick };
  };

  const glyphs = items.map((it) => {
    if (it.ch === " ") return null;
    const { x, y, rot, sx, sy, opacity, blur, wGlyph, tick } = poseOf(
      it,
      frame,
    );
    if (tick) ticks.push(tick);
    const shifts = (o: ReturnType<typeof poseOf>) =>
      Math.abs(o.y - y) > 1e-3 ||
      Math.abs(o.rot - rot) > 1e-4 ||
      Math.abs(o.sx - sx) * em > 1e-3 ||
      Math.abs(o.sy - sy) * em > 1e-3;
    const moving =
      shifts(poseOf(it, frame - speed)) || shifts(poseOf(it, frame + speed));
    return (
      <span
        key={it.n}
        style={{
          ...textStyle,
          position: "absolute",
          left: x,
          top: rowTop,
          color: it.kind === "right" ? accent : fg,
          opacity,
          filter: blur > 0.05 ? `blur(${blur}px)` : undefined,
          transformOrigin: `${wGlyph / 2}px ${L?.baseline ?? em}px`,
          transform: `translateY(${y}px) rotate(${rot}deg) scale(${sx}, ${sy})${glide(moving)}`,
        }}
      >
        {it.ch}
      </span>
    );
  });

  const hair = Math.max(1.5, width / 640);
  const mx = magnetX(frame);
  // Layout rounds a box's edges to whole pixels, so a magnet eased by `left`
  // steps sideways pixel by pixel. Layout holds the place the current glide
  // ends at and the travel there is a transform, which is 0 once it arrives.
  const magnetRest =
    frame < eSweep.start
      ? startX
      : frame < eReturn.start
        ? endX
        : frame < eReflow.start
          ? wrongCentre
          : frame < eExit.start
            ? rightCentre
            : width + em;
  const magnetDx = Math.abs(mx - magnetRest) > 1e-3 ? mx - magnetRest : 0;

  return (
    <AbsoluteFill
      style={{
        background:
          background === "transparent" ? undefined : (background ?? t.bg),
        overflow: "hidden",
      }}
    >
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

      <ScaleLayer scale={scale}>
        <div style={{ position: "absolute", inset: 0, opacity: L ? 1 : 0 }}>
          {ticks.map((tk) => {
            const d = frame - tk.land;
            if (d < 0 || d > 24) return null;
            const grow = interpolate(d, [0, 3], [0, 1], {
              ...clamp,
              easing: EASE_OUT,
            });
            const fade = interpolate(d, [6, 24], [1, 0], clamp);
            return (
              <div
                key={tk.key}
                style={{
                  position: "absolute",
                  left: tk.x - hair / 2,
                  top: baseY + em * 0.1,
                  width: hair,
                  height: em * 0.13 * grow,
                  background: accent,
                  opacity: fade,
                }}
              />
            );
          })}

          {glyphs}

          <div
            style={{
              position: "absolute",
              left: magnetDx ? magnetRest : mx,
              top: baseY + em * 0.36,
              transform: `${magnetDx ? `translateX(${magnetDx}px) ` : ""}translateX(-50%) scaleX(${magnetScaleX})`,
            }}
          >
            <Magnet size={em} body={accent} tipA={t.tipA} tipB={t.tipB} />
          </div>
        </div>
      </ScaleLayer>
    </AbsoluteFill>
  );
}
