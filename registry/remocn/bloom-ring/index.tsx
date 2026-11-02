"use client";

import { loadFont as loadGeist } from "@remotion/google-fonts/Geist";
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
  interpolate,
  interpolateColors,
  random,
  spring,
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
const serif = loadSerif("italic", { weights: ["400"], subsets: ["latin"] });
const manrope = loadManrope("normal", {
  weights: ["600"],
  subsets: ["latin"],
});

const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

export type BloomRingProps = {
  colors?: string[];
  centerX?: number;
  centerY?: number;
  cell?: number;
  stripe?: number;
  seed?: string;
};

export const bloomRingDefaults: Required<BloomRingProps> = {
  colors: ["#FFE7CF", "#FFB36B", "#F4842F", "#E2571C"],
  centerX: 0.5,
  centerY: 0.5,
  cell: 22,
  stripe: 1.7,
  seed: "bloom",
};

const GROW = Easing.bezier(0.42, 0, 0.9, 0.62);

function ringState(p: number) {
  const radius = 0.03 + 1.4 * GROW(Math.min(1, Math.max(0, p)));
  const width = 0.07 + radius * 0.3;
  const heat =
    interpolate(p, [0, 0.22], [0, 1], {
      ...CLAMP,
      easing: Easing.bezier(0.32, 0.72, 0, 1),
    }) *
    interpolate(p, [0.62, 1], [1, 0], {
      ...CLAMP,
      easing: Easing.bezier(0.55, 0, 1, 0.45),
    });
  return { radius, width, heat };
}

function Bloom({ p, props }: { p: number; props: Required<BloomRingProps> }) {
  const { width: W, height: H } = useVideoConfig();
  const { radius, width, heat } = ringState(p);
  const cx = props.centerX * W;
  const cy = props.centerY * H;
  const reach = Math.hypot(Math.max(cx, W - cx), Math.max(cy, H - cy));
  const ch = props.cell * (Math.min(W, H) / 720);
  const cw = ch * props.stripe;
  const cols = Math.ceil(W / cw) + 1;
  const rows = Math.ceil(H / ch) + 1;
  const R = radius * reach;
  const Wd = width * reach;
  const ramp = props.colors;
  const rects: React.ReactNode[] = [];
  for (let r = 0; r < rows; r++) {
    const rowShift = (random(`${props.seed}-row-${r}`) - 0.5) * Wd * 0.26;
    const rowPhase = random(`${props.seed}-ph-${r}`) * cw;
    for (let c = -1; c < cols; c++) {
      const x = c * cw - rowPhase;
      const y = r * ch;
      const d = Math.hypot(x + cw / 2 - cx, y + ch / 2 - cy);
      const jitter = (random(`${props.seed}-${r}-${c}`) - 0.5) * Wd * 0.14;
      const u = (d - R - rowShift - jitter) / Wd;
      const inner = u < 0 ? Math.exp(-u * u * 3.2) : Math.exp(-u * u * 1.6);
      const v = inner * heat;
      if (v < 0.025) continue;
      rects.push(
        <rect
          key={`${r}-${c}`}
          x={x}
          y={y}
          width={cw + 0.6}
          height={ch + 0.6}
          fill={interpolateColors(
            v,
            [0, 0.45, 0.8, 1],
            [ramp[1], ramp[2], ramp[3], ramp[2]],
          )}
          fillOpacity={Math.min(1, v ** 0.85 * 1.08)}
        />,
      );
    }
  }
  return (
    <svg
      width={W}
      height={H}
      style={{
        position: "absolute",
        inset: 0,
        filter: `blur(${(ch * 0.42).toFixed(1)}px)`,
      }}
      aria-hidden
    >
      {rects}
    </svg>
  );
}

const BloomRingPresentation: React.FC<
  TransitionPresentationComponentProps<BloomRingProps>
> = ({
  children,
  presentationProgress,
  presentationDirection,
  passedProps,
}) => {
  const props = { ...bloomRingDefaults, ...passedProps };
  const { width: W, height: H } = useVideoConfig();
  const p = presentationProgress;

  if (presentationDirection === "exiting") {
    const swell = interpolate(p, [0, 1], [1, 1.06], {
      ...CLAMP,
      easing: Easing.bezier(0.55, 0, 1, 0.45),
    });
    return (
      <AbsoluteFill
        style={{
          transform: `scale(${swell})`,
          opacity: interpolate(p, [0.24, 0.55], [1, 0.55], {
            ...CLAMP,
            easing: Easing.bezier(0.55, 0, 1, 0.45),
          }),
          filter: `blur(${interpolate(p, [0.18, 0.55], [0, 12], CLAMP).toFixed(2)}px)`,
        }}
      >
        {children}
      </AbsoluteFill>
    );
  }

  const { radius, width } = ringState(p);
  const cx = props.centerX * W;
  const cy = props.centerY * H;
  const reach = Math.hypot(Math.max(cx, W - cx), Math.max(cy, H - cy));
  const hole = Math.max(0, (radius - width * 0.55) * reach);
  const edge = hole + width * reach * 0.75;
  const mask = `radial-gradient(circle at ${cx}px ${cy}px, #000 ${hole}px, transparent ${edge}px)`;
  const settle = interpolate(p, [0.25, 1], [1.08, 1], {
    ...CLAMP,
    easing: Easing.bezier(0.22, 1, 0.36, 1),
  });
  return (
    <AbsoluteFill>
      <AbsoluteFill
        style={{
          maskImage: p >= 1 ? undefined : mask,
          WebkitMaskImage: p >= 1 ? undefined : mask,
          transform: `scale(${settle})`,
        }}
      >
        {children}
      </AbsoluteFill>
      {p < 1 ? <Bloom p={p} props={props} /> : null}
    </AbsoluteFill>
  );
};

export function bloomRing(
  props: BloomRingProps = {},
): TransitionPresentation<BloomRingProps> {
  return { component: BloomRingPresentation, props };
}

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

type Theme = "dark" | "light";

const THEMES = {
  dark: {
    ink: "#FFF4EA",
    muted: "rgba(255,240,228,0.78)",
    accent: "#FFB067",
    logo: "#FFF1E4",
    groundA: "ember" as GshPresetId,
    paramsA: undefined as Partial<GradientParams> | undefined,
    groundB: "hearth" as GshPresetId,
    paramsB: undefined as Partial<GradientParams> | undefined,
    scrim: "rgba(5,3,3,0.35)",
  },
  light: {
    ink: "#1E1A16",
    muted: "rgba(30,26,22,0.56)",
    accent: "#E2662A",
    logo: "#E8712A",
    groundA: "paper-crease" as GshPresetId,
    paramsA: {
      colors: ["#ffd8b0", "#ffe9d4", "#f6efe6", "#e9b892"],
      background: "#f6f2ec",
    } as Partial<GradientParams> | undefined,
    groundB: "corona" as GshPresetId,
    paramsB: {
      kind: "radial-glow",
      colors: ["#ffffff", "#fff3e6", "#ffc590", "#f39a52"],
      background: "#fdfaf6",
      grain: 0.1,
    } as Partial<GradientParams> | undefined,
    scrim: "rgba(255,255,255,0)",
  },
};

const BEATS = {
  lineIn: -4,
  wordGap: 3,
  accentIn: 12,
  logoIn: 13,
  tagIn: 24,
};

function RiseWord({
  children,
  at,
  style,
}: {
  children: React.ReactNode;
  at: number;
  style?: React.CSSProperties;
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({
    frame: frame - at,
    fps,
    config: { mass: 0.8, damping: 18, stiffness: 160 },
  });
  return (
    <span
      style={{
        display: "inline-block",
        overflow: "hidden",
        paddingBottom: "0.14em",
        marginBottom: "-0.14em",
        verticalAlign: "bottom",
      }}
    >
      <span
        style={{
          display: "inline-block",
          transform: `translateY(${(1 - s) * 105}%)`,
          filter: `blur(${(Math.max(0, 1 - s) * 6).toFixed(2)}px)`,
          ...style,
        }}
      >
        {children}
      </span>
    </span>
  );
}

function SceneLine({
  theme,
  lead,
  accent,
  ground,
  groundParams,
}: {
  theme: Theme;
  lead: string;
  accent: string;
  ground?: GshPresetId;
  groundParams?: Partial<GradientParams>;
}) {
  const frame = useCurrentFrame();
  const { width: W, height: H, durationInFrames } = useVideoConfig();
  const t = THEMES[theme];
  const tall = H > W;
  const size = tall ? W * 0.09 : Math.min(W * 0.066, H * 0.12);
  const push = interpolate(frame, [0, durationInFrames], [1, 1.035], CLAMP);
  const words = lead.split(" ");
  const accentWords = accent.split(" ");
  return (
    <AbsoluteFill>
      <GshGround
        preset={ground ?? t.groundA}
        params={groundParams ?? t.paramsA}
        timeOffset={4}
        timeScale={0.5}
      />
      <AbsoluteFill style={{ backgroundColor: t.scrim }} />
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          transform: `scale(${push})`,
        }}
      >
        <div
          style={{
            width: tall ? W * 0.84 : W * 0.8,
            textAlign: "center",
            fontFamily: geist.fontFamily,
            fontWeight: 300,
            fontSize: size,
            lineHeight: 1.08,
            letterSpacing: "-0.035em",
            color: t.ink,
          }}
        >
          <div>
            {words.map((w, i) => (
              <RiseWord key={`${w}-${i}`} at={BEATS.lineIn + i * BEATS.wordGap}>
                {w}
                {" "}
              </RiseWord>
            ))}
          </div>
          <div>
            {accentWords.map((w, i) => (
              <RiseWord
                key={`${w}-${i}`}
                at={BEATS.accentIn + i * BEATS.wordGap}
                style={{
                  fontFamily: serif.fontFamily,
                  fontStyle: "italic",
                  fontWeight: 400,
                  letterSpacing: "-0.02em",
                  color: t.accent,
                  fontSize: size * 1.08,
                }}
              >
                {w}
                {i < accentWords.length - 1 ? " " : ""}
              </RiseWord>
            ))}
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}

function SceneLogo({
  theme,
  tagline,
  ground,
  groundParams,
}: {
  theme: Theme;
  tagline: string;
  ground?: GshPresetId;
  groundParams?: Partial<GradientParams>;
}) {
  const frame = useCurrentFrame();
  const { width: W, height: H, fps, durationInFrames } = useVideoConfig();
  const t = THEMES[theme];
  const tall = H > W;
  const logoSize = tall ? W * 0.2 : Math.min(W * 0.11, H * 0.2);
  const s = spring({
    frame: frame - BEATS.logoIn,
    fps,
    config: { mass: 1, damping: 26, stiffness: 120 },
  });
  const tag = spring({
    frame: frame - BEATS.tagIn,
    fps,
    config: { mass: 0.8, damping: 18, stiffness: 160 },
  });
  const push = interpolate(frame, [0, durationInFrames], [1, 1.03], CLAMP);
  return (
    <AbsoluteFill>
      <GshGround
        preset={ground ?? t.groundB}
        params={groundParams ?? t.paramsB}
        timeOffset={2}
        timeScale={0.5}
      />
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          gap: logoSize * 0.34,
          transform: `scale(${push})`,
        }}
      >
        <div
          style={{
            transform: `translateY(${(1 - s) * logoSize * 0.18}px) scale(${0.94 + s * 0.06})`,
            opacity: interpolate(s, [0, 0.5], [0.2, 1], CLAMP),
            filter: `blur(${((1 - s) * 8).toFixed(2)}px)`,
          }}
        >
          <RemocnLogo fontSize={logoSize} color={t.logo} />
        </div>
        <div
          style={{
            overflow: "hidden",
            paddingBottom: "0.12em",
          }}
        >
          <div
            style={{
              fontFamily: geist.fontFamily,
              fontWeight: 300,
              fontSize: logoSize * 0.27,
              letterSpacing: "-0.015em",
              color: t.muted,
              transform: `translateY(${(1 - tag) * 110}%)`,
              textAlign: "center",
              maxWidth: W * 0.8,
            }}
          >
            {tagline}
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}

export type BloomRingDemoProps = {
  theme?: Theme;
  lead?: string;
  accentLine?: string;
  tagline?: string;
  ring?: BloomRingProps;
  groundA?: GshPresetId;
  groundAParams?: Partial<GradientParams>;
  groundB?: GshPresetId;
  groundBParams?: Partial<GradientParams>;
  sceneA?: number;
  sceneB?: number;
  transition?: number;
};

export const BLOOM_RING_DEMO = { sceneA: 72, sceneB: 84, transition: 30 };

export function BloomRingDemo({
  theme = "dark",
  lead = "Your store goes live",
  accentLine = "in fifteen minutes.",
  tagline = "Launch films, built from blocks you own.",
  ring,
  groundA,
  groundAParams,
  groundB,
  groundBParams,
  sceneA = BLOOM_RING_DEMO.sceneA,
  sceneB = BLOOM_RING_DEMO.sceneB,
  transition = BLOOM_RING_DEMO.transition,
}: BloomRingDemoProps) {
  return (
    <AbsoluteFill
      style={{ backgroundColor: theme === "light" ? "#f6f2ec" : "#050303" }}
    >
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={sceneA}>
          <SceneLine
            theme={theme}
            lead={lead}
            accent={accentLine}
            ground={groundA}
            groundParams={groundAParams}
          />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={bloomRing(ring)}
          timing={linearTiming({ durationInFrames: transition })}
        />
        <TransitionSeries.Sequence durationInFrames={sceneB}>
          <SceneLogo
            theme={theme}
            tagline={tagline}
            ground={groundB}
            groundParams={groundBParams}
          />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
}
