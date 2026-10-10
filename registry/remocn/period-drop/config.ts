import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const periodDropConfig: ComponentConfig = {
  componentName: "PeriodDrop",
  importPath: "@/components/remocn/period-drop",
  controls: {
    text: { type: "text-content", default: "remocn", description: "Text" },
    color: { type: "color", default: "#fafafa", description: "Text color" },
    dotColor: { type: "color", default: "#ff4d1a", description: "Dot color" },
    fontSize: {
      type: "number",
      default: 160,
      min: 60,
      max: 280,
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
    dotSize: {
      type: "number",
      default: 0.2,
      min: 0.08,
      max: 0.5,
      step: 0.01,
      description: "Dot size (em)",
      hiddenFromList: false,
    },
  },
  durationInFrames: 75,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "#0a0a0a" },
};
