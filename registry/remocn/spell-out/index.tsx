"use client";

import { loadFont } from "@remotion/google-fonts/Nunito";
import type React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  AbsoluteFill,
  continueRender,
  delayRender,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { useGlide } from "@/lib/remocn/glide";

const nunito = loadFont("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});

export interface SpellOutProps {
  name?: string;
  line?: string;
  accent?: string;
  /** Color of the spelled word; overrides the theme ink. */
  ink?: string;
  background?: string;
  /** Typeface for the word and line. Load it yourself; Nunito by default. */
  fontFamily?: string;
  /** Frames between letters as they drop in. */
  stagger?: number;
  /** Frames the spelled-out word holds before it closes up. */
  hold?: number;
  /** Size of the word and line, around the frame's center. */
  scale?: number;
  /** Frames to hold the first frame before anything moves. */
  delay?: number;
  speed?: number;
  theme?: "dark" | "light";
}

const THEMES = {
  dark: {
    bg: "#133A24",
    ink: "#EAF7EC",
    accent: "#FFD23F",
    line: "#FFD23F",
  },
  light: {
    bg: "#FFD23F",
    ink: "#133A24",
    accent: "#FFFFFF",
    line: "#133A24",
  },
} as const;

const FONT_PX = 200;
const TRACK = -0.03;
const LINE_TRACK = -0.01;
const SPELL_AT = 4;
const LETTER_GAP = 8;
const FALL = 7;
const HOLD_SPELLED = 14;
const CLOSE_LEN = 20;
const LINE_DELAY = 14;

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_IN = Easing.bezier(0.55, 0, 0.85, 0.35);
const EASE_IN_OUT = Easing.bezier(0.65, 0, 0.25, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

interface Metrics {
  adv: number[];
  pos: number[];
  width: number;
  hyphen: number;
  hyphenInk: number;
  asc: number;
  desc: number;
  top: number;
  xh: number;
  lineW: number;
  lineCap: number;
}

function measure(chars: string[], line: string, font: string): Metrics {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("spell-out: no 2d context");
  const fam = `"${font}"`;
  ctx.font = `500 ${FONT_PX}px ${fam}`;
  const adv = chars.map((ch) => ctx.measureText(ch).width / FONT_PX);
  const pos: number[] = [];
  let prefix = "";
  for (let i = 0; i < chars.length; i++) {
    pos.push(prefix ? ctx.measureText(prefix).width / FONT_PX + TRACK * i : 0);
    prefix += chars[i];
  }
  const width =
    ctx.measureText(prefix).width / FONT_PX + TRACK * (chars.length - 1);
  const hm = ctx.measureText("-");
  const fm = ctx.measureText(prefix || "x");
  const metrics = ctx.measureText("Hg");
  ctx.font = `500 ${FONT_PX}px ${fam}`;
  const lm = ctx.measureText(line || " ");
  return {
    adv,
    pos,
    width,
    hyphen: hm.width / FONT_PX,
    hyphenInk: (hm.actualBoundingBoxRight + hm.actualBoundingBoxLeft) / FONT_PX,
    asc: metrics.fontBoundingBoxAscent / FONT_PX,
    desc: metrics.fontBoundingBoxDescent / FONT_PX,
    top: fm.actualBoundingBoxAscent / FONT_PX,
    xh: ctx.measureText("x").actualBoundingBoxAscent / FONT_PX,
    lineW:
      lm.width / FONT_PX +
      LINE_TRACK * Math.max(0, Array.from(line).length - 1),
    lineCap: ctx.measureText("H").actualBoundingBoxAscent / FONT_PX,
  };
}

function useMetrics(chars: string[], line: string, font: string) {
  const key = chars.join("");
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [handle] = useState(() => delayRender("spell-out: measuring"));
  const released = useRef(false);
  useEffect(() => {
    let live = true;
    Promise.all([
      nunito.waitUntilDone(),
      document.fonts.load(`500 100px "${font}"`),
    ])
      .catch(() => undefined)
      .then(() => {
        if (!live) return;
        setMetrics(measure(Array.from(key), line, font));
        if (!released.current) {
          released.current = true;
          continueRender(handle);
        }
      });
    return () => {
      live = false;
    };
  }, [key, line, font, handle]);
  return metrics;
}

function impact(u: number) {
  if (u < 0) return 0;
  return Math.exp(-u / 3.6) * Math.cos(u * 0.55);
}

const midway = (p: number) => p > 5e-4 && p < 1 - 5e-4;

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

export function SpellOut({
  name = "remocn",
  line = "Say it once. Remember it.",
  accent,
  ink,
  background,
  fontFamily = nunito.fontFamily,
  stagger = LETTER_GAP,
  hold = HOLD_SPELLED,
  scale = 1,
  delay = 0,
  speed = 1,
  theme = "dark",
}: SpellOutProps) {
  const glide = useGlide();
  const t = Math.max(0, useCurrentFrame() - delay) * speed;
  const { width: W, height: H } = useVideoConfig();
  const c = THEMES[theme];
  const fg = ink ?? c.ink;
  const bg = background ?? c.bg;
  const dash = accent ?? c.accent;
  const chars = useMemo(() => Array.from(name.replace(/\s+/g, "")), [name]);
  const m = useMetrics(chars, line, fontFamily);

  if (!m || chars.length === 0) {
    return <div style={{ position: "absolute", inset: 0, background: bg }} />;
  }

  const n = chars.length;
  const gap = 0.07;
  const unit = m.hyphen + gap * 2;
  const spelled: number[] = [];
  let run = 0;
  for (let i = 0; i < n; i++) {
    spelled.push(run);
    run += m.adv[i] + (i < n - 1 ? unit : 0);
  }
  const spelledW = run;
  const S = Math.min((W * 0.9) / spelledW, H * 0.3);
  const lineSize0 = line ? Math.min(H * 0.088, (W * 0.8) / m.lineW) : 0;
  const F0 = Math.min((W * 0.84) / m.width, H * 0.42);
  const lineGap = line ? F0 * 0.34 : 0;
  const blockH = m.top * F0 + lineGap + (line ? m.lineCap * lineSize0 : 0);
  const F = F0;
  const finalBase = (H - blockH) / 2 + m.top * F;
  const spellBase = H / 2 + (m.xh * S) / 2;
  const R = Math.max(S, F);
  const lh = R * 1.4;
  const bo = (lh - (m.asc + m.desc) * R) / 2 + m.asc * R;

  const lastLand = SPELL_AT + (n - 1) * stagger + FALL;
  const closeAt = lastLand + hold;
  const closeOf = (tt: number) =>
    interpolate(tt, [closeAt, closeAt + CLOSE_LEN], [0, 1], {
      ...CLAMP,
      easing: EASE_IN_OUT,
    });
  const close = closeOf(t);
  const size = S + (F - S) * close;
  const spellLeft = (W - spelledW * S) / 2;
  const finalLeft = (W - m.width * F) / 2;
  const base = spellBase + (finalBase - spellBase) * close;

  const nodes: React.ReactNode[] = [];
  for (let i = 0; i < n; i++) {
    const landAt = SPELL_AT + i * stagger + FALL;
    if (t < landAt - FALL) continue;
    const centre = (n - 1) / 2;
    const settleAt = closeAt + CLOSE_LEN - 2 + Math.abs(i - centre) * 1.5;
    // The letter is laid out on the closed word's baseline; the fall and the
    // climb there are a transform, since layout rounds a baseline to whole
    // pixels and a letter eased by `top` clicks down pixel by pixel.
    const letterAt = (tt: number) => {
      const fall = interpolate(tt, [landAt - FALL, landAt], [0, 1], {
        ...CLAMP,
        easing: EASE_IN,
      });
      const cl = closeOf(tt);
      const air = fall < 1 ? Math.sin(fall * Math.PI * 0.5) : 1;
      const stretch = fall < 1 ? 0.22 * air : 0;
      const q = impact(tt - landAt);
      const q2 = impact(tt - settleAt) * 0.6;
      const s = (S + (F - S) * cl) / R;
      return {
        fall,
        dy: (spellBase - finalBase) * (1 - cl) + (1 - fall) * -S * 0.9,
        sx: s * (1 - stretch * 0.5 + 0.12 * q + 0.08 * q2),
        sy: s * (1 + stretch - 0.2 * q - 0.12 * q2),
      };
    };
    const { fall, dy, sx, sy } = letterAt(t);
    // The bounces decay without a clean end: compare the drawn values with
    // the neighbouring frames.
    const differs = (
      a: ReturnType<typeof letterAt>,
      b: ReturnType<typeof letterAt>,
    ) =>
      Math.abs(a.dy - b.dy) > 1e-3 ||
      Math.abs(a.sy - b.sy) * lh > 1e-3 ||
      Math.abs(a.sx - b.sx) * lh > 1e-3;
    const here = { fall, dy, sx, sy };
    const moving =
      differs(letterAt(t + speed), here) || differs(here, letterAt(t - speed));
    const x0 = spellLeft + spelled[i] * S;
    const x1 = finalLeft + m.pos[i] * F;
    const x = x0 + (x1 - x0) * close;
    const o = interpolate(fall, [0, 0.35], [0, 1], CLAMP);
    nodes.push(
      <div
        key={`l${i}`}
        style={{
          position: "absolute",
          left: x + (m.adv[i] * (size - R)) / 2,
          top: finalBase - bo,
          height: lh,
          fontFamily,
          fontWeight: 500,
          fontSize: R,
          lineHeight: `${lh}px`,
          whiteSpace: "pre",
          color: fg,
          opacity: o,
          transform: `${Math.abs(dy) > 1e-3 ? `translateY(${dy}px) ` : ""}scale(${sx.toFixed(4)}, ${sy.toFixed(4)})${glide(moving)}`,
          transformOrigin: `${((m.adv[i] * R) / 2).toFixed(1)}px ${bo.toFixed(1)}px`,
        }}
      >
        {chars[i]}
      </div>,
    );
    if (i < n - 1) {
      const born = landAt + 1;
      const hp = interpolate(t, [born, born + 7], [0, 1], {
        ...CLAMP,
        easing: EASE_OUT,
      });
      const shrink = 1 - close;
      if (hp > 0 && shrink > 0.001) {
        const nextX0 = spellLeft + spelled[i + 1] * S;
        const nextX1 = finalLeft + m.pos[i + 1] * F;
        const nx = nextX0 + (nextX1 - nextX0) * close;
        const mid = (x + m.adv[i] * size + nx) / 2;
        const barH = S * 0.1;
        const barW = Math.max(
          barH * shrink,
          m.hyphenInk * S * shrink * (0.4 + 0.6 * hp),
        );
        nodes.push(
          <div
            key={`h${i}`}
            style={{
              position: "absolute",
              left: mid - barW / 2,
              top: base - m.xh * size * 0.5 - (barH * shrink) / 2,
              width: barW,
              height: barH * Math.max(0.3, shrink),
              borderRadius: barH,
              background: dash,
              opacity: hp * Math.min(1, shrink * 2.5),
            }}
          />,
        );
      }
    }
  }

  const lineAt = closeAt + CLOSE_LEN - 4 + LINE_DELAY - 10;
  const lp = interpolate(t, [lineAt, lineAt + 18], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const lineBase = finalBase + lineGap + m.lineCap * lineSize0;
  const llh = lineSize0 * 1.45;
  const lbo = (llh - (m.asc + m.desc) * lineSize0) / 2 + m.asc * lineSize0;

  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      <ScaleLayer scale={scale}>
        {nodes}
        {line ? (
          <div
            style={{
              position: "absolute",
              left: 0,
              width: W,
              top: lineBase - lbo,
              height: llh,
              overflow: "hidden",
              display: "flex",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                fontFamily,
                fontWeight: 500,
                fontSize: lineSize0,
                lineHeight: `${llh}px`,
                letterSpacing: `${LINE_TRACK}em`,
                color: c.line,
                whiteSpace: "pre",
                transform: `translateY(${((1 - lp) * llh).toFixed(2)}px)${glide(midway(lp))}`,
              }}
            >
              {line}
            </div>
          </div>
        ) : null}
      </ScaleLayer>
    </AbsoluteFill>
  );
}
