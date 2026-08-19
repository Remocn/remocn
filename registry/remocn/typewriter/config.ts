import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const typewriterConfig: ComponentConfig = {
  componentName: "Typewriter",
  importPath: "@/components/remocn/typewriter",
  controls: {
    text: {
      type: "text-content",
      default: "console.log('hello, world')",
      description: "Text",
    },
    cursor: {
      type: "boolean",
      default: true,
      description: "Show cursor",
    },
    charsPerSecond: {
      type: "number",
      min: 4,
      max: 60,
      step: 1,
      default: 22,
      description: "Chars / sec",
      hiddenFromList: false,
    },
    fontSize: {
      type: "number",
      min: 12,
      max: 160,
      step: 1,
      default: 72,
      description: "Font size",
      hiddenFromList: false,
    },
    color: {
      type: "color",
      default: "#171717",
      description: "Color",
    },
    cursorColor: {
      type: "color",
      default: "#171717",
      description: "Cursor color",
    },
    fontWeight: {
      type: "enum",
      default: "600",
      variants: {
        "400": {},
        "500": {},
        "600": {},
        "700": {},
      },
      description: "Font weight",
    },
  },
  durationInFrames: 120,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
