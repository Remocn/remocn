"use client";

import { loadFont as loadMono } from "@remotion/google-fonts/GeistMono";
import { loadFont as loadSans } from "@remotion/google-fonts/InstrumentSans";
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

const sans = loadSans("normal", { weights: ["400"], subsets: ["latin"] });
const mono = loadMono("normal", { weights: ["400"], subsets: ["latin"] });
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

const OPEN = Easing.bezier(0.32, 0.72, 0, 1);
const EXPAND = Easing.bezier(0.83, 0, 0.17, 1);
const SETTLE = Easing.bezier(0.22, 1, 0.36, 1);
const RECEDE = Easing.bezier(0.65, 0, 0.35, 1);
const TYPE_IN = Easing.bezier(0.32, 0.72, 0, 1);
const STAIR = { mass: 0.8, damping: 18, stiffness: 160 };

export type BandOpenProps = {
  center?: number;
  band?: number;
  openUntil?: number;
  expandFrom?: number;
  push?: number;
  dim?: number;
  edge?: string;
  parallax?: number;
};

export const bandOpenDefaults: Required<BandOpenProps> = {
  center: 0.5,
  band: 0.24,
  openUntil: 0.3,
  expandFrom: 0.5,
  push: 0.06,
  dim: 0.45,
  edge: "rgba(255,255,255,0.42)",
  parallax: 0.05,
};

const BandOpenPresentation: React.FC<
  TransitionPresentationComponentProps<BandOpenProps>
> = ({
  children,
  presentationProgress,
  presentationDirection,
  passedProps,
}) => {
  const { width: W, height: H } = useVideoConfig();
  const o = { ...bandOpenDefaults, ...passedProps };
  const p = presentationProgress;
  const u = Math.min(W, H) / 720;
  const expandAt = Math.min(0.95, Math.max(o.openUntil, o.expandFrom));
  const ex = EXPAND(interpolate(p, [expandAt, 1], [0, 1], CLAMP));

  if (presentationDirection === "exiting") {
    const back = RECEDE(p);
    return (
      <AbsoluteFill
        style={{
          transform: `scale(${1 + o.push * back})`,
          filter:
            back > 0
              ? `brightness(${1 - o.dim * (0.35 * back + 0.65 * ex)}) blur(${3 * ex}px)`
              : undefined,
        }}
      >
        {children}
      </AbsoluteFill>
    );
  }

  const cy = H * o.center;
  const open = OPEN(interpolate(p, [0, o.openUntil], [0, 1], CLAMP));
  const breathe = interpolate(p, [o.openUntil, expandAt], [0, 1], {
    ...CLAMP,
    easing: Easing.bezier(0.45, 0, 0.55, 1),
  });
  const bandH = H * o.band * open * (1 + 0.06 * breathe);
  const top = cy - bandH / 2 + (0 - (cy - bandH / 2)) * ex;
  const bottom = cy + bandH / 2 + (H - (cy + bandH / 2)) * ex;
  const h = Math.max(0, bottom - top);
  const settle = SETTLE(p);
  const scale = 1 + o.parallax * (1 - settle);
  const drift = W * o.parallax * 0.6 * (1 - settle);
  const edgeOn = (1 - ex) * Math.min(1, open * 3);

  return (
    <AbsoluteFill style={{ zIndex: 2 }}>
      {h > 0.5 ? (
        <div
          style={{
            position: "absolute",
            left: 0,
            top,
            width: W,
            height: h,
            overflow: "hidden",
            boxShadow:
              edgeOn > 0
                ? `0 ${-18 * u}px ${48 * u}px rgba(0,0,0,${0.4 * edgeOn}), 0 ${18 * u}px ${48 * u}px rgba(0,0,0,${0.4 * edgeOn})`
                : undefined,
          }}
        >
          <div
            style={{
              position: "absolute",
              left: 0,
              top: -top,
              width: W,
              height: H,
              transformOrigin: `50% ${cy}px`,
              transform: `translateX(${drift}px) scale(${scale})`,
            }}
          >
            {children}
          </div>
          {edgeOn > 0 ? (
            <>
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  top: 0,
                  height: Math.max(1, u),
                  background: o.edge,
                  opacity: edgeOn,
                }}
              />
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  bottom: 0,
                  height: Math.max(1, u),
                  background: o.edge,
                  opacity: edgeOn,
                }}
              />
            </>
          ) : null}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

export function bandOpen(
  props: BandOpenProps = {},
): TransitionPresentation<BandOpenProps> {
  return { component: BandOpenPresentation, props };
}

const THEMES = {
  dark: {
    base: "#05060c",
    ink: "#eef0f8",
    hair: "rgba(238,240,248,0.10)",
    ground: "velvet-hour" as GshPresetId | undefined,
    groundParams: undefined as Partial<GradientParams> | undefined,
    groundOffset: 6,
    veil: "rgba(5,6,12,0.28)",
  },
  light: {
    base: "#f1f1f4",
    ink: "#14151c",
    hair: "rgba(20,21,28,0.10)",
    ground: "paper-crease" as GshPresetId | undefined,
    groundParams: undefined as Partial<GradientParams> | undefined,
    groundOffset: 3,
    veil: "rgba(241,241,244,0.18)",
  },
};

type Theme = (typeof THEMES)["dark"];

export const BAND_OPEN_TIMING = { a: 78, transition: 36, b: 84 };
export const bandOpenDemoLength =
  BAND_OPEN_TIMING.a + BAND_OPEN_TIMING.b - BAND_OPEN_TIMING.transition;

function lineSize(W: number, H: number, line: string) {
  const em = Math.max(4, line.length * 0.5);
  return Math.min(H * 0.165, (W * 0.64) / em);
}

function strips(H: number, F: number) {
  const center = 1.5 * F;
  const ladder = [0.86, 0.72, 0.62, 0.56, 0.52, 0.5];
  const out = [{ k: 0, top: H / 2 - center / 2, h: center }];
  let up = H / 2 - center / 2;
  let down = H / 2 + center / 2;
  let i = 0;
  while (up > 0 || down < H) {
    const s = ladder[Math.min(i, ladder.length - 1)] * F;
    i++;
    out.push({ k: -i, top: up - s, h: s });
    out.push({ k: i, top: down, h: s });
    up -= s;
    down += s;
  }
  return out;
}

function StackScene({
  c,
  line,
  ground,
  groundParams,
}: {
  c: Theme;
  line: string;
  ground?: GshPresetId;
  groundParams?: Partial<GradientParams>;
}) {
  const frame = useCurrentFrame();
  const { width: W, height: H, fps } = useVideoConfig();
  const F = lineSize(W, H, line);
  const rows = strips(H, F);
  const push = interpolate(frame, [0, 110], [1, 1.03], {
    ...CLAMP,
    easing: Easing.bezier(0.45, 0, 0.55, 1),
  });
  return (
    <AbsoluteFill style={{ background: c.base, overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: `scale(${push})` }}>
        <GshGround
          preset={ground}
          params={groundParams}
          timeOffset={c.groundOffset}
        />
      </AbsoluteFill>
      <AbsoluteFill style={{ background: c.veil }} />
      {rows.map((r) => {
        const d = Math.abs(r.k);
        const rise = TYPE_IN(
          interpolate(frame, [-5 + 2 * d, 9 + 2 * d], [0, 1], CLAMP),
        );
        const stair = spring({ frame: frame - 2 - d, fps, config: STAIR });
        const drift = (r.k % 2 === 0 ? 1 : -1) * frame * 0.0004 * W;
        const x =
          Math.sign(r.k) * Math.min(d, 5) * W * 0.05 * stair +
          (r.k === 0 ? 0 : drift);
        const fade = [1, 0.78, 0.58, 0.44, 0.34, 0.26, 0.2, 0.15][
          Math.min(d, 7)
        ];
        return (
          <div
            key={r.k}
            style={{
              position: "absolute",
              left: 0,
              width: W,
              top: r.top,
              height: r.h,
              overflow: "hidden",
              borderTop: r.k <= 0 ? `1px solid ${c.hair}` : undefined,
              borderBottom: r.k >= 0 ? `1px solid ${c.hair}` : undefined,
              transform: `scale(${push})`,
              transformOrigin: `50% ${H / 2 - r.top}px`,
            }}
          >
            <div
              style={{
                position: "absolute",
                left: 0,
                width: W,
                top: r.h / 2 - F * 0.62,
                height: F * 1.24,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: sans.fontFamily,
                fontWeight: 400,
                fontSize: F,
                letterSpacing: "-0.04em",
                lineHeight: 1,
                whiteSpace: "nowrap",
                color: c.ink,
                opacity: fade,
                filter: d >= 2 ? `blur(${(d - 1) * 0.6}px)` : undefined,
                transform: `translate(${x}px, ${(1 - rise) * (r.h / 2 + F * 0.95)}px)`,
              }}
            >
              {line}
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
}

function PhotoScene({
  line,
  src,
  meta,
  start,
}: {
  line: string;
  src: string;
  meta: string;
  start: number;
}) {
  const frame = useCurrentFrame();
  const { width: W, height: H } = useVideoConfig();
  const u = Math.min(W, H) / 720;
  const F = lineSize(W, H, line);
  const push = interpolate(frame, [0, 120], [1.02, 1.07], {
    ...CLAMP,
    easing: Easing.bezier(0.45, 0, 0.55, 1),
  });
  const metaIn = TYPE_IN(
    interpolate(frame, [start, start + 14], [0, 1], CLAMP),
  );
  const tagIn = TYPE_IN(interpolate(frame, [4, 16], [0, 1], CLAMP));
  return (
    <AbsoluteFill style={{ background: "#0b0d10", overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: `scale(${push})` }}>
        <Img
          src={src.startsWith("http") ? src : staticFile(src)}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </AbsoluteFill>
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(180deg, rgba(6,10,14,0.10) 0%, rgba(6,10,14,0.34) 38%, rgba(6,10,14,0.38) 50%, rgba(6,10,14,0.30) 62%, rgba(6,10,14,0.42) 100%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 0,
          width: W,
          top: H / 2 - F * 0.62,
          height: F * 1.24,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            position: "relative",
            fontFamily: sans.fontFamily,
            fontWeight: 400,
            fontSize: F,
            letterSpacing: "-0.04em",
            lineHeight: 1,
            whiteSpace: "nowrap",
            color: "#ffffff",
            textShadow: "0 2px 30px rgba(0,0,0,0.25)",
          }}
        >
          {line}
          <div
            style={{
              position: "absolute",
              left: "100%",
              top: "50%",
              marginLeft: 0.16 * F,
              transform: `translate(${(1 - tagIn) * -10 * u}px, -40%)`,
              opacity: tagIn,
            }}
          >
            <RemocnLogo fontSize={Math.max(14 * u, 0.2 * F)} color="#ffffff" />
          </div>
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          left: 0,
          width: W,
          top: H / 2 + F * 0.95,
          display: "flex",
          justifyContent: "center",
          fontFamily: mono.fontFamily,
          fontWeight: 400,
          fontSize: 17 * u,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          color: "rgba(255,255,255,0.84)",
          opacity: metaIn,
          transform: `translateY(${(1 - metaIn) * 12 * u}px)`,
        }}
      >
        {meta}
      </div>
    </AbsoluteFill>
  );
}

export interface BandOpenDemoProps extends BandOpenProps {
  theme?: "dark" | "light";
  line?: string;
  src?: string;
  meta?: string;
  ground?: GshPresetId;
  groundParams?: Partial<GradientParams>;
  transitionFrames?: number;
}

export function BandOpen({
  theme = "dark",
  line = "Launch day",
  src = "reel/reel-2.jpg",
  meta = "Thursday · 09:00 · remocn.dev",
  ground,
  groundParams,
  transitionFrames = BAND_OPEN_TIMING.transition,
  band,
  ...rest
}: BandOpenDemoProps) {
  const { width: W, height: H } = useVideoConfig();
  const c = THEMES[theme];
  const preset = ground ?? (groundParams ? undefined : c.ground);
  const bandShare = band ?? (1.5 * lineSize(W, H, line)) / H;
  return (
    <AbsoluteFill style={{ background: c.base }}>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={BAND_OPEN_TIMING.a}>
          <StackScene
            c={c}
            line={line}
            ground={preset}
            groundParams={groundParams ?? c.groundParams}
          />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={bandOpen({ ...rest, band: bandShare })}
          timing={linearTiming({ durationInFrames: transitionFrames })}
        />
        <TransitionSeries.Sequence durationInFrames={BAND_OPEN_TIMING.b}>
          <PhotoScene
            line={line}
            src={src}
            meta={meta}
            start={transitionFrames - 4}
          />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
}
