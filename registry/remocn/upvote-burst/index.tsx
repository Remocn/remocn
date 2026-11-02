"use client";

import { loadFont } from "@remotion/google-fonts/Geist";
import { loadFont as loadMono } from "@remotion/google-fonts/GeistMono";
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

const { fontFamily } = loadFont("normal", {
  weights: ["300", "400"],
  subsets: ["latin"],
});
const { fontFamily: mono } = loadMono("normal", {
  weights: ["400"],
  subsets: ["latin"],
});

type ThumbGlyph = "play" | "wave" | "bolt" | "ring" | "grid" | "spark";

export interface UpvoteProduct {
  name: string;
  tagline: string;
  topic: string;
  comments?: number;
  color?: string;
  glyph?: ThumbGlyph;
  src?: string;
}

export interface UpvoteRival extends UpvoteProduct {
  votes: number;
}

export interface UpvoteBurstProps {
  product?: UpvoteProduct;
  rivals?: UpvoteRival[];
  startRank?: number;
  startVotes?: number;
  endVotes?: number;
  title?: string;
  dateLabel?: string;
  badgeLabel?: string;
  theme?: "light" | "dark";
  accent?: string;
  speed?: number;
  ground?: GshPresetId;
  groundParams?: Partial<GradientParams>;
}

const DEFAULT_PRODUCT: UpvoteProduct = {
  name: "remocn",
  tagline: "Launch videos from copy-paste Remotion components",
  topic: "Video",
  comments: 96,
};

const r = (
  name: string,
  tagline: string,
  topic: string,
  votes: number,
  comments: number,
  color: string,
): UpvoteRival => ({ name, tagline, topic, votes, comments, color });

// biome-ignore format: compact data table
const DEFAULT_RIVALS: UpvoteRival[] = [
  r("Halcyon", "Meeting notes that draft your follow-ups", "Productivity", 1184, 142, "#C9A27A"),
  r("Quarry", "Query any database in plain English", "Developer tools", 962, 88, "#8EA6A0"),
  r("Orbitly", "The calendar for teams across time zones", "Productivity", 731, 64, "#9AA3C2"),
  r("Tessel", "Design tokens that sync straight to code", "Design tools", 548, 41, "#C2A0A8"),
  r("Fernway", "Expense reports that file themselves", "Fintech", 297, 23, "#A3B08A"),
];

const REMOCN_R_PATH =
  "M 0.01 0.81 C 0.01 1.73, 0.36 2.79, 1.09 4.13 C 4.91 11.04, 13.45 17.16, 21.7 18.9 C 22.94 19.16, 23.18 19.16, 51.39 19.27 C 76.07 19.36, 80.02 19.4, 81.32 19.57 C 89.89 20.69, 96.2 24.68, 99.38 31.01 C 103.19 38.56, 102.53 50.1, 97.91 57.07 C 94.66 61.96, 89.68 64.99, 83.26 66 C 82.81 66.07, 70.18 66.83, 55.2 67.69 C 24.82 69.43, 27.03 69.23, 24.18 70.4 C 19.9 72.15, 14.84 75.7, 10.65 79.89 C 4.86 85.68, 1.3 91.91, 0.25 98.13 C 0.12 98.85, 0.08 103.13, 0.04 116.66 L 0 134.26 9.5 134.26 L 19 134.26 19.05 119.41 C 19.1 103.27, 19.08 103.82, 19.82 101.04 C 21.79 93.65, 27.86 88.75, 36.45 87.63 C 37.23 87.53, 39.41 87.5, 43.57 87.53 C 50.12 87.59, 50.75 87.65, 53.22 88.45 C 56.61 89.56, 59.67 91.86, 62.02 95.07 C 62.52 95.76, 69.35 103.85, 77.2 113.07 C 85.04 122.28, 91.63 130.04, 91.85 130.32 C 92.07 130.59, 92.5 131.34, 92.82 131.97 C 93.52 133.35, 94.11 133.93, 95.06 134.13 C 95.5 134.23, 98.97 134.26, 106.36 134.23 L 117.01 134.19 100.82 113.07 C 91.91 101.45, 84.52 91.78, 84.39 91.57 C 83.36 89.89, 83.66 87.53, 85.09 86 C 85.79 85.25, 86.36 84.94, 88.07 84.38 C 96.18 81.72, 104.15 76.62, 109.97 70.36 C 120.59 58.93, 124.06 44.32, 119.44 30.43 C 114.59 15.81, 101.93 4.02, 87.64 0.83 C 83.93 0.01, 88.09 0.08, 41.85 0.04 L 0.01 0 0.01 0.81 Z";

const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;
const ENTER = Easing.bezier(0.32, 0.72, 0, 1);
const MOVE = Easing.bezier(0.65, 0, 0.35, 1);
const EXIT = Easing.bezier(0.55, 0, 1, 0.45);
const CAM = Easing.bezier(0.87, 0, 0.13, 1);
const HEAVY = { mass: 1, damping: 26, stiffness: 120 };
const CARD = { mass: 0.8, damping: 18, stiffness: 160 };
const CHIP = { mass: 0.5, damping: 12, stiffness: 200 };

const BEAT = {
  sheet: 0,
  rows: 4,
  cursor: 6,
  press: 18,
  countFrom: 24,
  countTo: 60,
  clearPad: 12,
};

function hexToRgba(hex: string, a: number) {
  const h = hex.replace("#", "");
  const full =
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h.slice(0, 6);
  const v = Number.parseInt(full, 16);
  return `rgba(${(v >> 16) & 255}, ${(v >> 8) & 255}, ${v & 255}, ${a})`;
}

interface Palette {
  ink: string;
  muted: string;
  faint: string;
  sheet: string;
  sheetShadow: string;
  raised: string;
  raisedShadow: string;
  hairline: string;
  boxBorder: string;
  tileInk: string;
}

function Thumb({
  item,
  isProduct,
  accent,
  pal,
}: {
  item: UpvoteProduct;
  isProduct: boolean;
  accent: string;
  pal: Palette;
}) {
  const box: React.CSSProperties = {
    width: 44,
    height: 44,
    borderRadius: 10,
    flexShrink: 0,
  };
  if (item.src) {
    return (
      <Img
        src={item.src}
        style={{
          ...box,
          objectFit: "cover",
          outline: `1px solid ${pal.hairline}`,
          outlineOffset: -1,
        }}
      />
    );
  }
  if (isProduct) {
    return (
      <div
        style={{
          ...box,
          background: accent,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.22)",
        }}
      >
        <svg viewBox="0 0 124.06 134.26" height={18} aria-hidden>
          <path fill="#fff" d={REMOCN_R_PATH} />
        </svg>
      </div>
    );
  }
  const tone = item.color ?? "#9AA3B5";
  return (
    <div
      style={{
        ...box,
        background: hexToRgba(tone, 0.22),
        boxShadow: `inset 0 0 0 1px ${hexToRgba(tone, 0.35)}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 20,
        fontWeight: 400,
        color: pal.tileInk,
        letterSpacing: "-0.02em",
      }}
    >
      {item.name.slice(0, 1)}
    </div>
  );
}

function Odometer({ value, color }: { value: number; color: string }) {
  const lh = 20;
  const digits = String(Math.floor(value)).split("");
  const nodes: React.ReactNode[] = [];
  digits.forEach((_, di) => {
    const place = digits.length - 1 - di;
    const unit = 10 ** place;
    let pos = Math.floor(value / unit) % 10;
    const rem = value % unit;
    if (place > 0 && rem > unit - 1) pos += rem - (unit - 1);
    nodes.push(
      <span key={`d${place}`} style={{ height: lh, overflow: "hidden" }}>
        <span
          style={{ display: "block", transform: `translateY(${-pos * lh}px)` }}
        >
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((n, idx) => (
            <span
              key={`${place}-${idx}`}
              style={{ display: "block", height: lh }}
            >
              {n}
            </span>
          ))}
        </span>
      </span>,
    );
    if (place > 0 && place % 3 === 0)
      nodes.push(<span key={`c${place}`}>,</span>);
  });
  return (
    <span
      style={{
        display: "inline-flex",
        fontFamily: mono,
        fontSize: 16,
        lineHeight: `${lh}px`,
        color,
        fontVariantNumeric: "tabular-nums",
        fontWeight: 400,
        letterSpacing: "-0.02em",
      }}
    >
      {nodes}
    </span>
  );
}

function Chevron({ color }: { color: string }) {
  return (
    <svg width={14} height={10} viewBox="0 0 14 10" aria-hidden>
      <path
        d="M2 8 7 2.6 12 8"
        fill="none"
        stroke={color}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Badge({
  accent,
  label,
  sub,
  id,
}: {
  accent: string;
  label: string;
  sub: string;
  id: string;
}) {
  const R = 124;
  const tr = R - 26;
  return (
    <svg width={R * 2} height={R * 2} style={{ overflow: "visible" }}>
      <defs>
        <radialGradient id={`${id}-face`} cx="0.35" cy="0.28" r="0.9">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.28" />
          <stop offset="0.55" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
        <path
          id={`${id}-top`}
          d={`M ${R - tr},${R} A ${tr} ${tr} 0 0 1 ${R + tr},${R}`}
        />
        <path
          id={`${id}-bot`}
          d={`M ${R - tr - 12},${R} A ${tr + 12} ${tr + 12} 0 0 0 ${R + tr + 12},${R}`}
        />
      </defs>
      <circle
        cx={R}
        cy={R + 14}
        r={R - 6}
        fill="#0a0d24"
        opacity={0.28}
        style={{ filter: "blur(18px)" }}
      />
      <circle cx={R} cy={R} r={R} fill={accent} />
      <circle cx={R} cy={R} r={R} fill={`url(#${id}-face)`} />
      <circle
        cx={R}
        cy={R}
        r={R - 1}
        fill="none"
        stroke="#fff"
        strokeOpacity={0.3}
      />
      <circle
        cx={R}
        cy={R}
        r={R - 44}
        fill="none"
        stroke="#fff"
        strokeOpacity={0.35}
      />
      <text
        fill="#fff"
        fontFamily={mono}
        fontSize={16}
        fontWeight={400}
        letterSpacing={3.2}
      >
        <textPath
          href={`#${id}-top`}
          startOffset="50%"
          textAnchor="middle"
          style={{ textTransform: "uppercase" }}
        >
          {label}
        </textPath>
      </text>
      <text
        fill="#fff"
        fillOpacity={0.78}
        fontFamily={mono}
        fontSize={16}
        fontWeight={400}
        letterSpacing={3.2}
      >
        <textPath
          href={`#${id}-bot`}
          startOffset="50%"
          textAnchor="middle"
          style={{ textTransform: "uppercase" }}
        >
          {sub}
        </textPath>
      </text>
      <text
        x={R - 4}
        y={R + 30}
        textAnchor="middle"
        fill="#fff"
        fontFamily={fontFamily}
        fontSize={92}
        fontWeight={300}
        letterSpacing={-4}
      >
        #1
      </text>
    </svg>
  );
}

function Cursor() {
  return (
    <svg
      width={26}
      height={30}
      viewBox="0 0 26 30"
      style={{ overflow: "visible", display: "block" }}
      aria-hidden
    >
      <path
        d="M3 2.5v21.2l5.7-5.4 3.7 8.6 3.9-1.7-3.7-8.4h7.9z"
        fill="#0d0f14"
        stroke="#fff"
        strokeWidth={1.6}
        strokeLinejoin="round"
        style={{ filter: "drop-shadow(0 3px 6px rgba(0,0,0,0.3))" }}
      />
    </svg>
  );
}

export function UpvoteBurst({
  product = DEFAULT_PRODUCT,
  rivals = DEFAULT_RIVALS,
  startRank = 5,
  startVotes = 412,
  endVotes = 1342,
  title = "Top products launching today",
  dateLabel = "Thu, Oct 23",
  badgeLabel = "Product of the day",
  theme = "light",
  accent = "#3B5BFD",
  speed = 1,
  ground,
  groundParams,
}: UpvoteBurstProps) {
  const rawFrame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const frame = rawFrame * speed;
  const tall = height > width;
  const stageW = tall ? 820 : 1280;
  const k = width / stageW;
  const stageH = height / k;
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const dark = theme === "dark";
  const pal: Palette = dark
    ? {
        ink: "#F4F5F8",
        muted: "rgba(236,239,247,0.62)",
        faint: "rgba(236,239,247,0.42)",
        sheet: "rgba(14,16,24,0.86)",
        sheetShadow:
          "0 0 0 1px rgba(255,255,255,0.09), inset 0 1px 0 rgba(255,255,255,0.06), 0 30px 80px -20px rgba(0,0,0,0.7)",
        raised: "#1A1D28",
        raisedShadow:
          "0 0 0 1px rgba(255,255,255,0.12), inset 0 1px 0 rgba(255,255,255,0.07)",
        hairline: "rgba(255,255,255,0.07)",
        boxBorder: "rgba(255,255,255,0.13)",
        tileInk: "#F4F5F8",
      }
    : {
        ink: "#14161D",
        muted: "#474C59",
        faint: "#8A8F9C",
        sheet: "rgba(255,255,255,0.94)",
        sheetShadow:
          "0 0 0 1px rgba(16,20,40,0.06), 0 2px 4px rgba(16,20,40,0.04), 0 24px 60px -18px rgba(16,24,64,0.28)",
        raised: "#FFFFFF",
        raisedShadow:
          "0 0 0 1px rgba(16,20,40,0.07), 0 2px 4px rgba(16,20,40,0.05), 0 14px 30px -12px rgba(16,24,64,0.22)",
        hairline: "rgba(16,20,40,0.07)",
        boxBorder: "rgba(16,20,40,0.12)",
        tileInk: "#2A2E38",
      };
  const sp = (from: number, config: typeof CARD) =>
    spring({ frame: frame - from, fps, config });

  const sRank = Math.max(1, Math.min(startRank, rivals.length + 1));
  const rowH = 68;
  const pad = 8;
  const headerH = 66;
  const sheetW = 700;
  const sheetH = pad * 2 + headerH + (rivals.length + 1) * rowH;
  const sheetX = (stageW - sheetW) / 2;
  const sheetY = (stageH - sheetH) / 2;
  const listTop = sheetY + pad + headerH;
  const rowX = sheetX + pad;
  const rowW = sheetW - pad * 2;

  const votesAt = (f: number) =>
    interpolate(f, [BEAT.countFrom, BEAT.countTo], [startVotes, endVotes], {
      ...CLAMP,
      easing: MOVE,
    });
  const rivalVotesAt = (i: number, f: number) =>
    rivals[i].votes +
    Math.floor(Math.max(0, f) * (0.03 + ((i * 37) % 5) * 0.012));
  const productVotes = votesAt(frame);
  const crossAt: (number | null)[] = rivals.map((_, i) => {
    if (i >= sRank - 1) return null;
    for (let f = BEAT.countFrom; f <= BEAT.countTo + 1; f++) {
      if (votesAt(f) > rivalVotesAt(i, f)) return f;
    }
    return null;
  });
  const swap = (c: number) => sp(c, CARD);
  const passed = crossAt.filter((c) => c !== null && frame >= c + 3).length;
  const lastCross = Math.max(BEAT.countFrom, ...crossAt.map((c) => c ?? 0));
  const reachedTop = crossAt.slice(0, sRank - 1).every((c) => c !== null);

  const pressS = sp(BEAT.press, CHIP);
  const press =
    frame < BEAT.press
      ? 1
      : 0.96 +
        0.04 *
          interpolate(frame - BEAT.press, [0, 3], [0, 1], CLAMP) *
          Math.min(1, pressS);
  const fill = sp(BEAT.press, CARD);
  const dim = reachedTop
    ? interpolate(frame, [lastCross + 4, lastCross + 14], [0, 1], {
        ...CLAMP,
        easing: ENTER,
      })
    : 0;
  const clearAt = Math.max(BEAT.countTo, lastCross) + BEAT.clearPad;
  const stampAt = clearAt + 4;
  const stamp = sp(stampAt, CARD);
  const tl = frame - (stampAt + 5);
  const shake = tl >= 0 ? 3 * Math.exp(-tl / 3) : 0;
  const captionIn = (d: number) =>
    interpolate(frame, [stampAt + 8 + d, stampAt + 22 + d], [0, 1], {
      ...CLAMP,
      easing: ENTER,
    });
  const sheetIn = sp(BEAT.sheet, HEAVY);
  const sheetOut = interpolate(frame, [clearAt, clearAt + 10], [0, 1], {
    ...CLAMP,
    easing: EXIT,
  });
  const ripple = interpolate(frame - BEAT.press, [0, 14], [0, 1], {
    ...CLAMP,
    easing: ENTER,
  });
  const ring = interpolate(frame, [stampAt + 3, stampAt + 24], [0, 1], {
    ...CLAMP,
    easing: ENTER,
  });
  const push = interpolate(frame, [0, 135], [1, 1.03], CLAMP);
  const camIn = interpolate(frame, [0, 30], [1.04, 1], {
    ...CLAMP,
    easing: CAM,
  });

  const rows = [
    ...rivals.map((item, i) => ({
      item: item as UpvoteProduct,
      ri: i,
      slot: i < sRank - 1 ? i : i + 1,
    })),
    { item: product, ri: -1, slot: sRank - 1 },
  ];

  const voteX = rowX + rowW - 12 - 30;
  const voteY0 = listTop + (sRank - 1) * rowH + rowH / 2;
  const cur = interpolate(frame, [BEAT.cursor, BEAT.press - 1], [0, 1], {
    ...CLAMP,
    easing: MOVE,
  });
  const curFrom = { x: sheetX + sheetW + 150, y: sheetY + sheetH + 40 };
  const curX = curFrom.x + (voteX + 4 - curFrom.x) * cur;
  const curY =
    curFrom.y + (voteY0 + 6 - curFrom.y) * cur - Math.sin(Math.PI * cur) * 70;
  const curShow =
    interpolate(frame, [BEAT.cursor, BEAT.cursor + 6], [0, 1], CLAMP) *
    interpolate(frame, [BEAT.press + 12, BEAT.press + 20], [1, 0], {
      ...CLAMP,
      easing: EXIT,
    });
  const curLeave = interpolate(
    frame,
    [BEAT.press + 10, BEAT.press + 20],
    [0, 1],
    {
      ...CLAMP,
      easing: EXIT,
    },
  );

  const badgeC = tall
    ? { x: stageW / 2, y: stageH * 0.4 }
    : { x: 360, y: stageH / 2 };
  const capStyle: React.CSSProperties = tall
    ? {
        left: 40,
        right: 40,
        top: badgeC.y + 180,
        textAlign: "center",
      }
    : { left: 540, width: 620, top: stageH / 2 - 70, textAlign: "left" };

  return (
    <AbsoluteFill style={{ overflow: "hidden", fontFamily }}>
      <GshGround
        preset={ground ?? (dark ? "cobalt-rise" : "paper-crease")}
        params={groundParams}
        timeOffset={4}
        timeScale={0.4}
      />
      {dark ? (
        <AbsoluteFill
          style={{
            background:
              "radial-gradient(70% 60% at 50% 40%, rgba(4,6,16,0.55), rgba(4,6,16,0) 100%)",
          }}
        />
      ) : null}
      <div
        style={{
          position: "absolute",
          width: stageW,
          height: stageH,
          transform: `scale(${k * push * camIn}) translate(${shake * Math.sin(tl * 2.9)}px, ${shake * 0.7 * Math.cos(tl * 3.7)}px)`,
          transformOrigin: `${stageW / 2}px ${stageH / 2}px`,
          left: (width - stageW) / 2,
          top: (height - stageH) / 2,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: sheetX,
            top: sheetY,
            width: sheetW,
            height: sheetH,
            borderRadius: 20,
            background: pal.sheet,
            boxShadow: pal.sheetShadow,
            opacity: Math.min(1, sheetIn * 1.4) * (1 - sheetOut),
            transform: `translateY(${(1 - sheetIn) * 60 + sheetOut * 24}px) scale(${0.97 + 0.03 * sheetIn - sheetOut * 0.03})`,
            filter: sheetOut > 0 ? `blur(${sheetOut * 6}px)` : undefined,
          }}
        >
          <div
            style={{
              position: "absolute",
              left: pad + 16,
              right: pad + 16,
              top: pad,
              height: headerH,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderBottom: `1px solid ${pal.hairline}`,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: 14,
              }}
            >
              <span
                style={{
                  fontSize: 22,
                  fontWeight: 400,
                  color: pal.ink,
                  letterSpacing: "-0.02em",
                }}
              >
                {title}
              </span>
              <span
                style={{ fontFamily: mono, fontSize: 16, color: pal.faint }}
              >
                {dateLabel}
              </span>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontFamily: mono,
                fontSize: 16,
                color: pal.muted,
              }}
            >
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: 9,
                  background: "#2FB36B",
                  boxShadow: `0 0 0 ${3 + 2 * Math.sin(frame / 5)}px rgba(47,179,107,0.18)`,
                }}
              />
              Live
            </div>
          </div>
        </div>

        {rows.map(({ item, ri, slot }) => {
          const isProduct = ri < 0;
          let y = listTop + slot * rowH;
          let rank = slot + 1;
          let lift = 0;
          let bump = 0;
          if (isProduct) {
            for (const c of crossAt) {
              if (c === null) continue;
              const s = swap(c);
              y -= s * rowH;
              lift = Math.max(lift, Math.sin(Math.PI * Math.min(1, s)));
              bump = Math.max(
                bump,
                interpolate(frame - c, [0, 4, 12], [0, 1, 0], CLAMP),
              );
            }
            rank = sRank - passed;
          } else {
            const c = crossAt[ri];
            if (c !== null) {
              y += swap(c) * rowH;
              if (frame >= c + 3) rank += 1;
            }
          }
          const rowIn = sp(BEAT.rows + slot * 2, CARD);
          const t0 = clearAt + (isProduct ? 2 : (rivals.length - slot) * 1);
          const out = interpolate(frame, [t0, t0 + 8], [0, 1], {
            ...CLAMP,
            easing: EXIT,
          });
          const isLast = slot === rivals.length;
          const voteBorder = isProduct
            ? hexToRgba(accent, Math.min(1, fill))
            : pal.boxBorder;

          return (
            <div
              key={isProduct ? "product" : `${item.name}-${ri}`}
              style={{
                position: "absolute",
                left: rowX,
                width: rowW,
                top: y,
                height: rowH,
                zIndex: isProduct ? 10 : 1,
                opacity:
                  Math.min(1, rowIn * 1.3) *
                  (isProduct ? 1 : 1 - dim * 0.55) *
                  (1 - out),
                transform: `translateY(${(1 - rowIn) * 16 + out * (isProduct ? -8 : 12)}px) scale(${1 + lift * 0.018})`,
              }}
            >
              {isProduct ? (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: 12,
                    background: pal.raised,
                    boxShadow: pal.raisedShadow,
                    opacity: Math.min(1, fill * 1.2),
                  }}
                />
              ) : null}
              <div
                style={{
                  position: "absolute",
                  inset: "0 12px 0 16px",
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  borderBottom:
                    isProduct || isLast ? "none" : `1px solid ${pal.hairline}`,
                }}
              >
                <div
                  style={{
                    width: 24,
                    fontFamily: mono,
                    fontSize: 16,
                    color: isProduct && rank === 1 ? accent : pal.faint,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {rank}
                </div>
                <Thumb
                  item={item}
                  isProduct={isProduct}
                  accent={accent}
                  pal={pal}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "baseline",
                      gap: 10,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 18,
                        fontWeight: 400,
                        color: pal.ink,
                        letterSpacing: "-0.01em",
                      }}
                    >
                      {item.name}
                    </span>
                    <span style={{ fontSize: 16, color: pal.faint }}>
                      {item.topic}
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: 16,
                      color: pal.muted,
                      marginTop: 2,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {item.tagline}
                  </div>
                </div>
                <div
                  style={{
                    position: "relative",
                    width: 60,
                    height: 52,
                    borderRadius: 10,
                    flexShrink: 0,
                    boxShadow: `inset 0 0 0 1px ${voteBorder}`,
                    overflow: "hidden",
                    transform: `scale(${(1 + bump * 0.06) * (isProduct ? press : 1)})`,
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
                      gap: 2,
                    }}
                  >
                    <Chevron color={pal.muted} />
                    <Odometer
                      value={isProduct ? productVotes : rivalVotesAt(ri, frame)}
                      color={pal.ink}
                    />
                  </div>
                  {isProduct ? (
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 2,
                        background: accent,
                        clipPath: `circle(${Math.max(0, fill) * 75}% at 50% 30%)`,
                      }}
                    >
                      <Chevron color="#fff" />
                      <Odometer value={productVotes} color="#fff" />
                    </div>
                  ) : null}
                </div>
              </div>
              {isProduct && frame >= BEAT.press ? (
                <div
                  style={{
                    position: "absolute",
                    right: 12,
                    top: rowH / 2 - 26,
                    width: 60,
                    height: 52,
                    borderRadius: 12,
                    boxShadow: `0 0 0 1.5px ${accent}`,
                    opacity: 0.55 * (1 - ripple),
                    transform: `scale(${1 + ripple * 0.3})`,
                  }}
                />
              ) : null}
            </div>
          );
        })}

        {curShow > 0 ? (
          <div
            style={{
              position: "absolute",
              left: curX + curLeave * 40,
              top: curY + curLeave * 30,
              opacity: curShow,
              zIndex: 30,
              transform: `scale(${frame >= BEAT.press - 1 && frame < BEAT.press + 5 ? 0.9 : 1})`,
              transformOrigin: "4px 4px",
            }}
          >
            <Cursor />
          </div>
        ) : null}

        {frame >= stampAt ? (
          <>
            <div
              style={{
                position: "absolute",
                left: badgeC.x,
                top: badgeC.y,
                width: 0,
                height: 0,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  left: -150,
                  top: -150,
                  width: 300,
                  height: 300,
                  borderRadius: 300,
                  boxShadow: `0 0 0 1.5px ${hexToRgba(accent, 0.6)}`,
                  opacity: (1 - ring) * Math.min(1, ring * 6),
                  transform: `scale(${0.8 + ring * 0.5})`,
                }}
              />
              <div
                style={{
                  position: "absolute",
                  left: -124,
                  top: -124,
                  transform: `scale(${interpolate(stamp, [0, 1], [1.35, 1])}) rotate(${interpolate(stamp, [0, 1], [-14, -5])}deg)`,
                  opacity: interpolate(frame - stampAt, [0, 3], [0, 1], CLAMP),
                }}
              >
                <Badge
                  accent={accent}
                  label={badgeLabel}
                  sub={product.name}
                  id={id}
                />
              </div>
            </div>
            <div style={{ position: "absolute", ...capStyle }}>
              <div style={{ overflow: "hidden", paddingBottom: 6 }}>
                <div
                  style={{
                    fontSize: tall ? 76 : 68,
                    fontWeight: 300,
                    lineHeight: 1.02,
                    color: pal.ink,
                    letterSpacing: "-0.04em",
                    transform: `translateY(${(1 - captionIn(0)) * 105}%)`,
                  }}
                >
                  {product.name} is #1 today
                </div>
              </div>
              <div
                style={{
                  marginTop: 16,
                  fontFamily: mono,
                  fontSize: tall ? 24 : 20,
                  color: pal.muted,
                  fontVariantNumeric: "tabular-nums",
                  opacity: captionIn(5),
                  transform: `translateY(${(1 - captionIn(5)) * 12}px)`,
                }}
              >
                {Math.round(endVotes).toLocaleString("en-US")} upvotes in 24
                hours
              </div>
            </div>
          </>
        ) : null}
      </div>
    </AbsoluteFill>
  );
}
