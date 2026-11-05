"use client";

import { loadFont } from "@remotion/google-fonts/InstrumentSans";
import {
  type CSSProperties,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
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
import { GshGround, gshParams } from "@/lib/remocn/gsh/gsh-ground";
import type { GshPresetId } from "@/lib/remocn/gsh/presets";

const sans = loadFont("normal", {
  weights: ["400"],
  subsets: ["latin"],
});

export interface WordGapMediaProps {
  before?: string;
  after?: string;
  images?: string[];
  aspects?: number[];
  captions?: string[];
  accent?: string;
  ink?: string;
  background?: string;
  theme?: "dark" | "light";
  ground?: GshPresetId;
  groundParams?: Partial<GradientParams>;
}

const LIGHT_GROUND: Partial<GradientParams> = {
  kind: "smear",
  background: "#efe8dc",
  colors: ["#f6b48c", "#f7d39a", "#eab3cc", "#cfdccf"],
  blur: 0.7,
  seed: 6,
  grain: 0.18,
};

const THEMES = {
  dark: {
    ink: "#f2f0fb",
    accent: "#3B5BFD",
    ground: "velvet-hour" as GshPresetId | undefined,
    groundParams: undefined as Partial<GradientParams> | undefined,
    groundOffset: 6,
    scrim: "4,4,14",
    scrimAlpha: 0.42,
    border: "rgba(255,255,255,0.14)",
    highlight: "inset 0 1px 0 rgba(255,255,255,0.18)",
    shadow:
      "0 1px 2px rgba(2,3,12,0.4), 0 12px 28px rgba(2,3,12,0.45), 0 48px 96px rgba(2,3,12,0.55)",
    base: "#141833",
  },
  light: {
    ink: "#1a1714",
    accent: "#f2552c",
    ground: undefined as GshPresetId | undefined,
    groundParams: LIGHT_GROUND as Partial<GradientParams> | undefined,
    groundOffset: 3,
    scrim: "244,238,228",
    scrimAlpha: 0.5,
    border: "rgba(40,28,16,0.10)",
    highlight: "inset 0 1px 0 rgba(255,255,255,0.35)",
    shadow:
      "0 1px 2px rgba(80,50,20,0.10), 0 10px 24px rgba(80,50,20,0.14), 0 40px 80px rgba(80,50,20,0.18)",
    base: "#e3dacb",
  },
};

const DEFAULT_IMAGES = [
  "templates/product-showcase/sculpture.jpg",
  "templates/product-showcase/gallery.jpg",
  "templates/product-showcase/workbench.jpg",
  "templates/product-showcase/courtyard.jpg",
];
const DEFAULT_ASPECTS = [0.8, 1.36, 1.0, 0.86];
const DEFAULT_CAPTIONS = ["Hero", "Gallery", "Detail", "Setting"];

const BEAT = {
  wordStep: 3,
  enter: 12,
  open: 24,
  dwell: [36, 30, 24],
  swapLen: 12,
  settleAfter: 18,
};

const TRACK = -0.035;
const FONT_PX = 200;
const ENTER = Easing.bezier(0.22, 1, 0.36, 1);
const WIPE = Easing.bezier(0.83, 0, 0.17, 1);
const LABEL_IN = Easing.bezier(0.32, 0.72, 0, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

type Measure = (s: string) => number;

function buildMeasure(_version: number): Measure {
  const ctx = document.createElement("canvas").getContext("2d");
  const cache: Record<string, number> = {};
  return (s: string) => {
    if (cache[s] === undefined) {
      if (!ctx) return s.length * 0.55;
      ctx.font = `400 ${FONT_PX}px "${sans.fontFamily}"`;
      cache[s] =
        ctx.measureText(s).width / FONT_PX + TRACK * Array.from(s).length;
    }
    return cache[s];
  };
}

function useMeasure() {
  const [version, setVersion] = useState(0);
  const [handle] = useState(() => delayRender("word-gap-media: measuring"));
  const released = useRef(false);
  useEffect(() => {
    let live = true;
    const bump = () => {
      if (live) setVersion((v) => v + 1);
    };
    document.fonts.addEventListener("loadingdone", bump);
    Promise.all([
      sans.waitUntilDone(),
      document.fonts.load(`400 100px "${sans.fontFamily}"`),
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
  return useMemo(() => buildMeasure(version), [version]);
}

function resolveSrc(src: string) {
  return /^(https?:|data:|\/)/.test(src) ? src : staticFile(src);
}

function Words({
  text,
  startAt,
  t,
  style,
}: {
  text: string;
  startAt: number;
  t: number;
  style: CSSProperties;
}) {
  const parts = text.split(" ").filter(Boolean);
  return (
    <div style={{ display: "flex", whiteSpace: "pre", ...style }}>
      {parts.map((w, i) => {
        const at = startAt + i * BEAT.wordStep - 4;
        const e = interpolate(t, [at, at + BEAT.enter], [0, 1], {
          ...CLAMP,
          easing: ENTER,
        });
        return (
          <span
            key={`${w}${i}`}
            style={{
              display: "inline-block",
              clipPath: "inset(-40% -20% -0.24em -20%)",
              marginRight: i < parts.length - 1 ? "0.24em" : 0,
            }}
          >
            <span
              style={{
                display: "inline-block",
                transform: `translateY(${((1 - e) * 0.7).toFixed(4)}em)`,
                opacity: e,
                filter:
                  e < 1 ? `blur(${((1 - e) * 6).toFixed(2)}px)` : undefined,
              }}
            >
              {w}
            </span>
          </span>
        );
      })}
    </div>
  );
}

export function WordGapMedia({
  before = "Launch all",
  after = "of this",
  images = DEFAULT_IMAGES,
  aspects = DEFAULT_ASPECTS,
  captions = DEFAULT_CAPTIONS,
  accent,
  ink,
  background,
  theme = "dark",
  ground,
  groundParams,
}: WordGapMediaProps) {
  const frame = useCurrentFrame();
  const { width: W, height: H, fps, durationInFrames } = useVideoConfig();
  const c = THEMES[theme];
  const inkC = ink ?? c.ink;
  const hi = accent ?? c.accent;
  const preset = ground ?? (groundParams ? undefined : c.ground);
  const gParams = groundParams ?? (ground ? undefined : c.groundParams);
  const bg = background ?? gshParams(preset, gParams).background;
  const m = useMeasure();
  const t = frame;
  const portrait = H > W * 1.1;

  const list = (images.length > 0 ? images : DEFAULT_IMAGES).slice(0, 4);
  const n = list.length;
  const aspectOf = (i: number) => aspects[i % Math.max(1, aspects.length)] ?? 1;
  const swapAt: number[] = [BEAT.open];
  for (let i = 1; i < n; i++) {
    swapAt.push(
      swapAt[i - 1] + BEAT.dwell[Math.min(i - 1, BEAT.dwell.length - 1)],
    );
  }
  const settleAt =
    n > 1 ? swapAt[n - 1] + BEAT.settleAfter : BEAT.open + BEAT.settleAfter;

  const open = Math.max(
    0,
    spring({
      frame: t - BEAT.open,
      fps,
      config: { mass: 0.8, damping: 18, stiffness: 160 },
    }),
  );
  const swapP = (i: number, tt: number) =>
    i === 0
      ? 1
      : interpolate(tt, [swapAt[i], swapAt[i] + BEAT.swapLen], [0, 1], {
          ...CLAMP,
          easing: WIPE,
        });
  const morphP = (i: number, tt: number) =>
    i === 0
      ? 1
      : spring({
          frame: tt - swapAt[i],
          fps,
          config: { damping: 200 },
          durationInFrames: 16,
        });
  const aspectAt = (tt: number) => {
    let a = aspectOf(0);
    for (let i = 1; i < n; i++) a += (aspectOf(i) - a) * morphP(i, tt);
    return a;
  };
  const settle = spring({
    frame: t - settleAt,
    fps,
    config: { mass: 0.5, damping: 12, stiffness: 200 },
  });
  const punchScale = t < settleAt ? 1 : 0.965 + 0.035 * settle;

  let content: React.ReactNode = <div />;
  if (m) {
    const marginX = W * (portrait ? 0.08 : 0.07);
    const room = W - marginX * 2;
    const maxAspect = Math.max(...list.map((_, i) => aspectOf(i)));
    const minAspect = Math.min(...list.map((_, i) => aspectOf(i)));
    const gapEm = 0.34;
    let F: number;
    let cardBase: number;
    if (portrait) {
      F = Math.min(W * 0.14, room / Math.max(m(before), m(after), 0.1));
      cardBase = Math.min(W * 0.72, H * 0.54 * minAspect);
    } else {
      cardBase = H * 0.5;
      const textW = m(before) + m(after) + gapEm * 2;
      F = Math.min(
        H * 0.13,
        (room - cardBase * maxAspect) / Math.max(0.1, textW),
      );
    }

    const a = aspectAt(t);
    const aPrev = aspectAt(t - 1);
    const cardW = portrait ? cardBase : cardBase * a;
    const cardH = portrait ? cardBase / a : cardBase;
    const slotMain = (portrait ? cardH : cardW) * open;
    const slotCross =
      (portrait ? cardW : cardH) * (0.55 + 0.45 * Math.min(1, open));
    const moveSpeed = Math.abs(a - aPrev) * cardBase;
    const wordBlur = Math.min(4, moveSpeed * 0.12);
    const gap = F * Math.max(0.12, gapEm * Math.min(1.1, open));

    const tilt = interpolate(t, [BEAT.open, durationInFrames], [-6, 3], CLAMP);
    const tiltX = interpolate(Math.min(1, open), [0, 1], [14, 2]);
    const R = cardBase * 0.055;
    const pad = cardBase * 0.045;

    const imgNodes = list.map((src, i) => {
      const r = swapP(i, t);
      const out = i < n - 1 ? swapP(i + 1, t) : 0;
      if (r <= 0 || out >= 1) return null;
      const life = interpolate(t, [swapAt[i], swapAt[i] + 60], [1.12, 1.02], {
        ...CLAMP,
        easing: LABEL_IN,
      });
      const speed = i > 0 ? Math.abs(r - swapP(i, t - 1)) : 0;
      return (
        <div
          key={`img${i}`}
          style={{
            position: "absolute",
            inset: 0,
            clipPath:
              i === 0
                ? undefined
                : `inset(0 0 0 ${((1 - r) * 100).toFixed(2)}%)`,
            transform: `translateX(${(-out * 24).toFixed(2)}%)`,
          }}
        >
          <Img
            src={resolveSrc(src)}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              transform: `scale(${(life + (1 - r) * 0.12).toFixed(4)})`,
              filter: `brightness(${(1 - out * 0.45).toFixed(3)})${speed > 0.02 ? ` blur(${Math.min(5, speed * 40).toFixed(2)}px)` : ""}`,
            }}
          />
        </div>
      );
    });

    const barsIn = interpolate(t, [BEAT.open + 6, BEAT.open + 18], [0, 1], {
      ...CLAMP,
      easing: LABEL_IN,
    });
    const barH = Math.max(3, cardBase * 0.008);
    const bars = (
      <div
        style={{
          position: "absolute",
          left: pad,
          right: pad,
          top: pad,
          display: "flex",
          gap: barH * 1.6,
          opacity: barsIn,
          transform: `translateY(${((1 - barsIn) * -pad * 0.6).toFixed(2)}px)`,
        }}
      >
        {list.map((_, i) => {
          const from = swapAt[i];
          const to = i < n - 1 ? swapAt[i + 1] : settleAt;
          const fill = interpolate(t, [from, to], [0, 1], CLAMP);
          return (
            <div
              key={`bar${i}`}
              style={{
                flex: 1,
                height: barH,
                borderRadius: barH,
                background: "rgba(255,255,255,0.32)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${(fill * 100).toFixed(2)}%`,
                  height: "100%",
                  background: "rgba(255,255,255,0.95)",
                }}
              />
            </div>
          );
        })}
      </div>
    );

    const capFont = Math.max(H * 0.026, cardBase * 0.06);
    const capNodes = list.map((_, i) => {
      const label = captions[i % Math.max(1, captions.length)] ?? "";
      const inAt = i === 0 ? BEAT.open + 9 : swapAt[i] + 4;
      const e = interpolate(t, [inAt, inAt + 12], [0, 1], {
        ...CLAMP,
        easing: LABEL_IN,
      });
      const x =
        i < n - 1
          ? interpolate(t, [swapAt[i + 1], swapAt[i + 1] + 8], [0, 1], {
              ...CLAMP,
              easing: Easing.bezier(0.55, 0, 1, 0.45),
            })
          : 0;
      if (e <= 0 || x >= 1) return null;
      return (
        <div
          key={`cap${i}`}
          style={{
            position: "absolute",
            left: pad * 1.1,
            bottom: pad * 1.15,
            fontFamily: sans.fontFamily,
            fontWeight: 400,
            fontSize: capFont,
            lineHeight: 1,
            letterSpacing: "-0.01em",
            color: "rgba(255,255,255,0.96)",
            whiteSpace: "pre",
            clipPath: "inset(-20% -10% -20% -10%)",
            opacity: e * (1 - x),
            transform: `translateY(${((1 - e) * capFont * 0.8 - x * capFont * 0.6).toFixed(2)}px)`,
          }}
        >
          {label}
        </div>
      );
    });

    const btnD = Math.max(H * 0.062, cardBase * 0.14);
    const btnIn = spring({
      frame: t - (BEAT.open + 12),
      fps,
      config: { mass: 0.5, damping: 12, stiffness: 200 },
    });
    const armed = interpolate(t - settleAt, [0, 6], [0, 1], {
      ...CLAMP,
      easing: LABEL_IN,
    });
    const btnScale = btnIn * (t < settleAt ? 1 : 0.88 + 0.12 * settle);
    const borderHit = interpolate(t - settleAt, [0, 4, 20], [0, 1, 0.4], CLAMP);

    const card = (
      <div
        style={{
          position: "relative",
          width: portrait ? slotCross : slotMain,
          height: portrait ? slotMain : slotCross,
          flexShrink: 0,
          margin: portrait ? `${gap}px 0` : `0 ${gap}px`,
          transform: `perspective(${(H * 2).toFixed(0)}px) rotateY(${tilt.toFixed(2)}deg) rotateX(${tiltX.toFixed(2)}deg) scale(${punchScale.toFixed(4)})`,
          opacity: open > 0.001 ? 1 : 0,
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: R,
            overflow: "hidden",
            boxShadow: c.shadow,
            background: c.base,
          }}
        >
          {imgNodes}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(180deg, rgba(0,0,0,0.32) 0%, rgba(0,0,0,0) 22%, rgba(0,0,0,0) 62%, rgba(0,0,0,0.42) 100%)",
            }}
          />
          {bars}
          {capNodes}
          <div
            style={{
              position: "absolute",
              right: pad,
              bottom: pad * 0.8,
              width: btnD,
              height: btnD,
              borderRadius: btnD,
              background: `color-mix(in oklab, ${hi} ${(armed * 100).toFixed(1)}%, rgba(255,255,255,0.2))`,
              backdropFilter: "blur(14px)",
              boxShadow: `inset 0 0 0 1px rgba(255,255,255,${(0.38 - 0.2 * armed).toFixed(3)}), 0 ${(btnD * 0.16).toFixed(1)}px ${(btnD * 0.4).toFixed(1)}px rgba(0,0,0,${(0.12 + 0.18 * armed).toFixed(3)})`,
              transform: `scale(${btnScale.toFixed(4)})`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg
              viewBox="0 0 24 24"
              width={btnD * 0.4}
              height={btnD * 0.4}
              aria-hidden
            >
              <path
                d="M8.5 6.2v11.6c0 .6.6.9 1.1.6l9-5.8c.5-.3.5-.9 0-1.2l-9-5.8c-.5-.3-1.1 0-1.1.6z"
                fill="#ffffff"
              />
            </svg>
          </div>
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: R,
              boxShadow: `inset 0 0 0 1px ${borderHit > 0.01 ? `color-mix(in oklab, ${hi} ${(borderHit * 100).toFixed(0)}%, ${c.border})` : c.border}, ${c.highlight}`,
            }}
          />
        </div>
      </div>
    );

    const textStyle: CSSProperties = {
      fontFamily: sans.fontFamily,
      fontWeight: 400,
      fontSize: F,
      lineHeight: 1,
      letterSpacing: `${TRACK}em`,
      color: inkC,
      filter: wordBlur > 0.1 ? `blur(${wordBlur.toFixed(2)}px)` : undefined,
    };
    const afterStart = before.split(" ").filter(Boolean).length * BEAT.wordStep;
    const push = interpolate(frame, [0, durationInFrames], [1, 1.035], CLAMP);

    content = (
      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: portrait ? "column" : "row",
          alignItems: "center",
          justifyContent: "center",
          transform: `scale(${push.toFixed(5)})`,
        }}
      >
        <Words text={before} startAt={0} t={t} style={textStyle} />
        {card}
        <Words text={after} startAt={afterStart} t={t} style={textStyle} />
      </AbsoluteFill>
    );
  }

  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      <GshGround
        preset={preset}
        params={gParams}
        timeOffset={c.groundOffset}
        timeScale={0.6}
      />
      <AbsoluteFill
        style={{
          background: `radial-gradient(${portrait ? "80% 50%" : "62% 56%"} at 50% 50%, rgba(${c.scrim},${c.scrimAlpha}) 0%, rgba(${c.scrim},0) 100%)`,
        }}
      />
      {content}
    </AbsoluteFill>
  );
}

export default WordGapMedia;
