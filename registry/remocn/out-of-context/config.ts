import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

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
