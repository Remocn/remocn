"use client";

import { loadFont as loadManrope } from "@remotion/google-fonts/Manrope";
import { loadFont } from "@remotion/google-fonts/SchibstedGrotesk";
import type React from "react";
import { useMemo } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  interpolateColors,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { GradientParams } from "@/lib/remocn/gsh/gradient-engine";
import { GshGround } from "@/lib/remocn/gsh/gsh-ground";
import type { GshPresetId } from "@/lib/remocn/gsh/presets";

const { fontFamily: grotesk } = loadFont("normal", {
  weights: ["400"],
  subsets: ["latin"],
});
const manrope = loadManrope("normal", {
  weights: ["600"],
  subsets: ["latin"],
});

export interface QueryCascadeProps {
  queries?: string[];
  hero?: string;
  term?: string;
  answerBefore?: string;
  answerAfter?: string;
  showLogo?: boolean;
  accent?: string;
  theme?: "dark" | "light";
  ground?: GshPresetId;
  groundParams?: Partial<GradientParams>;
  speed?: number;
}

const REMOCN_R_PATH =
  "M 0.01 0.81 C 0.01 1.73, 0.36 2.79, 1.09 4.13 C 4.91 11.04, 13.45 17.16, 21.7 18.9 C 22.94 19.16, 23.18 19.16, 51.39 19.27 C 76.07 19.36, 80.02 19.4, 81.32 19.57 C 89.89 20.69, 96.2 24.68, 99.38 31.01 C 103.19 38.56, 102.53 50.1, 97.91 57.07 C 94.66 61.96, 89.68 64.99, 83.26 66 C 82.81 66.07, 70.18 66.83, 55.2 67.69 C 24.82 69.43, 27.03 69.23, 24.18 70.4 C 19.9 72.15, 14.84 75.7, 10.65 79.89 C 4.86 85.68, 1.3 91.91, 0.25 98.13 C 0.12 98.85, 0.08 103.13, 0.04 116.66 L 0 134.26 9.5 134.26 L 19 134.26 19.05 119.41 C 19.1 103.27, 19.08 103.82, 19.82 101.04 C 21.79 93.65, 27.86 88.75, 36.45 87.63 C 37.23 87.53, 39.41 87.5, 43.57 87.53 C 50.12 87.59, 50.75 87.65, 53.22 88.45 C 56.61 89.56, 59.67 91.86, 62.02 95.07 C 62.52 95.76, 69.35 103.85, 77.2 113.07 C 85.04 122.28, 91.63 130.04, 91.85 130.32 C 92.07 130.59, 92.5 131.34, 92.82 131.97 C 93.52 133.35, 94.11 133.93, 95.06 134.13 C 95.5 134.23, 98.97 134.26, 106.36 134.23 L 117.01 134.19 100.82 113.07 C 91.91 101.45, 84.52 91.78, 84.39 91.57 C 83.36 89.89, 83.66 87.53, 85.09 86 C 85.79 85.25, 86.36 84.94, 88.07 84.38 C 96.18 81.72, 104.15 76.62, 109.97 70.36 C 120.59 58.93, 124.06 44.32, 119.44 30.43 C 114.59 15.81, 101.93 4.02, 87.64 0.83 C 83.93 0.01, 88.09 0.08, 41.85 0.04 L 0.01 0 0.01 0.81 Z";
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
const ADV = [
  254, 240, 353, 654, 564, 850, 686, 199, 309, 309, 443, 635, 265, 488, 280,
  444, 611, 343, 572, 576, 584, 580, 595, 531, 579, 594, 280, 268, 635, 635,
  635, 529, 885, 700, 645, 703, 697, 585, 561, 718, 720, 354, 536, 660, 545,
  868, 729, 770, 615, 770, 633, 613, 644, 673, 678, 935, 652, 623, 595, 310,
  444, 310, 635, 500, 500, 551, 589, 551, 589, 573, 341, 555, 567, 242, 272,
  552, 262, 873, 581, 597, 590, 590, 401, 513, 340, 581, 554, 812, 559, 548,
  504, 327, 239, 327, 635,
];
const HERO_TRACK = -0.025;
const BASELINE = 0.8594;

const QUERIES = [
  "launch video ideas",
  "how long should a launch video be",
  "launch video in a day",
  "product demo video template",
  "best saas launch videos",
  "how to animate text in react",
  "launch video music no copyright",
  "make a demo video fast",
  "motion design for developers",
  "how to cut a video to the beat",
  "product hunt launch video",
  "launch trailer for an app",
  "motion graphics without after effects",
  "how to make a product video",
  "launch video script",
  "animated logo reveal",
  "how to record a screen demo",
  "launch video for developers",
  "kinetic typography in react",
  "launch video checklist",
  "how to make an explainer video",
  "best launch videos 2026",
  "launch video examples",
  "react video components",
  "how to make a teaser video",
  "launch video before friday",
  "video templates for startups",
  "how to make a launch film",
  "launch video in an afternoon",
  "how to edit a launch video",
  "product launch video cost",
  "launch video with code",
  "how to make a launch video fast",
  "launch video templates free",
  "how to make a launch video in react",
  "launch video for a startup",
  "launch video length",
  "launch video agency",
  "how to make a launch video with ai",
];
const HERO_FROM_END = 6;
const LIGHT_GROUND: Partial<GradientParams> = {
  kind: "mist",
  colors: ["#EE8550", "#F5C29C", "#F2E4D6", "#5E1E12"],
  background: "#F2EEE8",
  speed: 0.8,
  loopSeconds: 14,
  scale: 0.8,
  warp: 0.4,
  blur: 0.65,
  grain: 0.3,
  seed: 6,
};

const THEMES = {
  dark: {
    base: "#0A0302",
    scrim:
      "radial-gradient(70% 55% at 50% 46%, rgba(10,3,2,0.78) 0%, rgba(10,3,2,0.5) 70%, rgba(10,3,2,0.3) 100%)",
    fg: "#F4F1EC",
    term: "#FFB27A",
    field: "rgba(20,14,12,0.92)",
    fieldDepth:
      "inset 0 1px 0 rgba(255,255,255,0.06), 0 0 0 1px rgba(255,255,255,0.09), 0 24px 50px -18px rgba(0,0,0,0.8)",
    icon: "#8F8780",
    keyRing: "rgba(255,255,255,0.14)",
  },
  light: {
    base: "#F2EEE8",
    scrim:
      "radial-gradient(70% 55% at 50% 46%, rgba(246,243,238,0.72) 0%, rgba(246,243,238,0.3) 100%)",
    fg: "#17120F",
    term: "#C2410C",
    field: "rgba(255,255,255,0.95)",
    fieldDepth:
      "0 0 0 1px rgba(40,24,12,0.07), 0 1px 3px rgba(40,24,12,0.05), 0 24px 50px -20px rgba(90,40,10,0.25)",
    icon: "#857B73",
    keyRing: "rgba(40,24,12,0.16)",
  },
} as const;

const EASE_OUT = Easing.bezier(0.32, 0.72, 0, 1);
const EASE_IO = Easing.bezier(0.65, 0, 0.35, 1);
const EXIT = Easing.bezier(0.55, 0, 1, 0.45);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;
const CHIP = { mass: 0.5, damping: 12, stiffness: 200 };
const STOP = 54;
const GROW = [42, 68] as const;
const CLEAR = [40, 62] as const;
const TINT = [72, 88] as const;
const RULE = [78, 96] as const;
const RESOLVE = 104;
const LOGO_IN = 132;

function width(text: string) {
  let x = 0;
  for (const ch of text) {
    const code = ch.charCodeAt(0);
    x += (code >= 32 && code < 127 ? ADV[code - 32] : 560) / 1000 + HERO_TRACK;
  }
  return x;
}
function split(q: string, term: string) {
  if (!term) return [{ text: q, hit: false }];
  const parts: { text: string; hit: boolean }[] = [];
  let rest = q;
  for (;;) {
    const at = rest.indexOf(term);
    if (at < 0) break;
    if (at > 0) parts.push({ text: rest.slice(0, at), hit: false });
    parts.push({ text: term, hit: true });
    rest = rest.slice(at + term.length);
  }
  if (rest) parts.push({ text: rest, hit: false });
  return parts;
}

export function QueryCascade({
  queries = QUERIES,
  hero = "how to make a launch video",
  term = "launch video",
  answerBefore = "Your",
  answerAfter = "is ready.",
  showLogo = true,
  theme = "dark",
  ground,
  groundParams,
  speed = 1,
}: QueryCascadeProps) {
  const t = useCurrentFrame() * speed;
  const { width: W, height: H, fps } = useVideoConfig();
  const tall = H > W;
  const u = tall ? W / 1000 : H / 720;
  const c = THEMES[theme];
  const dark = theme === "dark";
  const resolvedGround: GshPresetId | undefined =
    ground ?? (groundParams ? undefined : dark ? "ember" : undefined);
  const resolvedParams = groundParams ?? (dark ? undefined : LIGHT_GROUND);

  const list = useMemo(() => {
    const at = Math.max(0, queries.length - HERO_FROM_END + 1);
    return [...queries.slice(0, at), hero, ...queries.slice(at)];
  }, [queries, hero]);
  const K = list.indexOf(hero);

  const widest = Math.max(...list.map(width));
  const f = Math.min(50 * u, (W * (tall ? 0.76 : 0.84)) / widest);
  const pitch = 76 * u;
  const s0 = H / 2 / pitch + 0.6;
  const scroll = (x: number) => {
    const p = Math.min(1, Math.max(0, x / STOP));
    return s0 + (K - s0) * (1 - (1 - p) ** 3.2);
  };
  const s = scroll(t);
  const vel = Math.abs(scroll(t + 0.5) - scroll(t - 0.5)) * pitch;
  const smear = Math.min(110 * u, vel * 0.6);
  const taps = smear < 1.5 ? 1 : Math.min(28, Math.ceil(smear / (2 * u)) + 1);
  const tapOffsets = Array.from({ length: taps }, (_, j) =>
    taps === 1 ? 0 : (j / (taps - 1) - 0.5) * smear,
  );
  const tapOpacity = taps === 1 ? 1 : Math.min(1, 2.4 / taps);
  const termAt = hero.indexOf(term);
  const qLeft = termAt >= 0 ? hero.slice(0, termAt) : hero;
  const qRight = termAt >= 0 ? hero.slice(termAt + term.length) : "";
  const wTerm = width(term);
  const totalQ = width(qLeft) + wTerm + width(qRight);
  const aLeft = answerBefore ? `${answerBefore} ` : "";
  const aRight = answerAfter ? ` ${answerAfter}` : "";
  const totalA = width(aLeft) + wTerm + width(aRight);
  const Fh = Math.min(
    (tall ? 96 : 80) * u,
    (W * (tall ? 0.6 : 0.58)) / Math.max(totalQ, totalA),
  );

  const grow = interpolate(t, [GROW[0], GROW[1]], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const fs = f + (Fh - f) * grow;
  const clear = interpolate(t, [CLEAR[0], CLEAR[1]], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const tint = interpolate(t, [TINT[0], TINT[1]], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const rule = interpolate(t, [RULE[0], RULE[1]], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const move = interpolate(t, [RESOLVE + 2, RESOLVE + 24], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const leave = interpolate(t, [RESOLVE, RESOLVE + 12], [0, 1], {
    ...CLAMP,
    easing: EXIT,
  });
  const logoIn = interpolate(t, [LOGO_IN, LOGO_IN + 16], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });

  const cx = W / 2;
  const heroY = H / 2 + (K - s) * pitch + fs * 0.27 - grow * 18 * u;
  const termQ = -totalQ / 2 + width(qLeft);
  const termA = -totalA / 2 + width(aLeft);
  const termX = termQ + (termA - termQ) * move;

  const dim = theme === "dark" ? 0.42 : 0.5;
  const heroBright = interpolate(t, [32, 54], [dim, 1], CLAMP);
  const heroEdge = Math.min(
    1,
    Math.max(0, Math.min(heroY, H - heroY) / (H * 0.3)),
  );

  const fieldIn = spring({
    frame: t - (STOP - 10),
    fps,
    config: { mass: 0.8, damping: 18, stiffness: 160 },
  });
  const fieldOut = interpolate(t, [RESOLVE - 4, RESOLVE + 6], [0, 1], {
    ...CLAMP,
    easing: EXIT,
  });
  const fieldVis = Math.min(1, fieldIn * 1.4) * (1 - fieldOut);
  const fieldH = fs * 1.9;
  const iconS = fs * 0.62;
  const keyS = fs * 0.92;
  const fieldW = totalQ * fs + fs * 2.0 + iconS + keyS + fs * 0.5;
  const enter = Math.max(
    0,
    spring({ frame: t - (RESOLVE - 12), fps, config: CHIP }) -
      spring({ frame: t - (RESOLVE - 5), fps, config: CHIP }),
  );
  const fieldLeft = cx - (totalQ * fs) / 2 - fs * 0.5 - iconS - fs * 0.8;

  const textStyle = {
    position: "absolute" as const,
    whiteSpace: "pre" as const,
    lineHeight: 1,
    fontFamily: grotesk,
    fontWeight: 400,
  };

  const word = (
    text: string,
    x: number,
    anchorRight: boolean,
    opacity: number,
    extra?: React.CSSProperties,
  ) =>
    opacity > 0.001 ? (
      <div
        style={{
          ...textStyle,
          left: cx + x * fs,
          top: heroY - fs * BASELINE,
          fontSize: fs,
          letterSpacing: `${HERO_TRACK}em`,
          color: c.fg,
          opacity,
          transform: anchorRight ? "translateX(-100%)" : undefined,
          ...extra,
        }}
      >
        {text}
      </div>
    ) : null;
  const arrive = (d: number) =>
    interpolate(t, [RESOLVE + 10 + d, RESOLVE + 26 + d], [0, 1], {
      ...CLAMP,
      easing: EASE_OUT,
    });
  const before = arrive(0);
  const after = arrive(5);

  return (
    <AbsoluteFill style={{ background: c.base, overflow: "hidden" }}>
      <GshGround
        preset={resolvedGround}
        params={resolvedParams}
        timeOffset={dark ? 4 : 2}
        timeScale={0.45}
      />
      <AbsoluteFill style={{ background: c.scrim }} />
      {clear < 1 ? (
        <div
          style={{
            position: "absolute",
            inset: 0,
            filter: taps > 1 ? `blur(${1.2 * u}px)` : undefined,
            WebkitMaskImage:
              "linear-gradient(180deg, transparent 0%, #000 30%, #000 70%, transparent 100%)",
            maskImage:
              "linear-gradient(180deg, transparent 0%, #000 30%, #000 70%, transparent 100%)",
          }}
        >
          {list.map((q, i) => {
            if (i === K) return null;
            const y0 = H / 2 + (i - s) * pitch;
            const spread = (i - K) * pitch * clear * 1.4;
            const y = y0 + spread;
            if (y < -pitch - smear || y > H + pitch + smear) return null;
            return tapOffsets.map((o) => (
              <div
                key={`${i}-${o.toFixed(2)}`}
                style={{
                  ...textStyle,
                  left: 0,
                  right: 0,
                  top: y + o + f * 0.27 - f * BASELINE,
                  textAlign: "center",
                  fontSize: f,
                  letterSpacing: "-0.015em",
                  color: c.fg,
                  opacity: (1 - clear) * tapOpacity,
                }}
              >
                {split(q, term).map((p, j) => (
                  <span
                    key={`${j}-${p.text}`}
                    style={{ opacity: p.hit ? 0.78 : dim }}
                  >
                    {p.text}
                  </span>
                ))}
              </div>
            ));
          })}
        </div>
      ) : null}
      {fieldVis > 0.001 ? (
        <div
          style={{
            position: "absolute",
            left: fieldLeft,
            top: heroY - fs * 0.3 - fieldH / 2,
            width: fieldW,
            height: fieldH,
            borderRadius: fieldH / 2,
            background: c.field,
            boxShadow: c.fieldDepth,
            opacity: fieldVis,
            transform: `scale(${0.94 + 0.06 * fieldIn - 0.02 * fieldOut})`,
          }}
        >
          <svg
            viewBox="0 0 24 24"
            width={iconS}
            height={iconS}
            style={{
              position: "absolute",
              left: fs * 0.8,
              top: (fieldH - iconS) / 2,
            }}
            aria-hidden
          >
            <g
              fill="none"
              stroke={c.icon}
              strokeWidth={1.5}
              strokeLinecap="round"
            >
              <circle cx="10.5" cy="10.5" r="6.5" />
              <path d="m15.5 15.5 5 5" />
            </g>
          </svg>
          <div
            style={{
              position: "absolute",
              right: fs * 0.55,
              top: (fieldH - keyS) / 2,
              width: keyS,
              height: keyS,
              borderRadius: keyS * 0.26,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: interpolateColors(
                enter,
                [0, 1],
                [dark ? "rgba(255,255,255,0.04)" : "#F7F4F0", c.term],
              ),
              boxShadow: `inset 0 0 0 1px ${c.keyRing}`,
              transform: `scale(${1 - enter * 0.04})`,
            }}
          >
            <svg
              viewBox="0 0 24 24"
              width={keyS * 0.56}
              height={keyS * 0.56}
              aria-hidden
            >
              <path
                d="M19 5.5v6a3 3 0 0 1-3 3H5.5m4-4-4 4 4 4"
                fill="none"
                stroke={interpolateColors(
                  enter,
                  [0, 1],
                  [c.icon, dark ? "#1A0E06" : "#FFFFFF"],
                )}
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
      ) : null}

      {tapOffsets.map((o) => (
        <div
          key={o.toFixed(2)}
          style={{
            position: "absolute",
            inset: 0,
            opacity: heroEdge * tapOpacity,
            transform: o ? `translateY(${o}px)` : undefined,
          }}
        >
          {word(qLeft, termX, true, heroBright * (1 - leave), {
            filter: leave > 0 ? `blur(${leave * 10 * u}px)` : undefined,
            transform: `translateX(calc(-100% - ${leave * 30 * u}px))`,
          })}
          {word(qRight, termX + wTerm, false, heroBright * (1 - leave), {
            filter: leave > 0 ? `blur(${leave * 10 * u}px)` : undefined,
            transform: `translateX(${leave * 30 * u}px)`,
          })}
          {word(aLeft, termX, true, before, {
            filter: before < 1 ? `blur(${(1 - before) * 10 * u}px)` : undefined,
            transform: `translateX(calc(-100% + ${(1 - before) * -24 * u}px))`,
          })}
          {word(aRight, termX + wTerm, false, after, {
            filter: after < 1 ? `blur(${(1 - after) * 10 * u}px)` : undefined,
            transform: `translateX(${(1 - after) * 24 * u}px)`,
          })}
          <div
            style={{
              ...textStyle,
              left: cx + termX * fs,
              top: heroY - fs * BASELINE,
              fontSize: fs,
              letterSpacing: `${HERO_TRACK}em`,
              color: interpolateColors(tint, [0, 1], [c.fg, c.term]),
              opacity: Math.max(heroBright, tint),
            }}
          >
            {term}
          </div>
          <div
            style={{
              position: "absolute",
              left: cx + termX * fs,
              top: heroY + fs * 0.16,
              width: wTerm * fs,
              height: Math.max(2, fs * 0.05),
              borderRadius: 99,
              background: c.term,
              transform: `scaleX(${rule})`,
              transformOrigin: "0 50%",
            }}
          />
        </div>
      ))}

      {showLogo && logoIn > 0 ? (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: heroY + Fh * 0.9,
            display: "flex",
            justifyContent: "center",
            opacity: logoIn,
            transform: `translateY(${(1 - logoIn) * 10 * u}px)`,
          }}
        >
          <RemocnLogo fontSize={26 * u} color={c.fg} />
        </div>
      ) : null}
    </AbsoluteFill>
  );
}
