"use client";

import { loadFont as loadHanken } from "@remotion/google-fonts/HankenGrotesk";
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
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { GradientParams } from "@/lib/remocn/gsh/gradient-engine";
import { GshGround } from "@/lib/remocn/gsh/gsh-ground";
import type { GshPresetId } from "@/lib/remocn/gsh/presets";

const hanken = loadHanken("normal", {
  weights: ["300", "400"],
  subsets: ["latin"],
});

const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

type Rect = [number, number, number, number];

export type HotSlabMorphProps = {
  from?: Rect;
  to?: Rect;
  fromRadius?: number;
  toRadius?: number;
  hot?: string;
  core?: string;
  deep?: string;
  haze?: Rect | null;
  hazeStrength?: number;
  flood?: number;
  floodBlend?: "screen" | "normal";
  seed?: number;
};

export const hotSlabMorphDefaults: Required<HotSlabMorphProps> = {
  from: [0.32, 0.4, 0.36, 0.42],
  to: [0.25, 0.44, 0.5, 0.2],
  fromRadius: 0.024,
  toRadius: 0.03,
  hot: "#2f62ff",
  core: "#8fb0ff",
  deep: "#1235d6",
  haze: [0.08, 0.2, 0.84, 0.18],
  hazeStrength: 1,
  flood: 0.85,
  floodBlend: "screen",
  seed: 4,
};

const mix = (a: number, b: number, t: number) => a + (b - a) * t;

function slabState(
  p: number,
  frames: number,
  fps: number,
  o: Required<HotSlabMorphProps>,
) {
  const heat = interpolate(p, [0, 0.28], [0, 1], {
    ...CLAMP,
    easing: Easing.bezier(0.32, 0.72, 0, 1),
  });
  const morphX = spring({
    frame: (p - 0.26) * frames,
    fps,
    config: { damping: 200, stiffness: 180, mass: 0.8 },
    durationInFrames: Math.max(2, Math.round(frames * 0.2)),
  });
  const morphY = spring({
    frame: (p - 0.46) * frames,
    fps,
    config: { damping: 200, stiffness: 160, mass: 0.9 },
    durationInFrames: Math.max(2, Math.round(frames * 0.28)),
  });
  const morph = (morphX + morphY) / 2;
  const cool = interpolate(p, [0.7, 1], [0, 1], {
    ...CLAMP,
    easing: Easing.bezier(0.32, 0.72, 0, 1),
  });
  const swap = interpolate(p, [0.45, 0.49], [0, 1], {
    ...CLAMP,
    easing: Easing.bezier(0.65, 0, 0.35, 1),
  });
  const haze = interpolate(p, [0.22, 0.46, 0.8], [0, 1, 0], {
    ...CLAMP,
    easing: Easing.bezier(0.65, 0, 0.35, 1),
  });
  const flood = interpolate(p, [0, 0.42, 1], [0, 1, 0], {
    ...CLAMP,
    easing: Easing.bezier(0.65, 0, 0.35, 1),
  });
  const puff = Math.sin(Math.min(1, heat) * Math.PI) * 0.035 * (1 - morph);
  const rect = [
    mix(o.from[0], o.to[0], morphX),
    mix(o.from[1], o.to[1], morphY),
    mix(o.from[2], o.to[2], morphX),
    mix(o.from[3], o.to[3], morphY),
  ] as Rect;
  const squash =
    (Math.sin(morphX * Math.PI) - Math.sin(morphY * Math.PI)) * 0.03;
  return {
    heat,
    morph,
    cool,
    swap,
    haze,
    flood,
    rect,
    puff,
    squash,
    radius: mix(o.fromRadius, o.toRadius, morph),
  };
}

function HazeFilter({
  id,
  rect,
  W,
  H,
  amount,
  seed,
}: {
  id: string;
  rect: Rect;
  W: number;
  H: number;
  amount: number;
  seed: number;
}) {
  return (
    <svg width={0} height={0} style={{ position: "absolute" }} aria-hidden>
      <defs>
        <filter
          id={id}
          x={0}
          y={0}
          width={W}
          height={H}
          filterUnits="userSpaceOnUse"
          primitiveUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feFlood floodColor="rgb(128,128,128)" result="flat" />
          <feTurbulence
            type="fractalNoise"
            baseFrequency={`${(6 / W).toFixed(5)} ${(40 / H).toFixed(5)}`}
            numOctaves={2}
            seed={seed}
            x={rect[0] * W}
            y={rect[1] * H}
            width={rect[2] * W}
            height={rect[3] * H}
            result="noise"
          />
          <feComposite in="noise" in2="flat" operator="over" result="map" />
          <feDisplacementMap
            in="SourceGraphic"
            in2="map"
            scale={amount * H * 0.045}
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </defs>
    </svg>
  );
}

const HotSlabMorphPresentation: React.FC<
  TransitionPresentationComponentProps<HotSlabMorphProps>
> = ({
  children,
  presentationProgress,
  presentationDirection,
  presentationDurationInFrames,
  passedProps,
}) => {
  const { width: W, height: H, fps } = useVideoConfig();
  const o = { ...hotSlabMorphDefaults, ...passedProps };
  const frames = Math.max(2, presentationDurationInFrames);
  const s = slabState(presentationProgress, frames, fps, o);
  const hazeId = `slab-haze-${useId().replace(/:/g, "")}`;
  const hazeOn = o.haze !== null && s.haze * o.hazeStrength > 0.01;
  const hazeAmt = s.haze * o.hazeStrength;
  const frameSeed = o.seed + Math.floor(presentationProgress * frames * 0.5);
  const haze =
    hazeOn && o.haze ? (
      <HazeFilter
        id={hazeId}
        rect={o.haze}
        W={W}
        H={H}
        amount={hazeAmt}
        seed={frameSeed}
      />
    ) : null;

  if (presentationDirection === "exiting") {
    return (
      <AbsoluteFill>
        {haze}
        <AbsoluteFill
          style={{
            filter: hazeOn ? `url(#${hazeId})` : undefined,
          }}
        >
          {children}
        </AbsoluteFill>
      </AbsoluteFill>
    );
  }

  const m = Math.min(W, H);
  const [rx, ry, rw, rh] = s.rect;
  const sx = 1 + s.puff + s.squash;
  const sy = 1 + s.puff - s.squash * 0.6;
  const cx = (rx + rw / 2) * W;
  const cy = (ry + rh / 2) * H;
  const slabAlpha = s.heat * (1 - s.cool);
  const rim = s.heat * (1 - interpolate(s.cool, [0.3, 1], [0, 1], CLAMP));

  return (
    <AbsoluteFill>
      {haze}
      <AbsoluteFill
        style={{
          opacity: s.swap,
          filter: hazeOn ? `url(#${hazeId})` : undefined,
        }}
      >
        {children}
      </AbsoluteFill>
      <AbsoluteFill
        style={{
          pointerEvents: "none",
          opacity: s.flood * o.flood,
          mixBlendMode: o.floodBlend,
          background: `radial-gradient(${(W * 0.62).toFixed(0)}px ${(H * 0.62).toFixed(0)}px at ${cx.toFixed(1)}px ${cy.toFixed(1)}px, ${o.hot} 0%, ${o.deep}cc 38%, transparent 100%)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: rx * W,
          top: ry * H,
          width: rw * W,
          height: rh * H,
          borderRadius: s.radius * m,
          transform: `scale(${sx.toFixed(4)}, ${sy.toFixed(4)})`,
          opacity: slabAlpha,
          background: `radial-gradient(120% 140% at 50% 0%, ${o.core} 0%, ${o.hot} 46%, ${o.deep} 100%)`,
          boxShadow: `0 0 ${(m * 0.08).toFixed(0)}px ${o.hot}, 0 0 ${(m * 0.22).toFixed(0)}px ${o.deep}aa, inset 0 1px 0 rgba(255,255,255,0.5), inset 0 0 ${(m * 0.04).toFixed(0)}px rgba(255,255,255,0.25)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: rx * W,
          top: ry * H,
          width: rw * W,
          height: rh * H,
          borderRadius: s.radius * m,
          transform: `scale(${sx.toFixed(4)}, ${sy.toFixed(4)})`,
          opacity: rim * (1 - slabAlpha * 0.6),
          boxShadow: `inset 0 0 0 1.5px ${o.core}, 0 0 ${(m * 0.05).toFixed(0)}px ${o.hot}`,
        }}
      />
    </AbsoluteFill>
  );
};

export function hotSlabMorph(
  props: HotSlabMorphProps = {},
): TransitionPresentation<HotSlabMorphProps> {
  return { component: HotSlabMorphPresentation, props };
}

type Palette = {
  ink: string;
  muted: string;
  faint: string;
  accent: string;
  panel: string;
  row: string;
  hairline: string;
  highlight: string;
  shadow: string;
  iconBg: string;
  hot: string;
  core: string;
  deep: string;
  floodBlend: "screen" | "normal";
  flood: number;
  backdrop: string;
  groundA: Partial<GradientParams>;
  groundB: Partial<GradientParams>;
};

const THEMES: Record<"dark" | "light", Palette> = {
  dark: {
    ink: "#f3f6ff",
    muted: "rgba(222,230,255,0.62)",
    faint: "rgba(222,230,255,0.38)",
    accent: "#3b5bfd",
    panel: "rgba(9,11,18,0.86)",
    row: "rgba(255,255,255,0.06)",
    hairline: "rgba(255,255,255,0.09)",
    highlight: "inset 0 1px 0 rgba(255,255,255,0.07)",
    shadow: "0,3,18",
    iconBg: "rgba(255,255,255,0.06)",
    hot: "#2f62ff",
    core: "#9cb8ff",
    deep: "#1235d6",
    floodBlend: "screen",
    flood: 0.85,
    backdrop: "#01030c",
    groundA: {
      kind: "mist",
      colors: ["#a8c4ff", "#2f6bff", "#1440c8", "#04103a"],
      background: "#020822",
      speed: 0.7,
      loopSeconds: 16,
      scale: 0.85,
      warp: 0.45,
      blur: 0.75,
      grain: 0.12,
      seed: 5,
    },
    groundB: {
      kind: "mist",
      colors: ["#1f47d8", "#0c2580", "#050c2c", "#010207"],
      background: "#010205",
      speed: 0.6,
      loopSeconds: 16,
      scale: 0.7,
      warp: 0.35,
      blur: 0.8,
      grain: 0.12,
      seed: 17,
    },
  },
  light: {
    ink: "#111318",
    muted: "rgba(17,19,24,0.58)",
    faint: "rgba(17,19,24,0.36)",
    accent: "#2f4ff0",
    panel: "rgba(255,255,255,0.9)",
    row: "rgba(30,40,80,0.05)",
    hairline: "rgba(20,24,40,0.1)",
    highlight: "inset 0 1px 0 rgba(255,255,255,0.9)",
    shadow: "40,50,110",
    iconBg: "rgba(30,40,80,0.05)",
    hot: "#3a63ff",
    core: "#b9cbff",
    deep: "#1d3fe0",
    floodBlend: "normal",
    flood: 0.35,
    backdrop: "#e9eaf0",
    groundA: {
      kind: "mist",
      colors: ["#6d86ff", "#a8b8ff", "#dfe4fb", "#3a52d8"],
      background: "#d5dcf6",
      speed: 0.7,
      loopSeconds: 16,
      scale: 0.85,
      warp: 0.4,
      blur: 0.7,
      grain: 0.2,
      seed: 5,
    },
    groundB: {
      kind: "mist",
      colors: ["#9fb1ff", "#cdd6ff", "#ecedf3", "#6d84f0"],
      background: "#f1f0ec",
      speed: 0.6,
      loopSeconds: 16,
      scale: 0.8,
      warp: 0.35,
      blur: 0.75,
      grain: 0.24,
      seed: 13,
    },
  },
};

const A_LEN = 66;
const B_LEN = 84;
const T_LEN = 24;
export const HOT_SLAB_MORPH_DURATION = A_LEN + B_LEN - T_LEN;

const A_BEATS = { line: 0, panel: 4, rows: 8, hover: 30 } as const;
const B_BEATS = {
  type: 24,
  typeEnd: 60,
  chips: 27,
  send: 66,
} as const;

const ENTER = Easing.bezier(0.32, 0.72, 0, 1);
const CARD = { mass: 0.8, damping: 18, stiffness: 160 };
const HEAVY = { mass: 1, damping: 26, stiffness: 120 };
const CHIP = { mass: 0.5, damping: 12, stiffness: 200 };

function layout(W: number, H: number) {
  const tall = H > W * 1.1;
  if (tall) {
    return {
      tall,
      lineY: 0.3,
      panel: [0.08, 0.37, 0.84, 0.36] as Rect,
      input: [0.06, 0.39, 0.88, 0.18] as Rect,
      chipsY: 0.61,
      haze: [0.04, 0.2, 0.92, 0.14] as Rect,
    };
  }
  return {
    tall,
    lineY: 0.3,
    panel: [0.3, 0.4, 0.4, 0.46] as Rect,
    input: [0.22, 0.42, 0.56, 0.24] as Rect,
    chipsY: 0.72,
    haze: [0.1, 0.19, 0.8, 0.18] as Rect,
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
  film: "M4 6.5h16v11H4zM8 6.5v11M16 6.5v11M4 10h4M4 14h4M16 10h4M16 14h4",
  spark: "M12 4l1.8 4.6L18.5 10l-4.7 1.6L12 16l-1.8-4.4L5.5 10l4.7-1.4z",
  layers: "M12 4l8 4-8 4-8-4zM4 12l8 4 8-4M4 16l8 4 8-4",
  phone:
    "M8 3.5h8a1.5 1.5 0 011.5 1.5v14a1.5 1.5 0 01-1.5 1.5H8A1.5 1.5 0 016.5 19V5A1.5 1.5 0 018 3.5zM11 17.5h2",
  search: "M11 5a6 6 0 100 12 6 6 0 000-12zM20 20l-4.5-4.5",
  plus: "M12 5v14M5 12h14",
  chevron: "M7 10l5 5 5-5",
  mic: "M12 4a2.5 2.5 0 012.5 2.5v5a2.5 2.5 0 01-5 0v-5A2.5 2.5 0 0112 4zM6.5 11a5.5 5.5 0 0011 0M12 16.5V20",
  send: "M12 19V5M6 11l6-6 6 6",
  clip: "M15.5 7.5l-6.4 6.4a2 2 0 002.8 2.8l7-7a4 4 0 00-5.6-5.6l-7 7a6 6 0 008.5 8.5l5.2-5.2",
};

const SUGGESTIONS = [
  { icon: ICONS.spark, label: "Launch teaser" },
  { icon: ICONS.layers, label: "Changelog film" },
  { icon: ICONS.phone, label: "Social cutdown" },
];

const TEMPLATES = [
  { icon: ICONS.spark, name: "Launch teaser", meta: "0:18" },
  { icon: ICONS.film, name: "Product walkthrough", meta: "0:42" },
  { icon: ICONS.layers, name: "Changelog film", meta: "0:30" },
  { icon: ICONS.phone, name: "Social cutdowns", meta: "0:15" },
];

function Heading({
  text,
  palette,
  appear,
}: {
  text: string;
  palette: Palette;
  appear: number;
}) {
  const { width: W, height: H } = useVideoConfig();
  const L = layout(W, H);
  const fs = L.tall ? W * 0.085 : W * 0.046;
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: L.lineY * H,
        transform: "translateY(-50%)",
        display: "flex",
        justifyContent: "center",
        overflow: "hidden",
        paddingBottom: fs * 0.2,
      }}
    >
      <div
        style={{
          fontFamily: hanken.fontFamily,
          fontWeight: 300,
          fontSize: fs,
          letterSpacing: "-0.035em",
          lineHeight: 1.1,
          color: palette.ink,
          transform: `translateY(${((1 - appear) * 100).toFixed(2)}%)`,
          filter:
            appear < 0.99
              ? `blur(${((1 - appear) * 6).toFixed(2)}px)`
              : undefined,
        }}
      >
        {text}
      </div>
    </div>
  );
}

function SceneA({
  line,
  palette,
  ground,
  groundParams,
}: {
  line: string;
  palette: Palette;
  ground?: GshPresetId;
  groundParams?: Partial<GradientParams>;
}) {
  const frame = useCurrentFrame();
  const { width: W, height: H, fps } = useVideoConfig();
  const L = layout(W, H);
  const u = L.tall ? W / 600 : H / 720;
  const [px, py, pw, ph] = L.panel;
  const head = interpolate(frame, [A_BEATS.line, A_BEATS.line + 14], [0, 1], {
    ...CLAMP,
    easing: ENTER,
  });
  const panel = spring({ frame: frame - A_BEATS.panel, fps, config: HEAVY });
  const hover = spring({ frame: frame - A_BEATS.hover, fps, config: CARD });
  const push = interpolate(frame, [0, A_LEN], [1, 1.03], CLAMP);
  const rowH = (ph * H - 64 * u) / TEMPLATES.length;
  const hoverY = mix(0, 2, hover) * rowH;
  const fs = 19 * u;

  return (
    <AbsoluteFill>
      <GshGround
        preset={ground}
        params={ground ? groundParams : { ...palette.groundA, ...groundParams }}
        timeOffset={3}
        timeScale={0.7}
      />
      <AbsoluteFill style={{ transform: `scale(${push})` }}>
        <Heading text={line} palette={palette} appear={head} />
        <div
          style={{
            position: "absolute",
            left: px * W,
            top: py * H,
            width: pw * W,
            height: ph * H,
            borderRadius: 0.024 * Math.min(W, H),
            backgroundColor: palette.panel,
            boxShadow: `inset 0 0 0 1px ${palette.hairline}, ${palette.highlight}, 0 2px 4px rgba(${palette.shadow},0.2), 0 18px 40px rgba(${palette.shadow},0.32), 0 44px 100px rgba(${palette.shadow},0.38)`,
            fontFamily: hanken.fontFamily,
            color: palette.ink,
            padding: 10 * u,
            display: "flex",
            flexDirection: "column",
            opacity: interpolate(panel, [0, 0.3], [0, 1], CLAMP),
            transform: `translateY(${(1 - panel) * 30 * u}px) scale(${0.97 + 0.03 * panel})`,
          }}
        >
          <div
            style={{
              height: 44 * u,
              display: "flex",
              alignItems: "center",
              gap: 10 * u,
              padding: `0 ${10 * u}px`,
              fontSize: fs,
              color: palette.muted,
              borderBottom: `1px solid ${palette.hairline}`,
              marginBottom: 6 * u,
            }}
          >
            <Icon d={ICONS.search} size={18 * u} color={palette.faint} />
            <span style={{ flex: 1 }}>Search templates</span>
            <span
              style={{
                padding: `${3 * u}px ${9 * u}px`,
                borderRadius: 99,
                backgroundColor: palette.row,
                fontSize: 15 * u,
              }}
            >
              24
            </span>
          </div>
          <div style={{ position: "relative", flex: 1 }}>
            <div
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: hoverY,
                height: rowH,
                borderRadius: 10 * u,
                backgroundColor: palette.row,
                boxShadow: `inset 0 0 0 1px ${palette.hairline}`,
                opacity: interpolate(
                  frame,
                  [A_BEATS.rows + 10, A_BEATS.rows + 18],
                  [0, 1],
                  CLAMP,
                ),
              }}
            />
            {TEMPLATES.map((t, i) => {
              const r = spring({
                frame: frame - A_BEATS.rows - i * 3,
                fps,
                config: CARD,
              });
              return (
                <div
                  key={t.name}
                  style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    top: i * rowH,
                    height: rowH,
                    display: "flex",
                    alignItems: "center",
                    gap: 12 * u,
                    padding: `0 ${10 * u}px`,
                    fontSize: fs,
                    opacity: interpolate(r, [0, 0.4], [0, 1], CLAMP),
                    transform: `translateY(${(1 - r) * 12 * u}px)`,
                  }}
                >
                  <div
                    style={{
                      width: 32 * u,
                      height: 32 * u,
                      borderRadius: 8 * u,
                      backgroundColor: palette.iconBg,
                      boxShadow: `inset 0 0 0 1px ${palette.hairline}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Icon d={t.icon} size={18 * u} color={palette.ink} />
                  </div>
                  <span style={{ flex: 1 }}>{t.name}</span>
                  <span style={{ color: palette.faint, fontSize: 15.5 * u }}>
                    {t.meta}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}

function SceneB({
  line,
  prompt,
  palette,
  ground,
  groundParams,
}: {
  line: string;
  prompt: string;
  palette: Palette;
  ground?: GshPresetId;
  groundParams?: Partial<GradientParams>;
}) {
  const frame = useCurrentFrame();
  const { width: W, height: H, fps } = useVideoConfig();
  const L = layout(W, H);
  const u = L.tall ? W / 600 : H / 720;
  const [ix, iy, iw, ih] = L.input;
  const typed = Math.floor(
    interpolate(
      frame,
      [B_BEATS.type, B_BEATS.typeEnd],
      [0, prompt.length],
      CLAMP,
    ),
  );
  const done = typed >= prompt.length;
  const caretOn = !done || Math.floor((frame - B_BEATS.typeEnd) / 8) % 2 === 0;
  const send = spring({ frame: frame - B_BEATS.send, fps, config: CHIP });
  const push = interpolate(frame, [0, B_LEN], [1.01, 1.04], CLAMP);
  const fs = (L.tall ? 25 : 21) * u;
  const small = (L.tall ? 23 : 16.5) * u;

  return (
    <AbsoluteFill>
      <GshGround
        preset={ground}
        params={ground ? groundParams : { ...palette.groundB, ...groundParams }}
        timeOffset={8}
        timeScale={0.6}
      />
      <AbsoluteFill style={{ transform: `scale(${push})` }}>
        <Heading text={line} palette={palette} appear={1} />
        <div
          style={{
            position: "absolute",
            left: ix * W,
            top: iy * H,
            width: iw * W,
            height: ih * H,
            borderRadius: 0.03 * Math.min(W, H),
            backgroundColor: palette.panel,
            boxShadow: `inset 0 0 0 1px ${palette.hairline}, ${palette.highlight}, 0 2px 4px rgba(${palette.shadow},0.2), 0 18px 40px rgba(${palette.shadow},0.32), 0 44px 100px rgba(${palette.shadow},0.38)`,
            fontFamily: hanken.fontFamily,
            color: palette.ink,
            padding: `${18 * u}px ${18 * u}px ${14 * u}px`,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              fontSize: fs,
              fontWeight: 300,
              letterSpacing: "-0.01em",
              lineHeight: 1.3,
              color: typed > 0 ? palette.ink : palette.faint,
            }}
          >
            {typed > 0 ? prompt.slice(0, typed) : "Describe your launch film"}
            <span
              style={{
                display: "inline-block",
                width: Math.max(2, 2 * u),
                height: fs * 1.05,
                marginLeft: 2 * u,
                verticalAlign: "-0.18em",
                backgroundColor: palette.accent,
                opacity: caretOn ? 1 : 0,
              }}
            />
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8 * u,
              fontSize: small,
              color: palette.muted,
            }}
          >
            <div
              style={{
                width: 34 * u,
                height: 34 * u,
                borderRadius: 99,
                boxShadow: `inset 0 0 0 1px ${palette.hairline}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon d={ICONS.plus} size={17 * u} color={palette.muted} />
            </div>
            {["Film", "16:9"].map((c) => (
              <div
                key={c}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4 * u,
                  padding: `${7 * u}px ${12 * u}px`,
                  borderRadius: 99,
                  backgroundColor: palette.row,
                  boxShadow: `inset 0 0 0 1px ${palette.hairline}`,
                }}
              >
                {c}
                <Icon d={ICONS.chevron} size={14 * u} color={palette.faint} />
              </div>
            ))}
            <div style={{ flex: 1 }} />
            <Icon d={ICONS.mic} size={19 * u} color={palette.muted} />
            <div
              style={{
                width: 36 * u,
                height: 36 * u,
                borderRadius: 99,
                backgroundColor: done ? palette.accent : palette.row,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transform: `scale(${1 + 0.12 * send * (1 - send) * 4})`,
                boxShadow: done ? `0 6px 18px ${palette.accent}66` : undefined,
              }}
            >
              <Icon
                d={ICONS.send}
                size={18 * u}
                color={done ? "#fff" : palette.faint}
              />
            </div>
          </div>
        </div>
        <div
          style={{
            position: "absolute",
            left: ix * W,
            width: iw * W,
            top: L.chipsY * H,
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: 10 * u,
            fontFamily: hanken.fontFamily,
            fontSize: small,
            color: palette.muted,
          }}
        >
          {SUGGESTIONS.map((c, i) => {
            const k = spring({
              frame: frame - B_BEATS.chips - i * 3,
              fps,
              config: CARD,
            });
            return (
              <div
                key={c.label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8 * u,
                  padding: `${9 * u}px ${15 * u}px`,
                  borderRadius: 99,
                  backgroundColor: palette.panel,
                  boxShadow: `inset 0 0 0 1px ${palette.hairline}, ${palette.highlight}, 0 8px 22px rgba(${palette.shadow},0.25)`,
                  opacity: interpolate(k, [0, 0.4], [0, 1], CLAMP),
                  transform: `translateY(${((1 - k) * 14 * u).toFixed(2)}px)`,
                }}
              >
                <Icon d={c.icon} size={17 * u} color={palette.muted} />
                {c.label}
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}

export interface HotSlabMorphDemoProps {
  theme?: "dark" | "light";
  accent?: string;
  lineA?: string;
  lineB?: string;
  prompt?: string;
  ground?: GshPresetId;
  groundParams?: Partial<GradientParams>;
  groundB?: GshPresetId;
  groundParamsB?: Partial<GradientParams>;
  transition?: HotSlabMorphProps;
}

export function HotSlabMorphDemo({
  theme = "dark",
  accent,
  lineA = "Start from a template",
  lineB = "or just describe it",
  prompt = "A 30-second launch film for our new editor",
  ground,
  groundParams,
  groundB,
  groundParamsB,
  transition,
}: HotSlabMorphDemoProps) {
  const { width: W, height: H } = useVideoConfig();
  const base = THEMES[theme];
  const palette = accent ? { ...base, accent } : base;
  const L = layout(W, H);
  return (
    <AbsoluteFill style={{ backgroundColor: palette.backdrop }}>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={A_LEN}>
          <SceneA
            line={lineA}
            palette={palette}
            ground={ground}
            groundParams={groundParams}
          />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={hotSlabMorph({
            from: L.panel,
            to: L.input,
            fromRadius: 0.024,
            toRadius: 0.03,
            hot: palette.hot,
            core: palette.core,
            deep: palette.deep,
            haze: L.haze,
            flood: palette.flood,
            floodBlend: palette.floodBlend,
            ...transition,
          })}
          timing={linearTiming({ durationInFrames: T_LEN })}
        />
        <TransitionSeries.Sequence durationInFrames={B_LEN}>
          <SceneB
            line={lineB}
            prompt={prompt}
            palette={palette}
            ground={groundB}
            groundParams={groundParamsB}
          />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
}
