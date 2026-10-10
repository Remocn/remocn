import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const selectionSnapConfig: ComponentConfig = {
  componentName: "SelectionSnap",
  importPath: "@/components/remocn/selection-snap",
  controls: {
    text: { type: "text-content", default: "Frame", description: "Text" },
    color: { type: "color", default: "#fafafa", description: "Start color" },
    accent: { type: "color", default: "#ff4d1a", description: "Accent" },
    selectionColor: {
      type: "color",
      default: "#3d5afe",
      description: "Selection",
    },
    fontSize: {
      type: "number",
      default: 150,
      min: 60,
      max: 260,
      step: 2,
      description: "Font size",
      hiddenFromList: false,
    },
    fromWeight: {
      type: "number",
      default: 100,
      min: 100,
      max: 900,
      step: 50,
      description: "From weight",
      hiddenFromList: false,
    },
    toWeight: {
      type: "number",
      default: 900,
      min: 100,
      max: 900,
      step: 50,
      description: "To weight",
      hiddenFromList: false,
    },
    badge: { type: "boolean", default: true, description: "Size badge" },
  },
  durationInFrames: 75,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "#0a0a0a" },
};
