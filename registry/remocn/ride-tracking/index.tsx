"use client";

import { loadFont } from "@remotion/google-fonts/Onest";
import {
  getLength,
  getPointAtLength,
  getTangentAtLength,
} from "@remotion/paths";
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

const { fontFamily } = loadFont("normal", {
  weights: ["300", "400"],
  subsets: ["latin"],
});

export interface RideDriver {
  name: string;
  initials: string;
  rating: number;
  trips: string;
  car: string;
  plate: string;
}

export interface RideTrackingProps {
  driver?: RideDriver;
  /** Starting ETA in minutes; counts down to the arrival check. */
  eta?: number;
  /** Pickup street shown on the pin and in the sheet. */
  pickup?: string;
  accent?: string;
  speed?: number;
  theme?: "light" | "dark";
  /** Three lines beside the phone: route, drive, arrival. */
  lines?: [string, string, string];
  ground?: GshPresetId;
  groundParams?: Partial<GradientParams>;
}

const DEFAULT_DRIVER: RideDriver = {
  name: "Leo",
  initials: "LP",
  rating: 4.92,
  trips: "1,284 trips",
  car: "Grey Halcyon Aero",
  plate: "7KXR 284",
};

const SW = 393;
const SH = 852;
const BEZEL = 11;
const BW = SW + BEZEL * 2;
const BH = SH + BEZEL * 2;
const SHEET_Y = 556;
const FOCUS = { x: SW / 2, y: 300 };

const DRAW_AT = 14;
const DRAW_END = 42;
const DRIVE_AT = 52;
const DRIVE_END = 214;

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const ENTER = Easing.bezier(0.32, 0.72, 0, 1);
const MOVE = Easing.bezier(0.65, 0, 0.35, 1);
const EXIT = Easing.bezier(0.55, 0, 1, 0.45);
const CAMERA = Easing.bezier(0.87, 0, 0.13, 1);
const HEAVY = { mass: 1, damping: 26, stiffness: 120 };
const CARD = { mass: 0.8, damping: 18, stiffness: 160 };
const CHIP = { mass: 0.5, damping: 12, stiffness: 200 };
const hash = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

const AVES = [-60, 130, 300, 470, 620, 790, 960];
const STREETS = [-40, 140, 300, 460, 620, 770, 940, 1100, 1260, 1420];
const MAJOR_AVES = new Set([300, 620]);
const MAJOR_STREETS = new Set([460, 940]);
const ROUTE_PTS: [number, number][] = [
  [300, 1030],
  [300, 620],
  [620, 620],
  [620, 460],
  [684, 460],
];
const PICKUP = { x: 712, y: 460 };
const RIDER = { x: 724, y: 496 };
const PARK = { x: 300, y: 770, w: 170, h: 170 };
const LOT = { x: 470, y: 620, w: 150, h: 150 };
const RIVER = "M -80 330 C 160 270, 380 450, 620 380 S 900 300, 1080 350";

function roundedPath(pts: [number, number][], r: number) {
  let d = `M ${pts[0][0]} ${pts[0][1]}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const [px, py] = pts[i - 1];
    const [x, y] = pts[i];
    const [nx, ny] = pts[i + 1];
    const l1 = Math.hypot(x - px, y - py);
    const l2 = Math.hypot(nx - x, ny - y);
    const a = [x - ((x - px) / l1) * r, y - ((y - py) / l1) * r];
    const b = [x + ((nx - x) / l2) * r, y + ((ny - y) / l2) * r];
    d += ` L ${a[0]} ${a[1]} Q ${x} ${y} ${b[0]} ${b[1]}`;
  }
  const last = pts[pts.length - 1];
  return `${d} L ${last[0]} ${last[1]}`;
}
const ROUTE = roundedPath(ROUTE_PTS, 22);
const ROUTE_LEN = getLength(ROUTE);
const routeLen = (len: number) => Math.max(0, Math.min(ROUTE_LEN - 0.01, len));
const routePoint = (len: number) =>
  getPointAtLength(ROUTE, routeLen(len)) ?? { x: PICKUP.x, y: PICKUP.y };
const routeTangent = (len: number) =>
  getTangentAtLength(ROUTE, routeLen(len)) ?? { x: 1, y: 0 };

const LIGHT = {
  ground: "#eef0f2",
  block: "#e7e9ec",
  building: "#dde0e5",
  buildingEdge: "#d0d4da",
  road: "#ffffff",
  roadEdge: "#d6dae0",
  major: "#ffffff",
  majorEdge: "#c9ced6",
  park: "#cfe8cc",
  parkPath: "#e3f1df",
  water: "#aad3f0",
  label: "#5d636d",
  route: "#111111",
  casing: "#ffffff",
  carBody: "#fbfbfc",
  carShade: "#c9ccd2",
  glass: "#2b2f36",
  sheet: "#ffffff",
  text: "#111111",
  muted: "#6b6f76",
  chip: "#f1f2f4",
  line: "#ececee",
  status: "#111111",
  copy: "#141518",
  copyMuted: "rgba(20,21,24,0.46)",
  scrim: "rgba(243,241,237,0.3)",
  frame:
    "linear-gradient(155deg,#f1f1f3 0%,#c4c4ca 30%,#e2e2e6 62%,#b3b3ba 100%)",
  phoneShadow:
    "0 50px 90px -24px rgba(30,32,44,0.32), 0 14px 30px -10px rgba(30,32,44,0.18)",
  poi: "#7b818b",
  hair: "rgba(17,17,17,0.08)",
};
const DARK: typeof LIGHT = {
  ground: "#1b1e23",
  block: "#1f2228",
  building: "#262a31",
  buildingEdge: "#2e333b",
  road: "#30353e",
  roadEdge: "#25292f",
  major: "#3b414b",
  majorEdge: "#2a2e35",
  park: "#1c3324",
  parkPath: "#23402c",
  water: "#132c44",
  label: "#8f96a1",
  route: "#ffffff",
  casing: "#0b0c0e",
  carBody: "#f4f4f5",
  carShade: "#a1a5ad",
  glass: "#1d2026",
  sheet: "#161719",
  text: "#f4f4f5",
  muted: "#9a9ea6",
  chip: "#232427",
  line: "#2a2b2f",
  status: "#ffffff",
  copy: "#f4f4f6",
  copyMuted: "rgba(244,244,246,0.5)",
  scrim: "rgba(2,3,8,0.3)",
  frame:
    "linear-gradient(155deg,#55565c 0%,#2a2b2f 30%,#3d3e43 62%,#1f2023 100%)",
  phoneShadow:
    "0 50px 100px -20px rgba(0,0,0,0.7), 0 18px 36px -12px rgba(0,0,0,0.5)",
  poi: "#6d737d",
  hair: "rgba(255,255,255,0.08)",
};
type Palette = typeof LIGHT;

const POIS = [
  {
    x: 395,
    y: 545,
    name: "Halcyon Library",
    glyph: "M7 6h4v12H7zM13 6h4v12h-4z",
  },
  {
    x: 540,
    y: 700,
    name: "Fernway Coffee",
    glyph: "M6 9h10v5a4 4 0 01-4 4h-2a4 4 0 01-4-4zM16 10h2a2 2 0 010 4h-2",
  },
  {
    x: 705,
    y: 560,
    name: "Orbitly Fitness",
    glyph: "M5 12h14M7 8v8M17 8v8",
  },
  {
    x: 222,
    y: 860,
    name: "Tessel Market",
    glyph: "M6 8h12l-1 10H7zM9 8a3 3 0 016 0",
  },
  {
    x: 870,
    y: 410,
    name: "Pier 9",
    glyph: "M12 5v14M7 12a5 5 0 0010 0M9 7h6",
  },
];
const LABELS = [
  { x: 300, y: 860, text: "Harbor Ave", rot: -90 },
  { x: 620, y: 545, text: "Quarry Ave", rot: -90 },
  { x: 545, y: 460, text: "Linden St", rot: 0 },
  { x: 860, y: 460, text: "Linden St", rot: 0 },
  { x: 215, y: 140, text: "Tessel Blvd", rot: 0 },
  { x: 130, y: 700, text: "Elm Ave", rot: -90 },
  { x: 790, y: 700, text: "Bay Ave", rot: -90 },
  { x: 385, y: 1100, text: "Grove St", rot: 0 },
  { x: 545, y: 940, text: "Ashby St", rot: 0 },
  { x: 215, y: 620, text: "Mercer St", rot: 0 },
  { x: 470, y: 1180, text: "Wren Ave", rot: -90 },
];

/** Perimeter-block buildings: lots of varied width and depth around a courtyard. */
function blockBuildings(
  x0: number,
  y0: number,
  w: number,
  h: number,
  seed: number,
) {
  const out: { x: number; y: number; w: number; h: number }[] = [];
  const depth = (k: number) => 16 + hash(seed + k) * 16;
  const run = (
    len: number,
    k0: number,
    put: (at: number, size: number, k: number) => void,
  ) => {
    let at = 0;
    let k = k0;
    while (at < len - 6) {
      const size = Math.min(len - at, 14 + hash(seed + k * 3.1) * 30);
      if (hash(seed + k * 7.7) > 0.1) put(at, size - 2.5, k);
      at += size;
      k++;
    }
  };
  const top = depth(1);
  const bottom = depth(2);
  run(w, 10, (at, size, k) =>
    out.push({
      x: x0 + at,
      y: y0,
      w: size,
      h: top - (hash(seed + k) > 0.7 ? 5 : 0),
    }),
  );
  run(w, 40, (at, size, k) => {
    const d = bottom - (hash(seed + k) > 0.7 ? 5 : 0);
    out.push({ x: x0 + at, y: y0 + h - d, w: size, h: d });
  });
  const inner = h - top - bottom - 5;
  if (inner > 14) {
    run(inner, 70, (at, size, k) =>
      out.push({ x: x0, y: y0 + top + 2.5 + at, w: depth(k + 3), h: size }),
    );
    run(inner, 90, (at, size, k) => {
      const d = depth(k + 5);
      out.push({ x: x0 + w - d, y: y0 + top + 2.5 + at, w: d, h: size });
    });
  }
  return out;
}

/** Static vector map: blocks, park, river, roads, labels and POIs. */
function MapArt({ c }: { c: Palette }) {
  const blocks: React.ReactNode[] = [];
  for (let i = 0; i < AVES.length - 1; i++) {
    for (let j = 0; j < STREETS.length - 1; j++) {
      const x0 = AVES[i] + 13;
      const y0 = STREETS[j] + 13;
      const w = AVES[i + 1] - AVES[i] - 26;
      const h = STREETS[j + 1] - STREETS[j] - 26;
      const key = `${i}-${j}`;
      if (AVES[i] === PARK.x && STREETS[j] === PARK.y) continue;
      blocks.push(
        <rect
          key={key}
          x={x0}
          y={y0}
          width={w}
          height={h}
          rx={3}
          fill={c.block}
        />,
      );
      if (AVES[i] === LOT.x && STREETS[j] === LOT.y) {
        for (let r = 0; r < 4; r++)
          blocks.push(
            <path
              key={`${key}l${r}`}
              d={`M ${x0 + 10} ${y0 + 16 + r * 29} h ${w - 20}`}
              stroke={c.buildingEdge}
              strokeWidth={12}
              strokeDasharray="1 8"
            />,
          );
        continue;
      }
      for (const [n, b] of blockBuildings(
        x0,
        y0,
        w,
        h,
        i * 31 + j * 17,
      ).entries())
        blocks.push(
          <rect
            key={`${key}b${n}`}
            x={b.x}
            y={b.y}
            width={b.w}
            height={b.h}
            rx={1.5}
            fill={c.building}
            stroke={c.buildingEdge}
            strokeWidth={0.75}
          />,
        );
    }
  }
  const roads = (major: boolean, pass: 0 | 1) => {
    const w = (major ? 20 : 13) + (pass ? 0 : 2.5);
    const col = major
      ? pass
        ? c.major
        : c.majorEdge
      : pass
        ? c.road
        : c.roadEdge;
    return (
      <g key={`${major}${pass}`} stroke={col} strokeWidth={w}>
        {AVES.filter((x) => MAJOR_AVES.has(x) === major).map((x) => (
          <line key={`a${x}`} x1={x} y1={-400} x2={x} y2={2000} />
        ))}
        {STREETS.filter((y) => MAJOR_STREETS.has(y) === major).map((y) => (
          <line key={`s${y}`} x1={-400} y1={y} x2={1400} y2={y} />
        ))}
      </g>
    );
  };
  return (
    <g>
      <rect x={-400} y={-400} width={1800} height={2400} fill={c.ground} />
      {blocks}
      <rect
        x={PARK.x + 12}
        y={PARK.y + 12}
        width={PARK.w - 24}
        height={PARK.h - 24}
        rx={6}
        fill={c.park}
      />
      <path
        d={`M ${PARK.x + 20} ${PARK.y + 140} C ${PARK.x + 60} ${PARK.y + 80}, ${PARK.x + 110} ${PARK.y + 120}, ${PARK.x + 150} ${PARK.y + 30}`}
        stroke={c.parkPath}
        strokeWidth={5}
        fill="none"
        strokeLinecap="round"
      />
      {roads(false, 0)}
      {roads(false, 1)}
      <path d={RIVER} stroke={c.water} strokeWidth={58} fill="none" />
      {roads(true, 0)}
      {roads(true, 1)}
      <text
        x={PARK.x + 85}
        y={PARK.y + 90}
        textAnchor="middle"
        fontSize={10}
        fontWeight={400}
        fill={c.label}
      >
        Quarry Park
      </text>
      <text
        x={120}
        y={330}
        textAnchor="middle"
        fontSize={10}
        fontStyle="italic"
        fontWeight={400}
        fill={c.label}
        opacity={0.8}
      >
        Fern River
      </text>
      {LABELS.map((l) => (
        <text
          key={`${l.text}${l.x}${l.y}`}
          x={l.x}
          y={l.y}
          transform={`rotate(${l.rot} ${l.x} ${l.y})`}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={9}
          fontWeight={400}
          fill={c.label}
        >
          {l.text}
        </text>
      ))}
      {POIS.map((p) => (
        <g key={p.name} transform={`translate(${p.x} ${p.y})`}>
          <circle r={8.5} fill={c.poi} stroke={c.ground} strokeWidth={1.5} />
          <g transform="translate(-5.5 -5.5) scale(0.46)">
            <path
              d={p.glyph}
              stroke="#fff"
              strokeWidth={2.6}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
          <text
            x={13}
            y={0}
            dominantBaseline="central"
            fontSize={9.5}
            fontWeight={400}
            fill={c.label}
            stroke={c.ground}
            strokeWidth={3}
            paintOrder="stroke"
          >
            {p.name}
          </text>
        </g>
      ))}
    </g>
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
        padding: "6px 30px 0 34px",
        zIndex: 4,
      }}
    >
      <span
        style={{
          fontSize: 17,
          fontWeight: 400,
          color,
          letterSpacing: "-0.01em",
          width: 54,
          textAlign: "center",
        }}
      >
        9:41
      </span>
      <div style={{ display: "flex", gap: 7, alignItems: "center" }}>
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
        <svg width="16" height="12" viewBox="0 0 16 12">
          <path
            d="M8 11.2l2.3-2.6a3.3 3.3 0 00-4.6 0zM3.6 6.4a6.3 6.3 0 018.8 0l1.4-1.6a8.4 8.4 0 00-11.6 0zM.6 3.1a10.6 10.6 0 0114.8 0L16.8 1.5a12.7 12.7 0 00-17.6 0z"
            fill={color}
          />
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
              width: "78%",
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

function Phone({ children, c }: { children: React.ReactNode; c: Palette }) {
  const btn = (side: "left" | "right", top: number, h: number) => (
    <div
      style={{
        position: "absolute",
        [side]: -2.5,
        top,
        width: 4,
        height: h,
        borderRadius: 2,
        background: c.frame,
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
          background: c.frame,
          boxShadow: `${c.phoneShadow}, inset 0 0 0 1px rgba(255,255,255,0.22)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 3.5,
          borderRadius: 62.5,
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
          background: c.sheet,
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
            zIndex: 9,
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
            zIndex: 9,
          }}
        />
      </div>
    </div>
  );
}

const ICON = {
  back: "M15 5l-7 7 7 7",
  phone:
    "M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2",
  shield: "M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z",
  share: "M12 3v12M7 8l5-5 5 5M5 14v6h14v-6",
  check: "M5 12.5l4.5 4.5L19 7.5",
  star: "M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z",
};

function Glyph({
  d,
  size = 18,
  color,
}: {
  d: string;
  size?: number;
  color: string;
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d={d}
        stroke={color}
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Driver photo stand-in: a soft portrait drawn in SVG. */
function Portrait({ uid }: { uid: string }) {
  return (
    <svg
      width={52}
      height={52}
      viewBox="0 0 52 52"
      style={{ display: "block" }}
    >
      <defs>
        <linearGradient id={`${uid}bg`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#c9d6e3" />
          <stop offset="1" stopColor="#9fb3c8" />
        </linearGradient>
        <clipPath id={`${uid}av`}>
          <circle cx={26} cy={26} r={26} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${uid}av)`}>
        <rect width={52} height={52} fill={`url(#${uid}bg)`} />
        <path d="M6 54c2-11 10-16 20-16s18 5 20 16z" fill="#2f3a48" />
        <path d="M21 33h10v7a5 5 0 01-10 0z" fill="#b07a5a" />
        <ellipse cx={26} cy={24} rx={9} ry={10.5} fill="#c68b67" />
        <path
          d="M16.5 23c-.5-8 4-12.5 9.5-12.5S36 14 35.5 23c-1.5-4-4.5-6-9.5-6s-8 2-9.5 6z"
          fill="#2a211c"
        />
      </g>
      <circle cx={26} cy={26} r={25.5} fill="none" stroke="rgba(0,0,0,0.08)" />
    </svg>
  );
}

/** Side view of the car, as a ride app shows next to the plate. */
function CarSide({ uid, dark }: { uid: string; dark: boolean }) {
  return (
    <svg width={58} height={26} viewBox="0 0 58 26" style={{ flexShrink: 0 }}>
      <defs>
        <linearGradient id={`${uid}cs`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={dark ? "#8b9099" : "#a9aeb6"} />
          <stop offset="1" stopColor={dark ? "#5d626b" : "#7c828c"} />
        </linearGradient>
      </defs>
      <ellipse cx={29} cy={23.5} rx={26} ry={2} fill="rgba(0,0,0,0.12)" />
      <path
        d="M3 18.5v-4c0-1.6 1-2.6 2.6-3l9-1.8 7-5.2c1-.7 2.1-1 3.3-1h12.2c1.5 0 2.8.6 3.8 1.7l4.6 5 5.8 1.2c1.6.3 2.7 1.6 2.7 3.2v3.9c0 1-.8 1.5-1.6 1.5H4.6c-.9 0-1.6-.6-1.6-1.5z"
        fill={`url(#${uid}cs)`}
      />
      <path
        d="M17 10l6-4.6c.6-.5 1.4-.7 2.2-.7H30v5.3zM32.5 4.7h4.6c1 0 1.9.4 2.6 1.2l3.6 4.1H32.5z"
        fill={dark ? "#2a2e35" : "#3b4049"}
      />
      {[14, 45].map((x) => (
        <g key={x}>
          <circle cx={x} cy={19.5} r={4.6} fill="#1d1f23" />
          <circle cx={x} cy={19.5} r={2.2} fill="#9aa0a8" />
        </g>
      ))}
    </svg>
  );
}

export function RideTracking({
  driver = DEFAULT_DRIVER,
  eta = 4,
  pickup = "214 Linden St",
  accent = "#276EF1",
  speed = 1,
  theme = "light",
  lines = [
    "Book it in one tap.",
    "Watch it come to you.",
    "Your ride is here.",
  ],
  ground,
  groundParams,
}: RideTrackingProps) {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const f = frame * speed;
  const dark = theme === "dark";
  const c = dark ? DARK : LIGHT;
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");

  const tall = height > width;
  const W = tall ? 720 : 1280;
  const H = tall ? 1280 : 720;
  const u = Math.min(width / W, height / H);
  const k = tall ? (H * 0.72) / BH : (H * 0.94) / BH;
  const phoneCx = tall ? W / 2 : W * 0.68;
  const phoneCy = tall ? H - 30 - (BH * k) / 2 : H / 2;

  const sp = (at: number, config: Partial<typeof CARD> = CARD) =>
    spring({ frame: f - at, fps, config });
  const rise = sp(0, HEAVY);
  const camS = interpolate(f, [0, 270], [1, 1.03], clamp);

  const prog = (t: number) =>
    interpolate(t, [DRIVE_AT, DRIVE_END], [0, 1], { ...clamp, easing: MOVE });
  const d = prog(f);
  const s = d * ROUTE_LEN;
  const car = routePoint(s);
  const tan = routeTangent(s);
  const angle = (Math.atan2(tan.y, tan.x) * 180) / Math.PI + 90;
  const draw = interpolate(f, [DRAW_AT, DRAW_END], [0, 1], {
    ...clamp,
    easing: MOVE,
  });

  const lagged = [0, 4, 8, 12].map((lag) =>
    routePoint(prog(f - lag) * ROUTE_LEN),
  );
  const follow = {
    x: lagged.reduce((a, p) => a + p.x, 0) / lagged.length,
    y: lagged.reduce((a, p) => a + p.y, 0) / lagged.length,
  };
  const overview = { x: 505, y: 745 };
  const target = {
    x: follow.x + (PICKUP.x - follow.x) * 0.22,
    y: follow.y + (PICKUP.y - follow.y) * 0.22,
  };
  const m = interpolate(f, [DRAW_END - 6, DRIVE_AT + 30], [0, 1], {
    ...clamp,
    easing: CAMERA,
  });
  const arrive = spring({
    frame: f - DRIVE_END,
    fps,
    config: { damping: 200 },
    durationInFrames: 30,
  });
  const camX = overview.x + (target.x - overview.x) * m;
  const camY = overview.y + (target.y - overview.y) * m;
  const zoom = interpolate(m, [0, 1], [0.6, 0.98]) + arrive * 0.2;

  const stepAt = (n: number) => {
    for (let t = DRIVE_AT; t <= DRIVE_END; t++)
      if (prog(t) >= n / eta) return t;
    return DRIVE_END;
  };
  const steps = Array.from({ length: eta - 1 }, (_, i) => stepAt(i + 1));
  const roll = steps.reduce((a, at) => a + sp(at, CARD), 0);
  const etaLabels = Array.from({ length: eta - 1 }, (_, i) => `${eta - i}`);
  const arrived = f >= DRIVE_END;
  const arrivedIn = sp(DRIVE_END, CHIP);
  const swap = Math.min(1, sp(DRIVE_END, { damping: 200 }));
  const sheetIn = sp(10, CARD);
  const pinIn = sp(DRAW_END - 6, CHIP);
  const rows = [0, 1].map((i) => sp(18 + i * 4, CARD));

  const dash = `${Math.max(0.001, ROUTE_LEN * draw - s)} ${ROUTE_LEN * 3}`;
  const pulses = [0, 22, 44].map((off) => {
    const t = (((f - DRIVE_END - off) % 66) + 66) % 66;
    return f - DRIVE_END - off < 0 ? null : t / 66;
  });

  const row: React.CSSProperties = { display: "flex", alignItems: "center" };
  const pillX = FOCUS.x + (PICKUP.x - camX) * zoom;
  const rise8 = (v: number): React.CSSProperties => ({
    opacity: Math.min(1, v * 1.4),
    transform: `translateY(${(1 - v) * 16}px)`,
  });

  const beats = [0, DRIVE_AT - 4, DRIVE_END];
  const copyLine = (i: number) => {
    const inAt = beats[i] + (i === 0 ? 8 : 0);
    const outAt = beats[i + 1];
    const pin = interpolate(f, [inAt, inAt + 14], [0, 1], {
      ...clamp,
      easing: ENTER,
    });
    const pout =
      outAt === undefined
        ? 0
        : interpolate(f, [outAt - 2, outAt + 6], [0, 1], {
            ...clamp,
            easing: EXIT,
          });
    if (pin <= 0 || pout >= 1) return null;
    return (
      <div
        key={i}
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 0,
          transform: `translateY(${(1 - pin) * 70 - pout * 50}%)`,
          opacity: pin * (1 - pout),
        }}
      >
        {lines[i]}
      </div>
    );
  };

  return (
    <AbsoluteFill style={{ fontFamily, overflow: "hidden" }}>
      <GshGround
        preset={ground ?? (dark ? "earthshine" : "paper-crease")}
        params={groundParams}
        timeOffset={dark ? 3 : 5}
        timeScale={0.35}
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
            left: tall ? 56 : 88,
            top: tall ? 84 : H / 2 - 112,
            width: tall ? W - 112 : 470,
            height: tall ? 140 : 160,
            fontSize: tall ? 62 : 70,
            fontWeight: 300,
            lineHeight: 1.04,
            letterSpacing: "-0.035em",
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
            left: tall ? 56 : 88,
            top: tall ? 236 : H / 2 + 72,
            fontSize: tall ? 26 : 22,
            fontWeight: 400,
            color: c.copyMuted,
            fontVariantNumeric: "tabular-nums",
            ...rise8(sp(20, CARD)),
          }}
        >
          {arrived ? `${driver.name} · ${driver.plate}` : `Pickup at ${pickup}`}
        </div>
        <div
          style={{
            position: "absolute",
            left: phoneCx - BW / 2,
            top: phoneCy - BH / 2,
            width: BW,
            height: BH,
            transform: `translateY(${(1 - rise) * H * 0.9}px) scale(${k * camS})`,
          }}
        >
          <Phone c={c}>
            <svg
              width={SW}
              height={SH}
              style={{ position: "absolute", inset: 0 }}
              fontFamily={fontFamily}
            >
              <defs>
                <filter
                  id={`${uid}sh`}
                  x="-50%"
                  y="-50%"
                  width="200%"
                  height="200%"
                >
                  <feDropShadow
                    dx="0"
                    dy="2"
                    stdDeviation="2.2"
                    floodOpacity="0.4"
                  />
                </filter>
                <linearGradient id={`${uid}car`} x1="0" x2="1" y1="0" y2="0">
                  <stop offset="0" stopColor={c.carShade} />
                  <stop offset="0.3" stopColor={c.carBody} />
                  <stop offset="0.7" stopColor={c.carBody} />
                  <stop offset="1" stopColor={c.carShade} />
                </linearGradient>
              </defs>
              <g
                transform={`translate(${FOCUS.x} ${FOCUS.y}) scale(${zoom}) translate(${-camX} ${-camY})`}
              >
                <MapArt c={c} />
                <path
                  d={ROUTE}
                  stroke={c.casing}
                  strokeWidth={11}
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray={dash}
                  strokeDashoffset={-s}
                />
                <path
                  d={ROUTE}
                  stroke={c.route}
                  strokeWidth={6}
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray={dash}
                  strokeDashoffset={-s}
                />
                {pulses.map((p, i) =>
                  p === null ? null : (
                    <circle
                      key={i}
                      cx={PICKUP.x}
                      cy={PICKUP.y}
                      r={8 + p * 46}
                      fill={accent}
                      opacity={(1 - p) * 0.3}
                    />
                  ),
                )}
                <g
                  transform={`translate(${PICKUP.x} ${PICKUP.y}) scale(${pinIn})`}
                >
                  <line
                    x1={0}
                    y1={0}
                    x2={0}
                    y2={-24}
                    stroke={accent}
                    strokeWidth={2.5}
                  />
                  <circle r={8} fill={accent} stroke="#fff" strokeWidth={2.5} />
                  <rect x={-2.5} y={-2.5} width={5} height={5} fill="#fff" />
                </g>
                <g
                  transform={`translate(${RIDER.x} ${RIDER.y})`}
                  opacity={Math.min(1, pinIn)}
                >
                  {[0, 1, 2].map((i) => (
                    <circle
                      key={i}
                      cx={(PICKUP.x - RIDER.x) * (0.25 + i * 0.25)}
                      cy={(PICKUP.y + 6 - RIDER.y) * (0.25 + i * 0.25)}
                      r={1.6}
                      fill={c.label}
                    />
                  ))}
                  <circle r={16} fill={accent} opacity={0.14} />
                  <circle
                    r={6.5}
                    fill={accent}
                    stroke="#fff"
                    strokeWidth={2.5}
                  />
                </g>
                <g
                  transform={`translate(${car.x} ${car.y}) rotate(${angle}) scale(1.35)`}
                  filter={`url(#${uid}sh)`}
                >
                  <path
                    d="M -7.5 -14 Q -7.5 -17 -4 -17.5 L 4 -17.5 Q 7.5 -17 7.5 -14 L 8 13 Q 8 17 4 17.5 L -4 17.5 Q -8 17 -8 13 Z"
                    fill={`url(#${uid}car)`}
                    stroke={c.carShade}
                    strokeWidth={0.6}
                  />
                  <path
                    d="M -6 -7.5 Q 0 -10 6 -7.5 L 5 -3 L -5 -3 Z"
                    fill={c.glass}
                  />
                  <path
                    d="M -5 9 L 5 9 L 5.6 12.5 Q 0 14 -5.6 12.5 Z"
                    fill={c.glass}
                  />
                  <rect
                    x={-5}
                    y={-3}
                    width={10}
                    height={12}
                    rx={2}
                    fill={c.carBody}
                  />
                </g>
              </g>
            </svg>
            <div
              style={{
                position: "absolute",
                left: pillX,
                top:
                  FOCUS.y + (PICKUP.y - camY) * zoom - 24 * zoom * pinIn - 38,
                transform: `translateX(-50%) scale(${pinIn})`,
                transformOrigin: "50% 100%",
                opacity: interpolate(
                  Math.min(pillX, SW - pillX),
                  [40, 110],
                  [0, 1],
                  clamp,
                ),
                padding: "8px 13px",
                borderRadius: 12,
                background: c.sheet,
                color: c.text,
                fontSize: 14,
                fontWeight: 400,
                whiteSpace: "nowrap",
                boxShadow: dark
                  ? "0 0 0 1px rgba(255,255,255,0.1), 0 8px 20px rgba(0,0,0,0.4)"
                  : "0 0 0 1px rgba(0,0,0,0.05), 0 1px 3px rgba(0,0,0,0.08), 0 8px 18px -6px rgba(0,0,0,0.18)",
                zIndex: 3,
                ...row,
                gap: 7,
              }}
            >
              <div
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: 4,
                  background: accent,
                }}
              />
              {arrived ? "Driver is here" : pickup}
            </div>
            <div
              style={{
                position: "absolute",
                inset: "0 0 auto 0",
                height: 120,
                background: `linear-gradient(180deg, ${dark ? "rgba(0,0,0,0.55)" : "rgba(255,255,255,0.75)"}, transparent)`,
                zIndex: 3,
              }}
            />
            <StatusBar color={c.status} />
            <div
              style={{
                position: "absolute",
                top: 62,
                left: 18,
                width: 44,
                height: 44,
                borderRadius: 22,
                background: c.sheet,
                boxShadow: dark
                  ? "0 0 0 1px rgba(255,255,255,0.08)"
                  : "0 0 0 1px rgba(0,0,0,0.05), 0 4px 12px -4px rgba(0,0,0,0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 4,
              }}
            >
              <Glyph d={ICON.back} size={20} color={c.text} />
            </div>
            <div
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: SHEET_Y,
                bottom: 0,
                background: c.sheet,
                borderRadius: "28px 28px 0 0",
                boxShadow: dark
                  ? "0 0 0 1px rgba(255,255,255,0.07)"
                  : "0 -1px 0 rgba(0,0,0,0.04), 0 -12px 32px -8px rgba(0,0,0,0.14)",
                transform: `translateY(${(1 - sheetIn) * 340}px)`,
                padding: "8px 20px 0",
                boxSizing: "border-box",
                color: c.text,
                zIndex: 5,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 5,
                  borderRadius: 3,
                  background: c.hair,
                  margin: "0 auto 16px",
                }}
              />
              <div style={{ ...row, justifyContent: "space-between", gap: 12 }}>
                <div style={{ position: "relative", flex: 1, height: 52 }}>
                  {[false, true].map((isArr) => (
                    <div
                      key={String(isArr)}
                      style={{
                        position: "absolute",
                        inset: 0,
                        opacity: isArr ? swap : 1 - swap,
                        transform: `translateY(${isArr ? (1 - swap) * 10 : -swap * 8}px)`,
                      }}
                    >
                      <div
                        style={{
                          fontSize: 23,
                          fontWeight: 400,
                          letterSpacing: "-0.02em",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {isArr
                          ? "Your driver has arrived"
                          : `${driver.name} is on the way`}
                      </div>
                      <div
                        style={{ fontSize: 15, color: c.muted, marginTop: 4 }}
                      >
                        {isArr
                          ? `Meet ${driver.name} at the pin`
                          : `Arriving at ${pickup}`}
                      </div>
                    </div>
                  ))}
                </div>
                <div
                  style={{
                    position: "relative",
                    width: 64,
                    height: 52,
                    borderRadius: 14,
                    background: c.chip,
                    overflow: "hidden",
                    flexShrink: 0,
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      opacity: 1 - swap,
                      maskImage:
                        "linear-gradient(180deg, transparent, #000 22%, #000 78%, transparent)",
                    }}
                  >
                    <div style={{ transform: `translateY(${-roll * 52}px)` }}>
                      {[...etaLabels, "1"].map((l, i) => (
                        <div
                          key={`${l}${i}`}
                          style={{
                            height: 52,
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <div
                            style={{
                              fontSize: 22,
                              fontWeight: 400,
                              lineHeight: "24px",
                            }}
                          >
                            {l}
                          </div>
                          <div style={{ fontSize: 12, color: c.muted }}>
                            min
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      background: accent,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      opacity: arrived ? Math.min(1, arrivedIn * 1.6) : 0,
                    }}
                  >
                    <div
                      style={{ transform: `scale(${0.5 + arrivedIn * 0.5})` }}
                    >
                      <Glyph d={ICON.check} size={26} color="#fff" />
                    </div>
                  </div>
                </div>
              </div>
              <div
                style={{
                  height: 4,
                  borderRadius: 2,
                  background: c.chip,
                  marginTop: 16,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: "100%",
                    height: 4,
                    borderRadius: 2,
                    background: arrived ? accent : c.text,
                    transform: `scaleX(${0.06 + d * 0.94})`,
                    transformOrigin: "0 50%",
                  }}
                />
              </div>
              <div
                style={{
                  height: 1,
                  background: c.line,
                  margin: "20px -20px 16px",
                }}
              />
              <div style={{ ...row, gap: 12, ...rise8(rows[0]) }}>
                <div style={{ flexShrink: 0 }}>
                  <Portrait uid={uid} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      ...row,
                      gap: 8,
                      fontSize: 17,
                      fontWeight: 400,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {driver.name}
                    <span
                      style={{
                        ...row,
                        gap: 3,
                        fontSize: 13,
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      <svg
                        width={11}
                        height={11}
                        viewBox="0 0 24 24"
                        style={{ flexShrink: 0 }}
                      >
                        <path d={ICON.star} fill={c.text} />
                      </svg>
                      {driver.rating.toFixed(2)}
                    </span>
                  </div>
                  <div style={{ fontSize: 13, color: c.muted, marginTop: 2 }}>
                    {driver.trips}
                  </div>
                </div>
                <CarSide uid={uid} dark={dark} />
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div
                    style={{
                      display: "inline-block",
                      padding: "3px 8px",
                      borderRadius: 6,
                      background: c.chip,
                      fontSize: 15,
                      fontWeight: 400,
                      letterSpacing: "0.04em",
                    }}
                  >
                    {driver.plate}
                  </div>
                  <div style={{ fontSize: 12, color: c.muted, marginTop: 4 }}>
                    {driver.car}
                  </div>
                </div>
              </div>
              <div
                style={{ ...row, gap: 10, marginTop: 22, ...rise8(rows[1]) }}
              >
                <div
                  style={{
                    flex: 1,
                    height: 46,
                    borderRadius: 23,
                    background: c.chip,
                    ...row,
                    padding: "0 18px",
                    fontSize: 15,
                    color: c.muted,
                  }}
                >
                  Message {driver.name}
                </div>
                {[ICON.phone, ICON.shield].map((ic) => (
                  <div
                    key={ic}
                    style={{
                      width: 46,
                      height: 46,
                      borderRadius: 23,
                      background: c.chip,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Glyph d={ic} size={19} color={c.text} />
                  </div>
                ))}
              </div>
            </div>
          </Phone>
        </div>
      </div>
    </AbsoluteFill>
  );
}
