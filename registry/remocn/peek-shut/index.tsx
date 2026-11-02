"use client";

import { loadFont } from "@remotion/google-fonts/FunnelDisplay";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  AbsoluteFill,
  continueRender,
  delayRender,
  Easing,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const funnel = loadFont("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});

export interface PeekShutProps {
  question?: string;
  refusal?: string;
  when?: string;
  src?: string;
  focusY?: number;
  pan?: [number, number];
  zoom?: number;
  accent?: string;
  background?: string;
  speed?: number;
  theme?: "dark" | "light";
}

const DEFAULT_PAN: [number, number] = [0.8, 0.57];

const THEMES = {
  dark: {
    bg: "#0B0B0F",
    ink: "#FFFFFF",
    line: "rgba(255,255,255,0.32)",
    accent: "#B79CFF",
  },
  light: {
    bg: "#FAFAFA",
    ink: "#121216",
    line: "rgba(18,18,22,0.3)",
    accent: "#6B4FD8",
  },
} as const;

const WGHT = 500;
const TRACK = -0.03;
const PITCH = 1.06;
const MEASURE_PX = 100;

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_SNAP = Easing.bezier(0.7, 0, 0.9, 0.4);
const EASE_DRIFT = Easing.bezier(0.45, 0, 0.55, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const LINE_LEN = 18;
const Q_AT = 6;
const STAGGER = 3;
const WORD_LEN = 14;
const OPEN_AT = 30;
const OPEN_LEN = 16;
const SHUT_AT = 80;
const SHUT_LEN = 6;
const R_AT = 90;
const WHEN_AT = 102;
const MIN_HOLD = 34;

let measureCtx: CanvasRenderingContext2D | null = null;

function em(s: string) {
  if (!measureCtx) {
    measureCtx = document.createElement("canvas").getContext("2d");
  }
  if (!measureCtx) throw new Error("peek-shut: no 2d context");
  measureCtx.font = `${WGHT} ${MEASURE_PX}px "${funnel.fontFamily}"`;
  return (
    measureCtx.measureText(s).width / MEASURE_PX + TRACK * Array.from(s).length
  );
}

function useFontsReady() {
  const [ready, setReady] = useState(false);
  const [handle] = useState(() => delayRender("peek-shut: fonts"));
  const released = useRef(false);
  useEffect(() => {
    let live = true;
    Promise.all([
      funnel.waitUntilDone(),
      document.fonts.load(`${WGHT} 100px "${funnel.fontFamily}"`),
    ])
      .catch(() => undefined)
      .then(() => {
        if (live) setReady(true);
        if (!released.current) {
          released.current = true;
          continueRender(handle);
        }
      });
    return () => {
      live = false;
    };
  }, [handle]);
  return ready;
}

interface Row {
  words: { text: string; x: number }[];
  w: number;
}

function split(s: string) {
  return s.split(/\s+/).filter(Boolean);
}

function toRow(words: string[]): Row {
  const space = em(" ");
  let x = 0;
  const out = words.map((text) => {
    const at = x;
    x += em(text) + space;
    return { text, x: at };
  });
  return { words: out, w: em(words.join(" ")) };
}

function greedy(words: string[], maxEm: number): string[][] {
  const rows: string[][] = [];
  let cur: string[] = [];
  for (const w of words) {
    const next = [...cur, w];
    if (cur.length > 0 && em(next.join(" ")) > maxEm) {
      rows.push(cur);
      cur = [w];
    } else {
      cur = next;
    }
  }
  if (cur.length) rows.push(cur);
  return rows;
}

function wrap(s: string, maxEm: number): Row[] {
  const words = split(s);
  let rows = greedy(words, maxEm);
  let m = maxEm;
  for (let guard = 0; guard < 30 && rows.length > 1; guard++) {
    m *= 0.96;
    const next = greedy(words, m);
    if (next.length > rows.length) break;
    rows = next;
  }
  return rows.map(toRow);
}

function buildLayout(
  question: string,
  refusal: string,
  when: string,
  W: number,
  H: number,
) {
  const portrait = H > W * 1.1;
  const measure = W * (portrait ? 0.84 : 0.66);
  const hMax = portrait ? H * 0.05 : H * 0.1;
  let F = Math.min(W, H) * 0.1;
  let q: Row[] = [];
  let r: Row[] = [];
  let wn: Row[] = [];
  for (let guard = 0; guard < 16; guard++) {
    q = wrap(question, measure / F);
    r = wrap(refusal, measure / F);
    wn = wrap(when, measure / F);
    const room = H / 2 - hMax / 2 - F * 0.7 - H * (portrait ? 0.1 : 0.08);
    const tallest = Math.max(q.length, r.length + wn.length);
    if (((tallest - 1) * PITCH + 1.1) * F <= room) break;
    F *= 0.93;
  }
  return { q, r, wn, F, hMax, portrait };
}

export function PeekShut({
  question = "Want a peek?",
  refusal = "That’s all you get.",
  when = "The rest, Monday.",
  src,
  focusY = 0.5,
  pan = DEFAULT_PAN,
  zoom = 3.2,
  accent,
  background,
  speed = 1,
  theme = "dark",
}: PeekShutProps) {
  const frame = useCurrentFrame();
  const { width: W, height: H, durationInFrames } = useVideoConfig();
  const c = THEMES[theme];
  const hi = accent ?? c.accent;
  const stage =
    background === "transparent" ? "transparent" : (background ?? c.bg);
  const image = src ?? staticFile("hero.png");
  const ready = useFontsReady();

  const layout = useMemo(
    () => (ready ? buildLayout(question, refusal, when, W, H) : null),
    [ready, question, refusal, when, W, H],
  );

  if (!layout) {
    return (
      <div style={{ position: "absolute", inset: 0, background: stage }} />
    );
  }

  const { F, hMax, portrait } = layout;
  const lastWords = layout.wn.reduce((a, r) => a + r.words.length, 0);
  const rCount = layout.r.reduce((a, r) => a + r.words.length, 0);
  const whenAt = Math.max(WHEN_AT, R_AT + rCount * STAGGER + 4);
  const motionEnd = whenAt + (lastWords - 1) * STAGGER + WORD_LEN;
  const room = durationInFrames * speed - MIN_HOLD;
  const k = Math.max(0.6, Math.min(1, room / motionEnd));
  const t = (frame * speed) / k;

  const mx = W * (portrait ? 0.08 : 0.065);
  const cy = H / 2;
  const slotX = mx;
  const slotW = portrait ? W - 2 * mx : W * 0.56;
  const gap = F * 0.7;
  const hair = Math.max(1, Math.round(H / 720));

  const drawn = interpolate(t, [0, LINE_LEN], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const opened = interpolate(t, [OPEN_AT, OPEN_AT + OPEN_LEN], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const shut = interpolate(t, [SHUT_AT, SHUT_AT + SHUT_LEN], [0, 1], {
    ...CLAMP,
    easing: EASE_SNAP,
  });
  const h = hMax * opened * (1 - shut);
  const drift = interpolate(t, [OPEN_AT, SHUT_AT + SHUT_LEN], [0, 1], {
    ...CLAMP,
    easing: EASE_DRIFT,
  });

  const IW = slotW * zoom;
  const IH = (IW * 9) / 16;
  const fx = pan[0] + (pan[1] - pan[0]) * drift;
  const ix = slotW / 2 - fx * IW;
  const iy = hMax / 2 - focusY * IH;
  const settle = 1 + 0.04 * (1 - opened);

  const rowH = F * 1.2;
  const lineTop = cy - hMax / 2 - gap - layout.q.length * PITCH * F;
  const belowTop = cy + hMax / 2 + gap * 0.9;
  const edge = (x: number, w: number, y: number, key: string) => (
    <div
      key={key}
      style={{
        position: "absolute",
        left: x,
        top: y - hair / 2,
        width: Math.max(0, w),
        height: hair,
        background: c.line,
      }}
    />
  );
  const reach = W * drawn;

  const block = (
    rows: Row[],
    top: number,
    at: number,
    color: string,
    key: string,
  ) => {
    let wi = 0;
    return rows.map((row, li) => (
      <div
        key={`${key}-${li}`}
        style={{
          position: "absolute",
          left: mx - F * 0.1,
          top: top + li * PITCH * F,
          width: row.w * F + F * 0.3,
          height: rowH,
          overflow: "hidden",
        }}
      >
        {row.words.map((w) => {
          const i = wi++;
          const q = interpolate(
            t,
            [at + i * STAGGER, at + i * STAGGER + WORD_LEN],
            [0, 1],
            { ...CLAMP, easing: EASE_OUT },
          );
          return (
            <div
              key={`${key}-w-${i}`}
              style={{
                position: "absolute",
                left: w.x * F + F * 0.1,
                top: 0,
                height: rowH,
                fontFamily: funnel.fontFamily,
                fontWeight: WGHT,
                fontSize: F,
                lineHeight: `${rowH}px`,
                letterSpacing: `${TRACK}em`,
                whiteSpace: "pre",
                color,
                transform: `translateY(${((1 - q) * rowH).toFixed(2)}px)`,
              }}
            >
              {w.text}
            </div>
          );
        })}
      </div>
    ));
  };

  return (
    <AbsoluteFill style={{ background: stage, overflow: "hidden" }}>
      {block(layout.q, lineTop, Q_AT, c.ink, "q")}
      {edge(0, reach, cy, "base")}
      <div
        style={{
          position: "absolute",
          left: slotX,
          top: cy - h / 2,
          width: slotW,
          height: h,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            top: -(hMax - h) / 2,
            width: slotW,
            height: hMax,
          }}
        >
          <Img
            src={image}
            style={{
              position: "absolute",
              left: ix,
              top: iy,
              width: IW,
              height: IH,
              objectFit: "cover",
              transformOrigin: `${fx * 100}% ${focusY * 100}%`,
              transform: `scale(${settle.toFixed(4)})`,
            }}
          />
        </div>
      </div>
      {h > hair * 1.5
        ? [
            edge(
              slotX,
              Math.min(reach, slotX + slotW) - slotX,
              cy - h / 2,
              "e-t",
            ),
            edge(
              slotX,
              Math.min(reach, slotX + slotW) - slotX,
              cy + h / 2,
              "e-b",
            ),
          ]
        : null}
      {block(layout.r, belowTop, R_AT, c.ink, "r")}
      {block(
        layout.wn,
        belowTop + layout.r.length * PITCH * F,
        whenAt,
        hi,
        "wn",
      )}
    </AbsoluteFill>
  );
}
