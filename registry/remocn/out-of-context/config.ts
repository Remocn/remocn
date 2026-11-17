import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const outOfContextConfig: ComponentConfig = {
  componentName: "OutOfContext",
  importPath: "@/components/remocn/out-of-context",
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
    claim: {
      type: "text-content",
      default: "Stop making\nlaunch videos",
      description: "Claim",
    },
    rest: {
      type: "text-content",
      default: "by hand.",
      description: "Rest",
    },
    dropAt: {
      type: "number",
      default: 40,
      min: 0,
      max: 90,
      step: 1,
      description: "Drop at (frame)",
      hiddenFromList: false,
    },
    pullLen: {
      type: "number",
      default: 40,
      min: 10,
      max: 90,
      step: 1,
      description: "Pull-back (frames)",
      hiddenFromList: false,
    },
    accent: { type: "color", default: undefined, description: "Accent" },
    ...sceneControls({ font: "Outfit" }),
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
