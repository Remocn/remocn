"use client";

import { loadFont } from "@remotion/google-fonts/Onest";
import { useId, useMemo } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  interpolateColors,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const { fontFamily: sans } = loadFont("normal", {
  weights: ["500"],
  subsets: ["latin"],
});

export interface TypoFixProps {
  wrong?: string;
  correct?: string;
  before?: string;
  after?: string;
  accent?: string;
  theme?: "dark" | "light";
  speed?: number;
}

// Onest 500 advance widths (1/1000 em) for ASCII 32–126, plus its kern pairs.
const ONEST_500 = [
  274, 283, 377, 662, 658, 831, 690, 230, 323, 323, 430, 564, 274, 460, 263,
  489, 663, 372, 564, 604, 634, 616, 623, 507, 623, 620, 263, 274, 564, 564,
  564, 519, 987, 684, 662, 707, 723, 614, 601, 724, 732, 272, 567, 641, 581,
  870, 749, 765, 638, 765, 668, 655, 578, 730, 694, 990, 618, 637, 604, 332,
  489, 332, 564, 457, 576, 559, 611, 556, 611, 574, 372, 611, 596, 230, 259,
  533, 230, 830, 596, 596, 611, 611, 380, 510, 369, 579, 543, 851, 530, 603,
  515, 394, 268, 394, 564,
];
const KERN_PAIRS = [
  "AA-15 AC18 AG18 AJ-20 AO18 AQ18 AS18 AT50 AU10 AV50 AW30 AY60 Av30",
  "Aw20 BV10 BW10 BX10 BY10 CA19 CJ-10 CV25 CX24 CY20 DA19 DC-15 DG-15",
  "DJ-10 DO-15 DQ-15 DS-15 DT10 DV25 DX30 DY20 Dd-10 FA50 FJ30 FT-20",
  "Fa30 Fc25 Fd25 Fe25 Fg25 Fo25 Fq25 Fs25 GA19 GJ-10 GT10 GV25 GX24",
  "GY20 JA10 KT-10 Ka10 Kv30 LA-20 LJ-30 LT40 LV50 LW40 LX-10 LY80 La-10",
  "Lc-10 Ld-10 Le-10 Lg-10 Lj-20 Lo-10 Lq-10 Ls-10 Lz-20 OA19 OJ-10 OV26",
  "OX24 OY26 PA52 PC-10 PG-10 PJ50 PQ-10 PS-10 PX25 PY15 Pa20 Pc10 Pd10",
  "Pe10 Pg10 Pj10 Po10 Pq10 Ps10 QA19 QJ-10 QT10 QV25 QX24 QY20 RY20",
  "Ra10 Rc10 Rd10 Re10 Rg10 Ro10 Rq10 Rs10 SA19 SJ-10 ST10 SV25 SX30",
  "SY20 TA54 TG10 TJ80 TQ10 TS10 TT-40 Ta60 Tc50 Td50 Te50 Tg50 Tm20",
  "Tn20 To50 Tp20 Tq50 Tr20 Ts50 Tu20 UA10 Ua20 Uc10 Ud10 Ue10 Ug10 Uo10",
  "Uq10 Us10 VA50 VC25 VG25 VJ80 VO26 VQ25 VS25 Va50 Vc50 Vd50 Ve50 Vg50",
  "Vm20 Vn20 Vo50 Vp20 Vq50 Vr20 Vs50 Vu20 Vz20 WA30 WJ30 Wa35 Wd25 XC24",
  "XG24 XO24 XQ24 XS30 YA60 YC20 YG20 YJ90 YO26 YQ20 YS20 Ya70 Yc70 Yd70",
  "Ye70 Yf20 Yg70 Ym30 Yn30 Yo70 Yp30 Yq70 Yr30 Ys70 Yu30 Yv30 Yw20 Yx20",
  "Yz30 bT50 bV50 bY70 bc-10 bd-10 bf10 bx10 cT50 cV50 cY70 cc-10 cf10",
  "cx10 eT50 eV50 eY70 ec-10 ef10 ex10 fc10 fd10 fe10 fg10 fo10 fq10",
  "fs10 jj-20 oT50 oV50 oY70 of10 ox10 pT50 pV50 pY70 pc-10 pf20 pt20",
  "px10 qj-20 rc10 rd10 re10 rg10 ro10 rq10 rs10 rt-30 sT50 sV50 sY70",
  "sc-10 sf10 st10 sx15 vA30 xc10 xd10 xe10 xg10 xo10 xq10 xs10",
].join(" ");
const KERN = new Map(
  KERN_PAIRS.split(" ").map((p) => [p.slice(0, 2), -Number(p.slice(2)) / 1000]),
);

const TRACK = -0.03;
const ASC = 0.97;
const LINE = 1.275;
const CAP = 0.708;
const SPACE = 0.274 + TRACK;

const ENTER_STAGGER = 3;
const ENTER_LEN = 18;
const SQUIGGLE_AT = 20;
const SQUIGGLE_LEN = 14;
const SWAP_AT = 44;
const SWAP_STAGGER = 1;
const TRAVEL = 20;
const RETRACT_LEN = 10;
const RULE_DELAY = 1;
const RULE_LEN = 10;
const HOLD = 36;

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_IO = Easing.bezier(0.65, 0, 0.35, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

// Ground: gradients.sh "grain" (dark) and "smear" (light), a warm light
// from the top left, kept low so the type and the red squiggle stay crisp.
const THEMES = {
  dark: {
    bg: "#070505",
    fg: "#F5F1EC",
    dim: "#6A605B",
    error: "#FF5A4F",
    grain: 0.08,
    glow: "rgba(255, 216, 180, 0.36)",
    wash: [
      "rgba(224, 112, 59, 0.85)",
      "rgba(138, 44, 29, 0.62)",
      "rgba(43, 16, 21, 0.55)",
    ],
  },
  light: {
    bg: "#F5F2EC",
    fg: "#141212",
    dim: "#ABA39C",
    error: "#D9302C",
    grain: 0.05,
    glow: "rgba(255, 236, 200, 0.6)",
    wash: [
      "rgba(247, 178, 59, 0.62)",
      "rgba(242, 85, 44, 0.36)",
      "rgba(232, 137, 181, 0.2)",
    ],
  },
} as const;

function advance(ch: string) {
  const code = ch.charCodeAt(0);
  return (code >= 32 && code < 127 ? ONEST_500[code - 32] : 620) / 1000;
}

function textEm(s: string) {
  let w = 0;
  for (let i = 0; i < s.length; i++) {
    if (i > 0) w += KERN.get(s[i - 1] + s[i]) ?? 0;
    w += advance(s[i]) + TRACK;
  }
  return w;
}

function layoutWord(chars: string[]) {
  const xs: number[] = [];
  let x = 0;
  chars.forEach((ch, i) => {
    if (i > 0) x += KERN.get(chars[i - 1] + ch) ?? 0;
    xs.push(x);
    x += advance(ch) + TRACK;
  });
  return { xs, total: x };
}

function mapLetters(a: string[], b: string[]) {
  const used = new Array<boolean>(a.length).fill(false);
  const src = new Array<number>(b.length).fill(-1);
  b.forEach((ch, j) => {
    if (a[j] === ch) {
      src[j] = j;
      used[j] = true;
    }
  });
  const pick = (j: number, same: (x: string, y: string) => boolean) => {
    let best = -1;
    let bestD = Number.POSITIVE_INFINITY;
    a.forEach((ch, i) => {
      if (used[i] || !same(ch, b[j])) return;
      const d = Math.abs(i - j);
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    });
    if (best >= 0) used[best] = true;
    return best;
  };
  b.forEach((_, j) => {
    if (src[j] < 0) src[j] = pick(j, (x, y) => x === y);
  });
  b.forEach((_, j) => {
    if (src[j] < 0)
      src[j] = pick(j, (x, y) => x.toLowerCase() === y.toLowerCase());
  });
  const orphans = a.map((_, i) => i).filter((i) => !used[i]);
  return { src, orphans };
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
          seed={23}
          stitchTiles="stitch"
        />
        <feColorMatrix values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0.9 0" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#${id})`} />
    </svg>
  );
}

interface Glyph {
  key: string;
  ch: string;
  x0: number;
  x1: number;
  start: number;
  lift: number;
  over: boolean;
  fadeIn: boolean;
  fadeOut: boolean;
}

export function typoFixDuration(wrong = "Lanuch") {
  return (
    SWAP_AT +
    Math.max(0, wrong.length - 1) * SWAP_STAGGER +
    TRAVEL +
    RULE_DELAY +
    RULE_LEN +
    HOLD
  );
}

export function TypoFix({
  wrong = "Lanuch",
  correct = "Launch",
  before = "",
  after = "day",
  accent = "#3B5BFD",
  theme = "dark",
  speed = 1,
}: TypoFixProps) {
  const t = useCurrentFrame() * speed;
  const { width: W, height: H, fps } = useVideoConfig();
  const c = THEMES[theme];
  const clipId = `tf${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;

  const a = useMemo(() => Array.from(wrong), [wrong]);
  const b = useMemo(() => Array.from(correct), [correct]);
  const la = useMemo(() => layoutWord(a), [a]);
  const lb = useMemo(() => layoutWord(b), [b]);
  const beforeW = before ? textEm(before) + SPACE : 0;
  const afterW = after ? SPACE + textEm(after) : 0;

  const glyphs = useMemo<Glyph[]>(() => {
    const { src, orphans } = mapLetters(a, b);
    let order = 0;
    const list: Glyph[] = b.map((ch, j) => {
      const i = src[j];
      const x1 = lb.xs[j];
      if (i < 0)
        return {
          key: `in-${j}`,
          ch,
          x0: x1,
          x1,
          start: SWAP_AT,
          lift: 0,
          over: true,
          fadeIn: true,
          fadeOut: false,
        };
      const x0 = la.xs[i];
      const dx = x1 - x0;
      const moving = Math.abs(dx) > 0.02;
      return {
        key: `m-${i}`,
        ch,
        x0,
        x1,
        start: SWAP_AT + (moving ? order++ * SWAP_STAGGER : 0),
        lift: moving ? Math.min(0.62, Math.max(0.44, Math.abs(dx) * 0.85)) : 0,
        over: dx > 0,
        fadeIn: false,
        fadeOut: false,
      };
    });
    for (const i of orphans)
      list.push({
        key: `o-${i}`,
        ch: a[i],
        x0: la.xs[i],
        x1: la.xs[i],
        start: SWAP_AT,
        lift: 0,
        over: false,
        fadeIn: false,
        fadeOut: true,
      });
    return list.sort((m, n) => Number(m.over) - Number(n.over));
  }, [a, b, la, lb]);

  const swapEnd = Math.max(...glyphs.map((g) => g.start)) + TRAVEL;
  const fix = EASE_IO(interpolate(t, [SWAP_AT, swapEnd], [0, 1], CLAMP));
  const wordW = la.total + (lb.total - la.total) * fix;
  const maxTotal = beforeW + Math.max(la.total, lb.total) - TRACK + afterW;
  const F = Math.min(H * 0.27, (W * 0.8) / Math.max(maxTotal, 0.1));
  const total = beforeW + wordW - TRACK + afterW;
  const left = -total / 2;
  const wordLeft = left + beforeW;
  const baseline = H / 2 + (CAP * F) / 2;

  const enter = (k: number) =>
    EASE_OUT(
      interpolate(
        t,
        [k * ENTER_STAGGER, k * ENTER_STAGGER + ENTER_LEN],
        [0, 1],
        CLAMP,
      ),
    );
  const wordEnter = enter(before ? 1 : 0);

  const ulY = baseline + 0.19 * F;
  const ulX0 = W / 2 + wordLeft * F;
  const ulX1 = W / 2 + (wordLeft + la.total - TRACK) * F;
  const amp = 0.036 * F;
  const wave = 0.13 * F;
  const pts: string[] = [];
  for (let x = ulX0; x <= ulX1 + 0.5; x += 2) {
    const y = ulY + amp * Math.sin(((x - ulX0) / wave) * Math.PI * 2);
    pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  }
  const draw = EASE_OUT(
    interpolate(t, [SQUIGGLE_AT, SQUIGGLE_AT + SQUIGGLE_LEN], [0, 1], CLAMP),
  );
  const retractAt = swapEnd - RETRACT_LEN + 2;
  const retract = EASE_IO(
    interpolate(t, [retractAt, retractAt + RETRACT_LEN], [0, 1], CLAMP),
  );
  const clipL = ulX0 - amp + (ulX1 - ulX0 + 2 * amp) * retract;
  const clipR = ulX0 - amp + (ulX1 - ulX0 + 2 * amp) * draw;

  const ruleAt = swapEnd + RULE_DELAY;
  const rule = EASE_OUT(
    interpolate(t, [ruleAt, ruleAt + RULE_LEN], [0, 1], CLAMP),
  );
  const ruleT = Math.max(3, 0.045 * F);
  const ruleX0 = W / 2 + wordLeft * F;
  const ruleW = (lb.total - TRACK) * F;
  const settle = spring({
    frame: t - swapEnd,
    fps,
    config: { damping: 14, stiffness: 220, mass: 0.6 },
  });
  const tick = t >= swapEnd ? Math.sin(Math.PI * Math.min(1, settle)) : 0;

  const textStyle = {
    position: "absolute" as const,
    top: `${-ASC}em`,
    letterSpacing: `${TRACK}em`,
    whiteSpace: "pre" as const,
    color: c.fg,
  };

  // The light drifts a few percent across the shot.
  const drift = interpolate(t, [0, swapEnd + RULE_LEN + HOLD], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const gx = 10 + 5 * drift;
  const gy = 8 + 3 * drift;
  const ground = [
    `radial-gradient(48% 42% at ${gx.toFixed(2)}% ${gy.toFixed(2)}%, ${c.glow} 0%, transparent 60%)`,
    `linear-gradient(${(150 - 4 * drift).toFixed(2)}deg, ${c.wash[0]} 0%, ${c.wash[1]} 20%, ${c.wash[2]} 40%, transparent 62%)`,
  ].join(", ");

  return (
    <AbsoluteFill style={{ background: c.bg, overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, background: ground }} />
      <svg
        width={W}
        height={H}
        style={{ position: "absolute", inset: 0 }}
        aria-hidden
      >
        <defs>
          <clipPath id={clipId}>
            <rect
              x={clipL}
              y={ulY - amp * 3}
              width={Math.max(0, clipR - clipL)}
              height={amp * 6}
            />
          </clipPath>
        </defs>
        {draw > 0 && retract < 1 ? (
          <polyline
            points={pts.join(" ")}
            fill="none"
            stroke={c.error}
            strokeWidth={Math.max(2, 0.03 * F)}
            strokeLinecap="round"
            strokeLinejoin="round"
            clipPath={`url(#${clipId})`}
          />
        ) : null}
      </svg>
      {rule > 0 ? (
        <div
          style={{
            position: "absolute",
            left: ruleX0,
            top: ulY - ruleT / 2,
            width: ruleW * rule,
            height: ruleT,
            borderRadius: ruleT / 2,
            background: accent,
          }}
        />
      ) : null}
      <div
        style={{
          position: "absolute",
          left: W / 2,
          top: baseline,
          fontFamily: sans,
          fontWeight: 500,
          fontSize: F,
          lineHeight: LINE,
          fontKerning: "none",
        }}
      >
        {before ? (
          <div
            style={{
              ...textStyle,
              left: `${left}em`,
              fontKerning: "normal",
              opacity: enter(0),
              transform: `translateY(${(1 - enter(0)) * 0.2}em)`,
            }}
          >
            {before}
          </div>
        ) : null}
        <div
          style={{
            position: "absolute",
            left: `${wordLeft}em`,
            top: 0,
            opacity: wordEnter,
            transform: `translateY(${(1 - wordEnter) * 0.2 - tick * 0.035}em)`,
          }}
        >
          {glyphs.map((g) => {
            const p = EASE_IO(
              interpolate(t, [g.start, g.start + TRAVEL], [0, 1], CLAMP),
            );
            const arc = Math.sin(Math.PI * p);
            const x = g.x0 + (g.x1 - g.x0) * p;
            const y = g.over ? -g.lift * arc : g.lift * 0.85 * arc;
            const scale = g.lift
              ? g.over
                ? 1 + 0.08 * arc
                : 1 - 0.08 * arc
              : 1;
            let opacity = 1;
            if (g.fadeIn) opacity = interpolate(p, [0.4, 1], [0, 1], CLAMP);
            if (g.fadeOut) opacity = interpolate(p, [0, 0.6], [1, 0], CLAMP);
            const color =
              g.lift && !g.over
                ? interpolateColors(arc, [0, 1], [c.fg, c.dim])
                : c.fg;
            return (
              <div
                key={g.key}
                style={{
                  ...textStyle,
                  left: 0,
                  color,
                  opacity,
                  transform: `translate(${x}em, ${y}em) scale(${scale})`,
                  transformOrigin: `${advance(g.ch) / 2}em ${ASC}em`,
                }}
              >
                {g.ch}
              </div>
            );
          })}
        </div>
        {after ? (
          <div
            style={{
              ...textStyle,
              left: `${wordLeft + wordW + SPACE}em`,
              fontKerning: "normal",
              opacity: enter(before ? 2 : 1),
              transform: `translateY(${(1 - enter(before ? 2 : 1)) * 0.2}em)`,
            }}
          >
            {after}
          </div>
        ) : null}
      </div>
      <Grain opacity={c.grain} />
    </AbsoluteFill>
  );
}
