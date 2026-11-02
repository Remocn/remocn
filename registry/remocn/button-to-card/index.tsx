"use client";

import { loadFont as loadMono } from "@remotion/google-fonts/GeistMono";
import { loadFont as loadHanken } from "@remotion/google-fonts/HankenGrotesk";
import type React from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { GradientParams } from "@/lib/remocn/gsh/gradient-engine";
import { GshGround } from "@/lib/remocn/gsh/gsh-ground";
import type { GshPresetId } from "@/lib/remocn/gsh/presets";

const hanken = loadHanken("normal", {
  weights: ["300", "400"],
  subsets: ["latin"],
});
const mono = loadMono("normal", { weights: ["400"], subsets: ["latin"] });

const ENTER = Easing.bezier(0.32, 0.72, 0, 1);
const EXIT = Easing.bezier(0.55, 0, 1, 0.45);
const MOVE = Easing.bezier(0.65, 0, 0.35, 1);
const CAM = Easing.bezier(0.87, 0, 0.13, 1);
const HEAVY = { mass: 1, damping: 26, stiffness: 120 };
const CARD = { mass: 0.8, damping: 18, stiffness: 160 };
const CHIP = { mass: 0.5, damping: 12, stiffness: 200 };
const MORPH = { damping: 200 };

const B = {
  pill: -8,
  press: 18,
  morph: 22,
  fields: 24,
  title: 36,
  carry: 50,
  price: 54,
  drop: 78,
  status: 88,
  save: 96,
  shrink: 102,
  pops: [106, 110, 114],
  header: 108,
  live: 120,
  end: 162,
};

const ramp = (f: number, start: number, dur: number, easing = ENTER) =>
  interpolate(f, [start, start + dur], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing,
  });

const mix = (a: number, b: number, t: number) => a + (b - a) * t;

const dip = (f: number, at: number, depth: number) =>
  1 - depth * ramp(f, at, 3, MOVE) + depth * ramp(f, at + 3, 9, ENTER);

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
  r: number;
}

const lerpRect = (a: Rect, b: Rect, t: number): Rect => ({
  x: mix(a.x, b.x, t),
  y: mix(a.y, b.y, t),
  w: mix(a.w, b.w, t),
  h: mix(a.h, b.h, t),
  r: mix(a.r, b.r, t),
});

const line = (color: string, w = 1.5) => ({
  fill: "none",
  stroke: color,
  strokeWidth: w,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
});

function DirBlur({ id, x, y }: { id: string; x: number; y: number }) {
  return (
    <svg width={0} height={0} style={{ position: "absolute" }} aria-hidden>
      <filter id={id} x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation={`${x} ${y}`} />
      </filter>
    </svg>
  );
}

function Cursor({ size }: { size: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      style={{ display: "block", overflow: "visible" }}
      aria-hidden
    >
      <path
        d="M5 3.5 18.6 11l-6 1.7-3 5.9L5 3.5Z"
        fill="#141110"
        stroke="#ffffff"
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
    </svg>
  );
}

export interface ButtonToCardProps {
  theme?: "dark" | "light";
  accent?: string;
  buttonLabel?: string;
  name?: string;
  price?: string;
  images?: string[];
  others?: { name: string; price: string }[];
  storeName?: string;
  ground?: GshPresetId;
  groundParams?: Partial<GradientParams>;
}

export function ButtonToCard({
  theme = "dark",
  accent = "#f2552c",
  buttonLabel = "Add an item",
  name = "Ceramic pitcher",
  price = "$48.00",
  images = [
    staticFile("templates/brand-guidelines/ceramics.jpg"),
    staticFile("templates/brand-guidelines/chair.jpg"),
    staticFile("templates/product-showcase/sculpture.jpg"),
    staticFile("templates/brand-guidelines/materials.jpg"),
  ],
  others = [
    { name: "Oak stool", price: "$120.00" },
    { name: "Arch sculpture", price: "$86.00" },
    { name: "Material kit", price: "$32.00" },
  ],
  storeName = "Studio Goods",
  ground,
  groundParams,
}: ButtonToCardProps) {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const dark = theme === "dark";
  const portrait = height > width * 1.2;
  const stageW = portrait ? 720 : 1280;
  const stageH = portrait ? 1280 : 720;
  const k = width / stageW;

  const ink = dark ? "#f7f0ea" : "#1c1612";
  const muted = dark ? "rgba(247,240,234,0.52)" : "rgba(28,22,18,0.5)";
  const faint = dark ? "rgba(247,240,234,0.3)" : "rgba(28,22,18,0.3)";
  const hair = dark ? "rgba(255,236,220,0.1)" : "rgba(70,40,20,0.1)";
  const field = dark ? "rgba(255,236,220,0.045)" : "#fbf8f5";
  const surface = dark
    ? "linear-gradient(180deg, rgba(40,31,27,0.9) 0%, rgba(22,17,15,0.94) 100%)"
    : "linear-gradient(180deg, #ffffff 0%, #fffcf9 100%)";
  const slotFill = dark ? "rgba(255,236,220,0.04)" : "#f8f2ec";
  const shadow = dark
    ? "inset 0 1px 0 rgba(255,240,225,0.07), 0 1px 2px rgba(0,0,0,0.4), 0 14px 32px rgba(0,0,0,0.35), 0 50px 110px rgba(20,6,0,0.55)"
    : "inset 0 1px 0 #ffffff, 0 1px 2px rgba(120,60,20,0.08), 0 12px 28px rgba(150,80,30,0.1), 0 44px 100px rgba(150,80,30,0.16)";
  const btnInk = dark ? "#1a1411" : "#ffffff";

  const all = [{ name, price }, ...others].slice(0, 4);
  const count = all.length;
  const cols = portrait ? 2 : count;
  const tileW = portrait ? 296 : 252;
  const tileH = portrait ? 372 : 340;
  const gap = portrait ? 20 : 22;
  const imgInset = 12;
  const tileImg = tileW - imgInset * 2;
  const rows = Math.ceil(count / cols);
  const gridW = cols * tileW + (cols - 1) * gap;
  const gridH = rows * tileH + (rows - 1) * gap;
  const headH = 64;
  const groupH = headH + gridH;
  const gridTop = -groupH / 2 + headH + (portrait ? 0 : 14);
  const tileRect = (i: number): Rect => ({
    x: -gridW / 2 + (i % cols) * (tileW + gap),
    y: gridTop + Math.floor(i / cols) * (tileH + gap),
    w: tileW,
    h: tileH,
    r: 24,
  });

  const cardW = portrait ? 620 : 940;
  const cardH = portrait ? 980 : 560;
  const cardRect: Rect = {
    x: -cardW / 2,
    y: -cardH / 2,
    w: cardW,
    h: cardH,
    r: 30,
  };
  const pillRect: Rect = { x: -132, y: -32, w: 264, h: 64, r: 32 };
  const mediaCard: Rect = portrait
    ? { x: 14, y: 14, w: cardW - 28, h: 400, r: 16 }
    : { x: 14, y: 14, w: 440, h: cardH - 28, r: 16 };
  const mediaTile: Rect = {
    x: imgInset,
    y: imgInset,
    w: tileImg,
    h: tileImg,
    r: 12,
  };
  const col = portrait
    ? { x: 36, y: 444, w: cardW - 72 }
    : { x: 494, y: 40, w: cardW - 494 - 40 };

  const pillIn = spring({ frame: frame - B.pill, fps, config: CARD });
  const morph = spring({
    frame: frame - B.morph,
    fps,
    config: MORPH,
    durationInFrames: 22,
  });
  const shrink = spring({
    frame: frame - B.shrink,
    fps,
    config: HEAVY,
    durationInFrames: 26,
  });
  const shrinkPrev = spring({
    frame: frame - 1 - B.shrink,
    fps,
    config: HEAVY,
    durationInFrames: 26,
  });
  const press = dip(frame, B.press, 0.07);
  let box = lerpRect(pillRect, cardRect, morph);
  box = lerpRect(box, tileRect(0), shrink);
  const t0 = tileRect(0);
  const shrinkV = Math.abs(shrink - shrinkPrev);
  const shrinkBlurX = Math.min(6, shrinkV * Math.abs(cardRect.x - t0.x) * 0.2);
  const shrinkBlurY = Math.min(6, shrinkV * Math.abs(cardRect.y - t0.y) * 0.2);

  const pillLabel = 1 - ramp(frame, B.morph, 6, EXIT);
  const fieldIn = (i: number) => ramp(frame, B.fields + i * 3, 12);
  const cardContent = 1 - ramp(frame, B.shrink, 8, EXIT);
  const tileContent = ramp(frame, B.shrink + 12, 12);
  const media = lerpRect(mediaCard, mediaTile, shrink);

  const typedName = name.slice(0, Math.max(0, frame - B.title));
  const typedPrice = price.slice(
    0,
    Math.max(0, Math.floor((frame - B.price) / 1.5)),
  );
  const nameCaret = frame >= B.title - 4 && frame < B.price;
  const priceCaret = frame >= B.price && frame < B.status;
  const caretBlink = Math.floor(frame / 8) % 2 === 0 ? 1 : 0.2;
  const statusOn = spring({ frame: frame - B.status, fps, config: CHIP });

  const mediaCx = cardRect.x + mediaCard.x + mediaCard.w / 2;
  const mediaCy = cardRect.y + mediaCard.y + mediaCard.h / 2;
  const startPt = portrait ? { x: 300, y: 720 } : { x: 720, y: 360 };
  const carry = spring({
    frame: frame - B.carry,
    fps,
    config: { mass: 0.9, damping: 20, stiffness: 90 },
  });
  const carryPrev = spring({
    frame: frame - 1 - B.carry,
    fps,
    config: { mass: 0.9, damping: 20, stiffness: 90 },
  });
  const hover = { x: mediaCx + 40, y: mediaCy - 20 };
  const arc = Math.sin(Math.PI * Math.min(1, carry)) * (portrait ? 60 : -80);
  const drop = spring({ frame: frame - B.drop, fps, config: CARD });
  let ix = mix(startPt.x, hover.x, carry);
  let iy = mix(startPt.y, hover.y, carry) + arc;
  const vx = Math.abs(carry - carryPrev) * Math.abs(hover.x - startPt.x);
  const vy = Math.abs(carry - carryPrev) * Math.abs(hover.y - startPt.y);
  ix = mix(ix, mediaCx, drop);
  iy = mix(iy, mediaCy, drop);
  const carriedW = mix(portrait ? 220 : 200, mediaCard.w, Math.min(1, drop));
  const carriedH = mix(portrait ? 170 : 240, mediaCard.h, Math.min(1, drop));
  const carriedRot = mix(mix(14, -5, carry), 0, Math.min(1, drop));
  const placed = frame >= B.drop + 10;
  const slotHot =
    ramp(frame, B.carry + 16, 8) * (1 - ramp(frame, B.drop + 4, 8, EXIT));
  const breathe = 1 + 0.012 * Math.sin((frame - B.carry) / 3.2) * slotHot;

  const btnX = cardRect.x + col.x + col.w - 90;
  const btnY = cardRect.y + cardH - (portrait ? 64 : 64);
  const cursorPath: [number, number, number][] = [
    [-6, 200, 170],
    [B.press - 2, 40, 14],
    [B.morph + 8, 40, 14],
    [B.morph + 24, startPt.x + 60, startPt.y + 50],
    [B.carry, startPt.x + 40, startPt.y + 40],
    [B.drop + 10, mediaCx + 120, mediaCy + 90],
    [B.save - 4, btnX + 10, btnY + 6],
    [B.shrink, btnX + 10, btnY + 6],
    [B.shrink + 18, btnX + 140, btnY + 120],
  ];
  const cAt = (i: 1 | 2) =>
    interpolate(
      frame,
      cursorPath.map((c) => c[0]),
      cursorPath.map((c) => c[i]),
      {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: MOVE,
      },
    );
  const attach =
    ramp(frame, B.carry - 2, 6) * (1 - ramp(frame, B.drop + 2, 8, EXIT));
  const pointerX = mix(cAt(1), ix + 30, attach);
  const pointerY = mix(cAt(2), iy + 40, attach);
  const cursorOpacity =
    ramp(frame, -6, 8) * (1 - ramp(frame, B.shrink + 6, 8, EXIT));
  const cursorScale = dip(frame, B.press, 0.16) * dip(frame, B.save, 0.16);
  const saveDip = dip(frame, B.save, 0.06);

  const headerIn = ramp(frame, B.header, 14);
  const liveIn = spring({ frame: frame - B.live, fps, config: CHIP });

  const camPill = 1 - ramp(frame, B.morph - 4, 26, CAM);
  const gridFocus = spring({
    frame: frame - B.shrink,
    fps,
    config: HEAVY,
  });
  const settle = spring({ frame: frame + 8, fps, config: HEAVY });
  const push =
    (portrait ? 1.7 : 2.1) * camPill +
    (1 - camPill) +
    0.035 * ramp(frame, B.shrink + 10, B.end - B.shrink, Easing.linear);
  const rotX = mix(10, 4, settle) - 2 * gridFocus + Math.sin(frame / 40) * 0.5;
  const rotY =
    mix(-14, -4, settle) + 5 * morph * (1 - gridFocus) - 3 * gridFocus;

  const resolvedParams: Partial<GradientParams> | undefined =
    groundParams ??
    (ground || dark
      ? undefined
      : {
          kind: "mist",
          background: "#faf5ef",
          colors: ["#ffb27a", "#ffd9bd", "#fff4ea", "#e0773a"],
        });
  const resolvedPreset: GshPresetId | undefined =
    ground ?? (dark ? "hearth" : undefined);

  const labelStyle: React.CSSProperties = {
    fontSize: 15,
    color: muted,
    letterSpacing: "0.01em",
    marginBottom: 8,
  };
  const inputStyle = (active: boolean): React.CSSProperties => ({
    height: 52,
    borderRadius: 12,
    background: field,
    border: `1px solid ${active ? accent : hair}`,
    boxShadow: active
      ? `0 0 0 4px color-mix(in oklab, ${accent} 16%, transparent)`
      : dark
        ? "inset 0 1px 0 rgba(255,240,225,0.03)"
        : "inset 0 1px 2px rgba(70,40,20,0.04)",
    display: "flex",
    alignItems: "center",
    padding: "0 16px",
    gap: 10,
    fontSize: 20,
    color: ink,
    letterSpacing: "-0.01em",
  });
  const caret = (on: boolean) =>
    on ? (
      <span
        style={{
          width: 2,
          height: 24,
          marginLeft: 1,
          background: accent,
          opacity: caretBlink,
        }}
      />
    ) : null;

  const fieldGap = portrait ? 96 : 92;
  const fieldsTop = portrait ? 92 : 104;

  const tileInfo = (n: { name: string; price: string }, op: number) => (
    <div
      style={{
        position: "absolute",
        left: 16,
        right: 16,
        top: tileImg + imgInset + 14,
        opacity: op,
        transform: `translateY(${mix(10, 0, op)}px)`,
      }}
    >
      <div
        style={{
          fontSize: 20,
          color: ink,
          whiteSpace: "nowrap",
          letterSpacing: "-0.015em",
        }}
      >
        {n.name}
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginTop: 8,
        }}
      >
        <span
          style={{ fontSize: 16, color: muted, fontFamily: mono.fontFamily }}
        >
          {n.price}
        </span>
        <span
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontSize: 15,
            color: muted,
          }}
        >
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: 4,
              background: "#3fb37f",
            }}
          />
          Active
        </span>
      </div>
    </div>
  );

  return (
    <AbsoluteFill style={{ fontFamily: hanken.fontFamily, overflow: "hidden" }}>
      <GshGround
        preset={resolvedPreset}
        params={resolvedParams}
        timeOffset={3}
        timeScale={0.45}
      />
      <DirBlur id="btc-shrink" x={shrinkBlurX} y={shrinkBlurY} />
      <DirBlur
        id="btc-carry"
        x={Math.min(6, vx * 0.12) * (1 - Math.min(1, drop))}
        y={Math.min(6, vy * 0.12) * (1 - Math.min(1, drop))}
      />
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: stageW,
          height: stageH,
          transform: `scale(${k})`,
          transformOrigin: "0 0",
          perspective: 2000,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: stageW / 2,
            top: stageH / 2,
            width: 0,
            height: 0,
            transformStyle: "preserve-3d",
            transform: `scale(${push}) rotateX(${rotX}deg) rotateY(${rotY}deg)`,
          }}
        >
          <div
            style={{
              position: "absolute",
              left: -gridW / 2,
              width: gridW,
              top: gridTop - headH - 6,
              height: headH,
              display: "flex",
              alignItems: "center",
              gap: 14,
              opacity: headerIn,
              transform: `translateY(${mix(18, 0, headerIn)}px)`,
              filter: `blur(${mix(6, 0, headerIn)}px)`,
            }}
          >
            <span
              style={{
                fontSize: portrait ? 36 : 38,
                fontWeight: 300,
                color: ink,
                letterSpacing: "-0.035em",
              }}
            >
              {storeName}
            </span>
            <span
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                height: 30,
                padding: "0 13px",
                borderRadius: 15,
                background: accent,
                color: "#fff",
                fontSize: 16,
                transform: `scale(${liveIn})`,
                opacity: Math.min(1, liveIn * 2),
                boxShadow: `inset 0 1px 0 rgba(255,255,255,0.3), 0 6px 18px color-mix(in oklab, ${accent} 40%, transparent)`,
              }}
            >
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: 4,
                  background: "#fff",
                }}
              />
              Live
            </span>
            <span style={{ flex: 1 }} />
            {portrait ? null : (
              <span style={{ fontSize: 17, color: muted }}>
                {count} products
              </span>
            )}
            <span
              style={{
                height: 38,
                padding: "0 16px",
                borderRadius: 12,
                border: `1px solid ${hair}`,
                background: dark ? "rgba(255,236,220,0.05)" : "#ffffff",
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: 16,
                color: ink,
              }}
            >
              View store
              <svg viewBox="0 0 24 24" width={15} height={15} aria-hidden>
                <path d="M8 16 16 8M9 8h7v7" {...line(ink, 1.6)} />
              </svg>
            </span>
          </div>

          {all.slice(1).map((n, j) => {
            const i = j + 1;
            const r = tileRect(i);
            const at = B.pops[j] ?? B.pops[B.pops.length - 1] + j * 4;
            const pop = spring({ frame: frame - at, fps, config: CARD });
            return (
              <div
                key={n.name}
                style={{
                  position: "absolute",
                  left: r.x,
                  top: r.y,
                  width: r.w,
                  height: r.h,
                  borderRadius: r.r,
                  background: surface,
                  border: `1px solid ${hair}`,
                  boxShadow: shadow,
                  overflow: "hidden",
                  opacity: frame >= at ? Math.min(1, pop * 1.8) : 0,
                  transform: `translateY(${mix(48, 0, pop)}px) scale(${mix(0.82, 1, pop)})`,
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    left: mediaTile.x,
                    top: mediaTile.y,
                    width: mediaTile.w,
                    height: mediaTile.h,
                    borderRadius: mediaTile.r,
                    overflow: "hidden",
                    background: slotFill,
                  }}
                >
                  <Img
                    src={images[i % images.length]}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                </div>
                {tileInfo(n, 1)}
              </div>
            );
          })}

          <div
            style={{
              position: "absolute",
              left: box.x,
              top: box.y,
              width: box.w,
              height: box.h,
              borderRadius: box.r,
              background: surface,
              border: `1px solid ${hair}`,
              boxShadow: shadow,
              overflow: "hidden",
              opacity: Math.min(1, pillIn * 1.6),
              transform: `translateY(${mix(40, 0, pillIn)}px) scale(${press})`,
              filter:
                shrinkBlurX + shrinkBlurY > 0.4
                  ? "url(#btc-shrink)"
                  : undefined,
            }}
          >
            <div
              style={{
                position: "absolute",
                left: (box.w - pillRect.w) / 2,
                top: (box.h - pillRect.h) / 2,
                width: pillRect.w,
                height: pillRect.h,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                color: ink,
                fontSize: 22,
                letterSpacing: "-0.01em",
                opacity: pillLabel,
                transform: `scale(${mix(1, 1.25, 1 - pillLabel)})`,
              }}
            >
              <span
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 13,
                  background: accent,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg viewBox="0 0 24 24" width={16} height={16} aria-hidden>
                  <path d="M12 6v12M6 12h12" {...line("#fff", 2)} />
                </svg>
              </span>
              {buttonLabel}
            </div>

            <div
              style={{
                position: "absolute",
                left: media.x,
                top: media.y,
                width: media.w,
                height: media.h,
                borderRadius: media.r,
                background: slotFill,
                overflow: "hidden",
                opacity: fieldIn(0),
                transform: `scale(${breathe})`,
                outline: placed
                  ? undefined
                  : `1.5px dashed ${slotHot > 0.3 ? accent : faint}`,
                outlineOffset: -10,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 14,
                  color: muted,
                  fontSize: 17,
                  opacity: placed ? 0 : 1,
                  transform: `translateY(${-8 * slotHot}px)`,
                }}
              >
                <div
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 14,
                    border: `1px solid ${hair}`,
                    background: dark ? "rgba(255,236,220,0.05)" : "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: dark
                      ? undefined
                      : "0 2px 6px rgba(70,40,20,0.06)",
                  }}
                >
                  <svg viewBox="0 0 24 24" width={24} height={24} aria-hidden>
                    <path
                      d="M12 15V5M8 9l4-4 4 4M5 15v3a1.5 1.5 0 0 0 1.5 1.5h11A1.5 1.5 0 0 0 19 18v-3"
                      {...line(slotHot > 0.5 ? accent : ink)}
                    />
                  </svg>
                </div>
                <span style={{ color: ink, fontSize: 18 }}>
                  Drop an image here
                </span>
                <span style={{ marginTop: -8 }}>or click to browse</span>
              </div>
              {placed ? (
                <Img
                  src={images[0]}
                  style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              ) : null}
            </div>

            <div
              style={{
                position: "absolute",
                left: col.x,
                top: col.y,
                width: col.w,
                height: cardH - col.y,
                opacity: cardContent,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  opacity: fieldIn(1),
                  transform: `translateY(${mix(14, 0, fieldIn(1))}px)`,
                }}
              >
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: 30,
                      fontWeight: 300,
                      color: ink,
                      letterSpacing: "-0.03em",
                    }}
                  >
                    New product
                  </div>
                  <div style={{ fontSize: 16, color: muted, marginTop: 4 }}>
                    {storeName} · Catalog
                  </div>
                </div>
                <div
                  style={{
                    position: "relative",
                    height: 30,
                    padding: "0 12px",
                    borderRadius: 15,
                    display: "flex",
                    alignItems: "center",
                    gap: 7,
                    fontSize: 15,
                    color: statusOn > 0.5 ? "#2f9b6a" : muted,
                    background:
                      statusOn > 0.5
                        ? "rgba(63,179,127,0.14)"
                        : dark
                          ? "rgba(255,236,220,0.06)"
                          : "rgba(70,40,20,0.05)",
                    transform: `scale(${frame >= B.status ? mix(0.8, 1, statusOn) : 1})`,
                  }}
                >
                  <span
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: 4,
                      background: statusOn > 0.5 ? "#3fb37f" : faint,
                    }}
                  />
                  {statusOn > 0.5 ? "Active" : "Draft"}
                </div>
              </div>

              {[
                {
                  label: "Title",
                  body: (
                    <div style={inputStyle(nameCaret)}>
                      {typedName ? (
                        <span style={{ whiteSpace: "pre" }}>{typedName}</span>
                      ) : (
                        <span style={{ color: faint }}>
                          {nameCaret ? "" : "Short sleeve t-shirt"}
                        </span>
                      )}
                      {caret(nameCaret)}
                    </div>
                  ),
                },
                {
                  label: "Price",
                  body: (
                    <div style={inputStyle(priceCaret)}>
                      <span
                        style={{
                          fontFamily: mono.fontFamily,
                          fontSize: 19,
                          whiteSpace: "pre",
                          color: typedPrice ? ink : faint,
                        }}
                      >
                        {typedPrice || "$0.00"}
                      </span>
                      {caret(priceCaret)}
                      <span style={{ flex: 1 }} />
                      <span
                        style={{
                          fontFamily: mono.fontFamily,
                          fontSize: 15,
                          color: muted,
                        }}
                      >
                        USD
                      </span>
                    </div>
                  ),
                },
                {
                  label: "Category",
                  body: (
                    <div style={inputStyle(false)}>
                      <span
                        style={{
                          height: 30,
                          padding: "0 12px",
                          borderRadius: 8,
                          background: dark
                            ? "rgba(255,236,220,0.08)"
                            : "rgba(70,40,20,0.06)",
                          display: "flex",
                          alignItems: "center",
                          fontSize: 16,
                        }}
                      >
                        Ceramics
                      </span>
                      <span
                        style={{
                          height: 30,
                          padding: "0 12px",
                          borderRadius: 8,
                          background: dark
                            ? "rgba(255,236,220,0.08)"
                            : "rgba(70,40,20,0.06)",
                          display: "flex",
                          alignItems: "center",
                          fontSize: 16,
                        }}
                      >
                        Tableware
                      </span>
                      <span style={{ flex: 1 }} />
                      <svg
                        viewBox="0 0 24 24"
                        width={18}
                        height={18}
                        aria-hidden
                      >
                        <path d="m7 10 5 5 5-5" {...line(muted)} />
                      </svg>
                    </div>
                  ),
                },
              ].map((f, i) => (
                <div
                  key={f.label}
                  style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    top: fieldsTop + i * fieldGap,
                    opacity: fieldIn(i + 2),
                    transform: `translateY(${mix(16, 0, fieldIn(i + 2))}px)`,
                  }}
                >
                  <div style={labelStyle}>{f.label}</div>
                  {f.body}
                </div>
              ))}

              <div
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  bottom: portrait ? 36 : 38,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-end",
                  gap: 10,
                  opacity: fieldIn(5),
                  transform: `translateY(${mix(14, 0, fieldIn(5))}px)`,
                }}
              >
                <span style={{ fontSize: 16, color: muted, flex: 1 }}>
                  Unsaved changes
                </span>
                <div
                  style={{
                    height: 48,
                    padding: "0 20px",
                    borderRadius: 14,
                    border: `1px solid ${hair}`,
                    display: "flex",
                    alignItems: "center",
                    fontSize: 18,
                    color: ink,
                  }}
                >
                  Discard
                </div>
                <div
                  style={{
                    height: 48,
                    padding: "0 22px",
                    borderRadius: 14,
                    background: ink,
                    color: btnInk,
                    display: "flex",
                    alignItems: "center",
                    fontSize: 18,
                    transform: `scale(${saveDip})`,
                    boxShadow: dark
                      ? "inset 0 1px 0 rgba(255,255,255,0.5), 0 8px 20px rgba(0,0,0,0.3)"
                      : "inset 0 1px 0 rgba(255,255,255,0.15), 0 8px 20px rgba(28,22,18,0.2)",
                  }}
                >
                  Add to store
                </div>
              </div>
            </div>

            {tileInfo({ name, price }, tileContent)}
          </div>

          {frame >= B.carry - 2 && !placed ? (
            <div
              style={{
                position: "absolute",
                left: ix - carriedW / 2,
                top: iy - carriedH / 2,
                width: carriedW,
                height: carriedH,
                borderRadius: mix(14, mediaCard.r, Math.min(1, drop)),
                overflow: "hidden",
                transform: `rotate(${carriedRot}deg)`,
                opacity: ramp(frame, B.carry - 2, 6),
                boxShadow: `0 ${mix(30, 4, Math.min(1, drop))}px ${mix(50, 10, Math.min(1, drop))}px rgba(30,10,0,${dark ? 0.55 : 0.3})`,
                border: `${mix(4, 0, Math.min(1, drop))}px solid #ffffff`,
                filter: "url(#btc-carry)",
              }}
            >
              <Img
                src={images[0]}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </div>
          ) : null}

          <div
            style={{
              position: "absolute",
              left: pointerX,
              top: pointerY,
              opacity: cursorOpacity,
              transformOrigin: "5px 4px",
              transform: `scale(${cursorScale})`,
              filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.3))",
            }}
          >
            <Cursor size={32} />
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
}

export default ButtonToCard;
