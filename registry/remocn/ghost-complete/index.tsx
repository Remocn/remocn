"use client";

import { loadFont as loadGeist } from "@remotion/google-fonts/Geist";
import { loadFont as loadGeistMono } from "@remotion/google-fonts/GeistMono";
import { loadFont as loadManrope } from "@remotion/google-fonts/Manrope";
import type React from "react";
import { useMemo } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  interpolateColors,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { GradientParams } from "@/lib/remocn/gsh/gradient-engine";
import { GshGround } from "@/lib/remocn/gsh/gsh-ground";
import type { GshPresetId } from "@/lib/remocn/gsh/presets";

const { fontFamily: geist } = loadGeist("normal", {
  weights: ["300", "400"],
  subsets: ["latin"],
});
const { fontFamily: mono } = loadGeistMono("normal", {
  weights: ["400"],
  subsets: ["latin"],
});
const manrope = loadManrope("normal", {
  weights: ["600"],
  subsets: ["latin"],
});

export interface GhostCompleteProps {
  title?: string;
  typed?: string;
  suggestions?: string[];
  keepLastFill?: boolean;
  showLogo?: boolean;
  accent?: string;
  theme?: "dark" | "light";
  ground?: GshPresetId;
  groundParams?: Partial<GradientParams>;
  speed?: number;
}

const REMOCN_R_PATH =
  "M 0.01 0.81 C 0.01 1.73, 0.36 2.79, 1.09 4.13 C 4.91 11.04, 13.45 17.16, 21.7 18.9 C 22.94 19.16, 23.18 19.16, 51.39 19.27 C 76.07 19.36, 80.02 19.4, 81.32 19.57 C 89.89 20.69, 96.2 24.68, 99.38 31.01 C 103.19 38.56, 102.53 50.1, 97.91 57.07 C 94.66 61.96, 89.68 64.99, 83.26 66 C 82.81 66.07, 70.18 66.83, 55.2 67.69 C 24.82 69.43, 27.03 69.23, 24.18 70.4 C 19.9 72.15, 14.84 75.7, 10.65 79.89 C 4.86 85.68, 1.3 91.91, 0.25 98.13 C 0.12 98.85, 0.08 103.13, 0.04 116.66 L 0 134.26 9.5 134.26 L 19 134.26 19.05 119.41 C 19.1 103.27, 19.08 103.82, 19.82 101.04 C 21.79 93.65, 27.86 88.75, 36.45 87.63 C 37.23 87.53, 39.41 87.5, 43.57 87.53 C 50.12 87.59, 50.75 87.65, 53.22 88.45 C 56.61 89.56, 59.67 91.86, 62.02 95.07 C 62.52 95.76, 69.35 103.85, 77.2 113.07 C 85.04 122.28, 91.63 130.04, 91.85 130.32 C 92.07 130.59, 92.5 131.34, 92.82 131.97 C 93.52 133.35, 94.11 133.93, 95.06 134.13 C 95.5 134.23, 98.97 134.26, 106.36 134.23 L 117.01 134.19 100.82 113.07 C 91.91 101.45, 84.52 91.78, 84.39 91.57 C 83.36 89.89, 83.66 87.53, 85.09 86 C 85.79 85.25, 86.36 84.94, 88.07 84.38 C 96.18 81.72, 104.15 76.62, 109.97 70.36 C 120.59 58.93, 124.06 44.32, 119.44 30.43 C 114.59 15.81, 101.93 4.02, 87.64 0.83 C 83.93 0.01, 88.09 0.08, 41.85 0.04 L 0.01 0 0.01 0.81 Z";

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

const ADV = [
  243, 228, 361, 515, 643, 810, 649, 186, 290, 290, 427, 562, 213, 418, 213,
  494, 673, 406, 630, 625, 629, 641, 604, 531, 624, 606, 302, 302, 546, 544,
  546, 570, 925, 689, 688, 713, 701, 609, 595, 713, 716, 280, 607, 656, 583,
  890, 745, 751, 657, 745, 680, 654, 568, 694, 688, 968, 633, 594, 561, 361,
  470, 361, 438, 558, 258, 565, 608, 563, 608, 576, 412, 607, 591, 256, 284,
  609, 282, 885, 591, 588, 608, 608, 394, 537, 410, 586, 560, 829, 607, 553,
  552, 395, 274, 395, 523,
];
const TRACK = -0.035;
const LEADING = 1.08;

const LIGHT_GROUND: Partial<GradientParams> = {
  kind: "mist",
  colors: ["#F2955A", "#F7CBA8", "#F3E6D8", "#6B2A12"],
  background: "#F2EEE8",
  speed: 0.8,
  loopSeconds: 14,
  scale: 0.8,
  warp: 0.4,
  blur: 0.65,
  grain: 0.3,
  seed: 9,
};

const THEMES = {
  dark: {
    base: "#050303",
    scrim:
      "linear-gradient(180deg, rgba(5,3,3,0.55) 0%, rgba(5,3,3,0.2) 70%, rgba(5,3,3,0) 100%)",
    card: "rgba(17,14,13,0.9)",
    depth:
      "inset 0 1px 0 rgba(255,255,255,0.06), 0 0 0 1px rgba(255,255,255,0.08), 0 30px 60px -20px rgba(0,0,0,0.75)",
    divider: "rgba(255,255,255,0.07)",
    fg: "#F4F1EC",
    ghost: "#5C5650",
    fill: "#FFB27A",
    dim: "#8F8780",
    key: "rgba(255,255,255,0.14)",
    keyBg: "rgba(255,255,255,0.04)",
    logo: "#F4F1EC",
  },
  light: {
    base: "#F2EEE8",
    scrim:
      "linear-gradient(180deg, rgba(246,243,238,0.5) 0%, rgba(246,243,238,0.1) 100%)",
    card: "rgba(255,255,255,0.94)",
    depth:
      "0 0 0 1px rgba(40,24,12,0.06), 0 1px 3px rgba(40,24,12,0.05), 0 30px 60px -24px rgba(90,40,10,0.25)",
    divider: "rgba(40,24,12,0.07)",
    fg: "#17120F",
    ghost: "#C2BAB1",
    fill: "#C2410C",
    dim: "#857B73",
    key: "rgba(40,24,12,0.16)",
    keyBg: "#F7F4F0",
    logo: "#17120F",
  },
} as const;

const ENTER = Easing.bezier(0.32, 0.72, 0, 1);
const MOVE = Easing.bezier(0.65, 0, 0.35, 1);
const EXIT = Easing.bezier(0.55, 0, 1, 0.45);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const TYPE_START = 6;
const PER_CHAR = 2;
const GHOST_LEAD = 4;
const HOLD_GHOST = 16;
const AFTER_FILL = 8;
const SETTLE = 12;

function advance(ch: string) {
  const code = ch.charCodeAt(0);
  return (code >= 32 && code < 127 ? ADV[code - 32] : 600) / 1000;
}

interface Glyph {
  ch: string;
  seg: number;
  i: number;
}

interface Segment {
  start: number;
  length: number;
  breaks: number;
  ghostIn: number;
  accept: number;
  fillDur: number;
}

export function GhostComplete({
  title = "Launch notes",
  typed = "Ship the",
  suggestions = ["launch video", "\nbefore lunch."],
  keepLastFill = true,
  showLogo = true,
  theme = "dark",
  ground,
  groundParams,
  speed = 1,
}: GhostCompleteProps) {
  const t = useCurrentFrame() * speed;
  const { width: W, height: H, fps } = useVideoConfig();
  const tall = H > W;
  const u = tall ? W / 1000 : H / 720;
  const c = THEMES[theme];
  const dark = theme === "dark";
  const resolvedGround: GshPresetId | undefined =
    ground ?? (groundParams ? undefined : dark ? "hearth" : undefined);
  const resolvedParams = groundParams ?? (dark ? undefined : LIGHT_GROUND);

  const plan = useMemo(() => {
    const glyphs: Glyph[] = Array.from(typed).map((ch, i) => ({
      ch,
      seg: -1,
      i,
    }));
    const segs: Segment[] = [];
    let clock = TYPE_START + typed.length * PER_CHAR + GHOST_LEAD;
    suggestions.forEach((raw, k) => {
      const text =
        raw.startsWith("\n") || raw.startsWith(" ") ? raw : ` ${raw}`;
      const chars = Array.from(text);
      const start = glyphs.length;
      chars.forEach((ch, i) => {
        glyphs.push({ ch, seg: k, i });
      });
      const fillDur = Math.max(7, Math.min(12, chars.length * 0.6));
      const ghostIn = clock;
      const accept = ghostIn + HOLD_GHOST + (k === 0 ? 6 : 0);
      segs.push({
        start,
        length: chars.length,
        breaks: chars.filter((ch) => ch === "\n").length,
        ghostIn,
        accept,
        fillDur,
      });
      clock = accept + fillDur + AFTER_FILL;
    });
    const lines: number[] = [0];
    for (const g of glyphs) {
      if (g.ch === "\n") lines.push(0);
      else lines[lines.length - 1] += advance(g.ch) + TRACK;
    }
    return {
      glyphs,
      segs,
      widest: Math.max(...lines) - TRACK,
      lineCount: lines.length,
      end: clock,
    };
  }, [typed, suggestions]);
  const { glyphs, segs } = plan;
  const last = segs[segs.length - 1];

  const F = Math.min(
    (tall ? 104 : 112) * u,
    (W * (tall ? 0.72 : 0.62)) / plan.widest,
    (H * 0.4) / (plan.lineCount * LEADING),
  );
  const lineH = F * LEADING;
  const blockW = plan.widest * F;

  const padX = 44 * u;
  const headH = 66 * u;
  const padTop = headH + 14 * u;
  const footH = tall ? 16 * u : 72 * u;
  const cardW = blockW + padX * 2 + F * 0.2;

  const visLines =
    1 +
    segs.reduce(
      (n, s) =>
        n +
        s.breaks *
          spring({
            frame: t - s.ghostIn + 2,
            fps,
            config: { damping: 200 },
            durationInFrames: 14,
          }),
      0,
    );
  const cardH = padTop + visLines * lineH + 28 * u + footH;
  const finalH = padTop + plan.lineCount * lineH + 28 * u + footH;
  const cardLeft = (W - cardW) / 2;
  const cardTop = (tall ? 0.38 : 0.47) * H - finalH / 2;
  const bigKeyY = cardTop + finalH + 0.13 * H;

  const cardIn = spring({
    frame: t,
    fps,
    config: { mass: 0.8, damping: 18, stiffness: 160 },
  });

  const typedCount = Math.max(
    0,
    Math.min(typed.length, Math.floor((t - TYPE_START) / PER_CHAR) + 1),
  );
  let caret = typedCount;
  let busy = t < TYPE_START + typed.length * PER_CHAR + 2;
  const fronts = segs.map((s) => {
    const k = interpolate(t, [s.accept, s.accept + s.fillDur], [0, 1], {
      ...CLAMP,
      easing: MOVE,
    });
    const front = k * s.length;
    if (t >= s.accept) caret = s.start + Math.min(s.length, Math.ceil(front));
    if (t >= s.accept - 2 && t <= s.accept + s.fillDur + 3) busy = true;
    return front;
  });
  const phase = (t % 30) / 30;
  const blink = busy
    ? 1
    : interpolate(phase, [0, 0.45, 0.55, 0.95, 1], [1, 1, 0, 0, 1], CLAMP);

  const styleOf = (g: Glyph): React.CSSProperties => {
    if (g.seg < 0) return { color: c.fg };
    const s = segs[g.seg];
    const appear = interpolate(
      t,
      [s.ghostIn + g.i * 0.35, s.ghostIn + g.i * 0.35 + 6],
      [0, 1],
      { ...CLAMP, easing: ENTER },
    );
    const filled = Math.min(1, Math.max(0, fronts[g.seg] - g.i));
    const settleAt = s.accept + s.fillDur + AFTER_FILL;
    const settle =
      keepLastFill && g.seg === segs.length - 1
        ? 0
        : interpolate(t, [settleAt, settleAt + SETTLE], [0, 1], {
            ...CLAMP,
            easing: MOVE,
          });
    if (filled <= 0) return { color: c.ghost, opacity: appear };
    if (settle > 0) {
      return { color: interpolateColors(settle, [0, 1], [c.fill, c.fg]) };
    }
    return { color: interpolateColors(filled, [0, 1], [c.ghost, c.fill]) };
  };

  const hintOut = interpolate(
    t,
    [last.accept + last.fillDur + 4, last.accept + last.fillDur + 12],
    [0, 1],
    { ...CLAMP, easing: EXIT },
  );
  const hintArmed = interpolate(
    t,
    [segs[0].ghostIn + 2, segs[0].ghostIn + 12],
    [0, 1],
    { ...CLAMP, easing: ENTER },
  );
  const press = segs.reduce((p, s) => {
    const down = spring({
      frame: t - s.accept + 3,
      fps,
      config: { mass: 0.5, damping: 12, stiffness: 200 },
    });
    const up = spring({
      frame: t - s.accept - 2,
      fps,
      config: { mass: 0.5, damping: 12, stiffness: 200 },
    });
    return Math.max(p, Math.max(0, down - up));
  }, 0);
  const logoIn = interpolate(t, [plan.end - 2, plan.end + 12], [0, 1], {
    ...CLAMP,
    easing: ENTER,
  });
  const push = interpolate(t, [0, plan.end + 40], [1, 1.03], {
    ...CLAMP,
    easing: MOVE,
  });

  const caretEl = (
    <span
      key="caret"
      style={{
        display: "inline-block",
        position: "relative",
        width: 0,
        height: "0.86em",
        verticalAlign: "-0.1em",
      }}
    >
      <span
        style={{
          position: "absolute",
          left: "0.035em",
          top: 0,
          bottom: 0,
          width: Math.max(2, 0.04 * F),
          borderRadius: 2,
          background: c.fill,
          opacity: blink,
        }}
      />
    </span>
  );

  const nodes: React.ReactNode[] = [];
  glyphs.forEach((g, idx) => {
    if (idx === caret) nodes.push(caretEl);
    const visible =
      g.seg < 0 ? idx < typedCount : t >= segs[g.seg].ghostIn - 0.5;
    if (!visible) return;
    if (g.ch === "\n") {
      nodes.push(<br key={idx} />);
      return;
    }
    nodes.push(
      <span key={idx} style={styleOf(g)}>
        {g.ch}
      </span>,
    );
  });
  if (caret >= glyphs.length) nodes.push(caretEl);

  const label = (size: number): React.CSSProperties => ({
    fontFamily: geist,
    fontWeight: 400,
    fontSize: size,
    letterSpacing: "-0.01em",
    color: c.dim,
  });

  const keyCap = (k: number, raised: boolean) => (
    <div
      style={{
        height: 34 * k,
        padding: `0 ${12 * k}px`,
        display: "flex",
        alignItems: "center",
        borderRadius: 8 * k,
        background: interpolateColors(
          press,
          [0, 1],
          [raised ? c.card : c.keyBg, c.fill],
        ),
        boxShadow: `inset 0 0 0 1px ${c.key}, 0 ${(1 - press) * 2 * k}px 0 ${c.key}${raised ? `, ${c.depth}` : ""}`,
        transform: `translateY(${press * 2 * k}px) scale(${1 - press * 0.04})`,
        color: interpolateColors(
          press,
          [0, 1],
          [c.fg, dark ? "#1A0E06" : "#FFFFFF"],
        ),
        fontFamily: mono,
        fontWeight: 400,
        fontSize: 17 * k,
        letterSpacing: "0.02em",
      }}
    >
      Tab
    </div>
  );

  const keyIn = spring({
    frame: t - segs[0].ghostIn + 4,
    fps,
    config: { mass: 0.8, damping: 18, stiffness: 160 },
  });

  return (
    <AbsoluteFill style={{ background: c.base, overflow: "hidden" }}>
      <GshGround
        preset={resolvedGround}
        params={resolvedParams}
        timeOffset={dark ? 6 : 2}
        timeScale={0.45}
      />
      <AbsoluteFill style={{ background: c.scrim }} />
      <AbsoluteFill style={{ transform: `scale(${push})` }}>
        <div
          style={{
            position: "absolute",
            left: cardLeft,
            top: cardTop,
            width: cardW,
            height: cardH,
            borderRadius: 28 * u,
            background: c.card,
            boxShadow: c.depth,
            overflow: "hidden",
            opacity: interpolate(cardIn, [0, 0.4], [0, 1], CLAMP),
            transform: `translateY(${(1 - cardIn) * 40 * u}px) scale(${0.96 + 0.04 * cardIn})`,
          }}
        >
          <div
            style={{
              position: "absolute",
              left: padX,
              top: 0,
              height: headH,
              display: "flex",
              alignItems: "flex-end",
              gap: 10 * u,
            }}
          >
            <svg
              viewBox="0 0 24 24"
              width={(tall ? 28 : 22) * u}
              height={(tall ? 28 : 22) * u}
              style={{ marginBottom: 1 * u }}
              aria-hidden
            >
              <g
                fill="none"
                stroke={c.dim}
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M6.5 3.5h7l4 4v13h-11z" />
                <path d="M13.5 3.5v4h4M9.5 12.5h5M9.5 16h5" />
              </g>
            </svg>
            <div style={label((tall ? 26 : 19) * u)}>{title}</div>
          </div>
          <div
            style={{
              position: "absolute",
              left: padX,
              top: padTop,
              width: blockW + F,
              fontFamily: geist,
              fontWeight: 400,
              fontSize: F,
              lineHeight: LEADING,
              letterSpacing: `${TRACK}em`,
              whiteSpace: "pre",
              fontKerning: "normal",
            }}
          >
            {nodes}
          </div>
          {tall ? null : (
            <div
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                bottom: 0,
                height: footH,
                borderTop: `1px solid ${c.divider}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: `0 ${padX - 10 * u}px 0 ${padX}px`,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12 * u,
                  opacity: (0.35 + 0.65 * hintArmed) * (1 - hintOut),
                }}
              >
                {keyCap(u, false)}
                <div style={label(19 * u)}>to accept</div>
              </div>
              {showLogo ? (
                <div
                  style={{
                    opacity: logoIn,
                    transform: `translateY(${(1 - logoIn) * 8 * u}px)`,
                  }}
                >
                  <RemocnLogo fontSize={24 * u} color={c.logo} />
                </div>
              ) : null}
            </div>
          )}
        </div>
        {tall ? (
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: bigKeyY,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 30 * u,
              opacity:
                Math.min(1, keyIn * 1.4) *
                (0.35 + 0.65 * hintArmed) *
                (1 - 0.5 * hintOut),
              transform: `translateY(${(1 - keyIn) * 40 * u}px)`,
            }}
          >
            {keyCap(3.4 * u, true)}
            <div style={label(34 * u)}>to accept</div>
          </div>
        ) : null}
        {tall && showLogo ? (
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: bigKeyY + 290 * u,
              display: "flex",
              justifyContent: "center",
              opacity: logoIn,
              transform: `translateY(${(1 - logoIn) * 12 * u}px)`,
            }}
          >
            <RemocnLogo fontSize={40 * u} color={c.logo} />
          </div>
        ) : null}
      </AbsoluteFill>
    </AbsoluteFill>
  );
}
