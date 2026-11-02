"use client";

import { loadFont } from "@remotion/google-fonts/Lexend";
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

export interface RsvpField {
  label: string;
  value: string;
}

export interface RsvpProps {
  headline?: string;
  fields?: RsvpField[];
  rsvpLabel?: string;
  rsvp?: string;
  accent?: string;
  background?: string;
  speed?: number;
  theme?: "dark" | "light";
}

const THEMES = {
  dark: { bg: "#E8392B", ink: "#FFFFFF", accent: "#0A0A0A" },
  light: { bg: "#FFFFFF", ink: "#0A0A0A", accent: "#E8392B" },
} as const;

const TRACK = -0.035;
const ROW_TRACK = -0.012;
const LH = 1.04;
const ROW_LH = 1.2;
const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_IO = Easing.bezier(0.65, 0, 0.35, 1);
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
  const [handle] = useState(() => delayRender("rsvp: measuring"));
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

const DEFAULT_FIELDS: RsvpField[] = [
  { label: "What", value: "Your launch film" },
  { label: "When", value: "Whenever you’re ready" },
  { label: "Where", value: "Your own repo" },
  { label: "Bring", value: "The story. We brought the parts." },
];

export function Rsvp({
  headline = "You’re invited.",
  fields = DEFAULT_FIELDS,
  rsvpLabel = "RSVP",
  rsvp = "npx shadcn add @remocn/whip-pan",
  accent,
  background,
  speed = 1,
  theme = "dark",
}: RsvpProps) {
  const t = useCurrentFrame() * speed;
  const { width: W, height: H, durationInFrames } = useVideoConfig();
  const Tt = durationInFrames * speed;
  const c = THEMES[theme];
  const hi = accent ?? c.accent;
  const stage =
    background === "transparent" ? "transparent" : (background ?? c.bg);

  const rows = [
    ...fields.filter((f) => f.label || f.value),
    ...(rsvp ? [{ label: rsvpLabel, value: rsvp }] : []),
  ];
  const headWords = splitWords(headline);
  const rowWords = rows.map((r) => splitWords(r.value));
  const w = useWidths([
    { text: " ", weight: 500 },
    { text: " ", weight: 400 },
    ...headWords.map((text) => ({ text, weight: 500 })),
    ...rows.map((r) => ({ text: r.label, weight: 400 })),
    ...rowWords.flat().map((text) => ({ text, weight: 400 })),
  ]);

  if (!w) {
    return (
      <div style={{ position: "absolute", inset: 0, background: stage }} />
    );
  }

  const headAdv = (s: string) =>
    (w[`500|${s}`] ?? s.length * 0.56) + TRACK * Array.from(s).length;
  const rowAdv = (s: string) =>
    (w[`400|${s}`] ?? s.length * 0.56) + ROW_TRACK * Array.from(s).length;
  const headSpace = w["500| "] ?? 0.25;
  const rowSpace = w["400| "] ?? 0.25;

  const portrait = H > W * 1.1;
  const mx = W * (portrait ? 0.08 : 0.07);
  const availW = W - mx * 2;
  const labelEm = Math.max(0, ...rows.map((r) => rowAdv(r.label)));

  let fH = portrait ? W * 0.2 : H * 0.2;
  let fR = portrait ? W * 0.064 : H * 0.054;
  const labelH = portrait ? ROW_LH * 0.72 : 0;
  const build = () => {
    const headLines = balanced(headWords, headAdv, headSpace, availW / fH);
    const labelCol = portrait
      ? 0
      : Math.max(labelEm * fR + fR * 1.4, availW * 0.2);
    const valueW = availW - labelCol;
    const valueLines = rowWords.map((ws) =>
      balanced(ws, rowAdv, rowSpace, valueW / fR),
    );
    const headH = headLines.length * LH * fH;
    const gapHR = fH * (portrait ? 0.5 : 0.36);
    const rowGap = fR * (portrait ? 0.9 : 0.62);
    const rowHs = valueLines.map(
      (ls) => (labelH + Math.max(1, ls.length) * ROW_LH) * fR,
    );
    const rowsH =
      rowHs.reduce((a, b) => a + b, 0) + rowGap * Math.max(0, rowHs.length - 1);
    return {
      headLines,
      labelCol,
      valueLines,
      headH,
      gapHR,
      rowGap,
      rowHs,
      rowsH,
      total: headH + gapHR + rowsH,
    };
  };
  let B = build();
  const maxH = H * (portrait ? 0.76 : 0.82);
  for (let k = 0; k < 80; k++) {
    if (B.total <= maxH && B.headLines.length <= (portrait ? 3 : 2)) break;
    fH *= 0.96;
    fR *= 0.97;
    B = build();
  }

  const top = portrait
    ? (H - B.total) / 2 - H * 0.02
    : Math.max(H * 0.09, (H - B.total) / 2 - H * 0.04);
  const rowsTop = top + B.headH + B.gapHR;

  const n = rows.length;
  const rowStart = 26;
  const span = Math.max(n * 10, Math.min(Tt * 0.5, Tt - 70) - rowStart);
  const rowStep = Math.min(16, span / Math.max(1, n));
  const rowAt = (k: number) =>
    rowStart + k * rowStep + (rsvp && k === n - 1 ? 10 : 0);
  const lastAt = rowAt(n - 1);
  const focus = rsvp
    ? interpolate(t, [lastAt + 12, lastAt + 30], [0, 1], {
        ...CLAMP,
        easing: EASE_IO,
      })
    : 0;

  let wordIndex = 0;
  const headNodes = B.headLines.map((line, li) => (
    <div
      key={`h${li}`}
      style={{
        position: "absolute",
        left: mx,
        top: top + li * LH * fH,
        height: LH * fH,
        lineHeight: `${LH * fH}px`,
        fontSize: fH,
        fontWeight: 500,
        whiteSpace: "pre",
        letterSpacing: `${TRACK}em`,
        color: c.ink,
      }}
    >
      {line.map((word, wi) => {
        const s = 3 + wordIndex * 4;
        wordIndex++;
        const e = interpolate(t, [s, s + 20], [0, 1], {
          ...CLAMP,
          easing: EASE_OUT,
        });
        return (
          <span key={`hw${wi}`}>
            {wi > 0 ? " " : ""}
            <span
              style={{
                display: "inline-block",
                opacity: e,
                transform: `translateY(${((1 - e) * fH * 0.3).toFixed(2)}px)`,
              }}
            >
              {word}
            </span>
          </span>
        );
      })}
    </div>
  ));

  let y = rowsTop;
  const rowNodes = rows.map((row, k) => {
    const rowTop = y;
    y += B.rowHs[k] + B.rowGap;
    const at = rowAt(k);
    const le = interpolate(t, [at, at + 14], [0, 1], {
      ...CLAMP,
      easing: EASE_OUT,
    });
    const isRsvp = Boolean(rsvp) && k === n - 1;
    const dim = isRsvp ? 1 : 1 - 0.45 * focus;
    return (
      <div
        key={`r${k}`}
        style={{
          position: "absolute",
          left: mx,
          top: rowTop,
          width: availW,
          height: B.rowHs[k],
          fontSize: fR,
          lineHeight: `${ROW_LH * fR}px`,
          letterSpacing: `${ROW_TRACK}em`,
          whiteSpace: "pre",
          opacity: dim,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            fontSize: portrait ? fR * 0.62 : fR,
            lineHeight: `${(portrait ? labelH : ROW_LH) * fR}px`,
            fontWeight: 400,
            color: hi,
            opacity: le,
            transform: `translateY(${((1 - le) * fR * 0.5).toFixed(2)}px)`,
          }}
        >
          {row.label}
        </div>
        <div
          style={{
            position: "absolute",
            left: B.labelCol,
            top: labelH * fR,
            fontWeight: 400,
            color: isRsvp ? hi : c.ink,
          }}
        >
          {B.valueLines[k].map((line, li) => {
            const before = B.valueLines[k]
              .slice(0, li)
              .reduce((a, l) => a + l.length, 0);
            return (
              <div key={`v${li}`}>
                {line.map((word, wi) => {
                  const s = at + 5 + (before + wi) * 2;
                  const e = interpolate(t, [s, s + 16], [0, 1], {
                    ...CLAMP,
                    easing: EASE_OUT,
                  });
                  return (
                    <span key={`vw${wi}`}>
                      {wi > 0 ? " " : ""}
                      <span
                        style={{
                          display: "inline-block",
                          opacity: e,
                          transform: `translateY(${((1 - e) * fR * 0.55).toFixed(2)}px)`,
                        }}
                      >
                        {word}
                      </span>
                    </span>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    );
  });

  return (
    <AbsoluteFill
      style={{
        background: stage,
        overflow: "hidden",
        fontFamily: lexend.fontFamily,
      }}
    >
      {headNodes}
      {rowNodes}
    </AbsoluteFill>
  );
}
