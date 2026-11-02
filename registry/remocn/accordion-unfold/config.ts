import { accordionUnfoldExampleCode } from "@/components/docs/examples/accordion-unfold-example";
import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const accordionUnfoldConfig: ComponentConfig = {
  componentName: "AccordionUnfold",
  importPath: "@/components/remocn/accordion-unfold",
  controls: {
    panels: {
      type: "number",
      default: 6,
      min: 2,
      max: 12,
      step: 1,
      description: "Panels",
      hiddenFromList: false,
    },
    foldAngle: {
      type: "number",
      default: 82,
      min: 10,
      max: 89,
      step: 1,
      description: "Fold angle",
      hiddenFromList: false,
    },
    shade: {
      type: "number",
      default: 0.55,
      min: 0,
      max: 1,
      step: 0.05,
      description: "Shade",
      hiddenFromList: false,
    },
    color: { type: "color", default: "#FFFFFF", description: "Paper" },
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
  snippet: accordionUnfoldExampleCode,
};
