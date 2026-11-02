"use client";

import { loadFont as loadMono } from "@remotion/google-fonts/DMMono";
import { loadFont as loadInterTight } from "@remotion/google-fonts/InterTight";
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

const inter = loadInterTight("normal", {
  weights: ["300", "400"],
  subsets: ["latin"],
});
const mono = loadMono("normal", { weights: ["400"], subsets: ["latin"] });

const ENTER = Easing.bezier(0.32, 0.72, 0, 1);
const CAM = Easing.bezier(0.87, 0, 0.13, 1);
const MOVE = Easing.bezier(0.65, 0, 0.35, 1);
const HEAVY = { mass: 1, damping: 26, stiffness: 120 };
const CARD = { mass: 0.8, damping: 18, stiffness: 160 };
const CHIP = { mass: 0.5, damping: 12, stiffness: 200 };

const B = {
  row1: [-8, -5, -2, 1],
  pull: 14,
  pullLen: 40,
  chrome: 24,
  side: 28,
  row2: [50, 53, 56, 59],
  count: 50,
  publish: 84,
  end: 132,
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

const line = (color: string, w = 1.5) => ({
  fill: "none",
  stroke: color,
  strokeWidth: w,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
});

const ICONS: Record<string, string> = {
  home: "M4 10.5 12 4l8 6.5V20h-5.5v-5.5h-5V20H4z",
  orders: "M6 4h12l1 16H5L6 4ZM9 8a3 3 0 0 0 6 0",
  products: "M12 3.5 20 8v8l-8 4.5L4 16V8l8-4.5ZM4 8l8 4.5L20 8M12 12.5V20.5",
  customers:
    "M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM3 20c0-3.3 2.7-6 6-6s6 2.7 6 6M16 4.5a3.5 3.5 0 0 1 0 6.5M18 14c2 .8 3 2.8 3 6",
  analytics: "M4 20V10M10 20V4M16 20v-7M21 20H3",
  store: "M4 9.5 5.5 4h13L20 9.5M4 9.5h16M4 9.5V20h16V9.5M9.5 20v-5h5v5",
  pos: "M5 4h14v16H5zM8 8h8M8 12h2M12 12h2M8 16h2M12 16h2",
  search: "M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14ZM20 20l-4-4",
  bell: "M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15L6 16ZM10 20.5h4",
};

function Icon({
  d,
  color,
  size = 18,
}: {
  d: string;
  color: string;
  size?: number;
}) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden>
      <path d={d} {...line(color)} />
    </svg>
  );
}

export interface GridToAppProps {
  theme?: "dark" | "light";
  accent?: string;
  storeName?: string;
  pageTitle?: string;
  images?: string[];
  products?: { name: string; price: string }[];
  ground?: GshPresetId;
  groundParams?: Partial<GradientParams>;
}

export function GridToApp({
  theme = "dark",
  accent = "#ff6a2b",
  storeName = "Studio Goods",
  pageTitle = "Products",
  images = [
    staticFile("templates/brand-guidelines/ceramics.jpg"),
    staticFile("templates/brand-guidelines/chair.jpg"),
    staticFile("templates/product-showcase/sculpture.jpg"),
    staticFile("templates/brand-guidelines/materials.jpg"),
    staticFile("templates/launch-anything/desk.jpg"),
    staticFile("templates/product-showcase/workbench.jpg"),
    staticFile("templates/product-showcase/gallery.jpg"),
    staticFile("templates/product-showcase/courtyard.jpg"),
  ],
  products = [
    { name: "Ceramic pitcher", price: "$48.00" },
    { name: "Oak stool", price: "$120.00" },
    { name: "Arch sculpture", price: "$86.00" },
    { name: "Material kit", price: "$32.00" },
    { name: "Writing desk", price: "$640.00" },
    { name: "Oak dining table", price: "$1,180.00" },
    { name: "Travertine bench", price: "$420.00" },
    { name: "Olive planter", price: "$64.00" },
  ],
  ground,
  groundParams,
}: GridToAppProps) {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const dark = theme === "dark";
  const portrait = height > width * 1.2;
  const stageW = portrait ? 720 : 1280;
  const stageH = portrait ? 1280 : 720;
  const k = width / stageW;

  const ink = dark ? "#f6efe9" : "#1b1714";
  const muted = dark ? "rgba(246,239,233,0.54)" : "rgba(27,23,20,0.52)";
  const faint = dark ? "rgba(246,239,233,0.3)" : "rgba(27,23,20,0.3)";
  const hair = dark ? "rgba(255,236,222,0.09)" : "rgba(60,36,20,0.09)";
  const fill = dark ? "rgba(255,236,222,0.05)" : "rgba(60,36,20,0.045)";
  const winBg = dark ? "#141010" : "#ffffff";
  const sideBg = dark ? "#100d0c" : "#f8f5f2";
  const mainBg = dark ? "#171312" : "#fcfbf9";
  const cardBg = dark ? "#1f1a18" : "#ffffff";
  const shadow = dark
    ? "inset 0 1px 0 rgba(255,240,225,0.06), 0 1px 2px rgba(0,0,0,0.4), 0 20px 44px rgba(0,0,0,0.4), 0 70px 140px rgba(20,6,0,0.6)"
    : "inset 0 1px 0 #ffffff, 0 1px 2px rgba(120,60,20,0.06), 0 18px 40px rgba(150,80,30,0.1), 0 60px 130px rgba(150,80,30,0.18)";

  const winW = portrait ? 680 : 1180;
  const winH = portrait ? 1180 : 660;
  const topH = 54;
  const sideW = portrait ? 66 : 232;
  const mainW = winW - sideW;
  const pad = portrait ? 22 : 30;
  const cols = portrait ? 2 : 4;
  const gap = portrait ? 16 : 18;
  const cardW = (mainW - pad * 2 - gap * (cols - 1)) / cols;
  const imgH = cardW;
  const cardH = imgH + 72;
  const headTop = topH + (portrait ? 22 : 26);
  const tabsTop = headTop + 58;
  const gridTop = tabsTop + 56;
  const cardPos = (i: number) => ({
    x: sideW + pad + (i % cols) * (cardW + gap),
    y: gridTop + Math.floor(i / cols) * (cardH + gap),
  });

  const pull = ramp(frame, B.pull, B.pullLen, CAM);
  const pullPrev = ramp(frame - 1, B.pull, B.pullLen, CAM);
  const tilt = spring({
    frame: frame - B.pull,
    fps,
    config: HEAVY,
    durationInFrames: B.pullLen + 10,
  });
  const focusX = sideW + pad + (mainW - pad * 2) / 2 - winW / 2;
  const focusY = gridTop + cardH / 2 - winH / 2 + (portrait ? cardH / 2 : 0);
  const z0 = portrait ? 1.2 : 1.42;
  const z =
    mix(z0, 1, pull) *
      (1 + 0.03 * ramp(frame, B.pull + B.pullLen, B.end, Easing.linear)) +
    0.025 * ramp(frame, -10, B.pull + 6, Easing.linear) * (1 - pull);
  const fx = mix(focusX, 0, pull);
  const fy = mix(focusY, portrait ? 10 : 6, pull);
  const rotX = mix(0, 7, tilt) + 6 * Math.sin(Math.PI * pull);
  const rotY = mix(0, portrait ? -6 : -10, tilt) + Math.sin(frame / 50) * 0.6;
  const rotZ = mix(0, portrait ? 0.6 : 1.2, tilt);
  const pullV = Math.abs(pull - pullPrev);
  const camBlur = Math.min(4, pullV * 60);

  const chrome = ramp(frame, B.chrome, 18);
  const sideItem = (i: number) => ramp(frame, B.side + i * 2, 12);
  const countRoll = ramp(frame, B.count, 12, MOVE);
  const countVal = Math.round(mix(4, products.length, countRoll));
  const pub = spring({ frame: frame - B.publish, fps, config: CHIP });
  const live = frame >= B.publish;
  const pubDip = dip(frame, B.publish - 4, 0.08);

  const resolvedPreset: GshPresetId | undefined = ground;
  const resolvedParams: Partial<GradientParams> | undefined =
    groundParams ??
    (ground
      ? undefined
      : dark
        ? {
            kind: "mist",
            background: "#0b0705",
            colors: ["#ffb37a", "#ff6a2c", "#5a1d0c", "#1a0a05"],
            seed: 11,
          }
        : {
            kind: "mist",
            background: "#fbf6f0",
            colors: ["#ffa266", "#ffd6b6", "#fff3e8", "#e8763a"],
            seed: 11,
          });

  const navItems = [
    { id: "home", label: "Home" },
    { id: "orders", label: "Orders", badge: "4" },
    { id: "products", label: "Products", active: true },
    { id: "customers", label: "Customers" },
    { id: "analytics", label: "Analytics" },
  ];
  const channelItems = [
    { id: "store", label: "Online store" },
    { id: "pos", label: "Point of sale" },
  ];

  const chromeStyle = (i: number): React.CSSProperties => {
    const t = sideItem(i);
    return {
      opacity: t * chrome,
      transform: `translateX(${mix(-14, 0, t)}px)`,
    };
  };

  const navRow = (
    it: { id: string; label: string; badge?: string; active?: boolean },
    i: number,
  ) => (
    <div
      key={it.id}
      style={{
        height: 40,
        borderRadius: 10,
        display: "flex",
        alignItems: "center",
        justifyContent: portrait ? "center" : undefined,
        gap: 12,
        padding: portrait ? 0 : "0 12px",
        background: it.active ? fill : "transparent",
        boxShadow: it.active
          ? dark
            ? "inset 0 1px 0 rgba(255,240,225,0.05)"
            : "0 1px 2px rgba(60,36,20,0.06)"
          : undefined,
        border: it.active ? `1px solid ${hair}` : "1px solid transparent",
        color: it.active ? ink : muted,
        fontSize: 16,
        ...chromeStyle(i),
      }}
    >
      <Icon d={ICONS[it.id]} color={it.active ? ink : muted} />
      {portrait ? null : <span style={{ flex: 1 }}>{it.label}</span>}
      {it.badge && !portrait ? (
        <span
          style={{
            minWidth: 22,
            height: 22,
            borderRadius: 7,
            background: fill,
            fontSize: 13,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: mono.fontFamily,
          }}
        >
          {it.badge}
        </span>
      ) : null}
    </div>
  );

  return (
    <AbsoluteFill style={{ fontFamily: inter.fontFamily, overflow: "hidden" }}>
      <GshGround
        preset={resolvedPreset}
        params={resolvedParams}
        timeOffset={4}
        timeScale={0.45}
      />
      <svg width={0} height={0} style={{ position: "absolute" }} aria-hidden>
        <filter id="gta-cam" x="-5%" y="-5%" width="110%" height="110%">
          <feGaussianBlur stdDeviation={`${camBlur * 0.6} ${camBlur}`} />
        </filter>
      </svg>
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: stageW,
          height: stageH,
          transform: `scale(${k})`,
          transformOrigin: "0 0",
          perspective: 2200,
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
            transform: `translate(${-fx * z}px, ${-fy * z}px) rotateX(${rotX}deg) rotateY(${rotY}deg) rotateZ(${rotZ}deg) scale(${z})`,
          }}
        >
          <div
            style={{
              position: "absolute",
              left: -winW / 2,
              top: -winH / 2,
              width: winW,
              height: winH,
              borderRadius: 20,
              background: winBg,
              border: `1px solid ${hair}`,
              boxShadow: shadow,
              opacity: chrome,
            }}
          />
          <div
            style={{
              position: "absolute",
              left: -winW / 2,
              top: -winH / 2,
              width: winW,
              height: winH,
              borderRadius: 20,
              overflow: "hidden",
              filter: camBlur > 0.4 ? "url(#gta-cam)" : undefined,
            }}
          >
            <div
              style={{
                position: "absolute",
                left: sideW,
                top: topH,
                right: 0,
                bottom: 0,
                background: mainBg,
                opacity: chrome,
              }}
            />
            <div
              style={{
                position: "absolute",
                left: 0,
                top: topH,
                width: sideW,
                bottom: 0,
                background: sideBg,
                borderRight: `1px solid ${hair}`,
                opacity: chrome,
                padding: portrait ? "18px 12px" : "18px 14px",
                boxSizing: "border-box",
                display: "flex",
                flexDirection: "column",
                gap: 4,
              }}
            >
              {navItems.map((it, i) => navRow(it, i))}
              {portrait ? (
                <div
                  style={{ height: 1, background: hair, margin: "12px 6px" }}
                />
              ) : (
                <div
                  style={{
                    fontSize: 13,
                    color: faint,
                    letterSpacing: "0.04em",
                    padding: "20px 12px 8px",
                    ...chromeStyle(5),
                  }}
                >
                  Sales channels
                </div>
              )}
              {channelItems.map((it, i) => navRow(it, i + 6))}
              <div style={{ flex: 1 }} />
              {portrait ? null : (
                <div
                  style={{
                    borderRadius: 14,
                    border: `1px solid ${hair}`,
                    background: fill,
                    padding: 14,
                    ...chromeStyle(8),
                  }}
                >
                  <div style={{ fontSize: 15, color: ink }}>Setup guide</div>
                  <div style={{ fontSize: 13, color: muted, marginTop: 4 }}>
                    4 of 6 tasks done
                  </div>
                  <div
                    style={{
                      height: 5,
                      borderRadius: 3,
                      background: fill,
                      marginTop: 10,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${mix(50, 67, ramp(frame, B.count, 18))}%`,
                        height: "100%",
                        borderRadius: 3,
                        background: accent,
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: 0,
                height: topH,
                borderBottom: `1px solid ${hair}`,
                display: "flex",
                alignItems: "center",
                padding: "0 16px",
                gap: 14,
                opacity: chrome,
                transform: `translateY(${mix(-12, 0, chrome)}px)`,
              }}
            >
              <div style={{ display: "flex", gap: 8 }}>
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: 6,
                      background: fill,
                      border: `1px solid ${hair}`,
                    }}
                  />
                ))}
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  marginLeft: 8,
                  fontSize: 16,
                  color: ink,
                }}
              >
                <span
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 7,
                    background: accent,
                    color: "#fff",
                    fontSize: 14,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.3)",
                  }}
                >
                  {storeName.slice(0, 1)}
                </span>
                {portrait ? null : storeName}
                {portrait ? null : (
                  <svg viewBox="0 0 24 24" width={14} height={14} aria-hidden>
                    <path d="m7 10 5 5 5-5" {...line(muted)} />
                  </svg>
                )}
              </div>
              <div
                style={{ flex: 1, display: "flex", justifyContent: "center" }}
              >
                {portrait ? null : (
                  <div
                    style={{
                      width: 360,
                      height: 34,
                      borderRadius: 10,
                      background: fill,
                      border: `1px solid ${hair}`,
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "0 12px",
                      fontSize: 15,
                      color: faint,
                    }}
                  >
                    <Icon d={ICONS.search} color={muted} size={16} />
                    <span style={{ flex: 1 }}>Search products</span>
                    <span style={{ fontFamily: mono.fontFamily, fontSize: 13 }}>
                      ⌘K
                    </span>
                  </div>
                )}
              </div>
              <Icon d={ICONS.bell} color={muted} />
              <div
                style={{
                  height: 34,
                  padding: "0 14px",
                  borderRadius: 10,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 15,
                  color: live ? "#fff" : ink,
                  background: live ? accent : fill,
                  border: live ? "none" : `1px solid ${hair}`,
                  transform: `scale(${live ? mix(0.82, 1, pub) : pubDip})`,
                  boxShadow: live
                    ? `inset 0 1px 0 rgba(255,255,255,0.3), 0 8px 22px color-mix(in oklab, ${accent} 45%, transparent)`
                    : undefined,
                }}
              >
                {live ? (
                  <span
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: 4,
                      background: "#fff",
                    }}
                  />
                ) : null}
                {live ? "Store live" : "Publish"}
              </div>
              <span
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  background: dark ? "#3a2b24" : "#f1e2d6",
                  color: ink,
                  fontSize: 13,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                AS
              </span>
            </div>

            <div
              style={{
                position: "absolute",
                left: sideW + pad,
                right: pad,
                top: headTop,
                height: 46,
                display: "flex",
                alignItems: "center",
                gap: 12,
                opacity: chrome,
                transform: `translateY(${mix(14, 0, chrome)}px)`,
              }}
            >
              <span
                style={{
                  fontSize: portrait ? 32 : 36,
                  fontWeight: 300,
                  color: ink,
                  letterSpacing: "-0.04em",
                }}
              >
                {pageTitle}
              </span>
              <span
                style={{
                  height: 26,
                  minWidth: 26,
                  padding: "0 8px",
                  borderRadius: 8,
                  background: fill,
                  border: `1px solid ${hair}`,
                  fontFamily: mono.fontFamily,
                  fontSize: 14,
                  color: muted,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                }}
              >
                {countVal}
              </span>
              <span style={{ flex: 1 }} />
              {portrait ? null : (
                <span
                  style={{
                    height: 38,
                    padding: "0 16px",
                    borderRadius: 11,
                    border: `1px solid ${hair}`,
                    fontSize: 15,
                    color: ink,
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  Import
                </span>
              )}
              <span
                style={{
                  height: 38,
                  padding: "0 16px",
                  borderRadius: 11,
                  background: ink,
                  color: winBg,
                  fontSize: 15,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <svg viewBox="0 0 24 24" width={14} height={14} aria-hidden>
                  <path d="M12 5v14M5 12h14" {...line(winBg, 2)} />
                </svg>
                Add product
              </span>
            </div>

            <div
              style={{
                position: "absolute",
                left: sideW + pad,
                right: pad,
                top: tabsTop,
                height: 40,
                display: "flex",
                alignItems: "flex-end",
                gap: 26,
                borderBottom: `1px solid ${hair}`,
                opacity: chrome,
              }}
            >
              {["All", "Active", "Drafts", "Archived"].map((t, i) => (
                <span
                  key={t}
                  style={{
                    fontSize: 16,
                    color: i === 0 ? ink : muted,
                    paddingBottom: 11,
                    borderBottom:
                      i === 0
                        ? `1.5px solid ${ink}`
                        : "1.5px solid transparent",
                    marginBottom: -1,
                  }}
                >
                  {t}
                </span>
              ))}
            </div>

            {products.slice(0, cols * (portrait ? 3 : 2)).map((p, i) => {
              const pos = cardPos(i);
              const firstRow = i < 4;
              const at = firstRow
                ? (B.row1[i] ?? 0)
                : (B.row2[(i - 4) % B.row2.length] ?? 50) +
                  Math.floor((i - 4) / B.row2.length) * 6;
              const pop = spring({ frame: frame - at, fps, config: CARD });
              const shown = frame >= at;
              return (
                <div
                  key={p.name}
                  style={{
                    position: "absolute",
                    left: pos.x,
                    top: pos.y,
                    width: cardW,
                    height: cardH,
                    borderRadius: 16,
                    background: cardBg,
                    border: `1px solid ${hair}`,
                    boxShadow: dark
                      ? "inset 0 1px 0 rgba(255,240,225,0.05), 0 10px 26px rgba(0,0,0,0.35)"
                      : "0 1px 2px rgba(60,36,20,0.05), 0 10px 24px rgba(120,60,20,0.07)",
                    overflow: "hidden",
                    opacity: shown ? Math.min(1, pop * 1.8) : 0,
                    transform: `translateY(${mix(firstRow ? 60 : 40, 0, pop)}px) scale(${mix(0.86, 1, pop)})`,
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      left: 8,
                      top: 8,
                      width: cardW - 16,
                      height: imgH - 16,
                      borderRadius: 10,
                      overflow: "hidden",
                    }}
                  >
                    <Img
                      src={images[i % images.length]}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        transform: `scale(${1.06 - 0.06 * ramp(frame, at, 60, Easing.linear)})`,
                      }}
                    />
                    {i === 1 ? (
                      <span
                        style={{
                          position: "absolute",
                          left: 8,
                          top: 8,
                          height: 24,
                          padding: "0 9px",
                          borderRadius: 7,
                          background: "rgba(255,255,255,0.88)",
                          color: "#1b1714",
                          fontSize: 13,
                          display: "flex",
                          alignItems: "center",
                        }}
                      >
                        New
                      </span>
                    ) : null}
                  </div>
                  <div
                    style={{
                      position: "absolute",
                      left: 14,
                      right: 14,
                      top: imgH + 2,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 17,
                        color: ink,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        letterSpacing: "-0.01em",
                      }}
                    >
                      {p.name}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginTop: 6,
                      }}
                    >
                      <span
                        style={{
                          fontFamily: mono.fontFamily,
                          fontSize: 15,
                          color: muted,
                        }}
                      >
                        {p.price}
                      </span>
                      <span
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          fontSize: 14,
                          color: muted,
                        }}
                      >
                        <span
                          style={{
                            width: 7,
                            height: 7,
                            borderRadius: 4,
                            background: i % 5 === 3 ? faint : "#3fb37f",
                          }}
                        />
                        {i % 5 === 3 ? "Draft" : "Active"}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
}

export default GridToApp;
