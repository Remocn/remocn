"use client";

import { loadFont as loadPlexMono } from "@remotion/google-fonts/IBMPlexMono";
import { loadFont as loadInstrument } from "@remotion/google-fonts/InstrumentSans";
import { Fragment, useId } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const instrument = loadInstrument("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});
const plex = loadPlexMono("normal", { weights: ["500"], subsets: ["latin"] });

export interface CutStatProps {
  value?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  label?: string;
  caption?: string;
  fromLabel?: string;
  toLabel?: string;
  accent?: string;
  background?: string;
  speed?: number;
  theme?: "dark" | "light";
}

const MESH = ["#ecdcf2", "#8796ee", "#2e45b7", "#0e1645"] as const;
const MESH_BG = "#0a0d24";
const BLOBS: [number, number][] = [
  [16, 20],
  [84, 26],
  [72, 86],
  [22, 80],
  [52, 48],
  [92, 62],
];

const PALETTES = {
  dark: {
    bg: "#0A0A0B",
    fg: "#F4F3F0",
    muted: "#8E8D94",
    fieldFg: "#F6F4FF",
    fieldMuted: "rgba(246,244,255,0.66)",
    edge: "#F6F4FF",
    tick: "rgba(255,255,255,0.09)",
    fieldTick: "rgba(255,255,255,0.16)",
    fieldBg: MESH_BG,
    blobs: [MESH[3], MESH[3], MESH[1], MESH[2], MESH[1], MESH[0]],
  },
  light: {
    bg: "#F5F4F0",
    fg: "#111113",
    muted: "#6E6C67",
    fieldFg: "#0E1238",
    fieldMuted: "rgba(14,18,56,0.6)",
    edge: "#111113",
    tick: "rgba(17,17,19,0.1)",
    fieldTick: "rgba(14,18,56,0.16)",
    fieldBg: "#DCE0F8",
    blobs: ["#c9d0f7", "#a9b4f2", MESH[1], "#b3bdf4", MESH[0], "#f3eef9"],
  },
} as const;

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_CUT = Easing.bezier(0.72, 0, 0.16, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

function estimateEm(text: string) {
  let w = 0;
  for (const ch of text) {
    if (/[0-9]/.test(ch)) w += 0.56;
    else if (ch === "%") w += 0.78;
    else if (/[.,]/.test(ch)) w += 0.24;
    else if (/[−\-+×x]/.test(ch)) w += 0.52;
    else if (ch === "$" || ch === "€") w += 0.56;
    else if (ch === " ") w += 0.22;
    else w += 0.56;
  }
  return w;
}

function Grain({ opacity }: { opacity: number }) {
  const id = `grain-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  return (
    <svg
      width="100%"
      height="100%"
      style={{
        position: "absolute",
        inset: 0,
        opacity,
        mixBlendMode: "overlay",
      }}
      aria-hidden
    >
      <filter id={id}>
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.8"
          numOctaves={2}
          seed={11}
          stitchTiles="stitch"
        />
        <feColorMatrix values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 1 0" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#${id})`} />
    </svg>
  );
}

export function CutStat({
  value = 44,
  decimals = 0,
  prefix = "−",
  suffix = "%",
  label = "less time to a finished cut",
  caption = "vs. keyframing every scene by hand",
  fromLabel = "Before",
  toLabel = "With remocn",
  accent = "#3B5BFD",
  background,
  speed = 1,
  theme = "dark",
}: CutStatProps) {
  const raw = useCurrentFrame();
  const frame = raw * speed;
  const { width, height, durationInFrames } = useVideoConfig();
  const p = PALETTES[theme];

  const portrait = height > width * 1.1;
  const u = Math.min(width, height) / 720;
  const v = Math.min(95, Math.max(5, value));
  const along = portrait ? height : width;

  const intro = interpolate(frame, [0, 6], [0, 1], CLAMP);
  const fill = interpolate(frame, [0, 15], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const cut = interpolate(frame, [19, 51], [0, 1], {
    ...CLAMP,
    easing: EASE_CUT,
  });
  const flash = interpolate(frame, [49, 52, 63], [0, 1, 0], CLAMP);
  const drift = interpolate(raw, [0, durationInFrames], [0, 1], CLAMP);
  const cutPx = (along * v * cut) / 100;
  const remaining = 100 - v * cut;
  const counted = v * cut;
  const fmt = (n: number) => n.toFixed(decimals);
  const swapT = interpolate(frame, [44, 56], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });

  const margin = (portrait ? 56 : 52) * u;
  const zone = (along * v) / 100;
  const finalText = `${prefix}${fmt(v)}${suffix}`;
  const em = estimateEm(finalText);
  const roomW = portrait
    ? width - margin * 2
    : Math.max(zone, width * 0.36) - margin * 1.6;
  const statFs = Math.min(
    (portrait ? 300 : 236) * u,
    roomW / em,
    portrait ? Math.max(zone, height * 0.3) * 0.5 : Infinity,
  );
  const words = label.split(/\s+/).filter(Boolean);
  const wordT = (i: number) =>
    interpolate(frame, [47 + i * 3, 65 + i * 3], [0, 1], {
      ...CLAMP,
      easing: EASE_OUT,
    });
  const capT = interpolate(
    frame,
    [63 + words.length * 2, 81 + words.length * 2],
    [0, 1],
    {
      ...CLAMP,
      easing: EASE_OUT,
    },
  );

  const transparent = background === "transparent";
  const labelFs = 14 * u;
  const blobs = BLOBS.map(([x, y], i) => {
    const c = p.blobs[i];
    const dx = Math.sin(i * 1.7 + drift * 2.2) * 3;
    const dy = Math.cos(i * 1.3 + drift * 2.2) * 3;
    return `radial-gradient(85% 95% at ${x + dx}% ${y + dy}%, ${c} 0%, transparent 68%)`;
  });
  blobs[2] = `radial-gradient(85% 95% at ${72 + drift * 3}% ${86 - drift * 3}%, color-mix(in oklab, ${accent} ${theme === "dark" ? 70 : 45}%, ${MESH[1]}) 0%, transparent 68%)`;

  const shut = cutPx + along * (1 - fill);
  const fieldClip = portrait
    ? `inset(0 0 ${shut}px 0)`
    : `inset(0 ${shut}px 0 0)`;
  const edgePos = along - shut;
  const edgeO =
    fill < 1
      ? fill > 0.02 && fill < 0.98
        ? 1
        : 0
      : cut <= 0
        ? 0
        : cut < 1
          ? 1
          : 0.35 + flash * 0.65;

  const release = interpolate(frame, [53, 69], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const clipAt = edgePos * (1 - release);
  const statClip = portrait
    ? `inset(${clipAt}px 0 0 0)`
    : `inset(0 0 0 ${clipAt}px)`;

  const scaleT = interpolate(frame, [4, 20], [0, 1], CLAMP);
  const scale = (line: string, text: string) => (
    <div style={{ position: "absolute", inset: 0, opacity: scaleT }}>
      {Array.from({ length: 11 }, (_, i) => {
        const at = (along * i) / 10;
        return (
          <Fragment key={i}>
            {i > 0 && i < 10 ? (
              <div
                style={{
                  position: "absolute",
                  background: line,
                  ...(portrait
                    ? { left: 0, right: 0, top: at, height: 1 }
                    : { top: 0, bottom: 0, left: at, width: 1 }),
                }}
              />
            ) : null}
            <div
              style={{
                position: "absolute",
                fontFamily: plex.fontFamily,
                fontWeight: 500,
                fontSize: 11 * u * (portrait ? 1.3 : 1),
                letterSpacing: "0.04em",
                color: text,
                fontVariantNumeric: "tabular-nums",
                ...(portrait
                  ? {
                      right: 18 * u,
                      top: Math.min(
                        Math.max(at - 18 * u, 8 * u),
                        height - 26 * u,
                      ),
                    }
                  : {
                      bottom: 16 * u,
                      left: Math.min(
                        Math.max(at + 7 * u, 8 * u),
                        width - 30 * u,
                      ),
                    }),
              }}
            >
              {i * 10}
            </div>
          </Fragment>
        );
      })}
    </div>
  );

  const readout = (fg: string, muted: string) => (
    <div
      style={{
        position: "absolute",
        left: margin,
        top: margin,
        display: "flex",
        alignItems: "center",
        gap: 12 * u,
        fontFamily: plex.fontFamily,
        fontWeight: 500,
        fontSize: labelFs,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        color: fg,
      }}
    >
      <span
        style={{
          display: "grid",
          overflow: "hidden",
        }}
      >
        <span
          style={{
            gridArea: "1 / 1",
            transform: `translateY(${-swapT * 110}%)`,
          }}
        >
          {fromLabel}
        </span>
        <span
          style={{
            gridArea: "1 / 1",
            transform: `translateY(${(1 - swapT) * 110}%)`,
          }}
        >
          {toLabel}
        </span>
      </span>
      <span style={{ width: 24 * u, height: 1, background: muted }} />
      <span
        style={{
          color: muted,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {fmt(remaining)}%
      </span>
    </div>
  );

  const statStyle = {
    fontFamily: instrument.fontFamily,
    fontWeight: 500,
    fontSize: statFs,
    lineHeight: 0.9,
    letterSpacing: "-0.05em",
    fontVariantNumeric: "tabular-nums",
    color: p.fg,
    whiteSpace: "nowrap",
  } as const;

  return (
    <AbsoluteFill
      style={{
        background: transparent ? "transparent" : (background ?? p.bg),
        overflow: "hidden",
      }}
    >
      {scale(p.tick, p.muted)}
      <div style={{ position: "absolute", inset: 0, opacity: intro }}>
        {readout(p.fg, p.muted)}
      </div>
      <div
        style={{
          position: "absolute",
          inset: 0,
          clipPath: statClip,
          opacity: interpolate(frame, [18, 20], [0, 1], CLAMP),
          zIndex: 2,
        }}
      >
        <div
          style={{
            position: "absolute",
            ...(portrait
              ? {
                  left: margin,
                  right: margin * 1.6,
                  bottom: margin,
                  height: Math.max(zone, height * 0.3) - margin,
                  justifyContent: "flex-end",
                }
              : {
                  right: margin,
                  top: margin,
                  bottom: margin * 1.45,
                  width: Math.max(zone, width * 0.36) - margin * 1.6,
                  justifyContent: "flex-end",
                }),
            display: "flex",
            flexDirection: "column",
            alignItems: portrait ? "flex-start" : "flex-end",
            textAlign: portrait ? "left" : "right",
          }}
        >
          <div
            style={{
              ...statStyle,
              marginRight: portrait ? 0 : -statFs * 0.04,
              marginLeft: portrait ? -statFs * 0.04 : 0,
            }}
          >
            {prefix}
            {fmt(counted)}
            {suffix}
          </div>
          <div
            style={{
              marginTop: statFs * 0.14,
              maxWidth: portrait
                ? width - margin * 2
                : Math.max(roomW, 300 * u),
              fontFamily: instrument.fontFamily,
              fontWeight: 400,
              fontSize: (portrait ? 46 : 34) * u,
              lineHeight: 1.12,
              letterSpacing: "-0.02em",
              color: p.fg,
              textWrap: "balance",
            }}
          >
            {words.map((w, k) => {
              const t = wordT(k);
              return (
                <Fragment key={`${w}-${k}`}>
                  {k > 0 ? " " : null}
                  <span
                    style={{
                      display: "inline-block",
                      overflow: "hidden",
                      verticalAlign: "top",
                      paddingBottom: "0.12em",
                      marginBottom: "-0.12em",
                    }}
                  >
                    <span
                      style={{
                        display: "inline-block",
                        transform: `translateY(${(1 - t) * 105}%)`,
                      }}
                    >
                      {w}
                    </span>
                  </span>
                </Fragment>
              );
            })}
          </div>
          {caption ? (
            <div
              style={{
                marginTop: 16 * u,
                fontFamily: plex.fontFamily,
                fontWeight: 500,
                fontSize: labelFs * (portrait ? 1.3 : 1),
                letterSpacing: "0.04em",
                textTransform: "uppercase",
                color: p.muted,
                opacity: capT,
                transform: `translateY(${(1 - capT) * 8 * u}px)`,
              }}
            >
              {caption}
            </div>
          ) : null}
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          inset: 0,
          clipPath: fieldClip,
          opacity: intro,
          background: [...blobs, p.fieldBg].join(", "),
        }}
      >
        <Grain opacity={0.1} />
        {scale(p.fieldTick, p.fieldMuted)}
        {readout(p.fieldFg, p.fieldMuted)}
      </div>

      <div
        style={{
          position: "absolute",
          ...(portrait
            ? { left: 0, right: 0, top: edgePos - 1 * u, height: 2 * u }
            : { top: 0, bottom: 0, left: edgePos - 1 * u, width: 2 * u }),
          background: p.edge,
          opacity: edgeO * intro,
          zIndex: 3,
        }}
      />
    </AbsoluteFill>
  );
}
