"use client";

import { loadFont } from "@remotion/google-fonts/HankenGrotesk";
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

export interface CardCreateProps {
  /** Engraved on the new card. */
  holder?: string;
  last4?: string;
  /** Swatches; the card prints in colors[0] and gets tapped through colors[1..3]. */
  colors?: string[];
  finishes?: string[];
  accent?: string;
  speed?: number;
  theme?: "light" | "dark";
  /** Five lines beside the phone, one per beat. */
  lines?: [string, string, string, string, string];
  ground?: GshPresetId;
  groundParams?: Partial<GradientParams>;
}

const SW = 390;
const SH = 844;
const BEZEL = 12;
const BW = SW + BEZEL * 2;
const BH = SH + BEZEL * 2;

const CW = 330;
const CHT = Math.round(CW / 1.586);
const CX = (SW - CW) / 2;
const SLOT_Y = 170;
const CARD_Y = 188;
const SWATCH_Y = 424;
const TOOLS_Y = 484;
const TAP_NEW = 62;
const OUT = 64;
const SLOT = 72;
const PRINT = 84;
const SWATCH_TAPS = [136, 150, 164];
const NAME_TAB = 182;
const ENGRAVE = 188;
const DETAILS_TAB = 222;
const FLIP = 226;
const REVEAL_TAP = 256;
const SCRAMBLE = 258;
const ADD_TAP = 302;
const WALLET = 306;

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const MOVE = Easing.bezier(0.65, 0, 0.35, 1);
const ENTER = Easing.bezier(0.32, 0.72, 0, 1);
const EXIT = Easing.bezier(0.55, 0, 1, 0.45);
const HEAVY = { mass: 1, damping: 26, stiffness: 120 };
const CARD = { mass: 0.8, damping: 18, stiffness: 160 };
const CHIP = { mass: 0.5, damping: 12, stiffness: 200 };

const DARK = {
  copy: "#f4f4f6",
  copyMuted: "rgba(244,244,246,0.52)",
  scrim: "rgba(2,3,8,0.3)",
  frame:
    "linear-gradient(155deg,#55565c 0%,#2a2b2f 30%,#3d3e43 62%,#1f2023 100%)",
  phoneShadow:
    "0 50px 100px -20px rgba(0,0,0,0.7), 0 18px 36px -12px rgba(0,0,0,0.5)",
  screen: "#000000",
  text: "#ffffff",
  muted: "#8d8d93",
  chip: "#1c1c1e",
  pill: "#ffffff",
  pillText: "#000000",
  touch: "rgba(255,255,255,0.18)",
};
const LIGHT: typeof DARK = {
  copy: "#141518",
  copyMuted: "rgba(20,21,24,0.5)",
  scrim: "rgba(243,241,237,0.28)",
  frame:
    "linear-gradient(155deg,#f1f1f3 0%,#c4c4ca 30%,#e2e2e6 62%,#b3b3ba 100%)",
  phoneShadow:
    "0 50px 90px -24px rgba(30,32,44,0.32), 0 14px 30px -10px rgba(30,32,44,0.18)",
  screen: "#f6f6f8",
  text: "#111114",
  muted: "#74747a",
  chip: "#e8e8ec",
  pill: "#111114",
  pillText: "#ffffff",
  touch: "rgba(20,20,30,0.2)",
};
type Palette = typeof DARK;

const STACK = [
  { color: "#2a2b30", label: "Metal", last4: "7702" },
  { color: "#b9b4ab", label: "Stone", last4: "3158" },
  { color: "", label: "Standard", last4: "0446" },
];

function hash(n: number) {
  const x = Math.sin(n * 91.7 + 47.3) * 43758.5453;
  return x - Math.floor(x);
}

function inkOn(hex: string) {
  const h = hex.replace("#", "");
  const n = Number.parseInt(
    h.length === 3
      ? h
          .split("")
          .map((x) => x + x)
          .join("")
      : h.slice(0, 6),
    16,
  );
  const lum =
    (0.2126 * ((n >> 16) & 255) +
      0.7152 * ((n >> 8) & 255) +
      0.0722 * (n & 255)) /
    255;
  return lum > 0.62 ? "#15161a" : "#ffffff";
}
const GRAIN = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='g'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.5 0 0 0 0 0.5 0 0 0 0 0.5 0 0 0 0.55 0'/></filter><rect width='160' height='160' filter='url(%23g)'/></svg>")`;
const gloss = (color: string) =>
  `${GRAIN}, linear-gradient(140deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.03) 38%, rgba(0,0,0,0) 60%, rgba(0,0,0,0.14) 100%), ${color}`;
const cardEdge = (color: string) =>
  inkOn(color) === "#ffffff"
    ? "inset 0 1px 0 rgba(255,255,255,0.16), inset 0 0 0 1px rgba(255,255,255,0.07)"
    : "inset 0 1px 0 rgba(255,255,255,0.45), inset 0 0 0 1px rgba(0,0,0,0.08)";

function Chip() {
  const id = `chip${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  return (
    <svg width={42} height={32} viewBox="0 0 42 32">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f3dca0" />
          <stop offset="0.5" stopColor="#c9a65a" />
          <stop offset="1" stopColor="#ecd394" />
        </linearGradient>
      </defs>
      <rect width={42} height={32} rx={6} fill={`url(#${id})`} />
      <path
        d="M0 11h13M0 21h13M29 11h13M29 21h13M13 0v32M29 0v32M13 16h16"
        stroke="rgba(90,60,10,0.45)"
        strokeWidth={1}
        fill="none"
      />
    </svg>
  );
}

function Contactless({ color }: { color: string }) {
  return (
    <svg width={20} height={24} viewBox="0 0 20 24" fill="none">
      {[4, 8, 12, 16].map((x, i) => (
        <path
          key={x}
          d={`M${x} ${12 - 3 - i * 2.4}a${4 + i * 3} ${4 + i * 3} 0 010 ${6 + i * 4.8}`}
          stroke={color}
          strokeWidth={1.8}
          strokeLinecap="round"
        />
      ))}
    </svg>
  );
}

function CardFront({
  color,
  prev,
  wipe = 1,
  label,
  holder,
  shown,
  engraveAt,
  f,
  last4,
}: {
  color: string;
  prev?: string;
  wipe?: number;
  label: string;
  holder: string;
  shown: number;
  engraveAt?: (i: number) => number;
  f: number;
  last4: string;
}) {
  const ink = inkOn(color);
  const edge = wipe * 1.5 - 0.25;
  const letters = holder.toUpperCase().split("");
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        borderRadius: 16,
        overflow: "hidden",
        background: gloss(prev ?? color),
        backgroundBlendMode: "soft-light, normal, normal",
        boxShadow: cardEdge(color),
        color: ink,
      }}
    >
      {prev && wipe < 1 ? (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: gloss(color),
            backgroundBlendMode: "soft-light, normal, normal",
            clipPath: `polygon(0 0, ${edge * 100 + 20}% 0, ${edge * 100}% 100%, 0 100%)`,
          }}
        />
      ) : null}
      <div
        style={{
          position: "absolute",
          left: 22,
          top: 18,
          fontSize: 24,
          fontWeight: 400,
          letterSpacing: "-0.045em",
          color: inkOn(prev && wipe < 0.5 ? prev : color),
        }}
      >
        fernway
      </div>
      <div
        style={{
          position: "absolute",
          right: 18,
          top: 20,
          fontSize: 12,
          fontWeight: 400,
          opacity: 0.75,
          color: inkOn(prev && wipe < 0.5 ? prev : color),
        }}
      >
        {label}
      </div>
      <div style={{ position: "absolute", left: 22, top: 78 }}>
        <Chip />
      </div>
      <div style={{ position: "absolute", left: 74, top: 82, opacity: 0.8 }}>
        <Contactless color={ink} />
      </div>
      <div
        style={{
          position: "absolute",
          left: 22,
          bottom: 20,
          display: "flex",
          fontSize: 14,
          fontWeight: 400,
          letterSpacing: "0.12em",
          color: ink,
          textShadow:
            ink === "#ffffff"
              ? "0 -1px 0 rgba(0,0,0,0.35), 0 1px 0 rgba(255,255,255,0.25)"
              : "0 1px 0 rgba(255,255,255,0.5), 0 -1px 0 rgba(0,0,0,0.25)",
        }}
      >
        {letters.slice(0, shown).map((ch, i) => {
          const t = engraveAt ? f - engraveAt(i) : 99;
          const settle = interpolate(t, [0, 5], [0, 1], {
            ...clamp,
            easing: Easing.bezier(0.22, 1, 0.36, 1),
          });
          return (
            <span
              key={i}
              style={{
                position: "relative",
                display: "inline-block",
                whiteSpace: "pre",
                opacity: 0.2 + settle * 0.75,
                transform: `translateY(${(1 - settle) * 3}px)`,
                filter: `blur(${(1 - settle) * 1.5}px)`,
              }}
            >
              {ch}
            </span>
          );
        })}
      </div>
      <div
        style={{
          position: "absolute",
          right: 20,
          bottom: 16,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          color: ink,
        }}
      >
        <span style={{ fontSize: 11, fontWeight: 400, opacity: 0.7 }}>
          •• {last4}
        </span>
        <span
          style={{
            fontSize: 17,
            fontWeight: 400,
            fontStyle: "italic",
            letterSpacing: "-0.02em",
          }}
        >
          debit
        </span>
      </div>
    </div>
  );
}

function CardBack({
  color,
  number,
  exp,
  cvv,
}: {
  color: string;
  number: string;
  exp: string;
  cvv: string;
}) {
  const ink = inkOn(color);
  const label: React.CSSProperties = {
    fontSize: 11,
    fontWeight: 400,
    opacity: 0.65,
  };
  const val: React.CSSProperties = {
    fontSize: 17,
    fontWeight: 400,
    fontVariantNumeric: "tabular-nums",
    letterSpacing: "0.04em",
    marginTop: 3,
  };
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        borderRadius: 16,
        overflow: "hidden",
        background: `linear-gradient(rgba(0,0,0,0.1), rgba(0,0,0,0.1)), ${gloss(color)}`,
        backgroundBlendMode: "normal, soft-light, normal, normal",
        boxShadow: cardEdge(color),
        transform: "rotateY(180deg)",
        backfaceVisibility: "hidden",
        color: ink,
        padding: "22px 22px",
        boxSizing: "border-box",
      }}
    >
      <div style={label}>Card number</div>
      <div style={{ ...val, fontSize: 21 }}>{number}</div>
      <div style={{ display: "flex", gap: 40, marginTop: 22 }}>
        <div>
          <div style={label}>Expiry</div>
          <div style={val}>{exp}</div>
        </div>
        <div>
          <div style={label}>CVV</div>
          <div style={val}>{cvv}</div>
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          right: 16,
          top: 16,
          width: 34,
          height: 34,
          borderRadius: 17,
          background: "rgba(255,255,255,0.18)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg width={18} height={18} viewBox="0 0 24 24" fill="none">
          <path
            d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12zM12 9a3 3 0 110 6 3 3 0 010-6z"
            stroke={ink}
            strokeWidth={2}
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <div
        style={{
          position: "absolute",
          right: 20,
          bottom: 16,
          fontSize: 16,
          fontWeight: 400,
          letterSpacing: "-0.045em",
          opacity: 0.85,
        }}
      >
        fernway
      </div>
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
        padding: "4px 30px 0 52px",
        zIndex: 30,
      }}
    >
      <span
        style={{ fontSize: 17, fontWeight: 400, color, letterSpacing: -0.3 }}
      >
        9:41
      </span>
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

function Phone({ children, c }: { children: React.ReactNode; c: Palette }) {
  const screen = c.screen;
  const home = c.text;
  const side = (s: "left" | "right", top: number, h: number) => (
    <div
      style={{
        position: "absolute",
        [s]: -2.5,
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
      {side("left", 168, 30)}
      {side("left", 226, 60)}
      {side("left", 298, 60)}
      {side("right", 258, 96)}
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: 67,
          background: c.frame,
          boxShadow: `${c.phoneShadow}, inset 0 0 0 1px rgba(255,255,255,0.22)`,
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

export function CardCreate({
  holder = "Maya Chen",
  last4 = "4821",
  colors = ["#232428", "#c4673f", "#8fa68a", "#d9bf86", "#3d5677", "#ebe8e1"],
  finishes = ["Graphite", "Terracotta", "Sage", "Sand", "Harbour", "Bone"],
  accent = "#3B5BFD",
  speed = 1,
  theme = "dark",
  lines = [
    "Spin up a new card.",
    "Pick a finish.",
    "Put your name on it.",
    "Only you see the number.",
    "Ready to spend.",
  ],
  ground,
  groundParams,
}: CardCreateProps) {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const f = frame * speed;
  const dark = theme !== "light";
  const c: Palette = dark ? DARK : LIGHT;
  const tall = height > width;
  const W = tall ? 720 : 1280;
  const H = tall ? 1280 : 720;
  const u = Math.min(width / W, height / H);
  const k = tall ? (H * 0.72) / BH : (H * 0.94) / BH;
  const phoneCx = tall ? W / 2 : W * 0.68;
  const phoneCy = tall ? H - 30 - (BH * k) / 2 : H / 2;

  const sp = (at: number, config: Partial<typeof CARD> = CARD) =>
    spring({ frame: f - at, fps, config });
  const bump = (at: number) =>
    Math.max(0, Math.min(1, sp(at - 1, CHIP) - sp(at + 5, CHIP)));
  const enter = (v: number, dy = 14): React.CSSProperties => ({
    opacity: Math.min(1, v * 1.4),
    transform: `translateY(${(1 - v) * dy}px)`,
  });

  const palette =
    colors.length >= 4
      ? colors
      : [...colors, ...STACK.map((s) => s.color || accent)];
  const swatches = palette.slice(0, 6);
  const swatchX = (i: number) => SW / 2 + (i - (swatches.length - 1) / 2) * 50;
  const taps = SWATCH_TAPS.map((t, i) => ({
    t,
    idx: Math.min(i + 1, swatches.length - 1),
  }));
  let colorIdx = 0;
  let prevIdx = 0;
  let wipe = 1;
  for (const tp of taps) {
    if (f >= tp.t + 1) {
      prevIdx = colorIdx;
      colorIdx = tp.idx;
      wipe = interpolate(f, [tp.t + 1, tp.t + 13], [0, 1], {
        ...clamp,
        easing: Easing.bezier(0.65, 0, 0.35, 1),
      });
    }
  }
  const lastTap = taps.filter((tp) => f >= tp.t + 1).pop();
  const ring = sp(lastTap ? lastTap.t : -99, CHIP);
  const letters = holder.toUpperCase().split("");
  const engraveAt = (i: number) => ENGRAVE + i * 2.4;
  const shown = letters.filter((_, i) => f >= engraveAt(i)).length;
  const flipA = sp(FLIP, HEAVY);
  const wal = sp(WALLET, HEAVY);
  const angle = flipA * 180 + wal * 180;
  const lift = Math.sin(Math.min(1, flipA) * Math.PI) * 0.06;
  const digits = `5274 8820 1934 ${last4}`;
  const scr = (s: string, offset: number) =>
    s
      .split("")
      .map((ch, j) => {
        if (ch === " " || ch === "/" || offset + j >= 15) return ch;
        const settle = SCRAMBLE + (offset + j) * 0.9;
        if (f < SCRAMBLE) return "•";
        if (f >= settle + 4) return ch;
        return String(
          Math.floor(hash(j * 13 + offset + Math.floor(f / 2)) * 10),
        );
      })
      .join("");
  const number = f < SCRAMBLE ? `•••• •••• •••• ${last4}` : scr(digits, 0);
  const exp = scr("09/29", 19);
  const cvv = scr("417", 25);
  const stackIn = STACK.map((_, i) => sp(8 + i * 6, CARD));
  const out = sp(OUT, HEAVY);
  const back = sp(WALLET + 6, CARD);
  const slot = sp(SLOT, CARD);
  const slotGone = interpolate(f, [PRINT + 34, PRINT + 44], [1, 0], clamp);
  const print = interpolate(f, [PRINT, PRINT + 30], [0, 1], {
    ...clamp,
    easing: ENTER,
  });
  const sweep = interpolate(f, [PRINT + 18, PRINT + 40], [-0.4, 1.4], {
    ...clamp,
    easing: MOVE,
  });
  const custIn = sp(SLOT + 6, CARD);
  const custOut = interpolate(f, [ADD_TAP + 1, ADD_TAP + 7], [1, 0], {
    ...clamp,
    easing: EXIT,
  });
  const tool = f >= DETAILS_TAB + 1 ? 2 : f >= NAME_TAB + 1 ? 1 : 0;
  const toast = sp(WALLET + 26, CHIP);
  const newY =
    f < WALLET
      ? CARD_Y - (1 - print) * (CHT + 18)
      : CARD_Y + wal * (190 + 3 * 52 - CARD_Y);
  const toolX = (i: number) => SW / 2 + (i - 1) * 112;
  const path = [
    { t: 44, x: 300, y: 700 },
    { t: TAP_NEW, x: SW / 2 - 64, y: 580 },
    ...taps.map((tp) => ({ t: tp.t, x: swatchX(tp.idx), y: SWATCH_Y + 18 })),
    { t: NAME_TAB, x: toolX(1), y: TOOLS_Y + 19 },
    { t: DETAILS_TAB, x: toolX(2), y: TOOLS_Y + 19 },
    { t: REVEAL_TAP, x: CX + CW - 33, y: CARD_Y + 33 },
    { t: ADD_TAP, x: SW / 2 + 30, y: SH - 69 },
  ];
  let touch = path[0];
  for (let i = 0; i < path.length - 1; i++) {
    const a = path[i];
    const b = path[i + 1];
    const s = a.t + 2;
    const e = Math.max(s + 1, b.t - 2);
    if (f >= s) {
      const p = MOVE(Math.min(1, (f - s) / (e - s)));
      const arc =
        Math.sin(Math.PI * p) *
        Math.min(40, Math.hypot(b.x - a.x, b.y - a.y) * 0.12);
      touch = {
        t: f,
        x: a.x + (b.x - a.x) * p,
        y: a.y + (b.y - a.y) * p - arc,
      };
    }
  }
  const touchOpacity = interpolate(
    f,
    [
      44,
      52,
      TAP_NEW + 6,
      TAP_NEW + 14,
      SWATCH_TAPS[0] - 16,
      SWATCH_TAPS[0] - 8,
      ADD_TAP + 5,
      ADD_TAP + 11,
    ],
    [0, 1, 1, 0, 0, 1, 1, 0],
    clamp,
  );
  const touchPress = Math.max(...path.slice(1).map((p) => bump(p.t)));
  const camS = interpolate(f, [0, 370], [1, 1.03], clamp);
  const rise = sp(0, HEAVY);

  const stackCard = (i: number, y: number, style: React.CSSProperties) => (
    <div
      key={STACK[i].label}
      style={{
        position: "absolute",
        left: CX,
        top: y,
        width: CW,
        height: CHT,
        borderRadius: 16,
        boxShadow: dark
          ? "0 -4px 14px rgba(0,0,0,0.4), 0 10px 28px rgba(0,0,0,0.35)"
          : "0 -2px 8px rgba(20,20,30,0.06), 0 8px 24px rgba(20,20,30,0.12)",
        ...style,
      }}
    >
      <CardFront
        color={STACK[i].color || accent}
        label={STACK[i].label}
        holder={holder}
        shown={99}
        f={f}
        last4={STACK[i].last4}
      />
    </div>
  );
  const walletPhase = f >= WALLET;
  const count = walletPhase ? 4 : 3;
  const titleA = walletPhase ? back : 1 - out;

  const beats = [0, SWATCH_TAPS[0] - 14, NAME_TAB - 2, DETAILS_TAB - 2, WALLET];
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
        preset={ground ?? (dark ? "charcoal-satin" : "paper-crease")}
        params={groundParams}
        timeOffset={dark ? 6 : 4}
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
            width: tall ? W - 112 : 480,
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
          {lines.map((_, i) => copyLine(i))}
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
            <StatusBar color={c.text} />
            <div
              style={{
                position: "absolute",
                left: 22,
                top: 96,
                color: c.text,
                opacity: titleA,
                transform: `translateY(${(1 - titleA) * -14}px)`,
              }}
            >
              <div
                style={{
                  fontSize: 34,
                  fontWeight: 400,
                  letterSpacing: "-0.03em",
                }}
              >
                Cards
              </div>
              <div style={{ fontSize: 15, color: c.muted, marginTop: 2 }}>
                {count} cards · Fernway
              </div>
            </div>
            {STACK.map((_, i) => {
              if (!walletPhase) {
                const v = stackIn[i];
                const o = sp(OUT + i * 3, HEAVY);
                return stackCard(i, 196 + i * 60, {
                  transform: `translateY(${(1 - v) * 640 - o * 340}px) rotate(${(1 - v) * (i - 1) * 8}deg) scale(${1 - o * 0.08})`,
                  opacity: 1 - o,
                });
              }
              const v = sp(WALLET + 6 + i * 3, CARD);
              return stackCard(i, 190 + i * 52, {
                transform: `translateY(${(1 - v) * -28}px) scale(${0.97 + v * 0.03})`,
                opacity: Math.min(1, v * 1.4),
              });
            })}
            <div
              style={{
                position: "absolute",
                top: 560,
                left: 0,
                right: 0,
                display: "flex",
                justifyContent: "center",
                gap: 10,
                ...enter(sp(28, CARD) * (1 - out)),
              }}
            >
              <div
                style={{
                  height: 42,
                  padding: "0 20px",
                  borderRadius: 21,
                  background: c.pill,
                  color: c.pillText,
                  fontSize: 15,
                  fontWeight: 400,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  transform: `scale(${1 - bump(TAP_NEW) * 0.05})`,
                }}
              >
                <span style={{ fontSize: 20, fontWeight: 400, marginTop: -2 }}>
                  +
                </span>
                New card
              </div>
              <div
                style={{
                  height: 42,
                  padding: "0 20px",
                  borderRadius: 21,
                  background: c.chip,
                  color: c.text,
                  fontSize: 15,
                  fontWeight: 400,
                  display: "flex",
                  alignItems: "center",
                }}
              >
                Manage
              </div>
            </div>
            {f >= SLOT ? (
              <div style={{ opacity: Math.min(custIn, custOut) }}>
                <div
                  style={{
                    position: "absolute",
                    top: 58,
                    left: 20,
                    right: 22,
                    height: 40,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                    <path
                      d="M19 12H5M11 6l-6 6 6 6"
                      stroke={c.text}
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span
                    style={{ fontSize: 16, fontWeight: 400, color: accent }}
                  >
                    Skip
                  </span>
                </div>
                <div
                  style={{
                    position: "absolute",
                    left: 22,
                    top: 104,
                    fontSize: 30,
                    fontWeight: 400,
                    letterSpacing: "-0.03em",
                    color: c.text,
                    ...enter(custIn),
                  }}
                >
                  Customise card
                </div>
                <div
                  style={{
                    position: "absolute",
                    left: 20,
                    right: 20,
                    top: SLOT_Y - 5,
                    height: 10,
                    borderRadius: 5,
                    background: dark ? "#1a1a1d" : "#d9d9de",
                    boxShadow: "inset 0 3px 5px rgba(0,0,0,0.6)",
                    transform: `scaleX(${slot})`,
                    opacity: slotGone,
                  }}
                />
                {swatches.map((col, i) => (
                  <div
                    key={col + i}
                    style={{
                      position: "absolute",
                      left: swatchX(i) - 17,
                      top: SWATCH_Y + 1,
                      width: 34,
                      height: 34,
                      borderRadius: 17,
                      background: col,
                      boxShadow:
                        i === colorIdx
                          ? `inset 0 0 0 1px rgba(255,255,255,0.1), 0 0 0 3px ${c.screen}, 0 0 0 ${3 + 2 * ring}px ${c.text}`
                          : `inset 0 0 0 1px ${dark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)"}`,
                      transform: `scale(${1 - bump(taps.find((tp) => tp.idx === i)?.t ?? -99) * 0.12})`,
                      ...enter(sp(PRINT + 20 + i * 2, CHIP), 10),
                    }}
                  />
                ))}
                {["Colour", "Name", "Details"].map((t, i) => (
                  <div
                    key={t}
                    style={{
                      position: "absolute",
                      left: toolX(i) - 50,
                      top: TOOLS_Y,
                      width: 100,
                      height: 38,
                      borderRadius: 19,
                      background: tool === i ? c.chip : "transparent",
                      boxShadow:
                        tool === i ? "none" : `inset 0 0 0 1px ${c.chip}`,
                      color: tool === i ? c.text : c.muted,
                      fontSize: 14,
                      fontWeight: 400,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      ...enter(sp(PRINT + 28 + i * 3, CHIP), 10),
                    }}
                  >
                    {t}
                  </div>
                ))}
                {[
                  `Virtual · ${finishes[colorIdx] ?? "Custom"}`,
                  `Printed on the front as ${holder.toUpperCase()}`,
                  "Only you can see the full number",
                ].map((hint, i) => {
                  const on = [PRINT + 34, NAME_TAB + 2, DETAILS_TAB + 2][i];
                  const off = [NAME_TAB + 1, DETAILS_TAB + 1, 9999][i];
                  const v =
                    interpolate(f, [on, on + 6], [0, 1], clamp) *
                    interpolate(f, [off, off + 4], [1, 0], clamp) *
                    (i === 0 ? 0.35 + 0.65 * wipe : 1);
                  return (
                    <div
                      key={i}
                      style={{
                        position: "absolute",
                        left: 0,
                        right: 0,
                        top: TOOLS_Y + 62,
                        textAlign: "center",
                        fontSize: 15,
                        color: i === 0 ? c.text : c.muted,
                        opacity: v,
                        transform: `translateY(${(1 - v) * 4}px)`,
                      }}
                    >
                      {hint}
                    </div>
                  );
                })}
                <div
                  style={{
                    position: "absolute",
                    left: 16,
                    right: 16,
                    bottom: 42,
                    height: 54,
                    borderRadius: 27,
                    background: c.pill,
                    color: c.pillText,
                    fontSize: 17,
                    fontWeight: 400,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transform: `scale(${1 - bump(ADD_TAP) * 0.04})`,
                    ...enter(sp(PRINT + 34, CARD), 20),
                  }}
                >
                  Add to wallet
                </div>
              </div>
            ) : null}
            {f >= PRINT ? (
              <div
                style={{
                  position: "absolute",
                  left: CX - 20,
                  top: f < WALLET ? SLOT_Y : 0,
                  width: CW + 40,
                  height: f < WALLET ? SH - SLOT_Y : SH,
                  overflow: f < PRINT + 32 ? "hidden" : "visible",
                  perspective: 1100,
                  zIndex: 5,
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    left: 20,
                    top: newY - (f < WALLET ? SLOT_Y : 0),
                    width: CW,
                    height: CHT,
                    transformStyle: "preserve-3d",
                    transform: `rotateY(${angle}deg) scale(${1 + lift})`,
                    boxShadow:
                      Math.cos((angle * Math.PI) / 180) > 0.2 ||
                      Math.cos((angle * Math.PI) / 180) < -0.2
                        ? dark
                          ? "0 18px 40px rgba(0,0,0,0.45)"
                          : "0 2px 4px rgba(20,20,30,0.06), 0 18px 36px rgba(20,20,30,0.16)"
                        : "none",
                    borderRadius: 16,
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      backfaceVisibility: "hidden",
                    }}
                  >
                    <CardFront
                      color={swatches[colorIdx]}
                      prev={wipe < 1 ? swatches[prevIdx] : undefined}
                      wipe={wipe}
                      label="Virtual"
                      holder={holder}
                      shown={shown}
                      engraveAt={engraveAt}
                      f={f}
                      last4={last4}
                    />
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        borderRadius: 16,
                        overflow: "hidden",
                        pointerEvents: "none",
                      }}
                    >
                      <div
                        style={{
                          position: "absolute",
                          top: -40,
                          bottom: -40,
                          width: 90,
                          left: `${sweep * 100}%`,
                          transform: "translateX(-50%) skewX(-16deg)",
                          background:
                            "linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.16), rgba(255,255,255,0))",
                        }}
                      />
                    </div>
                  </div>
                  <CardBack
                    color={swatches[colorIdx]}
                    number={number}
                    exp={f < SCRAMBLE ? "••/••" : exp}
                    cvv={f < SCRAMBLE ? "•••" : cvv}
                  />
                </div>
              </div>
            ) : null}
            <div
              style={{
                position: "absolute",
                left: "50%",
                top: 600,
                transform: `translateX(-50%) translateY(${(1 - toast) * 20}px) scale(${0.9 + toast * 0.1})`,
                opacity: Math.min(1, toast * 1.5),
                height: 44,
                padding: "0 18px 0 12px",
                borderRadius: 22,
                background: c.chip,
                color: c.text,
                fontSize: 15,
                fontWeight: 400,
                display: "flex",
                alignItems: "center",
                gap: 8,
                whiteSpace: "nowrap",
              }}
            >
              <div
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 11,
                  background: accent,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg width={14} height={14} viewBox="0 0 24 24" fill="none">
                  <path
                    d="M5 12.5l4.5 4.5L19 7.5"
                    stroke="#fff"
                    strokeWidth={3}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              Card ready to use
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
                boxShadow: dark
                  ? "inset 0 0 0 1.5px rgba(255,255,255,0.7)"
                  : "inset 0 0 0 1.5px rgba(255,255,255,0.9), 0 4px 14px rgba(0,0,0,0.18)",
                opacity: touchOpacity,
                transform: `scale(${1 - touchPress * 0.2})`,
                zIndex: 35,
              }}
            />
          </Phone>
        </div>
      </div>
    </AbsoluteFill>
  );
}
