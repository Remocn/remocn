"use client";

import { loadFont } from "@remotion/google-fonts/Onest";
import type React from "react";
import { useId, useMemo } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  interpolateColors,
  spring,
} from "remotion";
import { useSceneConfig, useSceneFrame } from "@/lib/remocn/frame-rate";
import { useGlide } from "@/lib/remocn/glide";
import { type Timing, useTimeline } from "@/lib/remocn/timeline";
import {
  advance,
  DEFAULT_AFTER,
  DEFAULT_CORRECT,
  DEFAULT_WRONG,
  HOLD,
  layoutWord,
  mapLetters,
  RULE_DELAY,
  RULE_LEN,
  SWAP_AT,
  SWAP_STAGGER,
  TRACK,
  TRAVEL,
  type TypoFixElementId,
  textEm,
  typoFixTimeline,
} from "./timeline";

const { fontFamily: sans } = loadFont("normal", {
  weights: ["500"],
  subsets: ["latin"],
});

export interface TypoFixProps {
  wrong?: string;
  correct?: string;
  before?: string;
  after?: string;
  /** Frame the letters start hopping into their right places. */
  fixAt?: number;
  /** Color of the spell-check squiggle; overrides the theme. */
  errorColor?: string;
  accent?: string;
  /** Text color; overrides the theme ink. */
  ink?: string;
  /** Background fill in place of the lit ground; "transparent" drops it. */
  background?: string;
  /** Typeface for the line. Load it yourself; Onest by default. */
  fontFamily?: string;
  /** Film grain over the scene. */
  grain?: boolean;
  /** Size of the line, around the frame's center. */
  scale?: number;
  /** Frames to hold the first frame before anything moves. */
  delay?: number;
  theme?: "dark" | "light";
  speed?: number;
  /**
   * Moves, trims or stretches the parts of the line rising in, the
   * squiggle, the fix, the retract and the rule, by the ids in
   * `./timeline`. Frames on the scene timeline, after `delay` and `speed`.
   */
  timing?: Timing<TypoFixElementId>;
}

const ASC = 0.97;
const LINE = 1.275;
const CAP = 0.708;
const SPACE = 0.274 + TRACK;

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_IO = Easing.bezier(0.65, 0, 0.35, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

// Ground: gradients.sh "grain" (dark) and "smear" (light), a warm light
// from the top left, kept low so the type and the red squiggle stay crisp.
const THEMES = {
  dark: {
    bg: "#070505",
    fg: "#F5F1EC",
    dim: "#6A605B",
    error: "#FF5A4F",
    grain: 0.08,
    glow: "rgba(255, 216, 180, 0.36)",
    wash: [
      "rgba(224, 112, 59, 0.85)",
      "rgba(138, 44, 29, 0.62)",
      "rgba(43, 16, 21, 0.55)",
    ],
  },
  light: {
    bg: "#F5F2EC",
    fg: "#141212",
    dim: "#ABA39C",
    error: "#D9302C",
    grain: 0.05,
    glow: "rgba(255, 236, 200, 0.6)",
    wash: [
      "rgba(247, 178, 59, 0.62)",
      "rgba(242, 85, 44, 0.36)",
      "rgba(232, 137, 181, 0.2)",
    ],
  },
} as const;

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
          seed={23}
          stitchTiles="stitch"
        />
        <feColorMatrix values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0.9 0" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#${id})`} />
    </svg>
  );
}

interface Glyph {
  key: string;
  ch: string;
  x0: number;
  x1: number;
  start: number;
  lift: number;
  over: boolean;
  fadeIn: boolean;
  fadeOut: boolean;
}

export function typoFixDuration(wrong = DEFAULT_WRONG) {
  return (
    SWAP_AT +
    Math.max(0, wrong.length - 1) * SWAP_STAGGER +
    TRAVEL +
    RULE_DELAY +
    RULE_LEN +
    HOLD
  );
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

export function TypoFix(props: TypoFixProps) {
  const {
    wrong = DEFAULT_WRONG,
    correct = DEFAULT_CORRECT,
    before = "",
    after = DEFAULT_AFTER,
    errorColor,
    accent = "#3B5BFD",
    ink,
    background,
    fontFamily = sans,
    grain = true,
    scale = 1,
    delay = 0,
    theme = "dark",
    speed = 1,
    timing,
  } = props;
  const glide = useGlide();
  const t = Math.max(0, useSceneFrame() - delay) * speed;
  const { width: W, height: H, fps, durationInFrames } = useSceneConfig();
  const tl = useTimeline(
    typoFixTimeline,
    props,
    durationInFrames * speed,
    timing,
  );
  const fixEl = tl.get("fix");
  const parts = tl.lane("Line");
  const c = THEMES[theme];
  const fg = ink ?? c.fg;
  const stage =
    background === "transparent" ? "transparent" : (background ?? c.bg);
  const clipId = `tf${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;

  const a = useMemo(() => Array.from(wrong), [wrong]);
  const b = useMemo(() => Array.from(correct), [correct]);
  const la = useMemo(() => layoutWord(a), [a]);
  const lb = useMemo(() => layoutWord(b), [b]);
  const beforeW = before ? textEm(before) + SPACE : 0;
  const afterW = after ? SPACE + textEm(after) : 0;

  const glyphs = useMemo<Glyph[]>(() => {
    const fixAt = fixEl.start;
    const stagger = fixEl.beat("stagger");
    const { src, orphans } = mapLetters(a, b);
    let order = 0;
    const list: Glyph[] = b.map((ch, j) => {
      const i = src[j];
      const x1 = lb.xs[j];
      if (i < 0)
        return {
          key: `in-${j}`,
          ch,
          x0: x1,
          x1,
          start: fixAt,
          lift: 0,
          over: true,
          fadeIn: true,
          fadeOut: false,
        };
      const x0 = la.xs[i];
      const dx = x1 - x0;
      const moving = Math.abs(dx) > 0.02;
      return {
        key: `m-${i}`,
        ch,
        x0,
        x1,
        start: fixAt + (moving ? order++ * stagger : 0),
        lift: moving ? Math.min(0.62, Math.max(0.44, Math.abs(dx) * 0.85)) : 0,
        over: dx > 0,
        fadeIn: false,
        fadeOut: false,
      };
    });
    for (const i of orphans)
      list.push({
        key: `o-${i}`,
        ch: a[i],
        x0: la.xs[i],
        x1: la.xs[i],
        start: fixAt,
        lift: 0,
        over: false,
        fadeIn: false,
        fadeOut: true,
      });
    return list.sort((m, n) => Number(m.over) - Number(n.over));
  }, [a, b, la, lb, fixEl]);

  const travel = fixEl.beat("travel");
  const swapEnd = fixEl.end;
  const fix = EASE_IO(interpolate(t, [fixEl.start, swapEnd], [0, 1], CLAMP));
  const wordW = la.total + (lb.total - la.total) * fix;
  const maxTotal = beforeW + Math.max(la.total, lb.total) - TRACK + afterW;
  const F = Math.min(H * 0.27, (W * 0.8) / Math.max(maxTotal, 0.1));
  const total = beforeW + wordW - TRACK + afterW;
  const left = -total / 2;
  const wordLeft = left + beforeW;
  const baseline = H / 2 + (CAP * F) / 2;

  // Part `k` of the line as it has them: before, word, after.
  const enterAt = (k: number, tt: number) =>
    EASE_OUT(interpolate(tt, [parts[k].start, parts[k].end], [0, 1], CLAMP));
  const enter = (k: number) => enterAt(k, t);
  const wordEnter = enter(before ? 1 : 0);
  // Whether a value in px is still travelling, against the neighbouring frames.
  const stirs = (at: (tt: number) => number) =>
    Math.abs(at(t + 1) - at(t)) > 1e-3 || Math.abs(at(t) - at(t - 1)) > 1e-3;
  const entering = (k: number) => stirs((tt) => enterAt(k, tt) * 0.2 * F);

  const ulY = baseline + 0.19 * F;
  const ulX0 = W / 2 + wordLeft * F;
  const ulX1 = W / 2 + (wordLeft + la.total - TRACK) * F;
  const amp = 0.036 * F;
  const wave = 0.13 * F;
  const pts: string[] = [];
  for (let x = ulX0; x <= ulX1 + 0.5; x += 2) {
    const y = ulY + amp * Math.sin(((x - ulX0) / wave) * Math.PI * 2);
    pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  }
  const squiggle = tl.get("squiggle");
  const retractEl = tl.get("retract");
  const draw = EASE_OUT(
    interpolate(t, [squiggle.start, squiggle.end], [0, 1], CLAMP),
  );
  const retract = EASE_IO(
    interpolate(t, [retractEl.start, retractEl.end], [0, 1], CLAMP),
  );
  const clipL = ulX0 - amp + (ulX1 - ulX0 + 2 * amp) * retract;
  const clipR = ulX0 - amp + (ulX1 - ulX0 + 2 * amp) * draw;

  const ruleEl = tl.get("rule");
  const rule = EASE_OUT(
    interpolate(t, [ruleEl.start, ruleEl.end], [0, 1], CLAMP),
  );
  const ruleT = Math.max(3, 0.045 * F);
  const ruleX0 = W / 2 + wordLeft * F;
  const ruleW = (lb.total - TRACK) * F;
  const tickAt = (tt: number) =>
    tt >= swapEnd
      ? Math.sin(
          Math.PI *
            Math.min(
              1,
              spring({
                frame: tt - swapEnd,
                fps,
                config: { damping: 14, stiffness: 220, mass: 0.6 },
              }),
            ),
        )
      : 0;
  const tick = tickAt(t);

  const textStyle = {
    position: "absolute" as const,
    top: `${-ASC}em`,
    letterSpacing: `${TRACK}em`,
    whiteSpace: "pre" as const,
    color: fg,
  };

  // The light drifts a few percent across the shot.
  const drift = interpolate(t, [0, swapEnd + RULE_LEN + HOLD], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const gx = 10 + 5 * drift;
  const gy = 8 + 3 * drift;
  const ground = [
    `radial-gradient(48% 42% at ${gx.toFixed(2)}% ${gy.toFixed(2)}%, ${c.glow} 0%, transparent 60%)`,
    `linear-gradient(${(150 - 4 * drift).toFixed(2)}deg, ${c.wash[0]} 0%, ${c.wash[1]} 20%, ${c.wash[2]} 40%, transparent 62%)`,
  ].join(", ");

  return (
    <AbsoluteFill style={{ background: stage, overflow: "hidden" }}>
      {background === undefined ? (
        <div style={{ position: "absolute", inset: 0, background: ground }} />
      ) : null}
      <ScaleLayer scale={scale}>
        <svg
          width={W}
          height={H}
          style={{ position: "absolute", inset: 0 }}
          aria-hidden
        >
          <defs>
            <clipPath id={clipId}>
              <rect
                x={clipL}
                y={ulY - amp * 3}
                width={Math.max(0, clipR - clipL)}
                height={amp * 6}
              />
            </clipPath>
          </defs>
          {draw > 0 && retract < 1 ? (
            <polyline
              points={pts.join(" ")}
              fill="none"
              stroke={errorColor ?? c.error}
              strokeWidth={Math.max(2, 0.03 * F)}
              strokeLinecap="round"
              strokeLinejoin="round"
              clipPath={`url(#${clipId})`}
            />
          ) : null}
        </svg>
        {rule > 0 ? (
          <div
            style={{
              position: "absolute",
              left: ruleX0,
              top: ulY - ruleT / 2,
              width: ruleW * rule,
              height: ruleT,
              borderRadius: ruleT / 2,
              background: accent,
            }}
          />
        ) : null}
        <div
          style={{
            position: "absolute",
            left: W / 2,
            top: baseline,
            fontFamily,
            fontWeight: 500,
            fontSize: F,
            lineHeight: LINE,
            fontKerning: "none",
          }}
        >
          {before ? (
            <div
              style={{
                ...textStyle,
                left: `${left}em`,
                fontKerning: "normal",
                opacity: enter(0),
                transform: `translateY(${(1 - enter(0)) * 0.2}em)${glide(entering(0))}`,
              }}
            >
              {before}
            </div>
          ) : null}
          <div
            style={{
              position: "absolute",
              left: `${wordLeft}em`,
              top: 0,
              opacity: wordEnter,
              // The glyphs inside swap on arcs of their own; this one tilt
              // covers them too.
              transform: `translateY(${(1 - wordEnter) * 0.2 - tick * 0.035}em)${glide(
                entering(before ? 1 : 0) ||
                  stirs((tt) => tickAt(tt) * 0.035 * F) ||
                  glyphs.some((g) =>
                    stirs(
                      (tt) =>
                        Math.sin(
                          Math.PI *
                            EASE_IO(
                              interpolate(
                                tt,
                                [g.start, g.start + travel],
                                [0, 1],
                                CLAMP,
                              ),
                            ),
                        ) *
                        g.lift *
                        F,
                    ),
                  ),
              )}`,
            }}
          >
            {glyphs.map((g) => {
              const p = EASE_IO(
                interpolate(t, [g.start, g.start + travel], [0, 1], CLAMP),
              );
              const arc = Math.sin(Math.PI * p);
              const x = g.x0 + (g.x1 - g.x0) * p;
              const y = g.over ? -g.lift * arc : g.lift * 0.85 * arc;
              const scale = g.lift
                ? g.over
                  ? 1 + 0.08 * arc
                  : 1 - 0.08 * arc
                : 1;
              let opacity = 1;
              if (g.fadeIn) opacity = interpolate(p, [0.4, 1], [0, 1], CLAMP);
              if (g.fadeOut) opacity = interpolate(p, [0, 0.6], [1, 0], CLAMP);
              const color =
                g.lift && !g.over
                  ? interpolateColors(arc, [0, 1], [fg, c.dim])
                  : fg;
              return (
                <div
                  key={g.key}
                  style={{
                    ...textStyle,
                    left: 0,
                    color,
                    opacity,
                    transform: `translate(${x}em, ${y}em) scale(${scale})`,
                    transformOrigin: `${advance(g.ch) / 2}em ${ASC}em`,
                  }}
                >
                  {g.ch}
                </div>
              );
            })}
          </div>
          {after ? (
            <div
              style={{
                ...textStyle,
                left: `${wordLeft + wordW + SPACE}em`,
                fontKerning: "normal",
                opacity: enter(before ? 2 : 1),
                transform: `translateY(${(1 - enter(before ? 2 : 1)) * 0.2}em)${glide(entering(before ? 2 : 1))}`,
              }}
            >
              {after}
            </div>
          ) : null}
        </div>
      </ScaleLayer>
      {grain ? <Grain opacity={c.grain} /> : null}
    </AbsoluteFill>
  );
}
