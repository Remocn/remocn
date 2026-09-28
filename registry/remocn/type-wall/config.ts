import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const typeWallConfig: ComponentConfig = {
  componentName: "TypeWall",
  importPath: "@/components/remocn/type-wall",
  controls: {
    text: { type: "text-content", default: "MOTION", description: "Text" },
    separator: {
      type: "text-content",
      default: "·",
      description: "Separator",
    },
    color: { type: "color", default: "#fafafa", description: "Text color" },
    accent: { type: "color", default: "#ff4d1a", description: "Band color" },
    accentText: {
      type: "color",
      default: "#111111",
      description: "Band text",
    },
    fontSize: {
      type: "number",
      default: 64,
      min: 24,
      max: 180,
      step: 2,
      description: "Row height",
      hiddenFromList: false,
    },
    seed: {
      type: "number",
      default: 7,
      min: 0,
      max: 99,
      step: 1,
      description: "Seed",
      hiddenFromList: false,
    },
  },
  durationInFrames: 150,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "#2b3bff" },
};
