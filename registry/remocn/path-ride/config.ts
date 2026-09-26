import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";
import { pathRideDefaultPath } from ".";

export const pathRideConfig: ComponentConfig = {
  componentName: "PathRide",
  importPath: "@/components/remocn/path-ride",
  controls: {
    text: {
      type: "text-content",
      default: "Follow the line",
      description: "Text",
    },
    path: {
      type: "text-content",
      default: pathRideDefaultPath,
      description: "Path (1280×720)",
    },
    color: { type: "color", default: "#111111", description: "Text color" },
    lineColor: { type: "color", default: "#fafafa", description: "Line color" },
    fontSize: {
      type: "number",
      default: 44,
      min: 16,
      max: 120,
      step: 1,
      description: "Font size",
      hiddenFromList: false,
    },
    fontWeight: {
      type: "number",
      default: 700,
      min: 100,
      max: 900,
      step: 50,
      description: "Weight",
      hiddenFromList: false,
    },
    lineWidth: {
      type: "number",
      default: 3,
      min: 1,
      max: 12,
      step: 0.5,
      description: "Line width",
      hiddenFromList: false,
    },
  },
  durationInFrames: 96,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "#ff4d1a" },
};
