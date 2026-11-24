"use client";

import { loadFont } from "@remotion/google-fonts/SpaceGrotesk";
import type React from "react";
import { AbsoluteFill, Easing, interpolate, spring } from "remotion";
import { useSceneConfig, useSceneFrame } from "@/lib/remocn/frame-rate";
import { useGlide } from "@/lib/remocn/glide";
import type { GradientParams } from "@/lib/remocn/gsh/gradient-engine";
import { GshGround } from "@/lib/remocn/gsh/gsh-ground";
import type { GshPresetId } from "@/lib/remocn/gsh/presets";
import { type Timing, useTimeline } from "@/lib/remocn/timeline";
import { type ToggleOnElementId, toggleOnTimeline } from "./timeline";

const { fontFamily: sans } = loadFont("normal", {
  weights: ["300", "400"],
  subsets: ["latin"],
});

export interface ToggleOnProps {
  label?: string;
  state?: string;
  accent?: string;
  /** Weight of the label and state. */
  fontWeight?: number;
  /** Frames between the label and the state word. */
  stagger?: number;
  /** Text color of the label; overrides the theme. */
  ink?: string;
  /** Solid fill in place of the gradient ground; "transparent" drops it. */
  background?: string;
  /** Typeface for the label. Load it yourself; Space Grotesk by default. */
  fontFamily?: string;
  /** Size of the foreground around the frame's center. */
  scale?: number;
  /** Frames to hold the first frame before anything moves. */
  delay?: number;
  theme?: "dark" | "light";
  ground?: GshPresetId;
  groundParams?: Partial<GradientParams>;
  speed?: number;
  /**
   * Moves, trims or stretches the camera, the press, the flip, the glow,
   * the label and the state word, by the ids in `./timeline`. Frames on the
   * scene timeline, after `delay` and `speed`.
   */
  timing?: Timing<ToggleOnElementId>;
}

const ENTER = Easing.bezier(0.32, 0.72, 0, 1);
const MOVE = Easing.bezier(0.65, 0, 0.35, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const THEMES = {
  dark: {
    fg: "#F3F2EF",
    stateInk: "#9DC2FF",
    scrim: "4,6,12",
    scrimFrom: 0.86,
    scrimTo: 0.34,
    track: "#121317",
    trackTop: "rgba(0,0,0,0.7)",
    trackLip: "rgba(255,255,255,0.12)",
    bezel: "#191A1F",
    rim: "rgba(255,255,255,0.09)",
    knob: ["#FFFFFF", "#F1F0ED", "#D4D3CE"],
    shadow: "0,0,0",
    shadowA: 0.75,
  },
  light: {
    fg: "#141413",
    stateInk: "",
    scrim: "244,243,239",
    scrimFrom: 0.88,
    scrimTo: 0.32,
    track: "#E0DED7",
    trackTop: "rgba(70,58,38,0.28)",
    trackLip: "rgba(255,255,255,0.95)",
    bezel: "#ECEAE4",
    rim: "rgba(255,255,255,0.9)",
    knob: ["#FFFFFF", "#FAF9F6", "#DAD8D1"],
    shadow: "48,40,28",
    shadowA: 0.34,
  },
} as const;

function hexToRgb(hex: string) {
  const h = hex.replace("#", "");
  const n = Number.parseInt(
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h,
    16,
  );
  return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`;
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

export function ToggleOn(props: ToggleOnProps) {
  const {
    label = "Auto-captions",
    state = "On",
    accent = "#3B5BFD",
    fontWeight = 400,
    ink: inkColor,
    background,
    fontFamily = sans,
    scale = 1,
    delay = 0,
    theme = "dark",
    ground,
    groundParams,
    speed = 1,
    timing,
  } = props;
  const glide = useGlide();
  const t = Math.max(0, useSceneFrame() - delay) * speed;
  const { width: VW, height: VH, fps, durationInFrames } = useSceneConfig();
  const tl = useTimeline(
    toggleOnTimeline,
    props,
    durationInFrames * speed,
    timing,
  );
  const camEl = tl.get("camera");
  const pressEl = tl.get("press");
  const flip = tl.get("flip");
  const light = tl.get("light");
  const tall = VH > VW;
  const u = tall ? VW / 760 : Math.min(VW / 1280, VH / 720);
  const p = THEMES[theme];
  const fg = inkColor ?? p.fg;
  const dark = theme === "dark";
  const acc = hexToRgb(accent);
  const stateInk = p.stateInk || accent;
  const resolvedGround: GshPresetId | undefined =
    ground ?? (groundParams ? undefined : dark ? "earthshine" : "paper-crease");

  const W = 330 * u;
  const H = 192 * u;
  const pad = 13 * u;
  const d = H - pad * 2;
  const travel = W - pad * 2 - d;

  const press = interpolate(t, [pressEl.start, pressEl.end], [0, 1], {
    ...CLAMP,
    easing: ENTER,
  });
  const pos = spring({
    frame: t - flip.start,
    fps,
    config: { mass: 0.8, damping: 18, stiffness: 160 },
  });
  const relax = spring({
    frame: t - flip.start - flip.beat("relax"),
    fps,
    config: { mass: 0.5, damping: 12, stiffness: 200 },
  });
  const stretch = d * 0.2 * press * (1 - Math.min(1, relax));
  const posC = Math.min(1, pos);
  const over = Math.max(0, pos - 1);
  const knobLeft = pad + posC * (travel - stretch) + over * travel;
  const knobRight = Math.min(
    W - pad,
    pad + posC * travel + d + stretch * (1 - posC),
  );
  const knobW = knobRight - knobLeft;

  const fillEnd = knobLeft + knobW * (0.5 + 0.5 * posC) + pad * 1.2 * posC;
  const fillOn = interpolate(pos, [0, 0.05], [0, 1], CLAMP);
  const fillStart = pad * 0.6 * (1 - Math.min(1, pos * 3));

  const camAt = (f: number) =>
    interpolate(
      spring({
        frame: f - camEl.start,
        fps,
        config: { mass: 1, damping: 26, stiffness: 120 },
        durationInFrames: camEl.length,
      }),
      [0, 1],
      [1.1, 1],
    );
  const camK = camAt(t);
  const camMoving =
    Math.abs(camAt(t + speed) - camK) > 1e-6 ||
    Math.abs(camK - camAt(t - speed)) > 1e-6;
  const lit = interpolate(t, [light.start, light.end], [0, 1], {
    ...CLAMP,
    easing: ENTER,
  });
  const scrim = interpolate(lit, [0, 1], [p.scrimFrom, p.scrimTo]);
  const open = interpolate(
    t,
    [flip.start + flip.beat("openAt"), flip.start + flip.beat("openEnd")],
    [0, 1],
    {
      ...CLAMP,
      easing: MOVE,
    },
  );

  const sliding = open > 0 && open < 1;

  const word = (id: "label" | "state") => {
    const e = tl.get(id);
    return interpolate(t, [e.start, e.end], [0, 1], {
      ...CLAMP,
      easing: ENTER,
    });
  };
  const wLabel = word("label");
  const wState = word("state");
  const fontSize = (tall ? 92 : 76) * u;

  const ink = (v: number) => ({
    display: "inline-block",
    opacity: v,
    transform: `translateY(${(1 - v) * 0.22}em)`,
    filter: v < 1 ? `blur(${(1 - v) * 6 * u}px)` : undefined,
  });

  const knobShadow = [
    `0 0 0 ${0.6 * u}px rgba(${p.shadow},${p.shadowA * 0.35})`,
    `0 ${2 * u}px ${3 * u}px rgba(${p.shadow},${p.shadowA * 0.5})`,
    `0 ${10 * u}px ${20 * u}px rgba(${p.shadow},${p.shadowA * 0.45})`,
    `inset 0 ${-3 * u}px ${2 * u}px rgba(0,0,0,0.07)`,
    `inset 0 ${1.5 * u}px 0 rgba(255,255,255,1)`,
  ].join(", ");

  const toggle = (
    <div
      style={{
        position: "relative",
        width: W + 14 * u,
        height: H + 14 * u,
        borderRadius: (H + 14 * u) / 2,
        background: p.bezel,
        boxShadow: [
          `inset 0 ${-1 * u}px 0 ${p.rim}`,
          `inset 0 ${1 * u}px ${1.5 * u}px rgba(${p.shadow},${p.shadowA * 0.25})`,
          `0 ${24 * u}px ${48 * u}px -${12 * u}px rgba(${p.shadow},${p.shadowA * 0.55})`,
          `0 0 ${60 * u}px ${-10 * u}px rgba(${acc},${0.45 * fillOn * lit})`,
        ].join(", "),
        flexShrink: 0,
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 7 * u,
          top: 7 * u,
          width: W,
          height: H,
          borderRadius: H / 2,
          overflow: "hidden",
          background: p.track,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: fillStart,
            top: 0,
            width: fillEnd - fillStart,
            height: H,
            borderRadius: H / 2,
            opacity: fillOn,
            background: `linear-gradient(180deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0) 46%, rgba(0,0,0,0.14) 100%), ${accent}`,
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: H / 2,
            boxShadow: `inset 0 ${5 * u}px ${9 * u}px ${p.trackTop}, inset 0 ${1.5 * u}px ${2 * u}px ${p.trackTop}, inset 0 ${-1.2 * u}px 0 ${p.trackLip}`,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: knobLeft,
            top: pad,
            width: knobW,
            height: d,
            borderRadius: d / 2,
            background: `radial-gradient(ellipse 58% 34% at 50% 16%, rgba(255,255,255,0.95), transparent 80%), linear-gradient(180deg, ${p.knob[0]} 0%, ${p.knob[1]} 48%, ${p.knob[2]} 100%)`,
            boxShadow: knobShadow,
          }}
        />
      </div>
    </div>
  );

  const labelEl = (
    <div
      style={{
        whiteSpace: "nowrap",
        fontFamily,
        fontWeight,
        fontSize,
        lineHeight: 1.08,
        letterSpacing: "-0.035em",
        color: fg,
        textAlign: tall ? "center" : "left",
      }}
    >
      <span style={ink(wLabel)}>{label}</span>
      {state ? (
        <>
          {tall ? <br /> : " "}
          <span style={{ ...ink(wState), color: stateInk }}>{state}</span>
        </>
      ) : null}
    </div>
  );

  return (
    <AbsoluteFill
      style={{
        overflow: "hidden",
        background: background ?? (dark ? "#03050b" : "#eeece8"),
      }}
    >
      {background === undefined ? (
        <>
          <GshGround
            preset={resolvedGround}
            params={groundParams}
            timeOffset={dark ? 3 : 6}
            timeScale={0.5}
          />
          <AbsoluteFill
            style={{
              background: `radial-gradient(70% 60% at 50% 45%, rgba(${p.scrim},${scrim}) 0%, rgba(${p.scrim},${Math.min(1, scrim + 0.12)}) 100%)`,
            }}
          />
        </>
      ) : null}
      <ScaleLayer scale={scale}>
        <AbsoluteFill
          style={{
            alignItems: "center",
            justifyContent: "center",
            transform: `scale(${camK})${glide(camMoving)}`,
          }}
        >
          {tall ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 72 * u,
                transform: `translateY(${(1 - open) * 90 * u}px)${glide(midway(open) && !camMoving)}`,
              }}
            >
              {toggle}
              {labelEl}
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                // The row widens as the label column opens and the centring
                // slides the toggle left. Layout rounds those box edges to
                // whole pixels, so mid-way the row sits at its open width and
                // the slide is a transform: half the unopened column, which
                // is half the row less half the toggle.
                transform: sliding
                  ? `translateX(calc(${(1 - open) * 50}% - ${((1 - open) * (W + 14 * u)) / 2}px))`
                  : undefined,
              }}
            >
              {toggle}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: `${sliding ? 1 : open}fr`,
                }}
              >
                <div style={{ minWidth: 0, paddingLeft: 56 * u }}>
                  {labelEl}
                </div>
              </div>
            </div>
          )}
        </AbsoluteFill>
      </ScaleLayer>
    </AbsoluteFill>
  );
}
