import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const rimDrawCardConfig: ComponentConfig = {
  componentName: "RimDrawCard",
  importPath: "@/components/remocn/rim-draw-card",
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
      default: "Just tell it once.",
      description: "Line",
    },
    command: {
      type: "text-content",
      default: "/brand-voice",
      description: "Command",
    },
    title: {
      type: "text-content",
      default: "Brand voice",
      description: "Title",
    },
    subtitle: {
      type: "text-content",
      default: "Used every time you write launch copy.",
      description: "Subtitle",
    },
    label: {
      type: "text-content",
      default: "Instructions",
      description: "Label",
    },
    instructions: {
      type: "text-content",
      default:
        "Short, calm sentences. Name the feature first, then what it saves you.",
      description: "Instructions",
    },
    action: {
      type: "text-content",
      default: "Save skill",
      description: "Action",
    },
    done: {
      type: "text-content",
      default: "Saved",
      description: "Done",
    },
    preview: {
      type: "text-content",
      default: "Scenes now render three times faster. Ship the reel tonight.",
      description: "Preview",
    },
  },
  durationInFrames: 138,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
