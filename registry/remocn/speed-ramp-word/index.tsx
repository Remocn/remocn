"use client";

import { loadFont as loadSerif } from "@remotion/google-fonts/InstrumentSerif";
import { loadFont as loadMono } from "@remotion/google-fonts/JetBrainsMono";
import { loadFont as loadDisplay } from "@remotion/google-fonts/SchibstedGrotesk";
import { useId } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  interpolateColors,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const { fontFamily: display } = loadDisplay("normal", {
  weights: ["500"],
  subsets: ["latin"],
});
const { fontFamily: serif } = loadSerif("italic", {
  weights: ["400"],
  subsets: ["latin"],
});
const { fontFamily: mono } = loadMono("normal", {
  weights: ["400"],
  subsets: ["latin"],
});

/**
 * gradients.sh "swirl": cream, orange, rose, deep violet. The key word warms
 * into it as time slows; dark stage takes the light end, light stage the deep.
 */
const SWIRL = ["#ffe2c4", "#ff9a4d", "#d2456b", "#3a1f6b"] as const;
const swirlInk = (theme: "dark" | "light", t: number) => {
  const stops =
    theme === "dark"
      ? [SWIRL[0], SWIRL[1], SWIRL[2]]
      : [SWIRL[1], SWIRL[2], SWIRL[3]];
  return `linear-gradient(${96 + t * 10}deg, ${stops[0]} 4%, ${stops[1]} 48%, ${stops[2]} 96%)`;
};
/** Key word set in the serif italic is optically scaled to the grotesk. */
const KEY_SCALE = 1.1;

export interface SpeedRampWordProps {
  /** The phrase that rushes across. */
  text?: string;
  /** The word inside `text` that drops into slow motion. Defaults to the last word. */
  keyWord?: string;
  /** Show the small timecode and speed readout that slow down with the shot. */
  hud?: boolean;
  accent?: string;
  theme?: "dark" | "light";
  speed?: number;
}

// Beat sheet (30fps):
//  0–20    the phrase rushes in from the right at full speed, streaked
//  20–48   speed ramp: a smooth velocity curve down to ~0.5% speed; the key
//          word warms to the accent, trailing ghosts start to gather
//  48–100  the key word hangs, drifting a few pixels; ghosts collapse into it
//  100–110 time snaps back (accelerating curve)
//  110–end the phrase exits left at full speed
const RUSH_END = 20;
const RAMP_LEN = 28;
const HANG_LEN = 52;
const SNAP_LEN = 10;
const T_RAMP_END = RUSH_END + RAMP_LEN;
const T_HANG_END = T_RAMP_END + HANG_LEN;
const T_SNAP_END = T_HANG_END + SNAP_LEN;
const T_MID = (T_RAMP_END + T_HANG_END) / 2;
const R_MIN = 0.005;
const STEP = 0.25;

/** Frames the demo needs: motion through the exit plus a couple of frames. */
export const SPEED_RAMP_WORD_DURATION = 121;

const RAMP_DOWN = Easing.bezier(0.45, 0, 0.25, 1);
const SNAP_UP = Easing.bezier(0.55, 0, 0.85, 0.35);
const CAMERA = Easing.bezier(0.65, 0, 0.35, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const THEMES = {
  dark: {
    bg: "#0A0A0B",
    fg: "#F2F1EE",
    hud: "rgba(242,241,238,0.42)",
    grain: 0.06,
  },
  light: {
    bg: "#F5F4F0",
    fg: "#111113",
    hud: "rgba(17,17,19,0.45)",
    grain: 0.04,
  },
} as const;

/** Playback rate of the shot at real frame t: 1 = full speed. */
function rate(t: number) {
  if (t <= RUSH_END) return 1;
  if (t <= T_RAMP_END) {
    const p = RAMP_DOWN((t - RUSH_END) / RAMP_LEN);
    return 1 + (R_MIN - 1) * p;
  }
  if (t <= T_HANG_END) return R_MIN;
  if (t <= T_SNAP_END) {
    const p = SNAP_UP((t - T_HANG_END) / SNAP_LEN);
    return R_MIN + (1 - R_MIN) * p;
  }
  return 1;
}

/** Scene time elapsed by real frame t (integral of the rate). */
function sceneTime(t: number) {
  let acc = 0;
  for (let s = 0; s < t; s += STEP) {
    const h = Math.min(STEP, t - s);
    acc += rate(s + h / 2) * h;
  }
  return acc;
}

function splitPhrase(text: string, keyWord?: string) {
  let key = keyWord ?? "";
  let idx = key ? text.indexOf(key) : -1;
  if (idx < 0) {
    const words = text.trim().split(/\s+/);
    key = (words[words.length - 1] ?? "").replace(/[.,!?…]+$/, "");
    idx = text.lastIndexOf(key);
  }
  return {
    before: text.slice(0, idx),
    key,
    after: text.slice(idx + key.length),
  };
}

function timecode(sceneFrames: number) {
  const f = Math.floor(sceneFrames);
  const ff = f % 30;
  const ss = Math.floor(f / 30) % 60;
  const mm = Math.floor(f / 1800);
  const p = (n: number) => String(n).padStart(2, "0");
  return `00:${p(mm)}:${p(ss)}:${p(ff)}`;
}

function Grain({ opacity }: { opacity: number }) {
  const id = `srw-grain-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
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
          baseFrequency="0.85"
          numOctaves={2}
          seed={11}
          stitchTiles="stitch"
        />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#${id})`} />
    </svg>
  );
}

export function SpeedRampWord({
  text = "Everything changes in an instant.",
  keyWord = "instant",
  hud = true,
  accent = "#3B5BFD",
  theme = "dark",
  speed = 1,
}: SpeedRampWordProps) {
  const frame = useCurrentFrame() * speed;
  const { width: W, height: H } = useVideoConfig();
  const u = H / 720;
  const c = THEMES[theme];
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const blurId = `srw-blur-${uid}`;
  const ghostBlurId = `srw-ghost-${uid}`;

  const { before, key, after } = splitPhrase(text, keyWord);
  const fs = Math.min(176 * u, W * 0.137);
  // Rough advances (Schibsted Grotesk 500 at -0.03em, Instrument Serif
  // italic); only used to plan the travel, the layout itself is real text.
  const beforeW = before.length * 0.45 * fs;
  const keyW = key.length * 0.38 * fs * KEY_SCALE;

  // The phrase starts already in frame (no empty first frame) and the key
  // word's center lands on the frame center at the middle of the hang.
  const rest = W * 0.56;
  const startAnchor = W * 0.4 + beforeW + keyW / 2;
  const v0 = (startAnchor - rest) / sceneTime(T_MID);
  const anchorAt = (t: number) => startAnchor - v0 * sceneTime(t);

  const tau = sceneTime(frame);
  const anchor = startAnchor - v0 * tau;
  const velocity = v0 * rate(frame);

  // Ghosts are lagging followers of the key word: far behind while it slows,
  // folding into it once it hangs.
  const alphas = [0.1, 0.066, 0.045];
  const ghosts = alphas.map(() => anchorAt(0));
  const stop = Math.floor(frame);
  for (let t = 1; t <= stop; t++) {
    const a = anchorAt(t);
    for (let k = 0; k < alphas.length; k++) {
      ghosts[k] += (a - ghosts[k]) * alphas[k];
    }
  }
  const frac = frame - stop;
  const ghostX = ghosts.map((g, k) => {
    const next = g + (anchorAt(stop + 1) - g) * alphas[k];
    return g + (next - g) * frac;
  });
  const ghostEnv = interpolate(
    frame,
    [RUSH_END + 8, T_RAMP_END - 4, T_HANG_END - 6, T_HANG_END + 2],
    [0, 1, 1, 0],
    CLAMP,
  );

  // Look of the slow-motion moment.
  const slow = interpolate(
    frame,
    [RUSH_END + 6, T_RAMP_END, T_HANG_END, T_HANG_END + 6],
    [0, 1, 1, 0],
    { ...CLAMP, easing: CAMERA },
  );
  const accentMix = interpolate(
    frame,
    [RUSH_END + 10, T_RAMP_END + 2],
    [0, 1],
    { ...CLAMP, easing: Easing.bezier(0.22, 1, 0.36, 1) },
  );
  const push = interpolate(frame, [RUSH_END, T_HANG_END], [1, 1.045], {
    ...CLAMP,
    easing: CAMERA,
  });
  const drift = interpolate(frame, [T_RAMP_END - 6, T_HANG_END], [0, -5 * u], {
    ...CLAMP,
    easing: CAMERA,
  });
  const blur = Math.min(velocity * 0.3, 30 * u);
  const restDim = 1 - 0.62 * slow;
  const restDefocus = 1.6 * u * slow;

  const textStyle = {
    fontFamily: display,
    fontWeight: 500,
    fontSize: fs,
    letterSpacing: "-0.035em",
    lineHeight: 1,
    whiteSpace: "pre",
  } as const;
  const keyStyle = {
    fontFamily: serif,
    fontStyle: "italic",
    fontWeight: 400,
    fontSize: fs * KEY_SCALE,
    letterSpacing: "-0.01em",
    lineHeight: 1,
    whiteSpace: "pre",
  } as const;
  const ink = swirlInk(theme, slow);
  const ghostColor = theme === "dark" ? SWIRL[1] : SWIRL[2];

  const sharp = blur < 0.3;

  return (
    <AbsoluteFill style={{ background: c.bg, overflow: "hidden" }}>
      <svg width={0} height={0} style={{ position: "absolute" }} aria-hidden>
        <filter
          id={blurId}
          x="-30%"
          y="-10%"
          width="160%"
          height="120%"
          colorInterpolationFilters="sRGB"
        >
          <feGaussianBlur stdDeviation={`${blur} 0`} />
        </filter>
        <filter
          id={ghostBlurId}
          x="-30%"
          y="-10%"
          width="160%"
          height="120%"
          colorInterpolationFilters="sRGB"
        >
          <feGaussianBlur stdDeviation={`${4 * u} 0`} />
        </filter>
      </svg>

      <AbsoluteFill
        style={{ transform: `scale(${push})`, transformOrigin: "50% 50%" }}
      >
        {/* ghosts sit under the phrase */}
        {ghostX.map((gx, k) => {
          const gap = Math.abs(gx - anchor);
          const merge = interpolate(gap, [2 * u, 26 * u], [0, 1], CLAMP);
          const o = [0.3, 0.2, 0.12][k] * ghostEnv * merge;
          if (o < 0.004) return null;
          return (
            <div
              key={k}
              style={{
                position: "absolute",
                left: gx,
                top: H / 2 + drift,
                transform: "translate(-50%, -52%)",
                opacity: o,
                color: ghostColor,
                filter: `url(#${ghostBlurId})`,
                ...keyStyle,
              }}
            >
              {key}
            </div>
          );
        })}

        <AbsoluteFill style={{ filter: sharp ? undefined : `url(#${blurId})` }}>
          <div style={{ position: "absolute", left: anchor, top: H / 2 }}>
            <div
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                transform: `translate(-50%, -52%) translateY(${drift}px)`,
                ...textStyle,
              }}
            >
              <span style={{ position: "relative", display: "inline-block" }}>
                <span
                  style={{
                    position: "absolute",
                    right: "100%",
                    top: 0,
                    color: c.fg,
                    opacity: restDim,
                    filter:
                      restDefocus > 0.05 ? `blur(${restDefocus}px)` : undefined,
                  }}
                >
                  {before}
                </span>
                <span
                  style={{
                    position: "relative",
                    display: "inline-block",
                    padding: `0 ${0.06 * fs}px`,
                    ...keyStyle,
                  }}
                >
                  <span style={{ color: c.fg, opacity: 1 - accentMix }}>
                    {key}
                  </span>
                  <span
                    style={{
                      position: "absolute",
                      inset: 0,
                      padding: `0 ${0.06 * fs}px`,
                      backgroundImage: ink,
                      WebkitBackgroundClip: "text",
                      backgroundClip: "text",
                      color: "transparent",
                      opacity: accentMix,
                    }}
                  >
                    {key}
                  </span>
                </span>
                <span
                  style={{
                    position: "absolute",
                    left: "100%",
                    top: 0,
                    color: c.fg,
                    opacity: restDim,
                    filter:
                      restDefocus > 0.05 ? `blur(${restDefocus}px)` : undefined,
                  }}
                >
                  {after}
                </span>
              </span>
            </div>
          </div>
        </AbsoluteFill>
      </AbsoluteFill>

      {hud && (
        <div
          style={{
            position: "absolute",
            left: 48 * u,
            right: 48 * u,
            bottom: 40 * u,
            display: "flex",
            justifyContent: "space-between",
            fontFamily: mono,
            fontWeight: 400,
            fontSize: 14 * u,
            letterSpacing: "0.02em",
            fontVariantNumeric: "tabular-nums",
            color: c.hud,
          }}
        >
          <span>{timecode(tau)}</span>
          <span
            style={{ color: interpolateColors(slow, [0, 1], [c.hud, accent]) }}
          >
            {`${(rate(frame) * 100).toFixed(rate(frame) < 0.1 ? 1 : 0)}%`}
          </span>
        </div>
      )}

      <Grain opacity={c.grain} />
    </AbsoluteFill>
  );
}
