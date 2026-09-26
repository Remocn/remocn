import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const glyphAnatomyConfig: ComponentConfig = {
  componentName: "GlyphAnatomy",
  importPath: "@/components/remocn/glyph-anatomy",
  controls: {
    text: { type: "text-content", default: "Glyph", description: "Text" },
    color: { type: "color", default: "#fafafa", description: "Glyph color" },
    guideColor: { type: "color", default: "#0d99ff", description: "Points" },
    fontSize: {
      type: "number",
      default: 200,
      min: 80,
      max: 320,
      step: 2,
      description: "Font size",
      hiddenFromList: false,
    },
    guides: { type: "boolean", default: true, description: "Guides" },
    keepPoints: { type: "boolean", default: false, description: "Keep points" },
  },
  durationInFrames: 96,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "#0a0a0a" },
};
