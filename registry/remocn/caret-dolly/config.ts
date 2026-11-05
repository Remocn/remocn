import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const caretDollyConfig: ComponentConfig = {
  componentName: "CaretDolly",
  importPath: "@/components/remocn/caret-dolly",
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
    prompt: {
      type: "text-content",
      default:
        "Make a launch video for our new app with a bold title, product shots and a calm ending",
      description: "Prompt",
    },
    focus: {
      type: "text-content",
      default: "launch video",
      description: "Focus",
    },
    chipLabel: {
      type: "text-content",
      default: "Video",
      description: "Chip label",
    },
    modelLabel: {
      type: "text-content",
      default: "Remocn 1",
      description: "Model label",
    },
  },
  durationInFrames: 150,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
