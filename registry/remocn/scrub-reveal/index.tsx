"use client";

import { loadFont } from "@remotion/google-fonts/Geist";
import { loadVariableFont } from "@remotion/google-fonts/Newsreader";
import { useMemo } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  interpolateColors,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const { fontFamily } = loadFont("normal", {
  weights: ["500"],
  subsets: ["latin"],
});
/** Editorial italic for the highlight; optical size follows the font size. */
const serif = loadVariableFont("italic", { subsets: ["latin"] });

export interface ScrubRevealProps {
  /** The statement. Each word brightens as the reveal front passes it. */
  text?: string;
  /**
   * A phrase inside `text` that turns to an italic serif and lights up in a
   * gradient. Pass "" for none.
   */
  highlight?: string;
  accent?: string;
  /** Playback multiplier. */
  speed?: number;
  theme?: "dark" | "light";
}

// Beat sheet (30fps):
//  0–6     the dim paragraph is already on screen, low in frame, drifting up
//  4–122   one "scroll": the paragraph climbs while a soft front brightens it
//          word by word; both ride the same eased progress, like a real scrub
//  118–142 fully lit; the plain words settle a step back, the accent phrase holds
//  142–170 poster hold, the drift never quite stops
const SCROLL_START = 4;
const SCROLL_END = 122;
const SETTLE_START = 118;
const SETTLE_END = 142;

/** Trackpad scroll: eases in, carries steady velocity, glides to a stop. */
const SCROLL = Easing.bezier(0.3, 0.06, 0.22, 1);
const SETTLE = Easing.bezier(0.33, 0, 0.2, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

/** Width of the brightening front, in characters. */
const SOFT = 11;

/**
 * The highlight is filled with the gradients.sh "halo" palette (peach, rose,
 * into the accent blue); the light stage uses its deeper end for contrast.
 */
const THEMES = {
  dark: {
    bg: "#0A0A0B",
    fg: "#F5F5F4",
    dim: [42, 42, 45],
    rest: "#B9B9BC",
    halo: (accent: string) => ["#FFC394", "#F07A86", "#C25BC0", accent],
  },
  light: {
    bg: "#F5F4F0",
    fg: "#111113",
    dim: [218, 216, 210],
    rest: "#4A4946",
    halo: (accent: string) => ["#E2457A", "#B6449F", "#7148D8", accent],
  },
} as const;

interface Word {
  text: string;
  start: number;
  end: number;
  accent: boolean;
}

function splitWords(text: string, highlight: string): Word[] {
  const at = highlight ? text.indexOf(highlight) : -1;
  const hiEnd = at + highlight.length;
  const words: Word[] = [];
  for (const m of text.matchAll(/\S+/g)) {
    const start = m.index ?? 0;
    const end = start + m[0].length;
    words.push({
      text: m[0],
      start,
      end,
      accent: at >= 0 && start < hiEnd && end > at,
    });
  }
  return words;
}

function smooth(x: number) {
  const t = Math.min(1, Math.max(0, x));
  return t * t * (3 - 2 * t);
}

export function ScrubReveal({
  text = "Every frame is code. Every cut is yours. Ship the film your product deserves.",
  highlight = "Every cut is yours.",
  accent = "#3B5BFD",
  speed = 1,
  theme = "dark",
}: ScrubRevealProps) {
  const frame = useCurrentFrame() * speed;
  const { width: W, height: H } = useVideoConfig();
  const c = THEMES[theme];

  const words = useMemo(() => splitWords(text, highlight), [text, highlight]);
  const lastStart = words.length ? words[words.length - 1].start : 0;

  const scroll = interpolate(frame, [SCROLL_START, SCROLL_END], [0, 1], {
    ...CLAMP,
    easing: SCROLL,
  });
  const settle = interpolate(frame, [SETTLE_START, SETTLE_END], [0, 1], {
    ...CLAMP,
    easing: SETTLE,
  });

  // The front starts just before the first word and parks past the last one.
  const front = interpolate(scroll, [0, 1], [-SOFT * 0.15, lastStart + SOFT]);

  // The page climbs with the same progress, then keeps a hair of drift.
  const climb = interpolate(scroll, [0, 1], [H * 0.15, 0]);
  const tail = interpolate(
    frame,
    [SCROLL_END, SCROLL_END + 90],
    [0, -H * 0.012],
    {
      ...CLAMP,
    },
  );

  const size = Math.round(Math.min(W * 0.064, H * 0.114));
  const measure = Math.min(W * 0.8, size * 13.2);
  const restColor = interpolateColors(settle, [0, 1], [c.fg, c.rest]);
  const [dr, dg, db] = c.dim;
  const dimColor = `rgb(${dr},${dg},${db})`;
  const stops = c.halo(accent);
  // The halo drifts a few degrees across the hold, nothing more.
  const angle = 96 + Math.sin(frame / 50) * 5;
  const haloAt = (k: number) =>
    interpolateColors(
      Math.min(1, Math.max(0, k)),
      [0, 0.34, 0.66, 1],
      [...stops],
    );

  const accentWords = words.filter((w) => w.accent);
  const first = accentWords[0];
  const last = accentWords[accentWords.length - 1];

  const word = (w: Word, i: number) => {
    const lit = smooth((front - w.start) / SOFT);
    const gap = i < words.length - 1 ? " " : "";
    if (w.accent && first && last) {
      // Each word carries its own slice of the halo, so the phrase reads as
      // one continuous gradient. A dim veil on top lifts as the front passes;
      // both layers clip to the same glyphs, so no colour fringes at the edges.
      const span = Math.max(1, last.end - first.start);
      const k0 = (w.start - first.start) / span;
      const k1 = (w.end - first.start) / span;
      const veil = `rgba(${dr},${dg},${db},${(1 - lit).toFixed(3)})`;
      return (
        <span key={`${w.start}-${w.text}`}>
          <span
            style={{
              backgroundImage: `linear-gradient(${veil}, ${veil}), linear-gradient(${angle.toFixed(2)}deg, ${haloAt(k0)}, ${haloAt(k1)})`,
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
              // the box must hold the italic overhang and the descenders
              padding: "0.1em 0.1em 0.3em 0.06em",
              margin: "0 -0.1em 0 -0.06em",
            }}
          >
            {w.text}
          </span>
          {w === last ? "" : gap}
        </span>
      );
    }
    return (
      <span
        key={`${w.start}-${w.text}`}
        style={{ color: interpolateColors(lit, [0, 1], [dimColor, restColor]) }}
      >
        {w.text}
        {gap}
      </span>
    );
  };

  const before = first ? words.filter((w) => w.end <= first.start) : words;
  const after = last ? words.filter((w) => w.start >= last.end) : [];
  const index = (w: Word) => words.indexOf(w);

  return (
    <AbsoluteFill style={{ backgroundColor: c.bg, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          left: (W - measure) / 2,
          top: H / 2,
          width: measure,
          transform: `translateY(calc(-50% + ${climb + tail}px))`,
          fontFamily,
          fontWeight: 500,
          fontSize: size,
          lineHeight: 1.12,
          letterSpacing: "-0.03em",
          textWrap: "balance",
        }}
      >
        {before.map((w) => word(w, index(w)))}
        {first ? (
          <span
            style={{
              fontFamily: serif.fontFamily,
              fontStyle: "italic",
              fontWeight: 400,
              // the serif's x-height is smaller; match it to the grotesk
              fontSize: "1.12em",
              lineHeight: 0,
              letterSpacing: "-0.015em",
              paddingRight: "0.06em",
            }}
          >
            {accentWords.map((w) => word(w, index(w)))}
          </span>
        ) : null}
        {first && after.length ? " " : ""}
        {after.map((w) => word(w, index(w)))}
      </div>
    </AbsoluteFill>
  );
}
