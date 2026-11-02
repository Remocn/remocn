import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const blinkCutConfig: ComponentConfig = {
  componentName: "BlinkCut",
  importPath: "@/components/remocn/blink-cut",
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
    brand: {
      type: "text-content",
      default: "remocn",
      description: "Brand",
    },
    line: {
      type: "text-content",
      default: "Launch films, built in Remotion.",
      description: "Line",
    },
    framesPerWord: {
      type: "number",
      default: 6,
      min: 0,
      max: 18,
      step: 1,
      description: "Frames per word",
      hiddenFromList: false,
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
