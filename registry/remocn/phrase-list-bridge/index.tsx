"use client";

import { loadFont } from "@remotion/google-fonts/Geist";
import { loadFont as loadMono } from "@remotion/google-fonts/GeistMono";
import {
  type CSSProperties,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  AbsoluteFill,
  continueRender,
  delayRender,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { GradientParams } from "@/lib/remocn/gsh/gradient-engine";
import { GshGround, gshParams } from "@/lib/remocn/gsh/gsh-ground";
import type { GshPresetId } from "@/lib/remocn/gsh/presets";

const geist = loadFont("normal", {
  weights: ["300", "400"],
  subsets: ["latin"],
});
const mono = loadMono("normal", { weights: ["400"], subsets: ["latin"] });

export interface PhraseListBridgeProps {
  left?: string;
  right?: string;
  items?: string[];
  pickedIndex?: number;
  accent?: string;
  ink?: string;
  background?: string;
  theme?: "dark" | "light";
  ground?: GshPresetId;
  groundParams?: Partial<GradientParams>;
}

const THEMES = {
  dark: {
    ink: "#f1f4fb",
    accent: "#3B5BFD",
    ground: "film-blue" as GshPresetId | undefined,
    groundParams: {
      colors: ["#cfe6ff", "#4f9be0", "#1f4fb8", "#0c1636"],
      background: "#02040b",
    } as Partial<GradientParams> | undefined,
    groundOffset: 4,
    scrim: "2,4,12",
    scrimAlpha: 0.5,
    panel: "rgba(14,18,30,0.84)",
    panelEdge: "rgba(255,255,255,0.09)",
    panelShadow:
      "inset 0 1px 0 rgba(255,255,255,0.07), 0 1px 2px rgba(0,2,10,0.4), 0 14px 32px rgba(0,2,10,0.42), 0 48px 110px rgba(0,2,10,0.55)",
    rowInk: "rgba(241,244,251,0.9)",
    rowDim: "rgba(241,244,251,0.5)",
    rowFaint: "rgba(241,244,251,0.3)",
    hairline: "rgba(255,255,255,0.07)",
    hl: "rgba(255,255,255,0.07)",
    keycap: "rgba(255,255,255,0.06)",
  },
  light: {
    ink: "#10131c",
    accent: "#3B5BFD",
    ground: "glasswork" as GshPresetId | undefined,
    groundParams: undefined as Partial<GradientParams> | undefined,
    groundOffset: 2,
    scrim: "240,242,248",
    scrimAlpha: 0.55,
    panel: "rgba(255,255,255,0.9)",
    panelEdge: "rgba(16,19,28,0.07)",
    panelShadow:
      "inset 0 1px 0 rgba(255,255,255,1), 0 1px 2px rgba(30,40,80,0.08), 0 12px 28px rgba(30,40,80,0.1), 0 44px 96px rgba(30,40,80,0.16)",
    rowInk: "rgba(16,19,28,0.88)",
    rowDim: "rgba(16,19,28,0.5)",
    rowFaint: "rgba(16,19,28,0.32)",
    hairline: "rgba(16,19,28,0.07)",
    hl: "rgba(16,19,28,0.05)",
    keycap: "rgba(16,19,28,0.05)",
  },
};

const BEAT = {
  wordStep: 3,
  enter: 12,
  split: 24,
  panel: 27,
  deal: 33,
  dealSteps: [5, 4, 4, 3, 3, 3, 3, 3],
  hlLead: 9,
  hlSteps: [9, 7, 6, 5, 4, 4, 4],
  breath: 6,
  exitLen: 9,
  close: 6,
};

const TRACK = -0.035;
const FONT_PX = 200;
const RISE = Easing.bezier(0.22, 1, 0.36, 1);
const STEP = Easing.bezier(0.83, 0, 0.17, 1);
const EXIT = Easing.bezier(0.55, 0, 1, 0.45);
const HEAVY = { mass: 1, damping: 26, stiffness: 120 };
const CARD = { mass: 0.8, damping: 18, stiffness: 160 };
const CHIP = { mass: 0.5, damping: 12, stiffness: 200 };
const MORPH = { damping: 200 };
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;
const DURATIONS = [
  "1.2s",
  "0.8s",
  "2.4s",
  "1.6s",
  "3.0s",
  "1.4s",
  "2.0s",
  "0.6s",
];

type Measure = (s: string, weight: number) => number;

function buildMeasure(_version: number): Measure {
  const ctx = document.createElement("canvas").getContext("2d");
  const cache: Record<string, number> = {};
  return (s: string, weight: number) => {
    const key = `${weight}|${s}`;
    if (cache[key] === undefined) {
      if (!ctx) return s.length * 0.52;
      ctx.font = `${weight} ${FONT_PX}px "${geist.fontFamily}"`;
      cache[key] =
        ctx.measureText(s).width / FONT_PX + TRACK * Array.from(s).length;
    }
    return cache[key];
  };
}

function useMeasure() {
  const [version, setVersion] = useState(0);
  const [handle] = useState(() => delayRender("phrase-list-bridge: measuring"));
  const released = useRef(false);
  useEffect(() => {
    let live = true;
    const bump = () => {
      if (live) setVersion((v) => v + 1);
    };
    document.fonts.addEventListener("loadingdone", bump);
    Promise.all([
      geist.waitUntilDone(),
      mono.waitUntilDone(),
      document.fonts.load(`300 100px "${geist.fontFamily}"`),
      document.fonts.load(`400 100px "${geist.fontFamily}"`),
    ])
      .catch(() => undefined)
      .then(() => {
        bump();
        if (!released.current) {
          released.current = true;
          continueRender(handle);
        }
      });
    return () => {
      live = false;
      document.fonts.removeEventListener("loadingdone", bump);
    };
  }, [handle]);
  return useMemo(() => buildMeasure(version), [version]);
}

function RowIcon({
  kind,
  size,
  color,
}: {
  kind: number;
  size: number;
  color: string;
}) {
  const s = {
    fill: "none",
    stroke: color,
    strokeWidth: 1.5,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  const k = kind % 6;
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden>
      {k === 0 && (
        <>
          <rect x="3.5" y="5" width="17" height="14" rx="3" {...s} />
          <path d="M10.5 9.5v5l4-2.5z" {...s} />
        </>
      )}
      {k === 1 && (
        <>
          <path d="M5 6.5h14M12 6.5v12" {...s} />
          <path d="M9 18.5h6" {...s} />
        </>
      )}
      {k === 2 && (
        <>
          <rect x="3.5" y="9" width="17" height="6.5" rx="1.5" {...s} />
          <path d="M7 12.25h6" {...s} />
        </>
      )}
      {k === 3 && (
        <path d="M9 4.5l-2 15M17 4.5l-2 15M4.5 9h15M4 15h15" {...s} />
      )}
      {k === 4 && (
        <>
          <path d="M12 4l8 4-8 4-8-4z" {...s} />
          <path d="M4 12l8 4 8-4M4 16l8 4 8-4" {...s} />
        </>
      )}
      {k === 5 && (
        <>
          <circle cx="12" cy="12" r="7.5" {...s} />
          <circle cx="12" cy="12" r="2.2" {...s} />
        </>
      )}
    </svg>
  );
}

function SearchIcon({ size, color }: { size: number; color: string }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden>
      <circle
        cx="11"
        cy="11"
        r="6.5"
        fill="none"
        stroke={color}
        strokeWidth="1.5"
      />
      <path
        d="M16 16l4 4"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function Check({ size, progress }: { size: number; progress: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden>
      <path
        d="M6 12.6l3.9 3.8L18 8.4"
        fill="none"
        stroke="#ffffff"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength={1}
        strokeDasharray={1}
        strokeDashoffset={1 - progress}
      />
    </svg>
  );
}

function BlurDefs({
  items,
}: {
  items: { id: string; x: number; y: number }[];
}) {
  return (
    <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden>
      {items.map((it) => (
        <filter
          key={it.id}
          id={it.id}
          x="-20%"
          y="-60%"
          width="140%"
          height="220%"
        >
          <feGaussianBlur
            stdDeviation={`${it.x.toFixed(2)} ${it.y.toFixed(2)}`}
          />
        </filter>
      ))}
    </svg>
  );
}

export function PhraseListBridge({
  left = "Browse through",
  right = "ready-made scenes",
  items = [
    "Zoom Blur",
    "Typewriter",
    "Inline Highlight",
    "Rolling Number",
    "Echo Stack",
    "Orbit Lock",
  ],
  pickedIndex = 2,
  accent,
  ink,
  background,
  theme = "dark",
  ground,
  groundParams,
}: PhraseListBridgeProps) {
  const frame = useCurrentFrame();
  const { width: W, height: H, fps, durationInFrames } = useVideoConfig();
  const c = THEMES[theme];
  const inkC = ink ?? c.ink;
  const hi = accent ?? c.accent;
  const preset = ground ?? (groundParams ? undefined : c.ground);
  const gParams = groundParams ?? (ground ? undefined : c.groundParams);
  const bg = background ?? gshParams(preset, gParams).background;
  const m = useMeasure();
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const portrait = H > W * 1.1;

  const rows = (items.length > 0 ? items : ["Zoom Blur"]).slice(0, 8);
  const n = rows.length;
  const pick = Math.max(0, Math.min(n - 1, pickedIndex));

  const landAt: number[] = [];
  let acc = BEAT.deal;
  for (let i = 0; i < n; i++) {
    landAt.push(acc);
    acc += BEAT.dealSteps[Math.min(i, BEAT.dealSteps.length - 1)];
  }
  const hlStart = landAt[n - 1] + BEAT.hlLead;
  const hlAt: number[] = [hlStart];
  for (let i = 1; i <= pick; i++) {
    hlAt.push(
      hlAt[i - 1] + BEAT.hlSteps[Math.min(i - 1, BEAT.hlSteps.length - 1)],
    );
  }
  const pickAt = hlAt[pick] + BEAT.breath;
  const exitAt = pickAt + 6;
  const closeAt = exitAt + BEAT.close;

  const springAt = (at: number, config: typeof HEAVY, f = frame) =>
    spring({ frame: f - at, fps, config });

  let content: React.ReactNode = <div />;
  const blurItems: { id: string; x: number; y: number }[] = [];

  if (m) {
    const cx = W / 2;
    const cy = H / 2;
    const marginX = W * (portrait ? 0.08 : 0.07);
    const marginY = H * (portrait ? 0.07 : 0.07);
    const room = W - marginX * 2;
    const lw = m(left, 300);
    const rw = m(right, 300);
    const sp = m(" ", 300);

    const F1 = portrait
      ? Math.min(W * 0.115, room / Math.max(lw, rw))
      : Math.min(H * 0.13, (room * 0.92) / (lw + sp + rw));
    const F2 = portrait
      ? Math.min(W * 0.12, room / Math.max(lw, rw))
      : Math.min(H * 0.095, (room * 0.9) / Math.max(lw, rw));
    const F3 = portrait
      ? Math.min(W * 0.135, room / Math.max(lw, rw))
      : Math.min(H * 0.15, (room * 0.92) / Math.max(lw, rw));

    const gap = F2 * 0.42;
    const availH = H - 2 * (marginY + F2 + gap);
    const rh = Math.min(
      portrait ? W * 0.12 : H * 0.088,
      availH / (n + 1 + 0.35),
    );
    const pad = rh * 0.12;
    const r = rh * 0.34;
    const iconS = r * 1.2;
    const rowPadX = rh * 0.3;
    const labelW = (s: string) => m(s, 400) * r;
    const trailW = r * 2.6;
    const rowW = (s: string) =>
      rowPadX * 2 + iconS + r * 0.7 + labelW(s) + r * 1.2 + trailW;
    const pw = Math.max(
      portrait ? W * 0.74 : W * 0.38,
      Math.max(...rows.map(rowW)) + pad * 2,
    );
    const fullH = pad * 2 + (n + 1) * rh;
    const radiusOuter = rh * 0.32 + pad;
    const radiusInner = rh * 0.32;

    const chipScale = (F3 * 1.02) / rh;
    const checkS = r * 1.5;
    const hugTrail = checkS;
    const hugW =
      rowPadX * 2 + iconS + r * 0.7 + labelW(rows[pick]) + r * 0.9 + hugTrail;

    const layout = (f: number) => {
      const sp1 = springAt(BEAT.split, HEAVY, f);
      const cl = springAt(closeAt, HEAVY, f);
      const morph = spring({
        frame: f - exitAt - 1,
        fps,
        config: MORPH,
        durationInFrames: 14,
      });
      const dealt = rows.reduce(
        (a, _, i) => a + springAt(landAt[i] - 3, CARD, f),
        0,
      );
      const openH = pad * 2 + rh * (1 + Math.min(n, dealt));
      const pickTop = pad + (pick + 1) * rh;
      const rect = {
        x: pad * morph,
        y: pickTop * morph,
        w: pw + (hugW - pw) * morph,
        h: openH + (rh - openH) * morph,
      };
      const scale = 1 + (chipScale - 1) * cl;
      const panelH = rect.h * scale;

      const F = F1 + (F2 - F1) * sp1 + (F3 - F2) * cl;
      const lineH = F;
      const splitGapY = openH / 2 + gap + F2 / 2;
      const finalGapY = panelH / 2 + F3 * 0.34 + F3 / 2;
      const joinedTopY = portrait ? cy - lineH * 0.56 : cy;
      const joinedBotY = portrait ? cy + lineH * 0.56 : cy;
      const topY =
        joinedTopY +
        (cy - splitGapY - joinedTopY) * sp1 +
        (cy - finalGapY - (cy - splitGapY)) * cl;
      const botY =
        joinedBotY +
        (cy + splitGapY - joinedBotY) * sp1 +
        (cy + finalGapY - (cy + splitGapY)) * cl;
      const total = (lw + sp + rw) * F1;
      const jLeftCx = portrait ? cx : cx - total / 2 + (lw * F1) / 2;
      const jRightCx = portrait ? cx : cx + total / 2 - (rw * F1) / 2;
      const leftCx = jLeftCx + (cx - jLeftCx) * sp1;
      const rightCx = jRightCx + (cx - jRightCx) * sp1;
      return { F, topY, botY, leftCx, rightCx, rect, scale, morph, cl };
    };

    const L = layout(frame);
    const P = layout(frame - 1);
    const vy = Math.abs(L.topY - P.topY);
    const vx = Math.abs(L.leftCx - P.leftCx);
    const tb = Math.min(6, vy * 0.22);
    const tx = Math.min(6, vx * 0.22);
    blurItems.push({ id: `${uid}t`, x: tx, y: tb });
    blurItems.push({ id: `${uid}b`, x: tx, y: tb });

    const phrase = (
      text: string,
      ccx: number,
      ccy: number,
      startAt: number,
      fid: string,
    ) => {
      const parts = text.split(" ").filter(Boolean);
      const wEm = m(text, 300);
      return (
        <div
          style={{
            position: "absolute",
            left: ccx - (wEm * L.F) / 2,
            top: ccy - L.F / 2,
            fontFamily: geist.fontFamily,
            fontWeight: 300,
            fontSize: L.F,
            lineHeight: 1,
            letterSpacing: `${TRACK}em`,
            whiteSpace: "pre",
            color: inkC,
            display: "flex",
            filter: tb + tx > 0.2 ? `url(#${fid})` : undefined,
          }}
        >
          {parts.map((w, i) => {
            const at = startAt + i * BEAT.wordStep;
            const e = interpolate(frame, [at - 3, at + BEAT.enter], [0, 1], {
              ...CLAMP,
              easing: RISE,
            });
            return (
              <span
                key={`${w}${i}`}
                style={{
                  display: "inline-block",
                  clipPath: "inset(-40% -20% -0.26em -20%)",
                  marginRight: i < parts.length - 1 ? `${sp}em` : 0,
                }}
              >
                <span
                  style={{
                    display: "inline-block",
                    transform: `translateY(${((1 - e) * 0.9).toFixed(4)}em)`,
                    opacity: Math.min(1, e * 1.6),
                    filter:
                      e < 1 ? `blur(${((1 - e) * 5).toFixed(2)}px)` : undefined,
                  }}
                >
                  {w}
                </span>
              </span>
            );
          })}
        </div>
      );
    };

    const panelIn = springAt(BEAT.panel, CARD);
    const hlPos = (() => {
      let p = 0;
      for (let i = 1; i <= pick; i++) {
        p += interpolate(frame, [hlAt[i - 1] + 1, hlAt[i] + 1], [0, 1], {
          ...CLAMP,
          easing: STEP,
        });
      }
      return p;
    })();
    const hlIn = interpolate(frame, [hlStart - 3, hlStart + 3], [0, 1], CLAMP);
    const picked = interpolate(frame, [pickAt, pickAt + 5], [0, 1], CLAMP);
    const punch = springAt(pickAt, CHIP);
    const pickScale =
      1 + 0.05 * Math.sin(Math.min(1, punch) * Math.PI) * (1 - L.cl);
    const checkP = interpolate(frame, [pickAt + 3, pickAt + 14], [0, 1], {
      ...CLAMP,
      easing: RISE,
    });

    const exitOf = (i: number) => {
      const d = i < 0 ? pick + 1 : Math.abs(i - pick);
      const at = exitAt + Math.min(4, d - 1);
      return interpolate(frame, [at, at + BEAT.exitLen], [0, 1], {
        ...CLAMP,
        easing: EXIT,
      });
    };

    const rowNodes = rows.map((label, i) => {
      const e = springAt(landAt[i] - 3, CARD);
      const isPick = i === pick;
      const f = isPick ? 0 : exitOf(i);
      const rowWidth = isPick
        ? pw - pad * 2 + (hugW - (pw - pad * 2)) * L.morph
        : pw - pad * 2;
      const trail = isPick ? trailW + (hugTrail - trailW) * L.morph : trailW;
      const y = pad + (i + 1) * rh;
      const enterY = (1 - Math.min(1, e)) * -rh * 0.7;
      const fallY = f * rh * (i < pick ? -0.6 : 0.6);
      const blur = (1 - Math.min(1, e)) * 5 + f * 6;
      const on = isPick ? picked : 0;
      const rowInk = on > 0.5 ? "#ffffff" : c.rowInk;
      return (
        <div
          key={`row${i}`}
          style={{
            position: "absolute",
            left: pad,
            top: y,
            width: rowWidth,
            height: rh,
            display: "flex",
            alignItems: "center",
            gap: r * 0.7,
            padding: `0 ${rowPadX}px`,
            boxSizing: "border-box",
            opacity: Math.min(1, Math.max(0, e)) * (1 - f),
            transform: `translateY(${(enterY + fallY).toFixed(2)}px)`,
            filter: blur > 0.1 ? `blur(${blur.toFixed(2)}px)` : undefined,
            color: rowInk,
            zIndex: isPick ? 2 : 1,
          }}
        >
          <div style={{ flexShrink: 0, display: "flex" }}>
            <RowIcon
              kind={i}
              size={iconS}
              color={on > 0.5 ? "#ffffff" : c.rowDim}
            />
          </div>
          <div
            style={{
              fontFamily: geist.fontFamily,
              fontWeight: 400,
              fontSize: r,
              letterSpacing: "-0.01em",
              lineHeight: 1,
              whiteSpace: "pre",
              flexGrow: 1,
            }}
          >
            {label}
          </div>
          <div
            style={{
              flexShrink: 0,
              width: trail,
              display: "flex",
              justifyContent: "flex-end",
              alignItems: "center",
              position: "relative",
              height: rh,
            }}
          >
            <span
              style={{
                fontFamily: mono.fontFamily,
                fontWeight: 400,
                fontSize: r * 0.78,
                color: c.rowFaint,
                opacity: 1 - on,
              }}
            >
              {DURATIONS[i % DURATIONS.length]}
            </span>
            {isPick && (
              <div
                style={{
                  position: "absolute",
                  right: 0,
                  top: (rh - checkS) / 2,
                  display: "flex",
                  opacity: on,
                  transform: `scale(${(0.7 + 0.3 * checkP).toFixed(3)})`,
                }}
              >
                <Check size={checkS} progress={checkP} />
              </div>
            )}
          </div>
        </div>
      );
    });

    const headerExit = exitOf(-1);
    const header = (
      <div
        style={{
          position: "absolute",
          left: pad,
          top: pad,
          width: pw - pad * 2,
          height: rh,
          display: "flex",
          alignItems: "center",
          gap: r * 0.7,
          padding: `0 ${rowPadX}px`,
          boxSizing: "border-box",
          opacity: 1 - headerExit,
          transform: `translateY(${(-headerExit * rh * 0.6).toFixed(2)}px)`,
          filter:
            headerExit > 0.01
              ? `blur(${(headerExit * 6).toFixed(2)}px)`
              : undefined,
          boxShadow: `inset 0 -1px 0 ${c.hairline}`,
        }}
      >
        <div style={{ flexShrink: 0, display: "flex" }}>
          <SearchIcon size={iconS} color={c.rowDim} />
        </div>
        <div
          style={{
            fontFamily: geist.fontFamily,
            fontWeight: 400,
            fontSize: r,
            letterSpacing: "-0.01em",
            color: c.rowFaint,
            flexGrow: 1,
            whiteSpace: "pre",
          }}
        >
          Search scenes
        </div>
        <div
          style={{
            flexShrink: 0,
            minWidth: r * 1.4,
            height: r * 1.4,
            borderRadius: r * 0.35,
            background: c.keycap,
            boxShadow: `inset 0 0 0 1px ${c.hairline}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: mono.fontFamily,
            fontWeight: 400,
            fontSize: r * 0.72,
            color: c.rowDim,
          }}
        >
          /
        </div>
      </div>
    );

    const rect = L.rect;
    const hlY = pad + (hlPos + 1) * rh;
    const radius = radiusOuter + (rh / 2 - radiusOuter) * L.morph;
    const hlRadius = radiusInner + (rh / 2 - radiusInner) * L.morph;
    const glow = picked * (1 - L.morph * 0.4);
    const push = interpolate(frame, [0, durationInFrames], [1, 1.035], CLAMP);
    const pScale = Math.min(1, Math.max(0, panelIn));

    const panel = (
      <div
        style={{
          position: "absolute",
          left: cx,
          top: cy,
          width: 0,
          height: 0,
          transform: `scale(${(L.scale * (0.9 + 0.1 * pScale) * pickScale).toFixed(4)})`,
          opacity: pScale,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: -rect.w / 2,
            top: -rect.h / 2,
            width: rect.w,
            height: rect.h,
            borderRadius: radius,
            overflow: "hidden",
            background: `color-mix(in oklab, ${hi} ${(L.morph ** 4 * 100).toFixed(1)}%, ${c.panel})`,
            boxShadow: `${c.panelShadow}, inset 0 0 0 1px ${c.panelEdge}${glow > 0.01 ? `, 0 ${(rh * 0.3).toFixed(1)}px ${(rh * 1.1).toFixed(1)}px color-mix(in oklab, ${hi} ${(glow * 45).toFixed(1)}%, transparent)` : ""}`,
            filter:
              pScale < 0.98
                ? `blur(${((1 - pScale) * 6).toFixed(2)}px)`
                : undefined,
          }}
        >
          <div
            style={{
              position: "absolute",
              left: -rect.x,
              top: -rect.y,
              width: pw,
              height: fullH,
            }}
          >
            <div
              style={{
                position: "absolute",
                left: pad,
                top: hlY,
                width: pw - pad * 2 + (hugW - (pw - pad * 2)) * L.morph,
                height: rh,
                borderRadius: hlRadius,
                background: `color-mix(in oklab, ${hi} ${(picked * 100).toFixed(1)}%, ${c.hl})`,
                boxShadow:
                  picked > 0
                    ? "inset 0 1px 0 rgba(255,255,255,0.22)"
                    : undefined,
                opacity: hlIn,
              }}
            />
            {header}
            {rowNodes}
          </div>
        </div>
      </div>
    );

    content = (
      <AbsoluteFill
        style={{
          transform: `scale(${push.toFixed(5)})`,
        }}
      >
        {panel}
        {phrase(left, L.leftCx, L.topY, 0, `${uid}t`)}
        {phrase(
          right,
          L.rightCx,
          L.botY,
          left.split(" ").filter(Boolean).length * BEAT.wordStep,
          `${uid}b`,
        )}
      </AbsoluteFill>
    );
  }

  const scrimShape = portrait ? "90% 55%" : "70% 75%";
  const style: CSSProperties = { background: bg, overflow: "hidden" };

  return (
    <AbsoluteFill style={style}>
      <GshGround
        preset={preset}
        params={gParams}
        timeOffset={c.groundOffset}
        timeScale={0.7}
      />
      <AbsoluteFill
        style={{
          background: `radial-gradient(${scrimShape} at 50% 50%, rgba(${c.scrim},${c.scrimAlpha}) 0%, rgba(${c.scrim},0) 100%)`,
        }}
      />
      <BlurDefs items={blurItems} />
      {content}
    </AbsoluteFill>
  );
}

export default PhraseListBridge;
