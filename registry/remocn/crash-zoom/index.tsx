"use client";

import { loadFont as loadSerif } from "@remotion/google-fonts/InstrumentSerif";
import { loadFont } from "@remotion/google-fonts/SchibstedGrotesk";
import type React from "react";
import { AbsoluteFill, Easing, interpolate, spring } from "remotion";
import { useSceneConfig, useSceneFrame } from "@/lib/remocn/frame-rate";
import { useGlide } from "@/lib/remocn/glide";
import type { GradientParams } from "@/lib/remocn/gsh/gradient-engine";
import { GshGround } from "@/lib/remocn/gsh/gsh-ground";
import type { GshPresetId } from "@/lib/remocn/gsh/presets";
import { type Timing, useTimeline } from "@/lib/remocn/timeline";
import { type CrashZoomElementId, crashZoomTimeline } from "./timeline";

const { fontFamily: grotesk } = loadFont("normal", {
  weights: ["400"],
  subsets: ["latin"],
});
const { fontFamily: serifItalic } = loadSerif("italic", {
  weights: ["400"],
  subsets: ["latin"],
});

export interface CrashZoomProps {
  /** The calm tease, set in the serif italic. A trailing "…" types in dot by dot. */
  tease?: string;
  /** The reveal, slammed huge in solid ink. */
  reveal?: string;
  /** Line under the reveal. Empty string hides it. */
  tagline?: string;
  /** Kept for the shared draft API; the payoff colour comes from the ground. */
  accent?: string;
  /** Text color; overrides the theme ink. */
  ink?: string;
  /** Solid fill in place of the gradient ground; "transparent" drops it. */
  background?: string;
  /** Typeface for the reveal. Load it yourself; Schibsted Grotesk by default. */
  fontFamily?: string;
  /** Frames of the tease before the crash zoom hits. */
  windup?: number;
  /** Number of speed lines in the crash. */
  streaks?: number;
  /** Size of the copy and speed lines, around the frame's center. */
  scale?: number;
  /** Frames to hold the first frame before anything moves. */
  delay?: number;
  theme?: "dark" | "light";
  speed?: number;
  /** gradients.sh preset for the ground. Defaults to "ember" (dark) or a warm paper mist (light). */
  ground?: GshPresetId;
  groundParams?: Partial<GradientParams>;
  /**
   * Moves, trims or stretches the tease, its dots, the crash, the slam and
   * the tagline, by the ids in `./timeline`.
   * Frames on the scene timeline, after `delay` and `speed`.
   */
  timing?: Timing<CrashZoomElementId>;
}

const ENTER = Easing.bezier(0.32, 0.72, 0, 1);
const SOFT = Easing.bezier(0.22, 1, 0.36, 1);
const EXIT = Easing.bezier(0.55, 0, 1, 0.45);
const CARD = { mass: 0.8, damping: 18, stiffness: 160 };
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const LIGHT_GROUND: Partial<GradientParams> = {
  kind: "radial-glow",
  colors: ["#fff3e4", "#ffb27a", "#f2643a", "#e889b5"],
  background: "#f5f4f0",
  speed: 0.97,
  loopSeconds: 10,
  warp: 0.6,
  blur: 0.7,
  grain: 0.12,
  seed: 14,
};

const THEMES = {
  dark: {
    stage: "#0A0A0B",
    ink: "#F3F2EF",
    lines: "#F3F2EF",
    veil: "10,10,11",
    veilRest: 0.18,
  },
  light: {
    stage: "#F5F4F0",
    ink: "#121214",
    lines: "#121214",
    veil: "245,244,240",
    veilRest: 0.1,
  },
} as const;

function ramp(t: number, from: number, len: number) {
  return interpolate(t, [from, from + len], [0, 1], CLAMP);
}

function hash(n: number) {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
}

function shake(d: number, amp: number, len: number, seed: number) {
  if (d < 0 || d > len) return { x: 0, y: 0, r: 0 };
  const k = (1 - d / len) ** 2;
  return {
    x: amp * k * Math.sin(d * 2.9 + seed),
    y: amp * 0.75 * k * Math.cos(d * 3.7 + seed * 1.3),
    r: 0.5 * k * Math.sin(d * 2.3 + seed * 0.7),
  };
}

const LINE_COUNT = 72;

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

export function CrashZoom(props: CrashZoomProps) {
  const {
    tease = "Wait for it…",
    reveal = "1 DAY.",
    tagline = "to make this video.",
    ink,
    background,
    fontFamily = grotesk,
    streaks = LINE_COUNT,
    scale = 1,
    delay = 0,
    theme = "dark",
    speed = 1,
    ground,
    groundParams,
    timing,
  } = props;
  const glide = useGlide();
  const t = Math.max(0, useSceneFrame() - delay) * speed;
  const { width: W, height: H, fps, durationInFrames } = useSceneConfig();
  const tl = useTimeline(
    crashZoomTimeline,
    props,
    durationInFrames * speed,
    timing,
  );
  const teaseEl = tl.get("tease");
  const crashEl = tl.get("crash");
  const impactEl = tl.get("impact");
  const tagEl = tl.get("tag");
  const c = THEMES[theme];
  const fg = ink ?? c.ink;
  const stage =
    background === undefined
      ? c.stage
      : background === "transparent"
        ? "transparent"
        : background;
  const impact = impactEl.start;
  const flash = impactEl.beat("flash");
  const u = Math.min(W / 1280, H / 720);
  const inverted = t >= impact && t < impact + flash;

  const hasDots = tease.endsWith("…");
  const teaseBody = hasDots ? tease.slice(0, -1) : tease;
  const teaseIn = ENTER(ramp(t, teaseEl.start, teaseEl.length));
  const dotsEl = hasDots ? tl.get("dots") : undefined;
  const dots = dotsEl
    ? Math.min(
        3,
        Math.max(0, Math.floor((t - dotsEl.start) / dotsEl.beat("gap")) + 1),
      )
    : 0;
  const push = interpolate(t, [0, crashEl.start], [1, 1.28], {
    ...CLAMP,
    easing: EXIT,
  });
  const crash = ramp(t, crashEl.start, crashEl.length);
  const teaseScale = push * (1 + 7 * crash ** 2.2);
  const teaseBlur = crash > 0 ? 2 + 10 * crash : 0;
  const teaseOpacity =
    teaseIn *
    (1 - ramp(t, crashEl.start + crashEl.beat("fadeAt"), crashEl.beat("fade")));

  const slamAt = (f: number) =>
    spring({ frame: f - impact - flash, fps, config: CARD });
  const slam = slamAt(t);
  const revealScale = inverted ? 1.14 : 1.14 - 0.14 * slam;
  // The slam spring has a long tail; weigh its scale step by the half width
  // of the reveal, where its glyphs travel furthest.
  const revealMoving =
    !inverted &&
    0.14 *
      0.42 *
      W *
      Math.max(
        Math.abs(slamAt(t + speed) - slam),
        Math.abs(slam - slamAt(t - speed)),
      ) >
      1e-3;
  const revealBlur = inverted ? 0 : 10 * Math.max(0, 1 - slam * 1.4);

  const rumble = ramp(t, crashEl.start, crashEl.length);
  const rx = t < impact ? 5 * u * rumble * Math.sin(t * 2.1) : 0;
  const ry = t < impact ? 4 * u * rumble * Math.cos(t * 2.7) : 0;
  const hit = shake(t - impact, 14 * u, impactEl.beat("shake"), 1.7);

  const linesLead = crashEl.beat("lines");
  const linesIn =
    ramp(t, crashEl.start + linesLead, crashEl.length - linesLead) ** 1.4;
  const linesBack = SOFT(ramp(t, impact + flash, impactEl.beat("lines")));
  const reach = t < impact ? 1.9 - 0.9 * linesIn : 1 + 0.18 * linesBack;
  const linesAlpha =
    t < impact ? 0.55 * linesIn : 0.55 - (0.55 - 0.1) * linesBack;
  const cx = W / 2;
  const cy = H / 2;
  const far = Math.hypot(W, H) * 0.75;
  const lines: string[] = [];
  for (let i = 0; i < streaks; i++) {
    const a =
      (i / streaks) * Math.PI * 2 +
      (hash(i) - 0.5) * ((Math.PI * 2) / streaks) * 0.9;
    const near = 1 + 0.35 * hash(i + 91);
    const rxIn = 0.44 * W * near * reach;
    const ryIn = 0.36 * H * near * reach;
    const half = (1.5 + 6 * hash(i + 37)) * u;
    const ca = Math.cos(a);
    const sa = Math.sin(a);
    const ox = cx + far * ca;
    const oy = cy + far * sa;
    const tipX = cx + rxIn * ca;
    const tipY = cy + ryIn * sa;
    lines.push(
      `M${(ox - sa * half).toFixed(1)} ${(oy + ca * half).toFixed(1)}L${(ox + sa * half).toFixed(1)} ${(oy - ca * half).toFixed(1)}L${tipX.toFixed(1)} ${tipY.toFixed(1)}Z`,
    );
  }

  const bloom = ENTER(ramp(t, impact, impactEl.beat("bloom")));
  const veil = t < impact ? 0.9 : 0.9 - (0.9 - c.veilRest) * bloom;
  const groundScale =
    1.12 - 0.12 * bloom + 0.03 * ramp(t, impact, impactEl.beat("drift"));

  const revealFs = Math.min(0.5 * H, (0.84 * W) / (0.43 * reveal.length));
  const teaseFs = Math.min(0.1 * H, 0.085 * W);
  const tagFs = Math.min(0.075 * H, 0.062 * W);
  const tagIn = ENTER(ramp(t, tagEl.start, tagEl.length));

  const teaseText = (scale: number, opacity: number, key: string) => (
    <div
      key={key}
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        // The tease never stands still: it rises in, the push carries on to
        // the crash, and the impact unmounts it.
        transform: `translateY(${(1 - teaseIn) * 0.04 * H}px) scale(${scale})${glide(true)}`,
        filter:
          teaseBlur > 0.2
            ? `blur(${(teaseBlur * u) / scale}px)`
            : `blur(${(1 - teaseIn) * 6 * u}px)`,
        opacity,
      }}
    >
      <div
        style={{
          fontFamily: serifItalic,
          fontStyle: "italic",
          fontWeight: 400,
          fontSize: teaseFs,
          lineHeight: 1,
          letterSpacing: "-0.01em",
          color: fg,
          whiteSpace: "nowrap",
        }}
      >
        {teaseBody}
        {hasDots ? (
          <span
            style={{
              display: "inline-block",
              clipPath: `inset(-20% ${100 - (dots / 3) * 100}% -20% 0)`,
            }}
          >
            …
          </span>
        ) : null}
      </div>
    </div>
  );

  return (
    <AbsoluteFill
      style={{
        background: inverted ? fg : stage,
        overflow: "hidden",
      }}
    >
      {!inverted && background === undefined ? (
        <>
          <AbsoluteFill style={{ transform: `scale(${groundScale})` }}>
            <GshGround
              preset={ground ?? (theme === "dark" ? "ember" : undefined)}
              params={
                groundParams ?? (theme === "light" ? LIGHT_GROUND : undefined)
              }
              timeOffset={2.4}
              timeScale={0.5}
            />
          </AbsoluteFill>
          <AbsoluteFill style={{ background: `rgba(${c.veil},${veil})` }} />
        </>
      ) : null}

      <ScaleLayer scale={scale}>
        <div
          style={{
            position: "absolute",
            inset: 0,
            // The tail of the shake turns by less than an eighth of a degree,
            // which shows nowhere but, turning against the reveal's lean,
            // cancels it on some frames and snaps the type to the pixel grid
            // mid-shake. The turn stops there; the shove runs on.
            transform: `translate(${rx + hit.x}px, ${ry + hit.y}px) rotate(${Math.abs(hit.r) < 0.125 ? 0 : hit.r}deg)`,
            transformOrigin: "50% 50%",
          }}
        >
          {linesAlpha > 0.01 ? (
            <svg
              width={W}
              height={H}
              viewBox={`0 0 ${W} ${H}`}
              style={{ position: "absolute", inset: 0 }}
              aria-hidden
            >
              <path
                d={lines.join("")}
                fill={inverted ? c.stage : c.lines}
                opacity={inverted ? 0.8 : linesAlpha}
              />
            </svg>
          ) : null}

          {t < impact ? (
            <>
              {crash > 0.02
                ? [5, 4, 3, 2, 1].map((k) =>
                    teaseText(
                      teaseScale * (1 + 0.07 * k * crash),
                      (teaseOpacity * 0.5) / (1 + 0.6 * k),
                      `ghost-${k}`,
                    ),
                  )
                : null}
              {teaseText(teaseScale, teaseOpacity, "tease")}
            </>
          ) : (
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  fontFamily,
                  fontWeight: 400,
                  fontSize: revealFs,
                  lineHeight: 0.9,
                  letterSpacing: "-0.05em",
                  whiteSpace: "nowrap",
                  color: inverted ? c.stage : fg,
                  transform: `scale(${revealScale})${glide(revealMoving)}`,
                  filter:
                    revealBlur > 0.2 ? `blur(${revealBlur * u}px)` : undefined,
                }}
              >
                {reveal}
              </div>
              {tagline ? (
                <div
                  style={{
                    marginTop: 0.035 * H,
                    fontFamily: serifItalic,
                    fontStyle: "italic",
                    fontWeight: 400,
                    fontSize: tagFs,
                    lineHeight: 1,
                    color: fg,
                    whiteSpace: "nowrap",
                    opacity: inverted ? 0 : tagIn,
                    transform: `translateY(${(1 - tagIn) * 0.03 * H}px)${glide(midway(tagIn))}`,
                    filter: `blur(${(1 - tagIn) * 6 * u}px)`,
                  }}
                >
                  {tagline}
                </div>
              ) : null}
            </div>
          )}
        </div>
      </ScaleLayer>
    </AbsoluteFill>
  );
}
