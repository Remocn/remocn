"use client";

import { loadFont as loadFigtree } from "@remotion/google-fonts/Figtree";
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

const figtree = loadFigtree("normal", {
  weights: ["300", "400"],
  subsets: ["latin"],
});

export interface Collaborator {
  name: string;
  color: string;
}

export interface MultiplayerCursorsProps {
  /** Four collaborators. In order they: drop a sticky, select a card, drag a shape, leave a comment. */
  collaborators?: Collaborator[];
  boardTitle?: string;
  /** Large line above the board in the 9:16 layout. */
  headline?: string;
  stickyText?: string;
  commentText?: string;
  theme?: "light" | "dark";
  accent?: string;
  speed?: number;
  ground?: GshPresetId;
  groundParams?: Partial<GradientParams>;
}

const DEFAULT_COLLABORATORS: Collaborator[] = [
  { name: "Maya", color: "#E5484D" },
  { name: "Leo", color: "#12A594" },
  { name: "Priya", color: "#D6409F" },
  { name: "Sam", color: "#E8730C" },
];

const HEAVY = { mass: 1, damping: 26, stiffness: 120 };
const CARD = { mass: 0.8, damping: 18, stiffness: 160 };
const CHIP = { mass: 0.5, damping: 12, stiffness: 200 };
const MORPH = { damping: 200 };
const HAND = { mass: 0.9, damping: 22, stiffness: 140 };
const ENTER = Easing.bezier(0.32, 0.72, 0, 1);
const CAMERA = Easing.bezier(0.87, 0, 0.13, 1);
const CL = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const clamp = (v: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));

function withAlpha(color: string, alpha: number) {
  const hex = color.replace("#", "");
  const full = hex.length === 3 ? hex.replace(/(.)/g, "$1$1") : hex;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return color;
  const n = Number.parseInt(full, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

function palette(theme: "light" | "dark") {
  const dark = theme === "dark";
  return {
    dark,
    canvas: dark ? "#17181B" : "#F6F5F2",
    dot: dark ? "rgba(255,255,255,0.08)" : "rgba(30,28,24,0.13)",
    panel: dark ? "#222327" : "#FFFFFF",
    text: dark ? "#EDEDEF" : "#1C1B19",
    muted: dark ? "#9C9DA3" : "#6E6B65",
    faint: dark ? "#66676D" : "#A9A6A0",
    card: dark ? "#202125" : "#FFFFFF",
    rule: dark ? "rgba(255,255,255,0.08)" : "rgba(30,28,24,0.08)",
    sticky: dark ? "#EBCB55" : "#FFE27A",
    stickyText: "#2B2410",
    shape: dark ? "#9FE3BE" : "#B8F0CF",
    shapeText: "#14432A",
    window: dark
      ? "0 0 0 1px rgba(255,255,255,0.09), 0 12px 24px -12px rgba(0,0,0,0.6), 0 40px 90px -24px rgba(0,0,0,0.7)"
      : "0 0 0 1px rgba(20,22,30,0.06), 0 2px 4px rgba(20,22,30,0.04), 0 40px 90px -24px rgba(40,34,20,0.3)",
    raised: dark
      ? "0 0 0 1px rgba(255,255,255,0.08), 0 8px 20px -8px rgba(0,0,0,0.5)"
      : "0 0 0 1px rgba(30,28,24,0.06), 0 1px 2px rgba(30,28,24,0.05), 0 8px 20px -8px rgba(30,28,24,0.14)",
    cardDepth: dark
      ? "0 0 0 1px rgba(255,255,255,0.07)"
      : "0 0 0 1px rgba(30,28,24,0.07), 0 1px 2px rgba(30,28,24,0.04)",
  };
}
type Pal = ReturnType<typeof palette>;

interface Key {
  f: number;
  x: number;
  y: number;
}
interface Actor {
  keys: Key[];
  presses: [number, number][];
  seed: number;
}
interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}
interface Card extends Box {
  title: string;
  meta: string;
}

const COLUMNS = ["Hook", "Product", "Proof", "CTA"];
const CARD_COPY: [number, string, string][] = [
  [0, "Cold open: 3s logo sting", "0:03"],
  [1, "Hero demo walkthrough", "0:45"],
  [1, "Captions pass", "0:20"],
  [2, "Three customer quotes", "0:20"],
  [2, "Logo wall: 12 teams", "0:06"],
  [3, "End card and install line", "0:05"],
];

function layout(tall: boolean) {
  if (tall) {
    const colX = [44, 288];
    const headY = [108, 410];
    const at = (col: number) => ({ x: colX[col % 2], y: headY[col >> 1] });
    const rows = [
      { x: 44, y: 140, w: 228, h: 96 },
      { x: 288, y: 140, w: 228, h: 96 },
      { x: 288, y: 248, w: 228, h: 76 },
      { x: 44, y: 442, w: 228, h: 96 },
      { x: 44, y: 550, w: 228, h: 76 },
      { x: 288, y: 442, w: 228, h: 96 },
    ];
    return {
      stage: { w: 720, h: 1280 },
      win: { x: 80, y: 290, w: 560, h: 900 },
      frame: { x: 24, y: 92, w: 512, h: 650 },
      heads: COLUMNS.map((_, i) => at(i)),
      colW: 228,
      cards: rows,
      sticky: { x: 44, y: 250, w: 168, h: 148 },
      shape: { x: 168, y: 690, r: 50 },
      pin: { x: 236, y: 722 },
      loose: { x: 276, y: 128 },
      actors: [
        {
          keys: [
            { f: 6, x: -60, y: 520 },
            { f: 30, x: 0, y: 860 },
            { f: 38, x: 0, y: 860 },
            { f: 62, x: 120, y: 270 },
            { f: 70, x: 120, y: 270 },
            { f: 88, x: 168, y: 330 },
            { f: 188, x: 168, y: 330 },
            { f: 212, x: 130, y: 300 },
          ],
          presses: [
            [32, 35],
            [64, 67],
          ],
          seed: 1,
        },
        {
          keys: [
            { f: 20, x: 300, y: -50 },
            { f: 48, x: 276, y: 128 },
            { f: 52, x: 276, y: 128 },
            { f: 80, x: 528, y: 248 },
            { f: 112, x: 528, y: 248 },
            { f: 136, x: 470, y: 196 },
            { f: 192, x: 470, y: 196 },
            { f: 216, x: 430, y: 300 },
          ],
          presses: [[52, 80]],
          seed: 2,
        },
        {
          keys: [
            { f: 44, x: 640, y: 780 },
            { f: 72, x: 186, y: 700 },
            { f: 78, x: 186, y: 700 },
            { f: 110, x: 420, y: 600 },
            { f: 150, x: 420, y: 600 },
            { f: 176, x: 460, y: 640 },
          ],
          presses: [[78, 110]],
          seed: 3,
        },
        {
          keys: [
            { f: 78, x: 320, y: 980 },
            { f: 106, x: 236, y: 722 },
            { f: 160, x: 236, y: 722 },
            { f: 184, x: 190, y: 770 },
            { f: 210, x: 210, y: 780 },
            { f: 232, x: 262, y: 740 },
          ],
          presses: [[109, 112]],
          seed: 4,
        },
      ] as Actor[],
    };
  }
  const colX = (i: number) => 60 + i * 222;
  return {
    stage: { w: 1280, h: 720 },
    win: { x: 140, y: 70, w: 1000, h: 580 },
    frame: { x: 40, y: 92, w: 920, h: 360 },
    heads: COLUMNS.map((_, i) => ({ x: colX(i), y: 108 })),
    colW: 200,
    cards: [
      { x: colX(0), y: 140, w: 200, h: 96 },
      { x: colX(1), y: 140, w: 200, h: 96 },
      { x: colX(1), y: 248, w: 200, h: 76 },
      { x: colX(2), y: 140, w: 200, h: 96 },
      { x: colX(2), y: 248, w: 200, h: 76 },
      { x: colX(3), y: 140, w: 200, h: 96 },
    ],
    sticky: { x: 72, y: 250, w: 168, h: 148 },
    shape: { x: 470, y: 396, r: 50 },
    pin: { x: 628, y: 432 },
    loose: { x: 268, y: 128 },
    actors: [
      {
        keys: [
          { f: 6, x: -70, y: 420 },
          { f: 30, x: 0, y: 540 },
          { f: 38, x: 0, y: 540 },
          { f: 62, x: 148, y: 270 },
          { f: 70, x: 148, y: 270 },
          { f: 88, x: 196, y: 330 },
          { f: 188, x: 196, y: 330 },
          { f: 212, x: 150, y: 300 },
        ],
        presses: [
          [32, 35],
          [64, 67],
        ],
        seed: 1,
      },
      {
        keys: [
          { f: 20, x: 440, y: -50 },
          { f: 48, x: 268, y: 128 },
          { f: 52, x: 268, y: 128 },
          { f: 80, x: 496, y: 248 },
          { f: 112, x: 496, y: 248 },
          { f: 136, x: 440, y: 196 },
          { f: 192, x: 440, y: 196 },
          { f: 216, x: 400, y: 300 },
        ],
        presses: [[52, 80]],
        seed: 2,
      },
      {
        keys: [
          { f: 44, x: 1080, y: 480 },
          { f: 72, x: 486, y: 406 },
          { f: 78, x: 486, y: 406 },
          { f: 110, x: 842, y: 310 },
          { f: 150, x: 842, y: 310 },
          { f: 176, x: 886, y: 350 },
        ],
        presses: [[78, 110]],
        seed: 3,
      },
      {
        keys: [
          { f: 78, x: 700, y: 660 },
          { f: 106, x: 628, y: 432 },
          { f: 160, x: 628, y: 432 },
          { f: 184, x: 560, y: 480 },
          { f: 210, x: 548, y: 486 },
          { f: 232, x: 600, y: 440 },
        ],
        presses: [[109, 112]],
        seed: 4,
      },
    ] as Actor[],
  };
}

function along(keys: Key[], f: number, fps: number) {
  let x = keys[0].x;
  let y = keys[0].y;
  for (let i = 1; i < keys.length; i++) {
    const a = keys[i - 1];
    const b = keys[i];
    if (f < a.f) break;
    const p = spring({
      frame: f - a.f,
      fps,
      config: HAND,
      durationInFrames: b.f - a.f,
    });
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const d = Math.hypot(dx, dy) || 1;
    const arc = Math.sin(clamp(p) * Math.PI) * Math.min(46, d * 0.14);
    x = a.x + dx * p + (dy / d) * arc * (i % 2 ? 1 : -1);
    y = a.y + dy * p - (dx / d) * arc * (i % 2 ? 1 : -1);
  }
  return { x, y };
}

function pressAt(windows: [number, number][], f: number, fps: number) {
  let p = 0;
  for (const [d, u] of windows) {
    const down = spring({
      frame: f - d + 2,
      fps,
      config: { mass: 0.4, damping: 14, stiffness: 420 },
    });
    const up = spring({
      frame: f - u,
      fps,
      config: { mass: 0.4, damping: 14, stiffness: 420 },
    });
    p = Math.max(p, down - up);
  }
  return p;
}

function cursorAt(a: Actor, f: number, fps: number) {
  const base = along(a.keys, f, fps);
  const p0 = along(a.keys, f - 1, fps);
  const p1 = along(a.keys, f + 1, fps);
  const spd = Math.hypot(p1.x - p0.x, p1.y - p0.y) / 2;
  const press = pressAt(a.presses, f, fps);
  const idle = clamp(1 - spd / 2.2) * (1 - clamp(press));
  const s = a.seed * 1.7;
  const dx = 3.4 * (Math.sin(f * 0.055 + s) + 0.5 * Math.sin(f * 0.13 + s * 2));
  const dy = 2.8 * (Math.cos(f * 0.047 + s * 1.3) + 0.5 * Math.sin(f * 0.11));
  return { x: base.x + dx * idle, y: base.y + dy * idle, press };
}

function FigCursor({ color, name, press }: Collaborator & { press: number }) {
  return (
    <div style={{ position: "absolute", left: -3, top: -2 }}>
      <svg
        width={22}
        height={22}
        viewBox="0 0 22 22"
        style={{
          transformOrigin: "3px 2px",
          transform: `scale(${1 - 0.1 * clamp(press)})`,
          filter: "drop-shadow(0 2px 3px rgba(0,0,0,0.25))",
          overflow: "visible",
        }}
      >
        <path
          d="M3 2 L19 8.6 L11.4 11.4 L8.6 19 Z"
          fill={color}
          stroke="#FFFFFF"
          strokeWidth={1.5}
          strokeLinejoin="round"
        />
      </svg>
      <div
        style={{
          position: "absolute",
          left: 16,
          top: 20,
          background: color,
          color: "#fff",
          fontSize: 14,
          lineHeight: "18px",
          padding: "3px 9px",
          borderRadius: "4px 10px 10px 10px",
          whiteSpace: "nowrap",
          boxShadow:
            "0 1px 2px rgba(0,0,0,0.16), 0 4px 10px -2px rgba(0,0,0,0.18)",
        }}
      >
        {name}
      </div>
    </div>
  );
}

function Avatar({
  name,
  color,
  size,
  ring,
}: {
  name: string;
  color: string;
  size: number;
  ring: string;
}) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: color,
        color: "#fff",
        fontSize: size * 0.44,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: `0 0 0 2px ${ring}`,
      }}
    >
      {name.slice(0, 1).toUpperCase()}
    </div>
  );
}

const ICONS: Record<string, string> = {
  select:
    "M6.5 4.5 L6.5 17 L9.8 13.9 L12 18.8 L14 17.9 L11.8 13.1 L16.2 13.1 Z",
  hand: "M8 11V6.2a1.3 1.3 0 0 1 2.6 0V10m0-.5V5a1.3 1.3 0 0 1 2.6 0v5m0-3.6a1.3 1.3 0 0 1 2.6 0v4.2M15.8 9a1.3 1.3 0 0 1 2.6 0v4.6a5.6 5.6 0 0 1-5.6 5.6h-.9a5.6 5.6 0 0 1-4.4-2.2L5 13.9a1.4 1.4 0 0 1 2.1-1.8l.9.9",
  pen: "M5 19 L6 15 L15.5 5.5 L18.5 8.5 L9 18 Z",
  sticky: "M5 5 H19 V14 L14 19 H5 Z M14 19 V14 H19",
  shape: "M9.5 4.5 A5 5 0 1 1 9.4 4.5 Z M12 12 H19.5 V19.5 H12 Z",
  text: "M6 6 H18 M12 6 V19",
  section: "M5 8 V5 H8 M16 5 H19 V8 M19 16 V19 H16 M8 19 H5 V16",
  table: "M5 5 H19 V19 H5 Z M5 10 H19 M10.5 10 V19",
};
const TOOL_SLOTS: [string, number][] = [
  ["select", 8],
  ["hand", 48],
  ["pen", 101],
  ["sticky", 141],
  ["shape", 181],
  ["text", 234],
  ["section", 274],
  ["table", 314],
];
const TOOLBAR_W = 358;
const TOOLBAR_H = 52;

function Toolbar({
  pal,
  accent,
  stickyActive,
  x,
  y,
}: {
  pal: Pal;
  accent: string;
  stickyActive: number;
  x: number;
  y: number;
}) {
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: TOOLBAR_W,
        height: TOOLBAR_H,
        borderRadius: 14,
        background: pal.panel,
        boxShadow: pal.raised,
      }}
    >
      {TOOL_SLOTS.map(([name, sx]) => {
        const on =
          name === "select"
            ? 1 - stickyActive
            : name === "sticky"
              ? stickyActive
              : 0;
        return (
          <div
            key={name}
            style={{
              position: "absolute",
              left: sx,
              top: 8,
              width: 36,
              height: 36,
              borderRadius: 9,
              background: withAlpha(accent, on),
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg
              width={22}
              height={22}
              viewBox="0 0 24 24"
              fill="none"
              stroke={on > 0.5 ? "#fff" : pal.text}
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d={ICONS[name]} />
            </svg>
          </div>
        );
      })}
      {[92, 225].map((sx) => (
        <div
          key={sx}
          style={{
            position: "absolute",
            left: sx,
            top: 14,
            width: 1,
            height: 24,
            background: pal.rule,
          }}
        />
      ))}
    </div>
  );
}

function BoardCard({
  card,
  pal,
  outline,
}: {
  card: Card;
  pal: Pal;
  outline?: string;
}) {
  return (
    <div
      style={{
        position: "absolute",
        left: card.x,
        top: card.y,
        width: card.w,
        height: card.h,
        boxSizing: "border-box",
        background: pal.card,
        borderRadius: 10,
        boxShadow: outline ? `0 0 0 1.5px ${outline}` : pal.cardDepth,
        padding: "12px 14px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      <div
        style={{
          fontSize: 16,
          lineHeight: "21px",
          color: pal.text,
          letterSpacing: "-0.01em",
        }}
      >
        {card.title}
      </div>
      <div
        style={{
          fontSize: 14,
          color: pal.muted,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {card.meta}
      </div>
    </div>
  );
}

export function MultiplayerCursors({
  collaborators = DEFAULT_COLLABORATORS,
  boardTitle = "Launch plan",
  headline = "Plan the launch together",
  stickyText = "Record the hero demo by Friday",
  commentText = "Love this. Ship it Friday.",
  theme = "light",
  accent = "#3B5BFD",
  speed = 1,
  ground,
  groundParams,
}: MultiplayerCursorsProps) {
  const frame = useCurrentFrame() * speed;
  const { width, height, fps } = useVideoConfig();
  const tall = height > width;
  const L = layout(tall);
  const u = Math.min(width / L.stage.w, height / L.stage.h);
  const pal = palette(theme);
  const WIN = L.win;
  const people = L.actors.map(
    (_, i) =>
      collaborators[i] ??
      DEFAULT_COLLABORATORS[i % DEFAULT_COLLABORATORS.length],
  );
  const sp = (at: number, config: Partial<typeof CARD>) =>
    spring({ frame: frame - at, fps, config });

  const tbX = (WIN.w - TOOLBAR_W) / 2;
  const tbY = WIN.h - 16 - TOOLBAR_H;
  const stickySlot = { x: tbX + 141 + 20, y: tbY + 28 };
  const actors = L.actors.map((a, i) =>
    i === 0
      ? {
          ...a,
          keys: a.keys.map((k, j) =>
            j === 1 || j === 2 ? { ...k, ...stickySlot } : k,
          ),
        }
      : a,
  );
  const cur = actors.map((a) => cursorAt(a, frame, fps));

  const win = sp(0, HEAVY);
  const winFade = interpolate(frame, [0, 12], [0, 1], { ...CL, easing: ENTER });
  const cam = interpolate(frame, [20, 260], [1, 1.04], {
    ...CL,
    easing: CAMERA,
  });
  const camO = { x: WIN.w / 2, y: WIN.h * 0.45 };
  const toScreen = (p: { x: number; y: number }) => ({
    x: camO.x + (p.x - camO.x) * cam,
    y: camO.y + (p.y - camO.y) * cam,
  });

  const cards: Card[] = CARD_COPY.map(([, title, meta], i) => ({
    ...L.cards[i],
    title,
    meta,
  }));
  const SELECTED = cards[1];

  const stickyIn = sp(65, CARD);
  const ghost = frame >= 36 && frame < 65;
  const stickyChars = Array.from(stickyText);
  const commentChars = Array.from(commentText);
  const typed = Math.floor(
    interpolate(frame, [80, 124], [0, stickyChars.length], CL),
  );
  const caretOn = frame >= 72 && frame < 136 && Math.floor(frame / 8) % 2 === 0;

  const leo = along(actors[1].keys, frame, fps);
  const marquee = frame >= 52 && frame < 82;
  const snap = sp(80, MORPH);
  const selOn = frame >= 80;
  const loose = {
    ...L.loose,
    w: actors[1].keys[3].x - L.loose.x,
    h: actors[1].keys[3].y - L.loose.y,
  };
  const selBox = {
    x: interpolate(snap, [0, 1], [loose.x, SELECTED.x]),
    y: interpolate(snap, [0, 1], [loose.y, SELECTED.y]),
    w: interpolate(snap, [0, 1], [loose.w, SELECTED.w]),
    h: interpolate(snap, [0, 1], [loose.h, SELECTED.h]),
  };

  const pri = actors[2];
  const grab = along(pri.keys, 78, fps);
  const held = along(pri.keys, clamp(frame, 78, 110), fps);
  const dragging = frame >= 78 && frame <= 112;
  const drop = sp(110, CHIP);
  const SH = L.shape;
  const shapeX = SH.x + held.x - grab.x;
  const shapeY = SH.y + held.y - grab.y;
  const lift = dragging ? 1 : 1 - drop;
  const shapeScale = 1 + 0.05 * lift;

  const pinIn = sp(111, CHIP);
  const bubbleIn = sp(118, CARD);
  const bubbleFade = interpolate(frame, [118, 126], [0, 1], {
    ...CL,
    easing: ENTER,
  });
  const commentTyped = Math.floor(
    interpolate(frame, [124, 152], [0, commentChars.length], CL),
  );
  const joinAt = actors.map((a) => a.keys[0].f + 10);
  const headIn = interpolate(frame, [4, 20], [0, 1], { ...CL, easing: ENTER });
  const stickyTool = interpolate(frame, [31, 34, 60, 66], [0, 1, 1, 0], CL);

  const chrome: React.CSSProperties = {
    position: "absolute",
    top: 16,
    height: 44,
    display: "flex",
    alignItems: "center",
    borderRadius: 12,
    background: pal.panel,
    boxShadow: pal.raised,
    fontSize: 15,
  };

  return (
    <AbsoluteFill
      style={{
        fontFamily: figtree.fontFamily,
        WebkitFontSmoothing: "antialiased",
        overflow: "hidden",
      }}
    >
      <GshGround
        preset={ground ?? (pal.dark ? "charcoal-satin" : "paper-crease")}
        params={
          groundParams ??
          (pal.dark || ground
            ? undefined
            : {
                colors: ["#f4c2a0", "#f9e0cc", "#f1ebe3", "#cdb8a3"],
                background: "#efebe4",
              })
        }
        timeOffset={pal.dark ? 4 : 3}
        timeScale={0.35}
      />
      <div
        style={{
          position: "absolute",
          left: (width - L.stage.w * u) / 2,
          top: (height - L.stage.h * u) / 2,
          width: L.stage.w,
          height: L.stage.h,
          transform: `scale(${u})`,
          transformOrigin: "0 0",
        }}
      >
        {tall ? (
          <div
            style={{
              position: "absolute",
              left: WIN.x,
              top: 150,
              width: WIN.w,
              fontSize: 52,
              fontWeight: 300,
              letterSpacing: "-0.035em",
              lineHeight: 1.04,
              color: pal.dark ? "#F2F2F4" : "#1C1B19",
              opacity: headIn,
              transform: `translateY(${(1 - headIn) * 18}px)`,
            }}
          >
            {headline}
          </div>
        ) : null}
        <div
          style={{
            position: "absolute",
            left: WIN.x,
            top: WIN.y,
            width: WIN.w,
            height: WIN.h,
            opacity: winFade,
            transformOrigin: "50% 45%",
            transform: `translateY(${(1 - win) * 60}px) scale(${0.96 + 0.04 * win})`,
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: 18,
              overflow: "hidden",
              background: pal.canvas,
              boxShadow: pal.window,
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                transform: `scale(${cam})`,
                transformOrigin: `${camO.x}px ${camO.y}px`,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  inset: -120,
                  backgroundImage: `radial-gradient(circle, ${pal.dot} 1px, transparent 1.4px)`,
                  backgroundSize: "22px 22px",
                }}
              />

              <div
                style={{
                  position: "absolute",
                  left: L.frame.x,
                  top: L.frame.y,
                  width: L.frame.w,
                  height: L.frame.h,
                  boxSizing: "border-box",
                  background: withAlpha(accent, pal.dark ? 0.06 : 0.035),
                  boxShadow: `inset 0 0 0 1px ${withAlpha(accent, 0.4)}`,
                  borderRadius: 12,
                }}
              />
              {COLUMNS.map((c, i) => (
                <div
                  key={c}
                  style={{
                    position: "absolute",
                    left: L.heads[i].x + 2,
                    top: L.heads[i].y,
                    fontSize: 15,
                    color: pal.muted,
                  }}
                >
                  {c}
                </div>
              ))}
              {cards.map((card) => (
                <BoardCard
                  key={card.title}
                  card={card}
                  pal={pal}
                  outline={
                    card === SELECTED && selOn ? people[1].color : undefined
                  }
                />
              ))}
              {marquee ? (
                <div
                  style={{
                    position: "absolute",
                    left: Math.min(loose.x, leo.x),
                    top: Math.min(loose.y, leo.y),
                    width: Math.abs(leo.x - loose.x),
                    height: Math.abs(leo.y - loose.y),
                    background: withAlpha(people[1].color, 0.08),
                    boxShadow: `inset 0 0 0 1px ${people[1].color}`,
                  }}
                />
              ) : null}
              {selOn ? (
                <div
                  style={{
                    position: "absolute",
                    left: selBox.x,
                    top: selBox.y,
                    width: selBox.w,
                    height: selBox.h,
                    boxShadow: `inset 0 0 0 1.5px ${people[1].color}`,
                    borderRadius: interpolate(snap, [0, 1], [0, 10]),
                  }}
                >
                  {[
                    [0, 0],
                    [1, 0],
                    [0, 1],
                    [1, 1],
                  ].map(([hx, hy]) => (
                    <div
                      key={`${hx}${hy}`}
                      style={{
                        position: "absolute",
                        left: `calc(${hx * 100}% - 4px)`,
                        top: `calc(${hy * 100}% - 4px)`,
                        width: 8,
                        height: 8,
                        background: "#fff",
                        boxShadow: `inset 0 0 0 1.5px ${people[1].color}`,
                        borderRadius: 2,
                        transform: `scale(${snap})`,
                      }}
                    />
                  ))}
                </div>
              ) : null}
              <div
                style={{
                  position: "absolute",
                  left: shapeX - SH.r,
                  top: shapeY - SH.r,
                  width: SH.r * 2,
                  height: SH.r * 2,
                  borderRadius: "50%",
                  background: pal.shape,
                  boxShadow: `inset 0 0 0 ${dragging ? 2 : 1}px ${dragging ? people[2].color : "rgba(20,67,42,0.25)"}, 0 ${2 + 12 * lift}px ${6 + 20 * lift}px -4px rgba(0,0,0,${0.1 + 0.14 * lift})`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 15,
                  color: pal.shapeText,
                  transform: `scale(${shapeScale})`,
                }}
              >
                Launch day
              </div>
              {ghost || frame >= 65 ? (
                <div
                  style={{
                    position: "absolute",
                    left: ghost ? cur[0].x - 76 : L.sticky.x,
                    top: ghost ? cur[0].y - 20 : L.sticky.y,
                    width: L.sticky.w,
                    height: L.sticky.h,
                    background: pal.sticky,
                    opacity: ghost ? 0.6 : 1,
                    transform: ghost
                      ? "scale(0.82) rotate(-4deg)"
                      : `scale(${0.86 + 0.14 * stickyIn}) rotate(${-5 + 3.5 * stickyIn}deg)`,
                    transformOrigin: "76px 20px",
                    borderRadius: 3,
                    boxShadow:
                      "0 1px 2px rgba(0,0,0,0.08), 0 12px 22px -10px rgba(60,40,0,0.35)",
                    padding: 16,
                    boxSizing: "border-box",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <div
                    style={{
                      fontSize: 18,
                      lineHeight: 1.28,
                      color: pal.stickyText,
                      letterSpacing: "-0.01em",
                    }}
                  >
                    {stickyChars.slice(0, typed).join("")}
                    <span
                      style={{
                        display: "inline-block",
                        width: 1.5,
                        height: 19,
                        marginLeft: 1,
                        verticalAlign: -3,
                        background: caretOn ? pal.stickyText : "transparent",
                      }}
                    />
                  </div>
                  <div
                    style={{
                      marginTop: "auto",
                      fontSize: 14,
                      color: "rgba(43,36,16,0.6)",
                    }}
                  >
                    {people[0].name}
                  </div>
                </div>
              ) : null}
              {frame >= 111 ? (
                <>
                  <div
                    style={{
                      position: "absolute",
                      left: L.pin.x + 26,
                      top: L.pin.y - 66,
                      width: 214,
                      background: pal.panel,
                      borderRadius: 14,
                      boxShadow: pal.raised,
                      padding: "11px 14px 13px",
                      opacity: bubbleFade,
                      transform: `translateX(${(1 - bubbleIn) * -12}px) scale(${0.92 + 0.08 * bubbleIn})`,
                      transformOrigin: "0 100%",
                      boxSizing: "border-box",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        gap: 8,
                        alignItems: "baseline",
                      }}
                    >
                      <span style={{ fontSize: 15, color: pal.text }}>
                        {people[3].name}
                      </span>
                      <span style={{ fontSize: 13, color: pal.muted }}>
                        Just now
                      </span>
                    </div>
                    <div
                      style={{
                        marginTop: 3,
                        fontSize: 15,
                        lineHeight: "20px",
                        color: pal.text,
                        minHeight: 20,
                      }}
                    >
                      {commentChars.slice(0, commentTyped).join("")}
                    </div>
                  </div>
                  <div
                    style={{
                      position: "absolute",
                      left: L.pin.x,
                      top: L.pin.y - 34,
                      transform: `scale(${pinIn})`,
                      transformOrigin: "0 100%",
                      borderRadius: "50% 50% 50% 0",
                      padding: 2,
                      background: pal.panel,
                      boxShadow: "0 3px 8px rgba(0,0,0,0.22)",
                    }}
                  >
                    <Avatar
                      name={people[3].name}
                      color={people[3].color}
                      size={30}
                      ring="transparent"
                    />
                  </div>
                </>
              ) : null}
            </div>
            <div style={{ ...chrome, left: 16, gap: 8, padding: "0 14px" }}>
              <span style={{ color: pal.muted }}>Drafts</span>
              <span style={{ color: pal.faint }}>/</span>
              <span style={{ color: pal.text }}>{boardTitle}</span>
            </div>
            <div
              style={{ ...chrome, right: 16, gap: 12, padding: "0 6px 0 12px" }}
            >
              <div style={{ display: "flex", alignItems: "center" }}>
                {[...people].reverse().map((p, ri) => {
                  const i = people.length - 1 - ri;
                  const s = sp(joinAt[i], CHIP);
                  return (
                    <div
                      key={p.name}
                      style={{
                        width: 22 * clamp(s),
                        height: 28,
                        position: "relative",
                      }}
                    >
                      <div
                        style={{
                          position: "absolute",
                          left: 0,
                          top: 0,
                          transform: `scale(${s})`,
                        }}
                      >
                        <Avatar
                          name={p.name}
                          color={p.color}
                          size={28}
                          ring={pal.panel}
                        />
                      </div>
                    </div>
                  );
                })}
                <div style={{ width: 28 }}>
                  <Avatar
                    name="Eli"
                    color={pal.dark ? "#55565C" : "#3D3C39"}
                    size={28}
                    ring={pal.panel}
                  />
                </div>
              </div>
              <div
                style={{
                  background: accent,
                  color: "#fff",
                  fontSize: 15,
                  padding: "6px 14px",
                  borderRadius: 8,
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.2)",
                }}
              >
                Share
              </div>
            </div>
            <Toolbar
              pal={pal}
              accent={accent}
              stickyActive={stickyTool}
              x={tbX}
              y={tbY}
            />
          </div>
          {cur.map((c, i) => {
            const a = actors[i];
            const vis = interpolate(
              frame,
              [a.keys[0].f, a.keys[0].f + 6],
              [0, 1],
              CL,
            );
            const s = toScreen(c);
            const k = i === 0 ? interpolate(frame, [38, 62], [0, 1], CL) : 1;
            return (
              <div
                key={people[i].name}
                style={{
                  position: "absolute",
                  left: c.x + (s.x - c.x) * k,
                  top: c.y + (s.y - c.y) * k,
                  opacity: vis,
                  zIndex: 20,
                }}
              >
                <FigCursor {...people[i]} press={c.press} />
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
}
