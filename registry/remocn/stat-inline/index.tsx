"use client";

import { loadFont as loadGeist } from "@remotion/google-fonts/Geist";
import { loadFont as loadGeistMono } from "@remotion/google-fonts/GeistMono";
import type React from "react";
import { useEffect, useId, useRef, useState } from "react";
import {
  AbsoluteFill,
  continueRender,
  delayRender,
  Easing,
  interpolate,
} from "remotion";
import { useSceneConfig, useSceneFrame } from "@/lib/remocn/frame-rate";
import { useGlide } from "@/lib/remocn/glide";

const geist = loadGeist("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});
const mono = loadGeistMono("normal", { weights: ["400"], subsets: ["latin"] });

export interface StatInlineProps {
  value?: string;
  text?: string;
  label?: string;
  align?: "left" | "center";
  /** Frames the number holds alone before it flies into the sentence. */
  hold?: number;
  /** Frames the number takes to fly into its slot. */
  moveDuration?: number;
  accent?: string;
  /** Text color of the sentence; overrides the theme ink. */
  ink?: string;
  background?: string;
  /** Typeface for the number and the sentence. Load it yourself; Geist by default. */
  fontFamily?: string;
  /** Size of the number and sentence, around the frame's center. */
  scale?: number;
  /** Frames to hold the first frame before anything moves. */
  delay?: number;
  speed?: number;
  theme?: "dark" | "light";
}

const MESH = ["#ecdcf2", "#8796ee", "#2e45b7", "#0e1645"] as const;

const THEMES = {
  dark: {
    bg: "#0A0A0B",
    fg: "#F4F3F0",
    label: "#8C8B91",
    stops: (a: string) => [MESH[0], MESH[1], a, MESH[1]],
    ground: 0.55,
  },
  light: {
    bg: "#F5F4F0",
    fg: "#111113",
    label: "#76746E",
    stops: (a: string) => [MESH[3], MESH[2], a, "#7d8cf0"],
    ground: 0.32,
  },
} as const;

const TRACK_HERO = -0.045;
const TRACK_TEXT = -0.022;
const LINE = 1.16;
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;
const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_IO = Easing.bezier(0.72, 0, 0.18, 1);

interface Seg {
  text: string;
  value: boolean;
}

function parse(text: string, value: string): Seg[][] {
  const units: Seg[][] = [];
  for (const raw of text.split(/\s+/).filter(Boolean)) {
    const at = raw.indexOf("{value}");
    if (at < 0) {
      units.push([{ text: raw, value: false }]);
      continue;
    }
    const segs: Seg[] = [];
    if (at > 0) segs.push({ text: raw.slice(0, at), value: false });
    segs.push({ text: value, value: true });
    const rest = raw.slice(at + 7);
    if (rest) segs.push({ text: rest, value: false });
    units.push(segs);
  }
  if (!units.some((u) => u.some((s) => s.value))) {
    units.unshift([{ text: value, value: true }]);
  }
  return units;
}

interface Metrics {
  key: string;
  seg: number[][];
  space: number;
  glyphX: number[];
  valueW: number;
  valueTextW: number;
}

function useMetrics(
  units: Seg[][],
  value: string,
  fontFamily: string,
): Metrics {
  const key = `${value}\u0002${units
    .map((u) => u.map((s) => `${s.value ? 1 : 0}${s.text}`).join("\u0003"))
    .join("\u0001")}`;
  const estimate = (): Metrics => {
    const glyphX = [...value].map((_, i) => i * 0.56);
    return {
      key,
      seg: units.map((u) => u.map((s) => s.text.length * 0.5)),
      space: 0.24,
      glyphX,
      valueW: value.length * 0.56,
      valueTextW: value.length * 0.55,
    };
  };
  const [m, setM] = useState<Metrics | null>(null);
  const [handle] = useState(() => delayRender("stat-inline: measuring"));
  const released = useRef(false);

  useEffect(() => {
    let live = true;
    const f400 = `400 100px "${fontFamily}"`;
    const f500 = `500 100px "${fontFamily}"`;
    Promise.all([
      geist.waitUntilDone(),
      document.fonts.load(f400),
      document.fonts.load(f500),
    ])
      .catch(() => undefined)
      .then(() => {
        if (!live) return;
        const ctx = document.createElement("canvas").getContext("2d");
        if (!ctx) return;
        const c = ctx as unknown as { letterSpacing: string };
        const [v, ...rest] = key.split("\u0002");
        const list = rest
          .join("\u0002")
          .split("\u0001")
          .map((u) =>
            u.split("\u0003").map((s) => ({
              value: s[0] === "1",
              text: s.slice(1),
            })),
          );
        const width = (s: string, font: string, track: number) => {
          ctx.font = font;
          c.letterSpacing = `${track * 100}px`;
          return ctx.measureText(s).width / 100;
        };
        const chars = [...v];
        const glyphX = chars.map((_, i) =>
          i === 0 ? 0 : width(chars.slice(0, i).join(""), f500, TRACK_HERO),
        );
        const valueW = width(v, f500, TRACK_HERO) - TRACK_HERO;
        const valueTextW = width(v, f500, TRACK_TEXT) - TRACK_TEXT;
        const seg = list.map((u) =>
          u.map((s) =>
            s.value ? valueTextW : width(s.text, f400, TRACK_TEXT) - TRACK_TEXT,
          ),
        );
        const space = width(" ", f400, 0);
        setM({ key, seg, space, glyphX, valueW, valueTextW });
        if (!released.current) {
          released.current = true;
          continueRender(handle);
        }
      });
    return () => {
      live = false;
    };
  }, [key, handle, fontFamily]);

  return m && m.key === key ? m : estimate();
}

function balance(w: number[], space: number, lines: number) {
  const n = w.length;
  const rowW = (a: number, b: number) => {
    let s = 0;
    for (let i = a; i < b; i++) s += w[i] + (i > a ? space : 0);
    return s;
  };
  const best: number[][] = [];
  const cut: number[][] = [];
  for (let k = 0; k <= lines; k++) {
    best.push(new Array(n + 1).fill(Number.POSITIVE_INFINITY));
    cut.push(new Array(n + 1).fill(0));
  }
  best[0][0] = 0;
  for (let k = 1; k <= lines; k++) {
    for (let i = 1; i <= n; i++) {
      for (let j = k - 1; j < i; j++) {
        const v = Math.max(best[k - 1][j], rowW(j, i));
        if (v < best[k][i]) {
          best[k][i] = v;
          cut[k][i] = j;
        }
      }
    }
  }
  const rows: [number, number][] = [];
  let i = n;
  for (let k = lines; k >= 1; k--) {
    const j = cut[k][i];
    rows.unshift([j, i]);
    i = j;
  }
  return { rows, widest: best[lines][n], rowW };
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

export function StatInline({
  value = "12,480",
  text = "Builders shipped {value} launch videos with remocn this year.",
  label = "Launch videos shipped",
  align = "left",
  hold = 52,
  moveDuration = 28,
  accent = "#3B5BFD",
  ink,
  background,
  fontFamily = geist.fontFamily,
  scale = 1,
  delay = 0,
  speed = 1,
  theme = "dark",
}: StatInlineProps) {
  const now = useSceneFrame();
  const at = (f: number) => Math.max(0, f - delay) * speed;
  const frame = at(now);
  const glide = useGlide();
  // `travel` is a text's offset in px as a function of time.
  const moves = (travel: (f: number) => number) => {
    const here = travel(frame);
    return (
      Math.abs(travel(at(now + 1)) - here) > 1e-3 ||
      Math.abs(here - travel(at(now - 1))) > 1e-3
    );
  };
  const { width: W, height: H } = useSceneConfig();
  const t = THEMES[theme];
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, "");

  const units = parse(text, value);
  const m = useMetrics(units, value, fontFamily);
  const unitW = m.seg.map((s) => s.reduce((a, b) => a + b, 0));
  const valueUnit = units.findIndex((u) => u.some((s) => s.value));

  const portrait = H > W * 1.1;
  const boxW = W * (portrait ? 0.84 : 0.8);
  const maxFs = Math.min(
    H * (units.length <= 3 ? 0.2 : 0.13),
    W * (portrait ? 0.11 : 0.09),
  );
  let pick = balance(unitW, m.space, 1);
  let fs = 0;
  for (let n = 1; n <= Math.min(7, units.length); n++) {
    const b = balance(unitW, m.space, n);
    const f = Math.min(maxFs, boxW / b.widest, (H * 0.64) / (n * LINE));
    if (f > fs * 1.04) {
      fs = f;
      pick = b;
    }
  }
  const rows = pick.rows;
  const blockW = pick.widest * fs;
  const blockH = (rows.length - 1) * LINE * fs + 0.72 * fs;
  const blockTop = H / 2 - blockH / 2;
  const blockLeft = (W - blockW) / 2;

  const placed = units.map(() => ({ x: 0, y: 0, row: 0 }));
  rows.forEach(([a, b], r) => {
    const rw = pick.rowW(a, b) * fs;
    let x = align === "center" ? (W - rw) / 2 : blockLeft;
    const y = blockTop + 0.72 * fs + r * LINE * fs;
    for (let i = a; i < b; i++) {
      placed[i] = { x, y, row: r };
      x += (unitW[i] + m.space) * fs;
    }
  });
  const vRow = placed[valueUnit]?.row ?? 0;
  const vSegIndex = units[valueUnit].findIndex((s) => s.value);
  const slotX =
    placed[valueUnit].x +
    m.seg[valueUnit].slice(0, vSegIndex).reduce((a, b) => a + b, 0) * fs;
  const slotY = placed[valueUnit].y;

  const heroFs = Math.min(
    H * (portrait ? 0.24 : 0.42),
    (W * (portrait ? 0.86 : 0.8)) / m.valueW,
  );
  const labelFs = label ? Math.max(14, Math.min(W, H) * 0.03) : 0;
  const labelGap = heroFs * 0.24 + labelFs * 1.1;
  const heroBase = H / 2 + (0.72 * heroFs) / 2 - (label ? labelGap : 0) / 2;
  const heroX = (W - m.valueW * heroFs) / 2;

  const MOVE = hold;
  const MOVE_LEN = moveDuration;
  const mv = interpolate(frame, [MOVE, MOVE + MOVE_LEN], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const ratio = m.valueTextW / m.valueW;
  const chars = [...value];
  const B = heroFs;
  const k = (fs / heroFs) ** mv;
  // The number is laid out at the size it lands at, in its slot, and carried
  // from the hero by the group: it rests there with no scale and no move, and
  // the group never shrinks text below the size it is laid out at.
  const L = fs;
  const kk = mv === 1 ? 1 : (k * B) / L;
  const spread = 1 + (ratio - 1) * mv;
  // The number flies into its slot by the group's translate and scale, which
  // carry text too, so the drawing leans for as long as either moves.
  const flight = (f: number) => {
    const p = interpolate(f, [MOVE, MOVE + MOVE_LEN], [0, 1], {
      ...CLAMP,
      easing: EASE_IO,
    });
    return [
      heroX + (slotX - heroX) * p,
      heroBase + (slotY - heroBase) * p,
      (fs / heroFs) ** p * heroFs,
    ];
  };
  const flightNow = flight(frame);
  const flightMoving = [at(now - 1), at(now + 1)].some((f) =>
    flight(f).some((v, i) => Math.abs(v - flightNow[i]) > 1e-3),
  );

  const glyphRise = (i: number, f = frame) =>
    interpolate(f, [i * 2, i * 2 + 20], [1, 0], {
      ...CLAMP,
      easing: EASE_OUT,
    });

  const labelAt = (f: number) =>
    interpolate(f, [12, 28], [0, 1], {
      ...CLAMP,
      easing: EASE_OUT,
    });
  const labelIn = labelAt(frame);
  const labelOut = interpolate(frame, [MOVE - 2, MOVE + 8], [1, 0], {
    ...CLAMP,
    easing: Easing.bezier(0.55, 0, 1, 0.45),
  });

  const orderOf = (i: number) => {
    const p = placed[i];
    const dRow = Math.abs(p.row - vRow);
    const dx = Math.abs(p.x - slotX) / Math.max(1, fs * 3);
    return dRow * 1.5 + dx;
  };
  const wordRise = (i: number, f = frame) => {
    const s = MOVE + 17 + orderOf(i) * 2.5;
    return interpolate(f, [s, s + 18], [1, 0], {
      ...CLAMP,
      easing: EASE_OUT,
    });
  };

  const groundIn = interpolate(frame, [0, 30], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const groundSettle = 1 - 0.45 * mv;
  const drift = interpolate(frame, [0, 130], [0, 1], CLAMP);
  const ground = [
    `radial-gradient(60% 55% at ${30 + drift * 6}% ${108 - drift * 4}%, color-mix(in oklab, ${MESH[2]} 70%, transparent) 0%, transparent 70%)`,
    `radial-gradient(45% 40% at ${78 - drift * 5}% ${100 - drift * 3}%, color-mix(in oklab, ${MESH[1]} 45%, transparent) 0%, transparent 72%)`,
    `radial-gradient(40% 35% at ${52 + drift * 3}% 112%, color-mix(in oklab, ${accent} 55%, transparent) 0%, transparent 75%)`,
  ].join(", ");

  // SVG text eased by its `y` or carried by a moving group clicks along pixel
  // by pixel, so the drawing leans while any of it moves.
  const moving =
    flightMoving ||
    chars.some((_, i) => moves((f) => glyphRise(i, f) * 1.05 * B * k)) ||
    // The hero holds at three times its layout size, off the pixel grid.
    mv < 1 ||
    (Boolean(label) && moves((f) => (1 - labelAt(f)) * labelFs * 0.6)) ||
    units.some(
      (u, i) =>
        u.some((seg) => !seg.value) && moves((f) => wordRise(i, f) * fs * 1.05),
    );

  const stops = t.stops(accent);
  const vw = m.valueW;

  return (
    <AbsoluteFill style={{ background: background ?? t.bg }}>
      {background === "transparent" ? null : (
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: ground,
            opacity: t.ground * groundIn * groundSettle,
          }}
        />
      )}
      <ScaleLayer scale={scale}>
        <svg
          width={W}
          height={H}
          viewBox={`0 0 ${W} ${H}`}
          style={{ position: "absolute", inset: 0, transform: glide(moving) }}
          aria-hidden
        >
          <defs>
            <linearGradient
              id={`${id}-fill`}
              gradientUnits="userSpaceOnUse"
              x1={slotX}
              y1={slotY - 0.78 * L}
              x2={slotX + vw * L}
              y2={slotY + 0.1 * L}
            >
              <stop offset="0" stopColor={stops[0]} />
              <stop offset={0.32 + 0.06 * drift} stopColor={stops[1]} />
              <stop offset={0.7 + 0.04 * drift} stopColor={stops[2]} />
              <stop offset="1" stopColor={stops[3]} />
            </linearGradient>
            {chars.map((c, i) => (
              <clipPath
                key={`${c}-${i}`}
                id={`${id}-g${i}`}
                clipPathUnits="userSpaceOnUse"
              >
                <rect
                  x={slotX + (m.glyphX[i] * spread - 0.1) * L}
                  y={slotY - 0.86 * L}
                  width={((m.glyphX[i + 1] ?? vw) - m.glyphX[i] + 0.2) * L}
                  height={1.12 * L}
                />
              </clipPath>
            ))}
          </defs>

          <g
            transform={`translate(${(heroX - slotX) * (1 - mv)} ${(heroBase - slotY) * (1 - mv)}) translate(${slotX} ${slotY}) scale(${kk}) translate(${-slotX} ${-slotY})`}
          >
            {chars.map((c, i) => (
              <g key={`${c}-${i}`} clipPath={`url(#${id}-g${i})`}>
                <text
                  x={slotX + m.glyphX[i] * spread * L}
                  y={slotY + glyphRise(i) * 1.05 * L}
                  fontSize={L}
                  fill={`url(#${id}-fill)`}
                  style={{ fontFamily, fontWeight: 500 }}
                >
                  {c}
                </text>
              </g>
            ))}
          </g>

          {label ? (
            <text
              x={W / 2}
              y={heroBase + labelGap + (1 - labelIn) * labelFs * 0.6}
              fontSize={labelFs}
              fill={t.label}
              opacity={labelIn * labelOut}
              textAnchor="middle"
              style={{
                fontFamily: mono.fontFamily,
                fontWeight: 400,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              {label}
            </text>
          ) : null}

          {units.map((u, i) => {
            const p = placed[i];
            const r = wordRise(i);
            let x = p.x;
            return (
              <g key={i}>
                <clipPath id={`${id}-w${i}`} clipPathUnits="userSpaceOnUse">
                  <rect
                    x={p.x - fs * 0.1}
                    y={p.y - fs * 0.98}
                    width={(unitW[i] + 0.2) * fs}
                    height={fs * 1.3}
                  />
                </clipPath>
                <g clipPath={`url(#${id}-w${i})`}>
                  {u.map((s, j) => {
                    const sx = x;
                    x += m.seg[i][j] * fs;
                    if (s.value) return null;
                    return (
                      <text
                        key={j}
                        x={sx}
                        y={p.y + r * fs * 1.05}
                        fontSize={fs}
                        fill={ink ?? t.fg}
                        style={{
                          fontFamily,
                          fontWeight: 400,
                          letterSpacing: `${TRACK_TEXT}em`,
                        }}
                      >
                        {s.text}
                      </text>
                    );
                  })}
                </g>
              </g>
            );
          })}
        </svg>
      </ScaleLayer>
    </AbsoluteFill>
  );
}
