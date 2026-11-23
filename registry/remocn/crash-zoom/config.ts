import {
  type ComponentConfig,
  FPS,
  groundControl,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const crashZoomConfig: ComponentConfig = {
  componentName: "CrashZoom",
  importPath: "@/components/remocn/crash-zoom",
  controls: {
    theme: {
      type: "enum",
      default: "dark",
      variants: {
        dark: {},
        light: {},
      },
      description: "Theme",
    },
    tease: {
      type: "text-content",
      default: "Wait for it…",
      description: "Tease",
    },
    reveal: {
      type: "text-content",
      default: "1 DAY.",
      description: "Reveal",
    },
    tagline: {
      type: "text-content",
      default: "to make this video.",
      description: "Tagline",
    },
    windup: {
      type: "number",
      default: 36,
      min: 24,
      max: 72,
      step: 1,
      description: "Windup (frames)",
      hiddenFromList: false,
    },
    streaks: {
      type: "number",
      default: 72,
      min: 24,
      max: 144,
      step: 4,
      description: "Speed lines",
      hiddenFromList: false,
    },
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
    ground: groundControl(),
    ...sceneControls({ font: "Schibsted Grotesk" }),
    speed: {
      type: "number",
      default: 1,
      min: 0.25,
      max: 4,
      step: 0.25,
      description: "Speed",
      hiddenFromList: false,
    },
  },
  durationInFrames: 105,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
