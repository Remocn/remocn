"use client";

import { loadFont as loadPlexSans } from "@remotion/google-fonts/IBMPlexSans";
import type React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  AbsoluteFill,
  continueRender,
  delayRender,
  Easing,
  interpolate,
} from "remotion";
import { useSceneConfig, useSceneFrame } from "@/lib/remocn/frame-rate";
import { useGlide } from "@/lib/remocn/glide";

const plex = loadPlexSans("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});

export interface SpineTurnProps {
  titles?: string[];
  hold?: number;
  /** Frames for a title to turn onto its spine. */
  turn?: number;
  fontWeight?: number;
  accent?: string;
  background?: string;
  /** Typeface for the titles. Load it yourself; IBM Plex Sans by default. */
  fontFamily?: string;
  /** Size of the titles, around the frame's center. */
  scale?: number;
  /** Frames to hold the first frame before anything moves. */
  delay?: number;
  speed?: number;
  theme?: "dark" | "light";
}

const THEMES = {
  dark: {
    bg: "#0F1B2D",
    spine: "#7D8CA3",
    rule: "rgba(243, 245, 248, 0.22)",
    accent: "#FF9900",
  },
  light: {
    bg: "#FFFFFF",
    spine: "#8A96A8",
    rule: "rgba(15, 27, 45, 0.2)",
    accent: "#C76A00",
  },
} as const;

const TRACK = -0.035;
const SPINE_TRACK = -0.01;
const BOX = 1.0;
const BASE = 0.8;

const ENTER = 16;
const TURN = 26;
const NEXT_LAG = 14;

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_TURN = Easing.bezier(0.7, 0, 0.2, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

function measure(titles: string[], font: string) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("spine-turn: no 2d context");
  ctx.font = font;
  return titles.map((s) => {
    const n = Array.from(s).length;
    return {
      hero: ctx.measureText(s).width / 100 + TRACK * Math.max(0, n - 1),
      spine: ctx.measureText(s).width / 100 + SPINE_TRACK * Math.max(0, n - 1),
    };
  });
}

function useWidths(titles: string[], font: string) {
  const key = titles.join("\u0001");
  const [state, setState] = useState<{
    key: string;
    w: { hero: number; spine: number }[];
  } | null>(null);
  const [handle] = useState(() => delayRender("spine-turn: measuring"));
  const released = useRef(false);
  useEffect(() => {
    let live = true;
    Promise.all([plex.waitUntilDone(), document.fonts.load(font)])
      .catch(() => undefined)
      .then(() => {
        if (!live) return;
        setState({ key, w: measure(key.split("\u0001"), font) });
        if (!released.current) {
          released.current = true;
          continueRender(handle);
        }
      });
    return () => {
      live = false;
    };
  }, [key, font, handle]);
  return state && state.key === key ? state.w : null;
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
    <AbsoluteFill style={{ transform: `scale(${scale})` }}>
      {children}
    </AbsoluteFill>
  );
}

export function SpineTurn({
  titles = ["Kickoff", "Deep dive", "Wrap-up"],
  hold = 26,
  turn: turnLen = TURN,
  fontWeight = 500,
  accent,
  background,
  fontFamily = plex.fontFamily,
  scale = 1,
  delay = 0,
  speed = 1,
  theme = "dark",
}: SpineTurnProps) {
  const t = Math.max(0, useSceneFrame() - delay) * speed;
  const glide = useGlide();
  const { width: W, height: H } = useSceneConfig();
  const c = THEMES[theme];
  const list = useMemo(() => {
    const l = titles.filter((s) => s.trim().length > 0);
    return l.length > 0 ? l : ["remocn"];
  }, [titles]);
  const widths = useWidths(list, `${fontWeight} 100px "${fontFamily}"`);

  const transparent = background === "transparent";
  const stage = transparent ? "transparent" : (background ?? c.bg);

  if (!widths) {
    return (
      <div style={{ position: "absolute", inset: 0, background: stage }} />
    );
  }

  const n = list.length;
  const portrait = H > W * 1.1;
  const margin = Math.min(W, H) * 0.08;
  const ruleY = H - margin;

  const spineLen = H - margin * 2.4;
  const longest = Math.max(...widths.slice(0, -1).map((w) => w.spine), 0.01);
  const S = Math.min(
    spineLen / longest,
    Math.min(W, H) * (portrait ? 0.13 : 0.16),
  );
  const spineCol = S * BOX * 0.86;
  const spineGap = S * 0.3;

  const turnAt = (k: number) => ENTER + hold + k * (turnLen + NEXT_LAG + hold);

  const heroOf = (k: number) => {
    const areaL = margin + k * (spineCol + spineGap) + (k > 0 ? S * 0.5 : 0);
    const areaW = W - margin - areaL;
    const F = Math.min(
      (areaW * 0.94) / widths[k].hero,
      H * (portrait ? 0.18 : 0.46),
    );
    const x = areaL;
    const baseline = ruleY - F * 0.26;
    return { F, x, baseline };
  };

  const spineOf = (k: number) => {
    const x = margin + k * (spineCol + spineGap) + S * 0.78;
    const y = ruleY - S * 0.3;
    return { x, y };
  };

  const els: React.ReactNode[] = [];
  list.forEach((title, k) => {
    const isLast = k === n - 1;
    const hero = heroOf(k);
    const enterAt = k === 0 ? 0 : turnAt(k - 1) + NEXT_LAG;
    const enter = interpolate(t, [enterAt, enterAt + ENTER], [0, 1], {
      ...CLAMP,
      easing: EASE_OUT,
    });
    if (enter <= 0) return;
    const turn = isLast
      ? 0
      : interpolate(t, [turnAt(k), turnAt(k) + turnLen], [0, 1], {
          ...CLAMP,
          easing: EASE_TURN,
        });
    const spine = spineOf(k);
    const size = hero.F + (S - hero.F) * turn;
    const track = TRACK + (SPINE_TRACK - TRACK) * turn;
    const turning = turn > 0 && turn < 1;
    const settled = !isLast && turn === 1;
    // Layout rounds a box and a baseline to whole pixels, so the title is laid
    // out once, where it finally rests (on its spine, or the last one as a
    // hero), and carried from there by a transform all its life: its travel
    // is a translate and its size a scale of that layout.
    const anchor = isLast
      ? { x: hero.x, y: hero.baseline, dx: 0, dy: 0 }
      : {
          x: spine.x,
          y: spine.y,
          dx: (hero.x - spine.x) * (1 - turn),
          dy: (hero.baseline - spine.y) * (1 - turn),
        };
    const laidSize = isLast ? hero.F : S;
    const rot = -90 * turn;

    const glyphs = (
      <div
        key="glyphs"
        style={{
          position: "absolute",
          left: 0,
          top: -BASE * laidSize,
          height: BOX * laidSize,
          lineHeight: `${BOX * laidSize}px`,
          whiteSpace: "pre",
          fontFamily,
          fontWeight,
          fontSize: laidSize,
          letterSpacing: `${track}em`,
          transform:
            settled || isLast ? undefined : `scale(${size / laidSize})`,
          transformOrigin:
            settled || isLast ? undefined : `0 ${BASE * laidSize}px`,
          color:
            turn > 0
              ? `color-mix(in oklab, ${c.spine} ${(Math.min(1, turn * 1.4) * 100).toFixed(1)}%, ${accent ?? c.accent})`
              : (accent ?? c.accent),
        }}
      >
        {title}
      </div>
    );

    const masked = enter < 1;
    els.push(
      <div
        key={`t${k}`}
        style={{
          position: "absolute",
          left: anchor.x,
          top: anchor.y,
          width: 0,
          height: 0,
          // On its spine the title rests turned square, as it always did.
          transform: settled
            ? `rotate(${rot.toFixed(3)}deg)`
            : `translate(${anchor.dx}px, ${anchor.dy}px) rotate(${rot.toFixed(3)}deg)${glide(turning)}`,
          transformOrigin: "0 0",
        }}
      >
        {masked ? (
          <div
            style={{
              position: "absolute",
              left: -size * 0.2,
              top: -BASE * size - size * 0.1,
              width: widths[k].hero * size + size * 0.4,
              height: BOX * size + size * 0.12,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                left: size * 0.2,
                // The rise is a transform: layout would round the baseline to
                // whole pixels.
                top: BASE * size + size * 0.1,
                transform: `translateY(${(1 - enter) * BOX * size * 1.05}px)${glide(enter > 0 && enter < 1)}`,
              }}
            >
              {glyphs}
            </div>
          </div>
        ) : (
          glyphs
        )}
      </div>,
    );
  });

  const ruleP = interpolate(t, [0, ENTER + 6], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });

  return (
    <AbsoluteFill style={{ background: stage, overflow: "hidden" }}>
      <ScaleLayer scale={scale}>
        <div
          style={{
            position: "absolute",
            left: margin,
            top: ruleY,
            width: (W - margin * 2) * ruleP,
            height: Math.max(1, H * 0.0016),
            background: c.rule,
          }}
        />
        {els}
      </ScaleLayer>
    </AbsoluteFill>
  );
}
