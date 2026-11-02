"use client";

import { loadFont as loadJakarta } from "@remotion/google-fonts/PlusJakartaSans";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  AbsoluteFill,
  continueRender,
  delayRender,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const WEIGHTS = ["200", "300", "400", "500"] as const;
const jakarta = loadJakarta("normal", {
  weights: [...WEIGHTS],
  subsets: ["latin"],
});

export interface GearShiftProps {
  value?: number;
  from?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  label?: string;
  gears?: number;
  accent?: string;
  background?: string;
  speed?: number;
  theme?: "dark" | "light";
}

const THEMES = {
  dark: {
    bg: "#0B1F33",
    ink: "#E8EEF2",
    panelInk: "#0B1F33",
    teal: "#00BFA5",
  },
  light: {
    bg: "#E8EEF2",
    ink: "#0B1F33",
    panelInk: "#0B1F33",
    teal: "#00BFA5",
  },
} as const;

const TRACK = -0.03;
const FONT_PX = 200;
const START = 6;
const SHIFT = 4;

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

function format(v: number, decimals: number) {
  return v.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

interface Metrics {
  width: number;
  figTop: number;
  asc: number;
  desc: number;
}

function measure(text: string): Metrics {
  const probe = document.createElement("span");
  Object.assign(probe.style, {
    position: "absolute",
    left: "-99999px",
    top: "0",
    visibility: "hidden",
    whiteSpace: "pre",
    fontFamily: `"${jakarta.fontFamily}"`,
    fontWeight: "500",
    fontSize: `${FONT_PX}px`,
    lineHeight: "1",
    fontVariantNumeric: "tabular-nums",
    letterSpacing: `${TRACK}em`,
  });
  probe.textContent = text;
  document.body.appendChild(probe);
  const width = probe.getBoundingClientRect().width / FONT_PX - TRACK;
  probe.remove();
  const ctx = document.createElement("canvas").getContext("2d");
  if (!ctx) throw new Error("gear-shift: no 2d context");
  ctx.font = `500 ${FONT_PX}px "${jakarta.fontFamily}"`;
  const fm = ctx.measureText(text);
  return {
    width,
    figTop: ctx.measureText("0").actualBoundingBoxAscent / FONT_PX,
    asc: fm.fontBoundingBoxAscent / FONT_PX,
    desc: fm.fontBoundingBoxDescent / FONT_PX,
  };
}

function useMetrics(text: string) {
  const [state, setState] = useState<{ key: string; m: Metrics } | null>(null);
  const [handle] = useState(() => delayRender("gear-shift: measuring"));
  const released = useRef(false);
  useEffect(() => {
    let live = true;
    Promise.all([
      jakarta.waitUntilDone(),
      ...WEIGHTS.map((w) =>
        document.fonts.load(`${w} 100px "${jakarta.fontFamily}"`),
      ),
    ])
      .catch(() => undefined)
      .then(() => {
        if (!live) return;
        setState({ key: text, m: measure(text) });
        if (!released.current) {
          released.current = true;
          continueRender(handle);
        }
      });
    return () => {
      live = false;
    };
  }, [text, handle]);
  return state && state.key === text ? state.m : null;
}

function jolt(tau: number) {
  if (tau < 0) return 0;
  return Math.sin(tau * 0.95) * Math.exp(-tau * 0.42);
}

export function GearShift({
  value = 42,
  from = 0,
  decimals = 0,
  prefix = "",
  suffix = "",
  label = "scenes in one launch film",
  gears = 4,
  accent,
  background,
  speed = 1,
  theme = "dark",
}: GearShiftProps) {
  const t = useCurrentFrame() * speed;
  const { width: W, height: H } = useVideoConfig();
  const c = THEMES[theme];
  const panel = accent ?? c.teal;
  const G = Math.max(2, Math.min(WEIGHTS.length, Math.round(gears)));
  const finalText = useMemo(
    () => `${prefix}${format(value, decimals)}${suffix}`,
    [prefix, value, decimals, suffix],
  );
  const m = useMetrics(finalText);

  const transparent = background === "transparent";
  const stage = transparent ? "transparent" : (background ?? c.bg);

  if (!m) {
    return (
      <div style={{ position: "absolute", inset: 0, background: stage }} />
    );
  }

  const portrait = H > W * 1.1;
  const minDim = Math.min(W, H);

  const dur = (k: number) => 9 + 3 * k;
  const gearStart: number[] = [];
  let acc = START;
  for (let k = 0; k < G; k++) {
    gearStart.push(acc);
    acc += dur(k) + (k < G - 1 ? SHIFT : 0);
  }
  const end = acc;

  let gear = 0;
  for (let k = 0; k < G; k++) if (t >= gearStart[k]) gear = k;
  const top = gear === G - 1;
  const u = interpolate(
    t,
    [gearStart[gear], gearStart[gear] + dur(gear)],
    [0, 1],
    {
      ...CLAMP,
      easing: top
        ? Easing.bezier(0.3, 0.6, 0.25, 1)
        : Easing.bezier(0.5, 0, 0.9, 0.6),
    },
  );
  const g = (gear + u) / G;
  const count = from + (value - from) * g;
  const text = `${prefix}${format(
    Math.round(count * 10 ** decimals) / 10 ** decimals,
    decimals,
  )}${suffix}`;

  const weight = Number(WEIGHTS[WEIGHTS.length - G + gear]);
  const tau = t - gearStart[gear];
  const j = gear > 0 ? jolt(tau) : 0;
  const land = jolt(t - end + 2) * 0.6;
  const kick = j + land;

  const panelIn = interpolate(t, [0, 14], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const panelW = portrait ? W : W * 0.34;
  const panelH = portrait ? H * 0.34 : H;
  const pad = minDim * 0.075;

  const areaX = portrait ? pad : panelW + pad;
  const areaW = portrait ? W - pad * 2 : W - panelW - pad * 2;
  const areaTop = portrait ? panelH : 0;
  const areaH = portrait ? H - panelH : H;
  const F = Math.min(areaH * 0.62, (areaW * 0.98) / Math.max(0.1, m.width));
  const sizeK = (k: number) => 0.86 + (0.14 * k) / (G - 1);
  const sz =
    F *
    (gear === 0
      ? sizeK(0)
      : interpolate(tau, [0, 5], [sizeK(gear - 1), sizeK(gear)], {
          ...CLAMP,
          easing: EASE_OUT,
        }));
  const baseY = areaTop + areaH / 2 + (m.figTop * F) / 2;
  const boxTop = baseY - (m.asc + (1 - m.asc - m.desc) / 2) * sz;
  const enter = interpolate(t, [0, 8], [0, 1], { ...CLAMP, easing: EASE_OUT });

  const labelFs = Math.max(minDim * 0.04, Math.min(minDim * 0.052, 40));
  const gearFs = labelFs * 0.8;
  const labelP = interpolate(t, [8, 24], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });

  return (
    <AbsoluteFill style={{ background: stage, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: portrait ? panelW : panelW * panelIn,
          height: portrait ? panelH * panelIn : panelH,
          background: panel,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: pad,
            top: pad,
            display: "flex",
            gap: gearFs * 1.1,
            fontFamily: jakarta.fontFamily,
            fontSize: gearFs,
            lineHeight: 1,
            fontVariantNumeric: "tabular-nums",
            color: c.panelInk,
          }}
        >
          {Array.from({ length: G }, (_, k) => (
            <div
              key={`g${k}`}
              style={{
                fontWeight: k === gear ? 500 : 400,
                opacity: k === gear ? 1 : 0.38,
                borderBottom: `${Math.max(1.5, gearFs * 0.1)}px solid ${k === gear ? c.panelInk : "transparent"}`,
                paddingBottom: gearFs * 0.3,
              }}
            >
              {k + 1}
            </div>
          ))}
        </div>
        {label ? (
          <div
            style={{
              position: "absolute",
              left: pad,
              bottom: pad,
              width: (portrait ? panelW : W * 0.34) - pad * 2,
              fontFamily: jakarta.fontFamily,
              fontWeight: 500,
              fontSize: labelFs,
              lineHeight: 1.15,
              letterSpacing: "-0.015em",
              wordSpacing: "0.1em",
              textWrap: "balance",
              color: c.panelInk,
              opacity: labelP,
              transform: `translateY(${((1 - labelP) * labelFs * 0.5).toFixed(2)}px)`,
            }}
          >
            {label}
          </div>
        ) : null}
      </div>

      <div
        style={{
          position: "absolute",
          left: areaX,
          top: boxTop,
          height: sz,
          lineHeight: `${sz}px`,
          whiteSpace: "pre",
          fontFamily: jakarta.fontFamily,
          fontWeight: weight,
          fontSize: sz,
          fontVariantNumeric: "tabular-nums",
          letterSpacing: `${TRACK}em`,
          transformOrigin: `0 ${((m.asc + (1 - m.asc - m.desc) / 2) * sz).toFixed(1)}px`,
          transform: `translateX(${(kick * F * 0.035).toFixed(2)}px) scale(${(1 + kick * 0.025).toFixed(4)}, ${(1 - kick * 0.035).toFixed(4)})`,
          opacity: enter,
          color: c.ink,
        }}
      >
        {text}
      </div>
    </AbsoluteFill>
  );
}
