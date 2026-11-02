import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const lightBurnToLineConfig: ComponentConfig = {
  componentName: "LightBurnToLineDemo",
  importPath: "@/components/remocn/light-burn-to-line",
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
    line: {
      type: "text-content",
      default: "Now ship your first film.",
      description: "Line",
    },
    cta: {
      type: "text-content",
      default: "Start free",
      description: "Cta",
    },
    url: {
      type: "text-content",
      default: "remocn.dev/new",
      description: "Url",
    },
  },
  durationInFrames: 126,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
