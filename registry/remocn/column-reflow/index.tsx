"use client";

import { loadFont } from "@remotion/google-fonts/Newsreader";
import { useId } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const { fontFamily: sans } = loadFont("normal", {
  weights: ["400"],
  subsets: ["latin"],
});
const { fontFamily: serif } = loadFont("italic", {
  weights: ["400"],
  subsets: ["latin"],
});

// gradients.sh "swirl" palette (bg #07060a): #ffe2c4, #ff9a4d, #d2456b, #3a1f6b.
const SWIRL = ["#ffe2c4", "#ff9a4d", "#d2456b", "#3a1f6b"] as const;

export interface ColumnReflowProps {
  text?: string;
  accentWord?: string;
  direction?: "widen" | "narrow";
  accent?: string;
  theme?: "dark" | "light";
  speed?: number;
}

const DEFAULT_TEXT =
  "Good motion starts with good typography. Give every word a measure, room to breathe, and a rhythm the eye can trust, then let the layout move and the story will read itself.";

// Newsreader 400 roman / italic metrics (1/1000 em), ASCII 32–126, plus
// signed kerning pairs, measured with HarfBuzz from the served font files.
const NEWS = [
  229, 270, 354, 566, 566, 780, 717, 198, 285, 285, 435, 512, 238, 354, 230,
  401, 566, 566, 566, 566, 566, 566, 566, 566, 566, 566, 253, 268, 512, 512,
  512, 440, 891, 710, 644, 705, 763, 640, 592, 751, 800, 338, 446, 730, 602,
  979, 770, 776, 609, 776, 645, 554, 670, 768, 692, 966, 718, 684, 634, 328,
  401, 330, 512, 410, 500, 460, 546, 437, 556, 462, 345, 496, 561, 280, 247,
  540, 269, 832, 572, 526, 564, 544, 394, 384, 342, 536, 527, 743, 507, 524,
  431, 322, 252, 322, 512,
];
const NEWS_KERN = [
  "AC-32 AG-32 AJ27 AO-32 AQ-32 AT-101 AU-43 AV-88 AW-56 AY-100 Av-47",
  "Aw-34 Ay-53 A’-72 BA-24 BV-24 BW-15 BX-24 BY-30 DA-43 DJ-44 DM-15",
  "DV-30 DW-18 DX-52 DY-48 D.-40 D,-40 Ev-18 Ey-20 FA-58 FJ-68 Fa-49",
  "Fc-42 Fd-44 Fe-42 Fg-41 Fi-19 Fm-42 Fn-42 Fo-42 Fp-38 Fq-44 Fr-42",
  "Fs-42 Ft-18 Fu-23 Fv-16 Fw-17 Fx-28 Fy-18 Fz-38 F.-93 F,-93 GY-16",
  "Gv-16 Gy-18 G’-16 Hc-20 Hd-20 He-20 Ho-20 Hp-15 Hq-20 Ht-16 Hv-23",
  "Hw-24 Hy-26 Ic-20 Id-20 Ie-20 Io-20 Ip-15 Iq-20 It-16 Iv-23 Iw-24",
  "Iy-26 JA-44 JJ-32 Ja-34 Jc-26 Jd-26 Je-26 Jf-19 Jg-22 Jm-20 Jn-20",
  "Jo-26 Jp-20 Jq-26 Jr-20 Js-28 Jt-21 Ju-16 Jv-16 Jw-17 Jx-18 Jy-18",
  "Jz-30 J.-43 J,-43 KC-66 KG-66 KJ23 KO-66 KQ-66 Kc-24 Ke-24 Ko-24 Ku-15",
  "Kv-76 Kw-62 Ky-78 LT-96 LU-18 LV-88 LW-46 LY-102 Lv-45 Lw-27 Ly-46",
  "L’-77 Mc-20 Md-17 Me-20 Mo-20 Mq-17 Mt-16 Mv-29 Mw-28 My-32 Na-30",
  "Nc-20 Nd-20 Ne-20 Nf-16 Ng-18 Nm-16 Nn-16 No-20 Np-15 Nq-20 Nr-16",
  "Ns-22 Nt-16 Nu-15 Nv-20 Nw-20 Ny-22 Nz-26 N.-26 N,-26 OA-34 OJ-33",
  "OV-32 OW-19 OX-48 OY-50 O.-34 O,-34 PA-60 PJ-82 PX-31 Pa-27 Pc-41",
  "Pd-46 Pe-41 Pg-21 Po-41 Pq-46 Ps-18 P.-104 P,-104 QA-34 QJ-33 QV-32",
  "QW-19 QX-48 QY-50 Q.-34 RJ23 RV-24 RW-16 RY-28 SA-16 Sy-16 TA-100",
  "TJ-76 Ta-92 Tc-106 Td-108 Te-106 Tf-30 Tg-86 Ti-15 Tm-66 Tn-66 To-106",
  "Tp-70 Tq-108 Tr-66 Ts-82 Tt-66 Tu-64 Tv-78 Tw-74 Tx-68 Ty-78 Tz-69",
  "T.-82 T,-82 UA-48 UJ-38 Ua-34 Uc-28 Ud-28 Ue-28 Uf-20 Ug-24 Um-20",
  "Un-20 Uo-28 Up-20 Uq-28 Ur-20 Us-29 Ut-20 Uu-16 Uv-16 Uw-17 Ux-20",
  "Uy-18 Uz-30 U.-47 U,-47 VA-83 VC-33 VG-33 VJ-70 VO-33 VQ-33 Va-79 Vb30",
  "Vc-77 Vd-80 Ve-77 Vf-42 Vg-68 Vm-68 Vn-68 Vo-77 Vp-63 Vq-80 Vr-68",
  "Vs-75 Vt-62 Vu-48 Vv-46 Vw-50 Vx-48 Vy-51 Vz-70 V.-84 V,-84 WA-54",
  "WC-20 WG-20 WJ-44 WO-20 WQ-20 Wa-54 Wb26 Wc-42 Wd-42 We-42 Wf-30 Wg-38",
  "Wm-34 Wn-34 Wo-42 Wp-31 Wq-42 Wr-34 Ws-44 Wt-36 Wu-29 Wv-22 Ww-24",
  "Wx-30 Wy-26 Wz-38 W.-64 W,-64 XC-50 XG-50 XO-50 XQ-50 Xc-26 Xd-16",
  "Xe-26 Xo-26 Xq-16 Xt-16 Xu-18 Xv-70 Xw-61 Xy-77 YA-92 YC-50 YG-50",
  "YJ-68 YO-50 YQ-50 YS-16 Ya-101 Yb20 Yc-114 Yd-114 Ye-114 Yf-62 Yg-96",
  "Ym-78 Yn-78 Yo-114 Yp-84 Yq-114 Yr-78 Ys-92 Yt-81 Yu-74 Yv-78 Yw-80",
  "Yx-76 Yy-83 Yz-82 Y.-78 Y,-78 Zv-42 Zw-33 Zy-44 aT-75 aU-25 aV-93",
  "aW-45 aY-90 av-28 aw-22 ay-30 a’-54 bA-18 bB-20 bD-20 bE-20 bF-20",
  "bH-20 bI-20 bK-20 bL-20 bM-20 bN-20 bP-20 bR-20 bT-101 bU-28 bV-74",
  "bW-43 bX-31 bY-120 bZ-32 bv-16 bx-23 by-21 b’-42 cT-80 cU-26 cV-69",
  "cW-46 cY-98 eT-90 eU-29 eV-74 eW-48 eY-108 eZ-20 ey-20 e’-32 fB110",
  "fD110 fE110 fF110 fH110 fI110 fK110 fL110 fM88 fN106 fP110 fR110 fS22",
  "fT108 fU127 fV163 fW157 fX130 fY160 fZ85 fc-20 fd-22 fe-20 fi69 fj80",
  "fo-20 fq-22 f.-28 f,-28 f’133 gA-21 gB-16 gD-16 gE-16 gF-16 gH-16",
  "gI-16 gJ-24 gK-16 gL-16 gM-17 gN-16 gP-16 gR-16 gT-81 gU-16 gV-46",
  "gW-24 gX-33 gY-90 gd-16 gq-16 g.-43 hT-76 hU-23 hV-94 hW-50 hY-94",
  "hv-22 hw-21 hy-25 h’-52 kT-68 kU-24 kV-64 kW-32 kY-84 ka-20 kc-32",
  "kd-28 ke-32 kg-20 ko-32 kq-28 ks-19 kt-18 kv-15 ky-17 k’-32 lU-18",
  "l’-15 mT-76 mU-23 mV-94 mW-50 mY-94 mv-22 mw-21 my-25 m’-52 nT-76",
  "nU-23 nV-94 nW-50 nY-94 nv-22 nw-21 ny-25 n’-52 oA-16 oB-20 oD-20",
  "oE-20 oF-20 oH-20 oI-20 oK-20 oL-20 oM-20 oN-21 oP-20 oR-20 oT-106",
  "oU-28 oV-78 oW-44 oX-32 oY-123 oZ-33 ov-20 ow-17 ox-23 oy-24 o’-42",
  "pA-18 pB-20 pD-20 pE-20 pF-20 pH-20 pI-20 pK-20 pL-20 pM-20 pN-20",
  "pP-20 pR-20 pT-101 pU-28 pV-74 pW-43 pX-31 pY-120 pZ-32 pv-16 px-23",
  "py-21 p’-42 qT-71 qU-16 qV-67 qW-36 qY-99 rA-32 rB-26 rD-26 rE-26",
  "rF-26 rH-26 rI-26 rJ-45 rK-26 rL-26 rM-29 rN-26 rP-26 rR-26 rT-79",
  "rU-20 rV-60 rW-34 rX-46 rY-98 rZ-18 rc-17 rd-20 re-17 ro-17 rq-20",
  "r.-50 r,-50 sN-15 sT-74 sU-28 sV-72 sW-42 sY-96 s’-22 tT-79 tU-22",
  "tV-59 tW-35 tY-90 uT-69 uU-20 uV-74 uW-42 uY-95 u’-34 vA-46 vB-34",
  "vD-34 vE-34 vF-34 vH-34 vI-34 vJ-50 vK-34 vL-34 vM-38 vN-35 vP-34",
  "vR-34 vT-77 vU-25 vV-60 vW-35 vX-74 vY-93 vZ-22 va-22 vc-31 vd-32",
  "ve-31 vg-18 vh-21 vk-21 vl-21 vo-31 vq-32 v.-60 v,-60 wA-33 wB-28",
  "wD-28 wE-28 wF-28 wH-28 wI-28 wJ-42 wK-28 wL-28 wM-34 wN-30 wP-28",
  "wR-28 wT-74 wU-22 wV-54 wW-32 wX-60 wY-88 wZ-17 wa-17 wc-22 wd-26",
  "we-22 wh-16 wk-16 wl-16 wo-22 wq-26 w.-50 w,-50 xT-68 xU-22 xV-54",
  "xW-32 xY-84 xc-24 xd-25 xe-24 xo-24 xq-25 yA-42 yB-30 yD-30 yE-30",
  "yF-30 yH-30 yI-30 yJ-48 yK-30 yL-30 yM-35 yN-30 yP-30 yR-30 yT-74",
  "yU-21 yV-54 yW-31 yX-70 yY-89 yZ-18 ya-16 yc-24 yd-28 ye-24 yh-16",
  "yk-16 yl-16 yo-24 yq-28 y.-55 y,-55 zT-70 zU-30 zV-68 zW-38 zY-87",
  ".C-34 .G-34 .O-34 .Q-34 .T-82 .U-48 .V-88 .W-64 .Y-86 .j-18 .p-18",
  ".t-18 .u-21 .v-61 .w-50 .y-62 .’-115 ,C-34 ,G-34 ,O-34 ,Q-34 ,T-82",
  ",U-48 ,V-88 ,W-64 ,Y-86 ,j-18 ,p-18 ,t-18 ,u-21 ,v-61 ,w-50 ,y-62",
  ",’-115 ’A-76 ’J-61 ’V24 ’W17 ’Y20 ’a-60 ’c-67 ’d-74 ’e-67 ’f-20 ’g-64",
  "’m-45 ’n-45 ’o-67 ’p-41 ’q-74 ’r-45 ’s-51 ’t-24 ’u-18 ’x-22 ’y-16",
  "’z-28 ’.-124 ’,-124",
].join(" ");
const NEWS_EXTRA: Record<string, number> = {
  "’": 237,
  "‘": 236,
  "“": 410,
  "”": 412,
  "–": 520,
  "—": 686,
  "…": 641,
};
const NEWS_ITALIC = [
  233, 268, 345, 566, 566, 807, 687, 191, 276, 276, 432, 516, 232, 344, 224,
  406, 566, 566, 566, 566, 566, 566, 566, 650, 566, 566, 256, 266, 516, 516,
  516, 446, 909, 677, 625, 682, 744, 624, 574, 733, 772, 333, 424, 696, 570,
  942, 742, 753, 590, 752, 632, 541, 634, 737, 662, 919, 680, 652, 610, 318,
  376, 320, 516, 390, 500, 494, 468, 378, 498, 397, 308, 420, 498, 285, 256,
  476, 260, 767, 538, 451, 509, 464, 396, 348, 318, 516, 470, 666, 486, 477,
  420, 316, 250, 315, 516,
];
const NEWS_ITALIC_KERN = [
  "AC-52 AG-52 AJ16 AO-52 AQ-52 AS-19 AT-92 AU-54 AV-89 AW-56 AY-95 Ab-16",
  "Ac-21 Ae-21 Af-38 Am-16 An-16 Ao-21 Ap-16 Ar-16 At-22 Au-18 Av-24",
  "Aw-24 Ay-50 A’-82 BA-23 BV-37 BW-24 BX-19 BY-47 DA-22 DJ-20 DT-16",
  "DV-52 DW-29 DX-55 DY-70 D.-18 D,-18 Ey-16 FA-44 FJ-46 Fa-37 Fc-38",
  "Fd-37 Fe-38 Fg-36 Fm-22 Fn-22 Fo-38 Fp-22 Fq-37 Fr-22 Fs-38 Fu-26",
  "Fv-20 Fw-19 Fx-34 Fy-18 Fz-36 F.-82 F,-82 GV-20 GY-23 G’-18 Ha-18",
  "Hc-19 Hd-18 He-19 Hf-21 Hg-20 Hm-16 Hn-16 Ho-19 Hp-16 Hq-18 Hr-16",
  "Ht-22 Hu-16 Hv-15 Hy-30 Hz-15 Ia-18 Ic-19 Id-18 Ie-19 If-21 Ig-20",
  "Im-16 In-16 Io-19 Ip-16 Iq-18 Ir-16 It-22 Iu-16 Iv-15 Iy-30 Iz-15",
  "JA-28 JJ-18 Ja-21 Jc-22 Jd-21 Je-22 Jg-21 Jo-22 Jq-21 Js-26 Jt-15",
  "Jy-18 Jz-24 J.-30 J,-30 KC-65 KG-65 KO-64 KQ-64 KV-30 KW-26 KY-34",
  "Kc-35 Ke-35 Kf-44 Kg-22 Km-22 Kn-22 Ko-35 Kp-22 Kr-22 Kt-30 Ku-32",
  "Kv-32 Kw-32 Ky-81 LC-15 LG-15 LT-94 LU-20 LV-87 LW-54 LY-101 Lf-34",
  "Lm-16 Ln-16 Lp-16 Lr-16 Ly-57 L’-83 MC-17 MG-17 MO-16 MQ-16 Ma-17",
  "Mc-19 Md-17 Me-19 Mf-29 Mg-20 Mm-16 Mn-16 Mo-19 Mp-16 Mq-17 Mr-16",
  "Mt-26 Mu-16 Mv-16 Mw-16 My-36 Na-17 Nc-18 Nd-17 Ne-18 Nf-16 Ng-18",
  "No-18 Nq-17 Ns-24 Nt-18 Ny-23 Nz-25 N.-20 N,-20 OA-18 OJ-19 OT-16",
  "OV-51 OW-28 OX-52 OY-67 O.-15 O,-15 PA-46 PJ-46 PM-18 PV-23 PW-16",
  "PX-61 PY-20 Pa-32 Pd-32 Pq-32 P.-88 P,-88 QA-18 QJ-19 QT-16 QV-51",
  "QW-28 QX-52 QY-67 Qj42 Q.-15 Q,35 RJ16 RT-19 RU-22 RV-50 RW-28 RY-50",
  "Ry-26 R’-34 SV-16 SY-15 Sf-16 TA-84 TJ-55 Ta-77 Tc-66 Td-77 Te-66",
  "Tg-64 Tm-60 Tn-60 To-66 Tp-60 Tq-77 Tr-60 Ts-66 Tt-15 Tu-61 Tv-62",
  "Tw-62 Tx-62 Ty-65 Tz-68 T.-70 T,-70 UA-42 UJ-19 Ua-22 Uc-23 Ud-22",
  "Ue-23 Ug-22 Uo-23 Uq-22 Us-26 Ux-16 Uy-18 Uz-24 U.-34 U,-34 VA-84",
  "VC-20 VG-20 VJ-70 VO-18 VQ-18 Va-70 Vb36 Vc-63 Vd-70 Ve-63 Vf-22 Vg-62",
  "Vh25 Vk25 Vl20 Vm-58 Vn-58 Vo-63 Vp-58 Vq-70 Vr-58 Vs-69 Vt-44 Vu-63",
  "Vv-58 Vw-58 Vx-70 Vy-59 Vz-66 V.-77 V,-77 WA-62 WC-15 WG-15 WJ-44",
  "Wa-37 Wb32 Wc-38 Wd-37 We-38 Wg-38 Wh22 Wk22 Wl16 Wm-32 Wn-32 Wo-38",
  "Wp-32 Wq-37 Wr-32 Ws-42 Wt-26 Wu-33 Wv-34 Ww-34 Wx-40 Wy-34 Wz-40",
  "W.-57 W,-57 XC-48 XG-48 XO-48 XQ-48 Xc-33 Xe-33 Xf-42 Xg-24 Xm-24",
  "Xn-24 Xo-33 Xp-24 Xr-24 Xt-32 Xu-28 Xv-31 Xw-30 Xy-71 YA-98 YC-36",
  "YG-36 YJ-66 YO-30 YQ-30 Ya-100 Yb27 Yc-98 Yd-100 Ye-98 Yf-40 Yg-91",
  "Yh16 Yk16 Ym-78 Yn-78 Yo-98 Yp-78 Yq-100 Yr-78 Ys-84 Yt-69 Yu-83 Yv-79",
  "Yw-79 Yx-86 Yy-92 Yz-88 Y.-72 Y,-72 Zf-34 Zm-18 Zn-18 Zp-18 Zr-18",
  "Zt-22 Zu-16 Zy-32 Zz-15 aT-70 aU-19 aV-78 aW-36 aY-86 af-23 ay-22",
  "a’-58 bB-19 bD-19 bE-19 bF-19 bH-19 bI-19 bK-19 bL-19 bM-16 bN-20",
  "bP-19 bR-19 bT-89 bU-26 bV-69 bW-37 bX-23 bY-108 bZ-34 b’-39 cT-76",
  "cU-32 cV-78 cW-45 cY-94 c’-25 dT-17 dU-20 dV-20 dW-18 dY-24 df-16",
  "dy-25 d’-26 eT-76 eU-34 eV-76 eW-45 eY-96 eZ-15 e’-30 fB81 fD81 fE81",
  "fF81 fH81 fI81 fK81 fL81 fM62 fN87 fP81 fR81 fS60 fT104 fU96 fV136",
  "fW129 fX102 fY132 fZ74 fi56 fj66 f’130 gA-18 gB-16 gD-16 gE-16 gF-16",
  "gH-16 gI-16 gJ-25 gK-16 gL-16 gN-17 gP-16 gR-16 gT-71 gU-16 gV-48",
  "gW-22 gX-28 gY-83 gZ-15 gf56 gg40 gj86 gy18 g.-22 g,62 hT-76 hU-22",
  "hV-88 hW-39 hY-92 hf-20 hy-20 h’-64 iT-22 iU-19 iY-15 iy-18 i’-24",
  "kT-66 kU-25 kV-74 kW-34 kY-85 k’-61 lC-18 lG-18 lO-18 lQ-18 lT-28",
  "lU-26 lV-33 lW-29 lY-36 lf-26 ly-36 l’-28 mT-76 mU-22 mV-88 mW-39",
  "mY-92 mf-20 my-20 m’-64 nT-76 nU-22 nV-88 nW-39 nY-92 nf-20 ny-20",
  "n’-64 oB-18 oD-18 oE-18 oF-18 oH-18 oI-18 oK-18 oL-18 oN-20 oP-18",
  "oR-18 oT-92 oU-28 oV-78 oW-38 oY-111 oZ-26 of-24 o’-48 pB-18 pD-18",
  "pE-18 pF-18 pH-18 pI-18 pK-18 pL-18 pN-20 pP-18 pR-18 pT-89 pU-26",
  "pV-72 pW-36 pX-16 pY-109 pZ-30 pf-15 p’-38 qN-16 qT-78 qU-26 qV-74",
  "qW-46 qY-106 qZ-19 qj44 rA-52 rB-24 rD-24 rE-24 rF-24 rH-24 rI-24",
  "rJ-57 rK-24 rL-24 rM-26 rN-26 rP-24 rR-24 rT-76 rU-18 rV-60 rW-28",
  "rX-74 rY-96 rZ-27 r.-56 r,-56 sT-72 sU-33 sV-72 sW-46 sY-92 s’-32",
  "tT-61 tU-24 tV-62 tW-40 tY-83 uJ18 uT-69 uU-22 uV-83 uW-36 uY-85 uf-20",
  "uy-28 u’-64 vA-16 vB-22 vD-22 vE-22 vF-22 vH-22 vI-22 vK-22 vL-22",
  "vM-20 vN-23 vP-22 vR-22 vT-88 vU-29 vV-69 vW-42 vX-35 vY-110 vZ-38",
  "v’-26 wA-15 wB-22 wD-22 wE-22 wF-22 wH-22 wI-22 wK-22 wL-22 wM-20",
  "wN-23 wP-22 wR-22 wT-90 wU-30 wV-72 wW-42 wX-31 wY-112 wZ-38 w’-26",
  "xT-68 xU-24 xV-72 xW-38 xY-86 x’-19 yN-16 yT-75 yU-22 yV-68 yW-41",
  "yY-104 yZ-24 zT-72 zU-30 zV-74 zW-40 zY-82 zy-22 z’-38 .C-56 .G-56",
  ".O-56 .Q-56 .S-20 .T-88 .U-59 .V-89 .W-66 .Y-89 .b-20 .c-22 .e-22 .f18",
  ".g-23 .i-30 .j-36 .m-37 .n-37 .o-22 .p-37 .r-37 .t-32 .u-34 .v-34",
  ".w-34 .y-79 .z-18 .’-138 ,C-56 ,G-56 ,O-56 ,Q-56 ,S-20 ,T-88 ,U-59",
  ",V-89 ,W-66 ,Y-89 ,b-20 ,c-22 ,e-22 ,f41 ,g-23 ,i-30 ,j41 ,m-37 ,n-37",
  ",o-22 ,p-37 ,r-37 ,t-32 ,u-34 ,v-34 ,w-34 ,y-79 ,z-18 ,’-138 ’A-68",
  "’J-56 ’a-68 ’c-53 ’d-68 ’e-53 ’g-46 ’m-28 ’n-28 ’o-53 ’p-28 ’q-68",
  "’r-28 ’s-34 ’u-40 ’v-28 ’w-28 ’x-47 ’y-22 ’z-34 ’.-112 ’,-112",
].join(" ");
const NEWS_ITALIC_EXTRA: Record<string, number> = {
  "’": 236,
  "‘": 234,
  "“": 408,
  "”": 409,
  "–": 499,
  "—": 656,
  "…": 633,
};

function kernMap(pairs: string) {
  return new Map(
    pairs.split(" ").map((p) => [p.slice(0, 2), Number(p.slice(2)) / 1000]),
  );
}
const KERN_SANS = kernMap(NEWS_KERN);
const KERN_SERIF = kernMap(NEWS_ITALIC_KERN);

const TRACK = -0.008;
const SERIF_SCALE = 1.04;
const SPACE = 0.229 + TRACK;
const NARROW_EM = 9.6;
const LEADING = 1.3;
const BASELINE_SANS = 0.735;
const BASELINE_SERIF = 0.735;

const ENTER = -4;
const X_START = 22;
const X_DUR = 24;
const X_ROW = 1.5;
const X_WORD = 0.7;
const Y_START = 44;
const Y_DUR = 26;
const Y_ROW = 2;

const EASE_IO = Easing.bezier(0.65, 0, 0.35, 1);
const EASE_Y = Easing.bezier(0.55, 0, 0.25, 1);
const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const THEMES = {
  dark: {
    bg: "#0A0A0B",
    key: "rgba(255,255,255,0.05)",
    fg: "#F3F2EF",
    muted: "#8B8A90",
    hair: "rgba(255,255,255,0.16)",
    grain: 0.07,
  },
  light: {
    bg: "#F5F4F0",
    key: "rgba(255,255,255,0.9)",
    fg: "#121214",
    muted: "#6E6C67",
    hair: "rgba(18,18,20,0.16)",
    grain: 0.045,
  },
} as const;

function advance(
  text: string,
  table: number[],
  extra: Record<string, number>,
  kern: Map<string, number>,
  track: number,
) {
  let w = 0;
  let prev = "";
  for (const ch of text) {
    w += kern.get(prev + ch) ?? 0;
    prev = ch;
    const code = ch.charCodeAt(0);
    const a = code >= 32 && code < 127 ? table[code - 32] : (extra[ch] ?? 600);
    w += a / 1000 + track;
  }
  return w;
}

const sansEm = (s: string) => advance(s, NEWS, NEWS_EXTRA, KERN_SANS, TRACK);
const serifEm = (s: string) =>
  advance(s, NEWS_ITALIC, NEWS_ITALIC_EXTRA, KERN_SERIF, 0) * SERIF_SCALE;

interface Word {
  core: string;
  tail: string;
  serif: boolean;
  w: number;
}

function strip(s: string) {
  return s.toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");
}

function toWords(text: string, accentWord: string): Word[] {
  const target = strip(accentWord);
  let used = false;
  return text
    .trim()
    .split(/\s+/)
    .map((raw) => {
      const isAccent = !used && target.length > 0 && strip(raw) === target;
      if (!isAccent) {
        return { core: raw, tail: "", serif: false, w: sansEm(raw) };
      }
      used = true;
      const m = /^(.*?)([^\p{L}\p{N}]*)$/u.exec(raw);
      const core = m ? m[1] : raw;
      const tail = m ? m[2] : "";
      return {
        core,
        tail,
        serif: true,
        w: serifEm(core) + (tail ? 0.04 + sansEm(tail) : 0),
      };
    });
}

/**
 * Break into justified rows with the least stretched word spacing (a small
 * Knuth–Plass: dynamic programming over break points). Returns the cost too,
 * so the caller can try a few measures and keep the evenest column.
 */
function breakRows(words: Word[], measure: number) {
  const n = words.length;
  const best = new Array<number>(n + 1).fill(Number.POSITIVE_INFINITY);
  const from = new Array<number>(n + 1).fill(0);
  best[0] = 0;
  for (let j = 1; j <= n; j++) {
    let width = -SPACE;
    for (let i = j - 1; i >= 0; i--) {
      width += words[i].w + SPACE;
      if (width > measure && i < j - 1) break;
      const count = j - i;
      let cost = 0;
      if (j < n) {
        const gap = count > 1 ? (measure - width) / (count - 1) + SPACE : 9;
        const stretch = (gap - SPACE) / SPACE;
        cost = stretch * stretch + (count < 3 ? 1.5 : 0);
      } else if (width < measure * 0.3) {
        cost = 1;
      }
      if (best[i] + cost < best[j]) {
        best[j] = best[i] + cost;
        from[j] = i;
      }
    }
  }
  const rows: number[][] = [];
  for (let j = n; j > 0; j = from[j]) {
    const row: number[] = [];
    for (let k = from[j]; k < j; k++) row.push(k);
    rows.unshift(row);
  }
  return { rows, cost: best[n] };
}

function chooseMeasure(words: Word[]) {
  let pick = { measure: NARROW_EM, rows: breakRows(words, NARROW_EM).rows };
  let low = Number.POSITIVE_INFINITY;
  for (let m = NARROW_EM - 1; m <= NARROW_EM + 1.001; m += 0.1) {
    const { rows, cost } = breakRows(words, m);
    const paired: number[] = [];
    for (let r = 0; r + 1 < rows.length - 1; r += 2) {
      paired.push(rowWidth(words, [...rows[r], ...rows[r + 1]]));
    }
    const top = Math.max(1, ...paired);
    const rag = paired.reduce((s, w) => s + ((top - w) / top) ** 2, 0);
    const score = cost + rag * 40 + Math.abs(m - NARROW_EM) * 0.4;
    if (rows.length > 1 && score < low) {
      low = score;
      pick = { measure: m, rows };
    }
  }
  return pick;
}

function rowWidth(words: Word[], row: number[]) {
  return row.reduce((s, i) => s + words[i].w, 0) + SPACE * (row.length - 1);
}

/** x offsets (em) of each word in a row, justified unless it is the last. */
function setRow(words: Word[], row: number[], measure: number, last: boolean) {
  const sum = row.reduce((s, i) => s + words[i].w, 0);
  const gap =
    last || row.length < 2 ? SPACE : (measure - sum) / (row.length - 1);
  const xs: number[] = [];
  let x = 0;
  for (const i of row) {
    xs.push(x);
    x += words[i].w + gap;
  }
  return xs;
}

interface Placed {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  row: number;
  slot: number;
  rowLen: number;
  dir: number;
}

/**
 * The narrow column is justified; the wide paragraph pairs its rows (row 2t
 * and 2t + 1 become line t) set with natural spacing. Pairing is what keeps
 * the move clean: odd rows slide out sideways into empty space, then both
 * halves close vertically, so no word ever crosses another.
 */
function layout(words: Word[]) {
  const { measure: narrow, rows } = chooseMeasure(words);
  const R = rows.length;
  const T = Math.ceil(R / 2);
  const lines = Array.from({ length: T }, (_, t) => [
    ...rows[2 * t],
    ...(rows[2 * t + 1] ?? []),
  ]);
  const wide = Math.max(...lines.map((l) => rowWidth(words, l)));
  const placed: Placed[] = [];
  const narrowX: number[] = [];
  const narrowRow: number[] = [];
  rows.forEach((row, r) => {
    const xs = setRow(words, row, narrow, r === R - 1);
    row.forEach((i, k) => {
      narrowX[i] = xs[k] - narrow / 2;
      narrowRow[i] = r;
    });
  });
  lines.forEach((line, t) => {
    const xs = setRow(words, line, wide, true);
    line.forEach((i, k) => {
      const r = narrowRow[i];
      const own = rows[r];
      placed[i] = {
        x0: narrowX[i],
        y0: r - (R - 1) / 2,
        x1: xs[k] - wide / 2,
        y1: t - (T - 1) / 2,
        row: r,
        slot: own.indexOf(i),
        rowLen: own.length,
        dir: r % 2 === 0 ? -1 : 1,
      };
    });
  });
  return { placed, R, T, wide, narrow };
}

/** Motion progress for a word at virtual time v (widen direction). */
function progress(p: Placed, R: number, v: number) {
  const order = p.dir < 0 ? p.slot : p.rowLen - 1 - p.slot;
  const xs = X_START + p.row * X_ROW + order * X_WORD;
  const px = interpolate(v, [xs, xs + X_DUR], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const ys = Y_START + Math.abs(p.row - (R - 1) / 2) * Y_ROW;
  const py = interpolate(v, [ys, ys + Y_DUR], [0, 1], {
    ...CLAMP,
    easing: EASE_Y,
  });
  return { px, py };
}

function motionEnd(R: number) {
  return Y_START + ((R - 1) / 2) * Y_ROW + Y_DUR;
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
          seed={5}
          stitchTiles="stitch"
        />
        <feColorMatrix values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0.9 0" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#${id})`} />
    </svg>
  );
}

export function ColumnReflow({
  text = DEFAULT_TEXT,
  accentWord = "room",
  direction = "widen",
  theme = "dark",
  speed = 1,
}: ColumnReflowProps) {
  const t = useCurrentFrame() * speed;
  const { width: W, height: H } = useVideoConfig();
  const u = H / 720;
  const c = THEMES[theme];

  const words = toWords(text, accentWord);
  const { placed, R, T, wide, narrow } = layout(words);
  const F = Math.min(56 * u, (W * 0.86) / wide, (H * 0.74) / (R * LEADING));
  const L = F * LEADING;
  const cx = W / 2;
  const cy = H / 2 + 0.28 * F;

  const end = motionEnd(R);
  const narrowing = direction === "narrow";
  const v = narrowing ? X_START + end - Math.min(Math.max(t, X_START), end) : t;

  const settle = interpolate(t, [end - 6, end + 14], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  // The accent word develops into a swirl gradient as the paragraph lands;
  // the warm core drifts a few percent across the hold.
  const drift = interpolate(t, [end - 6, end + 60], [0, 1], CLAMP);
  const haze = interpolate(t, [ENTER, end + 10], [0.35, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const swirl =
    theme === "dark"
      ? `linear-gradient(100deg, ${SWIRL[0]} ${6 + 8 * drift}%, ${SWIRL[1]} ${44 + 8 * drift}%, ${SWIRL[2]} 96%)`
      : `linear-gradient(100deg, ${SWIRL[1]} ${4 + 8 * drift}%, ${SWIRL[2]} ${48 + 8 * drift}%, ${SWIRL[3]} 100%)`;

  // Measure guides follow the column edges.
  const edge = interpolate(
    v,
    [X_START, X_START + (R - 1) * X_ROW + X_DUR],
    [0, 1],
    { ...CLAMP, easing: EASE_IO },
  );
  const tall = interpolate(v, [Y_START, end], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const halfW = interpolate(edge, [0, 1], [narrow / 2, wide / 2]) * F;
  const halfH =
    (interpolate(tall, [0, 1], [(R - 1) / 2, (T - 1) / 2]) + 0.95) * L;
  const guideIn = interpolate(t, [ENTER + 4, ENTER + 22], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const guideOut = interpolate(t, [end - 4, end + 16], [1, 0], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const hair = Math.max(1, u);

  return (
    <AbsoluteFill style={{ background: c.bg, overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 70% 80% at 40% 35%, ${c.key}, transparent 70%)`,
        }}
      />
      <AbsoluteFill
        style={{
          background: [
            `radial-gradient(70% 60% at ${88 - 6 * drift}% 112%, color-mix(in oklab, ${SWIRL[2]} ${theme === "dark" ? 30 : 16}%, transparent) 0%, transparent 70%)`,
            `radial-gradient(60% 55% at ${8 + 4 * drift}% -12%, color-mix(in oklab, ${theme === "dark" ? SWIRL[3] : SWIRL[0]} ${theme === "dark" ? 55 : 60}%, transparent) 0%, transparent 70%)`,
          ].join(", "),
          opacity: haze,
        }}
      />

      {[-1, 1].map((side) => (
        <div
          key={`g${side}`}
          style={{
            position: "absolute",
            left: cx + side * (halfW + 0.55 * F) - hair / 2,
            top: cy - 0.36 * F - halfH * guideIn,
            width: hair,
            height: halfH * 2 * guideIn,
            background: c.hair,
            opacity: guideOut,
          }}
        />
      ))}

      {words.map((w, i) => {
        const p = placed[i];
        const { px, py } = progress(p, R, v);
        const x = cx + interpolate(px, [0, 1], [p.x0, p.x1]) * F;
        const y = cy + interpolate(py, [0, 1], [p.y0, p.y1]) * L;
        const startRow = narrowing ? Math.round(p.y1 + (T - 1) / 2) : p.row;
        const enter = interpolate(
          t,
          [ENTER + startRow * 1.6, ENTER + startRow * 1.6 + 16],
          [0, 1],
          { ...CLAMP, easing: EASE_OUT },
        );
        const lift = (1 - enter) * 0.35 * F;
        if (!w.serif) {
          return (
            <div
              key={`${i}-${w.core}`}
              style={{
                position: "absolute",
                left: x,
                top: y - BASELINE_SANS * F + lift,
                fontFamily: sans,
                fontWeight: 400,
                fontSize: F,
                lineHeight: 1,
                letterSpacing: `${TRACK}em`,
                whiteSpace: "pre",
                color: c.fg,
                opacity: enter,
              }}
            >
              {w.core}
            </div>
          );
        }
        const sF = F * SERIF_SCALE;
        const serifType = {
          position: "absolute",
          left: x - 0.2 * sF,
          top: y - BASELINE_SERIF * sF + lift,
          paddingLeft: 0.2 * sF,
          paddingRight: 0.2 * sF,
          fontFamily: serif,
          fontStyle: "italic",
          fontWeight: 400,
          fontSize: sF,
          lineHeight: 1,
          whiteSpace: "pre",
        } as const;
        return (
          <div key={`${i}-${w.core}`}>
            <div
              style={{
                ...serifType,
                color: c.fg,
                opacity: enter * (1 - settle),
              }}
            >
              {w.core}
            </div>
            <div
              style={{
                ...serifType,
                color: "transparent",
                backgroundImage: swirl,
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                opacity: enter * settle,
              }}
            >
              {w.core}
            </div>
            {w.tail ? (
              <div
                style={{
                  position: "absolute",
                  left: x + (serifEm(w.core) + 0.04) * F,
                  top: y - BASELINE_SANS * F + lift,
                  fontFamily: sans,
                  fontWeight: 400,
                  fontSize: F,
                  lineHeight: 1,
                  letterSpacing: `${TRACK}em`,
                  whiteSpace: "pre",
                  color: c.fg,
                  opacity: enter,
                }}
              >
                {w.tail}
              </div>
            ) : null}
          </div>
        );
      })}

      <Grain opacity={c.grain} />
    </AbsoluteFill>
  );
}
