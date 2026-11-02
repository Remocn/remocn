"use client";

import { loadFont } from "@remotion/google-fonts/Geist";
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

export interface InvoiceLine {
  description: string;
  qty: number;
  unit: number;
}

export interface InvoiceEvent {
  title: string;
  detail: string;
  time: string;
}

export interface InvoicePaidProps {
  sender?: string;
  customer?: string;
  customerEmail?: string;
  customerAddress?: string;
  number?: string;
  issued?: string;
  due?: string;
  lines?: InvoiceLine[];
  /** Created, Sent, Viewed, Paid, in that order. */
  events?: InvoiceEvent[];
  payoutAccount?: string;
  payoutArrival?: string;
  payoutFee?: number;
  currency?: string;
  theme?: "light" | "dark";
  accent?: string;
  speed?: number;
  ground?: GshPresetId;
  groundParams?: Partial<GradientParams>;
}

const DEFAULT_LINES: InvoiceLine[] = [
  { description: "Brand identity system", qty: 1, unit: 6400 },
  { description: "Launch film, 60s cut", qty: 1, unit: 4200 },
  { description: "Motion toolkit license", qty: 2, unit: 940 },
];

const DEFAULT_EVENTS: InvoiceEvent[] = [
  { title: "Invoice created", detail: "by Maya Chen", time: "Oct 24, 9:38 AM" },
  {
    title: "Sent to customer",
    detail: "Emailed ap@kitebase.com",
    time: "Oct 24, 9:41 AM",
  },
  { title: "Viewed", detail: "Opened by Leo Park", time: "Oct 25, 10:02 AM" },
  {
    title: "Payment received",
    detail: "ACH transfer · ••4821",
    time: "Oct 27, 2:17 PM",
  },
];

const DOC = { w: 500, h: 616 };
const PANEL_W = 544;
const PANEL_H = 540;
const PAD = 32;
const TL_Y = 268;
const STEP = 62;

const T = {
  send: 40,
  viewed: 66,
  paid: 92,
  stamp: 100,
  payout: 128,
};

const HEAVY = { mass: 1, damping: 26, stiffness: 120 };
const CARD = { mass: 0.8, damping: 18, stiffness: 160 };
const CHIP = { mass: 0.5, damping: 12, stiffness: 200 };

const ENTER = Easing.bezier(0.32, 0.72, 0, 1);
const ENTER2 = Easing.bezier(0.22, 1, 0.36, 1);
const MOVE = Easing.bezier(0.65, 0, 0.35, 1);
const EXIT = Easing.bezier(0.55, 0, 1, 0.45);

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
  panel: string;
  panelShadow: string;
  docShadow: string;
  text: string;
  muted: string;
  faint: string;
  line: string;
  btn2: string;
  node: string;
  green: string;
  amber: string;
  notif: string;
}

function palette(theme: "light" | "dark"): Pal {
  return theme === "dark"
    ? {
        dark: true,
        scrim: "rgba(2,6,8,0.36)",
        panel: "#0F1113",
        panelShadow:
          "0 0 0 1px rgba(255,255,255,0.08), inset 0 1px 0 rgba(255,255,255,0.06), 0 24px 60px -20px rgba(0,0,0,0.75)",
        docShadow:
          "0 0 0 1px rgba(0,0,0,0.2), 0 2px 4px rgba(0,0,0,0.25), 0 30px 70px -24px rgba(0,0,0,0.75)",
        text: "#EEEFF1",
        muted: "#9EA1A8",
        faint: "#696C73",
        line: "rgba(255,255,255,0.08)",
        btn2: "#1A1C1F",
        node: "#1E2023",
        green: "#46CB91",
        amber: "#F0B44C",
        notif: "#17191C",
      }
    : {
        dark: false,
        scrim: "rgba(245,244,240,0.28)",
        panel: "#FFFFFF",
        panelShadow:
          "0 0 0 1px rgba(20,20,24,0.06), 0 1px 3px rgba(20,20,24,0.05), 0 14px 32px -14px rgba(20,20,24,0.16), 0 40px 80px -40px rgba(20,20,24,0.22)",
        docShadow:
          "0 0 0 1px rgba(20,20,24,0.05), 0 2px 4px rgba(20,20,24,0.04), 0 24px 56px -24px rgba(20,20,24,0.28)",
        text: "#17181B",
        muted: "#5F6169",
        faint: "#9A9CA3",
        line: "rgba(20,20,24,0.08)",
        btn2: "#FFFFFF",
        node: "#F2F2F3",
        green: "#0D7F4F",
        amber: "#A86500",
        notif: "#FFFFFF",
      };
}

const ICONS = {
  send: "M13.5 2.5 7 9M13.5 2.5 9.4 13.5 7 9 2.5 6.6z",
  file: "M4.25 2.5h5L12 5.25v8.25H4.25zM9 2.5v3h3M6.25 8.5h3.5M6.25 11h2.5",
  eye: "M1.75 8S4 3.75 8 3.75 14.25 8 14.25 8 12 12.25 8 12.25 1.75 8 1.75 8zM8 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4z",
  check: "M3.75 8.5l2.75 2.75 5.75-6.25",
  bank: "M2.5 6 8 2.75 13.5 6M3.75 6v5.5M6.5 6v5.5M9.5 6v5.5M12.25 6v5.5M2.5 13.25h11",
  bell: "M4.25 10.75V7.5a3.75 3.75 0 0 1 7.5 0v3.25l1 1.25H3.25zM6.75 13.5h2.5",
  download: "M8 2.75v7.5M4.75 7.25 8 10.5l3.25-3.25M3 13.25h10",
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

function StatusGlyph({ step, color }: { step: number; color: string }) {
  if (step >= 3) {
    return (
      <svg
        width={16}
        height={16}
        viewBox="0 0 14 14"
        style={{ display: "block" }}
      >
        <circle cx={7} cy={7} r={6} fill={color} />
        <path
          d="M4.3 7.2 6.1 9l3.6-3.8"
          fill="none"
          stroke="#fff"
          strokeWidth={1.4}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  const frac = [0, 0.4, 0.75][step];
  const r = 3;
  const a = frac * Math.PI * 2;
  return (
    <svg
      width={16}
      height={16}
      viewBox="0 0 14 14"
      style={{ display: "block" }}
    >
      <circle
        cx={7}
        cy={7}
        r={5.5}
        fill="none"
        stroke={color}
        strokeWidth={1.4}
        strokeDasharray={step === 0 ? "2 2" : undefined}
      />
      {frac > 0 ? (
        <path
          d={`M7 7 L7 ${7 - r} A${r} ${r} 0 ${frac > 0.5 ? 1 : 0} 1 ${7 + r * Math.sin(a)} ${7 - r * Math.cos(a)} Z`}
          fill={color}
        />
      ) : null}
    </svg>
  );
}

const PILLS = ["Draft", "Sent", "Viewed", "Paid"];

function StatusPill({
  frame,
  fps,
  pal,
  accent,
}: {
  frame: number;
  fps: number;
  pal: Pal;
  accent: string;
}) {
  const at = [0, T.send + 2, T.viewed, T.paid];
  const step = at.filter((t) => frame >= t).length - 1;
  const colors = [pal.faint, accent, pal.amber, pal.green];
  const range = [at[step], at[step] + 4];
  const prev = Math.max(0, step - 1);
  const c = interpolateColors(frame, range, [colors[prev], colors[step]]);
  const bg = interpolateColors(frame, range, [
    withAlpha(colors[prev], pal.dark ? 0.14 : 0.1),
    withAlpha(colors[step], pal.dark ? 0.14 : 0.1),
  ]);
  const pop =
    step > 0
      ? spring({ frame: frame - at[step], fps, config: CHIP }) -
        spring({ frame: frame - at[step] - 3, fps, config: CHIP })
      : 0;
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 7,
        height: 30,
        padding: "0 12px 0 9px",
        borderRadius: 99,
        background: bg,
        color: c,
        fontSize: 16,
        transform: `scale(${1 + 0.07 * pop})`,
      }}
    >
      <StatusGlyph step={step} color={c} />
      {PILLS[step]}
    </div>
  );
}

function Stamp({ p, date }: { p: number; date: string }) {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const ink = "#12814E";
  return (
    <svg
      width={198}
      height={96}
      viewBox="0 0 232 112"
      style={{ display: "block", overflow: "visible" }}
    >
      <defs>
        <filter id={`${id}g`} x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.55"
            numOctaves={3}
            seed={11}
            result="n"
          />
          <feColorMatrix
            in="n"
            type="matrix"
            values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -6.5 0 0 0 4.75"
            result="m"
          />
          <feComposite in="SourceGraphic" in2="m" operator="in" />
        </filter>
      </defs>
      <g filter={`url(#${id}g)`} opacity={0.62 + 0.26 * p}>
        <rect
          x={4}
          y={4}
          width={224}
          height={104}
          rx={14}
          fill="none"
          stroke={ink}
          strokeWidth={5}
        />
        <rect
          x={13}
          y={13}
          width={206}
          height={86}
          rx={8}
          fill="none"
          stroke={ink}
          strokeWidth={1.6}
        />
        <text
          x={116}
          y={70}
          textAnchor="middle"
          fontSize={54}
          fontWeight={400}
          letterSpacing="0.16em"
          fill={ink}
          style={{ fontFamily }}
        >
          PAID
        </text>
        <text
          x={116}
          y={90}
          textAnchor="middle"
          fontSize={12}
          fontWeight={400}
          letterSpacing="0.26em"
          fill={ink}
          style={{ fontFamily }}
        >
          {date}
        </text>
      </g>
    </svg>
  );
}

function InvoiceDoc({
  frame,
  fps,
  sender,
  customer,
  customerAddress,
  number,
  issued,
  due,
  lines,
  currency,
  stampDate,
}: {
  frame: number;
  fps: number;
  sender: string;
  customer: string;
  customerAddress: string;
  number: string;
  issued: string;
  due: string;
  lines: InvoiceLine[];
  currency: string;
  stampDate: string;
}) {
  const total = lines.reduce((s, l) => s + l.qty * l.unit, 0);
  const ink = "#17181B";
  const muted = "#62646B";
  const faint = "#9C9EA4";
  const line = "rgba(20,20,24,0.08)";
  const r = (k: number): React.CSSProperties => {
    const p = tween(frame, 8 + k * 3, 20 + k * 3, ENTER2);
    return { opacity: p, transform: `translateY(${(1 - p) * 10}px)` };
  };
  const land = spring({ frame: frame - T.stamp, fps, config: CHIP });
  const impact =
    spring({ frame: frame - T.stamp - 3, fps, config: CHIP }) -
    spring({ frame: frame - T.stamp - 6, fps, config: CHIP });

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: "#FFFFFF",
        borderRadius: 6,
        padding: "40px 40px",
        boxSizing: "border-box",
        color: ink,
        transform: `translateY(${impact * 2}px) scale(${1 - 0.006 * impact})`,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          ...r(0),
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <svg width={24} height={24} viewBox="0 0 24 24">
            <circle cx={12} cy={12} r={11} fill={ink} />
            <path
              d="M7.5 15.5c2.2-4.6 6.8-4.6 9 0"
              stroke="#fff"
              strokeWidth={1.8}
              fill="none"
              strokeLinecap="round"
            />
          </svg>
          <span style={{ fontSize: 16 }}>{sender}</span>
        </div>
        <div style={{ textAlign: "right" }}>
          <div
            style={{ fontSize: 28, fontWeight: 300, letterSpacing: "-0.03em" }}
          >
            Invoice
          </div>
          <div
            style={{
              fontSize: 15,
              color: muted,
              marginTop: 2,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {number}
          </div>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.5fr 1fr 1fr",
          gap: 14,
          marginTop: 34,
          fontSize: 15,
          ...r(1),
        }}
      >
        {[
          { k: "Billed to", v: customer, s: customerAddress },
          { k: "Issued", v: issued },
          { k: "Due", v: due },
        ].map((m) => (
          <div key={m.k}>
            <div style={{ color: faint, marginBottom: 4 }}>{m.k}</div>
            <div>{m.v}</div>
            {m.s ? (
              <div
                style={{
                  color: muted,
                  marginTop: 2,
                  lineHeight: 1.4,
                  fontSize: 14,
                }}
              >
                {m.s}
              </div>
            ) : null}
          </div>
        ))}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 40px 110px",
          marginTop: 30,
          fontSize: 14,
          color: faint,
          paddingBottom: 10,
          borderBottom: `1px solid ${line}`,
          ...r(2),
        }}
      >
        <span>Description</span>
        <span style={{ textAlign: "right" }}>Qty</span>
        <span style={{ textAlign: "right" }}>Amount</span>
      </div>
      {lines.map((l, i) => (
        <div
          key={l.description}
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 40px 110px",
            fontSize: 16,
            padding: "13px 0",
            borderBottom: `1px solid ${line}`,
            fontVariantNumeric: "tabular-nums",
            ...r(3 + i),
          }}
        >
          <span>{l.description}</span>
          <span style={{ textAlign: "right", color: muted }}>{l.qty}</span>
          <span style={{ textAlign: "right" }}>
            {fmt(l.qty * l.unit, currency)}
          </span>
        </div>
      ))}

      <div
        style={{
          marginLeft: "auto",
          width: 196,
          marginTop: 20,
          fontSize: 15,
          ...r(3 + lines.length),
        }}
      >
        {[
          { k: "Subtotal", v: fmt(total, currency) },
          { k: "Tax", v: fmt(0, currency) },
        ].map((x) => (
          <div
            key={x.k}
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "4px 0",
              color: muted,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            <span>{x.k}</span>
            <span style={{ color: ink }}>{x.v}</span>
          </div>
        ))}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            marginTop: 8,
            paddingTop: 10,
            borderTop: `1px solid ${line}`,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          <span>Total</span>
          <span style={{ fontSize: 20, letterSpacing: "-0.02em" }}>
            {fmt(total, currency)}
          </span>
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          left: 40,
          right: 40,
          bottom: 34,
          display: "flex",
          justifyContent: "space-between",
          fontSize: 14,
          color: muted,
          paddingTop: 14,
          borderTop: `1px solid ${line}`,
          ...r(4 + lines.length),
        }}
      >
        <span>Net 14 · ACH or card</span>
        <span>Page 1 of 1</span>
      </div>

      {frame >= T.stamp ? (
        <div
          style={{
            position: "absolute",
            left: 22,
            top: 446,
            transformOrigin: "50% 50%",
            transform: `rotate(${lerp(-20, -9, land)}deg) scale(${lerp(1.6, 1, land)})`,
            opacity: tween(frame, T.stamp, T.stamp + 3, ENTER2),
            filter: `drop-shadow(0 ${Math.max(0, 1 - land) * 18}px ${Math.max(0, 1 - land) * 14}px rgba(0,0,0,${0.18 * Math.max(0, 1 - land)}))`,
          }}
        >
          <Stamp p={Math.min(1, land)} date={stampDate} />
        </div>
      ) : null}
    </div>
  );
}

export function InvoicePaid({
  sender = "Halcyon Studio",
  customer = "Kitebase, Inc.",
  customerEmail = "ap@kitebase.com",
  customerAddress = "2100 Market St, SF",
  number = "INV-2041",
  issued = "Oct 24, 2026",
  due = "Nov 7, 2026",
  lines = DEFAULT_LINES,
  events = DEFAULT_EVENTS,
  payoutAccount = "Business Checking ••4821",
  payoutArrival = "Oct 29",
  payoutFee = 5,
  currency = "$",
  theme = "light",
  accent = "#3B5BFD",
  speed = 1,
  ground,
  groundParams,
}: InvoicePaidProps) {
  const frame = useCurrentFrame() * speed;
  const { width, height, fps } = useVideoConfig();
  const tall = height > width;
  const DW = tall ? 720 : 1280;
  const DH = tall ? 1280 : 720;
  const u = Math.min(width / DW, height / DH);
  const pal = palette(theme);
  const total = lines.reduce((s, l) => s + l.qty * l.unit, 0);
  const paidDay = events[3]?.time.split(",")[0] ?? "";

  const docScale = tall ? 0.88 : 1;
  const doc = tall
    ? { x: (DW - DOC.w * docScale) / 2, y: 132 }
    : { x: 92, y: (DH - DOC.h) / 2 };
  const panelW = tall ? 600 : PANEL_W;
  const panel = tall
    ? { x: 60, y: 132 + DOC.h * docScale + 36 }
    : { x: DW - PANEL_W - 92, y: 136 };
  const notif = tall
    ? { x: 60, y: 36, w: 600 }
    : { x: DW - 92 - 420, y: 40, w: 420 };

  const docIn = spring({ frame, fps, config: HEAVY });
  const panelIn = spring({ frame: frame - 6, fps, config: CARD });
  const rowIn = (k: number): React.CSSProperties => {
    const p = tween(frame, 12 + k * 3, 24 + k * 3, ENTER2);
    return { opacity: p, transform: `translateY(${(1 - p) * 10}px)` };
  };

  const sendPt = {
    x: panel.x + panelW - PAD - 70,
    y: panel.y + 28 + 22,
  };
  const cur = pathAt(
    [
      {
        t: 14,
        x: tall ? DW - 80 : DW - 60,
        y: tall ? panel.y + 420 : DH - 60,
      },
      { t: T.send - 2, ...sendPt },
      { t: T.send + 8, ...sendPt },
      {
        t: T.send + 30,
        x: sendPt.x + 40,
        y: sendPt.y + 140,
      },
    ],
    frame,
  );
  const press = Math.max(
    0,
    spring({ frame: frame - T.send, fps, config: CHIP }) -
      spring({ frame: frame - T.send - 4, fps, config: CHIP }),
  );
  const cursorOp =
    tween(frame, 14, 20, ENTER2) *
    (1 - tween(frame, T.send + 20, T.send + 28, EXIT));
  const sentSwap = tween(frame, T.send + 2, T.send + 10, MOVE);

  const reachAt = [0, T.send + 4, T.viewed, T.paid];
  const paidP = tween(frame, T.paid, T.paid + 8, MOVE);
  const notifIn = spring({ frame: frame - T.payout, fps, config: CARD });

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
        preset={ground ?? (pal.dark ? "riptide" : "paper-crease")}
        params={groundParams}
        timeOffset={pal.dark ? 2 : 6}
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
            left: doc.x,
            top: doc.y,
            width: DOC.w,
            height: DOC.h,
            transformOrigin: "0 0",
            borderRadius: 6,
            boxShadow: pal.docShadow,
            opacity: tween(frame, 0, 10, ENTER2),
            transform: `translateY(${(1 - docIn) * 60}px) scale(${docScale * (0.97 + 0.03 * docIn)}) rotate(${(1 - docIn) * -2}deg)`,
          }}
        >
          <InvoiceDoc
            frame={frame}
            fps={fps}
            sender={sender}
            customer={customer}
            customerAddress={customerAddress}
            number={number}
            issued={issued}
            due={due}
            lines={lines}
            currency={currency}
            stampDate={paidDay.toUpperCase() || "PAID"}
          />
        </div>

        <div
          style={{
            position: "absolute",
            left: panel.x,
            top: panel.y,
            width: panelW,
            height: PANEL_H,
            borderRadius: 18,
            background: pal.panel,
            color: pal.text,
            boxShadow: pal.panelShadow,
            opacity: Math.min(1, panelIn * 1.4),
            transform: `translateY(${(1 - panelIn) * 40}px)`,
          }}
        >
          <div
            style={{
              position: "absolute",
              left: PAD,
              right: PAD,
              top: 28,
              height: 44,
              display: "flex",
              alignItems: "center",
              gap: 12,
              ...rowIn(0),
            }}
          >
            <span style={{ fontSize: 18, fontVariantNumeric: "tabular-nums" }}>
              {number}
            </span>
            <StatusPill frame={frame} fps={fps} pal={pal} accent={accent} />
            <div style={{ flex: 1 }} />
            <div
              style={{
                width: 156,
                height: 44,
                borderRadius: 10,
                position: "relative",
                transform: `scale(${1 - 0.04 * press})`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 16,
                background: interpolateColors(
                  sentSwap,
                  [0, 1],
                  [accent, pal.btn2],
                ),
                color: sentSwap > 0.5 ? pal.text : "#FFFFFF",
                boxShadow:
                  sentSwap > 0.5
                    ? `inset 0 0 0 1px ${pal.line}`
                    : `0 1px 2px ${withAlpha(accent, 0.3)}, inset 0 1px 0 rgba(255,255,255,0.16)`,
              }}
            >
              <span
                style={{
                  position: "absolute",
                  display: "flex",
                  gap: 8,
                  alignItems: "center",
                  opacity: 1 - sentSwap,
                }}
              >
                <Icon name="send" color="#FFFFFF" size={16} />
                Send invoice
              </span>
              <span
                style={{
                  position: "absolute",
                  display: "flex",
                  gap: 8,
                  alignItems: "center",
                  opacity: sentSwap * (1 - paidP),
                }}
              >
                <Icon name="bell" color={pal.muted} size={16} />
                Remind
              </span>
              <span
                style={{
                  position: "absolute",
                  display: "flex",
                  gap: 8,
                  alignItems: "center",
                  opacity: paidP,
                }}
              >
                <Icon name="download" color={pal.muted} size={16} />
                Receipt
              </span>
            </div>
          </div>

          <div
            style={{ position: "absolute", left: PAD, top: 98, ...rowIn(1) }}
          >
            <div
              style={{
                fontSize: 16,
                display: "inline-grid",
                color: pal.muted,
              }}
            >
              <span style={{ gridArea: "1/1", opacity: 1 - paidP }}>
                Amount due · {customer}
              </span>
              <span
                style={{ gridArea: "1/1", opacity: paidP, color: pal.green }}
              >
                Paid by {customer}
              </span>
            </div>
            <div
              style={{
                fontSize: 54,
                fontWeight: 300,
                letterSpacing: "-0.04em",
                lineHeight: 1,
                marginTop: 10,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {fmt(total, currency)}
            </div>
            <div
              style={{
                fontSize: 16,
                color: pal.muted,
                marginTop: 12,
                display: "inline-grid",
              }}
            >
              <span style={{ gridArea: "1/1", opacity: 1 - paidP }}>
                Due {due.split(",")[0]} · {customerEmail}
              </span>
              <span style={{ gridArea: "1/1", opacity: paidP }}>
                Paid {paidDay} · 11 days early
              </span>
            </div>
          </div>
          <div
            style={{
              position: "absolute",
              left: PAD,
              right: PAD,
              top: TL_Y - 34,
              height: 1,
              background: pal.line,
              ...rowIn(2),
            }}
          />

          {events.slice(0, 4).map((ev, i) => {
            const at = reachAt[i];
            const on = tween(frame, at, at + 8, ENTER2);
            const isPaid = i === 3;
            const pop = isPaid
              ? spring({ frame: frame - at, fps, config: CHIP })
              : 1;
            const nodeBg = isPaid
              ? interpolateColors(on, [0, 1], [pal.panel, pal.green])
              : on > 0.5
                ? pal.node
                : pal.panel;
            const icon = (["file", "send", "eye", "check"] as const)[i];
            const y = TL_Y + i * STEP;
            return (
              <div key={ev.title} style={rowIn(3 + i)}>
                {i < 3 ? (
                  <div
                    style={{
                      position: "absolute",
                      left: PAD + 15,
                      top: y + 34,
                      width: 1.5,
                      height: STEP - 36,
                      background: pal.line,
                    }}
                  >
                    <div
                      style={{
                        width: "100%",
                        height: "100%",
                        background: i === 2 ? pal.green : pal.faint,
                        transformOrigin: "50% 0",
                        transform: `scaleY(${tween(frame, reachAt[i + 1] - 8, reachAt[i + 1], MOVE)})`,
                        opacity: 0.7,
                      }}
                    />
                  </div>
                ) : null}
                <div
                  style={{
                    position: "absolute",
                    left: PAD,
                    top: y,
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    background: nodeBg,
                    boxShadow:
                      isPaid && on > 0.5
                        ? "none"
                        : `inset 0 0 0 1px ${pal.line}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transform: `scale(${isPaid ? 0.85 + 0.15 * pop : 1})`,
                  }}
                >
                  <div style={{ opacity: 0.3 + 0.7 * on }}>
                    <Icon
                      name={icon}
                      color={isPaid && on > 0.5 ? "#FFFFFF" : pal.text}
                      size={16}
                    />
                  </div>
                </div>
                <div
                  style={{
                    position: "absolute",
                    left: PAD + 48,
                    right: PAD,
                    top: y - 2,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: 17,
                        color:
                          on > 0.5
                            ? isPaid
                              ? pal.green
                              : pal.text
                            : pal.faint,
                      }}
                    >
                      {ev.title}
                    </div>
                    <div
                      style={{
                        fontSize: 16,
                        color: pal.muted,
                        marginTop: 2,
                        opacity: on,
                        transform: `translateY(${(1 - on) * 4}px)`,
                      }}
                    >
                      {ev.detail}
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: 16,
                      color: pal.faint,
                      fontVariantNumeric: "tabular-nums",
                      opacity: on,
                      marginTop: 1,
                    }}
                  >
                    {ev.time}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ opacity: cursorOp }}>
          <Cursor x={cur.x} y={cur.y} press={press} />
        </div>

        <div
          style={{
            position: "absolute",
            left: notif.x,
            top: notif.y,
            width: notif.w,
            borderRadius: 16,
            padding: "14px 16px",
            boxSizing: "border-box",
            background: pal.notif,
            color: pal.text,
            display: "flex",
            alignItems: "center",
            gap: 14,
            opacity: Math.min(1, Math.max(0, notifIn) * 1.5),
            transform: `translateY(${(1 - notifIn) * -70}px) scale(${0.96 + 0.04 * notifIn})`,
            boxShadow: pal.panelShadow,
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: withAlpha(pal.green, pal.dark ? 0.18 : 0.12),
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Icon name="bank" color={pal.green} size={20} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                fontSize: 17,
              }}
            >
              <span>Payout on the way</span>
              <span style={{ fontSize: 15, color: pal.faint }}>now</span>
            </div>
            <div
              style={{
                fontSize: 16,
                color: pal.muted,
                marginTop: 2,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              <span
                style={{ color: pal.text, fontVariantNumeric: "tabular-nums" }}
              >
                {fmt(total - payoutFee, currency)}
              </span>{" "}
              to ••{payoutAccount.slice(-4)} · arrives {payoutArrival}
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
}
