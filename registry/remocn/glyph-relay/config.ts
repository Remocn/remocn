import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const glyphRelayConfig: ComponentConfig = {
  componentName: "GlyphRelay",
  importPath: "@/components/remocn/glyph-relay",
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
    line3: {
      type: "text-content",
      default: "Launching it?",
      description: "Line3",
    },
  },
  durationInFrames: 146,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
