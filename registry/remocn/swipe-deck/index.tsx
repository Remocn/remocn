"use client";

import { loadFont } from "@remotion/google-fonts/Figtree";
import { loadFont as loadMono } from "@remotion/google-fonts/GeistMono";
import { loadFont as loadSerif } from "@remotion/google-fonts/InstrumentSerif";
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
const { fontFamily: serif } = loadSerif("normal", {
  weights: ["400"],
  subsets: ["latin"],
});
loadSerif("italic", { weights: ["400"], subsets: ["latin"] });
const { fontFamily: mono } = loadMono("normal", {
  weights: ["400"],
  subsets: ["latin"],
});

export type SwipeScene = "captions" | "logos" | "pricing" | "devices";

export interface SwipeCard {
  title: string;
  /** Lighter text after the title, like an age: "v2", "30s". */
  meta?: string;
  /** Joined into one quiet line under the title. */
  chips?: string[];
  scene?: SwipeScene;
  /** Full-bleed image for the card. Falls back to the built-in scene. */
  src?: string;
}

export interface SwipeDeckProps {
  /** First three get swiped (ship it, skip, super like); the fourth sits underneath. */
  cards?: SwipeCard[];
  matchWith?: string;
  /** Initials on the viewer's avatar in the match modal. */
  initials?: string;
  /** Three lines beside the phone, one per beat. */
  lines?: [string, string, string];
  accent?: string;
  speed?: number;
  theme?: "light" | "dark";
  ground?: GshPresetId;
  groundParams?: Partial<GradientParams>;
}

const DEFAULT_CARDS: SwipeCard[] = [
  {
    title: "Kinetic captions",
    meta: "v2",
    chips: ["30fps", "Word timing", "TypeScript"],
    scene: "captions",
  },
  {
    title: "Logo wall",
    meta: "v2",
    chips: ["Any SVG", "Auto layout"],
    scene: "logos",
  },
  {
    title: "Pricing reveal",
    meta: "v2",
    chips: ["3 tiers", "Count-up"],
    scene: "pricing",
  },
  {
    title: "Device morph",
    meta: "v2",
    chips: ["Phone to laptop", "One prop"],
    scene: "devices",
  },
];

const SW = 393;
const SH = 852;
const BEZEL = 11;
const BW = SW + BEZEL * 2;
const BH = SH + BEZEL * 2;
const CARD_BOX = { left: 14, top: 108, w: SW - 28, h: 560 };
const BTN_Y = 724;

const HEAVY = { mass: 1, damping: 26, stiffness: 120 };
const CARD = { mass: 0.8, damping: 18, stiffness: 160 };
const CHIP = { mass: 0.5, damping: 12, stiffness: 200 };
const MORPH = { damping: 200 };
const ENTER = Easing.bezier(0.32, 0.72, 0, 1);
const MOVE = Easing.bezier(0.65, 0, 0.35, 1);
const EXIT = Easing.bezier(0.55, 0, 1, 0.45);
const CAMERA = Easing.bezier(0.87, 0, 0.13, 1);

type Act = { kind: "like" | "nope" | "super"; down: number; release: number };
const ACTS: Act[] = [
  { kind: "like", down: 24, release: 48 },
  { kind: "nope", down: 60, release: 78 },
  { kind: "super", down: 92, release: 96 },
];
const MATCH = 114;
const END = 180;

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const P = {
  x: "M6 6l12 12M18 6L6 18",
  star: "M12 3.2l2.6 5.5 6 .7-4.4 4.1 1.1 6L12 16.6l-5.3 2.9 1.1-6-4.4-4.1 6-.7z",
  heart:
    "M12 20.3s-7.6-4.6-9.4-9.5C1.3 7.4 3.5 4 7.1 4c2.1 0 3.7 1.1 4.9 2.9C13.2 5.1 14.8 4 16.9 4c3.6 0 5.8 3.4 4.5 6.8-1.8 4.9-9.4 9.5-9.4 9.5z",
  sliders: "M4 7h9M17 7h3M4 17h3M11 17h9M15 5v4M9 15v4",
  play: "M8 5.5v13l10.5-6.5z",
};

interface Pal {
  screen: string;
  text: string;
  muted: string;
  btn: string;
  btnRing: string;
  field: string;
  copy: string;
  frame: string;
  scrim: string;
  overlay: string;
}
const DARK: Pal = {
  screen: "#0d0c0c",
  text: "#f7f3f0",
  muted: "rgba(247,243,240,0.6)",
  btn: "#1c1a1a",
  btnRing: "0 0 0 1px rgba(255,255,255,0.09)",
  field: "rgba(255,255,255,0.07)",
  copy: "#fbf4f1",
  frame:
    "linear-gradient(155deg,#55565c 0%,#2a2b2f 30%,#3d3e43 62%,#1f2023 100%)",
  scrim: "rgba(6,2,3,0.3)",
  overlay: "rgba(13,12,12,0.9)",
};
const LIGHT: Pal = {
  screen: "#f6f3f0",
  text: "#171312",
  muted: "rgba(23,19,18,0.58)",
  btn: "#ffffff",
  btnRing:
    "0 0 0 1px rgba(0,0,0,0.05), 0 1px 3px rgba(0,0,0,0.06), 0 8px 18px -6px rgba(0,0,0,0.14)",
  field: "rgba(0,0,0,0.05)",
  copy: "#1f1716",
  frame:
    "linear-gradient(155deg,#f1f1f3 0%,#c4c4ca 30%,#e2e2e6 62%,#b3b3ba 100%)",
  scrim: "rgba(248,240,238,0.3)",
  overlay: "rgba(246,243,240,0.92)",
};

function hash(n: number) {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

type Mood = "sunset" | "dusk" | "golden" | "alpine";
const MOODS: Record<
  Mood,
  { sky: string[]; sun: string; ridges: string[]; water: string; sunY: number }
> = {
  sunset: {
    sky: ["#1d2550", "#4c3f7c", "#b9677c", "#ee9a68", "#fbd393"],
    sun: "#fff0c4",
    ridges: ["#9a7290", "#6a4f74", "#3d2f52", "#1b1730"],
    water: "#221c38",
    sunY: 0.78,
  },
  dusk: {
    sky: ["#070b1d", "#16224a", "#2f4a82", "#7488b8", "#d4b3b5"],
    sun: "#ffe2c0",
    ridges: ["#4d5c88", "#2f3b63", "#1b2443", "#0c1126"],
    water: "#0d1328",
    sunY: 0.9,
  },
  golden: {
    sky: ["#5d8fc8", "#9dbfe0", "#efd5a8", "#f5b475", "#ee9361"],
    sun: "#fff6dc",
    ridges: ["#b9a19c", "#8b7684", "#5b4f66", "#2e2a3a"],
    water: "#3a3446",
    sunY: 0.72,
  },
  alpine: {
    sky: ["#2a64ad", "#4f8bcb", "#8cb7e0", "#cfe1f0", "#eef3f6"],
    sun: "#ffffff",
    ridges: ["#a8bfd8", "#7894b5", "#48618a", "#233650"],
    water: "#2a3f5c",
    sunY: 0.35,
  },
};

const rgb = (hex: string) =>
  [1, 3, 5].map((i) => Number.parseInt(hex.slice(i, i + 2), 16) / 255);
const mix = (a: string, b: string, t: number) => {
  const [x, y] = [rgb(a), rgb(b)];
  return `rgb(${x.map((v, i) => Math.round((v + (y[i] - v) * t) * 255)).join(",")})`;
};

function noise1(x: number) {
  const i = Math.floor(x);
  const t = x - i;
  const u = t * t * (3 - 2 * t);
  return hash(i) * (1 - u) + hash(i + 1) * u;
}

function ridgePath(seed: number, base: number, amp: number, sharp: number) {
  const pts: string[] = [];
  for (let i = 0; i <= 80; i++) {
    const x = (i / 80) * 400;
    const n =
      0.6 * (1 - Math.abs(noise1(x / 80 + seed) * 2 - 1) * sharp) +
      0.27 * noise1(x / 26 + seed * 3.1) +
      0.13 * noise1(x / 8 + seed * 7.3);
    pts.push(`${x.toFixed(1)} ${(base - amp * n).toFixed(1)}`);
  }
  return `M0 500L${pts.join("L")}L400 500Z`;
}

function treePath(seed: number, base: number) {
  const pts: string[] = [];
  for (let i = 0; i <= 200; i++) {
    const x = i * 2;
    const tree = noise1(x / 3.2 + seed) ** 3 * 13;
    const swell = noise1(x / 40 + seed * 2) * 9;
    pts.push(`${x} ${(base - 3 - swell - tree).toFixed(1)}`);
  }
  return `M0 500L${pts.join("L")}L400 500Z`;
}

function Photo({
  mood = "sunset",
  seed = 1,
  zoom = 1,
}: {
  mood?: Mood;
  seed?: number;
  zoom?: number;
}) {
  const id = `ph${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const m = MOODS[mood];
  const HZ = 300;
  const sunX = 110 + hash(seed * 5) * 180;
  const sunY = HZ * m.sunY;
  const [cr, cg, cb] = rgb(m.sun);
  const ridges = m.ridges.map((col, i) => ({
    col,
    top: mix(col, m.sky[3], 0.35 - i * 0.08),
    d: ridgePath(
      seed + i * 1.7,
      HZ - 6 + i * 3,
      [120, 84, 52, 30][i],
      0.9 - i * 0.15,
    ),
    blur: [1.4, 0.8, 0.4, 0][i],
  }));
  const trees = treePath(seed * 3, HZ);
  const land = (reflect: boolean) => (
    <>
      {ridges.map((r, i) => (
        <path
          key={r.col}
          d={r.d}
          fill={`url(#${id}m${i})`}
          filter={r.blur && !reflect ? `url(#${id}r${i})` : undefined}
        />
      ))}
      <path d={trees} fill={mix(m.ridges[3], "#000000", 0.35)} />
    </>
  );
  const sky = (
    <>
      <rect width={400} height={HZ} fill={`url(#${id}s)`} />
      <rect
        width={400}
        height={HZ}
        filter={`url(#${id}cl)`}
        mask={`url(#${id}cm)`}
      />
      <circle cx={sunX} cy={sunY} r={190} fill={`url(#${id}g)`} />
      <circle
        cx={sunX}
        cy={sunY}
        r={15}
        fill={m.sun}
        filter={`url(#${id}b1)`}
      />
    </>
  );
  return (
    <svg
      viewBox="0 0 400 500"
      preserveAspectRatio="xMidYMid slice"
      width="100%"
      height="100%"
      style={{ display: "block", position: "absolute", inset: 0 }}
    >
      <defs>
        <linearGradient id={`${id}s`} x1="0" y1="0" x2="0" y2="1">
          {m.sky.map((s, i) => (
            <stop key={s} offset={i / (m.sky.length - 1)} stopColor={s} />
          ))}
        </linearGradient>
        {ridges.map((r, i) => (
          <linearGradient
            key={r.col}
            id={`${id}m${i}`}
            x1="0"
            y1="0"
            x2="0"
            y2="1"
          >
            <stop offset="0.55" stopColor={r.top} />
            <stop offset="0.75" stopColor={r.col} />
          </linearGradient>
        ))}
        <radialGradient id={`${id}g`}>
          <stop offset="0" stopColor={m.sun} stopOpacity={0.8} />
          <stop offset="0.12" stopColor={m.sun} stopOpacity={0.35} />
          <stop offset="0.45" stopColor={m.sun} stopOpacity={0.08} />
          <stop offset="1" stopColor={m.sun} stopOpacity={0} />
        </radialGradient>
        <linearGradient id={`${id}w`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={m.water} stopOpacity={0.3} />
          <stop offset="1" stopColor={m.water} stopOpacity={0.9} />
        </linearGradient>
        <linearGradient id={`${id}cmg`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity={0.9} />
          <stop offset="0.75" stopColor="#fff" stopOpacity={0.5} />
          <stop offset="1" stopColor="#fff" stopOpacity={0} />
        </linearGradient>
        <mask id={`${id}cm`}>
          <rect width={400} height={HZ} fill={`url(#${id}cmg)`} />
        </mask>
        <radialGradient id={`${id}v`} cx="0.5" cy="0.45" r="0.75">
          <stop offset="0.55" stopColor="#000" stopOpacity={0} />
          <stop offset="1" stopColor="#000" stopOpacity={0.42} />
        </radialGradient>
        <filter id={`${id}cl`} x="0" y="0" width="1" height="1">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.0035 0.02"
            numOctaves={4}
            seed={seed}
          />
          <feColorMatrix
            values={`0 0 0 0 ${cr} 0 0 0 0 ${cg} 0 0 0 0 ${cb} 2.4 0 0 0 -1.05`}
          />
          <feGaussianBlur stdDeviation={0.6} />
        </filter>
        <filter id={`${id}b1`} x="-1" y="-1" width="3" height="3">
          <feGaussianBlur stdDeviation={2.5} />
        </filter>
        <filter id={`${id}gl`} x="-1" y="-1" width="3" height="3">
          <feGaussianBlur stdDeviation="5 10" />
        </filter>
        {ridges.map((r, i) => (
          <filter
            key={r.col}
            id={`${id}r${i}`}
            x="-0.1"
            y="-0.2"
            width="1.2"
            height="1.4"
          >
            <feGaussianBlur stdDeviation={r.blur} />
          </filter>
        ))}
        <clipPath id={`${id}c`}>
          <rect y={HZ} width={400} height={200} />
        </clipPath>
        <filter id={`${id}rip`} x="0" y="0" width="1" height="1">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.003 0.12"
            numOctaves={2}
            seed={seed}
          />
          <feDisplacementMap
            in="SourceGraphic"
            scale={14}
            xChannelSelector="R"
            yChannelSelector="G"
          />
          <feGaussianBlur stdDeviation="0.8 1.6" />
        </filter>
        <filter id={`${id}n`} x="0" y="0" width="1" height="1">
          <feTurbulence
            type="fractalNoise"
            baseFrequency={0.9}
            numOctaves={2}
            seed={seed + 3}
          />
          <feColorMatrix values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0.16 0" />
        </filter>
      </defs>
      <g transform={`translate(200 250) scale(${zoom}) translate(-200 -250)`}>
        {sky}
        {land(false)}
        <g clipPath={`url(#${id}c)`} filter={`url(#${id}rip)`}>
          <g transform={`translate(0 ${HZ * 2}) scale(1 -1)`}>
            {sky}
            {land(true)}
          </g>
          <rect y={HZ} width={400} height={200} fill={`url(#${id}w)`} />
          <ellipse
            cx={sunX}
            cy={HZ + 70}
            rx={9}
            ry={70}
            fill={m.sun}
            opacity={0.35}
            filter={`url(#${id}gl)`}
          />
        </g>
      </g>
      <rect
        width={400}
        height={500}
        filter={`url(#${id}n)`}
        style={{ mixBlendMode: "overlay" }}
      />
      <rect width={400} height={500} fill={`url(#${id}v)`} />
    </svg>
  );
}

function Preview({
  scene,
  accent,
  t,
}: {
  scene: SwipeScene;
  accent: string;
  t: number;
}) {
  const fill: React.CSSProperties = { position: "absolute", inset: 0 };
  if (scene === "captions") {
    const words = ["SHIP", "YOUR", "LAUNCH", "TODAY"];
    const hi = Math.floor(t / 10) % 4;
    return (
      <div
        style={{
          ...fill,
          background: "#0c1126",
        }}
      >
        <Photo mood="dusk" seed={2} zoom={1.05 + t * 0.0008} />
        <div
          style={{
            position: "absolute",
            right: 30,
            top: 150,
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: 6,
          }}
        >
          {words.map((w, i) => (
            <span
              key={w}
              style={{
                fontSize: 54,
                fontWeight: 400,
                letterSpacing: "-0.04em",
                lineHeight: "60px",
                color: i === hi ? "#111" : "#fff",
                background: i === hi ? "#d4ff3f" : "transparent",
                textShadow: i === hi ? "none" : "0 2px 16px rgba(0,0,0,0.35)",
                padding: "0 10px",
                borderRadius: 10,
                transform: `rotate(${i === hi ? -2 : 0}deg)`,
              }}
            >
              {w}
            </span>
          ))}
        </div>
      </div>
    );
  }
  if (scene === "logos") {
    const names = [
      "Kitebase",
      "Lumen",
      "Fernway",
      "Quarry",
      "Orbitly",
      "Halcyon",
      "Tessel",
      "Northly",
    ];
    const glyphs = [
      "M12 3l6 9-6 9-6-9z",
      "M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10z",
      "M6 18C6 10 11 5 19 5c0 8-5 13-13 13z",
      "M5 5h14v14H5z",
    ];
    return (
      <div
        style={{
          ...fill,
          background: "#2a64ad",
        }}
      >
        <Photo mood="alpine" seed={7} zoom={1.05 + t * 0.0008} />
        <div
          style={{
            position: "absolute",
            left: 22,
            right: 22,
            top: 130,
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 12,
          }}
        >
          {names.map((n, i) => (
            <div
              key={n}
              style={{
                height: 58,
                borderRadius: 16,
                background: "#fff",
                boxShadow:
                  "0 1px 2px rgba(10,20,40,0.12), 0 8px 24px rgba(10,20,40,0.16)",
                display: "flex",
                alignItems: "center",
                gap: 9,
                padding: "0 16px",
                fontSize: 17,
                fontWeight: 400,
                color: "#141821",
                letterSpacing: "-0.02em",
                transform: `translateY(${Math.sin(t / 12 + i) * 2}px)`,
              }}
            >
              <Icon
                d={glyphs[i % 4]}
                size={20}
                color={i % 2 ? accent : "#141821"}
                sw={2.6}
              />
              {n}
            </div>
          ))}
        </div>
      </div>
    );
  }
  if (scene === "pricing") {
    const tiers = [
      { n: "Hobby", p: "$0" },
      { n: "Pro", p: "$19" },
      { n: "Team", p: "$49" },
    ];
    return (
      <div
        style={{
          ...fill,
          background: "#221c38",
        }}
      >
        <Photo mood="sunset" seed={4} zoom={1.05 + t * 0.0008} />
        <div
          style={{
            position: "absolute",
            left: 18,
            right: 18,
            top: 170,
            display: "flex",
            gap: 10,
            alignItems: "flex-end",
          }}
        >
          {tiers.map((tr, i) => (
            <div
              key={tr.n}
              style={{
                flex: 1,
                height: i === 1 ? 230 : 190,
                borderRadius: 18,
                background: i === 1 ? "#fff" : "rgba(20,16,32,0.42)",
                backdropFilter: i === 1 ? undefined : "blur(14px)",
                boxShadow:
                  i === 1
                    ? "0 1px 2px rgba(0,0,0,0.12), 0 20px 50px rgba(0,0,0,0.3)"
                    : "inset 0 0 0 1px rgba(255,255,255,0.14)",
                padding: 14,
                boxSizing: "border-box",
                color: i === 1 ? "#111" : "#fff",
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 400, opacity: 0.75 }}>
                {tr.n}
              </div>
              <div
                style={{
                  fontSize: 34,
                  fontWeight: 400,
                  letterSpacing: "-0.04em",
                  fontVariantNumeric: "tabular-nums",
                  marginTop: 6,
                }}
              >
                {tr.p}
              </div>
              {[0, 1, 2].map((k) => (
                <div
                  key={k}
                  style={{
                    height: 6,
                    borderRadius: 3,
                    marginTop: k ? 8 : 18,
                    width: `${80 - k * 18}%`,
                    background: i === 1 ? "#e4e4ea" : "rgba(255,255,255,0.3)",
                  }}
                />
              ))}
              {i === 1 && (
                <div
                  style={{
                    marginTop: 22,
                    height: 32,
                    borderRadius: 10,
                    background: accent,
                  }}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }
  return (
    <div
      style={{
        ...fill,
        background: "#3a3446",
      }}
    >
      <Photo mood="golden" seed={11} zoom={1.05 + t * 0.0008} />
      <div
        style={{
          position: "absolute",
          left: 40,
          top: 170,
          width: 230,
          height: 150,
          borderRadius: 12,
          background: "#0b1120",
          border: "6px solid #1f2937",
          boxShadow: "0 2px 4px rgba(0,0,0,0.2), 0 24px 50px rgba(0,0,0,0.35)",
        }}
      >
        <div
          style={{
            margin: 10,
            height: 70,
            borderRadius: 6,
            position: "relative",
            overflow: "hidden",
            background: accent,
          }}
        >
          <Photo mood="dusk" seed={5} />
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          left: 230,
          top: 210,
          width: 100,
          height: 200,
          borderRadius: 22,
          background: "#0b1120",
          border: "5px solid #1f2937",
          boxShadow: "0 2px 4px rgba(0,0,0,0.2), 0 24px 50px rgba(0,0,0,0.35)",
        }}
      >
        <div
          style={{
            margin: 8,
            height: 80,
            borderRadius: 12,
            position: "relative",
            overflow: "hidden",
            background: accent,
          }}
        >
          <Photo mood="dusk" seed={5} />
        </div>
      </div>
    </div>
  );
}

function Icon({
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
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
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
        padding: "6px 32px 0 52px",
        zIndex: 30,
        color,
      }}
    >
      <span style={{ fontSize: 17, fontWeight: 400 }}>9:41</span>
      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
        <svg width="18" height="12" viewBox="0 0 18 12" aria-hidden>
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

function Phone({ children, c }: { children: React.ReactNode; c: Pal }) {
  return (
    <div style={{ position: "relative", width: BW, height: BH }}>
      {(
        [
          ["left", 150, 32],
          ["left", 210, 62],
          ["left", 284, 62],
          ["right", 236, 98],
        ] as const
      ).map(([side, top, h]) => (
        <div
          key={`${side}${top}`}
          style={{
            position: "absolute",
            [side]: -3,
            top,
            width: 4,
            height: h,
            borderRadius: 2,
            background: c.frame,
          }}
        />
      ))}
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: 68,
          background: c.frame,
          boxShadow:
            "0 50px 100px -20px rgba(0,0,0,0.5), 0 20px 40px -12px rgba(0,0,0,0.3)",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 3,
          borderRadius: 65,
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
          borderRadius: 57,
          overflow: "hidden",
          background: c.screen,
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
      </div>
    </div>
  );
}

function Stamp({
  text,
  color,
  opacity,
  rot,
  style,
}: {
  text: string;
  color: string;
  opacity: number;
  rot: number;
  style: React.CSSProperties;
}) {
  return (
    <div
      style={{
        position: "absolute",
        boxShadow: `inset 0 0 0 2px ${color}`,
        color,
        borderRadius: 10,
        padding: "4px 14px 6px",
        fontFamily: serif,
        fontSize: 40,
        fontWeight: 400,
        lineHeight: 1,
        background: "rgba(0,0,0,0.18)",
        opacity,
        transform: `rotate(${rot}deg) scale(${1.1 - 0.1 * Math.min(1, opacity)})`,
        zIndex: 6,
        ...style,
      }}
    >
      {text}
    </div>
  );
}

function DeckCard({
  card,
  accent,
  t,
  children,
}: {
  card: SwipeCard;
  accent: string;
  t: number;
  children?: React.ReactNode;
}) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        borderRadius: 28,
        overflow: "hidden",
        background: "#111",
      }}
    >
      {card.src ? (
        <Img
          src={card.src}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
      ) : (
        <Preview scene={card.scene ?? "captions"} accent={accent} t={t} />
      )}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(180deg, transparent 52%, rgba(0,0,0,0.28) 64%, rgba(0,0,0,0.62) 80%, rgba(0,0,0,0.82) 100%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 22,
          right: 22,
          bottom: 22,
          color: "#fff",
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
          <span
            style={{
              fontFamily: serif,
              fontSize: 42,
              fontWeight: 400,
              letterSpacing: "-0.01em",
              lineHeight: 1,
              whiteSpace: "nowrap",
            }}
          >
            {card.title}
          </span>
          {card.meta && (
            <span style={{ fontSize: 20, fontWeight: 300, opacity: 0.72 }}>
              {card.meta}
            </span>
          )}
        </div>
        {card.chips && card.chips.length > 0 && (
          <div
            style={{
              marginTop: 10,
              fontSize: 17,
              fontWeight: 400,
              color: "rgba(255,255,255,0.78)",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {card.chips.join("  ·  ")}
          </div>
        )}
      </div>
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: 28,
          boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.1)",
        }}
      />
      {children}
    </div>
  );
}

interface Key {
  f: number;
  x: number;
  y: number;
  bend?: number;
}
function along(keys: Key[], f: number) {
  if (f <= keys[0].f) return { x: keys[0].x, y: keys[0].y };
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i];
    const b = keys[i + 1];
    if (f >= b.f) continue;
    const t = MOVE(Math.min(1, Math.max(0, (f - a.f) / (b.f - a.f))));
    const bend = b.bend ?? 0;
    const cx = (a.x + b.x) / 2 - (b.y - a.y) * bend;
    const cy = (a.y + b.y) / 2 + (b.x - a.x) * bend;
    const m = 1 - t;
    return {
      x: m * m * a.x + 2 * m * t * cx + t * t * b.x,
      y: m * m * a.y + 2 * m * t * cy + t * t * b.y,
    };
  }
  const last = keys[keys.length - 1];
  return { x: last.x, y: last.y };
}

export function SwipeDeck({
  cards = DEFAULT_CARDS,
  matchWith = "remocn",
  initials = "MC",
  lines = ["Swipe right on what fits.", "Skip the rest.", "Install the match."],
  accent = "#3B5BFD",
  speed = 1,
  theme = "dark",
  ground,
  groundParams,
}: SwipeDeckProps) {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const f = frame * speed;
  const dark = theme !== "light";
  const c = dark ? DARK : LIGHT;
  const tall = height > width;
  const W = tall ? 720 : 1280;
  const H = tall ? 1280 : 720;
  const u = Math.min(width / W, height / H);
  const k = tall ? (H * 0.66) / BH : (H * 0.9) / BH;
  const phoneCx = tall ? W / 2 : W * 0.68;
  const phoneCy = tall ? H - 40 - (BH * k) / 2 : H / 2;

  const sp = (at: number, config: object = CARD) =>
    spring({ frame: f - at, fps, config });
  const ease = (a: number, b: number, e = ENTER) =>
    interpolate(f, [a, b], [0, 1], { ...clamp, easing: e });

  const rise = sp(0, HEAVY);
  const cam = interpolate(f, [MATCH, END], [1, 1.035], {
    ...clamp,
    easing: CAMERA,
  });

  const motion = ACTS.map((a) => {
    const dir = a.kind === "like" ? 1 : a.kind === "nope" ? -1 : 0;
    const drag = dir
      ? spring({
          frame: Math.min(f, a.release) - a.down,
          fps,
          config: { damping: 20, stiffness: 140 },
        })
      : 0;
    const fly = interpolate(
      f,
      [a.release, a.release + (dir ? 12 : 14)],
      [0, 1],
      { ...clamp, easing: EXIT },
    );
    const dragX = dir * 150 * Math.min(1, drag);
    const dx = dragX + dir * 560 * fly;
    const dy = dir ? -12 * drag + 70 * fly : -1000 * fly;
    const stamp = dir
      ? Math.min(1, drag * 1.6)
      : interpolate(f, [a.release - 4, a.release + 2], [0, 1], clamp);
    const gone = dir ? Math.max(drag * 0.3, fly) : fly;
    return { ...a, dir, drag, fly, dx, dy, dragX, rot: dx * 0.07, stamp, gone };
  });
  const top = motion.findIndex((m) => m.fly < 1);
  const topIdx = top === -1 ? ACTS.length : top;
  const cur = motion[topIdx];
  const likeGlow = cur?.kind === "like" ? cur.stamp : 0;
  const nopeGlow = cur?.kind === "nope" ? cur.stamp : 0;
  const superPress =
    spring({ frame: f - ACTS[2].down, fps, config: CHIP }) -
    spring({ frame: f - ACTS[2].down - 5, fps, config: CHIP });

  const grab = { x: SW / 2 + 40, y: 400 };
  const grab2 = { x: SW / 2 - 20, y: 420 };
  const starBtn = { x: SW / 2, y: BTN_Y };
  const touchBase = along(
    [
      { f: 12, x: SW * 0.82, y: 560 },
      { f: ACTS[0].down, x: grab.x, y: grab.y, bend: 0.2 },
      { f: ACTS[0].release + 2, x: grab.x, y: grab.y },
      { f: ACTS[1].down, x: grab2.x, y: grab2.y, bend: -0.25 },
      { f: ACTS[1].release + 2, x: grab2.x, y: grab2.y },
      { f: ACTS[2].down - 1, x: starBtn.x, y: starBtn.y, bend: 0.18 },
    ],
    f,
  );
  const follow =
    f >= ACTS[0].down && f < ACTS[0].release
      ? { x: motion[0].dragX, y: -12 * motion[0].drag }
      : f >= ACTS[1].down && f < ACTS[1].release
        ? { x: motion[1].dragX, y: -12 * motion[1].drag }
        : { x: 0, y: 0 };
  const lift =
    f >= ACTS[0].release && f < ACTS[1].down
      ? 1 - ease(ACTS[0].release, ACTS[0].release + 6, EXIT)
      : f >= ACTS[1].release && f < ACTS[2].down
        ? 1 - ease(ACTS[1].release, ACTS[1].release + 6, EXIT)
        : 1;
  const tap = {
    x: touchBase.x + follow.x * lift,
    y: touchBase.y + follow.y * lift,
  };
  const tapOpacity =
    ease(12, 20) * (1 - ease(ACTS[2].down + 6, ACTS[2].down + 14, EXIT));
  const pressing = ACTS.some(
    (a) => a.kind !== "super" && f >= a.down && f < a.release,
  );
  const tapScale = (pressing ? 0.86 : 1) - 0.14 * Math.max(0, superPress);

  const buttons = [
    { d: P.x, s: 60, color: "#ff5a5f", glow: nopeGlow, sw: 2 },
    {
      d: P.star,
      s: 48,
      color: accent,
      glow: Math.max(0, superPress) * 1.5,
      sw: 1.75,
    },
    { d: P.heart, s: 60, color: "#2fbf71", glow: likeGlow, sw: 1.75 },
  ];

  const m = sp(MATCH, MORPH);
  const mTitle = ease(MATCH + 4, MATCH + 18);
  const mAv = [sp(MATCH + 6, CARD), sp(MATCH + 9, CARD)];
  const mHeart = sp(MATCH + 16, CHIP);
  const mText = ease(MATCH + 18, MATCH + 32);
  const mCta = sp(MATCH + 22, CARD);

  const beats = [6, ACTS[1].down - 4, MATCH];
  const copyLine = (i: number) => {
    const inAt = beats[i];
    const outAt = beats[i + 1];
    const pin = ease(inAt, inAt + 16);
    const pout = outAt === undefined ? 0 : ease(outAt - 8, outAt, EXIT);
    if (pin <= 0 || pout >= 1) return null;
    return (
      <div
        key={i}
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 0,
          transform: `translateY(${(1 - pin) * 60 - pout * 40}%)`,
          opacity: pin * (1 - pout),
          filter: `blur(${(1 - pin) * 6 + pout * 4}px)`,
        }}
      >
        {i === 2 ? (
          <>
            {lines[i].split(" ").slice(0, -1).join(" ")}{" "}
            <span style={{ fontFamily: serif, fontStyle: "italic" }}>
              {lines[i].split(" ").slice(-1)[0]}
            </span>
          </>
        ) : (
          lines[i]
        )}
      </div>
    );
  };

  return (
    <AbsoluteFill style={{ fontFamily, overflow: "hidden" }}>
      <GshGround
        preset={ground ?? "garnet"}
        params={
          groundParams ??
          (dark
            ? undefined
            : {
                background: "#f6eeeb",
                colors: ["#f0a8a6", "#fff7f2", "#f6c3cb"],
                grain: 0.05,
              })
        }
        timeOffset={5}
        timeScale={0.4}
      />
      <AbsoluteFill style={{ background: c.scrim }} />
      <div
        style={{
          position: "absolute",
          left: (width - W * u) / 2,
          top: (height - H * u) / 2,
          width: W,
          height: H,
          transformOrigin: "0 0",
          transform: `scale(${u})`,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: tall ? 64 : 96,
            top: tall ? 96 : H / 2 - 84,
            width: tall ? W - 128 : 500,
            height: 170,
            fontSize: tall ? 68 : 76,
            fontWeight: 300,
            lineHeight: 1.04,
            letterSpacing: "-0.04em",
            color: c.copy,
            overflow: "hidden",
            textWrap: "balance",
          }}
        >
          {[0, 1, 2].map((i) => copyLine(i))}
        </div>
        <div
          style={{
            position: "absolute",
            left: phoneCx - BW / 2,
            top: phoneCy - BH / 2,
            width: BW,
            height: BH,
            transform: `translateY(${(1 - rise) * H * 0.9}px) scale(${k * cam})`,
          }}
        >
          <Phone c={c}>
            <div
              style={{
                position: "absolute",
                top: 58,
                left: 24,
                right: 22,
                height: 40,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                color: c.text,
                zIndex: 10,
              }}
            >
              <span
                style={{
                  fontFamily: serif,
                  fontSize: 32,
                  fontWeight: 400,
                  letterSpacing: "-0.01em",
                }}
              >
                Discover
              </span>
              <Icon d={P.sliders} size={24} color={c.text} />
            </div>
            {cards
              .slice(0, 4)
              .map((card, i) => ({ card, i }))
              .reverse()
              .map(({ card, i }) => {
                if (i < topIdx || i > topIdx + 1) return null;
                const mo = motion[i];
                const behind = i > topIdx;
                const prevGone = i > 0 ? motion[i - 1].gone : 1;
                const sc = behind ? 0.94 + 0.06 * Math.min(1, prevGone) : 1;
                return (
                  <div
                    key={card.title}
                    style={{
                      position: "absolute",
                      left: CARD_BOX.left,
                      top: CARD_BOX.top,
                      width: CARD_BOX.w,
                      height: CARD_BOX.h,
                      transform:
                        mo && !behind
                          ? `translate(${mo.dx}px, ${mo.dy}px) rotate(${mo.rot}deg)`
                          : `translateY(${(1 - Math.min(1, prevGone)) * 10}px) scale(${sc})`,
                      transformOrigin: "50% 110%",
                      borderRadius: 28,
                      boxShadow: behind
                        ? "none"
                        : "0 24px 50px -18px rgba(0,0,0,0.55), 0 6px 14px -6px rgba(0,0,0,0.35)",
                      opacity: behind ? 0.6 + 0.4 * Math.min(1, prevGone) : 1,
                    }}
                  >
                    <DeckCard card={card} accent={accent} t={f}>
                      {mo && !behind && mo.kind === "like" && (
                        <Stamp
                          text="Ship it"
                          color="#5fe39b"
                          opacity={mo.stamp}
                          rot={-12}
                          style={{ left: 22, top: 30 }}
                        />
                      )}
                      {mo && !behind && mo.kind === "nope" && (
                        <Stamp
                          text="Skip"
                          color="#ff7a7e"
                          opacity={mo.stamp}
                          rot={12}
                          style={{ right: 22, top: 30 }}
                        />
                      )}
                      {mo && !behind && mo.kind === "super" && (
                        <Stamp
                          text="Super like"
                          color="#ffffff"
                          opacity={mo.stamp}
                          rot={-6}
                          style={{ left: 70, top: 200 }}
                        />
                      )}
                    </DeckCard>
                  </div>
                );
              })}
            <div
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: BTN_Y - 30,
                height: 60,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: 26,
                zIndex: 10,
              }}
            >
              {buttons.map((b) => {
                const g = Math.min(1, b.glow);
                return (
                  <div
                    key={b.d}
                    style={{
                      width: b.s,
                      height: b.s,
                      borderRadius: b.s / 2,
                      background:
                        g > 0.02
                          ? `color-mix(in oklab, ${b.color} ${Math.round(g * 100)}%, ${c.btn})`
                          : c.btn,
                      boxShadow: c.btnRing,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transform: `scale(${1 + 0.06 * g})`,
                    }}
                  >
                    <Icon
                      d={b.d}
                      size={b.s * 0.44}
                      color={g > 0.5 ? "#fff" : b.color}
                      sw={b.sw}
                    />
                  </div>
                );
              })}
            </div>
            {f >= MATCH && (
              <AbsoluteFill
                style={{
                  zIndex: 20,
                  background: `color-mix(in oklab, ${c.overlay} ${Math.round(m * 100)}%, transparent)`,
                  backdropFilter: `blur(${18 * m}px)`,
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    top: 196,
                    textAlign: "center",
                    color: c.text,
                    fontFamily: serif,
                    fontStyle: "italic",
                    fontSize: 58,
                    fontWeight: 400,
                    letterSpacing: "-0.01em",
                    lineHeight: 1,
                    transform: `translateY(${(1 - mTitle) * 18}px)`,
                    opacity: mTitle,
                    filter: `blur(${(1 - mTitle) * 6}px)`,
                  }}
                >
                  It’s a match
                </div>
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    top: 300,
                    height: 150,
                    display: "flex",
                    justifyContent: "center",
                  }}
                >
                  <div
                    style={{
                      width: 136,
                      height: 136,
                      borderRadius: 68,
                      position: "relative",
                      overflow: "hidden",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#fff",
                      fontSize: 36,
                      fontWeight: 300,
                      boxShadow: `0 0 0 4px ${c.screen}, 0 18px 40px -12px rgba(0,0,0,0.5)`,
                      transform: `translateX(${16 - (1 - mAv[0]) * 80}px) rotate(${-6 * mAv[0]}deg) scale(${0.8 + 0.2 * mAv[0]})`,
                      opacity: Math.min(1, mAv[0] * 2),
                    }}
                  >
                    <Photo mood="golden" seed={3} />
                    <span style={{ position: "relative" }}>{initials}</span>
                  </div>
                  <div
                    style={{
                      width: 136,
                      height: 136,
                      borderRadius: 68,
                      background: accent,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: `0 0 0 4px ${c.screen}, 0 18px 40px -12px rgba(0,0,0,0.5)`,
                      transform: `translateX(${-16 + (1 - mAv[1]) * 80}px) rotate(${6 * mAv[1]}deg) scale(${0.8 + 0.2 * mAv[1]})`,
                      opacity: Math.min(1, mAv[1] * 2),
                    }}
                  >
                    <Icon d={P.play} size={46} color="#fff" fill="#fff" />
                  </div>
                  <div
                    style={{
                      position: "absolute",
                      top: 104,
                      left: SW / 2 - 22,
                      width: 44,
                      height: 44,
                      borderRadius: 22,
                      background: c.btn,
                      boxShadow: c.btnRing,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transform: `scale(${Math.max(0, mHeart)})`,
                    }}
                  >
                    <Icon
                      d={P.heart}
                      size={22}
                      color="#ff5a5f"
                      fill="#ff5a5f"
                    />
                  </div>
                </div>
                <div
                  style={{
                    position: "absolute",
                    left: 30,
                    right: 30,
                    top: 476,
                    textAlign: "center",
                    color: c.muted,
                    fontSize: 18,
                    lineHeight: 1.4,
                    opacity: mText,
                    transform: `translateY(${(1 - mText) * 12}px)`,
                    textWrap: "balance",
                  }}
                >
                  You and {matchWith} liked the same 4 components.
                </div>
                <div
                  style={{
                    position: "absolute",
                    left: 24,
                    right: 24,
                    top: 580,
                    opacity: Math.min(1, mCta * 1.6),
                    transform: `translateY(${(1 - mCta) * 24}px)`,
                  }}
                >
                  <div
                    style={{
                      height: 56,
                      borderRadius: 28,
                      background: c.field,
                      display: "flex",
                      alignItems: "center",
                      padding: "0 6px 0 20px",
                      color: c.muted,
                      fontSize: 15,
                      fontFamily: mono,
                    }}
                  >
                    <span style={{ flex: 1, whiteSpace: "nowrap" }}>
                      npx shadcn add @{matchWith}/…
                    </span>
                    <div
                      style={{
                        height: 44,
                        padding: "0 20px",
                        borderRadius: 22,
                        background: accent,
                        color: "#fff",
                        fontFamily,
                        fontSize: 17,
                        fontWeight: 400,
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      Install
                    </div>
                  </div>
                  <div
                    style={{
                      textAlign: "center",
                      color: c.text,
                      fontSize: 17,
                      marginTop: 22,
                    }}
                  >
                    Keep swiping
                  </div>
                </div>
              </AbsoluteFill>
            )}
            <StatusBar color={c.text} />
            <div
              style={{
                position: "absolute",
                left: tap.x - 22,
                top: tap.y - 22,
                width: 44,
                height: 44,
                borderRadius: 22,
                background: "rgba(255,255,255,0.26)",
                boxShadow:
                  "0 0 0 1.5px rgba(255,255,255,0.85), 0 4px 14px rgba(0,0,0,0.3)",
                opacity: tapOpacity,
                transform: `scale(${tapScale})`,
                zIndex: 35,
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
                background: c.text,
                zIndex: 36,
              }}
            />
          </Phone>
        </div>
      </div>
    </AbsoluteFill>
  );
}
