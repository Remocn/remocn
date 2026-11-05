import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const zeroStretchConfig: ComponentConfig = {
  componentName: "ZeroStretch",
  importPath: "@/components/remocn/zero-stretch",
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
    value: {
      type: "text-content",
      default: "200",
      description: "Value",
    },
    label: {
      type: "text-content",
      default: "components",
      description: "Label",
    },
    caption: {
      type: "text-content",
      default: "Ready to ship. Copy one in, own every frame.",
      description: "Caption",
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
  durationInFrames: 135,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
