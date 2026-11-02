import { explodedViewExampleCode } from "@/components/docs/examples/exploded-view-example";
import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const explodedViewConfig: ComponentConfig = {
  componentName: "ExplodedView",
  importPath: "@/components/remocn/exploded-view",
  controls: {
    labels: {
      type: "text-content",
      default: "Interface, Engine, Storage, Hardware",
      description: "Labels (comma-separated)",
    },
    layers: {
      type: "number",
      default: 4,
      min: 2,
      max: 6,
      step: 1,
      description: "Slabs",
      hiddenFromList: false,
    },
    highlight: {
      type: "number",
      default: 1,
      min: 0,
      max: 5,
      step: 1,
      description: "Highlighted slab",
      hiddenFromList: false,
    },
    backgroundColor: {
      type: "color",
      default: "#111111",
      description: "Background",
    },
    labelColor: { type: "color", default: "#FFFFFF", description: "Labels" },
  },
  durationInFrames: 70,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "#111111" },
  snippet: explodedViewExampleCode,
};
