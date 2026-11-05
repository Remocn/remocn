"use client";

import { loadFont } from "@remotion/google-fonts/InterTight";
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

export type RoadmapStatus = "done" | "active" | "planned";

export interface RoadmapProject {
  name: string;
  /** Start date, e.g. "Aug 10". */
  start: string;
  /** Target date (inclusive), e.g. "Sep 18". */
  end: string;
  status: RoadmapStatus;
  /** 0–1, drawn as the darker part of the bar and as the status pie. */
  progress?: number;
  lead: string;
  color: string;
  /** Name of the project this one is blocked by. */
  dependsOn?: string;
}

export interface RoadmapTimelineProps {
  projects?: RoadmapProject[];
  milestone?: { name: string; date: string };
  /** The "today" marker, e.g. "Aug 26". */
  today?: string;
  /** Name of the project the cursor drags. */
  dragProject?: string;
  /** How many days the dragged project moves (positive = later). */
  dragDays?: number;
  /** First visible month, 0-based (6 = July). */
  startMonth?: number;
  monthCount?: number;
  year?: number;
  title?: string;
  workspace?: string;
  theme?: "light" | "dark";
  accent?: string;
  speed?: number;
  ground?: GshPresetId;
  groundParams?: Partial<GradientParams>;
}

const DEFAULT_PROJECTS: RoadmapProject[] = [
  {
    name: "Billing v2",
    start: "Jul 6",
    end: "Aug 7",
    status: "done",
    progress: 1,
    lead: "Maya Chen",
    color: "#3FA27B",
  },
  {
    name: "Public API",
    start: "Aug 10",
    end: "Sep 18",
    status: "active",
    progress: 0.4,
    lead: "Priya Raman",
    color: "#3B5BFD",
    dependsOn: "Billing v2",
  },
  {
    name: "Mobile app 1.0",
    start: "Sep 24",
    end: "Oct 29",
    status: "planned",
    progress: 0,
    lead: "Ana Souza",
    color: "#E5795B",
    dependsOn: "Public API",
  },
  {
    name: "Onboarding",
    start: "Jul 16",
    end: "Aug 28",
    status: "active",
    progress: 0.8,
    lead: "Leo Park",
    color: "#D9A33A",
  },
  {
    name: "Usage analytics",
    start: "Aug 19",
    end: "Oct 2",
    status: "active",
    progress: 0.25,
    lead: "Sam Ortiz",
    color: "#2A9FBF",
  },
  {
    name: "Docs site",
    start: "Oct 12",
    end: "Nov 13",
    status: "planned",
    progress: 0,
    lead: "Maya Chen",
    color: "#D55C9A",
  },
];

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
const monthLen = (m: number, y: number) =>
  [31, y % 4 === 0 ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][m % 12];
function weekday(y: number, m: number, d: number) {
  const t = [0, 3, 2, 5, 0, 3, 5, 1, 4, 6, 2, 4];
  const yy = m < 2 ? y - 1 : y;
  return (
    (yy +
      Math.floor(yy / 4) -
      Math.floor(yy / 100) +
      Math.floor(yy / 400) +
      t[m] +
      d) %
    7
  );
}
function dayIndex(label: string, startMonth: number, year: number) {
  const [mon, d] = label.trim().split(/\s+/);
  const m = MONTHS.indexOf(mon);
  let idx = 0;
  for (let k = startMonth; k < (m < startMonth ? m + 12 : m); k++)
    idx += monthLen(k, year);
  return idx + Number(d) - 1;
}
function dayLabel(idx: number, startMonth: number, year: number) {
  let m = startMonth;
  let d = Math.round(idx);
  while (d >= monthLen(m, year)) {
    d -= monthLen(m, year);
    m++;
  }
  while (d < 0) {
    m--;
    d += monthLen(m, year);
  }
  return `${MONTHS[m % 12]} ${d + 1}`;
}

const HEAD_H = 52;
const TOOL_H = 48;
const THEAD_H = 52;
const MIN_GAP = 3;

const CL = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const easeOut = Easing.bezier(0.22, 1, 0.36, 1);
const inOut = Easing.bezier(0.65, 0, 0.35, 1);
const moveEase = Easing.bezier(0.65, 0, 0.35, 1);
const exitEase = Easing.bezier(0.55, 0, 1, 0.45);
const HEAVY = { mass: 1, damping: 26, stiffness: 120 };
const CARD = { mass: 0.8, damping: 18, stiffness: 160 };
const CHIP = { mass: 0.5, damping: 12, stiffness: 200 };
const tween = (f: number, a: number, b: number, easing = easeOut) =>
  interpolate(f, [a, b], [0, 1], { ...CL, easing });
const clamp = (v: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

function withAlpha(color: string, alpha: number) {
  const hex = color.replace("#", "");
  const full = hex.length === 3 ? hex.replace(/(.)/g, "$1$1") : hex;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return color;
  const n = Number.parseInt(full, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

interface Pal {
  stage: string;
  win: string;
  panel: string;
  ring: string;
  line: string;
  grid: string;
  text: string;
  muted: string;
  faint: string;
  active: string;
  barText: string;
  bar: string;
  barFill: string;
  toast: string;
  dark: boolean;
}

function palette(theme: "light" | "dark"): Pal {
  return theme === "dark"
    ? {
        stage: "rgba(4,4,10,0.34)",
        win: "#0F1011",
        panel: "#111214",
        ring: "rgba(255,255,255,0.08)",
        line: "rgba(255,255,255,0.06)",
        grid: "rgba(255,255,255,0.05)",
        text: "#EDEDEF",
        muted: "#9C9DA4",
        faint: "#6E6F76",
        active: "rgba(255,255,255,0.06)",
        barText: "#EDEDEF",
        bar: "#1A1B1E",
        barFill: "rgba(255,255,255,0.06)",
        toast: "#202124",
        dark: true,
      }
    : {
        stage: "rgba(245,245,247,0.28)",
        win: "#F4F4F5",
        panel: "#FFFFFF",
        ring: "rgba(17,19,24,0.08)",
        line: "rgba(17,19,24,0.06)",
        grid: "rgba(17,19,24,0.05)",
        text: "#18181B",
        muted: "#5F6168",
        faint: "#8E9096",
        active: "rgba(17,19,24,0.05)",
        barText: "#1C1D21",
        bar: "#F6F6F7",
        barFill: "rgba(17,19,24,0.05)",
        toast: "#FFFFFF",
        dark: false,
      };
}

const ICONS = {
  inbox: "M2.75 9.25h3l.75 1.5h3l.75-1.5h3M4.4 3.25h7.2l1.65 6v3.5h-10.5v-3.5z",
  issues:
    "M8 13.25A5.25 5.25 0 1 0 8 2.75a5.25 5.25 0 0 0 0 10.5zM8 9.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z",
  target:
    "M8 13.25A5.25 5.25 0 1 0 8 2.75a5.25 5.25 0 0 0 0 10.5zM8 10.25a2.25 2.25 0 1 0 0-4.5 2.25 2.25 0 0 0 0 4.5z",
  box: "M8 2.5l5 2.5v6L8 13.5 3 11V5zM3 5l5 2.5L13 5M8 7.5v6",
  layers: "M8 2.75l5.25 2.75L8 8.25 2.75 5.5zM2.75 8.25 8 11l5.25-2.75",
  cycle: "M13 8a5 5 0 1 1-1.46-3.54M13 3v2.5h-2.5",
  search:
    "M7.25 11.75a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9zM13.25 13.25l-2.8-2.8",
  compose:
    "M8.5 3H4.25A1.25 1.25 0 0 0 3 4.25v7.5A1.25 1.25 0 0 0 4.25 13h7.5A1.25 1.25 0 0 0 13 11.75V7.5M11.6 2.4a1.2 1.2 0 0 1 1.7 1.7L8.5 8.9 6.5 9.5l.6-2z",
  chevDown: "M4.75 6.5 8 9.75l3.25-3.25",
  chevRight: "M6.5 4.75 9.75 8 6.5 11.25",
  star: "M8 2.75l1.6 3.3 3.6.5-2.6 2.5.6 3.6L8 10.95l-3.2 1.7.6-3.6-2.6-2.5 3.6-.5z",
  filter: "M2.5 4.5h11M4.5 8h7M6.5 11.5h3",
  sliders:
    "M2.75 5h5.5M11.25 5h2M2.75 11h2M7.75 11h5.5M9.75 3.4v3.2M6.25 9.4v3.2",
  plus: "M8 3.5v9M3.5 8h9",
  link: "M6.75 9.25l2.5-2.5M7.25 4.75l.9-.9a2.5 2.5 0 0 1 3.5 3.5l-.9.9M8.75 11.25l-.9.9a2.5 2.5 0 0 1-3.5-3.5l.9-.9",
  check: "M4.5 8.25 6.9 10.5 11.5 5.5",
  undo: "M5.5 4.25 3 6.75l2.5 2.5M3 6.75h6.25a3.25 3.25 0 0 1 0 6.5H7.5",
} as const;
type IconName = keyof typeof ICONS;

function Icon({
  name,
  color,
  size = 16,
  width = 1.4,
}: {
  name: IconName;
  color: string;
  size?: number;
  width?: number;
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
        strokeWidth={width}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const AVATAR_COLORS = ["#E5795B", "#4F8BE8", "#9B6BDF", "#3FA27B", "#D9A33A"];
function Avatar({
  name,
  size = 18,
  ring,
}: {
  name: string;
  size?: number;
  ring?: string;
}) {
  const idx =
    [...name].reduce((s, ch) => s + ch.charCodeAt(0), 0) % AVATAR_COLORS.length;
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 999,
        background: `radial-gradient(circle at 50% 34%, rgba(255,255,255,0.42) 0 22%, transparent 23%), radial-gradient(circle at 50% 108%, rgba(255,255,255,0.32) 0 42%, transparent 43%), ${AVATAR_COLORS[idx]}`,
        flexShrink: 0,
        boxShadow: ring ? `0 0 0 1.5px ${ring}` : undefined,
      }}
    />
  );
}

function StatusIcon({
  status,
  progress,
  accent,
  pal,
}: {
  status: RoadmapStatus;
  progress: number;
  accent: string;
  pal: Pal;
}) {
  if (status === "done") {
    return (
      <svg width={14} height={14} viewBox="0 0 14 14" style={{ flexShrink: 0 }}>
        <circle cx={7} cy={7} r={6.5} fill={accent} />
        <path
          d="M4.3 7.2 6.2 9 9.8 5.2"
          fill="none"
          stroke="#fff"
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  const color = status === "active" ? "#E2A93B" : pal.faint;
  const a = clamp(progress, 0, 0.999) * Math.PI * 2;
  const pie =
    progress > 0
      ? `M7 7 L7 3.25 A3.75 3.75 0 ${a > Math.PI ? 1 : 0} 1 ${7 + 3.75 * Math.sin(a)} ${7 - 3.75 * Math.cos(a)} Z`
      : "";
  return (
    <svg width={14} height={14} viewBox="0 0 14 14" style={{ flexShrink: 0 }}>
      <circle
        cx={7}
        cy={7}
        r={5.9}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeDasharray={status === "planned" ? "2.2 1.9" : undefined}
      />
      {pie ? <path d={pie} fill={color} /> : null}
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
      const p = moveEase(clamp((f - a.t) / Math.max(1, b.t - a.t), 0, 1));
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const d = Math.hypot(dx, dy) || 1;
      const arc = Math.sin(p * Math.PI) * Math.min(28, d * 0.12);
      return {
        x: lerp(a.x, b.x, p) + (-dy / d) * arc,
        y: lerp(a.y, b.y, p) + (dx / d) * arc,
      };
    }
  }
  return keys[keys.length - 1];
}

function Cursor({ x, y, press }: { x: number; y: number; press: number }) {
  return (
    <svg
      width={22}
      height={26}
      viewBox="0 0 20 24"
      style={{
        position: "absolute",
        left: x - 2,
        top: y - 2,
        transformOrigin: "2px 2px",
        transform: `scale(${1 - 0.1 * press})`,
        filter: "drop-shadow(0 2px 3px rgba(0,0,0,0.28))",
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

function connectorPath(sx: number, sy: number, x2: number, y2: number) {
  const r = clamp(Math.min(x2 - 5 - sx, y2 - sy) * 0.5, 2, 9);
  return `M${sx} ${sy} V${y2 - r} Q${sx} ${y2} ${sx + r} ${y2} H${x2 - 5}`;
}

export function RoadmapTimeline({
  projects = DEFAULT_PROJECTS,
  milestone = { name: "Public launch", date: "Nov 18" },
  today = "Aug 26",
  dragProject = "Public API",
  dragDays = 14,
  startMonth = 6,
  monthCount = 5,
  year = 2026,
  title = "Roadmap · H2 2026",
  workspace = "remocn",
  theme = "light",
  accent = "#3B5BFD",
  speed = 1,
  ground,
  groundParams,
}: RoadmapTimelineProps) {
  const frame = useCurrentFrame() * speed;
  const { width: W, height: H, fps } = useVideoConfig();
  const tall = H > W;
  const DW = tall ? 720 : 1280;
  const DH = tall ? 1280 : 720;
  const u = Math.min(W / DW, H / DH);
  const pal = palette(theme);
  const LIST_W = tall ? 0 : 260;
  const ROW_H = tall ? 96 : 56;
  const BAR_H = tall ? 40 : 32;
  const ROWS_Y = HEAD_H + TOOL_H + THEAD_H;
  const panelW = tall ? 672 : 1000;
  const panelH = ROWS_Y + (projects.length + 1) * ROW_H + 56;
  const PANEL = {
    x: (DW - panelW) / 2,
    y: (DH - panelH) / 2,
    w: panelW,
    h: panelH,
  };
  const GRID_W = PANEL.w - LIST_W;
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");

  const monthStarts: number[] = [];
  let totalDays = 0;
  for (let k = 0; k < monthCount; k++) {
    monthStarts.push(totalDays);
    totalDays += monthLen(startMonth + k, year);
  }
  const DAY = GRID_W / totalDays;
  const firstWd = weekday(
    year + Math.floor(startMonth / 12),
    startMonth % 12,
    1,
  );
  const firstMonday = (8 - firstWd) % 7;
  const mondays: number[] = [];
  for (let d = firstMonday; d < totalDays; d += 7) mondays.push(d);
  const di = (label: string) => dayIndex(label, startMonth, year);
  const lbl = (idx: number) => dayLabel(idx, startMonth, year);

  const T = {
    rows: 8,
    bars: 12,
    links: 40,
    milestone: 50,
    sweep: 56,
    cursorIn: 76,
    grab: 99,
    dragStart: 102,
    dragEnd: 128,
    toast: 136,
  };

  const parsed = projects.map((p) => ({
    ...p,
    s: di(p.start),
    e: di(p.end),
  }));
  const dragIdx = Math.max(
    0,
    parsed.findIndex((p) => p.name === dragProject),
  );
  const dragAt = (f: number) =>
    dragDays * tween(f, T.dragStart, T.dragEnd, inOut);

  const shifts: number[] = parsed.map(() => 0);
  const shiftAt = (f: number) => {
    const out = parsed.map((_, i) => (i === dragIdx ? dragAt(f) : 0));
    for (let pass = 0; pass < 3; pass++) {
      parsed.forEach((p, i) => {
        if (!p.dependsOn || i === dragIdx) return;
        const b = parsed.findIndex((q) => q.name === p.dependsOn);
        if (b < 0) return;
        const need = parsed[b].e + out[b] + MIN_GAP - p.s;
        out[i] = Math.max(0, need);
      });
    }
    return out;
  };
  const lagged = shiftAt(frame - 3);
  const live = shiftAt(frame);
  parsed.forEach((_, i) => {
    shifts[i] = i === dragIdx ? live[i] : lagged[i];
  });
  const finalShifts = shiftAt(9999);
  const moved = parsed
    .map((_p, i) => (finalShifts[i] > 0.5 && i !== dragIdx ? i : -1))
    .filter((i) => i >= 0);

  const rowY = (i: number) => ROWS_Y + i * ROW_H;
  const barX = (i: number) => LIST_W + (parsed[i].s + shifts[i]) * DAY;
  const barW = (i: number) => (parsed[i].e - parsed[i].s + 1) * DAY;
  const barMidY = (i: number) => rowY(i) + ROW_H / 2;

  const gx = (x: number) => PANEL.x + x;
  const gy = (y: number) => PANEL.y + y;
  const grabOffset = Math.min(barW(dragIdx) * 0.42, 90);
  const grab0 = {
    x: gx(LIST_W + parsed[dragIdx].s * DAY + grabOffset),
    y: gy(barMidY(dragIdx) + 4),
  };
  const dragPx = dragAt(frame) * DAY;
  const keys: Key[] = [
    { t: T.cursorIn, x: DW - 90, y: DH - 50 },
    { t: T.grab - 4, ...grab0 },
  ];
  let cur = pathAt(keys, frame);
  if (frame > T.grab - 4) cur = { x: grab0.x + dragPx, y: grab0.y };
  if (frame > T.dragEnd + 4) {
    const away = tween(frame, T.dragEnd + 6, T.dragEnd + 26, moveEase);
    cur = {
      x: grab0.x + dragDays * DAY + 46 * away,
      y: grab0.y + 64 * away + Math.sin(away * Math.PI) * 6,
    };
  }
  const pressDown = spring({ frame: frame - T.grab, fps, config: CHIP });
  const pressUp = tween(frame, T.dragEnd + 1, T.dragEnd + 5, exitEase);
  const press = clamp(pressDown, 0, 1.2) * (1 - pressUp);
  const cursorIn = tween(frame, T.cursorIn, T.cursorIn + 6);
  const hover = tween(frame, T.grab - 6, T.grab - 1);
  const lifted = press;
  const tipIn = spring({ frame: frame - T.dragStart, fps, config: CHIP });
  const tipOut = tween(frame, T.dragEnd + 2, T.dragEnd + 6, exitEase);
  const tip = clamp(tipIn, 0, 1) * (1 - tipOut);
  const flash = (at: number) =>
    tween(frame, at, at + 4) * (1 - tween(frame, at + 10, at + 34, inOut));

  const enter = spring({ frame, fps, config: HEAVY });
  const camT = tween(frame, 66, 98, inOut);
  const sweep = tween(frame, T.sweep, T.sweep + 20, inOut);
  const todayIdx = di(today);
  const todayDay = sweep * todayIdx;
  const todayX = LIST_W + (todayDay + 0.5) * DAY;
  const toast = spring({ frame: frame - T.toast, fps, config: CARD });
  const ms = spring({ frame: frame - T.milestone, fps, config: CHIP });
  const msIdx = di(milestone.date);
  const msRow = parsed.length;
  const msLabelLeft = (msIdx + 0.5) * DAY + 120 > GRID_W;

  const links = parsed
    .map((p, i) => {
      if (!p.dependsOn) return null;
      const b = parsed.findIndex((q) => q.name === p.dependsOn);
      return b < 0 ? null : { from: b, to: i };
    })
    .filter((l): l is { from: number; to: number } => l !== null);

  const dates = (i: number) =>
    `${lbl(parsed[i].s + shifts[i])} – ${lbl(parsed[i].e + shifts[i])}`;

  const btn = (label: React.ReactNode, icon?: IconName) => (
    <div
      style={{
        height: 32,
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: icon && !label ? "0 7px" : "0 12px",
        borderRadius: 8,
        boxShadow: `inset 0 0 0 1px ${pal.ring}`,
        fontSize: 16,
        color: pal.text,
        background: pal.panel,
      }}
    >
      {icon ? <Icon name={icon} color={pal.muted} size={15} /> : null}
      {label}
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
        preset={ground ?? (pal.dark ? "europa" : "paper-crease")}
        params={groundParams}
        timeOffset={pal.dark ? 4 : 2}
        timeScale={0.3}
      />
      <AbsoluteFill style={{ background: pal.stage }} />
      <div
        style={{
          position: "absolute",
          left: (W - DW * u) / 2,
          top: (H - DH * u) / 2,
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
            transformOrigin: `${DW / 2}px ${DH / 2}px`,
            transform: `scale(${0.95 + 0.05 * camT}) translateY(${(1 - enter) * 48}px)`,
            opacity: clamp(enter * 1.6, 0, 1),
          }}
        >
          <div
            style={{
              position: "absolute",
              left: PANEL.x,
              top: PANEL.y,
              width: PANEL.w,
              height: PANEL.h,
              borderRadius: 16,
              background: pal.panel,
              boxShadow: pal.dark
                ? "0 0 0 1px rgba(255,255,255,0.08), inset 0 1px 0 rgba(255,255,255,0.05), 0 30px 80px -24px rgba(0,0,0,0.7)"
                : "0 0 0 1px rgba(17,19,24,0.06), 0 1px 3px rgba(17,19,24,0.05), 0 16px 36px -16px rgba(17,19,24,0.16), 0 44px 90px -44px rgba(17,19,24,0.24)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: HEAD_H,
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "0 16px 0 20px",
                borderBottom: `1px solid ${pal.line}`,
                fontSize: 16,
              }}
            >
              <span style={{ color: pal.muted }}>{workspace}</span>
              <Icon name="chevRight" color={pal.faint} size={14} />
              <span style={{ color: pal.text }}>{title}</span>
              <div style={{ flex: 1 }} />
              <div style={{ display: "flex" }}>
                {["Maya Chen", "Leo Park", "Priya Raman"].map((n, i) => (
                  <div key={n} style={{ marginLeft: i ? -5 : 0 }}>
                    <Avatar name={n} size={26} ring={pal.panel} />
                  </div>
                ))}
              </div>
              <div style={{ width: 4 }} />
              {btn(null, "link")}
            </div>
            <div
              style={{
                height: TOOL_H,
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "0 14px",
                borderBottom: `1px solid ${pal.line}`,
              }}
            >
              {["All", "Timeline", "Board"].map((t) => (
                <div
                  key={t}
                  style={{
                    height: 32,
                    padding: "0 12px",
                    display: "flex",
                    alignItems: "center",
                    borderRadius: 8,
                    fontSize: 16,
                    color: t === "Timeline" ? pal.text : pal.muted,
                    background: t === "Timeline" ? pal.active : "transparent",
                    boxShadow:
                      t === "Timeline" ? `inset 0 0 0 1px ${pal.line}` : "none",
                  }}
                >
                  {t}
                </div>
              ))}
              <div style={{ flex: 1 }} />
              {btn("Today")}
              {btn(
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  Months
                  <Icon name="chevDown" color={pal.muted} size={12} />
                </span>,
              )}
            </div>

            <div
              style={{
                position: "absolute",
                left: LIST_W,
                top: HEAD_H + TOOL_H,
                width: GRID_W,
                bottom: 0,
                borderLeft: `1px solid ${pal.line}`,
              }}
            >
              {monthStarts.map((m, k) => (
                <div
                  key={`m${m}`}
                  style={{
                    position: "absolute",
                    left: m * DAY,
                    top: 0,
                    bottom: 0,
                    borderLeft: k ? `1px solid ${pal.line}` : "none",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      left: 10,
                      top: 6,
                      fontSize: 16,
                      fontWeight: 400,
                      color: pal.muted,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {MONTHS[(startMonth + k) % 12]}
                    {k === 0 ? (
                      <span style={{ color: pal.faint }}> {year}</span>
                    ) : null}
                  </div>
                </div>
              ))}
              {mondays.map((d) => (
                <div
                  key={`d${d}`}
                  style={{
                    position: "absolute",
                    left: d * DAY,
                    top: THEAD_H - 7,
                    height: 6,
                    borderLeft: `1px solid ${pal.ring}`,
                  }}
                />
              ))}
              {mondays.map((d) => (
                <div
                  key={`g${d}`}
                  style={{
                    position: "absolute",
                    left: d * DAY,
                    top: THEAD_H,
                    bottom: 0,
                    borderLeft: `1px dashed ${pal.grid}`,
                  }}
                />
              ))}
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  top: THEAD_H - 1,
                  borderTop: `1px solid ${pal.line}`,
                }}
              />
            </div>
            <div
              style={{
                position: "absolute",
                left: 0,
                top: HEAD_H + TOOL_H,
                width: LIST_W,
                height: THEAD_H,
                borderBottom: `1px solid ${pal.line}`,
                display: LIST_W ? "flex" : "none",
                alignItems: "center",
                gap: 6,
                padding: "0 16px",
                boxSizing: "border-box",
                fontSize: 16,
                fontWeight: 400,
                color: pal.muted,
              }}
            >
              Projects
              <span
                style={{
                  color: pal.faint,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {parsed.length}
              </span>
              <div style={{ flex: 1 }} />
              Target
            </div>

            {parsed.map((p, i) => {
              const a = tween(frame, T.rows + i * 2, T.rows + i * 2 + 10);
              const changed = i === dragIdx || moved.includes(i);
              const swap = changed
                ? tween(frame, T.dragEnd + 2, T.dragEnd + 8)
                : 0;
              const hl = changed
                ? flash(T.dragEnd + 2 + (i === dragIdx ? 0 : 3))
                : 0;
              const oldEnd = lbl(p.e);
              const newEnd = lbl(p.e + finalShifts[i]);
              return (
                <div
                  key={p.name}
                  style={{
                    position: "absolute",
                    left: 0,
                    top: rowY(i),
                    width: PANEL.w,
                    height: ROW_H,
                    borderBottom: `1px solid ${pal.line}`,
                    background: withAlpha(accent, (pal.dark ? 0.1 : 0.05) * hl),
                    opacity: a,
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      left: 0,
                      width: LIST_W,
                      height: ROW_H,
                      display: LIST_W ? "flex" : "none",
                      alignItems: "center",
                      gap: 10,
                      padding: "0 14px 0 16px",
                      boxSizing: "border-box",
                      transform: `translateY(${(1 - a) * 6}px)`,
                    }}
                  >
                    <StatusIcon
                      status={p.status}
                      progress={p.progress ?? 0}
                      accent={accent}
                      pal={pal}
                    />
                    <span
                      style={{
                        fontSize: 16,
                        fontWeight: 400,
                        color: pal.text,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        flex: 1,
                      }}
                    >
                      {p.name}
                    </span>
                    <span
                      style={{
                        position: "relative",
                        width: 62,
                        height: 22,
                        fontSize: 16,
                        color: changed && swap > 0.5 ? pal.text : pal.muted,
                        fontVariantNumeric: "tabular-nums",
                        textAlign: "right",
                      }}
                    >
                      <span
                        style={{
                          position: "absolute",
                          right: 0,
                          opacity: 1 - swap,
                          transform: `translateY(${-5 * swap}px)`,
                        }}
                      >
                        {oldEnd}
                      </span>
                      {changed ? (
                        <span
                          style={{
                            position: "absolute",
                            right: 0,
                            opacity: swap,
                            transform: `translateY(${5 * (1 - swap)}px)`,
                          }}
                        >
                          {newEnd}
                        </span>
                      ) : null}
                    </span>
                  </div>
                </div>
              );
            })}
            <div
              style={{
                position: "absolute",
                left: 0,
                top: rowY(msRow),
                width: LIST_W,
                height: ROW_H,
                display: LIST_W ? "flex" : "none",
                alignItems: "center",
                gap: 10,
                padding: "0 14px 0 16px",
                boxSizing: "border-box",
                opacity: tween(
                  frame,
                  T.rows + msRow * 2,
                  T.rows + msRow * 2 + 10,
                ),
              }}
            >
              <svg width={14} height={14} viewBox="0 0 14 14">
                <rect
                  x={3}
                  y={3}
                  width={8}
                  height={8}
                  rx={1.5}
                  transform="rotate(45 7 7)"
                  fill="none"
                  stroke={pal.muted}
                  strokeWidth={1.4}
                />
              </svg>
              <span
                style={{
                  fontSize: 16,
                  fontWeight: 400,
                  color: pal.text,
                  flex: 1,
                }}
              >
                {milestone.name}
              </span>
              <span
                style={{
                  fontSize: 16,
                  color: pal.muted,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {milestone.date}
              </span>
            </div>
            <div
              style={{
                position: "absolute",
                left: todayX,
                top: HEAD_H + TOOL_H + 28,
                bottom: 0,
                width: 1,
                background: withAlpha(accent, 0.7),
                opacity: tween(frame, T.sweep - 2, T.sweep + 3),
              }}
            >
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  top: -1,
                  transform: "translateX(-50%)",
                  background: accent,
                  color: "#fff",
                  fontSize: 16,
                  fontWeight: 400,
                  lineHeight: "20px",
                  padding: "0 7px",
                  borderRadius: 5,
                  whiteSpace: "nowrap",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {lbl(todayDay)}
              </div>
            </div>

            <svg
              width={PANEL.w}
              height={PANEL.h}
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                overflow: "visible",
              }}
            >
              <defs>
                <clipPath id={`${uid}-grid`}>
                  <rect
                    x={LIST_W}
                    y={ROWS_Y}
                    width={GRID_W}
                    height={PANEL.h - ROWS_Y}
                  />
                </clipPath>
              </defs>
              <g clipPath={`url(#${uid}-grid)`}>
                {links.map((l, k) => {
                  const draw = tween(
                    frame,
                    T.links + k * 5,
                    T.links + k * 5 + 12,
                    inOut,
                  );
                  const x2 = barX(l.to);
                  const y2 = barMidY(l.to);
                  const x1 = Math.min(
                    barX(l.from) + barW(l.from) - 12,
                    x2 - 18,
                  );
                  const y1 = barMidY(l.from) + BAR_H / 2;
                  const col = pal.dark
                    ? "rgba(255,255,255,0.4)"
                    : "rgba(17,19,24,0.38)";
                  return (
                    <g key={`${l.from}-${l.to}`} opacity={draw > 0 ? 1 : 0}>
                      <circle cx={x1} cy={y1} r={2.2} fill={col} />
                      <path
                        d={connectorPath(x1, y1, x2, y2)}
                        fill="none"
                        stroke={col}
                        strokeWidth={1.5}
                        strokeLinecap="round"
                        pathLength={1}
                        strokeDasharray="1 1"
                        strokeDashoffset={1 - draw}
                      />
                      <path
                        d={`M${x2 - 8} ${y2 - 3.5} L${x2 - 4} ${y2} L${x2 - 8} ${y2 + 3.5}`}
                        fill="none"
                        stroke={col}
                        strokeWidth={1.5}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        opacity={tween(
                          frame,
                          T.links + k * 5 + 9,
                          T.links + k * 5 + 12,
                        )}
                      />
                    </g>
                  );
                })}
              </g>
            </svg>

            {parsed.map((p, i) => {
              const grow = tween(frame, T.bars + i * 3, T.bars + i * 3 + 14);
              const isDrag = i === dragIdx;
              const lift = isDrag ? lifted : 0;
              const hov = isDrag
                ? hover * (1 - tween(frame, T.dragEnd + 8, T.dragEnd + 14))
                : 0;
              const hl = moved.includes(i) ? flash(T.dragEnd + 5) : 0;
              const x = barX(i);
              const w = barW(i);
              const prog = clamp(p.progress ?? 0, 0, 1);
              return (
                <div
                  key={p.name}
                  style={{
                    position: "absolute",
                    left: x,
                    top: barMidY(i) - BAR_H / 2,
                    width: Math.max(12, w * grow),
                    height: BAR_H,
                    borderRadius: 8,
                    overflow: "hidden",
                    opacity: clamp(grow * 4, 0, 1),
                    transform: `translateY(${-1.5 * lift}px)`,
                    zIndex: isDrag ? 3 : 2,
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      left: 0,
                      top: 0,
                      width: w,
                      height: BAR_H,
                      borderRadius: 8,
                      background: pal.bar,
                      boxShadow: [
                        `inset 0 0 0 1px ${Math.max(hov, hl) > 0.01 ? withAlpha(accent, 0.25 + 0.5 * Math.max(hov, hl)) : pal.ring}`,
                        lift > 0
                          ? `0 ${6 * lift}px ${14 * lift}px -4px ${pal.dark ? "rgba(0,0,0,0.6)" : "rgba(17,19,24,0.18)"}`
                          : "0 0 0 0 transparent",
                      ].join(", "),
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        left: 0,
                        top: 0,
                        bottom: 0,
                        width: `${prog * 100}%`,
                        background: pal.barFill,
                      }}
                    />
                  </div>
                  <div
                    style={{
                      position: "absolute",
                      left: 0,
                      top: 0,
                      width: w,
                      height: BAR_H,
                      boxSizing: "border-box",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "0 6px 0 10px",
                      fontSize: 16,
                      fontWeight: 400,
                      color: pal.barText,
                      whiteSpace: "nowrap",
                    }}
                  >
                    <div
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: 3,
                        background: p.color,
                        flexShrink: 0,
                      }}
                    />
                    <span
                      style={{
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        flex: 1,
                      }}
                    >
                      {p.name}
                    </span>
                    <Avatar name={p.lead} size={18} />
                  </div>
                  {[0, 1].map((side) => (
                    <div
                      key={side}
                      style={{
                        position: "absolute",
                        top: 7,
                        left: side ? w - 6 : 3,
                        width: 3,
                        height: BAR_H - 14,
                        borderRadius: 2,
                        background: withAlpha(accent, 0.9),
                        opacity: hov,
                      }}
                    />
                  ))}
                </div>
              );
            })}

            <div
              style={{
                position: "absolute",
                left: LIST_W + (msIdx + 0.5) * DAY - 8,
                top: barMidY(msRow) - 8,
                width: 16,
                height: 16,
                opacity: clamp(ms * 3, 0, 1),
                transform: `translateY(${(1 - Math.min(ms, 1)) * -12}px) scale(${0.7 + 0.3 * ms})`,
              }}
            >
              <svg width={16} height={16} viewBox="0 0 16 16">
                <rect
                  x={3.5}
                  y={3.5}
                  width={9}
                  height={9}
                  rx={1.6}
                  transform="rotate(45 8 8)"
                  fill={pal.dark ? "#EDEDEF" : "#1C1D21"}
                />
              </svg>
              <div
                style={{
                  position: "absolute",
                  ...(msLabelLeft ? { right: 22 } : { left: 22 }),
                  top: -2,
                  fontSize: 16,
                  fontWeight: 400,
                  color: pal.text,
                  whiteSpace: "nowrap",
                  opacity: tween(frame, T.milestone + 4, T.milestone + 10),
                }}
              >
                {milestone.name}
              </div>
            </div>

            <div
              style={{
                position: "absolute",
                left: barX(dragIdx) + barW(dragIdx) / 2,
                top: barMidY(dragIdx) - BAR_H / 2 - 34,
                transform: `translateX(-50%) translateY(${(1 - tipIn) * 4}px) scale(${0.96 + 0.04 * tipIn})`,
                transformOrigin: "50% 100%",
                opacity: tip,
                background: pal.dark ? "#2A2B2F" : "#1C1D21",
                color: "#F4F4F5",
                fontSize: 16,
                fontWeight: 400,
                lineHeight: "28px",
                padding: "0 10px",
                borderRadius: 7,
                whiteSpace: "nowrap",
                fontVariantNumeric: "tabular-nums",
                boxShadow: "0 4px 12px rgba(0,0,0,0.18)",
                zIndex: 4,
              }}
            >
              {dates(dragIdx)}
              <span style={{ color: "#9C9DA4" }}>
                {" "}
                · {parsed[dragIdx].e - parsed[dragIdx].s + 1}d
              </span>
            </div>

            <div
              style={{
                position: "absolute",
                left: PANEL.w / 2,
                bottom: 22,
                transform: `translateX(-50%) translateY(${(1 - toast) * 14}px)`,
                opacity: clamp(toast * 1.5, 0, 1),
                display: "flex",
                alignItems: "center",
                gap: 10,
                height: 42,
                padding: "0 8px 0 12px",
                borderRadius: 10,
                background: pal.toast,
                boxShadow: pal.dark
                  ? "0 0 0 1px rgba(255,255,255,0.09), 0 12px 30px rgba(0,0,0,0.5)"
                  : "0 0 0 1px rgba(17,19,24,0.08), 0 12px 30px rgba(17,19,24,0.14), 0 2px 6px rgba(17,19,24,0.05)",
                fontSize: 16,
                color: pal.text,
                whiteSpace: "nowrap",
                zIndex: 5,
              }}
            >
              <div
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: 99,
                  background: accent,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icon name="check" color="#fff" size={14} width={1.8} />
              </div>
              <span style={{ fontWeight: 400 }}>
                Rescheduled {1 + moved.length} projects
              </span>
              <span
                style={{
                  color: pal.muted,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {moved.length
                  ? `${parsed[moved[0]].name} now starts ${lbl(parsed[moved[0]].s + finalShifts[moved[0]])}`
                  : `${parsed[dragIdx].name} moved`}
              </span>
              <div
                style={{
                  height: 26,
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  padding: "0 8px",
                  borderRadius: 6,
                  boxShadow: `inset 0 0 0 1px ${pal.ring}`,
                  fontSize: 16,
                  fontWeight: 400,
                  color: pal.text,
                  marginLeft: 4,
                }}
              >
                <Icon name="undo" color={pal.muted} size={13} />
                Undo
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
