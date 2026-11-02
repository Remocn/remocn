"use client";

import { useId } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

export interface SplitWordProps {
  word?: string;
  insert?: string;
  accent?: string;
  theme?: "dark" | "light";
  speed?: number;
}

// [advance, inkLeft, inkRight, inkTop, inkBottom, outline] per 1000 em,
// baseline at y = 0, y down. Overlaps removed (fontTools + skia-pathops).
type Glyph = readonly [number, number, number, number, number, string];

const GLYPHS: Record<string, Glyph> = {
  A: [
    632,
    21,
    610,
    700,
    0,
    "M21 0 221 -700H411L610 0H499L453 -165H179L133 0ZM206 -265H426L324 -633H308Z",
  ],
  B: [
    663,
    47,
    615,
    700,
    0,
    "M47 0V-96H141V-604H47V-700H402Q465 -700 512 -678Q559 -657 586 -618Q612 -578 612 -524V-514Q612 -466 594 -435Q576 -404 550 -387Q525 -370 502 -363V-347Q525 -341 552 -324Q578 -306 596 -275Q615 -244 615 -194V-184Q615 -126 588 -85Q561 -44 514 -22Q466 0 404 0ZM250 -98H391Q445 -98 476 -124Q507 -150 507 -196V-205Q507 -251 476 -277Q446 -303 391 -303H250ZM250 -402H391Q442 -402 473 -428Q504 -453 504 -497V-507Q504 -551 474 -576Q443 -602 391 -602H250Z",
  ],
  C: [
    643,
    55,
    596,
    714,
    14,
    "M333 14Q205 14 130 -58Q55 -131 55 -268V-432Q55 -569 130 -642Q205 -714 333 -714Q459 -714 528 -644Q596 -574 596 -453V-447H489V-456Q489 -527 450 -572Q412 -617 333 -617Q253 -617 208 -568Q163 -520 163 -434V-266Q163 -181 208 -132Q253 -83 333 -83Q412 -83 450 -128Q489 -174 489 -244V-261H596V-247Q596 -126 528 -56Q459 14 333 14Z",
  ],
  D: [
    665,
    47,
    616,
    700,
    0,
    "M47 0V-96H141V-604H47V-700H327Q467 -700 542 -629Q616 -558 616 -415V-284Q616 -141 542 -70Q467 0 327 0ZM250 -98H328Q419 -98 463 -144Q507 -190 507 -281V-419Q507 -511 463 -556Q419 -601 328 -601H250Z",
  ],
  E: [
    559,
    73,
    519,
    700,
    0,
    "M73 0V-700H514V-602H181V-401H486V-303H181V-98H519V0Z",
  ],
  F: [537, 73, 505, 700, 0, "M73 0V-700H505V-602H181V-400H479V-302H181V0Z"],
  G: [
    661,
    55,
    595,
    714,
    14,
    "M316 14Q241 14 182 -18Q123 -51 89 -114Q55 -177 55 -268V-432Q55 -569 130 -642Q205 -714 333 -714Q459 -714 527 -646Q595 -577 595 -462V-457H488V-465Q488 -508 471 -542Q454 -577 420 -597Q386 -617 333 -617Q253 -617 208 -568Q163 -520 163 -434V-266Q163 -181 208 -132Q253 -82 334 -82Q414 -82 451 -126Q488 -170 488 -240V-253H300V-346H595V0H495V-71H479Q470 -52 452 -32Q435 -12 402 1Q370 14 316 14Z",
  ],
  H: [
    656,
    73,
    583,
    700,
    0,
    "M73 0V-700H181V-400H475V-700H583V0H475V-302H181V0Z",
  ],
  I: [254, 73, 181, 700, 0, "M73 0V-700H181V0Z"],
  J: [
    602,
    36,
    559,
    700,
    14,
    "M265 14Q160 14 98 -44Q36 -103 36 -210V-270H144V-210Q144 -154 174 -120Q205 -87 263 -87Q319 -87 346 -120Q373 -153 373 -210V-602H251V-700H559V-602H481V-210Q481 -101 424 -44Q368 14 265 14Z",
  ],
  K: [
    618,
    73,
    610,
    700,
    0,
    "M73 0V-700H181V-409H197L458 -700H599L283 -355L610 0H465L197 -297H181V0Z",
  ],
  L: [544, 73, 518, 700, 0, "M73 0V-700H181V-98H518V0Z"],
  M: [
    874,
    73,
    801,
    700,
    0,
    "M73 0V-700H276L429 -72H445L598 -700H801V0H696V-624H680L528 0H346L194 -624H178V0Z",
  ],
  N: [
    667,
    73,
    594,
    700,
    0,
    "M73 0V-700H281L471 -72H487V-700H594V0H386L196 -629H180V0Z",
  ],
  O: [
    673,
    55,
    618,
    714,
    14,
    "M336 14Q207 14 131 -58Q55 -131 55 -268V-432Q55 -569 131 -642Q207 -714 336 -714Q465 -714 542 -642Q618 -569 618 -432V-268Q618 -131 542 -58Q465 14 336 14ZM336 -83Q419 -83 464 -132Q509 -180 509 -264V-436Q509 -520 464 -568Q419 -617 336 -617Q255 -617 209 -568Q163 -520 163 -436V-264Q163 -180 209 -132Q255 -83 336 -83Z",
  ],
  P: [
    603,
    73,
    573,
    700,
    0,
    "M73 0V-700H351Q415 -700 466 -674Q516 -649 544 -602Q573 -556 573 -491V-478Q573 -413 544 -366Q514 -319 464 -294Q414 -269 351 -269H181V0ZM181 -367H340Q397 -367 431 -397Q465 -427 465 -479V-489Q465 -542 431 -572Q397 -602 340 -602H181Z",
  ],
  Q: [
    673,
    55,
    618,
    714,
    171,
    "M379 171Q336 171 310 144Q283 118 283 73V11Q191 -2 131 -59Q55 -131 55 -268V-432Q55 -569 131 -642Q207 -714 336 -714Q465 -714 542 -642Q618 -569 618 -432V-268Q618 -131 541 -59Q481 -1 389 11V55Q389 85 417 85H479V171ZM336 -83Q419 -83 464 -132Q509 -180 509 -264V-436Q509 -520 464 -568Q419 -617 336 -617Q255 -617 209 -568Q163 -520 163 -436V-264Q163 -180 209 -132Q255 -83 336 -83Z",
  ],
  R: [
    632,
    73,
    586,
    700,
    0,
    "M73 0V-700H367Q432 -700 482 -678Q531 -655 558 -613Q586 -571 586 -513V-502Q586 -436 554 -396Q523 -357 478 -341V-325Q516 -323 539 -300Q562 -276 562 -232V0H453V-217Q453 -244 439 -260Q425 -276 394 -276H181V0ZM181 -374H355Q413 -374 445 -404Q477 -433 477 -484V-492Q477 -543 446 -572Q414 -602 355 -602H181Z",
  ],
  S: [
    609,
    41,
    569,
    714,
    14,
    "M311 14Q232 14 171 -14Q110 -42 76 -96Q41 -151 41 -229V-254H148V-229Q148 -155 192 -118Q237 -81 311 -81Q386 -81 424 -112Q462 -144 462 -194Q462 -227 444 -248Q426 -269 393 -282Q360 -294 314 -305L277 -314Q210 -330 160 -354Q111 -377 84 -416Q57 -455 57 -516Q57 -578 88 -622Q118 -666 172 -690Q226 -714 299 -714Q372 -714 430 -689Q487 -664 520 -615Q553 -566 553 -492V-456H446V-492Q446 -537 428 -565Q409 -593 376 -606Q343 -619 299 -619Q235 -619 200 -592Q164 -566 164 -519Q164 -487 180 -466Q195 -446 225 -433Q255 -420 300 -410L337 -401Q405 -386 457 -362Q509 -339 539 -299Q569 -259 569 -196Q569 -133 538 -86Q506 -39 448 -12Q390 14 311 14Z",
  ],
  T: [588, 25, 563, 700, 0, "M240 0V-602H25V-700H563V-602H348V0Z"],
  U: [
    669,
    68,
    601,
    700,
    14,
    "M335 14Q252 14 192 -16Q133 -46 100 -102Q68 -159 68 -240V-700H177V-237Q177 -163 218 -123Q259 -83 335 -83Q411 -83 452 -123Q493 -163 493 -237V-700H601V-240Q601 -159 569 -102Q537 -46 477 -16Q417 14 335 14Z",
  ],
  V: [
    619,
    21,
    597,
    700,
    0,
    "M216 0 21 -700H133L303 -68H316L485 -700H597L403 0Z",
  ],
  W: [
    887,
    33,
    853,
    700,
    0,
    "M136 0 33 -700H141L225 -73H241L349 -700H538L646 -73H662L745 -700H853L750 0H561L451 -636H435L326 0Z",
  ],
  X: [
    641,
    27,
    614,
    700,
    0,
    "M27 0 242 -353 30 -700H154L312 -430H328L487 -700H611L399 -353L614 0H489L328 -276H312L151 0Z",
  ],
  Y: [
    617,
    11,
    606,
    700,
    0,
    "M254 0V-254L11 -700H133L301 -383H316L484 -700H606L363 -254V0Z",
  ],
  Z: [
    577,
    48,
    531,
    700,
    0,
    "M48 0V-140L416 -589V-603H59V-700H527V-560L159 -111V-97H531V0Z",
  ],
};
const KERN_PAIRS =
  "AC-8 AG-8 AO-8 AQ-8 AT-70 AU-12 AV-49 AW-22 AY-74 BA-5 BT-13 BV-12 BX-14 BY-15 CA-7 CT-15 CV-7 CX-9 CY-17 CZ-6 DA-8 DB-23 DD-23 DT-29 DV-15 DW-7 DX-24 DY-28 DZ-14 FA-44 FC-7 FG-7 FO-7 FQ-7 GT-29 GV-18 GW-4 GY-33 JA-35 JC-16 JG-16 JJ-31 JO-16 JQ-16 KC-30 KG-30 KO-30 KQ-30 KS-6 LC-22 LG-22 LO-22 LQ-22 LT-93 LU-18 LV-74 LW-25 LY-118 OA-8 OB-23 OD-23 OT-29 OV-15 OW-7 OX-24 OY-28 OZ-14 PA-55 PB-4 PD-4 PJ-48 PV-5 PX-21 PY-7 PZ-19 QA-8 QB-23 QD-23 QT-29 QV-15 QW-7 QX-24 QY-28 QZ-14 RT-11 RV-12 RY-16 SB-4 SD-4 ST-26 SV-11 SX-10 SY-21 TA-70 TC-29 TG-29 TJ-87 TO-29 TQ-29 TS-15 UA-12 VA-49 VC-15 VG-15 VO-15 VQ-15 VS-9 WA-22 WC-7 WG-7 WO-7 WQ-7 XC-24 XG-24 XJ-8 XO-24 XQ-24 XS-9 YA-74 YC-28 YG-28 YJ-95 YO-28 YQ-28 YS-19 ZC-14 ZG-14 ZO-14 ZQ-14";

const KERN = new Map(
  KERN_PAIRS.split(" ").map((p) => [p.slice(0, 2), Number(p.slice(2))]),
);
// Space Grotesk 500: display caps want a hair of negative tracking.
const TRACK = -14;
const SPACE = 255;
const CAP = 700;
const HALF = CAP / 2;
// Band height in insert cap-heights once the slit settles.
const BAND = 1.66;

const EASE_IO = Easing.bezier(0.65, 0, 0.35, 1);
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
    sky: "#03050b",
    skyAlpha: 58,
    ins: "#F7F6F2",
    grain: 0.07,
  },
  light: {
    bg: "#F5F4F0",
    key: "rgba(255,255,255,0.9)",
    fg: "#121214",
    sky: "#03050b",
    skyAlpha: 62,
    ins: "#F7F6F2",
    grain: 0.045,
  },
} as const;

// gradients.sh "aurora": the slit opens onto this sky.
const AURORA = ["#a0f0c8", "#3fb5a3", "#5147b6", "#b25c9c"] as const;

interface SetWord {
  glyphs: { d: string; x: number }[];
  left: number;
  ink: number;
  first: number;
}

function setWord(word: string): SetWord {
  const glyphs: { d: string; x: number }[] = [];
  let x = 0;
  let prev = "";
  let left = 0;
  let right = 0;
  let first = 0;
  for (const ch of word.toUpperCase()) {
    const g = GLYPHS[ch];
    if (!g) {
      x += SPACE;
      prev = "";
      continue;
    }
    x += KERN.get(prev + ch) ?? 0;
    if (glyphs.length === 0) {
      left = x + g[1];
      first = g[0] + TRACK;
    }
    right = x + g[2];
    glyphs.push({ d: g[5], x });
    x += g[0] + TRACK;
    prev = ch;
  }
  return { glyphs, left, ink: Math.max(1, right - left), first };
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

export function SplitWord({
  word = "Now",
  insert = "Available",
  accent = "#3B5BFD",
  theme = "dark",
  speed = 1,
}: SplitWordProps) {
  const t = useCurrentFrame() * speed;
  const { width: W, height: H } = useVideoConfig();
  const u = H / 720;
  const c = THEMES[theme];
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const ids = {
    box: `b${uid}`,
    top: `t${uid}`,
    bottom: `d${uid}`,
    band: `s${uid}`,
  };

  const hero = setWord(word || "remocn");
  const ins = setWord(insert || " ");
  const m = Math.round(Math.min(W, H) * 0.115);
  const Wc = W - m * 2;
  const Hc = H - m * 2;

  let sh = Wc / (hero.ink + hero.first);
  let si = Math.min(Wc / ins.ink, sh * 0.56);
  const blockH = (a: number, b: number) => CAP * a + CAP * b * BAND;
  const fit = Math.min(1, Hc / blockH(sh, si));
  sh *= fit;
  si *= fit;

  const capI = CAP * si;
  const off = hero.first * sh;
  const heroW = hero.ink * sh;
  const insW = ins.ink * si;
  const gapEnd = capI * BAND;
  const gapOpen = gapEnd * 1.3;
  const x0 = (W - heroW) / 2;
  const cy = H / 2;

  const cut = interpolate(t, [20, 30], [0, 1], { ...CLAMP, easing: EASE_IO });
  const open = interpolate(t, [30, 54], [0, 1], { ...CLAMP, easing: EASE_IO });
  const back = interpolate(t, [68, 94], [0, 1], { ...CLAMP, easing: EASE_IO });

  const shift = (off / 2) * (open - 2 * back);
  const gap = gapOpen * open + (gapEnd - gapOpen) * back;

  const topX = x0 - shift;
  const bottomX = x0 + shift;
  const topY = cy - gap / 2;
  const bottomY = cy + gap / 2;

  const rise = (i: number) =>
    interpolate(t, [i * 3 - 6, i * 3 + 12], [1, 0], {
      ...CLAMP,
      easing: EASE_OUT,
    });

  const letters = hero.glyphs.map((g, i) => (
    <path
      key={`${i}-${g.x}`}
      d={g.d}
      transform={`translate(${g.x} ${rise(i) * (CAP + 40)})`}
    />
  ));

  const half = (x: number, baselineShift: number, clip: string) => (
    <g
      transform={`translate(${x - hero.left * sh} ${baselineShift}) scale(${sh})`}
      clipPath={`url(#${clip})`}
      fill={c.fg}
    >
      <g clipPath={`url(#${ids.box})`}>{letters}</g>
    </g>
  );

  const insX = (W - insW) / 2 - ins.left * si;
  const hair = Math.max(1.5, 2 * u);

  // The aurora is a fixed full-frame sky; only the slit shows it. Blobs
  // drift a few percent across the shot so the window feels alive.
  const drift = interpolate(t, [0, 126], [0, 1], CLAMP);
  const mixA = (col: string, a: number) =>
    `color-mix(in oklab, ${col} ${a}%, transparent)`;
  const sky = [
    ...AURORA.map((col, i) => {
      const x = 15 + (70 * i) / (AURORA.length - 1) + (i % 2 ? -4 : 4) * drift;
      const y = 50 + (i % 2 ? 6 : -6) * (1 - drift);
      return `radial-gradient(34% 80% at ${x}% ${y}%, ${mixA(col, c.skyAlpha)} 0%, transparent 70%)`;
    }),
    `linear-gradient(180deg, transparent 38%, ${mixA(AURORA[2], 30)} 50%, transparent 72%)`,
    c.sky,
  ].join(", ");
  const bandH = Math.max(0, bottomY - topY);

  return (
    <AbsoluteFill style={{ background: c.bg, overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 75% 85% at 35% 30%, ${c.key}, transparent 70%)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 0,
          top: topY,
          width: W,
          height: bandH,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            top: -topY,
            width: W,
            height: H,
            background: sky,
          }}
        />
      </div>
      <svg
        width={W}
        height={H}
        viewBox={`0 0 ${W} ${H}`}
        style={{ position: "absolute", inset: 0 }}
        aria-hidden
      >
        <defs>
          <clipPath id={ids.box}>
            <rect
              x={-1000}
              y={-CAP - 60}
              width={hero.ink + 4000}
              height={CAP + 80}
            />
          </clipPath>
          <clipPath id={ids.top}>
            <rect
              x={-1000}
              y={-CAP - 200}
              width={hero.ink + 4000}
              height={HALF + 200}
            />
          </clipPath>
          <clipPath id={ids.bottom}>
            <rect
              x={-1000}
              y={-HALF}
              width={hero.ink + 4000}
              height={HALF + 200}
            />
          </clipPath>
          <clipPath id={ids.band}>
            <rect
              x={0}
              y={topY}
              width={W}
              height={Math.max(0, bottomY - topY)}
            />
          </clipPath>
        </defs>

        <g clipPath={`url(#${ids.band})`} fill={c.ins}>
          <g transform={`translate(${insX} ${cy + capI / 2}) scale(${si})`}>
            {ins.glyphs.map((g, i) => (
              <path
                key={`${i}-${g.x}`}
                d={g.d}
                transform={`translate(${g.x} 0)`}
              />
            ))}
          </g>
        </g>

        {half(topX, topY + HALF * sh, ids.top)}
        {half(bottomX, bottomY + HALF * sh, ids.bottom)}

        {cut > 0 && open === 0 ? (
          <rect
            x={x0 - 8 * u}
            y={cy - hair / 2}
            width={(heroW + 16 * u) * cut}
            height={hair}
            fill={accent}
          />
        ) : null}
      </svg>
      <Grain opacity={c.grain} />
    </AbsoluteFill>
  );
}
