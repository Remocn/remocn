"use client";

import { loadFont as loadManrope } from "@remotion/google-fonts/Manrope";
import type React from "react";
import { useId, useMemo } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const { fontFamily: manrope } = loadManrope("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});

export interface DotMapCity {
  lon: number;
  lat: number;
}

export interface DotMapProps {
  count?: number;
  label?: string;
  cities?: DotMapCity[];
  accent?: string;
  theme?: "dark" | "light";
  speed?: number;
}

type Poly = number[];

const LAND: Poly[] = [
  [
    -168, 66, -162, 70, -156, 71.3, -140, 69.6, -128, 70, -115, 68.5, -95, 68,
    -85, 69.5, -80, 69, -68, 66, -62, 60, -56, 52, -60, 47, -66, 44.5, -70, 42,
    -74, 40.5, -76, 35, -81, 31, -80.5, 25.5, -82.5, 28, -84, 30, -89, 30, -94,
    29.5, -97.5, 27, -97.5, 22, -95, 18.5, -91, 18.5, -90.5, 21, -87, 21.5, -88,
    16, -83.5, 15, -83.5, 11, -79.5, 9, -77.5, 8.5, -80, 7.5, -85.5, 10, -87.5,
    13, -92, 14.5, -96, 15.7, -105, 19.5, -106, 23, -109.5, 23.5, -112, 29,
    -117, 32.5, -120.5, 34.5, -124, 40, -124.5, 48, -130, 54.5, -137, 59, -146,
    60.5, -152, 59, -158, 57, -164, 55, -158, 58.5, -162, 60, -166, 62, -165,
    64.5,
  ],
  [
    -90, 74, -78, 73.5, -67, 70, -62, 66.5, -66, 62.5, -74, 64, -84, 66, -90,
    69,
  ],
  [
    -120, 76, -95, 81, -75, 83, -62, 82, -75, 78, -80, 76, -98, 75.5, -118,
    73.5,
  ],
  [
    -73, 78, -60, 82, -35, 83.5, -20, 82, -18, 76, -22, 70, -32, 68, -40, 65,
    -43, 60, -49, 61.5, -53, 66, -55, 70, -58, 75.5, -66, 77,
  ],
  [-85, 21.8, -82, 23.2, -77, 22.3, -74.2, 20.2, -77.5, 19.9, -80, 21.8],
  [-74.4, 18.5, -72.8, 19.9, -69, 19.7, -68.4, 18.5, -71.5, 17.6],
  [
    -77.5, 8.5, -72, 12, -63, 10.7, -58, 6.5, -52, 5, -50, 0, -44, -2.5, -35,
    -5.5, -35, -9, -39, -14, -39.5, -18, -41, -22.5, -48, -26, -48.5, -28.5,
    -53, -33.5, -57, -36, -57.5, -38.5, -62, -39, -65, -41, -63.5, -42.5, -67.5,
    -46, -66, -48, -69, -51, -68.5, -53, -70.5, -54.5, -73.5, -52.5, -75.5, -47,
    -73.5, -42, -73.5, -37, -71.5, -30, -70.5, -23, -70.3, -18, -75, -15.5, -77,
    -12, -79.5, -7.5, -81, -4.5, -80, -1, -80, 1, -78.5, 2.5, -77.5, 4, -77.5,
    7,
  ],
  [-24, 65.5, -14, 66.3, -13.5, 65, -18, 63.4, -22.5, 63.8],
  [
    -5.7, 50, 1.5, 51.2, 1.7, 52.7, 0, 53.5, -0.5, 54.5, -2, 55.9, -1.8, 57.6,
    -3.5, 58.6, -5, 58.6, -6.2, 56.6, -5, 55, -3, 54, -4.5, 53.3, -4.6, 52,
    -5.3, 51.7, -3, 51.4,
  ],
  [-10, 51.6, -6, 52.2, -6, 54, -7.5, 55.2, -10, 54.2],
  [
    -9.3, 43, -8, 43.7, -1.8, 43.4, -1.2, 46, -2.2, 47.1, -4.6, 47.9, -4.6,
    48.6, -1.6, 48.7, -1.3, 49.6, 0.2, 49.7, 1.6, 50.9, 3.2, 51.3, 4.4, 52.2,
    4.8, 53, 7, 53.4, 8.5, 53.8, 8.3, 56.9, 10.5, 57.6, 10.2, 55.2, 12, 54.3,
    14, 54, 19, 54.5, 21, 56.5, 23.5, 59.3, 29, 60, 22.5, 60.2, 21.5, 62.8, 25,
    65, 21.5, 65.8, 19, 63.5, 17.2, 61, 18.7, 59.8, 16.5, 57, 14.3, 55.5, 12.8,
    55.6, 11, 58.7, 10, 59.2, 6, 58.1, 5, 62, 10, 64, 14, 67.5, 18, 69.5, 25,
    71, 31, 70, 41, 67, 44, 68.5, 53, 68.3, 60, 69, 68, 72.5, 72, 73, 80, 72.5,
    87, 75, 100, 78, 105, 77.5, 113, 74, 127, 73.5, 140, 72.5, 150, 71.5, 160,
    70, 170, 70, 180, 69, 180, 65, 178, 62.5, 173, 61.3, 170, 60, 165, 60,
    163.5, 58, 162, 56, 160, 53.5, 156.6, 51, 156, 55, 156, 57.5, 154, 59.2,
    150, 59.6, 143, 59.3, 137, 54, 140.5, 52, 141, 48.5, 138, 45.5, 135, 43.3,
    132, 43, 130, 42.5, 129.5, 40.5, 129.3, 37, 129.4, 35.4, 126.5, 34.4, 126.3,
    36.8, 125.1, 37.8, 124.5, 39.8, 121.6, 39, 122, 40.5, 118.5, 39.2, 118.8,
    37.6, 122.5, 37.2, 120.5, 35.5, 119.5, 34.5, 121, 32, 122, 29.8, 121, 28,
    119.5, 25.5, 116.5, 23, 113, 22.3, 110.4, 21.1, 108, 21.6, 106.5, 20.5,
    105.7, 18.8, 108.5, 15.5, 109.3, 12.5, 108, 11, 105, 8.6, 104.8, 10.4, 103,
    11, 101, 12.5, 100.2, 13.3, 99.2, 10.4, 100.4, 7.3, 103.5, 4.5, 104.3, 1.4,
    103.4, 1.3, 101.3, 2.8, 100.3, 5, 98.3, 8.2, 98.5, 10.5, 97.7, 16.5, 94.5,
    16.2, 94, 19, 92, 21.5, 90, 21.8, 87.2, 21.5, 86.5, 20, 80.3, 15.5, 80.2,
    13, 79.8, 10.3, 77.5, 8, 76.3, 10, 74.8, 13, 73.4, 16, 72.8, 19.5, 72.6,
    21.4, 70.5, 20.8, 69, 22.4, 67.3, 24.6, 66.5, 25.4, 61.5, 25.2, 57.3, 25.8,
    56.5, 27.2, 54, 26.6, 51.5, 27.9, 50.2, 29.9, 48, 30, 48.5, 28.4, 50, 26.3,
    51.6, 24.2, 54.5, 24.2, 56, 25.6, 56.4, 24.3, 58.5, 23.6, 59.8, 22.4, 58.5,
    20.5, 57.7, 19, 55, 17.2, 52.2, 15.7, 48.7, 14, 45, 12.8, 43.5, 12.7, 42.7,
    15.5, 41.2, 18.5, 39, 21.5, 38.4, 24, 36.6, 26, 35, 28, 34.9, 29.5, 34.5,
    31.6, 35.5, 33.5, 36, 35, 36, 36.6, 34.5, 36.8, 32.5, 36.1, 30, 36.3, 28,
    36.7, 27.3, 37.5, 26.6, 38.4, 26.2, 39.5, 26.2, 40.6, 24, 40.8, 22.8, 40.4,
    23.8, 38, 23.2, 36.5, 21.7, 36.8, 21, 38.3, 20.2, 39.6, 19.4, 41.8, 18.5,
    42.5, 15.8, 43.7, 13.7, 45.1, 12.4, 45.4, 12.3, 44.3, 13.7, 43.5, 14.2,
    42.2, 16.1, 41.4, 18.5, 40.2, 16.6, 38.9, 15.7, 38, 15.9, 39.6, 14.9, 40.3,
    12.8, 41.3, 11.1, 42.4, 10, 44, 8.7, 44.4, 7, 43.6, 4.6, 43.4, 3.2, 41.9,
    0.9, 41, 0, 39.8, -0.6, 38.3, -2.2, 36.7, -4.4, 36.7, -5.6, 36, -6.4, 36.8,
    -7.4, 37.2, -8.9, 37, -8.8, 38.7, -9.5, 39.4, -8.8, 41.9,
  ],
  [-180, 69, -174, 67, -170, 66, -172, 64.5, -180, 65],
  [12.4, 38, 15.6, 38.3, 15.1, 36.7],
  [11, 78.5, 16, 80, 23, 80.3, 27, 79.5, 22, 77.5, 17, 76.5, 13, 77.5],
  [51.5, 71.5, 55, 73, 58, 75.5, 68, 77, 65, 75.5, 58, 72.5, 56, 70.6],
  [
    -5.9, 35.8, -1.5, 35.1, 3, 36.8, 10, 37.3, 11, 35, 10, 34, 11, 33.2, 15.2,
    32.3, 20, 30.8, 23, 32.6, 29, 30.9, 32.3, 31.2, 34.2, 31.3, 34.5, 28, 33.5,
    27, 35.5, 23.5, 37.2, 21, 38.5, 18, 39.7, 15.5, 43.3, 12.5, 44, 10.4, 51.2,
    11.8, 51, 10.5, 49, 6.5, 46, 2, 41.5, -1.8, 39.2, -4.7, 39.5, -8, 40.5,
    -10.5, 40.5, -15, 35, -22, 32.8, -25.8, 32.4, -28.6, 30, -31.3, 27, -33.5,
    22, -34.2, 18.5, -34.2, 18.2, -31.5, 15.2, -27, 14.5, -22.5, 11.8, -17,
    12.2, -13, 13.7, -10.7, 12, -5, 9, -1, 9.6, 3.5, 8.5, 4.5, 5.5, 4.3, 1.5,
    6.2, -2, 4.8, -7.5, 4.4, -11.5, 6.9, -13.3, 8.8, -15, 10.9, -16.7, 12.5,
    -17.4, 14.7, -16.4, 19.5, -17, 21, -15, 24.5, -13, 27.6, -9.8, 30, -9.5,
    32.5, -6.8, 34,
  ],
  [44, -25, 47, -25, 50.2, -15.5, 49.3, -12, 44.3, -16.2, 43.3, -22],
  [
    113.5, -22, 114, -26.5, 115, -34, 118, -35, 124, -33.8, 129, -31.6, 132,
    -31.5, 135.5, -34.8, 137.8, -32.5, 138.5, -35.5, 140, -38, 144, -38.3,
    146.5, -39, 150, -37.5, 153.2, -30, 153.5, -25, 150.5, -22, 146, -18.8,
    145.3, -15, 142.5, -10.7, 141.6, -13, 141.5, -16.5, 140.5, -17.5, 135.5,
    -15, 136.8, -12.2, 132, -11.3, 130, -13, 129.3, -15, 126, -14, 122.3, -17.2,
    121, -19.5, 117, -20.7,
  ],
  [144.7, -40.7, 148.3, -40.9, 147.9, -43.2, 146, -43.6],
  [172.7, -34.5, 178.5, -37.7, 177, -39.3, 174.8, -41.4, 173.8, -39.3],
  [172.6, -40.5, 174.2, -41.7, 171.2, -44.3, 169, -46.6, 166.5, -46, 172, -41],
  [
    129.6, 33.3, 131, 31, 132, 33.5, 135.3, 33.6, 139.8, 35, 140.9, 36.9, 141.9,
    39.5, 141.5, 41.4, 140, 40.8, 139.8, 38.4, 137, 37, 133, 35.5, 130.9, 34.3,
  ],
  [
    140, 41.5, 141.5, 42.5, 143.3, 42, 145.5, 43.3, 144.3, 44.2, 142, 45.5,
    141.7, 44.2, 140.4, 43.2,
  ],
  [120.1, 23, 121, 25.3, 122, 25, 120.8, 21.9],
  [79.7, 8, 80.2, 9.8, 81.9, 7.2, 80.5, 5.9],
  [95.2, 5.6, 98, 4, 104.5, -2.5, 106, -5.8, 102.3, -4, 98.5, 0, 95.3, 3],
  [105.2, -6.8, 108, -6.5, 112.5, -6.9, 114.5, -7.8, 110, -8.1, 106, -7.4],
  [
    109, 1.5, 110, -1.5, 111, -3, 114.5, -4, 116.5, -2, 118, 1, 119, 5, 116.5,
    7, 114, 4.5, 111.5, 2.5,
  ],
  [119.4, -3.5, 120, 1, 124.9, 1.5, 121.5, -1, 123, -4.5, 120.5, -5.6],
  [
    131, -1.3, 135, -3.3, 138, -1.6, 141, -2.6, 146, -5, 147.5, -6.5, 147.2,
    -8.5, 150, -10.4, 146, -8.1, 143.5, -9, 142.3, -9.2, 138.5, -8.3, 137.8,
    -5.5, 133.5, -4, 132, -2.7,
  ],
  [120, 18.5, 122.3, 18.5, 124, 13, 121.5, 13.9, 120.6, 14.5, 119.8, 16.3],
  [122, 7, 126.3, 6.3, 125.5, 9.8, 123.5, 8.5],
];

const WATER: Poly[] = [
  [-95, 59, -88, 56, -82, 53, -79, 55, -77, 60, -78, 62.5, -86, 64, -94, 62],
  [
    27.5, 42, 28, 44, 30, 45.5, 33, 44.5, 36.5, 45.3, 39.5, 47, 38, 44.5, 41.5,
    41.5, 36, 41.5, 31, 41.2, 28.5, 41,
  ],
  [
    47, 44.5, 49, 46.5, 53, 47, 53.5, 45, 51, 44, 52.5, 41.7, 54, 40.5, 53.8,
    37.3, 51, 36.7, 49, 38, 49.5, 40.3, 47.5, 43,
  ],
];

const DEFAULT_CITIES: DotMapCity[] = [
  { lon: -122.4, lat: 37.8 },
  { lon: -118.2, lat: 34.1 },
  { lon: -123.1, lat: 49.3 },
  { lon: -104.9, lat: 39.7 },
  { lon: -99.1, lat: 19.4 },
  { lon: -87.6, lat: 41.9 },
  { lon: -79.4, lat: 43.7 },
  { lon: -74, lat: 40.7 },
  { lon: -84.4, lat: 33.7 },
  { lon: -74.1, lat: 4.7 },
  { lon: -77, lat: -12 },
  { lon: -70.7, lat: -33.4 },
  { lon: -58.4, lat: -34.6 },
  { lon: -46.6, lat: -23.5 },
  { lon: -43.2, lat: -22.9 },
  { lon: -21.9, lat: 64.1 },
  { lon: -9.1, lat: 38.7 },
  { lon: -3.7, lat: 40.4 },
  { lon: -0.1, lat: 51.5 },
  { lon: -6.3, lat: 53.3 },
  { lon: 2.4, lat: 48.9 },
  { lon: 4.9, lat: 52.4 },
  { lon: -7.6, lat: 33.6 },
  { lon: 3.4, lat: 6.5 },
  { lon: 13.4, lat: 52.5 },
  { lon: 12.5, lat: 41.9 },
  { lon: 18.1, lat: 59.3 },
  { lon: 21, lat: 52.2 },
  { lon: 18.4, lat: -33.9 },
  { lon: 28, lat: -26.2 },
  { lon: 31.2, lat: 30 },
  { lon: 29, lat: 41 },
  { lon: 36.8, lat: -1.3 },
  { lon: 30.5, lat: 50.5 },
  { lon: 46.7, lat: 24.7 },
  { lon: 55.3, lat: 25.2 },
  { lon: 72.9, lat: 19.1 },
  { lon: 77.2, lat: 28.6 },
  { lon: 77.6, lat: 13 },
  { lon: 90.4, lat: 23.8 },
  { lon: 100.5, lat: 13.8 },
  { lon: 103.8, lat: 1.4 },
  { lon: 106.8, lat: -6.2 },
  { lon: 106.7, lat: 10.8 },
  { lon: 114.2, lat: 22.3 },
  { lon: 121.5, lat: 31.2 },
  { lon: 116.4, lat: 39.9 },
  { lon: 121, lat: 14.6 },
  { lon: 127, lat: 37.6 },
  { lon: 139.7, lat: 35.7 },
  { lon: 135.5, lat: 34.7 },
  { lon: 115.9, lat: -31.9 },
  { lon: 151.2, lat: -33.9 },
  { lon: 145, lat: -37.8 },
  { lon: 174.8, lat: -36.8 },
];

const STEP = 2.5;
const LAT_TOP = 80;
const LAT_BOTTOM = -57.5;
const COLS = Math.round(360 / STEP);
const ROWS = Math.round((LAT_TOP - LAT_BOTTOM) / STEP);

const EASE_IO = Easing.bezier(0.65, 0, 0.35, 1);
const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const THEMES = {
  dark: {
    bg: "#0A0A0B",
    fg: "#F3F2EF",
    muted: "#8B8A90",
    city: "#FFFFFF",
    lift: 0.08,
    dotAlpha: 1,
    grain: 0.06,
  },
  light: {
    bg: "#F5F4F0",
    fg: "#121214",
    muted: "#6E6C67",
    city: "#121214",
    lift: 0.3,
    dotAlpha: 0.85,
    grain: 0.045,
  },
} as const;

/**
 * gradients.sh palettes, sampled per dot so the land reads as a halftone
 * screen of the gradient: "mesh" on dark, "pixel-glass" on light.
 */
const PALETTES = {
  dark: {
    reach: 0.46,
    bg: "#0E1645",
    colors: ["#ECDCF2", "#2E45B7", "#8796EE", "#2E45B7", "#8796EE", "#ECDCF2"],
  },
  light: {
    reach: 0.68,
    bg: "#F4F3F1",
    colors: ["#7A3CFF", "#FF4FB8", "#3D6BFF"],
  },
} as const;
const BLOBS: [number, number][] = [
  [16, 20],
  [84, 26],
  [72, 86],
  [22, 80],
  [52, 48],
  [92, 62],
];

function rgb(hex: string): [number, number, number] {
  const v = Number.parseInt(hex.slice(1), 16);
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
}

function toHex(c: [number, number, number]) {
  return `#${c.map((v) => Math.round(v).toString(16).padStart(2, "0")).join("")}`;
}

/** CSS-equivalent of the stacked radial layers, evaluated at (x, y) in 0–1. */
function meshAt(
  x: number,
  y: number,
  bg: string,
  colors: readonly string[],
  drift: number,
  reach: number,
) {
  let c = rgb(bg);
  for (let i = BLOBS.length - 1; i >= 0; i--) {
    const bx = BLOBS[i][0] / 100 + 0.04 * Math.sin(drift + i * 1.7);
    const by = BLOBS[i][1] / 100 + 0.03 * Math.cos(drift * 0.8 + i * 2.3);
    const d = Math.hypot((x - bx) / 0.85, (y - by) / 0.95);
    const a = Math.max(0, 1 - d / reach);
    const k = rgb(colors[i % colors.length]);
    c = [
      c[0] + (k[0] - c[0]) * a,
      c[1] + (k[1] - c[1]) * a,
      c[2] + (k[2] - c[2]) * a,
    ];
  }
  return c;
}

const MAP_IN = -6;
const MAP_DUR = 26;
const LIGHT_AT = 20;
const LIGHT_SPAN = 66;
const RIPPLE = 26;
const DONE = LIGHT_AT + LIGHT_SPAN + 6;

function hash(n: number) {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

function inside(lon: number, lat: number, poly: Poly) {
  let hit = false;
  const n = poly.length / 2;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = poly[i * 2];
    const yi = poly[i * 2 + 1];
    const xj = poly[j * 2];
    const yj = poly[j * 2 + 1];
    if (
      yi > lat !== yj > lat &&
      lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi
    ) {
      hit = !hit;
    }
  }
  return hit;
}

function isLand(lon: number, lat: number) {
  return (
    LAND.some((p) => inside(lon, lat, p)) &&
    !WATER.some((p) => inside(lon, lat, p))
  );
}

function buildMask() {
  const land: boolean[] = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      land.push(isLand(-180 + (c + 0.5) * STEP, LAT_TOP - (r + 0.5) * STEP));
    }
  }
  return land;
}

const MASK = buildMask();

function Grain({ opacity }: { opacity: number }) {
  const id = `g${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  return (
    <svg
      width="100%"
      height="100%"
      style={{ position: "absolute", inset: 0, opacity, pointerEvents: "none" }}
      aria-hidden
    >
      <filter id={id}>
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.9"
          numOctaves={2}
          seed={31}
          stitchTiles="stitch"
        />
        <feColorMatrix values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0.9 0" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#${id})`} />
    </svg>
  );
}

function snap(lon: number, lat: number) {
  const c0 = Math.floor((lon + 180) / STEP);
  const r0 = Math.floor((LAT_TOP - lat) / STEP);
  let best = -1;
  let bestD = Number.POSITIVE_INFINITY;
  for (let dr = -2; dr <= 2; dr++) {
    for (let dc = -2; dc <= 2; dc++) {
      const r = r0 + dr;
      const c = (c0 + dc + COLS) % COLS;
      if (r < 0 || r >= ROWS || !MASK[r * COLS + c]) continue;
      const d = dr * dr + dc * dc;
      if (d < bestD) {
        bestD = d;
        best = r * COLS + c;
      }
    }
  }
  return best;
}

export function DotMap({
  count = 142,
  label = "countries",
  cities = DEFAULT_CITIES,
  accent = "#3B5BFD",
  theme = "dark",
  speed = 1,
}: DotMapProps) {
  const t = useCurrentFrame() * speed;
  const { width: W, height: H } = useVideoConfig();
  const u = Math.min(W / 1280, H / 720);
  const p = THEMES[theme];

  const mapW = Math.min(W * 0.84, (H * 0.6 * COLS) / ROWS);
  const pitch = mapW / COLS;
  const mapH = pitch * ROWS;
  const numSize = 124 * u;
  const gap = 40 * u;
  const blockH = mapH + gap + numSize * 0.9;
  const mapX = (W - mapW) / 2;
  const mapY = (H - blockH) / 2;
  const r = pitch * 0.3;

  const lit = useMemo(() => {
    const seen = new Set<number>();
    const out: { cell: number; at: number }[] = [];
    cities.forEach((city, i) => {
      const cell = snap(city.lon, city.lat);
      if (cell < 0 || seen.has(cell)) return;
      seen.add(cell);
      const x = (city.lon + 180) / 360;
      out.push({
        cell,
        at: LIGHT_AT + x * LIGHT_SPAN + (hash(i + 0.7) - 0.5) * 8,
      });
    });
    return out.sort((a, b) => a.at - b.at);
  }, [cities]);
  const litAt = useMemo(() => {
    const m = new Map<number, number>();
    for (const l of lit) m.set(l.cell, l.at);
    return m;
  }, [lit]);

  const pal = PALETTES[theme];
  const drift = interpolate(t, [0, 135], [0, 1.2]);
  const liftTo = rgb(theme === "dark" ? "#FFFFFF" : p.bg);

  const push = interpolate(t, [0, DONE + 40], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const scale = 0.975 + 0.03 * push;

  const dots: React.ReactNode[] = [];
  const accents: React.ReactNode[] = [];
  for (let r0 = 0; r0 < ROWS; r0++) {
    for (let c = 0; c < COLS; c++) {
      const idx = r0 * COLS + c;
      if (!MASK[idx]) continue;
      const x = mapX + (c + 0.5) * pitch;
      const y = mapY + (r0 + 0.5) * pitch;
      const delay = MAP_IN + (c / COLS) * 16 + hash(idx * 0.37) * 6;
      const a = interpolate(t, [delay, delay + MAP_DUR - 16], [0, 1], {
        ...CLAMP,
        easing: EASE_OUT,
      });
      if (a <= 0) continue;
      const at = litAt.get(idx);
      if (at !== undefined && t >= at) {
        const k = interpolate(t, [at, at + 10], [0, 1], {
          ...CLAMP,
          easing: EASE_OUT,
        });
        accents.push(
          <circle
            key={`c${idx}`}
            cx={x}
            cy={y}
            r={r * (1.2 + 0.7 * k)}
            fill={p.city}
          />,
        );
        const w = (t - at) / RIPPLE;
        if (w < 1) {
          const e = Easing.bezier(0.22, 1, 0.36, 1)(w);
          accents.push(
            <circle
              key={`w${idx}`}
              cx={x}
              cy={y}
              r={r * 1.6 + e * pitch * 2.6}
              fill="none"
              stroke={accent}
              strokeWidth={Math.max(1, 1.4 * u)}
              opacity={(1 - w) * 0.8}
            />,
          );
        }
        continue;
      }
      const m = meshAt(
        c / COLS,
        r0 / ROWS,
        pal.bg,
        pal.colors,
        drift,
        pal.reach,
      );
      const tint: [number, number, number] = [
        m[0] + (liftTo[0] - m[0]) * p.lift,
        m[1] + (liftTo[1] - m[1]) * p.lift,
        m[2] + (liftTo[2] - m[2]) * p.lift,
      ];
      dots.push(
        <circle
          key={idx}
          cx={x}
          cy={y}
          r={r * (0.7 + 0.3 * a)}
          fill={toHex(tint)}
          opacity={a * p.dotAlpha}
        />,
      );
    }
  }

  let shown = 0;
  for (const l of lit) if (t >= l.at) shown++;
  const value = lit.length
    ? Math.round((count * shown) / lit.length)
    : Math.round(count);
  const numIn = interpolate(t, [LIGHT_AT - 8, LIGHT_AT + 8], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const labIn = interpolate(t, [LIGHT_AT, LIGHT_AT + 16], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });

  return (
    <AbsoluteFill style={{ background: p.bg, overflow: "hidden" }}>
      <AbsoluteFill
        style={{ transform: `scale(${scale})`, transformOrigin: "50% 50%" }}
      >
        <svg
          width={W}
          height={H}
          style={{ position: "absolute", inset: 0 }}
          aria-hidden
        >
          {dots}
          {accents}
        </svg>
        <div
          style={{
            position: "absolute",
            left: 0,
            width: W,
            top: mapY + mapH + gap,
            display: "flex",
            justifyContent: "center",
            alignItems: "baseline",
            gap: 18 * u,
            whiteSpace: "nowrap",
          }}
        >
          <span
            style={{
              fontFamily: manrope,
              fontWeight: 400,
              fontSize: numSize,
              lineHeight: 0.9,
              letterSpacing: "-0.04em",
              color: p.fg,
              fontVariantNumeric: "tabular-nums",
              opacity: numIn,
              transform: `translateY(${(1 - numIn) * 12 * u}px)`,
              display: "inline-block",
              minWidth: `${String(Math.round(count)).length * 0.6}em`,
              textAlign: "right",
            }}
          >
            {value}
          </span>
          <span
            style={{
              fontFamily: manrope,
              fontWeight: 500,
              fontSize: 30 * u,
              letterSpacing: "-0.015em",
              color: p.muted,
              opacity: labIn,
              transform: `translateY(${(1 - labIn) * 8 * u}px)`,
              display: "inline-block",
            }}
          >
            {label}
          </span>
        </div>
      </AbsoluteFill>

      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 80% 80% at 50% 50%, transparent 62%, ${p.bg} 100%)`,
          opacity: 0.6,
          pointerEvents: "none",
        }}
      />
      <Grain opacity={p.grain} />
    </AbsoluteFill>
  );
}
