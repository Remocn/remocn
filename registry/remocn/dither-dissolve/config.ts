import { ditherDissolveExampleCode } from "@/components/docs/examples/dither-dissolve-example";
import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const ditherDissolveConfig: ComponentConfig = {
  componentName: "ditherDissolve",
  importPath: "@/components/remocn/dither-dissolve",
  controls: {
    shape: {
      type: "select",
      default: "simplex",
      options: ["simplex", "warp", "dots", "wave", "ripple", "swirl", "sphere"],
      label: "Shape",
    },
    colorBack: { type: "color", default: "#141318", label: "Background" },
    colorFront: { type: "color", default: "#8f88ae", label: "Ink" },
  },
  durationInFrames: 100,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "#141318" },
  snippet: ditherDissolveExampleCode,
};
