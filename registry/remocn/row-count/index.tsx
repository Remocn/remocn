"use client";

import { loadFont as loadPlexSans } from "@remotion/google-fonts/IBMPlexSans";
import { useMemo } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const plex = loadPlexSans("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});

export interface RowCountProps {
  value?: number;
  from?: number;
  prefix?: string;
  label?: string;
  accent?: string;
  background?: string;
  speed?: number;
  theme?: "dark" | "light";
}

const THEMES = {
  dark: {
    bg: "#0F1B2D",
    ink: "#F3F5F8",
    muted: "#93A1B5",
    comma: "#4D5D75",
    rule: "rgba(243, 245, 248, 0.22)",
    accent: "#FF9900",
  },
  light: {
    bg: "#FFFFFF",
    ink: "#0F1B2D",
    muted: "#5A677A",
    comma: "#B5BDC9",
    rule: "rgba(15, 27, 45, 0.2)",
    accent: "#C76A00",
  },
} as const;

const FIG = 0.6;
const COMMA = 0.26;
const ROW = 1.0;
const TRACK = -0.02;

const COUNT_AT = 6;
const COUNT_LEN = 78;

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_COUNT = Easing.bezier(0.3, 0.1, 0.2, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

function groups(n: number): string[] {
  const s = String(Math.max(0, Math.floor(n)));
  const out: string[] = [];
  for (let end = s.length; end > 0; end -= 3) {
    out.unshift(s.slice(Math.max(0, end - 3), end));
  }
  return out;
}

export function RowCount({
  value = 27300000,
  from = 1,
  prefix = "",
  label = "frames rendered in every region, every night",
  accent,
  background,
  speed = 1,
  theme = "dark",
}: RowCountProps) {
  const t = useCurrentFrame() * speed;
  const { width: W, height: H, fps } = useVideoConfig();
  const c = THEMES[theme];
  const transparent = background === "transparent";
  const stage = transparent ? "transparent" : (background ?? c.bg);

  const target = Math.max(1, Math.floor(value));
  const start = Math.min(target, Math.max(1, Math.floor(from)));
  const finalRows = groups(target).length;

  const p = interpolate(t, [COUNT_AT, COUNT_AT + COUNT_LEN], [0, 1], {
    ...CLAMP,
    easing: EASE_COUNT,
  });
  const live =
    p >= 1
      ? target
      : Math.floor(start * (target / start) ** Math.min(1, Math.max(0, p)));
  const g = groups(live);
  const rows = g.length;

  const rowBorn = useMemo(() => {
    const born: number[] = [];
    for (let k = 0; k < finalRows; k++) {
      const thresh = 1000 ** k;
      if (thresh <= start) {
        born.push(-100);
        continue;
      }
      let lo = COUNT_AT;
      let hi = COUNT_AT + COUNT_LEN;
      for (let i = 0; i < 24; i++) {
        const mid = (lo + hi) / 2;
        const pm = interpolate(mid, [COUNT_AT, COUNT_AT + COUNT_LEN], [0, 1], {
          ...CLAMP,
          easing: EASE_COUNT,
        });
        const v = start * (target / start) ** pm;
        if (v >= thresh) hi = mid;
        else lo = mid;
      }
      born.push(hi);
    }
    return born;
  }, [finalRows, start, target]);

  const shift = (k: number) => {
    let s = 0;
    for (let j = k + 1; j < finalRows; j++) {
      s += spring({
        frame: t - rowBorn[j] + 4,
        fps,
        config: { damping: 16, stiffness: 140, mass: 0.8 },
      });
    }
    return s;
  };
  let rowsAnim = 1;
  for (let k = 1; k < finalRows; k++) {
    rowsAnim += spring({
      frame: t - rowBorn[k] + 4,
      fps,
      config: { damping: 16, stiffness: 140, mass: 0.8 },
    });
  }

  const portrait = H > W * 1.1;
  const margin = Math.min(W, H) * 0.09;
  const prefixW = prefix ? Array.from(prefix).length * FIG : 0;
  const colW = prefixW + 3 * FIG + 2 * TRACK;
  const labelSize = label
    ? portrait
      ? Math.min(W * 0.06, H * 0.034)
      : Math.min(H * 0.042, W * 0.026)
    : 0;
  const labelW = portrait ? W - margin * 2 : W * 0.34;
  const labelBlock = portrait && label ? labelSize * 1.3 * 3 + margin * 0.6 : 0;
  const ruleY = margin;
  const avail = H - margin * 2 - labelBlock - margin * 0.3;
  const F = Math.min(
    avail / (Math.max(2, finalRows) * ROW),
    (W * (portrait ? 0.74 : 0.5)) / (colW + COMMA),
    H * 0.3,
  );
  const rowH = F * ROW;
  const colRight = W - margin - COMMA * F;
  const firstTop = ruleY + labelBlock + margin * 0.3;

  const ruleP = interpolate(t, [0, 16], [0, 1], { ...CLAMP, easing: EASE_OUT });
  const enter = interpolate(t, [0, 14], [0, 1], { ...CLAMP, easing: EASE_OUT });
  const labelP = interpolate(t, [6, 24], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });

  const rowEls = g.map((grp, idx) => {
    const k = rows - 1 - idx;
    const born = interpolate(t, [rowBorn[k], rowBorn[k] + 10], [0, 1], {
      ...CLAMP,
      easing: EASE_OUT,
    });
    const isNew = k === 0 ? enter : born;
    const y = firstTop + shift(k) * rowH;
    const topness = Math.max(0, 1 - Math.abs(rowsAnim - 1 - k));
    const text = (k === rows - 1 ? prefix : "") + grp;
    const comma = k > 0;
    return (
      <div key={`r${k}`}>
        <div
          style={{
            position: "absolute",
            left: 0,
            width: W,
            top: y,
            height: rowH,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              right: W - colRight,
              top: (isNew - 1) * rowH,
              height: rowH,
              display: "flex",
              alignItems: "baseline",
              fontFamily: plex.fontFamily,
              fontWeight: 500,
              fontSize: F,
              lineHeight: `${rowH}px`,
              letterSpacing: `${TRACK}em`,
              fontFeatureSettings: '"tnum" 1, "lnum" 1',
              whiteSpace: "pre",
            }}
          >
            <span style={{ position: "relative", color: c.ink }}>
              {text}
              <span
                aria-hidden
                style={{
                  position: "absolute",
                  inset: 0,
                  opacity: topness,
                  color: accent ?? c.accent,
                }}
              >
                {text}
              </span>
            </span>
            {comma ? (
              <span
                style={{
                  position: "absolute",
                  left: "100%",
                  color: c.comma,
                  letterSpacing: 0,
                }}
              >
                ,
              </span>
            ) : null}
          </div>
        </div>
        <div
          style={{
            position: "absolute",
            left: margin + (W - margin * 2) * (1 - isNew),
            right: margin,
            top: y + rowH,
            height: 1,
            background: c.rule,
          }}
        />
      </div>
    );
  });

  const labelEl = label ? (
    <div
      style={{
        position: "absolute",
        left: margin,
        width: labelW,
        top: ruleY + labelSize * 0.9,
        height: labelSize * 1.3 * 3,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          fontFamily: plex.fontFamily,
          fontWeight: 400,
          fontSize: labelSize,
          lineHeight: 1.3,
          letterSpacing: "-0.005em",
          color: c.muted,
          textWrap: "balance",
          transform: `translateY(${((1 - labelP) * labelSize * 4).toFixed(2)}px)`,
        }}
      >
        {label}
      </div>
    </div>
  ) : null;

  return (
    <AbsoluteFill style={{ background: stage, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          left: margin,
          top: ruleY,
          width: (W - margin * 2) * ruleP,
          height: Math.max(2, H * 0.003),
          background: c.ink,
        }}
      />
      {rowEls}
      {labelEl}
    </AbsoluteFill>
  );
}
