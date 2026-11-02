"use client";

import { loadFont } from "@remotion/google-fonts/Lexend";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import {
  AbsoluteFill,
  continueRender,
  delayRender,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const lexend = loadFont("normal", {
  weights: ["300", "400", "500"],
  subsets: ["latin"],
});

export interface YourNameHereProps {
  lead?: string;
  brand?: string;
  slot?: string;
  end?: string;
  note?: string;
  accent?: string;
  background?: string;
  speed?: number;
  theme?: "dark" | "light";
}

const THEMES = {
  dark: { bg: "#E8392B", ink: "#FFFFFF", accent: "#0A0A0A" },
  light: { bg: "#FFFFFF", ink: "#0A0A0A", accent: "#E8392B" },
} as const;

const TRACK = -0.04;
const NOTE_TRACK = -0.01;
const LH = 1.02;
const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_IO = Easing.bezier(0.65, 0, 0.35, 1);
const EASE_IN = Easing.bezier(0.55, 0, 0.9, 0.4);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

interface Spec {
  text: string;
  weight: number;
}

function useWidths(specs: Spec[]) {
  const key = specs.map((s) => `${s.weight}|${s.text}`).join("\u0001");
  const [state, setState] = useState<{
    key: string;
    w: Record<string, number>;
  } | null>(null);
  const [handle] = useState(() => delayRender("your-name-here: measuring"));
  const released = useRef(false);
  const ref = useRef(specs);
  ref.current = specs;
  useEffect(() => {
    let live = true;
    const weights = Array.from(new Set(ref.current.map((s) => s.weight)));
    Promise.all([
      lexend.waitUntilDone(),
      ...weights.map((wt) =>
        document.fonts.load(`${wt} 100px "${lexend.fontFamily}"`),
      ),
    ])
      .catch(() => undefined)
      .then(() => {
        if (!live) return;
        const ctx = document.createElement("canvas").getContext("2d");
        const w: Record<string, number> = {};
        for (const s of ref.current) {
          const k = `${s.weight}|${s.text}`;
          if (ctx) {
            ctx.font = `${s.weight} 100px "${lexend.fontFamily}"`;
            w[k] = ctx.measureText(s.text).width / 100;
          } else {
            w[k] = s.text.length * 0.56;
          }
        }
        setState({ key, w });
        if (!released.current) {
          released.current = true;
          continueRender(handle);
        }
      });
    return () => {
      live = false;
    };
  }, [key, handle]);
  return state && state.key === key ? state.w : null;
}

function greedy(
  words: string[],
  adv: (s: string) => number,
  space: number,
  maxEm: number,
) {
  const lines: string[][] = [];
  let line: string[] = [];
  let x = 0;
  for (const word of words) {
    const w = adv(word);
    if (line.length > 0 && x + space + w > maxEm) {
      lines.push(line);
      line = [word];
      x = w;
    } else {
      x += (line.length > 0 ? space : 0) + w;
      line.push(word);
    }
  }
  if (line.length > 0) lines.push(line);
  return lines;
}

function balanced(
  words: string[],
  adv: (s: string) => number,
  space: number,
  maxEm: number,
) {
  const base = greedy(words, adv, space, maxEm);
  if (base.length <= 1) return base;
  let lo = 0;
  let hi = maxEm;
  for (let k = 0; k < 24; k++) {
    const mid = (lo + hi) / 2;
    if (greedy(words, adv, space, mid).length <= base.length) hi = mid;
    else lo = mid;
  }
  return greedy(words, adv, space, hi);
}

const splitWords = (s: string) => s.split(/\s+/).filter(Boolean);

export function YourNameHere({
  lead = "A launch film for",
  brand = "remocn",
  slot = "yourProduct",
  end = ".",
  note = "Swap one prop. The film is yours.",
  accent,
  background,
  speed = 1,
  theme = "dark",
}: YourNameHereProps) {
  const t = useCurrentFrame() * speed;
  const { width: W, height: H, durationInFrames } = useVideoConfig();
  const Tt = durationInFrames * speed;
  const c = THEMES[theme];
  const hi = accent ?? c.accent;
  const stage =
    background === "transparent" ? "transparent" : (background ?? c.bg);

  const leadWords = splitWords(lead);
  const w = useWidths([
    { text: " ", weight: 500 },
    ...leadWords.map((text) => ({ text, weight: 500 })),
    { text: brand, weight: 500 },
    { text: slot, weight: 500 },
    { text: "{", weight: 400 },
    { text: "}", weight: 400 },
    { text: end, weight: 500 },
    { text: note, weight: 300 },
  ]);

  if (!w) {
    return (
      <div style={{ position: "absolute", inset: 0, background: stage }} />
    );
  }

  const adv = (s: string, wt = 500) =>
    s ? (w[`${wt}|${s}`] ?? s.length * 0.56) + TRACK * Array.from(s).length : 0;
  const space = w["500| "] ?? 0.25;
  const bw = adv("{", 400) + 0.02;
  const cw = adv("}", 400) + 0.02;
  const brandW = adv(brand);
  const slotW = adv(slot);
  const endW = adv(end);
  const slotLineEm = Math.max(bw + brandW + cw, bw + slotW + cw) + endW;

  const portrait = H > W * 1.1;
  const mx = W * (portrait ? 0.07 : 0.065);
  const availW = W - mx * 2;
  let fs = Math.min(portrait ? W * 0.2 : H * 0.24, availW / slotLineEm);
  let leadLines = balanced(leadWords, adv, space, availW / fs);
  const fN0 = portrait ? W * 0.045 : H * 0.045;
  const noteEm =
    (w[`300|${note}`] ?? note.length * 0.56) +
    NOTE_TRACK * Array.from(note).length;
  const fN = note ? Math.min(fN0, availW / Math.max(0.01, noteEm)) : 0;
  const totalH = () =>
    (leadLines.length + 1) * LH * fs + (note ? fs * 0.34 + fN * 1.3 : 0);
  for (let k = 0; k < 80; k++) {
    if (
      leadLines.length <= (portrait ? 4 : 3) &&
      totalH() <= H * (portrait ? 0.7 : 0.84)
    )
      break;
    fs *= 0.96;
    leadLines = balanced(leadWords, adv, space, availW / fs);
  }

  const lineH = LH * fs;
  const blockTop = (H - totalH()) / 2 - H * (portrait ? 0.02 : 0.01);
  const slotTop = blockTop + leadLines.length * lineH;
  const noteTop = slotTop + lineH + fs * 0.34;

  const k = Math.min(1.5, Math.max(0.85, Tt / 180));
  const braceAt = 44 * k;
  const swapAt = braceAt + 26 * k;
  const openAt = swapAt + 28;
  const noteAt = openAt + 30;

  const p1 = interpolate(t, [braceAt, braceAt + 16], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const out = interpolate(t, [swapAt, swapAt + 12], [0, 1], {
    ...CLAMP,
    easing: EASE_IN,
  });
  const shut = interpolate(t, [swapAt + 4, swapAt + 18], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const open = interpolate(t, [openAt, openAt + 20], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const rise = interpolate(t, [openAt + 4, openAt + 22], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const noteE = interpolate(t, [noteAt, noteAt + 18], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });

  const gapW = 0.42;
  const inner = brandW + (gapW - brandW) * shut + (slotW - gapW) * open;
  const brandX = bw * p1;
  const closeX = bw * p1 + inner;
  const endX = bw * p1 + inner + cw * p1;

  let wordIndex = 0;
  const leadNodes = leadLines.map((line, li) => (
    <div
      key={`l${li}`}
      style={{
        position: "absolute",
        left: mx,
        top: blockTop + li * lineH,
        height: lineH,
        lineHeight: `${lineH}px`,
        fontSize: fs,
        fontWeight: 500,
        whiteSpace: "pre",
        letterSpacing: `${TRACK}em`,
        color: c.ink,
      }}
    >
      {line.map((word, wi) => {
        const s = 3 + wordIndex * 3;
        wordIndex++;
        const e = interpolate(t, [s, s + 18], [0, 1], {
          ...CLAMP,
          easing: EASE_OUT,
        });
        return (
          <span key={`lw${wi}`}>
            {wi > 0 ? " " : ""}
            <span
              style={{
                display: "inline-block",
                opacity: e,
                transform: `translateY(${((1 - e) * fs * 0.28).toFixed(2)}px)`,
              }}
            >
              {word}
            </span>
          </span>
        );
      })}
    </div>
  ));

  const brandIn = interpolate(
    t,
    [3 + wordIndex * 3 + 2, 3 + wordIndex * 3 + 22],
    [0, 1],
    { ...CLAMP, easing: EASE_OUT },
  );

  const glyph = (
    text: string,
    x: number,
    extra: React.CSSProperties,
  ): React.ReactNode => (
    <div
      style={{
        position: "absolute",
        left: x * fs,
        top: 0,
        height: lineH,
        lineHeight: `${lineH}px`,
        whiteSpace: "pre",
        ...extra,
      }}
    >
      {text}
    </div>
  );

  const clipPad = fs * 0.08;

  return (
    <AbsoluteFill
      style={{
        background: stage,
        overflow: "hidden",
        fontFamily: lexend.fontFamily,
      }}
    >
      {leadNodes}
      <div
        style={{
          position: "absolute",
          left: mx,
          top: slotTop,
          height: lineH,
          width: availW,
          fontSize: fs,
          fontWeight: 500,
          letterSpacing: `${TRACK}em`,
          opacity: brandIn,
          transform: `translateY(${((1 - brandIn) * fs * 0.28).toFixed(2)}px)`,
        }}
      >
        {glyph("{", 0, {
          color: hi,
          fontWeight: 400,
          opacity: p1,
          transform: `translateX(${((1 - p1) * fs * 0.25).toFixed(2)}px)`,
        })}
        <div
          style={{
            position: "absolute",
            left: brandX * fs,
            top: -clipPad,
            width: (inner + 0.03) * fs,
            height: lineH + clipPad + fs * 0.14,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              left: 0,
              top: clipPad + out * fs * 0.55,
              height: lineH,
              lineHeight: `${lineH}px`,
              whiteSpace: "pre",
              color: c.ink,
              opacity: 1 - out,
            }}
          >
            {brand}
          </div>
          <div
            style={{
              position: "absolute",
              left: 0,
              top: clipPad + (1 - rise) * fs * 0.45,
              height: lineH,
              lineHeight: `${lineH}px`,
              whiteSpace: "pre",
              color: hi,
              opacity: rise,
            }}
          >
            {slot}
          </div>
        </div>
        {glyph("}", closeX, {
          color: hi,
          fontWeight: 400,
          opacity: p1,
          transform: `translateX(${((1 - p1) * -fs * 0.25).toFixed(2)}px)`,
        })}
        {glyph(end, endX, { color: c.ink })}
      </div>
      {note ? (
        <div
          style={{
            position: "absolute",
            left: mx,
            top: noteTop,
            fontSize: fN,
            lineHeight: `${fN * 1.3}px`,
            fontWeight: 300,
            whiteSpace: "pre",
            letterSpacing: `${NOTE_TRACK}em`,
            color: c.ink,
            opacity: noteE,
            transform: `translateY(${((1 - noteE) * fN * 0.6).toFixed(2)}px)`,
          }}
        >
          {note}
        </div>
      ) : null}
    </AbsoluteFill>
  );
}
