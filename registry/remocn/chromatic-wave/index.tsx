"use client";

import { useId } from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";

export interface ChromaticWaveProps {
  className?: string;
  width?: number;
  height?: number;
  headline?: string;
  kicker?: string;
  headlineFontFamily?: string;
  kickerFontFamily?: string;
  headlineFontSize?: number;
  kickerFontSize?: number;
  kickerTracking?: number;
  headlineBaselineY?: number;
  kickerBaselines?: [number, number];
  textCenterX?: number;
  fill?: string;
  background?: string;
  bandHeight?: number;
  bandCopies?: number;
  bandPitch?: number;
  mapStartY?: number;
  mapEndY?: number;
  mapTravelFrames?: number;
  waveHeight?: number;
  waveWidth?: number;
  waveSpeed?: number;
  turbulentAmount?: number;
  turbulentSize?: number;
  evolutionPerSecond?: number;
  mapBlurRadius?: number;
  mapBlurIterations?: number;
  glassDisplacement?: number;
  maxDisplacementPx?: number;
  glassPasses?: number;
  channelOrder?: ("red" | "green" | "blue")[];
}

function boxBlurSigma(radius: number, iterations: number): number {
  const w = 2 * radius + 1;
  return Math.sqrt((iterations * (w * w - 1)) / 12);
}

function buildMapUri({
  width,
  height,
  bandHeight,
  bandCopies,
  bandPitch,
  mapY,
  waveHeight,
  waveWidth,
  phase,
}: {
  width: number;
  height: number;
  bandHeight: number;
  bandCopies: number;
  bandPitch: number;
  mapY: number;
  waveHeight: number;
  waveWidth: number;
  phase: number;
}): string {
  const overhang = 120;
  const segments = 48;

  const bands = Array.from({ length: bandCopies }, (_, i) => {
    const top = mapY + i * bandPitch - bandHeight / 2;
    const pts = Array.from({ length: segments + 1 }, (_, s) => {
      const x = -overhang + (s / segments) * (width + overhang * 2);
      const y =
        top + Math.sin((x / waveWidth) * Math.PI * 2 + phase) * waveHeight;
      return `${x},${y}`;
    });
    const back = Array.from({ length: segments + 1 }, (_, s) => {
      const x =
        -overhang + ((segments - s) / segments) * (width + overhang * 2);
      const y =
        top +
        bandHeight +
        Math.sin((x / waveWidth) * Math.PI * 2 + phase) * waveHeight;
      return `${x},${y}`;
    });
    return `<path d="M${pts.join("L")}L${back.join("L")}Z" fill="url(#g)"/>`;
  }).join("");

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">` +
    `<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1">` +
    `<stop offset="0" stop-color="rgb(128,128,128)"/>` +
    `<stop offset="0.25" stop-color="rgb(0,0,0)"/>` +
    `<stop offset="0.5" stop-color="rgb(128,128,128)"/>` +
    `<stop offset="0.75" stop-color="rgb(255,255,255)"/>` +
    `<stop offset="1" stop-color="rgb(128,128,128)"/>` +
    `</linearGradient></defs>` +
    `<rect width="${width}" height="${height}" fill="rgb(128,128,128)"/>` +
    bands +
    `</svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function ChromaticWave({
  className,
  width = 1920,
  height = 1080,
  headline = "MUSIC",
  kicker = "APPLES",
  headlineFontFamily = "'Helvetica Neue', Helvetica, Arial, sans-serif",
  kickerFontFamily = "'Helvetica Neue', Helvetica, Arial, sans-serif",
  headlineFontSize = 174,
  kickerFontSize = 52,
  kickerTracking = 32,
  headlineBaselineY = 601,
  kickerBaselines = [444, 670],
  textCenterX = 960,
  fill = "#ffffff",
  background = "#000000",
  bandHeight = 147.1,
  bandCopies = 7,
  bandPitch = 750,
  mapStartY = 31,
  mapEndY = 1560,
  mapTravelFrames = 150,
  waveHeight = 28,
  waveWidth = 272,
  waveSpeed = 1,
  turbulentAmount = 130,
  turbulentSize = 163,
  evolutionPerSecond = 50,
  mapBlurRadius = 13,
  mapBlurIterations = 6,
  glassDisplacement = 100,
  maxDisplacementPx = 39,
  glassPasses = 3,
  channelOrder = ["blue", "green", "red"],
}: ChromaticWaveProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const filterId = useId();
  const seconds = frame / fps;

  const mapY = interpolate(frame, [0, mapTravelFrames], [mapStartY, mapEndY], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const mapUri = buildMapUri({
    width,
    height,
    bandHeight,
    bandCopies,
    bandPitch,
    mapY,
    waveHeight,
    waveWidth,
    phase: seconds * waveSpeed * Math.PI * 2,
  });

  const mapSigma = boxBlurSigma(mapBlurRadius, mapBlurIterations);
  const evolution = seconds * evolutionPerSecond;

  const channelMatrix: Record<string, string> = {
    red: "1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0",
    green: "0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0",
    blue: "0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0",
  };

  const content = (
    <>
      <text
        x={textCenterX}
        y={kickerBaselines[0]}
        textAnchor="middle"
        fontFamily={kickerFontFamily}
        fontSize={kickerFontSize}
        letterSpacing={kickerTracking}
        fill={fill}
      >
        {kicker}
      </text>
      <text
        x={textCenterX}
        y={headlineBaselineY}
        textAnchor="middle"
        fontFamily={headlineFontFamily}
        fontWeight={700}
        fontSize={headlineFontSize}
        fill={fill}
      >
        {headline}
      </text>
      <text
        x={textCenterX}
        y={kickerBaselines[1]}
        textAnchor="middle"
        fontFamily={kickerFontFamily}
        fontSize={kickerFontSize}
        letterSpacing={kickerTracking}
        fill={fill}
      >
        {kicker}
      </text>
    </>
  );

  return (
    <div
      className={className}
      style={{ position: "absolute", inset: 0, overflow: "hidden" }}
    >
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="xMidYMid meet"
        style={{ display: "block" }}
      >
        <defs>
          {Array.from({ length: glassPasses }, (_, i) => {
            const depth =
              ((i + 1) / glassPasses) *
              maxDisplacementPx *
              (glassDisplacement / 100);
            return (
              <filter
                key={channelOrder[i] ?? i}
                id={`${filterId}-${i}`}
                filterUnits="userSpaceOnUse"
                x="0"
                y="0"
                width={width}
                height={height}
                colorInterpolationFilters="sRGB"
              >
                <feImage
                  href={mapUri}
                  x="0"
                  y="0"
                  width={width}
                  height={height}
                  result="rawMap"
                />
                <feTurbulence
                  type="turbulence"
                  baseFrequency={1 / Math.max(turbulentSize, 1)}
                  numOctaves={1}
                  seed={11}
                  result="noise"
                />
                <feOffset
                  in="noise"
                  dx={evolution}
                  dy={evolution * 0.4}
                  result="noiseMoved"
                />
                <feDisplacementMap
                  in="rawMap"
                  in2="noiseMoved"
                  scale={turbulentAmount}
                  xChannelSelector="R"
                  yChannelSelector="G"
                  result="turbulentMap"
                />
                <feGaussianBlur
                  in="turbulentMap"
                  stdDeviation={mapSigma}
                  result="slopeMap"
                />
                <feDisplacementMap
                  in="SourceGraphic"
                  in2="slopeMap"
                  scale={depth}
                  xChannelSelector="R"
                  yChannelSelector="R"
                  result="displaced"
                />
                <feColorMatrix
                  in="displaced"
                  type="matrix"
                  values={channelMatrix[channelOrder[i] ?? "red"]}
                />
              </filter>
            );
          })}
        </defs>

        <rect width={width} height={height} fill={background} />

        {Array.from({ length: glassPasses }, (_, i) => (
          <g
            key={channelOrder[i] ?? i}
            filter={`url(#${filterId}-${i})`}
            style={{ mixBlendMode: "screen" }}
          >
            {content}
          </g>
        ))}
      </svg>
    </div>
  );
}
