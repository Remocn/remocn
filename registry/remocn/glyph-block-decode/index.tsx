"use client";

import { loadFont as loadGeist } from "@remotion/google-fonts/Geist";
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

const geist = loadGeist("normal", {
  weights: ["300", "400"],
  subsets: ["latin"],
});

export interface GlyphBlockDecodeProps {
  name?: string;
  url?: string;
  images?: string[];
  blockColors?: string[];
  accent?: string;
  ink?: string;
  theme?: "dark" | "light";
  ground?: GshPresetId;
  groundParams?: Partial<GradientParams>;
  speed?: number;
  seed?: number;
}

const DEFAULT_IMAGES = [
  "reel/reel-2.jpg",
  "templates/product-showcase/sculpture.jpg",
  "reel/reel-5.jpg",
  "templates/brand-guidelines/ceramics.jpg",
  "templates/launch-anything/horizon.jpg",
  "templates/product-showcase/workbench.jpg",
  "reel/reel-3.jpg",
];

const LIGHT_GROUND: Partial<GradientParams> = {
  kind: "mist",
  background: "#f1eee8",
  colors: ["#f7e7f0", "#f6efd2", "#e3e0f6", "#f1eee8"],
  blur: 0.8,
  warp: 0.35,
  seed: 5,
  grain: 0.18,
};

const THEMES = {
  dark: {
    ink: "#f2f0ea",
    muted: "rgba(242,240,234,0.62)",
    accent: "#4a6bff",
    blocks: ["#4a6bff", "#c8b9ff", "#c8b9ff", "#4a6bff", "#ff6a3d", "#f2f0ea"],
    chip: "#121218",
    chipGlyph: "rgba(255,255,255,0.86)",
    ground: "velvet-hour" as GshPresetId | undefined,
    groundParams: undefined as Partial<GradientParams> | undefined,
    groundOffset: 6,
    scrim: "5,5,12",
    scrimAlpha: 0.5,
    shadow:
      "0 1px 2px rgba(0,0,0,0.35), 0 10px 24px rgba(0,0,0,0.32), 0 30px 70px rgba(0,0,0,0.35)",
    hairline: "inset 0 0 0 1px rgba(255,255,255,0.1)",
  },
  light: {
    ink: "#16161a",
    muted: "rgba(22,22,26,0.56)",
    accent: "#1f7bff",
    blocks: ["#1f7bff", "#c9b4ff", "#c9b4ff", "#1f7bff", "#ff5a2e", "#16161a"],
    chip: "#141418",
    chipGlyph: "rgba(255,255,255,0.9)",
    ground: undefined as GshPresetId | undefined,
    groundParams: LIGHT_GROUND as Partial<GradientParams> | undefined,
    groundOffset: 2,
    scrim: "241,238,232",
    scrimAlpha: 0.3,
    shadow:
      "0 1px 2px rgba(30,24,20,0.08), 0 8px 20px rgba(30,24,20,0.09), 0 26px 60px rgba(30,24,20,0.12)",
    hairline: "inset 0 0 0 1px rgba(0,0,0,0.06)",
  },
};

const BEAT = {
  nameIn: -8,
  satOut: 18,
  nameOut: 18,
  nameDone: 60,
  urlIn: 36,
  urlOut: 54,
  urlDone: 78,
  rule: 84,
  ruleLen: 18,
};

const FONT_PX = 200;
const NAME_TRACK = -0.035;
const URL_TRACK = -0.01;
const GLYPHS = "ABCDEFGHJKLMNPQRSTUVWXYZabcdeghkmnopqrsuvwxyz0123456789#%&/";
const EXIT = Easing.bezier(0.55, 0, 1, 0.45);
const MORPH = Easing.bezier(0.65, 0, 0.35, 1);
const CAMERA = Easing.bezier(0.87, 0, 0.13, 1);
const REVEAL = Easing.bezier(0.22, 1, 0.36, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;
const CHIP = { mass: 0.5, damping: 12, stiffness: 200 };
const CARD = { mass: 0.8, damping: 18, stiffness: 160 };

type Measure = (s: string, weight: number) => number;

function buildMeasure(_version: number): Measure {
  const ctx = document.createElement("canvas").getContext("2d");
  const cache: Record<string, number> = {};
  return (s: string, weight: number) => {
    const k = `${weight}|${s}`;
    if (cache[k] === undefined) {
      if (!ctx) return s.length * 0.55;
      ctx.font = `${weight} ${FONT_PX}px "${geist.fontFamily}"`;
      cache[k] = ctx.measureText(s).width / FONT_PX;
    }
    return cache[k];
  };
}

function useMeasure() {
  const [version, setVersion] = useState(0);
  const [handle] = useState(() => delayRender("glyph-block-decode: fonts"));
  const released = useRef(false);
  useEffect(() => {
    let live = true;
    const bump = () => {
      if (live) setVersion((v) => v + 1);
    };
    document.fonts.addEventListener("loadingdone", bump);
    Promise.all([
      geist.waitUntilDone(),
      document.fonts.load(`400 100px "${geist.fontFamily}"`),
      document.fonts.load(`300 100px "${geist.fontFamily}"`),
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

interface Char {
  ch: string;
  x: number;
  y: number;
  size: number;
  weight: number;
  track: number;
  url: boolean;
  reveal: number;
  flick: number;
  seed: number;
}

interface Tile {
  x: number;
  y: number;
  w: number;
  h: number;
  kind: "img" | "color" | "ui";
  img: number;
  color: string;
  icon: number;
  tIn: number;
  tOut: number;
  rot: number;
  fromX: number;
  fromY: number;
  blur: number;
  sat: boolean;
  rule: boolean;
}

function ChipIcon({
  kind,
  size,
  color,
}: {
  kind: number;
  size: number;
  color: string;
}) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: color,
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    style: { display: "block" },
  };
  if (kind === 0) {
    return (
      <svg {...common} aria-hidden>
        <path d="M9 7.5v9l7-4.5z" fill={color} />
      </svg>
    );
  }
  if (kind === 1) {
    return (
      <svg {...common} aria-hidden>
        <rect x="3.5" y="5" width="17" height="14" rx="2.5" />
        <path d="M3.5 9h17" />
        <circle cx="6.3" cy="7" r="0.4" fill={color} />
        <circle cx="8.3" cy="7" r="0.4" fill={color} />
      </svg>
    );
  }
  return (
    <svg {...common} aria-hidden>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function GlyphBlockDecode({
  name = "Remocn Studio",
  url = "remocn.dev/studio",
  images = DEFAULT_IMAGES,
  blockColors,
  accent,
  ink,
  theme = "dark",
  ground,
  groundParams,
  speed = 1,
  seed = 7,
}: GlyphBlockDecodeProps) {
  const rawFrame = useCurrentFrame();
  const frame = rawFrame * speed;
  const { width: W, height: H, fps, durationInFrames } = useVideoConfig();
  const c = THEMES[theme];
  const inkC = ink ?? c.ink;
  const hi = accent ?? c.accent;
  const palette = blockColors ?? [hi, ...c.blocks.slice(1)];
  const preset = ground ?? (groundParams ? undefined : c.ground);
  const gParams = groundParams ?? (ground ? undefined : c.groundParams);
  const bg = gshParams(preset, gParams).background;
  const portrait = H > W * 1.1;
  const m = useMeasure();
  const pics = (images.length > 0 ? images : DEFAULT_IMAGES).map(resolveSrc);

  let content: ReactNode = <div />;
  if (m) {
    const nameLines = portrait && name.includes(" ") ? name.split(" ") : [name];
    const lineEm = (s: string, w: number, tr: number) =>
      m(s, w) + tr * Math.max(0, Array.from(s).length - 1);
    const widest = Math.max(
      ...nameLines.map((l) => lineEm(l, 400, NAME_TRACK)),
    );
    const nameSize = Math.min(
      ((portrait ? 0.82 : 0.62) * W) / widest,
      H * (portrait ? 0.14 : 0.22),
    );
    const urlEm = lineEm(url, 300, URL_TRACK);
    const urlSize = Math.min(
      Math.max(nameSize * (portrait ? 0.26 : 0.3), H * 0.032),
      (W * 0.72) / urlEm,
    );
    const nameLH = nameSize * 0.98;
    const gap = nameSize * (portrait ? 0.5 : 0.42);
    const blockH = nameLines.length * nameLH + gap + urlSize;
    const top = H / 2 - blockH / 2;

    const chars: Char[] = [];
    const lineRows: {
      start: number;
      end: number;
      url: boolean;
      size: number;
    }[] = [];
    const place = (
      s: string,
      cy: number,
      size: number,
      weight: number,
      tr: number,
      isUrl: boolean,
    ) => {
      const wEm = lineEm(s, weight, tr);
      const x0 = W / 2 - (wEm * size) / 2;
      const start = chars.length;
      Array.from(s).forEach((ch, i) => {
        const pre = s.slice(0, i);
        chars.push({
          ch,
          x: x0 + (m(pre, weight) + tr * i) * size,
          y: cy,
          size,
          weight,
          track: tr,
          url: isUrl,
          reveal: 0,
          flick: 0,
          seed: seed * 101 + chars.length,
        });
      });
      lineRows.push({ start, end: chars.length, url: isUrl, size });
    };
    nameLines.forEach((l, li) => {
      place(l, top + nameLH * (li + 0.5), nameSize, 400, NAME_TRACK, false);
    });
    const urlY = top + nameLines.length * nameLH + gap + urlSize / 2;
    place(url, urlY, urlSize, 300, URL_TRACK, true);
    const urlFirst = chars.findIndex((ch) => ch.url);
    const urlLeft = chars[urlFirst].x;
    const urlRight = W / 2 + (urlEm * urlSize) / 2;
    const charRight = (i: number) => {
      const ch = chars[i];
      return ch.x + m(ch.ch, ch.weight) * ch.size;
    };

    const tiles: Tile[] = [];
    const groups: { tile: number; chars: number[] }[] = [];
    let r = 0;
    const rnd = () => random(`gbd-${seed}-${r++}`);
    const cx = W / 2;
    const cy = top + (nameLines.length * nameLH) / 2;
    lineRows.forEach((row) => {
      let i = row.start;
      while (i < row.end) {
        if (chars[i].ch === " ") {
          i++;
          continue;
        }
        const maxRun = row.url
          ? 2 + Math.floor(rnd() * 3)
          : 1 + Math.floor(rnd() * 3);
        const run: number[] = [];
        while (i < row.end && run.length < maxRun && chars[i].ch !== " ") {
          run.push(i);
          i++;
        }
        const size = row.size;
        const pad = size * 0.06;
        const x0 = chars[run[0]].x - pad;
        const x1 = charRight(run[run.length - 1]) + pad;
        const hS = row.url ? 1.3 + rnd() * 0.3 : 0.95 + rnd() * 0.35;
        const h = size * hS;
        const yj = (rnd() - 0.5) * size * (row.url ? 0.2 : 0.16);
        const wj = (rnd() - 0.3) * size * 0.18;
        const pick = rnd();
        const kind: Tile["kind"] =
          pick < 0.58 ? "img" : pick < 0.82 ? "color" : "ui";
        const tx = x0 - wj / 2;
        const ty = chars[run[0]].y - h / 2 + yj;
        const tw = x1 - x0 + wj;
        tiles.push({
          x: tx,
          y: ty,
          w: tw,
          h,
          kind,
          img: Math.floor(rnd() * pics.length),
          color: palette[Math.floor(rnd() * palette.length)],
          icon: Math.floor(rnd() * 3),
          tIn: 0,
          tOut: 0,
          rot: (rnd() - 0.5) * 16,
          fromX: tx + tw / 2 + (cx - (tx + tw / 2)) * 0.55,
          fromY: ty + h / 2 + ((row.url ? urlY : cy) - (ty + h / 2)) * 0.55,
          blur: 0,
          sat: false,
          rule: false,
        });
        groups.push({ tile: tiles.length - 1, chars: run });
      }
    });

    const schedule = (
      isUrl: boolean,
      inAt: number,
      outA: number,
      outB: number,
    ) => {
      const ids = groups
        .map((g, gi) => ({ g, gi }))
        .filter(({ g }) => chars[g.chars[0]].url === isUrl);
      const n = ids.length;
      const order = ids
        .map((o, k) => ({ ...o, key: k / Math.max(1, n) + rnd() * 0.32 }))
        .sort((a, b) => a.key - b.key);
      const inOrder = ids
        .map((o) => ({ ...o, key: rnd() }))
        .sort((a, b) => a.key - b.key);
      inOrder.forEach(({ g }, k) => {
        tiles[g.tile].tIn = inAt + k * (isUrl ? 1 : 1.5);
      });
      order.forEach(({ g }, k) => {
        const p = n <= 1 ? 1 : k / (n - 1);
        const t = outA + (outB - outA) * p ** 0.72;
        tiles[g.tile].tOut = t;
        g.chars.forEach((ci) => {
          chars[ci].reveal = t + 1;
          chars[ci].flick = 3 + Math.floor(rnd() * 3);
        });
      });
      return order.length > 0 ? order[order.length - 1].g : null;
    };
    schedule(false, BEAT.nameIn, BEAT.nameOut, BEAT.nameDone);
    const lastUrl = schedule(true, BEAT.urlIn, BEAT.urlOut, BEAT.urlDone);
    if (lastUrl) {
      const t = tiles[lastUrl.tile];
      t.kind = "color";
      t.color = hi;
      t.rule = true;
      t.tOut = BEAT.rule;
      lastUrl.chars.forEach((ci) => {
        chars[ci].reveal = BEAT.rule + 3;
      });
    }

    groups.forEach((g) => {
      const p = tiles[g.tile];
      if (chars[g.chars[0]].url || rnd() > 0.45) return;
      const s = p.h * (0.42 + rnd() * 0.2);
      const w = s * (1.2 + rnd() * 0.6);
      const up = rnd() < 0.5;
      const x = p.x + (rnd() * 0.8 - 0.1) * p.w;
      const y = up ? p.y - s * 0.55 : p.y + p.h - s * 0.45;
      const pick = rnd();
      tiles.push({
        x,
        y,
        w,
        h: s,
        kind: pick < 0.6 ? "img" : pick < 0.8 ? "ui" : "color",
        img: Math.floor(rnd() * pics.length),
        color: palette[Math.floor(rnd() * palette.length)],
        icon: Math.floor(rnd() * 3),
        tIn: p.tIn + 3,
        tOut: p.tOut - 3 - rnd() * 3,
        rot: (rnd() - 0.5) * 14,
        fromX: p.fromX,
        fromY: p.fromY,
        blur: 0,
        sat: false,
        rule: false,
      });
    });

    const nameW = widest * nameSize;
    const sats = portrait ? 6 : 7;
    for (let k = 0; k < sats; k++) {
      const ang = (k / sats) * Math.PI * 2 + rnd() * 0.6 + 0.3;
      const rx = (portrait ? W * 0.4 : nameW * 0.62) * (0.85 + rnd() * 0.3);
      const ry =
        (portrait ? nameLines.length * nameLH * 0.95 : nameSize * 1.25) *
        (0.85 + rnd() * 0.35);
      const s = nameSize * (0.35 + rnd() * 0.35);
      const w = s * (1.1 + rnd() * 0.7);
      const pick = rnd();
      const x = cx + Math.cos(ang) * rx - w / 2;
      const y = cy + Math.sin(ang) * ry - s / 2;
      tiles.push({
        x,
        y,
        w,
        h: s,
        kind: pick < 0.6 ? "img" : pick < 0.85 ? "color" : "ui",
        img: Math.floor(rnd() * pics.length),
        color: palette[Math.floor(rnd() * palette.length)],
        icon: Math.floor(rnd() * 3),
        tIn: -6 + k * 2,
        tOut: BEAT.satOut + k * 4 + rnd() * 3,
        rot: (rnd() - 0.5) * 20,
        fromX: x + w / 2 + (cx - (x + w / 2)) * 0.7,
        fromY: y + s / 2 + (cy - (y + s / 2)) * 0.7,
        blur: 1.2 + rnd() * 2.6,
        sat: true,
        rule: false,
      });
    }

    const f = frame;
    const ruleH = Math.max(2, urlSize * 0.07);
    const ruleY = urlY + urlSize * 0.62;

    const tileEls = tiles.map((t, ti) => {
      const inP = spring({
        frame: f - t.tIn,
        fps,
        config: t.sat ? CHIP : CARD,
      });
      if (f < t.tIn) return null;
      const ccx = t.x + t.w / 2;
      const ccy = t.y + t.h / 2;
      let x = t.fromX + (ccx - t.fromX) * inP;
      let y = t.fromY + (ccy - t.fromY) * inP;
      let w = t.w;
      let h = t.h;
      let scale = 0.25 + 0.75 * inP;
      let rot = t.rot * (1 - inP) * 0.6;
      let op = Math.min(1, inP * 3);
      let radius = Math.min(w, h) * 0.12;
      const bob = Math.sin(f * 0.07 + ti * 1.7) * t.h * 0.025;
      y += bob;
      if (t.sat) {
        const drift = (f - t.tIn) * 0.18;
        x += (ccx - cx) * 0.004 * drift;
        y += (ccy - cy) * 0.004 * drift;
      }
      const d = f - t.tOut;
      if (t.rule && d >= 0) {
        const p = interpolate(d, [0, BEAT.ruleLen], [0, 1], {
          ...CLAMP,
          easing: MORPH,
        });
        const tx = (urlLeft + urlRight) / 2;
        x = ccx + (tx - ccx) * p;
        y = ccy + (ruleY - ccy) * p;
        w = t.w + (urlRight - urlLeft - t.w) * p;
        h = t.h + (ruleH - t.h) * p;
        radius = radius + (ruleH / 2 - radius) * p;
        scale = 1;
        rot = 0;
      } else if (d >= 0) {
        const p = interpolate(d, [0, 7], [0, 1], { ...CLAMP, easing: EXIT });
        const punch = interpolate(d, [0, 2], [1, 1.07], CLAMP);
        scale = (punch - (punch - 0) * p) * scale;
        rot += t.rot * p;
        y -= t.h * 0.35 * p;
        x += (ccx - cx) * 0.06 * p;
        op *= interpolate(d, [4, 7], [1, 0], CLAMP);
        if (d > 7) return null;
      }
      const fill =
        t.kind === "img" ? (
          <Img
            src={pics[t.img]}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
            }}
          />
        ) : t.kind === "ui" ? (
          <div
            style={{
              width: "100%",
              height: "100%",
              background: c.chip,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ChipIcon
              kind={t.icon}
              size={Math.min(w, h) * 0.46}
              color={c.chipGlyph}
            />
          </div>
        ) : (
          <div style={{ width: "100%", height: "100%", background: t.color }} />
        );
      return (
        <div
          key={`t${ti}`}
          style={{
            position: "absolute",
            left: x - w / 2,
            top: y - h / 2,
            width: w,
            height: h,
            borderRadius: radius,
            overflow: "hidden",
            opacity: op * (t.sat ? 0.9 : 1),
            transform: `rotate(${rot.toFixed(2)}deg) scale(${scale.toFixed(4)})`,
            boxShadow: t.rule && d >= 0 ? "none" : `${c.shadow}, ${c.hairline}`,
            filter: t.blur > 0 ? `blur(${t.blur.toFixed(2)}px)` : undefined,
            zIndex: t.sat ? 1 : 3,
          }}
        >
          {fill}
        </div>
      );
    });

    const charEls = chars.map((ch, i) => {
      if (ch.ch === " " || f < ch.reveal) return null;
      const d = f - ch.reveal;
      const flicking = d < ch.flick;
      const glyph = flicking
        ? GLYPHS[
            Math.floor(
              random(`${ch.seed}-${Math.floor(d / 1.5)}`) * GLYPHS.length,
            )
          ]
        : ch.ch;
      const settle = interpolate(d - ch.flick, [0, 6], [0, 1], {
        ...CLAMP,
        easing: REVEAL,
      });
      const color = flicking ? hi : inkC;
      return (
        <div
          key={`c${i}`}
          style={{
            position: "absolute",
            left: ch.x,
            top: ch.y - ch.size / 2,
            fontSize: ch.size,
            lineHeight: 1,
            height: ch.size,
            display: "flex",
            alignItems: "center",
            whiteSpace: "pre",
            fontFamily: geist.fontFamily,
            fontWeight: ch.weight,
            color: ch.url && !flicking ? c.muted : color,
            opacity: flicking ? 0.9 : 1,
            transform: `translateY(${((1 - settle) * ch.size * 0.03).toFixed(2)}px)`,
            zIndex: 2,
          }}
        >
          {glyph}
        </div>
      );
    });

    const push = interpolate(rawFrame, [0, durationInFrames], [1, 1.04], {
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
        {charEls}
        {tileEls}
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

export default GlyphBlockDecode;
