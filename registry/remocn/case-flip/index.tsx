"use client";

import { loadFont } from "@remotion/google-fonts/BricolageGrotesque";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import {
  AbsoluteFill,
  continueRender,
  delayRender,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const face = loadFont("normal", { weights: ["500"], subsets: ["latin"] });

export interface CaseFlipProps {
  /** The headline in its final casing. */
  text?: string;
  /** Word (as written in `text`) that lands in the accent color. */
  accentWord?: string;
  /** Frames between neighbouring glyphs in each wave. */
  stagger?: number;
  showGuides?: boolean;
  accent?: string;
  theme?: "dark" | "light";
  speed?: number;
}

const THEMES = {
  dark: { bg: "#0A0A0B", fg: "#F3F2EF" },
  light: { bg: "#F5F4F0", fg: "#121214" },
} as const;

// gradients.sh "halo" (bg #030306): warm peach through rose into blue. It
// fills the accent word once it lands, left to right, and its stops slide a
// few percent while the word holds. Light drops the palest stop.
const HALO = {
  dark: ["#ffb36b", "#e2457a", "#3d4dff"],
  light: ["#f08a3a", "#d6336c", "#3d4dff"],
} as const;

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_IO = Easing.bezier(0.65, 0, 0.35, 1);
const EASE_IN = Easing.bezier(0.55, 0, 0.9, 0.4);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const WEIGHT = 500;
const PROBE = 200;
const TRACK_LOWER = -0.035;
const TRACK_UPPER = -0.01;
const FLIP = 10;

/** Per-slot glyph forms for the three casing stages: lower, UPPER, final. */
type Forms = [string, string, string];

interface Metrics {
  /** adv[i][own stage][next stage], in em, kerned against the next glyph. */
  adv: number[][][];
  /** Unkerned advance of each stage's glyph, in em. */
  plain: number[][];
  xHeight: number;
  capHeight: number;
}

function buildForms(text: string): Forms[] {
  return [...text].map((ch) => [ch.toLowerCase(), ch.toUpperCase(), ch]);
}

function isUpperLetter(ch: string) {
  return ch !== ch.toLowerCase() && ch === ch.toUpperCase();
}

function measure(forms: Forms[]): Metrics {
  const ctx = document.createElement("canvas").getContext("2d");
  const fallback = forms.map((f) =>
    [0, 1, 2].map((s) => [0, 1, 2].map(() => (f[s] === " " ? 0.26 : 0.6))),
  );
  if (!ctx) {
    return {
      adv: fallback,
      plain: fallback.map((a) => a.map((row) => row[0])),
      xHeight: 0.55,
      capHeight: 0.73,
    };
  }
  ctx.font = `${WEIGHT} ${PROBE}px "${face.fontFamily}"`;
  const w = (s: string) => ctx.measureText(s).width / PROBE;
  const adv = forms.map((f, i) => {
    const next = forms[i + 1];
    return [0, 1, 2].map((s) => {
      const own = f[s];
      const track = isUpperLetter(own) ? TRACK_UPPER : TRACK_LOWER;
      return [0, 1, 2].map((n) => {
        const kerned = next ? w(own + next[n]) - w(next[n]) : w(own);
        return kerned + (own === " " ? 0 : track);
      });
    });
  });
  const plain = forms.map((f) => f.map((g) => w(g)));
  const xHeight = ctx.measureText("x").actualBoundingBoxAscent / PROBE;
  const capHeight = ctx.measureText("H").actualBoundingBoxAscent / PROBE;
  return {
    adv,
    plain,
    xHeight: xHeight > 0 ? xHeight : 0.55,
    capHeight: capHeight > 0 ? capHeight : 0.73,
  };
}

function useMetrics(forms: Forms[]) {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [handle] = useState(() => delayRender("case-flip: measuring glyphs"));
  const released = useRef(false);

  useEffect(() => {
    let live = true;
    Promise.all([
      face.waitUntilDone(),
      document.fonts.load(`${WEIGHT} 100px "${face.fontFamily}"`),
    ])
      .catch(() => undefined)
      .then(() => {
        if (!live) return;
        setMetrics(measure(forms));
        if (!released.current) {
          released.current = true;
          continueRender(handle);
        }
      });
    return () => {
      live = false;
    };
  }, [forms, handle]);

  return metrics;
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

/** Sample a 3×3 table at fractional (stage, nextStage), bilinear. */
function sample(table: number[][], s: number, n: number) {
  const s0 = Math.min(1, Math.floor(s));
  const n0 = Math.min(1, Math.floor(n));
  const fs = s - s0;
  const fn = n - n0;
  const top = lerp(table[s0][n0], table[s0][n0 + 1], fn);
  const bottom = lerp(table[s0 + 1][n0], table[s0 + 1][n0 + 1], fn);
  return lerp(top, bottom, fs);
}

function mix(a: string, b: string, t: number) {
  const pa = Number.parseInt(a.slice(1), 16);
  const pb = Number.parseInt(b.slice(1), 16);
  const ch = (shift: number) =>
    Math.round(lerp((pa >> shift) & 255, (pb >> shift) & 255, t));
  return `rgb(${ch(16)}, ${ch(8)}, ${ch(0)})`;
}

function wordIndexOf(text: string, word: string) {
  if (!word) return [-1, -1];
  const at = text.indexOf(word);
  return at < 0 ? [-1, -1] : [at, at + word.length];
}

export function CaseFlip({
  text = "Launch it LOUD",
  accentWord = "LOUD",
  stagger = 2,
  showGuides = true,
  accent = "#3B5BFD",
  theme = "dark",
  speed = 1,
}: CaseFlipProps) {
  const t = useCurrentFrame() * speed;
  const { width: W, height: H } = useVideoConfig();
  const c = THEMES[theme];
  const u = W / 1280;
  const haloId = `cfh${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;

  const forms = useMemo(() => buildForms(text), [text]);
  const metrics = useMetrics(forms);
  const [accentFrom, accentTo] = wordIndexOf(text, accentWord);

  if (!metrics)
    return <div style={{ position: "absolute", inset: 0, background: c.bg }} />;

  const n = forms.length;
  const wave1 = 16;
  const wave2 = wave1 + (n - 1) * stagger + FLIP + 12;
  const settled = wave2 + (n - 1) * stagger + FLIP;

  // Stage of each slot (0 lower → 1 UPPER → 2 final) and its flip clocks.
  const local = forms.map((_, i) => {
    const q1 = interpolate(
      t,
      [wave1 + i * stagger, wave1 + i * stagger + FLIP],
      [0, 1],
      CLAMP,
    );
    const q2 = interpolate(
      t,
      [wave2 + i * stagger, wave2 + i * stagger + FLIP],
      [0, 1],
      CLAMP,
    );
    return { q1, q2 };
  });
  const stage = local.map(({ q1, q2 }) => EASE_IO(q1) + EASE_IO(q2));

  const widest = Math.max(
    ...[0, 1, 2].map((s) =>
      metrics.adv.reduce((sum, a, i) => sum + a[s][i < n - 1 ? s : 0], 0),
    ),
  );
  const size = Math.min(H * 0.3, (W * 0.92) / widest);
  const cap = metrics.capHeight * size;
  const xh = metrics.xHeight * size;
  const baseline = H / 2 + cap / 2;

  const advances = forms.map((_, i) =>
    sample(metrics.adv[i], stage[i], i < n - 1 ? stage[i + 1] : 0),
  );
  const lineW = advances.reduce((a, b) => a + b, 0) * size;
  let cursor = W / 2 - lineW / 2;

  const enter = interpolate(t, [0, 14], [0, 1], { ...CLAMP, easing: EASE_OUT });
  const guidesIn = interpolate(t, [2, 22], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const guidesOut = interpolate(t, [settled, settled + 20], [1, 0], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const guideHalf = (lineW / 2 + size * 0.5) * guidesIn;
  const hair = Math.max(1, u);

  const lineL = cursor;
  const accentL =
    lineL +
    advances.slice(0, Math.max(0, accentFrom)).reduce((a, b) => a + b, 0) *
      size;
  const accentW =
    advances
      .slice(Math.max(0, accentFrom), Math.max(0, accentTo))
      .reduce((a, b) => a + b, 0) * size;
  const drift = interpolate(t, [settled, settled + 50], [0, 0.08], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const halo = HALO[theme];

  const glyphs = forms.map((f, i) => {
    const x = cursor;
    const slot = advances[i] * size;
    cursor += slot;
    if (f[0] === " ") return null;

    const { q1, q2 } = local[i];
    const flipping2 = q2 > 0;
    const q = flipping2 ? q2 : q1;
    const from = flipping2 ? f[1] : f[0];
    const to = flipping2 ? f[2] : f[1];
    const changes = from !== to;
    const firstHalf = q < 0.5;
    const shown = changes && firstHalf ? from : to;
    const shownStage = flipping2 ? (firstHalf ? 1 : 2) : firstHalf ? 0 : 1;
    const nextStage = i < n - 1 ? stage[i + 1] : 0;
    const ownSlot = sample(metrics.adv[i], shownStage, nextStage) * size;
    const glyphW = metrics.plain[i][shownStage] * size;

    // Squash onto the baseline, swap the glyph, spring back up.
    let sy = 1;
    let sx = 1;
    if (q > 0 && q < 1) {
      if (changes) {
        if (firstHalf) {
          const k = EASE_IN(q / 0.5);
          sy = lerp(1, 0.06, k);
          sx = lerp(1, 1.1, k);
        } else {
          const k = (q - 0.5) / 0.5;
          sy = interpolate(k, [0, 0.65, 1], [0.06, 1.045, 1], {
            ...CLAMP,
            easing: EASE_OUT,
          });
          sx = interpolate(k, [0, 0.65, 1], [1.1, 0.985, 1], {
            ...CLAMP,
            easing: EASE_OUT,
          });
        }
      } else {
        const dip = Math.sin(Math.PI * q);
        sy = 1 - 0.1 * dip;
        sx = 1 + 0.03 * dip;
      }
    }

    const inAccent = i >= accentFrom && i < accentTo;
    // The wave front carries a brief accent tint; the accent word then takes
    // the halo gradient, faded in over its second flip.
    const pulse = changes ? Math.sin(Math.PI * q) * 0.55 : 0;
    const fill = pulse > 0 ? mix(c.fg, accent, pulse) : c.fg;
    const lit = inAccent ? EASE_OUT(q2) : 0;
    const cx = x + (slot - ownSlot) / 2 + glyphW / 2;
    const glyph = (paint: string, opacity: number, key: string) => (
      <text
        key={key}
        x={cx}
        y={baseline}
        textAnchor="middle"
        fontFamily={face.fontFamily}
        fontWeight={WEIGHT}
        fontSize={size}
        fill={paint}
        opacity={opacity}
        // Scale about the glyph's baseline point; at rest the transform is the
        // identity, so the shared gradient lines up across the whole word.
        transform={`translate(${cx} ${baseline}) scale(${sx} ${sy}) translate(${-cx} ${-baseline})`}
      >
        {shown}
      </text>
    );

    return (
      <g key={`${i}-${f[2]}`}>
        {lit < 1 ? glyph(fill, 1, "base") : null}
        {lit > 0 ? glyph(`url(#${haloId})`, lit, "halo") : null}
      </g>
    );
  });

  const guideYs = [baseline, baseline - xh, baseline - cap];

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
          <linearGradient
            id={haloId}
            gradientUnits="userSpaceOnUse"
            x1={accentL - accentW * 0.05}
            y1={baseline - cap}
            x2={accentL + accentW * 1.05}
            y2={baseline}
          >
            <stop offset={0.04 - drift} stopColor={halo[0]} />
            <stop offset={0.5 - drift} stopColor={halo[1]} />
            <stop offset={1 - drift} stopColor={halo[2]} />
          </linearGradient>
        </defs>
        {showGuides
          ? guideYs.map((y, k) => (
              <rect
                key={y}
                x={W / 2 - guideHalf}
                y={y - hair / 2}
                width={guideHalf * 2}
                height={hair}
                fill={c.fg}
                opacity={guidesIn * (k === 0 ? 0.16 : 0.1) * guidesOut}
              />
            ))
          : null}
        <g
          opacity={enter}
          transform={`translate(0 ${(1 - enter) * cap * 0.12})`}
        >
          {glyphs}
        </g>
      </svg>
    </AbsoluteFill>
  );
}
