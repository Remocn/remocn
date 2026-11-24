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
} from "remotion";
import { useSceneConfig, useSceneFrame } from "@/lib/remocn/frame-rate";
import { useGlide } from "@/lib/remocn/glide";
import type { GradientParams } from "@/lib/remocn/gsh/gradient-engine";
import { GshGround, gshParams } from "@/lib/remocn/gsh/gsh-ground";
import type { GshPresetId } from "@/lib/remocn/gsh/presets";
import { type Timing, useTimeline } from "@/lib/remocn/timeline";
import {
  DEFAULT_ITEMS,
  DEFAULT_LEFT,
  DEFAULT_PICKED,
  DEFAULT_RIGHT,
  type PhraseListBridgeElementId,
  phraseListBridgeTimeline,
  pickOf,
  rowsOf,
} from "./timeline";

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
  /** Placeholder in the panel's search field. */
  searchLabel?: string;
  accent?: string;
  ink?: string;
  /** Solid fill in place of the gradient ground; "transparent" drops it. */
  background?: string;
  /** Typeface for the phrase and rows. Load it yourself; Geist by default. */
  fontFamily?: string;
  /** Frames between words of the phrase as they rise in. */
  stagger?: number;
  /** Size of the phrase and panel, around the frame's center. */
  scale?: number;
  /** Frames to hold the first frame before anything moves. */
  delay?: number;
  speed?: number;
  theme?: "dark" | "light";
  ground?: GshPresetId;
  groundParams?: Partial<GradientParams>;
  /**
   * Moves, trims or stretches single words, rows and steps, the split, the
   * panel, the pick, the fold and the close, by the ids in `./timeline`.
   * Frames on the scene timeline, after `delay` and `speed`.
   */
  timing?: Timing<PhraseListBridgeElementId>;
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

function buildMeasure(_version: number, family: string): Measure {
  const ctx = document.createElement("canvas").getContext("2d");
  const cache: Record<string, number> = {};
  return (s: string, weight: number) => {
    const key = `${weight}|${s}`;
    if (cache[key] === undefined) {
      if (!ctx) return s.length * 0.52;
      ctx.font = `${weight} ${FONT_PX}px "${family}"`;
      cache[key] =
        ctx.measureText(s).width / FONT_PX + TRACK * Array.from(s).length;
    }
    return cache[key];
  };
}

function useMeasure(family: string) {
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
      document.fonts.load(`300 100px "${family}"`),
      document.fonts.load(`400 100px "${family}"`),
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
  }, [handle, family]);
  return useMemo(() => buildMeasure(version, family), [version, family]);
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

export function PhraseListBridge(props: PhraseListBridgeProps) {
  const {
    left = DEFAULT_LEFT,
    right = DEFAULT_RIGHT,
    items = DEFAULT_ITEMS,
    pickedIndex = DEFAULT_PICKED,
    searchLabel = "Search scenes",
    accent,
    ink,
    background,
    fontFamily = geist.fontFamily,
    scale = 1,
    delay = 0,
    speed = 1,
    theme = "dark",
    ground,
    groundParams,
    timing,
  } = props;
  const glide = useGlide();
  const frame = Math.max(0, useSceneFrame() - delay) * speed;
  const { width: W, height: H, fps, durationInFrames } = useSceneConfig();
  const tl = useTimeline(
    phraseListBridgeTimeline,
    props,
    durationInFrames * speed,
    timing,
  );
  const c = THEMES[theme];
  const inkC = ink ?? c.ink;
  const hi = accent ?? c.accent;
  const preset = ground ?? (groundParams ? undefined : c.ground);
  const gParams = groundParams ?? (ground ? undefined : c.groundParams);
  const bg = background ?? gshParams(preset, gParams).background;
  const m = useMeasure(fontFamily);
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const portrait = H > W * 1.1;

  const rows = rowsOf(items);
  const n = rows.length;
  const pick = pickOf(n, pickedIndex);

  const rowEls = rows.map((_, i) => tl.get(`row:${i}`));
  const splitEl = tl.get("split");
  const panelEl = tl.get("panel");
  const hlEl = tl.get("highlight");
  const pickEl = tl.get("pick");
  const exitEl = tl.get("exit");
  const closeEl = tl.get("close");
  const pickAt = pickEl.start;
  const exitAt = exitEl.start;

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
      const sp1 = springAt(splitEl.start, HEAVY, f);
      const cl = springAt(closeEl.start, HEAVY, f);
      const morph = spring({
        frame: f - exitAt - exitEl.beat("morphAt"),
        fps,
        config: MORPH,
        durationInFrames: exitEl.beat("morph"),
      });
      const dealt = rows.reduce(
        (a, _, i) =>
          a + springAt(rowEls[i].start + rowEls[i].beat("lead"), CARD, f),
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
      return { F, topY, botY, leftCx, rightCx, rect, scale, morph, cl, openH };
    };

    const L = layout(frame);
    const P = layout(frame - 1);
    const vy = Math.abs(L.topY - P.topY);
    const vx = Math.abs(L.leftCx - P.leftCx);
    const tb = Math.min(6, vy * 0.22);
    const tx = Math.min(6, vx * 0.22);
    // The phrase is laid out once at its settled size and reaches its live
    // size and place by transform: layout rounds a baseline to whole pixels,
    // so a phrase eased by `top` and `fontSize` clicks along pixel by pixel.
    // Blur radii are in the scaled space, so they're divided back by `k`.
    const FR = F3;
    const k = L.F / FR;
    const restGapY = (rh * chipScale) / 2 + F3 * 0.34 + F3 / 2;
    blurItems.push({ id: `${uid}t`, x: tx / k, y: tb / k });
    blurItems.push({ id: `${uid}b`, x: tx / k, y: tb / k });

    const phrase = (
      text: string,
      ccx: number,
      ccy: number,
      restCy: number,
      first: number,
      fid: string,
    ) => {
      const parts = text.split(" ").filter(Boolean);
      const wEm = m(text, 300);
      const restLeft = cx - (wEm * FR) / 2;
      const restTop = restCy - FR / 2;
      const dx = ccx - (wEm * L.F) / 2 - restLeft;
      const dy = ccy - L.F / 2 - restTop;
      return (
        <div
          style={{
            position: "absolute",
            left: restLeft,
            top: restTop,
            transform: `translate(${dx}px, ${dy}px) scale(${k})`,
            transformOrigin: "0 0",
            fontFamily,
            fontWeight: 300,
            fontSize: FR,
            lineHeight: 1,
            letterSpacing: `${TRACK}em`,
            whiteSpace: "pre",
            color: inkC,
            display: "flex",
            filter: tb + tx > 0.2 ? `url(#${fid})` : undefined,
          }}
        >
          {parts.map((w, i) => {
            const word = tl.get(`word:${first + i}`);
            const e = interpolate(
              frame,
              [word.start + word.beat("lead"), word.end],
              [0, 1],
              { ...CLAMP, easing: RISE },
            );
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
                      e < 1
                        ? `blur(${(((1 - e) * 5) / k).toFixed(2)}px)`
                        : undefined,
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

    const panelIn = springAt(panelEl.start, CARD);
    const hlPos = (() => {
      let p = 0;
      for (let i = 1; i <= pick; i++) {
        const step = tl.get(`step:${i}`);
        p += interpolate(frame, [step.start, step.end], [0, 1], {
          ...CLAMP,
          easing: STEP,
        });
      }
      return p;
    })();
    const hlIn = interpolate(
      frame,
      [hlEl.start + hlEl.beat("lead"), hlEl.start + hlEl.beat("in")],
      [0, 1],
      CLAMP,
    );
    const picked = interpolate(
      frame,
      [pickAt, pickAt + pickEl.beat("fill")],
      [0, 1],
      CLAMP,
    );
    const punch = springAt(pickAt, CHIP);
    const pickScale =
      1 + 0.05 * Math.sin(Math.min(1, punch) * Math.PI) * (1 - L.cl);
    const checkAt = pickAt + pickEl.beat("checkAt");
    const checkP = interpolate(
      frame,
      [checkAt, checkAt + pickEl.beat("check")],
      [0, 1],
      { ...CLAMP, easing: RISE },
    );

    const exitOf = (i: number) => {
      const d = i < 0 ? pick + 1 : Math.abs(i - pick);
      const at = exitAt + Math.min(4, d - 1) * exitEl.beat("step");
      return interpolate(frame, [at, at + exitEl.beat("row")], [0, 1], {
        ...CLAMP,
        easing: EXIT,
      });
    };

    const rowNodes = rows.map((label, i) => {
      const e = springAt(rowEls[i].start + rowEls[i].beat("lead"), CARD);
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
              fontFamily,
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
            fontFamily,
            fontWeight: 400,
            fontSize: r,
            letterSpacing: "-0.01em",
            color: c.rowFaint,
            flexGrow: 1,
            whiteSpace: "pre",
          }}
        >
          {searchLabel}
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
    const fold = 1 - L.morph;
    const shift = (x: number, y: number) =>
      Math.abs(x) < 1e-3 && Math.abs(y) < 1e-3
        ? undefined
        : `translate(${x}px, ${y}px)`;
    // The folding panel and the highlight ride by transform too, measured
    // from where they land so the shift is exactly 0 there.
    const rectShift = shift(
      (-(pw - hugW) * fold) / 2,
      (-(L.openH - rh) * fold) / 2,
    );
    const pickTop = pad + (pick + 1) * rh;
    const innerShift = shift(pad * fold, pickTop * fold);
    const hlRestY = pickTop;
    const hlShift = shift(0, (hlPos - pick) * rh);
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
            // Laid out where the chip settles; the ride there as the panel
            // folds is a transform, for the same reason as the phrase.
            left: -hugW / 2,
            top: -rh / 2,
            transform: rectShift,
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
              left: -pad,
              top: -pad - (pick + 1) * rh,
              transform: innerShift,
              width: pw,
              height: fullH,
            }}
          >
            <div
              style={{
                position: "absolute",
                left: pad,
                top: hlRestY,
                transform: hlShift,
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
          // The push never rests, so neither does the tilt.
          transform: `scale(${push.toFixed(5)})${glide(true)}`,
        }}
      >
        {panel}
        {phrase(left, L.leftCx, L.topY, cy - restGapY, 0, `${uid}t`)}
        {phrase(
          right,
          L.rightCx,
          L.botY,
          cy + restGapY,
          left.split(" ").filter(Boolean).length,
          `${uid}b`,
        )}
      </AbsoluteFill>
    );
  }

  const scrimShape = portrait ? "90% 55%" : "70% 75%";
  const style: CSSProperties = { background: bg, overflow: "hidden" };

  return (
    <AbsoluteFill style={style}>
      {background === undefined ? (
        <>
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
        </>
      ) : null}
      <BlurDefs items={blurItems} />
      <ScaleLayer scale={scale}>{content}</ScaleLayer>
    </AbsoluteFill>
  );
}

export default PhraseListBridge;
