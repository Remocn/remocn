"use client";

import { format, parseISO } from "date-fns";
import { memo, useMemo, useState } from "react";
import { loadFont as loadSans } from "@remotion/google-fonts/Manrope";
import { loadFont as loadMono } from "@remotion/google-fonts/GeistMono";
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Odometer } from "@/components/remocn/number-wheel";

export interface Stargazer {
  login: string;
  avatarUrl: string;
  /** ISO date string, e.g. "2021-03-04" */
  starredAt: string;
}

export interface GitHubStarsProps {
  repo?: string;
  totalStars?: number;
  stargazers?: Stargazer[];
  orientation?: "horizontal" | "vertical";
  accentColor?: string;
  speed?: number;
  theme?: "light" | "dark";
  repoAvatarUrl?: string;
}

/**
 * Built-in mock stargazers so the composition renders immediately from defaults
 * (own-your-code: no external data needed after `shadcn add`). Real low-id GitHub
 * avatar URLs are CORS-ok, so the docs preview shows round photos.
 */
export const SAMPLE_STARGAZERS: Stargazer[] = [
  {
    login: "mojombo",
    avatarUrl: "https://avatars.githubusercontent.com/u/1?v=4",
    starredAt: "2021-03-04",
  },
  {
    login: "defunkt",
    avatarUrl: "https://avatars.githubusercontent.com/u/2?v=4",
    starredAt: "2021-06-12",
  },
  {
    login: "pjhyett",
    avatarUrl: "https://avatars.githubusercontent.com/u/3?v=4",
    starredAt: "2021-09-21",
  },
  {
    login: "wycats",
    avatarUrl: "https://avatars.githubusercontent.com/u/4?v=4",
    starredAt: "2021-12-08",
  },
  {
    login: "ezmobius",
    avatarUrl: "https://avatars.githubusercontent.com/u/14?v=4",
    starredAt: "2022-03-17",
  },
  {
    login: "ivey",
    avatarUrl: "https://avatars.githubusercontent.com/u/18?v=4",
    starredAt: "2022-06-29",
  },
  {
    login: "evanphx",
    avatarUrl: "https://avatars.githubusercontent.com/u/25?v=4",
    starredAt: "2022-09-14",
  },
  {
    login: "vanpelt",
    avatarUrl: "https://avatars.githubusercontent.com/u/26?v=4",
    starredAt: "2022-12-23",
  },
  {
    login: "wayneeseguin",
    avatarUrl: "https://avatars.githubusercontent.com/u/28?v=4",
    starredAt: "2023-03-09",
  },
  {
    login: "brynary",
    avatarUrl: "https://avatars.githubusercontent.com/u/30?v=4",
    starredAt: "2023-07-19",
  },
  {
    login: "kevinclark",
    avatarUrl: "https://avatars.githubusercontent.com/u/31?v=4",
    starredAt: "2023-11-02",
  },
  {
    login: "technoweenie",
    avatarUrl: "https://avatars.githubusercontent.com/u/21?v=4",
    starredAt: "2024-02-15",
  },
  {
    login: "mojombo",
    avatarUrl: "https://avatars.githubusercontent.com/u/1?v=4",
    starredAt: "2021-03-04",
  },
  {
    login: "defunkt",
    avatarUrl: "https://avatars.githubusercontent.com/u/2?v=4",
    starredAt: "2021-06-12",
  },
  {
    login: "pjhyett",
    avatarUrl: "https://avatars.githubusercontent.com/u/3?v=4",
    starredAt: "2021-09-21",
  },
  {
    login: "wycats",
    avatarUrl: "https://avatars.githubusercontent.com/u/4?v=4",
    starredAt: "2021-12-08",
  },
  {
    login: "ezmobius",
    avatarUrl: "https://avatars.githubusercontent.com/u/14?v=4",
    starredAt: "2022-03-17",
  },
  {
    login: "ivey",
    avatarUrl: "https://avatars.githubusercontent.com/u/18?v=4",
    starredAt: "2022-06-29",
  },
  {
    login: "evanphx",
    avatarUrl: "https://avatars.githubusercontent.com/u/25?v=4",
    starredAt: "2022-09-14",
  },
  {
    login: "vanpelt",
    avatarUrl: "https://avatars.githubusercontent.com/u/26?v=4",
    starredAt: "2022-12-23",
  },
  {
    login: "wayneeseguin",
    avatarUrl: "https://avatars.githubusercontent.com/u/28?v=4",
    starredAt: "2023-03-09",
  },
  {
    login: "brynary",
    avatarUrl: "https://avatars.githubusercontent.com/u/30?v=4",
    starredAt: "2023-07-19",
  },
  {
    login: "kevinclark",
    avatarUrl: "https://avatars.githubusercontent.com/u/31?v=4",
    starredAt: "2023-11-02",
  },
  {
    login: "technoweenie",
    avatarUrl: "https://avatars.githubusercontent.com/u/21?v=4",
    starredAt: "2024-02-15",
  },
  {
    login: "mojombo",
    avatarUrl: "https://avatars.githubusercontent.com/u/1?v=4",
    starredAt: "2021-03-04",
  },
  {
    login: "defunkt",
    avatarUrl: "https://avatars.githubusercontent.com/u/2?v=4",
    starredAt: "2021-06-12",
  },
  {
    login: "pjhyett",
    avatarUrl: "https://avatars.githubusercontent.com/u/3?v=4",
    starredAt: "2021-09-21",
  },
  {
    login: "wycats",
    avatarUrl: "https://avatars.githubusercontent.com/u/4?v=4",
    starredAt: "2021-12-08",
  },
  {
    login: "ezmobius",
    avatarUrl: "https://avatars.githubusercontent.com/u/14?v=4",
    starredAt: "2022-03-17",
  },
  {
    login: "ivey",
    avatarUrl: "https://avatars.githubusercontent.com/u/18?v=4",
    starredAt: "2022-06-29",
  },
  {
    login: "evanphx",
    avatarUrl: "https://avatars.githubusercontent.com/u/25?v=4",
    starredAt: "2022-09-14",
  },
  {
    login: "vanpelt",
    avatarUrl: "https://avatars.githubusercontent.com/u/26?v=4",
    starredAt: "2022-12-23",
  },
  {
    login: "wayneeseguin",
    avatarUrl: "https://avatars.githubusercontent.com/u/28?v=4",
    starredAt: "2023-03-09",
  },
  {
    login: "brynary",
    avatarUrl: "https://avatars.githubusercontent.com/u/30?v=4",
    starredAt: "2023-07-19",
  },
  {
    login: "kevinclark",
    avatarUrl: "https://avatars.githubusercontent.com/u/31?v=4",
    starredAt: "2023-11-02",
  },
  {
    login: "technoweenie",
    avatarUrl: "https://avatars.githubusercontent.com/u/21?v=4",
    starredAt: "2024-02-15",
  },
  {
    login: "mojombo",
    avatarUrl: "https://avatars.githubusercontent.com/u/1?v=4",
    starredAt: "2021-03-04",
  },
  {
    login: "defunkt",
    avatarUrl: "https://avatars.githubusercontent.com/u/2?v=4",
    starredAt: "2021-06-12",
  },
  {
    login: "pjhyett",
    avatarUrl: "https://avatars.githubusercontent.com/u/3?v=4",
    starredAt: "2021-09-21",
  },
  {
    login: "wycats",
    avatarUrl: "https://avatars.githubusercontent.com/u/4?v=4",
    starredAt: "2021-12-08",
  },
  {
    login: "ezmobius",
    avatarUrl: "https://avatars.githubusercontent.com/u/14?v=4",
    starredAt: "2022-03-17",
  },
  {
    login: "ivey",
    avatarUrl: "https://avatars.githubusercontent.com/u/18?v=4",
    starredAt: "2022-06-29",
  },
  {
    login: "evanphx",
    avatarUrl: "https://avatars.githubusercontent.com/u/25?v=4",
    starredAt: "2022-09-14",
  },
  {
    login: "vanpelt",
    avatarUrl: "https://avatars.githubusercontent.com/u/26?v=4",
    starredAt: "2022-12-23",
  },
  {
    login: "wayneeseguin",
    avatarUrl: "https://avatars.githubusercontent.com/u/28?v=4",
    starredAt: "2023-03-09",
  },
  {
    login: "brynary",
    avatarUrl: "https://avatars.githubusercontent.com/u/30?v=4",
    starredAt: "2023-07-19",
  },
  {
    login: "kevinclark",
    avatarUrl: "https://avatars.githubusercontent.com/u/31?v=4",
    starredAt: "2023-11-02",
  },
  {
    login: "technoweenie",
    avatarUrl: "https://avatars.githubusercontent.com/u/21?v=4",
    starredAt: "2024-02-15",
  },
  {
    login: "mojombo",
    avatarUrl: "https://avatars.githubusercontent.com/u/1?v=4",
    starredAt: "2021-03-04",
  },
  {
    login: "defunkt",
    avatarUrl: "https://avatars.githubusercontent.com/u/2?v=4",
    starredAt: "2021-06-12",
  },
  {
    login: "pjhyett",
    avatarUrl: "https://avatars.githubusercontent.com/u/3?v=4",
    starredAt: "2021-09-21",
  },
  {
    login: "wycats",
    avatarUrl: "https://avatars.githubusercontent.com/u/4?v=4",
    starredAt: "2021-12-08",
  },
  {
    login: "ezmobius",
    avatarUrl: "https://avatars.githubusercontent.com/u/14?v=4",
    starredAt: "2022-03-17",
  },
  {
    login: "ivey",
    avatarUrl: "https://avatars.githubusercontent.com/u/18?v=4",
    starredAt: "2022-06-29",
  },
  {
    login: "evanphx",
    avatarUrl: "https://avatars.githubusercontent.com/u/25?v=4",
    starredAt: "2022-09-14",
  },
  {
    login: "vanpelt",
    avatarUrl: "https://avatars.githubusercontent.com/u/26?v=4",
    starredAt: "2022-12-23",
  },
  {
    login: "wayneeseguin",
    avatarUrl: "https://avatars.githubusercontent.com/u/28?v=4",
    starredAt: "2023-03-09",
  },
  {
    login: "brynary",
    avatarUrl: "https://avatars.githubusercontent.com/u/30?v=4",
    starredAt: "2023-07-19",
  },
  {
    login: "kevinclark",
    avatarUrl: "https://avatars.githubusercontent.com/u/31?v=4",
    starredAt: "2023-11-02",
  },
  {
    login: "technoweenie",
    avatarUrl: "https://avatars.githubusercontent.com/u/21?v=4",
    starredAt: "2024-02-15",
  },
  {
    login: "mojombo",
    avatarUrl: "https://avatars.githubusercontent.com/u/1?v=4",
    starredAt: "2021-03-04",
  },
  {
    login: "defunkt",
    avatarUrl: "https://avatars.githubusercontent.com/u/2?v=4",
    starredAt: "2021-06-12",
  },
  {
    login: "pjhyett",
    avatarUrl: "https://avatars.githubusercontent.com/u/3?v=4",
    starredAt: "2021-09-21",
  },
  {
    login: "wycats",
    avatarUrl: "https://avatars.githubusercontent.com/u/4?v=4",
    starredAt: "2021-12-08",
  },
  {
    login: "ezmobius",
    avatarUrl: "https://avatars.githubusercontent.com/u/14?v=4",
    starredAt: "2022-03-17",
  },
  {
    login: "ivey",
    avatarUrl: "https://avatars.githubusercontent.com/u/18?v=4",
    starredAt: "2022-06-29",
  },
  {
    login: "evanphx",
    avatarUrl: "https://avatars.githubusercontent.com/u/25?v=4",
    starredAt: "2022-09-14",
  },
  {
    login: "vanpelt",
    avatarUrl: "https://avatars.githubusercontent.com/u/26?v=4",
    starredAt: "2022-12-23",
  },
  {
    login: "wayneeseguin",
    avatarUrl: "https://avatars.githubusercontent.com/u/28?v=4",
    starredAt: "2023-03-09",
  },
  {
    login: "brynary",
    avatarUrl: "https://avatars.githubusercontent.com/u/30?v=4",
    starredAt: "2023-07-19",
  },
  {
    login: "kevinclark",
    avatarUrl: "https://avatars.githubusercontent.com/u/31?v=4",
    starredAt: "2023-11-02",
  },
  {
    login: "technoweenie",
    avatarUrl: "https://avatars.githubusercontent.com/u/21?v=4",
    starredAt: "2024-02-15",
  },
  {
    login: "mojombo",
    avatarUrl: "https://avatars.githubusercontent.com/u/1?v=4",
    starredAt: "2021-03-04",
  },
  {
    login: "defunkt",
    avatarUrl: "https://avatars.githubusercontent.com/u/2?v=4",
    starredAt: "2021-06-12",
  },
  {
    login: "pjhyett",
    avatarUrl: "https://avatars.githubusercontent.com/u/3?v=4",
    starredAt: "2021-09-21",
  },
  {
    login: "wycats",
    avatarUrl: "https://avatars.githubusercontent.com/u/4?v=4",
    starredAt: "2021-12-08",
  },
  {
    login: "ezmobius",
    avatarUrl: "https://avatars.githubusercontent.com/u/14?v=4",
    starredAt: "2022-03-17",
  },
  {
    login: "ivey",
    avatarUrl: "https://avatars.githubusercontent.com/u/18?v=4",
    starredAt: "2022-06-29",
  },
  {
    login: "evanphx",
    avatarUrl: "https://avatars.githubusercontent.com/u/25?v=4",
    starredAt: "2022-09-14",
  },
  {
    login: "vanpelt",
    avatarUrl: "https://avatars.githubusercontent.com/u/26?v=4",
    starredAt: "2022-12-23",
  },
  {
    login: "wayneeseguin",
    avatarUrl: "https://avatars.githubusercontent.com/u/28?v=4",
    starredAt: "2023-03-09",
  },
  {
    login: "brynary",
    avatarUrl: "https://avatars.githubusercontent.com/u/30?v=4",
    starredAt: "2023-07-19",
  },
  {
    login: "kevinclark",
    avatarUrl: "https://avatars.githubusercontent.com/u/31?v=4",
    starredAt: "2023-11-02",
  },
  {
    login: "technoweenie",
    avatarUrl: "https://avatars.githubusercontent.com/u/21?v=4",
    starredAt: "2024-02-15",
  },
  {
    login: "mojombo",
    avatarUrl: "https://avatars.githubusercontent.com/u/1?v=4",
    starredAt: "2021-03-04",
  },
  {
    login: "defunkt",
    avatarUrl: "https://avatars.githubusercontent.com/u/2?v=4",
    starredAt: "2021-06-12",
  },
  {
    login: "pjhyett",
    avatarUrl: "https://avatars.githubusercontent.com/u/3?v=4",
    starredAt: "2021-09-21",
  },
  {
    login: "wycats",
    avatarUrl: "https://avatars.githubusercontent.com/u/4?v=4",
    starredAt: "2021-12-08",
  },
  {
    login: "ezmobius",
    avatarUrl: "https://avatars.githubusercontent.com/u/14?v=4",
    starredAt: "2022-03-17",
  },
  {
    login: "ivey",
    avatarUrl: "https://avatars.githubusercontent.com/u/18?v=4",
    starredAt: "2022-06-29",
  },
  {
    login: "evanphx",
    avatarUrl: "https://avatars.githubusercontent.com/u/25?v=4",
    starredAt: "2022-09-14",
  },
  {
    login: "vanpelt",
    avatarUrl: "https://avatars.githubusercontent.com/u/26?v=4",
    starredAt: "2022-12-23",
  },
  {
    login: "wayneeseguin",
    avatarUrl: "https://avatars.githubusercontent.com/u/28?v=4",
    starredAt: "2023-03-09",
  },
  {
    login: "brynary",
    avatarUrl: "https://avatars.githubusercontent.com/u/30?v=4",
    starredAt: "2023-07-19",
  },
  {
    login: "kevinclark",
    avatarUrl: "https://avatars.githubusercontent.com/u/31?v=4",
    starredAt: "2023-11-02",
  },
  {
    login: "technoweenie",
    avatarUrl: "https://avatars.githubusercontent.com/u/21?v=4",
    starredAt: "2024-02-15",
  },
  {
    login: "mojombo",
    avatarUrl: "https://avatars.githubusercontent.com/u/1?v=4",
    starredAt: "2021-03-04",
  },
  {
    login: "defunkt",
    avatarUrl: "https://avatars.githubusercontent.com/u/2?v=4",
    starredAt: "2021-06-12",
  },
  {
    login: "pjhyett",
    avatarUrl: "https://avatars.githubusercontent.com/u/3?v=4",
    starredAt: "2021-09-21",
  },
  {
    login: "wycats",
    avatarUrl: "https://avatars.githubusercontent.com/u/4?v=4",
    starredAt: "2021-12-08",
  },
  {
    login: "ezmobius",
    avatarUrl: "https://avatars.githubusercontent.com/u/14?v=4",
    starredAt: "2022-03-17",
  },
  {
    login: "ivey",
    avatarUrl: "https://avatars.githubusercontent.com/u/18?v=4",
    starredAt: "2022-06-29",
  },
  {
    login: "evanphx",
    avatarUrl: "https://avatars.githubusercontent.com/u/25?v=4",
    starredAt: "2022-09-14",
  },
  {
    login: "vanpelt",
    avatarUrl: "https://avatars.githubusercontent.com/u/26?v=4",
    starredAt: "2022-12-23",
  },
  {
    login: "wayneeseguin",
    avatarUrl: "https://avatars.githubusercontent.com/u/28?v=4",
    starredAt: "2023-03-09",
  },
  {
    login: "brynary",
    avatarUrl: "https://avatars.githubusercontent.com/u/30?v=4",
    starredAt: "2023-07-19",
  },
  {
    login: "kevinclark",
    avatarUrl: "https://avatars.githubusercontent.com/u/31?v=4",
    starredAt: "2023-11-02",
  },
  {
    login: "technoweenie",
    avatarUrl: "https://avatars.githubusercontent.com/u/21?v=4",
    starredAt: "2024-02-15",
  },
];

// Load fonts INSIDE the composition (via @remotion/google-fonts, which waits for
// the font with delayRender before rendering frames). Server renders run in a
// bare headless Chromium with no app CSS / `--font-*` vars, so without this the
// MP4 falls back to the default sans-serif. Manrope for UI text, JetBrains Mono
// for the numeric star counter (odometer).
const { fontFamily: SANS_FAMILY } = loadSans();
const { fontFamily: MONO_FAMILY } = loadMono();

const FONT_FAMILY = SANS_FAMILY;

interface Theme {
  bg: string;
  bgSubtle: string;
  fg: string;
  fgMuted: string;
  border: string;
}

const THEMES: Record<"light" | "dark", Theme> = {
  light: {
    bg: "#ffffff",
    bgSubtle: "#fafafa",
    fg: "#171717",
    fgMuted: "#737373",
    border: "#ededed",
  },
  dark: {
    bg: "#0a0a0a",
    bgSubtle: "#111113",
    fg: "#fafafa",
    fgMuted: "#a1a1aa",
    border: "#262626",
  },
};

// --- Pure helpers (unit-tested) -------------------------------------------

/**
 * Clamp a stargazer list to at most `max` evenly-sampled keyframe rows while
 * always preserving the first and last entry. Safety net for callers that pass
 * a huge array straight into the composition.
 */
export function downsampleStargazers(
  stargazers: Stargazer[],
  max = 60,
): Stargazer[] {
  const len = stargazers.length;
  if (len <= max) return stargazers;
  if (max <= 1) return len ? [stargazers[0]] : [];
  const out: Stargazer[] = [];
  for (let i = 0; i < max; i++) {
    out.push(stargazers[Math.round((i * (len - 1)) / (max - 1))]);
  }
  return out;
}

const MAX_ELASTIC_OVERSHOOT = 0.0658; // Easing.elastic(1) peak−1 (true ≈0.0657267), rounded UP for use as a safety bound
const SCROLL_OVERSHOOT = 1 + MAX_ELASTIC_OVERSHOOT; // ≈1.0658
const MASK_SOLID_FRACTION = 0.88; // bottom fade mask is solid until 88% of viewport height
const COUNT_PORTION = 0.8;

/** Monotonic counter ramp — mirrors the reference StarCount easing. Drives the
 *  odometer, which must stay monotonic or the digit wheels roll backward. */
export function computeCounterProgress({
  frame,
  speed = 1,
  durationInFrames,
}: {
  frame: number;
  speed?: number;
  durationInFrames: number;
}): number {
  return interpolate(
    frame * speed,
    [0, durationInFrames * COUNT_PORTION],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.bezier(0.5, 1, 0.5, 1),
    },
  );
}

/** Elastic scroll ramp — mirrors the reference avatar slide. NON-monotonic:
 *  overshoots to ~SCROLL_OVERSHOOT near t≈0.63 and settles to exactly 1 at t=1.
 *  Drives only scrollY (never the odometer). */
export function computeScrollProgress({
  frame,
  speed = 1,
  durationInFrames,
}: {
  frame: number;
  speed?: number;
  durationInFrames: number;
}): number {
  return interpolate(frame * speed, [0, durationInFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.elastic(0.8),
  });
}

/** Empty rows appended below the last stargazer so the elastic recoil never
 *  lifts real content off the mask-solid zone, revealing a void. Single source
 *  of truth shared with isScrollContained so the two cannot drift. */
export function computeSpacerRows({
  N,
  rowH,
  viewportH,
  visibleRows,
}: {
  N: number;
  rowH: number;
  viewportH: number;
  visibleRows: number;
}): number {
  const D = Math.max(0, (N - visibleRows + 1) * rowH);
  const needPx =
    MASK_SOLID_FRACTION * viewportH - N * rowH + SCROLL_OVERSHOOT * D;
  return Math.max(0, Math.ceil(needPx / rowH));
}

/** True when, at the elastic overshoot peak, content still fills the mask-solid
 *  zone (no void revealed). True by construction given computeSpacerRows. */
export function isScrollContained({
  N,
  rowH,
  viewportH,
  visibleRows,
}: {
  N: number;
  rowH: number;
  viewportH: number;
  visibleRows: number;
}): boolean {
  const D = Math.max(0, (N - visibleRows + 1) * rowH);
  const spacerPx =
    computeSpacerRows({ N, rowH, viewportH, visibleRows }) * rowH;
  return (
    N * rowH + spacerPx - SCROLL_OVERSHOOT * D >=
    MASK_SOLID_FRACTION * viewportH
  );
}

/** The running counter value for a given scroll progress. Locks at totalStars. */
export function getStarCount(
  scrollProgress: number,
  totalStars: number,
): number {
  return Math.round(scrollProgress * totalStars);
}

// --- Sub-components --------------------------------------------------------

function StarGlyph({ size, fill }: { size: number; fill: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      color={fill}
      fill={fill}
      stroke={fill}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <title>Stars</title>
      <path d="M13.7276 3.44418L15.4874 6.99288C15.7274 7.48687 16.3673 7.9607 16.9073 8.05143L20.0969 8.58575C22.1367 8.92853 22.6167 10.4206 21.1468 11.8925L18.6671 14.3927C18.2471 14.8161 18.0172 15.6327 18.1471 16.2175L18.8571 19.3125C19.417 21.7623 18.1271 22.71 15.9774 21.4296L12.9877 19.6452C12.4478 19.3226 11.5579 19.3226 11.0079 19.6452L8.01827 21.4296C5.8785 22.71 4.57865 21.7522 5.13859 19.3125L5.84851 16.2175C5.97849 15.6327 5.74852 14.8161 5.32856 14.3927L2.84884 11.8925C1.389 10.4206 1.85895 8.92853 3.89872 8.58575L7.08837 8.05143C7.61831 7.9607 8.25824 7.48687 8.49821 6.99288L10.258 3.44418C11.2179 1.51861 12.7777 1.51861 13.7276 3.44418Z"></path>
    </svg>
  );
}

function Avatar({
  login,
  avatarUrl,
  size,
  theme,
}: {
  login: string;
  avatarUrl: string;
  size: number;
  theme: Theme;
}) {
  const [errored, setErrored] = useState(false);
  const ringStyle = {
    width: size,
    height: size,
    borderRadius: 9999,
    border: `1px solid ${theme.border}`,
    flexShrink: 0,
  } as const;

  if (errored || !avatarUrl) {
    return (
      <div
        style={{
          ...ringStyle,
          background: theme.bgSubtle,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: theme.fgMuted,
          fontSize: size * 0.42,
          fontWeight: 600,
        }}
      >
        {login.charAt(0).toUpperCase()}
      </div>
    );
  }

  return (
    <Img
      src={avatarUrl}
      crossOrigin="anonymous"
      onError={() => setErrored(true)}
      style={{ ...ringStyle, objectFit: "cover" }}
    />
  );
}

interface RowProps {
  stargazer: Stargazer;
  index: number;
  rowH: number;
  avatarSize: number;
  loginSize: number;
  dateLabel: string;
  accent: string;
  theme: Theme;
  isActive: boolean;
  settle: number;
  showSeparator: boolean;
  opacity: number;
}

const Row = memo(function Row({
  stargazer,
  index,
  rowH,
  avatarSize,
  loginSize,
  dateLabel,
  accent,
  theme,
  isActive,
  settle,
  showSeparator,
  opacity,
}: RowProps) {
  return (
    <div
      style={{
        position: "relative",
        height: rowH,
        display: "flex",
        alignItems: "center",
        paddingLeft: 24,
        paddingRight: 24,
        background: "transparent",
        opacity,
        boxSizing: "border-box",
        borderBottom:
          showSeparator && !isActive ? `1px solid ${theme.border}` : "none",
      }}
    >
      {isActive && (
        <>
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: theme.bgSubtle,
              opacity: settle,
            }}
          />
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              bottom: 0,
              width: 2,
              background: accent,
              opacity: settle,
            }}
          />
        </>
      )}
      <div
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          width: "100%",
        }}
      >
        <Avatar
          login={stargazer.login}
          avatarUrl={stargazer.avatarUrl}
          size={avatarSize}
          theme={theme}
        />
        <div style={{ marginLeft: 20, minWidth: 0, flex: 1 }}>
          <div
            style={{
              fontSize: loginSize,
              fontWeight: 600,
              color: theme.fg,
              fontFamily: FONT_FAMILY,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              lineHeight: 1.2,
            }}
          >
            {stargazer.login}
          </div>
          <div
            style={{
              fontSize: 18,
              fontWeight: 400,
              color: theme.fgMuted,
              fontFamily: FONT_FAMILY,
              lineHeight: 1.3,
            }}
          >
            {dateLabel}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            color: theme.fgMuted,
            fontFamily: MONO_FAMILY,
            fontSize: 18,
            fontVariantNumeric: "tabular-nums",
            flexShrink: 0,
          }}
        >
          <StarGlyph size={20} fill={accent} />
          <span>#{index + 1}</span>
        </div>
      </div>
    </div>
  );
});

// --- Main composition ------------------------------------------------------

export function GitHubStars({
  repo = "remotion-dev/remotion",
  totalStars = 24813,
  stargazers = SAMPLE_STARGAZERS,
  orientation = "horizontal",
  accentColor = "#ffbb00",
  speed = 1,
  theme = "light",
  repoAvatarUrl,
}: GitHubStarsProps) {
  const frame = useCurrentFrame();
  const { durationInFrames, width, height } = useVideoConfig();
  const t = THEMES[theme] ?? THEMES.light;
  const isVertical = orientation === "vertical";

  // Render at the native reference size for the orientation, then scale to fit
  // the actual canvas — keeps proportions at any resolution and letterboxes a
  // vertical layout cleanly inside a horizontal preview canvas.
  const refW = isVertical ? 720 : 1280;
  const refH = isVertical ? 1280 : 720;
  const stageScale = Math.min(width / refW, height / refH);

  const rows = useMemo(() => downsampleStargazers(stargazers), [stargazers]);
  const N = rows.length;

  // Progress drivers: monotonic counter ramp + non-monotonic elastic scroll.
  const counterProgress = computeCounterProgress({
    frame,
    speed,
    durationInFrames,
  });
  const pScroll = computeScrollProgress({ frame, speed, durationInFrames });
  const p = Math.max(0, Math.min(1, (frame * speed) / durationInFrames));

  const current = counterProgress * totalStars;

  // List viewport geometry (in reference px).
  const rowH = isVertical ? 96 : 88;
  const avatarSize = isVertical ? 60 : 56;
  const loginSize = isVertical ? 30 : 28;
  const dateFormat = isVertical ? "MMM yyyy" : "MMM d, yyyy";
  const formattedRows = useMemo(
    () =>
      rows.map((sg) => {
        try {
          return { sg, dateLabel: format(parseISO(sg.starredAt), dateFormat) };
        } catch {
          return { sg, dateLabel: sg.starredAt };
        }
      }),
    [rows, dateFormat],
  );

  const viewport = isVertical
    ? { x: 48, y: 320, w: 624, h: 888, radius: 28 }
    : { x: 560, y: 60, w: 640, h: 600, radius: 24 };

  const visibleRows = Math.floor(viewport.h / rowH);
  const D = Math.max(0, (N - visibleRows + 1) * rowH);
  const scrollY = -pScroll * D;

  const spacerRows = computeSpacerRows({
    N,
    rowH,
    viewportH: viewport.h,
    visibleRows,
  });
  const spacerPx = spacerRows * rowH;

  const settle = interpolate(p, [0.92, 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Counter zone type scale.
  const counterSize = isVertical ? 96 : 120;
  const starSize = isVertical ? 56 : 64;
  const underlineMax = isVertical ? 200 : 240;
  const underlineWidth = counterProgress * underlineMax;

  const fadeH = Math.round(viewport.h * 0.12);

  const listViewport = (
    <div
      style={{
        position: "absolute",
        left: viewport.x,
        top: viewport.y,
        width: viewport.w,
        height: viewport.h,
        overflow: "hidden",
        borderRadius: viewport.radius,
        border: `1px solid ${t.border}`,
        background: t.bg,
      }}
    >
      <div
        style={{
          transform: `translateY(${scrollY}px)`,
          willChange: "transform",
        }}
      >
        {formattedRows.map(({ sg, dateLabel }, i) => (
          <Row
            key={`${sg.login}-${i}`}
            stargazer={sg}
            index={i}
            rowH={rowH}
            avatarSize={avatarSize}
            loginSize={loginSize}
            dateLabel={dateLabel}
            accent={accentColor}
            theme={t}
            isActive={i === N - 1}
            settle={i === N - 1 ? settle : 0}
            showSeparator={i < N - 1}
            opacity={1}
          />
        ))}
        {spacerPx > 0 && (
          <div style={{ height: spacerPx }} aria-hidden="true" />
        )}
      </div>
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: fadeH,
          background: `linear-gradient(to bottom, ${t.bg}, transparent)`,
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: fadeH,
          background: `linear-gradient(to top, ${t.bg}, transparent)`,
          pointerEvents: "none",
        }}
      />
    </div>
  );

  const underline = (
    <div
      style={{
        height: 4,
        width: underlineWidth,
        background: accentColor,
        borderRadius: 2,
      }}
    />
  );

  const repoOwner = repo.split("/")[0] || repo;
  const repoAvatarSize = isVertical ? 28 : 32;
  const repoAvatarSrc =
    repoAvatarUrl ?? `https://unavatar.io/github/${repoOwner}`;

  const repoSlug = (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        maxWidth: isVertical ? 600 : 392,
      }}
    >
      <Avatar
        login={repoOwner}
        avatarUrl={repoAvatarSrc}
        size={repoAvatarSize}
        theme={t}
      />
      <div
        style={{
          fontSize: isVertical ? 20 : 24,
          fontWeight: 500,
          color: t.fgMuted,
          fontFamily: FONT_FAMILY,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {repo}
      </div>
    </div>
  );

  const counterZone = isVertical ? (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: refW,
        height: 300,
        paddingTop: 72,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 14,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        <StarGlyph size={starSize} fill={accentColor} />
        <Odometer current={current} fontSize={counterSize} color={t.fg} />
      </div>
      {underline}
      {repoSlug}
    </div>
  ) : (
    <div
      style={{
        position: "absolute",
        left: 80,
        top: 0,
        width: 392,
        height: refH,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "flex-start",
      }}
    >
      <StarGlyph size={starSize} fill={accentColor} />
      <div style={{ height: 20 }} />
      <Odometer current={current} fontSize={counterSize} color={t.fg} />
      <div style={{ height: 16 }} />
      {underline}
      <div style={{ height: 20 }} />

      {repoSlug}
    </div>
  );

  return (
    <AbsoluteFill style={{ background: t.bg }}>
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: refW,
          height: refH,
          transform: `translate(-50%, -50%) scale(${stageScale})`,
        }}
      >
        {counterZone}
        {listViewport}
      </div>
    </AbsoluteFill>
  );
}
