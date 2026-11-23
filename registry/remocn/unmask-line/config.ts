import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const unmaskLineConfig: ComponentConfig = {
  componentName: "UnmaskLine",
  importPath: "@/components/remocn/unmask-line",
  lists: {
    lines: {
      default: ["Out of", "stealth."],
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
    highlight: {
      type: "number",
      default: -1,
      min: -10,
      max: 10,
      step: 1,
      description: "Highlight",
      hiddenFromList: false,
    },
    openAt: {
      type: "number",
      default: 38,
      min: 10,
      max: 90,
      step: 1,
      description: "Open at (frame)",
      hiddenFromList: false,
    },
    stagger: {
      type: "number",
      default: 2.2,
      min: 0,
      max: 8,
      step: 0.2,
      description: "Letter stagger",
      hiddenFromList: false,
    },
    accent: { type: "color", default: undefined, description: "Accent" },
    ...sceneControls({ font: "IBM Plex Mono" }),
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
  durationInFrames: 120,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
