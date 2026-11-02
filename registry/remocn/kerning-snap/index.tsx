"use client";

import { loadFont } from "@remotion/google-fonts/Fraunces";
import { useId, useMemo } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const { fontFamily: sans } = loadFont("normal", {
  weights: ["400"],
  subsets: ["latin"],
});

export interface KerningSnapProps {
  word?: string;
  interval?: number;
  accent?: string;
  theme?: "dark" | "light";
  speed?: number;
}

/** Fraunces 400 advance widths (per 1000 em) for ASCII 32–126. */
const FRAUNCES_400 = [
  224, 308, 336, 648, 590, 738, 743, 157, 345, 345, 624, 556, 252, 416, 242,
  492, 648, 448, 594, 539, 595, 565, 592, 506, 581, 596, 248, 259, 512, 556,
  512, 495, 884, 712, 678, 696, 782, 646, 595, 757, 828, 381, 470, 758, 614,
  898, 776, 794, 664, 794, 714, 590, 674, 743, 701, 1032, 722, 681, 636, 326,
  492, 330, 481, 476, 229, 542, 592, 508, 604, 521, 366, 558, 621, 301, 301,
  594, 304, 936, 621, 583, 606, 592, 451, 468, 364, 606, 550, 810, 530, 554,
  474, 388, 264, 388, 636,
];
/** Fraunces 400 GPOS kerning (|k| ≥ 30/1000), "pairValue". */
const KERN_PAIRS = [
  "AT-45 AV-44 AW-44 AY-55 Av-35 Aw-35 Ay-35 FA-39 FJ-44 Fa-40 Fg-38 LT-45",
  "LV-59 LW-59 LY-59 PA-44 RY-30 TA-45 TJ-38 Ta-50 Tc-50 Td-50 Te-50 Tg-50",
  "To-50 Tq-50 Ts-50 VA-45 VJ-38 Va-55 Vc-55 Vd-55 Ve-55 Vg-54 Vi-42 Vm-42",
  "Vn-42 Vo-55 Vp-38 Vq-55 Vr-42 Vs-53 Vt-30 Vu-30 Vv-30 Vw-30 Vx-30 Vy-30",
  "Vz-46 WA-45 WJ-38 Wa-55 Wc-55 Wd-55 We-55 Wg-54 Wi-42 Wm-42 Wn-42 Wo-55",
  "Wp-38 Wq-55 Wr-42 Ws-53 Wt-30 Wu-30 Wv-30 Ww-30 Wx-30 Wy-30 Wz-46 YA-55",
  "YJ-38 Ya-57 Yc-60 Yd-60 Ye-60 Yg-61 Yi-38 Ym-38 Yn-38 Yo-60 Yp-50 Yq-60",
  "Yr-38 Ys-61 Yt-31 Yu-31 Yv-38 Yw-38 Yx-38 Yy-38 Yz-43 aT-40 aV-44 aW-44",
  "aY-52 bT-50 bV-54 bW-54 bY-60 cY-36 eY-36 hV-38 hW-38 hY-38 kY-30 mV-38",
  "mW-38 mY-38 nV-38 nW-38 nY-38 oT-50 oV-54 oW-54 oY-60 pT-50 pV-54 pW-54",
  "pY-60 qV-37 qW-37 qY-50 rV-34 rW-34 rY-50 sV-35 sW-35 sY-50 tY-30 vA-35",
  "vY-37 wA-35 wY-37 xV-30 xW-30 xY-37 yA-35 yY-37 zV-37 zW-37 zY-37",
].join(" ");
const KERN = new Map(
  KERN_PAIRS.split(" ").map((p) => [p.slice(0, 2), Number(p.slice(2)) / 1000]),
);
const TRACK = -0.02;
const CAP = 0.7;
const BASELINE = 0.8615;
/** Padding around each glyph box so the clip-text gradient covers overhangs and descenders. */
const PAD_X = 0.12;
const PAD_Y = 0.2;

const FIRST_SNAP = 30;

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_IO = Easing.bezier(0.65, 0, 0.35, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

// gradients.sh "halo": one continuous fill across the word. Loose letters carry
// their own slice of it, so the gradient only reads whole once the word is set.
const THEMES = {
  dark: {
    bg: "#030306",
    fg: "#F6F1EC",
    grain: 0.07,
    fill: "linear-gradient(100deg, #FFF4EC 0%, #FFB36B 34%, #E2457A 70%, #8F6BFF 100%)",
    glow: "radial-gradient(60% 42% at 50% 54%, rgba(226,69,122,0.13) 0%, rgba(61,77,255,0.06) 45%, transparent 72%)",
  },
  light: {
    bg: "#F6F3EF",
    fg: "#141216",
    grain: 0.045,
    fill: "linear-gradient(100deg, #F07A2A 0%, #E2457A 45%, #3D4DFF 100%)",
    glow: "radial-gradient(60% 42% at 50% 54%, rgba(255,179,107,0.16) 0%, rgba(226,69,122,0.06) 45%, transparent 72%)",
  },
} as const;

function hash(i: number, salt: number) {
  const s = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453;
  return s - Math.floor(s);
}

function advance(ch: string) {
  const code = ch.charCodeAt(0);
  return (code >= 32 && code < 127 ? FRAUNCES_400[code - 32] : 600) / 1000;
}

function Grain({ opacity }: { opacity: number }) {
  const id = `g${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  return (
    <svg
      width="100%"
      height="100%"
      style={{ position: "absolute", inset: 0, opacity, pointerEvents: "none" }}
      aria-hidden
    >
      <filter id={id}>
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.9"
          numOctaves={2}
          seed={17}
          stitchTiles="stitch"
        />
        <feColorMatrix values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0.9 0" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#${id})`} />
    </svg>
  );
}

function Tick({
  side,
  F,
  color,
  flash,
}: {
  side: "left" | "right";
  F: number;
  color: string;
  flash: number;
}) {
  if (flash <= 0.001) return null;
  const h = CAP * F * 1.36;
  const top = PAD_Y * F + BASELINE * F - CAP * F - (h - CAP * F) / 2;
  const cap = Math.max(8, F * 0.08);
  const line = Math.max(2, F / 72);
  return (
    <div
      style={{
        position: "absolute",
        top,
        [side]: PAD_X * F - line / 2,
        width: line,
        height: h,
        opacity: flash,
        transform: `scaleY(${0.82 + 0.18 * flash})`,
      }}
    >
      <div style={{ position: "absolute", inset: 0, background: color }} />
      {[0, 1].map((k) => (
        <div
          key={k}
          style={{
            position: "absolute",
            left: (line - cap) / 2,
            width: cap,
            height: line,
            top: k === 0 ? 0 : h - line,
            background: color,
          }}
        />
      ))}
    </div>
  );
}

export function KerningSnap({
  word = "Typeset",
  interval = 7,
  accent = "#3B5BFD",
  theme = "dark",
  speed = 1,
}: KerningSnapProps) {
  const t = useCurrentFrame() * speed;
  const { width: W, height: H, fps } = useVideoConfig();
  const c = THEMES[theme];

  const chars = useMemo(() => Array.from(word), [word]);
  const n = chars.length;
  const kerns = useMemo(
    () =>
      chars.map((ch, i) => (i === 0 ? 0 : (KERN.get(chars[i - 1] + ch) ?? 0))),
    [chars],
  );
  const finalEm = useMemo(
    () => chars.reduce((s, ch, i) => s + advance(ch) + TRACK + kerns[i], 0),
    [chars, kerns],
  );
  const F = Math.min(H * 0.28, (W * 0.62) / finalEm);

  const finalCenters = useMemo(() => {
    let x = -(finalEm * F) / 2;
    return chars.map((ch, i) => {
      x += kerns[i] * F;
      const w = (advance(ch) + TRACK) * F;
      const cx = x + w / 2;
      x += w;
      return cx;
    });
  }, [chars, kerns, finalEm, F]);

  const finalLefts = useMemo(
    () =>
      chars.map(
        (ch, i) =>
          finalCenters[i] - ((advance(ch) + TRACK) * F) / 2 + (finalEm * F) / 2,
      ),
    [chars, finalCenters, finalEm, F],
  );

  const anchor = Math.floor((n - 1) / 2);
  const order = useMemo(() => {
    const seq: number[] = [];
    for (let d = 1; seq.length < n - 1; d++) {
      if (anchor + d < n) seq.push(anchor + d);
      if (anchor - d >= 0) seq.push(anchor - d);
    }
    return seq;
  }, [anchor, n]);
  const snapAt = useMemo(() => {
    const at = new Array<number>(n).fill(FIRST_SNAP - interval);
    order.forEach((j, k) => {
      at[j] = FIRST_SNAP + k * interval;
    });
    return at;
  }, [order, n, interval]);

  const spread = useMemo(() => {
    const span = W * 0.78;
    const raw: number[] = [];
    let acc = 0;
    for (let i = 0; i < n; i++) {
      if (i > 0) acc += 0.75 + hash(i, 3) * 0.55;
      raw.push(acc);
    }
    const total = raw[n - 1] || 1;
    return raw.map((r) => -span / 2 + (r / total) * span);
  }, [n, W]);

  const lastSnap = FIRST_SNAP + (n - 2) * interval;
  const gather = interpolate(t, [0, lastSnap + 4], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const push = interpolate(t, [0, lastSnap + 60], [0, 1], CLAMP);

  const snap = (i: number) =>
    i === anchor
      ? 1
      : spring({
          frame: t - snapAt[i],
          fps,
          config: { damping: 19, stiffness: 420, mass: 0.55 },
        });
  const flash = (j: number) => {
    const d = t - snapAt[j] - 3;
    if (d < 0) return 0;
    return interpolate(d, [0, 2, 12], [0, 1, 0], {
      ...CLAMP,
      easing: EASE_OUT,
    });
  };

  const anchorDrift = (spread[anchor] - finalCenters[anchor]) * (1 - gather);
  const anchorLift = (hash(anchor, 7) - 0.5) * F * 0.12 * (1 - gather);

  return (
    <AbsoluteFill style={{ background: c.bg, overflow: "hidden" }}>
      <AbsoluteFill
        style={{ background: c.glow, opacity: 0.4 + 0.6 * gather }}
      />
      <AbsoluteFill
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transform: `scale(${1 + push * 0.02})`,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            whiteSpace: "pre",
            fontFamily: sans,
            fontWeight: 400,
            fontSize: F,
            lineHeight: 1,
            letterSpacing: `${TRACK}em`,
            fontKerning: "none",
            color: c.fg,
            transform: `translateY(${F * 0.04}px)`,
          }}
        >
          {chars.map((ch, i) => {
            const s = snap(i);
            const loose = 1 - s;
            const startOff =
              spread[i] -
              finalCenters[i] -
              (spread[anchor] - finalCenters[anchor]);
            const wander = 1 - 0.72 * gather;
            const dx = anchorDrift + startOff * wander * loose;
            const dy =
              anchorLift + (hash(i, 7) - 0.5) * F * 0.5 * wander * loose;
            const rot = (hash(i, 11) - 0.5) * 12 * wander * loose;
            const o = interpolate(t, [2 + i * 2, 16 + i * 2], [0, 1], {
              ...CLAMP,
              easing: EASE_OUT,
            });
            const leftTick = i > anchor ? flash(i) : 0;
            const rightTick = i < anchor ? flash(i) : 0;
            return (
              <span
                key={`${i}-${ch}`}
                style={{
                  position: "relative",
                  display: "inline-block",
                  marginLeft: (kerns[i] - PAD_X) * F,
                  marginRight: -PAD_X * F,
                  padding: `${PAD_Y * F}px ${PAD_X * F}px`,
                  color: "transparent",
                  backgroundImage: c.fill,
                  backgroundSize: `${(finalEm + PAD_X * 2) * F}px 100%`,
                  backgroundPosition: `${-finalLefts[i]}px 0px`,
                  backgroundRepeat: "no-repeat",
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  opacity: o,
                  transform: `translate(${dx}px, ${dy}px) rotate(${rot}deg)`,
                }}
              >
                {ch}
                <Tick side="left" F={F} color={accent} flash={leftTick} />
                <Tick side="right" F={F} color={accent} flash={rightTick} />
              </span>
            );
          })}
        </div>
      </AbsoluteFill>
      <Grain opacity={c.grain} />
    </AbsoluteFill>
  );
}
