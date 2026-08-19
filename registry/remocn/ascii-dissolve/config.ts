import { asciiDissolveExampleCode } from "@/components/docs/examples/ascii-dissolve-example";
import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const asciiDissolveConfig: ComponentConfig = {
  componentName: "asciiDissolve",
  importPath: "@/components/remocn/ascii-dissolve",
  controls: {
    colorBack: {
      type: "color",
      default: "#0d0d10",
      description: "Background",
    },
    colorFront: {
      type: "color",
      default: "#f2f2f2",
      description: "Glyphs",
    },
    cellSize: {
      type: "number",
      min: 10,
      max: 36,
      step: 2,
      default: 22,
      description: "Cell size",
      hiddenFromList: false,
    },
  },
  durationInFrames: 100,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "#0d0d10" },
  snippet: asciiDissolveExampleCode,
};
