"use client";

import { type ReactNode, useId } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

export type XRayScanColors = {
  background: string;
  shell: string;
  detail: string;
  xray: string;
  line: string;
  accent: string;
};

export type XRayScanProps = {
  /** Exterior shown ahead of the bar. Defaults to the back of a phone. */
  outside?: ReactNode;
  /** Interior revealed behind the bar. Defaults to white-line phone internals. */
  inside?: ReactNode;
  colors?: Partial<XRayScanColors>;
  /** Phone shell color. Overrides `colors.shell` when set. */
  shell?: string;
  /** Highlighted internal part. Overrides `colors.accent` when set. */
  accent?: string;
  /** Scan line and interior line art. Overrides `colors.line` when set. */
  line?: string;
  /** Background. Overrides `colors.background` when set. */
  background?: string;
  /** "horizontal" sweeps left to right, "vertical" top to bottom. */
  direction?: "horizontal" | "vertical";
  speed?: number;
};

export const xRayScanDefaults = {
  colors: {
    background: "#111111",
    shell: "#E5322D",
    detail: "#111111",
    xray: "#07080A",
    line: "#FFFFFF",
    accent: "#E5322D",
  } as XRayScanColors,
  direction: "horizontal" as const,
  speed: 1,
};

export const xRayScanLength = 32;

const MONO = "ui-monospace, 'SF Mono', Menlo, Consolas, monospace";

type Device = { x: number; y: number; w: number; h: number; r: number };

function Outside({ id, d, c }: { id: string; d: Device; c: XRayScanColors }) {
  const lens = d.w * 0.085;
  return (
    <>
      <defs>
        <linearGradient id={`${id}-gloss`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity={0.22} />
          <stop offset="0.45" stopColor="#FFFFFF" stopOpacity={0} />
          <stop offset="1" stopColor="#000000" stopOpacity={0.18} />
        </linearGradient>
      </defs>
      <rect x={d.x} y={d.y} width={d.w} height={d.h} rx={d.r} fill={c.shell} />
      <rect
        x={d.x}
        y={d.y}
        width={d.w}
        height={d.h}
        rx={d.r}
        fill={`url(#${id}-gloss)`}
      />
      <rect
        x={d.x + d.w * 0.07}
        y={d.y + d.w * 0.07}
        width={d.w * 0.4}
        height={d.w * 0.4}
        rx={d.w * 0.1}
        fill={c.detail}
        opacity={0.92}
      />
      {[
        [0.17, 0.17],
        [0.37, 0.17],
        [0.17, 0.37],
      ].map(([fx, fy]) => (
        <g key={`${fx}${fy}`}>
          <circle
            cx={d.x + d.w * fx}
            cy={d.y + d.w * fy}
            r={lens}
            fill="#000"
            stroke="#2A2A2A"
            strokeWidth={lens * 0.25}
          />
          <circle
            cx={d.x + d.w * fx - lens * 0.3}
            cy={d.y + d.w * fy - lens * 0.3}
            r={lens * 0.18}
            fill="#FFFFFF"
            opacity={0.6}
          />
        </g>
      ))}
      <circle
        cx={d.x + d.w / 2}
        cy={d.y + d.h * 0.5}
        r={d.w * 0.07}
        fill={c.detail}
        opacity={0.85}
      />
    </>
  );
}

function Inside({ d, c, u }: { d: Device; c: XRayScanColors; u: number }) {
  const X = (f: number) => d.x + d.w * f;
  const Y = (f: number) => d.y + d.h * f;
  const pins = (x: number, y: number, w: number, h: number, n: number) =>
    Array.from({ length: n }, (_, i) => {
      const px = x + ((i + 0.5) / n) * w;
      return `M ${px} ${y - 4 * u} V ${y} M ${px} ${y + h} V ${y + h + 4 * u}`;
    }).join(" ");
  return (
    <>
      <rect x={d.x} y={d.y} width={d.w} height={d.h} rx={d.r} fill={c.xray} />
      <g fill="none" stroke={c.line} strokeWidth={2 * u} strokeLinejoin="round">
        <rect x={d.x} y={d.y} width={d.w} height={d.h} rx={d.r} />
        <rect
          x={X(0.04)}
          y={Y(0.02)}
          width={d.w * 0.92}
          height={d.h * 0.96}
          rx={d.r * 0.82}
          strokeOpacity={0.4}
        />
        {/* Camera ring */}
        {[
          [0.17, 0.17],
          [0.37, 0.17],
          [0.17, 0.37],
        ].map(([fx, fy]) => (
          <g key={`${fx}${fy}`}>
            <circle cx={X(fx)} cy={d.y + d.w * fy} r={d.w * 0.085} />
            <circle
              cx={X(fx)}
              cy={d.y + d.w * fy}
              r={d.w * 0.045}
              strokeOpacity={0.6}
            />
          </g>
        ))}
        {/* Logic board */}
        <path
          d={`M ${X(0.52)} ${Y(0.05)} H ${X(0.9)} V ${Y(0.36)} H ${X(0.1)} V ${Y(0.27)} H ${X(0.52)} Z`}
        />
        <rect
          x={X(0.6)}
          y={Y(0.08)}
          width={d.w * 0.22}
          height={d.h * 0.07}
          rx={2 * u}
        />
        <path
          d={pins(X(0.6), Y(0.08), d.w * 0.22, d.h * 0.07, 6)}
          strokeOpacity={0.6}
          strokeWidth={1.3 * u}
        />
        <rect
          x={X(0.16)}
          y={Y(0.295)}
          width={d.w * 0.16}
          height={d.h * 0.04}
          rx={2 * u}
          strokeOpacity={0.8}
        />
        <rect
          x={X(0.38)}
          y={Y(0.295)}
          width={d.w * 0.12}
          height={d.h * 0.04}
          rx={2 * u}
          strokeOpacity={0.8}
        />
        {/* Battery with wireless coil */}
        <rect
          x={X(0.12)}
          y={Y(0.4)}
          width={d.w * 0.76}
          height={d.h * 0.44}
          rx={6 * u}
        />
        <path
          d={`M ${X(0.42)} ${Y(0.4)} V ${Y(0.385)} H ${X(0.58)} V ${Y(0.4)}`}
        />
        {[0.26, 0.2, 0.14].map((f) => (
          <circle
            key={f}
            cx={X(0.5)}
            cy={Y(0.62)}
            r={d.w * f}
            strokeOpacity={0.45}
          />
        ))}
        <path
          d={`M ${X(0.5)} ${Y(0.47)} V ${Y(0.5)} M ${X(0.485)} ${Y(0.485)} H ${X(0.515)}`}
        />
        {/* Flex cable, speaker and port */}
        <path
          d={`M ${X(0.86)} ${Y(0.36)} V ${Y(0.38)} H ${X(0.92)} V ${Y(0.89)} H ${X(0.66)}`}
          strokeOpacity={0.6}
        />
        <rect
          x={X(0.38)}
          y={Y(0.935)}
          width={d.w * 0.24}
          height={d.h * 0.025}
          rx={d.h * 0.0125}
        />
        {Array.from({ length: 6 }, (_, i) => (
          <circle key={i} cx={X(0.14 + i * 0.035)} cy={Y(0.947)} r={1.8 * u} />
        ))}
      </g>
      {/* The one part in red: the SoC */}
      <g stroke={c.accent} strokeWidth={2.4 * u} fill="none">
        <rect
          x={X(0.6)}
          y={Y(0.17)}
          width={d.w * 0.22}
          height={d.w * 0.22}
          rx={3 * u}
          fill={c.accent}
          fillOpacity={0.22}
        />
        <path
          d={pins(X(0.6), Y(0.17), d.w * 0.22, d.w * 0.22, 5)}
          strokeWidth={1.4 * u}
        />
      </g>
      <text
        x={X(0.5)}
        y={Y(0.79)}
        textAnchor="middle"
        fontFamily={MONO}
        fontSize={12 * u}
        letterSpacing={2 * u}
        fill={c.line}
        opacity={0.7}
      >
        Li-ion 4500 mAh
      </text>
    </>
  );
}

export function XRayScan({
  outside,
  inside,
  colors,
  shell,
  accent,
  line,
  background,
  direction = xRayScanDefaults.direction,
  speed = xRayScanDefaults.speed,
}: XRayScanProps) {
  const frame = useCurrentFrame();
  const { width: W, height: H, fps } = useVideoConfig();
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const merged = { ...xRayScanDefaults.colors, ...colors };
  const c: XRayScanColors = {
    ...merged,
    shell: shell ?? merged.shell,
    accent: accent ?? merged.accent,
    line: line ?? merged.line,
    background: background ?? merged.background,
  };
  const t = (frame / fps) * 30 * speed;
  const u = Math.min(W, H) / 720;
  const vertical = direction === "vertical";

  const dh = 0.8 * H;
  const dw = dh * 0.49;
  const d: Device = {
    x: (W - dw) / 2,
    y: (H - dh) / 2,
    w: dw,
    h: dh,
    r: dw * 0.17,
  };
  const span = vertical ? H : W;
  const start = vertical ? d.y - 0.1 * H : d.x - 0.12 * W;
  const end = vertical ? d.y + d.h + 0.1 * H : d.x + d.w + 0.12 * W;
  const bar = interpolate(t, [5, 32], [start, end], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.sin),
  });
  const scanning = t > 5 && t < 32;
  const band = 0.12 * span;
  const behind = vertical
    ? `inset(0 0 ${H - bar}px 0)`
    : `inset(0 ${W - bar}px 0 0)`;
  const ahead = vertical ? `inset(${bar}px 0 0 0)` : `inset(0 0 0 ${bar}px)`;
  const hot = vertical
    ? `inset(${Math.max(0, bar - band)}px 0 ${H - bar}px 0)`
    : `inset(0 ${W - bar}px 0 ${Math.max(0, bar - band)}px)`;
  const trail = vertical ? "to top" : "to left";

  const insideLayer = inside ?? (
    <svg width={W} height={H} aria-hidden>
      <Inside d={d} c={c} u={u} />
    </svg>
  );

  return (
    <AbsoluteFill style={{ backgroundColor: c.background, overflow: "hidden" }}>
      <svg width={0} height={0} style={{ position: "absolute" }} aria-hidden>
        <filter id={`${id}-glow`} x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur stdDeviation={3 * u} result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </svg>
      <AbsoluteFill style={{ clipPath: ahead }}>
        {outside ?? (
          <svg width={W} height={H} aria-hidden>
            <Outside id={id} d={d} c={c} />
          </svg>
        )}
      </AbsoluteFill>
      <AbsoluteFill style={{ clipPath: behind }}>{insideLayer}</AbsoluteFill>
      {/* Fresh exposure glows brighter just behind the bar. */}
      <AbsoluteFill
        style={{
          clipPath: hot,
          filter: `url(#${id}-glow)`,
          opacity: scanning ? 0.9 : 0,
        }}
      >
        {insideLayer}
      </AbsoluteFill>
      <AbsoluteFill
        style={{
          clipPath: behind,
          opacity: scanning ? 1 : 0,
          background: `linear-gradient(${trail}, ${c.line}2E 0px, transparent ${band}px)`,
          backgroundPosition: vertical ? `0 ${bar - H}px` : `${bar - W}px 0`,
          backgroundRepeat: "no-repeat",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: vertical ? 0 : bar - 1.5 * u,
          top: vertical ? bar - 1.5 * u : 0,
          width: vertical ? W : 3 * u,
          height: vertical ? 3 * u : H,
          backgroundColor: c.line,
          boxShadow: `0 0 ${16 * u}px ${4 * u}px ${c.line}AA, 0 0 ${60 * u}px ${12 * u}px ${c.line}33`,
          opacity: scanning ? 1 : 0,
        }}
      />
    </AbsoluteFill>
  );
}
