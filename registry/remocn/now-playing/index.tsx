"use client";

import { loadFont } from "@remotion/google-fonts/Figtree";
import type React from "react";
import { useId } from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
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

export interface NowPlayingProps {
  title?: string;
  artist?: string;
  playlist?: string;
  src?: string;
  tint?: string;
  lyrics?: string[];
  duration?: number;
  variant?: "full" | "mini";
  accent?: string;
  speed?: number;
  ground?: GshPresetId;
  groundParams?: Partial<GradientParams>;
}

const DEFAULT_LYRICS = [
  "Shipped it at midnight",
  "and the build came green",
  "every frame in motion",
  "every pixel in line",
  "press play on launch day",
  "watch the counter climb",
  "we wrote it all in React",
  "and rendered it in time",
];

const SW = 393;
const SH = 852;
const BEZEL = 11;
const BW = SW + BEZEL * 2;
const BH = SH + BEZEL * 2;
const ART = { x: 24, y: 122, s: SW - 48 };
const PLAY = { x: SW / 2, y: 650 };
const HEART = { x: SW - 38, y: 524 };
const MINI_Y = SH - 84 - 62;
const MINI_ART = { x: 8, y: 8, s: 40 };

const TAP_PLAY = 28;
const TAP_HEART = 64;
const LYRICS = 100;
const LINE0 = 124;
const LINE_LEN = 18;
const MINI_TAP = 30;
const MINI_OFFSET = 52;

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

function rgb(hex: string) {
  const h = hex.replace("#", "");
  const full =
    h.length === 3
      ? h
          .split("")
          .map((ch) => ch + ch)
          .join("")
      : h.slice(0, 6);
  const n = Number.parseInt(full, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function mix(a: string, b: string, t: number) {
  const x = rgb(a);
  const y = rgb(b);
  const m = x.map((v, i) => Math.round(v + (y[i] - v) * t));
  return `rgb(${m[0]}, ${m[1]}, ${m[2]})`;
}
const fmt = (sec: number) => {
  const s = Math.max(0, Math.floor(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

const ICON = {
  down: "M6 9l6 6 6-6",
  shuffle: "M16 4h4v4M4 20L20 4M16 20h4v-4M14.5 14.5L20 20M4 4l5 5",
  prev: "M7 5v14M19 5L9 12l10 7z",
  next: "M17 5v14M5 5l10 7-10 7z",
  repeat:
    "M17 2l3 3-3 3M4 11V9a4 4 0 014-4h12M7 22l-3-3 3-3M20 13v2a4 4 0 01-4 4H4",
  devices: "M4 5h11v10H4zM8 19h3M18 8h2.5v11H18z",
  share: "M12 3v12M7 8l5-5 5 5M5 13v7h14v-7",
  queue: "M4 6h12M4 12h12M4 18h8M19 15v6M16 18h6",
  heart:
    "M12 20.5s-8-4.9-8-10.6A4.6 4.6 0 0112 7a4.6 4.6 0 018 2.9c0 5.7-8 10.6-8 10.6z",
  home: "M4 11l8-7 8 7v9h-5v-6H9v6H4z",
  search: "M11 4a7 7 0 100 14 7 7 0 000-14zM20 20l-4-4",
  library: "M5 4v16M10 4v16M15 5l4 15",
  plus: "M12 5v14M5 12h14",
  expand: "M14 4h6v6M10 20H4v-6M20 4l-7 7M4 20l7-7",
};

function Glyph({
  d,
  size = 24,
  color = "#fff",
  sw = 2,
  fill = "none",
}: {
  d: string;
  size?: number;
  color?: string;
  sw?: number;
  fill?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill}
      style={{ flexShrink: 0 }}
    >
      <path
        d={d}
        stroke={color}
        strokeWidth={sw}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PlayPause({
  m,
  size,
  color,
}: {
  m: number;
  size: number;
  color: string;
}) {
  const L: number[][][] = [
    [
      [-6, -10],
      [-7, -9],
    ],
    [
      [2, -5.5],
      [-2, -9],
    ],
    [
      [2, 5.5],
      [-2, 9],
    ],
    [
      [-6, 10],
      [-7, 9],
    ],
  ];
  const R: number[][][] = [
    [
      [2, -5.5],
      [2, -9],
    ],
    [
      [10, 0],
      [7, -9],
    ],
    [
      [10, 0],
      [7, 9],
    ],
    [
      [2, 5.5],
      [2, 9],
    ],
  ];
  const path = (pts: number[][][]) =>
    `M${pts.map(([a, b]) => `${lerp(a[0], b[0], m) + 12} ${lerp(a[1], b[1], m) + 12}`).join("L")}Z`;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <path
        d={path(L)}
        fill={color}
        stroke={color}
        strokeWidth={1.2}
        strokeLinejoin="round"
      />
      <path
        d={path(R)}
        fill={color}
        stroke={color}
        strokeWidth={1.2}
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ridge(seed: number, base: number, amp: number, freq: number) {
  let d = "M0 100";
  for (let x = 0; x <= 100; x += 2) {
    const y =
      base -
      amp *
        (0.55 * Math.sin(x * freq + seed) +
          0.3 * Math.sin(x * freq * 2.3 + seed * 1.7) +
          0.15 * Math.sin(x * freq * 5.9 + seed * 3.1));
    d += `L${x} ${y.toFixed(2)}`;
  }
  return `${d}L100 100Z`;
}

function Artwork({
  size,
  tint,
  src,
  radius,
  title,
  artist,
  seed = 0,
}: {
  size: number;
  tint: string;
  src?: string;
  radius: number;
  title?: string;
  artist?: string;
  seed?: number;
}) {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  if (src) {
    return (
      <Img
        src={src}
        style={{
          width: size,
          height: size,
          borderRadius: radius,
          objectFit: "cover",
          display: "block",
        }}
      />
    );
  }
  const sunX = 58 + ((seed * 23) % 30) - 15;
  const sunY = 52 + ((seed * 11) % 10);
  const far = mix(tint, "#F6B48A", 0.55);
  const mid = mix(tint, "#3A1E2A", 0.45);
  const near = mix(tint, "#0E0A12", 0.82);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      style={{ display: "block", borderRadius: radius }}
    >
      <defs>
        <linearGradient id={`${id}sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={mix(tint, "#120E24", 0.72)} />
          <stop offset="0.38" stopColor={mix(tint, "#5A3A6E", 0.35)} />
          <stop offset="0.62" stopColor={mix(tint, "#F49A6C", 0.6)} />
          <stop offset="0.78" stopColor="#FFD3A1" />
        </linearGradient>
        <radialGradient
          id={`${id}sun`}
          cx={sunX}
          cy={sunY}
          r="34"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#FFF4DE" />
          <stop offset="0.12" stopColor="#FFE2B0" stopOpacity={0.95} />
          <stop offset="0.4" stopColor="#FFB27A" stopOpacity={0.35} />
          <stop offset="1" stopColor="#FF8A5C" stopOpacity={0} />
        </radialGradient>
        <linearGradient id={`${id}haze`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0.45" stopColor="#FFC896" stopOpacity={0} />
          <stop offset="0.72" stopColor="#FFC896" stopOpacity={0.28} />
          <stop offset="1" stopColor={near} stopOpacity={0} />
        </linearGradient>
        <radialGradient
          id={`${id}vig`}
          cx="50"
          cy="48"
          r="72"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0.55" stopColor="#000" stopOpacity={0} />
          <stop offset="1" stopColor="#000" stopOpacity={0.45} />
        </radialGradient>
        <filter id={`${id}grain`} x="0" y="0" width="100%" height="100%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="1.6"
            numOctaves={2}
            seed={seed + 3}
            stitchTiles="stitch"
          />
          <feColorMatrix values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 1.6 -0.55" />
        </filter>
      </defs>
      <rect width="100" height="100" fill={`url(#${id}sky)`} />
      <rect width="100" height="100" fill={`url(#${id}sun)`} />
      <path d={ridge(seed + 1, 66, 7, 0.07)} fill={far} opacity={0.75} />
      <rect width="100" height="100" fill={`url(#${id}haze)`} />
      <path d={ridge(seed + 4, 76, 8, 0.05)} fill={mid} />
      <path d={ridge(seed + 9, 88, 6, 0.09)} fill={near} />
      <rect width="100" height="100" fill={`url(#${id}vig)`} />
      <rect
        width="100"
        height="100"
        filter={`url(#${id}grain)`}
        opacity={0.16}
        style={{ mixBlendMode: "overlay" }}
      />
      {artist ? (
        <text
          x="7"
          y="11"
          fill="#FFF7EC"
          fontFamily={fontFamily}
          fontSize="4.4"
          fontWeight={400}
          letterSpacing="0.05"
        >
          {artist}
        </text>
      ) : null}
      {title ? (
        <text
          x="7"
          y="94"
          fill="#FFF7EC"
          fillOpacity={0.82}
          fontFamily={fontFamily}
          fontSize="3.6"
          fontWeight={400}
          letterSpacing="0.6"
        >
          {title.toUpperCase()}
        </text>
      ) : null}
    </svg>
  );
}

function StatusBar() {
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
        zIndex: 30,
        color: "#fff",
      }}
    >
      <span style={{ fontSize: 17, fontWeight: 400 }}>9:41</span>
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
              fill="#fff"
            />
          ))}
        </svg>
        <div
          style={{
            width: 25,
            height: 12,
            borderRadius: 3.5,
            border: "1px solid rgba(255,255,255,0.8)",
            padding: 1.5,
            boxSizing: "border-box",
          }}
        >
          <div
            style={{
              width: "80%",
              height: "100%",
              borderRadius: 2,
              background: "#fff",
            }}
          />
        </div>
      </div>
    </div>
  );
}

function Phone({ children }: { children: React.ReactNode }) {
  const btn = (side: "left" | "right", top: number, h: number) => (
    <div
      style={{
        position: "absolute",
        [side]: -3,
        top,
        width: 4,
        height: h,
        borderRadius: 2,
        background: "linear-gradient(90deg,#8E8E93,#C7C7CC,#8E8E93)",
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
          boxShadow:
            "inset 0 0 0 2.5px #A1A1A6, inset 0 0 0 4px #2A2A2D, 0 60px 120px rgba(0,0,0,0.6)",
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
          background: "#121212",
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
            zIndex: 40,
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
            background: "#fff",
            zIndex: 40,
          }}
        />
      </div>
    </div>
  );
}

function HeartBurst({ t, accent }: { t: number; accent: string }) {
  if (t <= 0 || t > 20) return null;
  const p = Easing.bezier(0.22, 1, 0.36, 1)(Math.min(1, t / 16));
  return (
    <svg
      width={80}
      height={80}
      viewBox="-40 -40 80 80"
      style={{ position: "absolute", left: -26, top: -26, overflow: "visible" }}
    >
      {Array.from({ length: 8 }, (_, i) => {
        const a = (i / 8) * Math.PI * 2 - Math.PI / 2;
        const r0 = 12 + p * 10;
        const r1 = 14 + p * 17;
        return (
          <line
            key={i}
            x1={Math.cos(a) * r0}
            y1={Math.sin(a) * r0}
            x2={Math.cos(a) * r1}
            y2={Math.sin(a) * r1}
            stroke={i % 2 ? "#fff" : accent}
            strokeWidth={2.4 * (1 - p) + 0.4}
            strokeLinecap="round"
            opacity={1 - p * 0.9}
          />
        );
      })}
      <circle
        r={10 + p * 16}
        fill="none"
        stroke={accent}
        strokeWidth={2 * (1 - p)}
        opacity={1 - p}
      />
    </svg>
  );
}

const TILE_TINTS = [
  "#3E6E8E",
  "#8C4A6B",
  "#B8553A",
  "#4F7A55",
  "#6B5B95",
  "#A8743A",
];

function MiniHome({ tint, artist }: { tint: string; artist: string }) {
  const tiles = [
    "Launch Week Mix",
    "Deep Focus",
    "Saved Tracks",
    "Shipping Hours",
    "Lo-fi Builds",
    "New This Week",
  ];
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: `linear-gradient(${mix(tint, "#121212", 0.75)}, #121212 38%)`,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 70,
          left: 16,
          display: "flex",
          gap: 8,
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            background:
              "radial-gradient(circle at 30% 30%, #FFC9A8, #E2763F 70%)",
            color: "#fff",
            fontSize: 13,
            fontWeight: 400,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          M
        </div>
        {["All", "Music", "Podcasts"].map((t, i) => (
          <div
            key={t}
            style={{
              height: 32,
              padding: "0 14px",
              borderRadius: 16,
              background: i === 0 ? "#fff" : "rgba(255,255,255,0.1)",
              color: i === 0 ? "#000" : "#fff",
              fontSize: 13,
              fontWeight: 400,
              display: "flex",
              alignItems: "center",
            }}
          >
            {t}
          </div>
        ))}
      </div>
      <div
        style={{
          position: "absolute",
          top: 118,
          left: 16,
          right: 16,
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        {tiles.map((t, i) => (
          <div
            key={t}
            style={{
              width: (SW - 40) / 2,
              height: 56,
              borderRadius: 5,
              background: "rgba(255,255,255,0.08)",
              display: "flex",
              alignItems: "center",
              gap: 10,
              overflow: "hidden",
              color: "#fff",
              fontSize: 12.5,
              fontWeight: 400,
            }}
          >
            <Artwork
              size={56}
              radius={0}
              tint={TILE_TINTS[i % TILE_TINTS.length]}
              seed={i + 2}
            />
            {t}
          </div>
        ))}
      </div>
      <div
        style={{
          position: "absolute",
          top: 342,
          left: 16,
          color: "#fff",
          fontSize: 22,
          fontWeight: 400,
          letterSpacing: "-0.02em",
        }}
      >
        Made for Maya
      </div>
      <div
        style={{
          position: "absolute",
          top: 384,
          left: 16,
          display: "flex",
          gap: 14,
        }}
      >
        {["Morning Mix", "Weekly Picks", "Studio Mix"].map((t, i) => (
          <div key={t} style={{ width: 150 }}>
            <Artwork
              size={150}
              radius={6}
              tint={TILE_TINTS[(i + 3) % TILE_TINTS.length]}
              seed={i + 7}
              artist={t}
            />
            <div
              style={{
                color: "#fff",
                fontSize: 13,
                fontWeight: 400,
                marginTop: 8,
              }}
            >
              {t}
            </div>
            <div
              style={{
                color: "rgba(255,255,255,0.6)",
                fontSize: 12,
                marginTop: 3,
              }}
            >
              {i === 1
                ? `${artist}, Halcyon and more`
                : "Kitebase, Lumen and more"}
            </div>
          </div>
        ))}
      </div>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: 84,
          background: "linear-gradient(transparent, rgba(0,0,0,0.92) 40%)",
          display: "flex",
          justifyContent: "space-around",
          paddingTop: 18,
          boxSizing: "border-box",
        }}
      >
        {(
          [
            ["Home", ICON.home],
            ["Search", ICON.search],
            ["Library", ICON.library],
            ["Create", ICON.plus],
          ] as const
        ).map(([label, d], i) => (
          <div
            key={label}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 4,
              width: 80,
            }}
          >
            <Glyph
              d={d}
              size={24}
              color={i === 0 ? "#fff" : "rgba(255,255,255,0.65)"}
              fill={i === 0 ? "#fff" : "none"}
            />
            <span
              style={{
                fontSize: 10,
                color: i === 0 ? "#fff" : "rgba(255,255,255,0.65)",
              }}
            >
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

const ENTER = Easing.bezier(0.32, 0.72, 0, 1);
const EXIT = Easing.bezier(0.55, 0, 1, 0.45);
const HEAVY = { mass: 1, damping: 26, stiffness: 120 };
const CARD = { mass: 0.8, damping: 18, stiffness: 160 };
const CHIP = { mass: 0.5, damping: 12, stiffness: 200 };
const MORPH = { damping: 200 };
const GLIDE = { mass: 0.9, damping: 24, stiffness: 140 };

export function NowPlaying({
  title = "Launch Day",
  artist = "remocn",
  playlist = "Launch Week Mix",
  src,
  tint = "#B8553A",
  lyrics = DEFAULT_LYRICS,
  duration = 165,
  variant = "full",
  accent = "#3B5BFD",
  speed = 1,
  ground,
  groundParams,
}: NowPlayingProps) {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const f = frame * speed;
  const mini = variant === "mini";
  const t = f - (mini ? MINI_OFFSET : 0);
  const portrait = height > width;
  const stageW = portrait ? 720 : 1280;
  const stageH = portrait ? 1280 : 720;
  const u = Math.min(width / stageW, height / stageH);
  const phoneH = portrait ? 800 : 668;
  const k = phoneH / BH;
  const phoneC = portrait ? { x: 360, y: 60 + phoneH / 2 } : { x: 392, y: 360 };
  const sp = (at: number, config: typeof CARD | typeof MORPH = CARD) =>
    spring({ frame: t - at, fps, config });

  const rise = spring({ frame: f, fps, config: HEAVY });
  const playing = sp(TAP_PLAY, MORPH);
  const elapsed = 24 + Math.max(0, t - TAP_PLAY) / 30;
  const progress = Math.min(1, elapsed / duration);
  const liked = sp(TAP_HEART, CHIP);
  const artScale = 0.94 + 0.06 * sp(TAP_PLAY, CARD);
  const heartPop =
    t < TAP_HEART
      ? 1
      : 1 +
        0.3 *
          (1 - spring({ frame: t - TAP_HEART, fps, config: CHIP })) *
          Math.min(1, (t - TAP_HEART) / 2);

  const scroll = 430 * sp(LYRICS, { mass: 1, damping: 24, stiffness: 90 });
  const lineT = (t - LINE0) / LINE_LEN;
  const maxShift = Math.max(0, lyrics.length * 42 - 340);
  let listShift = 0;
  for (let i = 4; i < lyrics.length; i++) {
    listShift +=
      42 * spring({ frame: t - (LINE0 + i * LINE_LEN), fps, config: MORPH });
  }
  listShift = Math.min(maxShift, listShift);

  const ex = mini ? spring({ frame: f - MINI_TAP - 2, fps, config: HEAVY }) : 1;
  const sheet = {
    top: lerp(MINI_Y, 0, ex),
    left: lerp(8, 0, ex),
    w: lerp(SW - 16, SW, ex),
    h: lerp(56, SH, ex),
    r: lerp(8, 55, ex),
  };
  const art = {
    x: lerp(MINI_ART.x, ART.x, ex),
    y: lerp(MINI_ART.y, ART.y, ex),
    s: lerp(MINI_ART.s, ART.s, ex),
  };
  const fullIn = interpolate(ex, [0.35, 0.85], [0, 1], {
    ...clamp,
    easing: ENTER,
  });

  const off = mini ? MINI_OFFSET : 0;
  const keys = mini
    ? [
        { at: 8, x: 300, y: 760 },
        { at: MINI_TAP - 14, x: 170, y: MINI_Y + 28 },
        { at: MINI_OFFSET - 4, x: 250, y: 760 },
      ]
    : [{ at: 4, x: 270, y: 770 }];
  keys.push(
    { at: TAP_PLAY - 16 + off, x: PLAY.x, y: PLAY.y },
    { at: TAP_HEART - 16 + off, x: HEART.x, y: HEART.y },
  );
  let tap = { x: keys[0].x, y: keys[0].y };
  for (let i = 1; i < keys.length; i++) {
    const b = keys[i];
    if (f < b.at) break;
    const e = spring({ frame: f - b.at, fps, config: GLIDE });
    const a = tap;
    const bow = Math.sin(Math.min(1, e) * Math.PI) * 0.16;
    tap = {
      x: lerp(a.x, b.x, e) - (b.y - a.y) * bow,
      y: lerp(a.y, b.y, e) + (b.x - a.x) * bow,
    };
  }
  const lastTap = TAP_HEART + off;
  const tapOpacity = interpolate(
    f,
    [keys[0].at, keys[0].at + 6, lastTap + 6, lastTap + 14],
    [0, 0.9, 0.9, 0],
    { ...clamp, easing: ENTER },
  );
  const click = (at: number) =>
    Math.max(
      0,
      spring({ frame: f - at + 3, fps, config: CHIP }) -
        spring({ frame: f - at, fps, config: CHIP }),
    );
  const tapPress = Math.max(
    click(TAP_PLAY + off),
    click(TAP_HEART + off),
    mini ? click(MINI_TAP) : 0,
  );
  const playPress = click(TAP_PLAY + off);

  const bg = mix(tint, "#000000", 0.42);
  const card = mix(tint, "#000000", 0.12);
  const muted = "rgba(255,255,255,0.7)";

  const items = [
    { at: -999, text: title, sub: artist },
    ...lyrics.map((l, i) => ({ at: LINE0 + i * LINE_LEN, text: l, sub: "" })),
  ];
  let cur = 0;
  for (let i = 0; i < items.length; i++) if (t >= items[i].at) cur = i;
  const textX = portrait ? 64 : 724;
  const textW = portrait ? 592 : 500;
  const textTop = portrait ? 960 : 250;
  const bigSize = portrait ? 58 : 60;

  const resolvedGround: GshPresetId = ground ?? "static-sunset";

  const player = (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: SW,
        height: SH + 440,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(${bg} 0px, ${mix(tint, "#121212", 0.78)} 620px, #121212 900px)`,
        }}
      />
      <div style={{ position: "absolute", inset: 0, opacity: fullIn }}>
        <div
          style={{
            position: "absolute",
            top: 62,
            left: 18,
            right: 18,
            display: "flex",
            alignItems: "center",
            color: "#fff",
          }}
        >
          <Glyph d={ICON.down} size={26} sw={1.8} />
          <div style={{ flex: 1, textAlign: "center" }}>
            <div style={{ fontSize: 12, color: muted }}>
              Playing from playlist
            </div>
            <div style={{ fontSize: 14, marginTop: 2 }}>{playlist}</div>
          </div>
          <Glyph d="M5 12h.01M12 12h.01M19 12h.01" size={26} sw={3} />
        </div>
        <div
          style={{
            position: "absolute",
            top: 494,
            left: 24,
            right: 24,
            display: "flex",
            alignItems: "center",
          }}
        >
          <div style={{ flex: 1 }}>
            <div
              style={{ color: "#fff", fontSize: 25, letterSpacing: "-0.02em" }}
            >
              {title}
            </div>
            <div style={{ color: muted, fontSize: 17, marginTop: 4 }}>
              {artist}
            </div>
          </div>
          <div style={{ position: "relative", width: 28, height: 28 }}>
            <HeartBurst t={t - TAP_HEART} accent={accent} />
            <div style={{ transform: `scale(${heartPop})` }}>
              <Glyph
                d={ICON.heart}
                size={28}
                color={liked > 0.5 ? accent : "rgba(255,255,255,0.85)"}
                fill={liked > 0.5 ? accent : "none"}
                sw={liked > 0.5 ? 1.2 : 1.8}
              />
            </div>
          </div>
        </div>
        <div style={{ position: "absolute", top: 570, left: 24, right: 24 }}>
          <div
            style={{
              height: 4,
              borderRadius: 2,
              background: "rgba(255,255,255,0.24)",
              position: "relative",
            }}
          >
            <div
              style={{
                width: `${progress * 100}%`,
                height: 4,
                borderRadius: 2,
                background: "#fff",
              }}
            />
            <div
              style={{
                position: "absolute",
                left: `${progress * 100}%`,
                top: -4,
                width: 12,
                height: 12,
                marginLeft: -6,
                borderRadius: 6,
                background: "#fff",
                boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
              }}
            />
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: 9,
              fontSize: 12,
              color: muted,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            <span>{fmt(elapsed)}</span>
            <span>−{fmt(duration - elapsed)}</span>
          </div>
        </div>
        <div
          style={{
            position: "absolute",
            top: PLAY.y - 33,
            left: 20,
            right: 20,
            height: 66,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ position: "relative" }}>
            <Glyph d={ICON.shuffle} size={24} color={accent} sw={1.8} />
            <div
              style={{
                position: "absolute",
                left: 10,
                bottom: -8,
                width: 4,
                height: 4,
                borderRadius: 2,
                background: accent,
              }}
            />
          </div>
          <Glyph d={ICON.prev} size={34} fill="#fff" sw={1.6} />
          <div
            style={{
              width: 66,
              height: 66,
              borderRadius: 33,
              background: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transform: `scale(${1 - 0.06 * playPress})`,
              boxShadow: "0 8px 20px -6px rgba(0,0,0,0.4)",
            }}
          >
            <PlayPause m={Math.min(1, playing)} size={30} color="#000" />
          </div>
          <Glyph d={ICON.next} size={34} fill="#fff" sw={1.6} />
          <Glyph
            d={ICON.repeat}
            size={24}
            color="rgba(255,255,255,0.85)"
            sw={1.8}
          />
        </div>
        <div
          style={{
            position: "absolute",
            top: 730,
            left: 24,
            right: 24,
            display: "flex",
            alignItems: "center",
            gap: 22,
          }}
        >
          <Glyph d={ICON.devices} size={20} color={muted} sw={1.8} />
          <div style={{ flex: 1 }} />
          <Glyph d={ICON.share} size={20} color={muted} sw={1.8} />
          <Glyph d={ICON.queue} size={20} color={muted} sw={1.8} />
        </div>
        <div
          style={{
            position: "absolute",
            top: 782,
            left: 12,
            right: 12,
            height: 452,
            borderRadius: 16,
            background: card,
            overflow: "hidden",
            padding: "18px 18px 0",
            boxSizing: "border-box",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", color: "#fff" }}>
            <span style={{ flex: 1, fontSize: 17 }}>Lyrics</span>
            {[ICON.share, ICON.expand].map((d) => (
              <div
                key={d}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  marginLeft: 8,
                  background: "rgba(0,0,0,0.22)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Glyph d={d} size={15} sw={1.8} />
              </div>
            ))}
          </div>
          <div style={{ marginTop: 18, height: 352, overflow: "hidden" }}>
            <div
              style={{
                paddingTop: 4,
                transform: `translateY(${-listShift}px)`,
              }}
            >
              {lyrics.map((line, i) => {
                const on = interpolate(lineT, [i - 0.05, i + 0.2], [0, 1], {
                  ...clamp,
                  easing: ENTER,
                });
                const past = interpolate(lineT, [i + 1, i + 1.25], [0, 1], {
                  ...clamp,
                  easing: EXIT,
                });
                const v = Math.round(255 * on);
                return (
                  <div
                    key={`${i}-${line}`}
                    style={{
                      fontSize: 25,
                      lineHeight: "42px",
                      letterSpacing: "-0.02em",
                      color: `rgba(${v}, ${v}, ${v}, ${lerp(0.5, 1, on) - 0.3 * past})`,
                    }}
                  >
                    {line}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      {mini && ex < 0.5 ? (
        <div
          style={{
            position: "absolute",
            left: 56,
            right: 12,
            top: 0,
            height: 56,
            display: "flex",
            alignItems: "center",
            gap: 14,
            opacity: 1 - ex * 2.5,
            color: "#fff",
          }}
        >
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14 }}>{title}</div>
            <div style={{ fontSize: 13, color: muted, marginTop: 1 }}>
              {artist}
            </div>
          </div>
          <Glyph d={ICON.devices} size={20} color={muted} sw={1.8} />
          <Glyph d={ICON.heart} size={22} color={muted} sw={1.8} />
          <PlayPause m={1} size={24} color="#fff" />
        </div>
      ) : null}
      {mini && ex < 0.5 ? (
        <div
          style={{
            position: "absolute",
            left: 8,
            right: 8,
            top: 54,
            height: 2,
            borderRadius: 1,
            background: "rgba(255,255,255,0.25)",
            opacity: 1 - ex * 2.5,
          }}
        >
          <div style={{ width: "15%", height: 2, background: "#fff" }} />
        </div>
      ) : null}
      <div
        style={{
          position: "absolute",
          left: art.x,
          top: art.y,
          width: art.s,
          height: art.s,
          borderRadius: lerp(4, 8, ex),
          boxShadow: `0 ${24 * ex}px ${56 * ex}px rgba(0,0,0,0.45)`,
          transform: `scale(${lerp(1, artScale, ex)})`,
        }}
      >
        <Artwork
          size={art.s}
          tint={tint}
          src={src}
          radius={lerp(4, 8, ex)}
          title={title}
          artist={artist}
        />
      </div>
    </div>
  );

  return (
    <AbsoluteFill style={{ fontFamily, overflow: "hidden" }}>
      <GshGround
        preset={resolvedGround}
        params={groundParams}
        timeOffset={3}
        timeScale={0.35}
      />
      <AbsoluteFill
        style={{
          background: portrait
            ? "linear-gradient(180deg, rgba(0,0,0,0) 40%, rgba(0,0,0,0.55) 100%)"
            : "linear-gradient(90deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0) 40%, rgba(0,0,0,0.45) 100%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: (width - stageW * u) / 2,
          top: (height - stageH * u) / 2,
          width: stageW,
          height: stageH,
          transform: `scale(${u})`,
          transformOrigin: "0 0",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: phoneC.x - BW / 2,
            top: phoneC.y - BH / 2,
            width: BW,
            height: BH,
            transform: `translateY(${(1 - rise) * stageH * 0.7}px) scale(${k * (1 + 0.015 * (f / 300))})`,
          }}
        >
          <Phone>
            {mini ? <MiniHome tint={tint} artist={artist} /> : null}
            <div
              style={{
                position: "absolute",
                left: sheet.left,
                top: sheet.top,
                width: sheet.w,
                height: sheet.h,
                borderRadius: sheet.r,
                overflow: "hidden",
                background: bg,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  transform: `translateY(${-scroll}px)`,
                }}
              >
                {player}
              </div>
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  top: 0,
                  height: 96,
                  background: `linear-gradient(${mix(tint, "#121212", 0.72)} 58%, transparent)`,
                  opacity: interpolate(scroll, [200, 380], [0, 1], clamp),
                }}
              />
            </div>
            <StatusBar />
            <div
              style={{
                position: "absolute",
                left: tap.x - 22,
                top: tap.y - 22,
                width: 44,
                height: 44,
                borderRadius: 22,
                background: "rgba(255,255,255,0.3)",
                boxShadow: "inset 0 0 0 1.5px rgba(255,255,255,0.7)",
                opacity: tapOpacity,
                transform: `scale(${1 - 0.2 * tapPress})`,
                zIndex: 35,
              }}
            />
          </Phone>
        </div>

        <div
          style={{
            position: "absolute",
            left: textX,
            top: textTop,
            width: textW,
            color: "#fff",
            opacity: interpolate(f, [10, 24], [0, 1], {
              ...clamp,
              easing: ENTER,
            }),
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              fontSize: 18,
              color: "rgba(255,255,255,0.62)",
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                background: accent,
                transform: `scale(${Math.min(1, playing)})`,
              }}
            />
            {t < TAP_PLAY ? "Paused" : "Now playing"} · {playlist}
          </div>
          <div
            style={{
              position: "relative",
              height: bigSize * 1.08 * 2 + 60,
              marginTop: 22,
              overflow: "hidden",
            }}
          >
            {[cur - 1, cur].map((idx) => {
              if (idx < 0) return null;
              const it = items[idx];
              const isCur = idx === cur;
              const inP = isCur
                ? idx === 0
                  ? 1
                  : interpolate(t, [it.at + 4, it.at + 15], [0, 1], {
                      ...clamp,
                      easing: ENTER,
                    })
                : 1;
              const outP = isCur
                ? 0
                : interpolate(t, [items[cur].at, items[cur].at + 6], [0, 1], {
                    ...clamp,
                    easing: EXIT,
                  });
              if (outP >= 1) return null;
              return (
                <div
                  key={idx}
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    width: textW,
                    opacity: inP * (1 - outP),
                    transform: `translateY(${(1 - inP) * bigSize * 1.6 - outP * bigSize * 1.2}px)`,
                  }}
                >
                  <div
                    style={{
                      fontSize: bigSize,
                      fontWeight: 300,
                      lineHeight: 1.08,
                      letterSpacing: "-0.035em",
                      textWrap: "balance",
                    }}
                  >
                    {it.text}
                  </div>
                  {it.sub ? (
                    <div
                      style={{
                        fontSize: 26,
                        fontWeight: 300,
                        marginTop: 14,
                        color: "rgba(255,255,255,0.62)",
                      }}
                    >
                      {it.sub}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              fontSize: 18,
              color: "rgba(255,255,255,0.62)",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            <span>{fmt(elapsed)}</span>
            <div
              style={{
                flex: 1,
                height: 2,
                borderRadius: 1,
                background: "rgba(255,255,255,0.18)",
              }}
            >
              <div
                style={{
                  width: `${progress * 100}%`,
                  height: 2,
                  borderRadius: 1,
                  background: "#fff",
                }}
              />
            </div>
            <span>{fmt(duration)}</span>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
}
