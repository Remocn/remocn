import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const intelligenceGlowConfig: ComponentConfig = {
  componentName: "IntelligenceGlow",
  importPath: "@/components/remocn/intelligence-glow",
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
    question: {
      type: "text-content",
      default: "Make a launch film for Friday?",
      description: "Question",
    },
    answerLead: {
      type: "text-content",
      default: "Done.",
      description: "Answer lead",
    },
    answer: {
      type: "text-content",
      default: "14 shots, cut to the beat.",
      description: "Answer",
    },
    showLogo: {
      type: "boolean",
      default: true,
      description: "Show logo",
    },
    speed: {
      type: "number",
      default: 1,
      min: 0.25,
      max: 4,
      step: 0.25,
      description: "Speed",
      hiddenFromList: false,
    },
  },
  durationInFrames: 180,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
