import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const leadBarTypeConfig: ComponentConfig = {
  componentName: "LeadBarType",
  importPath: "@/components/remocn/lead-bar-type",
  controls: {
    text: { type: "text-content", default: "Every", description: "Text" },
    color: { type: "color", default: "#111111", description: "Text color" },
    barColor: { type: "color", default: "#111111", description: "Bar color" },
    fontSize: {
      type: "number",
      default: 180,
      min: 60,
      max: 320,
      step: 2,
      description: "Font size",
      hiddenFromList: false,
    },
    fontWeight: {
      type: "number",
      default: 800,
      min: 100,
      max: 900,
      step: 50,
      description: "Weight",
      hiddenFromList: false,
    },
    smear: {
      type: "number",
      default: 1,
      min: 0,
      max: 1.5,
      step: 0.05,
      description: "Smear",
      hiddenFromList: false,
    },
  },
  durationInFrames: 66,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "#ff4d1a" },
};
