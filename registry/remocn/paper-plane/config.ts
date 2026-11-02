import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const paperPlaneConfig: ComponentConfig = {
  componentName: "PaperPlane",
  importPath: "@/components/remocn/paper-plane",
  controls: {
    theme: {
      type: "enum",
      default: "light",
      variants: {
        light: {},
        dark: {},
      },
      description: "Theme",
    },
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
    url: {
      type: "text-content",
      default: "remocn.dev",
      description: "Url",
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
  durationInFrames: 220,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
