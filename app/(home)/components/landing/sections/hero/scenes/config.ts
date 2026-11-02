import type { ClipSpec } from "../tiles/config";
import { DEFAULT_LIVE_CLIPS } from "./live-clips";

export const SWAP_TRANSITIONS = [
  "dither",
  "whip",
  "flip",
  "zoom",
  "cut",
] as const;
export const CONTENT_MODES = ["sync", "static"] as const;

export type SwapTransition = (typeof SWAP_TRANSITIONS)[number];
export type ContentMode = (typeof CONTENT_MODES)[number];

export const SCENE_SET_OPTIONS = [
  "live",
  "catalog",
  "frames",
  "effects",
  "story",
] as const;
export type SceneSetOption = (typeof SCENE_SET_OPTIONS)[number];

export type ScenesConfig = {
  frame: {
    float: number;
    floatPeriod: number;
    floatTilt: number;
    parallax: number;
    depthSpread: number;
  };
  swap: {
    set: SceneSetOption;
    mode: ContentMode;
    transition: SwapTransition;
    stagger: number;
    duration: number;
    cell: number;
    band: number;
    passes: number;
    dim: number;
  };
  play: {
    speed: number;
    loopGap: number;
  };
  live: ClipSpec[][];
};

export const DEFAULT_SCENES_CONFIG: ScenesConfig = {
  frame: {
    float: 6,
    floatPeriod: 9,
    floatTilt: 1,
    parallax: 14,
    depthSpread: 0.6,
  },
  swap: {
    set: "live",
    mode: "sync",
    transition: "dither",
    stagger: 140,
    duration: 900,
    cell: 3,
    band: 0.28,
    passes: 1,
    dim: 0.25,
  },
  play: {
    speed: 1,
    loopGap: 1.2,
  },
  live: DEFAULT_LIVE_CLIPS,
};

export const SLOT_DEPTH: Record<number, number> = {
  1: 1,
  2: 0.55,
  3: 0.35,
  4: 0.8,
  5: 0.65,
  6: 0.45,
};

export const SLOT_ORDER = [1, 2, 3, 4, 5, 6];

export const VIDEO_FRAME: Record<number, { width: number; height: number }> = {
  1: { width: 288, height: 162 },
  2: { width: 192, height: 192 },
  3: { width: 240, height: 135 },
  4: { width: 176, height: 176 },
  5: { width: 256, height: 144 },
  6: { width: 144, height: 256 },
};
