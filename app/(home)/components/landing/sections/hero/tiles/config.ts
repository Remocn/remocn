export const VIDEO_MODES = ["reel", "deck", "flip", "morph"] as const;
export const AE_MODES = ["bounce", "beachball", "stalled", "static"] as const;
export const CUTS = [
  "zoom-blur",
  "whip-pan",
  "push-through",
  "focus-pull",
  "ripple-zoom",
  "cut",
] as const;
export const TRANSITIONS = ["mixed", ...CUTS] as const;
export const CLIP_ENDS = ["hold", "loop", "run"] as const;

export type VideoMode = (typeof VIDEO_MODES)[number];
export type AeMode = (typeof AE_MODES)[number];
export type CutKind = (typeof CUTS)[number];
export type TransitionKind = (typeof TRANSITIONS)[number];
export type ClipEnd = (typeof CLIP_ENDS)[number];

export type ClipSpec = {
  name: string;
  start: number;
  zoom: number;
  end: ClipEnd;
  background: string;
  radius: number;
  cut: "auto" | CutKind;
  props: Record<string, unknown>;
};

export type HeroTilesConfig = {
  seed: number;
  video: {
    mode: VideoMode;
    clips: ClipSpec[];
    beat: number;
    transition: TransitionKind;
    transitionFrames: number;
    tilt: number;
    sway: number;
    deckDepth: number;
    morph: number;
  };
  ae: {
    mode: AeMode;
    period: number;
    bounce: number;
    tilt: number;
    stallAt: number;
    delay: number;
  };
};

export const DEFAULT_CLIPS: ClipSpec[] = [
  {
    name: "shader-liquid-metal",
    start: 0,
    zoom: 1,
    end: "run",
    background: "#2E0727",
    radius: 0.25,
    cut: "auto",
    props: {
      colorBack: "#2E0727",
      colorTint: "#FF5FD9",
      repetition: 2,
      distortion: 0.18,
      speed: 0.7,
    },
  },
  {
    name: "soft-blur-in",
    start: 0,
    zoom: 1,
    end: "hold",
    background: "#0E1012",
    radius: 0.5,
    cut: "auto",
    props: { text: "Aa", fontSize: 320, color: "#FAFAFA", blur: 24 },
  },
  {
    name: "shader-grain-gradient",
    start: 0,
    zoom: 1,
    end: "run",
    background: "#12020F",
    radius: 0.16,
    cut: "auto",
    props: {
      colors: ["#A800B7", "#F472B6", "#3B0764"],
      colorBack: "#12020F",
      intensity: 0.35,
      noise: 0.25,
    },
  },
  {
    name: "rolling-number",
    start: 0,
    zoom: 1,
    end: "hold",
    background: "#0E1012",
    radius: 0.25,
    cut: "auto",
    props: { from: 0, to: 99, fontSize: 340, color: "#FAFAFA" },
  },
  {
    name: "icon-sparkles",
    start: 0,
    zoom: 0.8,
    end: "loop",
    background: "#FDF4FF",
    radius: 0.5,
    cut: "auto",
    props: { color: "#A800B7", strokeWidth: 1.8 },
  },
];

export const DEFAULT_CONFIG: HeroTilesConfig = {
  seed: 1,
  video: {
    mode: "reel",
    clips: DEFAULT_CLIPS,
    beat: 66,
    transition: "mixed",
    transitionFrames: 14,
    tilt: -6,
    sway: 4,
    deckDepth: 2,
    morph: 0.6,
  },
  ae: {
    mode: "bounce",
    period: 42,
    bounce: 0.22,
    tilt: 5,
    stallAt: 99,
    delay: 0,
  },
};

export const FPS = 30;
export const COMP_SIZE = 540;
export const TILE_SIZE = 300;
export const PLAYER_INSET = "-40%";

export type Cut = {
  kind: CutKind;
  direction: "left" | "right" | "up" | "down";
};

export type Reel = {
  clips: ClipSpec[];
  cuts: Cut[];
  beat: number;
  transitionFrames: number;
  durationInFrames: number;
};

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const DIRECTIONS = ["left", "right", "up", "down"] as const;
const MIXED: CutKind[] = [
  "zoom-blur",
  "whip-pan",
  "push-through",
  "focus-pull",
];

export function resolveReel(
  config: HeroTilesConfig,
  clips: ClipSpec[] = config.video.clips,
): Reel {
  const random = mulberry32(config.seed);
  const list = clips.length > 0 ? clips : DEFAULT_CLIPS.slice(0, 1);
  const cuts = list.map((clip): Cut => {
    const roll = random();
    const direction = DIRECTIONS[Math.floor(random() * 4)];
    if (clip.cut !== "auto") return { kind: clip.cut, direction };
    if (config.video.transition !== "mixed") {
      return { kind: config.video.transition, direction };
    }
    return { kind: MIXED[Math.floor(roll * MIXED.length)], direction };
  });
  const transitionFrames = Math.min(
    config.video.transitionFrames,
    Math.floor(config.video.beat / 2),
  );
  return {
    clips: list,
    cuts,
    beat: config.video.beat,
    transitionFrames,
    durationInFrames: list.length * config.video.beat,
  };
}

export function aeDuration(config: HeroTilesConfig) {
  return config.ae.period * 4;
}
