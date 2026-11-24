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
} from "remotion";
import { useSceneConfig, useSceneFrame } from "@/lib/remocn/frame-rate";
import { useGlide } from "@/lib/remocn/glide";
import type { GradientParams } from "@/lib/remocn/gsh/gradient-engine";
import { GshGround } from "@/lib/remocn/gsh/gsh-ground";
import type { GshPresetId } from "@/lib/remocn/gsh/presets";
import {
  type ResolvedElement,
  type Timing,
  useTimeline,
} from "@/lib/remocn/timeline";
import {
  DEFAULT_SUGGESTIONS,
  DEFAULT_TYPED,
  type GhostCompleteElementId,
  ghostCompleteTimeline,
  suggestionText,
} from "./timeline";

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
  /** Label of the key pressed to accept a suggestion. */
  keyLabel?: string;
  /** Text next to the key. */
  hintLabel?: string;
  /** Frames a ghost suggestion waits before it is accepted. */
  hold?: number;
  /** Replaces the remocn mark. */
  logo?: React.ReactNode;
  /** Text color; overrides the theme ink. */
  ink?: string;
  /** Solid fill in place of the gradient ground; "transparent" drops it. */
  background?: string;
  /** Typeface for the copy. Load it yourself; Geist by default. */
  fontFamily?: string;
  /** Size of the card and key, around the frame's center. */
  scale?: number;
  /** Frames to hold the first frame before anything moves. */
  delay?: number;
  speed?: number;
  /**
   * Moves, trims or stretches the card, the typing, single ghosts and
   * accepts, the logo and the push, by the ids in `./timeline`.
   * Frames on the scene timeline, after `delay` and `speed`.
   */
  timing?: Timing<GhostCompleteElementId>;
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
  ghost: ResolvedElement<GhostCompleteElementId>;
  accept: ResolvedElement<GhostCompleteElementId>;
}

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

export function GhostComplete(props: GhostCompleteProps) {
  const {
    title = "Launch notes",
    typed = DEFAULT_TYPED,
    suggestions = DEFAULT_SUGGESTIONS,
    keepLastFill = true,
    showLogo = true,
    theme = "dark",
    ground,
    groundParams,
    keyLabel = "Tab",
    hintLabel = "to accept",
    logo,
    ink,
    background,
    fontFamily = geist,
    scale = 1,
    delay = 0,
    speed = 1,
    timing,
  } = props;
  const glide = useGlide();
  const frame = useSceneFrame();
  const t = Math.max(0, frame - delay) * speed;
  const { width: W, height: H, fps, durationInFrames } = useSceneConfig();
  const tl = useTimeline(
    ghostCompleteTimeline,
    props,
    durationInFrames * speed,
    timing,
  );
  const typeEl = tl.get("type");
  const logoEl = tl.get("logo");
  const pushEl = tl.get("push");
  const tall = H > W;
  const u = tall ? W / 1000 : H / 720;
  const c = THEMES[theme];
  const dark = theme === "dark";
  const fg = ink ?? c.fg;
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
    suggestions.forEach((raw, k) => {
      const chars = Array.from(suggestionText(raw));
      const start = glyphs.length;
      chars.forEach((ch, i) => {
        glyphs.push({ ch, seg: k, i });
      });
      segs.push({
        start,
        length: chars.length,
        breaks: chars.filter((ch) => ch === "\n").length,
        ghost: tl.get(`ghost:${k}`),
        accept: tl.get(`accept:${k}`),
      });
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
    };
  }, [typed, suggestions, tl]);
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
            frame: t - s.ghost.start - s.ghost.beat("breakAt"),
            fps,
            config: { damping: 200 },
            durationInFrames: s.ghost.beat("break"),
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
    Math.min(
      typed.length,
      Math.floor((t - typeEl.start) / typeEl.beat("char")) + 1,
    ),
  );
  let caret = typedCount;
  let busy = t < typeEl.end + typeEl.beat("busyTail");
  const fronts = segs.map((s) => {
    const a = s.accept;
    const k = interpolate(t, [a.start, a.end], [0, 1], {
      ...CLAMP,
      easing: MOVE,
    });
    const front = k * s.length;
    if (t >= a.start) caret = s.start + Math.min(s.length, Math.ceil(front));
    if (t >= a.start + a.beat("busyAt") && t <= a.end + a.beat("busyTail"))
      busy = true;
    return front;
  });
  const phase = (t % 30) / 30;
  const blink = busy
    ? 1
    : interpolate(phase, [0, 0.45, 0.55, 0.95, 1], [1, 1, 0, 0, 1], CLAMP);

  const styleOf = (g: Glyph): React.CSSProperties => {
    if (g.seg < 0) return { color: fg };
    const s = segs[g.seg];
    const appear = interpolate(
      t,
      [
        s.ghost.start + g.i * s.ghost.beat("stagger"),
        s.ghost.start + g.i * s.ghost.beat("stagger") + s.ghost.beat("appear"),
      ],
      [0, 1],
      { ...CLAMP, easing: ENTER },
    );
    const filled = Math.min(1, Math.max(0, fronts[g.seg] - g.i));
    const settleAt = s.accept.end + s.accept.beat("settleAt");
    const settle =
      keepLastFill && g.seg === segs.length - 1
        ? 0
        : interpolate(
            t,
            [settleAt, settleAt + s.accept.beat("settle")],
            [0, 1],
            {
              ...CLAMP,
              easing: MOVE,
            },
          );
    if (filled <= 0) return { color: c.ghost, opacity: appear };
    if (settle > 0) {
      return { color: interpolateColors(settle, [0, 1], [c.fill, fg]) };
    }
    return { color: interpolateColors(filled, [0, 1], [c.ghost, c.fill]) };
  };

  const hintOut = interpolate(
    t,
    [
      last.accept.end + last.accept.beat("hintAt"),
      last.accept.end + last.accept.beat("hintEnd"),
    ],
    [0, 1],
    { ...CLAMP, easing: EXIT },
  );
  const hintArmed = interpolate(
    t,
    [
      segs[0].ghost.start + segs[0].ghost.beat("armAt"),
      segs[0].ghost.start + segs[0].ghost.beat("armEnd"),
    ],
    [0, 1],
    { ...CLAMP, easing: ENTER },
  );
  const press = segs.reduce((p, s) => {
    const down = spring({
      frame: t - s.accept.start - s.accept.beat("pressAt"),
      fps,
      config: { mass: 0.5, damping: 12, stiffness: 200 },
    });
    const up = spring({
      frame: t - s.accept.start - s.accept.beat("releaseAt"),
      fps,
      config: { mass: 0.5, damping: 12, stiffness: 200 },
    });
    return Math.max(p, Math.max(0, down - up));
  }, 0);
  const logoIn = interpolate(
    t,
    [logoEl.start + logoEl.beat("in"), logoEl.end],
    [0, 1],
    {
      ...CLAMP,
      easing: ENTER,
    },
  );
  const pushAt = (f: number) =>
    interpolate(
      Math.max(0, f - delay) * speed,
      [pushEl.start, pushEl.end],
      [1, 1.03],
      {
        ...CLAMP,
        easing: MOVE,
      },
    );
  const push = pushAt(frame);
  // Whether the push moves is read off the neighbouring frames, weighed by
  // the distance to the frame's edge.
  const reach = Math.max(W, H) / 2;
  const pushing =
    Math.abs(pushAt(frame + 1) - push) * reach > 1e-3 ||
    Math.abs(push - pushAt(frame - 1)) * reach > 1e-3;

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
      g.seg < 0
        ? idx < typedCount
        : t >= segs[g.seg].ghost.start + segs[g.seg].ghost.beat("showAt");
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
    fontFamily,
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
          [fg, dark ? "#1A0E06" : "#FFFFFF"],
        ),
        fontFamily: mono,
        fontWeight: 400,
        fontSize: 17 * k,
        letterSpacing: "0.02em",
      }}
    >
      {keyLabel}
    </div>
  );

  const keyIn = spring({
    frame: t - segs[0].ghost.start - segs[0].ghost.beat("keyAt"),
    fps,
    config: { mass: 0.8, damping: 18, stiffness: 160 },
  });

  return (
    <AbsoluteFill
      style={{
        background:
          background === undefined
            ? c.base
            : background === "transparent"
              ? undefined
              : background,
        overflow: "hidden",
      }}
    >
      {background === undefined ? (
        <>
          <GshGround
            preset={resolvedGround}
            params={resolvedParams}
            timeOffset={dark ? 6 : 2}
            timeScale={0.45}
          />
          <AbsoluteFill style={{ background: c.scrim }} />
        </>
      ) : null}
      <ScaleLayer scale={scale}>
        <AbsoluteFill
          style={{
            transform: `scale(${push})${glide(pushing)}`,
          }}
        >
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
                fontFamily,
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
                  // Pinned where the grown card leaves it; the ride down as
                  // lines open is a transform, since layout rounds the
                  // footer's box and baseline to whole pixels as the card's
                  // bottom edge eases.
                  top: finalH - footH,
                  transform:
                    Math.abs(cardH - finalH) < 1e-3
                      ? undefined
                      : `translateY(${cardH - finalH}px)`,
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
                  <div style={label(19 * u)}>{hintLabel}</div>
                </div>
                {showLogo ? (
                  <div
                    style={{
                      opacity: logoIn,
                      transform: `translateY(${(1 - logoIn) * 8 * u}px)`,
                    }}
                  >
                    {logo ?? <RemocnLogo fontSize={24 * u} color={c.logo} />}
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
              <div style={label(34 * u)}>{hintLabel}</div>
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
              {logo ?? <RemocnLogo fontSize={40 * u} color={c.logo} />}
            </div>
          ) : null}
        </AbsoluteFill>
      </ScaleLayer>
    </AbsoluteFill>
  );
}
