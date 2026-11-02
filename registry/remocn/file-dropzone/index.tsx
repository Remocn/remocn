"use client";

import { loadFont as loadGeist } from "@remotion/google-fonts/Geist";
import { loadFont as loadGeistMono } from "@remotion/google-fonts/GeistMono";
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

const geist = loadGeist("normal", {
  weights: ["300", "400"],
  subsets: ["latin"],
});
const geistMono = loadGeistMono("normal", {
  weights: ["400"],
  subsets: ["latin"],
});

export type DropFileType = "pdf" | "png" | "csv" | "doc" | "zip";

export interface DropFile {
  name: string;
  /** Size in bytes. */
  size: number;
  /** Inferred from the extension when omitted. */
  type?: DropFileType;
}

export interface FileDropzoneProps {
  files?: DropFile[];
  title?: string;
  /** Where the files go; shown in the window, the rows and the toast. */
  destination?: string;
  /** Preview used for image files. */
  image?: string;
  accent?: string;
  speed?: number;
  theme?: "light" | "dark";
  ground?: GshPresetId;
  groundParams?: Partial<GradientParams>;
}

const DEFAULT_FILES: DropFile[] = [
  { name: "Q3-board-deck.pdf", size: 4_200_000 },
  { name: "hero-shot@2x.png", size: 1_800_000 },
  { name: "customers-export.csv", size: 640_000 },
];

const BG_ROWS = [
  ["Brand guidelines 2026.pdf", "PDF", "2.1 MB", "Oct 21"],
  ["Interview notes, Leo Park.docx", "DOC", "184 KB", "Oct 20"],
  ["Pricing research.csv", "CSV", "96 KB", "Oct 18"],
  ["Onboarding flow v3.png", "PNG", "3.4 MB", "Oct 17"],
  ["Competitive landscape.pdf", "PDF", "1.2 MB", "Oct 14"],
  ["Support tickets Q3.csv", "CSV", "712 KB", "Oct 12"],
  ["Roadmap review.pdf", "PDF", "880 KB", "Oct 9"],
];

const SPR = {
  heavy: { mass: 1, damping: 26, stiffness: 120 },
  card: { mass: 0.8, damping: 18, stiffness: 160 },
  chip: { mass: 0.5, damping: 12, stiffness: 200 },
  morph: { damping: 200 },
};
const EASE = {
  enter: Easing.bezier(0.32, 0.72, 0, 1),
  soft: Easing.bezier(0.22, 1, 0.36, 1),
  move: Easing.bezier(0.65, 0, 0.35, 1),
  exit: Easing.bezier(0.55, 0, 1, 0.45),
  camera: Easing.bezier(0.87, 0, 0.13, 1),
};
const CL = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const tween = (
  f: number,
  from: number,
  len: number,
  easing: (t: number) => number,
) => interpolate(f, [from, from + len], [0, 1], { ...CL, easing });

const BEAT = {
  window: 0,
  modal: 6,
  cursor: 10,
  hover: 32,
  drop: 46,
};

const HEADER_H = 76;
const DZ_OPEN = 176;
const DZ_SHUT = 108;
const ROW_H = 68;
const FOOTER_H = 76;
const PAD = 24;
const THUMB = { w: 36, h: 44 };
const CARD = { w: 112, h: 140 };
const ARROW =
  "M1 1 L1 18.5 L5.6 14.4 L8.7 21.6 L11.6 20.4 L8.5 13.2 L14.5 13.2 Z";

function withAlpha(color: string, alpha: number) {
  const hex = color.replace("#", "");
  const full = hex.length === 3 ? hex.replace(/(.)/g, "$1$1") : hex;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return color;
  const n = Number.parseInt(full, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

function fileType(f: DropFile): DropFileType {
  if (f.type) return f.type;
  const ext = f.name.split(".").pop()?.toLowerCase() ?? "";
  if (ext === "png" || ext === "jpg" || ext === "jpeg") return "png";
  if (ext === "csv" || ext === "xlsx") return "csv";
  if (ext === "zip") return "zip";
  if (ext === "pdf") return "pdf";
  return "doc";
}

function formatSize(b: number) {
  if (b >= 1_000_000) return `${(b / 1_000_000).toFixed(1)} MB`;
  return `${Math.round(b / 1000)} KB`;
}

const LIGHT = {
  win: "#FCFCFB",
  modal: "#FFFFFF",
  text: "#18181B",
  muted: "#71717A",
  faint: "#A1A1AA",
  line: "rgba(24,24,27,0.08)",
  dash: "rgba(24,24,27,0.2)",
  zone: "#FAFAF9",
  track: "rgba(24,24,27,0.08)",
  ghost: "rgba(24,24,27,0.05)",
  disabledBg: "rgba(24,24,27,0.06)",
  disabledText: "#A1A1AA",
  overlay: "rgba(24,24,27,0.16)",
  toastBg: "#18181B",
  toastText: "#FAFAFA",
  toastMuted: "#A1A1AA",
  winShadow:
    "0 0 0 1px rgba(24,24,27,0.06), 0 2px 6px rgba(24,24,27,0.04), 0 40px 90px -30px rgba(24,24,40,0.35)",
  modalShadow:
    "0 0 0 1px rgba(24,24,27,0.06), 0 2px 4px rgba(24,24,27,0.04), 0 28px 64px -16px rgba(24,24,40,0.3)",
  btnShadow: "0 0 0 1px rgba(24,24,27,0.1), 0 1px 2px rgba(24,24,27,0.06)",
};
const DARK: typeof LIGHT = {
  win: "#0E0F11",
  modal: "#17181B",
  text: "#EDEDEF",
  muted: "#8B8D94",
  faint: "#5A5C63",
  line: "rgba(255,255,255,0.07)",
  dash: "rgba(255,255,255,0.18)",
  zone: "rgba(255,255,255,0.02)",
  track: "rgba(255,255,255,0.08)",
  ghost: "rgba(255,255,255,0.05)",
  disabledBg: "rgba(255,255,255,0.06)",
  disabledText: "#5A5C63",
  overlay: "rgba(0,0,0,0.42)",
  toastBg: "#EDEDEF",
  toastText: "#141517",
  toastMuted: "#6B6D74",
  winShadow:
    "0 0 0 1px rgba(255,255,255,0.08), inset 0 1px 0 rgba(255,255,255,0.05), 0 40px 90px -30px rgba(0,0,0,0.7)",
  modalShadow:
    "0 0 0 1px rgba(255,255,255,0.09), inset 0 1px 0 rgba(255,255,255,0.06), 0 28px 64px -16px rgba(0,0,0,0.7)",
  btnShadow: "0 0 0 1px rgba(255,255,255,0.1)",
};

const LIGHT_GROUND: Partial<GradientParams> = {
  colors: ["#7f9cff", "#b9c6ff", "#e2e6fb", "#3b5bfd"],
  background: "#efeeea",
};

function FilePreview({
  type,
  w,
  h,
  r,
  image,
}: {
  type: DropFileType;
  w: number;
  h: number;
  r: number;
  image: string;
}) {
  const box: React.CSSProperties = {
    position: "relative",
    width: w,
    height: h,
    borderRadius: r,
    overflow: "hidden",
    background: "#FFFFFF",
    flexShrink: 0,
  };
  const edge = (
    <div
      style={{
        position: "absolute",
        inset: 0,
        borderRadius: r,
        boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.1)",
      }}
    />
  );
  if (type === "png") {
    return (
      <div style={box}>
        <Img
          src={image}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
        {edge}
      </div>
    );
  }
  const pad = w * 0.13;
  if (type === "csv") {
    const rows = 9;
    return (
      <div style={box}>
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 0,
            height: h / (rows + 1),
            background: "#EEF1F0",
          }}
        />
        {Array.from({ length: rows }, (_, i) => (
          <div
            key={`r${i}`}
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: ((i + 1) * h) / (rows + 1),
              height: 1,
              background: "rgba(0,0,0,0.07)",
            }}
          />
        ))}
        {[0.38, 0.7].map((x) => (
          <div
            key={`c${x}`}
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              left: w * x,
              width: 1,
              background: "rgba(0,0,0,0.07)",
            }}
          />
        ))}
        {Array.from({ length: rows }, (_, i) => (
          <div
            key={`v${i}`}
            style={{
              position: "absolute",
              left: w * 0.06,
              top: ((i + 1.38) * h) / (rows + 1),
              width: w * (0.18 + ((i * 7) % 5) * 0.025),
              height: Math.max(1.5, h * 0.022),
              borderRadius: 2,
              background: "rgba(0,0,0,0.22)",
            }}
          />
        ))}
        {edge}
      </div>
    );
  }
  const lines = [0.92, 0.86, 0.9, 0.62, 0, 0.88, 0.94, 0.7];
  return (
    <div style={box}>
      <div
        style={{
          position: "absolute",
          left: pad,
          top: pad,
          width: w * 0.5,
          height: Math.max(2, h * 0.045),
          borderRadius: 2,
          background: "#1C1C1F",
        }}
      />
      {lines.map((l, i) =>
        l === 0 ? null : (
          <div
            key={`l${i}`}
            style={{
              position: "absolute",
              left: pad,
              top: pad + h * 0.12 + i * h * 0.055,
              width: (w - pad * 2) * l,
              height: Math.max(1.5, h * 0.022),
              borderRadius: 2,
              background: "rgba(0,0,0,0.16)",
            }}
          />
        ),
      )}
      <div
        style={{
          position: "absolute",
          left: pad,
          right: pad,
          bottom: pad,
          height: h * 0.2,
          borderRadius: 2,
          background: "#E8ECFF",
        }}
      />
      {edge}
    </div>
  );
}

function Icon({
  d,
  size = 20,
  color,
  width = 1.5,
}: {
  d: string;
  size?: number;
  color: string;
  width?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={width}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ display: "block", flexShrink: 0 }}
    >
      <path d={d} />
    </svg>
  );
}

const ICONS = {
  upload:
    "M12 15V4.5M7.5 9L12 4.5 16.5 9M4.5 14.5V18a1.5 1.5 0 001.5 1.5h12a1.5 1.5 0 001.5-1.5v-3.5",
  close: "M6.5 6.5l11 11M17.5 6.5l-11 11",
  check: "M5.5 12.5l4 4 9-9.5",
};

export function FileDropzone({
  files = DEFAULT_FILES,
  title = "Upload files",
  destination = "Research",
  image = staticFile("reel/reel-2.jpg"),
  accent = "#3B5BFD",
  speed = 1,
  theme = "light",
  ground,
  groundParams,
}: FileDropzoneProps) {
  const frame = useCurrentFrame() * speed;
  const { width, height, fps } = useVideoConfig();
  const tall = height > width;
  const SW = tall ? 600 : 1280;
  const SH = tall ? (600 * height) / width : 720;
  const k = width / SW;
  const dark = theme === "dark";
  const c = dark ? DARK : LIGHT;
  const list = files.slice(0, 3);
  const n = list.length;
  const sp = (at: number, config: Record<string, number>) =>
    spring({ frame: frame - at, fps, config });

  const WIN = tall
    ? { x: 20, y: 96, w: SW - 40, h: SH }
    : { x: 120, y: 48, w: SW - 240, h: 616 };
  const MODAL_W = tall ? SW - 40 : 600;
  const modalLeft = (SW - MODAL_W) / 2;
  const centerY = tall ? 480 : SH / 2 - 4;

  const rowAt = list.map((_, i) => BEAT.drop + 4 + i * 4);
  const rowIn = rowAt.map((at) => sp(at, SPR.card));
  const dur = list.map((f) =>
    Math.round(Math.min(50, Math.max(24, 20 + (f.size / 1_000_000) * 7))),
  );
  const startAt = rowAt.map((at) => at + 4);
  const doneAt = list.map((_, i) => startAt[i] + dur[i]);
  const progress = list.map((_, i) =>
    interpolate(
      frame,
      [
        startAt[i],
        startAt[i] + dur[i] * 0.42,
        startAt[i] + dur[i] * 0.62,
        doneAt[i],
      ],
      [0, 0.47, 0.58, 1],
      { ...CL, easing: EASE.move },
    ),
  );
  const allDone = Math.max(...doneAt, BEAT.drop + 10);
  const ENABLE = allDone + 2;
  const TO_BTN = allDone - 12;
  const CLICK = ENABLE + 10;
  const CLOSE = CLICK + 4;
  const TABLE = CLOSE + 4;
  const TOAST = CLOSE + 12;

  const shut = sp(BEAT.drop + 2, SPR.morph);
  const dzH = DZ_OPEN + (DZ_SHUT - DZ_OPEN) * shut;
  const listH = rowIn.reduce((a, b) => a + Math.min(1, b), 0) * ROW_H;
  const modalH = HEADER_H + dzH + 12 + listH + 8 + FOOTER_H;
  const modalTop = centerY - modalH / 2;
  const finalH = HEADER_H + DZ_SHUT + 12 + n * ROW_H + 8 + FOOTER_H;
  const finalTop = centerY - finalH / 2;
  const dzTop = modalTop + HEADER_H;
  const rowsTop = dzTop + dzH + 12;
  const btnW = 168;
  const btn = {
    x: modalLeft + MODAL_W - PAD - btnW / 2,
    y: finalTop + finalH - FOOTER_H / 2,
  };

  const start = tall ? { x: 660, y: 1130 } : { x: 1340, y: 800 };
  const zone = { x: SW / 2 + (tall ? 70 : 120), y: centerY - 76 };
  const aside = { x: zone.x + (tall ? 110 : 190), y: zone.y + 150 };
  const legs = [
    { at: BEAT.cursor, from: start, to: zone, arc: -1 },
    { at: BEAT.drop + 6, from: zone, to: aside, arc: 1 },
    { at: TO_BTN, from: aside, to: btn, arc: -1 },
    { at: CLICK + 12, from: btn, to: { x: btn.x + 46, y: btn.y + 64 }, arc: 1 },
  ];
  const cursorAt = (f: number) => {
    let x = start.x;
    let y = start.y;
    for (const leg of legs) {
      const p = spring({ frame: f - leg.at, fps, config: SPR.heavy });
      const dx = leg.to.x - leg.from.x;
      const dy = leg.to.y - leg.from.y;
      const len = Math.hypot(dx, dy) || 1;
      const bend = Math.sin(clamp01(p) * Math.PI) * Math.min(70, len * 0.16);
      x += dx * p + (-dy / len) * bend * leg.arc;
      y += dy * p + (dx / len) * bend * leg.arc;
    }
    return { x, y };
  };
  const cur = cursorAt(frame);
  const held = cursorAt(Math.min(frame, BEAT.drop) - 2);
  const press = clamp01(sp(CLICK - 2, SPR.chip) - sp(CLICK + 3, SPR.chip));

  const hot = clamp01(sp(BEAT.hover, SPR.card) - sp(BEAT.drop + 2, SPR.card));
  const winIn = sp(BEAT.window, SPR.heavy);
  const winOp = tween(frame, BEAT.window, 10, EASE.enter);
  const modalIn = sp(BEAT.modal, SPR.card);
  const modalOp = tween(frame, BEAT.modal, 8, EASE.enter);
  const close = tween(frame, CLOSE, 8, EASE.exit);
  const dim =
    tween(frame, BEAT.modal, 12, EASE.soft) *
    (1 - tween(frame, CLOSE, 12, EASE.soft));
  const enabled = tween(frame, ENABLE, 6, EASE.enter);
  const toastIn = sp(TOAST, SPR.card);
  const toastOp = tween(frame, TOAST, 6, EASE.enter);
  const cam =
    1 +
    0.035 * tween(frame, 8, 54, EASE.camera) -
    0.035 * tween(frame, CLOSE - 2, 26, EASE.camera);
  const cursorOp = tween(frame, BEAT.cursor, 4, EASE.enter);
  const badge =
    sp(BEAT.cursor + 4, SPR.chip) * (1 - tween(frame, BEAT.drop, 5, EASE.exit));
  const total = list.reduce((a, f) => a + f.size, 0);
  const dzLive = hot > 0.5;

  const table = [
    ...list.map((f, i) => ({
      cells: [
        f.name,
        fileType(f).toUpperCase(),
        formatSize(f.size),
        "Just now",
      ],
      fresh: i,
    })),
    ...BG_ROWS.map((cells) => ({ cells, fresh: -1 })),
  ];
  const cols = tall
    ? [
        { i: 0, w: 0 },
        { i: 2, w: 110 },
      ]
    : [
        { i: 0, w: 0 },
        { i: 1, w: 120 },
        { i: 2, w: 120 },
        { i: 3, w: 130 },
      ];
  const tint = 1 - tween(frame, TABLE + 24, 40, EASE.soft);

  return (
    <AbsoluteFill
      style={{
        fontFamily: geist.fontFamily,
        WebkitFontSmoothing: "antialiased",
        overflow: "hidden",
      }}
    >
      <GshGround
        preset={ground ?? (dark ? "earthshine" : "paper-crease")}
        params={groundParams ?? (dark ? undefined : LIGHT_GROUND)}
        timeOffset={3}
        timeScale={0.5}
      />
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: SW,
          height: SH,
          transform: `scale(${k})`,
          transformOrigin: "0 0",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            transform: `scale(${cam})`,
            transformOrigin: `${SW / 2}px ${centerY}px`,
          }}
        >
          <div
            style={{
              position: "absolute",
              left: WIN.x,
              top: WIN.y,
              width: WIN.w,
              height: WIN.h,
              borderRadius: 18,
              overflow: "hidden",
              background: c.win,
              boxShadow: c.winShadow,
              opacity: winOp,
              transform: `translateY(${(1 - winIn) * 40}px)`,
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                padding: tall ? "32px 28px" : "36px 40px",
                filter: `blur(${dim * 2}px)`,
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-end" }}>
                <div>
                  <div style={{ fontSize: 16, color: c.muted }}>Library</div>
                  <div
                    style={{
                      fontSize: 30,
                      fontWeight: 400,
                      letterSpacing: "-0.025em",
                      color: c.text,
                      marginTop: 6,
                    }}
                  >
                    {destination}
                  </div>
                </div>
                <div
                  style={{
                    marginLeft: "auto",
                    height: 40,
                    padding: "0 16px",
                    borderRadius: 10,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    fontSize: 16,
                    color: c.text,
                    boxShadow: c.btnShadow,
                  }}
                >
                  <Icon d={ICONS.upload} size={18} color={c.text} />
                  Upload
                </div>
              </div>
              <div style={{ marginTop: 30 }}>
                <div
                  style={{
                    display: "flex",
                    height: 40,
                    alignItems: "center",
                    fontSize: 16,
                    color: c.muted,
                    borderBottom: `1px solid ${c.line}`,
                  }}
                >
                  {cols.map((col) => (
                    <span
                      key={col.i}
                      style={col.w ? { width: col.w } : { flex: 1 }}
                    >
                      {["Name", "Kind", "Size", "Added"][col.i]}
                    </span>
                  ))}
                </div>
                {table.map((r) => {
                  const fresh = r.fresh >= 0;
                  const p = fresh ? sp(TABLE + r.fresh * 4, SPR.card) : 1;
                  const hgt = 54 * Math.min(1, p);
                  if (fresh && hgt <= 0.01) return null;
                  return (
                    <div
                      key={r.cells[0]}
                      style={{
                        height: hgt,
                        overflow: "hidden",
                        borderBottom: `1px solid ${c.line}`,
                        background: fresh
                          ? withAlpha(accent, (dark ? 0.12 : 0.07) * tint)
                          : "transparent",
                        margin: "0 -12px",
                        padding: "0 12px",
                        borderRadius: 8,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          height: 54,
                          fontSize: 17,
                          color: c.text,
                          opacity: fresh ? clamp01(p * 1.4 - 0.3) : 1,
                          transform: `translateY(${(1 - p) * -10}px)`,
                        }}
                      >
                        {cols.map((col) => (
                          <span
                            key={col.i}
                            style={{
                              ...(col.w ? { width: col.w } : { flex: 1 }),
                              color: col.i === 0 ? c.text : c.muted,
                              fontFamily:
                                col.i === 2 ? geistMono.fontFamily : undefined,
                              fontSize: col.i === 2 ? 15.5 : 17,
                              fontVariantNumeric: "tabular-nums",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              paddingRight: col.i === 0 ? 16 : 0,
                            }}
                          >
                            {col.i === 3 && fresh ? (
                              <span style={{ color: accent }}>
                                {r.cells[3]}
                              </span>
                            ) : (
                              r.cells[col.i]
                            )}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: c.overlay,
                opacity: dim,
              }}
            />
          </div>

          <div
            style={{
              position: "absolute",
              left: modalLeft,
              top: modalTop,
              width: MODAL_W,
              height: modalH,
              borderRadius: 20,
              background: c.modal,
              boxShadow: c.modalShadow,
              overflow: "hidden",
              opacity: modalOp * (1 - close),
              transform: `translateY(${(1 - modalIn) * 18 + close * 10}px) scale(${(0.97 + 0.03 * modalIn) * (1 - 0.03 * close)})`,
            }}
          >
            <div
              style={{
                height: HEADER_H,
                display: "flex",
                alignItems: "center",
                padding: `0 ${PAD}px`,
              }}
            >
              <div
                style={{
                  fontSize: 21,
                  letterSpacing: "-0.015em",
                  color: c.text,
                }}
              >
                {title}
              </div>
              <div style={{ marginLeft: "auto" }}>
                <Icon d={ICONS.close} size={20} color={c.muted} />
              </div>
            </div>
            <div
              style={{
                position: "relative",
                margin: `0 ${PAD}px`,
                height: dzH,
                borderRadius: 12,
                background: dzLive ? withAlpha(accent, 0.06) : c.zone,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
              }}
            >
              <svg
                width="100%"
                height="100%"
                style={{ position: "absolute", inset: 0 }}
                aria-hidden
              >
                <rect
                  x={0.5}
                  y={0.5}
                  width={MODAL_W - PAD * 2 - 1}
                  height={dzH - 1}
                  rx={11.5}
                  fill="none"
                  stroke={
                    hot > 0.02 ? withAlpha(accent, 0.3 + 0.7 * hot) : c.dash
                  }
                  strokeWidth={1}
                  strokeDasharray={dzLive ? undefined : "5 5"}
                />
              </svg>
              <div
                style={{
                  transform: `translateY(${-hot * 4}px)`,
                }}
              >
                <Icon
                  d={ICONS.upload}
                  size={26}
                  color={hot > 0.5 ? accent : c.muted}
                />
              </div>
              <div style={{ fontSize: 17, color: c.text }}>
                {dzLive ? (
                  <span style={{ color: accent }}>Release to upload</span>
                ) : (
                  <>
                    Drop files here or{" "}
                    <span style={{ color: accent }}>browse</span>
                  </>
                )}
              </div>
              <div
                style={{
                  fontSize: 16,
                  color: c.muted,
                  opacity: 1 - shut,
                  height: 22 * (1 - shut),
                  overflow: "hidden",
                }}
              >
                PDF, PNG or CSV, up to 50 MB
              </div>
            </div>
            <div
              style={{
                position: "relative",
                margin: `12px ${PAD}px 0`,
                height: listH,
              }}
            >
              {list.map((f, i) => {
                const p = progress[i];
                const done = frame >= doneAt[i];
                const tick = tween(frame, doneAt[i], 8, EASE.enter);
                const before = rowIn
                  .slice(0, i)
                  .reduce((a, b) => a + Math.min(1, b), 0);
                const fly = sp(BEAT.drop + i * 3, SPR.card);
                return (
                  <div
                    key={f.name}
                    style={{
                      position: "absolute",
                      left: 0,
                      right: 0,
                      top: before * ROW_H,
                      height: ROW_H,
                      display: "flex",
                      alignItems: "center",
                      gap: 14,
                      borderTop: i > 0 ? `1px solid ${c.line}` : "none",
                      opacity: clamp01(rowIn[i] * 1.6),
                    }}
                  >
                    <div style={{ opacity: clamp01((fly - 0.82) / 0.18) }}>
                      <FilePreview
                        type={fileType(f)}
                        w={THUMB.w}
                        h={THUMB.h}
                        r={6}
                        image={image}
                      />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "baseline",
                          fontSize: 17,
                          color: c.text,
                        }}
                      >
                        <span
                          style={{
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {f.name}
                        </span>
                        <span
                          style={{
                            marginLeft: "auto",
                            paddingLeft: 12,
                            fontFamily: geistMono.fontFamily,
                            fontSize: 15.5,
                            color: c.muted,
                            fontVariantNumeric: "tabular-nums",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {done
                            ? formatSize(f.size)
                            : `${Math.round(p * 100)}%`}
                        </span>
                      </div>
                      <div
                        style={{
                          height: 2,
                          borderRadius: 1,
                          background: c.track,
                          marginTop: 10,
                          overflow: "hidden",
                          opacity: 1 - tick,
                        }}
                      >
                        <div
                          style={{
                            width: `${p * 100}%`,
                            height: "100%",
                            background: accent,
                          }}
                        />
                      </div>
                    </div>
                    <div
                      style={{
                        width: 22,
                        display: "flex",
                        justifyContent: "flex-end",
                      }}
                    >
                      <svg
                        width={22}
                        height={22}
                        viewBox="0 0 24 24"
                        style={{ opacity: done ? 1 : 0 }}
                        aria-hidden
                      >
                        <path
                          d={ICONS.check}
                          fill="none"
                          stroke={accent}
                          strokeWidth={1.75}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeDasharray={20}
                          strokeDashoffset={20 * (1 - tick)}
                        />
                      </svg>
                    </div>
                  </div>
                );
              })}
            </div>
            <div
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                bottom: 0,
                height: FOOTER_H,
                borderTop: `1px solid ${c.line}`,
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: `0 ${PAD}px`,
              }}
            >
              <span
                style={{
                  fontFamily: geistMono.fontFamily,
                  fontSize: 15.5,
                  color: c.muted,
                  fontVariantNumeric: "tabular-nums",
                  opacity: clamp01(rowIn[0] ?? 0),
                }}
              >
                {n} files · {formatSize(total)}
              </span>
              <div
                style={{
                  marginLeft: "auto",
                  height: 42,
                  padding: "0 18px",
                  borderRadius: 10,
                  display: "flex",
                  alignItems: "center",
                  fontSize: 16,
                  color: c.text,
                  boxShadow: c.btnShadow,
                }}
              >
                Cancel
              </div>
              <div
                style={{
                  position: "relative",
                  width: btnW,
                  height: 42,
                  borderRadius: 10,
                  overflow: "hidden",
                  background: c.disabledBg,
                  transform: `scale(${1 - 0.04 * press})`,
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: accent,
                    opacity: enabled,
                    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.16)",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 16,
                    color: enabled > 0.5 ? "#FFFFFF" : c.disabledText,
                  }}
                >
                  Upload {n} files
                </div>
              </div>
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              left: SW / 2 - (tall ? 250 : 230),
              top: tall ? SH - 150 : WIN.y + WIN.h - 92,
              width: tall ? 500 : 460,
              height: 60,
              borderRadius: 14,
              background: c.toastBg,
              boxShadow: dark
                ? "0 18px 40px -12px rgba(0,0,0,0.6)"
                : "0 2px 6px rgba(24,24,27,0.1), 0 18px 40px -12px rgba(24,24,40,0.45)",
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "0 18px",
              boxSizing: "border-box",
              opacity: toastOp,
              transform: `translateY(${(1 - toastIn) * 28}px) scale(${0.97 + 0.03 * toastIn})`,
            }}
          >
            <Icon d={ICONS.check} size={20} color={c.toastText} width={1.75} />
            <span style={{ fontSize: 17, color: c.toastText }}>
              {n} files added to {destination}
            </span>
            <span
              style={{ marginLeft: "auto", fontSize: 16, color: c.toastMuted }}
            >
              View
            </span>
          </div>

          {list.map((f, i) => {
            const kk = i - (n - 1) / 2;
            const appear = sp(BEAT.cursor + i * 2, SPR.card);
            const rest = {
              x: held.x + 44 + kk * 20,
              y: held.y + 62 + Math.abs(kk) * 6,
            };
            const target = {
              x: modalLeft + PAD + THUMB.w / 2,
              y: rowsTop + i * ROW_H + ROW_H / 2,
            };
            const fly = sp(BEAT.drop + i * 3, SPR.card);
            const x = rest.x + (target.x - rest.x) * fly;
            const y = rest.y + (target.y - rest.y) * fly;
            const s = (1 - fly * (1 - THUMB.w / CARD.w)) * (0.9 + 0.1 * appear);
            const rot = kk * 8 * (1 - fly);
            const o = clamp01(appear * 2) * (1 - clamp01((fly - 0.82) / 0.18));
            if (o <= 0.001) return null;
            return (
              <div
                key={f.name}
                style={{
                  position: "absolute",
                  left: x - CARD.w / 2,
                  top: y - CARD.h / 2,
                  opacity: o,
                  transform: `rotate(${rot}deg) scale(${s})`,
                  borderRadius: 10,
                  boxShadow: `0 1px 2px rgba(0,0,0,0.12), 0 ${16 * (1 - fly) + 4}px ${30 * (1 - fly) + 8}px -6px rgba(10,12,30,${0.4 * (1 - fly) + 0.1})`,
                  zIndex: i === 1 ? 3 : 2,
                }}
              >
                <FilePreview
                  type={fileType(f)}
                  w={CARD.w}
                  h={CARD.h}
                  r={10}
                  image={image}
                />
              </div>
            );
          })}
          {badge > 0.01 ? (
            <div
              style={{
                position: "absolute",
                left: cur.x + 92,
                top: cur.y + 4,
                width: 28,
                height: 28,
                borderRadius: 14,
                background: accent,
                color: "#FFFFFF",
                fontSize: 16,
                fontFamily: geistMono.fontFamily,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 10px -2px rgba(10,12,30,0.35)",
                transform: `scale(${badge})`,
                zIndex: 4,
              }}
            >
              {n}
            </div>
          ) : null}
          <svg
            width={26}
            height={26}
            viewBox="0 0 24 24"
            style={{
              position: "absolute",
              left: cur.x,
              top: cur.y,
              overflow: "visible",
              opacity: cursorOp,
              transform: `scale(${1 - 0.04 * press})`,
              transformOrigin: "2px 2px",
              filter: "drop-shadow(0 2px 3px rgba(0,0,0,0.3))",
              zIndex: 5,
            }}
            aria-hidden
          >
            <path
              d={ARROW}
              fill="#FFFFFF"
              stroke="#111111"
              strokeWidth={1.1}
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>
    </AbsoluteFill>
  );
}
