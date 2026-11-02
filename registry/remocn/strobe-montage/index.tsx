"use client";

import { loadFont as loadSans } from "@remotion/google-fonts/HankenGrotesk";
import { loadFont as loadSerif } from "@remotion/google-fonts/InstrumentSerif";
import { loadFont as loadManrope } from "@remotion/google-fonts/Manrope";
import {
  linearTiming,
  type TransitionPresentation,
  type TransitionPresentationComponentProps,
  TransitionSeries,
} from "@remotion/transitions";
import type React from "react";
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

const sans = loadSans("normal", {
  weights: ["300", "400"],
  subsets: ["latin"],
});
const serif = loadSerif("italic", { weights: ["400"], subsets: ["latin"] });
const manrope = loadManrope("normal", {
  weights: ["600"],
  subsets: ["latin"],
});

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

const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const PUNCH = Easing.bezier(0.22, 1, 0.36, 1);
const RECEDE = Easing.bezier(0.65, 0, 0.35, 1);
const TYPE_IN = Easing.bezier(0.32, 0.72, 0, 1);
const PANEL = { mass: 1, damping: 26, stiffness: 120 };
const CHIP = { mass: 0.5, damping: 12, stiffness: 200 };

export const STROBE_MONTAGE_IMAGES = [
  "templates/launch-anything/desk.jpg",
  "templates/product-showcase/workbench.jpg",
  "templates/brand-guidelines/materials.jpg",
  "templates/brand-guidelines/ceramics.jpg",
  "templates/launch-anything/rocket.jpg",
  "templates/launch-anything/earth.jpg",
];

export type StrobeMontageProps = {
  images?: string[];
  framesPerHit?: number;
  growFrom?: number;
  growHits?: number;
  punch?: number;
  focus?: string[];
};

export const strobeMontageDefaults: Required<StrobeMontageProps> = {
  images: STROBE_MONTAGE_IMAGES,
  framesPerHit: 4,
  growFrom: 0.58,
  growHits: 3,
  punch: 0.1,
  focus: ["50% 60%", "50% 50%", "40% 50%", "60% 55%", "50% 40%", "50% 50%"],
};

function resolveSrc(src: string) {
  return src.startsWith("http") || src.startsWith("data:")
    ? src
    : staticFile(src);
}

function slotAt(p: number, duration: number, framesPerHit: number) {
  const slots = Math.max(2, Math.round(duration / Math.max(1, framesPerHit)));
  const f = Math.min(1, Math.max(0, p)) * slots;
  const k = Math.min(slots - 1, Math.floor(f));
  return { slots, k, local: Math.min(1, f - k) };
}

const StrobeMontagePresentation: React.FC<
  TransitionPresentationComponentProps<StrobeMontageProps>
> = ({
  children,
  presentationProgress,
  presentationDirection,
  presentationDurationInFrames,
  passedProps,
}) => {
  const { width: W, height: H } = useVideoConfig();
  const o = { ...strobeMontageDefaults, ...passedProps };
  const p = presentationProgress;
  const { slots, k, local } = slotAt(
    p,
    presentationDurationInFrames,
    o.framesPerHit,
  );
  const u = Math.min(W, H) / 720;
  const growSlots = Math.max(1, o.growHits);

  if (presentationDirection === "exiting") {
    const back = RECEDE(
      interpolate(p * slots, [0, growSlots + 0.5], [0, 1], CLAMP),
    );
    return (
      <AbsoluteFill
        style={{
          transform: `scale(${1 + 0.06 * back})`,
          filter:
            back > 0
              ? `brightness(${1 - 0.55 * back}) blur(${3 * back}px)`
              : undefined,
        }}
      >
        {children}
      </AbsoluteFill>
    );
  }

  const isB = k === slots - 1;
  const kick = 1 + o.punch * (1 - PUNCH(local));
  const images = o.images.length > 0 ? o.images : STROBE_MONTAGE_IMAGES;
  const size = interpolate(k, [0, growSlots], [o.growFrom, 1], CLAMP);
  const fw = W * size;
  const fh = H * size;
  const radius = interpolate(size, [o.growFrom, 1], [22 * u, 0], CLAMP);
  const src = images[k % images.length];

  return (
    <AbsoluteFill style={{ zIndex: 2 }}>
      <AbsoluteFill
        style={{
          opacity: isB ? 1 : 0,
          transform: `scale(${isB ? kick * 0.95 + 0.05 : 1})`,
        }}
      >
        {children}
      </AbsoluteFill>
      {isB ? null : (
        <div
          style={{
            position: "absolute",
            left: (W - fw) / 2,
            top: (H - fh) / 2,
            width: fw,
            height: fh,
            borderRadius: radius,
            overflow: "hidden",
            background: "#000",
            boxShadow:
              size < 1
                ? `0 ${24 * u}px ${60 * u}px rgba(0,0,0,0.5), 0 ${4 * u}px ${12 * u}px rgba(0,0,0,0.35)`
                : undefined,
          }}
        >
          <Img
            src={resolveSrc(src)}
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: W,
              height: H,
              objectFit: "cover",
              objectPosition: o.focus[k % o.focus.length] ?? "50% 50%",
              transformOrigin: "50% 50%",
              transform: `translate(${-(W - fw) / 2}px, ${-(H - fh) / 2}px) scale(${kick})`,
            }}
          />
        </div>
      )}
    </AbsoluteFill>
  );
};

export function strobeMontage(
  props: StrobeMontageProps = {},
): TransitionPresentation<StrobeMontageProps> {
  return { component: StrobeMontagePresentation, props };
}

const THEMES = {
  dark: {
    base: "#03040a",
    ink: "#f2f4ff",
    sub: "rgba(242,244,255,0.6)",
    accentInk: "#9db4ff",
    accent: "#3B5BFD",
    card: "rgba(14,16,26,0.72)",
    cardHair: "rgba(255,255,255,0.10)",
    cardLift: "inset 0 1px 0 rgba(255,255,255,0.07)",
    cardShadow:
      "0 2px 4px rgba(0,0,0,0.4), 0 18px 40px rgba(0,0,0,0.45), 0 40px 90px rgba(4,8,30,0.5)",
    chip: "rgba(255,255,255,0.06)",
    chipHair: "rgba(255,255,255,0.09)",
    groundA: "film-blue" as GshPresetId | undefined,
    groundAParams: undefined as Partial<GradientParams> | undefined,
    groundB: "earthshine" as GshPresetId | undefined,
    groundBParams: undefined as Partial<GradientParams> | undefined,
  },
  light: {
    base: "#eef0f6",
    ink: "#111427",
    sub: "rgba(17,20,39,0.56)",
    accentInk: "#3552ff",
    accent: "#3B5BFD",
    card: "rgba(255,255,255,0.86)",
    cardHair: "rgba(17,20,39,0.09)",
    cardLift: "inset 0 1px 0 rgba(255,255,255,1)",
    cardShadow:
      "0 1px 2px rgba(30,36,70,0.08), 0 14px 34px rgba(30,36,70,0.10), 0 40px 80px rgba(30,36,70,0.08)",
    chip: "rgba(17,20,39,0.04)",
    chipHair: "rgba(17,20,39,0.08)",
    groundA: undefined as GshPresetId | undefined,
    groundAParams: {
      kind: "mist",
      background: "#eef0f6",
      colors: ["#ffffff", "#dfe6ff", "#a9bbff", "#3d5bff"],
      blur: 0.6,
      warp: 0.4,
      seed: 3,
      grain: 0.15,
    } as Partial<GradientParams> | undefined,
    groundB: "paper-crease" as GshPresetId | undefined,
    groundBParams: undefined as Partial<GradientParams> | undefined,
  },
};

type Theme = (typeof THEMES)["dark"];

export const STROBE_MONTAGE_TIMING = { a: 72, transition: 28, b: 84 };
export const strobeMontageDemoLength =
  STROBE_MONTAGE_TIMING.a +
  STROBE_MONTAGE_TIMING.b -
  STROBE_MONTAGE_TIMING.transition;

function Rise({
  children,
  v,
  italic,
}: {
  children: React.ReactNode;
  v: number;
  italic?: boolean;
}) {
  return (
    <span
      style={{
        display: "inline-block",
        overflow: "hidden",
        verticalAlign: "bottom",
        padding: `0 ${italic ? 0.08 : 0}em 0.14em 0`,
        marginBottom: "-0.14em",
      }}
    >
      <span
        style={{
          display: "inline-block",
          transform: `translateY(${(1 - v) * 108}%)`,
          filter: v < 1 ? `blur(${(1 - v) * 6}px)` : undefined,
        }}
      >
        {children}
      </span>
    </span>
  );
}

function OpenerScene({
  c,
  lead,
  accentWord,
  ground,
  groundParams,
}: {
  c: Theme;
  lead: string;
  accentWord: string;
  ground?: GshPresetId;
  groundParams?: Partial<GradientParams>;
}) {
  const frame = useCurrentFrame();
  const { width: W, height: H } = useVideoConfig();
  const landscape = W >= H;
  const u = Math.min(W, H) / 720;
  const longest = Math.max(lead.length, accentWord.length * 0.85);
  const size = Math.min(
    (landscape ? 120 : 132) * u,
    (W * 0.84) / (0.5 * longest),
  );
  const push = interpolate(frame, [0, 110], [1, 1.04], {
    ...CLAMP,
    easing: Easing.bezier(0.45, 0, 0.55, 1),
  });
  const words = lead.split(" ");
  const at = (i: number) =>
    TYPE_IN(interpolate(frame, [-3 + 3 * i, 11 + 3 * i], [0, 1], CLAMP));
  const logoIn = TYPE_IN(interpolate(frame, [-6, 6], [0, 1], CLAMP));
  return (
    <AbsoluteFill style={{ background: c.base, overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: `scale(${push})` }}>
        <GshGround preset={ground} params={groundParams} timeOffset={4} />
      </AbsoluteFill>
      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: 34 * u,
          transform: `scale(${push})`,
        }}
      >
        <div
          style={{
            opacity: logoIn,
            transform: `translateY(${(1 - logoIn) * 10 * u}px)`,
          }}
        >
          <RemocnLogo fontSize={28 * u} color={c.ink} />
        </div>
        <div
          style={{
            fontFamily: sans.fontFamily,
            fontWeight: 300,
            fontSize: size,
            lineHeight: 0.98,
            letterSpacing: "-0.045em",
            color: c.ink,
            textAlign: "center",
          }}
        >
          {words.map((w, i) => (
            <span key={`${w}-${i}`}>
              <Rise v={at(i)}>{w}</Rise>
              {i < words.length - 1 ? " " : ""}
            </span>
          ))}
          <br />
          <span
            style={{
              fontFamily: serif.fontFamily,
              fontStyle: "italic",
              fontWeight: 400,
              letterSpacing: "-0.02em",
              color: c.accentInk,
            }}
          >
            <Rise v={at(words.length + 1)} italic>
              {accentWord}
            </Rise>
          </span>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}

function Icon({ d, size, color }: { d: string; size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d={d}
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const ICON = {
  plus: "M8 3.5v9M3.5 8h9",
  chevron: "M5 6.5 8 9.5l3-3",
  mic: "M8 2.8a2 2 0 0 1 2 2v3a2 2 0 0 1-4 0v-3a2 2 0 0 1 2-2ZM4.6 7.6a3.4 3.4 0 0 0 6.8 0M8 11v2.2",
  up: "M8 12.5v-9M4.5 7 8 3.5 11.5 7",
  file: "M4.5 2.5h4.6L12 5.4v8.1H4.5zM9 2.5v3h3",
  x: "M5 5l6 6M11 5l-6 6",
  spark: "M8 2.5l1.3 3.2 3.2 1.3-3.2 1.3L8 11.5 6.7 8.3 3.5 7l3.2-1.3z",
};

function PromptScene({
  c,
  heading,
  accentMark,
  prompt,
  file,
  ground,
  groundParams,
  start,
}: {
  c: Theme;
  heading: [string, string];
  accentMark: string;
  prompt: string;
  file: string;
  ground?: GshPresetId;
  groundParams?: Partial<GradientParams>;
  start: number;
}) {
  const frame = useCurrentFrame();
  const { width: W, height: H, fps } = useVideoConfig();
  const landscape = W >= H;
  const u = Math.min(W, H) / 720;
  const t = frame - start;
  const push = interpolate(frame, [0, 120], [1, 1.035], {
    ...CLAMP,
    easing: Easing.bezier(0.45, 0, 0.55, 1),
  });
  const cardW = landscape ? 720 * u : W * 0.88;
  const headSize = (landscape ? 80 : 92) * u;
  const chipIn = spring({ frame: t - 6, fps, config: CHIP });
  const typed = Math.round(
    interpolate(t, [8, 8 + prompt.length * 0.6], [0, prompt.length], CLAMP),
  );
  const done = typed >= prompt.length;
  const sendOn = spring({
    frame: t - (9 + Math.ceil(prompt.length * 0.6)),
    fps,
    config: CHIP,
  });
  const caretOn = done ? Math.floor(t / 8) % 2 === 0 : true;
  const lift = spring({ frame: t + 2, fps, config: PANEL });
  return (
    <AbsoluteFill style={{ background: c.base, overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: `scale(${push})` }}>
        <GshGround preset={ground} params={groundParams} timeOffset={6} />
      </AbsoluteFill>
      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: landscape ? "center" : "center",
          flexDirection: "column",
          gap: 40 * u,
          fontFamily: sans.fontFamily,
          paddingBottom: landscape ? 40 * u : 120 * u,
        }}
      >
        <div
          style={{
            fontWeight: 300,
            fontSize: headSize,
            lineHeight: 1.04,
            letterSpacing: "-0.04em",
            color: c.ink,
            textAlign: "center",
          }}
        >
          {heading[0]}
          <br />
          {heading[1]}
          <span style={{ color: c.accentInk }}>{accentMark}</span>
        </div>
        <div
          style={{
            width: cardW,
            borderRadius: 18 * u,
            background: c.card,
            backdropFilter: "blur(18px)",
            boxShadow: `inset 0 0 0 1px ${c.cardHair}, ${c.cardLift}, ${c.cardShadow}`,
            padding: 14 * u,
            transform: `translateY(${(1 - lift) * 18 * u}px)`,
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 10 * u,
              padding: `${7 * u}px ${10 * u}px ${7 * u}px ${8 * u}px`,
              borderRadius: 10 * u,
              background: c.chip,
              boxShadow: `inset 0 0 0 1px ${c.chipHair}`,
              transform: `scale(${0.8 + 0.2 * chipIn})`,
              transformOrigin: "0% 50%",
              opacity: Math.min(1, chipIn * 1.5),
            }}
          >
            <div
              style={{
                width: 30 * u,
                height: 30 * u,
                borderRadius: 7 * u,
                background: c.accent,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon d={ICON.file} size={16 * u} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize: 14 * u, color: c.ink, fontWeight: 400 }}>
                {file}
              </div>
              <div style={{ fontSize: 12 * u, color: c.sub }}>
                Release notes · 2.4 KB
              </div>
            </div>
            <Icon d={ICON.x} size={14 * u} color={c.sub} />
          </div>
          <div
            style={{
              minHeight: 64 * u,
              padding: `${14 * u}px ${4 * u}px ${8 * u}px`,
              fontSize: 21 * u,
              lineHeight: 1.45,
              color: typed > 0 ? c.ink : c.sub,
              fontWeight: 400,
              letterSpacing: "-0.005em",
            }}
          >
            {typed > 0 ? prompt.slice(0, typed) : "Describe your launch film"}
            <span
              style={{
                display: "inline-block",
                width: 2 * u,
                height: 22 * u,
                marginLeft: 2 * u,
                verticalAlign: "-0.2em",
                background: c.accentInk,
                opacity: caretOn ? 1 : 0,
              }}
            />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 * u }}>
            <div
              style={{
                width: 34 * u,
                height: 34 * u,
                borderRadius: 99,
                boxShadow: `inset 0 0 0 1px ${c.chipHair}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon d={ICON.plus} size={16 * u} color={c.sub} />
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6 * u,
                height: 34 * u,
                padding: `0 ${10 * u}px`,
                borderRadius: 9 * u,
                color: c.sub,
                fontSize: 14 * u,
              }}
            >
              <Icon d={ICON.spark} size={15 * u} color={c.sub} />
              Model
              <Icon d={ICON.chevron} size={14 * u} color={c.sub} />
            </div>
            <div style={{ flex: 1 }} />
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6 * u,
                height: 34 * u,
                padding: `0 ${10 * u}px`,
                borderRadius: 9 * u,
                color: c.sub,
                fontSize: 14 * u,
              }}
            >
              Film
              <Icon d={ICON.chevron} size={14 * u} color={c.sub} />
            </div>
            <Icon d={ICON.mic} size={17 * u} color={c.sub} />
            <div
              style={{
                width: 34 * u,
                height: 34 * u,
                borderRadius: 10 * u,
                marginLeft: 4 * u,
                background: done ? c.accent : c.chip,
                boxShadow: done
                  ? `inset 0 1px 0 rgba(255,255,255,0.25), 0 6px 18px ${c.accent}66`
                  : `inset 0 0 0 1px ${c.chipHair}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transform: `scale(${1 + 0.08 * Math.sin(Math.PI * Math.min(1, sendOn))})`,
              }}
            >
              <Icon d={ICON.up} size={16 * u} color={done ? "#fff" : c.sub} />
            </div>
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}

export interface StrobeMontageDemoProps extends StrobeMontageProps {
  theme?: "dark" | "light";
  accent?: string;
  lead?: string;
  accentWord?: string;
  heading?: [string, string];
  accentMark?: string;
  prompt?: string;
  file?: string;
  ground?: GshPresetId;
  groundParams?: Partial<GradientParams>;
  groundB?: GshPresetId;
  groundBParams?: Partial<GradientParams>;
  transitionFrames?: number;
}

export function StrobeMontage({
  theme = "dark",
  accent,
  lead = "Six weekends",
  accentWord = "of making.",
  heading = ["What will you", "launch next"],
  accentMark = "?",
  prompt = "A 30-second film for our 2.0 release",
  file = "launch-notes.md",
  ground,
  groundParams,
  groundB,
  groundBParams,
  transitionFrames = STROBE_MONTAGE_TIMING.transition,
  ...montage
}: StrobeMontageDemoProps) {
  const base = THEMES[theme];
  const c = { ...base, accent: accent ?? base.accent };
  const presetA = ground ?? (groundParams ? undefined : c.groundA);
  const presetB = groundB ?? (groundBParams ? undefined : c.groundB);
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={STROBE_MONTAGE_TIMING.a}>
          <OpenerScene
            c={c}
            lead={lead}
            accentWord={accentWord}
            ground={presetA}
            groundParams={groundParams ?? c.groundAParams}
          />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={strobeMontage(montage)}
          timing={linearTiming({ durationInFrames: transitionFrames })}
        />
        <TransitionSeries.Sequence durationInFrames={STROBE_MONTAGE_TIMING.b}>
          <PromptScene
            c={c}
            heading={heading}
            accentMark={accentMark}
            prompt={prompt}
            file={file}
            ground={presetB}
            groundParams={groundBParams ?? c.groundBParams}
            start={transitionFrames}
          />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
}
