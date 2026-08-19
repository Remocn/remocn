import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const extrudePopConfig: ComponentConfig = {
  componentName: "ExtrudePop",
  importPath: "@/components/remocn/extrude-pop",
  controls: {
    letter: {
      type: "text-content",
      default: "WIN",
      description: "Text",
    },
    bodyColor: {
      type: "color",
      default: "#e8192b",
      description: "Body color",
    },
    faceColor: {
      type: "color",
      default: "#ffffff",
      description: "Face color",
    },
    minimaxRadius: {
      type: "number",
      min: 0,
      max: 200,
      step: 5,
      default: 80,
      description: "Extrude radius",
      hiddenFromList: false,
    },
    extrudeAngleDeg: {
      type: "number",
      min: -180,
      max: 180,
      step: 1,
      default: -58.6,
      description: "Extrude angle",
      hiddenFromList: false,
    },
    extrudeEndFrame: {
      type: "number",
      min: 10,
      max: 90,
      step: 1,
      default: 48,
      description: "Extrude ends (frame)",
      hiddenFromList: false,
    },
  },
  durationInFrames: 90,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "#141318" },
};
