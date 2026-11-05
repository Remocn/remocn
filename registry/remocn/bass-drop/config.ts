import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const bassDropConfig: ComponentConfig = {
  componentName: "BassDrop",
  importPath: "@/components/remocn/bass-drop",
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
    build: {
      type: "text-content",
      default: "THIS FALL",
      description: "Build",
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
  durationInFrames: 150,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
