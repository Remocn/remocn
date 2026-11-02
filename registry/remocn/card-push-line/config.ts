import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const cardPushLineConfig: ComponentConfig = {
  componentName: "CardPushLine",
  importPath: "@/components/remocn/card-push-line",
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
    line: {
      type: "text-content",
      default: "You can just write it",
      description: "Line",
    },
    command: {
      type: "text-content",
      default: "/launch-video",
      description: "Command",
    },
    prompt: {
      type: "text-content",
      default: "a teaser for the 2.0 release",
      description: "Prompt",
    },
    placeholder: {
      type: "text-content",
      default: "Describe your launch…",
      description: "Placeholder",
    },
    modelLabel: {
      type: "text-content",
      default: "Remocn 1",
      description: "Model label",
    },
    chipLabel: {
      type: "text-content",
      default: "Brand kit",
      description: "Chip label",
    },
    attachName: {
      type: "text-content",
      default: "release-notes-2.0.md",
      description: "Attach name",
    },
    attachMeta: {
      type: "text-content",
      default: "Markdown · 18 KB",
      description: "Attach meta",
    },
  },
  durationInFrames: 144,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
