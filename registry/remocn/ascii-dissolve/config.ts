import { asciiDissolveExampleCode } from "@/components/docs/examples/ascii-dissolve-example";
import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const asciiDissolveConfig: ComponentConfig = {
  componentName: "asciiDissolve",
  importPath: "@/components/remocn/ascii-dissolve",
  controls: {
    colorBack: { type: "color", default: "#0d0d10", label: "Background" },
    colorFront: { type: "color", default: "#f2f2f2", label: "Glyphs" },
    cellSize: {
      type: "number",
      default: 22,
      min: 10,
      max: 36,
      step: 2,
      label: "Cell size",
    },
  },
  durationInFrames: 100,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "#0d0d10" },
  snippet: asciiDissolveExampleCode,
};
