"use client";

import { loadFont } from "@remotion/google-fonts/InstrumentSans";
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
  weights: ["400"],
  subsets: ["latin"],
});

export interface CouponLineItem {
  name: string;
  detail: string;
  amount: number;
  /** Kept for API compatibility; the summary no longer draws item tiles. */
  mark?: string;
}

export interface CouponApplyProps {
  merchant?: string;
  items?: CouponLineItem[];
  /** First attempt, rejected with a shake. Set to "" to skip the invalid beat. */
  invalidCode?: string;
  /** Code that works. If it starts with `invalidCode`, only the rest is typed on retry. */
  code?: string;
  percentOff?: number;
  currency?: string;
  payLabel?: string;
  email?: string;
  cardholder?: string;
  theme?: "light" | "dark";
  accent?: string;
  speed?: number;
  ground?: GshPresetId;
  groundParams?: Partial<GradientParams>;
}

const DEFAULT_ITEMS: CouponLineItem[] = [
  { name: "Lumen Pro", detail: "Billed yearly", amount: 180 },
  { name: "Extra seats", detail: "Qty 2 · $30.00 each", amount: 60 },
];

const HEAVY = { mass: 1, damping: 26, stiffness: 120 };
const CARD = { mass: 0.8, damping: 18, stiffness: 160 };
const CHIP = { mass: 0.5, damping: 12, stiffness: 200 };
const MORPH = { damping: 200 };

const ENTER = Easing.bezier(0.32, 0.72, 0, 1);
const ENTER2 = Easing.bezier(0.22, 1, 0.36, 1);
const MOVE = Easing.bezier(0.65, 0, 0.35, 1);
const EXIT = Easing.bezier(0.55, 0, 1, 0.45);
const CAMERA = Easing.bezier(0.87, 0, 0.13, 1);

const clampOpts = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;
const tween = (f: number, a: number, b: number, easing = ENTER) =>
  interpolate(f, [a, b], [0, 1], { ...clampOpts, easing });
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

function withAlpha(hex: string, alpha: number) {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.replace(/./g, (c) => c + c) : h.slice(0, 6);
  const n = Number.parseInt(full, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}
const fmt = (n: number, cur: string) =>
  `${cur}${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

interface Pal {
  dark: boolean;
  scrim: string;
  card: string;
  side: string;
  cardShadow: string;
  text: string;
  muted: string;
  faint: string;
  line: string;
  field: string;
  fieldRing: string;
  btn2: string;
  green: string;
  red: string;
  chip: string;
}

function palette(theme: "light" | "dark"): Pal {
  return theme === "dark"
    ? {
        dark: true,
        scrim: "rgba(3,5,12,0.34)",
        card: "#101114",
        side: "#15161A",
        cardShadow:
          "0 0 0 1px rgba(255,255,255,0.08), inset 0 1px 0 rgba(255,255,255,0.06), 0 24px 60px -18px rgba(0,0,0,0.7), 0 8px 18px -8px rgba(0,0,0,0.5)",
        text: "#F2F2F4",
        muted: "#A1A2AA",
        faint: "#6D6E77",
        line: "rgba(255,255,255,0.08)",
        field: "#0C0D10",
        fieldRing: "rgba(255,255,255,0.11)",
        btn2: "#1D1E23",
        green: "#45C98E",
        red: "#FF6B6F",
        chip: "rgba(255,255,255,0.07)",
      }
    : {
        dark: false,
        scrim: "rgba(246,245,242,0.3)",
        card: "#FFFFFF",
        side: "#F8F8F6",
        cardShadow:
          "0 0 0 1px rgba(20,20,24,0.06), 0 1px 3px rgba(20,20,24,0.05), 0 12px 28px -12px rgba(20,20,24,0.14), 0 36px 70px -34px rgba(20,20,24,0.22)",
        text: "#17171A",
        muted: "#5F6068",
        faint: "#9A9BA2",
        line: "rgba(20,20,24,0.08)",
        field: "#FFFFFF",
        fieldRing: "rgba(20,20,24,0.13)",
        btn2: "#F3F3F2",
        green: "#0E8051",
        red: "#D42F3A",
        chip: "rgba(20,20,24,0.05)",
      };
}

const ICONS = {
  lock: "M4.25 7.25h7.5v6h-7.5zM5.75 7.25V5.5a2.25 2.25 0 0 1 4.5 0v1.75",
  tag: "M2.75 2.75h5l5.5 5.5-5 5-5.5-5.5zM5.6 5.6h.01",
  x: "M5 5l6 6M11 5l-6 6",
  alert: "M8 14a6 6 0 1 0 0-12 6 6 0 0 0 0 12zM8 5v3.5M8 10.9h.01",
  card: "M2.25 4.25h11.5v7.5H2.25zM2.25 6.75h11.5M4.5 9.75h2",
  back: "M9.5 4 5.5 8l4 4",
} as const;

function Icon({
  name,
  color,
  size = 16,
}: {
  name: keyof typeof ICONS;
  color: string;
  size?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      style={{ display: "block", flexShrink: 0 }}
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

interface Pt {
  x: number;
  y: number;
}
interface Key extends Pt {
  t: number;
}
function pathAt(keys: Key[], f: number): Pt {
  if (f <= keys[0].t) return keys[0];
  for (let i = 1; i < keys.length; i++) {
    const a = keys[i - 1];
    const b = keys[i];
    if (f <= b.t) {
      const p = MOVE(Math.min(1, Math.max(0, (f - a.t) / (b.t - a.t || 1))));
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const d = Math.hypot(dx, dy) || 1;
      const arc = Math.sin(p * Math.PI) * Math.min(30, d * 0.14);
      return {
        x: lerp(a.x, b.x, p) + (-dy / d) * arc,
        y: lerp(a.y, b.y, p) + (dx / d) * arc,
      };
    }
  }
  return keys[keys.length - 1];
}

function Cursor({ x, y, press }: Pt & { press: number }) {
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
        transform: `scale(${1 - 0.1 * press})`,
        filter: "drop-shadow(0 3px 5px rgba(0,0,0,0.3))",
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

function Spinner({ color, frame }: { color: string; frame: number }) {
  return (
    <svg
      width={16}
      height={16}
      viewBox="0 0 16 16"
      style={{ display: "block", transform: `rotate(${frame * 24}deg)` }}
    >
      <circle
        cx={8}
        cy={8}
        r={6}
        fill="none"
        stroke={color}
        strokeOpacity={0.25}
        strokeWidth={1.6}
      />
      <path
        d="M8 2a6 6 0 0 1 6 6"
        fill="none"
        stroke={color}
        strokeWidth={1.6}
        strokeLinecap="round"
      />
    </svg>
  );
}

function RollingAmount({
  from,
  to,
  frame,
  start,
  lh,
}: {
  from: string;
  to: string;
  frame: number;
  start: number;
  lh: number;
}) {
  const a = from.padStart(to.length, " ");
  let k = 0;
  return (
    <span
      style={{
        display: "inline-flex",
        height: lh,
        fontVariantNumeric: "tabular-nums",
      }}
    >
      {to.split("").map((ch, i) => {
        const prev = a[i];
        if (!/\d/.test(ch) || !/\d/.test(prev) || prev === ch) {
          return (
            <span key={`${i}-${ch}`} style={{ lineHeight: `${lh}px` }}>
              {frame >= start ? ch : prev}
            </span>
          );
        }
        const s = start + k++ * 3;
        const p = tween(frame, s, s + 16, ENTER2);
        const pos = lerp(Number(prev), Number(ch), p);
        const shown = Math.round(pos);
        const off = pos - shown;
        return (
          <span
            key={`${i}-${ch}`}
            style={{
              display: "inline-block",
              lineHeight: `${lh}px`,
              opacity: 1 - Math.abs(off) * 1.1,
              transform: `translateY(${-off * lh * 0.3}px)`,
            }}
          >
            {shown}
          </span>
        );
      })}
    </span>
  );
}

export function CouponApply({
  merchant = "Lumen",
  items = DEFAULT_ITEMS,
  invalidCode = "LAUNCH",
  code = "LAUNCH24",
  percentOff = 10,
  currency = "$",
  payLabel = "Subscribe",
  email = "maya@kitebase.com",
  cardholder = "Maya Chen",
  theme = "light",
  accent = "#3B5BFD",
  speed = 1,
  ground,
  groundParams,
}: CouponApplyProps) {
  const frame = useCurrentFrame() * speed;
  const { width, height, fps, durationInFrames } = useVideoConfig();
  const tall = height > width;
  const DW = tall ? 720 : 1280;
  const DH = tall ? 1280 : 720;
  const u = Math.min(width / DW, height / DH);
  const pal = palette(theme);

  const subtotal = items.reduce((s, it) => s + it.amount, 0);
  const discount = Math.round(subtotal * percentOff) / 100;
  const total = subtotal - discount;
  const oldStr = fmt(subtotal, currency);
  const newStr = fmt(total, currency);

  const hasInvalid = invalidCode.length > 0;
  const retype =
    hasInvalid && code.startsWith(invalidCode)
      ? code.slice(invalidCode.length)
      : code;
  const CH = 3;
  const t: Record<string, number> = { focus: 30, type1: 34 };
  t.apply1 = t.type1 + (hasInvalid ? invalidCode.length * CH : 0) + 8;
  t.reject = t.apply1 + 9;
  t.refocus = hasInvalid ? t.reject + 18 : t.focus;
  t.type2 = hasInvalid ? t.refocus + 4 : t.type1;
  t.apply2 = t.type2 + retype.length * CH + 8;
  t.accept = t.apply2 + 10;
  t.strike = t.accept + 6;
  t.roll = t.strike + 4;
  t.pay = t.roll + 4;

  const typed = (() => {
    if (!hasInvalid)
      return code.slice(0, Math.max(0, Math.floor((frame - t.type1) / CH)));
    const first = invalidCode.slice(
      0,
      Math.max(0, Math.floor((frame - t.type1) / CH)),
    );
    if (frame < t.type2) return first;
    const base = code.startsWith(invalidCode) ? invalidCode : "";
    return (
      base +
      retype.slice(0, Math.max(0, Math.floor((frame - t.type2) / CH) + 1))
    );
  })();

  const PAD = tall ? 40 : 44;
  const COL_W = tall ? 600 : 470;
  const S_H = tall ? 566 : 556;
  const P_H = tall ? 540 : 556;
  const card = tall
    ? { x: 60, y: (DH - (S_H + P_H)) / 2, w: 600, h: S_H + P_H }
    : { x: (DW - COL_W * 2) / 2, y: (DH - S_H) / 2, w: COL_W * 2, h: S_H };
  const side = tall ? { x: 0, y: S_H } : { x: COL_W, y: 0 };
  const Y = {
    merchant: 40,
    lede: 92,
    price: 120,
    items: 214,
    divider1: 330,
    subtotal: 348,
    promo: 390,
    error: 448,
    divider2: 458,
    total: 476,
  };
  const ERR_H = 30;
  const PY = {
    title: 40,
    emailL: 86,
    email: 112,
    cardL: 174,
    cardF: 200,
    nameL: 310,
    name: 336,
    pay: 410,
    foot: 482,
  };
  const innerW = COL_W - PAD * 2;
  const APPLY_W = 92;

  const pressAt = (at: number) =>
    Math.max(
      0,
      spring({ frame: frame - at, fps, config: CHIP }) -
        spring({ frame: frame - at - 4, fps, config: CHIP }),
    );

  const enter = spring({ frame, fps, config: HEAVY });
  const sideIn = spring({ frame: frame - 6, fps, config: CARD });

  const errP = hasInvalid
    ? spring({ frame: frame - t.reject, fps, config: MORPH }) -
      spring({ frame: frame - t.type2, fps, config: MORPH })
    : 0;
  const errO = Math.max(0, errP) * ERR_H;

  const fieldPt = {
    x: card.x + PAD + 150,
    y: card.y + Y.promo + 24,
  };
  const applyPt = {
    x: card.x + PAD + innerW - APPLY_W / 2 + 6,
    y: card.y + Y.promo + 30,
  };
  const payPt = {
    x: card.x + side.x + PAD + innerW - 34,
    y: card.y + side.y + PY.pay + 38,
  };
  const startPt = tall
    ? { x: DW - 90, y: card.y + S_H + 120 }
    : { x: DW - 120, y: DH - 70 };
  const keys: Key[] = [
    { t: 10, ...startPt },
    { t: t.focus - 2, ...fieldPt },
    { t: t.focus + 4, ...fieldPt },
    { t: t.apply1 - 2, ...applyPt },
  ];
  if (hasInvalid) {
    keys.push({ t: t.reject + 6, ...applyPt });
    keys.push({ t: t.refocus - 2, x: fieldPt.x + 60, y: fieldPt.y });
    keys.push({ t: t.refocus + 3, x: fieldPt.x + 60, y: fieldPt.y });
  }
  keys.push({ t: t.apply2 - 2, ...applyPt });
  keys.push({ t: t.accept + 2, ...applyPt });
  keys.push({ t: t.pay + 22, ...payPt });
  const cur = pathAt(keys, frame);
  const clicks = [
    t.focus,
    t.apply2,
    ...(hasInvalid ? [t.apply1, t.refocus] : []),
  ];
  const press = Math.max(...clicks.map(pressAt));
  const cursorIn = tween(frame, 10, 18, ENTER2);

  const focused = frame >= t.focus && frame < t.accept;
  const focusP = tween(frame, t.focus, t.focus + 6);
  const errorOn = hasInvalid && frame >= t.reject && frame < t.type2;
  const errBorder = hasInvalid
    ? tween(frame, t.reject, t.reject + 4) *
      (1 - tween(frame, t.type2, t.type2 + 6, MOVE))
    : 0;
  const shakeT = (frame - t.reject) / 12;
  const shake =
    errorOn && shakeT < 1
      ? Math.sin(shakeT * Math.PI * 5) * 8 * (1 - shakeT)
      : 0;
  const loading1 = hasInvalid && frame >= t.apply1 + 1 && frame < t.reject;
  const loading2 = frame >= t.apply2 + 1 && frame < t.accept;
  const pressBtn = Math.max(
    ...[t.apply2, ...(hasInvalid ? [t.apply1] : [])].map(pressAt),
  );
  const typing =
    (frame >= t.type1 && frame < t.apply1) ||
    (frame >= t.type2 && frame < t.apply2);
  const caretOn = focused && (typing || Math.floor(frame / 8) % 2 === 0);
  const fieldOut = tween(frame, t.accept, t.accept + 5, EXIT);
  const discIn = spring({ frame: frame - t.accept - 2, fps, config: CARD });
  const chipIn = spring({ frame: frame - t.accept - 4, fps, config: CHIP });
  const strike = tween(frame, t.strike, t.strike + 8, MOVE);
  const oldIn = tween(frame, t.strike, t.strike + 10, ENTER2);
  const payP = tween(frame, t.pay, t.pay + 10, MOVE);
  const payGlow = tween(frame, t.pay + 18, t.pay + 26, ENTER2);

  const zoomIn = tween(frame, 8, 40, MOVE);
  const zoomOut = tween(frame, t.accept - 2, t.accept + 26, CAMERA);
  const camZ = 1 + (tall ? 0.16 : 0.14) * zoomIn * (1 - zoomOut);
  const camO = tall
    ? { x: DW / 2, y: card.y + Y.promo + 20 }
    : { x: card.x + COL_W * 0.6, y: card.y + Y.promo };
  const drift = 1 + 0.02 * tween(frame, t.accept + 20, durationInFrames, MOVE);

  const borderColor =
    errBorder > 0.01
      ? withAlpha(pal.red, 0.4 + 0.6 * errBorder)
      : focusP > 0 && focused
        ? accent
        : pal.fieldRing;
  const ringColor =
    errBorder > 0.01
      ? withAlpha(pal.red, 0.16 * errBorder)
      : withAlpha(accent, 0.2 * focusP * (focused ? 1 : 0));

  const row = (
    top: number,
    style: React.CSSProperties,
    children: React.ReactNode,
  ) => (
    <div
      style={{
        position: "absolute",
        left: PAD,
        right: PAD,
        top,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        ...style,
      }}
    >
      {children}
    </div>
  );

  const fieldBox = (
    top: number,
    h: number,
    content: React.ReactNode,
    radius = "10px",
  ): React.ReactNode => (
    <div
      style={{
        position: "absolute",
        left: PAD,
        right: PAD,
        top,
        height: h,
        borderRadius: radius,
        background: pal.field,
        boxShadow: `inset 0 0 0 1px ${pal.fieldRing}`,
        display: "flex",
        alignItems: "center",
        padding: "0 14px",
        fontSize: 17,
        color: pal.text,
        boxSizing: "border-box",
      }}
    >
      {content}
    </div>
  );
  const label = (top: number, text: string) => (
    <div
      style={{
        position: "absolute",
        left: PAD,
        top,
        fontSize: 16,
        color: pal.muted,
      }}
    >
      {text}
    </div>
  );

  return (
    <AbsoluteFill
      style={{
        fontFamily,
        fontWeight: 400,
        overflow: "hidden",
        WebkitFontSmoothing: "antialiased",
      }}
    >
      <GshGround
        preset={ground ?? (pal.dark ? "earthshine" : "paper-crease")}
        params={groundParams}
        timeOffset={pal.dark ? 3 : 5}
        timeScale={0.3}
      />
      <AbsoluteFill style={{ background: pal.scrim }} />
      <div
        style={{
          position: "absolute",
          left: (width - DW * u) / 2,
          top: (height - DH * u) / 2,
          width: DW,
          height: DH,
          transformOrigin: "0 0",
          transform: `scale(${u})`,
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            transformOrigin: `${camO.x}px ${camO.y}px`,
            transform: `scale(${camZ * drift})`,
          }}
        >
          <div
            style={{
              position: "absolute",
              left: card.x,
              top: card.y,
              width: card.w,
              height: card.h,
              borderRadius: 20,
              overflow: "hidden",
              background: pal.card,
              color: pal.text,
              opacity: tween(frame, 0, 10, ENTER2),
              transform: `translateY(${(1 - enter) * 48}px) scale(${0.97 + 0.03 * enter})`,
              boxShadow: pal.cardShadow,
            }}
          >
            <div
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                width: COL_W,
                height: S_H,
              }}
            >
              {row(
                Y.merchant,
                { height: 28, justifyContent: "flex-start", gap: 12 },
                <>
                  <Icon name="back" color={pal.faint} size={18} />
                  <svg width={28} height={28} viewBox="0 0 28 28">
                    <rect width={28} height={28} rx={8} fill={accent} />
                    <path
                      d="M9 8.5v11h10"
                      fill="none"
                      stroke="#fff"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span style={{ fontSize: 18, letterSpacing: "-0.01em" }}>
                    {merchant}
                  </span>
                </>,
              )}
              {row(
                Y.lede,
                { fontSize: 17, color: pal.muted },
                <span>Subscribe to {items[0]?.name ?? merchant}</span>,
              )}
              {row(
                Y.price,
                { justifyContent: "flex-start", gap: 14, height: 68 },
                <>
                  <span
                    style={{
                      fontSize: 60,
                      fontWeight: 400,
                      letterSpacing: "-0.04em",
                      lineHeight: "68px",
                      display: "inline-flex",
                    }}
                  >
                    <RollingAmount
                      from={oldStr}
                      to={frame >= t.roll ? newStr : oldStr}
                      frame={frame}
                      start={t.roll}
                      lh={68}
                    />
                  </span>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      fontSize: 16,
                      lineHeight: 1.3,
                      color: pal.muted,
                      paddingTop: 6,
                    }}
                  >
                    <span
                      style={{
                        position: "relative",
                        color: pal.faint,
                        fontVariantNumeric: "tabular-nums",
                        opacity: oldIn,
                        transform: `translateY(${(1 - oldIn) * 6}px)`,
                        alignSelf: "flex-start",
                      }}
                    >
                      {oldStr}
                      <span
                        style={{
                          position: "absolute",
                          left: -1,
                          right: -1,
                          top: "54%",
                          height: 1.5,
                          background: pal.faint,
                          transformOrigin: "0 50%",
                          transform: `scaleX(${strike})`,
                        }}
                      />
                    </span>
                    <span>per year</span>
                  </div>
                </>,
              )}
              {items.slice(0, 2).map((it, i) =>
                row(
                  Y.items + i * 56,
                  { height: 48, alignItems: "flex-start" },
                  <>
                    <div key={`n-${it.name}`}>
                      <div style={{ fontSize: 17 }}>{it.name}</div>
                      <div
                        style={{
                          fontSize: 16,
                          color: pal.muted,
                          marginTop: 3,
                        }}
                      >
                        {it.detail}
                      </div>
                    </div>
                    <span
                      key={`a-${it.name}`}
                      style={{
                        fontSize: 17,
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {fmt(it.amount, currency)}
                    </span>
                  </>,
                ),
              )}
              <div
                style={{
                  position: "absolute",
                  left: PAD,
                  right: PAD,
                  top: Y.divider1,
                  height: 1,
                  background: pal.line,
                }}
              />
              {row(
                Y.subtotal,
                { fontSize: 17, height: 26 },
                <>
                  <span style={{ color: pal.muted }}>Subtotal</span>
                  <span style={{ fontVariantNumeric: "tabular-nums" }}>
                    {oldStr}
                  </span>
                </>,
              )}
              {row(
                Y.promo,
                {
                  gap: 8,
                  height: 48,
                  opacity: 1 - fieldOut,
                  transform: `translateX(${shake}px) translateY(${-fieldOut * 8}px)`,
                },
                <>
                  <div
                    style={{
                      flex: 1,
                      height: 48,
                      borderRadius: 10,
                      background: pal.field,
                      boxShadow: `inset 0 0 0 1px ${borderColor}, 0 0 0 3px ${ringColor}`,
                      display: "flex",
                      alignItems: "center",
                      padding: "0 14px",
                      gap: 10,
                      fontSize: 17,
                    }}
                  >
                    <Icon name="tag" color={pal.faint} size={17} />
                    <span
                      style={{ display: "flex", alignItems: "center", gap: 1 }}
                    >
                      {typed.length > 0 ? (
                        <span
                          style={{ letterSpacing: "0.05em", color: pal.text }}
                        >
                          {typed}
                        </span>
                      ) : null}
                      <span
                        style={{
                          width: 1.5,
                          height: 20,
                          background: accent,
                          opacity: caretOn ? 1 : 0,
                        }}
                      />
                      {typed.length === 0 ? (
                        <span style={{ color: pal.faint, marginLeft: -1.5 }}>
                          Add promotion code
                        </span>
                      ) : null}
                    </span>
                  </div>
                  <div
                    style={{
                      width: APPLY_W,
                      height: 48,
                      borderRadius: 10,
                      background: pal.btn2,
                      boxShadow: `inset 0 0 0 1px ${pal.line}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 17,
                      color: typed.length > 0 ? pal.text : pal.faint,
                      transform: `scale(${1 - 0.04 * pressBtn})`,
                    }}
                  >
                    {loading1 || loading2 ? (
                      <Spinner color={pal.text} frame={frame} />
                    ) : (
                      "Apply"
                    )}
                  </div>
                </>,
              )}
              {hasInvalid
                ? row(
                    Y.error,
                    {
                      justifyContent: "flex-start",
                      gap: 8,
                      fontSize: 16,
                      color: pal.red,
                      opacity:
                        Math.max(0, errP) *
                        tween(frame, t.reject + 3, t.reject + 9),
                      transform: `translateY(${(1 - Math.max(0, errP)) * -5}px)`,
                    },
                    <>
                      <Icon name="alert" color={pal.red} size={16} />
                      That code isn’t valid.
                    </>,
                  )
                : null}
              {row(
                Y.promo,
                {
                  height: 48,
                  fontSize: 17,
                  opacity: Math.min(1, discIn * 1.4),
                  transform: `translateY(${(1 - discIn) * 10}px)`,
                },
                <>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 10 }}
                  >
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 8,
                        height: 32,
                        padding: "0 8px 0 10px",
                        borderRadius: 8,
                        background: pal.chip,
                        fontSize: 16,
                        letterSpacing: "0.05em",
                        transform: `scale(${0.85 + 0.15 * chipIn})`,
                        transformOrigin: "0 50%",
                      }}
                    >
                      <Icon name="tag" color={pal.muted} size={15} />
                      {code}
                      <Icon name="x" color={pal.faint} size={15} />
                    </span>
                    <span style={{ color: pal.muted, fontSize: 16 }}>
                      {percentOff}% off
                    </span>
                  </div>
                  <span
                    style={{
                      color: pal.green,
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    −{fmt(discount, currency)}
                  </span>
                </>,
              )}
              <div
                style={{
                  position: "absolute",
                  left: PAD,
                  right: PAD,
                  top: Y.divider2 + errO,
                  height: 1,
                  background: pal.line,
                }}
              />
              {row(
                Y.total + errO,
                { height: 30, fontSize: 18 },
                <>
                  <span>Total due today</span>
                  <span style={{ display: "inline-flex" }}>
                    <RollingAmount
                      from={oldStr}
                      to={frame >= t.roll ? newStr : oldStr}
                      frame={frame}
                      start={t.roll + 2}
                      lh={30}
                    />
                  </span>
                </>,
              )}
            </div>

            <div
              style={{
                position: "absolute",
                left: side.x,
                top: side.y,
                width: COL_W,
                height: P_H,
                background: pal.side,
                boxShadow: tall
                  ? `inset 0 1px 0 ${pal.line}`
                  : `inset 1px 0 0 ${pal.line}`,
                opacity: Math.min(1, sideIn * 1.3),
                transform: tall
                  ? `translateY(${(1 - sideIn) * 24}px)`
                  : `translateX(${(1 - sideIn) * 24}px)`,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  left: PAD,
                  top: PY.title,
                  fontSize: 20,
                  letterSpacing: "-0.01em",
                }}
              >
                Pay with card
              </div>
              {label(PY.emailL, "Email")}
              {fieldBox(PY.email, 48, email)}
              {label(PY.cardL, "Card information")}
              {fieldBox(
                PY.cardF,
                48,
                <>
                  <span
                    style={{
                      flex: 1,
                      fontVariantNumeric: "tabular-nums",
                      letterSpacing: "0.02em",
                    }}
                  >
                    4242 4242 4242 4242
                  </span>
                  <Icon name="card" color={pal.muted} size={20} />
                </>,
                "10px 10px 0 0",
              )}
              <div
                style={{
                  position: "absolute",
                  left: PAD,
                  right: PAD,
                  top: PY.cardF + 47,
                  height: 48,
                  display: "flex",
                }}
              >
                {["12 / 28", "318"].map((v, i) => (
                  <div
                    key={v}
                    style={{
                      flex: 1,
                      marginLeft: i ? -1 : 0,
                      borderRadius: i ? "0 0 10px 0" : "0 0 0 10px",
                      background: pal.field,
                      boxShadow: `inset 0 0 0 1px ${pal.fieldRing}`,
                      display: "flex",
                      alignItems: "center",
                      padding: "0 14px",
                      fontSize: 17,
                      fontVariantNumeric: "tabular-nums",
                      color: pal.text,
                    }}
                  >
                    {v}
                  </div>
                ))}
              </div>
              {label(PY.nameL, "Name on card")}
              {fieldBox(PY.name, 48, cardholder)}
              <div
                style={{
                  position: "absolute",
                  left: PAD,
                  right: PAD,
                  top: PY.pay,
                  height: 54,
                  borderRadius: 12,
                  background: accent,
                  color: "#fff",
                  fontSize: 18,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  boxShadow: `0 1px 2px ${withAlpha(accent, 0.3)}, 0 8px 20px -10px ${withAlpha(accent, 0.6 * payGlow)}, inset 0 1px 0 rgba(255,255,255,0.16)`,
                  filter: `brightness(${1 + 0.07 * payGlow})`,
                }}
              >
                {payLabel}
                <span style={{ opacity: 0.6 }}>·</span>
                <span
                  style={{
                    position: "relative",
                    display: "inline-grid",
                    fontVariantNumeric: "tabular-nums",
                    overflow: "hidden",
                    height: 26,
                    lineHeight: "26px",
                  }}
                >
                  <span
                    style={{
                      gridArea: "1/1",
                      transform: `translateY(${-payP * 26}px)`,
                    }}
                  >
                    {oldStr}
                  </span>
                  <span
                    style={{
                      gridArea: "1/1",
                      transform: `translateY(${(1 - payP) * 26}px)`,
                    }}
                  >
                    {newStr}
                  </span>
                </span>
              </div>
              <div
                style={{
                  position: "absolute",
                  left: PAD,
                  right: PAD,
                  top: PY.foot,
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 16,
                  color: pal.faint,
                }}
              >
                <Icon name="lock" color={pal.faint} size={15} />
                Encrypted payment. Cancel anytime.
              </div>
            </div>
          </div>
          <div style={{ opacity: cursorIn }}>
            <Cursor x={cur.x} y={cur.y} press={press} />
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
}
