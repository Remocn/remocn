"use client";

import { type ReactNode, useId } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

export type BlueprintLabels = {
  width: string;
  height: string;
  callout: string;
  title: string;
};

export type BlueprintProps = {
  /** Product to convert. Its silhouette and dark details become white linework. Defaults to a red device. */
  children?: ReactNode;
  /** Measured box around the product, as fractions of the frame [width, height]. */
  box?: [number, number];
  /** Point the red callout points at, as fractions of the box [x, y]. */
  calloutAt?: [number, number];
  blueprintColor?: string;
  lineColor?: string;
  calloutColor?: string;
  /** Ground behind the product before the wipe. */
  background?: string;
  productColor?: string;
  labels?: Partial<BlueprintLabels>;
  speed?: number;
};

export const blueprintDefaults = {
  box: [0.17, 0.6] as [number, number],
  calloutAt: [0.5, 0.11] as [number, number],
  blueprintColor: "#173C8F",
  lineColor: "#FFFFFF",
  calloutColor: "#E5322D",
  background: "#FFFFFF",
  productColor: "#E5322D",
  labels: {
    width: "71.6 mm",
    height: "147.5 mm",
    callout: "SENSOR",
    title: "DWG A-01  SCALE 1:1",
  } as BlueprintLabels,
  speed: 1,
};

export const blueprintLength = 45;

const MONO = "ui-monospace, 'SF Mono', Menlo, Consolas, monospace";
const clamp = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};
const ease = (t: number, from: number, to: number) =>
  interpolate(t, [from, to], [0, 1], {
    ...clamp,
    easing: Easing.inOut(Easing.cubic),
  });

export function Blueprint({
  children,
  box = blueprintDefaults.box,
  calloutAt = blueprintDefaults.calloutAt,
  blueprintColor = blueprintDefaults.blueprintColor,
  lineColor = blueprintDefaults.lineColor,
  calloutColor = blueprintDefaults.calloutColor,
  background = blueprintDefaults.background,
  productColor = blueprintDefaults.productColor,
  labels,
  speed = blueprintDefaults.speed,
}: BlueprintProps) {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const text = { ...blueprintDefaults.labels, ...labels };
  const t = (frame / fps) * 30 * speed;
  const u = Math.min(width, height) / 720;

  const cx = width * 0.47;
  const cy = height * 0.46;
  const bw = box[0] * width;
  const bh = box[1] * height;
  const x0 = cx - bw / 2;
  const x1 = cx + bw / 2;
  const y0 = cy - bh / 2;
  const y1 = cy + bh / 2;
  const radius = Math.min(bw, bh) * 0.16;
  const dot = { x: x0 + calloutAt[0] * bw, y: y0 + calloutAt[1] * bh };

  const wipe = interpolate(t, [6, 24], [-0.04, 1.04], {
    ...clamp,
    easing: Easing.inOut(Easing.cubic),
  });
  const wipeX = wipe * width;
  const outline = ease(t, 8, 28);
  const extension = ease(t, 22, 28);
  const dims = ease(t, 24, 32);
  const label = ease(t, 30, 36);
  const leader = ease(t, 32, 40);
  const bubble = interpolate(t, [36, 42], [0, 1], {
    ...clamp,
    easing: Easing.out(Easing.back(2)),
  });
  const calloutText = ease(t, 38, 44);

  const stroke = 2.4 * u;
  const thin = 1.2 * u;
  const tick = 7 * u;
  const dimY = y1 + 0.08 * height;
  const dimX = x1 + 0.06 * width;
  const half = (a: number, b: number, p: number) => [
    (a + b) / 2 - ((b - a) / 2) * p,
    (a + b) / 2 + ((b - a) / 2) * p,
  ];
  const [hx0, hx1] = half(x0, x1, dims);
  const [vy0, vy1] = half(y0, y1, dims);
  // Callout goes left of the product when the label fits, otherwise above it.
  const ring = Math.min(bw, bh) * 0.11;
  const labelWidth = text.callout.length * 11.8 * u + 26 * u;
  const sideways = x0 - 0.14 * width - labelWidth > 0.03 * width;
  const lead = sideways
    ? { x: x0 - 0.14 * width, y: y0 + 0.06 * height }
    : {
        x: Math.max(0.06 * width, dot.x - 0.1 * width),
        y: Math.max(0.08 * height, y0 - 0.1 * height),
      };
  const elbow = sideways
    ? `L ${lead.x + 0.06 * width} ${lead.y} H ${lead.x}`
    : `L ${lead.x} ${lead.y}`;
  const draw = (p: number) => ({
    pathLength: 1,
    strokeDasharray: 1,
    strokeDashoffset: 1 - p,
    opacity: p > 0 ? 1 : 0,
  });
  const minor = 22 * u;

  return (
    <AbsoluteFill style={{ backgroundColor: background, overflow: "hidden" }}>
      <svg width={0} height={0} style={{ position: "absolute" }} aria-hidden>
        <defs>
          <filter
            id={`${id}-lines`}
            x="0"
            y="0"
            width="1"
            height="1"
            colorInterpolationFilters="sRGB"
          >
            <feMorphology
              in="SourceAlpha"
              operator="dilate"
              radius={1.6 * u}
              result="grown"
            />
            <feComposite
              in="grown"
              in2="SourceAlpha"
              operator="out"
              result="edge"
            />
            <feColorMatrix
              in="SourceGraphic"
              type="matrix"
              values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -3 -6 -1 4 -1.2"
              result="dark"
            />
            <feMorphology
              in="dark"
              operator="dilate"
              radius={1.6 * u}
              result="darkGrown"
            />
            <feComposite
              in="darkGrown"
              in2="dark"
              operator="out"
              result="darkEdge"
            />
            <feMerge result="all">
              <feMergeNode in="edge" />
              <feMergeNode in="darkEdge" />
            </feMerge>
            <feFlood floodColor={lineColor} />
            <feComposite in2="all" operator="in" />
          </filter>
        </defs>
      </svg>

      {/* Product, before the wipe. */}
      <AbsoluteFill>
        {children ? (
          <AbsoluteFill
            style={{ alignItems: "center", justifyContent: "center" }}
          >
            <div
              style={{
                transform: `translate(${cx - width / 2}px, ${cy - height / 2}px)`,
              }}
            >
              {children}
            </div>
          </AbsoluteFill>
        ) : (
          <svg width={width} height={height} aria-hidden>
            <rect
              x={x0}
              y={y0 + 10 * u}
              width={bw}
              height={bh}
              rx={radius}
              fill="#000"
              opacity={0.12}
              style={{ filter: `blur(${14 * u}px)` }}
            />
            <rect
              x={x0}
              y={y0}
              width={bw}
              height={bh}
              rx={radius}
              fill={productColor}
            />
            <circle cx={dot.x} cy={dot.y} r={bw * 0.06} fill="#111111" />
          </svg>
        )}
      </AbsoluteFill>

      {/* Technical drawing, revealed left to right. */}
      <AbsoluteFill style={{ clipPath: `inset(0 ${width - wipeX}px 0 0)` }}>
        <svg width={width} height={height} aria-hidden>
          <defs>
            <pattern
              id={`${id}-grid`}
              width={minor * 5}
              height={minor * 5}
              patternUnits="userSpaceOnUse"
            >
              <path
                d={Array.from(
                  { length: 5 },
                  (_, i) =>
                    `M ${i * minor} 0 V ${minor * 5} M 0 ${i * minor} H ${minor * 5}`,
                ).join(" ")}
                stroke={lineColor}
                strokeOpacity={0.09}
                strokeWidth={u}
              />
              <path
                d={`M 0 0 V ${minor * 5} M 0 0 H ${minor * 5}`}
                stroke={lineColor}
                strokeOpacity={0.22}
                strokeWidth={u}
              />
            </pattern>
          </defs>
          <rect width={width} height={height} fill={blueprintColor} />
          <rect width={width} height={height} fill={`url(#${id}-grid)`} />
        </svg>
        {children ? (
          <AbsoluteFill
            style={{
              alignItems: "center",
              justifyContent: "center",
              filter: `url(#${id}-lines)`,
              clipPath: `inset(0 ${width * (1 - outline)}px 0 0)`,
            }}
          >
            <div
              style={{
                transform: `translate(${cx - width / 2}px, ${cy - height / 2}px)`,
              }}
            >
              {children}
            </div>
          </AbsoluteFill>
        ) : null}
        <svg
          width={width}
          height={height}
          style={{ position: "absolute", inset: 0 }}
          aria-hidden
        >
          <g fill="none" stroke={lineColor} strokeLinecap="round">
            {children ? null : (
              <>
                <rect
                  x={x0}
                  y={y0}
                  width={bw}
                  height={bh}
                  rx={radius}
                  strokeWidth={stroke}
                  {...draw(outline)}
                />
                <rect
                  x={x0 + bw * 0.07}
                  y={y0 + bw * 0.07}
                  width={bw * 0.86}
                  height={bh - bw * 0.14}
                  rx={radius * 0.7}
                  strokeWidth={thin}
                  strokeOpacity={0.7}
                  {...draw(outline)}
                />
                <circle
                  cx={dot.x}
                  cy={dot.y}
                  r={bw * 0.06}
                  strokeWidth={stroke}
                  {...draw(outline)}
                />
              </>
            )}
            {/* Center lines */}
            <path
              d={`M ${cx} ${y0 - 0.05 * height} V ${y1 + 0.05 * height} M ${x0 - 0.04 * width} ${cy} H ${x1 + 0.04 * width}`}
              strokeWidth={thin}
              strokeOpacity={0.55 * outline}
              strokeDasharray={`${14 * u} ${4 * u} ${3 * u} ${4 * u}`}
            />
            {/* Extension lines */}
            <path
              d={`M ${x0} ${y1 + 8 * u} V ${y1 + 8 * u + (dimY - y1) * extension} M ${x1} ${y1 + 8 * u} V ${y1 + 8 * u + (dimY - y1) * extension} M ${x1 + 8 * u} ${y0} H ${x1 + 8 * u + (dimX - x1) * extension} M ${x1 + 8 * u} ${y1} H ${x1 + 8 * u + (dimX - x1) * extension}`}
              strokeWidth={thin}
              strokeOpacity={0.8}
            />
            {/* Dimension lines with architectural ticks */}
            <path
              d={`M ${hx0} ${dimY} H ${hx1} M ${dimX} ${vy0} V ${vy1}`}
              strokeWidth={thin * 1.3}
            />
            {dims > 0.98
              ? [
                  [x0, dimY],
                  [x1, dimY],
                  [dimX, y0],
                  [dimX, y1],
                ].map(([x, y]) => (
                  <line
                    key={`${x}-${y}`}
                    x1={x - tick}
                    y1={y + tick}
                    x2={x + tick}
                    y2={y - tick}
                    strokeWidth={stroke}
                  />
                ))
              : null}
          </g>
          <g
            fontFamily={MONO}
            fontSize={17 * u}
            letterSpacing={1.5 * u}
            fill={lineColor}
            opacity={label}
          >
            <rect
              x={cx - 62 * u}
              y={dimY - 12 * u}
              width={124 * u}
              height={24 * u}
              fill={blueprintColor}
            />
            <text x={cx} y={dimY + 6 * u} textAnchor="middle">
              {text.width}
            </text>
            {bh > 190 * u ? (
              <g transform={`translate(${dimX} ${cy}) rotate(-90)`}>
                <rect
                  x={-66 * u}
                  y={-12 * u}
                  width={132 * u}
                  height={24 * u}
                  fill={blueprintColor}
                />
                <text y={6 * u} textAnchor="middle">
                  {text.height}
                </text>
              </g>
            ) : (
              <text x={dimX + 16 * u} y={cy + 6 * u}>
                {text.height}
              </text>
            )}
            <g
              transform={`translate(${width - 0.05 * width} ${height - 0.06 * height})`}
            >
              <rect
                x={-290 * u}
                y={-40 * u}
                width={290 * u}
                height={40 * u}
                fill="none"
                stroke={lineColor}
                strokeWidth={thin}
              />
              <text x={-276 * u} y={-14 * u} fontSize={14 * u}>
                {text.title}
              </text>
            </g>
          </g>
          {/* Red callout */}
          <g
            stroke={calloutColor}
            fill="none"
            strokeWidth={stroke}
            strokeLinecap="round"
          >
            <circle cx={dot.x} cy={dot.y} r={ring} {...draw(leader)} />
            <path
              d={`M ${dot.x - ring * 0.72} ${dot.y - ring * 0.72} ${elbow}`}
              {...draw(leader)}
            />
            <circle
              cx={lead.x}
              cy={lead.y}
              r={16 * u * bubble}
              fill={calloutColor}
              stroke="none"
            />
          </g>
          <g fontFamily={MONO} opacity={calloutText}>
            <text
              x={lead.x}
              y={lead.y + 6 * u}
              textAnchor="middle"
              fontSize={16 * u}
              fontWeight={700}
              fill={lineColor}
            >
              A
            </text>
            <text
              x={sideways ? lead.x - 26 * u : lead.x + 26 * u}
              y={lead.y + 6 * u}
              textAnchor={sideways ? "end" : "start"}
              fontSize={17 * u}
              letterSpacing={1.5 * u}
              fill={lineColor}
            >
              {text.callout}
            </text>
          </g>
        </svg>
      </AbsoluteFill>

      {/* Scan edge */}
      <AbsoluteFill
        style={{
          left: wipeX - 2 * u,
          width: 4 * u,
          backgroundColor: lineColor,
          boxShadow: `0 0 ${24 * u}px ${6 * u}px ${lineColor}`,
          opacity: wipe > 0 && wipe < 1 ? 0.9 : 0,
        }}
      />
    </AbsoluteFill>
  );
}
