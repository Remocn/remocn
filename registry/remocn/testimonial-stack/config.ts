import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const testimonialStackConfig: ComponentConfig = {
  componentName: "TestimonialStack",
  importPath: "@/components/remocn/testimonial-stack",
  controls: {
    theme: {
      type: "enum",
      default: "light",
      variants: {
        light: {},
        dark: {},
      },
      description: "Theme",
    },
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
    title: {
      type: "text-content",
      default: "What builders said after launch week",
      description: "Title",
    },
    ending: {
      type: "enum",
      default: "pile",
      variants: {
        pile: {},
        fan: {},
      },
      description: "Ending",
    },
    framesPerQuote: {
      type: "number",
      default: 50,
      min: 0,
      max: 150,
      step: 1,
      description: "Frames per quote",
      hiddenFromList: false,
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
  durationInFrames: 236,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
