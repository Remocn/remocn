import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const aToZConfig: ComponentConfig = {
  componentName: "AToZ",
  importPath: "@/components/remocn/a-to-z",
  lists: {
    entries: {
      default: ["any aspect ratio.", "brand fonts.", "captions.", "dark mode."],
      description: "Entries",
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
    finale: {
      type: "text-content",
      default: "zero lock-in.",
      description: "Finale",
    },
    connector: {
      type: "text-content",
      default: "is for",
      description: "Connector",
    },
    stagger: {
      type: "number",
      default: 2,
      min: 0,
      max: 8,
      step: 1,
      description: "Line stagger",
      hiddenFromList: false,
    },
    roll: {
      type: "number",
      default: 7,
      min: 3,
      max: 20,
      step: 1,
      description: "Roll (frames)",
      hiddenFromList: false,
    },
    accent: { type: "color", default: undefined, description: "Accent" },
    ...sceneControls({ font: "Unbounded" }),
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
  durationInFrames: 165,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
