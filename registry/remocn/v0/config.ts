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
    theme: {
      type: "select",
      default: "dark",
      options: ["light", "dark"],
      label: "Theme",
    },
    background: {
      type: "select",
      default: "surface",
      options: ["surface", "transparent"],
      label: "Background",
    },
  },
  durationInFrames: 150,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
