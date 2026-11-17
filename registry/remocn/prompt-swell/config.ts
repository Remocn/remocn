import {
  type ComponentConfig,
  FPS,
  groundControl,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const promptSwellConfig: ComponentConfig = {
  componentName: "PromptSwell",
  importPath: "@/components/remocn/prompt-swell",
  lists: {
    steps: {
      default: ["Hero with product shot", "Pricing tiers", "Waitlist form"],
      description: "Steps",
    },
  },
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
    headline: {
      type: "text-content",
      default: "Launch videos, built from code.",
      description: "Headline",
    },
    pricingTitle: {
      type: "text-content",
      default: "Simple pricing",
      description: "Pricing title",
    },
    ctaLabel: {
      type: "text-content",
      default: "Join waitlist",
      description: "Button",
    },
    accent: {
      type: "color",
      default: "#ff7a3d",
      description: "Accent",
    },
    ground: groundControl(),
    ...sceneControls({ font: "Geist" }),
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
  durationInFrames: 156,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
