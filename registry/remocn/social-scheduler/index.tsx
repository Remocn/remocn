"use client";

import { loadFont } from "@remotion/google-fonts/Onest";
import type React from "react";
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

export interface SchedulerSlot {
  label: string;
  hint?: string;
}

export interface QueuePost {
  day: string;
  time: string;
  text: string;
  media?: boolean;
}

export interface SocialSchedulerProps {
  text?: string;
  brand?: string;
  handle?: string;
  followers?: string;
  mediaSrc?: string;
  networks?: [string, string];
  slots?: SchedulerSlot[];
  pick?: number;
  queue?: QueuePost[];
  weekLabel?: string;
  days?: string[];
  theme?: "light" | "dark";
  accent?: string;
  speed?: number;
  ground?: GshPresetId;
  groundParams?: Partial<GradientParams>;
}

const DEFAULT_TEXT =
  "remocn 2.0 is live: 120 Remotion components you copy, paste and own. Your next launch video takes an afternoon, not a sprint.";

const DEFAULT_SLOTS: SchedulerSlot[] = [
  { label: "Mon 17:30" },
  { label: "Tue 9:00", hint: "Best time" },
  { label: "Wed 12:15", hint: "High reach" },
  { label: "Thu 8:45" },
];

const DEFAULT_QUEUE: QueuePost[] = [
  {
    day: "Mon",
    time: "9:00",
    text: "How we tuned spring physics for UI motion",
  },
  {
    day: "Mon",
    time: "14:30",
    text: "Poll: which transition should we ship next?",
  },
  {
    day: "Tue",
    time: "8:30",
    text: "Thread: five launch video mistakes we made",
  },
  {
    day: "Tue",
    time: "12:00",
    text: "Customer story: how Kitebase cut a demo in a day",
  },
  {
    day: "Tue",
    time: "16:30",
    text: "Weekly changelog: captions and a new cursor",
  },
  {
    day: "Wed",
    time: "10:00",
    text: "Live: building a launch video with Fernway",
  },
  {
    day: "Wed",
    time: "15:00",
    text: "Tip: own your code, don’t fight a black box",
  },
  {
    day: "Thu",
    time: "9:15",
    text: "Behind the scenes of the remocn registry",
  },
  {
    day: "Thu",
    time: "13:45",
    text: "Five templates for your next product launch",
  },
  {
    day: "Fri",
    time: "11:00",
    text: "Community showcase: Halcyon’s launch reel",
  },
];

const DEFAULT_DAYS = ["Mon 26", "Tue 27", "Wed 28", "Thu 29", "Fri 30"];

const CL = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const enterEase = Easing.bezier(0.32, 0.72, 0, 1);
const exitEase = Easing.bezier(0.55, 0, 1, 0.45);
const camEase = Easing.bezier(0.87, 0, 0.13, 1);
const tween = (f: number, a: number, b: number, easing = enterEase) =>
  interpolate(f, [a, b], [0, 1], { ...CL, easing });
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp = (v: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, v));

const HEAVY = { mass: 1, damping: 26, stiffness: 120 };
const CARD = { mass: 0.8, damping: 18, stiffness: 160 };
const CHIP = { mass: 0.5, damping: 12, stiffness: 200 };
const MORPH = { damping: 200 };

function withAlpha(color: string, alpha: number) {
  const hex = color.replace("#", "");
  const full = hex.length === 3 ? hex.replace(/(.)/g, "$1$1") : hex;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return color;
  const n = Number.parseInt(full, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

const hash = (i: number) => {
  const s = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};

function typedCount(text: string, frame: number, start: number) {
  let t = start;
  for (let i = 0; i < text.length; i++) {
    t += 0.38 + hash(i) * 0.22 + (/[.:,]/.test(text[i - 1] ?? "") ? 2 : 0);
    if (t > frame) return i;
  }
  return text.length;
}

interface Pt {
  x: number;
  y: number;
}

function arcTo(a: Pt, b: Pt, p: number, bend = 0.16): Pt {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const d = Math.hypot(dx, dy) || 1;
  const bow = Math.sin(clamp(p, 0, 1) * Math.PI) * Math.min(56, d * bend);
  return {
    x: lerp(a.x, b.x, p) + (dy / d) * bow,
    y: lerp(a.y, b.y, p) - (dx / d) * bow,
  };
}

function Cursor({ x, y, scale }: { x: number; y: number; scale: number }) {
  return (
    <svg
      width={24}
      height={28}
      viewBox="0 0 20 24"
      style={{
        position: "absolute",
        left: x - 2,
        top: y - 2,
        transformOrigin: "2px 2px",
        transform: `scale(${scale})`,
        filter: "drop-shadow(0 3px 6px rgba(0,0,0,0.3))",
        overflow: "visible",
      }}
    >
      <path
        d="M2 2 L2 19.5 L6.6 15.4 L9.8 22.4 L12.9 21 L9.8 14.2 L16 14.2 Z"
        fill="#FFFFFF"
        stroke="#16171A"
        strokeWidth={1.1}
        strokeLinejoin="round"
      />
    </svg>
  );
}

interface Pal {
  board: string;
  col: string;
  card: string;
  comp: string;
  panel: string;
  pop: string;
  line: string;
  ring: string;
  text: string;
  muted: string;
  faint: string;
  green: string;
  dim: string;
  scrim: string;
  winShadow: string;
  cardShadow: string;
  popShadow: string;
  stageText: string;
  stageMuted: string;
  dark: boolean;
}

function palette(theme: "light" | "dark"): Pal {
  return theme === "dark"
    ? {
        board: "#0E0F12",
        col: "rgba(255,255,255,0.025)",
        card: "#17181C",
        comp: "#111215",
        panel: "#0C0D10",
        pop: "#1A1B1F",
        line: "rgba(255,255,255,0.07)",
        ring: "rgba(255,255,255,0.09)",
        text: "#EEEEF0",
        muted: "rgba(238,238,240,0.6)",
        faint: "rgba(238,238,240,0.38)",
        green: "#62D893",
        dim: "rgba(3,4,8,0.45)",
        scrim: "rgba(3,4,10,0.25)",
        winShadow:
          "0 0 0 1px rgba(255,255,255,0.09), inset 0 1px 0 rgba(255,255,255,0.05), 0 40px 90px -24px rgba(0,0,0,0.75), 0 10px 28px rgba(0,0,0,0.35)",
        cardShadow: "0 0 0 1px rgba(255,255,255,0.07)",
        popShadow:
          "0 0 0 1px rgba(255,255,255,0.11), inset 0 1px 0 rgba(255,255,255,0.06), 0 24px 48px -12px rgba(0,0,0,0.7)",
        stageText: "#F2F2F4",
        stageMuted: "rgba(242,242,244,0.62)",
        dark: true,
      }
    : {
        board: "#FAFAF9",
        col: "rgba(22,23,26,0.025)",
        card: "#FFFFFF",
        comp: "#FFFFFF",
        panel: "#F6F6F4",
        pop: "#FFFFFF",
        line: "rgba(22,23,26,0.08)",
        ring: "rgba(22,23,26,0.1)",
        text: "#16171A",
        muted: "rgba(22,23,26,0.6)",
        faint: "rgba(22,23,26,0.4)",
        green: "#18794E",
        dim: "rgba(236,238,244,0.5)",
        scrim: "rgba(238,240,246,0.15)",
        winShadow:
          "0 0 0 1px rgba(17,19,24,0.07), 0 1px 2px rgba(17,19,24,0.05), 0 30px 70px -20px rgba(28,38,92,0.28)",
        cardShadow:
          "0 0 0 1px rgba(17,19,24,0.06), 0 1px 2px rgba(17,19,24,0.04)",
        popShadow:
          "0 0 0 1px rgba(17,19,24,0.08), 0 2px 4px rgba(17,19,24,0.05), 0 22px 44px -14px rgba(28,38,92,0.3)",
        stageText: "#14151A",
        stageMuted: "rgba(20,21,26,0.6)",
        dark: false,
      };
}

const ICONS = {
  image:
    "M3.5 2.75h9a.75.75 0 0 1 .75.75v9a.75.75 0 0 1-.75.75h-9a.75.75 0 0 1-.75-.75v-9a.75.75 0 0 1 .75-.75zM2.75 10.5l3-3 2.5 2.5 1.5-1.5 3.5 3.5M10.25 5.75h.01",
  cal: "M3.5 3.5h9a.75.75 0 0 1 .75.75v8.5a.75.75 0 0 1-.75.75h-9a.75.75 0 0 1-.75-.75v-8.5a.75.75 0 0 1 .75-.75zM2.75 6.5h10.5M5.5 2v2.5M10.5 2v2.5",
  chev: "M4.75 6.5 8 9.75l3.25-3.25",
  x: "M4.75 4.75l6.5 6.5M11.25 4.75l-6.5 6.5",
  check: "M3.5 8.5l3 3 6-6.5",
  clock: "M8 13.5a5.5 5.5 0 1 0 0-11 5.5 5.5 0 0 0 0 11zM8 5v3.25l2 1.25",
  reply: "M3 7.5a4.5 4.5 0 0 1 4.5-4.5h1a4.5 4.5 0 0 1 0 9H6l-3 2v-6.5z",
  repost:
    "M4 6.5V5.25a1.5 1.5 0 0 1 1.5-1.5H12M10.5 2.25 12 3.75l-1.5 1.5M12 9.5v1.25a1.5 1.5 0 0 1-1.5 1.5H4M5.5 13.75 4 12.25l1.5-1.5",
  heart:
    "M8 13S2.75 9.9 2.75 6.25A2.75 2.75 0 0 1 8 5a2.75 2.75 0 0 1 5.25 1.25C13.25 9.9 8 13 8 13z",
  chart: "M3 13V8.5M6.5 13V4.5M10 13V7M13.5 13V3",
} as const;
type IconName = keyof typeof ICONS;

function Icon({
  name,
  color,
  size = 16,
}: {
  name: IconName;
  color: string;
  size?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      style={{ flexShrink: 0, display: "block" }}
    >
      <path
        d={ICONS[name]}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function NetworkMark({
  kind,
  size,
  pal,
}: {
  kind: 0 | 1;
  size: number;
  pal: Pal;
}) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.3,
        background: kind === 0 ? (pal.dark ? "#EDEDEF" : "#16171A") : "#2F6F64",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <svg width={size * 0.62} height={size * 0.62} viewBox="0 0 16 16">
        <path
          d={
            kind === 0
              ? "M10.5 10.5 13 13M7.25 11.5a4.25 4.25 0 1 0 0-8.5 4.25 4.25 0 0 0 0 8.5z"
              : "M3.5 9.5 8 5l4.5 4.5M3.5 13 8 8.5l4.5 4.5"
          }
          fill="none"
          stroke={kind === 0 && pal.dark ? "#16171A" : "#fff"}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

function Media({
  w,
  h,
  accent,
  src,
  radius,
}: {
  w: number;
  h: number;
  accent: string;
  src?: string;
  radius: number;
}) {
  if (src) {
    return (
      <Img
        src={src}
        style={{
          width: w,
          height: h,
          objectFit: "cover",
          borderRadius: radius,
          display: "block",
        }}
      />
    );
  }
  const k = h / 100;
  const wide = w / h > 1.3;
  return (
    <div
      style={{
        width: w,
        height: h,
        borderRadius: radius,
        overflow: "hidden",
        position: "relative",
        background: "#0E0F12",
        outline: "1px solid rgba(255,255,255,0.1)",
        outlineOffset: -1,
      }}
    >
      <div
        style={{
          position: "absolute",
          left: "9%",
          top: wide ? "16%" : "14%",
          color: "#fff",
          fontSize: (wide ? 20 : 30) * k,
          fontWeight: 300,
          letterSpacing: "-0.04em",
          lineHeight: 1,
        }}
      >
        {wide ? "remocn 2.0" : "2.0"}
      </div>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            right: `${(wide ? 7 : 12) + i * (wide ? 13 : 24)}%`,
            bottom: "12%",
            width: wide ? "11%" : "18%",
            height: `${26 + i * 12}%`,
            borderRadius: 4 * k,
            background:
              i === 0 ? accent : `rgba(255,255,255,${0.16 - i * 0.04})`,
          }}
        />
      ))}
    </div>
  );
}

const T = {
  comp: 0,
  type: 10,
  cursorIn: 62,
  media: 90,
  time: 110,
  slot: 128,
  sched: 144,
  land: 160,
  toast: 184,
  end: 228,
};

export function SocialScheduler({
  text = DEFAULT_TEXT,
  brand = "remocn",
  handle = "remocn",
  mediaSrc,
  networks = ["Quill", "Guild"],
  slots = DEFAULT_SLOTS,
  pick = 1,
  queue = DEFAULT_QUEUE,
  weekLabel = "Oct 26 – 30, 2026",
  days = DEFAULT_DAYS,
  theme = "light",
  accent = "#3B5BFD",
  speed = 1,
  ground,
  groundParams,
}: SocialSchedulerProps) {
  const frame = useCurrentFrame() * speed;
  const { width: W, height: H, fps } = useVideoConfig();
  const pal = palette(theme);
  const tall = H > W * 1.2;
  const D = tall ? { w: 800, h: 1422 } : { w: 1280, h: 720 };
  const s = Math.min(W / D.w, H / D.h);
  const sp = (at: number, config: object) =>
    spring({ frame: frame - at, fps, config });

  const slot = slots[clamp(pick, 0, slots.length - 1)] ?? DEFAULT_SLOTS[1];
  const [slotDay, slotTime = ""] = slot.label.split(" ");
  const toMin = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    return (h || 0) * 60 + (m || 0);
  };
  const allDays = days.map((d) => d.split(" ")[0]);
  const pickedCol = Math.max(0, allDays.indexOf(slotDay));
  const visible = tall
    ? days.slice(
        clamp(pickedCol - 1, 0, Math.max(0, days.length - 3)),
        clamp(pickedCol - 1, 0, Math.max(0, days.length - 3)) + 3,
      )
    : days;
  const dayNames = visible.map((d) => d.split(" ")[0]);
  const col = Math.max(0, dayNames.indexOf(slotDay));

  const BOARD = tall
    ? { x: 40, y: 330, w: 720, h: 1000 }
    : { x: 150, y: 62, w: 980, h: 596 };
  const COMP = tall
    ? { x: 40, y: 250, w: 720, h: 1100 }
    : { x: 176, y: 78, w: 928, h: 564 };
  const BPAD = 24;
  const GAP = 12;
  const COL_W =
    (BOARD.w - BPAD * 2 - GAP * (dayNames.length - 1)) / dayNames.length;
  const COL_Y = 64 + 52;
  const CARD_H = 100;
  const CARD_GAP = 10;
  const colX = (i: number) => BPAD + i * (COL_W + GAP);

  const PAD = 28;
  const HEAD_H = 60;
  const FOOT_H = 76;
  const FOOT_Y = COMP.h - FOOT_H;
  const ED = { x: PAD, y: HEAD_H, w: tall ? COMP.w - PAD * 2 : 440 };
  const PV = tall
    ? { x: 0, y: 470, w: COMP.w, h: FOOT_Y - 470 }
    : {
        x: PAD + 440 + PAD,
        y: HEAD_H,
        w: COMP.w - (PAD + 440 + PAD),
        h: FOOT_Y - HEAD_H,
      };
  const TEXT_Y = ED.y + 80;
  const TEXT_H = tall ? 170 : 150;
  const MEDIA_Y = TEXT_Y + TEXT_H + 14;
  const TILE = 104;
  const SCHED = { x: COMP.w - PAD - 132, w: 132 };
  const TIME = { x: SCHED.x - 12 - 196, w: 196 };
  const BTN_Y = FOOT_Y + 18;
  const ROW_H = 44;
  const POP_H = 44 + slots.length * ROW_H + 8;
  const POP_Y = BTN_Y - 10 - POP_H;
  const PV_CARD = {
    x: PV.x + PAD,
    y: PV.y + 56,
    w: PV.w - PAD * 2,
  };

  const typed = typedCount(text, frame, T.type);
  const typing = typed < text.length;
  const caretOn = typing || Math.floor(frame / 15) % 2 === 0;
  const body = text.slice(0, typed);

  const compIn = sp(T.comp, HEAVY);
  const compInA = tween(frame, 0, 10);
  const compOut = tween(frame, T.sched + 4, T.sched + 16, exitEase);
  const boardFocus = sp(T.sched + 11, HEAVY);
  const mediaIn = sp(T.media + 2, CARD);
  const mediaGrow = sp(T.media + 2, MORPH);
  const popIn = sp(T.time + 2, CARD);
  const popA =
    tween(frame, T.time + 1, T.time + 7) *
    (1 - tween(frame, T.slot + 3, T.slot + 9, exitEase));
  const picked = frame >= T.slot + 2;
  const pickLabel = sp(T.slot + 2, CHIP);
  const fly = sp(T.land - 4, HEAVY);
  const shift = sp(T.land, CARD);
  const landed = frame >= T.land + 18;
  const ringA =
    tween(frame, T.land + 14, T.land + 22) *
    (1 - 0.6 * tween(frame, T.land + 50, T.land + 70));
  const toast = sp(T.toast, CARD);
  const toastA = tween(frame, T.toast, T.toast + 8);
  const cam = tween(frame, T.sched, T.end, camEase);

  const columns = dayNames.map((d) =>
    queue
      .filter((q) => q.day === d)
      .sort((a, b) => toMin(a.time) - toMin(b.time)),
  );
  const insertAt =
    columns[col]?.filter((q) => toMin(q.time) < toMin(slotTime)).length ?? 0;
  const target = {
    x: BOARD.x + colX(col),
    y: BOARD.y + COL_Y + insertAt * (CARD_H + CARD_GAP),
  };
  const flyFrom = {
    x: COMP.x + COMP.w / 2 - COL_W / 2,
    y: COMP.y + COMP.h * 0.42,
  };
  const flyPos = arcTo(flyFrom, target, fly, 0.2);

  const at = (x: number, y: number) => ({ x: COMP.x + x, y: COMP.y + y });
  const tilePt = at(ED.x + TILE / 2, MEDIA_Y + TILE / 2 + 6);
  const timePt = at(TIME.x + 64, BTN_Y + 24);
  const slotPt = at(TIME.x + 110, POP_Y + 44 + pick * ROW_H + 24);
  const schedPt = at(SCHED.x + 70, BTN_Y + 24);
  const restPt = {
    x: target.x + COL_W * 0.7,
    y: target.y + CARD_H + 60,
  };
  const startPt = { x: D.w * 0.82, y: D.h + 40 };
  const legs: [number, Pt, Pt][] = [
    [T.cursorIn, startPt, tilePt],
    [T.media + 6, tilePt, timePt],
    [T.time + 4, timePt, slotPt],
    [T.slot + 4, slotPt, schedPt],
    [T.sched + 8, schedPt, restPt],
  ];
  let cur: Pt = startPt;
  for (const [t0, a, b] of legs) {
    if (frame >= t0) cur = arcTo(a, b, sp(t0, CARD));
  }
  const clicks = [T.media, T.time, T.slot, T.sched];
  const pressOf = (c: number) =>
    clamp(sp(c - 3, CHIP) - sp(c + 2, CHIP), 0, 1.2);
  const press = Math.max(...clicks.map(pressOf));
  const cursorA =
    tween(frame, T.cursorIn, T.cursorIn + 6) *
    (1 - tween(frame, T.toast + 20, T.toast + 28, exitEase));

  const qCard = (post: QueuePost, hl = 0, isNew = false) => (
    <div
      style={{
        width: COL_W,
        height: CARD_H,
        boxSizing: "border-box",
        borderRadius: 12,
        background: pal.card,
        padding: "12px 14px",
        boxShadow: isNew
          ? `0 0 0 ${1 + hl}px ${withAlpha(accent, 0.3 + 0.6 * hl)}, 0 12px 28px -10px ${withAlpha(accent, 0.35 * hl)}`
          : pal.cardShadow,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span
          style={{
            fontSize: 16,
            color: pal.text,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {post.time}
        </span>
        <div style={{ flex: 1 }} />
        <NetworkMark kind={0} size={16} pal={pal} />
        <NetworkMark kind={1} size={16} pal={pal} />
      </div>
      <div
        style={{
          marginTop: 6,
          fontSize: 16,
          lineHeight: 1.35,
          color: pal.muted,
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {post.text}
      </div>
    </div>
  );

  const btn = (
    x: number,
    w: number,
    content: React.ReactNode,
    primary: boolean,
    c: number,
    enabled = true,
  ) => (
    <div
      style={{
        position: "absolute",
        left: x,
        top: BTN_Y,
        width: w,
        height: 44,
        boxSizing: "border-box",
        borderRadius: 10,
        display: "flex",
        alignItems: "center",
        justifyContent: primary ? "center" : "flex-start",
        gap: 10,
        padding: primary ? 0 : "0 14px",
        fontSize: 16,
        whiteSpace: "nowrap",
        color: primary ? "#fff" : pal.text,
        background: primary ? accent : "transparent",
        boxShadow: primary
          ? "inset 0 1px 0 rgba(255,255,255,0.18), 0 1px 2px rgba(17,19,24,0.2)"
          : `inset 0 0 0 1px ${pal.ring}`,
        opacity: enabled ? 1 : 0.45,
        transform: `scale(${1 - 0.04 * pressOf(c)})`,
      }}
    >
      {content}
    </div>
  );

  const thumbW = PV_CARD.w;
  const thumbH = Math.round(Math.min(thumbW * 0.5, tall ? 240 : 136));

  return (
    <AbsoluteFill
      style={{
        fontFamily,
        fontWeight: 400,
        overflow: "hidden",
        WebkitFontSmoothing: "antialiased",
        background: pal.dark ? "#04050C" : "#EEF0F6",
      }}
    >
      <GshGround
        preset={ground ?? (pal.dark ? "velvet-hour" : "glasswork")}
        params={groundParams}
        timeOffset={pal.dark ? 6 : 9}
        timeScale={0.3}
      />
      <AbsoluteFill style={{ background: pal.scrim }} />
      <div
        style={{
          position: "absolute",
          left: (W - D.w * s) / 2,
          top: (H - D.h * s) / 2,
          width: D.w,
          height: D.h,
          transformOrigin: "0 0",
          transform: `scale(${s})`,
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            transformOrigin: `${target.x + COL_W / 2}px ${target.y + CARD_H / 2}px`,
            transform: `scale(${1 + 0.035 * cam})`,
          }}
        >
          {tall ? (
            <div style={{ position: "absolute", left: 48, top: 64 }}>
              <div style={{ fontSize: 26, color: pal.stageMuted }}>
                {picked ? "Scheduled for" : "New post"}
              </div>
              <div
                style={{
                  marginTop: 6,
                  fontSize: 104,
                  fontWeight: 300,
                  letterSpacing: "-0.045em",
                  lineHeight: 1.05,
                  color: pal.stageText,
                  height: 112,
                  overflow: "hidden",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                <div
                  style={{
                    transform: `translateY(${(picked ? 1 - pickLabel : 1 - tween(frame, 4, 18)) * 100}%)`,
                  }}
                >
                  {picked ? slot.label : "Draft"}
                </div>
              </div>
            </div>
          ) : null}

          <div
            style={{
              position: "absolute",
              left: BOARD.x,
              top: BOARD.y,
              width: BOARD.w,
              height: BOARD.h,
              borderRadius: 16,
              background: pal.board,
              boxShadow: pal.winShadow,
              overflow: "hidden",
              opacity: tween(frame, 0, 8),
              transform: `scale(${0.95 + 0.05 * boardFocus})`,
              filter: `blur(${(1 - clamp(boardFocus, 0, 1)) * 5}px)`,
            }}
          >
            <div
              style={{
                height: 64,
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: `0 ${BPAD + 4}px`,
                borderBottom: `1px solid ${pal.line}`,
              }}
            >
              <span style={{ fontSize: 20, color: pal.text }}>Queue</span>
              <span style={{ fontSize: 16, color: pal.muted }}>
                {weekLabel}
              </span>
            </div>
            {visible.map((d, i) => {
              const posts = columns[i];
              const count = posts.length + (i === col && landed ? 1 : 0);
              return (
                <div key={d}>
                  <div
                    style={{
                      position: "absolute",
                      left: colX(i),
                      top: 72,
                      width: COL_W,
                      height: BOARD.h - 72 - BPAD,
                      borderRadius: 12,
                      background: pal.col,
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      left: colX(i) + 4,
                      top: 64 + 18,
                      fontSize: 16,
                      color: pal.text,
                      display: "flex",
                      gap: 8,
                    }}
                  >
                    {d}
                    <span
                      style={{
                        color: pal.faint,
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {count}
                    </span>
                  </div>
                  {posts.map((p, k) => {
                    const down = i === col && k >= insertAt ? shift : 0;
                    return (
                      <div
                        key={`${p.day}-${p.time}`}
                        style={{
                          position: "absolute",
                          left: colX(i),
                          top: COL_Y + (k + down) * (CARD_H + CARD_GAP),
                        }}
                      >
                        {qCard(p)}
                      </div>
                    );
                  })}
                </div>
              );
            })}
            <AbsoluteFill
              style={{
                background: pal.dim,
                opacity: 1 - clamp(boardFocus, 0, 1),
              }}
            />
          </div>

          {frame >= T.land - 4 ? (
            <div
              style={{
                position: "absolute",
                left: flyPos.x,
                top: flyPos.y,
                transform: `scale(${1 + 0.18 * (1 - clamp(fly, 0, 1))})`,
                transformOrigin: "0 0",
                opacity: tween(frame, T.land - 4, T.land + 2),
                zIndex: 3,
              }}
            >
              {qCard(
                { day: slotDay, time: slotTime, text, media: true },
                ringA,
                true,
              )}
            </div>
          ) : null}

          {compOut < 1 ? (
            <div
              style={{
                position: "absolute",
                left: COMP.x,
                top: COMP.y,
                width: COMP.w,
                height: COMP.h,
                opacity: compInA * (1 - compOut),
                transform: `translateY(${(1 - compIn) * 56 + compOut * 28}px) scale(${(0.96 + 0.04 * compIn) * (1 - 0.08 * compOut)})`,
                transformOrigin: "50% 60%",
                zIndex: 4,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: 18,
                  background: pal.comp,
                  boxShadow: pal.winShadow,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    left: PV.x,
                    top: PV.y,
                    width: PV.w,
                    height: PV.h,
                    background: pal.panel,
                    borderLeft: tall ? "none" : `1px solid ${pal.line}`,
                    borderTop: tall ? `1px solid ${pal.line}` : "none",
                  }}
                />
                <div
                  style={{
                    height: HEAD_H,
                    display: "flex",
                    alignItems: "center",
                    padding: `0 ${PAD}px`,
                    borderBottom: `1px solid ${pal.line}`,
                    fontSize: 18,
                    color: pal.text,
                  }}
                >
                  New post
                  <div style={{ flex: 1 }} />
                  <Icon name="x" color={pal.faint} size={18} />
                </div>

                <div
                  style={{
                    position: "absolute",
                    left: ED.x,
                    top: ED.y + 22,
                    display: "flex",
                    gap: 10,
                  }}
                >
                  {networks.map((nw, i) => (
                    <div
                      key={nw}
                      style={{
                        height: 36,
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "0 14px 0 8px",
                        borderRadius: 18,
                        boxShadow: `inset 0 0 0 1px ${pal.ring}`,
                        fontSize: 16,
                        color: pal.text,
                        opacity: tween(frame, 6 + i * 3, 16 + i * 3),
                      }}
                    >
                      <NetworkMark kind={i as 0 | 1} size={22} pal={pal} />
                      {nw}
                    </div>
                  ))}
                </div>

                <div
                  style={{
                    position: "absolute",
                    left: ED.x,
                    top: TEXT_Y,
                    width: ED.w,
                    height: TEXT_H,
                    fontSize: tall ? 24 : 21,
                    fontWeight: 300,
                    lineHeight: 1.45,
                    letterSpacing: "-0.01em",
                    color: pal.text,
                    textWrap: "pretty",
                  }}
                >
                  {body}
                  {caretOn ? (
                    <span
                      style={{
                        display: "inline-block",
                        width: 2,
                        height: "1.05em",
                        background: accent,
                        marginLeft: 2,
                        verticalAlign: "-0.15em",
                      }}
                    />
                  ) : null}
                </div>

                <div
                  style={{
                    position: "absolute",
                    left: ED.x,
                    top: MEDIA_Y,
                    display: "flex",
                    gap: 12,
                  }}
                >
                  {frame >= T.media + 2 ? (
                    <div
                      style={{
                        width: TILE * clamp(mediaGrow, 0, 1),
                        height: TILE,
                        transform: `scale(${0.7 + 0.3 * mediaIn})`,
                        transformOrigin: "0 50%",
                        opacity: clamp(mediaIn * 2, 0, 1),
                      }}
                    >
                      <Media
                        w={TILE}
                        h={TILE}
                        accent={accent}
                        src={mediaSrc}
                        radius={12}
                      />
                    </div>
                  ) : null}
                  <div
                    style={{
                      width: TILE,
                      height: TILE,
                      boxSizing: "border-box",
                      borderRadius: 12,
                      border: `1.5px dashed ${pal.ring}`,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      fontSize: 16,
                      color: pal.muted,
                      transform: `scale(${1 - 0.04 * pressOf(T.media)})`,
                    }}
                  >
                    <Icon name="image" color={pal.muted} size={20} />
                    Media
                  </div>
                </div>

                <div
                  style={{
                    position: "absolute",
                    left: PV.x + PAD,
                    top: PV.y + 24,
                    fontSize: 16,
                    color: pal.muted,
                  }}
                >
                  Preview
                </div>
                <div
                  style={{
                    position: "absolute",
                    left: PV_CARD.x,
                    top: PV_CARD.y,
                    width: PV_CARD.w,
                    boxSizing: "border-box",
                    borderRadius: 14,
                    background: pal.card,
                    boxShadow: pal.cardShadow,
                    padding: 16,
                  }}
                >
                  <div style={{ display: "flex", gap: 12 }}>
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 12,
                        background: accent,
                        color: "#fff",
                        fontSize: 19,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      {brand.slice(0, 1)}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 16, color: pal.text }}>
                        {brand}
                      </div>
                      <div style={{ fontSize: 16, color: pal.faint }}>
                        @{handle} · {picked ? slot.label : "now"}
                      </div>
                    </div>
                  </div>
                  <div
                    style={{
                      marginTop: 12,
                      fontSize: 16,
                      lineHeight: 1.45,
                      color: pal.text,
                      minHeight: 23,
                      textWrap: "pretty",
                    }}
                  >
                    {body}
                  </div>
                  <div
                    style={{
                      height: (thumbH + 14) * clamp(mediaGrow, 0, 1),
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        paddingTop: 14,
                        opacity: clamp(mediaIn, 0, 1),
                      }}
                    >
                      <Media
                        w={thumbW - 32}
                        h={thumbH}
                        accent={accent}
                        src={mediaSrc}
                        radius={10}
                      />
                    </div>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginTop: 14,
                      padding: "0 4px",
                    }}
                  >
                    {(["reply", "repost", "heart", "chart"] as IconName[]).map(
                      (ic) => (
                        <Icon key={ic} name={ic} color={pal.faint} size={18} />
                      ),
                    )}
                  </div>
                </div>

                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    top: FOOT_Y,
                    height: 1,
                    background: pal.line,
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    left: PAD,
                    top: BTN_Y + 12,
                    fontSize: 16,
                    color: pal.faint,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {typed} / 280
                </div>
                {btn(
                  TIME.x,
                  TIME.w,
                  <>
                    <Icon
                      name={picked ? "check" : "cal"}
                      color={picked ? accent : pal.muted}
                    />
                    <span
                      style={{
                        display: "inline-block",
                        transform: picked
                          ? `translateY(${(1 - pickLabel) * 8}px)`
                          : undefined,
                      }}
                    >
                      {picked ? slot.label : "Pick a time"}
                    </span>
                    <div style={{ flex: 1 }} />
                    <Icon name="chev" color={pal.faint} />
                  </>,
                  false,
                  T.time,
                )}
                {btn(SCHED.x, SCHED.w, "Schedule", true, T.sched, picked)}
              </div>

              {popA > 0 ? (
                <div
                  style={{
                    position: "absolute",
                    left: TIME.x,
                    top: POP_Y,
                    width: 290,
                    height: POP_H,
                    boxSizing: "border-box",
                    borderRadius: 14,
                    background: pal.pop,
                    boxShadow: pal.popShadow,
                    padding: "12px 6px 6px",
                    opacity: popA,
                    transform: `translateY(${(1 - popIn) * 10}px) scale(${0.94 + 0.06 * popIn})`,
                    transformOrigin: "20% 100%",
                  }}
                >
                  <div
                    style={{
                      fontSize: 16,
                      color: pal.faint,
                      padding: "2px 12px 10px",
                    }}
                  >
                    Suggested times
                  </div>
                  {slots.map((sl, i) => {
                    const hot = i === pick && frame >= T.slot - 8;
                    return (
                      <div
                        key={sl.label}
                        style={{
                          height: ROW_H,
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          padding: "0 12px",
                          borderRadius: 9,
                          background: hot
                            ? withAlpha(accent, pal.dark ? 0.16 : 0.08)
                            : "transparent",
                          fontSize: 16,
                          color: pal.text,
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        <Icon name="clock" color={hot ? accent : pal.faint} />
                        {sl.label}
                        <div style={{ flex: 1 }} />
                        {sl.hint ? (
                          <span
                            style={{
                              color: i === pick ? accent : pal.faint,
                            }}
                          >
                            {sl.hint}
                          </span>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </div>
          ) : null}

          {frame >= T.toast ? (
            <div
              style={{
                position: "absolute",
                left: BOARD.x + BOARD.w / 2,
                top: BOARD.y + BOARD.h - 26,
                transform: `translateX(-50%) translateY(${(1 - toast) * 24}px)`,
                opacity: toastA,
                display: "flex",
                alignItems: "center",
                gap: 12,
                height: 52,
                padding: "0 10px 0 18px",
                borderRadius: 14,
                background: pal.dark ? "#1E1F24" : "#16171A",
                boxShadow:
                  "0 0 0 1px rgba(255,255,255,0.08), 0 18px 40px -12px rgba(0,0,0,0.55)",
                color: "#F2F2F4",
                fontSize: 16,
                whiteSpace: "nowrap",
                zIndex: 5,
              }}
            >
              <Icon name="check" color={pal.dark ? pal.green : "#7EE2A8"} />
              Scheduled for {slot.label}
              <span
                style={{
                  marginLeft: 6,
                  padding: "6px 12px",
                  borderRadius: 9,
                  background: "rgba(255,255,255,0.08)",
                  color: "rgba(242,242,244,0.75)",
                }}
              >
                Undo
              </span>
            </div>
          ) : null}

          <div
            style={{
              opacity: cursorA,
              zIndex: 6,
              position: "absolute",
              inset: 0,
            }}
          >
            <Cursor x={cur.x} y={cur.y} scale={1 - 0.04 * press} />
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
}
