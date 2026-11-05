"use client";

import { loadFont } from "@remotion/google-fonts/HankenGrotesk";
import type React from "react";
import { useId } from "react";
import {
  AbsoluteFill,
  Easing,
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

export interface MoneySendProps {
  /** Full name; the first name is used in "Sent to …". */
  recipient?: string;
  /** Whole amount, typed digit by digit on the keypad. */
  amount?: number;
  /** ISO code, shown in the currency pill. USD, EUR, GBP and JPY get a symbol. */
  currency?: string;
  /** Letters are typed on the keyboard; a trailing emoji is picked from the suggestion bar. */
  note?: string;
  /** Three lines beside the phone: amount, note, sent. */
  lines?: [string, string, string];
  accent?: string;
  speed?: number;
  theme?: "light" | "dark";
  ground?: GshPresetId;
  groundParams?: Partial<GradientParams>;
}

const SW = 390;
const SH = 844;
const BEZEL = 12;
const BW = SW + BEZEL * 2;
const BH = SH + BEZEL * 2;

const KB_TOP = 524;
const PILL_Y = KB_TOP - 74;
const NOTE_Y = PILL_Y - 16 - 58;
const AMOUNT_Y = 222;
const RING_Y = 290;

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const ENTER = Easing.bezier(0.32, 0.72, 0, 1);
const LIGHT = Easing.bezier(0.22, 1, 0.36, 1);
const MOVE = Easing.bezier(0.65, 0, 0.35, 1);
const EXIT = Easing.bezier(0.55, 0, 1, 0.45);
const CAMERA = Easing.bezier(0.87, 0, 0.13, 1);
const HEAVY = { mass: 1, damping: 26, stiffness: 120 };
const CARD = { mass: 0.8, damping: 18, stiffness: 160 };
const CHIP = { mass: 0.5, damping: 12, stiffness: 200 };
const MORPH = { damping: 200 };

const SYMBOLS: Record<string, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  JPY: "¥",
};

const DARK = {
  screen: "#050506",
  text: "#f4f4f6",
  muted: "#8b8c94",
  field: "#16171a",
  kb: "#2b2b2d",
  key: "#6b6b6f",
  keyAlt: "#454548",
  keyShadow: "0 1px 0 rgba(0,0,0,0.5)",
  pill: "#f4f4f6",
  pillText: "#0a0a0b",
  pillOff: "#1d1e21",
  pillOffText: "#5d5e65",
  pad: "rgba(255,255,255,0.08)",
  touch: "rgba(255,255,255,0.18)",
  hair: "rgba(255,255,255,0.07)",
  frame:
    "linear-gradient(155deg,#55565c 0%,#2a2b2f 30%,#3d3e43 62%,#1f2023 100%)",
  copy: "#f4f4f6",
  copyMuted: "rgba(244,244,246,0.5)",
  phoneShadow:
    "0 50px 100px -20px rgba(0,0,0,0.7), 0 18px 36px -12px rgba(0,0,0,0.5)",
};
const LIGHT_PAL: typeof DARK = {
  screen: "#fbfbfa",
  text: "#151518",
  muted: "#77777e",
  field: "#f0f0ee",
  kb: "#d2d5da",
  key: "#ffffff",
  keyAlt: "#acb1ba",
  keyShadow: "0 1px 0 rgba(0,0,0,0.28)",
  pill: "#151518",
  pillText: "#ffffff",
  pillOff: "#e6e6e4",
  pillOffText: "#a4a4a9",
  pad: "rgba(21,21,24,0.06)",
  touch: "rgba(21,21,24,0.16)",
  hair: "rgba(21,21,24,0.07)",
  frame:
    "linear-gradient(155deg,#f1f1f3 0%,#c4c4ca 30%,#e2e2e6 62%,#b3b3ba 100%)",
  copy: "#151518",
  copyMuted: "rgba(21,21,24,0.48)",
  phoneShadow:
    "0 50px 90px -24px rgba(30,32,44,0.32), 0 14px 30px -10px rgba(30,32,44,0.18)",
};
type Palette = typeof DARK;

const NUM_KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "del"];
const NK_W = SW / 3;
const NK_H = 62;
const numRect = (i: number) => ({
  x: (i % 3) * NK_W,
  y: KB_TOP + 24 + Math.floor(i / 3) * (NK_H + 4),
  w: NK_W,
  h: NK_H,
});

interface QKey {
  id: string;
  x: number;
  y: number;
  w: number;
  label: string;
  alt: boolean;
}
const QW = 32.4;
const QH = 42;
const qRowY = (r: number) => KB_TOP + 52 + r * 54;
const QWERTY: QKey[] = (() => {
  const out: QKey[] = [];
  ["qwertyuiop", "asdfghjkl", "zxcvbnm"].forEach((row, r) => {
    const x0 = (SW - (row.length * QW + (row.length - 1) * 6)) / 2;
    row.split("").forEach((ch, i) => {
      out.push({
        id: ch,
        x: x0 + i * (QW + 6),
        y: qRowY(r),
        w: QW,
        label: ch,
        alt: false,
      });
    });
  });
  const y3 = qRowY(3);
  out.push(
    { id: "shift", x: 6, y: qRowY(2), w: 44, label: "", alt: true },
    { id: "del", x: SW - 50, y: qRowY(2), w: 44, label: "", alt: true },
    { id: "123", x: 6, y: y3, w: 44, label: "123", alt: true },
    { id: "emoji", x: 56, y: y3, w: 44, label: "", alt: true },
    { id: " ", x: 106, y: y3, w: SW - 204, label: "space", alt: false },
    { id: "return", x: SW - 92, y: y3, w: 86, label: "return", alt: true },
  );
  return out;
})();

const ICON = {
  back: "M19 12H5M11 6l-6 6 6 6",
  del: "M9 6h11a1 1 0 011 1v10a1 1 0 01-1 1H9l-6-6zM12.5 9.5l5 5M17.5 9.5l-5 5",
  left: "M14.5 6l-6 6 6 6",
  shift: "M12 4l8 8h-4.5v7h-7v-7H4z",
  smile:
    "M12 3a9 9 0 110 18 9 9 0 010-18zM8.5 14.5c1.8 2 5.2 2 7 0M9 9.5h.01M15 9.5h.01",
  chev: "M7 10l5 5 5-5",
  check: "M7 12.5l3.5 3.5L17 9",
  globe:
    "M12 3a9 9 0 110 18 9 9 0 010-18zM3 12h18M12 3c2.5 2.6 3.6 5.6 3.6 9s-1.1 6.4-3.6 9c-2.5-2.6-3.6-5.6-3.6-9s1.1-6.4 3.6-9z",
  mic: "M12 3a3 3 0 013 3v6a3 3 0 01-6 0V6a3 3 0 013-3zM5.5 11a6.5 6.5 0 0013 0M12 17.5V21",
  x: "M9 9l6 6M15 9l-6 6",
  share: "M12 15V4M8 8l4-4 4 4M5 13v6h14v-6",
};

function balloon(w: number, kw: number, kh: number) {
  const dx = (w - kw) / 2;
  const head = 50;
  const neck = 12;
  const h = head + neck + kh;
  return {
    h,
    d: `M0 9Q0 0 9 0H${w - 9}Q${w} 0 ${w} 9V${head}C${w} ${head + neck * 0.6} ${w - dx} ${head + neck * 0.4} ${w - dx} ${head + neck}V${h - 6}Q${w - dx} ${h} ${w - dx - 6} ${h}H${dx + 6}Q${dx} ${h} ${dx} ${h - 6}V${head + neck}C${dx} ${head + neck * 0.4} 0 ${head + neck * 0.6} 0 ${head}Z`,
  };
}

function Glyph({
  d,
  size = 20,
  color,
  sw = 1.5,
}: {
  d: string;
  size?: number;
  color: string;
  sw?: number;
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
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

function splitNote(note: string) {
  const chars = Array.from(note);
  const idx = chars.findIndex((ch) => (ch.codePointAt(0) ?? 0) > 0x2100);
  if (idx < 0) return { word: chars, emoji: "" };
  return {
    word: Array.from(chars.slice(0, idx).join("").trimEnd()),
    emoji: chars.slice(idx).join("").trim(),
  };
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

function Phone({ children, c }: { children: React.ReactNode; c: Palette }) {
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
          inset: 3.5,
          borderRadius: 63.5,
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
          background: c.screen,
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
            background: c.text,
            zIndex: 40,
          }}
        />
      </div>
    </div>
  );
}

function Avatar({ initials, size }: { initials: string; size: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        background: "#c98a68",
        boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.08)",
        color: "#fff8f2",
        fontSize: size * 0.36,
        fontWeight: 400,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      {initials}
    </div>
  );
}

function Flag({ currency, color }: { currency: string; color: string }) {
  const id = `flag${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  if (currency !== "USD") {
    return (
      <div
        style={{
          width: 20,
          height: 20,
          borderRadius: 10,
          background: color,
          color: "#fff",
          fontSize: 11,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {SYMBOLS[currency] ?? currency[0]}
      </div>
    );
  }
  return (
    <svg width={20} height={20} viewBox="0 0 20 20">
      <defs>
        <clipPath id={id}>
          <circle cx={10} cy={10} r={10} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id})`}>
        <rect width={20} height={20} fill="#fff" />
        {[0, 2, 4, 6, 8, 10, 12].map((i) => (
          <rect key={i} y={i * 1.54} width={20} height={1.54} fill="#d22f3c" />
        ))}
        <rect width={10} height={10.8} fill="#2a3b84" />
      </g>
    </svg>
  );
}

export function MoneySend({
  recipient = "Maya Chen",
  amount = 120,
  currency = "USD",
  note = "Dinner 🍜",
  lines = ["Type any amount.", "Say what it’s for.", "Sent in a second."],
  accent = "#3B5BFD",
  speed = 1,
  theme = "dark",
  ground,
  groundParams,
}: MoneySendProps) {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const f = frame * speed;
  const dark = theme !== "light";
  const c: Palette = dark ? DARK : LIGHT_PAL;
  const tall = height > width;
  const W = tall ? 720 : 1280;
  const H = tall ? 1280 : 720;
  const u = Math.min(width / W, height / H);
  const k = tall ? (H * 0.74) / BH : (H * 0.94) / BH;
  const phoneCx = tall ? W / 2 : W * 0.665;
  const phoneCy = tall ? H - 36 - (BH * k) / 2 : H / 2;

  const sp = (at: number, config: typeof CARD | typeof MORPH = CARD) =>
    spring({ frame: f - at, fps, config });
  const pressAt = (at: number) =>
    spring({ frame: f - at, fps, config: CHIP }) -
    spring({ frame: f - at - 4, fps, config: CHIP });

  const digits = String(Math.max(1, Math.round(amount))).slice(0, 6);
  const symbol = SYMBOLS[currency] ?? "";
  const { word, emoji } = splitNote(note);
  const first = recipient.split(" ")[0];
  const initials = recipient
    .split(" ")
    .map((s) => s[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const keyTimes = digits.split("").map((_, i) => 30 + i * 11);
  const NOTE_TAP = keyTimes[keyTimes.length - 1] + 22;
  const KB_SWAP = NOTE_TAP + 3;
  const gap = Math.min(5, 36 / Math.max(1, word.length));
  const letterTimes = word.map((_, i) => KB_SWAP + 18 + i * gap);
  const typeEnd = letterTimes.length
    ? letterTimes[letterTimes.length - 1]
    : KB_SWAP + 12;
  const SUGG_TAP = emoji ? typeEnd + 11 : typeEnd;
  const SEND_TAP = SUGG_TAP + 18;
  const FLY = SEND_TAP + 3;
  const PROG = SEND_TAP + 6;
  const DONE = PROG + 30;

  const nTyped = keyTimes.filter((t) => f >= t).length;
  const nLetters = letterTimes.filter((t) => f >= t).length;
  const emojiIn = emoji ? sp(SUGG_TAP, CHIP) : 0;
  const noteFocused = f >= NOTE_TAP;

  const numCenter = (d: string) => {
    const r = numRect(d === "0" ? 10 : Number(d) - 1);
    return { x: r.x + r.w / 2, y: r.y + r.h / 2 + 4 };
  };
  const letterKey = (ch: string) =>
    QWERTY.find((q) => q.id === ch.toLowerCase()) ??
    (QWERTY.find((q) => q.id === " ") as QKey);
  const presses = [
    ...digits.split("").map((d, i) => ({ t: keyTimes[i], ...numCenter(d) })),
    { t: NOTE_TAP, x: SW / 2 + 50, y: NOTE_Y + 30 },
    ...word.map((ch, i) => {
      const q = letterKey(ch);
      return { t: letterTimes[i], x: q.x + q.w / 2, y: q.y + QH / 2 + 6 };
    }),
    ...(emoji ? [{ t: SUGG_TAP, x: SW / 2, y: KB_TOP + 24 }] : []),
    { t: SEND_TAP, x: SW / 2 + 36, y: PILL_Y + 28 },
  ];
  const path = [
    { t: presses[0].t - 16, x: presses[0].x + 70, y: presses[0].y + 120 },
    ...presses,
  ];
  let touch = { x: path[0].x, y: path[0].y };
  for (let i = 0; i < path.length - 1; i++) {
    const a = path[i];
    const b = path[i + 1];
    const start = a.t + 1.5;
    const end = Math.max(start + 1, b.t - 1);
    if (f >= start) {
      const p = Math.min(1, (f - start) / (end - start));
      const e = MOVE(p);
      const dist = Math.hypot(b.x - a.x, b.y - a.y);
      const lift = Math.sin(Math.PI * e) * Math.min(28, dist * 0.18);
      const nx = dist ? -(b.y - a.y) / dist : 0;
      const ny = dist ? (b.x - a.x) / dist : 0;
      touch = {
        x: a.x + (b.x - a.x) * e + nx * lift,
        y: a.y + (b.y - a.y) * e + ny * lift,
      };
    }
  }
  const touchOpacity = interpolate(
    f,
    [path[0].t, path[0].t + 8, SEND_TAP + 2, SEND_TAP + 7],
    [0, 1, 1, 0],
    clamp,
  );
  const touchPress = Math.max(...presses.map((p) => pressAt(p.t)));

  const kbOut = interpolate(f, [KB_SWAP, KB_SWAP + 8], [0, 1], {
    ...clamp,
    easing: EXIT,
  });
  const qIn = f >= KB_SWAP + 5 ? sp(KB_SWAP + 5, MORPH) : 0;
  const fly = sp(FLY, MORPH);
  const kbDown = interpolate(f, [SEND_TAP + 2, SEND_TAP + 11], [0, 1], {
    ...clamp,
    easing: ENTER,
  });
  const qY = (1 - qIn) * (SH - KB_TOP) + kbDown * (SH - KB_TOP);
  const caps = nLetters === 0 && word[0] === word[0]?.toUpperCase();
  const lastLetter = nLetters - 1;

  const rise = spring({ frame: f, fps, config: HEAVY });
  const camS = interpolate(f, [16, 70, FLY, FLY + 50], [1, 1.03, 1.03, 1.05], {
    ...clamp,
    easing: CAMERA,
  });

  const enabled = interpolate(f, [keyTimes[0], keyTimes[0] + 6], [0, 1], {
    ...clamp,
    easing: ENTER,
  });
  const sendPress = pressAt(SEND_TAP);
  const away = interpolate(f, [SEND_TAP + 2, SEND_TAP + 9], [0, 1], {
    ...clamp,
    easing: EXIT,
  });
  const lbl = interpolate(f, [NOTE_TAP, NOTE_TAP + 6], [0, 1], {
    ...clamp,
    easing: ENTER,
  });
  const typed = nTyped === 0 ? "0" : digits.slice(0, nTyped);
  const amountChars = Number(typed)
    .toLocaleString("en-US")
    .split("")
    .reduce<{ ch: string; di: number }[]>((acc, ch) => {
      const di = acc.filter((a) => a.di >= 0).length;
      acc.push({ ch, di: ch === "," ? -1 : di });
      return acc;
    }, []);
  const money = (n: number) =>
    `${symbol}${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}${symbol ? "" : ` ${currency}`}`;
  const caretOn = f < NOTE_TAP && Math.floor((f + 6) / 14) % 2 === 0;

  const ringIn = sp(PROG, CARD);
  const arc = interpolate(f, [PROG, DONE - 4, DONE + 2], [0.12, 0.7, 1], {
    ...clamp,
    easing: MOVE,
  });
  const spin = f < DONE ? (f - PROG) * 11 : (DONE - PROG) * 11;
  const disc = sp(DONE + 1, CHIP);
  const tick = interpolate(f, [DONE + 5, DONE + 15], [0, 1], {
    ...clamp,
    easing: LIGHT,
  });
  const pulse = interpolate(f, [DONE + 6, DONE + 40], [0, 1], {
    ...clamp,
    easing: LIGHT,
  });
  const title = sp(PROG + 4);
  const swap = sp(DONE + 4, CHIP);
  const sub = sp(DONE + 8);
  const done = sp(DONE + 24);
  const receipt: [string, string][] = [
    ["Amount", money(Number(digits))],
    ["From", `Main · ${currency}`],
    ["Arrives", "Instantly"],
    ["Fee", money(0)],
  ];
  const rows = receipt.map((_, i) => sp(DONE + 12 + i * 3));
  const enter = (v: number, dy = 14): React.CSSProperties => ({
    opacity: Math.min(1, v * 1.4),
    transform: `translateY(${(1 - v) * dy}px)`,
  });

  const beats = [0, NOTE_TAP, PROG];
  const copyLine = (i: number) => {
    const inAt = beats[i] + (i === 0 ? 6 : 0);
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

  const keyStyle = (
    x: number,
    y: number,
    w: number,
    h: number,
    bg: string,
  ): React.CSSProperties => ({
    position: "absolute",
    left: x,
    top: y,
    width: w,
    height: h,
    borderRadius: 7,
    background: bg,
    boxShadow: c.keyShadow,
    color: c.text,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  });

  return (
    <AbsoluteFill style={{ fontFamily, overflow: "hidden" }}>
      <GshGround
        preset={ground ?? (dark ? "cobalt-rise" : "paper-crease")}
        params={groundParams}
        timeOffset={dark ? 4 : 6}
        timeScale={0.35}
      />
      <AbsoluteFill
        style={{
          background: dark ? "rgba(2,3,8,0.32)" : "rgba(243,241,237,0.35)",
        }}
      />
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
            left: tall ? 56 : 92,
            top: tall ? 88 : H / 2 - 80,
            width: tall ? W - 112 : 500,
            height: 160,
            fontSize: tall ? 60 : 72,
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
                top: 58,
                left: 20,
                right: 20,
                height: 44,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                opacity: 1 - away,
                transform: `translateY(${-away * 8}px)`,
              }}
            >
              <Glyph d={ICON.back} size={24} color={c.text} />
              <div style={{ textAlign: "center", lineHeight: 1.25 }}>
                <div style={{ fontSize: 17, color: c.text }}>{recipient}</div>
                <div style={{ fontSize: 14, color: c.muted }}>
                  @{recipient.toLowerCase().replace(/[^a-z]+/g, "")}
                </div>
              </div>
              <Avatar initials={initials} size={36} />
            </div>
            <div
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: AMOUNT_Y - 50,
                height: 100,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 92,
                fontWeight: 300,
                letterSpacing: "-0.05em",
                fontVariantNumeric: "tabular-nums",
                color: nTyped ? c.text : c.muted,
                transform: `translateY(${fly * (118 - AMOUNT_Y)}px) scale(${1 - fly * 0.5})`,
                zIndex: 5,
              }}
            >
              <span>{symbol}</span>
              {amountChars.map(({ ch, di }, i) => {
                const pop = nTyped && di >= 0 ? sp(keyTimes[di], CHIP) : 1;
                return (
                  <span
                    key={i}
                    style={{
                      display: "inline-block",
                      width: `${(ch === "," ? 0.26 : 0.56) * Math.min(1, pop * 1.3)}em`,
                      textAlign: "center",
                      transform: `translateY(${(1 - pop) * 18}px) scale(${0.88 + pop * 0.12})`,
                      opacity: Math.min(1, pop * 1.6),
                    }}
                  >
                    {ch}
                  </span>
                );
              })}
              <span
                style={{
                  width: 3,
                  height: 70,
                  marginLeft: 6,
                  borderRadius: 2,
                  background: accent,
                  opacity: caretOn ? 1 : 0,
                }}
              />
            </div>
            <div
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: AMOUNT_Y + 56,
                display: "flex",
                justifyContent: "center",
                opacity: 1 - away,
                transform: `translateY(${-away * 10}px)`,
              }}
            >
              <div
                style={{
                  height: 36,
                  padding: "0 12px 0 8px",
                  borderRadius: 18,
                  background: c.field,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 15,
                  color: c.text,
                }}
              >
                <Flag currency={currency} color={c.muted} />
                Main · {currency}
                <span style={{ color: c.muted }}>No fees</span>
                <Glyph d={ICON.chev} size={16} color={c.muted} />
              </div>
            </div>
            <div
              style={{
                position: "absolute",
                left: 16,
                right: 16,
                top: NOTE_Y,
                height: 58,
                borderRadius: 14,
                background: c.field,
                opacity: 1 - away,
                transform: `translateY(${-away * 10}px) scale(${1 - pressAt(NOTE_TAP) * 0.03})`,
              }}
            >
              <span
                style={{
                  position: "absolute",
                  left: 16,
                  top: 18,
                  fontSize: 17,
                  lineHeight: "22px",
                  color: c.muted,
                  transformOrigin: "0 0",
                  transform: `translateY(${-lbl * 10}px) scale(${1 - lbl * 0.3})`,
                }}
              >
                Add a note
              </span>
              {noteFocused ? (
                <span
                  style={{
                    position: "absolute",
                    left: 16,
                    top: 26,
                    fontSize: 17,
                    lineHeight: "22px",
                    color: c.text,
                    display: "flex",
                    alignItems: "center",
                    opacity: lbl,
                  }}
                >
                  {word.slice(0, nLetters).join("")}
                  {emojiIn > 0 ? (
                    <span
                      style={{
                        display: "inline-block",
                        marginLeft: 5,
                        transform: `scale(${0.5 + emojiIn * 0.5})`,
                        opacity: Math.min(1, emojiIn * 2),
                      }}
                    >
                      {emoji}
                    </span>
                  ) : null}
                  <span
                    style={{
                      width: 2,
                      height: 21,
                      marginLeft: 1,
                      borderRadius: 1,
                      background: accent,
                      opacity: Math.floor(f / 14) % 2 === 0 ? 1 : 0,
                    }}
                  />
                </span>
              ) : null}
              <div
                style={{
                  position: "absolute",
                  right: 16,
                  top: 19,
                  width: 20,
                  height: 20,
                  borderRadius: 10,
                  background: c.muted,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: nLetters > 0 ? 0.6 : 0,
                }}
              >
                <Glyph d={ICON.x} size={14} color={c.field} sw={2} />
              </div>
            </div>
            <div
              style={{
                position: "absolute",
                left: 16,
                right: 16,
                top: PILL_Y,
                height: 56,
                borderRadius: 28,
                background: interpolateColors(
                  enabled,
                  [0, 1],
                  [c.pillOff, c.pill],
                ),
                color: interpolateColors(
                  enabled,
                  [0, 1],
                  [c.pillOffText, c.pillText],
                ),
                fontSize: 17,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transform: `translateY(${-away * 10}px) scale(${1 - sendPress * 0.04})`,
                opacity: 1 - away,
              }}
            >
              Send to {first}
            </div>
            {NUM_KEYS.map((d, i) => {
              const r = numRect(i);
              const idx = digits
                .split("")
                .findIndex(
                  (x, j) =>
                    x === d && f >= keyTimes[j] - 1 && f < keyTimes[j] + 10,
                );
              const p = idx >= 0 ? pressAt(keyTimes[idx]) : 0;
              return (
                <div
                  key={d}
                  style={{
                    position: "absolute",
                    left: r.x,
                    top: r.y + kbOut * (SH - KB_TOP),
                    width: r.w,
                    height: r.h,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: c.text,
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      width: 64,
                      height: 64,
                      borderRadius: 32,
                      background: c.pad,
                      opacity: Math.min(1, p * 3),
                      transform: `scale(${0.7 + p * 0.3})`,
                    }}
                  />
                  {d === "del" ? (
                    <Glyph d={ICON.left} size={26} color={c.text} />
                  ) : (
                    <span
                      style={{
                        position: "relative",
                        fontSize: 30,
                        fontWeight: 300,
                        transform: `scale(${1 - p * 0.04})`,
                      }}
                    >
                      {d === "." ? "·" : d}
                    </span>
                  )}
                </div>
              );
            })}
            {qIn > 0 ? (
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  top: KB_TOP,
                  bottom: 0,
                  background: c.kb,
                  transform: `translateY(${qY}px)`,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    height: 44,
                    alignItems: "center",
                    fontSize: 16,
                    color: c.text,
                  }}
                >
                  {[
                    `“${word.slice(0, nLetters).join("")}”`,
                    nLetters >= 3 && emoji ? emoji : word.join(""),
                    "with",
                  ].map((s, i) => (
                    <div
                      key={i}
                      style={{
                        flex: 1,
                        textAlign: "center",
                        fontSize: i === 1 && nLetters >= 3 ? 22 : 16,
                        borderLeft:
                          i > 0
                            ? `1px solid ${c.keyAlt}`
                            : "1px solid transparent",
                        height: 24,
                        lineHeight: "24px",
                        opacity: i === 1 ? 1 - pressAt(SUGG_TAP) * 0.5 : 0.9,
                      }}
                    >
                      {s}
                    </div>
                  ))}
                </div>
                {QWERTY.map((q) => {
                  const hit = word.findIndex(
                    (ch, i) =>
                      letterKey(ch).id === q.id &&
                      f >= letterTimes[i] - 1 &&
                      f < letterTimes[i] + 7,
                  );
                  const p = hit >= 0 ? pressAt(letterTimes[hit]) : 0;
                  const shiftOn = q.id === "shift" && caps;
                  return (
                    <div
                      key={q.id}
                      style={{
                        ...keyStyle(
                          q.x,
                          q.y - KB_TOP,
                          q.w,
                          QH,
                          shiftOn ? c.key : q.alt ? c.keyAlt : c.key,
                        ),
                        filter:
                          p > 0.3 && q.id === " " ? "brightness(1.3)" : "none",
                        fontSize: q.alt || q.id === " " ? 15 : 22,
                      }}
                    >
                      {q.id === "shift" ? (
                        <Glyph d={ICON.shift} size={20} color={c.text} />
                      ) : q.id === "del" ? (
                        <Glyph d={ICON.del} size={22} color={c.text} />
                      ) : q.id === "emoji" ? (
                        <Glyph d={ICON.smile} size={22} color={c.text} />
                      ) : caps && !q.alt ? (
                        q.label.toUpperCase()
                      ) : (
                        q.label
                      )}
                    </div>
                  );
                })}
                {[ICON.globe, ICON.mic].map((d, i) => (
                  <div
                    key={d}
                    style={{
                      position: "absolute",
                      left: i ? SW - 46 : 22,
                      top: qRowY(3) - KB_TOP + QH + 18,
                    }}
                  >
                    <Glyph d={d} size={24} color={c.text} />
                  </div>
                ))}
                {lastLetter >= 0 && pressAt(letterTimes[lastLetter]) > 0.05
                  ? (() => {
                      const q = letterKey(word[lastLetter]);
                      if (q.id === " ") return null;
                      const bw = q.w + 22;
                      const bl = balloon(bw, q.w, QH);
                      return (
                        <div
                          style={{
                            position: "absolute",
                            left: q.x - 11,
                            top: q.y - KB_TOP + QH - bl.h,
                            width: bw,
                            height: bl.h,
                            filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.3))",
                          }}
                        >
                          <svg
                            width={bw}
                            height={bl.h}
                            style={{ position: "absolute" }}
                          >
                            <path d={bl.d} fill={c.key} />
                          </svg>
                          <div
                            style={{
                              position: "absolute",
                              left: 0,
                              right: 0,
                              top: 4,
                              height: 44,
                              color: c.text,
                              fontSize: 32,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            {word[lastLetter]}
                          </div>
                        </div>
                      );
                    })()
                  : null}
              </div>
            ) : null}
            {f >= PROG ? (
              <>
                <div
                  style={{
                    position: "absolute",
                    left: SW / 2 - 60,
                    top: RING_Y - 60,
                    width: 120,
                    height: 120,
                    transform: `scale(${0.86 + ringIn * 0.14})`,
                    opacity: Math.min(1, ringIn * 1.6),
                  }}
                >
                  <svg
                    width={120}
                    height={120}
                    viewBox="0 0 120 120"
                    style={{
                      position: "absolute",
                      inset: 0,
                      overflow: "visible",
                    }}
                  >
                    <circle
                      cx={60}
                      cy={60}
                      r={46 + pulse * 40}
                      fill="none"
                      stroke={accent}
                      strokeWidth={1.5}
                      opacity={(1 - pulse) * 0.4 * (pulse > 0 ? 1 : 0)}
                    />
                    <circle
                      cx={60}
                      cy={60}
                      r={46}
                      fill="none"
                      stroke={c.field}
                      strokeWidth={3}
                    />
                    <circle
                      cx={60}
                      cy={60}
                      r={46}
                      fill="none"
                      stroke={accent}
                      strokeWidth={3}
                      strokeLinecap="round"
                      pathLength={1}
                      strokeDasharray={`${arc} 1`}
                      transform={`rotate(${spin - 90} 60 60)`}
                    />
                  </svg>
                  <div style={{ position: "absolute", left: 22, top: 22 }}>
                    <Avatar initials={initials} size={76} />
                  </div>
                  <div
                    style={{
                      position: "absolute",
                      left: 14,
                      top: 14,
                      width: 92,
                      height: 92,
                      borderRadius: 46,
                      background: accent,
                      transform: `scale(${0.5 + disc * 0.5})`,
                      opacity: Math.min(1, disc * 2.5),
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <svg width={52} height={52} viewBox="0 0 24 24" fill="none">
                      <path
                        d={ICON.check}
                        stroke="#fff"
                        strokeWidth={1.8}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        pathLength={1}
                        strokeDasharray={1}
                        strokeDashoffset={1 - tick}
                      />
                    </svg>
                  </div>
                </div>
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    top: RING_Y + 82,
                    textAlign: "center",
                    fontSize: 30,
                    fontWeight: 300,
                    letterSpacing: "-0.03em",
                    color: c.text,
                    ...enter(title),
                  }}
                >
                  <span
                    style={{
                      display: "inline-block",
                      opacity: f < DONE + 4 ? 0.55 : Math.min(1, swap * 1.5),
                      transform: `scale(${f < DONE + 4 ? 1 : 0.92 + swap * 0.08})`,
                    }}
                  >
                    {f < DONE + 4 ? `Sending to ${first}…` : `Sent to ${first}`}
                  </span>
                </div>
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    top: RING_Y + 124,
                    textAlign: "center",
                    fontSize: 15,
                    color: c.muted,
                    ...enter(sub),
                  }}
                >
                  {note} · Just now
                </div>
                <div
                  style={{
                    position: "absolute",
                    left: 16,
                    right: 16,
                    top: RING_Y + 170,
                    borderRadius: 16,
                    background: c.field,
                    padding: "2px 16px",
                    opacity: Math.min(1, rows[0] * 2),
                  }}
                >
                  {receipt.map(([kk, v], i) => (
                    <div
                      key={kk}
                      style={{
                        height: 46,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        fontSize: 15,
                        boxShadow: i ? `inset 0 1px 0 ${c.hair}` : "none",
                        ...enter(rows[i], 10),
                      }}
                    >
                      <span style={{ color: c.muted }}>{kk}</span>
                      <span
                        style={{
                          color: c.text,
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        {v}
                      </span>
                    </div>
                  ))}
                </div>
                <div
                  style={{
                    position: "absolute",
                    left: 16,
                    right: 16,
                    bottom: 40,
                    display: "flex",
                    gap: 10,
                    ...enter(done, 24),
                  }}
                >
                  <div
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: 28,
                      background: c.field,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Glyph d={ICON.share} size={22} color={c.text} />
                  </div>
                  <div
                    style={{
                      flex: 1,
                      height: 56,
                      borderRadius: 28,
                      background: c.pill,
                      color: c.pillText,
                      fontSize: 17,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    Done
                  </div>
                </div>
              </>
            ) : null}
            <div
              style={{
                position: "absolute",
                left: touch.x - 22,
                top: touch.y - 22,
                width: 44,
                height: 44,
                borderRadius: 22,
                background: c.touch,
                boxShadow:
                  "inset 0 0 0 1.5px rgba(255,255,255,0.7), 0 2px 10px rgba(0,0,0,0.2)",
                opacity: touchOpacity,
                transform: `scale(${1 - touchPress * 0.12})`,
                zIndex: 35,
              }}
            />
          </Phone>
        </div>
      </div>
    </AbsoluteFill>
  );
}
