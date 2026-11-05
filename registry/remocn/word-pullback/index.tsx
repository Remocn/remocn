"use client";

import { loadFont as loadSerif } from "@remotion/google-fonts/InstrumentSerif";
import { loadFont as loadSans } from "@remotion/google-fonts/InterTight";
import { loadFont as loadManrope } from "@remotion/google-fonts/Manrope";
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
const serif = loadSerif("italic", { weights: ["400"], subsets: ["latin"] });
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

export interface WordPullbackProps {
  before?: string;
  accentWord?: string;
  after?: string;
  accent?: string;
  ink?: string;
  background?: string;
  theme?: "dark" | "light";
  ground?: GshPresetId;
  groundParams?: Partial<GradientParams>;
}

const LIGHT_GROUND: Partial<GradientParams> = {
  kind: "mist",
  background: "#f4efe8",
  colors: ["#ffe2cc", "#f7ad82", "#eec2cf", "#f4efe8"],
  speed: 0.8,
  loopSeconds: 14,
  scale: 0.85,
  warp: 0.4,
  blur: 0.7,
  grain: 0.22,
  seed: 12,
};

const THEMES = {
  dark: {
    ink: "#f6efe8",
    accent: "#ffc79a",
    logo: "#f6efe8",
    ground: "hearth" as GshPresetId | undefined,
    groundParams: undefined as Partial<GradientParams> | undefined,
    groundOffset: 5,
    veil: "6,3,3",
    veilFrom: 0.72,
    veilTo: 0.12,
  },
  light: {
    ink: "#1b1512",
    accent: "#b3441c",
    logo: "#1b1512",
    ground: undefined as GshPresetId | undefined,
    groundParams: LIGHT_GROUND as Partial<GradientParams> | undefined,
    groundOffset: 3,
    veil: "244,239,232",
    veilFrom: 0.75,
    veilTo: 0.05,
  },
};

const BEAT = {
  typeEnd: 27,
  pull1: 30,
  pull1Len: 18,
  line2: 45,
  wordStep: 3,
  rise: 12,
  pull2: 72,
  pull2Len: 15,
  logo: 78,
  flood: 72,
  floodLen: 24,
};

const TRACK = -0.03;
const SERIF_SCALE = 1.18;
const FONT_PX = 200;
const RISE = Easing.bezier(0.22, 1, 0.36, 1);
const CAMERA = Easing.bezier(0.87, 0, 0.13, 1);
const TYPE = Easing.bezier(0.65, 0, 0.35, 1);
const FLOOD = Easing.bezier(0.32, 0.72, 0, 1);
const CHIP = { mass: 0.5, damping: 12, stiffness: 200 };
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

interface Measure {
  sans: (s: string) => number;
  serif: (s: string) => number;
}

function buildMeasure(_version: number): Measure {
  const ctx = document.createElement("canvas").getContext("2d");
  const cache: Record<string, number> = {};
  const get = (font: string, track: number, s: string) => {
    const key = `${font}|${s}`;
    if (cache[key] === undefined) {
      if (!ctx) return s.length * 0.5;
      ctx.font = font;
      cache[key] =
        ctx.measureText(s).width / FONT_PX + track * Array.from(s).length;
    }
    return cache[key];
  };
  return {
    sans: (s) => get(`300 ${FONT_PX}px "${sans.fontFamily}"`, TRACK, s),
    serif: (s) =>
      get(`italic 400 ${FONT_PX}px "${serif.fontFamily}"`, -0.01, s) *
      SERIF_SCALE,
  };
}

function useMeasure() {
  const [version, setVersion] = useState(0);
  const [handle] = useState(() => delayRender("word-pullback: measuring"));
  const released = useRef(false);
  useEffect(() => {
    let live = true;
    const bump = () => {
      if (live) setVersion((v) => v + 1);
    };
    document.fonts.addEventListener("loadingdone", bump);
    Promise.all([
      sans.waitUntilDone(),
      serif.waitUntilDone(),
      manrope.waitUntilDone(),
      document.fonts.load(`300 100px "${sans.fontFamily}"`),
      document.fonts.load(`italic 400 100px "${serif.fontFamily}"`),
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

interface Token {
  text: string;
  serif: boolean;
  w: number;
}

export function WordPullback({
  before = "The",
  accentWord = "cinematic",
  after = "toolkit for every launch",
  accent,
  ink,
  background,
  theme = "dark",
  ground,
  groundParams,
}: WordPullbackProps) {
  const frame = useCurrentFrame();
  const { width: W, height: H, fps, durationInFrames } = useVideoConfig();
  const c = THEMES[theme];
  const inkC = ink ?? c.ink;
  const hi = accent ?? c.accent;
  const preset = ground ?? (groundParams ? undefined : c.ground);
  const gParams = groundParams ?? (ground ? undefined : c.groundParams);
  const bg = background ?? gshParams(preset, gParams).background;
  const m = useMeasure();
  const portrait = H > W * 1.1;

  const flood = interpolate(
    frame,
    [BEAT.flood, BEAT.flood + BEAT.floodLen],
    [0, 1],
    { ...CLAMP, easing: FLOOD },
  );
  const veil = c.veilFrom + (c.veilTo - c.veilFrom) * flood;

  let content: React.ReactNode = <div />;
  if (m) {
    const cx = W / 2;
    const cy = H / 2;
    const marginX = W * (portrait ? 0.08 : 0.1);
    const room = W - marginX * 2;
    const beforeWords = before.split(" ").filter(Boolean);
    const tokens: Token[] = [
      ...beforeWords.map((s) => ({ text: s, serif: false, w: m.sans(s) })),
      { text: accentWord, serif: true, w: m.serif(accentWord) },
      ...after
        .split(" ")
        .filter(Boolean)
        .map((s) => ({ text: s, serif: false, w: m.sans(s) })),
    ];
    const accentIdx = beforeWords.length;
    const sp = m.sans(" ");
    const totalEm =
      tokens.reduce((a, t) => a + t.w, 0) + sp * (tokens.length - 1);
    const longest = Math.max(...tokens.map((t) => t.w));

    const k = Math.min(
      tokens.length,
      portrait
        ? Math.max(2, Math.ceil(totalEm / 5.2))
        : totalEm > 16
          ? 3
          : totalEm > 8
            ? 2
            : 1,
    );
    const widthOf = (a: number, b: number) =>
      tokens.slice(a, b).reduce((acc, t) => acc + t.w, 0) + sp * (b - a - 1);
    const best: number[][] = [];
    const cut: number[][] = [];
    for (let j = 0; j <= k; j++) {
      best.push(new Array(tokens.length + 1).fill(Number.POSITIVE_INFINITY));
      cut.push(new Array(tokens.length + 1).fill(0));
    }
    best[0][0] = 0;
    for (let j = 1; j <= k; j++) {
      for (let b = 1; b <= tokens.length; b++) {
        for (let a = j - 1; a < b; a++) {
          const v = Math.max(best[j - 1][a], widthOf(a, b));
          if (v < best[j][b]) {
            best[j][b] = v;
            cut[j][b] = a;
          }
        }
      }
    }
    const lines: number[][] = [];
    let end = tokens.length;
    for (let j = k; j >= 1; j--) {
      const a = cut[j][end];
      lines.unshift(Array.from({ length: end - a }, (_, q) => a + q));
      end = a;
    }
    const maxLineEm = best[k][tokens.length];
    const T = portrait
      ? Math.min(W * 0.16, room / Math.max(maxLineEm, longest))
      : Math.min(H * 0.17, room / Math.max(maxLineEm, longest));

    const lineH = T * 1.12;
    const logoSize = T * 0.42;
    const logoGap = T * 0.5;
    const blockH = logoSize + logoGap + lines.length * lineH;
    const top = cy - blockH / 2;
    const lineY = (li: number) =>
      top + logoSize + logoGap + li * lineH + lineH / 2;
    const lineWidth = (ln: number[]) =>
      ln.reduce((a, i) => a + tokens[i].w, 0) * T + sp * T * (ln.length - 1);

    let accentX = cx;
    let accentY = cy;
    let accentLine = 0;
    const placed: { i: number; x: number; y: number; li: number }[] = [];
    lines.forEach((ln, li) => {
      let x = cx - lineWidth(ln) / 2;
      ln.forEach((i) => {
        placed.push({ i, x, y: lineY(li), li });
        if (i === accentIdx) {
          accentX = x + (tokens[i].w * T) / 2;
          accentY = lineY(li);
          accentLine = li;
        }
        x += tokens[i].w * T + sp * T;
      });
    });

    const accentPx = tokens[accentIdx].w * T;
    const z0 = (W * (portrait ? 1.25 : 1.15)) / accentPx;
    const maxLinePx = Math.max(...lines.map(lineWidth));
    const z1 = Math.max(
      1.12,
      Math.min(Math.sqrt(z0) * 1.05, (W * 0.94) / maxLinePx),
    );

    const typeEnd = Math.max(
      BEAT.typeEnd - 6,
      Math.min(BEAT.typeEnd + 6, accentWord.length * 3),
    );
    const typed = interpolate(frame, [-9, typeEnd], [0, 1], {
      ...CLAMP,
      easing: TYPE,
    });
    const typedN = Math.max(1, Math.ceil(typed * accentWord.length));
    const typedPx = m.serif(accentWord.slice(0, typedN)) * T;
    const accentLeft = accentX - accentPx / 2;

    const cam = (f: number) => {
      const p1 = interpolate(
        f,
        [BEAT.pull1, BEAT.pull1 + BEAT.pull1Len],
        [0, 1],
        { ...CLAMP, easing: CAMERA },
      );
      const p2 = interpolate(
        f,
        [BEAT.pull2, BEAT.pull2 + BEAT.pull2Len],
        [0, 1],
        { ...CLAMP, easing: CAMERA },
      );
      const dolly = interpolate(f, [0, BEAT.pull1 + 6], [0, 1], CLAMP);
      const tP = interpolate(f, [-9, typeEnd], [0, 1], {
        ...CLAMP,
        easing: TYPE,
      });
      const lz0 = Math.log(z0 * (1 - 0.08 * dolly));
      const lz1 = Math.log(
        z1 *
          (1 -
            0.04 *
              interpolate(
                f,
                [BEAT.pull1 + BEAT.pull1Len, BEAT.pull2],
                [0, 1],
                CLAMP,
              )),
      );
      const lnZ = lz0 + (lz1 - lz0) * p1 + (0 - lz1) * p2;
      const f0x = accentLeft + accentPx * (0.18 + 0.5 * tP);
      const f0y = accentY;
      const f1x = cx;
      const f1y = cy + (logoSize + logoGap) / 2;
      const fx = f0x + (f1x - f0x) * p1 + (cx - f1x) * p2;
      const fy = f0y + (f1y - f0y) * p1 + (cy - f1y) * p2;
      return { lnZ, fx, fy };
    };

    const C = cam(frame);
    const Cp = cam(frame - 1);
    const vel = Math.abs(C.lnZ - Cp.lnZ);
    const screenBlur = Math.min(8, vel * 30);
    const push = interpolate(
      frame,
      [BEAT.pull2 + BEAT.pull2Len, durationInFrames],
      [1, 1.03],
      CLAMP,
    );
    const Z = Math.exp(C.lnZ) * push;
    const depth = Math.max(0, Math.min(1, (Z - 1) / Math.max(0.001, z0 - 1)));

    const reveal = Math.min(1, typedPx / Math.max(1, accentPx) + 0.015);

    const tokenNodes = placed.map(({ i, x, y, li }) => {
      const k = tokens[i];
      const isAccent = i === accentIdx;
      let enterAt = -99;
      if (!isAccent && i > accentIdx) {
        if (li === accentLine) {
          enterAt = typeEnd - 3 + (i - accentIdx - 1) * BEAT.wordStep;
        } else {
          const firstOnLine = lines[li][0];
          enterAt =
            BEAT.line2 +
            (li - accentLine - 1) * 6 +
            (i - firstOnLine) * BEAT.wordStep;
        }
      }
      const e = interpolate(frame, [enterAt, enterAt + BEAT.rise], [0, 1], {
        ...CLAMP,
        easing: RISE,
      });
      const dist = Math.abs(i - accentIdx);
      const localBlur = isAccent
        ? 0
        : (depth * Math.min(2, dist) * 2.6) / Math.max(1, Z) +
          (1 - e) * (5 / Math.max(1, Z));
      const style: CSSProperties = {
        position: "absolute",
        left: x,
        top: y,
        transform: "translateY(-50%)",
        whiteSpace: "pre",
        lineHeight: 1,
        color: isAccent ? hi : inkC,
        fontFamily: isAccent ? serif.fontFamily : sans.fontFamily,
        fontStyle: isAccent ? "italic" : "normal",
        fontWeight: isAccent ? 400 : 300,
        fontSize: isAccent ? T * SERIF_SCALE : T,
        letterSpacing: isAccent ? "-0.01em" : `${TRACK}em`,
        clipPath: isAccent
          ? `inset(-30% ${((1 - reveal) * 100).toFixed(2)}% -30% -10%)`
          : "inset(-30% -10% -12% -10%)",
        marginTop: isAccent ? T * 0.03 : 0,
        opacity: isAccent ? 1 : 0.62 + 0.38 * (1 - depth),
        filter:
          localBlur > 0.02 ? `blur(${localBlur.toFixed(3)}px)` : undefined,
      };
      return (
        <div key={`t${i}`} style={style}>
          <span
            style={{
              display: "inline-block",
              transform: `translateY(${((1 - e) * 0.8).toFixed(4)}em)`,
            }}
          >
            {k.text}
          </span>
        </div>
      );
    });

    const logoIn = spring({ frame: frame - BEAT.logo, fps, config: CHIP });
    const logoE = Math.min(1, Math.max(0, logoIn));
    const caretOn =
      frame < typeEnd + 4 && Math.floor(frame / 8) % 2 === 0 ? 1 : 0;
    const caretX = accentLeft + typedPx + T * 0.04;

    const layer = (scale: number, opacity: number, key: string) => (
      <div
        key={key}
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: W,
          height: H,
          transformOrigin: "0 0",
          transform: `translate(${cx}px, ${cy}px) scale(${(Z * scale).toFixed(5)}) translate(${(-C.fx).toFixed(3)}px, ${(-C.fy).toFixed(3)}px)`,
          opacity,
        }}
      >
        {tokenNodes}
        <div
          style={{
            position: "absolute",
            left: caretX,
            top: accentY - T * 0.48,
            width: Math.max(1.5, T * 0.025),
            height: T * 0.96,
            background: hi,
            opacity: caretOn * (frame < typeEnd + 4 ? 1 : 0),
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 0,
            width: W,
            top,
            height: logoSize * 1.2,
            display: "flex",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              transform: `translateY(${((1 - logoIn) * logoSize * 0.9).toFixed(2)}px) scale(${(0.86 + 0.14 * logoIn).toFixed(4)})`,
              opacity: logoE,
              filter:
                logoE < 1
                  ? `blur(${((1 - logoE) * 4).toFixed(2)}px)`
                  : undefined,
            }}
          >
            <RemocnLogo fontSize={logoSize} color={c.logo} />
          </div>
        </div>
      </div>
    );

    const ghosts = screenBlur > 0.8 ? [1.04, 1.09] : [];
    content = (
      <AbsoluteFill
        style={{
          filter:
            screenBlur > 0.1 ? `blur(${screenBlur.toFixed(2)}px)` : undefined,
        }}
      >
        {ghosts.map((g, gi) => layer(g, 0.2 - gi * 0.08, `ghost${gi}`))}
        {layer(1, 1, "main")}
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
        style={{
          transform: `scale(${(1.12 - 0.12 * flood).toFixed(4)}) translateY(${((1 - flood) * H * 0.06).toFixed(2)}px)`,
        }}
      />
      <AbsoluteFill
        style={{
          background: `radial-gradient(${portrait ? "95% 60%" : "75% 80%"} at 50% 46%, rgba(${c.veil},${(veil + 0.25 * (1 - veil)).toFixed(3)}) 0%, rgba(${c.veil},${veil.toFixed(3)}) 100%)`,
        }}
      />
      {content}
    </AbsoluteFill>
  );
}

export default WordPullback;
