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
import { useId } from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  random,
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

export type LightBurnToLineProps = {
  origin?: "right" | "left";
  subject?: [number, number, number, number];
  to?: [number, number];
  lineWidth?: number;
  lineHeight?: number;
  light?: string;
  bloom?: string;
  sink?: string;
  count?: number;
  seed?: number;
};

export const lightBurnToLineDefaults: Required<LightBurnToLineProps> = {
  origin: "right",
  subject: [0.16, 0.15, 0.68, 0.7],
  to: [0.5, 0.5],
  lineWidth: 0.6,
  lineHeight: 0.1,
  light: "#ffffff",
  bloom: "#8fb4ff",
  sink: "#01030c",
  count: 24,
  seed: 3,
};

type Blob = { x: number; y: number; r: number };
type Knot = readonly [number, number, number];

const mix = (a: number, b: number, t: number) => a + (b - a) * t;

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

function hermite(x: number, knots: readonly Knot[]) {
  if (x <= knots[0][0]) {
    return knots[0][1];
  }
  for (let i = 1; i < knots.length; i++) {
    const [x0, y0, m0] = knots[i - 1];
    const [x1, y1, m1] = knots[i];
    if (x <= x1) {
      const h = x1 - x0;
      const t = (x - x0) / h;
      const t2 = t * t;
      const t3 = t2 * t;
      return (
        (2 * t3 - 3 * t2 + 1) * y0 +
        (t3 - 2 * t2 + t) * h * m0 +
        (3 * t2 - 2 * t3) * y1 +
        (t3 - t2) * h * m1
      );
    }
  }
  return knots[knots.length - 1][1];
}

const BURN = {
  sweepEnd: 0.34,
  travelIn: 0.18,
  gather: 0.5,
  travelOut: 0.9,
  revealIn: 0.58,
  darkEnd: 0.56,
} as const;

const SWEEP: readonly Knot[] = [
  [0, 0, 1.2],
  [BURN.sweepEnd, 1, 0],
];

const TRAVEL: readonly Knot[] = [
  [BURN.travelIn, 0, 0],
  [BURN.gather, 0.5, 1.6],
  [BURN.travelOut, 1, 0],
];

function burnState(
  p: number,
  W: number,
  H: number,
  o: Required<LightBurnToLineProps>,
) {
  const eat = hermite(p, SWEEP);
  const travel = hermite(p, TRAVEL);
  const reveal = smooth(0.42, 0.96, travel);
  const fade = smooth(BURN.revealIn, 1, p);
  const dark = smooth(0, BURN.darkEnd, p);
  const [sx, sy, sw, sh] = o.subject;
  const wx = sx * W;
  const wy = sy * H;
  const ww = sw * W;
  const wh = sh * H;
  const dir = o.origin === "left" ? -1 : 1;
  const edge = dir > 0 ? wx + ww : wx;
  const cx = o.to[0] * W;
  const cy = o.to[1] * H;
  const lw = o.lineWidth * W;
  const lh = o.lineHeight * H;
  const n = Math.max(4, o.count);
  const keys = Array.from({ length: n }, (_, j) =>
    random(`burn-u-${o.seed}-${j}`),
  );
  const blobs: Blob[] = [];
  for (let i = 0; i < n; i++) {
    const rank = keys.filter((q) => q < keys[i]).length;
    const u = (rank + 0.5 + (random(`burn-j-${o.seed}-${i}`) - 0.5) * 0.6) / n;
    const v = random(`burn-v-${o.seed}-${i}`);
    const s = random(`burn-s-${o.seed}-${i}`);
    const depth = u ** 1.25 * 0.8;
    const grow = smooth(depth * 0.7, depth * 0.7 + 0.4, eat);
    const k = hermite(p + 0.03 - s * 0.06, TRAVEL);
    const x0 = edge - dir * ww * depth + dir * ww * 0.04;
    const y0 = wy + wh * (0.16 + 0.68 * v);
    const xc = cx + (v - 0.5) * lh * 1.4;
    const yc = cy + (u - 0.5) * lh * 0.8;
    const t = n === 1 ? 0.5 : i / (n - 1);
    const xl = cx + (t - 0.5) * lw * 0.94;
    const yl = cy + (s - 0.5) * lh * 0.16;
    const a = (1 - k) ** 3;
    const bc = 3 * k * (1 - k);
    const d = k ** 3;
    const r0 = (0.13 + 0.11 * s) * wh;
    const rc = lh * (0.7 + 0.5 * s);
    const rl = lh * (0.42 + 0.22 * s);
    const rMid = 2 * rc - 0.5 * (r0 + rl);
    const r = (1 - k) ** 2 * r0 + 2 * k * (1 - k) * rMid + k * k * rl;
    blobs.push({
      x: a * x0 + bc * xc + d * xl,
      y: a * y0 + bc * yc + d * yl,
      r: r * grow * (1 + fade * 0.35),
    });
  }
  return { eat, travel, reveal, fade, dark, blobs, dir };
}

function blobMask(blobs: Blob[], spread: number, alpha: number, full: number) {
  const layers = blobs.map(
    (b) =>
      `radial-gradient(circle at ${b.x.toFixed(1)}px ${b.y.toFixed(1)}px, rgba(0,0,0,${alpha.toFixed(3)}) ${(b.r * 0.55).toFixed(1)}px, rgba(0,0,0,0) ${(b.r * spread).toFixed(1)}px)`,
  );
  layers.push(
    `linear-gradient(rgba(0,0,0,${full.toFixed(3)}), rgba(0,0,0,${full.toFixed(3)}))`,
  );
  return layers.join(", ");
}

function SoftDiscs({
  blobs,
  color,
  core,
  scale,
  alpha,
  W,
  H,
}: {
  blobs: Blob[];
  color: string;
  core: number;
  scale: number;
  alpha: number;
  W: number;
  H: number;
}) {
  const id = `burn-soft-${useId().replace(/:/g, "")}`;
  return (
    <svg
      width={W}
      height={H}
      style={{
        position: "absolute",
        inset: 0,
        opacity: alpha,
        mixBlendMode: "screen",
        pointerEvents: "none",
      }}
    >
      <defs>
        <radialGradient id={id}>
          <stop offset={0} stopColor={color} stopOpacity={1} />
          <stop offset={core} stopColor={color} stopOpacity={0.92} />
          <stop
            offset={mix(core, 1, 0.45)}
            stopColor={color}
            stopOpacity={0.38}
          />
          <stop offset={1} stopColor={color} stopOpacity={0} />
        </radialGradient>
      </defs>
      {blobs.map((b, i) =>
        b.r > 0.5 ? (
          <circle
            key={`soft-${i.toString()}`}
            cx={b.x}
            cy={b.y}
            r={b.r * scale}
            fill={`url(#${id})`}
          />
        ) : null,
      )}
    </svg>
  );
}

const GOO_RES = 0.5;

function LightMass({
  blobs,
  alpha,
  light,
  bloom,
  W,
  H,
  blur,
  seed,
  gather,
}: {
  gather: number;
  seed: number;
  blobs: Blob[];
  alpha: number;
  light: string;
  bloom: string;
  W: number;
  H: number;
  blur: number;
}) {
  const raw = useId().replace(/:/g, "");
  const gooId = `burn-goo-${raw}`;
  const soft = Math.max(4, H * 0.03);
  if (alpha <= 0.002) {
    return null;
  }
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <SoftDiscs
        blobs={blobs}
        color={bloom}
        core={0.2}
        scale={2.3}
        alpha={alpha * 0.75}
        W={W}
        H={H}
      />
      <svg
        width={W * GOO_RES}
        height={H * GOO_RES}
        viewBox={`0 0 ${W} ${H}`}
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          transform: `scale(${1 / GOO_RES})`,
          transformOrigin: "0 0",
          opacity: alpha * mix(0.9, 1, gather),
        }}
      >
        <defs>
          <filter
            id={gooId}
            x="-30%"
            y="-30%"
            width="160%"
            height="160%"
            colorInterpolationFilters="sRGB"
          >
            <feGaussianBlur in="SourceGraphic" stdDeviation={soft} result="b" />
            <feColorMatrix
              in="b"
              type="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 5 -1.6"
              result="g"
            />
            <feTurbulence
              type="fractalNoise"
              baseFrequency={(2.4 / H).toFixed(5)}
              numOctaves={2}
              seed={seed}
              result="n"
            />
            <feDisplacementMap
              in="g"
              in2="n"
              scale={H * 0.07}
              xChannelSelector="R"
              yChannelSelector="G"
              result="d"
            />
            <feGaussianBlur
              in="d"
              stdDeviation={(soft * 0.22 + blur).toFixed(2)}
            />
          </filter>
        </defs>
        <g filter={`url(#${gooId})`}>
          {blobs.map((b, i) =>
            b.r > 0.5 ? (
              <circle
                key={`core-${i.toString()}`}
                cx={b.x}
                cy={b.y}
                r={b.r * mix(0.72, 1, gather)}
                fill={light}
              />
            ) : null,
          )}
        </g>
      </svg>
    </AbsoluteFill>
  );
}

const LightBurnToLinePresentation: React.FC<
  TransitionPresentationComponentProps<LightBurnToLineProps>
> = ({
  children,
  presentationProgress,
  presentationDirection,
  passedProps,
}) => {
  const { width: W, height: H } = useVideoConfig();
  const o = { ...lightBurnToLineDefaults, ...passedProps };
  const s = burnState(presentationProgress, W, H, o);

  if (presentationDirection === "exiting") {
    const dim = 1 - 0.55 * s.dark - 0.45 * smooth(0, 0.6, s.travel);
    const zoom = 1 - 0.03 * s.dark - 0.035 * s.travel;
    const halo = smooth(0, 0.3, s.eat) * (1 - smooth(0.15, 0.7, s.travel));
    return (
      <AbsoluteFill style={{ backgroundColor: o.sink }}>
        <AbsoluteFill
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: `${o.to[0] * 100}% ${o.to[1] * 100}%`,
            opacity: dim,
          }}
        >
          {children}
        </AbsoluteFill>
        <AbsoluteFill
          style={{
            background: `linear-gradient(${s.dir > 0 ? 90 : 270}deg, ${o.sink} 0%, ${o.sink} 12%, transparent 68%)`,
            opacity: 0.85 * s.dark,
          }}
        />
        {halo > 0.002 ? (
          <SoftDiscs
            blobs={s.blobs}
            color={o.light}
            core={0.29}
            scale={2.4}
            alpha={halo * 0.85}
            W={W}
            H={H}
          />
        ) : null}
      </AbsoluteFill>
    );
  }

  const heat = 1 - s.fade;
  const alpha = (1 - s.fade) * (1 - 0.5 * s.reveal);
  const mask =
    s.fade < 0.999 ? blobMask(s.blobs, 1.3, s.reveal, s.fade) : undefined;
  const prev = burnState(
    Math.max(0, presentationProgress - 1 / 30),
    W,
    H,
    o,
  ).blobs;
  const speed =
    s.blobs.reduce(
      (acc, b, i) => acc + Math.hypot(b.x - prev[i].x, b.y - prev[i].y),
      0,
    ) / s.blobs.length;

  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ maskImage: mask, WebkitMaskImage: mask }}>
        <AbsoluteFill
          style={{
            filter:
              heat > 0.002
                ? `brightness(${(1 + 1.4 * heat).toFixed(3)})`
                : undefined,
          }}
        >
          {children}
        </AbsoluteFill>
      </AbsoluteFill>
      <LightMass
        blobs={s.blobs}
        alpha={alpha}
        light={o.light}
        bloom={o.bloom}
        W={W}
        H={H}
        blur={Math.min(4, speed / 8)}
        seed={o.seed}
        gather={smooth(0.1, 0.5, s.travel)}
      />
    </AbsoluteFill>
  );
};

export function lightBurnToLine(
  props: LightBurnToLineProps = {},
): TransitionPresentation<LightBurnToLineProps> {
  return { component: LightBurnToLinePresentation, props };
}

type Palette = {
  ink: string;
  muted: string;
  accent: string;
  windowBg: string;
  sidebar: string;
  sideInk: string;
  sideMuted: string;
  page: string;
  pageInk: string;
  pageMuted: string;
  hairline: string;
  shadow: string;
  chip: string;
  pill: string;
  light: string;
  bloom: string;
  sink: string;
  groundA: Partial<GradientParams>;
  groundB: Partial<GradientParams>;
};

const THEMES: Record<"dark" | "light", Palette> = {
  dark: {
    ink: "#f2f5ff",
    muted: "rgba(220,228,255,0.6)",
    accent: "#3b5bfd",
    windowBg: "#0d1018",
    sidebar: "#0f131d",
    sideInk: "#e6ebf7",
    sideMuted: "rgba(214,222,240,0.52)",
    page: "#f4efe4",
    pageInk: "#1d1a16",
    pageMuted: "rgba(29,26,22,0.56)",
    hairline: "rgba(255,255,255,0.09)",
    shadow: "0,4,20",
    chip: "rgba(255,255,255,0.07)",
    pill: "rgba(14,18,30,0.6)",
    light: "#ffffff",
    bloom: "#8fb4ff",
    sink: "#01030c",
    groundA: {
      kind: "mist",
      colors: ["#9cc0ff", "#2f6bff", "#1238b8", "#030a2a"],
      background: "#010414",
      speed: 0.7,
      loopSeconds: 16,
      scale: 0.85,
      warp: 0.4,
      blur: 0.75,
      grain: 0.12,
      seed: 7,
    },
    groundB: {
      kind: "mist",
      colors: ["#3a6cff", "#1438b0", "#071650", "#01030c"],
      background: "#010208",
      speed: 0.6,
      loopSeconds: 16,
      scale: 0.7,
      warp: 0.35,
      blur: 0.8,
      grain: 0.12,
      seed: 21,
    },
  },
  light: {
    ink: "#12141a",
    muted: "rgba(18,20,26,0.56)",
    accent: "#2f4ff0",
    windowBg: "#ffffff",
    sidebar: "#f6f6f4",
    sideInk: "#1a1c22",
    sideMuted: "rgba(26,28,34,0.5)",
    page: "#fbf8f1",
    pageInk: "#1d1a16",
    pageMuted: "rgba(29,26,22,0.56)",
    hairline: "rgba(20,24,40,0.1)",
    shadow: "30,40,90",
    chip: "rgba(20,24,40,0.05)",
    pill: "rgba(255,255,255,0.72)",
    light: "#ffffff",
    bloom: "#c4d2ff",
    sink: "#7f90d2",
    groundA: {
      kind: "mist",
      colors: ["#3d5cf5", "#7f98ff", "#c9d4ff", "#1f2f9e"],
      background: "#aebcf2",
      speed: 0.7,
      loopSeconds: 16,
      scale: 0.85,
      warp: 0.4,
      blur: 0.7,
      grain: 0.18,
      seed: 7,
    },
    groundB: {
      kind: "mist",
      colors: ["#8ea4ff", "#c6d1ff", "#e9ecfa", "#5a72e6"],
      background: "#f1f0ec",
      speed: 0.6,
      loopSeconds: 16,
      scale: 0.8,
      warp: 0.35,
      blur: 0.75,
      grain: 0.24,
      seed: 11,
    },
  },
};

const A_LEN = 78;
const B_LEN = 84;
const T_LEN = 36;
export const LIGHT_BURN_TO_LINE_DURATION = A_LEN + B_LEN - T_LEN;

const A_BEATS = { window: 0, chat: 6, check: 18, photos: 24 } as const;
const B_BEATS = { line: 12, settle: 34, pill: 42 } as const;

const ENTER = Easing.bezier(0.32, 0.72, 0, 1);
const CARD = { mass: 0.8, damping: 18, stiffness: 160 };
const HEAVY = { mass: 1, damping: 26, stiffness: 120 };
const CHIP = { mass: 0.5, damping: 12, stiffness: 200 };

function layout(W: number, H: number) {
  const tall = H > W * 1.1;
  if (tall) {
    return {
      tall,
      subject: [0.06, 0.2, 0.88, 0.56] as [number, number, number, number],
      to: [0.5, 0.47] as [number, number],
      lineWidth: 0.78,
      lineHeight: 0.13,
    };
  }
  return {
    tall,
    subject: [0.14, 0.13, 0.72, 0.74] as [number, number, number, number],
    to: [0.5, 0.47] as [number, number],
    lineWidth: 0.66,
    lineHeight: 0.12,
  };
}

function Icon({ d, size, color }: { d: string; size: number; color: string }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden>
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const ICONS = {
  back: "M15 6l-6 6 6 6",
  fwd: "M9 6l6 6-6 6",
  lock: "M7 11V8a5 5 0 0110 0v3M6 11h12v9H6z",
  check: "M5 12.5l4.5 4.5L19 7.5",
  send: "M12 19V5M6 11l6-6 6 6",
  plus: "M12 5v14M5 12h14",
};

function SceneA({
  palette,
  ground,
  groundParams,
}: {
  palette: Palette;
  ground?: GshPresetId;
  groundParams?: Partial<GradientParams>;
}) {
  const frame = useCurrentFrame();
  const { width: W, height: H, fps } = useVideoConfig();
  const L = layout(W, H);
  const [sx, sy, sw, sh] = L.subject;
  const u = Math.min(W, H) / 720;
  const lift = spring({ frame: frame - A_BEATS.window, fps, config: HEAVY });
  const push = interpolate(frame, [0, A_LEN], [1, 1.035], CLAMP);
  const chat = interpolate(frame, [A_BEATS.chat, A_BEATS.chat + 12], [0, 1], {
    ...CLAMP,
    easing: ENTER,
  });
  const check = spring({ frame: frame - A_BEATS.check, fps, config: CHIP });
  const photos = [0, 1, 2].map((i) =>
    spring({ frame: frame - A_BEATS.photos - i * 3, fps, config: CARD }),
  );
  const sideW = L.tall ? 0 : sw * W * 0.3;
  const fs = 15.5 * u;
  const pagePad = (L.tall ? 26 : 24) * u;

  return (
    <AbsoluteFill>
      <GshGround
        preset={ground}
        params={ground ? groundParams : { ...palette.groundA, ...groundParams }}
        timeOffset={5}
        timeScale={0.7}
      />
      <AbsoluteFill style={{ transform: `scale(${push})` }}>
        <div
          style={{
            position: "absolute",
            left: sx * W,
            top: sy * H,
            width: sw * W,
            height: sh * H,
            borderRadius: 14 * u,
            overflow: "hidden",
            backgroundColor: palette.windowBg,
            fontFamily: geist.fontFamily,
            transform: `translateY(${(1 - lift) * 40 * u}px) scale(${0.96 + 0.04 * lift})`,
            opacity: interpolate(lift, [0, 0.3], [0, 1], CLAMP),
            boxShadow: `0 1px 2px rgba(${palette.shadow},0.3), 0 18px 40px rgba(${palette.shadow},0.35), 0 50px 110px rgba(${palette.shadow},0.45), inset 0 0 0 1px ${palette.hairline}`,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              height: 44 * u,
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              gap: 10 * u,
              padding: `0 ${14 * u}px`,
              borderBottom: `1px solid ${palette.hairline}`,
              backgroundColor: palette.sidebar,
            }}
          >
            {["#ff6159", "#ffbd2e", "#28c941"].map((c) => (
              <div
                key={c}
                style={{
                  width: 10 * u,
                  height: 10 * u,
                  borderRadius: 99,
                  backgroundColor: c,
                  opacity: 0.85,
                }}
              />
            ))}
            <div style={{ display: "flex", gap: 4 * u, marginLeft: 8 * u }}>
              <Icon d={ICONS.back} size={16 * u} color={palette.sideMuted} />
              <Icon d={ICONS.fwd} size={16 * u} color={palette.sideMuted} />
            </div>
            <div
              style={{
                flex: 1,
                display: "flex",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6 * u,
                  padding: `${5 * u}px ${14 * u}px`,
                  borderRadius: 8 * u,
                  backgroundColor: palette.chip,
                  color: palette.sideMuted,
                  fontSize: fs,
                }}
              >
                <Icon d={ICONS.lock} size={12 * u} color={palette.sideMuted} />
                lumen.app/launch
              </div>
            </div>
            <div
              style={{
                padding: `${6 * u}px ${12 * u}px`,
                borderRadius: 8 * u,
                backgroundColor: palette.accent,
                color: "#fff",
                fontSize: fs,
                fontWeight: 400,
              }}
            >
              Publish
            </div>
          </div>
          <div style={{ flex: 1, display: "flex", minHeight: 0 }}>
            {L.tall ? null : (
              <div
                style={{
                  width: sideW,
                  flexShrink: 0,
                  backgroundColor: palette.sidebar,
                  borderRight: `1px solid ${palette.hairline}`,
                  padding: 14 * u,
                  display: "flex",
                  flexDirection: "column",
                  gap: 10 * u,
                  color: palette.sideInk,
                  fontSize: fs,
                }}
              >
                <div
                  style={{
                    alignSelf: "flex-end",
                    maxWidth: "88%",
                    padding: `${8 * u}px ${11 * u}px`,
                    borderRadius: 10 * u,
                    backgroundColor: palette.chip,
                    boxShadow: `inset 0 0 0 1px ${palette.hairline}`,
                    lineHeight: 1.35,
                    opacity: chat,
                    transform: `translateY(${(1 - chat) * 10 * u}px)`,
                  }}
                >
                  Make the hero calmer and add the product shots.
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 7 * u,
                    color: palette.sideMuted,
                    opacity: chat,
                  }}
                >
                  {[
                    "Softened the headline",
                    "Added 3 product shots",
                    "Tuned the type scale",
                  ].map((t, i) => (
                    <div
                      key={t}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 7 * u,
                        opacity: interpolate(
                          check,
                          [i * 0.2, i * 0.2 + 0.4],
                          [0, 1],
                          CLAMP,
                        ),
                      }}
                    >
                      <div
                        style={{
                          width: 16 * u,
                          height: 16 * u,
                          borderRadius: 99,
                          backgroundColor: "rgba(59,91,253,0.18)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          transform: `scale(${0.6 + 0.4 * check})`,
                        }}
                      >
                        <Icon d={ICONS.check} size={11 * u} color="#7d97ff" />
                      </div>
                      {t}
                    </div>
                  ))}
                </div>
                <div style={{ flex: 1 }} />
                <div
                  style={{
                    borderRadius: 10 * u,
                    boxShadow: `inset 0 0 0 1px ${palette.hairline}`,
                    padding: 10 * u,
                    display: "flex",
                    flexDirection: "column",
                    gap: 10 * u,
                    color: palette.sideMuted,
                  }}
                >
                  Ask for a change…
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Icon
                      d={ICONS.plus}
                      size={15 * u}
                      color={palette.sideMuted}
                    />
                    <div
                      style={{
                        width: 22 * u,
                        height: 22 * u,
                        borderRadius: 99,
                        backgroundColor: palette.accent,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Icon d={ICONS.send} size={13 * u} color="#fff" />
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div
              style={{
                flex: 1,
                backgroundColor: palette.page,
                padding: pagePad,
                display: "flex",
                flexDirection: "column",
                gap: 14 * u,
                color: palette.pageInk,
                minWidth: 0,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  fontSize: fs,
                  color: palette.pageMuted,
                }}
              >
                <div
                  style={{
                    fontFamily: serif.fontFamily,
                    fontStyle: "italic",
                    fontSize: 20 * u,
                    color: palette.pageInk,
                  }}
                >
                  Lumen
                </div>
                <div
                  style={{ display: "flex", gap: 14 * u, alignItems: "center" }}
                >
                  {L.tall ? null : (
                    <>
                      <span>Product</span>
                      <span>Stories</span>
                      <span>Pricing</span>
                    </>
                  )}
                  <span
                    style={{
                      padding: `${5 * u}px ${11 * u}px`,
                      borderRadius: 99,
                      backgroundColor: "#c2412d",
                      color: "#fff",
                    }}
                  >
                    Get early access
                  </span>
                </div>
              </div>
              <div
                style={{
                  fontFamily: serif.fontFamily,
                  fontStyle: "italic",
                  fontSize: (L.tall ? 50 : 42) * u,
                  lineHeight: 1,
                  letterSpacing: "-0.02em",
                  marginTop: 8 * u,
                }}
              >
                Your next launch,
                <br />
                already in motion.
              </div>
              <div
                style={{
                  display: "flex",
                  gap: 8 * u,
                  fontSize: 14.5 * u,
                  color: palette.pageMuted,
                }}
              >
                {["Teaser", "Walkthrough", "Changelog", "Cutdowns"].map(
                  (t, i) => (
                    <span
                      key={t}
                      style={{
                        padding: `${4 * u}px ${10 * u}px`,
                        borderRadius: 99,
                        backgroundColor:
                          i === 0 ? palette.pageInk : "rgba(29,26,22,0.06)",
                        color: i === 0 ? palette.page : palette.pageMuted,
                      }}
                    >
                      {t}
                    </span>
                  ),
                )}
              </div>
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  gap: 10 * u,
                  minHeight: 0,
                }}
              >
                {[
                  "templates/product-showcase/sculpture.jpg",
                  "templates/launch-anything/horizon.jpg",
                  "templates/brand-guidelines/ceramics.jpg",
                ].map((src, i) => (
                  <div
                    key={src}
                    style={{
                      flex: i === 1 ? 1.25 : 1,
                      borderRadius: 10 * u,
                      overflow: "hidden",
                      position: "relative",
                      opacity: interpolate(photos[i], [0, 0.35], [0, 1], CLAMP),
                      transform: `translateY(${(1 - photos[i]) * 24 * u}px)`,
                      boxShadow:
                        "0 1px 2px rgba(0,0,0,0.12), 0 10px 24px rgba(0,0,0,0.12)",
                    }}
                  >
                    <Img
                      src={staticFile(src)}
                      style={{
                        position: "absolute",
                        inset: 0,
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        transform: `scale(${1.1 - 0.1 * photos[i]})`,
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}

function SceneB({
  line,
  cta,
  url,
  palette,
  ground,
  groundParams,
}: {
  line: string;
  cta: string;
  url: string;
  palette: Palette;
  ground?: GshPresetId;
  groundParams?: Partial<GradientParams>;
}) {
  const frame = useCurrentFrame();
  const { width: W, height: H, fps } = useVideoConfig();
  const L = layout(W, H);
  const u = Math.min(W, H) / 720;
  const fs = L.tall ? W * 0.105 : W * 0.06;
  const pu = L.tall ? W / 480 : u;
  const settle = interpolate(frame, [B_BEATS.line, B_BEATS.settle], [0, 1], {
    ...CLAMP,
    easing: Easing.bezier(0.45, 0, 0.25, 1),
  });
  const pill = spring({ frame: frame - B_BEATS.pill, fps, config: CHIP });
  const push = interpolate(frame, [0, B_LEN], [1.02, 1.05], CLAMP);
  const words = line.split(" ");
  const mid = Math.ceil(words.length / 2);

  return (
    <AbsoluteFill>
      <GshGround
        preset={ground}
        params={ground ? groundParams : { ...palette.groundB, ...groundParams }}
        timeOffset={9}
        timeScale={0.6}
      />
      <AbsoluteFill
        style={{
          transform: `scale(${push})`,
          transformOrigin: `${L.to[0] * 100}% ${L.to[1] * 100}%`,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: L.to[1] * H,
            transform: "translateY(-50%)",
            display: "flex",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              fontFamily: geist.fontFamily,
              fontWeight: 300,
              fontSize: fs,
              lineHeight: 1.04,
              color: palette.ink,
              textAlign: "center",
              letterSpacing: `${(0.16 * (1 - settle) - 0.035).toFixed(4)}em`,
              filter:
                settle < 0.99
                  ? `blur(${((1 - settle) * 8 * u).toFixed(2)}px)`
                  : undefined,
              whiteSpace: "nowrap",
            }}
          >
            {L.tall ? (
              <>
                {words.slice(0, mid).join(" ")}
                <br />
                {words.slice(mid).join(" ")}
              </>
            ) : (
              line
            )}
          </div>
        </div>
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: L.to[1] * H + fs * (L.tall ? 1.45 : 0.95),
            display: "flex",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12 * pu,
              padding: `${7 * pu}px ${7 * pu}px ${7 * pu}px ${16 * pu}px`,
              borderRadius: 99,
              backgroundColor: palette.pill,
              boxShadow: `inset 0 0 0 1px ${palette.hairline}, inset 0 1px 0 rgba(255,255,255,0.06), 0 12px 30px rgba(${palette.shadow},0.3)`,
              fontFamily: geist.fontFamily,
              fontSize: 20 * pu,
              color: palette.muted,
              opacity: interpolate(pill, [0, 0.3], [0, 1], CLAMP),
              transform: `translateY(${(1 - pill) * 16 * pu}px) scale(${0.9 + 0.1 * pill})`,
            }}
          >
            <RemocnLogo fontSize={20 * pu} color={palette.ink} />
            <span>{url}</span>
            <span
              style={{
                padding: `${7 * pu}px ${14 * pu}px`,
                borderRadius: 99,
                backgroundColor: palette.accent,
                color: "#fff",
              }}
            >
              {cta}
            </span>
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}

export interface LightBurnToLineDemoProps {
  theme?: "dark" | "light";
  accent?: string;
  line?: string;
  cta?: string;
  url?: string;
  ground?: GshPresetId;
  groundParams?: Partial<GradientParams>;
  groundB?: GshPresetId;
  groundParamsB?: Partial<GradientParams>;
  transition?: LightBurnToLineProps;
}

export function LightBurnToLineDemo({
  theme = "dark",
  accent,
  line = "Now ship your first film.",
  cta = "Start free",
  url = "remocn.dev/new",
  ground,
  groundParams,
  groundB,
  groundParamsB,
  transition,
}: LightBurnToLineDemoProps) {
  const { width: W, height: H } = useVideoConfig();
  const base = THEMES[theme];
  const palette = accent ? { ...base, accent } : base;
  const L = layout(W, H);
  return (
    <AbsoluteFill style={{ backgroundColor: palette.sink }}>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={A_LEN}>
          <SceneA
            palette={palette}
            ground={ground}
            groundParams={groundParams}
          />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={lightBurnToLine({
            subject: L.subject,
            to: L.to,
            lineWidth: L.lineWidth,
            lineHeight: L.lineHeight,
            light: palette.light,
            bloom: palette.bloom,
            sink: palette.sink,
            ...transition,
          })}
          timing={linearTiming({ durationInFrames: T_LEN })}
        />
        <TransitionSeries.Sequence durationInFrames={B_LEN}>
          <SceneB
            line={line}
            cta={cta}
            url={url}
            palette={palette}
            ground={groundB}
            groundParams={groundParamsB}
          />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
}
