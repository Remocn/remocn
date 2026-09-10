import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";
import { inlineWordRollDefaultText } from ".";

export const inlineWordRollConfig: ComponentConfig = {
  componentName: "InlineWordRoll",
  importPath: "@/components/remocn/inline-word-roll",
  controls: {
    prefix: {
      type: "text-content",
      default: "Looking for",
      description: "Fixed text",
    },
    text: {
      type: "text-content",
      default: inlineWordRollDefaultText,
      description: "Words separated by |",
    },
    suffix: { type: "text-content", default: "?", description: "Word suffix" },
    fontSize: {
      type: "number",
      default: 60,
      min: 16,
      max: 160,
      step: 1,
      description: "Font size",
      hiddenFromList: false,
    },
    interval: {
      type: "number",
      default: 12,
      min: 6,
      max: 60,
      step: 1,
      description: "Initial frames per word",
      hiddenFromList: false,
    },
    acceleration: {
      type: "number",
      default: 0.9,
      min: 0.5,
      max: 1,
      step: 0.01,
      description: "Interval multiplier",
      hiddenFromList: false,
    },
    transitionFrames: {
      type: "number",
      default: 6,
      min: 1,
      max: 20,
      step: 1,
      description: "Roll duration",
      hiddenFromList: false,
    },
    color: { type: "color", default: "#f5f5f5", description: "Color" },
  },
  durationInFrames: 105,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "#000000" },
};
