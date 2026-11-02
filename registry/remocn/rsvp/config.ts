import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

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
