import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const multiFileDropConfig: ComponentConfig = {
  componentName: "MultiFileDrop",
  importPath: "@/components/remocn/multi-file-drop",
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
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
    heading: {
      type: "text-content",
      default: "What are we launching?",
      description: "Heading",
    },
    prompt: {
      type: "text-content",
      default:
        "Build a launch page for v2 with a hero video, a pricing table and a waitlist.",
      description: "Prompt",
    },
  },
  durationInFrames: 144,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
