"use client";

import { useId, useMemo } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

export type DynamicLetterVariant =
  | "solid"
  | "outline"
  | "stripes"
  | "slice"
  | "stencil"
  | "dots"
  | "overflow"
  | "counter"
  | "shadow";

export interface DynamicLetterProps {
  /** Wordmark after the R mark, as in the remocn.dev logo. Lowercase a–z; it never moves. */
  text?: string;
  /** Index into `text` of the letter that changes; defaults to the first "o" (or the middle letter). */
  letterIndex?: number;
  /** Treatments cut through on the beat, in order. */
  variants?: DynamicLetterVariant[];
  /** Treatment the cycle lands on and holds as the poster. */
  final?: DynamicLetterVariant;
  /** Frames per treatment at the start; the cuts tighten from here. */
  beat?: number;
  accent?: string;
  theme?: "dark" | "light";
  speed?: number;
}

type Glyph = readonly [number, number, number, number, number, string];

/** Manrope 600 (the remocn.dev logo face), lowercase a–z: [advance, xMin, xMax, yTop, yBottom, path], 1000 units/em, y down. */
const GLYPHS: Record<string, Glyph> = {
  a: [
    570,
    40,
    509,
    -555,
    15,
    "M222 15Q163 15 122 -7Q81 -29 61 -66Q40 -103 40 -147Q40 -188 55 -219Q69 -250 97 -272Q126 -294 168 -307Q203 -318 249 -326Q294 -334 345 -341Q395 -347 444 -355L407 -333Q407 -397 380 -428Q352 -458 285 -458Q242 -458 207 -439Q171 -419 157 -373L60 -403Q79 -473 136 -514Q192 -555 285 -555Q358 -555 412 -530Q465 -505 490 -452Q503 -425 506 -396Q509 -366 509 -333V0H417V-123L435 -108Q401 -46 350 -15Q298 15 222 15ZM241 -70Q286 -70 318 -86Q350 -102 369 -127Q388 -151 395 -177Q403 -201 404 -231Q405 -262 405 -279L439 -267Q390 -259 350 -254Q309 -248 276 -242Q244 -236 218 -228Q197 -221 180 -210Q163 -200 153 -184Q143 -169 143 -148Q143 -127 154 -109Q164 -92 186 -81Q208 -70 241 -70Z",
  ],
  b: [
    608,
    69,
    568,
    -720,
    15,
    "M324 15Q246 15 194 -23Q141 -60 114 -125Q87 -189 87 -270Q87 -352 114 -416Q141 -480 193 -518Q245 -555 322 -555Q398 -555 453 -518Q508 -481 538 -416Q568 -352 568 -270Q568 -189 538 -125Q508 -60 454 -23Q399 15 324 15ZM69 0V-720H175V-388H162V0ZM309 -80Q359 -80 392 -105Q425 -130 441 -174Q457 -217 457 -270Q457 -323 441 -366Q424 -409 391 -435Q357 -460 306 -460Q256 -460 225 -436Q193 -412 178 -369Q162 -326 162 -270Q162 -215 178 -171Q193 -128 225 -104Q258 -80 309 -80Z",
  ],
  c: [
    568,
    40,
    537,
    -555,
    15,
    "M301 15Q218 15 160 -22Q102 -59 71 -123Q40 -188 40 -270Q40 -353 72 -418Q104 -482 162 -519Q221 -555 302 -555Q391 -555 454 -511Q517 -467 537 -390L433 -361Q417 -406 382 -431Q346 -456 301 -456Q250 -456 217 -432Q183 -408 167 -366Q151 -324 151 -270Q152 -186 189 -135Q227 -84 301 -84Q352 -84 383 -107Q414 -130 430 -174L537 -148Q510 -69 449 -27Q388 15 301 15Z",
  ],
  d: [
    608,
    40,
    539,
    -720,
    15,
    "M284 15Q209 15 154 -23Q100 -60 70 -125Q40 -189 40 -270Q40 -352 70 -416Q100 -481 155 -518Q211 -555 286 -555Q363 -555 415 -518Q467 -480 494 -416Q521 -352 521 -270Q521 -189 494 -125Q467 -60 415 -23Q362 15 284 15ZM299 -80Q351 -80 383 -104Q415 -128 430 -171Q446 -215 446 -270Q446 -326 430 -369Q415 -412 383 -436Q352 -460 302 -460Q251 -460 217 -435Q183 -409 167 -366Q151 -323 151 -270Q151 -217 167 -174Q183 -130 216 -105Q249 -80 299 -80ZM446 0V-388H433V-720H539V0Z",
  ],
  e: [
    596,
    40,
    556,
    -555,
    15,
    "M310 15Q229 15 168 -20Q108 -56 74 -119Q40 -182 40 -265Q40 -354 73 -419Q107 -484 166 -519Q225 -555 304 -555Q387 -555 445 -517Q503 -478 532 -408Q560 -337 555 -241H450V-279Q449 -372 414 -417Q379 -462 308 -462Q230 -462 191 -413Q151 -363 151 -270Q151 -181 191 -132Q230 -84 304 -84Q353 -84 389 -106Q425 -128 445 -170L547 -137Q516 -65 452 -25Q388 15 310 15ZM117 -241V-322H502V-241Z",
  ],
  f: [
    370,
    30,
    360,
    -735,
    0,
    "M119 0V-559Q119 -580 121 -603Q122 -626 130 -649Q137 -671 154 -690Q175 -713 199 -723Q224 -732 248 -733Q272 -735 292 -735H360V-649H297Q260 -649 242 -631Q224 -612 224 -579V0ZM30 -456V-540H360V-456Z",
  ],
  g: [
    608,
    40,
    538,
    -555,
    255,
    "M293 255Q249 255 208 241Q167 228 134 202Q101 175 79 137L175 88Q193 122 225 139Q258 155 293 155Q338 155 369 139Q401 123 417 91Q434 60 433 13V-137H446V-540H538V15Q538 36 537 56Q535 75 531 94Q520 149 487 185Q455 220 405 238Q356 255 293 255ZM284 15Q209 15 154 -23Q100 -60 70 -125Q40 -189 40 -270Q40 -352 70 -416Q100 -481 155 -518Q211 -555 286 -555Q363 -555 415 -518Q467 -480 494 -416Q521 -352 521 -270Q521 -189 494 -125Q467 -60 415 -23Q362 15 284 15ZM299 -80Q351 -80 383 -104Q415 -128 430 -171Q446 -215 446 -270Q446 -326 430 -369Q415 -412 383 -436Q352 -460 302 -460Q251 -460 217 -435Q183 -409 167 -366Q151 -323 151 -270Q151 -217 167 -174Q183 -130 216 -105Q249 -80 299 -80Z",
  ],
  h: [
    615,
    69,
    555,
    -720,
    0,
    "M449 0V-265Q449 -297 444 -330Q438 -363 424 -392Q409 -421 382 -438Q356 -456 313 -456Q285 -456 260 -446Q235 -437 216 -416Q197 -396 186 -362Q175 -329 175 -281L110 -305Q110 -379 138 -435Q165 -491 217 -523Q269 -555 341 -555Q397 -555 435 -536Q474 -518 497 -489Q521 -460 534 -425Q546 -391 551 -358Q555 -325 555 -300V0ZM69 0V-720H163V-332H175V0Z",
  ],
  i: [264, 80, 185, -730, 0, "M80 -629V-730H185V-629ZM80 0V-540H185V0Z"],
  j: [
    276,
    -10,
    202,
    -730,
    240,
    "M-10 240V141H17Q59 141 78 121Q98 101 98 60V-540H202V102Q202 168 166 204Q130 240 62 240ZM98 -629V-730H202V-629Z",
  ],
  k: [
    524,
    69,
    544,
    -720,
    0,
    "M69 0 70 -720H176V-280L388 -540H521L297 -270L544 0H402L176 -260V0Z",
  ],
  l: [264, 80, 185, -735, 0, "M80 0V-735H185V0Z"],
  m: [
    882,
    69,
    822,
    -554,
    0,
    "M717 0 717 -337Q717 -395 687 -428Q657 -460 608 -460Q579 -460 554 -447Q529 -433 514 -406Q498 -378 498 -338L448 -363Q447 -420 472 -463Q498 -506 541 -530Q585 -554 639 -554Q726 -554 774 -501Q822 -449 822 -362L822 0ZM69 0V-540H162V-384H175V0ZM394 0 394 -334Q394 -393 364 -427Q335 -460 284 -460Q235 -460 205 -426Q175 -393 175 -338L124 -370Q124 -422 150 -464Q175 -505 219 -530Q263 -554 317 -554Q375 -554 415 -529Q456 -505 477 -461Q498 -418 498 -361L498 0Z",
  ],
  n: [
    615,
    69,
    555,
    -555,
    0,
    "M449 0V-265Q449 -297 444 -330Q438 -363 424 -392Q409 -421 382 -438Q356 -456 313 -456Q285 -456 260 -446Q235 -437 216 -416Q197 -396 186 -362Q175 -329 175 -281L110 -305Q110 -379 138 -435Q165 -491 217 -523Q269 -555 341 -555Q397 -555 435 -536Q474 -518 497 -489Q521 -460 534 -425Q546 -391 551 -358Q555 -325 555 -300V0ZM69 0V-540H163V-384H175V0Z",
  ],
  o: [
    610,
    40,
    569,
    -555,
    15,
    "M304 15Q223 15 164 -22Q105 -58 72 -122Q40 -187 40 -270Q40 -355 73 -419Q106 -483 165 -519Q225 -555 304 -555Q386 -555 445 -519Q505 -482 537 -418Q569 -354 569 -270Q569 -186 537 -122Q504 -57 444 -21Q385 15 304 15ZM304 -84Q382 -84 420 -136Q458 -188 458 -270Q458 -355 420 -406Q381 -456 304 -456Q252 -456 218 -433Q184 -409 168 -367Q151 -325 151 -270Q151 -185 190 -135Q229 -84 304 -84Z",
  ],
  p: [
    608,
    69,
    568,
    -555,
    240,
    "M324 15Q246 15 194 -23Q141 -60 114 -125Q87 -189 87 -270Q87 -352 114 -416Q141 -480 193 -518Q245 -555 322 -555Q398 -555 453 -518Q508 -481 538 -416Q568 -352 568 -270Q568 -189 538 -125Q508 -60 454 -23Q399 15 324 15ZM69 240V-540H162V-152H175V240ZM309 -80Q359 -80 392 -105Q425 -130 441 -174Q457 -217 457 -270Q457 -323 441 -366Q424 -409 391 -435Q357 -460 306 -460Q256 -460 225 -436Q193 -412 178 -369Q162 -326 162 -270Q162 -215 178 -171Q193 -128 225 -104Q258 -80 309 -80Z",
  ],
  q: [
    608,
    40,
    539,
    -555,
    240,
    "M284 15Q209 15 154 -23Q100 -60 70 -125Q40 -189 40 -270Q40 -352 70 -416Q100 -481 155 -518Q211 -555 286 -555Q363 -555 415 -518Q467 -480 494 -416Q521 -352 521 -270Q521 -189 494 -125Q467 -60 415 -23Q362 15 284 15ZM299 -80Q351 -80 383 -104Q415 -128 430 -171Q446 -215 446 -270Q446 -326 430 -369Q415 -412 383 -436Q352 -460 302 -460Q251 -460 217 -435Q183 -409 167 -366Q151 -323 151 -270Q151 -217 167 -174Q183 -130 216 -105Q249 -80 299 -80ZM433 240V-152H446V-540H539V240Z",
  ],
  r: [
    386,
    70,
    361,
    -543,
    0,
    "M70 0V-540H163V-409L150 -426Q160 -452 176 -474Q192 -495 213 -509Q233 -525 259 -533Q284 -541 311 -543Q337 -544 361 -540V-442Q335 -449 303 -446Q271 -443 244 -425Q218 -409 203 -385Q188 -362 182 -333Q175 -304 175 -273V0Z",
  ],
  s: [
    536,
    40,
    496,
    -555,
    15,
    "M276 15Q178 15 116 -29Q54 -73 40 -151L147 -168Q157 -126 193 -102Q229 -77 283 -77Q332 -77 360 -97Q388 -117 388 -152Q388 -173 378 -186Q369 -198 338 -210Q306 -221 243 -238Q173 -257 133 -277Q92 -298 75 -326Q57 -353 57 -393Q57 -442 84 -478Q110 -515 157 -535Q204 -555 267 -555Q330 -555 378 -535Q427 -516 457 -480Q487 -444 493 -396L386 -377Q380 -416 349 -438Q318 -461 268 -463Q221 -465 191 -447Q162 -429 162 -398Q162 -380 173 -368Q185 -356 217 -344Q250 -332 313 -316Q381 -299 421 -278Q461 -257 478 -227Q496 -198 496 -156Q496 -77 437 -31Q379 15 276 15Z",
  ],
  t: [
    422,
    10,
    379,
    -690,
    9,
    "M379 0Q328 10 279 8Q230 7 192 -11Q153 -28 133 -66Q116 -99 115 -134Q114 -168 114 -212V-690H218V-218Q218 -185 219 -161Q220 -137 229 -121Q247 -90 287 -85Q326 -81 379 -89ZM10 -456V-540H379V-456Z",
  ],
  u: [
    615,
    60,
    545,
    -540,
    15,
    "M274 15Q218 15 180 -4Q141 -22 118 -51Q94 -80 81 -115Q69 -149 64 -182Q60 -215 60 -240V-540H166V-275Q166 -243 171 -210Q177 -177 191 -148Q206 -119 233 -102Q259 -84 302 -84Q331 -84 355 -94Q380 -103 399 -124Q418 -144 429 -178Q440 -211 440 -259L505 -235Q505 -161 477 -105Q450 -49 398 -17Q347 15 274 15ZM452 0V-156H440V-540H545V0Z",
  ],
  v: [538, 20, 518, -540, 0, "M216 0 20 -540H125L269 -131L412 -540H518L322 0Z"],
  w: [
    790,
    20,
    771,
    -541,
    0,
    "M185 0 20 -541 123 -540 236 -169 350 -540H440L554 -169L668 -540H771L606 0H522L395 -391L269 0Z",
  ],
  x: [
    545,
    10,
    535,
    -540,
    0,
    "M10 0 212 -273 14 -540H138L273 -355L406 -540H530L332 -273L535 0H411L273 -191L134 0Z",
  ],
  y: [
    548,
    13,
    540,
    -540,
    240,
    "M143 240 247 -45 249 39 13 -540H123L299 -93H267L435 -540H540L243 240Z",
  ],
  z: [
    532,
    20,
    492,
    -540,
    0,
    "M20 0V-16L327 -447H48V-540H492V-523L186 -93H478V0Z",
  ],
};

/** Manrope 600 kerning between lowercase pairs, in 1/1000 em. */
const KERN_PAIRS =
  "av-20 aw-20 ay-30 bs-10 bv-20 bw-20 bx-20 by-34 bz-20 ca-6 cc-15 cd-15 ce-15 ci-15 cl-15 co-15 cy-20 ea-10 em-15 en-15 ep-15 ev-20 ew-20 ex-20 ey-10 fa-15 fb31 fc-20 fd-20 fe-20 fh31 fi15 fk31 fl15 fo-20 kc-10 kd-10 ke-10 ko-10 kq-30 ks-10 mc-6 md-6 me-6 mo-6 my-20 nc-6 nd-6 ne-6 no-6 ny-20 os-10 ov-20 ow-20 ox-15 oy-20 oz-20 ps-10 pv-20 pw-20 px-15 py-20 pz-20 ra-15 rc-10 rd-10 re-10 rg-20 ro-10 rs-20 ry-14 sv-20 sw-20 sx-20 sy-20 tc-25 td-25 te-25 to-25 ty-15 va-30 vc-20 vd-20 ve-20 vg-20 vo-20 vq-20 vs-20 vy-5 wa-30 wc-20 wd-20 we-20 wg-20 wo-20 wq-20 ws-20 wy-5 xa-20 xc-20 xd-20 xe-20 xg-20 xo-20 xq-20 xv-10 xw-10 ya-20 yc-20 yd-20 ye-20 yf40 yg-16 yo-20 yt40 za-30 zc-40 zd-40 ze-40 zo-40 zq-30 zy-14";

const REMOCN_R_PATH =
  "M 0.01 0.81 C 0.01 1.73, 0.36 2.79, 1.09 4.13 C 4.91 11.04, 13.45 17.16, 21.7 18.9 C 22.94 19.16, 23.18 19.16, 51.39 19.27 C 76.07 19.36, 80.02 19.4, 81.32 19.57 C 89.89 20.69, 96.2 24.68, 99.38 31.01 C 103.19 38.56, 102.53 50.1, 97.91 57.07 C 94.66 61.96, 89.68 64.99, 83.26 66 C 82.81 66.07, 70.18 66.83, 55.2 67.69 C 24.82 69.43, 27.03 69.23, 24.18 70.4 C 19.9 72.15, 14.84 75.7, 10.65 79.89 C 4.86 85.68, 1.3 91.91, 0.25 98.13 C 0.12 98.85, 0.08 103.13, 0.04 116.66 L 0 134.26 9.5 134.26 L 19 134.26 19.05 119.41 C 19.1 103.27, 19.08 103.82, 19.82 101.04 C 21.79 93.65, 27.86 88.75, 36.45 87.63 C 37.23 87.53, 39.41 87.5, 43.57 87.53 C 50.12 87.59, 50.75 87.65, 53.22 88.45 C 56.61 89.56, 59.67 91.86, 62.02 95.07 C 62.52 95.76, 69.35 103.85, 77.2 113.07 C 85.04 122.28, 91.63 130.04, 91.85 130.32 C 92.07 130.59, 92.5 131.34, 92.82 131.97 C 93.52 133.35, 94.11 133.93, 95.06 134.13 C 95.5 134.23, 98.97 134.26, 106.36 134.23 L 117.01 134.19 100.82 113.07 C 91.91 101.45, 84.52 91.78, 84.39 91.57 C 83.36 89.89, 83.66 87.53, 85.09 86 C 85.79 85.25, 86.36 84.94, 88.07 84.38 C 96.18 81.72, 104.15 76.62, 109.97 70.36 C 120.59 58.93, 124.06 44.32, 119.44 30.43 C 114.59 15.81, 101.93 4.02, 87.64 0.83 C 83.93 0.01, 88.09 0.08, 41.85 0.04 L 0.01 0 0.01 0.81 Z";

/** Logo geometry in font units (1000/em): the R is 0.76em tall, then a 0.04em gap. */
const R_SCALE = 760 / 134.26;
const R_WIDTH = 124.06 * R_SCALE;
const R_GAP = 40;
const TRACK = -25;
const SPACE = 230;

const KERN = new Map(
  KERN_PAIRS.split(" ").map((p) => [p.slice(0, 2), Number(p.slice(2))]),
);

/** gradients.sh "beam" (dark) and "pixel-glass" (light), tied to the accent. */
const THEMES = {
  dark: {
    bg: "#02030a",
    fg: "#F3F2EF",
    stops: ["#f4f7ff", "#8fb4ff", "ACCENT", "#1a1660"],
    glow: [
      "rgba(61,91,255,0.34)",
      "rgba(143,180,255,0.16)",
      "rgba(26,22,96,0.6)",
    ],
    grain: 0.06,
  },
  light: {
    bg: "#f4f3f1",
    fg: "#121214",
    stops: ["#ff4fb8", "#7a3cff", "ACCENT", "#3d6bff"],
    glow: [
      "rgba(122,60,255,0.13)",
      "rgba(255,79,184,0.10)",
      "rgba(61,107,255,0.06)",
    ],
    grain: 0.04,
  },
} as const;

const DEFAULT_VARIANTS: DynamicLetterVariant[] = [
  "solid",
  "outline",
  "stripes",
  "slice",
  "stencil",
  "dots",
  "counter",
];

interface Placed {
  ch: string;
  g: Glyph;
  x: number;
  index: number;
}

function setText(text: string) {
  const placed: Placed[] = [];
  let x = R_WIDTH + R_GAP;
  let prev = "";
  [...text.toLowerCase()].forEach((ch, index) => {
    const g = GLYPHS[ch];
    if (!g) {
      x += SPACE;
      prev = "";
      return;
    }
    x += KERN.get(prev + ch) ?? 0;
    placed.push({ ch, g, x, index });
    x += g[0] + TRACK;
    prev = ch;
  });
  const last = placed[placed.length - 1];
  const right = last ? last.x + last.g[2] : R_WIDTH;
  return { placed, ink: right };
}

/** Cut frames: the first beats are `beat` long, then they tighten by a frame every two cuts. */
function cutFrames(count: number, beat: number) {
  const frames: number[] = [];
  let f = 8;
  for (let i = 0; i < count; i++) {
    frames.push(f);
    const step = Math.max(5, beat - Math.floor(i / 2));
    // A held breath before the final treatment lands.
    f += i === count - 2 ? step + 4 : step;
  }
  return frames;
}

/** Centers of a hex dot grid that sit fully inside the glyph. */
function dotsInside(g: Glyph, pitch: number, r: number) {
  const [, x0, x1, y0, y1, d] = g;
  const rowH = pitch * 0.866;
  const cx = (x0 + x1) / 2;
  const cy = (y0 + y1) / 2;
  const cols = Math.ceil((x1 - x0) / pitch / 2) + 1;
  const rows = Math.ceil((y1 - y0) / rowH / 2) + 1;
  const pts: [number, number][] = [];
  for (let j = -rows; j <= rows; j++) {
    for (let i = -cols; i <= cols; i++) {
      pts.push([cx + (i + (j % 2 ? 0.5 : 0)) * pitch, cy + j * rowH]);
    }
  }
  if (typeof document === "undefined" || typeof Path2D === "undefined") {
    return pts;
  }
  const ctx = document.createElement("canvas").getContext("2d");
  if (!ctx) return pts;
  const path = new Path2D(d);
  const p = r * 0.9;
  const q = p * 0.7;
  const probes = [
    [0, 0],
    [p, 0],
    [-p, 0],
    [0, p],
    [0, -p],
    [q, q],
    [-q, q],
    [q, -q],
    [-q, -q],
  ];
  return pts.filter(([x, y]) =>
    probes.every(([dx, dy]) => ctx.isPointInPath(path, x + dx, y + dy)),
  );
}

/** First closed contour of the glyph: the outer shape without its counter. */
function outerContour(d: string) {
  const end = d.indexOf("Z");
  return end < 0 ? d : d.slice(0, end + 1);
}

function Treatment({
  variant,
  g,
  id,
  fg,
  fill,
  land,
}: {
  variant: DynamicLetterVariant | "plain";
  g: Glyph;
  id: string;
  fg: string;
  fill: string;
  /** 0 → 1 over the first frames after this treatment cut in. */
  land: number;
}) {
  const [, x0, x1, y0, y1, d] = g;
  const cx = (x0 + x1) / 2;
  const cy = (y0 + y1) / 2;
  const w = x1 - x0;
  const h = y1 - y0;
  const clip = `url(#${id}-clip)`;
  const dots = useMemo(() => dotsInside(g, 40, 13), [g]);

  switch (variant) {
    case "plain":
      return <path d={d} fill={fg} />;
    case "solid":
      return <path d={d} fill={fill} />;
    case "outline":
      return (
        <path
          d={d}
          fill="none"
          stroke={fg}
          strokeWidth={58}
          clipPath={clip}
          strokeLinejoin="round"
        />
      );
    case "stripes": {
      const n = 7;
      const pitch = (h + 4) / n;
      return (
        <g clipPath={clip}>
          {Array.from({ length: n }, (_, i) => (
            <rect
              key={i}
              x={x0 - 10}
              y={y0 - 2 + i * pitch + pitch * 0.18}
              width={w + 20}
              height={pitch * 0.64}
              fill={fill}
            />
          ))}
        </g>
      );
    }
    case "slice": {
      const a = (-28 * Math.PI) / 180;
      const ux = Math.cos(a);
      const uy = Math.sin(a);
      const shift = 30;
      const big = 4000;
      const half = (sign: 1 | -1) =>
        `M${cx - ux * big} ${cy - uy * big}L${cx + ux * big} ${cy + uy * big}L${cx + ux * big - uy * big * sign} ${cy + uy * big + ux * big * sign}L${cx - ux * big - uy * big * sign} ${cy - uy * big + ux * big * sign}Z`;
      return (
        <>
          <clipPath id={`${id}-top`}>
            <path d={half(-1)} />
          </clipPath>
          <clipPath id={`${id}-bot`}>
            <path d={half(1)} />
          </clipPath>
          <g clipPath={`url(#${id}-top)`}>
            <path
              d={d}
              fill={fg}
              transform={`translate(${-ux * shift} ${-uy * shift})`}
            />
          </g>
          <g clipPath={`url(#${id}-bot)`}>
            <path
              d={d}
              fill={fill}
              transform={`translate(${ux * shift} ${uy * shift})`}
            />
          </g>
        </>
      );
    }
    case "stencil": {
      const gap = 40;
      return (
        <>
          <mask
            id={`${id}-stencil`}
            maskUnits="userSpaceOnUse"
            x={x0 - 50}
            y={y0 - 50}
            width={w + 100}
            height={h + 100}
          >
            <rect
              x={x0 - 50}
              y={y0 - 50}
              width={w + 100}
              height={h + 100}
              fill="#fff"
            />
            <rect
              x={cx - gap / 2}
              y={y0 - 50}
              width={gap}
              height={h + 100}
              fill="#000"
            />
          </mask>
          <path d={d} fill={fg} mask={`url(#${id}-stencil)`} />
        </>
      );
    }
    case "dots":
      return (
        <g>
          {dots.map(([x, y]) => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r={13} fill={fill} />
          ))}
        </g>
      );
    case "overflow":
      return (
        <path
          d={d}
          fill={fill}
          transform={`translate(${cx} ${cy}) scale(${1.8 + 0.3 * land}) translate(${-cx} ${-cy})`}
        />
      );
    case "counter":
      return (
        <>
          <path d={outerContour(d)} fill={fill} />
          <path d={d} fill={fg} />
        </>
      );
    case "shadow":
      return (
        <>
          <path d={d} fill={fill} transform="translate(40 36)" />
          <path d={d} fill={fg} />
        </>
      );
  }
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

export function DynamicLetter({
  text = "emocn",
  letterIndex,
  variants = DEFAULT_VARIANTS,
  final = "overflow",
  beat = 8,
  accent = "#3B5BFD",
  theme = "dark",
  speed = 1,
}: DynamicLetterProps) {
  const t = useCurrentFrame() * speed;
  const { width: W, height: H } = useVideoConfig();
  const c = THEMES[theme];
  const id = `dl${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;

  const set = useMemo(() => setText(text), [text]);
  const slot = useMemo(() => {
    if (letterIndex !== undefined) {
      return set.placed.findIndex((p) => p.index === letterIndex);
    }
    const o = set.placed.findIndex((p) => p.ch === "o");
    return o >= 0 ? o : Math.floor(set.placed.length / 2);
  }, [set, letterIndex]);

  const sequence = [...variants.filter((v) => v !== final), final];
  const cuts = cutFrames(sequence.length, beat);
  const step = cuts.findLastIndex((f) => t >= f);
  const current: DynamicLetterVariant | "plain" =
    step >= 0 ? sequence[step] : "plain";
  // Each treatment cuts in hard; only the last one eases into its size.
  const land = interpolate(t - (cuts[step] ?? 0), [0, 9], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.22, 1, 0.36, 1),
  });

  const k = Math.min((W * 0.7) / set.ink, (H * 0.34) / 760);
  const ox = W / 2 - (set.ink / 2) * k;
  const baseline = H / 2 + (760 / 2) * k;
  const active = set.placed[slot];
  const behind = current === "overflow" || current === "shadow";

  // The gradient leans a few degrees over the shot; it never animates on its own.
  const lean = 8 + Math.min(t, 120) * 0.12;
  const stops = c.stops.map((s) => (s === "ACCENT" ? accent : s));
  const g = active?.g;
  const gx = g ? (g[1] + g[2]) / 2 : 0;
  const gy = g ? (g[3] + g[4]) / 2 : 0;
  const reach = g ? (g[4] - g[3]) * (current === "overflow" ? 1.1 : 0.55) : 1;
  const rad = (lean * Math.PI) / 180;
  const drift = Math.min(t, 120) * 0.03;

  const treatment = active ? (
    <g transform={`translate(${active.x} 0)`}>
      <defs>
        <clipPath id={`${id}-clip`}>
          <path d={active.g[5]} />
        </clipPath>
        <linearGradient
          id={`${id}-fill`}
          gradientUnits="userSpaceOnUse"
          x1={gx + Math.sin(rad) * reach}
          y1={gy - Math.cos(rad) * reach}
          x2={gx - Math.sin(rad) * reach}
          y2={gy + Math.cos(rad) * reach}
        >
          <stop offset="0" stopColor={stops[0]} />
          <stop offset="0.32" stopColor={stops[1]} />
          <stop offset="0.7" stopColor={stops[2]} />
          <stop offset="1" stopColor={stops[3]} />
        </linearGradient>
      </defs>
      <Treatment
        variant={current}
        g={active.g}
        id={id}
        fg={c.fg}
        fill={`url(#${id}-fill)`}
        land={land}
      />
    </g>
  ) : null;

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(62% 46% at ${50 + drift}% 104%, ${c.glow[0]} 0%, transparent 72%), radial-gradient(34% 26% at ${50 - drift}% 102%, ${c.glow[1]} 0%, transparent 70%), radial-gradient(70% 50% at 50% -18%, ${c.glow[2]} 0%, transparent 70%), ${c.bg}`,
        overflow: "hidden",
      }}
    >
      <svg
        width={W}
        height={H}
        viewBox={`0 0 ${W} ${H}`}
        style={{ position: "absolute", inset: 0 }}
        aria-hidden
      >
        <g transform={`translate(${ox} ${baseline}) scale(${k})`}>
          {behind ? treatment : null}
          <path
            d={REMOCN_R_PATH}
            fill={c.fg}
            transform={`translate(0 -760) scale(${R_SCALE})`}
          />
          {set.placed.map((p, i) =>
            i === slot ? null : (
              <path
                key={`${p.index}-${p.ch}`}
                d={p.g[5]}
                fill={c.fg}
                stroke={c.bg}
                strokeWidth={current === "overflow" ? 36 : 0}
                paintOrder="stroke"
                strokeLinejoin="round"
                transform={`translate(${p.x} 0)`}
              />
            ),
          )}
          {behind ? null : treatment}
        </g>
      </svg>
      <Grain opacity={c.grain} />
    </AbsoluteFill>
  );
}
