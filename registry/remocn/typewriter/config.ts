import {
  type ComponentConfig,
  FONT_WEIGHT_OPTIONS,
  FPS,
  H,
  W,
} from "@/lib/customizer-config";

export const typewriterConfig: ComponentConfig = {
  componentName: "Typewriter",
  importPath: "@/components/remocn/typewriter",
  controls: {
    text: {
      type: "text",
      default: "console.log('hello, world')",
      label: "Text",
    },
    cursor: { type: "boolean", default: true, label: "Show cursor" },
    charsPerSecond: {
      type: "number",
      default: 22,
      min: 4,
      max: 60,
      step: 1,
      label: "Chars / sec",
    },
    fontSize: {
      type: "number",
      default: 72,
      min: 12,
      max: 160,
      step: 1,
      label: "Font size",
    },
    color: { type: "color", default: "#171717", label: "Color" },
    cursorColor: { type: "color", default: "#171717", label: "Cursor color" },
    fontWeight: {
      type: "select",
      default: "600",
      options: FONT_WEIGHT_OPTIONS,
      label: "Font weight",
    },
  },
  durationInFrames: 120,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
