"use client";

import { loadFont as loadSerif } from "@remotion/google-fonts/InstrumentSerif";
import { loadFont } from "@remotion/google-fonts/Sora";
import type React from "react";
import { AbsoluteFill, Easing, interpolate, spring } from "remotion";
import { useSceneConfig, useSceneFrame } from "@/lib/remocn/frame-rate";
import { useGlide } from "@/lib/remocn/glide";
import type { GradientParams } from "@/lib/remocn/gsh/gradient-engine";
import { GshGround } from "@/lib/remocn/gsh/gsh-ground";
import type { GshPresetId } from "@/lib/remocn/gsh/presets";

const { fontFamily: sora } = loadFont("normal", {
  weights: ["300", "400"],
  subsets: ["latin"],
});
const { fontFamily: serifItalic } = loadSerif("italic", {
  weights: ["400"],
  subsets: ["latin"],
});

export interface PovSetupProps {
  /** The format label. */
  label?: string;
  /** The setup line; words slide in one by one. */
  setup?: string;
  /** Lead-in of the punchline, set in the serif italic. */
  lead?: string;
  /** The key word of the punchline. */
  punch?: string;
  /** Kept for the shared draft API; the colour comes from the ground. */
  accent?: string;
  /** Text color; overrides the theme ink. */
  ink?: string;
  /** Solid fill in place of the gradient ground; "transparent" drops it. */
  background?: string;
  /** Typeface for the label, setup and punch word. Load it yourself; Sora by default. */
  fontFamily?: string;
  /** Frames between setup words. */
  stagger?: number;
  /** Frame the punchline lands. */
  punchAt?: number;
  /** Size of the copy, around the frame's center. */
  scale?: number;
  /** Frames to hold the first frame before anything moves. */
  delay?: number;
  theme?: "dark" | "light";
  /** gradients.sh preset id for the ground. */
  ground?: GshPresetId;
  /** Overrides for the ground shader. */
  groundParams?: Partial<GradientParams>;
  speed?: number;
}

const BEATS = {
  pov: 0,
  shrink: 6,
  setup: 10,
  wordGap: 3,
  wordLen: 12,
  punch: 54,
  lift: 54,
  rise: 56,
} as const;

const ENTER = Easing.bezier(0.32, 0.72, 0, 1);
const LIGHT = Easing.bezier(0.22, 1, 0.36, 1);
const CAMERA = Easing.bezier(0.87, 0, 0.13, 1);
const HEAVY = { mass: 1, damping: 26, stiffness: 120 };
const CARD = { mass: 0.8, damping: 18, stiffness: 160 };
const CHIP = { mass: 0.5, damping: 12, stiffness: 200 };
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const THEMES = {
  dark: {
    stage: "#0A0807",
    ink: "#F4F1EC",
    preset: "hearth" as GshPresetId,
    params: undefined as Partial<GradientParams> | undefined,
    veilFrom: 0.9,
    veilTo: 0.18,
  },
  light: {
    stage: "#F2EEE8",
    ink: "#17120E",
    preset: "paper-crease" as GshPresetId,
    params: {
      colors: ["#FF8A3A", "#FFC79A", "#F6E2CF", "#5A2410"],
      background: "#F2EEE8",
    } as Partial<GradientParams>,
    veilFrom: 0.78,
    veilTo: 0.12,
  },
} as const;

function ramp(t: number, from: number, len: number) {
  return interpolate(t, [from, from + len], [0, 1], CLAMP);
}

function kick(d: number) {
  if (d < 0) return 0;
  if (d < 2) return d / 2;
  const k = Math.max(0, 1 - (d - 2) / 8);
  return k * k;
}

function shake(d: number, amp: number, seed: number) {
  if (d < 0 || d > 8) return { x: 0, y: 0 };
  const k = (1 - d / 8) ** 2;
  return {
    x: amp * k * Math.sin(d * 2.7 + seed),
    y: amp * 0.7 * k * Math.cos(d * 3.3 + seed * 1.7),
  };
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

export function PovSetup({
  label = "POV:",
  setup = "you shipped the launch video before standup",
  lead = "and it",
  punch = "slaps.",
  ink,
  background,
  fontFamily = sora,
  stagger = BEATS.wordGap,
  punchAt = BEATS.punch,
  scale = 1,
  delay = 0,
  theme = "dark",
  ground,
  groundParams,
  speed = 1,
}: PovSetupProps) {
  const glide = useGlide();
  const t = Math.max(0, useSceneFrame() - delay) * speed;
  const { width: W, height: H, fps } = useSceneConfig();
  const c = THEMES[theme];
  const fg = ink ?? c.ink;
  const stage =
    background === undefined
      ? c.stage
      : background === "transparent"
        ? "transparent"
        : background;
  const shift = punchAt - BEATS.punch;
  const beats = {
    ...BEATS,
    wordGap: stagger,
    punch: BEATS.punch + shift,
    lift: BEATS.lift + shift,
    rise: BEATS.rise + shift,
  };
  const tall = H > W;
  const base = tall ? W * 0.75 : H;
  const u = Math.min(W / 1280, H / 720);

  const words = setup.split(/\s+/).filter(Boolean);

  const pov = spring({ frame: t - beats.pov, fps, config: CHIP });
  const shrink = spring({ frame: t - beats.shrink, fps, config: HEAVY });
  const lift = spring({ frame: t - beats.lift, fps, config: HEAVY });
  const p = spring({ frame: t - beats.punch, fps, config: CARD });
  const punchOn = t >= beats.punch;

  const camera = (at: number) => {
    const bump = Math.max(
      0.5 * kick(at - beats.pov - 4),
      1.2 * kick(at - beats.punch - 4),
    );
    const creep = interpolate(at, [beats.setup, beats.punch + 70], [1, 1.035], {
      ...CLAMP,
      easing: CAMERA,
    });
    return {
      hit: shake(at - beats.punch - 4, 8 * u, 2.3),
      s: creep * (1 + 0.03 * bump),
    };
  };
  const { hit, s: camScale } = camera(t);
  // Kicks, a shake and a creep add up to no clean progress, so the camera
  // counts as moving whenever it steps against either neighbouring frame.
  const camStep = (a: number, b: number) => {
    const p = camera(a);
    const q = camera(b);
    return (
      Math.abs(p.s - q.s) * W +
      Math.abs(p.hit.x - q.hit.x) +
      Math.abs(p.hit.y - q.hit.y)
    );
  };
  const camMoving =
    camStep(t + speed, t) > 1e-3 || camStep(t, t - speed) > 1e-3;

  const povScale = 1.4 - 0.4 * pov;
  const povBlur = Math.max(0, 1 - pov) * 10;
  const punchScale = 1.5 - 0.5 * p;
  const punchBlur = Math.max(0, 1 - p) * 14;
  const punchTilt = -4 * (1 - p);
  const stepBack = LIGHT(ramp(t, beats.punch, 12));
  const setupOpacity = 1 - 0.55 * stepBack;

  const rise = LIGHT(ramp(t, beats.rise, 30));
  const veil = c.veilFrom + (c.veilTo - c.veilFrom) * rise;
  const groundShift = (1 - rise) * 0.14 * H;

  const labelFs = 0.075 * base;
  const setupFs = (tall ? 0.105 : 0.1) * base;
  const punchFs = 0.3 * base;
  const left = (tall ? 0.08 : 0.085) * W;
  const setupWidth = W - 2 * left;

  const POV_BIG = 3.2;
  const labelGap = 0.035 * base;
  const punchGap = 0.045 * base;
  const setupLines = Math.max(
    1,
    Math.ceil((setup.length * 0.54 * setupFs) / setupWidth),
  );
  const punchLines = tall ? 2 : 1;
  const labelH = labelFs + labelGap;
  const setupH = setupLines * setupFs * 1.12;
  const punchH = punchLines * punchFs * 1.02 + punchGap;
  const top0 = (H - labelFs * POV_BIG) / 2;
  const top1 = (H - labelH - setupH) / 2;
  const top2 = (H - labelH - setupH - punchH) / 2;
  // The block is laid out where it settles and travels there by transform:
  // layout rounds a baseline moved by `top` to whole pixels.
  const blockShift = (top0 - top1) * (1 - shrink) + (top1 - top2) * (1 - lift);
  const labelScale = POV_BIG - (POV_BIG - 1) * shrink;

  return (
    <AbsoluteFill style={{ background: stage, overflow: "hidden" }}>
      {background === undefined ? (
        <>
          <AbsoluteFill
            style={{
              top: -0.3 * H,
              height: 1.55 * H,
              transform: `translateY(${groundShift - 0.25 * H}px) scale(1.08)`,
            }}
          >
            <GshGround
              preset={ground ?? c.preset}
              params={groundParams ?? c.params}
              timeOffset={4}
              timeScale={0.45}
            />
          </AbsoluteFill>
          <AbsoluteFill
            style={{
              background: `linear-gradient(180deg, ${c.stage} 0%, ${c.stage} 38%, transparent 100%)`,
              opacity: veil,
            }}
          />
          <AbsoluteFill style={{ background: c.stage, opacity: veil * 0.55 }} />
        </>
      ) : null}

      <ScaleLayer scale={scale}>
        <div
          style={{
            position: "absolute",
            inset: 0,
            transform: `translate(${hit.x}px, ${hit.y}px) scale(${camScale})${glide(camMoving)}`,
            transformOrigin: "30% 50%",
          }}
        >
          <div
            style={{
              position: "absolute",
              left,
              right: left,
              top: top2,
              transform:
                Math.abs(blockShift) > 1e-3
                  ? `translateY(${blockShift}px)`
                  : undefined,
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
            }}
          >
            <div
              style={{
                fontFamily,
                fontWeight: 400,
                fontSize: labelFs,
                lineHeight: 1,
                letterSpacing: "-0.01em",
                color: fg,
                transform: `scale(${povScale * labelScale})${glide(!camMoving && Math.abs(povScale * labelScale - 1) > 1e-5)}`,
                transformOrigin: "0% 0%",
                height: labelFs,
                filter: povBlur > 0.2 ? `blur(${povBlur * u}px)` : undefined,
                opacity: ramp(t, beats.pov - 1, 2),
                marginBottom: labelGap,
              }}
            >
              {label}
            </div>

            <div
              style={{
                fontFamily,
                fontWeight: 300,
                fontSize: setupFs,
                lineHeight: 1.12,
                letterSpacing: "-0.035em",
                color: fg,
                maxWidth: setupWidth,
                opacity: setupOpacity,
              }}
            >
              {words.map((w, i) => {
                const at = beats.setup + i * beats.wordGap;
                const k = ENTER(ramp(t, at, beats.wordLen));
                return (
                  <span
                    key={i}
                    style={{
                      display: "inline-block",
                      overflow: "hidden",
                      verticalAlign: "top",
                      paddingBottom: "0.14em",
                      marginBottom: "-0.14em",
                      marginRight: i < words.length - 1 ? "0.24em" : 0,
                    }}
                  >
                    <span
                      style={{
                        display: "inline-block",
                        transform: `translateY(${(1 - k) * 105}%)`,
                        opacity: ramp(t, at, 4),
                      }}
                    >
                      {w}
                    </span>
                  </span>
                );
              })}
            </div>

            <div
              style={{
                height: punchLines * punchFs * 1.02,
                marginTop: punchGap,
                display: "flex",
                alignItems: "flex-end",
              }}
            >
              {punchOn ? (
                <div
                  style={{
                    display: "flex",
                    flexDirection: tall ? "column" : "row",
                    alignItems: tall ? "flex-start" : "baseline",
                    whiteSpace: "nowrap",
                    transform: `rotate(${punchTilt}deg) scale(${punchScale})`,
                    transformOrigin: "0% 70%",
                    filter:
                      punchBlur > 0.2 ? `blur(${punchBlur * u}px)` : undefined,
                    opacity: ramp(t, beats.punch, 2),
                    color: fg,
                  }}
                >
                  <span
                    style={{
                      fontFamily: serifItalic,
                      fontStyle: "italic",
                      fontWeight: 400,
                      fontSize: punchFs * 1.04,
                      lineHeight: 1,
                      letterSpacing: "-0.03em",
                      marginRight: "0.14em",
                    }}
                  >
                    {lead}
                  </span>
                  <span
                    style={{
                      fontFamily,
                      fontWeight: 400,
                      fontSize: punchFs,
                      lineHeight: 1,
                      letterSpacing: "-0.06em",
                      paddingRight: "0.04em",
                    }}
                  >
                    {punch}
                  </span>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </ScaleLayer>
    </AbsoluteFill>
  );
}
