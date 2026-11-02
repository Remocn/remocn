"use client";

import { loadFont as loadSans } from "@remotion/google-fonts/InstrumentSans";
import { loadFont as loadSerif } from "@remotion/google-fonts/InstrumentSerif";
import { loadFont as loadManrope } from "@remotion/google-fonts/Manrope";
import { evolvePath } from "@remotion/paths";
import { useId } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const { fontFamily: sans } = loadSans("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});
const { fontFamily: serif } = loadSerif("normal", {
  weights: ["400"],
  subsets: ["latin"],
});
loadSerif("italic", { weights: ["400"], subsets: ["latin"] });
const manrope = loadManrope("normal", {
  weights: ["600"],
  subsets: ["latin"],
});

const REMOCN_R_PATH =
  "M 0.01 0.81 C 0.01 1.73, 0.36 2.79, 1.09 4.13 C 4.91 11.04, 13.45 17.16, 21.7 18.9 C 22.94 19.16, 23.18 19.16, 51.39 19.27 C 76.07 19.36, 80.02 19.4, 81.32 19.57 C 89.89 20.69, 96.2 24.68, 99.38 31.01 C 103.19 38.56, 102.53 50.1, 97.91 57.07 C 94.66 61.96, 89.68 64.99, 83.26 66 C 82.81 66.07, 70.18 66.83, 55.2 67.69 C 24.82 69.43, 27.03 69.23, 24.18 70.4 C 19.9 72.15, 14.84 75.7, 10.65 79.89 C 4.86 85.68, 1.3 91.91, 0.25 98.13 C 0.12 98.85, 0.08 103.13, 0.04 116.66 L 0 134.26 9.5 134.26 L 19 134.26 19.05 119.41 C 19.1 103.27, 19.08 103.82, 19.82 101.04 C 21.79 93.65, 27.86 88.75, 36.45 87.63 C 37.23 87.53, 39.41 87.5, 43.57 87.53 C 50.12 87.59, 50.75 87.65, 53.22 88.45 C 56.61 89.56, 59.67 91.86, 62.02 95.07 C 62.52 95.76, 69.35 103.85, 77.2 113.07 C 85.04 122.28, 91.63 130.04, 91.85 130.32 C 92.07 130.59, 92.5 131.34, 92.82 131.97 C 93.52 133.35, 94.11 133.93, 95.06 134.13 C 95.5 134.23, 98.97 134.26, 106.36 134.23 L 117.01 134.19 100.82 113.07 C 91.91 101.45, 84.52 91.78, 84.39 91.57 C 83.36 89.89, 83.66 87.53, 85.09 86 C 85.79 85.25, 86.36 84.94, 88.07 84.38 C 96.18 81.72, 104.15 76.62, 109.97 70.36 C 120.59 58.93, 124.06 44.32, 119.44 30.43 C 114.59 15.81, 101.93 4.02, 87.64 0.83 C 83.93 0.01, 88.09 0.08, 41.85 0.04 L 0.01 0 0.01 0.81 Z";

/** Full logo as on remocn.dev: R mark (0.76em tall, baseline-aligned) + "emocn" in Manrope 600. */
function RemocnLogo({ fontSize, color }: { fontSize: number; color: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "baseline",
        color,
        fontFamily: manrope.fontFamily,
        fontWeight: 600,
        fontSize,
        letterSpacing: "-0.025em",
        lineHeight: 1,
      }}
    >
      <svg
        viewBox="0 0 124.06 134.26"
        style={{ height: "0.76em", width: "auto" }}
        aria-hidden
      >
        <path fill="currentColor" d={REMOCN_R_PATH} />
      </svg>
      <span style={{ marginLeft: "0.04em" }}>emocn</span>
    </div>
  );
}

/** gradients.sh "mesh" palette (bg + colours), used as the core disc. */
const MESH = {
  bg: "#0a0d24",
  colors: ["#ecdcf2", "#8796ee", "#2e45b7", "#0e1645"],
} as const;

function meshGround(drift: number, accent: string) {
  const d = drift * 6;
  const blob = (x: number, y: number, c: string, w = 85, h = 95) =>
    `radial-gradient(${w}% ${h}% at ${x}% ${y}%, ${c} 0%, transparent 68%)`;
  return [
    blob(
      70 - d,
      100,
      `color-mix(in oklab, ${MESH.colors[0]} 45%, transparent)`,
      70,
      45,
    ),
    blob(88, 70 + d, MESH.colors[1], 60, 70),
    blob(16 + d, 74, `color-mix(in oklab, ${accent} 90%, transparent)`, 70, 70),
    blob(30, 18 - d, MESH.colors[2], 85, 80),
    blob(60, 30, MESH.colors[3], 70, 60),
    MESH.bg,
  ].join(", ");
}

export interface ChordRingProps {
  segments?: string[];
  brandIndex?: number;
  caption?: string;
  accent?: string;
  theme?: "dark" | "light";
  speed?: number;
}

const DEFAULT_SEGMENTS = [
  "remocn",
  "Kitebase",
  "Lumen",
  "Fernway",
  "Quarry",
  "Orbitly",
  "Halcyon",
  "Tessel",
  "Northwind",
];

const EASE_IO = Easing.bezier(0.65, 0, 0.35, 1);
const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_SEG = Easing.bezier(0.55, 0, 0.25, 1);
const EASE_CHORD = Easing.bezier(0.45, 0, 0.25, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const THEMES = {
  dark: {
    bg: "#0A0A0B",
    fg: "#F3F2EF",
    muted: "#8B8A90",
    seg: "#5E5D63",
    chord: "rgba(243,242,239,0.34)",
    grain: 0.06,
  },
  light: {
    bg: "#F5F4F0",
    fg: "#121214",
    muted: "#6E6C67",
    seg: "#B4B2AC",
    chord: "rgba(18,18,20,0.32)",
    grain: 0.045,
  },
} as const;

const SEG_START = 2;
const SEG_STAGGER = 2;
const SEG_LEN = 12;
const CHORD_START = 26;
const CHORD_STAGGER = 2.2;
const CHORD_LEN = 16;
const TAU = Math.PI * 2;

function pt(cx: number, cy: number, r: number, a: number) {
  return { x: cx + r * Math.sin(a), y: cy - r * Math.cos(a) };
}

function arc(cx: number, cy: number, r: number, a0: number, a1: number) {
  const s = pt(cx, cy, r, a0);
  const e = pt(cx, cy, r, a1);
  const large = a1 - a0 > Math.PI ? 1 : 0;
  return `M ${s.x.toFixed(2)} ${s.y.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${e.x.toFixed(2)} ${e.y.toFixed(2)}`;
}

function buildPairs(n: number, brand: number) {
  const brandPairs: [number, number][] = [];
  for (let i = 0; i < n; i++) if (i !== brand) brandPairs.push([brand, i]);
  const seen = new Set<string>();
  const others: [number, number][] = [];
  for (const k of [3, Math.floor(n / 2)]) {
    for (let i = 0; i < n; i++) {
      const j = (i + k) % n;
      if (i === brand || j === brand || i === j) continue;
      const key = `${Math.min(i, j)}-${Math.max(i, j)}`;
      if (seen.has(key)) continue;
      seen.add(key);
      others.push([i, j]);
    }
  }
  const order: { a: number; b: number; brand: boolean }[] = [];
  const len = Math.max(brandPairs.length, others.length);
  for (let i = 0; i < len; i++) {
    const o = others[(i * 5) % Math.max(1, others.length)];
    if (i < others.length && o) order.push({ a: o[0], b: o[1], brand: false });
    const bp = brandPairs[(i * 3) % Math.max(1, brandPairs.length)];
    if (i < brandPairs.length && bp)
      order.push({ a: bp[0], b: bp[1], brand: true });
  }
  const uniq = new Set<string>();
  return order.filter((c) => {
    const key = `${Math.min(c.a, c.b)}-${Math.max(c.a, c.b)}`;
    if (uniq.has(key)) return false;
    uniq.add(key);
    return true;
  });
}

function Grain({ opacity }: { opacity: number }) {
  const id = `g${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  return (
    <svg
      width="100%"
      height="100%"
      style={{ position: "absolute", inset: 0, opacity }}
      aria-hidden
    >
      <filter id={id}>
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.9"
          numOctaves={2}
          seed={47}
          stitchTiles="stitch"
        />
        <feColorMatrix values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0.9 0" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#${id})`} />
    </svg>
  );
}

export function ChordRing({
  segments = DEFAULT_SEGMENTS,
  brandIndex = 0,
  caption = "Connects to everything",
  accent = "#3B5BFD",
  theme = "dark",
  speed = 1,
}: ChordRingProps) {
  const t = useCurrentFrame() * speed;
  const { width, height, fps } = useVideoConfig();
  const u = Math.min(width / 1280, height / 720);
  const p = THEMES[theme];
  const list = segments.slice(0, 12);
  const n = list.length;
  const brand = Math.min(Math.max(0, Math.round(brandIndex)), n - 1);

  const cx = width / 2;
  const cy = height / 2;
  const R = height * 0.32;
  const sw = 10 * u;
  const Rin = R - sw / 2 - 9 * u;
  const hole = Rin * 0.64;
  const step = TAU / Math.max(1, n);
  const gapA = (8 * u) / R;

  const spinDeg = interpolate(t, [0, 90], [-10, 0], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const rot = step / 2 + (spinDeg * Math.PI) / 180;

  const segs = list.map((label, i) => {
    const a0 = rot + i * step + gapA / 2;
    const a1 = rot + (i + 1) * step - gapA / 2;
    const start = SEG_START + i * SEG_STAGGER;
    return {
      label,
      i,
      a0,
      a1,
      mid: (a0 + a1) / 2,
      start,
      end: start + SEG_LEN,
    };
  });

  const pairs = buildPairs(n, brand);
  const ends = new Map<string, number>();
  for (let s = 0; s < n; s++) {
    const mine = pairs
      .map((c, ci) => ({ c, ci }))
      .filter(({ c }) => c.a === s || c.b === s)
      .map(({ c, ci }) => {
        const other = c.a === s ? c.b : c.a;
        const delta = (((other - s) % n) + n) % n;
        return { ci, delta };
      })
      .sort((x, y) => y.delta - x.delta);
    const seg = segs[s];
    const inset = (seg.a1 - seg.a0) * 0.2;
    mine.forEach(({ ci }, k) => {
      const f = mine.length > 1 ? k / (mine.length - 1) : 0.5;
      ends.set(
        `${ci}-${s}`,
        seg.a0 + inset + (seg.a1 - seg.a0 - 2 * inset) * f,
      );
    });
  }

  const chords = pairs.map((c, ci) => {
    const th0 = ends.get(`${ci}-${c.a}`) ?? segs[c.a].mid;
    const th1 = ends.get(`${ci}-${c.b}`) ?? segs[c.b].mid;
    const P0 = pt(cx, cy, Rin, th0);
    const P2 = pt(cx, cy, Rin, th1);
    let dth = th1 - th0;
    while (dth > Math.PI) dth -= TAU;
    while (dth < -Math.PI) dth += TAU;
    const m = th0 + dth / 2;
    const half = Rin * Math.cos(Math.abs(dth) / 2);
    const rmin = Math.max(hole, half * 0.95);
    const rc = 2 * rmin - half;
    const C = pt(cx, cy, rc, m);
    const d = `M${P0.x.toFixed(2)} ${P0.y.toFixed(2)} Q${C.x.toFixed(2)} ${C.y.toFixed(2)} ${P2.x.toFixed(2)} ${P2.y.toFixed(2)}`;
    const start = CHORD_START + ci * CHORD_STAGGER;
    return { ...c, d, start, end: start + CHORD_LEN };
  });

  const lastChord = chords.length
    ? chords[chords.length - 1].end
    : CHORD_START + 10;
  const HIT = Math.round(lastChord + 6);

  const flip = spring({
    frame: t - HIT,
    fps,
    config: { damping: 20, stiffness: 140, mass: 0.8 },
  });
  const dim = interpolate(t, [HIT, HIT + 18], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const capT = HIT + 8;
  const land = spring({
    frame: t - capT,
    fps,
    config: { damping: 18, stiffness: 150, mass: 0.8 },
  });
  const landO = interpolate(t, [capT, capT + 10], [0, 1], CLAMP);
  const blur = interpolate(t, [capT, capT + 16], [1, 0], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const push = interpolate(t, [0, 160], [0.965, 1.005], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const stage = interpolate(t, [0, 8], [0.5, 1], CLAMP);
  const hair = Math.max(1, 1.4 * u);
  const disc = hole * 0.9;
  const discS = spring({
    frame: t - HIT,
    fps,
    config: { damping: 22, stiffness: 120, mass: 0.9 },
  });
  const discO = interpolate(t, [HIT, HIT + 10], [0, 1], CLAMP);
  const drift = interpolate(t, [HIT, HIT + 90], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const words = caption.trim().split(/\s+/);
  const tail = words.length ? words[words.length - 1] : "";
  const lead = words.slice(0, -1).join(" ");

  return (
    <AbsoluteFill style={{ background: p.bg, overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          transform: `scale(${push})`,
          transformOrigin: "50% 50%",
          opacity: stage,
        }}
      >
        <svg
          width={width}
          height={height}
          style={{ position: "absolute", inset: 0 }}
          aria-hidden
        >
          {chords.map((c) => {
            if (t < c.start) return null;
            const k = interpolate(t, [c.start, c.end], [0, 1], {
              ...CLAMP,
              easing: EASE_CHORD,
            });
            const evo = evolvePath(k, c.d);
            return (
              <path
                key={`c${c.a}-${c.b}`}
                d={c.d}
                fill="none"
                stroke={p.chord}
                strokeWidth={hair}
                strokeLinecap="round"
                strokeDasharray={evo.strokeDasharray}
                strokeDashoffset={evo.strokeDashoffset}
                opacity={c.brand ? 1 - flip : 1 - 0.7 * dim}
              />
            );
          })}
          {flip > 0.001
            ? chords
                .filter((c) => c.brand)
                .map((c) => (
                  <path
                    key={`a${c.a}-${c.b}`}
                    d={c.d}
                    fill="none"
                    stroke={accent}
                    strokeWidth={hair * (1 + 1.1 * flip)}
                    strokeLinecap="round"
                    opacity={Math.min(1, flip)}
                  />
                ))
            : null}

          {segs.map((s) => {
            const k = interpolate(t, [s.start, s.end], [0, 1], {
              ...CLAMP,
              easing: EASE_SEG,
            });
            if (k <= 0) return null;
            const a1 = s.a0 + (s.a1 - s.a0) * k;
            const isBrand = s.i === brand;
            return (
              <g key={s.label}>
                <path
                  d={arc(cx, cy, R, s.a0, a1)}
                  fill="none"
                  stroke={p.seg}
                  strokeWidth={sw}
                  opacity={isBrand ? 1 - flip : 1 - 0.35 * dim}
                />
                {isBrand && flip > 0.001 ? (
                  <path
                    d={arc(cx, cy, R, s.a0, a1)}
                    fill="none"
                    stroke={accent}
                    strokeWidth={sw * (1 + 0.4 * flip)}
                    opacity={Math.min(1, flip)}
                  />
                ) : null}
              </g>
            );
          })}
        </svg>

        {segs.map((s) => {
          const a = interpolate(t, [s.end - 6, s.end + 10], [0, 1], {
            ...CLAMP,
            easing: EASE_OUT,
          });
          const r = R + sw / 2 + 18 * u + (1 - a) * -6 * u;
          const q = pt(cx, cy, r, s.mid);
          const sx = Math.sin(s.mid);
          const cyv = -Math.cos(s.mid);
          const vertical = Math.abs(sx) < 0.3;
          const tx = vertical ? -50 : sx > 0 ? 0 : -100;
          const ty = vertical ? (cyv < 0 ? -100 : 0) : -50;
          const isBrand = s.i === brand;
          return (
            <div
              key={s.label}
              style={{
                position: "absolute",
                left: q.x,
                top: q.y,
                transform: `translate(${tx}%, ${ty}%)`,
                opacity: a * (isBrand ? 1 : 1 - 0.5 * dim),
                fontFamily: sans,
                fontWeight: 400,
                fontSize: 19 * u,
                letterSpacing: "-0.005em",
                color: p.fg,
                whiteSpace: "nowrap",
              }}
            >
              {s.label.trim().toLowerCase() === "remocn" ? (
                <RemocnLogo fontSize={22 * u} color={p.fg} />
              ) : (
                s.label
              )}
            </div>
          );
        })}

        <AbsoluteFill
          style={{ alignItems: "center", justifyContent: "center" }}
        >
          <div
            style={{
              position: "absolute",
              left: cx - disc,
              top: cy - disc,
              width: disc * 2,
              height: disc * 2,
              borderRadius: "50%",
              background: meshGround(drift, accent),
              opacity: discO,
              transform: `scale(${0.9 + 0.1 * discS})`,
            }}
          />
          <div
            style={{
              width: disc * 1.6,
              textAlign: "center",
              fontFamily: serif,
              fontWeight: 400,
              fontSize: 44 * u,
              lineHeight: 1.02,
              letterSpacing: "-0.015em",
              textWrap: "balance",
              color: "#FFFFFF",
              opacity: landO,
              filter: blur > 0.01 ? `blur(${blur * 8 * u}px)` : undefined,
              transform: `translateY(${(1 - land) * 14 * u}px)`,
            }}
          >
            {lead}
            {lead ? " " : null}
            <span style={{ fontStyle: "italic" }}>{tail}</span>
          </div>
        </AbsoluteFill>
      </AbsoluteFill>

      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 80% 80% at 50% 50%, transparent 62%, ${p.bg} 100%)`,
          opacity: 0.6,
        }}
      />
      <Grain opacity={p.grain} />
    </AbsoluteFill>
  );
}
