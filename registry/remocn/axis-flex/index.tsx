"use client";

import { loadVariableFont } from "@remotion/google-fonts/MonaSans";
import type React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  AbsoluteFill,
  continueRender,
  delayRender,
  Easing,
  interpolate,
  spring,
} from "remotion";
import { useSceneConfig, useSceneFrame } from "@/lib/remocn/frame-rate";
import { useGlide } from "@/lib/remocn/glide";
import {
  type ResolvedElement,
  type Timing,
  useTimeline,
} from "@/lib/remocn/timeline";
import {
  type AxisFlexElementId,
  axisFlexTimeline,
  DEFAULT_WORD,
} from "./timeline";

const flex = loadVariableFont("normal", { subsets: ["latin"] });

export interface AxisFlexProps {
  /** The word that flexes. */
  word?: string;
  /** Second line, set in the narrow cut under the word. */
  line?: string;
  accent?: string;
  /** Background fill; "transparent" drops it. */
  background?: string;
  /** Typeface for the copy, with `wdth` and `wght` axes. Load it yourself; Mona Sans by default. */
  fontFamily?: string;
  /** Frame the letters stop flexing and snap to their final cut. */
  settleAt?: number;
  /** Frames between letters as they snap. */
  stagger?: number;
  /** Size of the text, around the frame's center. */
  scale?: number;
  /** Frames to hold the first frame before anything moves. */
  delay?: number;
  theme?: "dark" | "light";
  /** Playback multiplier. */
  speed?: number;
  /**
   * Moves, trims or stretches the fade-in, the wave, single letters and the
   * second line, by the ids in `./timeline`. Frames on the scene timeline,
   * after `delay` and `speed`.
   */
  timing?: Timing<AxisFlexElementId>;
}

/**
 * The word is filled with the gradients.sh "beam" palette (clip-text), which
 * pairs with the accent; it only drifts a few degrees over the shot.
 */
const THEMES = {
  dark: {
    bg: "#0A0A0B",
    fill: (accent: string) => ["#F4F7FF", "#C9D8FF", "#8FB4FF", accent],
  },
  light: {
    bg: "#F5F4F0",
    fill: (accent: string) => ["#1A1660", "#2B2A8A", accent, "#5E86F0"],
  },
} as const;

interface Axes {
  wdth: number;
  wght: number;
}

/** Mona Sans axes: wdth 75–125, wght 200–900; the wave stays at 500 or lighter. */
const AXIS = { wdth: [75, 125], wght: [200, 500] } as const;
/** Equalizer floor and ceiling: light condensed up to wide medium. */
const LOW: Axes = { wdth: 75, wght: 200 };
const HIGH: Axes = { wdth: 125, wght: 500 };
/** The style every letter snaps to. */
const FINAL: Axes = { wdth: 120, wght: 460 };
/** The narrow cut for the second line. */
const NARROW: Axes = { wdth: 75, wght: 400 };

const TRACK = -0.02;

/** The flex is sampled for the widest row until this long after the line starts. */
const SAMPLE_TAIL = 8;

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;
const SPRING_SNAP = { damping: 14, stiffness: 170, mass: 0.7 };

const midway = (p: number) => p > 5e-4 && p < 1 - 5e-4;

const mix = (a: Axes, b: Axes, k: number): Axes => ({
  wdth: a.wdth + (b.wdth - a.wdth) * k,
  wght: a.wght + (b.wght - a.wght) * k,
});

const clampAxes = (a: Axes): Axes => ({
  wdth: Math.min(AXIS.wdth[1], Math.max(AXIS.wdth[0], a.wdth)),
  wght: Math.min(AXIS.wght[1], Math.max(AXIS.wght[0], a.wght)),
});

const fvs = (a: Axes) =>
  `"wdth" ${a.wdth.toFixed(2)}, "wght" ${a.wght.toFixed(1)}`;

/** Equalizer level of glyph i at time t: a travelling wave plus a faster ripple. */
function level(i: number, t: number, wave: ResolvedElement) {
  const amp = interpolate(
    t,
    [wave.start, wave.start + wave.beat("full")],
    [0, 1],
    {
      ...CLAMP,
      easing: Easing.bezier(0.45, 0, 0.55, 1),
    },
  );
  const ph = ((t - wave.start) / wave.beat("period")) * Math.PI * 2;
  const main = Math.sin(ph - i * 0.95);
  const ripple = Math.sin(ph * 1.85 - i * 1.7 + 1.1);
  const v = (main * 0.72 + ripple * 0.28 + 1) / 2;
  const shaped = v * v * (3 - 2 * v);
  return 0.32 + (shaped - 0.32) * amp;
}

const LEVELS = [0, 0.25, 0.5, 0.75, 1];

interface Metrics {
  /** Advance per glyph (em) at each sampled level. */
  adv: number[][];
  finalWidth: number;
  /** Second line width (em) in the narrow cut. */
  lineWidth: number;
}

function measure(chars: string[], line: string, fontFamily: string): Metrics {
  const probe = document.createElement("span");
  Object.assign(probe.style, {
    position: "absolute",
    left: "-99999px",
    top: "0",
    visibility: "hidden",
    whiteSpace: "pre",
    fontFamily: `"${fontFamily}"`,
    fontSize: "100px",
    lineHeight: "1",
  });
  document.body.appendChild(probe);
  const width = (s: string, a: Axes) => {
    probe.style.fontVariationSettings = fvs(a);
    probe.textContent = s;
    return probe.getBoundingClientRect().width / 100;
  };
  const adv = chars.map((ch) =>
    LEVELS.map((l) => width(ch, mix(LOW, HIGH, l)) + TRACK),
  );
  const finalWidth = chars.reduce((s, ch) => s + width(ch, FINAL) + TRACK, 0);
  const lineWidth = width(line, NARROW);
  probe.remove();
  return { adv, finalWidth, lineWidth };
}

function useMetrics(chars: string[], line: string, fontFamily: string) {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [handle] = useState(() => delayRender("axis-flex: measuring"));
  const released = useRef(false);
  useEffect(() => {
    let live = true;
    Promise.all([
      flex.waitUntilDone(),
      document.fonts.load(`400 100px "${fontFamily}"`),
    ])
      .catch(() => undefined)
      .then(() => {
        if (!live) return;
        setMetrics(measure(chars, line, fontFamily));
        if (!released.current) {
          released.current = true;
          continueRender(handle);
        }
      });
    return () => {
      live = false;
    };
  }, [chars, line, handle, fontFamily]);
  return metrics;
}

function advAt(row: number[], l: number) {
  const x = Math.min(1, Math.max(0, l)) * (LEVELS.length - 1);
  const k = Math.min(LEVELS.length - 2, Math.floor(x));
  return row[k] + (row[k + 1] - row[k]) * (x - k);
}

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
    <AbsoluteFill
      style={{
        transform: `scale(${scale})`,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {children}
    </AbsoluteFill>
  );
}

export function AxisFlex(props: AxisFlexProps) {
  const {
    word = DEFAULT_WORD,
    line = "One family, every width",
    accent = "#3B5BFD",
    background,
    fontFamily = flex.fontFamily,
    scale = 1,
    delay = 0,
    theme = "dark",
    speed = 1,
    timing,
  } = props;
  const glide = useGlide();
  const t = Math.max(0, useSceneFrame() - delay) * speed;
  const { width: W, height: H, fps, durationInFrames } = useSceneConfig();
  const tl = useTimeline(
    axisFlexTimeline,
    props,
    durationInFrames * speed,
    timing,
  );
  const c = THEMES[theme];
  const stage =
    background === "transparent" ? "transparent" : (background ?? c.bg);
  const wave = tl.get("wave");
  const lineEl = tl.get("line");
  const sampleEnd = lineEl.start + SAMPLE_TAIL;
  const chars = useMemo(() => Array.from(word), [word]);
  const m = useMetrics(chars, line, fontFamily);

  // Widest the row ever gets while flexing, so it never leaves the frame.
  const widest = useMemo(() => {
    if (!m) return 1;
    let max = m.finalWidth;
    for (let f = 0; f <= sampleEnd; f++) {
      let w = 0;
      for (let i = 0; i < chars.length; i++)
        w += advAt(m.adv[i], level(i, f, wave));
      max = Math.max(max, w);
    }
    return max;
  }, [m, chars, sampleEnd, wave]);

  if (!m) {
    return (
      <div style={{ position: "absolute", inset: 0, background: stage }} />
    );
  }

  const F = Math.min((W * 0.84) / widest, H * 0.36);
  const F2 = Math.min(F * 0.26, (W * 0.8) / Math.max(0.1, m.lineWidth));

  const lineP = interpolate(
    t,
    [lineEl.start, lineEl.start + lineEl.beat("rise")],
    [0, 1],
    {
      ...CLAMP,
      easing: EASE_OUT,
    },
  );
  const lineSqueeze = interpolate(t, [lineEl.start, lineEl.end], [0, 1], {
    ...CLAMP,
    easing: Easing.bezier(0.3, 0, 0.1, 1),
  });
  const lineAxes = mix({ ...NARROW, wdth: 100 }, NARROW, lineSqueeze);

  const enterEl = tl.get("enter");
  const enter = interpolate(t, [enterEl.start, enterEl.end], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const stops = c.fill(accent);
  const angle = 100 + Math.sin(t / 45) * 6;
  const fill = `linear-gradient(${angle.toFixed(2)}deg, ${stops[0]} 0%, ${stops[1]} 30%, ${stops[2]} 62%, ${stops[3]} 100%)`;

  return (
    <AbsoluteFill
      style={{
        background: stage,
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
      }}
    >
      <ScaleLayer scale={scale}>
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "center",
            whiteSpace: "pre",
            fontFamily,
            fontSize: F,
            lineHeight: 1,
            // the fill box must cover the ink, descenders included; the extra
            // bottom padding is pulled back with a negative margin
            height: F * 1.08,
            marginTop: F * 0.1,
            marginBottom: -F * 0.22,
            padding: `0 ${F * 0.04}px`,
            backgroundImage: fill,
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
            opacity: 0.4 + 0.6 * enter,
            transform: `translateY(${(1 - enter) * F * 0.08}px)${glide(midway(enter))}`,
          }}
        >
          {chars.map((ch, i) => {
            const snap = spring({
              frame: t - tl.get(`letter:${i}`).start,
              fps,
              config: SPRING_SNAP,
            });
            const l = level(i, t, wave);
            const axes = clampAxes(mix(mix(LOW, HIGH, l), FINAL, snap));
            return (
              <span
                key={`${i}-${ch}`}
                style={{
                  fontVariationSettings: fvs(axes),
                  letterSpacing: `${TRACK}em`,
                }}
              >
                {ch}
              </span>
            );
          })}
        </div>
        <div
          style={{
            overflow: "hidden",
            marginTop: F * 0.2,
            height: F2 * 1.2,
          }}
        >
          <div
            style={{
              fontFamily,
              fontSize: F2,
              lineHeight: 1.2,
              whiteSpace: "pre",
              color: accent,
              fontVariationSettings: fvs(lineAxes),
              letterSpacing: "0.01em",
              transform: `translateY(${(1 - lineP) * F2 * 1.25}px)${glide(midway(lineP))}`,
            }}
          >
            {line}
          </div>
        </div>
      </ScaleLayer>
    </AbsoluteFill>
  );
}
