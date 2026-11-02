"use client";

import { loadFont } from "@remotion/google-fonts/HankenGrotesk";
import { loadFont as loadSerif } from "@remotion/google-fonts/InstrumentSerif";
import { loadFont as loadManrope } from "@remotion/google-fonts/Manrope";
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

const { fontFamily } = loadFont("normal", {
  weights: ["300", "400"],
  subsets: ["latin"],
});
const { fontFamily: serif } = loadSerif("italic", {
  weights: ["400"],
  subsets: ["latin"],
});
const manrope = loadManrope("normal", {
  weights: ["600"],
  subsets: ["latin"],
});

export interface RatingReview {
  quote: string;
  name: string;
  city: string;
  date?: string;
  hue?: number;
}

export interface RatingCategory {
  label: string;
  score: number;
  icon: "docs" | "motion" | "setup" | "support" | "value";
}

export interface RatingLaurelProps {
  rating?: number;
  title?: string;
  subtitle?: string;
  reviews?: RatingReview[];
  reviewCount?: number;
  categories?: RatingCategory[];
  device?: "web" | "phone";
  accent?: string;
  speed?: number;
  theme?: "light" | "dark";
  ground?: GshPresetId;
  groundParams?: Partial<GradientParams>;
}

const DEFAULT_REVIEWS: RatingReview[] = [
  {
    quote:
      "We shipped our launch video the same afternoon we installed it. The transitions feel hand-tuned, and owning the code meant we could tweak every spring.",
    name: "Maya Chen",
    city: "Portland, Oregon",
    date: "March 2026",
    hue: 18,
  },
  {
    quote:
      "I’m not a motion designer and it didn’t matter. Picked three scenes, dropped in our screenshots, rendered. It looked like a studio made it.",
    name: "Leo Park",
    city: "Seoul, South Korea",
    date: "March 2026",
    hue: 210,
  },
  {
    quote:
      "Every component tells you when to use it and when not to. Saved me a full week of keyframing for our Kitebase launch.",
    name: "Priya Raman",
    city: "Austin, Texas",
    date: "February 2026",
    hue: 300,
  },
  {
    quote:
      "Finally, Remotion components that look like current product UI instead of a slideshow. The counter alone got us forty replies.",
    name: "Jonas Weber",
    city: "Berlin, Germany",
    date: "February 2026",
    hue: 150,
  },
  {
    quote:
      "Our whole team edits the video in code review now. Fernway’s launch went from a two-week project to a Friday afternoon.",
    name: "Ana Souza",
    city: "Lisbon, Portugal",
    date: "January 2026",
    hue: 260,
  },
];

const DEFAULT_CATEGORIES: RatingCategory[] = [
  { label: "Docs", score: 4.9, icon: "docs" },
  { label: "Motion", score: 5.0, icon: "motion" },
  { label: "Setup", score: 4.9, icon: "setup" },
  { label: "Support", score: 4.8, icon: "support" },
  { label: "Value", score: 5.0, icon: "value" },
];

const ICONS: Record<RatingCategory["icon"], string> = {
  docs: "M6 3.5h8.5L18 7v13.5H6zM14 3.5V7.5h4M9 12h6M9 15.5h6",
  motion: "M3.5 12h4l2.5-6 4 12 2.5-6h4",
  setup: "M5 7h14M5 12h14M5 17h14M9 5v4M15 10v4M8 15v4",
  support: "M4.5 5.5h15v10h-9l-4 3.5v-3.5h-2z",
  value: "M12 3.5l8.5 8.5-8.5 8.5L3.5 12zM12 8.5v7M8.5 12h7",
};

const STAR =
  "M12 2.6l2.85 6.05 6.62.78-4.9 4.53 1.3 6.54L12 17.2l-5.87 3.3 1.3-6.54-4.9-4.53 6.62-.78z";

const REMOCN_R_PATH =
  "M 0.01 0.81 C 0.01 1.73, 0.36 2.79, 1.09 4.13 C 4.91 11.04, 13.45 17.16, 21.7 18.9 C 22.94 19.16, 23.18 19.16, 51.39 19.27 C 76.07 19.36, 80.02 19.4, 81.32 19.57 C 89.89 20.69, 96.2 24.68, 99.38 31.01 C 103.19 38.56, 102.53 50.1, 97.91 57.07 C 94.66 61.96, 89.68 64.99, 83.26 66 C 82.81 66.07, 70.18 66.83, 55.2 67.69 C 24.82 69.43, 27.03 69.23, 24.18 70.4 C 19.9 72.15, 14.84 75.7, 10.65 79.89 C 4.86 85.68, 1.3 91.91, 0.25 98.13 C 0.12 98.85, 0.08 103.13, 0.04 116.66 L 0 134.26 9.5 134.26 L 19 134.26 19.05 119.41 C 19.1 103.27, 19.08 103.82, 19.82 101.04 C 21.79 93.65, 27.86 88.75, 36.45 87.63 C 37.23 87.53, 39.41 87.5, 43.57 87.53 C 50.12 87.59, 50.75 87.65, 53.22 88.45 C 56.61 89.56, 59.67 91.86, 62.02 95.07 C 62.52 95.76, 69.35 103.85, 77.2 113.07 C 85.04 122.28, 91.63 130.04, 91.85 130.32 C 92.07 130.59, 92.5 131.34, 92.82 131.97 C 93.52 133.35, 94.11 133.93, 95.06 134.13 C 95.5 134.23, 98.97 134.26, 106.36 134.23 L 117.01 134.19 100.82 113.07 C 91.91 101.45, 84.52 91.78, 84.39 91.57 C 83.36 89.89, 83.66 87.53, 85.09 86 C 85.79 85.25, 86.36 84.94, 88.07 84.38 C 96.18 81.72, 104.15 76.62, 109.97 70.36 C 120.59 58.93, 124.06 44.32, 119.44 30.43 C 114.59 15.81, 101.93 4.02, 87.64 0.83 C 83.93 0.01, 88.09 0.08, 41.85 0.04 L 0.01 0 0.01 0.81 Z";

const SW = 393;
const SH = 852;
const BEZEL = 11;
const BW = SW + BEZEL * 2;
const BH = SH + BEZEL * 2;

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const ENTER = Easing.bezier(0.32, 0.72, 0, 1);
const MOVE = Easing.bezier(0.65, 0, 0.35, 1);
const CAM = Easing.bezier(0.87, 0, 0.13, 1);
const HEAVY = { mass: 1, damping: 26, stiffness: 120 };
const CARD = { mass: 0.8, damping: 18, stiffness: 160 };
const CHIP = { mass: 0.5, damping: 12, stiffness: 200 };

const BEAT = {
  laurel: 4,
  number: 10,
  title: 36,
  sub: 42,
  camFrom: 60,
  camTo: 108,
  categories: 72,
  cards: 84,
  glideFrom: 108,
  glideTo: 250,
  cta: 96,
};

const LIGHT = {
  page: "#FFFFFF",
  ink: "#1C1C1E",
  muted: "#6B6B70",
  hair: "rgba(20,20,30,0.08)",
  pill: "#F2F2F3",
  window:
    "0 0 0 1px rgba(16,20,40,0.06), 0 2px 4px rgba(16,20,40,0.04), 0 30px 80px -24px rgba(16,24,64,0.32)",
  leafLit: "#4A4A50",
  leafShade: "#141416",
  vein: "#FFFFFF",
  over: "#FFFFFF",
  overMuted: "rgba(255,255,255,0.72)",
};
const DARK: typeof LIGHT = {
  page: "#111215",
  ink: "#F2F1EE",
  muted: "#9C9CA3",
  hair: "rgba(255,255,255,0.08)",
  pill: "#1F2024",
  window:
    "0 0 0 1px rgba(255,255,255,0.09), inset 0 1px 0 rgba(255,255,255,0.05), 0 30px 80px -20px rgba(0,0,0,0.7)",
  leafLit: "#F2F1EE",
  leafShade: "#A9A7A2",
  vein: "#111215",
  over: "#FFFFFF",
  overMuted: "rgba(255,255,255,0.68)",
};
type Palette = typeof LIGHT;

const P0 = [44, 112];
const P1 = [2, 78];
const P2 = [30, 8];
const LIGHT_DIR = [-0.45, -0.9];
const LEAVES = Array.from({ length: 8 }, (_, i) => {
  const tip = i === 7;
  const t = tip ? 1 : 0.1 + i * 0.122;
  const u = 1 - t;
  const x = u * u * P0[0] + 2 * u * t * P1[0] + t * t * P2[0];
  const y = u * u * P0[1] + 2 * u * t * P1[1] + t * t * P2[1];
  const dx = 2 * u * (P1[0] - P0[0]) + 2 * t * (P2[0] - P1[0]);
  const dy = 2 * u * (P1[1] - P0[1]) + 2 * t * (P2[1] - P1[1]);
  const tangent = (Math.atan2(dy, dx) * 180) / Math.PI;
  const angle = tangent + (tip ? 0 : i % 2 === 0 ? -40 : 40);
  const a = (angle * Math.PI) / 180;
  const upperLit = Math.sin(a) * LIGHT_DIR[0] - Math.cos(a) * LIGHT_DIR[1] > 0;
  return { x, y, angle, len: tip ? 22 : 31 - t * 11, upperLit };
});

function halfLeaf(len: number, side: number) {
  const w = len * 0.42 * side;
  return `M0 0C${len * 0.24} ${w * 1.2} ${len * 0.78} ${w} ${len} 0Z`;
}

function Laurel({
  h,
  f,
  at,
  fps,
  mirror,
  c,
}: {
  h: number;
  f: number;
  at: number;
  fps: number;
  mirror?: boolean;
  c: Palette;
}) {
  const stem = interpolate(f, [at, at + 22], [0, 1], {
    ...clamp,
    easing: ENTER,
  });
  return (
    <svg
      width={h * 0.5}
      height={h}
      viewBox="0 0 60 120"
      style={{
        overflow: "visible",
        transform: mirror ? "scaleX(-1)" : undefined,
      }}
    >
      <path
        d={`M${P0[0] + 10} ${P0[1] - 3}C${P0[0] + 8} ${P0[1] + 6} ${P0[0] + 1} ${P0[1] + 4} ${P0[0]} ${P0[1]}Q${P1[0]} ${P1[1]} ${P2[0]} ${P2[1]}`}
        fill="none"
        stroke={c.leafShade}
        strokeWidth={2.2}
        strokeLinecap="round"
        pathLength={1}
        strokeDasharray={1}
        strokeDashoffset={1 - stem}
      />
      {LEAVES.map((leaf, i) => {
        const g = spring({
          frame: f - at - 3 - i * 2.4,
          fps,
          config: CHIP,
        });
        const k = 0.3 + 0.7 * g;
        const L = leaf.len;
        return (
          <g
            key={`${leaf.x}-${leaf.y}`}
            opacity={Math.min(1, g * 2)}
            transform={`translate(${leaf.x} ${leaf.y}) rotate(${leaf.angle}) scale(${k})`}
          >
            <path
              d={halfLeaf(L, -1)}
              fill={leaf.upperLit ? c.leafLit : c.leafShade}
            />
            <path
              d={halfLeaf(L, 1)}
              fill={leaf.upperLit ? c.leafShade : c.leafLit}
            />
            <path
              d={`M2 0L${L * 0.86} 0`}
              stroke={c.vein}
              strokeOpacity={0.35}
              strokeWidth={0.6}
              strokeLinecap="round"
            />
          </g>
        );
      })}
    </svg>
  );
}

function RollingNumber({
  text,
  f,
  at,
  size,
  color,
}: {
  text: string;
  f: number;
  at: number;
  size: number;
  color: string;
}) {
  const lh = size * 1.1;
  const travel = lh * 0.3;
  let di = -1;
  return (
    <div
      style={{
        display: "flex",
        fontSize: size,
        fontWeight: 300,
        letterSpacing: "-0.045em",
        fontVariantNumeric: "tabular-nums",
        color,
        lineHeight: `${lh}px`,
      }}
    >
      {text.split("").map((ch, i) => {
        if (!/\d/.test(ch)) return <span key={`c${i}`}>{ch}</span>;
        di += 1;
        const steps = 3 + di * 2;
        const target = Number(ch);
        let t = at + di * 4;
        let k = 0;
        let s = 1;
        for (let j = 1; j <= steps; j++) {
          const gap = 1 + j * 1.1;
          if (f < Math.round(t)) break;
          k = j;
          const t0 = Math.round(t);
          s = interpolate(
            f,
            [t0, t0 + Math.min(4, Math.round(gap) + 1)],
            [0, 1],
            { ...clamp, easing: ENTER },
          );
          t += gap;
        }
        const val = (n: number) => (((target - steps + n) % 10) + 10) % 10;
        const glyph = (n: number, y: number, o: number) => (
          <span
            style={{
              position: "absolute",
              inset: 0,
              textAlign: "center",
              opacity: o,
              transform: `translateY(${y}px)`,
            }}
          >
            {val(n)}
          </span>
        );
        return (
          <span
            key={`d${i}`}
            style={{
              position: "relative",
              height: lh,
              display: "inline-block",
              overflow: "hidden",
            }}
          >
            <span style={{ visibility: "hidden" }}>{ch}</span>
            {k > 0 && s < 1
              ? glyph(k - 1, -s * travel, Math.max(0, 1 - s * 2.5))
              : null}
            {glyph(k, (1 - s) * travel, k > 0 ? Math.min(1, s * 1.25) : 1)}
          </span>
        );
      })}
    </div>
  );
}

function Stars({
  size,
  color,
  gap = 1,
}: {
  size: number;
  color: string;
  gap?: number;
}) {
  return (
    <div style={{ display: "flex", gap }}>
      {[0, 1, 2, 3, 4].map((i) => (
        <svg key={i} width={size} height={size} viewBox="0 0 24 24">
          <path d={STAR} fill={color} />
        </svg>
      ))}
    </div>
  );
}

function RichText({ text, color }: { text: string; color: string }) {
  return (
    <>
      {text.split("**").map((part, i) => (
        <span key={`${i}${part}`} style={i % 2 === 1 ? { color } : undefined}>
          {part}
        </span>
      ))}
    </>
  );
}

function Avatar({
  name,
  hue,
  size,
  dark,
}: {
  name: string;
  hue: number;
  size: number;
  dark: boolean;
}) {
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2);
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        flexShrink: 0,
        background: dark ? `hsl(${hue} 14% 24%)` : `hsl(${hue} 30% 92%)`,
        color: dark ? `hsl(${hue} 30% 82%)` : `hsl(${hue} 30% 32%)`,
        fontSize: size * 0.38,
        fontWeight: 400,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: `inset 0 0 0 1px ${dark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.06)"}`,
      }}
    >
      {initials}
    </div>
  );
}

function ReviewCard({
  review,
  c,
  w,
  u,
  lines,
  dark,
}: {
  review: RatingReview;
  c: Palette;
  w: number;
  u: number;
  lines: number;
  dark: boolean;
}) {
  return (
    <div style={{ width: w, flexShrink: 0, boxSizing: "border-box" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 * u }}>
        <Avatar
          name={review.name}
          hue={review.hue ?? 200}
          size={40 * u}
          dark={dark}
        />
        <div>
          <div style={{ fontSize: 17 * u, fontWeight: 400, color: c.ink }}>
            {review.name}
          </div>
          <div style={{ fontSize: 15 * u, color: c.muted, marginTop: 1 }}>
            {review.city}
          </div>
        </div>
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8 * u,
          marginTop: 12 * u,
          fontSize: 15 * u,
          color: c.muted,
        }}
      >
        <Stars size={11 * u} color={c.ink} gap={1} />
        <span>{review.date ?? "March 2026"}</span>
      </div>
      <div
        style={{
          marginTop: 8 * u,
          fontSize: 16 * u,
          lineHeight: 1.5,
          color: c.ink,
          height: 16 * u * 1.5 * lines,
          overflow: "hidden",
          display: "-webkit-box",
          WebkitLineClamp: lines,
          WebkitBoxOrient: "vertical",
          textWrap: "pretty",
        }}
      >
        {review.quote}
      </div>
    </div>
  );
}

const Icon = ({
  d,
  size,
  color,
}: {
  d: string;
  size: number;
  color: string;
}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path
      d={d}
      stroke={color}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

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

function StatusBar({ color }: { color: string }) {
  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: 54,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "6px 34px 0 52px",
        boxSizing: "border-box",
        zIndex: 8,
      }}
    >
      <span style={{ fontSize: 17, fontWeight: 400, color }}>9:41</span>
      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
        <svg width="18" height="12" viewBox="0 0 18 12">
          {[0, 1, 2, 3].map((i) => (
            <rect
              key={i}
              x={i * 4.6}
              y={9 - i * 3}
              width={3.2}
              height={3 + i * 3}
              rx={0.8}
              fill={color}
            />
          ))}
        </svg>
        <div
          style={{
            width: 25,
            height: 12,
            borderRadius: 3.5,
            border: `1px solid ${color}`,
            padding: 1.5,
            boxSizing: "border-box",
          }}
        >
          <div
            style={{
              width: "80%",
              height: "100%",
              borderRadius: 2,
              background: color,
            }}
          />
        </div>
      </div>
    </div>
  );
}

function Phone({
  children,
  dark,
}: {
  children: React.ReactNode;
  dark: boolean;
}) {
  const btn = (side: "left" | "right", top: number, h: number) => (
    <div
      style={{
        position: "absolute",
        [side]: -3,
        top,
        width: 4,
        height: h,
        borderRadius: 2,
        background: "#3A3A3D",
      }}
    />
  );
  return (
    <div style={{ position: "relative", width: BW, height: BH }}>
      {btn("left", 150, 32)}
      {btn("left", 210, 62)}
      {btn("left", 284, 62)}
      {btn("right", 236, 98)}
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: 66,
          background: "#0B0B0C",
          boxShadow: `inset 0 0 0 1.5px #6E6E73, inset 0 0 0 3px #1C1C1E, ${dark ? "0 50px 100px -20px rgba(0,0,0,0.7)" : "0 2px 6px rgba(16,20,40,0.12), 0 50px 100px -30px rgba(16,24,64,0.45)"}`,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: BEZEL,
          top: BEZEL,
          width: SW,
          height: SH,
          borderRadius: 55,
          overflow: "hidden",
        }}
      >
        {children}
        <div
          style={{
            position: "absolute",
            top: 11,
            left: (SW - 126) / 2,
            width: 126,
            height: 37,
            borderRadius: 19,
            background: "#000",
            zIndex: 20,
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: 8,
            left: (SW - 134) / 2,
            width: 134,
            height: 5,
            borderRadius: 3,
            background: dark ? "#fff" : "#111",
            zIndex: 20,
          }}
        />
      </div>
    </div>
  );
}

export function RatingLaurel({
  rating = 4.96,
  title = "Loved by builders",
  subtitle = "remocn is in the **top 5%** of launch tools, based on ratings, reviews, and reliability",
  reviews = DEFAULT_REVIEWS,
  reviewCount = 298,
  categories = DEFAULT_CATEGORIES,
  device = "web",
  accent = "#3B5BFD",
  speed = 1,
  theme = "light",
  ground,
  groundParams,
}: RatingLaurelProps) {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const f = frame * speed;
  const dark = theme === "dark";
  const c = dark ? DARK : LIGHT;
  const tall = height > width;
  const phone = device === "phone" || tall;

  const sp = (at: number, config: typeof CARD) =>
    spring({ frame: f - at, fps, config });
  const fadeUp = (at: number, dy = 14): React.CSSProperties => {
    const v = interpolate(f, [at, at + 14], [0, 1], {
      ...clamp,
      easing: ENTER,
    });
    return {
      opacity: v,
      transform: `translateY(${(1 - v) * dy}px)`,
    };
  };

  const groundEl = (
    <>
      <GshGround
        preset={ground ?? (dark ? "earthshine" : "paper-crease")}
        params={groundParams}
        timeOffset={5}
        timeScale={0.35}
      />
      {dark ? (
        <AbsoluteFill
          style={{
            background:
              "radial-gradient(80% 70% at 40% 40%, rgba(3,5,12,0.5), rgba(3,5,12,0) 100%)",
          }}
        />
      ) : null}
    </>
  );

  const hero = (scale: number) => (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 * scale }}>
        <Laurel h={104 * scale} f={f} at={BEAT.laurel} fps={fps} c={c} />
        <RollingNumber
          text={rating.toFixed(2)}
          f={f}
          at={BEAT.number}
          size={92 * scale}
          color={c.ink}
        />
        <Laurel h={104 * scale} f={f} at={BEAT.laurel} fps={fps} c={c} mirror />
      </div>
      <div
        style={{
          marginTop: 6 * scale,
          fontSize: 26 * scale,
          fontWeight: 400,
          letterSpacing: "-0.02em",
          color: c.ink,
          ...fadeUp(BEAT.title),
        }}
      >
        {title}
      </div>
      <div
        style={{
          marginTop: 6 * scale,
          maxWidth: 420 * scale,
          fontSize: 17 * scale,
          lineHeight: 1.45,
          color: c.muted,
          textWrap: "balance",
          ...fadeUp(BEAT.sub, 10),
        }}
      >
        <RichText text={subtitle} color={c.ink} />
      </div>
    </div>
  );

  if (phone) {
    const u = 1;
    const cardW = 300;
    const step = cardW + 28;
    const glide = interpolate(
      f,
      [BEAT.glideFrom, BEAT.glideTo],
      [0, step * 2],
      {
        ...clamp,
        easing: MOVE,
      },
    );
    const pk = tall ? (height * 0.6) / BH : (height * 0.9) / BH;
    const phoneC = tall
      ? { x: width / 2, y: height * 0.37 }
      : { x: width * 0.7, y: height / 2 };
    const rise = sp(0, HEAVY);
    const s = width / (tall ? 1080 : 1280);
    const lineIn = (d: number) =>
      interpolate(f, [18 + d, 34 + d], [0, 1], { ...clamp, easing: ENTER });
    const barIn = sp(BEAT.cta, CARD);
    return (
      <AbsoluteFill style={{ fontFamily, overflow: "hidden" }}>
        {groundEl}
        <div
          style={{
            position: "absolute",
            left: phoneC.x - BW / 2,
            top: phoneC.y - BH / 2,
            width: BW,
            height: BH,
            transform: `translateY(${(1 - rise) * height * 0.7}px) scale(${pk * (1 + 0.02 * (f / 270))})`,
          }}
        >
          <Phone dark={dark}>
            <div style={{ position: "absolute", inset: 0, background: c.page }}>
              <StatusBar color={c.ink} />
              <div
                style={{
                  position: "absolute",
                  top: 58,
                  left: 20,
                  right: 20,
                  height: 40,
                  display: "flex",
                  alignItems: "center",
                  gap: 22,
                }}
              >
                <Icon d="M19 12H5M11 5l-7 7 7 7" size={22} color={c.ink} />
                <div style={{ flex: 1 }} />
                <Icon
                  d="M12 3v12M7 8l5-5 5 5M5 13v7h14v-7"
                  size={20}
                  color={c.ink}
                />
                <Icon
                  d="M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.4 4.3 4.3 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10z"
                  size={21}
                  color={c.ink}
                />
              </div>
              <div
                style={{ position: "absolute", top: 104, left: 0, right: 0 }}
              >
                {hero(0.8)}
              </div>
              <div
                style={{
                  position: "absolute",
                  top: 330,
                  left: 22,
                  right: 22,
                  display: "flex",
                  borderTop: `1px solid ${c.hair}`,
                  borderBottom: `1px solid ${c.hair}`,
                  padding: "12px 0",
                  ...fadeUp(BEAT.categories - 4, 0),
                }}
              >
                {categories.slice(0, 4).map((cat, i) => {
                  const v = sp(BEAT.categories + i * 3, CHIP);
                  return (
                    <div
                      key={cat.label}
                      style={{
                        flex: 1,
                        paddingLeft: i === 0 ? 0 : 10,
                        borderLeft: i === 0 ? "none" : `1px solid ${c.hair}`,
                        opacity: Math.min(1, v * 1.5),
                        transform: `translateY(${(1 - v) * 10}px)`,
                      }}
                    >
                      <div style={{ fontSize: 13, color: c.muted }}>
                        {cat.label}
                      </div>
                      <div
                        style={{
                          fontSize: 17,
                          color: c.ink,
                          fontVariantNumeric: "tabular-nums",
                          marginTop: 2,
                        }}
                      >
                        {cat.score.toFixed(1)}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div
                style={{
                  position: "absolute",
                  top: 430,
                  left: 22,
                  display: "flex",
                  gap: 28,
                  transform: `translateX(${-glide}px)`,
                }}
              >
                {[...reviews, ...reviews].map((r, i) => {
                  const v = sp(BEAT.cards + Math.min(i, 4) * 3, CARD);
                  return (
                    <div
                      key={`${r.name}-${i < reviews.length ? "a" : "b"}`}
                      style={{
                        opacity: Math.min(1, v * 1.4),
                        transform: `translateX(${(1 - v) * 48}px)`,
                      }}
                    >
                      <ReviewCard
                        review={r}
                        c={c}
                        w={cardW}
                        u={u * 0.92}
                        lines={5}
                        dark={dark}
                      />
                    </div>
                  );
                })}
              </div>
              <div
                style={{
                  position: "absolute",
                  top: 618,
                  left: 22,
                  right: 22,
                  height: 48,
                  borderRadius: 12,
                  background: c.pill,
                  color: c.ink,
                  fontSize: 16,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  ...fadeUp(BEAT.cta + 6, 8),
                }}
              >
                Show all {reviewCount} reviews
              </div>
              <div
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: 112,
                  background: c.page,
                  borderTop: `1px solid ${c.hair}`,
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  padding: "18px 22px 0",
                  boxSizing: "border-box",
                  transform: `translateY(${(1 - barIn) * 112}px)`,
                }}
              >
                <div style={{ color: c.ink }}>
                  <div style={{ fontSize: 18, fontWeight: 400 }}>Free</div>
                  <div style={{ fontSize: 13, color: c.muted, marginTop: 3 }}>
                    MIT licensed · own the code
                  </div>
                </div>
                <div
                  style={{
                    width: 140,
                    height: 48,
                    borderRadius: 12,
                    background: accent,
                    color: "#fff",
                    fontSize: 16,
                    fontWeight: 400,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow:
                      "inset 0 1px 0 rgba(255,255,255,0.2), 0 1px 2px rgba(0,0,0,0.12)",
                  }}
                >
                  Install
                </div>
              </div>
            </div>
          </Phone>
        </div>
        <div
          style={{
            position: "absolute",
            ...(tall
              ? { left: 90 * s, right: 90 * s, top: height * 0.72 }
              : { left: 96 * s, width: 470 * s, top: height / 2 - 120 * s }),
            color: dark ? c.ink : "#15161B",
            textAlign: tall ? "center" : "left",
          }}
        >
          <div
            style={{
              fontSize: (tall ? 26 : 20) * s,
              color: dark ? c.muted : "#4F5260",
              fontVariantNumeric: "tabular-nums",
              ...{
                opacity: lineIn(0),
                transform: `translateY(${(1 - lineIn(0)) * 10}px)`,
              },
            }}
          >
            {reviewCount} reviews
          </div>
          <div style={{ overflow: "hidden", paddingBottom: 8 * s }}>
            <div
              style={{
                marginTop: 10 * s,
                fontSize: (tall ? 84 : 62) * s,
                fontWeight: 300,
                lineHeight: 1.04,
                letterSpacing: "-0.04em",
                textWrap: "balance",
                transform: `translateY(${(1 - lineIn(4)) * 105}%)`,
              }}
            >
              Rated {rating.toFixed(2)} by the people who{" "}
              <span
                style={{
                  fontFamily: serif,
                  fontStyle: "italic",
                  letterSpacing: "-0.02em",
                }}
              >
                ship
              </span>{" "}
              with it.
            </div>
          </div>
        </div>
      </AbsoluteFill>
    );
  }

  const cardW = 270;
  const step = cardW + 40;
  const glide = interpolate(f, [BEAT.glideFrom, BEAT.glideTo], [0, step * 2], {
    ...clamp,
    easing: MOVE,
  });
  const winW = 1000;
  const winH = 640;
  const winX = (1280 - winW) / 2;
  const winY = (720 - winH) / 2;
  const cam = interpolate(f, [BEAT.camFrom, BEAT.camTo], [0, 1], {
    ...clamp,
    easing: CAM,
  });
  const zoom = 1.8 - 0.8 * cam;
  const focusY = winY + 215;
  const ty = (1 - cam) * (360 - focusY);
  const winIn = sp(0, HEAVY);
  const push = 1 + 0.02 * interpolate(f, [BEAT.camTo, 270], [0, 1], clamp);
  const s = width / 1280;
  return (
    <AbsoluteFill style={{ fontFamily, overflow: "hidden" }}>
      {groundEl}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: 1280,
          height: 720,
          transform: `scale(${s})`,
          transformOrigin: "0 0",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            transform: `translateY(${ty + (1 - winIn) * 30}px) scale(${zoom * push})`,
            transformOrigin: `640px ${focusY}px`,
          }}
        >
          <div
            style={{
              position: "absolute",
              left: winX,
              top: winY,
              width: winW,
              height: winH,
              borderRadius: 18,
              background: c.page,
              boxShadow: c.window,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: 60,
                borderBottom: `1px solid ${c.hair}`,
                display: "flex",
                alignItems: "center",
                padding: "0 32px",
                opacity: interpolate(
                  f,
                  [BEAT.camFrom + 10, BEAT.camTo],
                  [0, 1],
                  {
                    ...clamp,
                    easing: ENTER,
                  },
                ),
              }}
            >
              <div style={{ flex: 1 }}>
                <RemocnLogo fontSize={22} color={c.ink} />
              </div>
              <div style={{ display: "flex", gap: 28, fontSize: 16 }}>
                {["Components", "Templates", "Reviews"].map((t, i) => (
                  <span key={t} style={{ color: i === 2 ? c.ink : c.muted }}>
                    {t}
                  </span>
                ))}
              </div>
              <div
                style={{ flex: 1, display: "flex", justifyContent: "flex-end" }}
              >
                <div
                  style={{
                    height: 36,
                    padding: "0 16px",
                    borderRadius: 10,
                    background: accent,
                    color: "#fff",
                    fontSize: 16,
                    display: "flex",
                    alignItems: "center",
                    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.2)",
                  }}
                >
                  Install
                </div>
              </div>
            </div>
            <div style={{ position: "absolute", top: 84, left: 0, right: 0 }}>
              {hero(1)}
            </div>
            <div
              style={{
                position: "absolute",
                top: 318,
                left: 80,
                right: 80,
                display: "flex",
                borderTop: `1px solid ${c.hair}`,
                borderBottom: `1px solid ${c.hair}`,
                padding: "16px 0",
                ...fadeUp(BEAT.categories - 4, 0),
              }}
            >
              {categories.map((cat, i) => {
                const v = sp(BEAT.categories + i * 3, CHIP);
                return (
                  <div
                    key={cat.label}
                    style={{
                      flex: 1,
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      paddingLeft: i === 0 ? 0 : 20,
                      borderLeft: i === 0 ? "none" : `1px solid ${c.hair}`,
                      opacity: Math.min(1, v * 1.5),
                      transform: `translateY(${(1 - v) * 10}px)`,
                    }}
                  >
                    <Icon d={ICONS[cat.icon]} size={24} color={c.ink} />
                    <div>
                      <div style={{ fontSize: 16, color: c.muted }}>
                        {cat.label}
                      </div>
                      <div
                        style={{
                          fontSize: 20,
                          color: c.ink,
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        {cat.score.toFixed(1)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div
              style={{
                position: "absolute",
                top: 428,
                left: 0,
                right: 0,
                paddingLeft: 80,
                maskImage:
                  "linear-gradient(90deg, transparent, #000 6%, #000 90%, transparent)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  gap: 40,
                  transform: `translateX(${-glide}px)`,
                }}
              >
                {[...reviews, ...reviews].map((r, i) => {
                  const v = sp(BEAT.cards + Math.min(i, 4) * 3, CARD);
                  return (
                    <div
                      key={`${r.name}-${i < reviews.length ? "a" : "b"}`}
                      style={{
                        opacity: Math.min(1, v * 1.4),
                        transform: `translateX(${(1 - v) * 48}px)`,
                      }}
                    >
                      <ReviewCard
                        review={r}
                        c={c}
                        w={cardW}
                        u={1}
                        lines={4}
                        dark={dark}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
}
