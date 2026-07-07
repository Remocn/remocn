import { grainDissolveExampleCode } from "@/components/docs/examples/grain-dissolve-example";
import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const grainDissolveConfig: ComponentConfig = {
  componentName: "grainDissolve",
  importPath: "@/components/remocn/grain-dissolve",
  controls: {
    shape: {
      type: "select",
      default: "blob",
      options: [
        "wave",
        "dots",
        "truchet",
        "corners",
        "ripple",
        "blob",
        "sphere",
      ],
      label: "Shape",
    },
    noise: {
      type: "number",
      default: 0.3,
      min: 0,
      max: 1,
      step: 0.05,
      label: "Noise",
    },
    zoom: {
      type: "number",
      default: 2,
      min: 0.5,
      max: 4,
      step: 0.25,
      label: "Zoom",
    },
    colorBack: { type: "color", default: "#141318", label: "Background" },
  },
  durationInFrames: 116,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "#141318" },
  snippet: grainDissolveExampleCode,
};
