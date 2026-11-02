import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const collabLockupConfig: ComponentConfig = {
  componentName: "CollabLockup",
  importPath: "@/components/remocn/collab-lockup",
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
    caption: {
      type: "text-content",
      default: "Launch videos, rendered from every Kitebase workspace.",
      description: "Caption",
    },
    joiner: {
      type: "enum",
      default: "×",
      variants: {
        "×": {},
        "&": {},
      },
      description: "Joiner",
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
  durationInFrames: 120,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
