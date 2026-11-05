"use client";

import { loadFont } from "@remotion/google-fonts/Onest";
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

export interface CallParticipant {
  name: string;
  /** Tile hue: drives the backdrop gradient, avatar and silhouette tint. */
  color: string;
  /** `true` draws a stylised camera feed (silhouette), `false` an avatar with initials. */
  camera?: boolean;
  muted?: boolean;
}

export interface VideoCallProps {
  /** Up to six people, in join order. */
  participants?: CallParticipant[];
  meetingCode?: string;
  time?: string;
  /** Index of the participant who shares their screen. */
  presenter?: number;
  /** `false` keeps the grid and ends on reactions only. */
  present?: boolean;
  /** Screenshot shown as the shared screen. */
  src?: string;
  /** Custom shared-screen content (wins over `src`). */
  children?: React.ReactNode;
  accent?: string;
  speed?: number;
  ground?: GshPresetId;
  groundParams?: Partial<GradientParams>;
}

const DEFAULT_PARTICIPANTS: CallParticipant[] = [
  { name: "You", color: "#5B7A99", camera: true },
  { name: "Maya Chen", color: "#C98A55", camera: true },
  { name: "Leo Park", color: "#12A594", camera: false, muted: true },
  { name: "Priya Raman", color: "#8E6CC9", camera: true },
  { name: "Sam Okafor", color: "#D9644A", camera: false },
  { name: "Noor Haddad", color: "#4F8FD6", camera: true, muted: true },
];

const JOINS = [-30, 22, 46, 54, 80, 88];
const PRESENT_AT = 150;
const TRAY_AT = 196;
const INK = "#F1F1F4";

const ENTER_SOFT = Easing.bezier(0.22, 1, 0.36, 1);
const MOVE = Easing.bezier(0.65, 0, 0.35, 1);
const EXIT = Easing.bezier(0.55, 0, 1, 0.45);
const CARD = { mass: 0.8, damping: 18, stiffness: 160 };
const CHIP = { mass: 0.5, damping: 12, stiffness: 200 };
const HEAVY = { mass: 1, damping: 26, stiffness: 120 };

const clamp = (v: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
const CL = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

function rgb(c: string): [number, number, number] {
  const hex = c.replace("#", "");
  const full = hex.length === 3 ? hex.replace(/(.)/g, "$1$1") : hex;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return [128, 128, 128];
  const n = Number.parseInt(full, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function withAlpha(c: string, a: number) {
  const [r, g, b] = rgb(c);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}
function mix(a: string, b: string, t: number) {
  const x = rgb(a);
  const y = rgb(b);
  const m = (i: number) =>
    Math.round(x[i] + (y[i] - x[i]) * t)
      .toString(16)
      .padStart(2, "0");
  return `#${m(0)}${m(1)}${m(2)}`;
}
const wave = (f: number, k: number) =>
  0.5 + 0.5 * Math.sin(f * 0.83 + k * 2.3) * Math.cos(f * 0.31 + k * 1.1);
const initials = (name: string) =>
  name
    .split(" ")
    .map((p) => p[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}
interface Stage {
  area: Rect;
  main: Rect;
  gap: number;
  tall: boolean;
  stripCols: number;
  stripTop: number;
}
const addDelta = (r: Rect, a: Rect, b: Rect, t: number): Rect => ({
  x: r.x + (b.x - a.x) * t,
  y: r.y + (b.y - a.y) * t,
  w: r.w + (b.w - a.w) * t,
  h: r.h + (b.h - a.h) * t,
});

function gridRect(S: Stage, n: number, i: number): Rect {
  const A = S.area;
  const cols = S.tall ? (n <= 2 ? 1 : 2) : n <= 1 ? 1 : n <= 4 ? 2 : 3;
  const rows = Math.ceil(n / cols);
  const cw = (A.w - (cols - 1) * S.gap) / cols;
  const ch = (A.h - (rows - 1) * S.gap) / rows;
  const row = Math.floor(i / cols);
  const inRow = Math.min(cols, n - row * cols);
  const offset = ((cols - inRow) * (cw + S.gap)) / 2;
  return {
    x: A.x + offset + (i % cols) * (cw + S.gap),
    y: A.y + row * (ch + S.gap),
    w: cw,
    h: ch,
  };
}
function stripRect(S: Stage, n: number, i: number): Rect {
  const A = S.area;
  if (S.tall) {
    const cols = S.stripCols;
    const rows = Math.ceil(n / cols);
    const w = (A.w - (cols - 1) * S.gap) / cols;
    const h = (A.y + A.h - S.stripTop - (rows - 1) * S.gap) / rows;
    return {
      x: A.x + (i % cols) * (w + S.gap),
      y: S.stripTop + Math.floor(i / cols) * (h + S.gap),
      w,
      h,
    };
  }
  const h = (A.h - (n - 1) * S.gap) / n;
  return {
    x: S.main.x + S.main.w + S.gap,
    y: A.y + i * (h + S.gap),
    w: A.x + A.w - (S.main.x + S.main.w + S.gap),
    h,
  };
}

const ICON: Record<string, string> = {
  mic: "M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3zM5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21",
  micOff:
    "M15 10.5V6a3 3 0 0 0-5.8-1M9 9v3a3 3 0 0 0 4.6 2.5M5.5 11a6.5 6.5 0 0 0 10.4 5.2M18.5 11a6.4 6.4 0 0 1-.5 2.5M12 17.5V21M4 4l16 16",
  cam: "M4 6.5h10a1.5 1.5 0 0 1 1.5 1.5v8a1.5 1.5 0 0 1-1.5 1.5H4A1.5 1.5 0 0 1 2.5 16V8A1.5 1.5 0 0 1 4 6.5zM15.5 10.5l5-3v9l-5-3",
  present:
    "M4.5 4.5h15a1.5 1.5 0 0 1 1.5 1.5v9.5a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 15.5V6a1.5 1.5 0 0 1 1.5-1.5zM12 14V8.5M9.5 11 12 8.5l2.5 2.5M8 20.5h8",
  hand: "M8 12V5.5a1.3 1.3 0 0 1 2.6 0V11m0-.5V4.3a1.3 1.3 0 0 1 2.6 0V11m0-5a1.3 1.3 0 0 1 2.6 0v5.5M15.8 8.5a1.3 1.3 0 0 1 2.6 0v5.7a6.3 6.3 0 0 1-6.3 6.3h-.6a6.3 6.3 0 0 1-5-2.5L4.4 14.6a1.4 1.4 0 0 1 2.1-1.8L8 14.2",
  more: "M6 12h.01M12 12h.01M18 12h.01",
  people:
    "M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM2.5 20c.6-3.4 3.2-5.5 6.5-5.5s5.9 2.1 6.5 5.5M16 4.3a3.5 3.5 0 0 1 0 6.4M18 14.8c1.9.7 3.2 2.5 3.5 5.2",
  chat: "M5 4.5h14A1.5 1.5 0 0 1 20.5 6v9a1.5 1.5 0 0 1-1.5 1.5H8.5L4 20V6a1.5 1.5 0 0 1 1-1.5z",
  heart: "M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z",
  thumb:
    "M7 11v9H4v-9zM7 11l4-7a2 2 0 0 1 3 2l-1 4h5a2 2 0 0 1 2 2.3l-1.2 6A2 2 0 0 1 16.8 20H7",
  star: "M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.9-5.2-2.8-5.2 2.8 1-5.9-4.3-4.1 5.9-.8z",
  check: "M5 12.5l4.5 4.5L19 7.5",
  react:
    "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM8.5 14a4 4 0 0 0 7 0M9 9.5h.01M15 9.5h.01",
};
const DOT_ICONS = new Set(["more"]);

function Icon({
  name,
  size = 22,
  color = INK,
}: {
  name: string;
  size?: number;
  color?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={DOT_ICONS.has(name) ? 3 : 1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ display: "block" }}
      aria-hidden
    >
      <path d={ICON[name]} />
    </svg>
  );
}

const ROOMS = [
  { win: [0.06, 0.06, 0.3, 0.5], lamp: [0.82, 0.2], plant: [0.88, 0.6] },
  { win: [0.64, 0.05, 0.3, 0.46], lamp: [0.14, 0.28], plant: [0.08, 0.64] },
  { win: [0.36, 0.03, 0.34, 0.26], lamp: [0.86, 0.46], plant: [0.06, 0.56] },
];

type HairStyle = "short" | "long" | "bun" | "curly" | "buzz" | "wavy";
interface Look {
  skin: string;
  hair: string;
  style: HairStyle;
  top: "crew" | "hoodie" | "collar";
  cloth: string;
  glasses?: boolean;
  headset?: boolean;
}
const LOOKS: Look[] = [
  {
    skin: "#E2B394",
    hair: "#2B211C",
    style: "short",
    top: "hoodie",
    cloth: "#3A3F47",
    headset: true,
  },
  {
    skin: "#EEC9A8",
    hair: "#17120F",
    style: "long",
    top: "crew",
    cloth: "#CDBBA7",
  },
  {
    skin: "#8E5B3C",
    hair: "#120E0C",
    style: "curly",
    top: "collar",
    cloth: "#E6E4DF",
  },
  {
    skin: "#B47A55",
    hair: "#1C1512",
    style: "bun",
    top: "crew",
    cloth: "#5A4C86",
    glasses: true,
  },
  {
    skin: "#734A31",
    hair: "#100D0B",
    style: "buzz",
    top: "hoodie",
    cloth: "#2F5A4E",
  },
  {
    skin: "#D7A07C",
    hair: "#4A3122",
    style: "wavy",
    top: "collar",
    cloth: "#3D5A78",
  },
];

const HAIR_BACK: Partial<Record<HairStyle, string>> = {
  long: "M84 94C80 60 102 50 122 51C144 52 162 66 158 100L164 172C150 180 132 178 126 170L114 170C106 178 88 180 76 172Z",
  wavy: "M84 94C80 62 102 50 122 51C144 52 162 66 158 98C164 118 166 140 158 156C150 164 140 160 136 152L104 152C98 162 84 164 78 154C72 138 78 116 84 94Z",
  bun: "M104 52a16 16 0 1 0 32 0a16 16 0 1 0-32 0",
};
const HAIR_FRONT: Record<HairStyle, string> = {
  short:
    "M85 104C80 66 100 52 124 53C148 54 162 70 155 104C152 88 146 80 136 76C122 82 102 80 92 86C88 92 86 98 85 104Z",
  long: "M86 104C85 70 102 56 120 56C138 56 155 70 154 104C150 84 138 70 121 66C104 70 92 84 86 104Z",
  bun: "M86 98C86 68 104 57 120 57C136 57 154 68 154 98C146 80 134 71 120 71C106 71 94 80 86 98Z",
  curly:
    "M84 100C80 64 100 52 120 52C142 52 160 64 156 100C150 84 140 76 120 76C102 76 90 84 84 100Z",
  buzz: "M87 94C88 66 104 58 120 58C136 58 152 66 153 94C146 80 134 74 120 74C106 74 94 80 87 94Z",
  wavy: "M86 102C84 66 104 54 124 55C146 57 158 72 154 100C146 84 134 74 114 76C102 80 92 90 86 102Z",
};
const CURLS = [-150, -128, -106, -84, -62, -40, -18].map((deg) => {
  const a = (deg * Math.PI) / 180;
  return [120 + Math.cos(a) * 33, 92 + Math.sin(a) * 36];
});

function Person({
  w,
  h,
  color,
  seed,
  frame,
  level,
}: {
  w: number;
  h: number;
  color: string;
  seed: number;
  frame: number;
  level: number;
}) {
  const id = `vc-p${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const look = LOOKS[seed % LOOKS.length];
  const s = Math.min((h * 0.96) / 240, (w * 0.86) / 240);
  const ox = w / 2 - 120 * s + Math.sin(frame * 0.045 + seed) * 3 * s;
  const oy = h - 240 * s;
  const bob =
    Math.sin(frame * 0.06 + seed * 2) * 1.6 +
    level * Math.sin(frame * 0.55) * 1.2;
  const tilt = Math.sin(frame * 0.035 + seed) * 2.4 + level * 1.4;
  const blink = (frame + seed * 37) % (92 + seed * 11) < 3 ? 0.15 : 1;
  const talk = level * wave(frame * 1.3, seed);
  const skinL = mix(look.skin, "#FFFFFF", 0.14);
  const skinD = mix(look.skin, "#2A1A12", 0.3);
  const cloth = mix(look.cloth, color, 0.12);
  const clothD = mix(cloth, "#0B0D12", 0.4);
  const ink = "#2A1F1A";
  const back = HAIR_BACK[look.style];
  const open = 1.5 + talk * 5;
  return (
    <svg
      width={w}
      height={h}
      style={{ position: "absolute", left: 0, top: 0 }}
      aria-hidden
    >
      <defs>
        <radialGradient id={`${id}f`} cx="0.36" cy="0.34" r="0.8">
          <stop offset="0" stopColor={skinL} />
          <stop offset="0.55" stopColor={look.skin} />
          <stop offset="1" stopColor={skinD} />
        </radialGradient>
        <linearGradient id={`${id}c`} x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0" stopColor={mix(cloth, "#FFFFFF", 0.1)} />
          <stop offset="1" stopColor={clothD} />
        </linearGradient>
      </defs>
      <g transform={`translate(${ox} ${oy}) scale(${s})`}>
        <g transform={`translate(0 ${bob}) rotate(${tilt} 120 150)`}>
          {back ? <path d={back} fill={look.hair} /> : null}
        </g>
        <rect x={105} y={124} width={30} height={48} rx={11} fill={skinD} />
        <path
          d="M4 240C8 200 30 178 74 170C94 166 106 163 120 163C134 163 146 166 166 170C210 178 232 200 236 240Z"
          fill={`url(#${id}c)`}
        />
        {look.top === "hoodie" ? (
          <>
            <path
              d="M78 172C92 154 106 158 112 176M162 172C148 154 134 158 128 176"
              stroke={mix(cloth, "#FFFFFF", 0.12)}
              strokeWidth={9}
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M112 180L110 210M128 180L130 210"
              stroke="rgba(236,236,236,0.85)"
              strokeWidth={2.2}
              strokeLinecap="round"
            />
          </>
        ) : look.top === "collar" ? (
          <>
            <path d="M102 164L120 192L138 164Z" fill={skinD} />
            <path
              d="M100 163L120 190L106 198L92 170ZM140 163L120 190L134 198L148 170Z"
              fill={mix(cloth, "#FFFFFF", 0.55)}
            />
          </>
        ) : (
          <path
            d="M100 165Q120 184 140 165"
            stroke={clothD}
            strokeWidth={4}
            fill={skinD}
          />
        )}
        <g transform={`translate(0 ${bob}) rotate(${tilt} 120 150)`}>
          {[86, 154].map((x) => (
            <ellipse key={x} cx={x} cy={104} rx={6} ry={10} fill={skinD} />
          ))}
          <path
            d="M86 96C86 70 102 58 120 58C138 58 154 70 154 96C154 122 140 142 120 142C100 142 86 122 86 96Z"
            fill={`url(#${id}f)`}
          />
          {look.style === "curly"
            ? CURLS.map(([x, y]) => (
                <circle key={x} cx={x} cy={y} r={11} fill={look.hair} />
              ))
            : null}
          <path d={HAIR_FRONT[look.style]} fill={look.hair} />
          <path
            d="M100 90Q107 86 114 89M126 89Q133 86 140 90"
            stroke={mix(look.hair, look.skin, 0.25)}
            strokeWidth={2.6}
            strokeLinecap="round"
            fill="none"
          />
          {[107, 133].map((x) => (
            <ellipse
              key={x}
              cx={x}
              cy={101}
              rx={3.4}
              ry={2.7 * blink}
              fill={ink}
            />
          ))}
          <path
            d="M121 104Q118 114 121 117Q123 118 125 116"
            stroke={skinD}
            strokeWidth={1.8}
            strokeLinecap="round"
            fill="none"
            opacity={0.7}
          />
          {[98, 142].map((x) => (
            <ellipse
              key={x}
              cx={x}
              cy={116}
              rx={7}
              ry={4}
              fill="#E07A6A"
              opacity={0.16}
            />
          ))}
          <path
            d={`M110 126Q120 ${126 + open} 130 126Q120 ${127 + open * 1.7} 110 126Z`}
            fill="#6B2C25"
            stroke="#7D3F36"
            strokeWidth={1.6}
            strokeLinejoin="round"
          />
          {look.glasses ? (
            <path
              d="M96 99a5 5 0 0 1 5-5h10a5 5 0 0 1 5 5v4a5 5 0 0 1-5 5h-10a5 5 0 0 1-5-5zM124 99a5 5 0 0 1 5-5h10a5 5 0 0 1 5 5v4a5 5 0 0 1-5 5h-10a5 5 0 0 1-5-5zM116 99.5h8"
              stroke="#1B1A19"
              strokeWidth={2}
              fill="rgba(255,255,255,0.06)"
            />
          ) : null}
          {look.headset ? (
            <>
              <path
                d="M84 100C82 46 158 46 156 100"
                stroke="#1B1D22"
                strokeWidth={5}
                fill="none"
              />
              <rect
                x={77}
                y={92}
                width={14}
                height={26}
                rx={6}
                fill="#24272D"
              />
              <rect
                x={149}
                y={92}
                width={14}
                height={26}
                rx={6}
                fill="#24272D"
              />
              <path
                d="M84 116Q90 134 108 135"
                stroke="#24272D"
                strokeWidth={3}
                strokeLinecap="round"
                fill="none"
              />
            </>
          ) : null}
        </g>
      </g>
    </svg>
  );
}

function ScreenMock({ frame, accent }: { frame: number; accent: string }) {
  const clipId = `vc-c${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const draw = 0.62 + 0.38 * MOVE(clamp(frame / 26));
  const daily = [900, 1120, 1040, 1480, 1390, 1880, 2380, 2290];
  const days = ["Oct 14", "15", "16", "17", "18", "19", "20", "21"];
  const LX = 44;
  const cw = 664;
  const ch = 290;
  const xy = (v: number, i: number) =>
    [LX + (i / (daily.length - 1)) * cw, ch - (v / 2400) * ch] as const;
  const path = daily
    .map((v, i) => `${i ? "L" : "M"}${xy(v, i).join(" ")}`)
    .join(" ");
  const tip = daily.length - 1 - (1 - draw) * (daily.length - 1);
  const tipI = Math.min(daily.length - 2, Math.floor(tip));
  const [ax, ay] = xy(daily[tipI], tipI);
  const [bx, by] = xy(daily[tipI + 1], tipI + 1);
  const tipX = ax + (bx - ax) * (tip - tipI);
  const tipY = ay + (by - ay) * (tip - tipI);
  const kpis = [
    ["Installs", 12480, "+18.2%"],
    ["Stars", 8431, "+1.2k"],
    ["Renders", 52930, "+31%"],
    ["Templates", 24, "+6"],
  ] as const;
  const top = [
    ["zoom-blur", 0.92],
    ["logo-wall", 0.74],
    ["typewriter", 0.61],
    ["bento-build", 0.48],
    ["url-bar-cta", 0.37],
  ] as const;
  return (
    <div
      style={{
        width: 1280,
        height: 800,
        background: "#FFFFFF",
        color: "#0A0A0A",
        fontFamily,
      }}
    >
      <div
        style={{
          height: 60,
          borderBottom: "1px solid #EBEBEB",
          display: "flex",
          alignItems: "center",
          padding: "0 32px",
          gap: 28,
          fontSize: 15,
          color: "#666",
        }}
      >
        <span
          style={{
            fontSize: 21,
            fontWeight: 400,
            color: "#0A0A0A",
            letterSpacing: -0.6,
          }}
        >
          remocn
        </span>
        {["Overview", "Components", "Templates", "Analytics"].map((n, i) => (
          <span
            key={n}
            style={{
              color: i === 0 ? "#0A0A0A" : "#666",
              fontWeight: 400,
            }}
          >
            {n}
          </span>
        ))}
        <div
          style={{
            marginLeft: "auto",
            width: 260,
            height: 36,
            borderRadius: 8,
            border: "1px solid #E5E5E5",
            background: "#FAFAFA",
            display: "flex",
            alignItems: "center",
            padding: "0 12px",
            color: "#999",
          }}
        >
          Search components…
        </div>
      </div>
      <div style={{ padding: "30px 32px" }}>
        <div style={{ fontSize: 34, fontWeight: 300, letterSpacing: -1 }}>
          Launch week
        </div>
        <div style={{ fontSize: 15, color: "#777", marginTop: 4 }}>
          Oct 14 – Oct 21 · all channels
        </div>
        <div style={{ display: "flex", gap: 16, marginTop: 24 }}>
          {kpis.map(([label, value, delta]) => (
            <div
              key={label}
              style={{
                flex: 1,
                border: "1px solid #EBEBEB",
                borderRadius: 12,
                padding: "16px 18px",
                boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
              }}
            >
              <div style={{ fontSize: 14, color: "#777" }}>{label}</div>
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: 10,
                  marginTop: 6,
                }}
              >
                <span
                  style={{
                    fontSize: 30,
                    fontWeight: 400,
                    letterSpacing: -0.8,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {Math.round(value * (0.9 + 0.1 * draw)).toLocaleString(
                    "en-US",
                  )}
                </span>
                <span
                  style={{ fontSize: 14, color: "#1A7F45", fontWeight: 400 }}
                >
                  {delta}
                </span>
              </div>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 16, marginTop: 16 }}>
          <div
            style={{
              width: 760,
              border: "1px solid #EBEBEB",
              borderRadius: 12,
              padding: "18px 24px",
            }}
          >
            <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
              <span style={{ fontSize: 16, fontWeight: 400 }}>
                Daily installs
              </span>
              <span style={{ fontSize: 13, color: "#888" }}>
                Peak 2,380 on Oct 20
              </span>
            </div>
            <svg
              width={LX + cw}
              height={ch + 24}
              style={{ marginTop: 16, overflow: "visible", fontFamily }}
            >
              <defs>
                <clipPath id={clipId}>
                  <rect x={0} y={-20} width={tipX} height={ch + 40} />
                </clipPath>
              </defs>
              {[2400, 1600, 800, 0].map((v, g) => (
                <g key={v}>
                  <line
                    x1={LX}
                    x2={LX + cw}
                    y1={(ch / 3) * g}
                    y2={(ch / 3) * g}
                    stroke={v ? "#F0F0F0" : "#E2E2E2"}
                  />
                  <text
                    x={LX - 10}
                    y={(ch / 3) * g + 4}
                    textAnchor="end"
                    fontSize={12}
                    fill="#999"
                  >
                    {v ? `${v / 1000}k` : "0"}
                  </text>
                </g>
              ))}
              {days.map((d, i) => (
                <text
                  key={d}
                  x={xy(0, i)[0]}
                  y={ch + 20}
                  textAnchor={i ? "middle" : "start"}
                  fontSize={12}
                  fill="#999"
                >
                  {d}
                </text>
              ))}
              <g clipPath={`url(#${clipId})`}>
                <path
                  d={`${path} L${LX + cw} ${ch} L${LX} ${ch} Z`}
                  fill={withAlpha(accent, 0.12)}
                />
                <path
                  d={path}
                  fill="none"
                  stroke={accent}
                  strokeWidth={3}
                  strokeLinejoin="round"
                />
              </g>
              <circle
                cx={tipX}
                cy={tipY}
                r={5}
                fill="#FFFFFF"
                stroke={accent}
                strokeWidth={3}
              />
            </svg>
          </div>
          <div
            style={{
              flex: 1,
              border: "1px solid #EBEBEB",
              borderRadius: 12,
              padding: "18px 22px",
            }}
          >
            <div style={{ fontSize: 16, fontWeight: 400, marginBottom: 14 }}>
              Top components
            </div>
            {top.map(([name, v], i) => (
              <div key={name} style={{ marginBottom: 14 }}>
                <div
                  style={{
                    fontSize: 14,
                    display: "flex",
                    justifyContent: "space-between",
                    color: "#333",
                  }}
                >
                  <span>{name}</span>
                  <span style={{ color: "#888" }}>
                    {Math.round(v * 4200 * (0.85 + 0.15 * draw)).toLocaleString(
                      "en-US",
                    )}
                  </span>
                </div>
                <div
                  style={{
                    height: 6,
                    borderRadius: 3,
                    background: "#F2F2F2",
                    marginTop: 6,
                  }}
                >
                  <div
                    style={{
                      height: 6,
                      borderRadius: 3,
                      width: `${v * 100 * clamp(draw * 1.4 - i * 0.08)}%`,
                      background: i === 0 ? accent : withAlpha(accent, 0.45),
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function AudioBadge({
  level,
  muted,
  frame,
  seed,
  accent,
  size,
}: {
  level: number;
  muted?: boolean;
  frame: number;
  seed: number;
  accent: string;
  size: number;
}) {
  const bars = [0, 1, 2].map((k) => {
    const v =
      wave(frame + seed * 7, k) * (0.55 + 0.45 * wave(frame * 0.6, k + 3));
    return 0.2 + level * v * 0.8;
  });
  const showMute = muted && level < 0.05;
  if (!showMute && level < 0.02) return null;
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: showMute ? "rgba(14,14,18,0.5)" : accent,
        backdropFilter: showMute ? "blur(8px)" : undefined,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: size * 0.1,
        opacity: showMute ? 1 : clamp(level * 2),
      }}
    >
      {showMute ? (
        <Icon name="micOff" size={size * 0.56} color="#FFFFFF" />
      ) : (
        bars.map((b, k) => (
          <div
            key={k}
            style={{
              width: size * 0.12,
              height: size * 0.52 * b,
              minHeight: size * 0.12,
              borderRadius: size,
              background: "#FFFFFF",
            }}
          />
        ))
      )}
    </div>
  );
}

function Tile({
  p,
  seed,
  r,
  level,
  appear,
  frame,
  accent,
}: {
  p: CallParticipant;
  seed: number;
  r: Rect;
  level: number;
  appear: number;
  frame: number;
  accent: string;
}) {
  const room = ROOMS[seed % ROOMS.length];
  const blur = Math.max(5, r.h * 0.05);
  const small = r.h < 150;
  const radius = small ? 14 : 18;
  const avatar = clamp(Math.min(r.w, r.h) * 0.34, 40, 128);
  const pulse = level * (0.55 + 0.45 * wave(frame, seed));
  const blob = (
    x: number,
    y: number,
    bw: number,
    bh: number,
    bg: string,
    k: number,
    br: string | number = "50%",
  ): React.CSSProperties => ({
    position: "absolute",
    left: `${x * 100}%`,
    top: `${y * 100}%`,
    width: bw,
    height: bh,
    borderRadius: br,
    background: bg,
    filter: `blur(${blur * k}px)`,
  });
  return (
    <div
      style={{
        position: "absolute",
        left: r.x,
        top: r.y,
        width: r.w,
        height: r.h,
        borderRadius: radius,
        overflow: "hidden",
        opacity: clamp(appear * 1.4),
        transform: `translateY(${(1 - appear) * 18}px) scale(${0.94 + 0.06 * appear})`,
        boxShadow: "0 24px 50px -24px rgba(0,0,0,0.7)",
        background: p.camera
          ? `linear-gradient(170deg, ${mix(p.color, "#ECE7DF", 0.74)} 0%, ${mix(p.color, "#5E5750", 0.72)} 100%)`
          : `linear-gradient(170deg, ${mix(p.color, "#191A20", 0.8)} 0%, #15161B 100%)`,
      }}
    >
      {p.camera ? (
        <>
          <div
            style={blob(
              room.win[0],
              room.win[1],
              r.w * room.win[2],
              r.h * room.win[3],
              "rgba(255,255,255,0.5)",
              1,
              r.h * 0.04,
            )}
          />
          <div
            style={{
              ...blob(
                room.lamp[0],
                room.lamp[1],
                r.h * 0.3,
                r.h * 0.3,
                "rgba(255,214,160,0.5)",
                1.4,
              ),
              marginLeft: -r.h * 0.15,
            }}
          />
          <div
            style={{
              ...blob(
                room.plant[0],
                room.plant[1],
                r.h * 0.22,
                r.h * 0.5,
                "rgba(28,58,38,0.5)",
                1,
                "45% 45% 20% 20%",
              ),
              marginLeft: -r.h * 0.11,
            }}
          />
          <Person
            w={r.w}
            h={r.h}
            color={p.color}
            seed={seed}
            frame={frame}
            level={level}
          />
        </>
      ) : (
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "46%",
            width: avatar,
            height: avatar,
            transform: "translate(-50%, -50%)",
            borderRadius: "50%",
            background: mix(p.color, "#191A20", 0.35),
            boxShadow: `0 0 0 ${pulse * avatar * 0.08}px ${withAlpha(p.color, 0.35)}, inset 0 1px 0 rgba(255,255,255,0.12)`,
            color: "#FFFFFF",
            fontSize: avatar * 0.4,
            fontWeight: 300,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {initials(p.name).slice(0, 1)}
        </div>
      )}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: small ? 48 : 64,
          background:
            "linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.12) 40%, rgba(0,0,0,0.42) 100%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          right: small ? 8 : 12,
          top: small ? 8 : 12,
        }}
      >
        <AudioBadge
          level={level}
          muted={p.muted}
          frame={frame}
          seed={seed}
          accent={accent}
          size={small ? 26 : 30}
        />
      </div>
      <div
        style={{
          position: "absolute",
          left: small ? 10 : 14,
          bottom: small ? 8 : 12,
          right: 12,
          color: "#FFFFFF",
          fontSize: 16,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {p.name}
      </div>
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: radius,
          boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.1)",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: radius,
          boxShadow: `inset 0 0 0 2.5px ${accent}`,
          opacity: clamp(level * 1.6),
        }}
      />
    </div>
  );
}

const TRAY: { icon: string; color: string }[] = [
  { icon: "heart", color: "#E0566F" },
  { icon: "thumb", color: "#4D74F0" },
  { icon: "star", color: "#E3A13A" },
  { icon: "hand", color: "#E3A13A" },
  { icon: "check", color: "#3FA877" },
];
const FLOATS = [
  { at: 0, k: 2, who: 2, x: 0.04 },
  { at: 7, k: 1, who: 4, x: 0.3 },
  { at: 12, k: 0, who: 0, x: 0.56 },
  { at: 20, k: 2, who: 3, x: 0.16 },
  { at: 27, k: 1, who: 5, x: 0.44 },
  { at: 33, k: 3, who: 0, x: 0.02 },
  { at: 40, k: 4, who: 2, x: 0.62 },
  { at: 48, k: 2, who: 4, x: 0.24 },
  { at: 56, k: 0, who: 3, x: 0.5 },
];

function FloatingReaction({
  local,
  k,
  name,
  x,
  bottom,
  rise,
  seed,
  fps,
}: {
  local: number;
  k: number;
  name: string;
  x: number;
  bottom: number;
  rise: number;
  seed: number;
  fps: number;
}) {
  if (local < 0 || local > 84) return null;
  const t = ENTER_SOFT(clamp(local / 84));
  const pop = spring({ frame: local, fps, config: CHIP });
  const fade =
    interpolate(local, [0, 4], [0, 1], { extrapolateRight: "clamp" }) *
    (1 - interpolate(local, [64, 84], [0, 1], { ...CL, easing: EXIT }));
  const y = bottom - 30 - t * rise;
  const sway = Math.sin(local * 0.11 + seed * 1.7) * 14 * t;
  const r = TRAY[k % TRAY.length];
  return (
    <div
      style={{
        position: "absolute",
        left: x + sway,
        top: y,
        opacity: fade,
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "5px 12px 5px 5px",
        borderRadius: 999,
        background: "rgba(16,16,22,0.62)",
        backdropFilter: "blur(12px)",
        boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.1)",
        transform: `scale(${0.6 + 0.4 * pop})`,
        transformOrigin: "20px 50%",
      }}
    >
      <div
        style={{
          width: 34,
          height: 34,
          borderRadius: 17,
          background: r.color,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon name={r.icon} size={18} color="#FFFFFF" />
      </div>
      <span style={{ color: INK, fontSize: 16, whiteSpace: "nowrap" }}>
        {name}
      </span>
    </div>
  );
}

export function VideoCall({
  participants = DEFAULT_PARTICIPANTS,
  meetingCode = "kqv-mnrt-zpa",
  time = "10:42 AM",
  presenter = 1,
  present = true,
  src,
  children,
  accent = "#3B5BFD",
  speed = 1,
  ground,
  groundParams,
}: VideoCallProps) {
  const frame = useCurrentFrame() * speed;
  const { width, height, fps, durationInFrames } = useVideoConfig();
  const tall = height > width * 1.2;
  const u = tall ? width / 640 : Math.min(width / 1280, height / 720);
  const dw = width / u;
  const dh = height / u;
  const people = participants.slice(0, 6);
  const n = people.length;
  const pi = clamp(presenter, 0, n - 1);

  const area: Rect = tall
    ? { x: 32, y: 104, w: 576, h: 840 }
    : { x: 140, y: 40, w: 1000, h: 560 };
  const S: Stage = {
    area,
    gap: 10,
    tall,
    stripCols: 3,
    stripTop: area.y + 420,
    main: tall
      ? { x: area.x, y: area.y, w: area.w, h: 410 }
      : { x: area.x, y: area.y, w: area.w - 190 - 10, h: area.h },
  };
  const ctrlY = tall ? area.y + area.h + 40 : area.y + area.h + 28;

  const reflow = JOINS.slice(0, n).map((at) =>
    spring({ frame: frame - at, fps, config: CARD }),
  );
  const appear = JOINS.slice(0, n).map((at) =>
    spring({ frame: frame - at - 4, fps, config: CARD }),
  );
  const pres = people.map((_, i) =>
    present
      ? interpolate(frame, [PRESENT_AT + i, PRESENT_AT + i + 10], [0, 1], {
          ...CL,
          easing: MOVE,
        })
      : 0,
  );
  const vis = pres.map((t) => (t < 0.5 ? 1 - t * 2 : t * 2 - 1));
  const rects = people.map((_, i) => {
    let r = gridRect(S, Math.max(1, i + 1), i);
    for (let k = 2; k <= n; k++) {
      r = addDelta(
        r,
        gridRect(S, Math.max(k - 1, i + 1), i),
        gridRect(S, Math.max(k, i + 1), i),
        reflow[k - 1],
      );
    }
    return pres[i] < 0.5 ? r : stripRect(S, n, i);
  });

  const sched = [
    { at: 30, i: 1 },
    { at: 66, i: 0 },
    { at: 100, i: 3 },
    { at: 126, i: 4 },
    { at: PRESENT_AT + 6, i: pi },
  ].filter((s) => s.i < n);
  const levels = people.map((_, i) =>
    sched.reduce((acc, s, k) => {
      if (s.i !== i) return acc;
      const end = sched[k + 1]?.at ?? 1e6;
      return Math.max(
        acc,
        interpolate(frame, [s.at, s.at + 5, end - 4, end], [0, 1, 1, 0], CL),
      );
    }, 0),
  );
  const screenIn = present
    ? spring({ frame: frame - PRESENT_AT - 3, fps, config: HEAVY })
    : 0;
  const trayIn = spring({ frame: frame - TRAY_AT, fps, config: CHIP });
  const trayOut = interpolate(frame, [TRAY_AT + 52, TRAY_AT + 60], [0, 1], {
    ...CL,
    easing: EXIT,
  });
  const joined = JOINS.slice(0, n).filter((at) => frame >= at + 6).length;
  const lastJoin = Math.max(
    ...JOINS.slice(0, n).filter((at) => frame >= at + 6),
  );
  const badgePop = spring({ frame: frame - lastJoin - 6, fps, config: CHIP });
  const ui = spring({ frame: frame - 6, fps, config: HEAVY });
  const push = interpolate(frame, [0, durationInFrames], [1, 1.03], CL);

  const M = S.main;
  const fit = Math.min((M.w - 32) / 1280, (M.h - 64) / 800);
  const screenW = 1280 * fit;
  const screenH = 800 * fit;

  const buttons = ["mic", "cam", "present", "react", "hand", "more"];
  const btnSize = 50;
  const barW = buttons.length * btnSize + (buttons.length - 1) * 10 + 10 + 104;
  const reactX =
    dw / 2 - barW / 2 + buttons.indexOf("react") * (btnSize + 10) + 25;
  const trayW = TRAY.length * 44 + (TRAY.length - 1) * 6 + 16;
  const floatBottom = tall ? area.y + area.h : area.y + area.h;
  const floatLeft = area.x + 16;

  return (
    <AbsoluteFill
      style={{
        fontFamily,
        overflow: "hidden",
        WebkitFontSmoothing: "antialiased",
      }}
    >
      <GshGround
        preset={ground ?? "velvet-hour"}
        params={groundParams}
        timeOffset={6}
        timeScale={0.35}
      />
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(75% 85% at 50% 45%, rgba(4,5,12,0.42), rgba(4,5,12,0.1))",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: dw,
          height: dh,
          transform: `scale(${u})`,
          transformOrigin: "0 0",
          color: INK,
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            transform: `scale(${push})`,
            transformOrigin: "50% 45%",
          }}
        >
          {tall ? (
            <div
              style={{
                position: "absolute",
                left: area.x,
                top: 36,
                width: area.w,
                display: "flex",
                alignItems: "baseline",
                gap: 14,
                opacity: ui,
              }}
            >
              <span
                style={{
                  fontSize: 30,
                  fontWeight: 300,
                  letterSpacing: "-0.02em",
                }}
              >
                Launch sync
              </span>
              <span
                style={{
                  marginLeft: "auto",
                  fontSize: 18,
                  color: "rgba(241,241,244,0.6)",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {joined} in call
              </span>
            </div>
          ) : null}
          {present && screenIn > 0.001 ? (
            <div
              style={{
                position: "absolute",
                left: M.x,
                top: M.y,
                width: M.w,
                height: M.h,
                borderRadius: 18,
                background: "rgba(14,15,20,0.78)",
                backdropFilter: "blur(20px)",
                boxShadow:
                  "inset 0 0 0 1px rgba(255,255,255,0.09), 0 30px 70px -30px rgba(0,0,0,0.8)",
                overflow: "hidden",
                opacity: clamp(screenIn * 1.6),
                transform: `translateY(${(1 - screenIn) * 24}px) scale(${0.97 + 0.03 * screenIn})`,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  left: (M.w - screenW) / 2,
                  top: 16,
                  width: screenW,
                  height: screenH,
                  borderRadius: 8,
                  overflow: "hidden",
                  boxShadow: "0 0 0 1px rgba(255,255,255,0.08)",
                }}
              >
                {children ? (
                  children
                ) : src ? (
                  <Img
                    src={src}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  <div
                    style={{
                      transform: `scale(${fit})`,
                      transformOrigin: "0 0",
                    }}
                  >
                    <ScreenMock
                      frame={frame - PRESENT_AT - 8}
                      accent={accent}
                    />
                  </div>
                )}
              </div>
              <div
                style={{
                  position: "absolute",
                  left: 18,
                  bottom: 14,
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  color: INK,
                  fontSize: 16,
                }}
              >
                <Icon name="present" size={20} color={INK} />
                {people[pi]?.name} is presenting
              </div>
            </div>
          ) : null}

          {people.map((p, i) => (
            <Tile
              key={p.name}
              p={p}
              seed={i}
              r={rects[i]}
              level={levels[i]}
              appear={appear[i] * vis[i]}
              frame={frame}
              accent={accent}
            />
          ))}

          {FLOATS.map((r, k) => (
            <FloatingReaction
              key={`${r.at}-${r.who}`}
              local={frame - TRAY_AT - 6 - r.at}
              k={r.k}
              name={people[r.who % n]?.name.split(" ")[0] ?? ""}
              x={floatLeft + r.x * (tall ? area.w : M.w)}
              bottom={floatBottom}
              rise={(tall ? 520 : 400) * (0.82 + 0.12 * (k % 3))}
              seed={k}
              fps={fps}
            />
          ))}
          <div
            style={{
              position: "absolute",
              left: reactX,
              top: ctrlY - 70,
              transform: `translateX(-50%) translateY(${(1 - trayIn) * 16}px) scale(${0.85 + 0.15 * trayIn})`,
              transformOrigin: "50% 100%",
              opacity: clamp(trayIn * 1.5) * (1 - trayOut),
              display: "flex",
              gap: 6,
              width: trayW,
              boxSizing: "border-box",
              padding: 8,
              borderRadius: 999,
              background: "rgba(18,18,24,0.72)",
              backdropFilter: "blur(16px)",
              boxShadow:
                "inset 0 0 0 1px rgba(255,255,255,0.1), 0 16px 40px -16px rgba(0,0,0,0.7)",
            }}
          >
            {TRAY.map((t, k) => {
              const sent = FLOATS.find(
                (f) => f.who === 0 && f.k === k && frame >= TRAY_AT + 6 + f.at,
              );
              const b = sent
                ? spring({
                    frame: frame - (TRAY_AT + 6 + sent.at),
                    fps,
                    config: CHIP,
                  })
                : 1;
              return (
                <div
                  key={t.icon}
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    background: withAlpha(t.color, 0.18),
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transform: `scale(${(sent ? 1.2 - 0.2 * b : 1) * interpolate(trayIn, [0, 1], [0.8 + k * 0.03, 1])})`,
                  }}
                >
                  <Icon
                    name={t.icon}
                    size={22}
                    color={mix(t.color, "#FFFFFF", 0.35)}
                  />
                </div>
              );
            })}
          </div>

          {!tall ? (
            <div
              style={{
                position: "absolute",
                left: area.x,
                top: ctrlY,
                height: btnSize,
                display: "flex",
                alignItems: "center",
                gap: 12,
                fontSize: 17,
                fontVariantNumeric: "tabular-nums",
                opacity: ui,
              }}
            >
              <span>{time}</span>
              <span style={{ color: "rgba(241,241,244,0.35)" }}>·</span>
              <span style={{ color: "rgba(241,241,244,0.6)" }}>
                {meetingCode}
              </span>
            </div>
          ) : (
            <div
              style={{
                position: "absolute",
                left: 0,
                width: dw,
                top: ctrlY + btnSize + 22,
                textAlign: "center",
                fontSize: 18,
                color: "rgba(241,241,244,0.6)",
                fontVariantNumeric: "tabular-nums",
                opacity: ui,
              }}
            >
              {time} · {meetingCode}
            </div>
          )}
          <div
            style={{
              position: "absolute",
              left: dw / 2 - barW / 2,
              top: ctrlY,
              display: "flex",
              gap: 10,
              opacity: ui,
              transform: `translateY(${(1 - ui) * 24}px)`,
            }}
          >
            {buttons.map((b) => {
              const on = b === "react" ? clamp(trayIn) * (1 - trayOut) : 0;
              return (
                <div
                  key={b}
                  style={{
                    width: btnSize,
                    height: btnSize,
                    borderRadius: 999,
                    background:
                      on > 0.01
                        ? mix("#2A2B33", "#F1F1F4", on)
                        : "rgba(255,255,255,0.1)",
                    backdropFilter: "blur(12px)",
                    boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.1)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Icon name={b} color={on > 0.5 ? "#15161B" : INK} />
                </div>
              );
            })}
            <div
              style={{
                marginLeft: 10,
                width: 104,
                height: btnSize,
                borderRadius: 999,
                background: "#D9443A",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 17,
                color: "#FFFFFF",
              }}
            >
              Leave
            </div>
          </div>
          {!tall ? (
            <div
              style={{
                position: "absolute",
                left: area.x + area.w - 140,
                width: 140,
                top: ctrlY,
                height: btnSize,
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                gap: 22,
                opacity: ui,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 17,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                <Icon name="people" />
                <span
                  style={{
                    display: "inline-block",
                    transform: `scale(${0.8 + 0.2 * badgePop})`,
                  }}
                >
                  {joined}
                </span>
              </div>
              <Icon name="chat" />
            </div>
          ) : null}
        </div>
      </div>
    </AbsoluteFill>
  );
}
