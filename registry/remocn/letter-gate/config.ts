import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const letterGateConfig: ComponentConfig = {
  componentName: "LetterGateDemo",
  importPath: "@/components/remocn/letter-gate",
  controls: {
    theme: {
      type: "enum",
      default: "dark",
      variants: {
        dark: {},
        light: {},
      },
      description: "Theme",
    },
    text: {
      type: "text-content",
      default: "Start building",
      description: "Text",
    },
    gate: {
      type: "text-content",
      default: "bu",
      description: "Gate",
    },
    prompt: {
      type: "text-content",
      default: "A launch film for v2",
      description: "Prompt",
    },
    placeholder: {
      type: "text-content",
      default: "Describe your launch",
      description: "Placeholder",
    },
    label: {
      type: "text-content",
      default: "Prompt",
      description: "Label",
    },
    nextLabel: {
      type: "text-content",
      default: "Script",
      description: "Next label",
    },
  },
  durationInFrames: 118,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
