import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const v0Config: ComponentConfig = {
  componentName: "V0",
  importPath: "@/components/remocn/v0",
  controls: {
    greeting: {
      type: "text",
      default: "What do you want to create?",
      label: "Greeting",
    },
    placeholder: {
      type: "text",
      default: "Ask v0 to build…",
      label: "Placeholder",
    },
    prompt: {
      type: "text",
      default: "a landing page for my SaaS with pricing and testimonials",
      label: "Prompt",
    },
    modelName: { type: "text", default: "v0 Max", label: "Model" },
    projectName: { type: "text", default: "Project", label: "Project" },
  },
  durationInFrames: 150,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "#000000" },
};
