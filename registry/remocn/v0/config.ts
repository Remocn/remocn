import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const v0Config: ComponentConfig = {
  componentName: "V0",
  importPath: "@/components/remocn/v0",
  controls: {
    greeting: {
      type: "text-content",
      default: "What do you want to create?",
      description: "Greeting",
    },
    placeholder: {
      type: "text-content",
      default: "Ask v0 to build…",
      description: "Placeholder",
    },
    prompt: {
      type: "text-content",
      default: "a landing page for my SaaS with pricing and testimonials",
      description: "Prompt",
    },
    modelName: {
      type: "text-content",
      default: "v0 Max",
      description: "Model",
    },
    projectName: {
      type: "text-content",
      default: "Project",
      description: "Project",
    },
  },
  durationInFrames: 150,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "#000000" },
};
