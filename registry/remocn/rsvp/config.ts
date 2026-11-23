import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const rsvpConfig: ComponentConfig = {
  componentName: "Rsvp",
  importPath: "@/components/remocn/rsvp",
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
    headline: {
      type: "text-content",
      default: "You’re invited.",
      description: "Headline",
    },
    rsvpLabel: {
      type: "text-content",
      default: "RSVP",
      description: "Rsvp label",
    },
    rsvp: {
      type: "text-content",
      default: "npx shadcn add @remocn/whip-pan",
      description: "Rsvp",
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
    fontWeight: {
      type: "number",
      default: 500,
      min: 300,
      max: 700,
      step: 100,
      description: "Headline weight",
      hiddenFromList: false,
    },
    accent: { type: "color", default: undefined, description: "Accent" },
    ...sceneControls({ font: "Lexend" }),
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
