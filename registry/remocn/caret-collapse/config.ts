import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const caretCollapseConfig: ComponentConfig = {
  componentName: "CaretCollapseDemo",
  importPath: "@/components/remocn/caret-collapse",
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
    url: {
      type: "text-content",
      default: "remocn.dev/launch",
      description: "Url",
    },
    label: {
      type: "text-content",
      default: "is live",
      description: "Label",
    },
    question: {
      type: "text-content",
      default: "What will you launch next?",
      description: "Question",
    },
    prompt: {
      type: "text-content",
      default: "Make a 30-second launch film for our 2.0 release",
      description: "Prompt",
    },
  },
  durationInFrames: 132,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
