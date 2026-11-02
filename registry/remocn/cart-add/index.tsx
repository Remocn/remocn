"use client";

import { loadFont as loadSans } from "@remotion/google-fonts/InstrumentSans";
import { loadFont as loadSerif } from "@remotion/google-fonts/InstrumentSerif";
import type React from "react";
import { useId } from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { GradientParams } from "@/lib/remocn/gsh/gradient-engine";
import { GshGround } from "@/lib/remocn/gsh/gsh-ground";
import type { GshPresetId } from "@/lib/remocn/gsh/presets";

const sans = loadSans("normal", { weights: ["400"], subsets: ["latin"] });
const serif = loadSerif("normal", { weights: ["400"], subsets: ["latin"] });

export interface CartColor {
  name: string;
  swatch: string;
}

export interface CartSize {
  label: string;
  price: number;
}

export interface CartAddProps {
  brand?: string;
  url?: string;
  product?: string;
  category?: string;
  description?: string;
  rating?: number;
  reviews?: string;
  colors?: CartColor[];
  sizes?: CartSize[];
  startColor?: number;
  pickColor?: number;
  startSize?: number;
  pickSize?: number;
  images?: string[];
  currency?: string;
  freeShippingAt?: number;
  theme?: "light" | "dark";
  accent?: string;
  speed?: number;
  ground?: GshPresetId;
  groundParams?: Partial<GradientParams>;
}

const DEFAULT_COLORS: CartColor[] = [
  { name: "Sage", swatch: "#8E9B82" },
  { name: "Clay", swatch: "#C07A5E" },
  { name: "Ink", swatch: "#2E3644" },
  { name: "Sand", swatch: "#D6C6AA" },
];
const DEFAULT_SIZES: CartSize[] = [
  { label: "18 oz", price: 36 },
  { label: "24 oz", price: 42 },
  { label: "32 oz", price: 48 },
];

const ENTER = Easing.bezier(0.32, 0.72, 0, 1);
const SOFT = Easing.bezier(0.22, 1, 0.36, 1);
const MOVE = Easing.bezier(0.65, 0, 0.35, 1);
const EXIT = Easing.bezier(0.55, 0, 1, 0.45);
const HEAVY = { mass: 1, damping: 26, stiffness: 120 };
const CARD = { mass: 0.8, damping: 18, stiffness: 160 };
const CHIP = { mass: 0.5, damping: 12, stiffness: 200 };
const MORPH = { damping: 200 };
const GLIDE = { mass: 0.9, damping: 24, stiffness: 140 };
const CL = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const B = {
  win: 0,
  cursor: 6,
  swatch: 34,
  toSize: 40,
  size: 60,
  toBtn: 66,
  add: 84,
  fly: 92,
  land: 114,
  drawer: 120,
  toCheckout: 142,
  checkout: 166,
};

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const tw = (f: number, a: number, b: number, e = ENTER) =>
  interpolate(f, [a, b], [0, 1], { ...CL, easing: e });

function rgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.replace(/./g, (c) => c + c) : h.slice(0, 6);
  const n = Number.parseInt(full, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function mix(a: string, b: string, t: number) {
  const x = rgb(a);
  const y = rgb(b);
  return `#${x
    .map((v, i) =>
      Math.round(lerp(v, y[i], t))
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")}`;
}
const money = (n: number, cur: string, cents = false) =>
  `${cur}${n.toLocaleString("en-US", {
    minimumFractionDigits: cents ? 2 : 0,
    maximumFractionDigits: cents ? 2 : 0,
  })}`;

const LIGHT = {
  dark: false,
  win: "#FFFFFF",
  text: "#1D1D1F",
  muted: "#6E6E73",
  faint: "#A1A1A6",
  line: "rgba(0,0,0,0.08)",
  ring: "rgba(0,0,0,0.12)",
  fill: "#F5F5F7",
  btn: "#1D1D1F",
  btnText: "#FFFFFF",
  shadow:
    "0 0 0 1px rgba(0,0,0,0.05), 0 2px 4px rgba(0,0,0,0.04), 0 32px 80px -24px rgba(60,30,10,0.3)",
  outline: "rgba(0,0,0,0.1)",
};
const DARK: typeof LIGHT = {
  dark: true,
  win: "#161617",
  text: "#F5F5F7",
  muted: "#A1A1A6",
  faint: "#6E6E73",
  line: "rgba(255,255,255,0.09)",
  ring: "rgba(255,255,255,0.14)",
  fill: "#1F1F21",
  btn: "#F5F5F7",
  btnText: "#161617",
  shadow:
    "0 0 0 1px rgba(255,255,255,0.08), inset 0 1px 0 rgba(255,255,255,0.06), 0 48px 120px -24px rgba(0,0,0,0.85)",
  outline: "rgba(255,255,255,0.1)",
};
type Pal = typeof LIGHT;

const ICONS = {
  bag: "M3.4 5.25h9.2l-.65 8.25H4.05zM5.75 5.25v-.75a2.25 2.25 0 0 1 4.5 0v.75",
  plus: "M8 3.5v9M3.5 8h9",
  minus: "M3.5 8h9",
  x: "M4.25 4.25l7.5 7.5M11.75 4.25l-7.5 7.5",
  lock: "M4.25 7.25h7.5v6h-7.5zM5.75 7.25V5.5a2.25 2.25 0 0 1 4.5 0v1.75",
  check: "M3.5 8.5l3 3 6-6.5",
  star: "M8 1.6l1.9 4 4.3.5-3.2 3 .9 4.3L8 11.3l-3.9 2.1.9-4.3-3.2-3 4.3-.5z",
} as const;

function Icon({
  name,
  color,
  size = 16,
}: {
  name: keyof typeof ICONS;
  color: string;
  size?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      style={{ display: "block", flexShrink: 0 }}
    >
      <path
        d={ICONS[name]}
        fill="none"
        stroke={color}
        strokeWidth={1.3}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Cursor({ x, y, press }: { x: number; y: number; press: number }) {
  return (
    <svg
      width={26}
      height={30}
      viewBox="0 0 20 24"
      style={{
        position: "absolute",
        left: x - 2,
        top: y - 2,
        transformOrigin: "2px 2px",
        transform: `scale(${1 - 0.04 * press})`,
        filter:
          "drop-shadow(0 1px 1px rgba(0,0,0,0.25)) drop-shadow(0 6px 10px rgba(0,0,0,0.2))",
        overflow: "visible",
        zIndex: 20,
      }}
    >
      <path
        d="M2 2 L2 19.5 L6.6 15.4 L9.8 22.4 L12.9 21 L9.8 14.2 L16 14.2 Z"
        fill="#FFFFFF"
        stroke="#1D1D1F"
        strokeWidth={1.1}
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Bottle({ swatch, brand }: { swatch: string; brand: string }) {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const cap = mix(swatch, "#1A1A1A", 0.38);
  return (
    <g>
      <defs>
        <linearGradient id={`${id}b`} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor={mix(swatch, "#000000", 0.3)} />
          <stop offset="0.14" stopColor={swatch} />
          <stop offset="0.3" stopColor={mix(swatch, "#FFFFFF", 0.22)} />
          <stop offset="0.48" stopColor={swatch} />
          <stop offset="0.82" stopColor={mix(swatch, "#000000", 0.14)} />
          <stop offset="1" stopColor={mix(swatch, "#000000", 0.36)} />
        </linearGradient>
        <linearGradient id={`${id}v`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity={0.12} />
          <stop offset="0.12" stopColor="#FFFFFF" stopOpacity={0} />
          <stop offset="0.85" stopColor="#000000" stopOpacity={0} />
          <stop offset="1" stopColor="#000000" stopOpacity={0.14} />
        </linearGradient>
        <linearGradient id={`${id}c`} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor={mix(cap, "#000000", 0.2)} />
          <stop offset="0.28" stopColor={mix(cap, "#FFFFFF", 0.14)} />
          <stop offset="0.62" stopColor={cap} />
          <stop offset="1" stopColor={mix(cap, "#000000", 0.28)} />
        </linearGradient>
        <linearGradient id={`${id}s`} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#8E9399" />
          <stop offset="0.3" stopColor="#F2F3F4" />
          <stop offset="0.65" stopColor="#C4C8CC" />
          <stop offset="1" stopColor="#7E838A" />
        </linearGradient>
        <filter id={`${id}f`} x="-50%" y="-200%" width="200%" height="500%">
          <feGaussianBlur stdDeviation="7" />
        </filter>
        <filter id={`${id}h`}>
          <feGaussianBlur stdDeviation="2.5" />
        </filter>
      </defs>
      <ellipse
        cx={276}
        cy={434}
        rx={96}
        ry={11}
        fill="rgba(0,0,0,0.22)"
        filter={`url(#${id}f)`}
      />
      <path
        d="M256 76 C256 40 296 40 296 76"
        fill="none"
        stroke={cap}
        strokeWidth={9}
        strokeLinecap="round"
      />
      <rect
        x={232}
        y={72}
        width={88}
        height={50}
        rx={9}
        fill={`url(#${id}c)`}
      />
      <rect x={228} y={120} width={96} height={12} fill={`url(#${id}s)`} />
      <path
        d="M228 132 L324 132 C332 142 346 150 346 174 L346 412 Q346 432 326 432 L226 432 Q206 432 206 412 L206 174 C206 150 220 142 228 132 Z"
        fill={`url(#${id}b)`}
      />
      <path
        d="M228 132 L324 132 C332 142 346 150 346 174 L346 412 Q346 432 326 432 L226 432 Q206 432 206 412 L206 174 C206 150 220 142 228 132 Z"
        fill={`url(#${id}v)`}
      />
      <rect
        x={232}
        y={176}
        width={9}
        height={232}
        rx={4.5}
        fill="#FFFFFF"
        opacity={0.2}
        filter={`url(#${id}h)`}
      />
      <text
        x={276}
        y={226}
        textAnchor="middle"
        fontSize={14}
        fontWeight={400}
        fill="#FFFFFF"
        opacity={0.55}
        style={{ fontFamily: serif.fontFamily }}
      >
        {brand}
      </text>
    </g>
  );
}

function Photo({
  swatch,
  pal,
  src,
  brand,
}: {
  swatch: string;
  pal: Pal;
  src?: string;
  brand: string;
}) {
  const gid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  if (src) {
    return (
      <Img
        src={src}
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
    );
  }
  const backdrop = mix(
    swatch,
    pal.dark ? "#1C1C1E" : "#F3F1ED",
    pal.dark ? 0.84 : 0.82,
  );
  const floor = mix(
    swatch,
    pal.dark ? "#141416" : "#E6E2DB",
    pal.dark ? 0.86 : 0.8,
  );
  return (
    <svg
      viewBox="0 0 552 480"
      preserveAspectRatio="xMidYMid slice"
      style={{ width: "100%", height: "100%", display: "block" }}
    >
      <defs>
        <linearGradient id={`${gid}g`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={backdrop} />
          <stop offset="0.68" stopColor={backdrop} />
          <stop offset="0.8" stopColor={floor} />
          <stop offset="1" stopColor={floor} />
        </linearGradient>
        <radialGradient id={`${gid}r`} cx="0.5" cy="0.38" r="0.55">
          <stop
            offset="0"
            stopColor="#FFFFFF"
            stopOpacity={pal.dark ? 0.07 : 0.45}
          />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
        </radialGradient>
      </defs>
      <rect width={552} height={480} fill={`url(#${gid}g)`} />
      <rect width={552} height={480} fill={`url(#${gid}r)`} />
      <Bottle swatch={swatch} brand={brand} />
    </svg>
  );
}

function layoutFor(portrait: boolean) {
  if (portrait) {
    const win = { x: 32, y: 56, w: 656, h: 1168 };
    return {
      stageW: 720,
      stageH: 1280,
      win,
      navH: 80,
      photo: { x: 24, y: 80, w: 608, h: 500 },
      box: { x: 40, y: 612, w: 576 },
      nameSize: 54,
      drawer: { x: 24, y: 1280 - 24 - 500, w: 672, h: 500 },
      drawerFrom: { x: 0, y: 620 },
      winShift: { x: 0, y: -60, s: 0.94 },
    };
  }
  const win = { x: 64, y: 44, w: 1152, h: 632 };
  return {
    stageW: 1280,
    stageH: 720,
    win,
    navH: 72,
    photo: { x: 24, y: 72, w: 540, h: 536 },
    box: { x: 612, y: 92, w: 500 },
    nameSize: 56,
    drawer: { x: 820, y: 100, w: 420, h: 520 },
    drawerFrom: { x: 500, y: 0 },
    winShift: { x: -120, y: 0, s: 0.96 },
  };
}

export function CartAdd({
  brand = "fernway",
  product = "Summit Bottle",
  category = "Drinkware",
  description = "Double-wall steel keeps drinks cold for 24 hours. Leak-proof cap, powder-coat finish that never sweats.",
  rating = 4.8,
  reviews = "2,184",
  colors = DEFAULT_COLORS,
  sizes = DEFAULT_SIZES,
  startColor = 0,
  pickColor = 1,
  startSize = 1,
  pickSize = 2,
  images,
  currency = "$",
  freeShippingAt = 75,
  theme = "light",
  accent = "#3B5BFD",
  speed = 1,
  ground,
  groundParams,
}: CartAddProps) {
  const frame = useCurrentFrame() * speed;
  const { width: W, height: H, fps } = useVideoConfig();
  const portrait = H > W;
  const L = layoutFor(portrait);
  const u = Math.min(W / L.stageW, H / L.stageH);
  const pal = theme === "dark" ? DARK : LIGHT;
  const sp = (at: number, config: typeof CARD | typeof MORPH = CARD) =>
    spring({ frame: frame - at, fps, config });

  const c0 = colors[startColor] ?? colors[0];
  const c1 = colors[pickColor] ?? c0;
  const s0 = sizes[startSize] ?? sizes[0];
  const s1 = sizes[pickSize] ?? s0;
  const img0 = images?.[colors.indexOf(c0)];
  const img1 = images?.[colors.indexOf(c1)];

  const box = L.box;
  const descLines = 2;
  const y = {
    cat: box.y,
    name: box.y + 30,
    price: box.y + 30 + L.nameSize + 16,
    desc: box.y + 30 + L.nameSize + 64,
  };
  const colorY = y.desc + descLines * 26 + 30;
  const swY = colorY + 30;
  const sizeY = swY + 66;
  const chipY = sizeY + 30;
  const btnY = chipY + 84;
  const chipGap = 12;
  const chipW = (box.w - chipGap * 2) / 3;

  const winAbs = (p: { x: number; y: number }) => ({
    x: L.win.x + p.x,
    y: L.win.y + p.y,
  });
  const swatchPt = (i: number) =>
    winAbs({ x: box.x + 20 + i * 56, y: swY + 22 });
  const chipPt = (j: number) =>
    winAbs({ x: box.x + j * (chipW + chipGap) + chipW * 0.62, y: chipY + 36 });
  const btnPt = winAbs({ x: box.x + box.w * 0.6, y: btnY + 36 });
  const bagPt = winAbs({ x: L.win.w - 52, y: L.navH / 2 });

  const drawerIn = sp(B.drawer, HEAVY);
  const shift = sp(B.drawer, MORPH);
  const winX = L.winShift.x * shift;
  const winY = L.winShift.y * shift;
  const winS = lerp(1, L.winShift.s, shift);
  const D = L.drawer;
  const dX = D.x + L.drawerFrom.x * (1 - drawerIn);
  const dY = D.y + L.drawerFrom.y * (1 - drawerIn);
  const checkoutPt = { x: D.x + D.w * 0.62, y: D.y + D.h - 28 - 32 + 6 };

  const arc = (
    a: { x: number; y: number },
    b: { x: number; y: number },
    p: number,
    bend: number,
  ) => {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const d = Math.hypot(dx, dy) || 1;
    const k = Math.sin(clamp01(p) * Math.PI) * Math.min(bend, d * 0.16);
    return {
      x: lerp(a.x, b.x, p) - (dy / d) * k,
      y: lerp(a.y, b.y, p) + (dx / d) * k,
    };
  };
  const winToScreen = (p: { x: number; y: number }) => ({
    x: L.stageW / 2 + (p.x - L.stageW / 2) * winS + winX,
    y: L.stageH / 2 + (p.y - L.stageH / 2) * winS + winY,
  });
  const segs: { at: number; to: { x: number; y: number } }[] = [
    { at: B.cursor, to: swatchPt(pickColor) },
    { at: B.toSize, to: chipPt(pickSize) },
    { at: B.toBtn, to: btnPt },
    { at: B.toCheckout, to: checkoutPt },
  ];
  let cur = { x: L.stageW * 0.82, y: L.stageH * 1.04 };
  for (const sg of segs) {
    if (frame < sg.at) break;
    const to =
      sg.at === B.toBtn && frame > B.drawer ? winToScreen(btnPt) : sg.to;
    cur = arc(
      cur,
      to,
      spring({ frame: frame - sg.at, fps, config: GLIDE }),
      60,
    );
  }
  const click = (at: number) =>
    spring({ frame: frame - at + 3, fps, config: CHIP }) -
    spring({ frame: frame - at, fps, config: CHIP });
  const press = Math.max(0, click(B.swatch), click(B.size), click(B.add));
  const cursorO = tw(frame, B.cursor, B.cursor + 8);

  const winIn = sp(B.win, HEAVY);
  const winO = tw(frame, B.win, B.win + 12);
  const colorP = tw(frame, B.swatch + 1, B.swatch + 14, MOVE);
  const ring = sp(B.swatch + 1, MORPH);
  const sizeSel = sp(B.size + 1, MORPH);
  const priceP = tw(frame, B.size + 2, B.size + 12, SOFT);
  const btnPress = click(B.add);
  const loadP = tw(frame, B.add + 2, B.add + 8);
  const doneP = tw(frame, B.land - 6, B.land + 2, SOFT);
  const checkDraw = tw(frame, B.land - 4, B.land + 6, SOFT);

  const flyP = sp(B.fly, { mass: 0.9, damping: 22, stiffness: 120 });
  const flyO =
    tw(frame, B.fly, B.fly + 4) * (1 - tw(frame, B.land - 3, B.land + 1, EXIT));
  const fromPt = winAbs({
    x: L.photo.x + L.photo.w / 2,
    y: L.photo.y + L.photo.h / 2,
  });
  const ctrl = {
    x: lerp(fromPt.x, bagPt.x, 0.6),
    y: Math.min(fromPt.y, bagPt.y) - 140,
  };
  const q = (a: number, c: number, b: number, t: number) =>
    (1 - t) * (1 - t) * a + 2 * (1 - t) * t * c + t * t * b;
  const fly = {
    x: q(fromPt.x, ctrl.x, bagPt.x, clamp01(flyP)),
    y: q(fromPt.y, ctrl.y, bagPt.y, clamp01(flyP)),
    s: lerp(1, 0.16, clamp01(flyP)),
  };
  const bump = 1 + 0.16 * Math.max(0, click(B.land + 2));
  const badge = sp(B.land, CHIP);

  const item = (k: number) =>
    tw(frame, B.drawer + 6 + k * 3, B.drawer + 18 + k * 3);
  const shipFill = tw(frame, B.drawer + 16, B.drawer + 40, MOVE);
  const checkoutHover = tw(frame, B.checkout - 6, B.checkout, SOFT);
  const remaining = Math.max(0, freeShippingAt - s1.price);
  const shipRatio = Math.min(1, s1.price / freeShippingAt);

  const resolvedGround: GshPresetId =
    ground ?? (pal.dark ? "ember" : "paper-crease");
  const resolvedParams =
    groundParams ??
    (pal.dark
      ? { grain: 0.06 }
      : {
          kind: "mist" as const,
          colors: ["#e9b79c", "#f4dfd0", "#f7f2eb", "#cf8d6c"],
          background: "#f4efe8",
        });

  const swap = (
    a: React.ReactNode,
    b: React.ReactNode,
    p: number,
    lift = 10,
  ) => (
    <span style={{ position: "relative", display: "inline-grid" }}>
      <span
        style={{
          gridArea: "1/1",
          opacity: 1 - clamp01(p * 2),
          transform: `translateY(${-p * lift}px)`,
        }}
      >
        {a}
      </span>
      <span
        style={{
          gridArea: "1/1",
          opacity: clamp01(p * 2 - 1),
          transform: `translateY(${(1 - p) * lift}px)`,
        }}
      >
        {b}
      </span>
    </span>
  );

  const label16: React.CSSProperties = { fontSize: 16, color: pal.muted };

  return (
    <AbsoluteFill style={{ fontFamily: sans.fontFamily, overflow: "hidden" }}>
      <GshGround
        preset={resolvedGround}
        params={resolvedParams}
        timeOffset={4}
        timeScale={0.4}
      />
      <div
        style={{
          position: "absolute",
          left: (W - L.stageW * u) / 2,
          top: (H - L.stageH * u) / 2,
          width: L.stageW,
          height: L.stageH,
          transformOrigin: "0 0",
          transform: `scale(${u})`,
          WebkitFontSmoothing: "antialiased",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            transformOrigin: "50% 50%",
            transform: `translate(${winX}px, ${winY}px) scale(${winS * (1 + 0.015 * (frame / 200))})`,
          }}
        >
          <div
            style={{
              position: "absolute",
              left: L.win.x,
              top: L.win.y,
              width: L.win.w,
              height: L.win.h,
              borderRadius: 28,
              overflow: "hidden",
              background: pal.win,
              color: pal.text,
              boxShadow: pal.shadow,
              opacity: winO,
              transform: `translateY(${(1 - winIn) * 56}px) scale(${0.96 + 0.04 * winIn})`,
            }}
          >
            <div
              style={{
                position: "absolute",
                left: 36,
                right: 36,
                top: 0,
                height: L.navH,
                display: "flex",
                alignItems: "center",
              }}
            >
              <span
                style={{
                  fontFamily: serif.fontFamily,
                  fontSize: 30,
                  letterSpacing: "-0.01em",
                }}
              >
                {brand}
              </span>
              <div style={{ flex: 1 }} />
              <div
                style={{ position: "relative", transform: `scale(${bump})` }}
              >
                <Icon name="bag" color={pal.text} size={26} />
                {frame >= B.land ? (
                  <div
                    style={{
                      position: "absolute",
                      right: -10,
                      top: -8,
                      minWidth: 20,
                      height: 20,
                      borderRadius: 10,
                      background: accent,
                      color: "#fff",
                      fontSize: 13,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontVariantNumeric: "tabular-nums",
                      boxShadow: `0 0 0 2px ${pal.win}`,
                      transform: `scale(${Math.max(0, badge)})`,
                    }}
                  >
                    1
                  </div>
                ) : null}
              </div>
            </div>

            <div
              style={{
                position: "absolute",
                left: L.photo.x,
                top: L.photo.y,
                width: L.photo.w,
                height: L.photo.h,
                borderRadius: 18,
                overflow: "hidden",
                outline: `1px solid ${pal.outline}`,
                outlineOffset: -1,
              }}
            >
              <div style={{ position: "absolute", inset: 0 }}>
                <Photo swatch={c0.swatch} pal={pal} src={img0} brand={brand} />
              </div>
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  opacity: colorP,
                  transform: `scale(${1.03 - 0.03 * colorP})`,
                }}
              >
                <Photo swatch={c1.swatch} pal={pal} src={img1} brand={brand} />
              </div>
            </div>

            <div
              style={{
                position: "absolute",
                left: box.x,
                top: y.cat,
                width: box.w,
              }}
            >
              <div style={label16}>{category}</div>
              <div
                style={{
                  fontFamily: serif.fontFamily,
                  fontSize: L.nameSize,
                  lineHeight: 1,
                  letterSpacing: "-0.015em",
                  marginTop: 12,
                }}
              >
                {product}
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: 14,
                  marginTop: 18,
                }}
              >
                <span
                  style={{ fontSize: 24, fontVariantNumeric: "tabular-nums" }}
                >
                  {swap(
                    money(s0.price, currency),
                    money(s1.price, currency),
                    priceP,
                  )}
                </span>
                <span
                  style={{
                    ...label16,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  <svg width={14} height={14} viewBox="0 0 16 16">
                    <path d={ICONS.star} fill={pal.text} />
                  </svg>
                  {rating.toFixed(1)} · {reviews} reviews
                </span>
              </div>
              <div
                style={{
                  fontSize: 17,
                  lineHeight: "26px",
                  color: pal.muted,
                  marginTop: 16,
                  textWrap: "pretty",
                  height: descLines * 26,
                  overflow: "hidden",
                }}
              >
                {description}
              </div>
            </div>

            <div
              style={{
                position: "absolute",
                left: box.x,
                top: colorY,
                fontSize: 16,
                color: pal.text,
              }}
            >
              Color{" "}
              <span style={{ color: pal.muted }}>
                · {swap(c0.name, c1.name, colorP, 8)}
              </span>
            </div>
            {colors.map((c, i) => {
              const sel =
                i === startColor ? 1 - ring : i === pickColor ? ring : 0;
              return (
                <div
                  key={c.name}
                  style={{
                    position: "absolute",
                    left: box.x + i * 56,
                    top: swY,
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    boxShadow: `inset 0 0 0 ${1.5 * Math.max(0, sel)}px ${pal.text}`,
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      inset: 5,
                      borderRadius: 17,
                      background: c.swatch,
                      boxShadow: `inset 0 0 0 1px ${pal.outline}`,
                    }}
                  />
                </div>
              );
            })}

            <div
              style={{
                position: "absolute",
                left: box.x,
                top: sizeY,
                width: box.w,
                display: "flex",
                fontSize: 16,
                color: pal.text,
              }}
            >
              Size
              <span
                style={{
                  marginLeft: "auto",
                  color: pal.muted,
                  textDecoration: "underline",
                  textUnderlineOffset: 4,
                  textDecorationColor: pal.ring,
                }}
              >
                Size guide
              </span>
            </div>
            {sizes.slice(0, 3).map((sz, j) => {
              const sel =
                j === startSize ? 1 - sizeSel : j === pickSize ? sizeSel : 0;
              return (
                <div
                  key={sz.label}
                  style={{
                    position: "absolute",
                    left: box.x + j * (chipW + chipGap),
                    top: chipY,
                    width: chipW,
                    height: 64,
                    borderRadius: 14,
                    boxShadow: `inset 0 0 0 1px ${pal.ring}, inset 0 0 0 ${1.5 * Math.max(0, sel)}px ${pal.text}`,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 2,
                  }}
                >
                  <span style={{ fontSize: 18 }}>{sz.label}</span>
                  <span
                    style={{
                      fontSize: 16,
                      color: pal.faint,
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {money(sz.price, currency)}
                  </span>
                </div>
              );
            })}

            <div
              style={{
                position: "absolute",
                left: box.x,
                top: btnY,
                width: box.w,
                height: 64,
                borderRadius: 32,
                background: pal.btn,
                color: pal.btnText,
                transform: `scale(${1 - 0.04 * Math.max(0, btnPress)})`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 18,
                boxShadow: pal.dark
                  ? "none"
                  : "0 1px 2px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.12)",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  opacity: 1 - loadP,
                  transform: `translateY(${-loadP * 8}px)`,
                  display: "flex",
                  gap: 8,
                }}
              >
                Add to bag
                <span style={{ opacity: 0.5 }}>·</span>
                <span style={{ fontVariantNumeric: "tabular-nums" }}>
                  {swap(
                    money(s0.price, currency),
                    money(s1.price, currency),
                    priceP,
                    8,
                  )}
                </span>
              </div>
              <svg
                width={20}
                height={20}
                viewBox="0 0 18 18"
                style={{
                  position: "absolute",
                  opacity: loadP * (1 - doneP),
                  transform: `rotate(${frame * 20}deg)`,
                }}
              >
                <circle
                  cx={9}
                  cy={9}
                  r={7}
                  fill="none"
                  stroke={pal.btnText}
                  strokeOpacity={0.25}
                  strokeWidth={1.6}
                />
                <path
                  d="M9 2a7 7 0 0 1 7 7"
                  fill="none"
                  stroke={pal.btnText}
                  strokeWidth={1.6}
                  strokeLinecap="round"
                />
              </svg>
              <div
                style={{
                  position: "absolute",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  opacity: doneP,
                  transform: `translateY(${(1 - doneP) * 8}px)`,
                }}
              >
                <svg width={18} height={18} viewBox="0 0 16 16">
                  <path
                    d={ICONS.check}
                    fill="none"
                    stroke={pal.btnText}
                    strokeWidth={1.6}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    pathLength={1}
                    strokeDasharray={1}
                    strokeDashoffset={1 - checkDraw}
                  />
                </svg>
                Added to bag
              </div>
            </div>

            <div
              style={{
                position: "absolute",
                inset: 0,
                background: pal.dark ? "#000" : "#2a1a10",
                opacity: (pal.dark ? 0.3 : 0.1) * shift,
              }}
            />
          </div>

          {frame >= B.fly && frame < B.land + 2 ? (
            <div
              style={{
                position: "absolute",
                left: fly.x - 90,
                top: fly.y - 90,
                width: 180,
                height: 180,
                borderRadius: 20,
                overflow: "hidden",
                opacity: flyO,
                transform: `scale(${fly.s})`,
                boxShadow:
                  "0 18px 40px -10px rgba(0,0,0,0.4), 0 0 0 1px rgba(0,0,0,0.06)",
              }}
            >
              <Photo swatch={c1.swatch} pal={pal} src={img1} brand={brand} />
            </div>
          ) : null}
        </div>

        {frame >= B.drawer ? (
          <div
            style={{
              position: "absolute",
              left: dX,
              top: dY,
              width: D.w,
              height: D.h,
              borderRadius: 28,
              background: pal.win,
              color: pal.text,
              boxShadow: pal.shadow,
              padding: 28,
              boxSizing: "border-box",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div style={{ display: "flex", alignItems: "center" }}>
              <span
                style={{
                  fontFamily: serif.fontFamily,
                  fontSize: 34,
                  letterSpacing: "-0.01em",
                  lineHeight: 1,
                }}
              >
                Your bag
              </span>
              <span style={{ ...label16, marginLeft: 12 }}>1 item</span>
              <div style={{ flex: 1 }} />
              <Icon name="x" color={pal.muted} size={22} />
            </div>

            <div
              style={{
                marginTop: 26,
                opacity: item(0),
                transform: `translateY(${(1 - item(0)) * 12}px)`,
              }}
            >
              <div style={{ ...label16, fontVariantNumeric: "tabular-nums" }}>
                {remaining > 0 ? (
                  <>
                    <span style={{ color: pal.text }}>
                      {money(remaining, currency, true)}
                    </span>{" "}
                    away from free shipping
                  </>
                ) : (
                  "Free shipping unlocked"
                )}
              </div>
              <div
                style={{
                  height: 6,
                  borderRadius: 3,
                  background: pal.fill,
                  marginTop: 12,
                  overflow: "hidden",
                  boxShadow: `inset 0 0 0 1px ${pal.line}`,
                }}
              >
                <div
                  style={{
                    height: 6,
                    borderRadius: 3,
                    background: accent,
                    transformOrigin: "0 50%",
                    transform: `scaleX(${shipFill * shipRatio})`,
                  }}
                />
              </div>
            </div>

            <div
              style={{
                display: "flex",
                gap: 18,
                marginTop: 28,
                paddingTop: 24,
                borderTop: `1px solid ${pal.line}`,
                opacity: item(1),
                transform: `translateY(${(1 - item(1)) * 12}px)`,
              }}
            >
              <div
                style={{
                  width: 100,
                  height: 116,
                  borderRadius: 14,
                  overflow: "hidden",
                  flexShrink: 0,
                  outline: `1px solid ${pal.outline}`,
                  outlineOffset: -1,
                }}
              >
                <Photo swatch={c1.swatch} pal={pal} src={img1} brand={brand} />
              </div>
              <div
                style={{ flex: 1, display: "flex", flexDirection: "column" }}
              >
                <div style={{ display: "flex", fontSize: 18 }}>
                  <span>{product}</span>
                  <span
                    style={{
                      marginLeft: "auto",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {money(s1.price, currency, true)}
                  </span>
                </div>
                <div style={{ ...label16, marginTop: 6 }}>
                  {c1.name} · {s1.label}
                </div>
                <div
                  style={{
                    marginTop: "auto",
                    alignSelf: "flex-start",
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                    height: 36,
                    padding: "0 12px",
                    borderRadius: 18,
                    boxShadow: `inset 0 0 0 1px ${pal.ring}`,
                    fontSize: 16,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  <Icon name="minus" color={pal.faint} size={16} />1
                  <Icon name="plus" color={pal.text} size={16} />
                </div>
              </div>
            </div>

            <div
              style={{
                marginTop: "auto",
                opacity: item(2),
                transform: `translateY(${(1 - item(2)) * 12}px)`,
              }}
            >
              <div style={{ display: "flex", fontSize: 18 }}>
                <span>Subtotal</span>
                <span
                  style={{
                    marginLeft: "auto",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {money(s1.price, currency, true)}
                </span>
              </div>
              <div style={{ ...label16, marginTop: 6 }}>
                Taxes calculated at checkout
              </div>
              <div
                style={{
                  marginTop: 20,
                  height: 64,
                  borderRadius: 32,
                  background: pal.btn,
                  color: pal.btnText,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 10,
                  fontSize: 18,
                  filter: `brightness(${1 + (pal.dark ? -0.08 : 0.3) * checkoutHover})`,
                }}
              >
                <Icon name="lock" color={pal.btnText} size={18} />
                Checkout
              </div>
            </div>
          </div>
        ) : null}

        <div style={{ opacity: cursorO }}>
          <Cursor x={cur.x} y={cur.y} press={press} />
        </div>
      </div>
    </AbsoluteFill>
  );
}
