"use client";

import { loadFont } from "@remotion/google-fonts/InstrumentSerif";
import { useEffect, useId, useRef, useState } from "react";
import {
  AbsoluteFill,
  continueRender,
  delayRender,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const serif = loadFont("normal", { weights: ["400"], subsets: ["latin"] });
const serifItalic = loadFont("italic", {
  weights: ["400"],
  subsets: ["latin"],
});

export interface PathTextProps {
  text?: string;
  /** Trailing word(s) of `text` set in italic, the editorial accent. */
  italicWords?: number;
  /** How loose the opening curve is, as a fraction of the canvas height. */
  looseness?: number;
  /** Kept for the shared draft API; the stroke takes the theme's gradient instead. */
  accent?: string;
  theme?: "dark" | "light";
  speed?: number;
}

const THEMES = {
  dark: { bg: "#0A0A0B", fg: "#F3F2EF" },
  light: { bg: "#F5F4F0", fg: "#121214" },
} as const;

// One gradients.sh palette per theme, laid along the stroke left to right and
// sliding a few percent as it draws. Dark: "aurora" (mint, teal, indigo,
// orchid). Light: "ribbon" without its yellow, which would vanish on off-white.
const STROKE = {
  dark: ["#a0f0c8", "#3fb5a3", "#5147b6", "#b25c9c"],
  light: ["#ff8a3d", "#ff3d9a", "#7a5cff", "#4a3cd6"],
} as const;

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_IO = Easing.bezier(0.65, 0, 0.35, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const PROBE = 200;
const TRACK = -0.012;
/**
 * The loose stroke, as y offsets in units of `looseness`: a low start, a
 * crest left of centre, a wide shallow valley, a flick up at the tail. The
 * valley is broad so the glyphs riding it never crowd into a tight bend.
 */
const SHAPE = [0.9, 0.35, -0.35, -0.75, -0.6, -0.12, 0.26, 0.3, 0.1];
const POINTS = SHAPE.length;

interface Pt {
  x: number;
  y: number;
}

function hash(n: number) {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
}

/** Catmull-Rom through the points, written as cubic Béziers. */
function smoothPath(pts: Pt[]) {
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${c1x} ${c1y} ${c2x} ${c2y} ${p2.x} ${p2.y}`;
  }
  return d;
}

function splitItalic(text: string, italicWords: number) {
  if (italicWords <= 0) return [text, ""] as const;
  const parts = text.split(" ");
  const k = Math.max(0, parts.length - italicWords);
  const roman = parts.slice(0, k).join(" ");
  const italic = parts.slice(k).join(" ");
  return [roman ? `${roman} ` : "", italic] as const;
}

function useTextWidth(roman: string, italic: string) {
  const [width, setWidth] = useState<number | null>(null);
  const [handle] = useState(() => delayRender("path-text: measuring"));
  const released = useRef(false);

  useEffect(() => {
    let live = true;
    Promise.all([
      serif.waitUntilDone(),
      serifItalic.waitUntilDone(),
      document.fonts.load(`400 100px "${serif.fontFamily}"`),
      document.fonts.load(`italic 400 100px "${serif.fontFamily}"`),
    ])
      .catch(() => undefined)
      .then(() => {
        if (!live) return;
        const ctx = document.createElement("canvas").getContext("2d");
        let em = (roman.length + italic.length) * 0.42;
        if (ctx) {
          ctx.font = `400 ${PROBE}px "${serif.fontFamily}"`;
          em = ctx.measureText(roman).width / PROBE;
          ctx.font = `italic 400 ${PROBE}px "${serif.fontFamily}"`;
          em += ctx.measureText(italic).width / PROBE;
        }
        setWidth(em + TRACK * [...roman, ...italic].length);
        if (!released.current) {
          released.current = true;
          continueRender(handle);
        }
      });
    return () => {
      live = false;
    };
  }, [roman, italic, handle]);

  return width;
}

export function PathText({
  text = "From rough to ready.",
  italicWords = 1,
  looseness = 0.15,
  theme = "dark",
  speed = 1,
}: PathTextProps) {
  const t = useCurrentFrame() * speed;
  const { width: W, height: H } = useVideoConfig();
  const c = THEMES[theme];
  const u = W / 1280;
  const id = `pt${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const gradId = `${id}g`;
  const [roman, italic] = splitItalic(text, italicWords);
  const em = useTextWidth(roman, italic);

  if (em === null)
    return <div style={{ position: "absolute", inset: 0, background: c.bg }} />;

  const size = Math.min(H * 0.22, (W * 0.82) / em);
  const textW = em * size;
  const gap = size * 0.3;
  const baseline = H / 2 + size * 0.24;
  const lineY = baseline + gap;

  // Beats: draw the loose stroke, write the words onto it, pull it taut.
  const drawIn = interpolate(t, [0, 26], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const morphStart = 46;
  const morphLen = 40;
  const thin = interpolate(t, [morphStart + 6, morphStart + morphLen], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });

  const amp = H * looseness;
  const startSpan = W * 0.86;
  const endSpan = textW + size * 0.7;
  const pts: Pt[] = [];
  for (let k = 0; k < POINTS; k++) {
    const f = k / (POINTS - 1);
    // Points straighten in a left-to-right ripple, like a string pulled taut.
    const p = EASE_IO(
      interpolate(
        t,
        [morphStart + f * 10, morphStart + morphLen - 10 + f * 10],
        [0, 1],
        CLAMP,
      ),
    );
    const wobble = (hash(k + 3) - 0.5) * amp * 0.16;
    const wave = SHAPE[k] * amp;
    const sx =
      W / 2 - startSpan / 2 + startSpan * f + (hash(k + 11) - 0.5) * 18 * u;
    const sy = lineY + wave + wobble;
    const ex = W / 2 - endSpan / 2 + endSpan * f;
    pts.push({ x: sx + (ex - sx) * p, y: sy + (lineY - sy) * p });
  }
  const d = smoothPath(pts);

  const stroke = interpolate(
    thin,
    [0, 1],
    [size * 0.075, Math.max(3, size * 0.042)],
  );
  const romanCount = [...roman].length;
  const glyphs = [...roman, ...italic];
  const slide = interpolate(t, [0, 110], [0, 0.1], CLAMP);
  const palette = STROKE[theme];
  const gradSpan = startSpan + (endSpan - startSpan) * thin;
  const writeStart = 14;

  return (
    <AbsoluteFill style={{ background: c.bg, overflow: "hidden" }}>
      <svg
        width={W}
        height={H}
        viewBox={`0 0 ${W} ${H}`}
        style={{ position: "absolute", inset: 0 }}
        aria-hidden
      >
        <defs>
          <path id={id} d={d} />
          <linearGradient
            id={gradId}
            gradientUnits="userSpaceOnUse"
            x1={W / 2 - gradSpan / 2}
            y1={0}
            x2={W / 2 + gradSpan / 2}
            y2={0}
          >
            {palette.map((col, k) => (
              <stop
                key={col}
                offset={Math.min(1, Math.max(0, k / 3 - 0.05 + slide))}
                stopColor={col}
              />
            ))}
          </linearGradient>
        </defs>
        <path
          d={d}
          pathLength={1}
          fill="none"
          stroke={`url(#${gradId})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray="1 1"
          strokeDashoffset={1 - drawIn}
        />
        <text
          fontFamily={serif.fontFamily}
          fontSize={size}
          letterSpacing={`${TRACK}em`}
          fill={c.fg}
          dy={-interpolate(thin, [0, 1], [size * 0.06, gap])}
        >
          <textPath href={`#${id}`} startOffset="50%" textAnchor="middle">
            {glyphs.map((g, i) => {
              const o = interpolate(
                t,
                [writeStart + i * 2, writeStart + i * 2 + 8],
                [0, 1],
                { ...CLAMP, easing: EASE_OUT },
              );
              return (
                <tspan
                  key={i}
                  opacity={o}
                  fontStyle={i >= romanCount ? "italic" : undefined}
                >
                  {g}
                </tspan>
              );
            })}
          </textPath>
        </text>
      </svg>
    </AbsoluteFill>
  );
}
