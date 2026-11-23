import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

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
    stagger: {
      type: "number",
      default: 4,
      min: 0,
      max: 12,
      step: 1,
      description: "Word stagger",
      hiddenFromList: false,
    },
    intensity: {
      type: "number",
      default: 1,
      min: 0,
      max: 2,
      step: 0.05,
      description: "Glow intensity",
      hiddenFromList: false,
    },
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
    ...sceneControls({ font: "Instrument Sans", grain: true }),
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
