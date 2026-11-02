"use client";

import { loadFont as loadSans } from "@remotion/google-fonts/Geist";
import { loadFont as loadManrope } from "@remotion/google-fonts/Manrope";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  AbsoluteFill,
  continueRender,
  delayRender,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { GradientParams } from "@/lib/remocn/gsh/gradient-engine";
import { GshGround, gshParams } from "@/lib/remocn/gsh/gsh-ground";
import type { GshPresetId } from "@/lib/remocn/gsh/presets";

const sans = loadSans("normal", {
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

export interface FocusFrontSwapProps {
  lines?: string[];
  accent?: string;
  ink?: string;
  logo?: boolean;
  theme?: "dark" | "light";
  ground?: GshPresetId;
  groundParams?: Partial<GradientParams>;
  swap?: number;
  blur?: number;
}

const THEMES = {
  dark: {
    ink: "#eef3ff",
    accent: "#7fb0ff",
    logo: "#eef3ff",
    ground: "film-blue" as GshPresetId | undefined,
    groundParams: undefined as Partial<GradientParams> | undefined,
    groundOffset: 5,
    veil: "2,5,12",
    veilIn: 0.6,
    veilOut: 0.08,
  },
  light: {
    ink: "#0e1430",
    accent: "#2f4dff",
    logo: "#0e1430",
    ground: "paper-crease" as GshPresetId | undefined,
    groundParams: undefined as Partial<GradientParams> | undefined,
    groundOffset: 4,
    veil: "238,240,246",
    veilIn: 0.6,
    veilOut: 0.04,
  },
};

const BEAT = {
  enter: 18,
  swap: 30,
  minSwap: 18,
  decay: 0.8,
  logo: -3,
};

const FONT_PX = 200;
const TRACK = -0.032;
const SOFT = 0.36;
const FRONT = Easing.bezier(0.65, 0, 0.35, 1);
const GLYPH_IN = Easing.bezier(0.22, 1, 0.36, 1);
const GLYPH_OUT = Easing.bezier(0.55, 0, 1, 0.45);
const CHIP = { mass: 0.5, damping: 12, stiffness: 200 };
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

interface Measure {
  w: (s: string) => number;
  asc: number;
  desc: number;
}

function buildMeasure(_version: number): Measure {
  const ctx = document.createElement("canvas").getContext("2d");
  const font = `300 ${FONT_PX}px "${sans.fontFamily}"`;
  const cache: Record<string, number> = {};
  let asc = 0.95;
  let desc = 0.25;
  if (ctx) {
    ctx.font = font;
    const t = ctx.measureText("Hg");
    asc = t.fontBoundingBoxAscent / FONT_PX;
    desc = t.fontBoundingBoxDescent / FONT_PX;
  }
  return {
    asc,
    desc,
    w: (s) => {
      if (cache[s] === undefined) {
        if (!ctx) return s.length * 0.5;
        ctx.font = font;
        cache[s] =
          ctx.measureText(s).width / FONT_PX + TRACK * Array.from(s).length;
      }
      return cache[s];
    },
  };
}

function useMeasure() {
  const [version, setVersion] = useState(0);
  const [handle] = useState(() => delayRender("focus-front-swap: measuring"));
  const released = useRef(false);
  useEffect(() => {
    let live = true;
    const bump = () => {
      if (live) setVersion((v) => v + 1);
    };
    document.fonts.addEventListener("loadingdone", bump);
    Promise.all([
      sans.waitUntilDone(),
      manrope.waitUntilDone(),
      document.fonts.load(`300 100px "${sans.fontFamily}"`),
      document.fonts.load(`600 100px "${manrope.fontFamily}"`),
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

interface Word {
  text: string;
  mask: boolean[];
}

function parse(text: string): Word[] {
  const out: Word[] = [];
  let on = false;
  for (const raw of text.split(" ").filter(Boolean)) {
    let t = "";
    const mask: boolean[] = [];
    for (const ch of Array.from(raw)) {
      if (ch === "{") on = true;
      else if (ch === "}") on = false;
      else {
        t += ch;
        mask.push(on);
      }
    }
    if (t) out.push({ text: t, mask });
  }
  return out;
}

function breakRows(widths: number[], gap: number, k: number) {
  const n = widths.length;
  const span = (a: number, b: number) =>
    widths.slice(a, b).reduce((s, w) => s + w, 0) + gap * (b - a - 1);
  const best: number[][] = [];
  const cut: number[][] = [];
  for (let j = 0; j <= k; j++) {
    best.push(new Array(n + 1).fill(Number.POSITIVE_INFINITY));
    cut.push(new Array(n + 1).fill(0));
  }
  best[0][0] = 0;
  for (let j = 1; j <= k; j++) {
    for (let b = 1; b <= n; b++) {
      for (let a = j - 1; a < b; a++) {
        const v = Math.max(best[j - 1][a], span(a, b));
        if (v < best[j][b]) {
          best[j][b] = v;
          cut[j][b] = a;
        }
      }
    }
  }
  const rows: number[][] = [];
  let end = n;
  for (let j = k; j >= 1; j--) {
    const a = cut[j][end];
    rows.unshift(Array.from({ length: end - a }, (_, q) => a + q));
    end = a;
  }
  return { rows, width: best[k][n] };
}

interface Glyph {
  ch: string;
  x: number;
  y: number;
  accent: boolean;
  u: number;
}

export function FocusFrontSwap({
  lines = [
    "Remocn knows the beat",
    "You describe it once",
    "Ship it {tonight}.",
  ],
  accent,
  ink,
  logo = true,
  theme = "dark",
  ground,
  groundParams,
  swap = BEAT.swap,
  blur = 18,
}: FocusFrontSwapProps) {
  const frame = useCurrentFrame();
  const { width: W, height: H, fps, durationInFrames } = useVideoConfig();
  const c = THEMES[theme];
  const inkC = ink ?? c.ink;
  const hi = accent ?? c.accent;
  const preset = ground ?? (groundParams ? undefined : c.ground);
  const gParams = groundParams ?? (ground ? undefined : c.groundParams);
  const bg = gshParams(preset, gParams).background;
  const m = useMeasure();
  const portrait = H > W * 1.1;

  const parsed = lines.map(parse);
  const starts: number[] = [];
  const lens: number[] = [];
  let t = -9;
  let len = swap;
  parsed.forEach((ws, k) => {
    if (k === 0) {
      starts.push(t);
      lens.push(BEAT.enter);
      t += BEAT.enter;
      return;
    }
    const prev = parsed[k - 1].length;
    t += Math.max(24, Math.min(48, 8 + 4 * prev));
    starts.push(t);
    lens.push(len);
    t += len;
    len = Math.max(BEAT.minSwap, Math.round(len * BEAT.decay));
    if (ws.length === 0) len = BEAT.minSwap;
  });
  const front = (k: number) => {
    if (k < 0 || k >= starts.length) return -1;
    const p = interpolate(frame, [starts[k], starts[k] + lens[k]], [0, 1], {
      ...CLAMP,
      easing: FRONT,
    });
    return -SOFT + (1 + 2 * SOFT) * p;
  };
  const lastEnd = starts[starts.length - 1] + lens[lens.length - 1];

  const pan = parsed.reduce((acc, _, k) => {
    if (k === 0) return acc;
    return (
      acc +
      interpolate(frame, [starts[k], starts[k] + lens[k]], [0, 1], {
        ...CLAMP,
        easing: FRONT,
      })
    );
  }, 0);

  let content: React.ReactNode = <div />;
  if (m) {
    const gap = m.w(" ");
    const roomW = W * (portrait ? 0.84 : 0.8);
    const maxT = portrait ? W * 0.19 : H * 0.22;
    const minT = portrait ? W * 0.095 : H * 0.085;
    const layouts = parsed.map((ws) => {
      const widths = ws.map((w) => m.w(w.text));
      let lay = breakRows(widths, gap, 1);
      for (let k = 2; k <= Math.min(ws.length, 4); k++) {
        if (roomW / Math.max(lay.width, ...widths) >= minT) break;
        lay = breakRows(widths, gap, k);
      }
      return { widths, ...lay };
    });
    const cy = H * (logo ? (portrait ? 0.47 : 0.46) : 0.5);

    const sizes = layouts.map((lay) =>
      Math.min(maxT, roomW / Math.max(lay.width, 0.1)),
    );
    const glyphSets: Glyph[][] = layouts.map((lay, k) => {
      const ws = parsed[k];
      const T = sizes[k];
      const rowH = T * 1.2;
      const out: Glyph[] = [];
      const rows = lay.rows;
      const top = cy - (rows.length * rowH) / 2;
      rows.forEach((row, ri) => {
        const rw =
          row.reduce((a, i) => a + lay.widths[i], 0) + gap * (row.length - 1);
        let x = W / 2 - (rw * T) / 2;
        const base = top + ri * rowH + rowH / 2 + (m.asc - m.desc) * T * 0.5;
        row.forEach((i, j) => {
          if (j > 0) x += gap * T;
          const word = ws[i].text;
          const chars = Array.from(word);
          chars.forEach((ch, q) => {
            const pre = q === 0 ? 0 : m.w(chars.slice(0, q).join(""));
            const cw = m.w(chars.slice(0, q + 1).join("")) - pre;
            const nudge = q > 0 && /[.,!?;:]/.test(ch) ? 0.035 : 0;
            out.push({
              ch,
              x: x + (pre + nudge) * T,
              y: base,
              accent: ws[i].mask[q] ?? false,
              u: x + (pre + cw / 2) * T,
            });
          });
          x += lay.widths[i] * T;
        });
      });
      return out;
    });

    let L = Number.POSITIVE_INFINITY;
    let R = Number.NEGATIVE_INFINITY;
    for (const g of glyphSets.flat()) {
      L = Math.min(L, g.u);
      R = Math.max(R, g.u);
    }
    const span = Math.max(1, R - L);
    let Tp = Number.POSITIVE_INFINITY;
    let Bt = Number.NEGATIVE_INFINITY;
    for (const g of glyphSets.flat()) {
      Tp = Math.min(Tp, g.y);
      Bt = Math.max(Bt, g.y);
    }
    const multi = Bt - Tp > 1;
    const keyOf = (g: Glyph) => {
      const xk = (g.u - L) / span;
      return multi ? xk * 0.8 + ((g.y - Tp) / (Bt - Tp)) * 0.2 : xk;
    };

    const nodes: React.ReactNode[] = [];
    glyphSets.forEach((gs, k) => {
      const T = sizes[k];
      const asc = m.asc * T;
      const desc = m.desc * T;
      const fIn = front(k);
      const fOut = front(k + 1);
      if (fIn <= -SOFT && k > 0) return;
      gs.forEach((g, gi) => {
        const u = keyOf(g);
        const inLocal = Math.min(1, Math.max(0, (fIn - u) / SOFT));
        const outLocal =
          k + 1 < glyphSets.length
            ? Math.min(1, Math.max(0, (fOut - u) / SOFT))
            : 0;
        const inP = interpolate(inLocal, [0.45, 1], [0, 1], {
          ...CLAMP,
          easing: GLYPH_IN,
        });
        const outP = interpolate(outLocal, [0, 0.55], [0, 1], {
          ...CLAMP,
          easing: GLYPH_OUT,
        });
        const op = inP * (1 - outP);
        if (op < 0.004) return;
        const b = (1 - inP) * blur + outP * blur;
        const sc = 1 + 0.07 * (1 - inP) + 0.09 * outP;
        nodes.push(
          <span
            key={`g${k}-${gi}`}
            style={{
              position: "absolute",
              left: g.x,
              top: g.y - asc,
              height: asc + desc,
              lineHeight: `${(asc + desc).toFixed(2)}px`,
              fontFamily: sans.fontFamily,
              fontWeight: 300,
              fontSize: T,
              letterSpacing: `${TRACK}em`,
              whiteSpace: "pre",
              color: g.accent ? hi : inkC,
              opacity: op,
              transformOrigin: `50% ${(asc * 0.7).toFixed(2)}px`,
              transform: `scale(${sc.toFixed(4)})`,
              filter: b > 0.05 ? `blur(${b.toFixed(2)}px)` : undefined,
            }}
          >
            {g.ch}
          </span>,
        );
      });
    });

    const logoIn = spring({
      frame: frame - (lastEnd + BEAT.logo),
      fps,
      config: CHIP,
    });
    const logoE = Math.min(1, Math.max(0, logoIn));
    const lastRows = layouts[layouts.length - 1].rows.length;
    const lastT = sizes[sizes.length - 1];
    const logoSize = Math.max(lastT * 0.38, H * 0.045);
    const logoTop = cy + (lastRows * lastT * 1.2) / 2 + lastT * 0.34;

    const push = interpolate(frame, [0, durationInFrames], [1, 1.04], CLAMP);
    content = (
      <AbsoluteFill style={{ transform: `scale(${push.toFixed(4)})` }}>
        {nodes}
        {logo ? (
          <div
            style={{
              position: "absolute",
              left: 0,
              width: W,
              top: logoTop,
              display: "flex",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                transform: `translateY(${((1 - logoIn) * logoSize * 0.8).toFixed(2)}px) scale(${(0.88 + 0.12 * logoIn).toFixed(4)})`,
                opacity: logoE,
                filter:
                  logoE < 1
                    ? `blur(${((1 - logoE) * 6).toFixed(2)}px)`
                    : undefined,
              }}
            >
              <RemocnLogo fontSize={logoSize} color={c.logo} />
            </div>
          </div>
        ) : null}
      </AbsoluteFill>
    );
  }

  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      <GshGround
        preset={preset}
        params={gParams}
        timeOffset={c.groundOffset}
        timeScale={0.55}
        style={{
          transform: `translateX(${(-pan * W * 0.025).toFixed(2)}px) scale(1.14)`,
        }}
      />
      <AbsoluteFill
        style={{
          background: `radial-gradient(${portrait ? "95% 50%" : "70% 60%"} at 50% 47%, rgba(${c.veil},${c.veilIn}) 0%, rgba(${c.veil},${c.veilOut}) 100%)`,
        }}
      />
      {content}
    </AbsoluteFill>
  );
}

export default FocusFrontSwap;
