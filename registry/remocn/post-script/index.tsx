"use client";

import { loadFont } from "@remotion/google-fonts/Lexend";
import { useEffect, useRef, useState } from "react";
import {
  AbsoluteFill,
  continueRender,
  delayRender,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const lexend = loadFont("normal", {
  weights: ["300", "400", "500"],
  subsets: ["latin"],
});

export interface PostScriptProps {
  signoff?: string;
  signature?: string;
  label?: string;
  ps?: string;
  install?: string;
  accent?: string;
  background?: string;
  speed?: number;
  theme?: "dark" | "light";
}

const THEMES = {
  dark: { bg: "#E8392B", ink: "#FFFFFF", accent: "#0A0A0A" },
  light: { bg: "#FFFFFF", ink: "#0A0A0A", accent: "#E8392B" },
} as const;

const TRACK = -0.03;
const SMALL_TRACK = -0.01;
const LH = 1.08;
const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_IO = Easing.bezier(0.65, 0, 0.35, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

interface Spec {
  text: string;
  weight: number;
}

function useWidths(specs: Spec[]) {
  const key = specs.map((s) => `${s.weight}|${s.text}`).join("\u0001");
  const [state, setState] = useState<{
    key: string;
    w: Record<string, number>;
  } | null>(null);
  const [handle] = useState(() => delayRender("post-script: measuring"));
  const released = useRef(false);
  const ref = useRef(specs);
  ref.current = specs;
  useEffect(() => {
    let live = true;
    const weights = Array.from(new Set(ref.current.map((s) => s.weight)));
    Promise.all([
      lexend.waitUntilDone(),
      ...weights.map((wt) =>
        document.fonts.load(`${wt} 100px "${lexend.fontFamily}"`),
      ),
    ])
      .catch(() => undefined)
      .then(() => {
        if (!live) return;
        const ctx = document.createElement("canvas").getContext("2d");
        const w: Record<string, number> = {};
        for (const s of ref.current) {
          const k = `${s.weight}|${s.text}`;
          if (ctx) {
            ctx.font = `${s.weight} 100px "${lexend.fontFamily}"`;
            w[k] = ctx.measureText(s.text).width / 100;
          } else {
            w[k] = s.text.length * 0.56;
          }
        }
        setState({ key, w });
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

function greedy(
  words: string[],
  adv: (s: string) => number,
  space: number,
  maxEm: number,
) {
  const lines: string[][] = [];
  let line: string[] = [];
  let x = 0;
  for (const word of words) {
    const w = adv(word);
    if (line.length > 0 && x + space + w > maxEm) {
      lines.push(line);
      line = [word];
      x = w;
    } else {
      x += (line.length > 0 ? space : 0) + w;
      line.push(word);
    }
  }
  if (line.length > 0) lines.push(line);
  return lines;
}

function balanced(
  words: string[],
  adv: (s: string) => number,
  space: number,
  maxEm: number,
) {
  const base = greedy(words, adv, space, maxEm);
  if (base.length <= 1) return base;
  let lo = 0;
  let hi = maxEm;
  for (let k = 0; k < 24; k++) {
    const mid = (lo + hi) / 2;
    if (greedy(words, adv, space, mid).length <= base.length) hi = mid;
    else lo = mid;
  }
  return greedy(words, adv, space, hi);
}

const splitWords = (s: string) => s.split(/\s+/).filter(Boolean);

export function PostScript({
  signoff = "Thanks for watching.",
  signature = "— the remocn team",
  label = "P.S.",
  ps = "The next launch film is yours.",
  install = "npx shadcn add @remocn/zoom-blur",
  accent,
  background,
  speed = 1,
  theme = "dark",
}: PostScriptProps) {
  const t = useCurrentFrame() * speed;
  const { width: W, height: H, durationInFrames } = useVideoConfig();
  const Tt = durationInFrames * speed;
  const c = THEMES[theme];
  const hi = accent ?? c.accent;
  const stage =
    background === "transparent" ? "transparent" : (background ?? c.bg);

  const soWords = splitWords(signoff);
  const psWords = [label, ...splitWords(ps)].filter(Boolean);
  const w = useWidths([
    { text: " ", weight: 500 },
    ...soWords.map((text) => ({ text, weight: 500 })),
    ...psWords.map((text) => ({ text, weight: 500 })),
    { text: signature, weight: 300 },
    { text: install, weight: 400 },
  ]);

  if (!w) {
    return (
      <div style={{ position: "absolute", inset: 0, background: stage }} />
    );
  }

  const adv = (s: string) =>
    (w[`500|${s}`] ?? s.length * 0.56) + TRACK * Array.from(s).length;
  const space = w["500| "] ?? 0.25;
  const smallW = (s: string, wt: number) =>
    (w[`${wt}|${s}`] ?? s.length * 0.56) + SMALL_TRACK * Array.from(s).length;

  const portrait = H > W * 1.1;
  const maxW = W * (portrait ? 0.86 : 0.8);
  const mB = H * (portrait ? 0.2 : 0.1);
  let fS = portrait ? W * 0.044 : H * 0.044;
  const fitSmall = Math.min(
    maxW / Math.max(0.01, smallW(signature, 300)),
    maxW / Math.max(0.01, smallW(install, 400)),
  );
  fS = Math.min(fS, fitSmall);
  const fI = fS;
  const sB = 0.46;

  let fB = portrait ? W * 0.145 : H * 0.165;
  let soLines = balanced(soWords, adv, space, maxW / fB);
  let psLines = balanced(psWords, adv, space, maxW / fB);
  const layout = (size: number) => {
    const soH = soLines.length * LH * size;
    const sigH = signature ? LH * fS : 0;
    const gapSig = signature ? size * 0.3 : 0;
    const blockH = soH + gapSig + sigH;
    const psH = psLines.length * LH * size;
    const installH = install ? LH * fI : 0;
    const sA = (fS * 1.12) / size;
    const totalA = blockH + size * 0.42 + psH * sA;
    const totalB =
      installH + (install ? size * 0.34 : 0) + psH + size * 0.4 + blockH * sB;
    return { soH, sigH, gapSig, blockH, psH, installH, sA, totalA, totalB };
  };
  const limit = H - mB - H * (portrait ? 0.14 : 0.08);
  for (let k = 0; k < 80; k++) {
    const L = layout(fB);
    if (
      soLines.length <= 3 &&
      psLines.length <= 3 &&
      L.totalA <= limit &&
      L.totalB <= limit
    )
      break;
    fB *= 0.96;
    soLines = balanced(soWords, adv, space, maxW / fB);
    psLines = balanced(psWords, adv, space, maxW / fB);
  }
  const L = layout(fB);

  const psBottomA = H - mB;
  const psTopA = psBottomA - L.psH * L.sA;
  const soTopA = psTopA - fB * 0.42 - L.blockH;
  const installTop = H - mB - L.installH;
  const psBottomB = install ? installTop - fB * 0.34 : H - mB;
  const psTopB = psBottomB - L.psH;
  const soTopB = psTopB - fB * 0.4 - L.blockH * sB;

  const soStart = 4;
  const soStagger = 3;
  const sigAt = soStart + soWords.length * soStagger + 8;
  const psAt = sigAt + (signature ? 14 : 0);
  const flipAt = Math.max(psAt + 24, Math.min(Tt * 0.36, psAt + 48));
  const flipDur = 30;
  const installAt = flipAt + flipDur - 2;

  const p = interpolate(t, [flipAt, flipAt + flipDur], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const lerp = (a: number, b: number) => a + (b - a) * p;

  const soTop = lerp(soTopA, soTopB);
  const soScale = lerp(1, sB);
  const soDim = lerp(1, 0.7);
  const psTop = lerp(psTopA, psTopB);
  const psScale = lerp(L.sA, 1);

  const rise = (start: number, dur = 18) =>
    interpolate(t, [start, start + dur], [0, 1], {
      ...CLAMP,
      easing: EASE_OUT,
    });

  let soIndex = 0;
  const soNodes = soLines.map((line, li) => (
    <div
      key={`so${li}`}
      style={{
        position: "absolute",
        left: 0,
        width: W,
        top: li * LH * fB,
        height: LH * fB,
        lineHeight: `${LH * fB}px`,
        fontSize: fB,
        textAlign: "center",
        whiteSpace: "pre",
        letterSpacing: `${TRACK}em`,
        fontWeight: 500,
        color: c.ink,
      }}
    >
      {line.map((word, wi) => {
        const e = rise(soStart + soIndex * soStagger);
        soIndex++;
        return (
          <span key={`sw${wi}`}>
            {wi > 0 ? " " : ""}
            <span
              style={{
                display: "inline-block",
                opacity: e,
                transform: `translateY(${((1 - e) * fB * 0.32).toFixed(2)}px)`,
              }}
            >
              {word}
            </span>
          </span>
        );
      })}
    </div>
  ));

  const sigE = rise(sigAt, 16);
  const psE = rise(psAt, 16);

  let psIndex = 0;
  const psNodes = psLines.map((line, li) => (
    <div
      key={`ps${li}`}
      style={{
        position: "absolute",
        left: 0,
        width: W,
        top: li * LH * fB,
        height: LH * fB,
        lineHeight: `${LH * fB}px`,
        fontSize: fB,
        textAlign: "center",
        whiteSpace: "pre",
        letterSpacing: `${TRACK}em`,
        fontWeight: 500,
      }}
    >
      {line.map((word, wi) => {
        const isLabel = psIndex === 0 && label !== "";
        psIndex++;
        return (
          <span key={`pw${wi}`}>
            {wi > 0 ? " " : ""}
            <span
              style={{
                color: isLabel ? hi : c.ink,
                fontWeight: isLabel ? 400 : 500,
              }}
            >
              {word}
            </span>
          </span>
        );
      })}
    </div>
  ));

  const wipe = interpolate(t, [installAt, installAt + 22], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });

  return (
    <AbsoluteFill
      style={{
        background: stage,
        overflow: "hidden",
        fontFamily: lexend.fontFamily,
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: W,
          height: L.blockH,
          transform: `translateY(${soTop.toFixed(2)}px) scale(${soScale.toFixed(4)})`,
          transformOrigin: `${W / 2}px 0px`,
          opacity: soDim,
        }}
      >
        {soNodes}
        {signature ? (
          <div
            style={{
              position: "absolute",
              left: 0,
              width: W,
              top: L.soH + L.gapSig,
              height: L.sigH,
              lineHeight: `${L.sigH}px`,
              fontSize: fS,
              fontWeight: 300,
              textAlign: "center",
              whiteSpace: "pre",
              letterSpacing: `${SMALL_TRACK}em`,
              color: c.ink,
              opacity: sigE,
              transform: `translateY(${((1 - sigE) * fS * 0.5).toFixed(2)}px)`,
            }}
          >
            {signature}
          </div>
        ) : null}
      </div>
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: W,
          height: L.psH,
          transform: `translateY(${(psTop + (1 - psE) * fS * 0.6).toFixed(2)}px) scale(${psScale.toFixed(4)})`,
          transformOrigin: `${W / 2}px 0px`,
          opacity: psE,
        }}
      >
        {psNodes}
      </div>
      {install ? (
        <div
          style={{
            position: "absolute",
            left: 0,
            width: W,
            top: installTop,
            height: L.installH,
            lineHeight: `${L.installH}px`,
            fontSize: fI,
            fontWeight: 400,
            textAlign: "center",
            whiteSpace: "pre",
            letterSpacing: `${SMALL_TRACK}em`,
            color: hi,
          }}
        >
          <span
            style={{
              display: "inline-block",
              clipPath: `inset(-20% ${((1 - wipe) * 100).toFixed(2)}% -20% 0)`,
              transform: `translateX(${((1 - wipe) * -fI * 0.6).toFixed(2)}px)`,
            }}
          >
            {install}
          </span>
        </div>
      ) : null}
    </AbsoluteFill>
  );
}
