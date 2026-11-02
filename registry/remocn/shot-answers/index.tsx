"use client";

import { loadFont as loadMono } from "@remotion/google-fonts/GeistMono";
import { loadFont } from "@remotion/google-fonts/Onest";
import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import {
  AbsoluteFill,
  continueRender,
  delayRender,
  Easing,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { GradientParams } from "@/lib/remocn/gsh/gradient-engine";
import { GshGround } from "@/lib/remocn/gsh/gsh-ground";
import type { GshPresetId } from "@/lib/remocn/gsh/presets";

const onest = loadFont("normal", {
  weights: ["300", "400"],
  subsets: ["latin"],
});
const mono = loadMono("normal", { weights: ["400"], subsets: ["latin"] });

export interface ShotAnswersProps {
  question?: string;
  answer?: string;
  src?: string;
  aspect?: number;
  accent?: string;
  background?: string;
  ground?: GshPresetId;
  groundParams?: Partial<GradientParams>;
  url?: string;
  speed?: number;
  theme?: "dark" | "light";
}

const THEMES = {
  dark: {
    preset: "europa" as GshPresetId,
    bg: "#01040a",
    ink: "#F3F6FA",
    dim: "rgba(243,246,250,0.42)",
    accent: "#A6E4FF",
    chrome: "#0C1118",
    chromeInk: "rgba(243,246,250,0.5)",
    dot: "rgba(243,246,250,0.16)",
    scrim:
      "linear-gradient(90deg, rgba(1,4,10,0.78) 0%, rgba(1,4,10,0.4) 38%, rgba(1,4,10,0) 62%)",
    shadow:
      "inset 0 1px 0 rgba(255,255,255,0.07), 0 0 0 1px rgba(255,255,255,0.09), 0 2px 6px rgba(0,0,0,0.35), 0 24px 60px -18px rgba(0,0,0,0.7), 0 60px 140px -50px rgba(0,0,0,0.85)",
  },
  light: {
    preset: "glasswork" as GshPresetId,
    bg: "#eef0f6",
    ink: "#0F1420",
    dim: "rgba(15,20,32,0.4)",
    accent: "#2742C9",
    chrome: "#F7F8FB",
    chromeInk: "rgba(15,20,32,0.5)",
    dot: "rgba(15,20,32,0.14)",
    scrim:
      "linear-gradient(90deg, rgba(238,240,246,0.82) 0%, rgba(238,240,246,0.45) 38%, rgba(238,240,246,0) 62%)",
    shadow:
      "0 0 0 1px rgba(15,20,32,0.07), 0 2px 4px rgba(26,42,158,0.06), 0 22px 50px -18px rgba(26,42,158,0.22), 0 60px 120px -50px rgba(26,42,158,0.3)",
  },
} as const;

const WGHT = 400;
const TRACK = -0.032;
const PX = 200;
const LEADING = 1.08;

const ENTER = Easing.bezier(0.32, 0.72, 0, 1);
const MOVE = Easing.bezier(0.65, 0, 0.35, 1);
const EXIT = Easing.bezier(0.55, 0, 1, 0.45);
const HEAVY = { mass: 1, damping: 26, stiffness: 120 };
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

type Widths = (s: string) => number;

function buildWidths(_version: number): Widths {
  const ctx = document.createElement("canvas").getContext("2d");
  const cache: Record<string, number> = {};
  return (s: string) => {
    if (cache[s] === undefined) {
      if (!ctx) return s.length * 0.52;
      ctx.font = `${WGHT} ${PX}px "${onest.fontFamily}"`;
      cache[s] = ctx.measureText(s).width / PX + TRACK * Array.from(s).length;
    }
    return cache[s];
  };
}

function useWidths() {
  const [version, setVersion] = useState(0);
  const [handle] = useState(() => delayRender("shot-answers: measuring"));
  const released = useRef(false);
  useEffect(() => {
    let live = true;
    const bump = () => {
      if (live) setVersion((v) => v + 1);
    };
    document.fonts.addEventListener("loadingdone", bump);
    Promise.all([
      onest.waitUntilDone(),
      document.fonts.load(`${WGHT} 100px "${onest.fontFamily}"`),
    ])
      .catch(() => undefined)
      .then(() => {
        bump();
        if (!released.current) {
          released.current = true;
          continueRender(handle);
        }
      });
    return () => {
      live = false;
      document.fonts.removeEventListener("loadingdone", bump);
    };
  }, [handle]);
  return useMemo(() => buildWidths(version), [version]);
}

const keyOf = (word: string) =>
  word.toLowerCase().replace(/[^\p{L}\p{N}']/gu, "");

function match(a: string[], b: string[]) {
  const ka = a.map(keyOf);
  const kb = b.map(keyOf);
  const n = ka.length;
  const m = kb.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () =>
    new Array<number>(m + 1).fill(0),
  );
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] =
        ka[i] === kb[j] && ka[i] !== ""
          ? dp[i + 1][j + 1] + 1
          : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  const aToB = new Array<number>(n).fill(-1);
  const bToA = new Array<number>(m).fill(-1);
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (ka[i] === kb[j] && ka[i] !== "") {
      aToB[i] = j;
      bToA[j] = i;
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      i++;
    } else {
      j++;
    }
  }
  return { aToB, bToA };
}

interface Placed {
  x: number;
  y: number;
}

function flow(
  words: string[],
  w: Widths,
  sp: number,
  size: number,
  maxW: number,
) {
  const placed: Placed[] = [];
  let x = 0;
  let line = 0;
  words.forEach((wd, i) => {
    const ww = w(wd);
    if (i > 0 && (x + sp + ww) * size > maxW) {
      line++;
      x = 0;
    } else if (i > 0) {
      x += sp;
    }
    placed.push({ x: x * size, y: line * LEADING * size });
    x += ww;
  });
  return { placed, lines: line + 1 };
}

export function ShotAnswers({
  question = "What if your launch video were just another pull request?",
  answer = "Your launch video is just another pull request.",
  src,
  aspect = 16 / 9,
  accent,
  background,
  ground,
  groundParams,
  url = "remocn.dev/studio",
  speed = 1,
  theme = "dark",
}: ShotAnswersProps) {
  const frame = useCurrentFrame();
  const { width: W, height: H, durationInFrames: D, fps } = useVideoConfig();
  const c = THEMES[theme];
  const hi = accent ?? c.accent;
  const transparent = background === "transparent";
  const image = src ?? staticFile("studio.png");
  const widths = useWidths();

  const qWords = question.split(/\s+/).filter(Boolean);
  const aWords = answer.split(/\s+/).filter(Boolean);

  const k = Math.min(1.6, Math.max(0.6, D / 140));
  const t = frame * speed;
  const portrait = H > W * 1.1;
  const sp = widths(" ");
  const { aToB, bToA } = match(qWords, aWords);

  const colX = W * (portrait ? 0.11 : 0.065);
  const colW = W * (portrait ? 0.78 : 0.32);
  const maxBlock = H * (portrait ? 0.26 : 0.62);
  let size = portrait ? W * 0.086 : H * 0.074;
  let Q = flow(qWords, widths, sp, size, colW);
  let A = flow(aWords, widths, sp, size, colW);
  for (let guard = 0; guard < 12; guard++) {
    const tallest = Math.max(Q.lines, A.lines);
    if ((tallest - 1) * LEADING * size + size <= maxBlock) break;
    size *= 0.92;
    Q = flow(qWords, widths, sp, size, colW);
    A = flow(aWords, widths, sp, size, colW);
  }
  const blockH = (lines: number) => (lines - 1) * LEADING * size + size;
  const barH = H * (portrait ? 0.026 : 0.05);
  const shotW = portrait ? W * 0.78 : W * 0.52;
  const shotAspect = portrait ? Math.min(aspect, 1) : aspect;
  const imgH = Math.min(shotW / shotAspect, H * (portrait ? 0.42 : 0.7));
  const shotWFit = portrait ? shotW : imgH * shotAspect;
  const shotH = imgH + barH;
  const tallBlock = blockH(Math.max(Q.lines, A.lines));
  const gapY = H * 0.05;
  const groupTop = (H - (tallBlock + gapY + shotH)) / 2;
  const centerY = portrait ? groupTop + tallBlock / 2 : H * 0.5;
  const qTop = centerY - blockH(Q.lines) / 2;
  const aTop = centerY - blockH(A.lines) / 2;
  const shot = portrait
    ? {
        x: (W - shotWFit) / 2,
        y: groupTop + tallBlock + gapY,
        w: shotWFit,
        h: shotH,
      }
    : {
        x: W - W * 0.05 - shotWFit,
        y: (H - shotH) / 2,
        w: shotWFit,
        h: shotH,
      };
  const radius = Math.min(W, H) * 0.018;

  const SHOT_AT = 26 * k;
  const MORPH = 58 * k;

  const shotIn = spring({
    frame: t - SHOT_AT,
    fps,
    config: HEAVY,
  });
  const reveal = interpolate(t, [SHOT_AT, SHOT_AT + 18 * k], [0, 1], {
    ...CLAMP,
    easing: ENTER,
  });
  const drift = portrait ? 0 : (1 - shotIn) * W * 0.06;
  const rise = portrait ? (1 - shotIn) * H * 0.04 : 0;
  const imgScale = interpolate(t, [SHOT_AT, D], [1.08, 1], {
    ...CLAMP,
    easing: Easing.bezier(0.22, 1, 0.36, 1),
  });
  const groundIn = interpolate(t, [0, 14], [0, 1], {
    ...CLAMP,
    easing: ENTER,
  });

  const base = {
    position: "absolute" as const,
    left: 0,
    top: 0,
    fontFamily: onest.fontFamily,
    fontWeight: WGHT,
    fontSize: size,
    lineHeight: 1,
    letterSpacing: `${TRACK}em`,
    whiteSpace: "pre" as const,
    color: c.ink,
  };

  const spans: ReactNode[] = [];

  qWords.forEach((wd, i) => {
    const enter = interpolate(t, [i * 1.6 * k, i * 1.6 * k + 12 * k], [0, 1], {
      ...CLAMP,
      easing: ENTER,
    });
    const q = Q.placed[i];
    const j = aToB[i];
    if (j < 0) {
      const out = interpolate(t, [MORPH, MORPH + 8 * k], [0, 1], {
        ...CLAMP,
        easing: EXIT,
      });
      spans.push(
        <span
          key={`q${i.toString()}`}
          style={{
            ...base,
            opacity: enter * (1 - out),
            filter: out > 0 ? `blur(${out * size * 0.08}px)` : undefined,
            transform: `translate(${colX + q.x}px, ${qTop + q.y + (1 - enter) * size * 0.3 - out * size * 0.24}px)`,
          }}
        >
          {wd}
        </span>,
      );
      return;
    }
    const a = A.placed[j];
    const start = MORPH + 6 * k + j * 0.6 * k;
    const g = interpolate(t, [start, start + 20 * k], [0, 1], CLAMP);
    const gx = MOVE(interpolate(g, [0, 0.72], [0, 1], CLAMP));
    const gy = MOVE(interpolate(g, [0.28, 1], [0, 1], CLAMP));
    const x = colX + q.x + (a.x - q.x) * gx;
    const y = qTop + q.y + (aTop + a.y - qTop - q.y) * gy;
    const next = aWords[j];
    const same = next === wd;
    const swap = same ? 0 : interpolate(g, [0.25, 0.75], [0, 1], CLAMP);
    spans.push(
      <span
        key={`q${i.toString()}`}
        style={{
          ...base,
          opacity: enter * (1 - swap),
          transform: `translate(${x}px, ${y + (1 - enter) * size * 0.3}px)`,
        }}
      >
        {wd}
      </span>,
    );
    if (!same) {
      spans.push(
        <span
          key={`s${j.toString()}`}
          style={{
            ...base,
            opacity: swap,
            transform: `translate(${x}px, ${y}px)`,
          }}
        >
          {next}
        </span>,
      );
    }
  });

  aWords.forEach((wd, j) => {
    if (bToA[j] >= 0) return;
    const a = A.placed[j];
    const start = MORPH + 18 * k + j * 0.8 * k;
    const e = interpolate(t, [start, start + 14 * k], [0, 1], {
      ...CLAMP,
      easing: ENTER,
    });
    spans.push(
      <span
        key={`a${j.toString()}`}
        style={{
          ...base,
          color: hi,
          opacity: e,
          filter: e < 1 ? `blur(${(1 - e) * size * 0.08}px)` : undefined,
          transform: `translate(${colX + a.x}px, ${aTop + a.y + (1 - e) * size * 0.34}px)`,
        }}
      >
        {wd}
      </span>,
    );
  });

  const dotD = barH * 0.26;

  return (
    <AbsoluteFill
      style={{
        background: transparent ? "transparent" : (background ?? c.bg),
        overflow: "hidden",
      }}
    >
      {!transparent && background === undefined ? (
        <AbsoluteFill style={{ opacity: groundIn }}>
          <GshGround
            preset={ground ?? c.preset}
            params={groundParams}
            timeOffset={2.4}
            timeScale={0.4}
          />
          <AbsoluteFill
            style={{
              background: portrait
                ? c.scrim.replace("90deg", "180deg")
                : c.scrim,
            }}
          />
        </AbsoluteFill>
      ) : null}
      {spans}
      <div
        style={{
          position: "absolute",
          left: shot.x + drift,
          top: shot.y + rise,
          width: shot.w,
          height: shot.h,
          borderRadius: radius,
          overflow: "hidden",
          background: c.chrome,
          boxShadow: c.shadow,
          opacity: interpolate(reveal, [0, 0.25], [0, 1], CLAMP),
          transform: `scale(${0.97 + 0.03 * shotIn})`,
          transformOrigin: portrait ? "50% 100%" : "100% 50%",
          clipPath: portrait
            ? `inset(${(1 - reveal) * 100}% 0 0 0 round ${radius}px)`
            : `inset(0 0 0 ${(1 - reveal) * 100}% round ${radius}px)`,
        }}
      >
        <div
          style={{
            height: barH,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            fontFamily: mono.fontFamily,
            fontWeight: 400,
            fontSize: Math.max(barH * 0.42, H * 0.022 * (portrait ? 0.6 : 1)),
            color: c.chromeInk,
            letterSpacing: "0.01em",
          }}
        >
          <div
            style={{
              position: "absolute",
              left: barH * 0.5,
              top: 0,
              bottom: 0,
              display: "flex",
              alignItems: "center",
              gap: dotD * 0.8,
            }}
          >
            {[0, 1, 2].map((n) => (
              <span
                key={n}
                style={{
                  width: dotD,
                  height: dotD,
                  borderRadius: dotD,
                  background: c.dot,
                }}
              />
            ))}
          </div>
          {url}
        </div>
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: barH,
            bottom: 0,
            overflow: "hidden",
          }}
        >
          <Img
            src={image}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              transform: `scale(${imgScale})`,
            }}
          />
        </div>
      </div>
    </AbsoluteFill>
  );
}
