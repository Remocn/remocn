import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const progressStepsConfig: ComponentConfig = {
  componentName: "ProgressSteps",
  importPath: "@/components/remocn/progress-steps",
  controls: {
    orientation: {
      type: "select",
      default: "horizontal",
      options: ["horizontal", "vertical"],
      label: "Orientation",
    },
    activeColor: { type: "color", default: "#22c55e", label: "Active color" },
    inactiveColor: {
      type: "color",
      default: "#27272a",
      label: "Inactive color",
    },
    textColor: { type: "color", default: "#ffffff", label: "Text color" },
    stepDuration: {
      type: "number",
      default: 30,
      min: 4,
      max: 120,
      step: 1,
      label: "Step duration",
    },
  },
  durationInFrames: 150,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "#0a0a0a" },
};
