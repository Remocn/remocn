"use client";

import { loadFont as loadSerif } from "@remotion/google-fonts/InstrumentSerif";
import { loadFont as loadInter } from "@remotion/google-fonts/InterTight";
import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import {
  AbsoluteFill,
  continueRender,
  delayRender,
  Easing,
  interpolate,
  random,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { GradientParams } from "@/lib/remocn/gsh/gradient-engine";
import { GshGround, gshParams } from "@/lib/remocn/gsh/gsh-ground";
import type { GshPresetId } from "@/lib/remocn/gsh/presets";

const inter = loadInter("normal", {
  weights: ["300"],
  subsets: ["latin"],
});
const serif = loadSerif("italic", {
  weights: ["400"],
  subsets: ["latin"],
});

export interface CoolingTypeProps {
  text?: string;
  accentWord?: string;
  hot?: string;
  accent?: string;
  ink?: string;
  theme?: "dark" | "light";
  ground?: GshPresetId;
  groundParams?: Partial<GradientParams>;
  startAt?: number;
  charFrames?: number;
  coolFrames?: number;
  seed?: number;
}

const LIGHT_GROUND: Partial<GradientParams> = {
  kind: "aurora",
  background: "#eef2f4",
  colors: ["#d4e4ff", "#f3f5f7", "#cfeee6", "#e7e3fb"],
  blur: 0.85,
  warp: 0.35,
  seed: 4,
  grain: 0.16,
};

const THEMES = {
  dark: {
    ink: "#eef3f1",
    hot: "#7dffd9",
    accent: "#7de8c8",
    glow: 1,
    band: 0.3,
    ground: "kiruna" as GshPresetId | undefined,
    groundParams: undefined as Partial<GradientParams> | undefined,
    groundOffset: 5,
    scrim: "2,8,8",
    scrimAlpha: 0.72,
  },
  light: {
    ink: "#141618",
    hot: "#2f5bff",
    accent: "#2f5bff",
    glow: 0.45,
    band: 0.2,
    ground: undefined as GshPresetId | undefined,
    groundParams: LIGHT_GROUND as Partial<GradientParams> | undefined,
    groundOffset: 3,
    scrim: "238,242,244",
    scrimAlpha: 0.4,
  },
};

const BEAT = {
  start: -3,
  breath: 8,
  accentRate: 1.25,
};

const FONT_PX = 200;
const TRACK = -0.028;
const COOL = Easing.bezier(0.33, 0, 0.2, 1);
const KEY = Easing.bezier(0.22, 1, 0.36, 1);
const CAMERA = Easing.bezier(0.87, 0, 0.13, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

type Measure = (s: string, serifFace: boolean) => number;

function buildMeasure(_version: number): Measure {
  const ctx = document.createElement("canvas").getContext("2d");
  const cache: Record<string, number> = {};
  return (s: string, serifFace: boolean) => {
    const k = `${serifFace ? 1 : 0}|${s}`;
    if (cache[k] === undefined) {
      if (!ctx) return s.length * 0.5;
      ctx.font = serifFace
        ? `italic 400 ${FONT_PX}px "${serif.fontFamily}"`
        : `300 ${FONT_PX}px "${inter.fontFamily}"`;
      const tr = serifFace ? -0.01 : TRACK;
      cache[k] = ctx.measureText(s).width / FONT_PX + tr * Array.from(s).length;
    }
    return cache[k];
  };
}

function useMeasure() {
  const [version, setVersion] = useState(0);
  const [handle] = useState(() => delayRender("cooling-type: fonts"));
  const released = useRef(false);
  useEffect(() => {
    let live = true;
    const bump = () => {
      if (live) setVersion((v) => v + 1);
    };
    document.fonts.addEventListener("loadingdone", bump);
    Promise.all([
      inter.waitUntilDone(),
      serif.waitUntilDone(),
      document.fonts.load(`300 100px "${inter.fontFamily}"`),
      document.fonts.load(`italic 400 100px "${serif.fontFamily}"`),
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

interface Ch {
  ch: string;
  x: number;
  w: number;
  line: number;
  serif: boolean;
  t: number;
}

export function CoolingType({
  text = "What if your launch video could write itself?",
  accentWord = "itself?",
  hot,
  accent,
  ink,
  theme = "dark",
  ground,
  groundParams,
  startAt = BEAT.start,
  charFrames = 1.6,
  coolFrames = 20,
  seed = 5,
}: CoolingTypeProps) {
  const frame = useCurrentFrame();
  const { width: W, height: H, durationInFrames } = useVideoConfig();
  const c = THEMES[theme];
  const inkC = ink ?? c.ink;
  const hotC = hot ?? c.hot;
  const accC = accent ?? c.accent;
  const preset = ground ?? (groundParams ? undefined : c.ground);
  const gParams = groundParams ?? (ground ? undefined : c.groundParams);
  const bg = gshParams(preset, gParams).background;
  const portrait = H > W * 1.1;
  const m = useMeasure();

  let content: ReactNode = <div />;
  if (m) {
    const words = text.split(" ").filter((w) => w.length > 0);
    const accIdx = accentWord ? words.lastIndexOf(accentWord) : -1;
    const isSerif = (wi: number) => wi === accIdx;
    const wordW = (wi: number) => m(words[wi], isSerif(wi));
    const space = m(" ", false);
    const maxW = (portrait ? 0.84 : 0.78) * W;
    const maxLines = portrait ? 5 : 2;
    let size = portrait ? W * 0.16 : H * 0.125;
    let rows: number[][] = [];
    const rowW = (row: number[]) =>
      row.reduce((a, wi, k) => a + wordW(wi) + (k > 0 ? space : 0), 0);
    for (let k = 0; k < 30; k++) {
      rows = [];
      let cur: number[] = [];
      words.forEach((_, wi) => {
        const next = [...cur, wi];
        if (cur.length > 0 && rowW(next) * size > maxW) {
          rows.push(cur);
          cur = [wi];
        } else {
          cur = next;
        }
      });
      if (cur.length > 0) rows.push(cur);
      if (
        rows.length <= maxLines &&
        rows.every((rw) => rowW(rw) * size <= maxW)
      )
        break;
      size *= 0.94;
    }
    const LH = size * 1.14;
    const blockW = Math.max(...rows.map(rowW)) * size;
    const x0 = (W - blockW) / 2;
    const top = H / 2 - (rows.length * LH) / 2;
    const lineY = (li: number) => top + LH * (li + 0.5);

    const chars: Ch[] = [];
    let t = startAt;
    let total = 0;
    rows.forEach((rw) => {
      total += rw.reduce((a, wi) => a + words[wi].length + 1, 0);
    });
    let n = 0;
    rows.forEach((rw, li) => {
      let x = x0;
      rw.forEach((wi, k) => {
        if (k > 0) {
          x += space * size;
        }
        const sf = isSerif(wi);
        if (sf) t += BEAT.breath;
        const word = words[wi];
        Array.from(word).forEach((ch, ci) => {
          const pre = word.slice(0, ci);
          const cx = x + m(pre, sf) * size;
          const cw = m(ch, sf) * size;
          chars.push({ ch, x: cx, w: cw, line: li, serif: sf, t });
          const accel = 1.2 - 0.45 * (n / Math.max(1, total));
          const jitter = (random(`ct-${seed}-${n}`) - 0.5) * 0.9;
          let step = sf ? BEAT.accentRate : charFrames * accel + jitter;
          if (/[,.;:!?]/.test(ch)) step += 4;
          t += Math.max(0.6, step);
          n++;
        });
        x += wordW(wi) * size;
        t += sf ? 0 : charFrames * 0.9;
        n++;
      });
    });
    const typedEnd = chars.length > 0 ? chars[chars.length - 1].t : startAt;
    const f = frame;

    const shownAt = (fr: number) => {
      let k = 0;
      while (k < chars.length && chars[k].t <= fr) k++;
      return k;
    };
    const caretAt = (fr: number) => {
      const k = shownAt(fr);
      if (k === 0) return { x: x0, li: 0 };
      const cur = chars[k - 1];
      const end = cur.x + cur.w;
      const prevEnd =
        k >= 2 && chars[k - 2].line === cur.line
          ? chars[k - 2].x + chars[k - 2].w
          : cur.x;
      const e = KEY(Math.min(1, (fr - cur.t) / 2));
      return { x: prevEnd + (end - prevEnd) * e, li: cur.line };
    };

    const heatOf = (ch: Ch) => {
      const a = f - ch.t;
      const len = ch.serif ? coolFrames * 1.8 : coolFrames;
      return 1 - interpolate(a, [0, len], [0, 1], { ...CLAMP, easing: COOL });
    };

    const pct = (v: number) =>
      `${(Math.max(0, Math.min(1, v)) * 100).toFixed(1)}%`;

    const bands = rows.map((_, li) => {
      const warm = chars.filter(
        (ch) => ch.line === li && ch.t <= f && heatOf(ch) > 0.04,
      );
      if (warm.length === 0) return null;
      const peak = Math.max(...warm.map(heatOf));
      const left = warm[0].x - size * 0.06;
      const last = warm[warm.length - 1];
      const right = last.x + last.w + size * 0.08;
      return (
        <div
          key={`b${li}`}
          style={{
            position: "absolute",
            left,
            top: lineY(li) - LH * 0.46,
            width: Math.max(1, right - left),
            height: LH * 0.92,
            borderRadius: LH * 0.18,
            background: `linear-gradient(90deg, color-mix(in oklab, ${hotC} 0%, transparent) 0%, color-mix(in oklab, ${hotC} ${pct(c.band * peak)}, transparent) 100%)`,
            filter: `blur(${(size * 0.07).toFixed(2)}px)`,
          }}
        />
      );
    });

    const glyphEls = chars.map((ch, i) => {
      if (ch.t > f) return null;
      const a = f - ch.t;
      const heat = heatOf(ch);
      const e = KEY(Math.min(1, a / 4));
      const target = ch.serif ? accC : inkC;
      const flare = ch.serif ? 1.4 : 1;
      const g = heat * c.glow * flare;
      const shadow =
        g > 0.02
          ? `0 0 ${(size * 0.12 * g).toFixed(2)}px color-mix(in oklab, ${hotC} ${pct(0.9 * g)}, transparent), 0 0 ${(size * 0.42 * g).toFixed(2)}px color-mix(in oklab, ${hotC} ${pct(0.4 * g)}, transparent)`
          : undefined;
      return (
        <div
          key={`c${i}`}
          style={{
            position: "absolute",
            left: ch.x,
            top: lineY(ch.line) - size / 2,
            height: size,
            display: "flex",
            alignItems: "center",
            fontFamily: ch.serif ? serif.fontFamily : inter.fontFamily,
            fontStyle: ch.serif ? "italic" : "normal",
            fontWeight: ch.serif ? 400 : 300,
            fontSize: ch.serif ? size * 1.04 : size,
            lineHeight: 1,
            whiteSpace: "pre",
            color: `color-mix(in oklab, ${hotC} ${pct(heat)}, ${target})`,
            textShadow: shadow,
            opacity: Math.min(1, 0.35 + a / 1.5),
            transform: `translateY(${((1 - e) * size * 0.1).toFixed(2)}px)`,
            filter:
              e < 0.98 ? `blur(${((1 - e) * 4).toFixed(2)}px)` : undefined,
          }}
        >
          {ch.ch}
        </div>
      );
    });

    const cur = caretAt(f);
    const back = caretAt(f - 3);
    const typing = f <= typedEnd + 2;
    const vel = cur.li === back.li ? Math.max(0, (cur.x - back.x) / 3) : 0;
    const trail = typing
      ? Math.min(size * 2.6, Math.max(size * 0.25, vel * 7))
      : interpolate(f, [typedEnd + 2, typedEnd + 10], [size * 0.25, 0], CLAMP);
    const caretHeat = typing
      ? 1
      : 1 -
        interpolate(f, [typedEnd, typedEnd + coolFrames], [0, 1], {
          ...CLAMP,
          easing: COOL,
        });
    const blink = typing || Math.floor((f - typedEnd) / 15) % 2 === 1;
    const caretW = Math.max(2, size * 0.045);
    const caretH = size * 1.02;
    const caretC = `color-mix(in oklab, ${hotC} ${pct(caretHeat)}, ${inkC})`;
    const cx = cur.x + size * 0.05;
    const cy = lineY(cur.li);
    const caret = (
      <>
        {trail > 1 ? (
          <div
            style={{
              position: "absolute",
              left: cx - trail,
              top: cy - caretH * 0.2,
              width: trail,
              height: caretH * 0.4,
              borderRadius: caretH,
              background: `linear-gradient(90deg, color-mix(in oklab, ${hotC} 0%, transparent) 0%, color-mix(in oklab, ${hotC} ${pct(0.55 * c.glow + 0.15)}, transparent) 100%)`,
              filter: `blur(${(size * 0.09).toFixed(2)}px)`,
            }}
          />
        ) : null}
        <div
          style={{
            position: "absolute",
            left: cx,
            top: cy - caretH / 2,
            width: caretW,
            height: caretH,
            borderRadius: caretW,
            background: caretC,
            opacity: blink ? 1 : 0,
            boxShadow: `0 0 ${(size * 0.18 * caretHeat * c.glow).toFixed(2)}px color-mix(in oklab, ${hotC} ${pct(0.8 * caretHeat)}, transparent)`,
          }}
        />
      </>
    );

    const push = interpolate(frame, [0, durationInFrames], [1, 1.04], {
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
        {bands}
        {glyphEls}
        {caret}
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
          background: `radial-gradient(${portrait ? "95% 50%" : "72% 62%"} at 50% 50%, rgba(${c.scrim},${c.scrimAlpha}) 0%, rgba(${c.scrim},0) 100%)`,
        }}
      />
      {content}
    </AbsoluteFill>
  );
}

export default CoolingType;
