"use client";

import { loadFont } from "@remotion/google-fonts/SpaceGrotesk";
import { type ReactNode, useId, useMemo } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  interpolateColors,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const { fontFamily: sans } = loadFont("normal", {
  weights: ["500"],
  subsets: ["latin"],
});

export interface WordLadderProps {
  /** Rungs of the ladder, first to last. Neighbours should differ by a letter or two. */
  words?: string[];
  accent?: string;
  theme?: "dark" | "light";
  speed?: number;
}

// Space Grotesk 500 advance widths (1/1000 em) for ASCII 32–126, plus its kern pairs.
const GROTESK_500 = [
  255, 276, 470, 632, 609, 765, 598, 273, 389, 383, 530, 620, 273, 443, 276,
  379, 645, 435, 598, 606, 630, 599, 615, 559, 611, 615, 276, 276, 620, 620,
  620, 579, 1020, 632, 663, 643, 665, 559, 537, 661, 656, 254, 602, 618, 544,
  874, 667, 673, 603, 673, 632, 609, 588, 669, 619, 887, 641, 617, 577, 347,
  379, 347, 620, 620, 288, 577, 641, 592, 641, 584, 439, 640, 615, 256, 258,
  551, 256, 857, 615, 615, 641, 641, 387, 525, 458, 614, 544, 792, 593, 614,
  519, 449, 249, 449, 620,
];
const KERN_PAIRS = [
  "AT70 AU12 AV49 AW22 AY74 Af23 At23 Av14 BT13 BV12 BX14 BY15 CT15",
  "CY17 DB23 DD23 DT29 DV15 DX24 DY28 DZ14 FA44 GT29 GV18 GY33 JA35",
  "JC16 JG16 JJ31 JO16 JQ16 Ja30 Jc32 Jd32 Je32 Jg32 Jm30 Jn30 Jo32",
  "Jp30 Jq32 Jr30 Ju30 Jy30 KC30 KG30 KO30 KQ30 Kc17 Kd17 Ke17 Kf27",
  "Kg17 Ko17 Kq17 Ks10 Kt27 Ku11 Kv28 Kw16 Ky11 LC22 LG22 LO22 LQ22",
  "LT93 LU18 LV74 LW25 Lf46 Lt46 Lv33 Lw11 OB23 OD23 OT29 OV15 OX24",
  "OY28 OZ14 PA55 PJ48 PX21 PZ19 Pa11 Pc14 Pd14 Pe14 Pg14 Po14 Pq14",
  "Ps12 QB23 QD23 QT29 QV15 QX24 QY28 QZ14 RT11 RV12 RY16 ST26 SV11",
  "SX10 SY21 TA70 TC29 TG29 TJ87 TO29 TQ29 TS15 Ta87 Tc97 Td97 Te97",
  "Tf52 Tg97 Ti11 Tj11 Tm72 Tn72 To97 Tp72 Tq97 Tr72 Ts82 Tt52 Tu74",
  "Tv69 Tw72 Tx80 Ty74 Tz76 UA12 VA49 VC15 VG15 VO15 VQ15 Va33 Vc33",
  "Vd33 Ve33 Vg33 Vo33 Vq33 Vs30 Vu11 Vv15 Vw13 Vx26 Vy11 WA22 Wc10",
  "Wd10 We10 Wg10 Wo10 Wq10 XC24 XG24 XO24 XQ24 Xc17 Xd17 Xe17 Xf20",
  "Xg17 Xo17 Xq17 Xt20 Xu10 Xv20 Xw11 Xy10 YA74 YC28 YG28 YJ95 YO28",
  "YQ28 YS19 Ya83 Yc87 Yd87 Ye87 Yf46 Yg87 Ym73 Yn73 Yo87 Yp73 Yq87",
  "Yr73 Ys80 Yt46 Yu75 Yv63 Yw65 Yx71 Yy75 Yz72 ZC14 ZG14 ZO14 ZQ14",
  "Zc11 Zd11 Ze11 Zf16 Zg11 Zo11 Zq11 Zt16 Zv11 ac12 ad12 ae12 af34",
  "ag12 ao12 aq12 at34 au13 av27 ay13 bf18 bt18 bv17 bx32 bz13 cf18",
  "ct18 cv17 cx32 cz13 ef18 et18 ev17 ex32 ez13 fc20 fd20 fe20 fg20",
  "fi26 fj26 fl26 fo20 fq20 ft13 hf14 ht14 hv15 ka11 kc28 kd28 ke28",
  "kg28 ko28 kq28 ks13 mf14 mt14 mv15 nf14 nt14 nv15 of18 ot18 ov17",
  "ox32 oz13 pf18 pt18 pv17 px32 pz13 ra14 rc18 rd18 re18 rg18 ro18",
  "rq18 rs11 sf11 st11 sv19 tc18 td18 te18 tf27 tg18 to18 tq18 va14",
  "vc17 vd17 ve17 vg17 vo17 vq17 vs13 xa10 xc32 xd32 xe32 xg32 xo32",
  "xq32 xs11 zc14 zd14 ze14 zg14 zo14 zq14",
].join(" ");
const KERN = new Map(
  KERN_PAIRS.split(" ").map((p) => [p.slice(0, 2), -Number(p.slice(2)) / 1000]),
);
const TRACK = -0.03;
const ASC = 0.984;
const LINE = 1.276;
const ASCENDER = 0.7;

// Timing, in frames at speed 1.
const ENTER_STAGGER = 2;
const ENTER = 18;
const FIRST = 32;
const RUNG = 24;
const SUB = 3;
const DROP = 8;
const RISE_DELAY = 7;
const RISE = 16;
const GLIDE_DELAY = 3;
const GLIDE = 16;
const BAR_LEAD = 9;
const BAR_IN = 10;
const BAR_OUT = 7;
const SETTLE = 12;
const POSTER_GAP = 6;
const POSTER = 18;

const stepAt = (k: number) => FIRST + k * RUNG;

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_IN = Easing.bezier(0.55, 0, 1, 0.45);
const EASE_IO = Easing.bezier(0.65, 0, 0.35, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

// The ground under the floor line: light spilling down from the slot line the
// outgoing letters sink through. gradients.sh "beam" (dark), "pixel-glass" (light).
const THEMES = {
  dark: {
    bg: "#0A0A0B",
    fg: "#F3F2EF",
    dim: "#5E5D5B",
    grain: 0.07,
    beam: [
      "rgba(143, 180, 255, 0.46)",
      "rgba(61, 91, 255, 0.46)",
      "rgba(26, 22, 96, 0.5)",
    ],
  },
  light: {
    bg: "#F5F4F0",
    fg: "#121214",
    dim: "#A9A8A4",
    grain: 0.045,
    beam: [
      "rgba(61, 107, 255, 0.34)",
      "rgba(122, 60, 255, 0.2)",
      "rgba(255, 79, 184, 0.07)",
    ],
  },
} as const;

function advance(ch: string) {
  if (!ch) return 0;
  const code = ch.charCodeAt(0);
  return (code >= 32 && code < 127 ? GROTESK_500[code - 32] : 620) / 1000;
}

/** Glyph centres (em, relative to the word's centre) for every slot. */
function layoutWord(chars: string[], slots: number) {
  const left: number[] = [];
  let x = 0;
  chars.forEach((ch, i) => {
    if (i > 0) x += KERN.get(chars[i - 1] + ch) ?? 0;
    left.push(x);
    x += advance(ch) + TRACK;
  });
  const total = Math.max(0, x - TRACK);
  const cx: number[] = [];
  for (let i = 0; i < slots; i++) {
    cx.push(
      i < chars.length
        ? left[i] + advance(chars[i]) / 2 - total / 2
        : total / 2,
    );
  }
  return { cx, total };
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
          seed={31}
          stitchTiles="stitch"
        />
        <feColorMatrix values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0.9 0" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#${id})`} />
    </svg>
  );
}

interface Swap {
  step: number;
  at: number;
  from: string;
  to: string;
}

interface Mark {
  in: number;
  out: number;
}

export function WordLadder({
  words = ["idea", "item", "stem", "step", "ship"],
  accent = "#3B5BFD",
  theme = "dark",
  speed = 1,
}: WordLadderProps) {
  const t = useCurrentFrame() * speed;
  const { width: W, height: H } = useVideoConfig();
  const c = THEMES[theme];

  const rungs = useMemo(
    () => (words.length > 0 ? words : [""]).map((w) => Array.from(w)),
    [words],
  );
  const slots = Math.max(1, ...rungs.map((r) => r.length));
  const layouts = useMemo(
    () => rungs.map((r) => layoutWord(r, slots)),
    [rungs, slots],
  );
  const steps = rungs.length - 1;

  const plan = useMemo(() => {
    const swaps: Swap[][] = Array.from({ length: slots }, () => []);
    const changed: boolean[][] = [];
    for (let k = 0; k < steps; k++) {
      const a = rungs[k];
      const b = rungs[k + 1];
      const row: boolean[] = [];
      let order = 0;
      for (let i = 0; i < slots; i++) {
        const from = a[i] ?? "";
        const to = b[i] ?? "";
        row.push(from !== to);
        if (from === to) continue;
        swaps[i].push({ step: k, at: stepAt(k) + order * SUB, from, to });
        order++;
      }
      changed.push(row);
    }
    const lastSwap = Math.max(
      stepAt(0),
      ...swaps.flat().map((s) => s.at + RISE_DELAY + RISE),
    );
    const posterAt = steps > 0 ? lastSwap + POSTER_GAP : stepAt(0);
    // Accent marks: one per slot and run of consecutive steps that change it.
    const marks: Mark[][] = Array.from({ length: slots }, () => []);
    for (let i = 0; i < slots; i++) {
      for (let k = 0; k < steps; k++) {
        if (!changed[k][i]) continue;
        const prev = marks[i][marks[i].length - 1];
        const end = k + 1 < steps ? stepAt(k + 1) - BAR_LEAD : posterAt;
        if (prev && k > 0 && changed[k - 1][i]) prev.out = end;
        else marks[i].push({ in: stepAt(k) - BAR_LEAD, out: end });
      }
    }
    return { swaps, changed, posterAt, marks };
  }, [rungs, slots, steps]);

  const F = Math.min(
    H * 0.42,
    (W * 0.62) / Math.max(0.1, ...layouts.map((l) => l.total)),
  );
  const floorGap = 0.27 * F;
  const barH = Math.max(3, F * 0.042);
  const baseline = H / 2 + (ASCENDER * F - floorGap - barH) / 2;
  const floorY = baseline + floorGap;
  const dropD = floorGap + ASCENDER * F + F * 0.04;

  const glide = (k: number) =>
    interpolate(
      t,
      [stepAt(k) + GLIDE_DELAY, stepAt(k) + GLIDE_DELAY + GLIDE],
      [0, 1],
      { ...CLAMP, easing: EASE_IO },
    );
  const glides = Array.from({ length: steps }, (_, k) => glide(k));
  const slotX = (i: number) => {
    let x = layouts[0].cx[i];
    glides.forEach((g, k) => {
      x += (layouts[k + 1].cx[i] - layouts[k].cx[i]) * g;
    });
    return W / 2 + x * F;
  };

  const poster = interpolate(
    t,
    [plan.posterAt, plan.posterAt + POSTER],
    [0, 1],
    { ...CLAMP, easing: EASE_IO },
  );
  const isFinal = steps > 0;

  const glyphs: ReactNode[] = [];
  const bars: ReactNode[] = [];
  const barSpan = (i: number, ch: string) => {
    const half = Math.max(advance(ch) * 0.4, 0.11) * F;
    const x = slotX(i);
    return [x - half, x + half] as const;
  };

  for (let i = 0; i < slots; i++) {
    const x = slotX(i);
    const list = plan.swaps[i];
    let current: Swap | undefined;
    for (const s of list) if (s.at <= t) current = s;

    const draw = (
      key: string,
      ch: string,
      y: number,
      color: string,
      opacity = 1,
    ) => {
      if (!ch || opacity <= 0) return;
      glyphs.push(
        <span
          key={key}
          style={{
            position: "absolute",
            left: x - (advance(ch) * F) / 2,
            top: baseline - ASC * F,
            color,
            opacity,
            transform: `translateY(${y}px)`,
          }}
        >
          {ch}
        </span>,
      );
    };

    if (!current) {
      const enter = interpolate(
        t,
        [i * ENTER_STAGGER, i * ENTER_STAGGER + ENTER],
        [0, 1],
        { ...CLAMP, easing: EASE_OUT },
      );
      draw(`s${i}`, rungs[0][i] ?? "", (1 - enter) * dropD, c.fg);
    } else {
      const drop = interpolate(t, [current.at, current.at + DROP], [0, 1], {
        ...CLAMP,
        easing: EASE_IN,
      });
      if (drop < 1)
        draw(
          `o${i}-${current.step}`,
          current.from,
          drop * dropD,
          interpolateColors(drop, [0, 1], [c.fg, c.dim]),
        );
      const rise = interpolate(
        t,
        [current.at + RISE_DELAY, current.at + RISE_DELAY + RISE],
        [0, 1],
        { ...CLAMP, easing: EASE_OUT },
      );
      const settleAt =
        current.step + 1 < steps
          ? stepAt(current.step + 1) - BAR_LEAD
          : plan.posterAt;
      const settle = interpolate(t, [settleAt, settleAt + SETTLE], [0, 1], {
        ...CLAMP,
        easing: EASE_IO,
      });
      draw(
        `i${i}-${current.step}`,
        current.to,
        (1 - rise) * dropD,
        interpolateColors(settle, [0, 1], [accent, c.fg]),
      );
    }

    // Accent mark under the slot that is about to change.
    const glyphNow = current
      ? t < current.at + RISE_DELAY
        ? current.from
        : current.to
      : (rungs[0][i] ?? "");
    for (const m of plan.marks[i]) {
      const grow = interpolate(t, [m.in, m.in + BAR_IN], [0, 1], {
        ...CLAMP,
        easing: EASE_OUT,
      });
      const isLast = isFinal && m.out === plan.posterAt;
      const shrink = isLast
        ? interpolate(t, [m.out + POSTER, m.out + POSTER + 1], [0, 1], CLAMP)
        : interpolate(t, [m.out, m.out + BAR_OUT], [0, 1], {
            ...CLAMP,
            easing: EASE_IN,
          });
      const v = grow * (1 - shrink);
      if (v <= 0) continue;
      const [l, r] = barSpan(i, glyphNow);
      bars.push(
        <div
          key={`b${i}-${m.in}`}
          style={{
            position: "absolute",
            left: l,
            top: floorY,
            width: r - l,
            height: barH,
            background: accent,
            opacity: isLast ? 1 : Math.min(1, v * 1.4),
            transform: `scaleX(${isLast ? 0.35 + 0.65 * grow : 0.35 + 0.65 * v})`,
          }}
        />,
      );
    }
  }

  // Poster: the last marks run out into one rule under the final word.
  if (isFinal && t >= plan.posterAt) {
    const last = rungs[steps];
    const lastChanged = plan.changed[steps - 1]
      .map((on, i) => (on && last[i] ? i : -1))
      .filter((i) => i >= 0);
    if (last.length > 0 && lastChanged.length > 0) {
      // Grow out of the first mark; the others are covered as it passes.
      const from = barSpan(lastChanged[0], last[lastChanged[0]]);
      const to = [
        barSpan(0, last[0])[0],
        barSpan(last.length - 1, last[last.length - 1])[1],
      ];
      const l = from[0] + (to[0] - from[0]) * poster;
      const r = from[1] + (to[1] - from[1]) * poster;
      bars.push(
        <div
          key="rule"
          style={{
            position: "absolute",
            left: l,
            top: floorY,
            width: r - l,
            height: barH,
            background: accent,
          }}
        />,
      );
    }
  }

  // Ground: light spilling down from the slot line, drifting a touch wider.
  const drift = interpolate(t, [0, plan.posterAt + POSTER], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const groundTop = floorY + barH;
  const spread = 58 + 8 * drift;
  const ground = `radial-gradient(${spread.toFixed(2)}% 100% at 50% 0%, ${c.beam[0]} 0%, ${c.beam[1]} 30%, ${c.beam[2]} 62%, transparent 100%)`;

  return (
    <AbsoluteFill style={{ background: c.bg, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          left: 0,
          top: groundTop,
          width: W,
          height: H - groundTop,
          background: ground,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: W,
          height: floorY,
          overflow: "hidden",
          fontFamily: sans,
          fontWeight: 500,
          fontSize: F,
          lineHeight: LINE,
          fontKerning: "none",
          whiteSpace: "pre",
        }}
      >
        {glyphs}
      </div>
      {bars}
      <Grain opacity={c.grain} />
    </AbsoluteFill>
  );
}
