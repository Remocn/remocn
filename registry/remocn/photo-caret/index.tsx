"use client";

import { loadFont as loadFigtree } from "@remotion/google-fonts/Figtree";
import { loadFont as loadSerif } from "@remotion/google-fonts/InstrumentSerif";
import { useEffect, useMemo, useRef, useState } from "react";
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

const figtree = loadFigtree("normal", {
  weights: ["400"],
  subsets: ["latin"],
});
const serif = loadSerif("italic", { weights: ["400"], subsets: ["latin"] });

export interface PhotoCaretProps {
  text?: string;
  accentWord?: string;
  src?: string;
  images?: string[];
  accent?: string;
  ink?: string;
  theme?: "dark" | "light";
  ground?: GshPresetId;
  groundParams?: Partial<GradientParams>;
  firstStep?: number;
}

const LIGHT_GROUND: Partial<GradientParams> = {
  kind: "mist",
  background: "#ecebe8",
  colors: ["#ffffff", "#f7f6f3", "#dcdcdf", "#c4c6cf"],
  blur: 0.8,
  warp: 0.3,
  seed: 4,
  grain: 0.16,
};

const THEMES = {
  dark: {
    ink: "#f4f2ee",
    accent: "#a3b2ff",
    ground: "riptide" as GshPresetId | undefined,
    groundParams: undefined as Partial<GradientParams> | undefined,
    groundOffset: 5,
    scrim: "4,5,12",
    scrimAlpha: 0.55,
    border: "rgba(255,255,255,0.16)",
    shadow:
      "0 1px 2px rgba(1,2,8,0.45), 0 10px 24px rgba(1,2,8,0.45), 0 36px 72px rgba(1,2,8,0.5)",
  },
  light: {
    ink: "#151515",
    accent: "#3B5BFD",
    ground: undefined as GshPresetId | undefined,
    groundParams: LIGHT_GROUND as Partial<GradientParams> | undefined,
    groundOffset: 2,
    scrim: "240,239,236",
    scrimAlpha: 0.5,
    border: "rgba(20,20,24,0.08)",
    shadow:
      "0 1px 2px rgba(30,30,40,0.12), 0 8px 20px rgba(30,30,40,0.12), 0 28px 56px rgba(30,30,40,0.14)",
  },
};

const DEFAULT_IMAGES = [
  "templates/brand-guidelines/chair.jpg",
  "templates/product-showcase/sculpture.jpg",
  "templates/launch-anything/desk.jpg",
  "templates/brand-guidelines/materials.jpg",
  "templates/product-showcase/courtyard.jpg",
  "templates/product-showcase/gallery.jpg",
  "reel/reel-4.jpg",
];

const BEAT = {
  intro: 12,
  decay: 0.88,
  minStep: 6,
  breath: 9,
  reveal: 8,
  settle: 12,
  hold: 45,
};

const FONT_PX = 200;
const TRACK = -0.03;
const SERIF_SCALE = 1.14;
const LH = 1.08;
const TILE_H = 1.15;
const TILE_W = 0.86;
const STAGGER = [0.62, 0, 1];
const TYPE_IN = Easing.bezier(0.32, 0.72, 0, 1);
const PUSH = Easing.bezier(0.87, 0, 0.13, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;
const CAMERA = { mass: 1, damping: 26, stiffness: 120 };
const CARD = { mass: 0.8, damping: 18, stiffness: 160 };
const CHIP = { mass: 0.5, damping: 12, stiffness: 200 };

interface Metrics {
  width: (s: string, accent: boolean) => number;
  cap: number;
}

function buildMetrics(_version: number): Metrics {
  const ctx = document.createElement("canvas").getContext("2d");
  const sansFont = `400 ${FONT_PX}px "${figtree.fontFamily}"`;
  const serifFont = `italic 400 ${FONT_PX * SERIF_SCALE}px "${serif.fontFamily}"`;
  const cache: Record<string, number> = {};
  let cap = 0.7;
  if (ctx) {
    ctx.font = sansFont;
    const box = ctx.measureText("H").actualBoundingBoxAscent / FONT_PX;
    if (box > 0.3) cap = box;
  }
  return {
    width: (s: string, accent: boolean) => {
      const k = `${accent ? 1 : 0}${s}`;
      if (cache[k] === undefined) {
        if (!ctx) return s.length * 0.52;
        ctx.font = accent ? serifFont : sansFont;
        const track = accent ? 0 : TRACK * Array.from(s).length;
        cache[k] = ctx.measureText(s).width / FONT_PX + track;
      }
      return cache[k];
    },
    cap,
  };
}

function useMetrics() {
  const [version, setVersion] = useState(0);
  const [handle] = useState(() => delayRender("photo-caret: measuring"));
  const released = useRef(false);
  useEffect(() => {
    let live = true;
    const bump = () => {
      if (live) setVersion((v) => v + 1);
    };
    document.fonts.addEventListener("loadingdone", bump);
    Promise.all([
      figtree.waitUntilDone(),
      serif.waitUntilDone(),
      document.fonts.load(`400 ${FONT_PX}px "${figtree.fontFamily}"`),
      document.fonts.load(`italic 400 ${FONT_PX}px "${serif.fontFamily}"`),
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
  return useMemo(() => buildMetrics(version), [version]);
}

const parseLines = (text: string) =>
  text
    .split("/")
    .map((l) => l.trim().split(/\s+/).filter(Boolean))
    .filter((l) => l.length > 0);

const hopTimes = (count: number, firstStep: number) => {
  const out: number[] = [];
  let t = BEAT.intro;
  for (let k = 0; k < count; k++) {
    if (k === count - 1) t += BEAT.breath;
    out.push(t);
    const g = Math.max(
      BEAT.minStep,
      Math.round((firstStep * BEAT.decay ** k) / 3) * 3,
    );
    t += g;
  }
  return out;
};

export const photoCaretLength = (
  text = "Your launch, / your name / on it.",
  firstStep = 12,
) => {
  const n = parseLines(text).flat().length;
  const hops = hopTimes(n, firstStep);
  return hops[hops.length - 1] + BEAT.settle + BEAT.hold;
};

type Sat = { x: number; y: number; s: number; far: boolean; r: number };

const SATS_WIDE: Sat[] = [
  { x: 0.065, y: 0.22, s: 0.17, far: false, r: -3 },
  { x: 0.27, y: 0.87, s: 0.16, far: false, r: 2 },
  { x: 0.92, y: 0.64, s: 0.2, far: false, r: 3 },
  { x: 0.42, y: 0.06, s: 0.17, far: true, r: 0 },
  { x: 0.74, y: 0.95, s: 0.18, far: true, r: 0 },
  { x: 0.04, y: 0.66, s: 0.2, far: true, r: 0 },
  { x: 0.96, y: 0.18, s: 0.18, far: true, r: 0 },
];

const SATS_TALL: Sat[] = [
  { x: 0.2, y: 0.17, s: 0.15, far: false, r: -3 },
  { x: 0.78, y: 0.8, s: 0.17, far: false, r: 3 },
  { x: 0.24, y: 0.86, s: 0.12, far: false, r: 2 },
  { x: 0.66, y: 0.08, s: 0.12, far: true, r: 0 },
  { x: 0.92, y: 0.26, s: 0.12, far: true, r: 0 },
  { x: 0.06, y: 0.7, s: 0.12, far: true, r: 0 },
  { x: 0.56, y: 0.95, s: 0.11, far: true, r: 0 },
];

export function PhotoCaret({
  text = "Your launch, / your name / on it.",
  accentWord = "it.",
  src,
  images,
  accent,
  ink,
  theme = "dark",
  ground,
  groundParams,
  firstStep = 12,
}: PhotoCaretProps) {
  const frame = useCurrentFrame();
  const { width: W, height: H, fps } = useVideoConfig();
  const c = THEMES[theme];
  const inkC = ink ?? c.ink;
  const hi = accent ?? c.accent;
  const preset = ground ?? (groundParams ? undefined : c.ground);
  const gParams = groundParams ?? (ground ? undefined : c.groundParams);
  const bg = gshParams(preset, gParams).background;
  const portrait = H > W * 1.1;
  const m = useMetrics();
  const tileSrc = src ?? staticFile("templates/brand-guidelines/ceramics.jpg");
  const satSrc = (images ?? DEFAULT_IMAGES.map((p) => staticFile(p))).filter(
    Boolean,
  );

  const lines = useMemo(() => parseLines(text), [text]);

  const layout = useMemo(() => {
    const space = m.width(" ", false) + 0.02;
    const rows = lines.map((ws) => {
      const widths = ws.map((w) => m.width(w, w === accentWord));
      const total = widths.reduce((a, b) => a + b, 0) + space * (ws.length - 1);
      return { ws, widths, total };
    });
    const maxW = Math.max(...rows.map((r) => r.total));
    const parkGap = 0.24;
    const spanW = portrait ? maxW : maxW + parkGap + TILE_W;
    const spanH = rows.length * LH + (portrait ? TILE_H + 0.5 : 0.3);
    const F = portrait
      ? Math.min((W * 0.84) / spanW, (H * 0.42) / spanH)
      : Math.min((W * 0.7) / spanW, (H * 0.68) / spanH);
    const cap = m.cap * F;
    const words: {
      text: string;
      accent: boolean;
      x: number;
      w: number;
      base: number;
      line: number;
    }[] = [];
    rows.forEach((r, li) => {
      const ox = (maxW - r.total) * STAGGER[li % STAGGER.length] * F;
      let x = ox;
      r.ws.forEach((w, wi) => {
        words.push({
          text: w,
          accent: w === accentWord,
          x,
          w: r.widths[wi] * F,
          base: li * LH * F,
          line: li,
        });
        x += (r.widths[wi] + space) * F;
      });
    });
    const tw = TILE_W * F;
    const th = TILE_H * F;
    const slotY = (base: number) => base - cap * 0.42 - th / 2;
    const slots = words.map((w) => ({ x: w.x, y: slotY(w.base) }));
    const park = portrait
      ? { x: maxW * F - tw, y: -cap - 0.34 * F - th }
      : { x: maxW * F + parkGap * F, y: slotY(0) - cap * 0.35 };
    slots.push(park);
    const minY = Math.min(park.y, -cap - 0.04 * F);
    const maxY = (rows.length - 1) * LH * F + 0.06 * F;
    const right = Math.max(maxW * F, park.x + tw);
    const cx = right / 2;
    const cy = (minY + maxY) / 2;
    return {
      F,
      cap,
      tw,
      th,
      cx,
      cy,
      words,
      slots,
      bbox: { x0: 0, x1: right, y0: minY, y1: maxY },
    };
  }, [m, lines, accentWord, portrait, W, H]);

  const { F, cap, tw, th, words, slots } = layout;
  const n = words.length;
  const hops = useMemo(() => hopTimes(n, firstStep), [n, firstStep]);
  const payoff = hops[n - 1];

  const states = useMemo(() => {
    const out: { cx: number; cy: number; s: number }[] = [];
    for (let k = 0; k <= n; k++) {
      let x0 = slots[k].x;
      let x1 = slots[k].x + tw;
      let y0 = slots[k].y;
      let y1 = slots[k].y + th;
      for (let i = 0; i < k; i++) {
        x0 = Math.min(x0, words[i].x);
        x1 = Math.max(x1, words[i].x + words[i].w);
        y0 = Math.min(y0, words[i].base - cap);
        y1 = Math.max(y1, words[i].base + 0.1 * F);
      }
      const bw = x1 - x0;
      const bh = y1 - y0;
      const fit = Math.min(
        (W * (portrait ? 0.84 : 0.7)) / bw,
        (H * (portrait ? 0.42 : 0.68)) / bh,
      );
      const s = k === n ? 1 : Math.min(portrait ? 1.08 : 1.2, Math.max(1, fit));
      const w = k === n ? 1 : 0.85;
      out.push({
        cx: layout.cx + ((x0 + x1) / 2 - layout.cx) * w,
        cy: layout.cy + ((y0 + y1) / 2 - layout.cy) * w,
        s,
      });
    }
    return out;
  }, [n, slots, tw, th, words, cap, F, W, H, portrait, layout]);

  const camAt = (t: number) => {
    let cx = states[0].cx;
    let cy = states[0].cy;
    let ls = Math.log(states[0].s);
    for (let k = 0; k < n; k++) {
      const p = spring({
        frame: t - hops[k],
        fps,
        config: CAMERA,
      });
      cx += (states[k + 1].cx - states[k].cx) * p;
      cy += (states[k + 1].cy - states[k].cy) * p;
      ls += (Math.log(states[k + 1].s) - Math.log(states[k].s)) * p;
    }
    return { cx, cy, s: Math.exp(ls) };
  };
  const cam = camAt(frame);
  const push =
    1 +
    0.03 *
      interpolate(
        frame,
        [payoff + BEAT.settle, payoff + BEAT.settle + BEAT.hold - 12],
        [0, 1],
        { ...CLAMP, easing: PUSH },
      );
  const scale = cam.s * push;
  const ox = W / 2 - cam.cx * scale;
  const oy = H / 2 - cam.cy * scale;
  const toX = (x: number) => ox + x * scale;
  const toY = (y: number) => oy + y * scale;

  let tx = slots[0].x;
  let ty = slots[0].y;
  let squash = 0;
  let lead = 0;
  for (let k = 0; k < n; k++) {
    const f = frame - hops[k];
    if (f < 0) break;
    const p = spring({ frame: f, fps, config: CARD });
    const a = slots[k];
    const b = slots[k + 1];
    const sameLine = k < n - 1 && words[k].line === words[k + 1].line;
    const lift = sameLine ? 0.16 * F : 0.06 * F;
    tx = a.x + (b.x - a.x) * p;
    ty = a.y + (b.y - a.y) * p - lift * Math.sin(Math.PI * Math.min(1, p));
    const pPrev = spring({ frame: f - 1, fps, config: CARD });
    lead = Math.max(
      lead,
      Math.abs(p - pPrev) * Math.hypot(b.x - a.x, b.y - a.y),
    );
    squash = interpolate(f, [0, 3, 9], [0, 1, 0], CLAMP);
  }

  const intro = spring({ frame, fps, config: CAMERA, durationInFrames: 16 });
  const bigH = H * (portrait ? 0.36 : 0.56);
  const bigW = bigH * 0.78;
  const bigX = W / 2 - bigW / 2;
  const bigY = H / 2 - bigH / 2;
  const sx = toX(tx);
  const sy = toY(ty);
  const sw = tw * scale;
  const sh = th * scale;
  const tileW = bigW + (sw - bigW) * intro;
  const tileH = bigH + (sh - bigH) * intro;
  const tileX = bigX + (sx - bigX) * intro;
  const tileY = bigY + (sy - bigY) * intro;
  const introBlur = Math.abs(
    intro -
      spring({ frame: frame - 1, fps, config: CAMERA, durationInFrames: 16 }),
  );
  const moveBlur = Math.min(8, lead * scale * 0.09 + introBlur * 40);
  const tileScale = 1 + 0.04 * squash;

  const hopProgressRight = tx + tw;
  const accentHit = interpolate(frame, [payoff, payoff + 10], [0, 1], {
    ...CLAMP,
    easing: TYPE_IN,
  });

  const sats = portrait ? SATS_TALL : SATS_WIDE;
  const satStart = (i: number, far: boolean) => {
    if (far) return i * 4 - 2;
    return payoff + 2 + i * 3;
  };

  const renderWord = (w: (typeof words)[number], i: number) => {
    const start = hops[i];
    const f = frame - start;
    if (f < 0) return null;
    const timeP = interpolate(f, [0, BEAT.reveal], [0, 1], {
      ...CLAMP,
      easing: TYPE_IN,
    });
    const sweep = i < n - 1 ? hopProgressRight - w.x : 0;
    const reveal = Math.min(w.w + 0.2 * F, Math.max(sweep, w.w * timeP * 1.04));
    const rise = (1 - timeP) * 0.06 * F;
    const blur = (1 - timeP) * 5;
    const color = w.accent
      ? accentHit >= 1
        ? hi
        : `color-mix(in oklab, ${hi} ${accentHit * 100}%, ${inkC})`
      : inkC;
    const clipId = `pc-clip-${i}`;
    const filtId = `pc-blur-${i}`;
    return (
      <g key={`${w.text}-${i}`}>
        <defs>
          <clipPath id={clipId}>
            <rect
              x={w.x - 0.1 * F}
              y={w.base - 1.3 * F}
              width={reveal + 0.1 * F}
              height={1.7 * F}
            />
          </clipPath>
          {blur > 0.1 ? (
            <filter id={filtId} x="-20%" y="-50%" width="140%" height="200%">
              <feGaussianBlur stdDeviation={`${blur / scale} 0`} />
            </filter>
          ) : null}
        </defs>
        <g clipPath={`url(#${clipId})`}>
          <text
            x={w.x}
            y={w.base + rise}
            fill={color}
            filter={blur > 0.1 ? `url(#${filtId})` : undefined}
            fontFamily={w.accent ? serif.fontFamily : figtree.fontFamily}
            fontStyle={w.accent ? "italic" : "normal"}
            fontWeight={400}
            fontSize={w.accent ? F * SERIF_SCALE : F}
            letterSpacing={w.accent ? "0em" : `${TRACK}em`}
            opacity={interpolate(f, [0, 4], [0, 1], CLAMP)}
            style={{ fontKerning: "normal" }}
          >
            {w.text}
          </text>
        </g>
      </g>
    );
  };

  const renderSat = (st: Sat, i: number, layer: "far" | "near") => {
    if ((layer === "far") !== st.far) return null;
    const img = satSrc[(i + 1) % Math.max(1, satSrc.length)];
    if (!img) return null;
    const start = satStart(
      sats.filter((q) => q.far === st.far).indexOf(st),
      st.far,
    );
    const p = spring({ frame: frame - start, fps, config: CHIP });
    if (frame < start) return null;
    const size = Math.min(W, H) * st.s * (portrait ? 1.6 : 1);
    const wv = size * 0.8;
    const hv = size;
    const par = (push - 1) * (st.far ? -0.6 : 1.4);
    const x = W * st.x + (W * st.x - W / 2) * par;
    const y = H * st.y + (H * st.y - H / 2) * par;
    const dy = (1 - Math.min(1, p)) * size * 0.25;
    return (
      <div
        key={`sat-${i}`}
        style={{
          position: "absolute",
          left: x - wv / 2,
          top: y - hv / 2 + dy,
          width: wv,
          height: hv,
          borderRadius: wv * 0.06,
          overflow: "hidden",
          transform: `scale(${0.4 + 0.6 * p}) rotate(${st.r}deg)`,
          opacity: interpolate(p, [0, 0.35], [0, st.far ? 0.5 : 1], CLAMP),
          filter: st.far ? `blur(${6 * (Math.min(W, H) / 720)}px)` : undefined,
          boxShadow: st.far ? undefined : c.shadow,
          border: `1px solid ${c.border}`,
        }}
      >
        <Img
          src={img}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </div>
    );
  };

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
          background: `radial-gradient(${portrait ? "90% 46%" : "62% 70%"} at 50% 50%, rgba(${c.scrim},${c.scrimAlpha}) 0%, rgba(${c.scrim},0) 100%)`,
        }}
      />
      {sats.map((st, i) => renderSat(st, i, "far"))}
      <svg
        width={W}
        height={H}
        viewBox={`0 0 ${W} ${H}`}
        style={{ position: "absolute", inset: 0, overflow: "visible" }}
        aria-hidden
      >
        <g transform={`translate(${ox} ${oy}) scale(${scale})`}>
          {words.map((w, i) => renderWord(w, i))}
        </g>
      </svg>
      {sats.map((st, i) => renderSat(st, i, "near"))}
      <div
        style={{
          position: "absolute",
          left: tileX,
          top: tileY,
          width: tileW,
          height: tileH,
          borderRadius: Math.max(6, tileW * 0.07),
          overflow: "hidden",
          boxShadow: c.shadow,
          border: `1px solid ${c.border}`,
          transform: `scale(${tileScale})`,
          filter: moveBlur > 0.3 ? `blur(${moveBlur * 0.35}px)` : undefined,
        }}
      >
        <Img
          src={tileSrc}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </div>
    </AbsoluteFill>
  );
}

export default PhotoCaret;
