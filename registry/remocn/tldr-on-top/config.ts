import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const tldrOnTopConfig: ComponentConfig = {
  componentName: "TldrOnTop",
  importPath: "@/components/remocn/tldr-on-top",
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
    label: {
      type: "text-content",
      default: "TL;DR",
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
  durationInFrames: 200,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
