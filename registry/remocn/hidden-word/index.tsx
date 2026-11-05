"use client";

import { loadFont } from "@remotion/google-fonts/HankenGrotesk";
import { loadFont as loadSerif } from "@remotion/google-fonts/InstrumentSerif";
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
  weights: ["400"],
  subsets: ["latin"],
});
const { fontFamily: serif } = loadSerif("italic", {
  weights: ["400"],
  subsets: ["latin"],
});

export interface HiddenWordProps {
  /** The sentence, set as editorial body type. */
  text?: string;
  /** The word hiding in it; its letters are found in order inside `text`. */
  word?: string;
  accent?: string;
  theme?: "dark" | "light";
  speed?: number;
}

// Hanken Grotesk 400 (the sentence) and Instrument Serif italic 400 (the
// found word): advance widths (1/1000 em) for ASCII 32–126, punctuation,
// kern pairs and vertical metrics.
const HANKEN_400 = [
  260, 240, 338, 699, 560, 747, 686, 174, 222, 222, 398, 560, 240, 327, 240,
  418, 560, 560, 560, 560, 560, 560, 560, 560, 560, 560, 240, 240, 560, 560,
  560, 516, 874, 637, 601, 704, 682, 585, 565, 731, 678, 246, 552, 634, 495,
  839, 676, 748, 554, 774, 598, 564, 587, 656, 656, 957, 641, 602, 582, 258,
  448, 258, 552, 405, 292, 540, 587, 518, 587, 540, 335, 514, 547, 226, 226,
  532, 265, 828, 547, 577, 587, 587, 407, 470, 346, 547, 521, 748, 520, 521,
  472, 239, 258, 239, 560,
];
const SERIF_ITALIC_400 = [
  170, 275, 374, 629, 424, 591, 525, 235, 346, 346, 449, 531, 219, 426, 219,
  258, 461, 248, 404, 373, 394, 387, 411, 365, 437, 414, 299, 301, 531, 531,
  531, 358, 665, 457, 479, 475, 536, 454, 411, 514, 545, 250, 251, 499, 414,
  665, 542, 540, 469, 541, 525, 424, 461, 537, 458, 653, 545, 478, 427, 326,
  256, 326, 431, 372, 355, 474, 431, 351, 474, 348, 273, 401, 476, 288, 266,
  447, 240, 745, 521, 414, 450, 425, 368, 302, 272, 508, 412, 609, 450, 418,
  385, 320, 252, 320, 531,
];
const PUNCT_HANKEN: Record<string, number> = {
  "‘": 263,
  "’": 263,
  "“": 436,
  "”": 438,
  "…": 668,
  "–": 412,
  "—": 1058,
};
const PUNCT_SERIF: Record<string, number> = {
  "‘": 166,
  "’": 166,
  "“": 316,
  "”": 316,
  "…": 539,
  "–": 505,
  "—": 715,
};
const KERN_HANKEN = [
  "AC31 AG31 AO31 AQ31 AT95 AU27 AV81 AW72 AY90 Af43 Al10 At47 Av55 Aw45",
  "Ay55 A’48 A“49 A”48 BT26 BV31 BW24 BX20 BY42 Bv12 By12 B’10 B“15 B”10",
  "CA10 CV12 CX20 CY23 D,27 DA31 DT48 DV36 DW22 DX51 DY53 DZ33 EJ10 ES10",
  "Ef12 Et14 Ev24 Ew16 Ey24 E“15 F,63 FA83 FC10 FG10 FJ42 FO10 FQ10 FS28",
  "Fa42 Fc31 Fd31 Fe31 Ff15 Fg38 Fm37 Fn37 Fo31 Fp37 Fq31 Fr37 Fs40 Ft15",
  "Fu32 Fv37 Fw31 Fx49 Fy37 Fz39 GT36 GV33 GW23 GY45 Gv13 Gy13 G’11 G“19",
  "G”11 J,13 JA26 KC49 KG49 KO49 KQ49 KS15 Kc25 Kd25 Ke25 Kf44 Ko25 Kq25",
  "Kt49 Ku19 Kv69 Kw60 Ky69 K’26 K“36 K”26 LC46 LG46 LO46 LQ46 LT119",
  "LU31 LV110 LW102 LY116 Lc10 Ld10 Le10 Lf45 Lo10 Lq10 Lt50 Lv89 Lw57",
  "Ly89 L’59 L“60 L”59 O,27 OA31 OT44 OV34 OW21 OX49 OY50 OZ33 P,63 PA81",
  "PJ64 PX20 PZ20 Pa16 Pc30 Pd30 Pe30 Pg24 Po30 Pq30 Ps19 QJ11 QS16 QT56",
  "QV47 QW34 QY62 RC16 RG16 RJ15 RO16 RQ16 RS15 RT21 RU17 RV29 RW21 RY39",
  "Rc21 Rd21 Re21 Ro21 Rq21 SV23 SW17 SX14 SY31 Sf32 St31 Sv33 Sw17 Sx14",
  "Sy33 S’33 S“36 S”33 T,49 TA95 TC44 TG44 TJ36 TO44 TQ44 TS19 Ta95 Tc95",
  "Td95 Te95 Tf40 Tg92 Tm92 Tn92 To95 Tp92 Tq95 Tr92 Ts95 Tt43 Tu93 Tv76",
  "Tw80 Tx81 Ty76 Tz98 T“11 U,13 UA26 V,49 VA81 VC34 VG34 VJ40 VO34 VQ34",
  "VS27 Va68 Vc68 Vd68 Ve68 Vf16 Vg68 Vm57 Vn57 Vo68 Vp57 Vq68 Vr57 Vs69",
  "Vt17 Vu55 Vv24 Vw28 Vx29 Vy24 Vz49 V“10 W,43 WA72 WC21 WG21 WJ43 WO21",
  "WQ21 WS20 Wa47 Wc50 Wd50 We50 Wg52 Wm37 Wn37 Wo50 Wp37 Wq50 Wr37 Ws48",
  "Wu34 Wv11 Ww16 Wx17 Wy11 Wz32 XC48 XG48 XJ12 XO48 XQ48 XS16 Xc27 Xd27",
  "Xe27 Xf37 Xo27 Xq27 Xt41 Xu20 Xv66 Xw59 Xy66 X’19 X“33 X”19 Y,50 YA90",
  "YC49 YG49 YJ36 YO49 YQ49 YS36 Ya81 Yc83 Yd83 Ye83 Yf34 Yg80 Ym78 Yn78",
  "Yo83 Yp78 Yq83 Yr78 Ys83 Yt35 Yu80 Yv45 Yw49 Yx50 Yy45 Yz71 Y“21 ZC35",
  "ZG35 ZO35 ZQ35 Zc18 Zd18 Ze18 Zf25 Zo18 Zq18 Zt27 Zv51 Zw49 Zy51 Z“24",
  "av13 ay13 bf22 bt21 bv14 bx24 by14 bz11 b’36 b“33 b”36 ev10 ex11 ey10",
  "f,62 f.60 fc30 fd30 fe30 ff90 fg22 fi10 fl10 fo30 fq30 fs10 gs11 hf16",
  "ht13 hv13 hy13 h’27 h“26 h”27 kc26 kd26 ke26 kl27 ko26 kq26 lf20 lt10",
  "l’28 l“32 l”28 mv13 my13 nv13 ny13 of10 ot11 ov14 ox25 oy14 oz12 r,49",
  "r.100 ra13 rc28 rd28 re28 rg23 rl20 ro28 rq28 rs15 tc10 td10 te10",
  "to10 tq10 v,40 vc14 vd14 ve14 vg12 vo14 vq14 w,34 xc25 xd25 xe25 xo25",
  "xq25 y,40 yc14 yd14 ye14 yg12 yo14 yq14 zc11 zd11 ze11 zo11 zq11",
].join(" ");
const KERN_SERIF = [
  "AA24 AB16 AC46 AD16 AE16 AF16 AG46 AH16 AI16 AJ12 AK16 AL16 AN16 AO46",
  "AP16 AQ46 AR16 AS12 AT50 AU36 AV68 AW68 AX90 AY73 Aa18 Ab18 Ac18 Ad18",
  "Ae18 Af12 Ag12 Ah12 Ai24 Aj16 Ak12 Al12 Am18 An18 Ao18 Aq18 Ar18 At18",
  "Au20 Av32 Aw32 Ay48 BT12 BU12 BV16 BW16 BX40 BY28 CC12 CG12 CO12 CQ12",
  "CX22 CY12 Cg24 Cu24 Cv24 Cw24 Cy24 DA20 DB10 DD10 DE10 DF10 DH10 DI10",
  "DK10 DL10 DP10 DR10 DS12 DT12 DV22 DW22 DX54 DY36 EV12 EW12 EX37 EY20",
  "Ec12 Ed12 Ee12 Eg18 Em12 En12 Eo12 Eq12 Er12 Eu12 Ev24 Ew24 Ex10 Ey24",
  "FA42 FX30 Fa48 Fc48 Fd48 Fe48 Fg44 Fm18 Fn18 Fo48 Fp18 Fq48 Fr18 Fs24",
  "Fu18 Fv18 Fw18 Fx18 Fy18 GB14 GD14 GE14 GF14 GH14 GI14 GK14 GL14 GP14",
  "GR14 GU14 GX38 GY12 Ga12 Gg12 HA10 HV10 HW10 HX30 HY30 Ha18 Hc18 Hd18",
  "He18 Hg14 Ho18 Hq18 Hs18 IA10 IV10 IW10 IX30 IY30 Ia18 Ic18 Id18 Ie18",
  "Ig14 Io18 Iq18 Is18 JA18 JC18 JG18 JO18 JQ18 JS12 JV12 JW12 JX38 JY38",
  "Ja14 Jc16 Jd16 Je16 Jg14 Jo16 Jq16 KA30 KB12 KC52 KD12 KE12 KF12 KG52",
  "KH12 KI12 KK12 KL12 KM12 KN14 KO52 KP12 KQ52 KR12 KS18 KT18 KU32 KV52",
  "KW42 KX30 KY58 Ka28 Kc38 Kd38 Ke38 Kf12 Kg18 Ki32 Kj24 Km32 Kn32 Ko38",
  "Kp32 Kq38 Kr32 Ks14 Kt24 Ku38 Kv38 Kw38 Kx18 Ky46 LC14 LG14 LO14 LQ14",
  "LT54 LU14 LV56 LW56 LX38 LY64 MC12 MG12 MO12 MQ12 MT12 MU10 MV18 MW18",
  "MX33 MY28 Mg12 Mu12 Mv12 Mw12 NA16 NC12 NG12 NO12 NQ12 NV12 NW12 NX48",
  "NY22 Na12 Nc12 Nd12 Ne12 No12 Nq12 OA20 OB10 OD10 OE10 OF10 OH10 OI10",
  "OK10 OL10 OP10 OR10 OS12 OT12 OV22 OW22 OX54 OY36 PA40 PT-21 PX42",
  "Pa24 Pc24 Pd24 Pe24 Pg18 Po24 Pq24 QA20 QB10 QD10 QE10 QF10 QH10 QI10",
  "QK10 QL10 QP10 QR10 QS12 QT12 QV22 QW22 QX54 QY36 RA61 RB12 RC24 RD12",
  "RE12 RF12 RG24 RH12 RI12 RK12 RL12 RO24 RP12 RQ24 RR12 RT20 RU20 RV20",
  "RW24 RX56 RY28 Ra28 Rc32 Rd32 Re32 Rg24 Ro32 Rq32 SU16 SV18 SW18 SX46",
  "SY20 TA42 TM12 TX38 Ta72 Tc64 Td64 Te64 Tg60 Tm24 Tn24 To64 Tp24 Tq64",
  "Tr24 Ts36 Tu36 Tv36 Tw36 Tx36 Ty36 Tz24 UA26 UC12 UG12 UO12 UQ12 US10",
  "UV10 UW10 UX28 UY15 Uc10 Ud10 Ue10 Ug12 Uo10 Uq10 Ux16 Uy12 VA58 VB12",
  "VC14 VD12 VE12 VF12 VG14 VH12 VI12 VJ12 VK12 VL12 VM16 VN18 VO14 VP12",
  "VQ14 VR12 VS10 VU12 VV24 VW24 VX52 VY24 Va64 Vc54 Vd54 Ve54 Vg64 Vm36",
  "Vn36 Vo54 Vp36 Vq54 Vr36 Vt12 Vu32 Vv40 Vw40 Vx40 Vy40 Vz32 WA52 WB10",
  "WC14 WD10 WE10 WF10 WG14 WH10 WI10 WJ12 WK10 WL10 WM16 WN18 WO14 WP10",
  "WQ14 WR10 WS10 WU12 WV24 WX42 WY18 Wa64 Wc54 Wd54 We54 Wg64 Wm36 Wn36",
  "Wo54 Wp36 Wq54 Wr36 Wt12 Wu32 Wv40 Ww40 Wx40 Wy40 Wz32 XA70 XB38 XC64",
  "XD38 XE38 XF38 XG64 XH38 XI38 XJ30 XK38 XL38 XM33 XN38 XO64 XP38 XQ64",
  "XR38 XS40 XT36 XU34 XV48 XW46 XX80 XY50 XZ26 Xa48 Xc48 Xd48 Xe48 Xf34",
  "Xg54 Xh24 Xi48 Xj38 Xk24 Xl24 Xm58 Xn58 Xo48 Xp58 Xq48 Xr58 Xs38 Xt50",
  "Xu60 Xv60 Xw60 Xx60 Xy64 Xz54 YA62 YB34 YC24 YD34 YE34 YF34 YG24 YH34",
  "YI34 YJ32 YK34 YL34 YM32 YN22 YO24 YP34 YQ24 YR34 YS14 YU20 YV24 YW18",
  "YX48 Ya78 Yc64 Yd64 Ye64 Yf27 Yg64 Yi18 Yj10 Ym44 Yn44 Yo64 Yp44 Yq64",
  "Yr44 Ys54 Yt18 Yu48 Yv48 Yw48 Yx68 Yy40 Yz56 ZX26 af14 ag18 at12 ay28",
  "bx22 dg18 dt12 dy28 fa28 fc22 fd22 fe22 ff22 fg24 fh18 fi18 fj18 fk18",
  "fl18 fm12 fn12 fo32 fp12 fq22 fr12 fs12 ft22 fu12 fx22 fy18 ga12 gc12",
  "gd12 ge12 go12 gq12 hg14 ig14 ja18 jc18 jd18 je18 jf14 jg32 ji12 jo18",
  "jq18 kc10 kd10 ke10 kf12 ko10 kq10 kt10 lg14 mg14 ng14 ox22 px22 qx14",
  "ra18 rc18 rd18 re18 rg18 ro18 rq18 ry-20 tg18 ug14 vo12 xb12 xc18",
  "xd18 xe18 xo18 xq18 yo12 zb10",
].join(" ");

const kernMap = (pairs: string) =>
  new Map(
    pairs.split(" ").map((p) => [p.slice(0, 2), -Number(p.slice(2)) / 1000]),
  );

const BODY = {
  adv: HANKEN_400,
  punct: PUNCT_HANKEN,
  kern: kernMap(KERN_HANKEN),
  track: -0.008,
  asc: 1,
  desc: 0.303,
};
const DISPLAY = {
  adv: SERIF_ITALIC_400,
  punct: PUNCT_SERIF,
  kern: kernMap(KERN_SERIF),
  track: -0.01,
  asc: 0.99,
  desc: 0.31,
};
type Face = typeof BODY;

const LINE = 1.4;
const CAP = 0.697;
const DESC = 0.21;
const LEADING = 1.42;
const SERIF_X = 0.51;

/** Distance (em) from a line box's top to its baseline, for `face` at LINE. */
const baseOf = (face: Face) => (LINE - face.asc - face.desc) / 2 + face.asc;

// Timing, in frames at speed 1.
const ENTER = 22;
const LINE_STAGGER = 4;
const LIGHT_AT = 44;
const LIGHT_STAGGER = 7;
const LIGHT = 10;
const DIM_AT = 48;
const DIM = 28;
const LIFT_AT = 86;
const LIFT_STAGGER = 6;
const FLIGHT = 30;
const MOVE_AT = 82;
const MOVE = 40;
const SETTLE_GAP = 4;
const SETTLE = 14;

const GHOST_SCALE = 0.66;

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_IO = Easing.bezier(0.65, 0, 0.35, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

// Ground: gradients.sh "mist" (dark) and "pixel-glass" (light), a low
// bloom from the lower right. Dim/ghost greys are translucent so they sit
// cleanly on the gradient instead of turning muddy.
const THEMES = {
  dark: {
    bg: "#060609",
    fg: "#F3F2EF",
    dim: "rgba(243, 242, 239, 0.36)",
    ghost: "rgba(243, 242, 239, 0.24)",
    grain: 0.07,
    mist: [
      "rgba(244, 217, 255, 0.5)",
      "rgba(167, 123, 255, 0.46)",
      "rgba(59, 42, 158, 0.5)",
      "rgba(18, 13, 51, 0.6)",
    ],
  },
  light: {
    bg: "#F5F4F0",
    fg: "#121214",
    dim: "rgba(18, 18, 20, 0.36)",
    ghost: "rgba(18, 18, 20, 0.26)",
    grain: 0.045,
    mist: [
      "rgba(255, 79, 184, 0.26)",
      "rgba(122, 60, 255, 0.24)",
      "rgba(61, 107, 255, 0.14)",
      "rgba(61, 107, 255, 0.04)",
    ],
  },
} as const;

function advance(face: Face, ch: string) {
  const code = ch.charCodeAt(0);
  if (code >= 32 && code < 127) return face.adv[code - 32] / 1000;
  return (face.punct[ch] ?? 620) / 1000;
}

/** Left edge (em) of every glyph in a run, with kerning and tracking. */
function layoutRun(face: Face, chars: string[]) {
  const xs: number[] = [];
  let x = 0;
  chars.forEach((ch, i) => {
    if (i > 0) x += face.kern.get(chars[i - 1] + ch) ?? 0;
    xs.push(x);
    x += advance(face, ch) + face.track;
  });
  return { xs, total: Math.max(0, x - face.track) };
}

/** Line breaks at a measure, then narrowed until the lines balance. */
function breakLines(words: string[][], measure: number) {
  const space = advance(BODY, " ") + BODY.track;
  const widths = words.map((w) => layoutRun(BODY, w).total);
  const wrap = (max: number) => {
    const lines: number[][] = [];
    let line: number[] = [];
    let width = 0;
    widths.forEach((w, i) => {
      const next = line.length ? width + space + w : w;
      if (line.length && next > max) {
        lines.push(line);
        line = [i];
        width = w;
      } else {
        line.push(i);
        width = next;
      }
    });
    if (line.length) lines.push(line);
    return lines;
  };
  const count = wrap(measure).length;
  let lo = Math.max(...widths, 0);
  let hi = measure;
  for (let n = 0; n < 24; n++) {
    const mid = (lo + hi) / 2;
    if (wrap(mid).length > count) lo = mid;
    else hi = mid;
  }
  return wrap(hi);
}

/** Pick the letters of `word` in order, spread as evenly as the sentence allows. */
function findLetters(text: string[], word: string[]) {
  const n = word.length;
  const len = text.length;
  if (!n) return [];
  const cost = (j: number, i: number) => {
    const a = text[i];
    const b = word[j];
    if (a.toLowerCase() !== b.toLowerCase()) return Number.POSITIVE_INFINITY;
    const target = ((j + 0.5) / n) * len;
    return Math.abs(i - target) + (a === b ? 0 : len * 0.25);
  };
  // best[j][i]: cheapest placement of letters 0..j with letter j at index i.
  const best: number[][] = [];
  const from: number[][] = [];
  for (let j = 0; j < n; j++) {
    best.push(new Array<number>(len).fill(Number.POSITIVE_INFINITY));
    from.push(new Array<number>(len).fill(-1));
    let run = Number.POSITIVE_INFINITY;
    let runAt = -1;
    for (let i = 0; i < len; i++) {
      const c = cost(j, i);
      if (j === 0) best[j][i] = c;
      else if (runAt >= 0 && c < Number.POSITIVE_INFINITY) {
        best[j][i] = run + c;
        from[j][i] = runAt;
      }
      if (j > 0 && best[j - 1][i] < run) {
        run = best[j - 1][i];
        runAt = i;
      }
    }
  }
  let end = -1;
  best[n - 1].forEach((v, i) => {
    if (v < Number.POSITIVE_INFINITY && (end < 0 || v < best[n - 1][end]))
      end = i;
  });
  if (end < 0) {
    // Not every letter is in the sentence: match greedily, leave gaps as -1.
    let at = 0;
    return word.map((ch) => {
      for (let i = at; i < len; i++)
        if (text[i].toLowerCase() === ch.toLowerCase()) {
          at = i + 1;
          return i;
        }
      return -1;
    });
  }
  const out = new Array<number>(n).fill(-1);
  for (let j = n - 1, i = end; j >= 0; j--) {
    out[j] = i;
    i = from[j][i];
  }
  return out;
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

interface Glyph {
  ch: string;
  x: number;
  line: number;
}

export function HiddenWord({
  text = "Small teams make their launch film in code and post it by Friday.",
  word = "ship",
  accent = "#3B5BFD",
  theme = "dark",
  speed = 1,
}: HiddenWordProps) {
  const t = useCurrentFrame() * speed;
  const { width: W, height: H } = useVideoConfig();
  const c = THEMES[theme];

  const B = Math.min(H * 0.068, W * 0.038);
  const set = useMemo(() => {
    const chars = Array.from(text);
    const words: string[][] = [];
    const starts: number[] = [];
    chars.forEach((ch, i) => {
      if (ch === " ") return;
      if (i === 0 || chars[i - 1] === " ") {
        words.push([]);
        starts.push(i);
      }
      words[words.length - 1].push(ch);
    });
    const lines = breakLines(words, (W * 0.66) / B);
    const space = advance(BODY, " ") + BODY.track;
    const glyphs: (Glyph | null)[] = chars.map(() => null);
    let blockWidth = 0;
    lines.forEach((line, l) => {
      let x = 0;
      line.forEach((wi, k) => {
        if (k > 0) x += space;
        const run = layoutRun(BODY, words[wi]);
        run.xs.forEach((gx, g) => {
          glyphs[starts[wi] + g] = { ch: words[wi][g], x: x + gx, line: l };
        });
        x += run.total;
      });
      blockWidth = Math.max(blockWidth, x);
    });
    return { chars, glyphs, lines: lines.length, blockWidth };
  }, [text, W, B]);

  const target = useMemo(() => Array.from(word), [word]);
  const picks = useMemo(
    () => findLetters(set.chars, target),
    [set.chars, target],
  );
  const display = useMemo(() => layoutRun(DISPLAY, target), [target]);

  // Opening layout: the sentence block centred in frame.
  const lineGap = B * LEADING;
  const blockLeft = W / 2 - (set.blockWidth * B) / 2;
  const firstBase =
    H / 2 - ((set.lines - 1) * lineGap) / 2 + (CAP * B) / 2 - B * 0.04;
  const blockTop = firstBase - CAP * B;
  const blockBottom = firstBase + (set.lines - 1) * lineGap + DESC * B;
  const blockMid = (blockTop + blockBottom) / 2;

  // Poster layout: the display word over the sentence, now a small caption.
  const F = Math.min(H * 0.42, (W * 0.6) / Math.max(0.1, display.total));
  const ghostH = (blockBottom - blockTop) * GHOST_SCALE;
  const gap = H * 0.085;
  // The found word is lowercase: centre it on its x-height, not the caps.
  const topE = (CAP + SERIF_X) / 2;
  const groupH = topE * F + DESC * F + gap + ghostH;
  const displayBase = H * 0.5 - groupH / 2 + topE * F;
  const ghostMid = displayBase + DESC * F + gap + ghostH / 2;
  const displayLeft = W / 2 - (display.total * F) / 2;

  const move = interpolate(t, [MOVE_AT, MOVE_AT + MOVE], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const scale = 1 + (GHOST_SCALE - 1) * move;
  const midY = blockMid + (ghostMid - blockMid) * move;
  const place = (x: number, y: number) => ({
    x: W / 2 + (x - W / 2) * scale,
    y: midY + (y - blockMid) * scale,
  });

  const picked = new Map<number, number>();
  picks.forEach((i, j) => {
    if (i >= 0) picked.set(i, j);
  });
  const lastLand =
    LIFT_AT + Math.max(0, target.length - 1) * LIFT_STAGGER + FLIGHT;
  const settle = interpolate(
    t,
    [lastLand + SETTLE_GAP, lastLand + SETTLE_GAP + SETTLE],
    [0, 1],
    { ...CLAMP, easing: EASE_IO },
  );
  const dim = interpolate(t, [DIM_AT, DIM_AT + DIM], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const restColor = interpolateColors(
    move,
    [0, 1],
    [interpolateColors(dim, [0, 1], [c.fg, c.dim]), c.ghost],
  );

  const sentence: ReactNode[] = [];
  const marks: ReactNode[] = [];
  const flyers: ReactNode[] = [];

  set.glyphs.forEach((g, i) => {
    if (!g) return;
    const enter = interpolate(
      t,
      [g.line * LINE_STAGGER, g.line * LINE_STAGGER + ENTER],
      [0, 1],
      { ...CLAMP, easing: EASE_OUT },
    );
    const homeX = blockLeft + g.x * B;
    const homeY = firstBase + g.line * lineGap + (1 - enter) * B * 0.45;
    const j = picked.get(i);
    const size = B * scale;
    if (j === undefined) {
      const p = place(homeX, homeY);
      sentence.push(
        <span
          key={i}
          style={{
            position: "absolute",
            left: p.x,
            top: p.y - baseOf(BODY) * size,
            fontSize: size,
            color: restColor,
            opacity: enter,
          }}
        >
          {g.ch}
        </span>,
      );
      return;
    }

    const lit = interpolate(
      t,
      [LIGHT_AT + j * LIGHT_STAGGER, LIGHT_AT + j * LIGHT_STAGGER + LIGHT],
      [0, 1],
      { ...CLAMP, easing: EASE_OUT },
    );
    const liftAt = LIFT_AT + j * LIFT_STAGGER;
    const p = interpolate(t, [liftAt, liftAt + FLIGHT], [0, 1], {
      ...CLAMP,
      easing: EASE_IO,
    });

    // The empty slot the letter leaves behind gets a short accent rule.
    const hole = interpolate(p, [0.15, 0.55], [0, 1], CLAMP);
    if (hole > 0) {
      const w = advance(BODY, g.ch) * size;
      const at = place(homeX, firstBase + g.line * lineGap);
      marks.push(
        <div
          key={`m${i}`}
          style={{
            position: "absolute",
            left: at.x + w * 0.12,
            top: at.y + size * 0.16,
            width: w * 0.76,
            height: Math.max(2, size * 0.07),
            background: accent,
            opacity: hole,
            transform: `scaleX(${0.4 + 0.6 * hole})`,
          }}
        />,
      );
    }

    const from = place(homeX + (advance(BODY, g.ch) * B) / 2, homeY);
    const toCh = target[j];
    const to = {
      x: displayLeft + (display.xs[j] + advance(DISPLAY, toCh) / 2) * F,
      y: displayBase,
    };
    // Lift straight up out of the line, cross over, rise into the slot from below.
    const c1y = from.y - (g.line + 1.6) * lineGap * scale;
    const c2y = to.y + F * 0.55;
    const u = 1 - p;
    const x =
      (u * u * u + 3 * u * u * p) * from.x + (3 * u * p * p + p * p * p) * to.x;
    const y =
      u * u * u * from.y +
      3 * u * u * p * c1y +
      3 * u * p * p * c2y +
      p * p * p * to.y;
    const fontSize = size * (F / size) ** p;
    const mix = interpolate(p, [0.15, 0.55], [0, 1], CLAMP);
    const color = interpolateColors(
      settle,
      [0, 1],
      [interpolateColors(lit, [0, 1], [restColor, accent]), c.fg],
    );
    const layer = (key: string, ch: string, face: Face, o: number) =>
      o > 0 ? (
        <span
          key={key}
          style={{
            position: "absolute",
            left: x - (advance(face, ch) * fontSize) / 2,
            top: y - baseOf(face) * fontSize,
            fontSize,
            fontFamily: face === DISPLAY ? serif : sans,
            fontStyle: face === DISPLAY ? "italic" : "normal",
            letterSpacing: 0,
            color,
            opacity: o * enter,
          }}
        >
          {ch}
        </span>
      ) : null;
    flyers.push(layer(`a${i}`, g.ch, BODY, 1 - mix));
    flyers.push(layer(`b${i}`, toCh, DISPLAY, mix));
  });

  // Letters of the word that the sentence does not contain arrive on their own.
  target.forEach((ch, j) => {
    if (picks[j] >= 0) return;
    const at = LIFT_AT + j * LIFT_STAGGER + FLIGHT * 0.5;
    const v = interpolate(t, [at, at + FLIGHT * 0.5], [0, 1], {
      ...CLAMP,
      easing: EASE_OUT,
    });
    if (v <= 0) return;
    flyers.push(
      <span
        key={`n${j}`}
        style={{
          position: "absolute",
          left: displayLeft + display.xs[j] * F,
          top: displayBase - baseOf(DISPLAY) * F + (1 - v) * F * 0.12,
          fontSize: F,
          fontFamily: serif,
          fontStyle: "italic",
          color: interpolateColors(settle, [0, 1], [accent, c.fg]),
          opacity: v,
        }}
      >
        {ch}
      </span>,
    );
  });

  // The bloom drifts a few percent left and up over the shot.
  const drift = interpolate(t, [0, lastLand + SETTLE_GAP + SETTLE], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const ground = `radial-gradient(118% 76% at ${(72 - 8 * drift).toFixed(2)}% ${(104 - 4 * drift).toFixed(2)}%, ${c.mist[0]} 0%, ${c.mist[1]} 22%, ${c.mist[2]} 48%, ${c.mist[3]} 72%, transparent 100%)`;

  return (
    <AbsoluteFill style={{ background: c.bg, overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, background: ground }} />
      <div
        style={{
          position: "absolute",
          inset: 0,
          fontFamily: sans,
          fontWeight: 400,
          lineHeight: LINE,
          fontKerning: "none",
          whiteSpace: "pre",
        }}
      >
        {sentence}
        {marks}
        {flyers}
      </div>
      <Grain opacity={c.grain} />
    </AbsoluteFill>
  );
}
