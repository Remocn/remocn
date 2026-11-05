import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const snapClickConfig: ComponentConfig = {
  componentName: "SnapClick",
  importPath: "@/components/remocn/snap-click",
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
    text: {
      type: "text-content",
      default: "emocn",
      description: "Text",
    },
    label: {
      type: "text-content",
      default: "Animations for Remotion",
      description: "Label",
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
  durationInFrames: 105,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
