"use client";

import { loadFont } from "@remotion/google-fonts/Onest";
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
  weights: ["300", "400"],
  subsets: ["latin"],
});

export interface TableRecord {
  company: string;
  domain: string;
  stage: string;
  /** Annual recurring revenue in dollars, used for sorting. */
  arr: number;
  owner: string;
  lastInteraction: string;
  /** Logo tile color. */
  color: string;
}

export interface TableFilterProps {
  rows?: TableRecord[];
  title?: string;
  /** Attribute shown in the filter chip. */
  filterAttribute?: string;
  /** Stage value rows are filtered by. */
  filterValue?: string;
  /** How many of the remaining rows get selected for the bulk action. */
  selectCount?: number;
  bulkAction?: string;
  workspace?: string;
  theme?: "light" | "dark";
  accent?: string;
  speed?: number;
  ground?: GshPresetId;
  groundParams?: Partial<GradientParams>;
}

const DEFAULT_ROWS: TableRecord[] = [
  {
    company: "Kitebase",
    domain: "kitebase.io",
    stage: "Negotiation",
    arr: 1_400_000,
    owner: "Maya Chen",
    lastInteraction: "2 hours ago",
    color: "#3B82F6",
  },
  {
    company: "Lumen",
    domain: "lumen.app",
    stage: "Closed-won",
    arr: 320_000,
    owner: "Leo Park",
    lastInteraction: "Yesterday",
    color: "#F59E0B",
  },
  {
    company: "Fernway",
    domain: "fernway.com",
    stage: "Qualified",
    arr: 860_000,
    owner: "Priya Raman",
    lastInteraction: "3 days ago",
    color: "#10B981",
  },
  {
    company: "Quarry",
    domain: "quarry.dev",
    stage: "Closed-won",
    arr: 2_100_000,
    owner: "Maya Chen",
    lastInteraction: "4 hours ago",
    color: "#18181B",
  },
  {
    company: "Orbitly",
    domain: "orbitly.co",
    stage: "Lead",
    arr: 95_000,
    owner: "Sam Ortiz",
    lastInteraction: "1 week ago",
    color: "#8B5CF6",
  },
  {
    company: "Halcyon",
    domain: "halcyon.ai",
    stage: "Negotiation",
    arr: 1_100_000,
    owner: "Leo Park",
    lastInteraction: "Yesterday",
    color: "#0EA5E9",
  },
  {
    company: "Tessel",
    domain: "tessel.so",
    stage: "Closed-won",
    arr: 640_000,
    owner: "Priya Raman",
    lastInteraction: "2 days ago",
    color: "#EF4444",
  },
  {
    company: "Brightloom",
    domain: "brightloom.com",
    stage: "Closed-lost",
    arr: 210_000,
    owner: "Sam Ortiz",
    lastInteraction: "3 weeks ago",
    color: "#EC4899",
  },
  {
    company: "Cobalt Labs",
    domain: "cobaltlabs.com",
    stage: "Closed-won",
    arr: 1_200_000,
    owner: "Leo Park",
    lastInteraction: "6 hours ago",
    color: "#6366F1",
  },
];

const STAGE_COLORS: Record<string, string> = {
  Lead: "#9A9AA2",
  Qualified: "#4C7FD8",
  Negotiation: "#D69A3A",
  "Closed-won": "#3E9E64",
  "Closed-lost": "#C9584A",
};

const WIN = { x: 150, y: 76, w: 980, h: 572 };
const SIDEBAR = 180;
const MX = WIN.x + SIDEBAR;
const ROW_H = 38;
const TOOL_Y = WIN.y + 88;
const HEAD_Y = TOOL_Y + 40;
const BODY_Y = HEAD_Y + 34;
const COLS = [
  { key: "check", label: "", w: 40 },
  { key: "company", label: "Company", w: 200 },
  { key: "stage", label: "Stage", w: 150 },
  { key: "arr", label: "ARR", w: 100 },
  { key: "owner", label: "Owner", w: 160 },
  { key: "last", label: "Last activity", w: 150 },
];
const colLeft = (i: number) => COLS.slice(0, i).reduce((s, c) => s + c.w, 0);
const SORT_BTN = { x: MX + 12, w: 200 };
const FILTER_BTN = { x: SORT_BTN.x + SORT_BTN.w + 8, w: 76 };
const POP = { x: FILTER_BTN.x - 6, y: TOOL_Y + 38, w: 236 };
const BAR = { w: 500, h: 46, y: 560 };

const MOVE = Easing.bezier(0.65, 0, 0.35, 1);
const easeOut = Easing.bezier(0.32, 0.72, 0, 1);
const EXIT = Easing.bezier(0.55, 0, 1, 0.45);
const CAMERA = Easing.bezier(0.87, 0, 0.13, 1);
const HEAVY = { mass: 1, damping: 26, stiffness: 120 };
const CARD = { mass: 0.8, damping: 18, stiffness: 160 };
const CHIP = { mass: 0.5, damping: 12, stiffness: 200 };
const MORPH = { damping: 200 };
const tween = (f: number, a: number, b: number, easing = easeOut) =>
  interpolate(f, [a, b], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing,
  });
const clamp = (v: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const CL = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

function withAlpha(color: string, alpha: number) {
  const hex = color.replace("#", "");
  const full = hex.length === 3 ? hex.replace(/(.)/g, "$1$1") : hex;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return color;
  const n = Number.parseInt(full, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

const fmtArr = (n: number) =>
  n >= 1_000_000
    ? `$${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`
    : `$${Math.round(n / 1000)}K`;

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
      const p = MOVE(clamp((f - a.t) / Math.max(1, b.t - a.t), 0, 1));
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const d = Math.hypot(dx, dy) || 1;
      const arc = Math.sin(p * Math.PI) * Math.min(26, d * 0.1);
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
        transform: `scale(${1 - 0.04 * press})`,
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

interface Pal {
  stage: string;
  win: string;
  panel: string;
  border: string;
  line: string;
  text: string;
  muted: string;
  faint: string;
  hover: string;
  pop: string;
  dark: boolean;
}

function palette(theme: "light" | "dark"): Pal {
  return theme === "dark"
    ? {
        stage: "rgba(3,4,8,0.3)",
        win: "#111113",
        panel: "#141416",
        border: "rgba(255,255,255,0.09)",
        line: "rgba(255,255,255,0.065)",
        text: "#EDEDEF",
        muted: "#A4A5AB",
        faint: "#7C7D84",
        hover: "rgba(255,255,255,0.04)",
        pop: "#1F1F23",
        dark: true,
      }
    : {
        stage: "rgba(244,243,240,0.28)",
        win: "#FAFAFA",
        panel: "#FFFFFF",
        border: "rgba(17,19,24,0.1)",
        line: "rgba(17,19,24,0.07)",
        text: "#18181B",
        muted: "#5F6168",
        faint: "#8E9096",
        hover: "rgba(17,19,24,0.025)",
        pop: "#FFFFFF",
        dark: false,
      };
}

const ICONS = {
  sort: "M5 3v10M2.75 10.75 5 13l2.25-2.25M11 13V3M8.75 5.25 11 3l2.25 2.25",
  filter: "M2.5 4.5h11M4.5 8h7M6.5 11.5h3",
  chevDown: "M4.75 6.5 8 9.75l3.25-3.25",
  x: "M4.75 4.75l6.5 6.5M11.25 4.75l-6.5 6.5",
  arrowDown: "M8 3.25v9.5M4.5 9.25 8 12.75l3.5-3.5",
  send: "M13.5 2.5 7 9M13.5 2.5 9.4 13.5 7 9 2.5 6.6z",
  bell: "M4.25 11V7.25a3.75 3.75 0 0 1 7.5 0V11l1 1.25h-9.5zM6.6 13.75a1.5 1.5 0 0 0 2.8 0",
  task: "M4.5 2.75h7a1.75 1.75 0 0 1 1.75 1.75v7a1.75 1.75 0 0 1-1.75 1.75h-7a1.75 1.75 0 0 1-1.75-1.75v-7A1.75 1.75 0 0 1 4.5 2.75zM5.75 8.1l1.6 1.6 3-3.2",
  note: "M4.25 2.5h5L12 5.25v8.25H4.25zM9 2.5v3h3M6.25 8.5h3.5M6.25 11h2.5",
  mail: "M3.25 3.75h9.5a.75.75 0 0 1 .75.75v7a.75.75 0 0 1-.75.75h-9.5a.75.75 0 0 1-.75-.75v-7a.75.75 0 0 1 .75-.75zM2.75 4.5 8 8.75l5.25-4.25",
  chart: "M3 2.75v10.5h10.25M6 10.5V8.25M8.75 10.5v-5M11.5 10.5V7",
  zap: "M8.75 2.25 3.75 9H8l-.75 4.75L12.25 7H8z",
  list: "M6 4.5h7.25M6 8h7.25M6 11.5h7.25M2.9 4.5h.01M2.9 8h.01M2.9 11.5h.01",
  search:
    "M7.25 11.75a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9zM13.25 13.25l-2.8-2.8",
  sliders:
    "M2.75 5h5.5M11.25 5h2M2.75 11h2M7.75 11h5.5M9.75 3.4v3.2M6.25 9.4v3.2",
  download: "M8 2.75v7.5M4.75 7 8 10.25 11.25 7M3 13.25h10",
  trash: "M3 4.5h10M6.25 4.5V3h3.5v1.5M4.5 4.5l.6 8.75h5.8l.6-8.75",
  plus: "M8 3.5v9M3.5 8h9",
  building:
    "M3 13.25h10M4.25 13.25V3h5v10.25M9.25 6h2.5v7.25M6.25 5.5h1M6.25 8h1M6.25 10.5h1",
  user: "M8 7.75a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM3.5 13.25c.6-2.2 2.4-3.4 4.5-3.4s3.9 1.2 4.5 3.4",
  deal: "M2.75 5.25h10.5v7.5H2.75zM5.75 5.25v-1.5h4.5v1.5M2.75 8.75h10.5",
  grid: "M3 3h4v4H3zM9 3h4v4H9zM3 9h4v4H3zM9 9h4v4H9z",
} as const;
type IconName = keyof typeof ICONS;

function Icon({
  name,
  color,
  size = 14,
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
        strokeWidth={name === "list" ? 1.6 : width}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Checkbox({ p, accent, pal }: { p: number; accent: string; pal: Pal }) {
  const c = clamp(p, 0, 1.3);
  return (
    <div
      style={{
        width: 14,
        height: 14,
        borderRadius: 4,
        border: `1.2px solid ${c > 0.3 ? accent : pal.dark ? "rgba(255,255,255,0.22)" : "rgba(17,19,24,0.2)"}`,
        background: c > 0 ? withAlpha(accent, clamp(c, 0, 1)) : "transparent",
        boxSizing: "border-box",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transform: `scale(${1 + 0.08 * Math.sin(clamp(c, 0, 1) * Math.PI)})`,
      }}
    >
      {c > 0 && (
        <svg width={10} height={10} viewBox="0 0 10 10">
          <path
            d="M2 5.2 L4.1 7.2 L8 3"
            fill="none"
            stroke="#fff"
            strokeWidth={1.6}
            strokeLinecap="round"
            strokeLinejoin="round"
            pathLength={1}
            strokeDasharray="1 1"
            strokeDashoffset={1 - clamp(c, 0, 1)}
          />
        </svg>
      )}
    </div>
  );
}

function Avatar({
  name,
  pal,
  size = 20,
}: {
  name: string;
  pal: Pal;
  size?: number;
}) {
  const initials = name
    .split(" ")
    .map((s) => s[0])
    .join("")
    .slice(0, 2);
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 999,
        background: pal.dark ? "#2A2A2F" : "#ECEBE7",
        color: pal.muted,
        fontSize: size * 0.44,
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

function StagePill({ stage, pal }: { stage: string; pal: Pal }) {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        height: 24,
        padding: "0 9px",
        borderRadius: 6,
        boxShadow: `inset 0 0 0 1px ${pal.border}`,
        fontSize: 13.5,
        color: pal.text,
      }}
    >
      <div
        style={{
          width: 7,
          height: 7,
          borderRadius: 999,
          background: STAGE_COLORS[stage] ?? pal.faint,
        }}
      />
      {stage}
    </div>
  );
}

function Row({
  r,
  pal,
  accent,
  checked,
  sel,
}: {
  r: TableRecord;
  pal: Pal;
  accent: string;
  checked: number;
  sel: number;
}) {
  const cell = (
    i: number,
    children: React.ReactNode,
    style: React.CSSProperties = {},
  ) => (
    <div
      style={{
        position: "absolute",
        left: colLeft(i),
        width: COLS[i].w,
        top: 0,
        height: ROW_H,
        display: "flex",
        alignItems: "center",
        padding: "0 10px",
        boxSizing: "border-box",
        fontSize: 14.5,
        color: pal.text,
        overflow: "hidden",
        whiteSpace: "nowrap",
        ...style,
      }}
    >
      {children}
    </div>
  );
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background:
          sel > 0
            ? withAlpha(accent, (pal.dark ? 0.12 : 0.06) * sel)
            : pal.panel,
      }}
    >
      {cell(0, <Checkbox p={checked} accent={accent} pal={pal} />, {
        justifyContent: "center",
        padding: 0,
      })}
      {cell(
        1,
        <>
          <div
            style={{
              width: 22,
              height: 22,
              borderRadius: 6,
              background: withAlpha(r.color, pal.dark ? 0.22 : 0.12),
              color: pal.dark ? "#EDEDEF" : r.color,
              fontSize: 12,
              fontWeight: 400,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginRight: 10,
              flexShrink: 0,
            }}
          >
            {r.company[0]}
          </div>
          <span style={{ fontWeight: 400 }}>{r.company}</span>
        </>,
      )}
      {cell(2, <StagePill stage={r.stage} pal={pal} />)}
      {cell(
        3,
        <span style={{ fontVariantNumeric: "tabular-nums" }}>
          {fmtArr(r.arr)}
        </span>,
        { justifyContent: "flex-end" },
      )}
      {cell(
        4,
        <>
          <Avatar name={r.owner} pal={pal} />
          <span style={{ marginLeft: 8 }}>{r.owner}</span>
        </>,
      )}
      {cell(5, <span style={{ color: pal.muted }}>{r.lastInteraction}</span>)}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: 1,
          background: pal.line,
        }}
      />
    </div>
  );
}

const NAV: [string, IconName][] = [
  ["Notifications", "bell"],
  ["Tasks", "task"],
  ["Emails", "mail"],
  ["Reports", "chart"],
];
const RECORDS: [string, IconName][] = [
  ["Companies", "building"],
  ["People", "user"],
  ["Deals", "deal"],
  ["Workspaces", "grid"],
];

function Sidebar({
  pal,
  workspace,
  title,
}: {
  pal: Pal;
  workspace: string;
  title: string;
}) {
  const icon = (name: IconName) => <Icon name={name} color={pal.muted} />;
  const row = (
    label: string,
    lead: React.ReactNode,
    active = false,
    trail?: React.ReactNode,
  ) => (
    <div
      key={label}
      style={{
        height: 30,
        display: "flex",
        alignItems: "center",
        gap: 9,
        padding: "0 8px",
        borderRadius: 6,
        fontSize: 14,
        color: active ? pal.text : pal.muted,
        fontWeight: 400,
        background: active
          ? pal.dark
            ? "rgba(255,255,255,0.06)"
            : "rgba(17,19,24,0.05)"
          : "transparent",
      }}
    >
      {lead}
      {label}
      <div style={{ flex: 1 }} />
      {trail}
    </div>
  );
  return (
    <div
      style={{
        width: SIDEBAR,
        padding: "12px 10px",
        boxSizing: "border-box",
        borderRight: `1px solid ${pal.border}`,
        height: "100%",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          height: 30,
          padding: "0 6px",
        }}
      >
        <div
          style={{
            width: 20,
            height: 20,
            borderRadius: 5,
            background: pal.dark ? "#ECECEE" : "#1C1D1F",
            color: pal.dark ? "#121214" : "#fff",
            fontSize: 12,
            fontWeight: 400,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {workspace[0]}
        </div>
        <span style={{ fontSize: 14.5, fontWeight: 400, color: pal.text }}>
          {workspace}
        </span>
        <Icon name="chevDown" color={pal.faint} size={12} />
      </div>
      <div
        style={{
          marginTop: 8,
          height: 30,
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "0 8px",
          borderRadius: 7,
          boxShadow: `inset 0 0 0 1px ${pal.border}`,
          background: pal.panel,
          fontSize: 14,
          color: pal.muted,
        }}
      >
        <Icon name="search" color={pal.muted} />
        Search
        <div style={{ flex: 1 }} />
        <span
          style={{
            fontSize: 11,
            lineHeight: "16px",
            color: pal.muted,
            boxShadow: `inset 0 0 0 1px ${pal.border}`,
            borderRadius: 4,
            padding: "0 4px",
          }}
        >
          ⌘K
        </span>
      </div>
      <div style={{ marginTop: 10 }}>
        {NAV.map(([l, ic]) => row(l, icon(ic)))}
      </div>
      <div
        style={{
          fontSize: 12,
          color: pal.muted,
          padding: "14px 8px 4px",
          fontWeight: 400,
        }}
      >
        Records
      </div>
      {RECORDS.map(([l, ic]) =>
        row(
          l,
          <Icon name={ic} color={l === title ? pal.text : pal.muted} />,
          l === title,
        ),
      )}
      <div
        style={{
          fontSize: 12,
          color: pal.muted,
          padding: "14px 8px 4px",
          fontWeight: 400,
        }}
      >
        Lists
      </div>
      {row("Enterprise", icon("list"))}
      {row("Q4 expansion", icon("list"))}
    </div>
  );
}

export function TableFilter({
  rows = DEFAULT_ROWS,
  title = "Companies",
  filterAttribute = "Stage",
  filterValue = "Closed-won",
  selectCount = 3,
  bulkAction = "Add to sequence",
  workspace = "remocn",
  theme = "light",
  accent = "#3B5BFD",
  speed = 1,
  ground,
  groundParams,
}: TableFilterProps) {
  const frame = useCurrentFrame() * speed;
  const { width: W, height: H, fps } = useVideoConfig();
  const u = Math.min(W / 1280, H / 720);
  const pal = palette(theme);
  const sp = (
    f: number,
    config: { mass?: number; damping: number; stiffness?: number } = CARD,
    durationInFrames?: number,
  ) => spring({ frame: f, fps, config, durationInFrames });

  const matchIdx = rows
    .map((r, i) => (r.stage === filterValue ? i : -1))
    .filter((i) => i >= 0);
  const sorted = [...matchIdx].sort((a, b) => rows[b].arr - rows[a].arr);
  const nSel = Math.min(selectCount, sorted.length);
  const stages = Object.keys(STAGE_COLORS).filter(
    (s) => rows.some((r) => r.stage === s) || s === filterValue,
  );
  const optIdx = Math.max(0, stages.indexOf(filterValue));

  const T = {
    filterClick: 48,
    optionClick: 72,
    collapse: 78,
    sortClick: 114,
    flip: 117,
    check: [144, 151, 158].slice(0, nSel),
    actionHover: 180,
  };
  const FLIP_LEN = 11;
  const barStart = T.check[0] ?? 999;

  const filterPt = { x: FILTER_BTN.x + 42, y: TOOL_Y + 21 };
  const optPt = { x: POP.x + 78, y: POP.y + 8 + 36 + 36 + optIdx * 30 + 16 };
  const arrPt = { x: MX + colLeft(4) + 62, y: HEAD_Y + 19 };
  const checkPt = (k: number) => ({ x: MX + 21, y: BODY_Y + k * ROW_H + 19 });
  const barX = MX + (WIN.w - SIDEBAR) / 2 - BAR.w / 2;
  const actionPt = { x: barX + 148 + 84, y: BAR.y + BAR.h / 2 + 3 };
  const keys: Key[] = [
    { t: 22, x: 1010, y: 500 },
    { t: T.filterClick - 4, ...filterPt },
    { t: T.filterClick + 6, ...filterPt },
    { t: T.optionClick - 4, ...optPt },
    { t: T.optionClick + 6, ...optPt },
    { t: T.sortClick - 4, ...arrPt },
    { t: T.sortClick + 10, ...arrPt },
  ];
  T.check.forEach((t, k) => {
    keys.push({ t: t - 3, ...checkPt(k) }, { t: t + 2, ...checkPt(k) });
  });
  keys.push({ t: T.actionHover, ...actionPt });
  const cur = pathAt(keys, frame);
  const clicks = [
    T.filterClick,
    T.optionClick,
    T.sortClick,
    ...T.check,
    T.actionHover + 8,
  ];
  const press = clamp(
    Math.max(
      0,
      ...clicks.map(
        (c) => sp(frame - (c - 2), CHIP) - sp(frame - (c + 2), CHIP),
      ),
    ),
    0,
    1,
  );
  const cursorIn = interpolate(frame, [20, 28], [0, 1], CL);

  const enter = sp(frame, HEAVY);
  const popOpen = sp(frame - (T.filterClick + 1), CARD);
  const popClose = tween(frame, T.optionClick + 2, T.optionClick + 6, EXIT);
  const pop = popOpen * (1 - popClose);
  const chip = sp(frame - (T.optionClick + 4), CHIP);
  const sortOn = frame >= T.sortClick + 1;
  const sortArrow = tween(frame, T.sortClick + 1, T.sortClick + 7);
  const filtered = frame >= T.collapse;
  const countIn = tween(frame, T.collapse, T.collapse + 6);
  const countVal = filtered ? matchIdx.length : rows.length;
  const sumArr = (idx: number[]) =>
    fmtArr(idx.reduce((s, i) => s + rows[i].arr, 0));
  const arrSum = filtered ? sumArr(matchIdx) : sumArr(rows.map((_, i) => i));

  let nonMatch = 0;
  const fadeOut = rows.map((_, i) => {
    if (matchIdx.includes(i)) return 0;
    const at = T.collapse + nonMatch++ * 0.6;
    return tween(frame, at, at + 4);
  });
  const collapse = rows.map((_, i) =>
    matchIdx.includes(i) ? 0 : sp(frame - (T.collapse + 2), MORPH, 9),
  );
  const ys: number[] = [];
  let acc = 0;
  rows.forEach((_, i) => {
    ys.push(acc);
    acc += ROW_H * (1 - collapse[i]);
  });
  const flipT = sp(frame - T.flip, MORPH, FLIP_LEN + 3);
  const flipArc = Math.sin(flipT * Math.PI);
  const rowY = rows.map((_, i) => {
    const s = sorted.indexOf(i);
    return s < 0 ? ys[i] : lerp(ys[i], s * ROW_H, flipT);
  });
  const climb = rows.map((_, i) => {
    const s = sorted.indexOf(i);
    return s < 0 ? 0 : Math.sign(matchIdx.indexOf(i) - s);
  });
  const checks = rows.map((_, i) => {
    const s = sorted.indexOf(i);
    if (s < 0 || s >= nSel) return 0;
    return tween(frame, T.check[s], T.check[s] + 6);
  });
  const selected = T.check.filter((t) => frame >= t + 1).length;
  const bar = sp(frame - (barStart + 2), CARD);
  const selIn = tween(
    frame,
    (T.check[selected - 1] ?? 0) + 1,
    (T.check[selected - 1] ?? 0) + 6,
  );
  const actionHover = tween(frame, T.actionHover - 5, T.actionHover);
  const tableBottom = BODY_Y + acc;
  const sortW = lerp(SORT_BTN.w, 134, sortArrow);
  const filterX = SORT_BTN.x + sortW + 8;

  const camT = interpolate(
    frame,
    [T.collapse, T.check[0] ?? T.collapse + 60],
    [0, 1],
    { ...CL, easing: CAMERA },
  );

  const btn = (x: number, w: number, label: React.ReactNode, active = 0) => (
    <div
      style={{
        position: "absolute",
        left: x,
        top: TOOL_Y + 6,
        width: w,
        height: 28,
        borderRadius: 7,
        boxShadow: `inset 0 0 0 1px ${active > 0 ? withAlpha(accent, 0.5 * active) : pal.border}`,
        background:
          active > 0
            ? withAlpha(accent, (pal.dark ? 0.12 : 0.06) * active)
            : pal.panel,
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: "0 10px",
        boxSizing: "border-box",
        fontSize: 14,
        color: pal.muted,
        whiteSpace: "nowrap",
        overflow: "hidden",
      }}
    >
      {label}
    </div>
  );

  const tall = H > W;
  const uu = tall ? (W * 0.96) / (WIN.w - SIDEBAR) : u;
  const ox = tall ? W * 0.02 - MX * uu : (W - 1280 * u) / 2;
  const oy = tall ? H * 0.6 - (WIN.y + WIN.h / 2) * uu : (H - 720 * u) / 2;
  const readIn = interpolate(frame, [6, 20], [0, 1], {
    ...CL,
    easing: easeOut,
  });

  return (
    <AbsoluteFill style={{ fontFamily, overflow: "hidden" }}>
      <GshGround
        preset={ground ?? (pal.dark ? "velvet-hour" : "paper-crease")}
        params={groundParams}
        timeOffset={pal.dark ? 5 : 2}
        timeScale={0.3}
      />
      <AbsoluteFill style={{ background: pal.stage }} />
      {tall ? (
        <div
          style={{
            position: "absolute",
            left: W * 0.08,
            right: W * 0.08,
            top: H * 0.08,
            color: pal.text,
            opacity: readIn,
            transform: `translateY(${(1 - readIn) * 30}px)`,
          }}
        >
          <div
            style={{
              fontSize: W * 0.22,
              fontWeight: 300,
              letterSpacing: "-0.05em",
              lineHeight: 0.95,
              fontVariantNumeric: "tabular-nums",
              opacity: filtered ? 0.25 + 0.75 * countIn : 1,
            }}
          >
            {arrSum}
          </div>
          <div
            style={{
              marginTop: W * 0.03,
              fontSize: W * 0.045,
              color: pal.muted,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {filtered
              ? `in ${countVal} ${filterValue.toLowerCase()} ${title.toLowerCase()}`
              : `across ${countVal} ${title.toLowerCase()}`}
          </div>
        </div>
      ) : null}
      <div
        style={{
          position: "absolute",
          left: ox,
          top: oy,
          width: 1280,
          height: 720,
          transformOrigin: "0 0",
          transform: `scale(${uu})`,
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            transformOrigin: `${MX + 400}px ${HEAD_Y}px`,
            transform: `scale(${1 + 0.07 * camT}) translateY(${(1 - enter) * 34}px)`,
            opacity: clamp(enter * 1.6, 0, 1),
          }}
        >
          <div
            style={{
              position: "absolute",
              left: WIN.x,
              top: WIN.y,
              width: WIN.w,
              height: WIN.h,
              borderRadius: 14,
              overflow: "hidden",
              background: pal.win,
              display: "flex",
              boxShadow: pal.dark
                ? "0 0 0 1px rgba(255,255,255,0.09), inset 0 1px 0 rgba(255,255,255,0.05), 0 30px 80px -20px rgba(0,0,0,0.7)"
                : "0 0 0 1px rgba(17,19,24,0.06), 0 2px 4px rgba(17,19,24,0.04), 0 30px 70px -24px rgba(17,19,24,0.28)",
            }}
          >
            <Sidebar pal={pal} workspace={workspace} title={title} />
            <div
              style={{ flex: 1, background: pal.panel, position: "relative" }}
            >
              <div
                style={{
                  height: 44,
                  display: "flex",
                  alignItems: "center",
                  gap: 9,
                  padding: "0 16px",
                  borderBottom: `1px solid ${pal.border}`,
                }}
              >
                <Icon name="building" color={pal.text} size={15} />
                <span
                  style={{ fontSize: 15, fontWeight: 400, color: pal.text }}
                >
                  {title}
                </span>
                <div style={{ flex: 1 }} />
                <Avatar name="Maya Chen" pal={pal} size={24} />
              </div>
              <div
                style={{
                  height: 44,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "0 12px",
                  borderBottom: `1px solid ${pal.border}`,
                }}
              >
                <div
                  style={{
                    height: 28,
                    display: "flex",
                    alignItems: "center",
                    gap: 7,
                    padding: "0 10px",
                    borderRadius: 7,
                    boxShadow: `inset 0 0 0 1px ${pal.border}`,
                    fontSize: 14,
                    color: pal.text,
                    fontWeight: 400,
                  }}
                >
                  All {title.toLowerCase()}
                  <Icon name="chevDown" color={pal.muted} size={12} />
                </div>
                <div style={{ flex: 1 }} />
                {(
                  [
                    ["View settings", "sliders"],
                    ["Import / Export", "download"],
                  ] as [string, IconName][]
                ).map(([l, ic]) => (
                  <div
                    key={l}
                    style={{
                      height: 28,
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "0 10px 0 8px",
                      borderRadius: 7,
                      boxShadow: `inset 0 0 0 1px ${pal.border}`,
                      fontSize: 14,
                      color: pal.text,
                    }}
                  >
                    <Icon name={ic} color={pal.muted} />
                    {l}
                  </div>
                ))}
              </div>
            </div>
          </div>
          {btn(
            SORT_BTN.x,
            sortW,
            <>
              <Icon name="sort" color={pal.muted} />
              <span>Sorted by</span>
              <span style={{ color: pal.text, fontWeight: 400 }}>
                {sortOn ? "ARR" : "Last activity"}
              </span>
            </>,
            interpolate(
              frame,
              [
                T.sortClick,
                T.sortClick + 4,
                T.sortClick + 26,
                T.sortClick + 36,
              ],
              [0, 1, 1, 0],
              CL,
            ),
          )}
          {btn(
            filterX,
            FILTER_BTN.w,
            <>
              <Icon name="filter" color={pal.muted} />
              <span style={{ color: pal.text }}>Filter</span>
            </>,
            pop,
          )}
          {chip > 0.01 && (
            <div
              style={{
                position: "absolute",
                left: filterX + FILTER_BTN.w + 8,
                top: TOOL_Y + 6,
                height: 28,
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "0 6px 0 10px",
                borderRadius: 7,
                background: withAlpha(accent, pal.dark ? 0.16 : 0.07),
                boxShadow: `inset 0 0 0 1px ${withAlpha(accent, 0.32)}`,
                fontSize: 14,
                color: pal.text,
                transformOrigin: "0 50%",
                transform: `translateX(${(1 - chip) * -6}px) scale(${0.96 + 0.04 * chip})`,
                opacity: chip,
                whiteSpace: "nowrap",
              }}
            >
              <span style={{ color: pal.muted }}>{filterAttribute}</span>
              <span style={{ color: pal.faint }}>is</span>
              <div
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: 999,
                  background: STAGE_COLORS[filterValue] ?? accent,
                }}
              />
              <span style={{ fontWeight: 400 }}>{filterValue}</span>
              <div style={{ marginLeft: 2 }}>
                <Icon name="x" color={pal.muted} size={13} />
              </div>
            </div>
          )}
          <div
            style={{
              position: "absolute",
              left: MX,
              top: HEAD_Y,
              width: WIN.w - SIDEBAR,
              height: 34,
              borderTop: `1px solid ${pal.border}`,
              borderBottom: `1px solid ${pal.border}`,
              boxSizing: "border-box",
              background: pal.panel,
            }}
          >
            {COLS.map((c, i) => (
              <div
                key={c.key}
                style={{
                  position: "absolute",
                  left: colLeft(i),
                  width: c.w,
                  top: 0,
                  bottom: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: c.key === "arr" ? "flex-end" : "flex-start",
                  gap: 6,
                  padding: "0 10px",
                  boxSizing: "border-box",
                  fontSize: 14,
                  color: c.key === "arr" && sortOn ? pal.text : pal.muted,
                  fontWeight: 400,
                  background:
                    c.key === "arr" && sortOn
                      ? withAlpha(accent, 0.06 * clamp(sortArrow, 0, 1))
                      : "transparent",
                }}
              >
                {i === 0 ? (
                  <Checkbox p={0} accent={accent} pal={pal} />
                ) : (
                  c.label
                )}
                {c.key === "arr" && sortArrow > 0.01 && (
                  <div
                    style={{
                      transform: `translateY(${(1 - sortArrow) * -4}px)`,
                      opacity: sortArrow,
                    }}
                  >
                    <Icon
                      name="arrowDown"
                      color={accent}
                      size={13}
                      width={1.6}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
          <div
            style={{
              position: "absolute",
              left: MX,
              top: BODY_Y,
              width: WIN.w - SIDEBAR,
              height: ROW_H * rows.length,
              overflow: "hidden",
            }}
          >
            {rows.map((r, i) => {
              const a = sp(frame - (10 + i * 2.5), CARD);
              const lift = climb[i] > 0 ? flipArc : 0;
              const sink = climb[i] < 0 ? flipArc : 0;
              return (
                <div
                  key={r.company}
                  style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    top: rowY[i] + (1 - a) * 12,
                    height: ROW_H * (1 - collapse[i]),
                    overflow: "hidden",
                    opacity:
                      clamp(a * 1.6, 0, 1) *
                      (1 - fadeOut[i]) *
                      (1 - 0.9 * sink),
                    zIndex: lift > 0 ? 5 : 1,
                    boxShadow:
                      lift > 0
                        ? `0 0 0 1px ${pal.line}, 0 ${6 * lift}px ${16 * lift}px rgba(0,0,0,${(pal.dark ? 0.4 : 0.08) * lift})`
                        : "none",
                  }}
                >
                  <Row
                    r={r}
                    pal={pal}
                    accent={accent}
                    checked={checks[i]}
                    sel={checks[i]}
                  />
                </div>
              );
            })}
          </div>
          <div
            style={{
              position: "absolute",
              left: MX,
              top: tableBottom + (1 - enter) * 12,
              width: WIN.w - SIDEBAR,
              height: 36,
              display: "flex",
              alignItems: "center",
              fontSize: 14,
              color: pal.muted,
              whiteSpace: "nowrap",
            }}
          >
            {COLS.map((c, i) => {
              if (i === 0) return null;
              const value =
                c.key === "company"
                  ? String(countVal)
                  : c.key === "arr"
                    ? arrSum
                    : null;
              return (
                <div
                  key={c.key}
                  style={{
                    width: i === 1 ? COLS[0].w + c.w : c.w,
                    display: "flex",
                    justifyContent: "flex-end",
                    alignItems: "center",
                    gap: 5,
                    paddingRight: 10,
                    boxSizing: "border-box",
                  }}
                >
                  {value ? (
                    <>
                      <span
                        style={{
                          color: pal.text,
                          fontWeight: 400,
                          fontVariantNumeric: "tabular-nums",
                          opacity: filtered ? 0.3 + 0.7 * countIn : 1,
                          transform: `translateY(${filtered ? (1 - countIn) * 3 : 0}px)`,
                        }}
                      >
                        {value}
                      </span>
                      {c.key === "company" ? "count" : "sum"}
                    </>
                  ) : (
                    <>
                      <Icon name="plus" color={pal.faint} size={12} />
                      <span style={{ color: pal.faint }}>Add calculation</span>
                    </>
                  )}
                </div>
              );
            })}
          </div>
          {pop > 0.01 && (
            <div
              style={{
                position: "absolute",
                left: POP.x,
                top: POP.y,
                width: POP.w,
                padding: 6,
                boxSizing: "border-box",
                borderRadius: 10,
                background: pal.pop,
                boxShadow: pal.dark
                  ? "0 0 0 1px rgba(255,255,255,0.1), 0 16px 40px rgba(0,0,0,0.55)"
                  : "0 0 0 1px rgba(17,19,24,0.08), 0 12px 32px -4px rgba(17,19,24,0.14), 0 2px 6px rgba(17,19,24,0.05)",
                transformOrigin: "48px 0",
                transform: `scale(${0.96 + 0.04 * pop}) translateY(${(1 - pop) * -4}px)`,
                opacity: clamp(pop * 1.4, 0, 1),
                zIndex: 30,
              }}
            >
              <div
                style={{
                  height: 30,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "0 8px",
                  fontSize: 14,
                  color: pal.muted,
                }}
              >
                Where{" "}
                <span
                  style={{
                    color: pal.text,
                    fontWeight: 400,
                    padding: "2px 6px",
                    borderRadius: 5,
                    boxShadow: `inset 0 0 0 1px ${pal.border}`,
                  }}
                >
                  {filterAttribute}
                </span>{" "}
                is
              </div>
              <div
                style={{
                  height: 30,
                  margin: "4px 0 2px",
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  padding: "0 8px",
                  borderRadius: 6,
                  boxShadow: `inset 0 0 0 1px ${pal.border}`,
                  fontSize: 14,
                  color: pal.faint,
                }}
              >
                <Icon name="search" color={pal.faint} size={13} />
                Search options…
              </div>
              {stages.map((s, i) => {
                const hov =
                  i === optIdx
                    ? interpolate(
                        frame,
                        [T.optionClick - 8, T.optionClick - 3],
                        [0, 1],
                        CL,
                      )
                    : 0;
                return (
                  <div
                    key={s}
                    style={{
                      height: 30,
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "0 8px",
                      borderRadius: 6,
                      fontSize: 14,
                      color: pal.text,
                      background:
                        hov > 0
                          ? pal.dark
                            ? `rgba(255,255,255,${0.07 * hov})`
                            : `rgba(17,19,24,${0.05 * hov})`
                          : "transparent",
                    }}
                  >
                    <div
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: 999,
                        background: STAGE_COLORS[s],
                      }}
                    />
                    {s}
                  </div>
                );
              })}
            </div>
          )}
          {bar > 0.01 && (
            <div
              style={{
                position: "absolute",
                left: barX,
                top: BAR.y + (1 - bar) * 24,
                width: BAR.w,
                height: BAR.h,
                borderRadius: 12,
                background: pal.dark ? "#26262B" : "#1C1D21",
                boxShadow: pal.dark
                  ? "0 0 0 1px rgba(255,255,255,0.1), 0 16px 40px rgba(0,0,0,0.5)"
                  : "0 0 0 1px rgba(10,12,18,0.9), 0 16px 36px -6px rgba(10,12,18,0.32), 0 4px 10px rgba(10,12,18,0.12)",
                transform: `scale(${0.97 + 0.03 * clamp(bar, 0, 1)})`,
                display: "flex",
                alignItems: "center",
                padding: "0 6px 0 14px",
                boxSizing: "border-box",
                gap: 6,
                opacity: clamp(bar * 1.8, 0, 1),
                color: "#F2F2F4",
                fontSize: 14,
                zIndex: 25,
              }}
            >
              <div
                style={{
                  width: 120,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <Checkbox p={1} accent={accent} pal={pal} />
                <span
                  style={{
                    fontWeight: 400,
                    fontVariantNumeric: "tabular-nums",
                    display: "inline-block",
                    minWidth: 9,
                    opacity: selected > 1 ? 0.3 + 0.7 * selIn : 1,
                    transform: `translateY(${selected > 1 ? (1 - selIn) * 3 : 0}px)`,
                  }}
                >
                  {selected}
                </span>
                <span style={{ color: "#B4B5BB", marginLeft: -3 }}>
                  selected
                </span>
              </div>
              <div
                style={{
                  width: 1,
                  height: 20,
                  background: "rgba(255,255,255,0.14)",
                }}
              />
              <div
                style={{
                  width: 168,
                  whiteSpace: "nowrap",
                  height: 32,
                  borderRadius: 8,
                  background: accent,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 7,
                  fontWeight: 400,
                  color: "#fff",
                  transform: `scale(${1 - 0.03 * press * actionHover})`,
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.16)",
                  filter: `brightness(${1 + 0.08 * actionHover})`,
                }}
              >
                <Icon name="send" color="#fff" size={13} width={1.5} />
                {bulkAction}
              </div>
              {(
                [
                  ["Export", "download"],
                  ["Delete", "trash"],
                ] as [string, IconName][]
              ).map(([l, ic]) => (
                <div
                  key={l}
                  style={{
                    height: 32,
                    padding: "0 8px",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    color: l === "Delete" ? "#FF8A8A" : "#D6D7DC",
                    borderRadius: 8,
                  }}
                >
                  <Icon
                    name={ic}
                    color={l === "Delete" ? "#FF8A8A" : "#A9AAB1"}
                    size={13}
                  />
                  {l}
                </div>
              ))}
              <div style={{ flex: 1 }} />
              <div style={{ paddingRight: 8 }}>
                <Icon name="x" color="#8D8E95" />
              </div>
            </div>
          )}
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              opacity: cursorIn,
              zIndex: 50,
            }}
          >
            <Cursor x={cur.x} y={cur.y} press={press} />
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
}
