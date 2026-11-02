"use client";

import { loadFont as loadGeist } from "@remotion/google-fonts/Geist";
import { loadFont as loadManrope } from "@remotion/google-fonts/Manrope";
import type React from "react";
import { useId } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const { fontFamily: geist } = loadGeist("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});
const manrope = loadManrope("normal", {
  weights: ["500", "600"],
  subsets: ["latin"],
});

export interface GridSnapPosterProps {
  title?: string;
  number?: string;
  body?: string;
  name?: string;
  logo?: React.ReactNode;
  accent?: string;
  theme?: "dark" | "light";
  speed?: number;
}

// gradients.sh "mesh" palette, used as the clip-text fill of the hero number.
const MESH = ["#ecdcf2", "#8796ee", "#2e45b7", "#0e1645"] as const;

function meshFill(theme: "dark" | "light", t: number) {
  const d = (i: number) => 5 * Math.sin(t / 70 + i * 1.7);
  const blob = (x: number, y: number, col: string, i: number, r = 68) =>
    `radial-gradient(70% 80% at ${x + d(i)}% ${y + d(i + 3)}%, ${col} 0%, transparent ${r}%)`;
  if (theme === "dark") {
    return [
      blob(14, 18, MESH[0], 0),
      blob(86, 24, MESH[1], 1),
      blob(70, 92, MESH[2], 2, 60),
      blob(24, 84, MESH[1], 3, 55),
      `linear-gradient(160deg, ${MESH[1]} 0%, ${MESH[2]} 100%)`,
    ].join(", ");
  }
  return [
    blob(84, 20, MESH[1], 0, 62),
    blob(12, 30, MESH[1], 2, 42),
    blob(18, 86, MESH[2], 1, 60),
    `linear-gradient(160deg, ${MESH[2]} 0%, ${MESH[3]} 100%)`,
  ].join(", ");
}

const COLS = 12;
const STEP = 5;
const MOVE = 3;
const GRID_FADE = 84;

const EASE_IO = Easing.bezier(0.65, 0, 0.35, 1);
const EASE_SNAP = Easing.bezier(0.2, 0.9, 0.1, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const THEMES = {
  dark: {
    bg: "#0A0A0B",
    key: "rgba(255,255,255,0.05)",
    fg: "#F3F2EF",
    muted: "#8B8A90",
    hair: "rgba(255,255,255,0.13)",
    band: 0.05,
    grain: 0.07,
  },
  light: {
    bg: "#F5F4F0",
    key: "rgba(255,255,255,0.9)",
    fg: "#121214",
    muted: "#6E6C67",
    hair: "rgba(18,18,20,0.14)",
    band: 0.06,
    grain: 0.045,
  },
} as const;

// Geist 500 metrics (unitsPerEm 1000), measured from the font file.
const BASELINE = 0.855;
const CAP = 0.71;
const GEIST_500 =
  "243,228,361,515,643,810,649,186,290,290,427,562,213,418,213,494,673,406,630,625,629,641,604,531,624,606,302,302,546,544,546,570,925,689,688,713,701,609,595,713,716,280,607,656,583,890,745,751,657,745,680,654,568,694,688,968,633,594,561,361,470,361,438,558,258,565,608,563,608,576,412,607,591,256,284,609,282,885,591,588,608,608,394,537,410,586,560,829,607,553,552,395,274,395,523"
    .split(",")
    .map((v) => Number(v) / 1000);

function glyphEm(ch: string) {
  const code = ch.charCodeAt(0);
  return code >= 32 && code < 127 ? GEIST_500[code - 32] : 0.58;
}

function em(text: string, track: number) {
  let w = 0;
  for (const ch of text) w += glyphEm(ch) + track;
  return w;
}

function hexA(hex: string, a: number) {
  const h = hex.replace("#", "");
  const full =
    h.length === 3
      ? h
          .split("")
          .map((x) => x + x)
          .join("")
      : h.slice(0, 6);
  const v = Number.parseInt(full, 16);
  return `rgba(${(v >> 16) & 255},${(v >> 8) & 255},${v & 255},${a})`;
}

function Grain({ opacity }: { opacity: number }) {
  const id = `g${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  return (
    <svg
      width="100%"
      height="100%"
      style={{ position: "absolute", inset: 0, opacity, pointerEvents: "none" }}
      aria-hidden
    >
      <filter id={id}>
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.9"
          numOctaves={2}
          seed={3}
          stitchTiles="stitch"
        />
        <feColorMatrix values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0.9 0" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#${id})`} />
    </svg>
  );
}

const REMOCN_R_PATH =
  "M 0.01 0.81 C 0.01 1.73, 0.36 2.79, 1.09 4.13 C 4.91 11.04, 13.45 17.16, 21.7 18.9 C 22.94 19.16, 23.18 19.16, 51.39 19.27 C 76.07 19.36, 80.02 19.4, 81.32 19.57 C 89.89 20.69, 96.2 24.68, 99.38 31.01 C 103.19 38.56, 102.53 50.1, 97.91 57.07 C 94.66 61.96, 89.68 64.99, 83.26 66 C 82.81 66.07, 70.18 66.83, 55.2 67.69 C 24.82 69.43, 27.03 69.23, 24.18 70.4 C 19.9 72.15, 14.84 75.7, 10.65 79.89 C 4.86 85.68, 1.3 91.91, 0.25 98.13 C 0.12 98.85, 0.08 103.13, 0.04 116.66 L 0 134.26 9.5 134.26 L 19 134.26 19.05 119.41 C 19.1 103.27, 19.08 103.82, 19.82 101.04 C 21.79 93.65, 27.86 88.75, 36.45 87.63 C 37.23 87.53, 39.41 87.5, 43.57 87.53 C 50.12 87.59, 50.75 87.65, 53.22 88.45 C 56.61 89.56, 59.67 91.86, 62.02 95.07 C 62.52 95.76, 69.35 103.85, 77.2 113.07 C 85.04 122.28, 91.63 130.04, 91.85 130.32 C 92.07 130.59, 92.5 131.34, 92.82 131.97 C 93.52 133.35, 94.11 133.93, 95.06 134.13 C 95.5 134.23, 98.97 134.26, 106.36 134.23 L 117.01 134.19 100.82 113.07 C 91.91 101.45, 84.52 91.78, 84.39 91.57 C 83.36 89.89, 83.66 87.53, 85.09 86 C 85.79 85.25, 86.36 84.94, 88.07 84.38 C 96.18 81.72, 104.15 76.62, 109.97 70.36 C 120.59 58.93, 124.06 44.32, 119.44 30.43 C 114.59 15.81, 101.93 4.02, 87.64 0.83 C 83.93 0.01, 88.09 0.08, 41.85 0.04 L 0.01 0 0.01 0.81 Z";

/** remocn.dev logo: R mark (0.76em, on the baseline) + "emocn" in Manrope 600. */
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

function Accented({ text, accent }: { text: string; accent: string }) {
  const parts = text.split(/([.!?])/);
  return (
    <>
      {parts.map((p, i) =>
        /^[.!?]$/.test(p) ? (
          <span key={`${i}-${p}`} style={{ color: accent }}>
            {p}
          </span>
        ) : (
          p
        ),
      )}
    </>
  );
}

interface Snap {
  from: number;
  to: number;
  start: number;
}

function snapState(t: number, s: Snap) {
  const steps = Math.abs(s.to - s.from);
  const dir = Math.sign(s.to - s.from);
  const local = t - s.start;
  const total = steps * STEP;
  const appear = interpolate(local, [-8, -2], [0, 1], CLAMP);
  if (local <= 0) {
    return { pos: s.from, appear, moving: 0, landed: s.from, since: local };
  }
  if (local >= total) {
    return { pos: s.to, appear, moving: 0, landed: s.to, since: local - total };
  }
  const k = Math.floor(local / STEP);
  const frac = Math.min(1, (local - k * STEP) / MOVE);
  const e = EASE_SNAP(frac);
  const landedK = frac >= 1 ? k + 1 : k;
  return {
    pos: s.from + dir * (k + e),
    appear,
    moving: 1,
    landed: s.from + dir * landedK,
    since: frac >= 1 ? local - k * STEP - MOVE : local - k * STEP,
  };
}

export function GridSnapPoster({
  title = "Launch films,\nset in motion.",
  number = "3.0",
  body = "Production-ready motion for launch videos. Install a component, drop in your words, render.",
  name = "remocn",
  logo,
  accent = "#3B5BFD",
  theme = "dark",
  speed = 1,
}: GridSnapPosterProps) {
  const t = useCurrentFrame() * speed;
  const { width: W, height: H } = useVideoConfig();
  const u = H / 720;
  const c = THEMES[theme];

  const mX = W * 0.075;
  const mY = H * 0.1;
  const cw = W - mX * 2;
  const g = 16 * u;
  const colW = (cw - g * (COLS - 1)) / COLS;
  const colX = (k: number) => mX + k * (colW + g);
  const span = (n: number) => n * colW + (n - 1) * g;
  const hair = Math.max(1, u);

  const lines = title.split("\n").map((l) => l.trim());
  const headTrack = -0.035;
  const headF = Math.min(
    82 * u,
    span(9) / Math.max(...lines.map((l) => em(l, headTrack))),
  );
  const headLead = 0.98;
  const headLastBase = H - mY;
  const headTop =
    headLastBase - (lines.length - 1) * headLead * headF - BASELINE * headF;

  const numTrack = -0.045;
  const numMaxH = headTop + (BASELINE - CAP) * headF - mY - 56 * u;
  const numF = Math.min(
    numMaxH / CAP,
    span(8) / Math.max(0.6, em(number, numTrack)),
  );
  const numTop = mY - (BASELINE - CAP) * numF + 0.012 * numF;

  const numSnap: Snap = { from: 4, to: 0, start: 20 };
  const headSnap: Snap = { from: 3, to: 0, start: 32 };
  const bodySnap: Snap = { from: 6, to: 9, start: 54 };
  const logoSnap: Snap = { from: 10, to: 9, start: 66 };
  const snaps = [numSnap, headSnap, bodySnap, logoSnap].map((s) =>
    snapState(t, s),
  );

  const gridFade = interpolate(t, [GRID_FADE, GRID_FADE + 22], [1, 0], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const band = (i: number) =>
    interpolate(t, [i * 2, i * 2 + 18], [0, 1], { ...CLAMP, easing: EASE_IO });
  const ruleP = interpolate(t, [4, 34], [0, 1], { ...CLAMP, easing: EASE_IO });

  const flash = (k: number) => {
    let f = 0;
    for (const s of snaps) {
      if (s.landed === k && s.since >= 0 && s.appear > 0.5) {
        f = Math.max(f, Math.exp(-s.since / 5));
      }
    }
    return f;
  };

  const bodyF = 18 * u;
  const push = interpolate(t, [GRID_FADE, GRID_FADE + 70], [1, 1.012], {
    ...CLAMP,
    easing: EASE_IO,
  });

  const guide = (i: number) => {
    const s = snaps[i];
    const o = s.moving ? 1 : Math.exp(-Math.max(0, s.since) / 4) * s.appear;
    return (
      <div
        key={`g${i}`}
        style={{
          position: "absolute",
          left: colX(s.pos) - hair,
          top: mY,
          width: hair * 2,
          height: H - mY * 2,
          background: accent,
          opacity: o * gridFade * (s.since > -2 ? 1 : 0),
        }}
      />
    );
  };

  return (
    <AbsoluteFill style={{ background: c.bg, overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 70% 80% at 30% 30%, ${c.key}, transparent 70%)`,
        }}
      />
      <AbsoluteFill
        style={{ transform: `scale(${push})`, transformOrigin: "40% 50%" }}
      >
        <div style={{ position: "absolute", inset: 0, opacity: gridFade }}>
          {Array.from({ length: COLS }, (_, i) => {
            const p = band(i);
            return (
              <div
                key={`b${i}`}
                style={{
                  position: "absolute",
                  left: colX(i),
                  top: mY,
                  width: colW,
                  height: (H - mY * 2) * p,
                  background: hexA(accent, c.band + flash(i) * 0.2),
                  borderLeft: `${hair}px solid ${hexA(accent, 0.28)}`,
                  borderRight: `${hair}px solid ${hexA(accent, 0.28)}`,
                  boxSizing: "border-box",
                }}
              />
            );
          })}
          {[mY, H - mY].map((y) => (
            <div
              key={`h${y}`}
              style={{
                position: "absolute",
                left: mX,
                top: y - hair / 2,
                width: cw * ruleP,
                height: hair,
                background: c.hair,
              }}
            />
          ))}
        </div>

        {[0, 1, 2, 3].map(guide)}

        <div
          style={{
            position: "absolute",
            left: colX(snaps[0].pos) - 0.05 * numF,
            top: numTop,
            fontFamily: geist,
            fontWeight: 500,
            fontSize: numF,
            lineHeight: 1,
            letterSpacing: `${numTrack}em`,
            whiteSpace: "pre",
            backgroundImage: meshFill(theme, t),
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
            opacity: snaps[0].appear,
          }}
        >
          {number}
        </div>

        <div
          style={{
            position: "absolute",
            left: colX(snaps[1].pos) - 0.04 * headF,
            top: headTop,
            fontFamily: geist,
            fontWeight: 500,
            fontSize: headF,
            lineHeight: headLead,
            letterSpacing: `${headTrack}em`,
            whiteSpace: "pre",
            color: c.fg,
            opacity: snaps[1].appear,
          }}
        >
          {lines.map((l, i) => (
            <div key={`${i}-${l}`}>
              <Accented text={l} accent={accent} />
            </div>
          ))}
        </div>

        {body ? (
          <div
            style={{
              position: "absolute",
              left: colX(snaps[2].pos),
              bottom: mY - 0.3 * bodyF,
              width: span(3),
              fontFamily: geist,
              fontWeight: 400,
              fontSize: bodyF,
              lineHeight: 1.4,
              letterSpacing: "-0.005em",
              color: c.muted,
              textWrap: "pretty",
              opacity: snaps[2].appear,
            }}
          >
            {body}
          </div>
        ) : null}

        <div
          style={{
            position: "absolute",
            left: colX(snaps[3].pos),
            top: mY,
            fontFamily: geist,
            fontWeight: 500,
            fontSize: 26 * u,
            lineHeight: 1,
            letterSpacing: "-0.02em",
            color: c.fg,
            opacity: snaps[3].appear,
          }}
        >
          {logo ??
            (name === "remocn" ? (
              <RemocnLogo fontSize={28 * u} color={c.fg} />
            ) : (
              name
            ))}
        </div>
      </AbsoluteFill>
      <Grain opacity={c.grain} />
    </AbsoluteFill>
  );
}
