"use client";

import { loadFont } from "@remotion/google-fonts/InstrumentSans";
import { loadFont as loadSerif } from "@remotion/google-fonts/InstrumentSerif";
import { useId } from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const { fontFamily: sans } = loadFont("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});
const { fontFamily: serif } = loadSerif("normal", {
  weights: ["400"],
  subsets: ["latin"],
});
// the highlighted phrase turns italic
loadSerif("italic", { weights: ["400"], subsets: ["latin"] });

/** gradients.sh "silk" (#3b3fd8 #f3d6c0 #8a7bff): a diagonal sheen for the big mark. */
const silk = (deg: number) =>
  `linear-gradient(${deg}deg, #B3A6FF 8%, #5B4FE8 19%, #3B3FD8 25%, #B08FD8 31%, #F3D6C0 37%)`;

export interface Quote {
  /** The testimonial, without quote marks: curly marks are added for you. */
  quote: string;
  /** A phrase from `quote` that gets the highlighter sweep. */
  highlight?: string;
  name: string;
  role: string;
  company: string;
  /** Portrait URL; initials on a neutral disc when absent. */
  avatar?: string;
}

export interface QuoteHeroProps {
  quotes?: Quote[];
  /** Frames each quote owns, including its exit. */
  quoteDuration?: number;
  accent?: string;
  /** Playback multiplier. */
  speed?: number;
  theme?: "dark" | "light";
}

const DEFAULT_QUOTES: Quote[] = [
  {
    quote:
      "remocn turned our launch video from a two-week agency project into an afternoon. We shipped it the same day.",
    highlight: "into an afternoon",
    name: "Maya Chen",
    role: "Head of Design",
    company: "Kitebase",
  },
  {
    quote:
      "The components feel art-directed, not generated. Our changelog videos finally look like the product.",
    highlight: "finally look like the product",
    name: "Leo Park",
    role: "Founder",
    company: "Fernway",
  },
];

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_IO = Easing.bezier(0.65, 0, 0.35, 1);
const EASE_IN = Easing.bezier(0.5, 0, 0.75, 0);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const THEMES = {
  dark: {
    bg: "#0A0A0B",
    key: "rgba(255,255,255,0.06)",
    fg: "#F3F2EF",
    muted: "#8B8A90",
    hair: "rgba(255,255,255,0.14)",
    disc: "#1D1D20",
    discRing: "rgba(255,255,255,0.08)",
    marker: 0.85,
    grain: 0.07,
  },
  light: {
    bg: "#F5F4F0",
    key: "rgba(255,255,255,0.95)",
    fg: "#121214",
    muted: "#6E6C67",
    hair: "rgba(18,18,20,0.14)",
    disc: "#E6E3DC",
    discRing: "rgba(18,18,20,0.06)",
    marker: 0.42,
    grain: 0.045,
  },
} as const;

type Theme = (typeof THEMES)[keyof typeof THEMES];

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
          seed={7}
          stitchTiles="stitch"
        />
        <feColorMatrix values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0.9 0" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#${id})`} />
    </svg>
  );
}

function withAlpha(color: string, a: number) {
  const m = /^#([0-9a-f]{6})$/i.exec(color);
  if (!m) return color;
  const v = Number.parseInt(m[1], 16);
  return `rgba(${(v >> 16) & 255},${(v >> 8) & 255},${v & 255},${a})`;
}

function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Rough advance widths for Instrument Serif, in em. Good enough to balance lines. */
function measure(word: string) {
  let w = 0;
  for (const ch of word) {
    if (/[A-Z]/.test(ch)) w += 0.6;
    else if (/[mw]/.test(ch)) w += 0.66;
    else if (/[ijlft.,;:'’!-]/.test(ch)) w += 0.25;
    else if (/[0-9]/.test(ch)) w += 0.48;
    else w += 0.43;
  }
  return w * 0.84;
}

/** Balanced wrap: aim every line at total / lineCount instead of filling greedily. */
function balance(words: string[], maxEm: number) {
  const space = 0.22;
  const widths = words.map(measure);
  const total = widths.reduce((a, b) => a + b, 0) + space * (words.length - 1);
  const wrap = (target: number) => {
    const lines: number[][] = [[]];
    let w = 0;
    widths.forEach((ww, i) => {
      const line = lines[lines.length - 1];
      const next = line.length ? w + space + ww : ww;
      if (line.length && next > target) {
        lines.push([i]);
        w = ww;
      } else {
        line.push(i);
        w = next;
      }
    });
    return lines;
  };
  const count = Math.max(1, Math.ceil(total / (maxEm * 0.94)));
  const balanced = wrap(Math.min(maxEm, (total / count) * 1.06));
  return balanced.length <= count ? balanced : wrap(maxEm);
}

/** Where the big mark's box starts, in G, relative to the first line. Tuned by eye. */
const MARK_TOP = -0.1;

interface Piece {
  text: string;
  hl: boolean;
}

/** Splits the quote into lines of pieces, marking the highlighted phrase. */
function layout(quote: string, highlight: string | undefined, maxEm: number) {
  const words = `“${quote.trim()}”`.split(/\s+/);
  const lines = balance(words, maxEm);
  const joined = words.join(" ");
  const hs = highlight ? joined.indexOf(highlight) : -1;
  const he = hs >= 0 && highlight ? hs + highlight.length : -1;
  const starts: number[] = [];
  let off = 0;
  for (const w of words) {
    starts.push(off);
    off += w.length + 1;
  }
  return lines.map((idx, li) => {
    const pieces: Piece[] = [];
    const push = (text: string, hl: boolean) => {
      if (!text) return;
      const last = pieces[pieces.length - 1];
      if (last && last.hl === hl) last.text += text;
      else pieces.push({ text, hl });
    };
    idx.forEach((wi, k) => {
      let w = words[wi];
      // the opening mark hangs in the margin; it is drawn separately
      if (li === 0 && k === 0) w = w.slice(1);
      const s = starts[wi] + (li === 0 && k === 0 ? 1 : 0);
      const e = s + w.length;
      if (k > 0) {
        const spaceHl = hs >= 0 && s - 1 >= hs && s - 1 < he;
        push(" ", spaceHl);
      }
      if (hs < 0 || e <= hs || s >= he) {
        push(w, false);
      } else {
        const a = Math.max(hs, s) - s;
        const b = Math.min(he, e) - s;
        push(w.slice(0, a), false);
        push(w.slice(a, b), true);
        push(w.slice(b), false);
      }
    });
    return pieces;
  });
}

function CompanyMark({
  company,
  size,
  color,
}: {
  company: string;
  size: number;
  color: string;
}) {
  const v = hash(`${company}:mark`) % 4;
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" aria-hidden>
      {v === 0 ? (
        <path
          d="M10 2a8 8 0 1 0 0 16 8 8 0 0 0 0-16zm0 4.5a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7z"
          fill={color}
          fillRule="evenodd"
        />
      ) : v === 1 ? (
        <>
          <rect x="2" y="3" width="16" height="6" rx="3" fill={color} />
          <rect x="2" y="11" width="10" height="6" rx="3" fill={color} />
        </>
      ) : v === 2 ? (
        <path d="M10 1.5l8.5 8.5-8.5 8.5L1.5 10z" fill={color} />
      ) : (
        <path
          d="M2 18V10a8 8 0 0 1 16 0v8h-5v-8a3 3 0 0 0-6 0v8z"
          fill={color}
        />
      )}
    </svg>
  );
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((p) => p[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function QuoteBlock({
  q,
  t,
  start,
  exitAt,
  u,
  c,
  accent,
  width,
  height,
}: {
  q: Quote;
  t: number;
  start: number;
  exitAt: number;
  u: number;
  c: Theme;
  accent: string;
  width: number;
  height: number;
}) {
  const F = 70 * u;
  const LH = 1.1;
  const maxW = width * 0.7;
  const lines = layout(q.quote, q.highlight, maxW / F);
  const left = width * 0.19;
  const authorGap = 52 * u;
  const avatar = 60 * u;
  const blockH = lines.length * F * LH + authorGap + avatar;
  const top = (height - blockH) / 2 - 6 * u;

  const lineAt = (i: number) => start + i * 5;
  const revealEnd = lineAt(lines.length - 1) + 16;
  const authorAt = revealEnd - 6;
  const sweepAt = revealEnd + 4;

  const out = interpolate(t, [exitAt, exitAt + 12], [0, 1], {
    ...CLAMP,
    easing: EASE_IN,
  });
  if (t < start - 1 || out >= 1) return null;

  // highlight pieces sweep one after another, timed by their length
  const hlLengths: number[] = [];
  for (const line of lines)
    for (const p of line) if (p.hl) hlLengths.push(p.text.length);
  const hlTotal = hlLengths.reduce((a, b) => a + b, 0) || 1;
  const SWEEP = 18;
  let hlIndex = 0;
  let hlOffset = 0;

  const G = 7.6 * F; // the big mark
  const markIn = interpolate(t, [start - 2, start + 20], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const drift = interpolate(t, [start, start + 200], [0, 1], CLAMP);

  const settle = (k: number) =>
    interpolate(t, [authorAt + k * 3, authorAt + k * 3 + 18], [0, 1], {
      ...CLAMP,
      easing: EASE_OUT,
    });

  const markerColor = withAlpha(accent, c.marker);

  return (
    <div
      style={{
        position: "absolute",
        left,
        top,
        width: maxW,
        opacity: 1 - out,
        transform: `translateY(${-out * 14 * u}px)`,
        filter: out > 0.02 ? `blur(${out * 4 * u}px)` : undefined,
      }}
    >
      {/* the opening mark: oversized, hung in the margin, filled with silk */}
      <div
        style={{
          position: "absolute",
          right: "100%",
          top: MARK_TOP * G,
          marginRight: 0.02 * F,
          opacity: markIn,
        }}
      >
        <div
          style={{
            fontFamily: serif,
            fontWeight: 400,
            fontSize: G,
            lineHeight: 1,
            // the glyph only uses the top ~half of its em box: the sheen's stops sit there
            backgroundImage: silk(152 + drift * 16),
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
            transform: `translateY(${(1 - markIn) * 0.08 * G}px)`,
          }}
        >
          {"“"}
        </div>
      </div>
      {lines.map((pieces, li) => {
        const p = interpolate(t, [lineAt(li), lineAt(li) + 18], [0, 1], {
          ...CLAMP,
          easing: EASE_OUT,
        });
        return (
          <div
            key={li}
            style={{
              // vertical mask only; room for descenders and the marker
              clipPath: "inset(0 -50% 0 -50%)",
              paddingBottom: 0.16 * F,
              marginBottom: -0.16 * F,
            }}
          >
            <div
              style={{
                position: "relative",
                transform: `translateY(${(1 - p) * 112}%)`,
                fontFamily: serif,
                fontWeight: 400,
                fontSize: F,
                lineHeight: LH,
                letterSpacing: "-0.012em",
                color: c.fg,
                whiteSpace: "pre",
              }}
            >
              {pieces.map((piece, pi) => {
                if (!piece.hl) return <span key={pi}>{piece.text}</span>;
                const from =
                  sweepAt + (hlOffset / hlTotal) * SWEEP + hlIndex * 1;
                const dur = Math.max(6, (piece.text.length / hlTotal) * SWEEP);
                hlOffset += piece.text.length;
                hlIndex += 1;
                const s = interpolate(t, [from, from + dur], [0, 1], {
                  ...CLAMP,
                  easing: hlIndex === 1 ? EASE_IO : EASE_OUT,
                });
                return (
                  <span
                    key={pi}
                    style={{
                      position: "relative",
                      display: "inline-block",
                      isolation: "isolate",
                    }}
                  >
                    <span
                      style={{
                        position: "absolute",
                        left: -0.05 * F,
                        right: -0.05 * F,
                        bottom: 0.1 * F,
                        height: 0.2 * F,
                        borderRadius: 0.05 * F,
                        background: markerColor,
                        zIndex: -1,
                        transform: "rotate(-0.4deg)",
                        clipPath: `inset(0 ${(1 - s) * 100}% 0 0)`,
                      }}
                    />
                    <span style={{ fontStyle: "italic" }}>{piece.text}</span>
                  </span>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* author */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16 * u,
          marginTop: authorGap,
          fontFamily: sans,
        }}
      >
        <div
          style={{
            width: avatar,
            height: avatar,
            borderRadius: "50%",
            overflow: "hidden",
            flexShrink: 0,
            background: c.disc,
            boxShadow: `inset 0 0 0 ${Math.max(1, u)}px ${c.discRing}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: c.fg,
            fontWeight: 500,
            fontSize: 18 * u,
            letterSpacing: "-0.01em",
            opacity: settle(0),
            transform: `translateY(${(1 - settle(0)) * 14 * u}px) scale(${0.94 + settle(0) * 0.06})`,
          }}
        >
          {q.avatar ? (
            <Img
              src={q.avatar}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            initials(q.name)
          )}
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 5 * u,
            opacity: settle(1),
            transform: `translateY(${(1 - settle(1)) * 14 * u}px)`,
          }}
        >
          <span
            style={{
              color: c.fg,
              fontWeight: 500,
              fontSize: 21 * u,
              letterSpacing: "-0.015em",
              lineHeight: 1.1,
            }}
          >
            {q.name}
          </span>
          <span
            style={{
              color: c.muted,
              fontWeight: 400,
              fontSize: 17 * u,
              lineHeight: 1.1,
            }}
          >
            {q.role}, {q.company}
          </span>
        </div>
        <div
          style={{
            width: Math.max(1, u),
            height: 34 * u,
            margin: `0 ${12 * u}px`,
            background: c.hair,
            transform: `scaleY(${settle(2)})`,
          }}
        />
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8 * u,
            color: c.fg,
            opacity: settle(3) * 0.88,
            transform: `translateY(${(1 - settle(3)) * 14 * u}px)`,
          }}
        >
          <CompanyMark company={q.company} size={22 * u} color={c.fg} />
          <span
            style={{
              fontWeight: 500,
              fontSize: 23 * u,
              letterSpacing: "-0.03em",
              lineHeight: 1,
            }}
          >
            {q.company.toLowerCase()}
          </span>
        </div>
      </div>
    </div>
  );
}

export function QuoteHero({
  quotes = DEFAULT_QUOTES,
  quoteDuration = 120,
  accent = "#3B5BFD",
  speed = 1,
  theme = "dark",
}: QuoteHeroProps) {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const t = frame * speed;
  const u = Math.min(width / 1280, height / 720);
  const c = THEMES[theme];
  const n = quotes.length;
  const total = 6 + n * quoteDuration;
  const push = interpolate(t, [0, total], [0, 1], CLAMP);

  return (
    <AbsoluteFill style={{ background: c.bg, overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 65% 75% at 40% 40%, ${c.key}, transparent 72%)`,
        }}
      />
      <AbsoluteFill
        style={{
          transform: `scale(${1 + push * 0.03})`,
          transformOrigin: "30% 50%",
        }}
      >
        {quotes.map((q, i) => {
          const start = 6 + i * quoteDuration;
          const exitAt = i === n - 1 ? 1e9 : start + quoteDuration - 8;
          return (
            <QuoteBlock
              key={i}
              q={q}
              t={t}
              start={start}
              exitAt={exitAt}
              u={u}
              c={c}
              accent={accent}
              width={width}
              height={height}
            />
          );
        })}
      </AbsoluteFill>
      <Grain opacity={c.grain} />
    </AbsoluteFill>
  );
}
