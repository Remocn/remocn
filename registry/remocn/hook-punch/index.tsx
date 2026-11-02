"use client";

import { loadFont } from "@remotion/google-fonts/BricolageGrotesque";
import { loadFont as loadSerif } from "@remotion/google-fonts/InstrumentSerif";
import type React from "react";
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

const { fontFamily: grotesk } = loadFont("normal", {
  weights: ["300", "400"],
  subsets: ["latin"],
});
const { fontFamily: serifItalic } = loadSerif("italic", {
  weights: ["400"],
  subsets: ["latin"],
});

export interface HookPunchProps {
  /** First beat, set in the grotesk. */
  stop?: string;
  /** Second word of the first beat, set in the serif italic. */
  scroll?: string;
  /** Lead-in of the second beat. */
  lead?: string;
  /** The payoff, slammed huge. */
  payoff?: string;
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
  stop: 0,
  scroll: 6,
  whip: 30,
  whipLen: 8,
  lead: 33,
  pay: 42,
  rise: 43,
} as const;

const EXIT = Easing.bezier(0.55, 0, 1, 0.45);
const LIGHT = Easing.bezier(0.22, 1, 0.36, 1);
const CAMERA = Easing.bezier(0.87, 0, 0.13, 1);
const HEAVY = { mass: 1, damping: 26, stiffness: 120 };
const CARD = { mass: 0.8, damping: 18, stiffness: 160 };
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const THEMES = {
  dark: {
    stage: "#03040A",
    ink: "#F2F3F8",
    preset: "cobalt-rise" as GshPresetId,
    params: undefined as Partial<GradientParams> | undefined,
    veilFrom: 0.86,
    veilTo: 0.34,
  },
  light: {
    stage: "#EEF0F6",
    ink: "#0E1230",
    preset: "paper-crease" as GshPresetId,
    params: undefined as Partial<GradientParams> | undefined,
    veilFrom: 0.8,
    veilTo: 0.22,
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
  if (d < 0 || d > 7) return { x: 0, y: 0 };
  const k = (1 - d / 7) ** 2;
  return {
    x: amp * k * Math.sin(d * 2.7 + seed),
    y: amp * 0.7 * k * Math.cos(d * 3.3 + seed * 1.7),
  };
}

export function HookPunch({
  stop = "Stop",
  scroll = "scrolling.",
  lead = "This video took",
  payoff = "1 day.",
  theme = "dark",
  ground,
  groundParams,
  speed = 1,
}: HookPunchProps) {
  const t = useCurrentFrame() * speed;
  const { width: W, height: H, fps } = useVideoConfig();
  const c = THEMES[theme];
  const tall = H > W;
  const base = tall ? W * 0.56 : H;
  const u = Math.min(W / 1280, H / 720);

  const slam = (at: number, from: number) => {
    const p = spring({ frame: t - at, fps, config: CARD });
    return {
      scale: from + (1 - from) * p,
      blur: Math.max(0, 1 - p) ** 2 * 18,
      opacity: ramp(t, at - 1, 2),
    };
  };

  const bump = Math.max(
    kick(t - BEATS.stop - 4),
    kick(t - BEATS.scroll - 4),
    1.3 * kick(t - BEATS.pay - 4),
  );
  const s1 = shake(t - BEATS.stop - 4, 6 * u, 0.4);
  const s2 = shake(t - BEATS.scroll - 4, 5 * u, 2.1);
  const s3 = shake(t - BEATS.pay - 4, 8 * u, 4.2);
  const camScale = 1 + 0.03 * bump;

  const pStop = slam(BEATS.stop, 1.5);
  const pScroll = slam(BEATS.scroll, 1.5);
  const shove = 1 - spring({ frame: t - BEATS.scroll, fps, config: HEAVY });
  const creep1 = interpolate(t, [BEATS.scroll + 6, BEATS.whip], [1, 1.04], {
    ...CLAMP,
    easing: CAMERA,
  });
  const whip = EXIT(ramp(t, BEATS.whip, BEATS.whipLen));
  const line1Scale = creep1 * (1 + 1.6 * whip);
  const line1Blur = 22 * whip;
  const line1Opacity = 1 - ramp(t, BEATS.whip + 3, BEATS.whipLen - 3);

  const lead2 = spring({ frame: t - BEATS.lead, fps, config: HEAVY });
  const leadScale = 0.6 + 0.4 * lead2;
  const leadBlur = Math.max(0, 1 - lead2) * 16;
  const leadOpacity = ramp(t, BEATS.lead, 3);
  const pPay = slam(BEATS.pay, 1.6);
  const creep2 = interpolate(t, [BEATS.pay + 6, BEATS.pay + 62], [1, 1.035], {
    ...CLAMP,
    easing: CAMERA,
  });

  const rise = LIGHT(ramp(t, BEATS.rise, 26));
  const veil = c.veilFrom + (c.veilTo - c.veilFrom) * rise;
  const groundShift = (0.06 + (1 - rise) * 0.14) * H;

  const bigFs = 0.43 * base;
  const leadFs = 0.11 * base;
  const payFs = 0.56 * base;

  const word = (
    text: string,
    family: string,
    fs: number,
    p: { scale: number; blur: number; opacity: number },
    extra: React.CSSProperties = {},
  ) => (
    <div
      style={{
        fontFamily: family,
        fontSize: fs,
        lineHeight: 0.86,
        whiteSpace: "nowrap",
        transform: `scale(${p.scale})`,
        filter: p.blur > 0.2 ? `blur(${p.blur * u}px)` : undefined,
        opacity: p.opacity,
        ...extra,
      }}
    >
      {text}
    </div>
  );

  return (
    <AbsoluteFill style={{ background: c.stage, overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          top: -0.3 * H,
          height: 1.55 * H,
          transform: `translateY(${groundShift - 0.25 * H}px) scale(1.06)`,
        }}
      >
        <GshGround
          preset={ground ?? c.preset}
          params={groundParams ?? c.params}
          timeOffset={3}
          timeScale={0.5}
        />
      </AbsoluteFill>
      <AbsoluteFill style={{ background: c.stage, opacity: veil }} />

      <div
        style={{
          position: "absolute",
          inset: 0,
          transform: `translate(${s1.x + s2.x + s3.x}px, ${s1.y + s2.y + s3.y}px) scale(${camScale})`,
          transformOrigin: "50% 50%",
          color: c.ink,
        }}
      >
        {t < BEATS.whip + BEATS.whipLen ? (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 0.01 * base,
              transform: `scale(${line1Scale})`,
              filter: line1Blur > 0.2 ? `blur(${line1Blur * u}px)` : undefined,
              opacity: line1Opacity,
            }}
          >
            <div
              style={{
                transform: `translateY(${shove * 0.5 * (bigFs * 1.06 * 0.86 + 0.01 * base)}px)`,
              }}
            >
              {word(stop, grotesk, bigFs, pStop, {
                fontWeight: 400,
                letterSpacing: "-0.05em",
                paddingRight: 0.02 * W,
              })}
            </div>
            {word(scroll, serifItalic, bigFs * 1.06, pScroll, {
              fontStyle: "italic",
              fontWeight: 400,
              letterSpacing: "-0.03em",
              paddingLeft: (tall ? 0.03 : 0.06) * W,
            })}
          </div>
        ) : null}

        {t >= BEATS.lead ? (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              transform: `scale(${creep2})`,
            }}
          >
            <div
              style={{
                fontFamily: grotesk,
                fontWeight: 300,
                fontSize: leadFs,
                lineHeight: 1,
                letterSpacing: "-0.03em",
                whiteSpace: "nowrap",
                transform: `scale(${leadScale})`,
                filter: leadBlur > 0.2 ? `blur(${leadBlur * u}px)` : undefined,
                opacity: leadOpacity,
                marginBottom: 0.02 * base,
              }}
            >
              {lead}
            </div>
            <div style={{ height: payFs * 0.92 }}>
              {t >= BEATS.pay - 1
                ? word(payoff, grotesk, payFs, pPay, {
                    fontWeight: 400,
                    lineHeight: 1,
                    letterSpacing: "-0.055em",
                    paddingRight: 0.03 * payFs,
                  })
                : null}
            </div>
          </div>
        ) : null}
      </div>
    </AbsoluteFill>
  );
}
