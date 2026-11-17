import {
  type ComponentConfig,
  FPS,
  groundControl,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const macroClickConfig: ComponentConfig = {
  componentName: "MacroClick",
  importPath: "@/components/remocn/macro-click",
  lists: {
    pages: {
      default: ["Home", "Pricing", "Changelog", "Docs"],
      description: "Pages",
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
    heroSub: {
      type: "text-content",
      default:
        "Write the brief, pick the beats and render the film before lunch.",
      description: "Hero subline",
    },
    ctaLabel: {
      type: "text-content",
      default: "Start free",
      description: "CTA label",
    },
    inviteLabel: {
      type: "text-content",
      default: "Invite",
      description: "Invite label",
    },
    accent: {
      type: "color",
      default: "#3B5BFD",
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
  durationInFrames: 150,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
