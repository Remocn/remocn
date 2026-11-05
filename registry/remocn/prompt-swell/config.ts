import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const promptSwellConfig: ComponentConfig = {
  componentName: "PromptSwell",
  importPath: "@/components/remocn/prompt-swell",
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
      default: "#ff7a3d",
      description: "Accent",
    },
    prompt: {
      type: "text-content",
      default:
        "Build a launch page for our video kit with a hero, pricing and a waitlist",
      description: "Prompt",
    },
    url: {
      type: "text-content",
      default: "preview.remocn.dev",
      description: "Url",
    },
  },
  durationInFrames: 156,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
