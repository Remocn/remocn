"use client";

import { loadFont } from "@remotion/google-fonts/SpaceGrotesk";
import { useId, useMemo } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const { fontFamily: sans } = loadFont("normal", {
  weights: ["500"],
  subsets: ["latin"],
});

export interface StackLettersProps {
  word?: string;
  accent?: string;
  theme?: "dark" | "light";
  speed?: number;
}

// Space Grotesk 500 advance widths (1/1000 em) for ASCII 32–126.
const SPACE_500 = [
  255, 276, 470, 632, 609, 765, 598, 273, 389, 383, 530, 620, 273, 443, 276,
  379, 645, 435, 598, 606, 630, 599, 615, 559, 611, 615, 276, 276, 620, 620,
  620, 579, 1020, 632, 663, 643, 665, 559, 537, 661, 656, 254, 602, 618, 544,
  874, 667, 673, 603, 673, 632, 609, 588, 669, 619, 887, 641, 617, 577, 347,
  379, 347, 620, 620, 288, 577, 641, 592, 641, 584, 439, 640, 615, 256, 258,
  551, 256, 857, 615, 615, 641, 641, 387, 525, 458, 614, 544, 792, 593, 614,
  519, 449, 249, 449, 620,
];
// Ink boxes for "!".."~" at weight 500: xMin, yMin, xMax, yMax in 1/1000 em.
const INK_500 = [
  "56,-14,220,700 56,430,414,714 41,0,591,700 41,-116,569,816 30,-13,735,713",
  "36,0,578,700 56,430,217,714 55,-240,380,750 3,-240,328,750 45,261,485,700",
  "101,141,519,559 56,-136,217,148 74,209,370,303 56,-14,220,149 -8,-200,389,700",
  "55,-14,590,714 15,0,362,700 48,0,555,714 40,-14,561,700 29,0,606,700",
  "44,-14,559,700 55,-14,570,714 29,0,531,700 37,-14,574,714 46,-14,560,714",
  "56,-14,220,506 56,-136,220,506 100,130,520,570 101,222,519,478 100,130,520,570",
  "38,-14,535,714 72,-200,952,709 21,0,610,700 47,0,615,700 55,-14,596,714",
  "47,0,616,700 73,0,519,700 73,0,505,700 55,-14,595,714 73,0,583,700",
  "73,0,181,700 36,-14,559,700 73,0,610,700 73,0,518,700 73,0,801,700",
  "73,0,594,700 55,-14,618,714 73,0,573,700 55,-171,618,714 73,0,586,700",
  "41,-14,569,714 25,0,563,700 68,-14,601,700 21,0,597,700 33,0,853,700",
  "27,0,614,700 11,0,606,700 48,0,531,700 76,-240,329,750 -10,-200,388,700",
  "17,-240,271,750 72,424,548,700 71,-142,549,-49 47,558,241,700 44,-14,553,507",
  "76,-14,589,700 52,-14,549,507 52,-14,565,700 52,-14,536,507 27,0,410,700",
  "52,-200,564,507 76,0,543,700 57,0,199,700 -18,-200,201,700 76,0,534,700",
  "76,0,179,700 76,0,785,501 76,0,543,501 52,-14,563,507 76,-200,589,507",
  "52,-200,565,507 76,0,356,495 46,-14,481,507 27,0,413,656 71,-9,538,493",
  "24,0,520,493 46,0,746,493 34,0,558,493 71,-200,538,493 56,0,467,493",
  "37,-240,432,750 73,-246,176,806 17,-240,412,750 63,253,556,447",
]
  .join(" ")
  .split(" ")
  .map((box) => box.split(",").map((v) => Number(v) / 1000));
// Kerning pairs (1/1000 em to tighten; negative values loosen).
const KERN_PAIRS = [
  "AT70 AU12 AV49 AW22 AY74 Af23 At23 Av14 BT13 BV12 BX14 BY15 CT15 CY17",
  "DB23 DD23 DT29 DV15 DX24 DY28 DZ14 D.20 D,20 FA44 F.75 F,75 GT29 GV18",
  "GY33 JA35 JC16 JG16 JJ31 JO16 JQ16 Ja30 Jc32 Jd32 Je32 Jg32 Jm30 Jn30",
  "Jo32 Jp30 Jq32 Jr30 Ju30 Jy30 J.60 J,60 KC30 KG30 KO30 KQ30 Kc17 Kd17",
  "Ke17 Kf27 Kg17 Ko17 Kq17 Ks10 Kt27 Ku11 Kv28 Kw16 Ky11 LC22 LG22 LO22",
  "LQ22 LT93 LU18 LV74 LW25 LY118 Lf46 Lt46 Lv33 Lw11 OB23 OD23 OT29",
  "OV15 OX24 OY28 OZ14 O.20 O,20 PA55 PJ48 PX21 PZ19 Pa11 Pc14 Pd14 Pe14",
  "Pg14 Po14 Pq14 Ps12 P.104 P,104 QB23 QD23 QT29 QV15 QX24 QY28 QZ14",
  "Q.20 Q,20 RT11 RV12 RY16 ST26 SV11 SX10 SY21 TA70 TC29 TG29 TJ87 TO29",
  "TQ29 TS15 Ta87 Tc97 Td97 Te97 Tf52 Tg97 Ti11 Tj11 Tm72 Tn72 To97 Tp72",
  "Tq97 Tr72 Ts82 Tt52 Tu74 Tv69 Tw72 Tx80 Ty74 Tz76 T.96 T,96 UA12 U.15",
  "U,15 VA49 VC15 VG15 VO15 VQ15 Va33 Vc33 Vd33 Ve33 Vg33 Vo33 Vq33 Vs30",
  "Vu11 Vv15 Vw13 Vx26 Vy11 V.72 V,72 WA22 Wc10 Wd10 We10 Wg10 Wo10 Wq10",
  "W.40 W,40 XC24 XG24 XO24 XQ24 Xc17 Xd17 Xe17 Xf20 Xg17 Xo17 Xq17 Xt20",
  "Xu10 Xv20 Xw11 Xy10 YA74 YC28 YG28 YJ95 YO28 YQ28 YS19 Ya83 Yc87 Yd87",
  "Ye87 Yf46 Yg87 Ym73 Yn73 Yo87 Yp73 Yq87 Yr73 Ys80 Yt46 Yu75 Yv63 Yw65",
  "Yx71 Yy75 Yz72 Y.105 Y,105 ZC14 ZG14 ZO14 ZQ14 Zc11 Zd11 Ze11 Zf16",
  "Zg11 Zo11 Zq11 Zt16 Zv11 ac12 ad12 ae12 af34 ag12 ao12 aq12 at34 au13",
  "av27 ay13 bf18 bt18 bv17 bx32 bz13 cf18 ct18 cv17 cx32 cz13 ef18 et18",
  "ev17 ex32 ez13 fc20 fd20 fe20 fg20 fi26 fj26 fl26 fo20 fq20",
  "ft13 f.63 f,63 hf14 ht14 hv15 ka11 kc28 kd28 ke28 kg28 ko28 kq28 ks13",
  "mf14 mt14 mv15 nf14 nt14 nv15 of18 ot18 ov17 ox32 oz13 pf18 pt18 pv17",
  "px32 pz13 ra14 rc18 rd18 re18 rg18 ro18 rq18 rs11 r.72 r,72 sf11 st11",
  "sv19 tc18 td18 te18 tf27 tg18 to18 tq18 va14 vc17 vd17 ve17",
  "vg17 vo17 vq17 vs13 v.41 v,41 w.26 w,26 xa10 xc32 xd32 xe32 xg32 xo32",
  "xq32 xs11 zc14 zd14 ze14 zg14 zo14 zq14 .C20 .G20 .O20 .Q20 .T96 .U15",
  ".V72 .W40 .Y105 .f59 .t59 .v41 .w26 ,C20 ,G20 ,O20 ,Q20 ,T96 ,U15",
  ",V72 ,W40 ,Y105 ,f59 ,j-14 ,t59 ,v41 ,w26",
].join(" ");
const KERN = new Map(
  KERN_PAIRS.split(" ").map((p) => [p.slice(0, 2), -Number(p.slice(2)) / 1000]),
);
const TRACK = -0.02;
// Space Grotesk typo metrics (USE_TYPO_METRICS): ascender 984, descender 292.
const ASC = 0.984;
const LINE = 1.276;
const STACK_GAP = 0.16;

const DROP_GAP = 8;
const FALL = 12;
const ROCK = 10;
const ROCK_DEG = 3.5;
const TOPPLE = 22;
const DETACH_DEG = 20;
const LAND_GAP = 4;
const LIFT_STEP = 0.26;
const FRAME_H = 0.78;
const FRAME_W = 0.86;
const CAM_SMOOTH = 6;

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_IO = Easing.bezier(0.65, 0, 0.35, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

// gradients.sh palettes: "grain" (#ffd8b4, #e0703b, #8a2c1d, #2b1015 on
// #070505) for dark, "smear" (#f2552c, #f7b23b, #e889b5 on #efe8dc) for light.
const THEMES = {
  dark: {
    bg: "#070505",
    fg: "#FFF3E8",
    rule: "rgba(255,216,180,0.22)",
    ground: (x: number, y: number) =>
      [
        `radial-gradient(38% 34% at ${x}% ${y}%, rgba(255,216,180,0.4) 0%, transparent 62%)`,
        `linear-gradient(${150 - x * 0.2}deg, #E0703B 0%, rgba(138,44,29,0.92) 22%, rgba(43,16,21,0.9) 46%, rgba(7,5,5,0) 74%)`,
      ].join(", "),
    grain: 0.08,
  },
  light: {
    bg: "#EFE8DC",
    fg: "#1A1412",
    rule: "rgba(26,20,18,0.16)",
    ground: (x: number, y: number) =>
      [
        `radial-gradient(38% 34% at ${x}% ${y}%, rgba(247,178,59,0.55) 0%, transparent 62%)`,
        `linear-gradient(${150 - x * 0.2}deg, rgba(242,85,44,0.78) 0%, rgba(232,137,181,0.55) 24%, rgba(239,232,220,0) 52%)`,
      ].join(", "),
    grain: 0.05,
  },
} as const;

type Pt = { x: number; y: number };

function advance(ch: string) {
  const code = ch.charCodeAt(0);
  return (code >= 32 && code < 127 ? SPACE_500[code - 32] : 620) / 1000;
}

function ink(ch: string) {
  const code = ch.charCodeAt(0);
  const box = code > 32 && code < 127 ? INK_500[code - 33] : null;
  if (!box) return { l: 0.05, r: advance(ch) - 0.05, top: 0.546, desc: 0 };
  return {
    l: box[0],
    r: box[2],
    top: box[3],
    desc: box[1] < -0.05 ? -box[1] : 0,
  };
}

/** CSS rotate(deg) is clockwise in screen space; mirror that here. */
function rotate(p: Pt, about: Pt, deg: number): Pt {
  const r = (deg * Math.PI) / 180;
  const dx = p.x - about.x;
  const dy = p.y - about.y;
  return {
    x: about.x + dx * Math.cos(r) - dy * Math.sin(r),
    y: about.y + dx * Math.sin(r) + dy * Math.cos(r),
  };
}

function bezier(p0: Pt, p1: Pt, p2: Pt, p3: Pt, u: number): Pt {
  const v = 1 - u;
  const a = v * v * v;
  const b = 3 * v * v * u;
  const c = 3 * v * u * u;
  const d = u * u * u;
  return {
    x: a * p0.x + b * p1.x + c * p2.x + d * p3.x,
    y: a * p0.y + b * p1.y + c * p2.y + d * p3.y,
  };
}

/** Landing squash: a one-frame hit, then a damped return with a hair of overshoot. */
function squash(d: number) {
  if (d < 0 || d > 14) return 0;
  if (d < 1) return d;
  const k = d - 1;
  return Math.exp(-k / 2.2) * Math.cos(k * 0.66);
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
          seed={53}
          stitchTiles="stitch"
        />
        <feColorMatrix values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0.9 0" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#${id})`} />
    </svg>
  );
}

export function StackLetters({
  word = "STACK",
  accent = "#3B5BFD",
  theme = "dark",
  speed = 1,
}: StackLettersProps) {
  const t = useCurrentFrame() * speed;
  const { width: W, height: H } = useVideoConfig();
  const c = THEMES[theme];

  const chars = useMemo(() => Array.from(word), [word]);
  const n = chars.length;
  const boxes = useMemo(() => chars.map(ink), [chars]);

  const em = useMemo(() => {
    const xs: number[] = [];
    let x = 0;
    chars.forEach((ch, i) => {
      if (i > 0) x += KERN.get(chars[i - 1] + ch) ?? 0;
      xs.push(x);
      x += advance(ch) + TRACK;
    });
    const total = x - TRACK;
    return { xs: xs.map((v) => v - total / 2), total };
  }, [chars]);

  const F = Math.min(H * 0.4, (W * 0.6) / Math.max(em.total, 0.1));

  const geo = useMemo(() => {
    const centers = boxes.map((b, i) => (em.xs[i] + (b.l + b.r) / 2) * F);
    const half = boxes.map((b) => ((b.r - b.l) / 2) * F);
    const bases: number[] = [];
    boxes.forEach((b, i) => {
      if (i === 0) bases.push(0);
      else
        bases.push(
          bases[i - 1] - boxes[i - 1].top * F - STACK_GAP * F - b.desc * F,
        );
    });
    const towerH = -(bases[n - 1] - boxes[n - 1].top * F);
    const axis = centers[0];
    return {
      centers,
      half,
      bases,
      towerH,
      axis,
      pivotL: { x: axis - half[0], y: 0 },
      pivotR: { x: axis + half[0], y: 0 },
    };
  }, [boxes, em, F, n]);

  const drop = (k: number) => k * DROP_GAP - 6;
  const lastStack = drop(n - 1) + FALL;
  const rockAt = lastStack + 9;
  const toppleAt = rockAt + ROCK;
  const toppleDeg = (time: number) => {
    const u = (time - toppleAt) / TOPPLE;
    return 95 * u * u;
  };
  // Every letter lets go on the same frame and carries the tower's velocity,
  // so the stack keeps its spacing and only spreads from there.
  const release = toppleAt + TOPPLE * Math.sqrt(DETACH_DEG / 95);
  const landAt = (k: number) => release + 7 + k * LAND_GAP;

  const towerPose = (deg: number, pivot: Pt, k: number) => {
    const p = rotate({ x: geo.axis, y: geo.bases[k] }, pivot, deg);
    return { ...p, rot: deg };
  };

  /** Rigid-body pose of letter k once the stack is complete (no squash). */
  const flight = (k: number, time: number) => {
    if (time < toppleAt) {
      if (time < rockAt) return { x: geo.axis, y: geo.bases[k], rot: 0 };
      const u = (time - rockAt) / ROCK;
      const deg = -ROCK_DEG * Math.sin(Math.PI * EASE_IO(u));
      return towerPose(deg, geo.pivotL, k);
    }
    if (time < release) return towerPose(toppleDeg(time), geo.pivotR, k);
    const land = landAt(k);
    const end = { x: geo.centers[k], y: 0 };
    if (time >= land) return { ...end, rot: 0 };
    const u = (time - release) / (land - release);
    const deg0 = toppleDeg(release);
    if (k === 0) return towerPose(deg0 * (1 - u * u), geo.pivotR, 0);
    const omega =
      ((2 * 95 * (release - toppleAt)) / (TOPPLE * TOPPLE)) * (Math.PI / 180);
    const start = towerPose(deg0, geo.pivotR, k);
    const r = { x: start.x - geo.pivotR.x, y: start.y - geo.pivotR.y };
    const lead = (land - release) / 3;
    // Low letters get a shorter approach so they never hop up into the next.
    const reach = Math.min(1, Math.max(0.3, (end.y - start.y) / (F * 1.4)));
    const p = bezier(
      start,
      { x: start.x - r.y * omega * lead, y: start.y + r.x * omega * lead },
      // Come in from the upper right, parallel to a left-leaning stroke, so a
      // kerned pair (T over A) slides together instead of interlocking.
      { x: end.x + F * 0.4 * reach, y: end.y - F * 0.85 * reach },
      end,
      u,
    );
    // Higher letters ride a higher arc, so neighbours keep clear air.
    const lift = Math.sin(Math.PI * u) ** 2 * k * LIFT_STEP * F;
    // Hold the tilt briefly: righting at once would swing the top into the
    // letter above.
    const turn = Math.min(1, Math.max(0, (u - 0.2) / 0.45));
    return {
      ...p,
      y: p.y - lift,
      rot: deg0 * (1 - turn * turn * (3 - 2 * turn)),
    };
  };

  // Camera: frame whatever the letters occupy, smoothed over a short window.
  const fit = (time: number) => {
    let x0 = Number.POSITIVE_INFINITY;
    let x1 = Number.NEGATIVE_INFINITY;
    let y0 = Number.POSITIVE_INFINITY;
    let y1 = Number.NEGATIVE_INFINITY;
    boxes.forEach((box, k) => {
      const p = flight(k, time);
      const hw = geo.half[k];
      for (const [lx, ly] of [
        [-hw, -box.top * F],
        [hw, -box.top * F],
        [-hw, box.desc * F],
        [hw, box.desc * F],
      ]) {
        const q = rotate({ x: p.x + lx, y: p.y + ly }, p, p.rot);
        x0 = Math.min(x0, q.x);
        x1 = Math.max(x1, q.x);
        y0 = Math.min(y0, q.y);
        y1 = Math.max(y1, q.y);
      }
    });
    return {
      x: (x0 + x1) / 2,
      y: (y0 + y1) / 2,
      s: Math.min(1, (H * FRAME_H) / (y1 - y0), (W * FRAME_W) / (x1 - x0)),
    };
  };
  const cam0 = fit(toppleAt);
  let camX = 0;
  let camY = 0;
  let scale = 0;
  for (let d = -CAM_SMOOTH; d <= CAM_SMOOTH; d++) {
    const f = fit(Math.max(toppleAt, t + d));
    camX += f.x;
    camY += f.y;
    scale += f.s;
  }
  const samples = CAM_SMOOTH * 2 + 1;
  camX /= samples;
  camY /= samples;
  scale /= samples;
  const viewTop = cam0.y - H / 2 / cam0.s;

  const pose = (k: number) => {
    const box = boxes[k];
    const d = drop(k);
    const settled = d + FALL;
    if (t < settled) {
      const u = Math.max(0, (t - d) / FALL);
      const y0 = viewTop - box.desc * F - 4;
      return {
        x: geo.axis,
        y: y0 + (geo.bases[k] - y0) * u * u,
        rot: 0,
        hit: 0,
        visible: t >= d,
      };
    }
    const p = flight(k, t);
    const hit = t < rockAt ? squash(t - settled) : squash(t - landAt(k));
    return { ...p, hit, visible: true };
  };

  const ruleH = Math.max(2, F * 0.012);
  // The light source drifts a few percent over the whole shot.
  const drift = interpolate(t, [0, landAt(n - 1) + 30], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const ruleIn = interpolate(t, [0, 14], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });

  return (
    <AbsoluteFill style={{ background: c.bg, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: c.ground(10 + 6 * drift, 8 + 4 * drift),
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          transformOrigin: "0 0",
          transform: `translate(${W / 2}px, ${H / 2}px) scale(${scale}) translate(${-camX}px, ${-camY}px)`,
          fontFamily: sans,
          fontWeight: 500,
          fontSize: F,
          fontKerning: "none",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: -W * 3,
            top: F * 0.014,
            width: W * 6,
            height: ruleH / scale,
            background: c.rule,
            opacity: ruleIn,
          }}
        />
        {chars.map((_, k) => {
          const land = landAt(k);
          const flash = interpolate(t - land, [0, 1, 16], [0, 1, 0], {
            ...CLAMP,
            easing: EASE_OUT,
          });
          const grow = interpolate(t - land, [0, 8], [0.4, 1], {
            ...CLAMP,
            easing: EASE_OUT,
          });
          if (flash <= 0.001) return null;
          return (
            <div
              key={`tick-${k}`}
              style={{
                position: "absolute",
                left: geo.centers[k] - geo.half[k],
                top: F * 0.014,
                width: geo.half[k] * 2,
                height: (ruleH * 2) / scale,
                background: accent,
                opacity: flash,
                transform: `scaleX(${grow})`,
              }}
            />
          );
        })}
        {chars.map((ch, k) => {
          const p = pose(k);
          if (!p.visible) return null;
          const box = boxes[k];
          const ox = (box.l + box.r) / 2;
          const sy = 1 - 0.09 * p.hit;
          const sx = 1 + 0.06 * p.hit;
          return (
            <div
              key={`${k}-${ch}`}
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                color: c.fg,
                transformOrigin: "0 0",
                transform: `translate(${p.x}px, ${p.y}px) rotate(${p.rot}deg) scale(${sx}, ${sy})`,
              }}
            >
              <span
                style={{
                  position: "absolute",
                  left: -ox * F,
                  top: -ASC * F,
                  lineHeight: LINE,
                  whiteSpace: "pre",
                }}
              >
                {ch}
              </span>
            </div>
          );
        })}
      </div>
      <Grain opacity={c.grain} />
    </AbsoluteFill>
  );
}
