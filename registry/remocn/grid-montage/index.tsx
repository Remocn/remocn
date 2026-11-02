"use client";

import { loadFont } from "@remotion/google-fonts/InstrumentSans";
import { loadFont as loadSerif } from "@remotion/google-fonts/InstrumentSerif";
import { loadFont as loadManrope } from "@remotion/google-fonts/Manrope";
import type React from "react";
import { useId } from "react";
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

const { fontFamily: sans } = loadFont("normal", {
  weights: ["400"],
  subsets: ["latin"],
});
const display = sans;
const { fontFamily: serif } = loadSerif("italic", {
  weights: ["400"],
  subsets: ["latin"],
});
const manrope = loadManrope("normal", {
  weights: ["500", "600"],
  subsets: ["latin"],
});

const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

type Tone = "dark" | "graphite" | "light" | "accent";
type Kind =
  | "title"
  | "pane"
  | "number"
  | "statement"
  | "mark"
  | "clock"
  | "chart"
  | "word";
interface SceneSpec {
  kind: Kind;
  tone: Tone;
}
interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

function toRgb(color: string): [number, number, number] {
  if (color.startsWith("rgb")) {
    const [r, g, b] = color.match(/[\d.]+/g)?.map(Number) ?? [0, 0, 0];
    return [r, g, b];
  }
  const h = color.replace("#", "");
  const v =
    h.length === 3
      ? h
          .split("")
          .map((ch) => ch + ch)
          .join("")
      : h.slice(0, 6);
  const n = Number.parseInt(v, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function mix(a: string, b: string, t: number) {
  const x = toRgb(a);
  const y = toRgb(b);
  const c = x.map((v, i) => Math.round(v + (y[i] - v) * t));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}

function palette(tone: Tone, accent: string, lightStage: boolean) {
  if (tone === "light") {
    return {
      bg: "#F5F4F0",
      fg: "#121214",
      muted: "#6E6C67",
      hair: "rgba(18,18,20,0.10)",
      surface: "#FFFFFF",
      block: "#E6E3DC",
      light: "rgba(255,255,255,0.95)",
      shadow: "rgba(40,36,30,0.16)",
      dot: accent,
    };
  }
  if (tone === "accent") {
    return lightStage
      ? {
          bg: "transparent",
          fg: "#121214",
          muted: "rgba(18,18,20,0.6)",
          hair: "rgba(18,18,20,0.12)",
          surface: "rgba(255,255,255,0.6)",
          block: "rgba(18,18,20,0.08)",
          light: "rgba(255,255,255,0)",
          shadow: "rgba(26,42,158,0.2)",
          dot: accent,
        }
      : {
          bg: "transparent",
          fg: "#F7F7F5",
          muted: "rgba(247,247,245,0.7)",
          hair: "rgba(255,255,255,0.22)",
          surface: "rgba(10,10,11,0.4)",
          block: "rgba(255,255,255,0.16)",
          light: "rgba(255,255,255,0)",
          shadow: "rgba(0,0,0,0.35)",
          dot: accent,
        };
  }
  const graphite = tone === "graphite";
  return {
    bg: graphite ? "#17171A" : "#0A0A0B",
    fg: "#F3F2EF",
    muted: graphite ? "#97969C" : "#8B8A90",
    hair: "rgba(255,255,255,0.10)",
    surface: graphite ? "#1F1F23" : "#151517",
    block: graphite ? "#2B2B30" : "#232326",
    light: graphite ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.06)",
    shadow: "rgba(0,0,0,0.6)",
    dot: accent,
  };
}

type Colors = ReturnType<typeof palette>;
interface Ctx {
  W: number;
  H: number;
  u: number;
  c: Colors;
  accent: string;
  slot?: Rect;
}

const LIGHT_AT: Record<Kind, string> = {
  title: "18% 8%",
  pane: "50% -10%",
  number: "88% 12%",
  statement: "82% 100%",
  mark: "30% 15%",
  clock: "64% 50%",
  chart: "8% 0%",
  word: "22% 0%",
};

const REMOCN_R_PATH =
  "M 0.01 0.81 C 0.01 1.73, 0.36 2.79, 1.09 4.13 C 4.91 11.04, 13.45 17.16, 21.7 18.9 C 22.94 19.16, 23.18 19.16, 51.39 19.27 C 76.07 19.36, 80.02 19.4, 81.32 19.57 C 89.89 20.69, 96.2 24.68, 99.38 31.01 C 103.19 38.56, 102.53 50.1, 97.91 57.07 C 94.66 61.96, 89.68 64.99, 83.26 66 C 82.81 66.07, 70.18 66.83, 55.2 67.69 C 24.82 69.43, 27.03 69.23, 24.18 70.4 C 19.9 72.15, 14.84 75.7, 10.65 79.89 C 4.86 85.68, 1.3 91.91, 0.25 98.13 C 0.12 98.85, 0.08 103.13, 0.04 116.66 L 0 134.26 9.5 134.26 L 19 134.26 19.05 119.41 C 19.1 103.27, 19.08 103.82, 19.82 101.04 C 21.79 93.65, 27.86 88.75, 36.45 87.63 C 37.23 87.53, 39.41 87.5, 43.57 87.53 C 50.12 87.59, 50.75 87.65, 53.22 88.45 C 56.61 89.56, 59.67 91.86, 62.02 95.07 C 62.52 95.76, 69.35 103.85, 77.2 113.07 C 85.04 122.28, 91.63 130.04, 91.85 130.32 C 92.07 130.59, 92.5 131.34, 92.82 131.97 C 93.52 133.35, 94.11 133.93, 95.06 134.13 C 95.5 134.23, 98.97 134.26, 106.36 134.23 L 117.01 134.19 100.82 113.07 C 91.91 101.45, 84.52 91.78, 84.39 91.57 C 83.36 89.89, 83.66 87.53, 85.09 86 C 85.79 85.25, 86.36 84.94, 88.07 84.38 C 96.18 81.72, 104.15 76.62, 109.97 70.36 C 120.59 58.93, 124.06 44.32, 119.44 30.43 C 114.59 15.81, 101.93 4.02, 87.64 0.83 C 83.93 0.01, 88.09 0.08, 41.85 0.04 L 0.01 0 0.01 0.81 Z";

function RemocnR({ height, color }: { height: number; color: string }) {
  return (
    <svg
      viewBox="0 0 124.06 134.26"
      height={height}
      width={(height * 124.06) / 134.26}
      style={{ display: "block", flexShrink: 0 }}
      aria-hidden
    >
      <path fill={color} d={REMOCN_R_PATH} />
    </svg>
  );
}

function RemocnLogo({ fontSize, color }: { fontSize: number; color: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "baseline",
        color,
        fontFamily: manrope.fontFamily,
        fontWeight: 600,
        fontSize,
        letterSpacing: "-0.025em",
        lineHeight: 1,
        flexShrink: 0,
      }}
    >
      <svg
        viewBox="0 0 124.06 134.26"
        style={{ height: "0.76em", width: "auto" }}
        aria-hidden
      >
        <path fill="currentColor" d={REMOCN_R_PATH} />
      </svg>
      <span style={{ marginLeft: "0.04em" }}>emocn</span>
    </div>
  );
}

const abs = (r: Rect): React.CSSProperties => ({
  position: "absolute",
  left: r.x,
  top: r.y,
  width: r.w,
  height: r.h,
});

const displayType = (size: number): React.CSSProperties => ({
  fontFamily: display,
  fontWeight: 400,
  fontSize: size,
  letterSpacing: "-0.035em",
  lineHeight: 1,
  fontVariantNumeric: "tabular-nums",
});

function TitleBody({ x }: { x: Ctx }) {
  const { W, H, u, c, slot } = x;
  const left = slot ? 0.08 * W : 0;
  return (
    <div
      style={{
        position: "absolute",
        left,
        top: 0,
        height: H,
        width: slot ? slot.x - left - 0.03 * W : W,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: slot ? "flex-start" : "center",
        gap: 18 * u,
      }}
    >
      <div style={{ fontSize: 22 * u, fontWeight: 400, color: c.muted }}>
        Introducing
      </div>
      <RemocnLogo fontSize={132 * u} color={c.fg} />
      <div
        style={{
          fontSize: 24 * u,
          color: c.muted,
          letterSpacing: "-0.01em",
          textAlign: slot ? "left" : "center",
        }}
      >
        Motion for the films you launch with.
      </div>
    </div>
  );
}

function PaneBody({ x }: { x: Ctx }) {
  const { W, H, u, c, accent, slot } = x;
  const pane = { x: 0.08 * W, y: 0.1 * H, w: 0.84 * W, h: 0.8 * H };
  const canvas = slot ?? { x: 0.335 * W, y: 0.2 * H, w: 0.36 * W, h: 0.36 * H };
  const side = 0.27 * W;
  const insp = 0.765 * W;
  const bar = 0.075 * H;
  const lightPane = c.surface === "#FFFFFF";
  const tint = mix(accent, c.surface, lightPane ? 0.9 : 0.82);
  const rows = [
    "Hook",
    "Title card",
    "Feature tour",
    "Pricing",
    "Quote",
    "Logo",
  ];
  const fields = [
    ["Duration", "4.0s"],
    ["Easing", "Spring"],
    ["Scale", "1.04"],
    ["Opacity", "100%"],
    ["Blur", "0px"],
  ];
  const clipNames = ["Title", "Shot 02", "Logo"];
  const tracks = [
    [
      [0.3, 0.42],
      [0.43, 0.62],
    ],
    [[0.34, 0.56]],
    [
      [0.29, 0.38],
      [0.39, 0.52],
      [0.53, 0.74],
    ],
  ];
  return (
    <>
      <div
        style={{
          ...abs(pane),
          background: c.surface,
          borderRadius: 16 * u,
          boxShadow: `0 0 0 1px ${c.hair}, 0 ${30 * u}px ${70 * u}px ${c.shadow}`,
          overflow: "hidden",
        }}
      />
      <div
        style={{
          ...abs({ x: pane.x, y: pane.y + bar, w: pane.w, h: 1 }),
          background: c.hair,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: pane.x + 22 * u,
          top: pane.y,
          height: bar,
          display: "flex",
          alignItems: "center",
          gap: 9 * u,
        }}
      >
        <RemocnLogo fontSize={18 * u} color={c.fg} />
        <div style={{ fontSize: 15 * u, color: c.muted, marginLeft: 6 * u }}>
          / Launch film
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          right: W - pane.x - pane.w + 18 * u,
          top: pane.y + bar / 2 - 15 * u,
          height: 30 * u,
          padding: `0 ${14 * u}px`,
          borderRadius: 8 * u,
          background: accent,
          color: "#FFFFFF",
          fontSize: 14 * u,
          fontWeight: 400,
          display: "flex",
          alignItems: "center",
        }}
      >
        Render
      </div>
      <div
        style={{
          ...abs({ x: side, y: pane.y + bar, w: 1, h: pane.h - bar }),
          background: c.hair,
        }}
      />
      <div
        style={{
          ...abs({ x: insp, y: pane.y + bar, w: 1, h: pane.h - bar }),
          background: c.hair,
        }}
      />
      {rows.map((label, i) => {
        const y = pane.y + bar + 26 * u + i * 0.062 * H;
        const on = i === 1;
        return (
          <div key={label}>
            {on ? (
              <div
                style={{
                  ...abs({
                    x: pane.x + 12 * u,
                    y: y - 9 * u,
                    w: side - pane.x - 24 * u,
                    h: 34 * u,
                  }),
                  background: tint,
                  borderRadius: 8 * u,
                }}
              />
            ) : null}
            <div
              style={{
                ...abs({ x: pane.x + 24 * u, y, w: 14 * u, h: 14 * u }),
                borderRadius: 4 * u,
                boxShadow: `inset 0 0 0 ${1.5 * u}px ${on ? accent : c.muted}`,
                opacity: on ? 1 : 0.6,
              }}
            />
            <div
              style={{
                position: "absolute",
                left: pane.x + 48 * u,
                top: y - 3 * u,
                fontSize: 17 * u,
                lineHeight: 1.2,
                color: on ? c.fg : c.muted,
                whiteSpace: "nowrap",
              }}
            >
              {label}
            </div>
          </div>
        );
      })}
      {fields.map(([k, v], i) => {
        const y = pane.y + bar + 24 * u + i * 0.075 * H;
        return (
          <div key={k}>
            <div
              style={{
                position: "absolute",
                left: insp + 20 * u,
                top: y - 4 * u,
                fontSize: 14 * u,
                color: c.muted,
              }}
            >
              {k}
            </div>
            <div
              style={{
                ...abs({
                  x: insp + 20 * u,
                  y: y + 16 * u,
                  w: 0.155 * W - 40 * u,
                  h: 26 * u,
                }),
                borderRadius: 6 * u,
                boxShadow: `inset 0 0 0 1px ${c.hair}`,
                display: "flex",
                alignItems: "center",
                paddingLeft: 9 * u,
                fontSize: 15 * u,
                color: c.fg,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {v}
            </div>
          </div>
        );
      })}
      <div
        style={{
          ...abs({
            x: side,
            y: canvas.y + canvas.h + 0.07 * H,
            w: insp - side,
            h: 1,
          }),
          background: c.hair,
        }}
      />
      {tracks.map((clips, ti) =>
        clips.map(([a, b], ci) => (
          <div
            key={`${ti}-${a}`}
            style={{
              ...abs({
                x: a * W,
                y: canvas.y + canvas.h + 0.1 * H + ti * 0.058 * H,
                w: (b - a) * W - 4 * u,
                h: 0.042 * H,
              }),
              borderRadius: 6 * u,
              background: ti === 1 ? accent : c.block,
              display: "flex",
              alignItems: "center",
              paddingLeft: 8 * u,
              fontSize: 13 * u,
              color: ti === 1 ? "#FFFFFF" : c.muted,
              whiteSpace: "nowrap",
              overflow: "hidden",
            }}
          >
            {clipNames[(ti + ci) % clipNames.length]}
          </div>
        )),
      )}
      <div
        style={{
          ...abs({
            x: 0.47 * W,
            y: canvas.y + canvas.h + 0.085 * H,
            w: 2 * u,
            h: 0.2 * H,
          }),
          background: c.fg,
          borderRadius: u,
        }}
      />
      {slot ? null : (
        <div
          style={{
            ...abs(canvas),
            borderRadius: 10 * u,
            background: lightPane ? "#0A0A0B" : "#F5F4F0",
            boxShadow: `inset 0 0 0 1px ${c.hair}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: `radial-gradient(ellipse 80% 90% at 30% 0%, ${lightPane ? "rgba(255,255,255,0.09)" : "rgba(255,255,255,0.9)"}, transparent 70%)`,
            }}
          />
          <RemocnR height={58 * u} color={lightPane ? "#F3F2EF" : "#121214"} />
        </div>
      )}
    </>
  );
}

function NumberBody({ x }: { x: Ctx }) {
  const { W, H, u, c, accent, slot } = x;
  const left = 0.08 * W;
  return (
    <>
      <div
        style={{
          position: "absolute",
          left,
          top: 0.16 * H,
          display: "flex",
          alignItems: "center",
          gap: 10 * u,
          fontSize: 19 * u,
          fontWeight: 400,
          color: c.muted,
        }}
      >
        <div
          style={{
            width: 9 * u,
            height: 9 * u,
            borderRadius: 9 * u,
            background: c.dot,
          }}
        />
        Median render time
      </div>
      <div
        style={{
          position: "absolute",
          left: left - 10 * u,
          top: 0.27 * H,
          ...displayType(250 * u),
          letterSpacing: "-0.05em",
        }}
      >
        4.8×
      </div>
      <div
        style={{
          position: "absolute",
          left,
          top: 0.27 * H + 268 * u,
          width: slot ? slot.x - left - 0.04 * W : 0.4 * W,
          fontSize: 28 * u,
          lineHeight: 1.25,
          color: c.muted,
          letterSpacing: "-0.015em",
          textWrap: "balance",
        }}
      >
        faster from script to final cut
      </div>
      {slot
        ? null
        : [
            { label: "Before", w: 1, color: c.block },
            { label: "With remocn", w: 1 / 4.8, color: accent },
          ].map((row, i) => (
            <div
              key={row.label}
              style={{
                position: "absolute",
                left: 0.58 * W,
                top: 0.4 * H + i * 0.13 * H,
              }}
            >
              <div
                style={{
                  fontSize: 18 * u,
                  color: c.muted,
                  marginBottom: 12 * u,
                }}
              >
                {row.label}
              </div>
              <div
                style={{
                  width: 0.32 * W * row.w,
                  height: 20 * u,
                  borderRadius: 10 * u,
                  background: row.color,
                  boxShadow:
                    row.color === accent
                      ? undefined
                      : `inset 0 0 0 1px ${c.hair}`,
                }}
              />
            </div>
          ))}
    </>
  );
}

function StatementBody({ x }: { x: Ctx }) {
  const { W, H, u, c } = x;
  return (
    <>
      <div
        style={{
          position: "absolute",
          left: 0.08 * W,
          top: 0.1 * H,
          display: "flex",
          alignItems: "center",
          gap: 10 * u,
        }}
      >
        <RemocnLogo fontSize={30 * u} color={c.fg} />
      </div>
      <div
        style={{
          position: "absolute",
          left: 0.08 * W - 6 * u,
          bottom: 0.13 * H,
          ...displayType(140 * u),
          lineHeight: 0.94,
        }}
      >
        <div>Own every</div>
        <div>
          <span
            style={{
              fontFamily: serif,
              fontStyle: "italic",
              fontWeight: 400,
              letterSpacing: "-0.02em",
            }}
          >
            frame
          </span>
          <span style={{ color: c.dot }}>.</span>
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          right: 0.08 * W,
          bottom: 0.14 * H,
          fontSize: 20 * u,
          color: c.muted,
        }}
      >
        remocn.dev
      </div>
    </>
  );
}

function MarkBody({ x }: { x: Ctx }) {
  const { u, c } = x;
  return (
    <AbsoluteFill
      style={{
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: 26 * u,
      }}
    >
      <RemocnLogo fontSize={170 * u} color={c.fg} />
    </AbsoluteFill>
  );
}

function ClockBody({ x }: { x: Ctx }) {
  const { W, H, u, c, accent } = x;
  const left = 0.08 * W;
  const right = 0.92 * W;
  const base = 0.74 * H;
  const head = 12.07 / 30;
  const marks = [0, 5, 10, 15, 20, 25, 30];
  const clips = [
    { a: 0, b: 4.2, label: "Hook" },
    { a: 4.4, b: 13.6, label: "Feature tour" },
    { a: 13.8, b: 22.4, label: "Pricing" },
    { a: 22.6, b: 30, label: "Logo" },
  ];
  const span = right - left;
  return (
    <>
      <div style={{ position: "absolute", left, top: 0.16 * H }}>
        <div style={{ fontSize: 22 * u, color: c.muted }}>Playhead</div>
        <div style={{ ...displayType(150 * u), marginTop: 14 * u }}>
          00:12:04
        </div>
        <div
          style={{
            fontSize: 22 * u,
            color: c.muted,
            marginTop: 14 * u,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          Frame 362 of 900
        </div>
      </div>
      {marks.map((m) => (
        <div
          key={m}
          style={{
            position: "absolute",
            left: left + (m / 30) * span,
            top: base - 34 * u,
            fontSize: 17 * u,
            color: c.muted,
            fontVariantNumeric: "tabular-nums",
            transform: m === 0 ? undefined : "translateX(-50%)",
          }}
        >
          {m}s
        </div>
      ))}
      <div
        style={{
          ...abs({ x: left, y: base - 8 * u, w: span, h: 1 }),
          background: c.hair,
        }}
      />
      {clips.map((cl, i) => (
        <div
          key={cl.label}
          style={{
            ...abs({
              x: left + (cl.a / 30) * span,
              y: base + 6 * u,
              w: ((cl.b - cl.a) / 30) * span,
              h: 52 * u,
            }),
            borderRadius: 8 * u,
            background: i === 1 ? mix(accent, c.bg, 0.25) : c.block,
            boxShadow: `inset 0 0 0 1px ${c.hair}`,
            display: "flex",
            alignItems: "center",
            paddingLeft: 14 * u,
            fontSize: 18 * u,
            color: i === 1 ? "#FFFFFF" : c.fg,
            whiteSpace: "nowrap",
            overflow: "hidden",
          }}
        >
          {cl.label}
        </div>
      ))}
      <div
        style={{
          ...abs({
            x: left + head * span - 1 * u,
            y: base - 14 * u,
            w: 2 * u,
            h: 82 * u,
          }),
          background: c.fg,
          borderRadius: u,
        }}
      />
    </>
  );
}

function ChartBody({ x }: { x: Ctx }) {
  const { W, H, u, c, accent } = x;
  const heights = [0.14, 0.19, 0.17, 0.26, 0.31, 0.38, 0.52];
  const base = 0.84 * H;
  const bw = 0.046 * W;
  const gap = 0.018 * W;
  const x0 = 0.92 * W - heights.length * (bw + gap) + gap;
  return (
    <>
      <div style={{ position: "absolute", left: 0.08 * W, top: 0.14 * H }}>
        <div style={{ fontSize: 20 * u, color: c.muted, fontWeight: 400 }}>
          Videos shipped per week
        </div>
        <div style={{ ...displayType(110 * u), marginTop: 22 * u }}>+212%</div>
      </div>
      <div
        style={{
          ...abs({ x: 0.08 * W, y: base, w: 0.84 * W, h: 1 }),
          background: c.hair,
        }}
      />
      {heights.map((h, i) => (
        <div
          key={h}
          style={{
            ...abs({
              x: x0 + i * (bw + gap),
              y: base - h * H,
              w: bw,
              h: h * H,
            }),
            borderRadius: `${8 * u}px ${8 * u}px ${2 * u}px ${2 * u}px`,
            background: i === heights.length - 1 ? accent : c.block,
          }}
        />
      ))}
    </>
  );
}

function WordBody({ x }: { x: Ctx }) {
  const { W, H, u, c } = x;
  return (
    <>
      <div
        style={{
          ...abs({ x: 0.08 * W, y: 0.2 * H, w: 0.84 * W, h: 1 }),
          background: c.hair,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 0.08 * W,
          right: 0.08 * W,
          top: 0.2 * H - 40 * u,
          display: "flex",
          justifyContent: "space-between",
          fontSize: 19 * u,
          color: c.muted,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        <span>02</span>
        <span>Chapter</span>
      </div>
      <div
        style={{
          position: "absolute",
          left: 0.08 * W - 12 * u,
          bottom: 0.1 * H,
          ...displayType(250 * u),
          letterSpacing: "-0.055em",
        }}
      >
        Render<span style={{ color: c.dot }}>.</span>
      </div>
    </>
  );
}

const BODIES: Record<Kind, (p: { x: Ctx }) => React.ReactElement> = {
  title: TitleBody,
  pane: PaneBody,
  number: NumberBody,
  statement: StatementBody,
  mark: MarkBody,
  clock: ClockBody,
  chart: ChartBody,
  word: WordBody,
};

function PlaceholderScene({
  kind,
  tone,
  accent,
  slot,
  lightStage,
}: SceneSpec & { accent: string; slot?: Rect; lightStage: boolean }) {
  const { width: W, height: H } = useVideoConfig();
  const u = Math.min(H / 720, W / 1280);
  const c = palette(tone, accent, lightStage);
  const Body = BODIES[kind];
  const open = tone === "accent";
  return (
    <AbsoluteFill
      style={{
        background: c.bg,
        color: c.fg,
        fontFamily: sans,
        overflow: "hidden",
      }}
    >
      {open ? null : (
        <AbsoluteFill
          style={{
            background: `radial-gradient(ellipse 75% 85% at ${LIGHT_AT[kind]}, ${c.light}, transparent 72%)`,
          }}
        />
      )}
      <Body x={{ W, H, u, c, accent, slot }} />
    </AbsoluteFill>
  );
}

function ImageScene({ src }: { src: string }) {
  return (
    <AbsoluteFill style={{ background: "#0A0A0B" }}>
      <Img
        src={src}
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
    </AbsoluteFill>
  );
}

function Grain({ opacity }: { opacity: number }) {
  const id = `g${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  return (
    <svg
      width="100%"
      height="100%"
      style={{
        position: "absolute",
        inset: 0,
        opacity,
        pointerEvents: "none",
      }}
      aria-hidden
    >
      <filter id={id}>
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.9"
          numOctaves={2}
          seed={7}
          stitchTiles="stitch"
        />
        <feColorMatrix values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0.9 0" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#${id})`} />
    </svg>
  );
}

export interface GridMontageProps {
  scenes?: React.ReactNode[];
  images?: string[];
  beat?: number;
  accent?: string;
  ground?: GshPresetId;
  groundParams?: Partial<GradientParams>;
  speed?: number;
  theme?: "dark" | "light";
}

const DARK_LIST: SceneSpec[] = [
  { kind: "mark", tone: "accent" },
  { kind: "pane", tone: "light" },
  { kind: "number", tone: "graphite" },
  { kind: "clock", tone: "graphite" },
  { kind: "chart", tone: "light" },
  { kind: "mark", tone: "accent" },
  { kind: "word", tone: "light" },
  { kind: "title", tone: "graphite" },
  { kind: "pane", tone: "graphite" },
  { kind: "number", tone: "light" },
  { kind: "statement", tone: "light" },
];
const flipTone = (t: Tone): Tone =>
  t === "light" ? "graphite" : t === "graphite" ? "light" : t;
const LIGHT_LIST: SceneSpec[] = DARK_LIST.map((s) => ({
  ...s,
  tone: flipTone(s.tone),
}));

const EASE_SNAP = Easing.bezier(0.22, 1, 0.36, 1);
const CARD = { mass: 0.8, damping: 18, stiffness: 160 };
const MORPH_SPRING = { damping: 200 };
const EASE_SWAP = Easing.bezier(0.83, 0, 0.17, 1);
const SWAP = 8;
const MERGE = 12;

const CORNERS = [
  [0, 0],
  [0, 2],
  [2, 0],
  [2, 2],
];
const FOCI = [
  [-10, -6],
  [8, -10],
  [-6, 8],
  [10, 6],
  [0, -12],
  [-12, 0],
  [0, 0],
  [12, 0],
  [0, 12],
];

function grid(
  cols: number,
  rows: number,
  W: number,
  H: number,
  m: number,
  g: number,
) {
  const cw = (W - 2 * m - (cols - 1) * g) / cols;
  const ch = (H - 2 * m - (rows - 1) * g) / rows;
  const out: Rect[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      out.push({ x: m + c * (cw + g), y: m + r * (ch + g), w: cw, h: ch });
    }
  }
  return out;
}

const lerpRect = (a: Rect, b: Rect, t: number): Rect => ({
  x: a.x + (b.x - a.x) * t,
  y: a.y + (b.y - a.y) * t,
  w: a.w + (b.w - a.w) * t,
  h: a.h + (b.h - a.h) * t,
});

type Fill =
  | { type: "own"; shot: number; push: number; focus: number[]; nominal: Rect }
  | { type: "piece"; shot: number; push: number; source: Rect };

export function GridMontage({
  scenes,
  images,
  beat = 14,
  accent = "#3B5BFD",
  ground,
  groundParams,
  speed = 1,
  theme = "dark",
}: GridMontageProps) {
  const frame = useCurrentFrame() * speed;
  const { width: W, height: H, fps } = useVideoConfig();
  const u = H / 720;
  const b = Math.max(8, beat);
  const lightStage = theme === "light";
  const specs = theme === "light" ? LIGHT_LIST : DARK_LIST;
  const stage = theme === "light" ? "#F5F4F0" : "#0A0A0B";
  const hairline =
    theme === "light" ? "rgba(18,18,20,0.10)" : "rgba(255,255,255,0.10)";
  const panelShadow = (e: number) =>
    lightStage
      ? `0 ${2 * u}px ${4 * u}px rgba(26,42,158,${0.06 * e}), 0 ${18 * u}px ${40 * u}px -${14 * u}px rgba(26,42,158,${0.22 * e})`
      : `0 ${2 * u}px ${6 * u}px rgba(0,0,0,${0.3 * e}), 0 ${20 * u}px ${44 * u}px -${14 * u}px rgba(0,0,0,${0.6 * e})`;

  const M = 0.042 * H;
  const G = 0.022 * H;
  const R = 14 * u;

  const tOpen = 2 * b;
  const tSwap1 = 3 * b;
  const tGrow = 5 * b;
  const tSwap2 = 7 * b;
  const tMerge = 9 * b;
  const p = (start: number, dur: number) =>
    interpolate(frame, [start, start + dur], [0, 1], CLAMP);

  const beats = (since: number) => {
    let s = 0;
    for (let k = 0; k < 12; k++) {
      s += EASE_SNAP(interpolate(since - k * b, [0, 7], [0, 1], CLAMP));
    }
    return s;
  };
  const ownPush = (start: number) => 1.02 + 0.012 * beats(frame - start);
  const openerPush = 1 + 0.03 * (frame / Math.max(1, tGrow));
  const closerPush =
    1 +
    0.035 *
      Easing.bezier(0.22, 1, 0.36, 1)(p(tSwap2, tMerge + MERGE + 40 - tSwap2));

  const list = scenes ?? images;
  const pickShot = (slot: number) => {
    if (!list?.length) return slot;
    const len = list.length;
    if (slot === 0) return 0;
    if (slot === 10) return len - 1;
    if (len <= 2) return slot % len;
    return 1 + ((slot - 1) % (len - 2));
  };
  const shot = (slot: number) => {
    const i = pickShot(slot);
    if (scenes) return <AbsoluteFill>{scenes[i]}</AbsoluteFill>;
    if (images) return <ImageScene src={images[i]} />;
    return (
      <PlaceholderScene {...specs[i]} accent={accent} lightStage={lightStage} />
    );
  };

  const content = (fill: Fill, tile: Rect) => {
    if (fill.type === "piece") {
      const q = fill.source;
      const sc = Math.max(tile.w / q.w, tile.h / q.h);
      return (
        <div
          style={{
            position: "absolute",
            width: W,
            height: H,
            transformOrigin: "0 0",
            transform: `translate(${tile.w / 2}px, ${tile.h / 2}px) scale(${sc}) translate(${-(q.x + q.w / 2)}px, ${-(q.y + q.h / 2)}px)`,
          }}
        >
          <AbsoluteFill style={{ transform: `scale(${fill.push})` }}>
            {shot(fill.shot)}
          </AbsoluteFill>
        </div>
      );
    }
    const sc = Math.max(fill.nominal.w / W, fill.nominal.h / H);
    return (
      <div
        style={{
          position: "absolute",
          width: W,
          height: H,
          transformOrigin: "0 0",
          transform: `translate(${tile.w / 2}px, ${tile.h / 2}px) scale(${sc}) translate(${-W / 2}px, ${-H / 2}px)`,
        }}
      >
        <AbsoluteFill
          style={{
            transform: `scale(${fill.push})`,
            transformOrigin: `${50 + fill.focus[0]}% ${50 + fill.focus[1]}%`,
          }}
        >
          {shot(fill.shot)}
        </AbsoluteFill>
      </div>
    );
  };

  const panel = (
    key: string,
    rect: Rect,
    radius: number,
    edge: number,
    from: Fill,
    to: Fill,
    swap: number,
  ) => (
    <div
      key={key}
      style={{
        position: "absolute",
        left: rect.x,
        top: rect.y,
        width: rect.w,
        height: rect.h,
        borderRadius: Math.min(radius, rect.w / 2, rect.h / 2),
        overflow: "hidden",
        boxShadow: edge > 0.01 ? panelShadow(edge) : undefined,
      }}
    >
      {swap < 1 ? (
        <AbsoluteFill
          style={{ transform: `translateY(${-0.4 * rect.h * swap}px)` }}
        >
          {content(from, rect)}
          <AbsoluteFill
            style={{ background: "#0A0A0B", opacity: 0.22 * swap }}
          />
        </AbsoluteFill>
      ) : null}
      {swap > 0 ? (
        <AbsoluteFill
          style={{
            transform: `translateY(${rect.h * (1 - swap)}px)`,
            boxShadow:
              swap < 1
                ? `0 ${-10 * u}px ${30 * u}px rgba(0,0,0,${0.3 * (1 - swap)})`
                : undefined,
          }}
        >
          {content(to, rect)}
        </AbsoluteFill>
      ) : null}
      <AbsoluteFill
        style={{
          borderRadius: Math.min(radius, rect.w / 2, rect.h / 2),
          boxShadow: `inset 0 0 0 1px ${hairline}`,
          opacity: edge,
        }}
      />
    </div>
  );

  let body: React.ReactNode;
  if (frame < tOpen) {
    body = (
      <AbsoluteFill style={{ transform: `scale(${openerPush})` }}>
        {shot(0)}
      </AbsoluteFill>
    );
  } else if (frame < tGrow) {
    const q = spring({ frame: frame - tOpen, fps, config: CARD });
    const rects = grid(2, 2, W, H, M * q, G * q);
    const quads = grid(2, 2, W, H, 0, 0);
    body = rects.map((rect, i) =>
      panel(
        `a${i}`,
        rect,
        R * q,
        q,
        { type: "piece", shot: 0, push: openerPush, source: quads[i] },
        {
          type: "own",
          shot: 1 + i,
          push: ownPush(tSwap1),
          focus: FOCI[i],
          nominal: rect,
        },
        EASE_SWAP(p(tSwap1 + i * 2, SWAP)),
      ),
    );
  } else {
    const qg = spring({ frame: frame - tGrow, fps, config: CARD });
    const qm =
      frame >= tMerge + MERGE
        ? 1
        : Math.min(
            1,
            spring({
              frame: frame - tMerge,
              fps,
              config: MORPH_SPRING,
              durationInFrames: MERGE,
            }),
          );
    const m = M * (1 - qm);
    const g = G * (1 - qm);
    const cells = grid(3, 3, W, H, m, g);
    const full3 = grid(3, 3, W, H, M, G);
    const thirds = grid(3, 3, W, H, 0, 0);
    const two = grid(2, 2, W, H, M, G);
    const span = (k: number, axis: "x" | "y") => {
      const a = axis === "x" ? two[k] : two[k * 2];
      return axis === "x" ? [a.x, a.x + a.w] : [a.y, a.y + a.h];
    };
    const seed = (r: number, c: number): Rect => {
      const xs = c === 1 ? [W / 2, W / 2] : span(c === 0 ? 0 : 1, "x");
      const ys = r === 1 ? [H / 2, H / 2] : span(r === 0 ? 0 : 1, "y");
      return { x: xs[0], y: ys[0], w: xs[1] - xs[0], h: ys[1] - ys[0] };
    };
    let fresh = 0;
    const panels: React.ReactNode[] = [];
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        const idx = r * 3 + c;
        const corner = CORNERS.findIndex(([cr, cc]) => cr === r && cc === c);
        const isCorner = corner >= 0;
        const rect = isCorner
          ? lerpRect(two[corner], cells[idx], qg)
          : lerpRect(seed(r, c), cells[idx], qg);
        const ownShot = isCorner ? 1 + corner : 5 + fresh++;
        const own: Fill = {
          type: "own",
          shot: ownShot,
          push: ownPush(isCorner ? tSwap1 : tGrow),
          focus: FOCI[isCorner ? corner : 4 + fresh - 1],
          nominal: isCorner ? rect : full3[idx],
        };
        if (rect.w < 0.5 || rect.h < 0.5) continue;
        panels.push(
          panel(
            `b${idx}`,
            rect,
            R * (1 - qm),
            1 - qm,
            own,
            {
              type: "piece",
              shot: 10,
              push: closerPush,
              source: thirds[idx],
            },
            EASE_SWAP(p(tSwap2 + (r + c) * 2, SWAP)),
          ),
        );
      }
    }
    body =
      qm >= 1 ? (
        <AbsoluteFill style={{ transform: `scale(${closerPush})` }}>
          {shot(10)}
        </AbsoluteFill>
      ) : (
        <>
          {qm > 0.9 ? (
            <AbsoluteFill style={{ transform: `scale(${closerPush})` }}>
              {shot(10)}
            </AbsoluteFill>
          ) : null}
          {panels}
        </>
      );
  }

  return (
    <AbsoluteFill style={{ background: stage, overflow: "hidden" }}>
      <GshGround
        preset={ground ?? (lightStage ? "glasswork" : "velvet-hour")}
        params={groundParams}
        timeOffset={4}
        timeScale={0.5}
      />
      {body}
      <Grain opacity={theme === "light" ? 0.04 : 0.055} />
    </AbsoluteFill>
  );
}
