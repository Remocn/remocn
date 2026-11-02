"use client";

import { loadFont as loadGeist } from "@remotion/google-fonts/Geist";
import { loadFont as loadMono } from "@remotion/google-fonts/GeistMono";
import { loadFont as loadManrope } from "@remotion/google-fonts/Manrope";
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { GradientParams } from "@/lib/remocn/gsh/gradient-engine";
import { GshGround } from "@/lib/remocn/gsh/gsh-ground";
import type { GshPresetId } from "@/lib/remocn/gsh/presets";

const geist = loadGeist("normal", {
  weights: ["300", "400"],
  subsets: ["latin"],
});
const mono = loadMono("normal", { weights: ["400"], subsets: ["latin"] });
const manrope = loadManrope("normal", {
  weights: ["600"],
  subsets: ["latin"],
});

const ENTER = Easing.bezier(0.32, 0.72, 0, 1);
const RISE = Easing.bezier(0.22, 1, 0.36, 1);
const EXIT = Easing.bezier(0.55, 0, 1, 0.45);
const MOVE = Easing.bezier(0.65, 0, 0.35, 1);
const CAM = Easing.bezier(0.87, 0, 0.13, 1);
const HEAVY = { mass: 1, damping: 26, stiffness: 120 };
const CARD = { mass: 0.8, damping: 18, stiffness: 160 };
const CHIP = { mass: 0.5, damping: 12, stiffness: 200 };

const REMOCN_R_PATH =
  "M 0.01 0.81 C 0.01 1.73, 0.36 2.79, 1.09 4.13 C 4.91 11.04, 13.45 17.16, 21.7 18.9 C 22.94 19.16, 23.18 19.16, 51.39 19.27 C 76.07 19.36, 80.02 19.4, 81.32 19.57 C 89.89 20.69, 96.2 24.68, 99.38 31.01 C 103.19 38.56, 102.53 50.1, 97.91 57.07 C 94.66 61.96, 89.68 64.99, 83.26 66 C 82.81 66.07, 70.18 66.83, 55.2 67.69 C 24.82 69.43, 27.03 69.23, 24.18 70.4 C 19.9 72.15, 14.84 75.7, 10.65 79.89 C 4.86 85.68, 1.3 91.91, 0.25 98.13 C 0.12 98.85, 0.08 103.13, 0.04 116.66 L 0 134.26 9.5 134.26 L 19 134.26 19.05 119.41 C 19.1 103.27, 19.08 103.82, 19.82 101.04 C 21.79 93.65, 27.86 88.75, 36.45 87.63 C 37.23 87.53, 39.41 87.5, 43.57 87.53 C 50.12 87.59, 50.75 87.65, 53.22 88.45 C 56.61 89.56, 59.67 91.86, 62.02 95.07 C 62.52 95.76, 69.35 103.85, 77.2 113.07 C 85.04 122.28, 91.63 130.04, 91.85 130.32 C 92.07 130.59, 92.5 131.34, 92.82 131.97 C 93.52 133.35, 94.11 133.93, 95.06 134.13 C 95.5 134.23, 98.97 134.26, 106.36 134.23 L 117.01 134.19 100.82 113.07 C 91.91 101.45, 84.52 91.78, 84.39 91.57 C 83.36 89.89, 83.66 87.53, 85.09 86 C 85.79 85.25, 86.36 84.94, 88.07 84.38 C 96.18 81.72, 104.15 76.62, 109.97 70.36 C 120.59 58.93, 124.06 44.32, 119.44 30.43 C 114.59 15.81, 101.93 4.02, 87.64 0.83 C 83.93 0.01, 88.09 0.08, 41.85 0.04 L 0.01 0 0.01 0.81 Z";

function RemocnR({ height, color }: { height: number; color: string }) {
  return (
    <svg
      viewBox="0 0 124.06 134.26"
      height={height}
      width={(height * 124.06) / 134.26}
      style={{ display: "block" }}
      aria-hidden
    >
      <path fill={color} d={REMOCN_R_PATH} />
    </svg>
  );
}

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

const B = {
  card: -10,
  type: 0,
  armed: 30,
  press: 36,
  swell: 40,
  chrome: 48,
  hero: 52,
  tick1: 66,
  scroll1: 72,
  plans: 76,
  tick2: 90,
  scroll2: 96,
  tick3: 104,
  publish: 114,
  toast: 120,
  end: 156,
};

const ramp = (f: number, start: number, dur: number, easing = ENTER) =>
  interpolate(f, [start, start + dur], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing,
  });

const mix = (a: number, b: number, t: number) => a + (b - a) * t;

const dip = (f: number, at: number, depth: number) =>
  1 - depth * ramp(f, at, 3, MOVE) + depth * ramp(f, at + 3, 9, ENTER);

const line = (color: string, w = 1.5) => ({
  fill: "none",
  stroke: color,
  strokeWidth: w,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
});

function DirBlur({ id, y }: { id: string; y: number }) {
  return (
    <svg width={0} height={0} style={{ position: "absolute" }} aria-hidden>
      <filter id={id} x="-10%" y="-20%" width="120%" height="140%">
        <feGaussianBlur stdDeviation={`${y * 0.4} ${y}`} />
      </filter>
    </svg>
  );
}

export interface PromptSwellTier {
  name: string;
  price: string;
  features?: string[];
}

export interface PromptSwellProps {
  theme?: "dark" | "light";
  accent?: string;
  prompt?: string;
  src?: string;
  url?: string;
  steps?: string[];
  tiers?: PromptSwellTier[];
  ground?: GshPresetId;
  groundParams?: Partial<GradientParams>;
}

const DEFAULT_FEATURES = [
  ["12 components", "720p renders", "Community support"],
  ["Every component", "4K renders", "Studio templates"],
  ["Shared library", "Brand presets", "Priority support"],
];

export function PromptSwell({
  theme = "dark",
  accent = "#ff7a3d",
  prompt = "Build a launch page for our video kit with a hero, pricing and a waitlist",
  src = staticFile("studio.png"),
  url = "preview.remocn.dev",
  steps = ["Hero with product shot", "Pricing tiers", "Waitlist form"],
  tiers = [
    { name: "Free", price: "$0" },
    { name: "Pro", price: "$19" },
    { name: "Team", price: "$49" },
  ],
  ground,
  groundParams,
}: PromptSwellProps) {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const dark = theme === "dark";
  const portrait = height > width * 1.2;
  const stageW = portrait ? 720 : 1280;
  const stageH = portrait ? 1280 : 720;
  const k = width / stageW;

  const ink = dark ? "#f2f1f6" : "#17161b";
  const muted = dark ? "rgba(236,234,244,0.56)" : "rgba(23,22,27,0.54)";
  const faint = dark ? "rgba(236,234,244,0.32)" : "rgba(23,22,27,0.32)";
  const hair = dark ? "rgba(255,255,255,0.09)" : "rgba(23,22,27,0.09)";
  const fill = dark ? "rgba(255,255,255,0.05)" : "rgba(23,22,27,0.04)";
  const surface = dark
    ? "linear-gradient(180deg, rgba(30,29,38,0.9) 0%, rgba(16,15,21,0.95) 100%)"
    : "linear-gradient(180deg, #ffffff 0%, #fbfaf8 100%)";
  const page = dark ? "#0b0b0f" : "#ffffff";
  const pageCard = dark ? "#131319" : "#ffffff";
  const shadow = dark
    ? "inset 0 1px 0 rgba(255,255,255,0.07), 0 1px 2px rgba(0,0,0,0.5), 0 16px 36px rgba(0,0,0,0.35), 0 60px 120px rgba(4,0,16,0.6)"
    : "inset 0 1px 0 #ffffff, 0 1px 2px rgba(30,30,60,0.06), 0 16px 34px rgba(30,30,60,0.08), 0 56px 110px rgba(30,30,60,0.16)";

  const typeRate = 2.4;
  const typed = prompt.slice(
    0,
    Math.max(0, Math.floor((frame - B.type) * typeRate)),
  );
  const typing = typed.length < prompt.length;
  const caretOn = typing || Math.floor(frame / 8) % 2 === 0;

  const cardW = portrait ? 660 : 880;
  const cardH = portrait ? 260 : 206;
  const winW = portrait ? 680 : 1196;
  const winH = portrait ? 1180 : 664;
  const sw = spring({
    frame: frame - B.swell,
    fps,
    config: HEAVY,
    durationInFrames: 30,
  });
  const swPrev = spring({
    frame: frame - 1 - B.swell,
    fps,
    config: HEAVY,
    durationInFrames: 30,
  });
  const W = mix(cardW, winW, sw);
  const H = mix(cardH, winH, sw);
  const swBlur = Math.min(6, Math.abs(sw - swPrev) * (winH - cardH) * 0.12);
  const cardIn = spring({ frame: frame - B.card, fps, config: CARD });
  const promptOut = ramp(frame, B.swell, 9, EXIT);
  const win = ramp(frame, B.chrome - 4, 14);

  const sendFill = ramp(frame, B.armed, 6);
  const sendDip = dip(frame, B.press, 0.14);

  const camPull = ramp(frame, B.press - 2, 32, CAM);
  const settle = spring({ frame: frame + 10, fps, config: HEAVY });
  const push =
    mix(portrait ? 1.08 : 1.3, 1, camPull) +
    0.03 * ramp(frame, B.chrome, B.end - B.chrome, Easing.linear);
  const rotX =
    mix(12, 3, settle) + 4 * Math.sin(Math.PI * camPull) - 1.5 * camPull;
  const rotY = mix(-12, -3, settle) + 2 * camPull;

  const chromeH = 52;
  const chatW = portrait ? winW : 340;
  const chatH = portrait ? 300 : winH - chromeH;
  const view = portrait
    ? {
        x: 14,
        y: chromeH + chatH,
        w: winW - 28,
        h: winH - chromeH - chatH - 14,
      }
    : {
        x: chatW,
        y: chromeH + 14,
        w: winW - chatW - 14,
        h: winH - chromeH - 28,
      };
  const PW = view.w;
  const navH = 60;
  const heroH = portrait ? 600 : 560;
  const pricingTop = navH + heroH;
  const pricingH = portrait ? 480 : 470;
  const waitTop = pricingTop + pricingH;
  const waitH = 200;
  const pageEnd = waitTop + waitH;
  const s1 = spring({ frame: frame - B.scroll1, fps, config: HEAVY });
  const s1Prev = spring({ frame: frame - 1 - B.scroll1, fps, config: HEAVY });
  const s2 = spring({ frame: frame - B.scroll2, fps, config: HEAVY });
  const scrollA = pricingTop + 2;
  const scrollB = Math.max(
    scrollA,
    Math.min(pricingTop + 110, pageEnd - view.h + 30),
  );
  const scrollY = s1 * scrollA + s2 * (scrollB - scrollA);
  const scrollBlur = Math.min(5, Math.abs(s1 - s1Prev) * scrollA * 0.06);

  const tick = (i: number) => ramp(frame, [B.tick1, B.tick2, B.tick3][i], 8);
  const heroIn = ramp(frame, B.hero, 18, RISE);
  const heroImg = ramp(frame, B.hero + 6, 24, RISE);
  const planIn = (i: number) =>
    spring({ frame: frame - B.plans - i * 4, fps, config: CARD });
  const waitIn = ramp(frame, B.scroll2 + 2, 14);
  const pubDip = dip(frame, B.publish, 0.1);
  const toast = spring({ frame: frame - B.toast, fps, config: CHIP });
  const live = frame >= B.toast;

  const resolvedPreset: GshPresetId | undefined = ground;
  const resolvedParams: Partial<GradientParams> | undefined =
    groundParams ??
    (ground
      ? undefined
      : dark
        ? {
            kind: "mist",
            background: "#0a0810",
            colors: ["#e9b8ff", "#ff9e6b", "#6c4dff", "#1a1030"],
          }
        : {
            kind: "spectrum",
            background: "#f2f1ee",
            colors: ["#ffb38a", "#ff7a3d", "#3552ff", "#b08cff"],
          });

  const sendButton = (
    <div
      style={{
        width: 44,
        height: 44,
        borderRadius: 22,
        position: "relative",
        background: fill,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transform: `scale(${sendDip})`,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: 22,
          background: accent,
          opacity: sendFill,
          boxShadow: `inset 0 1px 0 rgba(255,255,255,0.35), 0 6px 16px color-mix(in oklab, ${accent} 40%, transparent)`,
        }}
      />
      <svg
        viewBox="0 0 24 24"
        width={20}
        height={20}
        style={{ position: "relative" }}
        aria-hidden
      >
        <path
          d="M12 19V5M6 11l6-6 6 6"
          {...line(sendFill > 0.5 ? "#fff" : muted, 1.8)}
        />
      </svg>
    </div>
  );

  const check = (t: number, size: number, on: string, off: string) => (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        flexShrink: 0,
        border: `1.5px solid ${t > 0.05 ? "transparent" : off}`,
        background: t > 0.05 ? on : "transparent",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transform: `scale(${t > 0 ? 0.8 + 0.2 * t + 0.18 * Math.sin(Math.PI * t) : 1})`,
      }}
    >
      <svg
        viewBox="0 0 24 24"
        width={size * 0.62}
        height={size * 0.62}
        aria-hidden
      >
        <path
          d="m6 12.5 4 4 8-9"
          {...line(dark ? "#0b0b0f" : "#ffffff", 2.6)}
          strokeDasharray={20}
          strokeDashoffset={20 * (1 - t)}
        />
      </svg>
    </div>
  );

  const planGap = portrait ? 10 : 16;
  const planPad = portrait ? 16 : 22;
  const planW = (PW - (portrait ? 40 : 64) - planGap * 2) / 3;
  const planH = portrait ? 330 : 312;

  const plan = (tier: PromptSwellTier, i: number) => {
    const p = planIn(i);
    const hot = i === 1;
    const feats = tier.features ?? DEFAULT_FEATURES[i % 3];
    return (
      <div
        key={tier.name}
        style={{
          position: "relative",
          width: planW,
          height: planH,
          borderRadius: 16,
          background: pageCard,
          border: `1px solid ${hot ? `color-mix(in oklab, ${accent} 55%, transparent)` : hair}`,
          boxShadow: hot
            ? `0 0 0 4px color-mix(in oklab, ${accent} 10%, transparent), 0 16px 40px rgba(0,0,0,${dark ? 0.4 : 0.08})`
            : `0 1px 2px rgba(0,0,0,${dark ? 0.3 : 0.04}), 0 10px 24px rgba(0,0,0,${dark ? 0.25 : 0.05})`,
          padding: planPad,
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          opacity: frame >= B.plans + i * 4 ? Math.min(1, p * 1.6) : 0,
          transform: `translateY(${mix(40, 0, p)}px) scale(${mix(0.94, 1, p)})`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 17, color: ink }}>{tier.name}</span>
          {hot ? (
            <span
              style={{
                height: 22,
                padding: "0 8px",
                borderRadius: 6,
                background: `color-mix(in oklab, ${accent} 16%, transparent)`,
                color: accent,
                fontSize: 12,
                letterSpacing: "0.06em",
                display: "flex",
                alignItems: "center",
                fontFamily: mono.fontFamily,
              }}
            >
              POPULAR
            </span>
          ) : null}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 6,
            marginTop: 14,
          }}
        >
          <span
            style={{
              fontSize: portrait ? 36 : 44,
              fontWeight: 300,
              color: ink,
              letterSpacing: "-0.045em",
              lineHeight: 1,
            }}
          >
            {tier.price}
          </span>
          <span style={{ fontSize: 15, color: muted }}>/mo</span>
        </div>
        <div style={{ fontSize: 14, color: muted, marginTop: 8 }}>
          {i === 0 ? "Free forever" : "Billed monthly"}
        </div>
        <div style={{ height: 1, background: hair, margin: "16px 0 14px" }} />
        {feats.slice(0, 3).map((f) => (
          <div
            key={f}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: portrait ? 14 : 15,
              color: ink,
              marginBottom: 10,
              whiteSpace: "nowrap",
            }}
          >
            <svg viewBox="0 0 24 24" width={16} height={16} aria-hidden>
              <path
                d="m5 12.5 4.5 4.5L19 7.5"
                {...line(hot ? accent : muted, 1.8)}
              />
            </svg>
            {f}
          </div>
        ))}
        <div style={{ flex: 1 }} />
        <div
          style={{
            height: 40,
            borderRadius: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 15,
            color: hot ? "#fff" : ink,
            background: hot ? accent : fill,
            border: hot ? "none" : `1px solid ${hair}`,
            boxShadow: hot ? "inset 0 1px 0 rgba(255,255,255,0.3)" : undefined,
          }}
        >
          {i === 0 ? "Start free" : i === 1 ? "Upgrade to Pro" : "Contact us"}
        </div>
      </div>
    );
  };

  const pageContent = (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: PW,
        transform: `translateY(${-scrollY}px)`,
        filter: scrollBlur > 0.4 ? "url(#ps-scroll)" : undefined,
      }}
    >
      <div
        style={{
          height: navH,
          display: "flex",
          alignItems: "center",
          padding: `0 ${portrait ? 20 : 32}px`,
          gap: portrait ? 16 : 26,
          borderBottom: `1px solid ${hair}`,
          opacity: heroIn,
        }}
      >
        <RemocnLogo fontSize={22} color={ink} />
        <span style={{ flex: 1 }} />
        {(portrait ? ["Docs"] : ["Components", "Pricing", "Docs"]).map((l) => (
          <span key={l} style={{ fontSize: 15, color: muted }}>
            {l}
          </span>
        ))}
        <span
          style={{
            height: 34,
            padding: "0 14px",
            borderRadius: 9,
            background: ink,
            color: page,
            fontSize: 15,
            display: "flex",
            alignItems: "center",
          }}
        >
          Join waitlist
        </span>
      </div>
      <div
        style={{
          height: heroH,
          position: "relative",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          paddingTop: portrait ? 44 : 50,
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            height: 30,
            padding: "0 12px",
            borderRadius: 15,
            border: `1px solid ${hair}`,
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 14,
            color: muted,
            opacity: heroIn,
          }}
        >
          <span
            style={{ width: 6, height: 6, borderRadius: 3, background: accent }}
          />
          Now in early access
        </div>
        <div style={{ overflow: "hidden", marginTop: 18, paddingBottom: 6 }}>
          <div
            style={{
              fontSize: portrait ? 40 : 50,
              fontWeight: 300,
              color: ink,
              letterSpacing: "-0.045em",
              lineHeight: 1.05,
              textAlign: "center",
              maxWidth: PW - 60,
              transform: `translateY(${mix(70, 0, heroIn)}px)`,
            }}
          >
            Launch videos, built from code.
          </div>
        </div>
        <div
          style={{
            fontSize: 17,
            color: muted,
            marginTop: 12,
            textAlign: "center",
            maxWidth: PW - 80,
            opacity: ramp(frame, B.hero + 4, 12),
          }}
        >
          Drop-in Remotion scenes you own and edit.
        </div>
        <div
          style={{
            position: "absolute",
            left: portrait ? 20 : 48,
            right: portrait ? 20 : 48,
            top: portrait ? 230 : 216,
            bottom: 0,
            borderRadius: "16px 16px 0 0",
            overflow: "hidden",
            border: `1px solid ${hair}`,
            borderBottom: "none",
            background: dark ? "#08080b" : "#ecebe7",
            boxShadow: `0 -10px 60px color-mix(in oklab, ${accent} ${dark ? 22 : 14}%, transparent)`,
            transform: `translateY(${mix(60, 0, heroImg)}px)`,
            opacity: Math.min(1, heroImg * 1.4),
          }}
        >
          <Img
            src={src}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "50% 0%",
              filter: `blur(${mix(18, 0, heroImg)}px)`,
              transform: `scale(${mix(1.1, 1, heroImg)})`,
            }}
          />
        </div>
      </div>
      <div
        style={{
          height: pricingH,
          padding: `${portrait ? 40 : 44}px ${portrait ? 20 : 32}px 0`,
          boxSizing: "border-box",
          borderTop: `1px solid ${hair}`,
        }}
      >
        <div
          style={{
            fontSize: portrait ? 30 : 34,
            fontWeight: 300,
            color: ink,
            letterSpacing: "-0.04em",
            textAlign: "center",
            opacity: ramp(frame, B.scroll1 + 2, 12),
          }}
        >
          Simple pricing
        </div>
        <div
          style={{
            fontSize: 16,
            color: muted,
            textAlign: "center",
            marginTop: 6,
            opacity: ramp(frame, B.scroll1 + 4, 12),
          }}
        >
          Start free. Upgrade when you ship.
        </div>
        <div
          style={{
            display: "flex",
            gap: planGap,
            marginTop: 30,
          }}
        >
          {tiers.slice(0, 3).map(plan)}
        </div>
      </div>
      <div
        style={{
          height: waitH,
          padding: `36px ${portrait ? 20 : 32}px 0`,
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          opacity: waitIn,
          transform: `translateY(${mix(24, 0, waitIn)}px)`,
        }}
      >
        <div
          style={{
            fontSize: 26,
            fontWeight: 300,
            color: ink,
            letterSpacing: "-0.035em",
          }}
        >
          Get the kit first
        </div>
        <div
          style={{
            display: "flex",
            gap: 8,
            marginTop: 18,
            width: Math.min(460, PW - 40),
          }}
        >
          <div
            style={{
              flex: 1,
              height: 46,
              borderRadius: 11,
              border: `1px solid ${hair}`,
              background: fill,
              display: "flex",
              alignItems: "center",
              padding: "0 14px",
              fontSize: 16,
              color: faint,
            }}
          >
            you@studio.com
          </div>
          <div
            style={{
              height: 46,
              padding: "0 18px",
              borderRadius: 11,
              background: accent,
              color: "#fff",
              fontSize: 16,
              display: "flex",
              alignItems: "center",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.3)",
            }}
          >
            Join waitlist
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <AbsoluteFill style={{ fontFamily: geist.fontFamily, overflow: "hidden" }}>
      <GshGround
        preset={resolvedPreset}
        params={resolvedParams}
        timeOffset={2.5}
        timeScale={0.45}
      />
      <DirBlur id="ps-swell" y={swBlur} />
      <DirBlur id="ps-scroll" y={scrollBlur} />
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: stageW,
          height: stageH,
          transform: `scale(${k})`,
          transformOrigin: "0 0",
          perspective: 2200,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: stageW / 2,
            top: stageH / 2,
            width: 0,
            height: 0,
            transformStyle: "preserve-3d",
            transform: `scale(${push}) rotateX(${rotX}deg) rotateY(${rotY}deg)`,
          }}
        >
          <div
            style={{
              position: "absolute",
              left: -W / 2,
              top: -H / 2,
              width: W,
              height: H,
              borderRadius: mix(28, 18, sw),
              background: surface,
              border: `1px solid ${hair}`,
              boxShadow: shadow,
              overflow: "hidden",
              opacity: Math.min(1, cardIn * 1.5),
              transform: `translateY(${mix(50, 0, cardIn)}px)`,
              filter: swBlur > 0.4 ? "url(#ps-swell)" : undefined,
            }}
          >
            <div
              style={{
                position: "absolute",
                left: (W - cardW) / 2,
                top: (H - cardH) / 2,
                width: cardW,
                height: cardH,
                opacity: 1 - promptOut,
                transform: `scale(${mix(1, 1.1, promptOut)})`,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  left: 28,
                  right: 28,
                  top: 24,
                  fontSize: portrait ? 28 : 27,
                  fontWeight: 300,
                  lineHeight: 1.32,
                  color: typed.length ? ink : faint,
                  letterSpacing: "-0.02em",
                }}
              >
                {typed.length ? typed : "Describe what you want to build"}
                <span
                  style={{
                    display: "inline-block",
                    width: 2,
                    height: 30,
                    marginLeft: 2,
                    verticalAlign: "-6px",
                    background: accent,
                    opacity: caretOn ? 1 : 0,
                  }}
                />
              </div>
              <div
                style={{
                  position: "absolute",
                  left: 18,
                  right: 18,
                  bottom: 16,
                  height: 44,
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    border: `1px solid ${hair}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <svg viewBox="0 0 24 24" width={19} height={19} aria-hidden>
                    <path d="M12 5v14M5 12h14" {...line(muted)} />
                  </svg>
                </div>
                <div
                  style={{
                    height: 36,
                    padding: "0 13px",
                    borderRadius: 18,
                    border: `1px solid ${hair}`,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    fontSize: 16,
                    color: ink,
                  }}
                >
                  <svg viewBox="0 0 24 24" width={17} height={17} aria-hidden>
                    <path
                      d="M4 5.5h16v13H4zM4 9.5h16M8 13.5h5"
                      {...line(muted)}
                    />
                  </svg>
                  Web app
                </div>
                <div style={{ flex: 1 }} />
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 16,
                    color: muted,
                  }}
                >
                  remocn-2
                  <svg viewBox="0 0 24 24" width={14} height={14} aria-hidden>
                    <path d="m7 10 5 5 5-5" {...line(muted)} />
                  </svg>
                </span>
                <svg viewBox="0 0 24 24" width={20} height={20} aria-hidden>
                  <path
                    d="M12 3.5a3 3 0 0 0-3 3v5a3 3 0 0 0 6 0v-5a3 3 0 0 0-3-3ZM6 11.5a6 6 0 0 0 12 0M12 17.5v3"
                    {...line(muted)}
                  />
                </svg>
                {sendButton}
              </div>
            </div>

            <div
              style={{
                position: "absolute",
                left: (W - winW) / 2,
                top: (H - winH) / 2,
                width: winW,
                height: winH,
                opacity: win,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  top: 0,
                  height: chromeH,
                  borderBottom: `1px solid ${hair}`,
                  display: "flex",
                  alignItems: "center",
                  padding: "0 16px",
                  gap: 12,
                }}
              >
                <div style={{ display: "flex", gap: 8 }}>
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      style={{
                        width: 12,
                        height: 12,
                        borderRadius: 6,
                        background: fill,
                        border: `1px solid ${hair}`,
                      }}
                    />
                  ))}
                </div>
                {portrait ? null : (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      marginLeft: 10,
                      fontSize: 15,
                      color: ink,
                    }}
                  >
                    <RemocnR height={15} color={ink} />
                    <span style={{ color: muted }}>/</span>
                    launch-page
                  </div>
                )}
                <div
                  style={{ flex: 1, display: "flex", justifyContent: "center" }}
                >
                  <div
                    style={{
                      height: 30,
                      padding: "0 14px",
                      borderRadius: 9,
                      background: fill,
                      border: `1px solid ${hair}`,
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      fontFamily: mono.fontFamily,
                      fontSize: 14,
                      color: muted,
                    }}
                  >
                    <svg viewBox="0 0 24 24" width={13} height={13} aria-hidden>
                      <path
                        d="M7.5 11V8a4.5 4.5 0 0 1 9 0v3M6 11h12v9H6z"
                        {...line(muted, 2)}
                      />
                    </svg>
                    {url}
                  </div>
                </div>
                <div
                  style={{
                    height: 32,
                    padding: "0 14px",
                    borderRadius: 9,
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                    gap: 7,
                    fontSize: 15,
                    color: "#fff",
                    background: accent,
                    transform: `scale(${pubDip})`,
                    boxShadow: `inset 0 1px 0 rgba(255,255,255,0.3), 0 6px 16px color-mix(in oklab, ${accent} 40%, transparent)`,
                  }}
                >
                  {live ? (
                    <span
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: 4,
                        background: "#fff",
                      }}
                    />
                  ) : null}
                  {live ? "Live" : "Publish"}
                </div>
              </div>

              <div
                style={{
                  position: "absolute",
                  left: 0,
                  top: chromeH,
                  width: chatW,
                  height: chatH,
                  padding: portrait ? "18px 22px" : "20px 20px",
                  boxSizing: "border-box",
                  display: "flex",
                  flexDirection: "column",
                  gap: 16,
                }}
              >
                <div
                  style={{
                    alignSelf: "flex-end",
                    maxWidth: portrait ? "86%" : "100%",
                    padding: "12px 15px",
                    borderRadius: "16px 16px 4px 16px",
                    background: fill,
                    border: `1px solid ${hair}`,
                    fontSize: 16,
                    lineHeight: 1.4,
                    color: ink,
                  }}
                >
                  {prompt}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 8,
                      background: ink,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <RemocnR height={13} color={page} />
                  </div>
                  <span style={{ fontSize: 16, color: muted }}>
                    {frame >= B.tick3 + 6
                      ? "Your page is ready."
                      : "Building your page…"}
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 12,
                    paddingLeft: 2,
                  }}
                >
                  {steps.slice(0, 3).map((st, i) => {
                    const t = tick(i);
                    return (
                      <div
                        key={st}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 11,
                          fontSize: 16,
                          color: t > 0.5 ? ink : muted,
                        }}
                      >
                        {check(t, 22, ink, hair)}
                        <span style={{ flex: 1 }}>{st}</span>
                        <span
                          style={{
                            fontFamily: mono.fontFamily,
                            fontSize: 13,
                            color: faint,
                          }}
                        >
                          {["hero.tsx", "pricing.tsx", "waitlist.tsx"][i]}
                        </span>
                      </div>
                    );
                  })}
                </div>
                {portrait ? null : (
                  <>
                    <div style={{ flex: 1 }} />
                    <div
                      style={{
                        height: 50,
                        borderRadius: 14,
                        border: `1px solid ${hair}`,
                        background: fill,
                        display: "flex",
                        alignItems: "center",
                        padding: "0 8px 0 14px",
                        fontSize: 16,
                        color: faint,
                      }}
                    >
                      <span style={{ flex: 1 }}>Ask for changes</span>
                      <div
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: 17,
                          background: fill,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <svg
                          viewBox="0 0 24 24"
                          width={16}
                          height={16}
                          aria-hidden
                        >
                          <path
                            d="M12 19V5M6 11l6-6 6 6"
                            {...line(muted, 1.8)}
                          />
                        </svg>
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div
                style={{
                  position: "absolute",
                  left: view.x,
                  top: view.y,
                  width: view.w,
                  height: view.h,
                  borderRadius: 14,
                  overflow: "hidden",
                  background: page,
                  border: `1px solid ${hair}`,
                  boxShadow: dark
                    ? "inset 0 1px 0 rgba(255,255,255,0.04)"
                    : "0 1px 3px rgba(30,30,60,0.06)",
                }}
              >
                {pageContent}
                <div
                  style={{
                    position: "absolute",
                    left: "50%",
                    bottom: 18,
                    height: 44,
                    padding: "0 16px 0 10px",
                    borderRadius: 22,
                    background: dark ? "#1b1b22" : "#17161b",
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    fontSize: 15,
                    whiteSpace: "nowrap",
                    boxShadow:
                      "inset 0 1px 0 rgba(255,255,255,0.1), 0 12px 30px rgba(0,0,0,0.35)",
                    opacity: frame >= B.toast ? Math.min(1, toast * 2) : 0,
                    transform: `translate(-50%, ${mix(70, 0, toast)}px) scale(${mix(0.85, 1, toast)})`,
                  }}
                >
                  <span
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: 13,
                      background: "#2fbf71",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <svg viewBox="0 0 24 24" width={15} height={15} aria-hidden>
                      <path d="m6 12.5 4 4 8-9" {...line("#fff", 2.4)} />
                    </svg>
                  </span>
                  Live at
                  <span style={{ fontFamily: mono.fontFamily, opacity: 0.7 }}>
                    {url}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
}

export default PromptSwell;
