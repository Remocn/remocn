import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const pinnedWordConfig: ComponentConfig = {
  componentName: "PinnedWord",
  importPath: "@/components/remocn/pinned-word",
  lists: {
    lines: {
      default: [
        "Ship a video tonight.",
        "Write the video in code.",
        "Own every video frame.",
      ],
      description: "Lines",
    },
  },
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
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
    word: {
      type: "text-content",
      default: "video",
      description: "Word",
    },
    hold: {
      type: "number",
      default: 36,
      min: 0,
      max: 108,
      step: 1,
      description: "Hold",
      hiddenFromList: false,
    },
    flick: {
      type: "number",
      default: 18,
      min: 6,
      max: 40,
      step: 1,
      description: "Flick (frames)",
      hiddenFromList: false,
    },
    accentFont: {
      type: "font-family",
      default: "Instrument Serif",
      description: "Accent font",
    },
    ...sceneControls({ font: "Schibsted Grotesk", grain: true }),
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
  durationInFrames: 130,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
