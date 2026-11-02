"use client";

import { loadFont } from "@remotion/google-fonts/Geist";
import { loadFont as loadSerif } from "@remotion/google-fonts/Newsreader";
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

const geist = loadFont("normal", {
  weights: ["300", "400"],
  subsets: ["latin"],
});
const newsreader = loadSerif("italic", {
  weights: ["300", "400"],
  subsets: ["latin"],
});

export interface CoverRingProps {
  images?: string[];
  line?: string;
  caption?: string;
  theme?: "dark" | "light";
  background?: string;
  ink?: string;
  accent?: string;
  fog?: string[];
  ground?: GshPresetId;
  groundParams?: Partial<GradientParams>;
}

const THEMES = {
  dark: {
    background: "#010605",
    ink: "#ecfff7",
    accent: "#8ff0cc",
    ground: "kiruna" as GshPresetId | undefined,
    groundParams: undefined as Partial<GradientParams> | undefined,
    shadowRgb: "0,8,6",
    edge: "rgba(4,22,18,0.9)",
    scrim: "rgba(1,8,6,0.55)",
  },
  light: {
    background: "#eef3f0",
    ink: "#0f241d",
    accent: "#0f8a6c",
    ground: undefined as GshPresetId | undefined,
    groundParams: {
      kind: "aurora",
      background: "#eef3f0",
      colors: ["#0e9a7e", "#55e6bd", "#bfeede", "#e4f2ec"],
      scale: 0.75,
      warp: 0.45,
      grain: 0.12,
      seed: 106,
    } as Partial<GradientParams> | undefined,
    shadowRgb: "18,70,56",
    edge: "rgba(160,196,184,0.95)",
    scrim: "rgba(240,246,243,0.6)",
  },
};

const DEFAULT_IMAGES = [
  "templates/launch-anything/rocket.jpg",
  "templates/brand-guidelines/ceramics.jpg",
  "reel/reel-1.jpg",
  "templates/product-showcase/sculpture.jpg",
  "templates/launch-anything/earth.jpg",
  "templates/brand-guidelines/chair.jpg",
  "reel/reel-4.jpg",
  "templates/launch-anything/desk.jpg",
  "templates/product-showcase/courtyard.jpg",
  "reel/reel-6.jpg",
];

const BEATS = [
  { id: "lineIn", at: -6 },
  { id: "tilesIn", at: 0 },
  { id: "lineOut", at: 78 },
  { id: "collapse", at: 78 },
  { id: "bars", at: 96 },
  { id: "caption", at: 100 },
  { id: "pulse", at: 114 },
  { id: "end", at: 150 },
] as const;
const beat = (id: (typeof BEATS)[number]["id"]) =>
  BEATS.find((b) => b.id === id)?.at ?? 0;
const COLLAPSE_LEN = 18;

const EASE_ENTER = Easing.bezier(0.32, 0.72, 0, 1);
const EASE_EXIT = Easing.bezier(0.55, 0, 1, 0.45);
const EASE_MOVE = Easing.bezier(0.83, 0, 0.17, 1);
const EASE_CAMERA = Easing.bezier(0.87, 0, 0.13, 1);
const SPRING_CARD = { mass: 0.8, damping: 18, stiffness: 160 };
const SPRING_CHIP = { mass: 0.5, damping: 12, stiffness: 200 };
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

function mix(color: string, pct: number) {
  return `color-mix(in oklab, ${color} ${pct}%, transparent)`;
}

function enterTime(i: number) {
  let t = beat("tilesIn");
  let step = 5;
  for (let k = 0; k < i; k++) {
    t += step;
    step = Math.max(1.6, step * 0.8);
  }
  return Math.round(t);
}

function balance(text: string) {
  const words = text.split(" ");
  if (text.length < 22 || words.length < 3) return [text];
  let best = 1;
  let bestCost = Number.POSITIVE_INFINITY;
  for (let k = 1; k < words.length; k++) {
    const a = words.slice(0, k).join(" ").length;
    const b = words.slice(k).join(" ").length;
    const cost = Math.max(a, b);
    if (cost < bestCost) {
      bestCost = cost;
      best = k;
    }
  }
  return [words.slice(0, best).join(" "), words.slice(best).join(" ")];
}

function RevealWords({
  text,
  start,
  frame,
  stagger,
  accentFrom,
}: {
  text: string;
  start: number;
  frame: number;
  stagger: number;
  accentFrom?: number;
}) {
  const words = text.split(" ");
  return (
    <span
      style={{
        display: "inline-flex",
        flexWrap: "wrap",
        justifyContent: "center",
        columnGap: "0.24em",
      }}
    >
      {words.map((word, i) => {
        const p = interpolate(
          frame,
          [start + i * stagger, start + i * stagger + 12],
          [0, 1],
          { ...CLAMP, easing: EASE_ENTER },
        );
        const accent = accentFrom !== undefined && i >= accentFrom;
        return (
          <span
            key={`${word}-${i}`}
            style={{
              display: "inline-block",
              overflow: "hidden",
              padding: "0.06em 0.06em 0.18em",
              margin: "-0.06em -0.06em -0.18em",
            }}
          >
            <span
              style={{
                display: "inline-block",
                transform: `translateY(${(1 - p) * 140}%)`,
                filter: `blur(${(1 - p) * 6}px)`,
                fontFamily: accent ? newsreader.fontFamily : undefined,
                fontStyle: accent ? "italic" : undefined,
                letterSpacing: accent ? "-0.02em" : undefined,
              }}
            >
              {word}
            </span>
          </span>
        );
      })}
    </span>
  );
}

export function CoverRing({
  images,
  line = "Launch videos aren't edited anymore",
  caption = "They're composed.",
  theme = "dark",
  background,
  ink,
  accent,
  fog,
  ground,
  groundParams,
}: CoverRingProps) {
  const frame = useCurrentFrame();
  const { width: W, height: H, fps } = useVideoConfig();
  const t = THEMES[theme];
  const light = theme === "light";
  const bg = background ?? t.background;
  const fg = ink ?? t.ink;
  const acc = accent ?? t.accent;
  const preset = ground ?? (groundParams ? undefined : t.ground);
  const gParams =
    groundParams ??
    (fog ? { ...(t.groundParams ?? {}), colors: fog } : t.groundParams);
  const srcs =
    images && images.length > 0 ? images : DEFAULT_IMAGES.map(staticFile);
  const portrait = H > W;
  const n = Math.max(6, Math.min(12, srcs.length));

  const cx = W / 2;
  const cy = H * (portrait ? 0.46 : 0.5);
  const rx = portrait ? W * 0.39 : W * 0.33;
  const ry = portrait ? H * 0.25 : H * 0.36;
  const tilt = (-12 * Math.PI) / 180;
  const tile = portrait ? W * 0.25 : W * 0.118;
  const dot = portrait ? W * 0.05 : W * 0.026;
  const dotGap = dot * 1.9;
  const dots = 5;
  const lineSize = portrait ? W * 0.062 : W * 0.034;
  const capSize = portrait ? W * 0.12 : W * 0.074;
  const capGap = portrait ? H * 0.035 : H * 0.06;
  const barMax = portrait ? H * 0.09 : H * 0.17;
  const liftAt = (f: number) =>
    interpolate(
      f,
      [beat("bars"), beat("bars") + 14],
      [0, (capSize * 1.1 + capGap) / 2],
      { ...CLAMP, easing: Easing.bezier(0.65, 0, 0.35, 1) },
    );

  const collapseAt = (f: number) =>
    interpolate(
      f,
      [beat("collapse"), beat("collapse") + COLLAPSE_LEN],
      [0, 1],
      { ...CLAMP, easing: EASE_MOVE },
    );

  const rotAt = (f: number) => {
    const c = interpolate(
      f,
      [beat("collapse"), beat("collapse") + COLLAPSE_LEN],
      [0, 1],
      CLAMP,
    );
    return -0.4 + f * 0.0095 + c * c * 1.8;
  };

  const tileAt = (i: number, f: number) => {
    const e0 = enterTime(i);
    const land = spring({ frame: f - e0, fps, config: SPRING_CARD });
    const q = collapseAt(f);
    const theta = rotAt(f) + (i / n) * Math.PI * 2;
    const ex = Math.cos(theta) * rx;
    const ey = Math.sin(theta) * ry;
    const rxp = ex * Math.cos(tilt) - ey * Math.sin(tilt);
    const ryp = ex * Math.sin(tilt) + ey * Math.cos(tilt);
    const depth = (Math.sin(theta) + 1) / 2;
    const fly = 1 - land;
    const jitter = random(`cr2-j-${i}`) - 0.5;
    const ringX = cx + rxp * (1 + fly * 1.4) + fly * jitter * W * 0.25;
    const ringY = cy + ryp * (1 + fly * 1.4) + fly * H * 0.12;
    const k = i % dots;
    const dx = cx + (k - (dots - 1) / 2) * dotGap;
    const dy = cy - liftAt(f);
    const x = ringX * (1 - q) + dx * q;
    const y = ringY * (1 - q) + dy * q;
    return { x, y, depth, theta, land, q, fly, jitter };
  };

  const barP = spring({
    frame: frame - beat("bars"),
    fps,
    config: SPRING_CHIP,
  });
  const pulse = interpolate(
    frame,
    [beat("pulse"), beat("pulse") + 5, beat("pulse") + 18],
    [0, 1, 0],
    { ...CLAMP, easing: Easing.bezier(0.65, 0, 0.35, 1) },
  );
  const barHeights = [0.5, 0.82, 0.6, 1, 0.7];
  const pulseHeights = [0.9, 0.46, 1, 0.58, 0.95];

  const lineOut = interpolate(
    frame,
    [beat("lineOut"), beat("lineOut") + 8],
    [0, 1],
    { ...CLAMP, easing: EASE_EXIT },
  );
  const push = interpolate(frame, [0, beat("end")], [1, 1.05], {
    ...CLAMP,
    easing: EASE_CAMERA,
  });

  const order = Array.from({ length: n }, (_, i) => i).sort(
    (a, b) => tileAt(a, frame).depth - tileAt(b, frame).depth,
  );

  const captionWords = caption.split(" ");

  return (
    <AbsoluteFill style={{ backgroundColor: bg, overflow: "hidden" }}>
      <GshGround
        preset={preset}
        params={gParams}
        timeOffset={light ? 3 : 4}
        timeScale={0.8}
      />
      <AbsoluteFill
        style={{
          backgroundImage: `radial-gradient(${portrait ? "60% 26%" : "36% 34%"} at 50% ${(cy / H) * 100}%, ${t.scrim} 0%, transparent 74%)`,
        }}
      />
      <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden>
        {order.map((i) => {
          const now = tileAt(i, frame);
          const prev = tileAt(i, frame - 1);
          const vx = Math.min(9, Math.abs(now.x - prev.x) * 0.12);
          const vy = Math.min(9, Math.abs(now.y - prev.y) * 0.12);
          return (
            <filter
              key={`f-${i}`}
              id={`cr2-mb-${i}`}
              x="-25%"
              y="-25%"
              width="150%"
              height="150%"
            >
              <feGaussianBlur stdDeviation={`${vx} ${vy}`} />
            </filter>
          );
        })}
      </svg>
      <AbsoluteFill
        style={{
          transform: `scale(${push})`,
          perspective: portrait ? 2200 : 1400,
          perspectiveOrigin: `50% ${(cy / H) * 100}%`,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: cx - (portrait ? W * 0.34 : W * 0.2),
            width: portrait ? W * 0.68 : W * 0.4,
            top: cy,
            height: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            fontFamily: geist.fontFamily,
            fontWeight: 300,
            fontSize: lineSize,
            lineHeight: 1.1,
            letterSpacing: "-0.03em",
            color: fg,
            opacity: 1 - lineOut,
            transform: `scale(${1 - lineOut * 0.2})`,
            filter: `blur(${lineOut * 8}px)`,
            zIndex: 50,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column" }}>
            {balance(line).map((row, r) => (
              <RevealWords
                key={row}
                text={row}
                start={beat("lineIn") + r * 2 * row.split(" ").length}
                frame={frame}
                stagger={2}
              />
            ))}
          </div>
        </div>
        {order.map((i, z) => {
          const s = tileAt(i, frame);
          if (frame < enterTime(i)) return null;
          const prev = tileAt(i, frame - 1);
          const moving = Math.hypot(s.x - prev.x, s.y - prev.y) > 3;
          const depthScale = 0.62 + 0.52 * s.depth;
          const sizeRing = tile * depthScale * (1 + s.fly * 1.6);
          const size = sizeRing * (1 - s.q) + dot * s.q;
          const flat = 1 - s.q;
          const rotY = -Math.cos(s.theta) * 28 * flat;
          const rotX = (12 - Math.sin(s.theta) * 6) * flat;
          const rotZ = (s.jitter * 16 + s.fly * s.jitter * 70) * flat;
          const depthBlur = (1 - s.depth) * (light ? 4 : 5) * flat;
          const fill = interpolate(s.q, [0.5, 0.92], [0, 1], CLAMP);
          const enter = Math.min(1, Math.max(0, s.land) * 3);
          const dim = light
            ? 1 - (1 - s.depth) * 0.12 * flat
            : (0.45 + 0.55 * s.depth) * flat + s.q;
          const extra = i >= dots;
          const fadeExtra = extra
            ? interpolate(s.q, [0.72, 0.98], [1, 0], CLAMP)
            : 1;
          const barShape = !extra && frame >= beat("bars");
          const k = i % dots;
          const hBar =
            dot +
            (barMax * (barHeights[k] ?? 0.7) - dot) * barP +
            barMax *
              ((pulseHeights[k] ?? 0.7) - (barHeights[k] ?? 0.7)) *
              pulse;
          const w = size;
          const h = barShape ? hBar : size;
          const radius = s.q > 0.6 ? Math.min(w, h) / 2 : size * 0.16;
          const ex = -Math.cos(s.theta) * 0.035 * size * flat;
          const ey = 0.04 * size * flat;
          const edge = [1, 2, 3, 4]
            .map(
              (m) =>
                `${(ex * m) / 4}px ${(ey * m) / 4}px 0 0 ${m === 4 ? t.edge : mix(t.edge, 70)}`,
            )
            .join(", ");
          const lift = size * (0.12 + 0.2 * s.depth) * flat;
          const shadow =
            s.q > 0.6
              ? `0 0 ${dot * 1.2}px ${mix(acc, 50)}, 0 0 ${dot * 0.3}px ${mix(acc, 70)}`
              : `${edge}, 0 ${lift * 0.3}px ${lift * 0.5}px rgba(${t.shadowRgb},0.28), 0 ${lift}px ${lift * 2.2}px rgba(${t.shadowRgb},0.38)`;
          return (
            <div
              key={`cr-${i}`}
              style={{
                position: "absolute",
                left: s.x - w / 2,
                top: s.y - h / 2,
                width: w,
                height: h,
                borderRadius: radius,
                zIndex: z,
                opacity: enter * fadeExtra,
                transform: `rotateX(${rotX}deg) rotateY(${rotY}deg) rotateZ(${rotZ}deg)`,
                filter: `${moving ? `url(#cr2-mb-${i}) ` : ""}blur(${depthBlur + Math.max(0, s.fly) * 8}px) brightness(${dim})`,
                boxShadow: shadow,
                backgroundColor: acc,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: "inherit",
                  overflow: "hidden",
                  opacity: 1 - fill,
                }}
              >
                <Img
                  src={srcs[i % srcs.length] as string}
                  style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: "inherit",
                    backgroundImage:
                      "linear-gradient(145deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0) 34%, rgba(0,0,0,0) 66%, rgba(0,0,0,0.24) 100%)",
                    boxShadow:
                      "inset 0 0 0 1px rgba(255,255,255,0.18), inset 0 1px 0 rgba(255,255,255,0.35)",
                  }}
                />
              </div>
            </div>
          );
        })}
        <div
          style={{
            position: "absolute",
            left: 0,
            width: W,
            top: cy - liftAt(frame) + barMax * 0.5 + capGap,
            textAlign: "center",
            fontFamily: geist.fontFamily,
            fontSize: capSize,
            letterSpacing: "-0.045em",
            fontWeight: 300,
            lineHeight: 1,
            color: fg,
          }}
        >
          <RevealWords
            text={caption}
            start={beat("caption")}
            frame={frame}
            stagger={3}
            accentFrom={Math.max(1, captionWords.length - 1)}
          />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}

export default CoverRing;
