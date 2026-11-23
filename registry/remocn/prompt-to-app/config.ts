import {
  type ComponentConfig,
  FPS,
  groundControl,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

const DEFAULT_PROMPT =
  "Build a landing page for Fernway, a neighborhood wine bar. Warm and editorial, with tonight’s pours and a booking button.";
const DEFAULT_PLAN =
  "I’ll build a one-page site for Fernway: a sticky nav, an editorial hero with a booking CTA, and a card grid for tonight’s pours.";

// Mirrors promptToAppDuration in index.tsx; the config can't import it.
function duration(prompt: string, plan: string) {
  return Math.ceil(prompt.length / 2.3 + plan.split(" ").length * 1.3 + 230);
}

export const promptToAppConfig: ComponentConfig = {
  componentName: "PromptToApp",
  importPath: "@/components/remocn/prompt-to-app",
  lists: {
    files: {
      default: [
        "components/Nav.tsx",
        "components/Hero.tsx",
        "components/PourCards.tsx",
        "app/page.tsx",
      ],
      description: "Files",
    },
    siteLinks: {
      default: ["Menu", "Wine list", "Events", "Visit"],
      description: "Site links",
    },
  },
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
    prompt: {
      type: "text-content",
      default: DEFAULT_PROMPT,
      description: "Prompt",
    },
    plan: {
      type: "text-content",
      default: DEFAULT_PLAN,
      description: "Plan",
    },
    doneMessage: {
      type: "text-content",
      default:
        "Fernway is ready. The booking button links to your reservations page.",
      description: "Done message",
    },
    projectName: {
      type: "text-content",
      default: "fernway-site",
      description: "Project name",
    },
    deployUrl: {
      type: "text-content",
      default: "fernway.remocn.app",
      description: "Deploy url",
    },
    siteName: {
      type: "text-content",
      default: "Fernway",
      description: "Site name",
    },
    siteEyebrow: {
      type: "text-content",
      default: "Wine bar · Open late",
      description: "Site eyebrow",
    },
    siteHeadline: {
      type: "text-content",
      default: "Natural wine, small plates, one long table.",
      description: "Site headline",
    },
    siteBody: {
      type: "text-content",
      default:
        "Low-intervention bottles and seasonal plates in the Mission. Walk-ins welcome until 10.",
      description: "Site body",
    },
    emptyTitle: {
      type: "text-content",
      default: "What should we build?",
      description: "Empty chat title",
    },
    siteCta: {
      type: "text-content",
      default: "Book a table",
      description: "Site button",
    },
    poursTitle: {
      type: "text-content",
      default: "Tonight’s pours",
      description: "Pours title",
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
  durationInFrames: 314,
  getDurationInFrames: (values) =>
    duration(
      typeof values.prompt === "string" ? values.prompt : DEFAULT_PROMPT,
      typeof values.plan === "string" ? values.plan : DEFAULT_PLAN,
    ),
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
