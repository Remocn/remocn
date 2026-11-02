import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const headlineToLineConfig: ComponentConfig = {
  componentName: "HeadlineToLine",
  importPath: "@/components/remocn/headline-to-line",
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
    continuation: {
      type: "text-content",
      default: ", built from blocks you own",
      description: "Continuation",
    },
    accentIndex: {
      type: "number",
      default: 1,
      min: 0,
      max: 10,
      step: 1,
      description: "Accent index",
      hiddenFromList: false,
    },
  },
  durationInFrames: 132,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
