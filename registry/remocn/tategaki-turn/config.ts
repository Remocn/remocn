import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const tategakiTurnConfig: ComponentConfig = {
  componentName: "TategakiTurn",
  importPath: "@/components/remocn/tategaki-turn",
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
    text: {
      type: "text-content",
      default: "Read it both ways.",
      description: "Text",
    },
    hold: {
      type: "number",
      default: 16,
      min: 0,
      max: 48,
      step: 1,
      description: "Hold",
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
  durationInFrames: 120,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
