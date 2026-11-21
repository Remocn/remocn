"use client";

import { loadFont } from "@remotion/google-fonts/GolosText";
import type React from "react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  AbsoluteFill,
  continueRender,
  delayRender,
  Easing,
  interpolate,
} from "remotion";
import { useSceneConfig, useSceneFrame } from "@/lib/remocn/frame-rate";
import { useGlide } from "@/lib/remocn/glide";

const golos = loadFont("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});

export interface MovesUpProps {
  items?: string[];
  labels?: [string, string, string];
  shipped?: string;
  /** Frames the first three rows hold before the first item ships. */
  hold?: number;
  /** Frames between one item shipping and the next. */
  interval?: number;
  accent?: string;
  /** Text color; overrides the theme ink. */
  ink?: string;
  background?: string;
  /** Typeface for the rows. Load it yourself; Golos Text by default. */
  fontFamily?: string;
  /** Size of the roadmap, around the frame's center. */
  scale?: number;
  /** Frames to hold the first frame before anything moves. */
  delay?: number;
  speed?: number;
  theme?: "dark" | "light";
}

const THEMES = {
  dark: { bg: "#1D2B53", ink: "#FFFFFF", accent: "#FFB38A" },
  light: { bg: "#FFF4EC", ink: "#1D2B53", accent: "#D9623B" },
} as const;

const DEFAULT_ITEMS = [
  "Auto captions",
  "Voiceover",
  "Vertical cuts",
  "Your type, your colours",
  "Whatever you ask for",
];

const ROW_SCALE = [1, 0.56, 0.38];
const ROW_INK = [1, 0.74, 0.5];
const LH = 1.06;
const BASE_EM = 0.86;

const INTRO = 30;
const HOLD = 22;
const STEP = 66;
const TAG_IN = 10;
const EXIT_AT = 11;
const EXIT_DUR = 10;
const PROMO_AT = 14;
const PROMO_DUR = 20;

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_STEP = Easing.bezier(0.4, 0, 0.15, 1);
const EASE_IN = Easing.bezier(0.5, 0, 0.75, 0);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

/** The foreground at `scale`, around the frame's center; nothing extra at 1. */
function ScaleLayer({
  scale,
  children,
}: {
  scale: number;
  children: React.ReactNode;
}) {
  if (scale === 1) return children;
  return (
    <AbsoluteFill style={{ transform: `scale(${scale})` }}>
      {children}
    </AbsoluteFill>
  );
}

export function MovesUp({
  items = DEFAULT_ITEMS,
  labels = ["Now", "Next", "Later"],
  shipped = "shipped",
  hold = HOLD,
  interval = STEP,
  accent,
  ink: inkColor,
  background,
  fontFamily = golos.fontFamily,
  scale = 1,
  delay = 0,
  speed = 1,
  theme = "dark",
}: MovesUpProps) {
  const glide = useGlide();
  const now = useSceneFrame();
  const { width: W, height: H, durationInFrames } = useSceneConfig();
  const c = THEMES[theme];
  const hi = accent ?? c.accent;
  const fg = inkColor ?? c.ink;
  const stage =
    background === "transparent" ? "transparent" : (background ?? c.bg);

  const queue = items.length > 0 ? items : DEFAULT_ITEMS;
  const steps = Math.max(0, queue.length - 3);
  const stepAt = (s: number) => INTRO + hold + (s - 1) * interval;
  const naturalEnd = steps > 0 ? stepAt(steps) + PROMO_AT + PROMO_DUR : INTRO;
  const pace = Math.max(1, (naturalEnd + 30) / Math.max(1, durationInFrames));
  const tAt = (f: number) => Math.max(0, f - delay) * speed * pace;
  const t = tAt(now);

  const portrait = H > W * 1.1;
  const margin = W * (portrait ? 0.08 : 0.07);
  const labelW = portrait ? 0 : W * 0.2;
  const itemX = margin + labelW;
  const itemW = W - margin - itemX;
  const baseSize = Math.min(H * 0.15, W * (portrait ? 0.13 : 0.085));
  const minRow = queue.map((_, k) => Math.max(0, Math.min(2, k - steps)));

  const refs = useRef<(HTMLDivElement | null)[]>([]);
  const probes = useRef<(HTMLSpanElement | null)[]>([]);
  const [natural, setNatural] = useState<number[] | null>(null);
  const [handle] = useState(() => delayRender("moves-up: measuring"));
  const released = useRef(false);
  const [fontsOk, setFontsOk] = useState(false);
  const [heights, setHeights] = useState<number[] | null>(null);

  useEffect(() => {
    let live = true;
    Promise.all([
      golos.waitUntilDone(),
      document.fonts.load(`500 100px "${fontFamily}"`),
    ])
      .catch(() => undefined)
      .then(() => {
        if (live) setFontsOk(true);
      });
    return () => {
      live = false;
    };
  }, [fontFamily]);

  useLayoutEffect(() => {
    if (!fontsOk) return;
    const nat = queue.map(
      (_, i) => (probes.current[i]?.offsetWidth ?? 0) / 100,
    );
    setNatural((prev) =>
      prev && prev.length === nat.length && prev.every((v, i) => v === nat[i])
        ? prev
        : nat,
    );
    const next = queue.map((_, i) => refs.current[i]?.offsetHeight ?? 0);
    setHeights((prev) =>
      prev && prev.length === next.length && prev.every((v, i) => v === next[i])
        ? prev
        : next,
    );
  });

  useEffect(() => {
    if (heights && natural && !released.current) {
      released.current = true;
      continueRender(handle);
    }
  }, [heights, natural, handle]);

  let fit = baseSize;
  if (natural) {
    for (let k = 0; k < queue.length; k++) {
      const w = natural[k] * ROW_SCALE[minRow[k]];
      if (w > 0) fit = Math.min(fit, (itemW * 0.98) / w);
    }
  }
  const size = Math.max(baseSize * 0.62, fit);
  const labelSize = Math.max(size * 0.24, H * 0.022);
  const labelLift = portrait ? labelSize * 1.5 : 0;
  const rowGap = size * 0.42 + labelLift;

  const lineH = size * LH;
  const slots = [0, 1, 2].map((r) => {
    let mx = lineH * ROW_SCALE[r];
    if (heights) {
      for (let k = r; k <= r + steps && k < queue.length; k++) {
        mx = Math.max(mx, heights[k] * ROW_SCALE[r]);
      }
    }
    return mx;
  });
  const total = slots[0] + slots[1] + slots[2] + rowGap * 2 + labelLift;
  const group = Math.min(1, (H * 0.84) / total);
  const top0 = (H - total) / 2 + labelLift;
  const slotTop = [top0, top0 + slots[0] + rowGap];
  slotTop.push(slotTop[1] + slots[1] + rowGap);

  const promotedAt = (t: number) => {
    let sum = 0;
    for (let s = 1; s <= steps; s++) {
      const at = stepAt(s);
      sum += interpolate(
        t,
        [at + PROMO_AT, at + PROMO_AT + PROMO_DUR],
        [0, 1],
        {
          ...CLAMP,
          easing: EASE_STEP,
        },
      );
    }
    return sum;
  };

  const lerpRow = (arr: number[], rf: number) => {
    const r = Math.max(0, Math.min(2, rf));
    const i = Math.min(1, Math.floor(r));
    const f = r - i;
    return arr[i] + (arr[i + 1] - arr[i]) * f;
  };

  const rise = (start: number, dur = 14, at = t) =>
    interpolate(at, [start, start + dur], [0, 1], {
      ...CLAMP,
      easing: EASE_OUT,
    });

  const font: React.CSSProperties = {
    fontFamily,
    fontWeight: 500,
    letterSpacing: "-0.03em",
    lineHeight: LH,
  };

  return (
    <AbsoluteFill style={{ background: stage, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          visibility: "hidden",
          whiteSpace: "nowrap",
        }}
      >
        {queue.map((item, k) => (
          <span
            key={`probe-${k}-${item}`}
            ref={(el) => {
              probes.current[k] = el;
            }}
            style={{ ...font, fontSize: 100, display: "inline-block" }}
          >
            {item}
            {k < steps ? (
              <span style={{ fontSize: "0.3em", marginLeft: "0.6em" }}>
                {shipped}
              </span>
            ) : null}
          </span>
        ))}
      </div>
      <ScaleLayer scale={scale}>
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: heights && natural ? 1 : 0,
            transformOrigin: "50% 50%",
            transform: `scale(${group.toFixed(4)})`,
          }}
        >
          {labels.map((label, r) => {
            const p = rise(r * 4);
            const sc = ROW_SCALE[r];
            return (
              <div
                key={`label-${r}`}
                style={{
                  ...font,
                  position: "absolute",
                  left: margin,
                  top: portrait
                    ? slotTop[r] - labelLift
                    : slotTop[r] + BASE_EM * size * sc - BASE_EM * labelSize,
                  fontSize: labelSize,
                  letterSpacing: "-0.01em",
                  color: r === 0 ? hi : fg,
                  opacity: p * (r === 0 ? 1 : 0.62),
                  transform: `translateY(${((1 - p) * 0.4).toFixed(3)}em)${glide(p > 0 && p < 1)}`,
                  whiteSpace: "nowrap",
                }}
              >
                {label}
              </div>
            );
          })}
          {queue.map((item, k) => {
            const shipStep = k + 1;
            const shipAt = shipStep <= steps ? stepAt(shipStep) : Infinity;
            const tagP = Number.isFinite(shipAt)
              ? interpolate(t, [shipAt, shipAt + TAG_IN], [0, 1], {
                  ...CLAMP,
                  easing: EASE_OUT,
                })
              : 0;
            const pose = (t: number, rest?: number) => {
              const rf = rest ?? k - promotedAt(t);
              const introP =
                rest !== undefined || k >= 3 ? 1 : rise(6 + k * 5, 18, t);
              const exitP =
                rest === undefined && Number.isFinite(shipAt)
                  ? interpolate(
                      t,
                      [shipAt + EXIT_AT, shipAt + EXIT_AT + EXIT_DUR],
                      [0, 1],
                      { ...CLAMP, easing: EASE_IN },
                    )
                  : 0;
              let y: number;
              let sc: number;
              let ink: number;
              let alpha: number;
              if (rf >= 2) {
                const e = Math.min(1, rf - 2);
                y = slotTop[2] + e * slots[2] * 0.9;
                sc = ROW_SCALE[2];
                ink = ROW_INK[2];
                alpha =
                  k < 3 ? introP : interpolate(e, [0, 0.4], [1, 0], CLAMP);
              } else if (rf >= 0) {
                y = lerpRow(slotTop, rf);
                sc = lerpRow(ROW_SCALE, rf);
                ink = lerpRow(ROW_INK, rf);
                alpha = introP;
              } else {
                y = slotTop[0];
                sc = 1;
                ink = 1;
                alpha = 1;
              }
              y -= exitP * slots[0] * 0.45;
              alpha *= 1 - exitP;
              y += (1 - introP) * size * sc * 0.35;
              return { rf, y, sc, ink, alpha };
            };
            const { rf, y, sc, ink, alpha } = pose(t);
            // Layout holds the row the item is nearest to and the rest of the
            // travel is a transform: layout rounds a baseline to whole pixels,
            // so a row eased by `top` clicks up pixel by pixel. At rest the
            // offset is exactly 0 and the item sits where layout put it.
            const anchor = pose(t, Math.round(rf)).y;
            const dy = y - anchor;
            const shift = `translateY(${Math.abs(dy) < 1e-3 ? 0 : dy}px) `;
            const travel = (f: number) => {
              const q = pose(tAt(f));
              return [q.y, q.sc * size];
            };
            const [y0, s0] = travel(now - 1);
            const [y2, s2] = travel(now + 1);
            const moving =
              Math.abs(y2 - y) > 1e-3 ||
              Math.abs(y - y0) > 1e-3 ||
              Math.abs(s2 - sc * size) > 1e-3 ||
              Math.abs(sc * size - s0) > 1e-3;

            return (
              <div
                key={`${k}-${item}`}
                ref={(el) => {
                  refs.current[k] = el;
                }}
                style={{
                  ...font,
                  position: "absolute",
                  left: itemX,
                  top: anchor,
                  width: itemW / ROW_SCALE[minRow[k]],
                  fontSize: size,
                  color: fg,
                  transformOrigin: "0 0",
                  // Rounded to 4 places the scale steps unevenly while it eases,
                  // so the rounding waits for the move to end.
                  transform: `${shift}scale(${moving ? sc : sc.toFixed(4)})${glide(moving)}`,
                  opacity: Math.max(0, alpha) * ink,
                  textWrap: "balance",
                }}
              >
                {item}
                {k < steps ? (
                  <span
                    style={{
                      display: "inline-block",
                      fontSize: "0.3em",
                      letterSpacing: "-0.01em",
                      marginLeft: "0.6em",
                      color: hi,
                      opacity: tagP / Math.max(0.01, ink),
                      transform: `translateX(${((1 - tagP) * -0.6).toFixed(3)}em)`,
                    }}
                  >
                    {shipped}
                  </span>
                ) : null}
              </div>
            );
          })}
        </div>
      </ScaleLayer>
    </AbsoluteFill>
  );
}
