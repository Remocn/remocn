import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const ctaCollapseMarkConfig: ComponentConfig = {
  componentName: "CtaCollapseMark",
  importPath: "@/components/remocn/cta-collapse-mark",
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
    cta: {
      type: "text-content",
      default: "Ship your first launch film",
      description: "Cta",
    },
    url: {
      type: "text-content",
      default: "remocn.dev",
      description: "Url",
    },
  },
  durationInFrames: 138,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
