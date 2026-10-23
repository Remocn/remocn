import { inflateExampleCode } from "@/components/docs/examples/inflate-example";
import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const inflateConfig: ComponentConfig = {
  componentName: "Inflate",
  importPath: "@/components/remocn/inflate",
  controls: {
    color: { type: "color", default: "#E5322D", description: "Body" },
    highlight: { type: "color", default: "#FFFFFF", description: "Highlight" },
    dotColor: { type: "color", default: "#111111", description: "Dot" },
    backgroundColor: {
      type: "color",
      default: "#111111",
      description: "Background",
    },
  },
  durationInFrames: 66,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "#111111" },
  snippet: inflateExampleCode,
};
