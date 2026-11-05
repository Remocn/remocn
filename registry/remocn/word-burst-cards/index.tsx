"use client";

import { loadFont as loadHanken } from "@remotion/google-fonts/HankenGrotesk";
import { loadFont as loadManrope } from "@remotion/google-fonts/Manrope";
import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import {
  AbsoluteFill,
  continueRender,
  delayRender,
  Easing,
  Img,
  interpolate,
  random,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { GradientParams } from "@/lib/remocn/gsh/gradient-engine";
import { GshGround, gshParams } from "@/lib/remocn/gsh/gsh-ground";
import type { GshPresetId } from "@/lib/remocn/gsh/presets";

const hanken = loadHanken("normal", {
  weights: ["300", "400"],
  subsets: ["latin"],
});
const manrope = loadManrope("normal", {
  weights: ["600"],
  subsets: ["latin"],
});

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

export interface WordBurstCardsProps {
  line?: string;
  caption?: string;
  images?: string[];
  accent?: string;
  ink?: string;
  theme?: "dark" | "light";
  ground?: GshPresetId;
  groundParams?: Partial<GradientParams>;
  reverse?: boolean;
  burstAt?: number;
  showLogo?: boolean;
  seed?: number;
}

const DEFAULT_IMAGES = [
  "reel/reel-1.jpg",
  "templates/product-showcase/sculpture.jpg",
  "reel/reel-4.jpg",
  "templates/brand-guidelines/chair.jpg",
  "templates/launch-anything/earth.jpg",
  "templates/product-showcase/courtyard.jpg",
  "reel/reel-6.jpg",
  "templates/brand-guidelines/materials.jpg",
];

const LIGHT_GROUND: Partial<GradientParams> = {
  kind: "mist",
  background: "#f2efe9",
  colors: ["#f9e6ee", "#f4eccb", "#dfe3f7", "#f2efe9"],
  blur: 0.85,
  warp: 0.4,
  seed: 11,
  grain: 0.18,
};

const THEMES = {
  dark: {
    ink: "#f3f1ec",
    muted: "rgba(243,241,236,0.6)",
    accent: "#5a78ff",
    card: "rgba(22,22,30,0.94)",
    bar: "rgba(255,255,255,0.16)",
    barStrong: "rgba(255,255,255,0.42)",
    ground: "earthshine" as GshPresetId | undefined,
    groundParams: undefined as Partial<GradientParams> | undefined,
    groundOffset: 4,
    scrim: "3,4,10",
    scrimAlpha: 0.5,
    shadow:
      "0 1px 2px rgba(0,0,0,0.35), 0 12px 28px rgba(0,0,0,0.34), 0 34px 80px rgba(0,0,0,0.4)",
    hairline:
      "inset 0 0 0 1px rgba(255,255,255,0.09), inset 0 1px 0 rgba(255,255,255,0.07)",
  },
  light: {
    ink: "#17171b",
    muted: "rgba(23,23,27,0.55)",
    accent: "#2f5bff",
    card: "#ffffff",
    bar: "rgba(23,23,27,0.1)",
    barStrong: "rgba(23,23,27,0.34)",
    ground: undefined as GshPresetId | undefined,
    groundParams: LIGHT_GROUND as Partial<GradientParams> | undefined,
    groundOffset: 3,
    scrim: "242,239,233",
    scrimAlpha: 0.3,
    shadow:
      "0 1px 2px rgba(30,24,20,0.07), 0 10px 24px rgba(30,24,20,0.09), 0 30px 70px rgba(30,24,20,0.13)",
    hairline: "inset 0 0 0 1px rgba(0,0,0,0.06)",
  },
};

const BEAT = {
  lineIn: -6,
  burst: 30,
  wordGap: 4,
  letterGap: 0.5,
  logo: 60,
  caption: 66,
};

const FONT_PX = 200;
const TRACK = -0.03;
const FOCAL = 1000;
const RISE = Easing.bezier(0.32, 0.72, 0, 1);
const CAMERA = Easing.bezier(0.87, 0, 0.13, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;
const BURST = { mass: 0.9, damping: 22, stiffness: 90 };
const LAND = { mass: 0.8, damping: 18, stiffness: 160 };

type Measure = (s: string) => number;

function buildMeasure(_version: number): Measure {
  const ctx = document.createElement("canvas").getContext("2d");
  const cache: Record<string, number> = {};
  return (s: string) => {
    if (cache[s] === undefined) {
      if (!ctx) return s.length * 0.52;
      ctx.font = `400 ${FONT_PX}px "${hanken.fontFamily}"`;
      cache[s] =
        ctx.measureText(s).width / FONT_PX +
        TRACK * Math.max(0, Array.from(s).length - 1);
    }
    return cache[s];
  };
}

function useMeasure() {
  const [version, setVersion] = useState(0);
  const [handle] = useState(() => delayRender("word-burst-cards: fonts"));
  const released = useRef(false);
  useEffect(() => {
    let live = true;
    const bump = () => {
      if (live) setVersion((v) => v + 1);
    };
    document.fonts.addEventListener("loadingdone", bump);
    Promise.all([
      hanken.waitUntilDone(),
      manrope.waitUntilDone(),
      document.fonts.load(`400 100px "${hanken.fontFamily}"`),
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

const resolveSrc = (src: string) =>
  /^(https?:|data:|\/)/.test(src) ? src : staticFile(src);

type Kind = "img" | "toggle" | "progress" | "profile" | "play" | "chart";
const KINDS: Kind[] = [
  "img",
  "toggle",
  "img",
  "progress",
  "img",
  "profile",
  "img",
  "play",
  "img",
  "chart",
];

interface Glyph {
  ch: string;
  x: number;
  y: number;
  w: number;
  word: number;
  tb: number;
}

interface CardSpec {
  glyph: number;
  kind: Kind;
  img: number;
  w: number;
  h: number;
  tx: number;
  ty: number;
  tz: number;
  ry: number;
  rx: number;
  rz: number;
  dz: number;
  dx: number;
  dy: number;
}

function CardBody({
  kind,
  w,
  h,
  img,
  accent,
  t,
}: {
  kind: Kind;
  w: number;
  h: number;
  img: string;
  accent: string;
  t: (typeof THEMES)["dark"];
}) {
  if (kind === "img") {
    return (
      <Img
        src={img}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          display: "block",
        }}
      />
    );
  }
  const u = Math.min(w, h) / 10;
  const bar = (width: string, strong = false) => (
    <div
      style={{
        height: u * 0.75,
        width,
        borderRadius: u,
        background: strong ? t.barStrong : t.bar,
      }}
    />
  );
  const pad = u * 1.4;
  const wrap = (children: ReactNode) => (
    <div
      style={{
        position: "absolute",
        inset: 0,
        padding: pad,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: t.card,
      }}
    >
      {children}
    </div>
  );
  if (kind === "toggle") {
    return wrap(
      <>
        {bar("55%", true)}
        <div style={{ display: "flex", alignItems: "center", gap: u }}>
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              gap: u * 0.7,
            }}
          >
            {bar("80%")}
            {bar("50%")}
          </div>
          <div
            style={{
              width: u * 3.6,
              height: u * 2,
              borderRadius: u * 2,
              background: accent,
              position: "relative",
            }}
          >
            <div
              style={{
                position: "absolute",
                right: u * 0.25,
                top: u * 0.25,
                width: u * 1.5,
                height: u * 1.5,
                borderRadius: u * 2,
                background: "#ffffff",
              }}
            />
          </div>
        </div>
      </>,
    );
  }
  if (kind === "progress") {
    return wrap(
      <>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          {bar("45%", true)}
          {bar("18%")}
        </div>
        <div
          style={{
            height: u * 0.9,
            borderRadius: u,
            background: t.bar,
            overflow: "hidden",
          }}
        >
          <div style={{ width: "64%", height: "100%", background: accent }} />
        </div>
      </>,
    );
  }
  if (kind === "profile") {
    return wrap(
      <>
        <div style={{ display: "flex", alignItems: "center", gap: u }}>
          <div
            style={{
              width: u * 3,
              height: u * 3,
              borderRadius: u * 3,
              overflow: "hidden",
              flexShrink: 0,
            }}
          >
            <Img
              src={img}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </div>
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              gap: u * 0.6,
            }}
          >
            {bar("70%", true)}
            {bar("45%")}
          </div>
        </div>
        {bar("90%")}
      </>,
    );
  }
  if (kind === "play") {
    return wrap(
      <>
        <div
          style={{
            width: u * 3.2,
            height: u * 3.2,
            borderRadius: u * 3.2,
            background: accent,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg width={u * 1.6} height={u * 1.6} viewBox="0 0 24 24" aria-hidden>
            <path d="M8 5.5v13l10.5-6.5z" fill="#ffffff" />
          </svg>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: u * 0.6 }}>
          {bar("75%", true)}
          {bar("40%")}
        </div>
      </>,
    );
  }
  return wrap(
    <>
      {bar("40%", true)}
      <svg
        viewBox="0 0 100 40"
        width="100%"
        height={h * 0.42}
        preserveAspectRatio="none"
        aria-hidden
      >
        <path
          d="M0 34 C 14 30, 20 22, 32 24 S 52 12, 64 15 S 84 4, 100 6"
          fill="none"
          stroke={accent}
          strokeWidth={2.2}
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </>,
  );
}

export function WordBurstCards({
  line = "Every screen you built, in motion",
  caption = "Launch films from your product",
  images = DEFAULT_IMAGES,
  accent,
  ink,
  theme = "dark",
  ground,
  groundParams,
  reverse = false,
  burstAt = BEAT.burst,
  showLogo = true,
  seed = 3,
}: WordBurstCardsProps) {
  const frame = useCurrentFrame();
  const { width: W, height: H, fps, durationInFrames } = useVideoConfig();
  const c = THEMES[theme];
  const inkC = ink ?? c.ink;
  const hi = accent ?? c.accent;
  const preset = ground ?? (groundParams ? undefined : c.ground);
  const gParams = groundParams ?? (ground ? undefined : c.groundParams);
  const bg = gshParams(preset, gParams).background;
  const portrait = H > W * 1.1;
  const m = useMeasure();
  const pics = (images.length > 0 ? images : DEFAULT_IMAGES).map(resolveSrc);
  const tt = reverse ? durationInFrames - 1 - frame : frame;
  const logoAt = burstAt + (BEAT.logo - BEAT.burst);
  const captionAt = burstAt + (BEAT.caption - BEAT.burst);

  let content: ReactNode = <div />;
  if (m) {
    const words = line.split(" ").filter((w) => w.length > 0);
    const maxW = (portrait ? 0.84 : 0.8) * W;
    const maxLines = portrait ? 4 : 2;
    let size = portrait ? W * 0.17 : H * 0.2;
    let rows: string[][] = [];
    for (let k = 0; k < 30; k++) {
      rows = [];
      let cur: string[] = [];
      for (const w of words) {
        const next = [...cur, w];
        if (cur.length > 0 && m(next.join(" ")) * size > maxW) {
          rows.push(cur);
          cur = [w];
        } else {
          cur = next;
        }
      }
      if (cur.length > 0) rows.push(cur);
      const fits = rows.every((r) => m(r.join(" ")) * size <= maxW);
      if (rows.length <= maxLines && fits) break;
      size *= 0.93;
    }
    const LH = size * 1.08;
    const cx = W / 2;
    const cy = H / 2;
    const top = cy - (rows.length * LH) / 2;
    const glyphs: Glyph[] = [];
    let wi = 0;
    rows.forEach((r, ri) => {
      const text = r.join(" ");
      const x0 = cx - (m(text) * size) / 2;
      const y = top + LH * (ri + 0.5);
      let inWord = 0;
      Array.from(text).forEach((ch, i) => {
        if (ch === " ") {
          wi++;
          inWord = 0;
          return;
        }
        const pre = text.slice(0, i);
        const xL = x0 + (i === 0 ? 0 : m(pre) + TRACK) * size;
        const w = (m(ch) - TRACK) * size;
        glyphs.push({
          ch,
          x: xL,
          y,
          w,
          word: wi,
          tb: burstAt + wi * BEAT.wordGap + inWord * BEAT.letterGap,
        });
        inWord++;
      });
      wi++;
    });

    let r = 0;
    const rnd = () => random(`wbc-${seed}-${r++}`);
    const unit = portrait ? W * 0.15 : H * 0.15;
    const cards: CardSpec[] = glyphs.map((g, gi) => {
      const kind = KINDS[(gi + seed) % KINDS.length];
      const aspect =
        kind === "img" ? [1.32, 0.8, 1.0, 1.5][Math.floor(rnd() * 4)] : 1.45;
      const base = unit * (0.85 + rnd() * 0.45);
      const w = aspect >= 1 ? base * Math.sqrt(aspect) : base * aspect;
      const h = w / aspect;
      const gx = g.x + g.w / 2 - cx;
      const gy = g.y - cy;
      const golden = gi * 2.39996 + seed;
      const toward = Math.atan2(gy * 1.6, gx);
      const ang =
        Math.atan2(
          Math.sin(golden) * 0.7 + Math.sin(toward) * 0.3,
          Math.cos(golden) * 0.7 + Math.cos(toward) * 0.3,
        ) +
        (rnd() - 0.5) * 0.3;
      const rx = (portrait ? 0.36 : 0.4) * W;
      const ry = (portrait ? 0.34 : 0.36) * H;
      const rad = 0.66 + rnd() * 0.44;
      const tz = -520 + rnd() * 680;
      const back = (FOCAL - tz) / FOCAL;
      let sx = Math.cos(ang) * rx * rad;
      let sy = Math.sin(ang) * ry * rad;
      const ps = FOCAL / (FOCAL - tz);
      const cw = (portrait ? W * 0.4 : W * 0.25) + (w * ps) / 2;
      const ch = (portrait ? H * 0.14 : H * 0.17) + (h * ps) / 2;
      if (Math.abs(sx) < cw && Math.abs(sy) < ch) {
        const k = Math.min(
          cw / Math.max(1, Math.abs(sx)),
          ch / Math.max(1, Math.abs(sy)),
        );
        sx *= k;
        sy *= k;
      }
      return {
        glyph: gi,
        kind,
        img: Math.floor(rnd() * pics.length),
        w,
        h,
        tx: sx * back,
        ty: sy * back,
        tz,
        ry: (rnd() - 0.5) * 36,
        rx: (rnd() - 0.5) * 24,
        rz: (rnd() - 0.5) * 10,
        dz: 0.4 + rnd() * 0.6,
        dx: (rnd() - 0.5) * 0.5,
        dy: (rnd() - 0.5) * 0.4,
      };
    });

    const persp = (z: number) => FOCAL / (FOCAL - z);
    const cardAt = (cs: CardSpec, t: number) => {
      const g = glyphs[cs.glyph];
      const d = t - g.tb;
      const p = spring({ frame: d, fps, config: BURST });
      const life = Math.max(0, d);
      const z = cs.tz * p + cs.dz * life * p;
      const s = persp(z);
      const gx = g.x + g.w / 2 - cx;
      const gy = g.y - cy;
      const wx = gx + (cs.tx - gx) * p + cs.dx * life * p;
      const wy = gy + (cs.ty - gy) * p + cs.dy * life * p;
      return { p, z, s, x: cx + wx * s, y: cy + wy * s, d };
    };

    const lineIn = (wIdx: number) =>
      reverse
        ? 1
        : interpolate(tt - BEAT.lineIn - wIdx * 2, [0, 12], [0, 1], {
            ...CLAMP,
            easing: RISE,
          });

    const letterEls = glyphs.map((g, gi) => {
      const d = tt - g.tb;
      const out = interpolate(d, [0, 4], [0, 1], CLAMP);
      if (out >= 1) return null;
      const rise = lineIn(g.word);
      return (
        <div
          key={`g${gi}`}
          style={{
            position: "absolute",
            left: g.x,
            top: g.y - LH / 2,
            height: LH,
            overflow: "hidden",
            display: "flex",
            alignItems: "center",
          }}
        >
          <div
            style={{
              fontFamily: hanken.fontFamily,
              fontWeight: 400,
              fontSize: size,
              lineHeight: 1,
              whiteSpace: "pre",
              color: inkC,
              opacity: (1 - out) * Math.min(1, rise * 1.4),
              transform: `translateY(${((1 - rise) * LH * 0.9).toFixed(2)}px) scale(${(1 + out * 0.15).toFixed(4)})`,
              filter:
                out > 0.01 ? `blur(${(out * 4).toFixed(2)}px)` : undefined,
            }}
          >
            {g.ch}
          </div>
        </div>
      );
    });

    const drawn = cards
      .map((cs) => ({ cs, a: cardAt(cs, tt), b: cardAt(cs, tt - 1) }))
      .filter(({ a }) => a.d >= 0)
      .sort((u, v) => u.a.z - v.a.z);

    const cardEls = drawn.map(({ cs, a, b }) => {
      const g = glyphs[cs.glyph];
      const grow = interpolate(a.d, [0, 10], [0, 1], {
        ...CLAMP,
        easing: RISE,
      });
      const from = Math.max(g.w / cs.w, (size * 0.72) / cs.h);
      const sc = (from + (1 - from) * grow) * a.s;
      const vel = Math.hypot(a.x - b.x, a.y - b.y);
      const depthBlur = Math.max(0, -a.z - 120) * 0.008;
      const blur = Math.min(9, depthBlur + Math.max(0, vel - 6) * 0.14);
      const op =
        interpolate(a.d, [0, 3], [0, 1], CLAMP) *
        interpolate(a.z, [-560, -200], [0.55, 1], CLAMP);
      const tilt = 1 - a.p * 0.6;
      return (
        <div
          key={`c${cs.glyph}`}
          style={{
            position: "absolute",
            left: a.x - cs.w / 2,
            top: a.y - cs.h / 2,
            width: cs.w,
            height: cs.h,
            transform: `perspective(900px) rotateX(${(cs.rx * tilt).toFixed(2)}deg) rotateY(${(cs.ry * tilt).toFixed(2)}deg) rotateZ(${(cs.rz * a.p).toFixed(2)}deg) scale(${sc.toFixed(4)})`,
            opacity: op,
            filter: blur > 0.3 ? `blur(${blur.toFixed(2)}px)` : undefined,
            borderRadius: Math.min(cs.w, cs.h) * 0.1,
            overflow: "hidden",
            boxShadow: `${c.shadow}, ${c.hairline}`,
            background: c.card,
          }}
        >
          <CardBody
            kind={cs.kind}
            w={cs.w}
            h={cs.h}
            img={pics[cs.img]}
            accent={hi}
            t={c}
          />
        </div>
      );
    });

    const logoSize = portrait ? W * 0.15 : H * 0.14;
    const capSize = Math.max(H * 0.026, logoSize * 0.3);
    const logoP = spring({ frame: tt - logoAt, fps, config: LAND });
    const capP = interpolate(tt - captionAt, [0, 12], [0, 1], {
      ...CLAMP,
      easing: RISE,
    });
    const centre = showLogo ? (
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: cy - logoSize * 0.75,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: logoSize * 0.32,
          zIndex: 50,
        }}
      >
        <div
          style={{
            overflow: "hidden",
            padding: `${logoSize * 0.1}px ${logoSize * 0.2}px`,
          }}
        >
          <div
            style={{
              transform: `translateY(${((1 - logoP) * logoSize * 1.3).toFixed(2)}px)`,
              opacity: Math.min(1, logoP * 2),
            }}
          >
            <RemocnLogo fontSize={logoSize} color={inkC} />
          </div>
        </div>
        <div
          style={{
            fontFamily: hanken.fontFamily,
            fontWeight: 300,
            fontSize: capSize,
            letterSpacing: "-0.01em",
            color: c.muted,
            whiteSpace: "pre",
            opacity: capP,
            transform: `translateY(${((1 - capP) * capSize * 0.8).toFixed(2)}px)`,
          }}
        >
          {caption}
        </div>
      </div>
    ) : null;

    const push = interpolate(frame, [0, durationInFrames], [1, 1.035], {
      ...CLAMP,
      easing: CAMERA,
    });
    content = (
      <AbsoluteFill
        style={{
          transform: `scale(${push.toFixed(5)})`,
          transformOrigin: "50% 50%",
        }}
      >
        {cardEls}
        {letterEls}
        {centre}
      </AbsoluteFill>
    );
  }

  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      <GshGround
        preset={preset}
        params={gParams}
        timeOffset={c.groundOffset}
        timeScale={0.5}
      />
      <AbsoluteFill
        style={{
          background: `radial-gradient(${portrait ? "95% 50%" : "70% 60%"} at 50% 50%, rgba(${c.scrim},${c.scrimAlpha}) 0%, rgba(${c.scrim},0) 100%)`,
        }}
      />
      {content}
    </AbsoluteFill>
  );
}

export default WordBurstCards;
