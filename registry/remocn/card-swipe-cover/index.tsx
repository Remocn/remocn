"use client";

import { loadFont } from "@remotion/google-fonts/Figtree";
import { loadFont as loadSerif } from "@remotion/google-fonts/InstrumentSerif";
import { loadFont as loadManrope } from "@remotion/google-fonts/Manrope";
import {
  linearTiming,
  type TransitionPresentation,
  type TransitionPresentationComponentProps,
  TransitionSeries,
} from "@remotion/transitions";
import type React from "react";
import { Fragment } from "react";
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

const sans = loadFont("normal", {
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

export type CardSwipeCoverProps = {
  from?: "bottom-right" | "bottom-left";
  radius?: number;
  depth?: number;
  edge?: string;
  tilt?: number;
  blur?: number;
  dim?: number;
  backdrop?: string;
};

export const cardSwipeCoverDefaults: Required<CardSwipeCoverProps> = {
  from: "bottom-right",
  radius: 56,
  depth: 30,
  edge: "#0c1614",
  tilt: 1,
  blur: 4,
  dim: 0.6,
  backdrop: "#000000",
};

const LEAD = { mass: 1, damping: 200, stiffness: 140 };
const TRAIL = { mass: 1, damping: 200, stiffness: 90 };
const SLAB_LAYERS = 10;

function curves(p: number, frames: number, fps: number) {
  const f = p * frames;
  const lead = spring({
    frame: f,
    fps,
    config: LEAD,
    durationInFrames: frames,
  });
  const trail = spring({
    frame: f,
    fps,
    config: TRAIL,
    durationInFrames: frames,
  });
  return { lead, trail };
}

function cardPose(
  p: number,
  frames: number,
  fps: number,
  side: number,
  tilt: number,
) {
  const { lead, trail } = curves(p, frames, fps);
  const settle = interpolate(trail, [0, 1], [0, 1], CLAMP);
  const flat = 1 - settle;
  return {
    x: interpolate(trail, [0, 1], [0.72 * side, 0], CLAMP),
    y: interpolate(lead, [0, 1], [1.08, 0], CLAMP),
    rotZ: -17 * tilt * side * flat,
    rotX: 32 * tilt * flat,
    rotY: -26 * tilt * side * flat,
    scale: 1 + 0.26 * flat,
    settle,
    lead,
  };
}

const CardSwipeCoverPresentation: React.FC<
  TransitionPresentationComponentProps<CardSwipeCoverProps>
> = ({
  children,
  presentationProgress,
  presentationDirection,
  presentationDurationInFrames,
  passedProps,
}) => {
  const { fps, width, height } = useVideoConfig();
  const o = { ...cardSwipeCoverDefaults, ...passedProps };
  const side = o.from === "bottom-left" ? -1 : 1;
  const frames = Math.max(2, presentationDurationInFrames);
  const p = presentationProgress;
  const pose = cardPose(p, frames, fps, side, o.tilt);

  if (presentationDirection === "exiting") {
    const s = pose.lead;
    return (
      <AbsoluteFill
        style={{
          backgroundColor: o.backdrop,
        }}
      >
        <AbsoluteFill
          style={{
            transform: `translate(${-2 * side * s}%, ${-2.5 * s}%) scale(${1 + 0.06 * s})`,
            transformOrigin: o.from === "bottom-left" ? "100% 0%" : "0% 0%",
            filter: `brightness(${1 - o.dim * s}) blur(${4 * s}px)`,
          }}
        >
          {children}
        </AbsoluteFill>
      </AbsoluteFill>
    );
  }

  const prev = cardPose(Math.max(0, p - 1 / frames), frames, fps, side, o.tilt);
  const speed = Math.hypot(
    (pose.x - prev.x) * width,
    (pose.y - prev.y) * height,
  );
  const motionBlur = Math.min(o.blur, speed / 45) * (1 - pose.settle * 0.6);
  const radius = interpolate(pose.settle, [0.82, 1], [o.radius, 0], CLAMP);
  const depth = o.depth * (1 - pose.settle);
  const sheen = interpolate(pose.lead, [0, 1], [-40, 140], CLAMP);

  return (
    <AbsoluteFill style={{ perspective: 1700, perspectiveOrigin: "50% 40%" }}>
      <AbsoluteFill
        style={{
          transformStyle: "preserve-3d",
          transformOrigin: "50% 50%",
          transform: `translate3d(${pose.x * 100}%, ${pose.y * 100}%, 0) rotateZ(${pose.rotZ}deg) rotateX(${pose.rotX}deg) rotateY(${pose.rotY}deg) scale(${pose.scale})`,
        }}
      >
        {Array.from({ length: SLAB_LAYERS }, (_, i) => {
          const k = (i + 1) / SLAB_LAYERS;
          return (
            <AbsoluteFill
              key={`slab-${k}`}
              style={{
                borderRadius: radius,
                backgroundColor: o.edge,
                transform: `translateZ(${-depth * k}px)`,
                filter: `brightness(${1.25 - 0.55 * k})`,
                boxShadow:
                  i === SLAB_LAYERS - 1
                    ? `0 ${60 * (1 - pose.settle)}px ${140 * (1 - pose.settle)}px rgba(0,0,0,${0.55 * (1 - pose.settle)})`
                    : undefined,
              }}
            />
          );
        })}
        <AbsoluteFill
          style={{
            borderRadius: radius,
            overflow: "hidden",
            transform: "translateZ(0.5px)",
            filter: motionBlur > 0.3 ? `blur(${motionBlur}px)` : undefined,
          }}
        >
          {children}
          <AbsoluteFill
            style={{
              opacity: 1 - pose.settle,
              backgroundImage: `linear-gradient(115deg, transparent ${sheen - 30}%, rgba(255,255,255,0.16) ${sheen}%, transparent ${sheen + 22}%)`,
            }}
          />
          <AbsoluteFill
            style={{
              borderRadius: radius,
              opacity: 1 - pose.settle,
              boxShadow: "inset 0 1.5px 0 rgba(255,255,255,0.22)",
            }}
          />
        </AbsoluteFill>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export function cardSwipeCover(
  props: CardSwipeCoverProps = {},
): TransitionPresentation<CardSwipeCoverProps> {
  return { component: CardSwipeCoverPresentation, props };
}

export interface CoverItem {
  label: string;
  title: string;
  meta: string;
  src: string;
}

export interface CardSwipeCoverDemoProps {
  theme?: "dark" | "light";
  accent?: string;
  line?: string;
  title?: string;
  subtitle?: string;
  covers?: CoverItem[];
  ground?: GshPresetId;
  groundParams?: Partial<GradientParams>;
  groundB?: GshPresetId;
  groundParamsB?: Partial<GradientParams>;
  transition?: CardSwipeCoverProps;
}

const THEMES = {
  dark: {
    ink: "#eef7f3",
    muted: "rgba(226,240,234,0.62)",
    accent: "#7cf2c8",
    caret: "#7cf2c8",
    edge: "#18205a",
    backdrop: "#000000",
    dim: 0.6,
    chrome: "rgba(10,14,22,0.55)",
    hairline: "rgba(255,255,255,0.1)",
    shadow: "0,0,0",
    groundA: {
      kind: "mist",
      colors: ["#b8f5dc", "#3fb58f", "#0e4a3c", "#030a08"],
      background: "#020605",
      speed: 0.6,
      loopSeconds: 16,
      scale: 0.85,
      warp: 0.4,
      blur: 0.75,
      grain: 0.14,
      seed: 9,
    } as Partial<GradientParams>,
    groundB: {
      kind: "mist",
      colors: ["#c9d6ff", "#5b78ff", "#1f2b8f", "#070b24"],
      background: "#03050d",
      speed: 0.7,
      loopSeconds: 16,
      scale: 0.85,
      warp: 0.4,
      blur: 0.7,
      seed: 12,
    } as Partial<GradientParams>,
  },
  light: {
    ink: "#14171c",
    muted: "rgba(20,23,28,0.56)",
    accent: "#2f8f6b",
    caret: "#2f8f6b",
    edge: "#c9ced8",
    backdrop: "#d9dbd6",
    dim: 0.18,
    chrome: "rgba(255,255,255,0.6)",
    hairline: "rgba(20,23,28,0.08)",
    shadow: "40,44,60",
    groundA: {
      kind: "mist",
      colors: ["#bdeedb", "#8fd9c0", "#e6f1ea", "#2c6b58"],
      background: "#eef0ec",
      speed: 0.6,
      loopSeconds: 14,
      scale: 0.8,
      warp: 0.4,
      blur: 0.7,
      grain: 0.25,
      seed: 4,
    } as Partial<GradientParams>,
    groundB: {
      kind: "mist",
      colors: ["#aebcff", "#d9dffb", "#c8b8ff", "#eef0f6"],
      background: "#f1f1f5",
      speed: 0.6,
      loopSeconds: 16,
      scale: 0.85,
      warp: 0.4,
      blur: 0.75,
      grain: 0.22,
      seed: 14,
    } as Partial<GradientParams>,
  },
};

const DEFAULT_COVERS: CoverItem[] = [
  {
    label: "Teaser",
    title: "Ship week teaser",
    meta: "12 scenes · 0:18",
    src: "templates/launch-anything/horizon.jpg",
  },
  {
    label: "Product",
    title: "Studio walkthrough",
    meta: "24 scenes · 0:42",
    src: "templates/product-showcase/sculpture.jpg",
  },
  {
    label: "Social",
    title: "Launch day cutdowns",
    meta: "9 scenes · 0:15",
    src: "reel/reel-4.jpg",
  },
  {
    label: "Keynote",
    title: "Founder's note",
    meta: "16 scenes · 1:05",
    src: "templates/brand-guidelines/ceramics.jpg",
  },
];

const A_LEN = 66;
const B_LEN = 84;
const T_LEN = 30;
export const CARD_SWIPE_COVER_DURATION = A_LEN + B_LEN - T_LEN;

const A_BEATS = { logo: 0, type: 3, typeEnd: 24 } as const;
const B_BEATS = { covers: 4, lift: 42, pill: 48 } as const;

const TYPE_IN = Easing.bezier(0.32, 0.72, 0, 1);
const CHIP = { mass: 0.5, damping: 12, stiffness: 200 };
const CARD = { mass: 0.8, damping: 18, stiffness: 160 };

function parseLine(text: string) {
  const out: { ch: string; accent: boolean }[] = [];
  let accent = false;
  for (const ch of text) {
    if (ch === "*") {
      accent = !accent;
      continue;
    }
    out.push({ ch, accent });
  }
  return out;
}

function SceneA({
  line,
  palette,
  ground,
  groundParams,
}: {
  line: string;
  palette: (typeof THEMES)["dark"];
  ground?: GshPresetId;
  groundParams?: Partial<GradientParams>;
}) {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const tall = height > width;
  const chars = parseLine(line);
  const firstAccent = chars.findIndex((c) => c.accent);
  const typed = Math.floor(
    interpolate(
      frame,
      [A_BEATS.type, A_BEATS.typeEnd],
      [0, chars.length],
      CLAMP,
    ),
  );
  const done = typed >= chars.length;
  const blinkOn = !done || Math.floor((frame - A_BEATS.typeEnd) / 8) % 2 === 0;
  const fs = tall ? width * 0.095 : width * 0.052;
  const push = interpolate(frame, [0, A_LEN], [1, 1.035], CLAMP);
  const logoIn = interpolate(frame, [A_BEATS.logo, A_BEATS.logo + 12], [0, 1], {
    ...CLAMP,
    easing: TYPE_IN,
  });

  return (
    <AbsoluteFill>
      <GshGround
        preset={ground}
        params={ground ? groundParams : { ...palette.groundA, ...groundParams }}
        timeOffset={4}
        timeScale={0.7}
      />
      <AbsoluteFill
        style={{
          transform: `scale(${push})`,
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: fs * 0.62,
          padding: `0 ${width * 0.08}px`,
        }}
      >
        <div
          style={{
            opacity: logoIn,
            transform: `translateY(${(1 - logoIn) * 14}px)`,
          }}
        >
          <RemocnLogo fontSize={fs * 0.42} color={palette.ink} />
        </div>
        <div
          style={{
            fontFamily: sans.fontFamily,
            fontWeight: 300,
            fontSize: fs,
            lineHeight: 1.08,
            letterSpacing: "-0.035em",
            color: palette.ink,
            textAlign: "center",
            maxWidth: tall ? width * 0.84 : width * 0.86,
          }}
        >
          {chars.map((c, i) => {
            const shown = i < typed;
            const breakHere = tall && c.accent && i === firstAccent;
            return (
              <Fragment key={`${c.ch}-${i}`}>
                {breakHere ? (
                  <span style={{ display: "block", height: 0 }} />
                ) : null}
                <span
                  style={{
                    color: shown
                      ? c.accent
                        ? palette.accent
                        : palette.ink
                      : "transparent",
                    fontFamily: c.accent ? serif.fontFamily : undefined,
                    fontStyle: c.accent ? "italic" : undefined,
                    fontWeight: c.accent ? 400 : undefined,
                    letterSpacing: c.accent ? "-0.01em" : undefined,
                    fontSize: c.accent ? "1.08em" : undefined,
                    position: "relative",
                  }}
                >
                  {c.ch}
                  {i === Math.max(0, typed - 1) ? (
                    <span
                      style={{
                        position: "absolute",
                        right: -fs * 0.08,
                        top: "0.12em",
                        bottom: "0.06em",
                        width: Math.max(2, fs * 0.045),
                        borderRadius: 2,
                        backgroundColor: palette.caret,
                        opacity: blinkOn && typed > 0 ? 1 : 0,
                      }}
                    />
                  ) : null}
                </span>
              </Fragment>
            );
          })}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}

function PlayIcon({ size }: { size: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden>
      <path d="M9 7.5v9l7.5-4.5z" fill="#0b0d12" />
    </svg>
  );
}

function FilmIcon({ size, color }: { size: number; color: string }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden>
      <rect
        x="3.5"
        y="5"
        width="17"
        height="14"
        rx="3"
        fill="none"
        stroke={color}
        strokeWidth="1.5"
      />
      <path
        d="M3.5 9.5h17M8 5v4.5M16 5v4.5"
        fill="none"
        stroke={color}
        strokeWidth="1.5"
      />
    </svg>
  );
}

function Cover({
  item,
  w,
  h,
  scale,
  appear,
  lift,
  accent,
  shadow,
}: {
  item: CoverItem;
  w: number;
  h: number;
  scale: number;
  appear: number;
  lift: number;
  accent: string;
  shadow: string;
}) {
  const r = 22 * scale;
  const pad = 18 * scale;
  return (
    <div
      style={{
        width: w,
        height: h,
        position: "relative",
        borderRadius: r,
        overflow: "hidden",
        opacity: interpolate(appear, [0, 0.4], [0, 1], CLAMP),
        transform: `translateY(${(1 - appear) * 48 * scale - lift * 14 * scale}px) scale(${1 + lift * 0.035})`,
        boxShadow: `0 1px 2px rgba(${shadow},0.18), 0 ${10 + lift * 14}px ${30 + lift * 20}px rgba(${shadow},${0.22 + lift * 0.1}), 0 ${30 + lift * 20}px ${70 + lift * 30}px rgba(${shadow},0.22)`,
        flexShrink: 0,
      }}
    >
      <Img
        src={staticFile(item.src)}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: `scale(${1.08 - appear * 0.08 + lift * 0.03})`,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(180deg, rgba(6,8,12,0.42) 0%, rgba(6,8,12,0) 34%, rgba(6,8,12,0) 46%, rgba(6,8,12,0.78) 100%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: pad,
          left: pad,
          right: pad,
          display: "flex",
          alignItems: "center",
          gap: 8 * scale,
          color: "rgba(255,255,255,0.9)",
          fontSize: 16 * scale,
          fontWeight: 400,
        }}
      >
        <div
          style={{
            width: 26 * scale,
            height: 26 * scale,
            borderRadius: 999,
            backgroundColor: "rgba(255,255,255,0.18)",
            boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.22)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <FilmIcon size={15 * scale} color="#fff" />
        </div>
        {item.label}
      </div>
      <div
        style={{
          position: "absolute",
          left: pad,
          right: pad,
          bottom: pad,
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: 10 * scale,
        }}
      >
        <div
          style={{ display: "flex", flexDirection: "column", gap: 6 * scale }}
        >
          <div
            style={{
              color: "#fff",
              fontSize: 25 * scale,
              lineHeight: 1.08,
              letterSpacing: "-0.02em",
              fontWeight: 400,
            }}
          >
            {item.title}
          </div>
          <div
            style={{
              color: "rgba(255,255,255,0.72)",
              fontSize: 16 * scale,
              fontWeight: 400,
            }}
          >
            {item.meta}
          </div>
        </div>
        <div
          style={{
            width: 38 * scale,
            height: 38 * scale,
            borderRadius: 999,
            backgroundColor: lift > 0.5 ? accent : "rgba(255,255,255,0.92)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            transform: `scale(${1 + lift * 0.08})`,
          }}
        >
          <PlayIcon size={22 * scale} />
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: r,
          boxShadow: `inset 0 0 0 1px rgba(255,255,255,0.14), inset 0 1px 0 rgba(255,255,255,0.18), inset 0 0 0 ${lift * 2.5 * scale}px ${accent}`,
        }}
      />
    </div>
  );
}

function SceneB({
  title,
  subtitle,
  covers,
  palette,
  accent,
  ground,
  groundParams,
}: {
  title: string;
  subtitle: string;
  covers: CoverItem[];
  palette: (typeof THEMES)["dark"];
  accent: string;
  ground?: GshPresetId;
  groundParams?: Partial<GradientParams>;
}) {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const tall = height > width;
  const m = width * 0.07;
  const scale = tall ? width / 820 : width / 1280;
  const cols = tall ? 2 : 4;
  const gap = 20 * scale;
  const cw = (width - m * 2 - gap * (cols - 1)) / cols;
  const ch = tall ? cw * 1.32 : cw * 1.18;
  const push = interpolate(frame, [0, B_LEN], [1, 1.03], CLAMP);
  const lift = spring({
    frame: frame - B_BEATS.lift,
    fps,
    config: CARD,
  });
  const pill = spring({ frame: frame - B_BEATS.pill, fps, config: CHIP });
  const head = interpolate(frame, [0, 14], [0, 1], {
    ...CLAMP,
    easing: TYPE_IN,
  });

  return (
    <AbsoluteFill>
      <GshGround
        preset={ground}
        params={ground ? groundParams : { ...palette.groundB, ...groundParams }}
        timeOffset={6}
        timeScale={0.6}
      />
      <AbsoluteFill
        style={{
          transform: `scale(${push})`,
          padding: `${tall ? height * 0.07 : height * 0.085}px ${m}px`,
          fontFamily: sans.fontFamily,
          display: "flex",
          flexDirection: "column",
          justifyContent: tall ? "center" : "flex-start",
          gap: tall ? 40 * scale : 0,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <RemocnLogo fontSize={24 * scale} color={palette.ink} />
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8 * scale,
              padding: `${4 * scale}px`,
              borderRadius: 999,
              backgroundColor: palette.chrome,
              boxShadow: `inset 0 0 0 1px ${palette.hairline}`,
              fontSize: 16 * scale,
              color: palette.muted,
            }}
          >
            {["All", "Videos", "Stills", "Captions"].map((t, i) => (
              <div
                key={t}
                style={{
                  padding: `${7 * scale}px ${14 * scale}px`,
                  borderRadius: 999,
                  color: i === 0 ? palette.ink : palette.muted,
                  backgroundColor:
                    i === 0 ? "rgba(255,255,255,0.14)" : "transparent",
                  boxShadow:
                    i === 0 ? `inset 0 0 0 1px ${palette.hairline}` : undefined,
                }}
              >
                {t}
              </div>
            ))}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            marginTop: tall ? 0 : height * 0.07,
            marginBottom: tall ? 0 : height * 0.05,
            opacity: head,
            transform: `translateY(${(1 - head) * 16}px)`,
          }}
        >
          <div
            style={{ display: "flex", flexDirection: "column", gap: 8 * scale }}
          >
            <div
              style={{
                fontSize: (tall ? 84 : 58) * scale,
                fontWeight: 300,
                letterSpacing: "-0.035em",
                lineHeight: 1,
                color: palette.ink,
              }}
            >
              {title}
            </div>
            <div
              style={{
                fontSize: (tall ? 28 : 20) * scale,
                fontWeight: 400,
                color: palette.muted,
                letterSpacing: "-0.01em",
              }}
            >
              {subtitle}
            </div>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8 * scale,
              padding: `${10 * scale}px ${18 * scale}px`,
              borderRadius: 999,
              backgroundColor: accent,
              color: "#0b0d12",
              fontSize: 17 * scale,
              fontWeight: 400,
              opacity: interpolate(pill, [0, 0.3], [0, 1], CLAMP),
              transform: `scale(${0.7 + pill * 0.3})`,
              boxShadow: `0 8px 24px rgba(${palette.shadow},0.25)`,
            }}
          >
            <svg
              viewBox="0 0 24 24"
              width={16 * scale}
              height={16 * scale}
              aria-hidden
            >
              <path
                d="M12 5v14M5 12h14"
                stroke="#0b0d12"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
            New kit
          </div>
        </div>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap,
          }}
        >
          {covers.slice(0, 4).map((c, i) => {
            const appear = spring({
              frame: frame - B_BEATS.covers - i * 3,
              fps,
              config: CARD,
            });
            return (
              <Cover
                key={c.title}
                item={c}
                w={cw}
                h={ch}
                scale={scale}
                appear={appear}
                lift={i === 0 ? lift : 0}
                accent={accent}
                shadow={palette.shadow}
              />
            );
          })}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}

export function CardSwipeCoverDemo({
  theme = "dark",
  accent,
  line = "Every launch asset, *in one place.*",
  title = "Launch kits",
  subtitle = "Four films, ready to render.",
  covers = DEFAULT_COVERS,
  ground,
  groundParams,
  groundB,
  groundParamsB,
  transition,
}: CardSwipeCoverDemoProps) {
  const palette = THEMES[theme];
  const tone = accent ?? palette.accent;
  return (
    <AbsoluteFill style={{ backgroundColor: palette.backdrop }}>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={A_LEN}>
          <SceneA
            line={line}
            palette={{ ...palette, accent: tone, caret: tone }}
            ground={ground}
            groundParams={groundParams}
          />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={cardSwipeCover({
            edge: palette.edge,
            backdrop: palette.backdrop,
            dim: palette.dim,
            ...transition,
          })}
          timing={linearTiming({ durationInFrames: T_LEN })}
        />
        <TransitionSeries.Sequence durationInFrames={B_LEN}>
          <SceneB
            title={title}
            subtitle={subtitle}
            covers={covers}
            palette={palette}
            accent={tone}
            ground={groundB}
            groundParams={groundParamsB}
          />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
}
