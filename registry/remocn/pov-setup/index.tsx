"use client";

import { loadFont as loadSerif } from "@remotion/google-fonts/InstrumentSerif";
import { loadFont } from "@remotion/google-fonts/Sora";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
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

export function PovSetup({
  label = "POV:",
  setup = "you shipped the launch video before standup",
  lead = "and it",
  punch = "slaps.",
  theme = "dark",
  ground,
  groundParams,
  speed = 1,
}: PovSetupProps) {
  const t = useCurrentFrame() * speed;
  const { width: W, height: H, fps } = useVideoConfig();
  const c = THEMES[theme];
  const tall = H > W;
  const base = tall ? W * 0.75 : H;
  const u = Math.min(W / 1280, H / 720);

  const words = setup.split(/\s+/).filter(Boolean);

  const pov = spring({ frame: t - BEATS.pov, fps, config: CHIP });
  const shrink = spring({ frame: t - BEATS.shrink, fps, config: HEAVY });
  const lift = spring({ frame: t - BEATS.lift, fps, config: HEAVY });
  const p = spring({ frame: t - BEATS.punch, fps, config: CARD });
  const punchOn = t >= BEATS.punch;

  const bump = Math.max(
    0.5 * kick(t - BEATS.pov - 4),
    1.2 * kick(t - BEATS.punch - 4),
  );
  const hit = shake(t - BEATS.punch - 4, 8 * u, 2.3);
  const creep = interpolate(t, [BEATS.setup, BEATS.punch + 70], [1, 1.035], {
    ...CLAMP,
    easing: CAMERA,
  });
  const camScale = creep * (1 + 0.03 * bump);

  const povScale = 1.4 - 0.4 * pov;
  const povBlur = Math.max(0, 1 - pov) * 10;
  const punchScale = 1.5 - 0.5 * p;
  const punchBlur = Math.max(0, 1 - p) * 14;
  const punchTilt = -4 * (1 - p);
  const stepBack = LIGHT(ramp(t, BEATS.punch, 12));
  const setupOpacity = 1 - 0.55 * stepBack;

  const rise = LIGHT(ramp(t, BEATS.rise, 30));
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
  const blockTop = top0 + (top1 - top0) * shrink + (top2 - top1) * lift;
  const labelScale = POV_BIG - (POV_BIG - 1) * shrink;

  return (
    <AbsoluteFill style={{ background: c.stage, overflow: "hidden" }}>
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

      <div
        style={{
          position: "absolute",
          inset: 0,
          transform: `translate(${hit.x}px, ${hit.y}px) scale(${camScale})`,
          transformOrigin: "30% 50%",
        }}
      >
        <div
          style={{
            position: "absolute",
            left,
            right: left,
            top: blockTop,
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
          }}
        >
          <div
            style={{
              fontFamily: sora,
              fontWeight: 400,
              fontSize: labelFs,
              lineHeight: 1,
              letterSpacing: "-0.01em",
              color: c.ink,
              transform: `scale(${povScale * labelScale})`,
              transformOrigin: "0% 0%",
              height: labelFs,
              filter: povBlur > 0.2 ? `blur(${povBlur * u}px)` : undefined,
              opacity: ramp(t, BEATS.pov - 1, 2),
              marginBottom: labelGap,
            }}
          >
            {label}
          </div>

          <div
            style={{
              fontFamily: sora,
              fontWeight: 300,
              fontSize: setupFs,
              lineHeight: 1.12,
              letterSpacing: "-0.035em",
              color: c.ink,
              maxWidth: setupWidth,
              opacity: setupOpacity,
            }}
          >
            {words.map((w, i) => {
              const at = BEATS.setup + i * BEATS.wordGap;
              const k = ENTER(ramp(t, at, BEATS.wordLen));
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
                  opacity: ramp(t, BEATS.punch, 2),
                  color: c.ink,
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
                    fontFamily: sora,
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
    </AbsoluteFill>
  );
}
