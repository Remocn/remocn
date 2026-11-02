"use client";

import { loadFont } from "@remotion/google-fonts/Onest";
import type React from "react";
import { useId } from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  interpolateColors,
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

export interface AppScreenshot {
  title: string;
  src?: string;
}

export interface AppStoreListingProps {
  appName?: string;
  subtitle?: string;
  developer?: string;
  iconSrc?: string;
  rating?: number;
  ratingCount?: string;
  ageRating?: string;
  category?: string;
  chartRank?: number;
  award?: string | null;
  screenshots?: AppScreenshot[];
  accent?: string;
  speed?: number;
  theme?: "light" | "dark";
  lines?: string[];
  ground?: GshPresetId;
  groundParams?: Partial<GradientParams>;
}

const SW = 390;
const SH = 844;
const BEZEL = 12;
const BW = SW + BEZEL * 2;
const BH = SH + BEZEL * 2;

const ICON = 118;
const HEAD_Y = 106;
const COL_X = 20 + ICON + 16;
const GET_Y = HEAD_Y + ICON - 30;
const GET_W = 76;
const STRIP_Y = 250;
const STRIP_H = 84;
const CELL_W = 106;
const SHOT_Y = STRIP_Y + STRIP_H + 18;
const SHOT_W = 188;
const SHOT_H = 406;
const SHOT_GAP = 10;
const PAGE = SHOT_W + SHOT_GAP;
const TAB_H = 83;

const T_TAP = 40;
const T_SPIN = T_TAP + 9;
const T_PROG = 64;
const T_DONE = 150;
const DRAG = [
  { down: 104, up: 115, settle: 127, from: 0 },
  { down: 131, up: 141, settle: 153, from: PAGE },
];

const LINE_AT = [0, T_TAP + 6, DRAG[0].down - 8, T_DONE];

const tween = (f: number, a: number, b: number, easing = enterE) =>
  interpolate(f, [a, b], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing,
  });
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const enterE = Easing.bezier(0.22, 1, 0.36, 1);
const exitE = Easing.bezier(0.55, 0, 1, 0.45);
const moveE = Easing.bezier(0.65, 0, 0.35, 1);
const camE = Easing.bezier(0.87, 0, 0.13, 1);
const morph = moveE;

type SpringCfg = { mass?: number; damping: number; stiffness?: number };
const HEAVY: SpringCfg = { mass: 1, damping: 26, stiffness: 120 };
const CARD: SpringCfg = { mass: 0.8, damping: 18, stiffness: 160 };
const CHIP: SpringCfg = { mass: 0.5, damping: 12, stiffness: 200 };
const MORPH: SpringCfg = { damping: 200 };

const REMOCN_R_PATH =
  "M 0.01 0.81 C 0.01 1.73, 0.36 2.79, 1.09 4.13 C 4.91 11.04, 13.45 17.16, 21.7 18.9 C 22.94 19.16, 23.18 19.16, 51.39 19.27 C 76.07 19.36, 80.02 19.4, 81.32 19.57 C 89.89 20.69, 96.2 24.68, 99.38 31.01 C 103.19 38.56, 102.53 50.1, 97.91 57.07 C 94.66 61.96, 89.68 64.99, 83.26 66 C 82.81 66.07, 70.18 66.83, 55.2 67.69 C 24.82 69.43, 27.03 69.23, 24.18 70.4 C 19.9 72.15, 14.84 75.7, 10.65 79.89 C 4.86 85.68, 1.3 91.91, 0.25 98.13 C 0.12 98.85, 0.08 103.13, 0.04 116.66 L 0 134.26 9.5 134.26 L 19 134.26 19.05 119.41 C 19.1 103.27, 19.08 103.82, 19.82 101.04 C 21.79 93.65, 27.86 88.75, 36.45 87.63 C 37.23 87.53, 39.41 87.5, 43.57 87.53 C 50.12 87.59, 50.75 87.65, 53.22 88.45 C 56.61 89.56, 59.67 91.86, 62.02 95.07 C 62.52 95.76, 69.35 103.85, 77.2 113.07 C 85.04 122.28, 91.63 130.04, 91.85 130.32 C 92.07 130.59, 92.5 131.34, 92.82 131.97 C 93.52 133.35, 94.11 133.93, 95.06 134.13 C 95.5 134.23, 98.97 134.26, 106.36 134.23 L 117.01 134.19 100.82 113.07 C 91.91 101.45, 84.52 91.78, 84.39 91.57 C 83.36 89.89, 83.66 87.53, 85.09 86 C 85.79 85.25, 86.36 84.94, 88.07 84.38 C 96.18 81.72, 104.15 76.62, 109.97 70.36 C 120.59 58.93, 124.06 44.32, 119.44 30.43 C 114.59 15.81, 101.93 4.02, 87.64 0.83 C 83.93 0.01, 88.09 0.08, 41.85 0.04 L 0.01 0 0.01 0.81 Z";

const LIGHT = {
  stage: "#EEF0F5",
  scrim: "rgba(246,246,248,0.2)",
  copy: "#121216",
  copyMuted: "rgba(18,18,22,0.42)",
  screen: "#ffffff",
  text: "#111113",
  muted: "#8a8a8e",
  hair: "rgba(60,60,67,0.16)",
  track: "#e3e3e8",
  blue: "#007AFF",
  tab: "rgba(250,250,250,0.94)",
  tabIdle: "#99999e",
  iconRing: "rgba(0,0,0,0.08)",
  touch: "rgba(20,20,30,0.18)",
  phoneShadow:
    "0 50px 90px -20px rgba(30,34,60,0.35), 0 12px 28px rgba(30,32,40,0.12), 0 2px 6px rgba(30,32,40,0.08)",
};
const DARK: typeof LIGHT = {
  stage: "#03050B",
  scrim: "rgba(2,3,8,0.25)",
  copy: "#F4F5F8",
  copyMuted: "rgba(244,245,248,0.42)",
  screen: "#000000",
  text: "#f5f5f7",
  muted: "#8d8d93",
  hair: "rgba(255,255,255,0.12)",
  track: "#3a3a3c",
  blue: "#0A84FF",
  tab: "rgba(22,22,24,0.94)",
  tabIdle: "#7c7c82",
  iconRing: "rgba(255,255,255,0.1)",
  touch: "rgba(255,255,255,0.2)",
  phoneShadow:
    "0 50px 100px -10px rgba(0,0,0,0.7), 0 12px 30px rgba(0,0,0,0.45)",
};
type Palette = typeof LIGHT;

const PATH = {
  back: "M15 18l-6-6 6-6",
  share:
    "M12 14V3M8 7l4-4 4 4M7 10H6a2 2 0 00-2 2v7a2 2 0 002 2h12a2 2 0 002-2v-7a2 2 0 00-2-2h-1",
  star: "M12 2.6l2.85 5.95 6.55.85-4.8 4.55 1.22 6.5L12 17.3l-5.82 3.15 1.22-6.5-4.8-4.55 6.55-.85z",
  person: "M12 12a4 4 0 100-8 4 4 0 000 8zM4.5 21a7.5 7.5 0 0115 0",
  today:
    "M5 4h14a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1V5a1 1 0 011-1zM8 9h8M8 13h8M8 17h4",
  games:
    "M6 9h12a4 4 0 014 4v1a3 3 0 01-5.4 1.8L15.5 14h-7l-1.1 1.8A3 3 0 012 14v-1a4 4 0 014-4zM7.5 11v3M6 12.5h3M16 12h.01M18 13.5h.01",
  apps: "M12 3l9 4.5-9 4.5-9-4.5zM3 12l9 4.5 9-4.5M3 16.5L12 21l9-4.5",
  updates: "M12 4v11M7.5 10.5L12 15l4.5-4.5M5 20h14",
  search: "M10.5 4a6.5 6.5 0 110 13 6.5 6.5 0 010-13zM20 20l-4.8-4.8",
  play: "M9 6.5v11l9-5.5z",
};

const DEFAULT_SHOTS: AppScreenshot[] = [
  { title: "Launch videos, written in React" },
  { title: "Drop in your own screenshots" },
  { title: "Render with one command" },
  { title: "Own every single frame" },
];

function Glyph({
  d,
  size = 24,
  color,
  sw = 1.75,
  fill = "none",
}: {
  d: string;
  size?: number;
  color: string;
  sw?: number;
  fill?: string;
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d={d}
        fill={fill}
        stroke={color}
        strokeWidth={sw}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Stars({
  rating,
  size,
  color,
  track,
}: {
  rating: number;
  size: number;
  color: string;
  track: string;
}) {
  const id = `st${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const w = size * 5 + 2 * 4;
  return (
    <svg width={w} height={size} viewBox={`0 0 ${w} ${size}`}>
      <defs>
        <clipPath id={id}>
          <rect width={(rating / 5) * w} height={size} />
        </clipPath>
      </defs>
      {[0, 1].map((layer) => (
        <g key={layer} clipPath={layer ? `url(#${id})` : undefined}>
          {[0, 1, 2, 3, 4].map((i) => (
            <path
              key={i}
              d={PATH.star}
              transform={`translate(${i * (size + 2)} 0) scale(${size / 24})`}
              fill={layer ? color : track}
            />
          ))}
        </g>
      ))}
    </svg>
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
        padding: "4px 30px 0 52px",
        zIndex: 30,
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
        <svg width="17" height="12" viewBox="0 0 17 12">
          <path
            d="M8.5 11.5l2.4-2.9a3.6 3.6 0 00-4.8 0zM3.7 6.2a7 7 0 019.6 0l1.6-1.9a9.6 9.6 0 00-12.8 0zM.5 2.9a12 12 0 0116 0"
            fill={color}
            stroke={color}
            strokeWidth={0.6}
          />
        </svg>
        <div
          style={{
            width: 26,
            height: 12.5,
            borderRadius: 4,
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
  screen,
  home,
}: {
  children: React.ReactNode;
  screen: string;
  home: string;
}) {
  const side = (s: "left" | "right", top: number, h: number) => (
    <div
      style={{
        position: "absolute",
        [s]: -2.5,
        top,
        width: 4,
        height: h,
        borderRadius: 2,
        background: "linear-gradient(90deg,#6f6f75,#d6d6db 50%,#6f6f75)",
      }}
    />
  );
  return (
    <div style={{ position: "relative", width: BW, height: BH }}>
      {side("left", 168, 30)}
      {side("left", 226, 60)}
      {side("left", 298, 60)}
      {side("right", 258, 96)}
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: 67,
          background:
            "linear-gradient(140deg,#e4e4e8 0%,#8a8a91 16%,#cfcfd4 38%,#77777e 62%,#c8c8cd 84%,#8b8b91 100%)",
          boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.35)",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 3,
          borderRadius: 64,
          background: "#050506",
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
          background: screen,
        }}
      >
        {children}
        <div
          style={{
            position: "absolute",
            top: 11,
            left: (SW - 124) / 2,
            width: 124,
            height: 36,
            borderRadius: 18,
            background: "#000",
            zIndex: 40,
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: 8,
            left: (SW - 136) / 2,
            width: 136,
            height: 5,
            borderRadius: 3,
            background: home,
            zIndex: 40,
          }}
        />
      </div>
    </div>
  );
}

function AppIcon({
  size,
  accent,
  src,
  ring,
}: {
  size: number;
  accent: string;
  src?: string;
  ring: string;
}) {
  const radius = size * 0.2237;
  const deep = interpolateColors(0.22, [0, 1], [accent, "#06070b"]);
  return (
    <div
      style={{
        position: "relative",
        width: size,
        height: size,
        borderRadius: radius,
        overflow: "hidden",
        flexShrink: 0,
        background: `linear-gradient(170deg, ${accent} 0%, ${deep} 100%)`,
      }}
    >
      {src ? (
        <Img
          src={src}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      ) : (
        <svg
          width={size}
          height={size}
          viewBox="-62 -62 248 258"
          style={{ position: "absolute", inset: 0 }}
        >
          <path d={REMOCN_R_PATH} fill="#ffffff" />
        </svg>
      )}
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: radius,
          boxShadow: `inset 0 0 0 1px ${ring}`,
        }}
      />
    </div>
  );
}

function Laurel({ color }: { color: string }) {
  const branch = (flip: boolean) => (
    <g transform={flip ? "translate(66 0) scale(-1 1)" : undefined}>
      <path
        d="M14 6C8 11 6.5 19 10 27"
        fill="none"
        stroke={color}
        strokeWidth={1.3}
        strokeLinecap="round"
      />
      {[0, 1, 2, 3, 4].map((i) => {
        const t = i / 4;
        const x = 13.2 - t * 5.8 + t * t * 2.2;
        const y = 7 + t * 18;
        return (
          <ellipse
            key={i}
            cx={x - 2.6}
            cy={y}
            rx={1.6}
            ry={3.4}
            fill={color}
            transform={`rotate(${-38 + t * 30} ${x - 2.6} ${y})`}
          />
        );
      })}
    </g>
  );
  return (
    <svg width={82} height={34} viewBox="0 0 66 32">
      {branch(false)}
      {branch(true)}
    </svg>
  );
}

function MockShot({
  index,
  title,
  accent,
}: {
  index: number;
  title: string;
  accent: string;
}) {
  const kind = index % 4;
  const bg = [
    accent,
    "#EDEBE6",
    "#0E0F12",
    interpolateColors(0.55, [0, 1], [accent, "#05060a"]),
  ][kind];
  const light = kind === 1;
  const ink = light ? "#16161A" : "#ffffff";
  const line = "rgba(255,255,255,0.08)";
  const row = (label: string, value: string, on = false) => (
    <div
      key={label}
      style={{
        display: "flex",
        justifyContent: "space-between",
        padding: "7px 0",
        borderTop: `1px solid ${line}`,
        color: on ? "#ffffff" : "#8d8d93",
        fontVariantNumeric: "tabular-nums",
      }}
    >
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
  const screen = (() => {
    if (kind === 0)
      return (
        <>
          <div
            style={{
              height: 92,
              borderRadius: 10,
              background: interpolateColors(0.3, [0, 1], [accent, "#0b0b0d"]),
              display: "flex",
              alignItems: "flex-end",
              padding: 8,
              color: "#fff",
              fontSize: 9,
            }}
          >
            launch.mp4
          </div>
          <div
            style={{
              marginTop: 10,
              height: 3,
              borderRadius: 2,
              background: "#2a2b30",
            }}
          >
            <div
              style={{
                width: "62%",
                height: 3,
                borderRadius: 2,
                background: "#fff",
              }}
            />
          </div>
          <div
            style={{
              marginTop: 6,
              display: "flex",
              justifyContent: "space-between",
              fontSize: 8,
              color: "#8d8d93",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            <span>0:18</span>
            <span>0:30</span>
          </div>
          <div style={{ marginTop: 10, fontSize: 9 }}>
            {row("Scenes", "6")}
            {row("Size", "1080p", true)}
            {row("Frame rate", "30 fps")}
          </div>
        </>
      );
    if (kind === 1)
      return (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 6,
          }}
        >
          {[0.18, 0.32, 0.46, 0.6].map((t) => (
            <div
              key={t}
              style={{
                height: 78,
                borderRadius: 8,
                background: interpolateColors(t, [0, 1], ["#3a3b40", accent]),
              }}
            />
          ))}
        </div>
      );
    if (kind === 2)
      return (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 6,
            fontSize: 8.5,
            color: "#d4d4d8",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          <span>$ npx remotion render</span>
          <span style={{ color: "#8d8d93" }}>Bundled in 1.2s</span>
          <span>Rendered 248 / 300</span>
          <div style={{ height: 3, borderRadius: 2, background: "#2a2b30" }}>
            <div
              style={{
                width: "83%",
                height: 3,
                borderRadius: 2,
                background: "#fff",
              }}
            />
          </div>
          <span style={{ color: "#8d8d93" }}>out/launch.mp4 · 14.2 MB</span>
        </div>
      );
    return (
      <div style={{ fontSize: 9 }}>
        {row("Intro", "0:00")}
        {row("Feature tour", "0:04", true)}
        {row("Pricing", "0:16")}
        {row("Call to action", "0:24")}
      </div>
    );
  })();
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: bg,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 18,
          right: 18,
          top: 24,
          textAlign: "center",
          color: ink,
          fontSize: 17,
          lineHeight: 1.18,
          fontWeight: 400,
          letterSpacing: "-0.02em",
          textWrap: "balance",
        }}
      >
        {title}
      </div>
      <div
        style={{
          position: "absolute",
          left: 22,
          right: 22,
          top: 92,
          height: SHOT_H,
          borderRadius: 26,
          background: "#0b0b0d",
          boxShadow: `0 0 0 3px ${light ? "rgba(17,17,19,0.08)" : "rgba(255,255,255,0.12)"}, 0 18px 40px rgba(0,0,0,0.22)`,
          padding: "36px 12px 0",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 9,
            left: "50%",
            width: 40,
            height: 12,
            marginLeft: -20,
            borderRadius: 6,
            background: "#000",
          }}
        />
        <div style={{ fontSize: 11, color: "#f5f5f7", marginBottom: 10 }}>
          remocn
        </div>
        <div style={{ position: "relative" }}>{screen}</div>
      </div>
    </div>
  );
}

export function AppStoreListing({
  appName = "remocn",
  subtitle = "Launch videos, written in React",
  developer = "remocn Labs",
  iconSrc,
  rating = 4.8,
  ratingCount = "12K",
  ageRating = "4+",
  category = "Developer Tools",
  chartRank = 3,
  award = null,
  screenshots = DEFAULT_SHOTS,
  accent = "#3B5BFD",
  speed = 1,
  theme = "light",
  lines = [
    "Now on the App Store.",
    "One tap to install.",
    "Every screen, previewed.",
    "Open it. Ship today.",
  ],
  ground,
  groundParams,
}: AppStoreListingProps) {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const f = frame * speed;
  const c: Palette = theme === "dark" ? DARK : LIGHT;
  const tall = height > width;
  const k = (height * (tall ? 0.66 : 0.92)) / BH;
  const phoneCx = tall ? width / 2 : width * 0.69;
  const yOff = tall ? 0.1 : 0;
  const sp = (at: number, config: SpringCfg, durationInFrames?: number) =>
    spring({ frame: f - at, fps, config, durationInFrames });
  const bump = (at: number) => sp(at - 2, MORPH, 3) - sp(at + 2, CHIP);

  const rise = sp(0, HEAVY);
  const camT = [0, 20, 38, 86, 102, 154, 172];
  const camEase = { ...clamp, easing: camE };
  const camS = interpolate(f, camT, [1, 1, 1.5, 1.5, 1, 1, 1.36], camEase);
  const camFy = interpolate(
    f,
    camT,
    [BH / 2, BH / 2, 206, 206, BH / 2, BH / 2, 214],
    camEase,
  );
  const camTy = interpolate(
    f,
    camT,
    [0.5, 0.5, 0.44, 0.44, 0.5, 0.5, 0.42].map((v) => v + yOff),
    camEase,
  );
  const S = k * camS;

  const press = bump(T_TAP);
  const collapse = interpolate(f, [T_TAP + 2, T_TAP + 10], [0, 1], {
    ...clamp,
    easing: morph,
  });
  const expand = Math.min(1, sp(T_DONE + 1, CARD));
  const btnW =
    f < T_DONE
      ? interpolate(collapse, [0, 1], [GET_W, 30])
      : interpolate(expand, [0, 1], [30, GET_W]);
  const fillAmt =
    f < T_DONE
      ? interpolate(collapse, [0.5, 1], [1, 0], clamp)
      : interpolate(expand, [0, 0.3], [0, 1], clamp);
  const ringOn =
    interpolate(f, [T_TAP + 6, T_TAP + 10], [0, 1], clamp) *
    interpolate(f, [T_DONE + 2, T_DONE + 5], [1, 0], clamp);
  const spinning = f < T_PROG;
  const progress = interpolate(
    f,
    [T_PROG, T_PROG + 12, T_PROG + 30, T_PROG + 48, T_PROG + 74, T_DONE - 2],
    [0, 0.08, 0.36, 0.52, 0.9, 1],
    clamp,
  );
  const spinAngle = (f - T_SPIN) * 13;
  const labelGet = interpolate(collapse, [0, 0.35], [1, 0], clamp);
  const labelOpen = interpolate(expand, [0.35, 0.85], [0, 1], clamp);
  const iapOpacity = 1 - collapse;

  let scrollX = 0;
  for (const d of DRAG) {
    const pulled = PAGE * 0.62;
    if (f >= d.down) {
      const drag = interpolate(f, [d.down, d.up], [0, pulled], {
        ...clamp,
        easing: moveE,
      });
      const settle = (PAGE - pulled) * sp(d.up, CARD);
      scrollX = d.from + drag + settle;
    }
  }

  const getCenter = { x: COL_X + GET_W / 2, y: GET_Y + 15 };
  const swipeY = SHOT_Y + 200;
  const touches = [
    { t: 22, x: 262, y: 420 },
    { t: T_TAP, ...getCenter },
    { t: DRAG[0].down - 9, x: 318, y: swipeY + 40 },
    { t: DRAG[0].down, x: 300, y: swipeY },
    { t: DRAG[0].up, x: 300 - PAGE * 0.62, y: swipeY - 6 },
    { t: DRAG[1].down, x: 304, y: swipeY + 4 },
    { t: DRAG[1].up, x: 304 - PAGE * 0.62, y: swipeY - 2 },
  ];
  let touch = { x: touches[0].x, y: touches[0].y };
  for (let i = 0; i < touches.length - 1; i++) {
    const a = touches[i];
    const b = touches[i + 1];
    const dragging = DRAG.some((d) => a.t === d.down);
    const start = dragging ? a.t : a.t + 2;
    const end = dragging ? b.t : b.t - 2;
    if (f >= start) {
      const e = moveE(Math.min(1, Math.max(0, (f - start) / (end - start))));
      const arc = dragging ? 0 : Math.sin(Math.PI * e) * 26;
      touch = {
        x: a.x + (b.x - a.x) * e + arc * 0.4,
        y: a.y + (b.y - a.y) * e - arc,
      };
    }
  }
  const down =
    bump(T_TAP) +
    DRAG.reduce(
      (acc, d) =>
        acc +
        interpolate(
          f,
          [d.down - 2, d.down, d.up, d.up + 2],
          [0, 1, 1, 0],
          clamp,
        ),
      0,
    );
  const touchOpacity = interpolate(
    f,
    [
      22,
      28,
      T_TAP + 4,
      T_TAP + 9,
      DRAG[0].down - 7,
      DRAG[0].down - 2,
      DRAG[1].up + 2,
      DRAG[1].up + 7,
    ],
    [0, 1, 1, 0, 0, 1, 1, 0],
    clamp,
  );

  const cells: {
    label: string;
    value: React.ReactNode;
    foot: React.ReactNode;
  }[] = [
    {
      label: `${ratingCount} Ratings`,
      value: rating.toFixed(1),
      foot: <Stars rating={rating} size={12} color={c.muted} track={c.track} />,
    },
    ...(award
      ? [
          {
            label: "Award",
            value: (
              <div style={{ position: "relative", width: 82, height: 34 }}>
                <Laurel color={c.muted} />
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    textAlign: "center",
                    fontSize: 10,
                    lineHeight: 1.05,
                    fontWeight: 400,
                    letterSpacing: "-0.01em",
                    padding: "0 18px",
                  }}
                >
                  {award}
                </div>
              </div>
            ),
            foot: "Apps",
          },
        ]
      : []),
    { label: "Age", value: ageRating, foot: "Years Old" },
    { label: "Chart", value: `#${chartRank}`, foot: category },
    {
      label: "Developer",
      value: <Glyph d={PATH.person} size={24} color={c.muted} sw={1.8} />,
      foot: developer,
    },
  ];

  const tabs = [
    ["Today", PATH.today],
    ["Games", PATH.games],
    ["Apps", PATH.apps],
    ["Updates", PATH.updates],
    ["Search", PATH.search],
  ] as const;

  return (
    <AbsoluteFill
      style={{ fontFamily, overflow: "hidden", background: c.stage }}
    >
      <GshGround
        preset={ground ?? (theme === "dark" ? "europa" : "paper-crease")}
        params={groundParams}
        timeOffset={theme === "dark" ? 4 : 5}
        timeScale={0.3}
      />
      <AbsoluteFill style={{ background: c.scrim }} />
      <div
        style={{
          position: "absolute",
          left: tall ? width * 0.08 : width * 0.075,
          top: tall ? height * 0.075 : height * 0.5 - height * 0.12,
          width: tall ? width * 0.84 : width * 0.4,
          height: tall ? height * 0.12 : height * 0.24,
          overflow: "hidden",
        }}
      >
        {lines.slice(0, LINE_AT.length).map((line, i) => {
          const at = LINE_AT[i];
          const next = LINE_AT[i + 1] ?? 100000;
          const pin = i === 0 ? rise : tween(f, at, at + 12, enterE);
          const pout = tween(f, next - 7, next, exitE);
          if (f < at - 1 || f > next + 1) return null;
          return (
            <div
              key={line}
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: 0,
                bottom: 0,
                display: "flex",
                alignItems: tall ? "flex-start" : "center",
                fontSize: tall ? height * 0.04 : height * 0.085,
                fontWeight: 300,
                lineHeight: 1.04,
                letterSpacing: "-0.035em",
                color: c.copy,
                textWrap: "balance",
                transform: `translateY(${(1 - pin) * 70 - pout * 50}%)`,
                opacity: pin * (1 - pout),
              }}
            >
              {line}
            </div>
          );
        })}
      </div>
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: BW,
          height: BH,
          transformOrigin: "0 0",
          transform: `translate(${phoneCx - (BW / 2) * S}px, ${height * camTy - camFy * S + (1 - rise) * height}px) scale(${S})`,
          WebkitFontSmoothing: "antialiased",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: 67,
            boxShadow: c.phoneShadow,
          }}
        />
        <Phone screen={c.screen} home={c.text}>
          <StatusBar color={c.text} />
          <div
            style={{
              position: "absolute",
              top: 54,
              left: 8,
              height: 44,
              display: "flex",
              alignItems: "center",
              gap: 1,
              color: c.blue,
              fontSize: 17,
            }}
          >
            <Glyph d={PATH.back} size={28} color={c.blue} sw={2.4} />
            Search
          </div>
          <div style={{ position: "absolute", left: 20, top: HEAD_Y }}>
            <AppIcon
              size={ICON}
              accent={accent}
              src={iconSrc}
              ring={c.iconRing}
            />
          </div>
          <div
            style={{
              position: "absolute",
              left: COL_X,
              right: 20,
              top: HEAD_Y + 2,
            }}
          >
            <div
              style={{
                fontSize: 22,
                fontWeight: 400,
                lineHeight: 1.2,
                letterSpacing: "-0.01em",
                color: c.text,
              }}
            >
              {appName}
            </div>
            <div
              style={{
                marginTop: 3,
                fontSize: 15,
                lineHeight: 1.3,
                color: c.muted,
                textWrap: "pretty",
              }}
            >
              {subtitle}
            </div>
          </div>
          <div
            style={{
              position: "absolute",
              left: COL_X + (GET_W - btnW) / 2,
              top: GET_Y,
              width: btnW,
              height: 30,
              borderRadius: 15,
              background: interpolateColors(
                fillAmt,
                [0, 1],
                [`${c.blue}00`, c.blue],
              ),
              transform: `scale(${1 - press * 0.04})`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ffffff",
              fontSize: 15,
              fontWeight: 400,
            }}
          >
            <span style={{ position: "absolute", opacity: labelGet }}>Get</span>
            <span style={{ position: "absolute", opacity: labelOpen }}>
              Open
            </span>
            {ringOn > 0 ? (
              <svg
                width={30}
                height={30}
                viewBox="0 0 30 30"
                style={{ position: "absolute", opacity: ringOn }}
              >
                <circle
                  cx={15}
                  cy={15}
                  r={13}
                  fill="none"
                  stroke={c.track}
                  strokeWidth={2.5}
                />
                <circle
                  cx={15}
                  cy={15}
                  r={13}
                  fill="none"
                  stroke={spinning ? c.muted : c.blue}
                  strokeWidth={2.5}
                  strokeLinecap={spinning ? "round" : "butt"}
                  pathLength={1}
                  strokeDasharray={`${spinning ? 0.22 : progress} 1`}
                  transform={`rotate(${spinning ? spinAngle : -90} 15 15)`}
                />
                {!spinning ? (
                  <rect
                    x={11}
                    y={11}
                    width={8}
                    height={8}
                    rx={1.6}
                    fill={c.blue}
                  />
                ) : null}
              </svg>
            ) : null}
          </div>
          <div
            style={{
              position: "absolute",
              left: COL_X + GET_W + 10,
              top: GET_Y + 3,
              fontSize: 9,
              lineHeight: 1.2,
              color: c.muted,
              opacity: iapOpacity,
            }}
          >
            In-App
            <br />
            Purchases
          </div>
          <div style={{ position: "absolute", right: 20, top: GET_Y + 2 }}>
            <Glyph d={PATH.share} size={24} color={c.blue} sw={1.8} />
          </div>
          <div
            style={{
              position: "absolute",
              left: 20,
              right: 20,
              top: STRIP_Y,
              height: 1,
              background: c.hair,
            }}
          />
          <div
            style={{
              position: "absolute",
              left: 0,
              top: STRIP_Y,
              height: STRIP_H,
              display: "flex",
              paddingLeft: 4,
            }}
          >
            {cells.map((cell, i) => (
              <div
                key={cell.label}
                style={{
                  position: "relative",
                  width: CELL_W,
                  height: STRIP_H,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 4,
                  color: c.muted,
                }}
              >
                {i > 0 ? (
                  <div
                    style={{
                      position: "absolute",
                      left: 0,
                      top: 24,
                      width: 1,
                      height: 36,
                      background: c.hair,
                    }}
                  />
                ) : null}
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 400,
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                  }}
                >
                  {cell.label}
                </span>
                <div
                  style={{
                    height: 32,
                    display: "flex",
                    alignItems: "center",
                    fontSize: 21,
                    fontWeight: 300,
                    letterSpacing: "-0.01em",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {cell.value}
                </div>
                <span
                  style={{
                    fontSize: 12,
                    maxWidth: CELL_W - 16,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    height: 14,
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  {cell.foot}
                </span>
              </div>
            ))}
          </div>
          <div
            style={{
              position: "absolute",
              left: 20,
              right: 20,
              top: STRIP_Y + STRIP_H,
              height: 1,
              background: c.hair,
            }}
          />
          <div
            style={{
              position: "absolute",
              left: 20,
              top: SHOT_Y,
              display: "flex",
              gap: SHOT_GAP,
              transform: `translateX(${-scrollX}px)`,
            }}
          >
            {screenshots.map((s, i) => (
              <div
                key={i}
                style={{
                  position: "relative",
                  width: SHOT_W,
                  height: SHOT_H,
                  flexShrink: 0,
                  borderRadius: 22,
                  overflow: "hidden",
                }}
              >
                {s.src ? (
                  <Img
                    src={s.src}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  <MockShot index={i} title={s.title} accent={accent} />
                )}
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: 22,
                    boxShadow: `inset 0 0 0 1px ${c.iconRing}`,
                  }}
                />
              </div>
            ))}
          </div>
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              height: TAB_H,
              background: c.tab,
              borderTop: `1px solid ${c.hair}`,
              display: "flex",
              justifyContent: "space-around",
              padding: "7px 8px 0",
              zIndex: 20,
            }}
          >
            {tabs.map(([label, d]) => {
              const on = label === "Search";
              const col = on ? c.blue : c.tabIdle;
              return (
                <div
                  key={label}
                  style={{
                    width: 62,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 3,
                    color: col,
                    fontSize: 10,
                    fontWeight: 400,
                  }}
                >
                  <Glyph d={d} size={26} color={col} sw={1.7} />
                  {label}
                </div>
              );
            })}
          </div>
          <div
            style={{
              position: "absolute",
              left: touch.x - 22,
              top: touch.y - 22,
              width: 44,
              height: 44,
              borderRadius: 22,
              background: c.touch,
              border: "1.5px solid rgba(255,255,255,0.75)",
              boxShadow: "0 2px 10px rgba(0,0,0,0.25)",
              opacity: touchOpacity,
              transform: `scale(${1 - Math.min(1, down) * 0.14})`,
              zIndex: 35,
            }}
          />
        </Phone>
      </div>
    </AbsoluteFill>
  );
}
