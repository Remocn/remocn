import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const macroClickConfig: ComponentConfig = {
  componentName: "MacroClick",
  importPath: "@/components/remocn/macro-click",
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
    title: {
      type: "text-content",
      default: "One click. It's live.",
      description: "Title",
    },
    docTitle: {
      type: "text-content",
      default: "Launch site",
      description: "Doc title",
    },
    publishLabel: {
      type: "text-content",
      default: "Publish",
      description: "Publish label",
    },
    busyLabel: {
      type: "text-content",
      default: "Publishing",
      description: "Busy label",
    },
    liveLabel: {
      type: "text-content",
      default: "Live",
      description: "Live label",
    },
    url: {
      type: "text-content",
      default: "remocn.dev/launch",
      description: "Url",
    },
    toast: {
      type: "text-content",
      default: "Your site is live",
      description: "Toast",
    },
    heroLine: {
      type: "text-content",
      default: "Ship the launch today.",
      description: "Hero line",
    },
  },
  durationInFrames: 150,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
