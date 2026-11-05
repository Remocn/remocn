"use client";

import {
  type CSSProperties,
  createContext,
  type ReactNode,
  useContext,
} from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";

/**
 * Shared kit behind the design-review family (redline-measure, audit-boxes,
 * scan-fix, token-tags, layout-guides, design-audit): the annotation marks a
 * design review paints over a UI, the scan band that sweeps a fix across it,
 * and a demo calendar dashboard the marks are measured against by default.
 *
 * Every coordinate is in composition pixels of a 1280x720 frame.
 */

const AuditSpeed = createContext(1);

/** Scales the clock every mark below it reads. */
export function AuditClock({
  speed,
  children,
}: {
  speed: number;
  children: ReactNode;
}) {
  return <AuditSpeed.Provider value={speed}>{children}</AuditSpeed.Provider>;
}

export function useAuditFrame() {
  return useCurrentFrame() * useContext(AuditSpeed);
}

/* Demo dashboard */
/**
 * A calendar dashboard drawn from one layout function, so every annotation
 * can measure the exact rects the UI paints. Version 1 is the "before"
 * build with drifted spacing and radii, version 2 is the fixed one.
 */

export type Rect = { x: number; y: number; w: number; h: number };
export type Version = 1 | 2;

export const FONT =
  "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
export const MONO = "ui-monospace, 'SF Mono', Menlo, Consolas, monospace";

const C = {
  stage: "#EDEDEF",
  window: "#FFFFFF",
  ink: "#0E121B",
  sub: "#525866",
  soft: "#99A0AE",
  stroke: "#E1E4EA",
  weak: "#F5F7FA",
  primary: "#7D52F4",
  success: "#1FC16B",
  successBg: "#E0FAEC",
  warning: "#FA7319",
  warningBg: "#FFF1EB",
  error: "#FB3748",
  errorBg: "#FFEBEC",
  blue: "#335CFF",
  blueBg: "#EBF1FF",
  orangeBg: "#FFF3EB",
  purpleBg: "#EFEBFF",
};

export const WIN: Rect = { x: 80, y: 64, w: 1120, h: 616 };
const SIDE_W = 216;
const HEADER_H = 56;
const MAIN_X = WIN.x + SIDE_W;
const MAIN_R = WIN.x + WIN.w;

const CARDS = [
  {
    title: "Weekly team meeting",
    time: "3:00 – 4:30 PM",
    status: "Today",
    action: "Join meeting",
    dot: C.success,
    bg: C.successBg,
  },
  {
    title: "Product launch event",
    time: "11:00 AM – 12:30 PM",
    status: "2 conflicts",
    action: "Review",
    dot: C.warning,
    bg: C.warningBg,
  },
  {
    title: "Team building workshop",
    time: "10:00 AM – 1:00 PM",
    status: "Canceled",
    action: "Fri, Nov 6",
    dot: C.error,
    bg: C.errorBg,
  },
  {
    title: "Marketing campaign",
    time: "2:30 – 4:00 PM",
    status: "In 3 days",
    action: "Thu, Nov 5",
    dot: C.soft,
    bg: C.weak,
  },
];

const TABS = [
  { label: "All scheduled", count: "15" },
  { label: "Meetings", count: "12" },
  { label: "Events", count: "3" },
  { label: "Conflicted", count: "2" },
  { label: "Canceled", count: "1" },
];

const DAYS = ["Mon 2", "Tue 3", "Wed 4", "Thu 5", "Fri 6"];
const HOURS = ["9 AM", "10 AM", "11 AM", "12 PM", "1 PM"];

const EVENTS = [
  { day: 0, from: 0, to: 0.5, title: "Brainstorming session", tone: "gray" },
  { day: 0, from: 0.55, to: 1.05, title: "Bi-weekly sync", tone: "gray" },
  { day: 1, from: 0, to: 0.45, title: "Project review", tone: "blue" },
  { day: 1, from: 1.05, to: 2.6, title: "Sales team training", tone: "blue" },
  { day: 2, from: 0.5, to: 1.0, title: "Marketing strategy", tone: "blue" },
  { day: 2, from: 2.6, to: 3.6, title: "Interview: frontend", tone: "purple" },
  { day: 3, from: 0, to: 1.0, title: "Customer feedback", tone: "blue" },
  { day: 3, from: 2.2, to: 3.4, title: "Product launch", tone: "orange" },
  { day: 0, from: 2.5, to: 3.7, title: "Workshop: design", tone: "orange" },
  { day: 4, from: 1.1, to: 3.7, title: "Team building", tone: "gray" },
] as const;

const TONES = {
  gray: { bg: C.weak, ink: C.sub },
  blue: { bg: C.blueBg, ink: "#2547D0" },
  purple: { bg: C.purpleBg, ink: "#5B3CC4" },
  orange: { bg: C.orangeBg, ink: "#C2540A" },
};

/** Every rect the dashboard paints, in composition pixels. */
export function demoLayout(v: Version) {
  const pad = v === 2 ? 24 : 20;
  const gap = v === 2 ? 16 : 10;
  const cardPad = v === 2 ? 16 : 12;
  const radius = v === 2 ? 12 : 6;
  const contentX = MAIN_X + pad;
  const contentW = MAIN_R - pad - contentX;

  const header: Rect = { x: MAIN_X, y: WIN.y, w: MAIN_R - MAIN_X, h: HEADER_H };
  const button: Rect = {
    x: MAIN_R - pad - 128,
    y: WIN.y + 12,
    w: 128,
    h: v === 2 ? 32 : 34,
  };
  const tabsY = WIN.y + HEADER_H + (v === 2 ? 16 : 12);
  let tabX = contentX;
  const tabs = TABS.map((tab, i) => {
    const w = 46 + tab.label.length * 7.4 + (i === 0 ? 26 : 0);
    const rect: Rect = { x: tabX, y: tabsY, w, h: 32 };
    tabX += w + 14;
    return rect;
  });

  const cardsY = tabsY + 32 + (v === 2 ? 16 : 12);
  const cardW = (contentW - gap * 3) / 4;
  const cards = CARDS.map((_, i) => {
    const rect: Rect = {
      x: contentX + i * (cardW + gap),
      y: cardsY,
      w: cardW,
      h: 92,
    };
    return {
      rect,
      title: { x: rect.x + cardPad, y: rect.y + cardPad, w: 150, h: 18 },
      time: { x: rect.x + cardPad, y: rect.y + cardPad + 21, w: 110, h: 15 },
      status: {
        x: rect.x + cardPad - 4,
        y: rect.y + rect.h - cardPad - 24,
        w: rect.w - cardPad * 2 + 8,
        h: 26,
      },
      chevron: {
        x: rect.x + rect.w - cardPad - 20,
        y: rect.y + cardPad - 2,
        w: 20,
        h: 20,
      },
    };
  });

  const calY = cardsY + 92 + 22;
  const calendar: Rect = {
    x: contentX,
    y: calY,
    w: contentW,
    h: WIN.y + WIN.h - calY - 16,
  };
  const gutter = 56;
  const colW = (contentW - gutter) / DAYS.length;
  const dayHeaderH = 30;
  const hourH = (calendar.h - dayHeaderH) / 4;
  const columns = DAYS.map(
    (_, i): Rect => ({
      x: contentX + gutter + i * colW,
      y: calY,
      w: colW,
      h: calendar.h,
    }),
  );
  const events = EVENTS.map((event) => ({
    ...event,
    rect: {
      x: columns[event.day].x + 4,
      y: calY + dayHeaderH + event.from * hourH + 3,
      w: colW - 8,
      h: (event.to - event.from) * hourH - 6,
    } satisfies Rect,
  }));

  return {
    v,
    pad,
    gap,
    cardPad,
    radius,
    contentX,
    header,
    button,
    tabs,
    cards,
    calendar,
    columns,
    gutter,
    dayHeaderH,
    hourH,
    events,
    sidebar: { x: WIN.x, y: WIN.y, w: SIDE_W, h: WIN.h } satisfies Rect,
    sideActive: { x: WIN.x + 10, y: WIN.y + 158, w: SIDE_W - 20, h: 30 },
  };
}

export type DemoLayout = ReturnType<typeof demoLayout>;

const abs = (r: Rect): CSSProperties => ({
  position: "absolute",
  left: r.x,
  top: r.y,
  width: r.w,
  height: r.h,
});

function Glyph({
  size = 14,
  color = C.soft,
}: {
  size?: number;
  color?: string;
}) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 4,
        border: `1.5px solid ${color}`,
        flexShrink: 0,
      }}
    />
  );
}

const SIDE_ITEMS: (string | { section: string })[] = [
  "Inbox",
  "Dashboard",
  { section: "Workspace" },
  "Calendar",
  "Time off",
  "People",
  "Payroll",
  "Projects",
  "Documents",
  { section: "Favorites" },
  "Loom Mobile App",
  "Monday Re-design",
  "Udemy Courses",
];

function Sidebar({ l }: { l: DemoLayout }) {
  let y = WIN.y + 68;
  return (
    <>
      <div
        style={{
          ...abs({ x: WIN.x, y: WIN.y, w: SIDE_W, h: WIN.h }),
          borderRight: `1px solid ${C.stroke}`,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: WIN.x + 18,
          top: WIN.y + 18,
          display: "flex",
          alignItems: "center",
          gap: 10,
          fontSize: 14,
          fontWeight: 600,
          color: C.ink,
        }}
      >
        <div
          style={{
            width: 22,
            height: 22,
            borderRadius: 11,
            background: C.primary,
          }}
        />
        Synergy
      </div>
      {SIDE_ITEMS.map((item) => {
        const top = y;
        if (typeof item !== "string") {
          y += 30;
          return (
            <div
              key={item.section}
              style={{
                position: "absolute",
                left: WIN.x + 20,
                top: top + 10,
                fontSize: 11,
                letterSpacing: "0.04em",
                textTransform: "uppercase",
                color: C.soft,
              }}
            >
              {item.section}
            </div>
          );
        }
        y += 30;
        const active = item === "Calendar";
        return (
          <div
            key={item}
            style={{
              ...abs(
                active
                  ? l.sideActive
                  : { x: WIN.x + 10, y: top, w: SIDE_W - 20, h: 30 },
              ),
              display: "flex",
              alignItems: "center",
              gap: 10,
              paddingLeft: 10,
              borderRadius: l.v === 2 ? 8 : 5,
              background: active ? C.weak : undefined,
              fontSize: 13,
              fontWeight: active ? 500 : 400,
              color: active ? C.ink : C.sub,
            }}
          >
            <Glyph color={active ? C.primary : C.soft} />
            {item}
          </div>
        );
      })}
      <div
        style={{
          position: "absolute",
          left: WIN.x + 18,
          top: WIN.y + WIN.h - 44,
          display: "flex",
          alignItems: "center",
          gap: 10,
          fontSize: 13,
          color: C.ink,
        }}
      >
        <div
          style={{
            width: 26,
            height: 26,
            borderRadius: 13,
            background: "linear-gradient(135deg,#FBC5A6,#F17B6A)",
          }}
        />
        Olivia Hart
      </div>
    </>
  );
}

function Header({ l }: { l: DemoLayout }) {
  return (
    <>
      <div
        style={{
          ...abs(l.header),
          borderBottom: `1px solid ${C.stroke}`,
          display: "flex",
          alignItems: "center",
          gap: 12,
          paddingLeft: l.pad,
          fontSize: 14,
        }}
      >
        <Glyph size={16} color={C.sub} />
        <span style={{ fontWeight: 600, color: C.ink }}>
          Monday, November 2
        </span>
        <span style={{ color: C.soft }}>
          You have 3 meetings and 1 event today.
        </span>
      </div>
      <div
        style={{
          ...abs({ x: l.button.x - 104, y: l.button.y, w: 92, h: l.button.h }),
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          borderRadius: l.v === 2 ? 8 : 6,
          border: `1px solid ${C.stroke}`,
          fontSize: 13,
          color: C.sub,
        }}
      >
        Schedule
      </div>
      <div
        style={{
          ...abs(l.button),
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: l.v === 2 ? 8 : 6,
          background: l.v === 2 ? C.primary : "#8B5CF6",
          color: "#fff",
          fontSize: 13,
          fontWeight: 500,
        }}
      >
        + Create event
      </div>
    </>
  );
}

function Tabs({ l }: { l: DemoLayout }) {
  return (
    <>
      {TABS.map((tab, i) => (
        <div
          key={tab.label}
          style={{
            ...abs(l.tabs[i]),
            display: "flex",
            alignItems: "center",
            gap: 7,
            fontSize: 13,
            fontWeight: i === 0 ? 500 : 400,
            color: i === 0 ? C.ink : C.sub,
            borderBottom: i === 0 ? `2px solid ${C.primary}` : undefined,
          }}
        >
          <Glyph color={i === 0 ? C.primary : C.soft} />
          {tab.label}
          <span
            style={{
              fontSize: 11,
              fontWeight: 500,
              color: i === 0 ? "#fff" : C.soft,
              background:
                i === 0 ? (l.v === 2 ? C.primary : "#8B5CF6") : undefined,
              borderRadius: 8,
              padding: i === 0 ? "1px 6px" : 0,
            }}
          >
            {tab.count}
          </span>
        </div>
      ))}
      <div
        style={{
          position: "absolute",
          left: l.contentX,
          top: l.tabs[0].y + 32,
          width: WIN.x + WIN.w - l.pad - l.contentX,
          height: 1,
          background: C.stroke,
        }}
      />
    </>
  );
}

function Cards({ l }: { l: DemoLayout }) {
  return (
    <>
      {CARDS.map((card, i) => {
        const r = l.cards[i];
        return (
          <div key={card.title}>
            <div
              style={{
                ...abs(r.rect),
                borderRadius: l.radius,
                border: `1px solid ${C.stroke}`,
                background: "#fff",
                boxShadow: "0 1px 2px rgba(10,13,20,0.04)",
              }}
            />
            <div
              style={{
                ...abs(r.title),
                width: r.rect.w - l.cardPad * 2 - 24,
                fontSize: l.v === 2 ? 14 : 13.5,
                fontWeight: 600,
                color: C.ink,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {card.title}
            </div>
            <div
              style={{ ...abs(r.time), width: 160, fontSize: 12, color: C.sub }}
            >
              {card.time}
            </div>
            <div
              style={{
                ...abs(r.chevron),
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: C.soft,
                fontSize: 11,
              }}
            >
              ⌄
            </div>
            <div
              style={{
                ...abs(r.status),
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0 8px",
                borderRadius: l.v === 2 ? 6 : 4,
                background: card.bg,
                fontSize: 12,
              }}
            >
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  color: C.ink,
                }}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    background: card.dot,
                  }}
                />
                {card.status}
              </span>
              <span
                style={{
                  color: C.sub,
                  textDecoration: i === 0 ? "underline" : undefined,
                }}
              >
                {card.action}
              </span>
            </div>
          </div>
        );
      })}
    </>
  );
}

function Calendar({ l }: { l: DemoLayout }) {
  const { calendar: cal, columns, dayHeaderH, hourH } = l;
  return (
    <>
      {DAYS.map((day, i) => (
        <div
          key={day}
          style={{
            ...abs({
              x: columns[i].x,
              y: cal.y,
              w: columns[i].w,
              h: dayHeaderH,
            }),
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 12,
            fontWeight: i === 0 ? 600 : 400,
            color: i === 0 ? C.ink : C.soft,
            borderLeft: `1px solid ${C.stroke}`,
            borderBottom: `1px solid ${C.stroke}`,
          }}
        >
          {day}
        </div>
      ))}
      {HOURS.slice(0, 4).map((hour, i) => (
        <div
          key={hour}
          style={{
            position: "absolute",
            left: cal.x,
            top: cal.y + dayHeaderH + i * hourH - 2,
            width: l.gutter - 10,
            textAlign: "right",
            fontSize: 11,
            color: C.soft,
          }}
        >
          {hour}
        </div>
      ))}
      {columns.map((col) => (
        <div
          key={col.x}
          style={{
            position: "absolute",
            left: col.x,
            top: cal.y + dayHeaderH,
            width: 1,
            height: cal.h - dayHeaderH,
            background: C.stroke,
          }}
        />
      ))}
      {l.events.map((event) => {
        const tone = TONES[event.tone];
        return (
          <div
            key={`${event.day}-${event.from}`}
            style={{
              ...abs(event.rect),
              borderRadius: l.v === 2 ? 8 : 4,
              background: tone.bg,
              padding: "6px 8px",
              fontSize: 11.5,
              fontWeight: 500,
              color: tone.ink,
              overflow: "hidden",
              whiteSpace: "nowrap",
              textOverflow: "ellipsis",
            }}
          >
            {event.title}
          </div>
        );
      })}
    </>
  );
}

/** The whole dashboard window, positioned in a 1280x720 frame. */
export function DemoDashboard({ v }: { v: Version }) {
  const l = demoLayout(v);
  return (
    <div style={{ position: "absolute", inset: 0, fontFamily: FONT }}>
      <div
        style={{
          ...abs(WIN),
          background: C.window,
          borderRadius: 16,
          boxShadow:
            "0 0 0 1px rgba(10,13,20,0.04), 0 16px 40px -12px rgba(10,13,20,0.12)",
        }}
      />
      <div
        style={{
          ...abs(WIN),
          borderRadius: 16,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: -WIN.x,
            top: -WIN.y,
            width: 1280,
            height: 720,
          }}
        >
          <Sidebar l={l} />
          <Header l={l} />
          <Tabs l={l} />
          <Cards l={l} />
          <Calendar l={l} />
        </div>
      </div>
    </div>
  );
}

/* Marks */

/**
 * Annotation primitives: the redline marks a design review paints over a UI.
 * Each takes a `delay` in frames and draws itself in from there.
 */

const clamp = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};

export function progress(frame: number, start: number, duration: number) {
  return interpolate(frame, [start, start + duration], [0, 1], {
    ...clamp,
    easing: Easing.out(Easing.cubic),
  });
}

/** Pop-in for labels and chips: a cubic ease-out, no overshoot. */
function usePop(delay: number) {
  return progress(useAuditFrame(), delay, 12);
}

function Layer({ children }: { children: ReactNode }) {
  return (
    <svg
      width={1280}
      height={720}
      viewBox="0 0 1280 720"
      style={{ position: "absolute", inset: 0, overflow: "visible" }}
    >
      {children}
    </svg>
  );
}

export type Side =
  | "center"
  | "above"
  | "below"
  | "left"
  | "right"
  | "aboveStart"
  | "aboveEnd"
  | "belowStart";

/** Small spec label: mono text on a solid color chip. */
export function Pill({
  x,
  y,
  text,
  color,
  delay = 0,
  anchor = "center",
  ink = "#fff",
}: {
  x: number;
  y: number;
  text: string;
  color: string;
  delay?: number;
  anchor?: Side;
  ink?: string;
}) {
  const pop = usePop(delay);
  const shift = {
    center: "translate(-50%, -50%)",
    above: "translate(-50%, calc(-100% - 5px))",
    below: "translate(-50%, 5px)",
    left: "translate(calc(-100% - 6px), -50%)",
    right: "translate(6px, -50%)",
    aboveStart: "translate(0, calc(-100% - 5px))",
    aboveEnd: "translate(-100%, calc(-100% - 5px))",
    belowStart: "translate(0, 5px)",
  }[anchor];
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform: `${shift} scale(${0.7 + 0.3 * pop})`,
        opacity: Math.min(1, pop * 1.4),
        background: color,
        color: ink,
        fontFamily: MONO,
        fontSize: 10.5,
        fontWeight: 600,
        lineHeight: "15px",
        padding: "0 5px",
        borderRadius: 3,
        whiteSpace: "nowrap",
      }}
    >
      {text}
    </div>
  );
}

/**
 * Measurement between two points on one axis: end ticks snap in, the line
 * grows out from its middle, then the value pops on.
 */
export function Ruler({
  from,
  to,
  label,
  color,
  delay = 0,
  labelSide,
}: {
  from: [number, number];
  to: [number, number];
  label: string;
  color: string;
  delay?: number;
  labelSide?: Side;
}) {
  const frame = useAuditFrame();
  const grow = progress(frame, delay, 12);
  const ticks = progress(frame, delay - 2, 6);
  const horizontal = Math.abs(to[0] - from[0]) >= Math.abs(to[1] - from[1]);
  const mx = (from[0] + to[0]) / 2;
  const my = (from[1] + to[1]) / 2;
  const x1 = mx + (from[0] - mx) * grow;
  const y1 = my + (from[1] - my) * grow;
  const x2 = mx + (to[0] - mx) * grow;
  const y2 = my + (to[1] - my) * grow;
  const t = 4 * ticks;
  const tick = (x: number, y: number) =>
    horizontal ? `M${x} ${y - t}V${y + t}` : `M${x - t} ${y}H${x + t}`;
  return (
    <>
      <Layer>
        <path
          d={`${tick(...from)}${tick(...to)}`}
          stroke={color}
          strokeWidth={1.25}
          fill="none"
        />
        <line
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke={color}
          strokeWidth={1.25}
        />
      </Layer>
      <Pill
        x={mx}
        y={my}
        text={label}
        color={color}
        delay={delay + 7}
        anchor={labelSide ?? (horizontal ? "above" : "left")}
      />
    </>
  );
}

/** Hairline box traced around an element, clockwise from the top left. */
export function OutlineBox({
  rect,
  color,
  delay = 0,
  radius = 3,
  inset = -3,
  dashed,
  fill,
}: {
  rect: Rect;
  color: string;
  delay?: number;
  radius?: number;
  inset?: number;
  dashed?: boolean;
  fill?: string;
}) {
  const frame = useAuditFrame();
  const draw = progress(frame, delay, 14);
  const x = rect.x + inset;
  const y = rect.y + inset;
  const w = rect.w - inset * 2;
  const h = rect.h - inset * 2;
  return (
    <Layer>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={radius}
        fill={fill ?? "none"}
        fillOpacity={draw}
        stroke={color}
        strokeWidth={1.25}
        pathLength={1}
        strokeDasharray={dashed ? undefined : `${draw} 1`}
        strokeOpacity={dashed ? draw : 1}
        style={dashed ? { strokeDasharray: "3 3" } : undefined}
      />
    </Layer>
  );
}

/** Quarter arc swept into a corner to call out its radius. */
export function CornerArc({
  x,
  y,
  r,
  color,
  label,
  delay = 0,
}: {
  x: number;
  y: number;
  r: number;
  color: string;
  label: string;
  delay?: number;
}) {
  const frame = useAuditFrame();
  const draw = progress(frame, delay, 12);
  const size = Math.max(r, 10) + 4;
  return (
    <>
      <Layer>
        <path
          d={`M${x} ${y + size}A${size} ${size} 0 0 1 ${x + size} ${y}`}
          stroke={color}
          strokeWidth={1.5}
          fill="none"
          pathLength={1}
          strokeDasharray={`${draw} 1`}
          strokeLinecap="round"
        />
      </Layer>
      <Pill
        x={x - 2}
        y={y - 2}
        text={label}
        color={color}
        delay={delay + 8}
        anchor="aboveStart"
      />
    </>
  );
}

/**
 * Design-token tag: a dot lands on the element, a leader line runs out with
 * one elbow, and a dark chip with the token name settles at its end.
 */
export function TokenTag({
  anchor,
  at,
  label,
  swatch,
  delay = 0,
  lineColor = "#0E121B",
}: {
  anchor: [number, number];
  at: [number, number];
  label: string;
  swatch: string;
  delay?: number;
  lineColor?: string;
}) {
  const frame = useAuditFrame();
  const dot = usePop(delay);
  const draw = progress(frame, delay + 3, 14);
  const elbowY = at[1];
  const path = `M${anchor[0]} ${anchor[1]}L${anchor[0] + (at[0] - anchor[0]) * 0.35} ${elbowY}H${at[0]}`;
  return (
    <>
      <Layer>
        <path
          d={path}
          stroke={lineColor}
          strokeOpacity={0.55}
          strokeWidth={1}
          fill="none"
          pathLength={1}
          strokeDasharray={`${draw} 1`}
        />
        <circle
          cx={anchor[0]}
          cy={anchor[1]}
          r={3.5 * dot}
          fill="#fff"
          stroke={lineColor}
          strokeWidth={1.5}
        />
      </Layer>
      <TokenChip
        x={at[0]}
        y={at[1]}
        label={label}
        swatch={swatch}
        delay={delay + 13}
      />
    </>
  );
}

export function TokenChip({
  x,
  y,
  label,
  swatch,
  delay = 0,
}: {
  x: number;
  y: number;
  label: string;
  swatch: string;
  delay?: number;
}) {
  const pop = usePop(delay);
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform: `translate(-50%, -50%) translateY(${(1 - pop) * 6}px)`,
        opacity: Math.min(1, pop * 1.4),
        display: "flex",
        alignItems: "center",
        gap: 6,
        background: "#0E121B",
        color: "#fff",
        fontFamily: MONO,
        fontSize: 11,
        lineHeight: "22px",
        padding: "0 8px",
        borderRadius: 5,
        whiteSpace: "nowrap",
        boxShadow: "0 4px 10px -4px rgba(10,13,20,0.4)",
      }}
    >
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: 4,
          background: swatch,
          boxShadow: "0 0 0 1px rgba(255,255,255,0.35)",
        }}
      />
      {label}
    </div>
  );
}

/** Guide line that drops down (vertical) or slides across (horizontal). */
export function Guide({
  x,
  y,
  length,
  vertical,
  color,
  delay = 0,
  dashed,
  width = 1,
}: {
  x: number;
  y: number;
  length: number;
  vertical?: boolean;
  color: string;
  delay?: number;
  dashed?: boolean;
  width?: number;
}) {
  const frame = useAuditFrame();
  const draw = progress(frame, delay, 16) * length;
  return (
    <Layer>
      <line
        x1={x}
        y1={y}
        x2={vertical ? x : x + draw}
        y2={vertical ? y + draw : y}
        stroke={color}
        strokeWidth={width}
        strokeDasharray={dashed ? "4 4" : undefined}
      />
    </Layer>
  );
}

/**
 * Scan band: a crisp line with a soft wash trailing behind it, the way the
 * fix pass sweeps the screen. `y` is the line's position.
 */
export function ScanBand({
  y,
  color,
  x = 0,
  w = 1280,
  trail = 90,
  opacity = 1,
}: {
  y: number;
  color: string;
  x?: number;
  w?: number;
  trail?: number;
  opacity?: number;
}) {
  return (
    <div
      style={{ position: "absolute", inset: 0, opacity, pointerEvents: "none" }}
    >
      <div
        style={{
          position: "absolute",
          left: x,
          width: w,
          top: y - trail,
          height: trail,
          background: `linear-gradient(to bottom, transparent, ${color}2E)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: x,
          width: w,
          top: y - 1,
          height: 2,
          background: color,
          boxShadow: `0 0 12px 1px ${color}`,
        }}
      />
    </div>
  );
}

/** Stage-colored wash over everything except one rect, to push focus. */
export function Spotlight({
  rect,
  opacity,
  color = C.stage,
}: {
  rect: Rect;
  opacity: number;
  color?: string;
}) {
  const pad = 10;
  const x = rect.x - pad;
  const y = rect.y - pad;
  const w = rect.w + pad * 2;
  const h = rect.h + pad * 2;
  const r = 12;
  return (
    <svg
      width={1280}
      height={720}
      style={{ position: "absolute", inset: 0, opacity }}
    >
      <path
        fillRule="evenodd"
        fill={color}
        fillOpacity={0.72}
        d={`M0 0H1280V720H0Z M${x + r} ${y}H${x + w - r}Q${x + w} ${y} ${x + w} ${y + r}V${y + h - r}Q${x + w} ${y + h} ${x + w - r} ${y + h}H${x + r}Q${x} ${y + h} ${x} ${y + h - r}V${y + r}Q${x} ${y} ${x + r} ${y}Z`}
      />
    </svg>
  );
}

/** Two full frames split at `y`: `top` shows above the line, `bottom` below. */
export function SplitAt({
  y,
  top,
  bottom,
}: {
  y: number;
  top: ReactNode;
  bottom: ReactNode;
}) {
  return (
    <>
      <div
        style={{
          position: "absolute",
          inset: 0,
          clipPath: `inset(${Math.max(0, y)}px 0 0 0)`,
        }}
      >
        {bottom}
      </div>
      <div
        style={{
          position: "absolute",
          inset: 0,
          clipPath: `inset(0 0 ${Math.max(0, 720 - y)}px 0)`,
        }}
      >
        {top}
      </div>
    </>
  );
}

/** Cubic ease-in-out between keyframes, clamped at both ends. */
export function easeInOut(frame: number, input: number[], output: number[]) {
  return interpolate(frame, input, output, {
    ...clamp,
    easing: Easing.inOut(Easing.cubic),
  });
}

/* Mark data */

export type Point = [number, number];

/** A distance between two points on one axis, with its value. */
export type Measure = { from: Point; to: Point; label: string; side?: Side };
/** A corner whose radius gets an arc and a label. `x`, `y` is the corner. */
export type RadiusMark = { x: number; y: number; r: number; label: string };
/** An off-spec element and the fix it needs. */
export type Issue = {
  rect: Rect;
  note: string;
  side?: "start" | "end" | "below";
};
/** A token tag: dot on `anchor`, chip centered on `at`. */
export type TokenSpec = {
  anchor: Point;
  at: Point;
  label: string;
  swatch: string;
};
/** Layout guides over a column grid. */
export type GuideSpec = {
  /** x of every column edge, left to right. */
  columns: number[];
  top: number;
  bottom: number;
  /** One column (or any rect) to fill and label. */
  highlight?: { rect: Rect; label: string };
  /** A measurement drawn with the guides, like a gutter width. */
  ruler?: Measure;
  /** A horizontal marker line across the grid, like a calendar's now line. */
  now?: { y: number; from: number; to: number; label: string };
};

export const AUDIT_COLORS = {
  audit: C.error,
  fix: C.blue,
  scan: C.primary,
  ink: C.ink,
  stage: C.stage,
};

/** Spacing and size redlines across the demo header, tabs and first cards. */
function demoMeasures(l: DemoLayout): Measure[] {
  const card = l.cards[0];
  const next = l.cards[1];
  const tabsBottom = l.tabs[0].y + 32;
  const headerBottom = l.header.y + l.header.h;
  const tabGapX = l.tabs[1].x + l.tabs[1].w + 7;
  const right = l.button.x + l.button.w + 8;
  return [
    {
      from: [l.header.x, l.tabs[0].y + 16],
      to: [l.contentX, l.tabs[0].y + 16],
      label: `pad ${l.pad}`,
      side: "below",
    },
    {
      from: [tabGapX, headerBottom],
      to: [tabGapX, l.tabs[0].y],
      label: `${l.tabs[0].y - headerBottom}`,
      side: "right",
    },
    {
      from: [next.rect.x + 150, tabsBottom],
      to: [next.rect.x + 150, next.rect.y],
      label: `${next.rect.y - tabsBottom}`,
      side: "right",
    },
    {
      from: [card.rect.x + card.rect.w, card.rect.y + 46],
      to: [next.rect.x, card.rect.y + 46],
      label: `gap ${l.gap}`,
    },
    {
      from: [card.rect.x, card.title.y + 9],
      to: [card.title.x, card.title.y + 9],
      label: `${l.cardPad}`,
      side: "left",
    },
    {
      from: [card.title.x + 96, card.rect.y],
      to: [card.title.x + 96, card.title.y],
      label: `${l.cardPad}`,
      side: "right",
    },
    {
      from: [right, l.button.y],
      to: [right, l.button.y + l.button.h],
      label: `h ${l.button.h}`,
      side: "below",
    },
  ];
}

function demoRadii(l: DemoLayout): RadiusMark[] {
  const next = l.cards[1].rect;
  return [{ x: next.x, y: next.y, r: l.radius, label: `radius ${l.radius}` }];
}

function demoIssues(l: DemoLayout): Issue[] {
  return [
    { rect: l.cards[0].title, note: "13.5 → 14", side: "start" },
    { rect: l.cards[0].status, note: "radius 4 → 6", side: "below" },
    { rect: l.cards[0].chevron, note: "hit 20 → 24", side: "end" },
    { rect: l.button, note: "#8B5CF6 ≠ primary", side: "end" },
    { rect: l.sideActive, note: "radius 5 → 8", side: "start" },
    { rect: l.events[2].rect, note: "radius 4 → 8", side: "start" },
    { rect: l.events[6].rect, note: "pad 6 → 8", side: "start" },
  ];
}

function demoTokens(l: DemoLayout): TokenSpec[] {
  const [c0, c1, c2, c3] = l.cards;
  const chipY = l.calendar.y + 70;
  return [
    {
      anchor: [c0.status.x + 12, c0.status.y + 13],
      at: [c0.rect.x + 50, chipY + 50],
      label: "state/success/lighter",
      swatch: C.successBg,
    },
    {
      anchor: [c0.title.x + 40, c0.title.y + 9],
      at: [c0.rect.x + 170, chipY],
      label: "text/strong-950",
      swatch: C.ink,
    },
    {
      anchor: [c1.status.x + 12, c1.status.y + 13],
      at: [c1.rect.x + 110, chipY + 92],
      label: "state/warning/base",
      swatch: C.warning,
    },
    {
      anchor: [c2.status.x + 12, c2.status.y + 13],
      at: [c2.rect.x + 90, chipY + 20],
      label: "state/error/base",
      swatch: C.error,
    },
    {
      anchor: [c3.rect.x + c3.rect.w, c3.rect.y + 40],
      at: [c3.rect.x + 90, chipY + 70],
      label: "stroke/soft-200",
      swatch: C.stroke,
    },
  ];
}

function demoGuides(l: DemoLayout): GuideSpec {
  const cal = l.calendar;
  const today = l.columns[0];
  return {
    columns: [...l.columns.map((col) => col.x), cal.x + cal.w],
    top: cal.y,
    bottom: cal.y + cal.h,
    highlight: { rect: today, label: "Mon 2 · today" },
    ruler: {
      from: [cal.x, cal.y + l.dayHeaderH + 14],
      to: [cal.x + l.gutter, cal.y + l.dayHeaderH + 14],
      label: `w ${l.gutter}`,
      side: "below",
    },
    now: {
      y: cal.y + l.dayHeaderH + 1.25 * l.hourH,
      from: cal.x + l.gutter,
      to: cal.x + cal.w,
      label: "10:15 AM",
    },
  };
}

/** Close-up spec of the first card, sized for a zoomed camera. */
function demoFocus(l: DemoLayout) {
  const card = l.cards[0];
  const r = card.rect;
  const below = r.y + r.h + 34;
  return {
    rect: r,
    measures: [
      {
        from: [r.x, card.title.y + 9],
        to: [card.title.x, card.title.y + 9],
        label: `${l.cardPad}`,
        side: "below",
      },
      {
        from: [card.title.x + 110, r.y],
        to: [card.title.x + 110, card.title.y],
        label: `${l.cardPad}`,
        side: "right",
      },
      {
        from: [r.x + r.w + 8, card.status.y],
        to: [r.x + r.w + 8, card.status.y + card.status.h],
        label: `h ${card.status.h}`,
        side: "right",
      },
      {
        from: [card.chevron.x - 2, card.chevron.y - 6],
        to: [card.chevron.x + card.chevron.w + 2, card.chevron.y - 6],
        label: "24",
      },
    ] as Measure[],
    radii: [{ x: r.x, y: r.y, r: l.radius, label: `radius ${l.radius}` }],
    tokens: [
      {
        anchor: [card.status.x + 12, card.status.y + 13],
        at: [r.x + 40, below],
        label: "state/success/base",
        swatch: C.success,
      },
      {
        anchor: [card.title.x + 60, card.title.y + 9],
        at: [r.x + 205, below - 4],
        label: "text/strong-950",
        swatch: C.ink,
      },
      {
        anchor: [card.time.x + 40, card.time.y + 8],
        at: [r.x + 70, below + 30],
        label: "text/sub-600",
        swatch: C.sub,
      },
      {
        anchor: [r.x + r.w, r.y + 30],
        at: [r.x + 230, below + 30],
        label: "stroke/soft-200",
        swatch: C.stroke,
      },
    ] as TokenSpec[],
  };
}

function demoSet(v: Version) {
  const l = demoLayout(v);
  return {
    layout: l,
    measures: demoMeasures(l),
    radii: demoRadii(l),
    issues: demoIssues(l),
    tokens: demoTokens(l),
    guides: demoGuides(l),
    focus: demoFocus(l),
    /** Rect around the tabs and the card row. */
    cardRow: {
      x: l.contentX,
      y: l.tabs[0].y,
      w: l.calendar.w,
      h: l.cards[0].rect.y + 92 - l.tabs[0].y,
    } satisfies Rect,
  };
}

/** Mark data measured off the demo dashboard: `before` is v1, `after` v2. */
export const DEMO = { before: demoSet(1), after: demoSet(2) };
export const DEMO_WINDOW = WIN;

/* Mark sets */

/** Rulers then radius arcs, each `stagger` frames after the last. */
export function MeasureMarks({
  measures,
  radii = [],
  color,
  start = 0,
  stagger = 5,
}: {
  measures: Measure[];
  radii?: RadiusMark[];
  color: string;
  start?: number;
  stagger?: number;
}) {
  return (
    <>
      {measures.map((m, i) => (
        <Ruler
          key={`${m.from.join()}-${m.to.join()}`}
          from={m.from}
          to={m.to}
          label={m.label}
          color={color}
          delay={start + i * stagger}
          labelSide={m.side}
        />
      ))}
      {radii.map((r, i) => (
        <CornerArc
          key={`${r.x}-${r.y}`}
          x={r.x}
          y={r.y}
          r={r.r}
          label={r.label}
          color={color}
          delay={start + (measures.length + i) * stagger}
        />
      ))}
    </>
  );
}

const NOTE_SPOT = {
  start: (r: Rect) => ({
    x: r.x - 3,
    y: r.y - 3,
    anchor: "aboveStart" as const,
  }),
  end: (r: Rect) => ({
    x: r.x + r.w + 3,
    y: r.y - 3,
    anchor: "aboveEnd" as const,
  }),
  below: (r: Rect) => ({
    x: r.x - 3,
    y: r.y + r.h + 3,
    anchor: "belowStart" as const,
  }),
};

/** Every issue boxed, with its note popping on once the box closes. */
export function IssueMarks({
  issues,
  color,
  start = 0,
  stagger = 4,
}: {
  issues: Issue[];
  color: string;
  start?: number;
  stagger?: number;
}) {
  return (
    <>
      {issues.map((issue, i) => (
        <div key={`${issue.rect.x}-${issue.rect.y}-${issue.note}`}>
          <OutlineBox
            rect={issue.rect}
            color={color}
            delay={start + i * stagger}
          />
          <Pill
            {...NOTE_SPOT[issue.side ?? "start"](issue.rect)}
            text={issue.note}
            color={color}
            delay={start + i * stagger + 10}
          />
        </div>
      ))}
    </>
  );
}

export function TokenMarks({
  tokens,
  start = 0,
  stagger = 6,
  lineColor,
}: {
  tokens: TokenSpec[];
  start?: number;
  stagger?: number;
  lineColor?: string;
}) {
  return (
    <>
      {tokens.map((tag, i) => (
        <TokenTag
          key={`${tag.label}-${tag.anchor.join()}`}
          anchor={tag.anchor}
          at={tag.at}
          label={tag.label}
          swatch={tag.swatch}
          lineColor={lineColor}
          delay={start + i * stagger}
        />
      ))}
    </>
  );
}

/** Column guides drop in, the highlight fills, then the now line slides across. */
export function GuideMarks({
  guides,
  color,
  nowColor = C.primary,
  start = 0,
}: {
  guides: GuideSpec;
  color: string;
  nowColor?: string;
  start?: number;
}) {
  const { columns, top, bottom, highlight, ruler, now } = guides;
  const h = highlight?.rect;
  return (
    <>
      {columns.map((x, i) => (
        <Guide
          key={x}
          x={x}
          y={top}
          length={bottom - top}
          vertical
          color={color}
          dashed
          delay={start + i * 3}
        />
      ))}
      {h && highlight && (
        <>
          <OutlineBox
            rect={h}
            color={color}
            fill={`${color}14`}
            inset={0}
            radius={0}
            delay={start + 14}
          />
          <OutlineBox
            rect={{ x: h.x + 6, y: h.y + 4, w: h.w - 12, h: 22 }}
            color={color}
            radius={4}
            inset={0}
            delay={start + 20}
          />
          <Pill
            x={h.x + h.w / 2}
            y={h.y + 4}
            text={highlight.label}
            color={color}
            delay={start + 26}
            anchor="above"
          />
        </>
      )}
      {ruler && (
        <Ruler
          from={ruler.from}
          to={ruler.to}
          label={ruler.label}
          color={color}
          delay={start + 24}
          labelSide={ruler.side}
        />
      )}
      {now && (
        <>
          <Guide
            x={now.from}
            y={now.y}
            length={now.to - now.from}
            color={nowColor}
            width={1.5}
            delay={start + 30}
          />
          <Pill
            x={now.from}
            y={now.y}
            text={now.label}
            color={nowColor}
            delay={start + 30}
            anchor="left"
          />
        </>
      )}
    </>
  );
}

/** Brand name with a version chip that flips once the fix lands. */
export function VersionChip({
  brand,
  versions,
  fixed,
  colors,
}: {
  brand: string;
  versions: [string, string];
  fixed: boolean;
  colors: [string, string];
}) {
  return (
    <div
      style={{
        position: "absolute",
        left: WIN.x,
        top: 26,
        display: "flex",
        alignItems: "center",
        gap: 8,
        fontSize: 15,
        fontWeight: 600,
        color: C.ink,
      }}
    >
      {brand}
      <span
        style={{
          fontFamily: MONO,
          fontSize: 11,
          color: "#fff",
          background: fixed ? colors[1] : colors[0],
          borderRadius: 999,
          padding: "1px 8px",
        }}
      >
        {fixed ? versions[1] : versions[0]}
      </span>
    </div>
  );
}
