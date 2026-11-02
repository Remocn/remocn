"use client";

import { loadFont as loadSans } from "@remotion/google-fonts/InstrumentSans";
import { loadFont as loadSerif } from "@remotion/google-fonts/InstrumentSerif";
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

const sans = loadSans("normal", { weights: ["400"], subsets: ["latin"] });
const serif = loadSerif("normal", { weights: ["400"], subsets: ["latin"] });

export interface BookingHost {
  name: string;
  email?: string;
  /** Two-letter monogram for the avatar. */
  initials?: string;
}

export interface BookingEvent {
  title: string;
  description?: string;
  durations?: string[];
  /** Index into `durations` that is booked. */
  duration?: number;
  location?: string;
  timezone?: string;
  /** Month shown on the calendar. */
  month?: string;
  year?: number;
  /** Weekday of the 1st, 0 = Sunday. */
  firstWeekday?: number;
  daysInMonth?: number;
  /** First bookable day; weekends are never bookable. */
  firstAvailable?: number;
}

export interface CalendarBookingProps {
  host?: BookingHost;
  event?: BookingEvent;
  slots?: string[];
  /** Slot the cursor picks. Defaults to "10:30am" or the 4th slot. */
  pick?: string;
  /** Day of the month the cursor picks. */
  day?: number;
  accent?: string;
  speed?: number;
  theme?: "light" | "dark";
  ground?: GshPresetId;
  groundParams?: Partial<GradientParams>;
}

const DEFAULT_HOST: BookingHost = {
  name: "Maya Chen",
  email: "maya@kitebase.io",
  initials: "MC",
};

const DEFAULT_EVENT: BookingEvent = {
  title: "Product walkthrough",
  description:
    "Thirty minutes on the registry, live previews and the render pipeline. Bring the product you want to launch.",
  durations: ["15m", "30m", "45m"],
  duration: 1,
  location: "Video call",
  timezone: "Europe/Lisbon",
  month: "June",
  year: 2026,
  firstWeekday: 1,
  daysInMonth: 30,
  firstAvailable: 9,
};

const DEFAULT_SLOTS = [
  "9:00am",
  "9:30am",
  "10:00am",
  "10:30am",
  "11:00am",
  "1:30pm",
  "2:00pm",
  "3:30pm",
];

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const WEEKDAY_LONG = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const SPR = {
  heavy: { mass: 1, damping: 26, stiffness: 120 },
  card: { mass: 0.8, damping: 18, stiffness: 160 },
  chip: { mass: 0.5, damping: 12, stiffness: 200 },
  morph: { damping: 200 },
};
const EASE = {
  enter: Easing.bezier(0.32, 0.72, 0, 1),
  soft: Easing.bezier(0.22, 1, 0.36, 1),
  move: Easing.bezier(0.65, 0, 0.35, 1),
  exit: Easing.bezier(0.55, 0, 1, 0.45),
  camera: Easing.bezier(0.87, 0, 0.13, 1),
};
const CL = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const tween = (
  f: number,
  from: number,
  len: number,
  easing: (t: number) => number,
) => interpolate(f, [from, from + len], [0, 1], { ...CL, easing });

const BEAT = {
  card: 0,
  cursor: 8,
  day: 34,
  slot: 66,
  confirm: 88,
};

const PALETTES = {
  light: {
    card: "#FFFFFF",
    text: "#18181B",
    muted: "#71717A",
    faint: "#B4B4BB",
    line: "rgba(24,24,27,0.08)",
    tint: "rgba(24,24,27,0.045)",
    ink: "#18181B",
    inkText: "#FFFFFF",
    shadow:
      "0 0 0 1px rgba(24,24,27,0.06), 0 2px 4px rgba(24,24,27,0.04), 0 36px 80px -24px rgba(20,24,60,0.32)",
    ghost: "0 0 0 1px rgba(24,24,27,0.1), 0 1px 2px rgba(24,24,27,0.05)",
  },
  dark: {
    card: "#141518",
    text: "#EDEDEF",
    muted: "#8E9097",
    faint: "#4E5057",
    line: "rgba(255,255,255,0.07)",
    tint: "rgba(255,255,255,0.05)",
    ink: "#EDEDEF",
    inkText: "#141518",
    shadow:
      "0 0 0 1px rgba(255,255,255,0.09), inset 0 1px 0 rgba(255,255,255,0.06), 0 40px 90px -24px rgba(0,0,0,0.75)",
    ghost: "0 0 0 1px rgba(255,255,255,0.1)",
  },
};
type Palette = (typeof PALETTES)["light"];

const LIGHT_GROUND: Partial<GradientParams> = {
  colors: ["#a9bcff", "#3b5bfd", "#22349e", "#c9d6ff"],
  background: "#f1f1ef",
};

function withAlpha(color: string, alpha: number) {
  const hex = color.replace("#", "");
  const full = hex.length === 3 ? hex.replace(/(.)/g, "$1$1") : hex;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return color;
  const n = Number.parseInt(full, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

type IconName = "clock" | "video" | "globe" | "left" | "right" | "check";

function Icon({
  name,
  color,
  size = 18,
}: {
  name: IconName;
  color: string;
  size?: number;
}) {
  const p = {
    fill: "none",
    stroke: color,
    strokeWidth: 1.5,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden
      style={{ display: "block", flexShrink: 0 }}
    >
      {name === "clock" && (
        <>
          <circle cx={12} cy={12} r={8.5} {...p} />
          <path d="M12 7.5V12l3 2" {...p} />
        </>
      )}
      {name === "video" && (
        <>
          <rect x={3} y={6.5} width={12.5} height={11} rx={2.5} {...p} />
          <path d="M15.5 10.5l5-3v9l-5-3" {...p} />
        </>
      )}
      {name === "globe" && (
        <>
          <circle cx={12} cy={12} r={8.5} {...p} />
          <path
            d="M3.5 12h17M12 3.5c2.8 3 2.8 14 0 17M12 3.5c-2.8 3-2.8 14 0 17"
            {...p}
          />
        </>
      )}
      {name === "left" && <path d="M14.5 6.5L9 12l5.5 5.5" {...p} />}
      {name === "right" && <path d="M9.5 6.5L15 12l-5.5 5.5" {...p} />}
      {name === "check" && <path d="M6 12.5l4 4 8-9" {...p} />}
    </svg>
  );
}

function Cursor({
  x,
  y,
  press,
  opacity,
}: {
  x: number;
  y: number;
  press: number;
  opacity: number;
}) {
  return (
    <svg
      width={24}
      height={28}
      viewBox="0 0 20 24"
      aria-hidden
      style={{
        position: "absolute",
        left: x - 2.2,
        top: y - 2.2,
        opacity,
        transformOrigin: "2px 2px",
        transform: `scale(${1 - 0.04 * press})`,
        filter: "drop-shadow(0 2px 3px rgba(0,0,0,0.3))",
        overflow: "visible",
      }}
    >
      <path
        d="M2 2 L2 19.5 L6.6 15.4 L9.8 22.4 L12.9 21 L9.8 14.2 L16 14.2 Z"
        fill="#FFFFFF"
        stroke="#111114"
        strokeWidth={1.2}
        strokeLinejoin="round"
      />
    </svg>
  );
}

function geometry(tall: boolean, gridRows: number) {
  if (tall) {
    const cell = 64;
    const gap = 8;
    const hostH = 206;
    const calY = hostH + 24;
    const gridY = calY + 84;
    const gridBottom = gridY + gridRows * (cell + gap);
    const slotY = gridBottom + 18;
    return {
      cell,
      gap,
      host: { x: 0, y: 0, w: 560, h: hostH },
      calX: 28,
      calY,
      weekY: calY + 50,
      gridY,
      slotHeadY: slotY,
      slotX: 28,
      slotY: slotY + 44,
      slotCols: 2,
      slotW: 246,
      slotH: 46,
      slotStep: 54,
      narrow: { w: 560, h: slotY },
      wide: { w: 560, h: slotY + 44 + 4 * 54 + 16 },
      done: { w: 560, h: 440 },
    };
  }
  const cell = 56;
  const gap = 6;
  const hostW = 300;
  const calX = hostW + 32;
  const gridW = 7 * cell + 6 * gap;
  const narrowW = calX + gridW + 32;
  return {
    cell,
    gap,
    host: { x: 0, y: 0, w: hostW, h: 488 },
    calX,
    calY: 30,
    weekY: 86,
    gridY: 122,
    slotHeadY: 30,
    slotX: narrowW + 24,
    slotY: 86,
    slotCols: 1,
    slotW: 212,
    slotH: 42,
    slotStep: 50,
    narrow: { w: narrowW, h: 488 },
    wide: { w: narrowW + 260, h: 488 },
    done: { w: 620, h: 424 },
  };
}

export function CalendarBooking({
  host = DEFAULT_HOST,
  event: eventProp,
  slots = DEFAULT_SLOTS,
  pick,
  day = 18,
  accent = "#3B5BFD",
  speed = 1,
  theme = "light",
  ground,
  groundParams,
}: CalendarBookingProps) {
  const frame = useCurrentFrame() * speed;
  const { width, height, fps } = useVideoConfig();
  const tall = height > width;
  const SW = tall ? 600 : 1280;
  const SH = tall ? (600 * height) / width : 720;
  const k = width / SW;
  const dark = theme === "dark";
  const c = PALETTES[theme];
  const event = { ...DEFAULT_EVENT, ...eventProp };
  const first = event.firstWeekday ?? 1;
  const days = event.daysInMonth ?? 30;
  const gridRows = Math.ceil((first + days) / 7);
  const G = geometry(tall, gridRows);
  const sp = (at: number, config: Record<string, number>) =>
    spring({ frame: frame - at, fps, config });
  const isOpen = (d: number) => {
    const wd = (first + d - 1) % 7;
    return d >= (event.firstAvailable ?? 1) && wd !== 0 && wd !== 6;
  };
  const shown = slots.slice(0, tall ? 8 : 7);
  const wanted = shown.indexOf(pick ?? "10:30am");
  const pickIdx = wanted >= 0 ? wanted : Math.min(3, shown.length - 1);
  const pickLabel = shown[pickIdx] ?? "";

  const cardIn = sp(BEAT.card, SPR.heavy);
  const cardOp = tween(frame, BEAT.card, 10, EASE.enter);
  const dayFill = sp(BEAT.day, SPR.chip);
  const widen = sp(BEAT.day + 2, SPR.heavy);
  const split = sp(BEAT.slot + 1, SPR.card);
  const morph = sp(BEAT.confirm + 2, SPR.morph);
  const cam =
    1 +
    0.03 * tween(frame, 6, 80, EASE.camera) +
    0.015 * tween(frame, BEAT.confirm + 10, 60, EASE.camera);

  const bookW = G.narrow.w + (G.wide.w - G.narrow.w) * widen;
  const bookH = G.narrow.h + (G.wide.h - G.narrow.h) * widen;
  const cardW = bookW + (G.done.w - bookW) * morph;
  const cardH = bookH + (G.done.h - bookH) * morph;
  const cardX = (SW - cardW) / 2;
  const cardY = (SH - cardH) / 2 + (1 - cardIn) * 36;

  const cellPos = (d: number) => {
    const idx = first + d - 1;
    return {
      x: G.calX + (idx % 7) * (G.cell + G.gap),
      y: G.gridY + Math.floor(idx / 7) * (G.cell + G.gap),
    };
  };
  const slotPos = (i: number) => ({
    x: G.slotX + (i % G.slotCols) * (G.slotW + 12),
    y: G.slotY + Math.floor(i / G.slotCols) * G.slotStep,
  });
  const narrowOrigin = { x: (SW - G.narrow.w) / 2, y: (SH - G.narrow.h) / 2 };
  const wideOrigin = { x: (SW - G.wide.w) / 2, y: (SH - G.wide.h) / 2 };
  const dc = cellPos(day);
  const dayPt = {
    x: narrowOrigin.x + dc.x + G.cell / 2 + 4,
    y: narrowOrigin.y + dc.y + G.cell / 2 + 4,
  };
  const ps = slotPos(pickIdx);
  const half = (G.slotW - 8) / 2;
  const slotPt = {
    x: wideOrigin.x + ps.x + G.slotW / 2 + 6,
    y: wideOrigin.y + ps.y + G.slotH / 2 + 4,
  };
  const confirmPt = {
    x: wideOrigin.x + ps.x + half + 8 + half / 2 + 4,
    y: slotPt.y,
  };
  const start = tall ? { x: 660, y: 1120 } : { x: 1360, y: 800 };
  const legs = [
    { at: BEAT.cursor, from: start, to: dayPt, arc: 1 },
    { at: BEAT.slot - 20, from: dayPt, to: slotPt, arc: -1 },
    { at: BEAT.confirm - 16, from: slotPt, to: confirmPt, arc: 1 },
    {
      at: BEAT.confirm + 10,
      from: confirmPt,
      to: { x: confirmPt.x + 60, y: confirmPt.y + 110 },
      arc: -1,
    },
  ];
  let curX = start.x;
  let curY = start.y;
  for (const leg of legs) {
    const p = sp(leg.at, SPR.heavy);
    const dx = leg.to.x - leg.from.x;
    const dy = leg.to.y - leg.from.y;
    const len = Math.hypot(dx, dy) || 1;
    const bend = Math.sin(clamp01(p) * Math.PI) * Math.min(60, len * 0.14);
    curX += dx * p + (-dy / len) * bend * leg.arc;
    curY += dy * p + (dx / len) * bend * leg.arc;
  }
  const pressOf = (at: number) =>
    clamp01(sp(at - 2, SPR.chip) - sp(at + 3, SPR.chip));
  const press = Math.max(
    pressOf(BEAT.day),
    pressOf(BEAT.slot),
    pressOf(BEAT.confirm),
  );
  const curOp =
    tween(frame, BEAT.cursor, 5, EASE.enter) *
    (1 - tween(frame, BEAT.confirm + 22, 10, EASE.exit));

  const bookOp = 1 - tween(frame, BEAT.confirm + 2, 7, EASE.exit);
  const doneOp = tween(frame, BEAT.confirm + 7, 9, EASE.enter);
  const slotHover = tween(frame, BEAT.slot - 6, 4, EASE.enter);
  const wd = (first + day - 1) % 7;
  const end = shown[pickIdx + 1] ?? "";

  return (
    <AbsoluteFill
      style={{
        overflow: "hidden",
        fontFamily: sans.fontFamily,
        WebkitFontSmoothing: "antialiased",
      }}
    >
      <GshGround
        preset={ground ?? (dark ? "film-blue" : "glasswork")}
        params={groundParams ?? (dark ? undefined : LIGHT_GROUND)}
        timeOffset={2}
        timeScale={0.45}
      />
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: SW,
          height: SH,
          transform: `scale(${k})`,
          transformOrigin: "0 0",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            transform: `scale(${cam})`,
            transformOrigin: `${SW / 2}px ${SH / 2}px`,
          }}
        >
          <div
            style={{
              position: "absolute",
              left: cardX,
              top: cardY,
              width: cardW,
              height: cardH,
              borderRadius: 22,
              background: c.card,
              boxShadow: c.shadow,
              overflow: "hidden",
              opacity: cardOp,
            }}
          >
            <div
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                width: G.wide.w,
                height: G.wide.h,
                opacity: bookOp,
                transform: `scale(${1 - 0.03 * morph})`,
                transformOrigin: "50% 40%",
              }}
            >
              <HostPanel host={host} event={event} c={c} tall={tall} G={G} />
              <div
                style={{
                  position: "absolute",
                  left: G.calX,
                  top: G.calY,
                  width: 7 * G.cell + 6 * G.gap,
                  height: 32,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div style={{ fontSize: 19, color: c.text }}>
                  {event.month}{" "}
                  <span style={{ color: c.muted }}>{event.year}</span>
                </div>
                <div style={{ display: "flex", gap: 14 }}>
                  <Icon name="left" color={c.faint} size={20} />
                  <Icon name="right" color={c.text} size={20} />
                </div>
              </div>
              {WEEKDAYS.map((w, i) => (
                <div
                  key={w}
                  style={{
                    position: "absolute",
                    left: G.calX + i * (G.cell + G.gap),
                    top: G.weekY,
                    width: G.cell,
                    textAlign: "center",
                    fontSize: 16,
                    color: c.muted,
                  }}
                >
                  {w}
                </div>
              ))}
              {Array.from({ length: days }, (_, i) => i + 1).map((d) => {
                const idx = first + d - 1;
                const open = isOpen(d);
                const sel = d === day;
                const pos = cellPos(d);
                const appear = tween(
                  frame,
                  3 + (idx % 7) * 0.7 + Math.floor(idx / 7) * 1.6,
                  10,
                  EASE.soft,
                );
                return (
                  <div
                    key={d}
                    style={{
                      position: "absolute",
                      left: pos.x,
                      top: pos.y,
                      width: G.cell,
                      height: G.cell,
                      borderRadius: 12,
                      background: open ? c.tint : "transparent",
                      opacity: appear,
                      transform: `translateY(${(1 - appear) * 8}px)`,
                    }}
                  >
                    {sel ? (
                      <div
                        style={{
                          position: "absolute",
                          inset: 0,
                          borderRadius: 12,
                          background: c.ink,
                          transform: `scale(${0.6 + 0.4 * dayFill})`,
                          opacity: clamp01(dayFill * 3),
                        }}
                      />
                    ) : null}
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 17,
                        fontVariantNumeric: "tabular-nums",
                        color:
                          sel && dayFill > 0.3
                            ? c.inkText
                            : open
                              ? c.text
                              : c.faint,
                      }}
                    >
                      {d}
                    </div>
                  </div>
                );
              })}
              <div
                style={{
                  position: "absolute",
                  left: tall ? 0 : G.narrow.w,
                  top: tall ? G.narrow.h - 1 : 0,
                  width: tall ? G.wide.w : 1,
                  height: tall ? 1 : G.wide.h,
                  background: c.line,
                  opacity: clamp01(widen * 2),
                }}
              />
              <div
                style={{
                  position: "absolute",
                  left: G.slotX,
                  top: G.slotHeadY,
                  height: 32,
                  display: "flex",
                  alignItems: "center",
                  fontSize: 19,
                  color: c.text,
                  opacity: tween(frame, BEAT.day + 8, 10, EASE.enter),
                }}
              >
                {WEEKDAY_LONG[wd].slice(0, 3)}&nbsp;
                <span style={{ color: c.muted }}>{day}</span>
              </div>
              {shown.map((s, i) => {
                const inn = sp(BEAT.day + 10 + i * 2, SPR.card);
                const picked = i === pickIdx;
                const sv = picked ? split : 0;
                const pos = slotPos(i);
                const timeW = G.slotW - (G.slotW - half) * sv;
                const base: React.CSSProperties = {
                  position: "absolute",
                  top: pos.y,
                  height: G.slotH,
                  borderRadius: 10,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  fontSize: 17,
                  boxSizing: "border-box",
                  overflow: "hidden",
                  whiteSpace: "nowrap",
                  fontVariantNumeric: "tabular-nums",
                };
                return (
                  <div key={s}>
                    <div
                      style={{
                        ...base,
                        left: pos.x + (1 - inn) * 18,
                        width: timeW,
                        opacity: clamp01(inn * 1.5),
                        color: c.text,
                        background: picked && sv > 0.05 ? c.tint : c.card,
                        boxShadow:
                          picked && slotHover > 0 && sv < 0.5
                            ? `0 0 0 1px ${c.text}`
                            : c.ghost,
                      }}
                    >
                      {s}
                    </div>
                    {picked && sv > 0.01 ? (
                      <div
                        style={{
                          ...base,
                          left: pos.x + timeW + 8,
                          width: Math.max(0, G.slotW - timeW - 8),
                          background: accent,
                          color: "#FFFFFF",
                          opacity: clamp01(sv * 2),
                          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.16)",
                          transform: `scale(${1 - 0.04 * pressOf(BEAT.confirm)})`,
                        }}
                      >
                        Confirm
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
            {morph > 0.01 ? (
              <SuccessView
                frame={frame - BEAT.confirm - 6}
                fps={fps}
                c={c}
                accent={accent}
                opacity={doneOp}
                left={(cardW - G.done.w) / 2}
                top={(cardH - G.done.h) / 2}
                w={G.done.w}
                h={G.done.h}
                host={host}
                event={event}
                when={`${WEEKDAY_LONG[wd]}, ${event.month} ${day}`}
                time={`${pickLabel}${end ? ` – ${end}` : ""}`}
              />
            ) : null}
          </div>
          <Cursor x={curX} y={curY} press={press} opacity={curOp} />
        </div>
      </div>
    </AbsoluteFill>
  );
}

function HostPanel({
  host,
  event,
  c,
  tall,
  G,
}: {
  host: BookingHost;
  event: BookingEvent;
  c: Palette;
  tall: boolean;
  G: ReturnType<typeof geometry>;
}) {
  const meta: [IconName, string | undefined][] = [
    ["clock", event.durations?.[event.duration ?? 0]?.replace("m", " min")],
    ["video", event.location],
    ["globe", event.timezone],
  ];
  return (
    <div
      style={{
        position: "absolute",
        left: G.host.x,
        top: G.host.y,
        width: G.host.w,
        height: G.host.h,
        boxSizing: "border-box",
        padding: tall ? "28px 28px" : "32px 30px",
        boxShadow: tall
          ? `inset 0 -1px 0 ${c.line}`
          : `inset -1px 0 0 ${c.line}`,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            background: c.tint,
            boxShadow: `inset 0 0 0 1px ${c.line}`,
            color: c.text,
            fontSize: 14.5,
            letterSpacing: "0.02em",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {host.initials ?? host.name.slice(0, 2).toUpperCase()}
        </div>
        <span style={{ fontSize: 17, color: c.muted }}>{host.name}</span>
      </div>
      <div
        style={{
          marginTop: tall ? 16 : 22,
          fontFamily: serif.fontFamily,
          fontSize: tall ? 38 : 40,
          lineHeight: 1.05,
          letterSpacing: "-0.01em",
          color: c.text,
        }}
      >
        {event.title}
      </div>
      {!tall && event.description ? (
        <div
          style={{
            marginTop: 14,
            fontSize: 16,
            lineHeight: 1.5,
            color: c.muted,
          }}
        >
          {event.description}
        </div>
      ) : null}
      <div
        style={{
          marginTop: tall ? 22 : 26,
          display: "flex",
          flexDirection: tall ? "row" : "column",
          gap: tall ? 20 : 14,
        }}
      >
        {meta.map(([icon, label]) =>
          label ? (
            <div
              key={icon}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: 16,
                color: c.text,
                whiteSpace: "nowrap",
              }}
            >
              <Icon name={icon} color={c.muted} />
              {label}
            </div>
          ) : null,
        )}
      </div>
    </div>
  );
}

function SuccessView({
  frame,
  fps,
  c,
  accent,
  opacity,
  left,
  top,
  w,
  h,
  host,
  event,
  when,
  time,
}: {
  frame: number;
  fps: number;
  c: Palette;
  accent: string;
  opacity: number;
  left: number;
  top: number;
  w: number;
  h: number;
  host: BookingHost;
  event: BookingEvent;
  when: string;
  time: string;
}) {
  const disc = spring({ frame: frame - 2, fps, config: SPR.chip });
  const tick = tween(frame, 6, 10, EASE.enter);
  const item = (i: number): React.CSSProperties => {
    const p = tween(frame, 4 + i * 3, 12, EASE.soft);
    return { opacity: p, transform: `translateY(${(1 - p) * 10}px)` };
  };
  const rows: [string, React.ReactNode][] = [
    [
      "When",
      <>
        {when}
        <div style={{ color: c.muted, marginTop: 2 }}>
          {time} · {event.timezone}
        </div>
      </>,
    ],
    [
      "With",
      <>
        {host.name}
        <div style={{ color: c.muted, marginTop: 2 }}>{host.email}</div>
      </>,
    ],
    ["Where", event.location],
  ];
  return (
    <div
      style={{
        position: "absolute",
        left,
        top,
        width: w,
        height: h,
        boxSizing: "border-box",
        padding: "40px 40px",
        opacity,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            background: withAlpha(accent, 0.12),
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transform: `scale(${0.5 + 0.5 * disc})`,
            opacity: clamp01(disc * 2),
          }}
        >
          <svg width={24} height={24} viewBox="0 0 24 24" aria-hidden>
            <path
              d="M6 12.5l4 4 8-9"
              fill="none"
              stroke={accent}
              strokeWidth={1.75}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={20}
              strokeDashoffset={20 * (1 - tick)}
            />
          </svg>
        </div>
        <div style={{ fontSize: 17, color: c.muted, ...item(0) }}>
          Invite sent to your inbox
        </div>
      </div>
      <div
        style={{
          ...item(1),
          marginTop: 26,
          fontFamily: serif.fontFamily,
          fontSize: 46,
          lineHeight: 1.05,
          letterSpacing: "-0.01em",
          color: c.text,
        }}
      >
        You’re booked with {host.name.split(" ")[0]}
      </div>
      <div
        style={{
          marginTop: 28,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {rows.map(([label, value], i) => (
          <div
            key={label}
            style={{
              display: "flex",
              padding: "14px 0",
              boxShadow: `inset 0 1px 0 ${c.line}`,
              fontSize: 17,
              lineHeight: 1.35,
              color: c.text,
              ...item(2 + i),
            }}
          >
            <div style={{ width: 92, flexShrink: 0, color: c.muted }}>
              {label}
            </div>
            <div>{value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
