import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";
import { getCursorGravityDuration } from ".";

export const cursorGravityConfig: ComponentConfig = {
  componentName: "CursorGravity",
  importPath: "@/components/remocn/cursor-gravity",
  controls: {
    label: {
      type: "text-content",
      default: "Create something",
      description: "Button label",
    },
    tension: {
      type: "number",
      default: 1,
      min: 0,
      max: 1.5,
      step: 0.1,
      description: "Pull tension",
      hiddenFromList: false,
    },
    cursorColor: { type: "color", default: "#fffaf0", description: "Cursor" },
    color: { type: "color", default: "#fffaf0", description: "Button" },
    textColor: {
      type: "color",
      default: "#32153c",
      description: "Button text",
    },
    backgroundColor: {
      type: "color",
      default: "#a800b7",
      description: "Background",
    },
  },
  durationInFrames: 180,
  getDurationInFrames: (values) => getCursorGravityDuration(values),
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
