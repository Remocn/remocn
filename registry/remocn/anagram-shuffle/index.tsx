"use client";

import { loadFont } from "@remotion/google-fonts/InstrumentSerif";
import { useId, useMemo } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  interpolateColors,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const { fontFamily: serif } = loadFont("normal", {
  weights: ["400"],
  subsets: ["latin"],
});

export interface AnagramShuffleProps {
  from?: string;
  to?: string;
  accent?: string;
  theme?: "dark" | "light";
  speed?: number;
}

const SERIF_400 = [
  170, 237, 371, 635, 417, 590, 579, 233, 340, 340, 444, 531, 217, 430, 213,
  258, 460, 249, 404, 371, 393, 382, 404, 364, 433, 402, 213, 217, 531, 531,
  531, 317, 660, 457, 478, 480, 530, 453, 408, 521, 546, 249, 249, 496, 413,
  665, 540, 540, 466, 540, 513, 407, 461, 536, 457, 651, 546, 477, 427, 325,
  258, 325, 433, 376, 354, 399, 443, 339, 457, 355, 288, 402, 470, 223, 215,
  451, 220, 704, 470, 408, 444, 442, 318, 308, 259, 454, 393, 597, 385, 401,
  353, 318, 252, 318, 531,
];
const KERN_PAIRS = [
  "AA24 AC34 AG34 AJ12 AO34 AQ34 AS12 AT42 AU36 AV68 AW68 AX80 AY68 Ac12",
  "Ad12 Ae12 Ao12 Aq12 At14 Av48 Aw44 Ax32 Ay50 BT12 BU12 BV12 BW12 BX40",
  "BY28 Bv20 Bw15 By22 CA12 CC12 CG12 CO12 CQ12 CX22 CY12 Cu12 Cv24 Cw20",
  "Cy24 DA24 DT12 DV12 DW12 DX50 DY24 EX37 EY12 Ev24 Ew24 Ey24 FA38 FX28",
  "Fa32 Fc46 Fd46 Fe46 Fg54 Fi12 Fj12 Fm32 Fn32 Fo46 Fp32 Fq46 Fr32 Fs36",
  "Fv24 Fw24 Fx24 Fy24 Fz30 GB14 GD14 GE14 GF14 GH14 GI14 GK14 GL14 GP14",
  "GR14 GU14 GX38 GY12 HA16 HX28 HY30 Ha12 Hc18 Hd18 He18 Hg12 Hi12 Hj12",
  "Ho18 Hq18 Hs12 Hu12 Hv18 Hw18 Hy18 IA16 IX28 IY30 Ia12 Ic18 Id18 Ie18",
  "Ig12 Ii12 Ij12 Io18 Iq18 Is12 Iu12 Iv18 Iw18 Iy18 JA18 JC18 JG18 JO18",
  "JQ18 JS12 JX38 JY38 Ja18 Jc20 Jd20 Je20 Jg16 Ji12 Jm18 Jn18 Jo20 Jp18",
  "Jq20 Jr18 Js18 Ju18 Jv24 Jw24 Jx24 Jy24 Jz24 KA30 KB12 KC46 KD12 KE12",
  "KF12 KG46 KH12 KI12 KK12 KL12 KM12 KN14 KO46 KP12 KQ46 KR12 KS18 KT18",
  "KU32 KV40 KW32 KX30 KY40 Kc18 Kd18 Ke18 Kg12 Ki28 Kj24 Km24 Kn24 Ko18",
  "Kp24 Kq18 Kr24 Ks18 Kt24 Ku24 Kv48 Kw48 Kx36 Ky48 LC14 LG14 LO14 LQ14",
  "LT54 LU14 LV48 LW48 LX38 LY64 Lv32 Lw32 Ly32 MC12 MG12 MO12 MQ12 MT12",
  "MV18 MW18 MX33 MY28 Mu16 Mv24 Mw24 Mx16 My24 NA20 NC12 NG12 NO12 NQ12",
  "NV12 NW12 NX48 NY22 Na18 Nc18 Nd18 Ne18 Ng14 Ni12 Nj12 Nm12 Nn12 No18",
  "Np12 Nq18 Nr12 Ns18 Nu16 Nv20 Nw20 Nx20 Ny20 Nz18 OA24 OT12 OV12 OW12",
  "OX50 OY24 PA40 PT-21 PX42 Pa14 Pc18 Pd18 Pe18 Pg20 Po18 Pq18 Ps14",
  "Pz14 QA24 QT12 QV12 QW12 QX50 QY24 RA50 RB12 RC24 RD12 RE12 RF12 RG24",
  "RH12 RI12 RK12 RL12 RO24 RP12 RQ24 RR12 RT20 RU20 RV20 RW24 RX56 RY28",
  "Ra16 Rc24 Rd24 Re24 Rg18 Rh14 Ri14 Rj14 Rk14 Rl14 Ro24 Rq24 Rt14 Ru14",
  "Rv20 Rw20 Rx20 Ry20 Rz14 SX38 Sv20 Sw20 Sx20 Sy20 TA42 TC12 TG12 TM12",
  "TO12 TQ12 TX28 Ta64 Tc64 Td64 Te64 Tf24 Tg64 Tm48 Tn48 To64 Tp48 Tq64",
  "Tr48 Ts44 Tu36 Tv24 Tw24 Tx28 Ty24 Tz32 UA36 UC12 UG12 UO12 UQ12 UX28",
  "UY15 Ua12 Uc18 Ud18 Ue18 Ug18 Ui18 Uj18 Um12 Un12 Uo18 Up12 Uq18 Ur12",
  "Us18 Uu12 Uv12 Uw12 Ux24 Uy12 Uz14 VA68 VB16 VC18 VD16 VE16 VF16 VG18",
  "VH16 VI16 VK16 VL16 VM16 VN18 VO18 VP16 VQ18 VR16 VS19 VU12 VV24 VW24",
  "VX52 VY24 Va54 Vc62 Vd62 Ve62 Vf24 Vg62 Vi24 Vj24 Vm48 Vn48 Vo62 Vp48",
  "Vq62 Vr48 Vs50 Vt18 Vu40 Vv36 Vw36 Vx48 Vy36 Vz58 WA62 WB16 WC18 WD16",
  "WE16 WF16 WG18 WH16 WI16 WK16 WL16 WM16 WN18 WO18 WP16 WQ18 WR16 WS18",
  "WU12 WV24 WX42 WY18 Wa54 Wc62 Wd62 We62 Wf24 Wg62 Wi24 Wj24 Wm48 Wn48",
  "Wo62 Wp48 Wq62 Wr48 Ws50 Wt18 Wu40 Wv36 Ww36 Wx48 Wy36 Wz58 XA80 XB38",
  "XC64 XD38 XE38 XF38 XG64 XH38 XI38 XJ30 XK38 XL38 XM33 XN38 XO64 XP38",
  "XQ64 XR38 XS43 XT36 XU34 XV48 XW46 XX80 XY50 XZ26 Xa42 Xb24 Xc54 Xd54",
  "Xe54 Xf52 Xg52 Xh28 Xi52 Xj52 Xk28 Xl28 Xm36 Xn36 Xo54 Xp36 Xq54 Xr36",
  "Xs36 Xt48 Xu48 Xv72 Xw72 Xx54 Xy72 Xz48 YA68 YB34 YC32 YD34 YE34 YF34",
  "YG32 YH34 YI34 YJ32 YK34 YL34 YM32 YN22 YO32 YP34 YQ32 YR34 YS17 YU20",
  "YV24 YW18 YX48 Ya78 Yc78 Yd78 Ye78 Yf38 Yg72 Yi24 Yj24 Ym68 Yn68 Yo78",
  "Yp68 Yq78 Yr68 Ys74 Yt50 Yu68 Yv64 Yw64 Yx64 Yy64 Yz74 ZX26 Zv24 Zw24",
  "Zy24 av18 aw18 ay18 bx14 fa24 fc30 fd30 fe30 fg28 fi28 fm24 fn24 fo30",
  "fp24 fq30 fr24 fs24 ft20 fu34 fv38 fw38 fx26 fy38 fz32 gj-20 gu12",
  "gv16 gw16 ka22 kc32 kd32 ke32 kg38 kh12 ki18 kj18 kk12 kl12 km16 kn16",
  "ko32 kp16 kq32 kr16 ks18 kt27 ku36 kv58 kw42 kx60 ky52 kz18 ox14 px14",
  "ra18 rg18 tg12 tt18 tv20 tw20 tx12 ty20 va12 vb12 vc12 vd12 ve12 vg30",
  "vm14 vn14 vo12 vp14 vq12 vr14 vs12 vv18 vw18 vx18 vy18 vz16 wa12 wb12",
  "wc12 wd12 we12 wg30 wm14 wn14 wo12 wp14 wq12 wr14 ws12 wv18 ww18 wx18",
  "wy18 xc16 xd16 xe16 xg14 xo26 xq16 xs14 xv18 xw12 xx20 xy18 ya12 yc16",
  "yd16 ye16 yg32 ym14 yn14 yo16 yp14 yq16 yr14 ys12 yv18 yw18 yx24 yy18",
  "yz14",
].join(" ");
const KERN = new Map(
  KERN_PAIRS.split(" ").map((p) => [p.slice(0, 2), -Number(p.slice(2)) / 1000]),
);
// Instrument Serif 400 metrics (em): advances above, ascent/line box below.
const TRACK = -0.012;
const ASC = 0.99;
const LINE = 1.3;
const CAP = 0.72;
const XH = 0.51;

const ENTER_STAGGER = 2;
const SHUFFLE_AT = 34;
const STAGGER = 3;
const TRAVEL = 30;
const ACCENT_GAP = 10;
const ACCENT_STAGGER = 3;
const ACCENT_LEN = 12;

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_IO = Easing.bezier(0.65, 0, 0.35, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

// gradients.sh palettes, used as a clip-text fill laid out in stage space:
// dark = "halo", light = "pixel-glass" (both run cool → warm left to right).
const THEMES = {
  dark: {
    bg: "#0A0A0B",
    fg: "#F3F2EF",
    dim: "#5E5D5B",
    grain: 0.07,
    stops: ["#3d4dff", "#7d4be6", "#e2457a", "#ffb36b", "#fff4ec"],
  },
  light: {
    bg: "#F5F4F0",
    fg: "#121214",
    dim: "#A9A8A4",
    grain: 0.045,
    stops: ["#3d6bff", "#5a4cf5", "#7a3cff", "#c445d6", "#ff4fb8"],
  },
} as const;

function advance(ch: string) {
  const code = ch.charCodeAt(0);
  return (code >= 32 && code < 127 ? SERIF_400[code - 32] : 620) / 1000;
}

function layoutWord(chars: string[]) {
  const xs: number[] = [];
  const ws: number[] = [];
  let x = 0;
  chars.forEach((ch, i) => {
    if (i > 0) x += KERN.get(chars[i - 1] + ch) ?? 0;
    xs.push(x);
    const w = advance(ch) + TRACK;
    ws.push(w);
    x += w;
  });
  const total = x - TRACK;
  return { xs: xs.map((v) => v - total / 2), ws, total };
}

function mapLetters(a: string[], b: string[]) {
  const used = new Array<boolean>(a.length).fill(false);
  const pick = (j: number, same: (x: string, y: string) => boolean) => {
    let best = -1;
    let bestD = Number.POSITIVE_INFINITY;
    a.forEach((ch, i) => {
      if (used[i] || !same(ch, b[j])) return;
      const d = Math.abs(i / Math.max(1, a.length) - j / Math.max(1, b.length));
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    });
    if (best >= 0) used[best] = true;
    return best;
  };
  const src = b.map((_, j) => pick(j, (x, y) => x === y));
  src.forEach((s, j) => {
    if (s < 0) src[j] = pick(j, (x, y) => x.toLowerCase() === y.toLowerCase());
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

interface Mover {
  key: string;
  glyphFrom: string;
  glyphTo: string;
  x0: number;
  x1: number;
  start: number;
  enterAt: number;
  accentAt: number;
  dir: number;
  lift: number;
  fadeOut: boolean;
  fadeIn: boolean;
}

export function AnagramShuffle({
  from = "listen",
  to = "silent",
  accent = "#3B5BFD",
  theme = "dark",
  speed = 1,
}: AnagramShuffleProps) {
  const t = useCurrentFrame() * speed;
  const { width: W, height: H } = useVideoConfig();
  const c = THEMES[theme];

  const a = useMemo(() => Array.from(from), [from]);
  const b = useMemo(() => Array.from(to), [to]);
  const la = useMemo(() => layoutWord(a), [a]);
  const lb = useMemo(() => layoutWord(b), [b]);
  const span = Math.max(la.total, lb.total, 0.1);
  const F = Math.min(H * 0.52, (W * 0.7) / span);
  // Optically centre lowercase: weight the x-height over the cap height.
  const baseline = H / 2 + ((CAP * 0.35 + XH * 0.65) * F) / 2;

  const movers = useMemo<Mover[]>(() => {
    const { src, orphans } = mapLetters(a, b);
    const lastStart = SHUFFLE_AT + (a.length - 1) * STAGGER;
    const accentBase = lastStart + TRAVEL + ACCENT_GAP;
    const list: Mover[] = [];
    b.forEach((ch, j) => {
      const i = src[j];
      const x1 = (lb.xs[j] + lb.ws[j] / 2) * F;
      const accentAt = accentBase + j * ACCENT_STAGGER;
      if (i < 0) {
        list.push({
          key: `in-${j}`,
          glyphFrom: ch,
          glyphTo: ch,
          x0: x1,
          x1,
          start: lastStart,
          enterAt: 0,
          accentAt,
          dir: 1,
          lift: 0,
          fadeOut: false,
          fadeIn: true,
        });
        return;
      }
      const x0 = (la.xs[i] + la.ws[i] / 2) * F;
      const dx = x1 - x0;
      const still = Math.abs(dx) < F * 0.2;
      list.push({
        key: `m-${i}`,
        glyphFrom: a[i],
        glyphTo: ch,
        x0,
        x1,
        start: SHUFFLE_AT + i * STAGGER,
        enterAt: i * ENTER_STAGGER,
        accentAt,
        dir: still ? 1 : dx > 0 ? 1 : -1,
        lift: still
          ? F * 0.1
          : Math.min(F * 0.48, Math.max(F * 0.18, Math.abs(dx) * 0.42)),
        fadeOut: false,
        fadeIn: false,
      });
    });
    for (const i of orphans) {
      const x0 = (la.xs[i] + la.ws[i] / 2) * F;
      list.push({
        key: `o-${i}`,
        glyphFrom: a[i],
        glyphTo: a[i],
        x0,
        x1: x0,
        start: SHUFFLE_AT + i * STAGGER,
        enterAt: i * ENTER_STAGGER,
        accentAt: Number.POSITIVE_INFINITY,
        dir: -1,
        lift: F * 0.3,
        fadeOut: true,
        fadeIn: false,
      });
    }
    return list;
  }, [a, b, la, lb, F]);

  const ordered = useMemo(
    () => [...movers].sort((m, n) => m.dir - n.dir),
    [movers],
  );

  const halo = Math.max(2, F * 0.03);
  const haloShadow = [0, 45, 90, 135, 180, 225, 270, 315]
    .map((deg) => {
      const r = (deg * Math.PI) / 180;
      return `${(Math.cos(r) * halo).toFixed(2)}px ${(Math.sin(r) * halo).toFixed(2)}px 0 ${c.bg}`;
    })
    .join(", ");

  // One stage-space gradient: every glyph samples it where it stands, so a
  // letter picks up colour as it travels across the word.
  const angle = 100 + 5 * Math.sin(t * 0.018);
  const rad = (angle * Math.PI) / 180;
  const lineLen = W * Math.abs(Math.sin(rad)) + H * Math.abs(Math.cos(rad));
  const along = (x: number) => lineLen / 2 + (x - W / 2) * Math.sin(rad);
  const s0 = along(W / 2 - (span * F) / 2 - F * 0.1);
  const s1 = along(W / 2 + (span * F) / 2 + F * 0.1);
  // The cool end of the palette is the accent itself.
  const stops = [accent, ...c.stops.slice(1)];
  const gradient = `linear-gradient(${angle.toFixed(2)}deg, ${stops
    .map(
      (col, i) =>
        `${col} ${(s0 + ((s1 - s0) * i) / (stops.length - 1)).toFixed(1)}px`,
    )
    .join(", ")})`;
  const PAD = 0.12;

  return (
    <AbsoluteFill style={{ background: c.bg, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          left: W / 2,
          top: baseline,
          fontFamily: serif,
          fontWeight: 400,
          fontSize: F,
          lineHeight: LINE,
          fontKerning: "none",
          whiteSpace: "pre",
        }}
      >
        {ordered.map((m) => {
          const p = interpolate(t, [m.start, m.start + TRAVEL], [0, 1], {
            ...CLAMP,
            easing: EASE_IO,
          });
          const arc = Math.sin(Math.PI * p);
          const enter = interpolate(t, [m.enterAt, m.enterAt + 16], [0, 1], {
            ...CLAMP,
            easing: EASE_OUT,
          });
          const x = m.x0 + (m.x1 - m.x0) * p;
          const over = m.dir > 0;
          const y =
            (over ? -m.lift : m.lift * 0.7) * arc + (1 - enter) * F * 0.14;
          const scale = over ? 1 + 0.09 * arc : 1 - 0.07 * arc;
          const acc = interpolate(
            t,
            [m.accentAt, m.accentAt + ACCENT_LEN],
            [0, 1],
            { ...CLAMP, easing: EASE_OUT },
          );
          const bump = Math.sin(Math.PI * acc) * F * 0.045;
          const yOff = y - bump;
          const solid = over
            ? c.fg
            : interpolateColors(arc, [0, 1], [c.fg, c.dim]);
          // Gradient share: a flash while a letter flies over, then for good.
          const fill = Math.max(over ? arc * 0.85 : 0, acc);
          let opacity = enter;
          if (m.fadeOut) opacity *= interpolate(p, [0, 0.6], [1, 0], CLAMP);
          if (m.fadeIn)
            opacity = interpolate(
              t,
              [m.start + TRAVEL * 0.4, m.start + TRAVEL],
              [0, 1],
              { ...CLAMP, easing: EASE_OUT },
            );
          const swap = m.glyphFrom !== m.glyphTo;
          const mix = swap ? interpolate(p, [0.35, 0.65], [0, 1], CLAMP) : 1;
          const glyph = (o: number, ch: string, key: string) => {
            if (o <= 0) return null;
            const left = -advance(ch) * F * 0.5;
            // Stage position of the gradient span's local origin.
            const gx = W / 2 + x + scale * (left - PAD * F);
            const gy = baseline + yOff - scale * ASC * F;
            return (
              <div key={key} style={{ opacity: o }}>
                {over && arc > 0.02 ? (
                  <span
                    style={{
                      position: "absolute",
                      left,
                      top: 0,
                      color: c.bg,
                      textShadow: haloShadow,
                    }}
                  >
                    {ch}
                  </span>
                ) : null}
                {fill < 1 ? (
                  <span
                    style={{
                      position: "absolute",
                      left,
                      top: 0,
                      color: solid,
                      opacity: 1 - fill,
                    }}
                  >
                    {ch}
                  </span>
                ) : null}
                {fill > 0 ? (
                  <span
                    style={{
                      position: "absolute",
                      left: left - PAD * F,
                      top: 0,
                      padding: `0 ${PAD}em`,
                      opacity: fill,
                      color: "transparent",
                      backgroundImage: gradient,
                      backgroundSize: `${W / scale}px ${H / scale}px`,
                      backgroundPosition: `${-gx / scale}px ${-gy / scale}px`,
                      backgroundRepeat: "no-repeat",
                      WebkitBackgroundClip: "text",
                      backgroundClip: "text",
                    }}
                  >
                    {ch}
                  </span>
                ) : null}
              </div>
            );
          };
          return (
            <div
              key={m.key}
              style={{
                position: "absolute",
                left: 0,
                top: -ASC * F,
                opacity,
                transform: `translate(${x}px, ${yOff}px) scale(${scale})`,
                transformOrigin: `0px ${ASC * F}px`,
              }}
            >
              {swap ? glyph(1 - mix, m.glyphFrom, "from") : null}
              {glyph(mix, m.glyphTo, "to")}
            </div>
          );
        })}
      </div>
      <Grain opacity={c.grain} />
    </AbsoluteFill>
  );
}
