import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const graphRelayoutConfig: ComponentConfig = {
  componentName: "GraphRelayout",
  importPath: "@/components/remocn/graph-relayout",
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
    kicker: {
      type: "text-content",
      default: "Use case",
      description: "Kicker",
    },
    cursorName: {
      type: "text-content",
      default: "Mia",
      description: "Cursor name",
    },
  },
  durationInFrames: 158,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
