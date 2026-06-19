import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const codeAccordionConfig: ComponentConfig = {
  componentName: "CodeAccordion",
  importPath: "@/components/remocn/code-accordion",
  controls: {
    title: { type: "text", default: "process-orders.ts", label: "Title" },
    collapseAt: {
      type: "number",
      default: 30,
      min: 0,
      max: 240,
      step: 1,
      label: "Collapse at (frame)",
    },
    fontSize: {
      type: "number",
      default: 16,
      min: 10,
      max: 28,
      step: 1,
      label: "Font size",
    },
    width: {
      type: "number",
      default: 720,
      min: 320,
      max: 1100,
      step: 10,
      label: "Width",
    },
    cardColor: { type: "color", default: "#0a0a0a", label: "Card color" },
    textColor: { type: "color", default: "#e4e4e7", label: "Text color" },
    mutedColor: { type: "color", default: "#52525b", label: "Muted color" },
  },
  durationInFrames: 150,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "#050505" },
};
