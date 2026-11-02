"use client";

import { loadVariableFont } from "@remotion/google-fonts/BricolageGrotesque";
import { useEffect, useId, useRef, useState } from "react";
import {
  AbsoluteFill,
  continueRender,
  delayRender,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const bricolage = loadVariableFont("normal", { subsets: ["latin"] });

export interface ShedWeightProps {
  text?: string;
  sizes?: number;
  showSizes?: boolean;
  accent?: string;
  background?: string;
  speed?: number;
  theme?: "dark" | "light";
}

const THEMES = {
  dark: {
    bg: "#16130F",
    ink: "#F2EFE8",
    muted: "rgba(242,239,232,0.5)",
    accent: "#E5342A",
    rule: "rgba(242,239,232,0.2)",
    grain: 0.05,
  },
  light: {
    bg: "#F2EFE8",
    ink: "#111111",
    muted: "rgba(17,17,17,0.5)",
    accent: "#E5342A",
    rule: "rgba(17,17,17,0.18)",
    grain: 0.035,
  },
} as const;

const OPSZ_MIN = 12;
const OPSZ_MAX = 96;
const WGHT = 460;
const TRACK_SMALL = 0.012;
const TRACK_LARGE = -0.036;
const RATIO = 1.42;

const FIRST_AT = 4;
const STEP_MIN = 6;
const STEP_MAX = 11;
const RULE_LEN = 14;
const RISE_LEN = 16;

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_IN_OUT = Easing.bezier(0.65, 0, 0.35, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const fvs = (opsz: number) =>
  `"opsz" ${opsz.toFixed(1)}, "wght" ${WGHT}, "wdth" 100`;

interface Metrics {
  widths: number[];
  cap: number;
  desc: number;
  baseline: number;
}

function cuts(n: number) {
  return Array.from({ length: n }, (_, k) => {
    const u = n > 1 ? k / (n - 1) : 1;
    return {
      opsz: OPSZ_MIN + (OPSZ_MAX - OPSZ_MIN) * u,
      track: TRACK_SMALL + (TRACK_LARGE - TRACK_SMALL) * u,
    };
  });
}

function measure(text: string, n: number): Metrics {
  const probe = document.createElement("span");
  Object.assign(probe.style, {
    position: "absolute",
    left: "-99999px",
    top: "0",
    visibility: "hidden",
    whiteSpace: "pre",
    fontFamily: `"${bricolage.fontFamily}"`,
    fontSize: "100px",
    lineHeight: "1",
  });
  document.body.appendChild(probe);
  const widths = cuts(n).map(({ opsz, track }) => {
    probe.style.fontVariationSettings = fvs(opsz);
    probe.style.letterSpacing = `${track}em`;
    probe.textContent = text;
    return probe.getBoundingClientRect().width / 100 - track;
  });
  probe.remove();
  let cap = 0.72;
  let desc = 0.22;
  let baseline = 0.8;
  const ctx = document.createElement("canvas").getContext("2d");
  if (ctx) {
    ctx.font = `${WGHT} 100px "${bricolage.fontFamily}"`;
    const fm = ctx.measureText("Hgy");
    cap = ctx.measureText("H").actualBoundingBoxAscent / 100;
    desc = fm.actualBoundingBoxDescent / 100;
    const asc = fm.fontBoundingBoxAscent / 100;
    const d = fm.fontBoundingBoxDescent / 100;
    baseline = (1 - (asc + d)) / 2 + asc;
  }
  return { widths, cap, desc, baseline };
}

function useMetrics(text: string, n: number) {
  const key = `${n}\u0000${text}`;
  const [state, setState] = useState<{ key: string; m: Metrics } | null>(null);
  const [handle] = useState(() => delayRender("shed-weight: measuring"));
  const released = useRef(false);
  useEffect(() => {
    let live = true;
    const [count, tx] = key.split("\u0000");
    Promise.all([
      bricolage.waitUntilDone(),
      document.fonts.load(`${WGHT} 100px "${bricolage.fontFamily}"`),
    ])
      .catch(() => undefined)
      .then(() => {
        if (!live) return;
        setState({ key, m: measure(tx, Number(count)) });
        if (!released.current) {
          released.current = true;
          continueRender(handle);
        }
      });
    return () => {
      live = false;
    };
  }, [key, handle]);
  return state && state.key === key ? state.m : null;
}

function Grain({ opacity }: { opacity: number }) {
  const id = `sw${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  return (
    <svg
      width="100%"
      height="100%"
      style={{ position: "absolute", inset: 0, opacity, pointerEvents: "none" }}
      aria-hidden
    >
      <filter id={id}>
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.9"
          numOctaves={2}
          seed={4}
          stitchTiles="stitch"
        />
        <feColorMatrix values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0.9 0" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#${id})`} />
    </svg>
  );
}

export function ShedWeight({
  text = "Sharp at any size.",
  sizes = 6,
  showSizes = true,
  accent,
  background,
  speed = 1,
  theme = "dark",
}: ShedWeightProps) {
  const t = useCurrentFrame() * speed;
  const { width: W, height: H } = useVideoConfig();
  const c = THEMES[theme];
  const spot = accent ?? c.accent;
  const n = Math.max(2, Math.min(9, Math.round(sizes)));
  const m = useMetrics(text, n);

  const transparent = background === "transparent";
  const stage = transparent ? "transparent" : (background ?? c.bg);

  if (!m) {
    return (
      <div style={{ position: "absolute", inset: 0, background: stage }} />
    );
  }

  const portrait = H > W * 1.1;
  const M = Math.min(W, H) * (portrait ? 0.08 : 0.075);
  const tagSize = portrait ? W * 0.024 : H * 0.024;
  const tagW = showSizes ? tagSize * 3.6 : 0;
  const scaleOf = (k: number) => RATIO ** (k - (n - 1));
  const lead = (k: number) =>
    m.cap * scaleOf(k) + m.desc * scaleOf(k - 1) * 1.35;
  let stackEm = m.cap * scaleOf(0);
  for (let k = 1; k < n; k++) stackEm += lead(k);
  const usableW = W - M * 2 - tagW;
  const usableH = H - M * 2 - (portrait ? H * 0.12 : 0);
  const fitW = Math.min(
    ...m.widths.map((w, k) => usableW / Math.max(0.1, w * scaleOf(k))),
  );
  const F = Math.min(fitW, usableH / stackEm);
  const baseLast = H - M * (portrait ? 2.4 : 1.25);
  const room = baseLast - M * 1.4 - m.cap * scaleOf(0) * F;
  const natural = (stackEm - m.cap * scaleOf(0)) * F;
  const stretch = Math.max(1, Math.min(1.7, room / Math.max(1, natural)));
  const bases: number[] = new Array(n).fill(0);
  bases[n - 1] = baseLast;
  for (let k = n - 1; k > 0; k--)
    bases[k - 1] = bases[k] - lead(k) * F * stretch;

  const list = cuts(n);
  const startAt: number[] = [];
  let at = FIRST_AT;
  for (let k = 0; k < n; k++) {
    startAt.push(at);
    const u = n > 1 ? k / (n - 1) : 1;
    at += STEP_MIN + (STEP_MAX - STEP_MIN) * u;
  }

  return (
    <AbsoluteFill style={{ background: stage, overflow: "hidden" }}>
      {list.map(({ opsz, track }, k) => {
        const size = F * scaleOf(k);
        const base = bases[k];
        const last = k === n - 1;
        const ruleP = interpolate(
          t,
          [startAt[k] - 4, startAt[k] - 4 + RULE_LEN],
          [0, 1],
          { ...CLAMP, easing: EASE_IN_OUT },
        );
        const rise = interpolate(
          t,
          [startAt[k], startAt[k] + RISE_LEN],
          [0, 1],
          { ...CLAMP, easing: EASE_OUT },
        );
        const ruleH = last
          ? Math.max(2, size * 0.014)
          : Math.max(1, Math.min(2, size * 0.02));
        const maskTop = base - size * (m.cap + 0.3);
        return (
          <div key={`cut-${k}`}>
            <div
              style={{
                position: "absolute",
                left: last ? 0 : M,
                top: base + Math.max(2, size * 0.04),
                width: last ? W : W - M * 2,
                height: ruleH,
                background: last ? spot : c.rule,
                transformOrigin: "0% 50%",
                transform: `scaleX(${ruleP.toFixed(4)})`,
              }}
            />
            <div
              style={{
                position: "absolute",
                left: 0,
                top: maskTop,
                width: W,
                height: base - maskTop + size * (m.desc + 0.06),
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  left: M,
                  top: base - maskTop - m.baseline * size,
                  height: size,
                  lineHeight: `${size}px`,
                  whiteSpace: "pre",
                  fontFamily: bricolage.fontFamily,
                  fontSize: size,
                  fontVariationSettings: fvs(opsz),
                  letterSpacing: `${track}em`,
                  color: c.ink,
                  transform: `translateY(${((1 - rise) * size * 1.05).toFixed(2)}px)`,
                }}
              >
                {text}
              </div>
            </div>
            {showSizes ? (
              <div
                style={{
                  position: "absolute",
                  right: M,
                  top: base - tagSize * 0.78,
                  fontFamily: bricolage.fontFamily,
                  fontVariationSettings: fvs(12),
                  fontSize: tagSize,
                  lineHeight: 1,
                  letterSpacing: "0.01em",
                  fontFeatureSettings: '"tnum" 1',
                  whiteSpace: "pre",
                  color: last ? spot : c.muted,
                  opacity: rise,
                }}
              >
                {`${Math.round(opsz)} pt`}
              </div>
            ) : null}
          </div>
        );
      })}
      {transparent ? null : <Grain opacity={c.grain} />}
    </AbsoluteFill>
  );
}
