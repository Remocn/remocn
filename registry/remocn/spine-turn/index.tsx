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
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const plex = loadPlexSans("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});

export interface SpineTurnProps {
  titles?: string[];
  hold?: number;
  accent?: string;
  background?: string;
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

function measure(titles: string[]) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("spine-turn: no 2d context");
  ctx.font = `500 100px "${plex.fontFamily}"`;
  return titles.map((s) => {
    const n = Array.from(s).length;
    return {
      hero: ctx.measureText(s).width / 100 + TRACK * Math.max(0, n - 1),
      spine: ctx.measureText(s).width / 100 + SPINE_TRACK * Math.max(0, n - 1),
    };
  });
}

function useWidths(titles: string[]) {
  const key = titles.join("\u0001");
  const [state, setState] = useState<{
    key: string;
    w: { hero: number; spine: number }[];
  } | null>(null);
  const [handle] = useState(() => delayRender("spine-turn: measuring"));
  const released = useRef(false);
  useEffect(() => {
    let live = true;
    Promise.all([
      plex.waitUntilDone(),
      document.fonts.load(`500 100px "${plex.fontFamily}"`),
    ])
      .catch(() => undefined)
      .then(() => {
        if (!live) return;
        setState({ key, w: measure(key.split("\u0001")) });
        if (!released.current) {
          released.current = true;
          continueRender(handle);
        }
      });
    return () => {
      live = false;
    };
  }, [key, handle]);
  return state && state.key === key ? state.w : null;
}

export function SpineTurn({
  titles = ["Kickoff", "Deep dive", "Wrap-up"],
  hold = 26,
  accent,
  background,
  speed = 1,
  theme = "dark",
}: SpineTurnProps) {
  const t = useCurrentFrame() * speed;
  const { width: W, height: H } = useVideoConfig();
  const c = THEMES[theme];
  const list = useMemo(() => {
    const l = titles.filter((s) => s.trim().length > 0);
    return l.length > 0 ? l : ["remocn"];
  }, [titles]);
  const widths = useWidths(list);

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

  const turnAt = (k: number) => ENTER + hold + k * (TURN + NEXT_LAG + hold);

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
      : interpolate(t, [turnAt(k), turnAt(k) + TURN], [0, 1], {
          ...CLAMP,
          easing: EASE_TURN,
        });
    const spine = spineOf(k);
    const ox = hero.x + (spine.x - hero.x) * turn;
    const oy = hero.baseline + (spine.y - hero.baseline) * turn;
    const size = hero.F + (S - hero.F) * turn;
    const track = TRACK + (SPINE_TRACK - TRACK) * turn;
    const rot = -90 * turn;

    const glyphs = (
      <div
        key="glyphs"
        style={{
          position: "absolute",
          left: 0,
          top: -BASE * size,
          height: BOX * size,
          lineHeight: `${BOX * size}px`,
          whiteSpace: "pre",
          fontFamily: plex.fontFamily,
          fontWeight: 500,
          fontSize: size,
          letterSpacing: `${track}em`,
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
          left: ox,
          top: oy,
          width: 0,
          height: 0,
          transform: `rotate(${rot.toFixed(3)}deg)`,
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
                top: BASE * size + size * 0.1 + (1 - enter) * BOX * size * 1.05,
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
    </AbsoluteFill>
  );
}
