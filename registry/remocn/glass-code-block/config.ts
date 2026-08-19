import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const glassCodeBlockConfig: ComponentConfig = {
  componentName: "GlassCodeBlock",
  importPath: "@/components/remocn/glass-code-block",
  controls: {
    title: {
      type: "text-content",
      default: "hero.tsx",
      description: "Title",
    },
    width: {
      type: "number",
      min: 300,
      max: 1100,
      step: 10,
      default: 760,
      description: "Width",
      hiddenFromList: false,
    },
    height: {
      type: "number",
      min: 200,
      max: 700,
      step: 10,
      default: 460,
      description: "Height",
      hiddenFromList: false,
    },
    fontSize: {
      type: "number",
      min: 10,
      max: 28,
      step: 1,
      default: 16,
      description: "Font size",
      hiddenFromList: false,
    },
    glassColor: {
      type: "text-content",
      default: "rgba(10, 10, 10, 0.6)",
      description: "Glass color",
    },
    staggerFrames: {
      type: "number",
      min: 0,
      max: 30,
      step: 1,
      default: 4,
      description: "Stagger frames",
      hiddenFromList: false,
    },
    showTrafficLights: {
      type: "boolean",
      default: true,
      description: "Traffic lights",
    },
  },
  durationInFrames: 180,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "image", src: "/bg.jpg" },
};
