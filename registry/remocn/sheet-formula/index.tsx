"use client";

import { loadFont as loadMono } from "@remotion/google-fonts/GeistMono";
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
const mono = loadMono("normal", { weights: ["400"], subsets: ["latin"] });

export interface SheetRow {
  month: string;
  signups: number;
  paid: number;
  /** Revenue in dollars. */
  revenue: number;
}

export interface SheetFormulaProps {
  rows?: SheetRow[];
  /** Typed into E2. References use columns A–D and row 2 (filled down). */
  formula?: string;
  /** Header of the formula column (E1). */
  formulaHeader?: string;
  valueFormat?: "currency" | "percent" | "number";
  title?: string;
  chartTitle?: string;
  theme?: "light" | "dark";
  accent?: string;
  speed?: number;
  /** Three lines beside the sheet: type, fill, chart. */
  lines?: [string, string, string];
  ground?: GshPresetId;
  groundParams?: Partial<GradientParams>;
}

const DEFAULT_ROWS: SheetRow[] = [
  { month: "January", signups: 1240, paid: 148, revenue: 4321 },
  { month: "February", signups: 1512, paid: 171, revenue: 5216 },
  { month: "March", signups: 1386, paid: 166, revenue: 4712 },
  { month: "April", signups: 1904, paid: 231, revenue: 7680 },
  { month: "May", signups: 2318, paid: 284, revenue: 10144 },
  { month: "June", signups: 2105, paid: 262, revenue: 8960 },
  { month: "July", signups: 2760, paid: 338, revenue: 13305 },
  { month: "August", signups: 3192, paid: 401, revenue: 16983 },
];
const HEADERS = ["Month", "Signups", "Paid", "Revenue"];
const REF_COLORS = ["#D9822B", "#3E7CB1", "#2E9E6B", "#C2453D"];
const SCALE_GREEN = "#57BB8A";
const WIN = { x: 48, y: 48, w: 840, h: 624 };
const TITLE_H = 48;
const TOOL_H = 42;
const FX_H = 32;
const GRID_TOP = TITLE_H + TOOL_H + FX_H;
const HEAD_H = 24;
const GUTTER = 46;
const RH = 28;
const TABS_H = 36;
const COL_W = [104, 80, 62, 88, 84];
const OTHER_W = 104;
const NCOLS = 9;
const NROWS = Math.ceil((WIN.h - GRID_TOP - HEAD_H - TABS_H) / RH);
const colW = (c: number) => (c < COL_W.length ? COL_W[c] : OTHER_W);
const colX = (c: number) => {
  let x = GUTTER;
  for (let i = 0; i < c; i++) x += colW(i);
  return x;
};
const rowY = (r: number) => GRID_TOP + HEAD_H + (r - 1) * RH;
const CHART_BTN = { x: 358, w: 78 };
const CHART = { x: colX(5) + 20, y: rowY(2) + 4, w: 334, h: 300 };

const MOVE = Easing.bezier(0.65, 0, 0.35, 1);
const ENTER = Easing.bezier(0.32, 0.72, 0, 1);
const EXIT = Easing.bezier(0.55, 0, 1, 0.45);
const HEAVY = { mass: 1, damping: 26, stiffness: 120 };
const CARD = { mass: 0.8, damping: 18, stiffness: 160 };
const CHIP = { mass: 0.5, damping: 12, stiffness: 200 };
const MORPH = { damping: 200 };
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

const fmtInt = (n: number) =>
  String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
function fmtVal(v: number, f: SheetFormulaProps["valueFormat"]) {
  if (f === "percent") return `${(v * 100).toFixed(1)}%`;
  if (f === "number") return v.toFixed(2);
  return `$${v.toFixed(2)}`;
}
function cellNum(rows: SheetRow[], col: string, row: number) {
  const r = rows[row - 2];
  if (!r) return 0;
  return [0, r.signups, r.paid, r.revenue][col.charCodeAt(0) - 65] ?? 0;
}
function evaluate(formula: string, rows: SheetRow[], shift: number): number {
  const toks =
    formula.replace(/^=/, "").match(/[A-Z]+\d+|\d+(?:\.\d+)?|[-+*/()]/g) ?? [];
  let i = 0;
  function atom(): number {
    const t = toks[i++] ?? "0";
    if (t === "(") {
      const v = expr();
      i++;
      return v;
    }
    if (t === "-") return -atom();
    const m = /^([A-Z]+)(\d+)$/.exec(t);
    return m ? cellNum(rows, m[1], Number(m[2]) + shift) : Number(t) || 0;
  }
  function term(): number {
    let v = atom();
    while (toks[i] === "*" || toks[i] === "/") {
      const op = toks[i++];
      const b = atom();
      v = op === "*" ? v * b : b ? v / b : 0;
    }
    return v;
  }
  function expr(): number {
    let v = term();
    while (toks[i] === "+" || toks[i] === "-") {
      const op = toks[i++];
      const b = term();
      v = op === "+" ? v + b : v - b;
    }
    return v;
  }
  return expr();
}

interface RefTok {
  start: number;
  end: number;
  col: number;
  row: number;
  color: string;
}
function refTokens(formula: string): RefTok[] {
  const out: RefTok[] = [];
  const seen: string[] = [];
  for (const m of formula.matchAll(/([A-Z])(\d+)/g)) {
    if (!seen.includes(m[0])) seen.push(m[0]);
    out.push({
      start: m.index ?? 0,
      end: (m.index ?? 0) + m[0].length,
      col: m[1].charCodeAt(0) - 65,
      row: Number(m[2]),
      color: REF_COLORS[seen.indexOf(m[0]) % REF_COLORS.length],
    });
  }
  return out;
}

function ColoredFormula({
  text,
  refs,
  base,
}: {
  text: string;
  refs: RefTok[];
  base: string;
}) {
  const parts: React.ReactNode[] = [];
  let i = 0;
  for (const r of refs) {
    if (r.start >= text.length) break;
    if (r.start > i)
      parts.push(<span key={`t${i}`}>{text.slice(i, r.start)}</span>);
    parts.push(
      <span key={`r${r.start}`} style={{ color: r.color }}>
        {text.slice(r.start, Math.min(r.end, text.length))}
      </span>,
    );
    i = Math.min(r.end, text.length);
  }
  if (i < text.length) parts.push(<span key="tail">{text.slice(i)}</span>);
  return <span style={{ color: base, whiteSpace: "pre" }}>{parts}</span>;
}
interface Pt {
  x: number;
  y: number;
}
interface Key extends Pt {
  t: number;
  straight?: boolean;
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
      const arc = b.straight
        ? 0
        : Math.sin(p * Math.PI) * Math.min(26, d * 0.1);
      return {
        x: lerp(a.x, b.x, p) + (-dy / d) * arc,
        y: lerp(a.y, b.y, p) + (dx / d) * arc,
      };
    }
  }
  return keys[keys.length - 1];
}

function Cursor({
  x,
  y,
  press,
  cross,
}: Pt & { press: number; cross: boolean }) {
  if (cross) {
    return (
      <svg
        width={22}
        height={22}
        viewBox="-11 -11 22 22"
        style={{
          position: "absolute",
          left: x - 11,
          top: y - 11,
          filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.3))",
        }}
      >
        <path
          d="M0 -8 V8 M-8 0 H8"
          stroke="#fff"
          strokeWidth={4}
          strokeLinecap="round"
        />
        <path
          d="M0 -7.5 V7.5 M-7.5 0 H7.5"
          stroke="#16171A"
          strokeWidth={1.6}
        />
      </svg>
    );
  }
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
  copy: string;
  copyMuted: string;
  scrim: string;
  win: string;
  chrome: string;
  tool: string;
  grid: string;
  line: string;
  head: string;
  headText: string;
  text: string;
  muted: string;
  border: string;
  card: string;
  dark: boolean;
}
function palette(theme: "light" | "dark"): Pal {
  return theme === "dark"
    ? {
        copy: "#f4f4f6",
        copyMuted: "rgba(244,244,246,0.52)",
        scrim: "rgba(2,3,8,0.28)",
        win: "#18191C",
        chrome: "#1D1E22",
        tool: "#26272C",
        grid: "#18191C",
        line: "rgba(255,255,255,0.075)",
        head: "#202125",
        headText: "#8E9097",
        text: "#E6E7EA",
        muted: "#9A9CA3",
        border: "rgba(255,255,255,0.09)",
        card: "#202126",
        dark: true,
      }
    : {
        copy: "#141518",
        copyMuted: "rgba(20,21,24,0.5)",
        scrim: "rgba(243,241,237,0.22)",
        win: "#FFFFFF",
        chrome: "#FAFAFA",
        tool: "#F1F2F4",
        grid: "#FFFFFF",
        line: "#E3E5E8",
        head: "#F8F9FA",
        headText: "#5F6368",
        text: "#1F1F1F",
        muted: "#5F6368",
        border: "rgba(17,19,24,0.1)",
        card: "#FFFFFF",
        dark: false,
      };
}

function Icon({
  d,
  color,
  size = 16,
}: {
  d: string;
  color: string;
  size?: number;
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <path
        d={d}
        stroke={color}
        strokeWidth={1.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
const ICONS = {
  undo: "M5 4 L2.5 6.5 L5 9 M2.5 6.5 H10 a3 3 0 0 1 0 6 H7",
  redo: "M11 4 L13.5 6.5 L11 9 M13.5 6.5 H6 a3 3 0 0 0 0 6 H9",
  print:
    "M4.5 6 V2.5 H11.5 V6 M4.5 11 H3 V6 H13 V11 H11.5 M4.5 9 H11.5 V13.5 H4.5 Z",
  paint: "M3 3 H11 V6.5 H3 Z M11 4.75 H13 V8.5 H7.5 V10.5 M7.5 10.5 V13.5",
  chart: "M3 13 V9 M6.5 13 V5 M10 13 V7.5 M13.5 13 V3",
  star: "M8 2.5 L9.6 6 L13.4 6.3 L10.5 8.8 L11.4 12.5 L8 10.5 L4.6 12.5 L5.5 8.8 L2.6 6.3 L6.4 6 Z",
  lock: "M5 7 V5 a3 3 0 0 1 6 0 V7 M4 7 H12 V13 H4 Z",
  caret: "M4.5 6.5 L8 10 L11.5 6.5",
  plus: "M8 3 V13 M3 8 H13",
  minus: "M3 8 H13",
  list: "M3 4.5 H13 M3 8 H13 M3 11.5 H13",
};

function Caret({ color, size = 8 }: { color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 8 8" style={{ flexShrink: 0 }}>
      <path d="M1 2.5 H7 L4 6 Z" fill={color} />
    </svg>
  );
}

type ToolItem =
  | { icon: keyof typeof ICONS }
  | {
      label: string;
      w: number;
      bold?: boolean;
      italic?: boolean;
      caret?: boolean;
    }
  | "sep";
const TOOLBAR: ToolItem[] = [
  { icon: "undo" },
  { icon: "redo" },
  { icon: "paint" },
  "sep",
  { label: "100%", w: 58, caret: true },
  "sep",
  { label: "$", w: 24 },
  { label: "%", w: 24 },
  { label: ".00", w: 30 },
  "sep",
  { label: "B", w: 26, bold: true },
  { label: "I", w: 26, italic: true },
  "sep",
];

function Chrome({
  pal,
  accent,
  title,
  chartHover,
}: {
  pal: Pal;
  accent: string;
  title: string;
  chartHover: number;
}) {
  return (
    <>
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: WIN.w,
          height: TITLE_H + TOOL_H,
          background: pal.chrome,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 14,
          top: 10,
          width: 24,
          height: 28,
          borderRadius: 5,
          background: accent,
          boxShadow: `inset 0 0 0 1px ${withAlpha("#000000", 0.08)}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg width={14} height={14} viewBox="0 0 14 14">
          <path
            d="M1.5 1.5 H12.5 V12.5 H1.5 Z M1.5 5.2 H12.5 M1.5 8.8 H12.5 M5.5 1.5 V12.5"
            stroke="#fff"
            strokeWidth={1.3}
            fill="none"
          />
        </svg>
      </div>
      <div
        style={{
          position: "absolute",
          left: 50,
          top: 14,
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <span style={{ fontSize: 16, color: pal.text }}>{title}</span>
        <Icon d={ICONS.star} color={pal.muted} size={15} />
      </div>
      <div
        style={{
          position: "absolute",
          right: 16,
          top: 10,
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        {[
          ["MC", "#E5795B"],
          ["LP", "#4F8BE8"],
        ].map(([n, c], i) => (
          <div
            key={n}
            style={{
              width: 28,
              height: 28,
              borderRadius: 999,
              background: c,
              color: "#fff",
              fontSize: 11,
              fontWeight: 400,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginLeft: i ? -8 : 0,
              boxShadow: `0 0 0 2px ${pal.chrome}`,
            }}
          >
            {n}
          </div>
        ))}
      </div>
      <div
        style={{
          position: "absolute",
          left: 10,
          right: 10,
          top: TITLE_H + 3,
          height: 34,
          borderRadius: 18,
          background: pal.tool,
          display: "flex",
          alignItems: "center",
          padding: "0 10px",
          gap: 2,
        }}
      >
        {TOOLBAR.map((it, i) =>
          it === "sep" ? (
            <div
              key={`s${i}`}
              style={{
                width: 1,
                height: 18,
                background: pal.border,
                margin: "0 6px",
              }}
            />
          ) : "icon" in it ? (
            <div
              key={it.icon}
              style={{
                width: 28,
                height: 26,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon d={ICONS[it.icon]} color={pal.muted} />
            </div>
          ) : (
            <div
              key={it.label}
              style={{
                width: it.w,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 5,
                fontSize: 13,
                color: pal.muted,
                fontWeight: 400,
                fontStyle: it.italic ? "italic" : "normal",
                textDecoration: it.label === "A" ? "underline" : "none",
              }}
            >
              {it.label}
              {it.caret ? <Caret color={pal.muted} /> : null}
            </div>
          ),
        )}
      </div>
      <div
        style={{
          position: "absolute",
          left: CHART_BTN.x,
          top: TITLE_H + 7,
          width: CHART_BTN.w,
          height: 26,
          borderRadius: 6,
          background: pal.dark
            ? `rgba(255,255,255,${0.1 * chartHover})`
            : `rgba(17,19,24,${0.07 * chartHover})`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          fontSize: 12.5,
          fontWeight: 400,
          color: pal.muted,
        }}
      >
        <Icon d={ICONS.chart} color={pal.muted} size={15} />
        Chart
      </div>
    </>
  );
}

function ChartCard({
  values,
  labels,
  grow,
  pal,
  accent,
  title,
  fmt,
}: {
  values: number[];
  labels: string[];
  grow: number[];
  pal: Pal;
  accent: string;
  title: string;
  fmt: (v: number) => string;
}) {
  const max = Math.max(...values, 1e-6);
  const e = 10 ** Math.floor(Math.log10(max));
  const step =
    [0.1, 0.2, 0.25, 0.5, 1, 2].map((m) => m * e).find((st) => max / st <= 5) ??
    e;
  const ticks = Math.ceil(max / step);
  const top = ticks * step;
  const plot = { x: 48, y: 58, w: CHART.w - 68, h: CHART.h - 96 };
  const slot = plot.w / values.length;
  const bw = Math.min(30, slot * 0.56);
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <div
        style={{
          position: "absolute",
          left: 18,
          top: 14,
          fontSize: 14,
          fontWeight: 400,
          color: pal.text,
        }}
      >
        {title}
      </div>
      {Array.from({ length: ticks + 1 }, (_, g) => {
        const y = plot.y + plot.h - (g / ticks) * plot.h;
        return (
          <div key={g}>
            <div
              style={{
                position: "absolute",
                left: plot.x,
                top: y,
                width: plot.w,
                height: 1,
                background: g ? pal.line : pal.border,
              }}
            />
            <div
              style={{
                position: "absolute",
                left: 0,
                width: plot.x - 8,
                top: y - 7,
                textAlign: "right",
                fontSize: 10,
                color: pal.muted,
              }}
            >
              {fmt(step * g).replace(/\.00$/, "")}
            </div>
          </div>
        );
      })}
      {values.map((v, k) => {
        const g = clamp(grow[k], 0, 1.2);
        const h = (v / top) * plot.h * g;
        const x = plot.x + slot * k + (slot - bw) / 2;
        return (
          <div key={labels[k]}>
            <div
              style={{
                position: "absolute",
                left: x,
                top: plot.y + plot.h - h,
                width: bw,
                height: h,
                borderRadius: "3px 3px 0 0",
                background:
                  k === values.length - 1
                    ? accent
                    : pal.dark
                      ? "rgba(255,255,255,0.22)"
                      : "rgba(17,19,24,0.16)",
              }}
            />
            <div
              style={{
                position: "absolute",
                left: x - 10,
                width: bw + 20,
                top: plot.y + plot.h - h - 16,
                textAlign: "center",
                fontSize: 10,
                fontWeight: 400,
                color: pal.text,
                opacity: clamp((g - 0.85) * 6, 0, 1),
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {fmt(v).replace(/\.\d+$/, "")}
            </div>
            <div
              style={{
                position: "absolute",
                left: x - 10,
                width: bw + 20,
                top: plot.y + plot.h + 7,
                textAlign: "center",
                fontSize: 10.5,
                color: pal.muted,
              }}
            >
              {labels[k]}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function SheetFormula({
  rows = DEFAULT_ROWS,
  formula = "=D2/C2",
  formulaHeader = "ARPU",
  valueFormat = "currency",
  title = "Signups 2026",
  chartTitle = "ARPU by month",
  theme = "light",
  accent = "#3B5BFD",
  speed = 1,
  lines = ["Type it once.", "Fill it down.", "Chart it in one click."],
  ground,
  groundParams,
}: SheetFormulaProps) {
  const frame = useCurrentFrame() * speed;
  const { width, height, fps } = useVideoConfig();
  const tall = height > width;
  const W = tall ? 720 : 1280;
  const H = tall ? 1280 : 720;
  const u = Math.min(width / W, height / H);
  const pal = palette(theme);
  const sp = (f: number, config: Partial<typeof CARD> = CARD) =>
    spring({ frame: f, fps, config });

  const n = rows.length;
  const lastRow = n + 1;
  const values = rows.map((_, k) => evaluate(formula, rows, k));
  const vMin = Math.min(...values);
  const vMax = Math.max(...values);
  const fmt = (v: number) => fmtVal(v, valueFormat);
  const refs = refTokens(formula);
  const T = { fill: 6, cursorIn: 34, click: 56, type: 64 } as Record<
    string,
    number
  >;
  T.enter = T.type + formula.length * 3 + 8;
  T.grab = T.enter + 22;
  T.release = T.grab + 28;
  T.cf = T.release + 14;
  T.chart = T.cf + n * 3 + 14;
  const typed = clamp(Math.floor((frame - T.type) / 3) + 1, 0, formula.length);
  const editing = frame >= T.click + 4 && frame < T.enter;
  const abs = (x: number, y: number) => ({ x: WIN.x + x, y: WIN.y + y });
  const e2 = abs(colX(4) + colW(4) / 2, rowY(2) + RH / 2);
  const handle = abs(colX(5) - 1, rowY(3) - 1);
  const handleEnd = abs(colX(5) - 1, rowY(lastRow + 1) - 1);
  const chartBtn = abs(CHART_BTN.x + CHART_BTN.w / 2, TITLE_H + 20);
  const keys: Key[] = [
    { t: T.cursorIn, x: 1010, y: 610 },
    { t: T.click - 3, ...e2 },
    { t: T.click + 6, ...e2 },
    { t: T.type + 12, x: e2.x + 46, y: e2.y + 58 },
    { t: T.enter + 4, x: e2.x + 46, y: e2.y + 58 },
    { t: T.grab - 3, ...handle },
    { t: T.grab + 2, ...handle },
    { t: T.release, ...handleEnd, straight: true },
    { t: T.release + 10, ...handleEnd },
    { t: T.chart - 3, ...chartBtn },
    { t: T.chart + 10, ...chartBtn },
    { t: T.chart + 40, x: chartBtn.x + 300, y: chartBtn.y + 470 },
  ];
  const cur = pathAt(keys, frame);
  const dragging = frame >= T.grab && frame < T.release + 2;
  const cross = frame >= T.grab - 6 && frame < T.release + 6;
  const press = Math.max(
    dragging ? 1 : 0,
    ...[T.click, T.chart, T.grab].map((c) =>
      clamp(sp(frame - c + 1, CHIP) - sp(frame - c - 5, CHIP), 0, 1),
    ),
  );
  const cursorIn = interpolate(frame, [T.cursorIn, T.cursorIn + 8], [0, 1], {
    ...CL,
    easing: ENTER,
  });
  const enter = sp(frame, HEAVY);
  const cellIn = (r: number, c: number) =>
    sp(frame - (T.fill + (r - 1) * 2 + c * 0.6), CARD);
  const selMove = sp(frame - T.click, CARD);
  const selGrow = sp(frame - T.release, CARD);
  const curRow = clamp(
    Math.floor((cur.y - WIN.y - rowY(1)) / RH) + 1,
    2,
    lastRow,
  );
  const dragRows = dragging ? curRow : 2;
  const valueIn = (k: number) =>
    k === 0
      ? sp(frame - T.enter, CHIP)
      : sp(frame - (T.release + k * 2.4), CHIP);
  const cfIn = (k: number) => sp(frame - (T.cf + k * 3), MORPH);
  const chartIn = sp(frame - (T.chart + 3), CARD);
  const grow = values.map((_, k) => sp(frame - (T.chart + 10 + k * 2), CARD));
  const chartHover = interpolate(
    frame,
    [T.chart - 10, T.chart - 3, T.chart + 14, T.chart + 22],
    [0, 1, 1, 0],
    CL,
  );
  const s = interpolate(frame, [0, 290], [1, 1.025], CL);
  const avg = values.reduce((a, b) => a + b, 0) / Math.max(1, n);
  const chartSel = interpolate(frame, [T.chart + 70, T.chart + 78], [1, 0], CL);

  const selFrom = { x: colX(0), y: rowY(1), w: colW(0) };
  const selTo = { x: colX(4), y: rowY(2), w: colW(4) };
  const sel = {
    x: lerp(selFrom.x, selTo.x, selMove),
    y: lerp(selFrom.y, selTo.y, selMove),
    w: lerp(selFrom.w, selTo.w, selMove),
    h: RH * (1 + (n - 1) * clamp(selGrow, 0, 1.05)),
  };
  const nameBox =
    frame < T.click ? "A1" : frame < T.release + 2 ? "E2" : `E2:E${lastRow}`;
  const formulaBar: React.ReactNode =
    frame < T.click ? (
      HEADERS[0]
    ) : frame < T.type ? (
      ""
    ) : editing ? (
      <ColoredFormula
        text={formula.slice(0, typed)}
        refs={refs}
        base={pal.text}
      />
    ) : (
      formula
    );
  const caret = editing && Math.floor(frame / 8) % 2 === 0;
  const activeCol = frame >= T.click ? 4 : 0;
  const isActiveRow = (r: number) =>
    frame < T.click
      ? r === 1
      : frame < T.release + 2
        ? r === 2
        : r >= 2 && r <= lastRow;

  const cellBox = (c: number, r: number): React.CSSProperties => ({
    position: "absolute",
    left: colX(c),
    top: rowY(r),
    width: colW(c),
    height: RH,
    display: "flex",
    alignItems: "center",
    justifyContent: c === 0 ? "flex-start" : "flex-end",
    padding: "0 8px",
    boxSizing: "border-box",
    fontSize: 13.5,
    color: pal.text,
    whiteSpace: "nowrap",
    fontVariantNumeric: "tabular-nums",
  });

  const dataCells: React.ReactNode[] = [];
  [...HEADERS, formulaHeader].forEach((h, c) => {
    const p = cellIn(1, c);
    dataCells.push(
      <div
        key={`h${h}`}
        style={{
          ...cellBox(c, 1),
          fontWeight: 400,
          opacity: clamp(p * 1.4, 0, 1),
        }}
      >
        <span style={{ transform: `translateY(${(1 - p) * 5}px)` }}>{h}</span>
      </div>,
    );
  });
  rows.forEach((row, k) => {
    const r = k + 2;
    [
      row.month,
      fmtInt(row.signups),
      fmtInt(row.paid),
      `$${fmtInt(row.revenue)}`,
    ].forEach((txt, c) => {
      const p = cellIn(r, c);
      dataCells.push(
        <div
          key={`c${r}-${c}`}
          style={{ ...cellBox(c, r), opacity: clamp(p * 1.4, 0, 1) }}
        >
          <span style={{ transform: `translateY(${(1 - p) * 6}px)` }}>
            {txt}
          </span>
        </div>,
      );
    });
    const v = valueIn(k);
    const cf = cfIn(k);
    const t = vMax > vMin ? (values[k] - vMin) / (vMax - vMin) : 1;
    const flash =
      k > 0
        ? clamp(1 - (frame - (T.release + k * 2.4)) / 14, 0, 1) *
          (v > 0.05 ? 1 : 0)
        : 0;
    dataCells.push(
      <div
        key={`e${r}`}
        style={{
          ...cellBox(4, r),
          background: `linear-gradient(${withAlpha(accent, 0.22 * flash)}, ${withAlpha(accent, 0.22 * flash)}), ${withAlpha(SCALE_GREEN, (0.14 + 0.66 * t) * clamp(cf, 0, 1) * (pal.dark ? 0.75 : 1))}`,
        }}
      >
        <span
          style={{
            opacity: clamp(v * 1.5, 0, 1),
            transform: `scale(${0.92 + 0.08 * v})`,
            transformOrigin: "right center",
          }}
        >
          {frame >= (k === 0 ? T.enter : T.release) ? fmt(values[k]) : ""}
        </span>
      </div>,
    );
  });

  const swap = (items: React.ReactNode[], beats: number[]) =>
    items.map((node, i) => {
      const inAt = beats[i];
      const outAt = beats[i + 1];
      const pin = interpolate(frame, [inAt, inAt + 14], [0, 1], {
        ...CL,
        easing: ENTER,
      });
      const pout =
        outAt === undefined
          ? 0
          : interpolate(frame, [outAt - 2, outAt + 6], [0, 1], {
              ...CL,
              easing: EXIT,
            });
      if (pin <= 0 || pout >= 1) return null;
      return (
        <div
          key={inAt}
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 0,
            transform: `translateY(${(1 - pin) * 70 - pout * 50}%)`,
            opacity: pin * (1 - pout),
          }}
        >
          {node}
        </div>
      );
    });
  const ws = tall ? 0.8 : 1;
  const gx = tall ? (W - WIN.w * ws) / 2 - WIN.x * ws : 0;
  const gy = tall ? 590 - WIN.y * ws : 0;
  const copyX = tall ? 56 : WIN.x + WIN.w + 44;
  const copyY = tall ? 260 : H / 2 - 92;
  const copyW = tall ? W - 112 : W - copyX - 40;
  const readY = copyY + (tall ? 150 : 140);

  return (
    <AbsoluteFill style={{ fontFamily, overflow: "hidden" }}>
      <GshGround
        preset={ground ?? (pal.dark ? "europa" : "glasswork")}
        params={groundParams}
        timeOffset={pal.dark ? 5 : 9}
        timeScale={0.35}
      />
      <AbsoluteFill style={{ background: pal.scrim }} />
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
            left: copyX,
            top: copyY,
            width: copyW,
            height: tall ? 132 : 116,
            fontSize: tall ? 62 : 54,
            fontWeight: 400,
            lineHeight: 1.04,
            letterSpacing: "-0.035em",
            color: pal.copy,
            overflow: "hidden",
            textWrap: "balance",
          }}
        >
          {swap(
            lines.map((l) => l),
            [8, T.grab - 6, T.chart - 8],
          )}
        </div>
        <div
          style={{
            position: "absolute",
            left: copyX,
            top: readY,
            width: copyW,
            height: 48,
            overflow: "hidden",
            fontSize: tall ? 34 : 30,
            color: pal.copyMuted,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {swap(
            [
              <span key="f" style={{ fontFamily: mono.fontFamily }}>
                <ColoredFormula
                  text={formula.slice(0, typed)}
                  refs={refs}
                  base={pal.copy}
                />
              </span>,
              <span key="r" style={{ fontFamily: mono.fontFamily }}>
                E2:E{lastRow}
              </span>,
              <span key="a">
                Average <span style={{ color: pal.copy }}>{fmt(avg)}</span>
              </span>,
            ],
            [T.type, T.grab - 6, T.chart + 14],
          )}
        </div>
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: 1280,
            height: 720,
            transformOrigin: "0 0",
            transform: `translate(${gx}px, ${gy + (1 - enter) * 40}px) scale(${ws})`,
            opacity: clamp(enter * 1.6, 0, 1),
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              transformOrigin: `${WIN.x + WIN.w / 2}px ${WIN.y + WIN.h / 2}px`,
              transform: `scale(${s})`,
            }}
          >
            <div
              style={{
                position: "absolute",
                left: WIN.x,
                top: WIN.y,
                width: WIN.w,
                height: WIN.h,
                borderRadius: 12,
                overflow: "hidden",
                background: pal.win,
                fontVariantNumeric: "tabular-nums",
                boxShadow: pal.dark
                  ? "0 0 0 1px rgba(255,255,255,0.08), 0 40px 100px rgba(0,0,0,0.6)"
                  : "0 0 0 1px rgba(17,19,24,0.08), 0 40px 90px rgba(17,19,24,0.18), 0 10px 26px rgba(17,19,24,0.07)",
              }}
            >
              <Chrome
                pal={pal}
                accent={accent}
                title={title}
                chartHover={chartHover}
              />
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  top: TITLE_H + TOOL_H,
                  width: WIN.w,
                  height: FX_H,
                  borderTop: `1px solid ${pal.line}`,
                  borderBottom: `1px solid ${pal.line}`,
                  boxSizing: "border-box",
                  display: "flex",
                  alignItems: "center",
                  background: pal.win,
                }}
              >
                <div
                  style={{
                    width: 96,
                    height: "100%",
                    padding: "0 10px 0 12px",
                    boxSizing: "border-box",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    fontSize: 12.5,
                    color: pal.text,
                    borderRight: `1px solid ${pal.line}`,
                  }}
                >
                  {nameBox}
                  <Caret color={pal.muted} />
                </div>
                <div
                  style={{
                    width: 40,
                    display: "flex",
                    justifyContent: "center",
                  }}
                >
                  <svg width={18} height={14} viewBox="0 0 18 14">
                    <text
                      x={2}
                      y={11}
                      fontSize={13}
                      fontStyle="italic"
                      fontFamily="Georgia, 'Times New Roman', serif"
                      fill={pal.muted}
                    >
                      fx
                    </text>
                  </svg>
                </div>
                <div
                  style={{
                    width: 1,
                    height: 18,
                    background: pal.line,
                    marginRight: 10,
                  }}
                />
                <div
                  style={{
                    fontSize: 13,
                    color: pal.text,
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  {formulaBar}
                  {caret && (
                    <div
                      style={{
                        width: 1.5,
                        height: 16,
                        background: pal.text,
                        marginLeft: 1,
                      }}
                    />
                  )}
                </div>
              </div>
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  top: GRID_TOP,
                  width: WIN.w,
                  height: HEAD_H,
                  background: pal.head,
                  borderBottom: `1px solid ${pal.line}`,
                }}
              />
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  top: GRID_TOP,
                  width: GUTTER,
                  bottom: TABS_H,
                  background: pal.head,
                  borderRight: `1px solid ${pal.line}`,
                }}
              />
              {Array.from({ length: NCOLS }, (_, c) => (
                <div
                  key={`col${String.fromCharCode(65 + c)}`}
                  style={{
                    position: "absolute",
                    left: colX(c),
                    top: GRID_TOP,
                    width: colW(c),
                    height: HEAD_H,
                    borderRight: `1px solid ${pal.line}`,
                    boxSizing: "border-box",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 11,
                    color:
                      c === activeCol
                        ? pal.dark
                          ? "#fff"
                          : "#1F1F1F"
                        : pal.headText,
                    fontWeight: 400,
                    background:
                      c === activeCol
                        ? withAlpha(accent, pal.dark ? 0.22 : 0.12)
                        : "transparent",
                  }}
                >
                  {String.fromCharCode(65 + c)}
                </div>
              ))}
              {Array.from({ length: NCOLS }, (_, c) => (
                <div
                  key={`vl${c}`}
                  style={{
                    position: "absolute",
                    left: colX(c + 1) - 1,
                    top: GRID_TOP + HEAD_H,
                    width: 1,
                    bottom: TABS_H,
                    background: pal.line,
                  }}
                />
              ))}
              {Array.from({ length: NROWS }, (_, i) => {
                const r = i + 1;
                const act = isActiveRow(r);
                return (
                  <div key={`r${r}`}>
                    <div
                      style={{
                        position: "absolute",
                        left: 0,
                        top: rowY(r),
                        width: GUTTER,
                        height: RH,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 11,
                        color: act
                          ? pal.dark
                            ? "#fff"
                            : "#1F1F1F"
                          : pal.headText,
                        fontWeight: 400,
                        background: act
                          ? withAlpha(accent, pal.dark ? 0.22 : 0.12)
                          : "transparent",
                      }}
                    >
                      {r}
                    </div>
                    <div
                      style={{
                        position: "absolute",
                        left: r === 1 ? 0 : GUTTER,
                        top: rowY(r + 1) - (r === 1 ? 2 : 1),
                        right: 0,
                        height: r === 1 ? 3 : 1,
                        background:
                          r === 1
                            ? pal.dark
                              ? "#3A3C42"
                              : "#C4C7C5"
                            : pal.line,
                      }}
                    />
                  </div>
                );
              })}
              {dataCells}
              {refs.map((ref) => {
                const p = editing
                  ? clamp(sp(frame - (T.type + (ref.end - 1) * 3), CHIP), 0, 1)
                  : 0;
                if (p <= 0) return null;
                return (
                  <div
                    key={`ref${ref.start}`}
                    style={{
                      position: "absolute",
                      left: colX(ref.col) - 1,
                      top: rowY(ref.row) - 1,
                      width: colW(ref.col) + 1,
                      height: RH + 1,
                      border: `2px solid ${ref.color}`,
                      background: withAlpha(ref.color, 0.1),
                      boxSizing: "border-box",
                      opacity: p,
                      transform: `scale(${1.12 - 0.12 * p})`,
                    }}
                  />
                );
              })}
              {dragging && dragRows > 2 && (
                <div
                  style={{
                    position: "absolute",
                    left: colX(4) - 1,
                    top: rowY(2) - 1,
                    width: colW(4) + 1,
                    height: (dragRows - 1) * RH + 1,
                    border: `1.5px dashed ${pal.dark ? "#B5B8BF" : "#5F6368"}`,
                    boxSizing: "border-box",
                  }}
                />
              )}
              <div
                style={{
                  position: "absolute",
                  left: sel.x - 1,
                  top: sel.y - 1,
                  width: sel.w + 1,
                  height: sel.h + 1,
                  border: `2px solid ${accent}`,
                  background:
                    selGrow > 0.02
                      ? withAlpha(accent, 0.07 * (1 - clamp(cfIn(0), 0, 1)))
                      : "transparent",
                  boxSizing: "border-box",
                  opacity: clamp(enter * 2 - 0.6, 0, 1),
                }}
              >
                {!editing && (
                  <div
                    style={{
                      position: "absolute",
                      right: -5,
                      bottom: -5,
                      width: 8,
                      height: 8,
                      borderRadius: 2,
                      background: accent,
                      boxShadow: `0 0 0 1.5px ${pal.win}`,
                      transform: `scale(${1 + 0.5 * (cross ? 1 : 0)})`,
                    }}
                  />
                )}
              </div>
              {editing && (
                <div
                  style={{
                    position: "absolute",
                    left: colX(4) - 2,
                    top: rowY(2) - 2,
                    minWidth: colW(4) + 3,
                    height: RH + 3,
                    padding: "0 8px",
                    boxSizing: "border-box",
                    border: `2px solid ${accent}`,
                    background: pal.win,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.18)",
                    display: "flex",
                    alignItems: "center",
                    fontSize: 12.5,
                  }}
                >
                  <ColoredFormula
                    text={formula.slice(0, typed)}
                    refs={refs}
                    base={pal.text}
                  />
                  {caret && (
                    <div
                      style={{
                        width: 1.5,
                        height: 15,
                        background: pal.text,
                        marginLeft: 1,
                      }}
                    />
                  )}
                </div>
              )}
              {chartIn > 0.01 && (
                <div
                  style={{
                    position: "absolute",
                    left: CHART.x,
                    top: CHART.y,
                    width: CHART.w,
                    height: CHART.h,
                    borderRadius: 8,
                    background: pal.card,
                    boxShadow: pal.dark
                      ? `0 0 0 1px ${chartSel > 0.01 ? withAlpha(accent, chartSel) : "rgba(255,255,255,0.09)"}, 0 16px 40px rgba(0,0,0,0.45)`
                      : `0 0 0 1px ${chartSel > 0.01 ? withAlpha(accent, chartSel) : "rgba(17,19,24,0.08)"}, 0 2px 4px rgba(17,19,24,0.04), 0 16px 36px -8px rgba(17,19,24,0.16)`,
                    opacity: clamp(chartIn * 1.5, 0, 1),
                    transformOrigin: "0% 0%",
                    transform: `scale(${0.96 + 0.04 * chartIn}) translateY(${(1 - chartIn) * 8}px)`,
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
                        left: hx * CHART.w - 4,
                        top: hy * CHART.h - 4,
                        width: 7,
                        height: 7,
                        background: pal.card,
                        boxShadow: `inset 0 0 0 1.5px ${accent}`,
                        opacity: chartSel,
                        zIndex: 1,
                      }}
                    />
                  ))}
                  <ChartCard
                    values={values}
                    labels={rows.map((r) => r.month.slice(0, 3))}
                    grow={grow}
                    pal={pal}
                    accent={accent}
                    title={chartTitle}
                    fmt={fmt}
                  />
                </div>
              )}
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  bottom: 0,
                  width: WIN.w,
                  height: TABS_H,
                  background: pal.chrome,
                  borderTop: `1px solid ${pal.line}`,
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  padding: "0 12px",
                  boxSizing: "border-box",
                  fontSize: 12.5,
                  color: pal.muted,
                }}
              >
                {(["plus", "list"] as const).map((ic) => (
                  <div
                    key={ic}
                    style={{
                      width: 28,
                      height: 28,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Icon d={ICONS[ic]} color={pal.muted} />
                  </div>
                ))}
                <div
                  style={{
                    padding: "6px 12px 6px 14px",
                    borderRadius: 6,
                    background: withAlpha(accent, pal.dark ? 0.2 : 0.1),
                    color: pal.dark ? "#fff" : accent,
                    fontWeight: 400,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  Signups
                  <Caret color={pal.dark ? "#fff" : accent} />
                </div>
                <div style={{ padding: "6px 14px" }}>Q3 cohort</div>
                <div style={{ flex: 1 }} />
                <div
                  style={{
                    padding: "5px 12px",
                    borderRadius: 6,
                    border: `1px solid ${pal.border}`,
                    color: pal.text,
                    opacity: clamp(selGrow * 1.4, 0, 1),
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  Average: {fmt(avg)}
                </div>
              </div>
            </div>
            <div style={{ opacity: cursorIn }}>
              <Cursor {...cur} press={press} cross={cross} />
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
}
