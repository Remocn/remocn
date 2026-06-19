import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const glassCodeBlockConfig: ComponentConfig = {
  componentName: "GlassCodeBlock",
  importPath: "@/components/remocn/glass-code-block",
  controls: {
    title: { type: "text", default: "hero.tsx", label: "Title" },
    width: {
      type: "number",
      default: 760,
      min: 300,
      max: 1100,
      step: 10,
      label: "Width",
    },
    height: {
      type: "number",
      default: 460,
      min: 200,
      max: 700,
      step: 10,
      label: "Height",
    },
    fontSize: {
      type: "number",
      default: 16,
      min: 10,
      max: 28,
      step: 1,
      label: "Font size",
    },
    glassColor: {
      type: "text",
      default: "rgba(10, 10, 10, 0.6)",
      label: "Glass color",
    },
    staggerFrames: {
      type: "number",
      default: 4,
      min: 0,
      max: 30,
      step: 1,
      label: "Stagger frames",
    },
    showTrafficLights: {
      type: "boolean",
      default: true,
      label: "Traffic lights",
    },
  },
  durationInFrames: 180,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "#0a0a0a" },
};
