import { pixelateRegionExampleCode } from "@/components/docs/examples/pixelate-region-example";
import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const pixelateRegionConfig: ComponentConfig = {
  componentName: "PixelateRegion",
  importPath: "@/components/remocn/pixelate-region",
  controls: {
    cellSize: {
      type: "number",
      min: 6,
      max: 72,
      step: 2,
      default: 24,
      description: "Cell size",
      hiddenFromList: false,
    },
  },
  durationInFrames: 90,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "#0a0a0a" },
  snippet: pixelateRegionExampleCode,
};
