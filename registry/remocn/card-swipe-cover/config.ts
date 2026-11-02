import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const cardSwipeCoverConfig: ComponentConfig = {
  componentName: "CardSwipeCoverDemo",
  importPath: "@/components/remocn/card-swipe-cover",
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
      default: "Every launch asset, *in one place.*",
      description: "Line",
    },
    title: {
      type: "text-content",
      default: "Launch kits",
      description: "Title",
    },
    subtitle: {
      type: "text-content",
      default: "Four films, ready to render.",
      description: "Subtitle",
    },
  },
  durationInFrames: 120,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
