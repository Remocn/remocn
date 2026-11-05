import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const flipStingConfig: ComponentConfig = {
  componentName: "FlipSting",
  importPath: "@/components/remocn/flip-sting",
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
    line: {
      type: "text-content",
      default: "LAUNCH FILMS",
      description: "Line",
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
