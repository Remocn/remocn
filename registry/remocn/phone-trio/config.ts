import {
  type ComponentConfig,
  FPS,
  groundControl,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const phoneTrioConfig: ComponentConfig = {
  componentName: "PhoneTrio",
  importPath: "@/components/remocn/phone-trio",
  lists: {
    skills: {
      default: ["Motion", "Sound", "Web"],
      description: "Skills",
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
    name: {
      type: "text-content",
      default: "Ines Marlow",
      description: "Name",
    },
    handle: {
      type: "text-content",
      default: "ines.marlow",
      description: "Handle",
    },
    role: {
      type: "text-content",
      default: "Motion designer",
      description: "Role",
    },
    headline: {
      type: "text-content",
      default: "Driven by motion, obsessed with the",
      description: "Headline",
    },
    accentWord: {
      type: "text-content",
      default: "seamless.",
      description: "Accent word",
    },
    liveLabel: {
      type: "text-content",
      default: "Portfolio is live",
      description: "Live label",
    },
    workTitle: {
      type: "text-content",
      default: "Selected work",
      description: "Work title",
    },
    ctaLabel: {
      type: "text-content",
      default: "Open for projects",
      description: "Call to action",
    },
    followLabel: {
      type: "text-content",
      default: "Follow",
      description: "Follow button",
    },
    accent: {
      type: "color",
      default: "#ff5a36",
      description: "Accent",
    },
    ground: groundControl(),
    ...sceneControls({ font: "Manrope" }),
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
  durationInFrames: 132,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
