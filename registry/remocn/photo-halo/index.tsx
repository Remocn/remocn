"use client";

import { loadFont as loadSerif } from "@remotion/google-fonts/InstrumentSerif";
import { loadFont } from "@remotion/google-fonts/InterTight";
import { loadFont as loadManrope } from "@remotion/google-fonts/Manrope";
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

const interTight = loadFont("normal", {
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
        whiteSpace: "nowrap",
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

export interface PhotoHaloProps {
  words?: string[];
  accentWord?: number;
  images?: string[];
  theme?: "dark" | "light";
  background?: string;
  ink?: string;
  blooms?: string[];
  ground?: GshPresetId;
  groundParams?: Partial<GradientParams>;
}

const THEMES = {
  dark: {
    background: "#0b0605",
    ink: "#fbf1e7",
    accent: "#ffc79a",
    ground: "hearth" as GshPresetId | undefined,
    groundParams: undefined as Partial<GradientParams> | undefined,
    scrim: "rgba(8,4,3,0.62)",
    shadow: [0.32, 0.3, 0.42],
    shadowRgb: "10,4,2",
    ring: "#160b08",
    hairline: "rgba(255,255,255,0.16)",
  },
  light: {
    background: "#f4efe8",
    ink: "#1e1712",
    accent: "#c2522a",
    ground: undefined as GshPresetId | undefined,
    groundParams: {
      kind: "mist",
      background: "#f4efe8",
      colors: ["#ff9a5c", "#f7c06a", "#f6d4c0", "#e8708e"],
      blur: 0.75,
      grain: 0.2,
      warp: 0.4,
      scale: 0.9,
      seed: 6,
    } as Partial<GradientParams> | undefined,
    scrim: "rgba(246,241,234,0.7)",
    shadow: [0.1, 0.12, 0.18],
    shadowRgb: "92,48,18",
    ring: "#f6f1ea",
    hairline: "rgba(255,255,255,0.5)",
  },
};

const DEFAULT_WORDS = ["Launch", "films", "for", "everything", "you", "ship"];
const DEFAULT_IMAGES = [
  "templates/brand-guidelines/ceramics.jpg",
  "reel/reel-2.jpg",
  "templates/product-showcase/sculpture.jpg",
  "templates/launch-anything/desk.jpg",
  "templates/brand-guidelines/chair.jpg",
  "reel/reel-4.jpg",
  "templates/product-showcase/courtyard.jpg",
  "templates/brand-guidelines/materials.jpg",
  "reel/reel-6.jpg",
  "templates/product-showcase/workbench.jpg",
  "templates/launch-anything/horizon.jpg",
  "reel/reel-1.jpg",
];

const BEATS = [
  { id: "words", at: -6 },
  { id: "pops", at: 6 },
  { id: "textOut", at: 72 },
  { id: "converge", at: 72 },
  { id: "logo", at: 90 },
  { id: "land", at: 96 },
  { id: "end", at: 138 },
] as const;
const beat = (id: (typeof BEATS)[number]["id"]) =>
  BEATS.find((b) => b.id === id)?.at ?? 0;

const EASE_ENTER = Easing.bezier(0.32, 0.72, 0, 1);
const EASE_REVEAL = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_EXIT = Easing.bezier(0.55, 0, 1, 0.45);
const EASE_CAMERA = Easing.bezier(0.87, 0, 0.13, 1);
const SPRING_CARD = { mass: 0.8, damping: 18, stiffness: 160 };
const SPRING_MORPH = { damping: 200 };
const SPRING_CHIP = { mass: 0.5, damping: 12, stiffness: 200 };
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

function popTime(order: number) {
  let t = beat("pops");
  let step = 6;
  for (let k = 0; k < order; k++) {
    t += step;
    step = Math.max(2, step * 0.82);
  }
  return Math.round(t);
}

interface Slot {
  x: number;
  y: number;
  w: number;
  h: number;
  z: number;
  dx: number;
  dy: number;
  rot: number;
  t: number;
}

function buildSlots(
  n: number,
  W: number,
  H: number,
  portrait: boolean,
  textW: number,
  textH: number,
): Slot[] {
  const cx = W / 2;
  const cy = H / 2;
  const base = portrait ? W * 0.27 : W * 0.15;
  const a = portrait ? W * 0.42 : W * 0.41;
  const b = portrait ? H * 0.34 : H * 0.35;
  const margin = (portrait ? W : H) * 0.04;
  const aspects = [1.34, 1, 0.8, 1.5, 1.12, 0.86];
  const order = Array.from({ length: n }, (_, i) => i).sort(
    (p, q) => random(`ph2-order-${p}`) - random(`ph2-order-${q}`),
  );
  const slots: Slot[] = [];
  for (let i = 0; i < n; i++) {
    const ang =
      -Math.PI / 2 +
      (i / n) * Math.PI * 2 +
      (random(`ph2-a-${i}`) - 0.5) * 0.34;
    const z = 0.28 + random(`ph2-z-${i}`) * 0.72;
    const size = base * (0.5 + 0.72 * z);
    const asp =
      aspects[Math.floor(random(`ph2-asp-${i}`) * aspects.length)] ?? 1;
    const w = size * Math.sqrt(asp);
    const h = size / Math.sqrt(asp);
    const rad = 0.8 + random(`ph2-r-${i}`) * 0.28;
    const ca = Math.cos(ang);
    const sa = Math.sin(ang);
    let x = cx + ca * a * rad;
    let y = cy + sa * b * rad;
    for (let k = 0; k < 160; k++) {
      const clearX = Math.abs(x - cx) > textW / 2 + margin + w / 2;
      const clearY = Math.abs(y - cy) > textH / 2 + margin + h / 2;
      if (clearX || clearY) break;
      x += ca * 4;
      y += sa * 4;
    }
    x = Math.min(Math.max(x, w * 0.32), W - w * 0.32);
    y = Math.min(Math.max(y, h * 0.4), H - h * 0.4);
    slots.push({
      x,
      y,
      w,
      h,
      z,
      dx: (x < cx ? -1 : 1) * (0.5 + random(`ph2-dx-${i}`)),
      dy: (y < cy ? -1 : 1) * (0.3 + random(`ph2-dy-${i}`) * 0.5),
      rot: (random(`ph2-rot-${i}`) - 0.5) * 7,
      t: popTime(order.indexOf(i)),
    });
  }
  return slots;
}

export function PhotoHalo({
  words = DEFAULT_WORDS,
  accentWord = 3,
  images,
  theme = "dark",
  background,
  ink,
  blooms,
  ground,
  groundParams,
}: PhotoHaloProps) {
  const frame = useCurrentFrame();
  const { width: W, height: H, fps } = useVideoConfig();
  const t = THEMES[theme];
  const light = theme === "light";
  const bg = background ?? t.background;
  const fg = ink ?? t.ink;
  const srcs = (
    images && images.length > 0 ? images : DEFAULT_IMAGES.map(staticFile)
  ).filter(Boolean);
  const portrait = H > W;
  const cx = W / 2;
  const cy = H / 2;
  const unit = W / 1280;

  const preset = ground ?? (groundParams ? undefined : t.ground);
  const gParams =
    groundParams ??
    (blooms ? { ...(t.groundParams ?? {}), colors: blooms } : t.groundParams);

  const fontSize = portrait ? W * 0.104 : W * 0.074;
  const maxW = portrait ? W * 0.8 : W * 0.66;
  const totalEm =
    words.reduce((acc, w) => acc + w.length * 0.5, 0) +
    Math.max(0, words.length - 1) * 0.24;
  const lines = Math.max(1, Math.ceil((totalEm * fontSize) / (maxW * 0.92)));
  const textW = Math.min(maxW, totalEm * fontSize);
  const textH = lines * fontSize * 1.06;

  const count = portrait ? 12 : 11;
  const slots = buildSlots(count, W, H, portrait, textW, textH);

  const rowCount = Math.min(5, count, srcs.length);
  const rowPick = slots
    .map((s, i) => ({ i, z: s.z }))
    .sort((p, q) => q.z - p.z)
    .slice(0, rowCount)
    .map((p) => p.i)
    .sort((p, q) => (slots[p]?.x ?? 0) - (slots[q]?.x ?? 0));

  const d = portrait ? W * 0.17 : W * 0.082;
  const step = d * 0.76;
  const ring = Math.max(2, d * 0.045);
  const logoSize = portrait ? d * 0.9 : d * 0.92;
  const logoW = logoSize * 3.72;
  const gap = d * 0.46;
  const rowW = (rowCount - 1) * step + d;
  const groupW = logoW + gap + rowW;
  const rowCentred = cx - rowW / 2;
  const rowFinal = portrait ? rowCentred : cx - groupW / 2 + logoW + gap;
  const rowY = portrait ? cy + d * 0.7 : cy;

  const logoP = interpolate(frame, [beat("logo"), beat("logo") + 12], [0, 1], {
    ...CLAMP,
    easing: EASE_REVEAL,
  });
  const rowShift = spring({
    frame: frame - beat("logo"),
    fps,
    config: SPRING_MORPH,
    durationInFrames: 16,
  });
  const rowLeft = rowCentred + (rowFinal - rowCentred) * rowShift;
  const landSpring = spring({
    frame: frame - beat("land"),
    fps,
    config: SPRING_CHIP,
  });
  const punch = 1 + 0.05 * Math.sin(Math.min(1, landSpring) * Math.PI);
  const lockPush = interpolate(frame, [beat("land"), beat("end")], [1, 1.03], {
    ...CLAMP,
    easing: EASE_CAMERA,
  });
  const pushAll = interpolate(frame, [0, beat("converge")], [0, 0.08], {
    ...CLAMP,
    easing: Easing.bezier(0.65, 0, 0.35, 1),
  });

  const convergeStart = (i: number) => {
    const k = rowPick.indexOf(i);
    return beat("converge") + (k >= 0 ? k * 2 : rowCount + (i % 3));
  };

  const stateAt = (i: number, f: number) => {
    const s = slots[i] as Slot;
    const k = rowPick.indexOf(i);
    const pop = spring({ frame: f - s.t, fps, config: SPRING_CARD });
    const push = 1 + pushAll * (0.4 + s.z);
    const sx = cx + (s.x - cx) * push + f * s.dx * 0.6 * s.z * unit;
    const sy =
      cy +
      (s.y - cy) * push +
      f * s.dy * 0.34 * s.z * unit +
      (1 - pop) * H * 0.06;
    const c0 = convergeStart(i);
    const q = spring({ frame: f - c0, fps, config: SPRING_CARD });
    const m = spring({ frame: f - c0, fps, config: SPRING_MORPH });
    const tx = k >= 0 ? rowLeft + d / 2 + k * step : cx;
    const ty = k >= 0 ? rowY : cy;
    const td = k >= 0 ? d : d * 0.3;
    const x = sx + (tx - sx) * q;
    const y = sy + (ty - sy) * q;
    const w = s.w + (td - s.w) * m;
    const h = s.h + (td - s.h) * m;
    const r0 = Math.min(s.w, s.h) * 0.08;
    const r = r0 + (td / 2 - r0) * m;
    return { x, y, w, h, r, q: Math.min(1, m), pop, k };
  };

  const textOut = interpolate(
    frame,
    [beat("textOut"), beat("textOut") + 8],
    [0, 1],
    { ...CLAMP, easing: EASE_EXIT },
  );

  const order = slots
    .map((s, i) => ({ i, z: s.z }))
    .sort((p, q) => p.z - q.z)
    .map((p) => p.i);

  const scrimP = 1 - textOut * 0.6;

  return (
    <AbsoluteFill style={{ backgroundColor: bg, overflow: "hidden" }}>
      <GshGround
        preset={preset}
        params={gParams}
        timeOffset={light ? 4 : 2.4}
        timeScale={0.7}
      />
      <AbsoluteFill
        style={{
          backgroundImage: `radial-gradient(${portrait ? "70% 30%" : "44% 40%"} at 50% 50%, ${t.scrim} 0%, transparent 72%)`,
          opacity: scrimP,
        }}
      />
      <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden>
        {order.map((i) => {
          const now = stateAt(i, frame);
          const prev = stateAt(i, frame - 1);
          const vx = Math.min(10, Math.abs(now.x - prev.x) * 0.1);
          const vy = Math.min(10, Math.abs(now.y - prev.y) * 0.1);
          return (
            <filter
              key={`f-${i}`}
              id={`ph2-mb-${i}`}
              x="-20%"
              y="-20%"
              width="140%"
              height="140%"
            >
              <feGaussianBlur stdDeviation={`${vx} ${vy}`} />
            </filter>
          );
        })}
      </svg>
      <AbsoluteFill
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            columnGap: "0.24em",
            maxWidth: maxW,
            fontFamily: interTight.fontFamily,
            fontWeight: 300,
            fontSize,
            lineHeight: 1.04,
            letterSpacing: "-0.04em",
            color: fg,
            transform: `scale(${(1 + pushAll * 0.4) * (1 - textOut * 0.1)})`,
            opacity: 1 - textOut,
            filter: `blur(${textOut * 10}px)`,
          }}
        >
          {words.map((word, i) => {
            const start = beat("words") + i * 3;
            const p = interpolate(frame, [start, start + 12], [0, 1], {
              ...CLAMP,
              easing: EASE_ENTER,
            });
            const accent = i === accentWord;
            return (
              <span
                key={`${word}-${i}`}
                style={{
                  display: "inline-block",
                  overflow: "hidden",
                  padding: "0.04em 0.06em 0.16em",
                  margin: "-0.04em -0.06em -0.16em",
                }}
              >
                <span
                  style={{
                    display: "inline-block",
                    transform: `translateY(${(1 - p) * 140}%)`,
                    filter: `blur(${(1 - p) * 6}px)`,
                    fontFamily: accent ? serif.fontFamily : undefined,
                    fontStyle: accent ? "italic" : undefined,
                    fontWeight: 400,
                    letterSpacing: accent ? "-0.02em" : undefined,
                    color: accent ? t.accent : undefined,
                    fontSize: accent ? "1.08em" : undefined,
                    lineHeight: accent ? 0.96 : undefined,
                  }}
                >
                  {word}
                </span>
              </span>
            );
          })}
        </div>
      </AbsoluteFill>
      <AbsoluteFill style={{ perspective: portrait ? 2400 : 1600 }}>
        {order.map((i) => {
          const s = slots[i] as Slot;
          if (frame < s.t) return null;
          const now = stateAt(i, frame);
          const prev = stateAt(i, frame - 1);
          const moving = Math.hypot(now.x - prev.x, now.y - prev.y) > 4 ? 1 : 0;
          const flat = 1 - now.q;
          const depthBlur = (1 - s.z) * (portrait ? 7 : 6) * flat;
          const dim = 1 - (1 - s.z) * (light ? 0.25 : 0.45) * flat;
          const fade =
            now.k >= 0
              ? 1
              : interpolate(
                  frame,
                  [convergeStart(i) + 6, convergeStart(i) + 14],
                  [1, 0],
                  CLAMP,
                );
          const locked = now.k >= 0 && frame >= beat("land");
          const scale = locked
            ? punch * lockPush
            : 0.6 + 0.4 * Math.min(1.04, now.pop);
          const rotY = ((now.x - cx) / W) * -22 * flat;
          const rotX = ((now.y - cy) / H) * 16 * flat;
          const rotZ = s.rot * flat;
          const lift = (18 + 30 * s.z) * unit * flat + 4 * unit;
          const [s1, s2, s3] = t.shadow;
          const src = srcs[i % srcs.length] as string;
          return (
            <div
              key={`ph-${i}`}
              style={{
                position: "absolute",
                left: now.x - now.w / 2,
                top: now.y - now.h / 2,
                width: now.w,
                height: now.h,
                borderRadius: now.r,
                opacity: Math.min(1, now.pop * 2.4) * fade,
                transform: `scale(${scale}) rotateX(${rotX}deg) rotateY(${rotY}deg) rotateZ(${rotZ}deg)`,
                transformOrigin: locked
                  ? `${cx - (now.x - now.w / 2)}px ${cy - (now.y - now.h / 2)}px`
                  : "50% 50%",
                filter: `${moving ? `url(#ph2-mb-${i}) ` : ""}blur(${depthBlur}px) brightness(${dim})`,
                boxShadow: `0 0 0 ${ring * now.q}px ${t.ring}, 0 ${lift * 0.08}px ${lift * 0.16}px rgba(${t.shadowRgb},${s1}), 0 ${lift * 0.4}px ${lift}px rgba(${t.shadowRgb},${s2}), 0 ${lift}px ${lift * 2.6}px rgba(${t.shadowRgb},${s3})`,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: "inherit",
                  overflow: "hidden",
                }}
              >
                <Img
                  src={src}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: "inherit",
                    boxShadow: `inset 0 0 0 1px ${t.hairline}, inset 0 1px 0 rgba(255,255,255,0.22)`,
                    backgroundImage:
                      "linear-gradient(160deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0) 40%, rgba(0,0,0,0) 70%, rgba(0,0,0,0.16) 100%)",
                  }}
                />
              </div>
            </div>
          );
        })}
      </AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: portrait ? cx - logoW / 2 : cx - groupW / 2,
          top: portrait ? cy - d * 0.7 - logoSize * 1.25 : cy - logoSize * 0.56,
          height: logoSize * 1.1,
          display: "flex",
          alignItems: "center",
          clipPath: portrait
            ? `inset(${(1 - logoP) * 100}% -10% -20% -10%)`
            : `inset(-20% ${(1 - logoP) * 100}% -20% 0)`,
          transform: portrait
            ? `translateY(${(1 - logoP) * logoSize * 0.4}px) scale(${lockPush})`
            : `translateX(${(1 - logoP) * logoSize * 0.5}px) scale(${lockPush})`,
          transformOrigin: portrait ? "50% 50%" : `${groupW / 2}px 50%`,
          opacity: logoP > 0 ? 1 : 0,
        }}
      >
        <RemocnLogo fontSize={logoSize} color={fg} />
      </div>
    </AbsoluteFill>
  );
}

export default PhotoHalo;
