"use client";

import { useId } from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";

export interface GooeyMorphProps {
  className?: string;
  width?: number;
  height?: number;
  barWidth?: number;
  barHeight?: number;
  barStartPositions?: [number, number][];
  barRestPositions?: [number, number][];
  barEntryFrames?: number[];
  barTravelFrames?: number;
  word?: string;
  fontFamily?: string;
  fontSize?: number;
  tracking?: number;
  wordCenterX?: number;
  wordBaselineY?: number;
  blurRadius?: number;
  blurIterations?: number;
  alphaInputBlack?: number;
  alphaInputWhite?: number;
  morphStartFrame?: number;
  morphPeakFrame?: number;
  morphEndFrame?: number;
  displaceAmount?: number;
  displaceSize?: number;
  displaceComplexity?: number;
  displaceEvolutionPerSecond?: number;
  fill?: string;
}

function boxBlurSigma(radius: number, iterations: number): number {
  const w = 2 * radius + 1;
  return Math.sqrt((iterations * (w * w - 1)) / 12);
}

export function GooeyMorph({
  className,
  width = 1920,
  height = 1080,
  barWidth = 213,
  barHeight = 181,
  barStartPositions = [
    [956.9, 764.9],
    [297.5, 799.9],
    [738.2, 257.9],
    [1617.9, 302.9],
  ],
  barRestPositions = [
    [634.9, 538.9],
    [852.5, 538.9],
    [1070.2, 538.9],
    [1287.9, 538.9],
  ],
  barEntryFrames = [8, 0, 4, 13],
  barTravelFrames = 30,
  word = "HELLO",
  fontFamily = "sans-serif",
  fontSize = 237,
  tracking = 0,
  wordCenterX = 961.4,
  wordBaselineY = 601.3,
  blurRadius = 6,
  blurIterations = 6,
  alphaInputBlack = 0.4588,
  alphaInputWhite = 0.5098,
  morphStartFrame = 50,
  morphPeakFrame = 63,
  morphEndFrame = 76,
  displaceAmount = 20,
  displaceSize = 19,
  displaceComplexity = 1,
  displaceEvolutionPerSecond = 50,
  fill = "#ffffff",
}: GooeyMorphProps) {
  const frame = useCurrentFrame();
  const filterId = useId();

  const travelEase = Easing.bezier(0.88, 0.14, 0.12, 0.86);

  const morphWindow: [number, number, number] = [
    morphStartFrame,
    morphPeakFrame,
    morphEndFrame,
  ];

  const blur = interpolate(frame, morphWindow, [0, blurRadius, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.33, 0, 0.67, 1),
  });
  const sigma = boxBlurSigma(blur, blurIterations);

  const displaceScale = interpolate(
    frame,
    morphWindow,
    [0, displaceAmount, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.bezier(0.33, 0, 0.67, 1),
    },
  );

  const barsOpacity = interpolate(
    frame,
    [morphStartFrame, morphEndFrame],
    [1, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );
  const wordOpacity = interpolate(
    frame,
    [morphStartFrame, morphEndFrame],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );

  const slope = 1 / Math.max(alphaInputWhite - alphaInputBlack, 1e-6);
  const offset = -alphaInputBlack * slope;

  const evolution = (frame / 30) * displaceEvolutionPerSecond;

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
          <filter
            id={filterId}
            x="-15%"
            y="-15%"
            width="130%"
            height="130%"
            colorInterpolationFilters="sRGB"
          >
            <feGaussianBlur
              in="SourceGraphic"
              stdDeviation={sigma}
              result="blurred"
            />
            <feColorMatrix
              in="blurred"
              type="matrix"
              values={[
                "1 0 0 0 0",
                "0 1 0 0 0",
                "0 0 1 0 0",
                `0 0 0 ${slope} ${offset}`,
              ].join(" ")}
              result="threshold"
            />
            <feTurbulence
              type="fractalNoise"
              baseFrequency={1 / Math.max(displaceSize, 1)}
              numOctaves={Math.max(1, Math.round(displaceComplexity))}
              seed={7}
              result="noise"
            />
            <feOffset
              in="noise"
              dx={evolution}
              dy={evolution * 0.6}
              result="noiseMoved"
            />
            <feDisplacementMap
              in="threshold"
              in2="noiseMoved"
              scale={displaceScale}
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>

        <g filter={`url(#${filterId})`}>
          <g opacity={barsOpacity}>
            {barRestPositions.map((rest, i) => {
              const start = barStartPositions[i] ?? rest;
              const entry = barEntryFrames[i] ?? 0;
              const local = frame - entry;
              const stops = [0, barTravelFrames / 2, barTravelFrames];

              const x = interpolate(
                local,
                stops,
                [start[0], rest[0], rest[0]],
                {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                  easing: travelEase,
                },
              );
              const y = interpolate(
                local,
                stops,
                [start[1], start[1], rest[1]],
                {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                  easing: travelEase,
                },
              );

              return (
                <rect
                  key={rest.join(",")}
                  x={x - barWidth / 2}
                  y={y - barHeight / 2}
                  width={barWidth}
                  height={barHeight}
                  fill={fill}
                />
              );
            })}
          </g>

          <text
            x={wordCenterX}
            y={wordBaselineY}
            textAnchor="middle"
            fontFamily={fontFamily}
            fontSize={fontSize}
            fontWeight={900}
            letterSpacing={tracking}
            fill={fill}
            opacity={wordOpacity}
          >
            {word}
          </text>
        </g>
      </svg>
    </div>
  );
}
