import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const stretchInConfig: ComponentConfig = {
  componentName: "StretchIn",
  importPath: "@/components/remocn/stretch-in",
  controls: {
    text: {
      type: "text-content",
      default: "REMOCN",
      description: "Text",
    },
    fill: {
      type: "color",
      default: "#ffffff",
      description: "Fill",
    },
    fontSize: {
      type: "number",
      min: 100,
      max: 700,
      step: 10,
      default: 510,
      description: "Font size",
      hiddenFromList: false,
    },
    entryStagger: {
      type: "number",
      min: 0,
      max: 12,
      step: 1,
      default: 3,
      description: "Letter stagger",
      hiddenFromList: false,
    },
    travelFrames: {
      type: "number",
      min: 4,
      max: 40,
      step: 1,
      default: 33,
      description: "Travel (frames)",
      hiddenFromList: false,
    },
    vertexLagFrames: {
      type: "number",
      min: 0,
      max: 8,
      step: 0.5,
      default: 3.5,
      description: "Smear lag (frames)",
      hiddenFromList: false,
    },
  },
  durationInFrames: 60,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "#141318" },
};
