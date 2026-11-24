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
} from "remotion";
import { useSceneConfig, useSceneFrame } from "@/lib/remocn/frame-rate";
import type { GradientParams } from "@/lib/remocn/gsh/gradient-engine";
import { GshGround } from "@/lib/remocn/gsh/gsh-ground";
import type { GshPresetId } from "@/lib/remocn/gsh/presets";
import { type Timing, useTimeline } from "@/lib/remocn/timeline";
import {
  type ButtonToCardElementId,
  buttonToCardTimeline,
  DEFAULT_NAME,
  DEFAULT_OTHERS,
  DEFAULT_PRICE,
} from "./timeline";

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
  /** Heading of the new-product form. */
  formTitle?: string;
  /** Label of the primary button that saves the product. */
  saveLabel?: string;
  /** Prompt in the empty image slot. */
  dropLabel?: string;
  /** Text color; overrides the theme ink. */
  ink?: string;
  /** Solid fill in place of the gradient ground; "transparent" drops it. */
  background?: string;
  /** Typeface for the copy. Load it yourself; Hanken Grotesk by default. */
  fontFamily?: string;
  /** Size of the card and grid, around the frame's center. */
  scale?: number;
  /** Frames to hold the first frame before anything moves. */
  delay?: number;
  speed?: number;
  ground?: GshPresetId;
  groundParams?: Partial<GradientParams>;
  /**
   * Moves, trims or stretches each step of the story (the press, the morph,
   * the typing, the image drop, the save, the shrink into the store, single
   * tiles), by the ids in `./timeline`. Frames on the scene timeline, after
   * `delay` and `speed`.
   */
  timing?: Timing<ButtonToCardElementId>;
}

/** The foreground at `scale`, around the frame's center; nothing extra at 1. */
function ScaleLayer({
  scale,
  children,
}: {
  scale: number;
  children: React.ReactNode;
}) {
  if (scale === 1) return children;
  return (
    <AbsoluteFill style={{ transform: `scale(${scale})` }}>
      {children}
    </AbsoluteFill>
  );
}

export function ButtonToCard(props: ButtonToCardProps) {
  const {
    theme = "dark",
    accent = "#f2552c",
    buttonLabel = "Add an item",
    name = DEFAULT_NAME,
    price = DEFAULT_PRICE,
    images = [
      staticFile("templates/brand-guidelines/ceramics.jpg"),
      staticFile("templates/brand-guidelines/chair.jpg"),
      staticFile("templates/product-showcase/sculpture.jpg"),
      staticFile("templates/brand-guidelines/materials.jpg"),
    ],
    others = DEFAULT_OTHERS,
    storeName = "Studio Goods",
    formTitle = "New product",
    saveLabel = "Add to store",
    dropLabel = "Drop an image here",
    ink: inkColor,
    background,
    fontFamily = hanken.fontFamily,
    scale = 1,
    delay = 0,
    speed = 1,
    ground,
    groundParams,
    timing,
  } = props;
  const frame = Math.max(0, useSceneFrame() - delay) * speed;
  const { width, height, fps, durationInFrames } = useSceneConfig();
  const tl = useTimeline(
    buttonToCardTimeline,
    props,
    durationInFrames * speed,
    timing,
  );
  const pill = tl.get("pill");
  const pressEl = tl.get("press");
  const morphEl = tl.get("morph");
  const fields = tl.get("fields");
  const title = tl.get("title");
  const carryEl = tl.get("carry");
  const priceEl = tl.get("price");
  const dropEl = tl.get("drop");
  const status = tl.get("status");
  const save = tl.get("save");
  const shrinkEl = tl.get("shrink");
  const header = tl.get("header");
  const live = tl.get("live");
  const dark = theme === "dark";
  const portrait = height > width * 1.2;
  const stageW = portrait ? 720 : 1280;
  const stageH = portrait ? 1280 : 720;
  const k = width / stageW;

  const ink = inkColor ?? (dark ? "#f7f0ea" : "#1c1612");
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

  const pillIn = spring({ frame: frame - pill.start, fps, config: CARD });
  const morph = spring({
    frame: frame - morphEl.start,
    fps,
    config: MORPH,
    durationInFrames: morphEl.length,
  });
  const shrink = spring({
    frame: frame - shrinkEl.start,
    fps,
    config: HEAVY,
    durationInFrames: shrinkEl.length,
  });
  const shrinkPrev = spring({
    frame: frame - 1 - shrinkEl.start,
    fps,
    config: HEAVY,
    durationInFrames: shrinkEl.length,
  });
  const press = dip(frame, pressEl.start, 0.07);
  let box = lerpRect(pillRect, cardRect, morph);
  box = lerpRect(box, tileRect(0), shrink);
  const t0 = tileRect(0);
  const shrinkV = Math.abs(shrink - shrinkPrev);
  const shrinkBlurX = Math.min(6, shrinkV * Math.abs(cardRect.x - t0.x) * 0.2);
  const shrinkBlurY = Math.min(6, shrinkV * Math.abs(cardRect.y - t0.y) * 0.2);

  const pillLabel =
    1 - ramp(frame, morphEl.start, morphEl.beat("labelOut"), EXIT);
  const fieldIn = (i: number) =>
    ramp(frame, fields.start + i * fields.beat("step"), fields.beat("field"));
  const cardContent =
    1 - ramp(frame, shrinkEl.start, shrinkEl.beat("contentOut"), EXIT);
  const tileContent = ramp(
    frame,
    shrinkEl.start + shrinkEl.beat("tileAt"),
    shrinkEl.beat("tile"),
  );
  const media = lerpRect(mediaCard, mediaTile, shrink);
  // Layout rounds a box and a baseline to whole pixels, so anything eased by
  // `left`/`top` here clicks along pixel by pixel. Each mover is laid out at
  // one resting place and travels by transform; a shift under 0.001px is
  // dropped so nothing extra sits on the layer tree there.
  const shift = (x: number, y: number) =>
    Math.abs(x) < 1e-3 && Math.abs(y) < 1e-3
      ? ""
      : `translate(${x}px, ${y}px) `;

  const typedName = name.slice(
    0,
    Math.max(0, (frame - title.start) / title.beat("char")),
  );
  const typedPrice = price.slice(
    0,
    Math.max(0, Math.floor((frame - priceEl.start) / priceEl.beat("char"))),
  );
  const nameCaret =
    frame >= title.start + title.beat("caretAt") && frame < priceEl.start;
  const priceCaret = frame >= priceEl.start && frame < status.start;
  const caretBlink = Math.floor(frame / 8) % 2 === 0 ? 1 : 0.2;
  const statusOn = spring({ frame: frame - status.start, fps, config: CHIP });

  const mediaCx = cardRect.x + mediaCard.x + mediaCard.w / 2;
  const mediaCy = cardRect.y + mediaCard.y + mediaCard.h / 2;
  const startPt = portrait ? { x: 300, y: 720 } : { x: 720, y: 360 };
  const carry = spring({
    frame: frame - carryEl.start,
    fps,
    config: { mass: 0.9, damping: 20, stiffness: 90 },
  });
  const carryPrev = spring({
    frame: frame - 1 - carryEl.start,
    fps,
    config: { mass: 0.9, damping: 20, stiffness: 90 },
  });
  const hover = { x: mediaCx + 40, y: mediaCy - 20 };
  const arc = Math.sin(Math.PI * Math.min(1, carry)) * (portrait ? 60 : -80);
  const drop = spring({ frame: frame - dropEl.start, fps, config: CARD });
  let ix = mix(startPt.x, hover.x, carry);
  let iy = mix(startPt.y, hover.y, carry) + arc;
  const vx = Math.abs(carry - carryPrev) * Math.abs(hover.x - startPt.x);
  const vy = Math.abs(carry - carryPrev) * Math.abs(hover.y - startPt.y);
  ix = mix(ix, mediaCx, drop);
  iy = mix(iy, mediaCy, drop);
  const carriedW = mix(portrait ? 220 : 200, mediaCard.w, Math.min(1, drop));
  const carriedH = mix(portrait ? 170 : 240, mediaCard.h, Math.min(1, drop));
  const carriedRot = mix(mix(14, -5, carry), 0, Math.min(1, drop));
  const placed = frame >= dropEl.start + dropEl.beat("placed");
  const slotHot =
    ramp(frame, carryEl.start + carryEl.beat("hotAt"), carryEl.beat("hot")) *
    (1 -
      ramp(
        frame,
        dropEl.start + dropEl.beat("hotOutAt"),
        dropEl.beat("hotOut"),
        EXIT,
      ));
  const breathe = 1 + 0.012 * Math.sin((frame - carryEl.start) / 3.2) * slotHot;

  const btnX = cardRect.x + col.x + col.w - 90;
  const btnY = cardRect.y + cardH - (portrait ? 64 : 64);
  // In time order, so a `timing` that reorders waypoints still interpolates.
  const cursorPath: [number, number, number][] = (
    [
      [pill.start + pill.beat("cursorAt"), 200, 170],
      [pressEl.start + pressEl.beat("cursorAt"), 40, 14],
      [morphEl.start + morphEl.beat("cursorAt"), 40, 14],
      [
        morphEl.start + morphEl.beat("cursorAway"),
        startPt.x + 60,
        startPt.y + 50,
      ],
      [carryEl.start, startPt.x + 40, startPt.y + 40],
      [dropEl.start + dropEl.beat("cursorAt"), mediaCx + 120, mediaCy + 90],
      [save.start + save.beat("cursorAt"), btnX + 10, btnY + 6],
      [shrinkEl.start, btnX + 10, btnY + 6],
      [shrinkEl.start + shrinkEl.beat("cursorAway"), btnX + 140, btnY + 120],
    ] satisfies [number, number, number][]
  ).sort((a, b) => a[0] - b[0]);
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
  const cursorRest = cursorPath[cursorPath.length - 1];
  const attachAt = carryEl.start + carryEl.beat("attachAt");
  const attachIn = ramp(frame, attachAt, carryEl.beat("attach"));
  const attach =
    attachIn *
    (1 -
      ramp(
        frame,
        dropEl.start + dropEl.beat("detachAt"),
        dropEl.beat("detach"),
        EXIT,
      ));
  const pointerX = mix(cAt(1), ix + 30, attach);
  const pointerY = mix(cAt(2), iy + 40, attach);
  const cursorOpacity =
    ramp(frame, pill.start + pill.beat("cursorAt"), pill.beat("cursorIn")) *
    (1 -
      ramp(
        frame,
        shrinkEl.start + shrinkEl.beat("cursorOutAt"),
        shrinkEl.beat("cursorOut"),
        EXIT,
      ));
  const cursorScale =
    dip(frame, pressEl.start, 0.16) * dip(frame, save.start, 0.16);
  const saveDip = dip(frame, save.start, 0.06);

  const headerIn = ramp(frame, header.start, header.length);
  const liveIn = spring({ frame: frame - live.start, fps, config: CHIP });

  const camPill =
    1 -
    ramp(
      frame,
      morphEl.start + morphEl.beat("camAt"),
      morphEl.beat("cam"),
      CAM,
    );
  const gridFocus = spring({
    frame: frame - shrinkEl.start,
    fps,
    config: HEAVY,
  });
  // The camera settles from the moment the pill starts rising.
  const settle = spring({ frame: frame - pill.start, fps, config: HEAVY });
  const push =
    (portrait ? 1.7 : 2.1) * camPill +
    (1 - camPill) +
    0.035 *
      ramp(
        frame,
        shrinkEl.start + shrinkEl.beat("pushAt"),
        shrinkEl.beat("push"),
        Easing.linear,
      );
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
    <AbsoluteFill style={{ fontFamily, overflow: "hidden" }}>
      {background === undefined ? (
        <GshGround
          preset={resolvedPreset}
          params={resolvedParams}
          timeOffset={3}
          timeScale={0.45}
        />
      ) : (
        <AbsoluteFill
          style={{
            background: background === "transparent" ? undefined : background,
          }}
        />
      )}
      <DirBlur id="btc-shrink" x={shrinkBlurX} y={shrinkBlurY} />
      <DirBlur
        id="btc-carry"
        x={Math.min(6, vx * 0.12) * (1 - Math.min(1, drop))}
        y={Math.min(6, vy * 0.12) * (1 - Math.min(1, drop))}
      />
      <ScaleLayer scale={scale}>
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
              const at = tl.get(`pop:${j}`).start;
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
                // Laid out where the open card holds longest.
                left: cardRect.x,
                top: cardRect.y,
                width: box.w,
                height: box.h,
                borderRadius: box.r,
                background: surface,
                border: `1px solid ${hair}`,
                boxShadow: shadow,
                overflow: "hidden",
                opacity: Math.min(1, pillIn * 1.6),
                transform: `${shift(box.x - cardRect.x, box.y - cardRect.y)}translateY(${mix(40, 0, pillIn)}px) scale(${press})`,
                filter:
                  shrinkBlurX + shrinkBlurY > 0.4
                    ? "url(#btc-shrink)"
                    : undefined,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
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
                  transform: `${shift((box.w - pillRect.w) / 2, (box.h - pillRect.h) / 2)}scale(${mix(1, 1.25, 1 - pillLabel)})`,
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
                  left: mediaCard.x,
                  top: mediaCard.y,
                  width: media.w,
                  height: media.h,
                  borderRadius: media.r,
                  background: slotFill,
                  overflow: "hidden",
                  opacity: fieldIn(0),
                  transform: `${shift(media.x - mediaCard.x, media.y - mediaCard.y)}scale(${breathe})`,
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
                  <span style={{ color: ink, fontSize: 18 }}>{dropLabel}</span>
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
                      {formTitle}
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
                      transform: `scale(${frame >= status.start ? mix(0.8, 1, statusOn) : 1})`,
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
                    {saveLabel}
                  </div>
                </div>
              </div>

              {tileInfo({ name, price }, tileContent)}
            </div>

            {frame >= attachAt && !placed ? (
              <div
                style={{
                  position: "absolute",
                  left: mediaCx - mediaCard.w / 2,
                  top: mediaCy - mediaCard.h / 2,
                  width: carriedW,
                  height: carriedH,
                  borderRadius: mix(14, mediaCard.r, Math.min(1, drop)),
                  overflow: "hidden",
                  transform: `${shift(ix - carriedW / 2 - (mediaCx - mediaCard.w / 2), iy - carriedH / 2 - (mediaCy - mediaCard.h / 2))}rotate(${carriedRot}deg)`,
                  opacity: attachIn,
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
                left: cursorRest[1],
                top: cursorRest[2],
                opacity: cursorOpacity,
                transformOrigin: "5px 4px",
                transform: `${shift(pointerX - cursorRest[1], pointerY - cursorRest[2])}scale(${cursorScale})`,
                filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.3))",
              }}
            >
              <Cursor size={32} />
            </div>
          </div>
        </div>
      </ScaleLayer>
    </AbsoluteFill>
  );
}

export default ButtonToCard;
