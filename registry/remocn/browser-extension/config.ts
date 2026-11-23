import {
  type ComponentConfig,
  FPS,
  groundControl,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const browserExtensionConfig: ComponentConfig = {
  componentName: "BrowserExtension",
  importPath: "@/components/remocn/browser-extension",
  lists: {
    paragraphs: {
      default: [
        "Every launch we studied had the same shape. The teams that shipped weekly were not the ones with the biggest roadmaps; they were the ones with the shortest distance between a decision and a deploy.",
        "Small teams win because context never has to travel. When the person who talks to customers is the person who writes the code, a bug report becomes a fix before lunch. Nobody writes a ticket about a ticket.",
        "That speed compounds. A team that ships twenty small releases learns twenty times; a team that ships one big release learns once, usually too late to change course.",
        "The lesson is not to stay small forever. It is to protect the short loop as you grow: fewer handoffs, smaller batches, and owners who can ship without asking.",
      ],
      description: "Paragraphs",
    },
    highlights: {
      default: [
        "they were the ones with the shortest distance between a decision and a deploy.",
        "Small teams win because context never has to travel.",
        "A team that ships twenty small releases learns twenty times",
      ],
      description: "Highlights",
    },
    summary: {
      default: [
        "Weekly shippers keep the loop from decision to deploy short.",
        "Context stays with one owner, so bug reports become fixes fast.",
        "Many small releases teach more than one big launch.",
      ],
      description: "Summary",
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
    url: {
      type: "text-content",
      default: "quarry.blog/notes/why-small-teams-ship-faster",
      description: "Url",
    },
    siteName: {
      type: "text-content",
      default: "Quarry Journal",
      description: "Site name",
    },
    kicker: {
      type: "text-content",
      default: "Notes · 6 min read",
      description: "Kicker",
    },
    title: {
      type: "text-content",
      default: "Why small teams ship faster",
      description: "Title",
    },
    dek: {
      type: "text-content",
      default: "On the short loop between a decision and a deploy.",
      description: "Dek",
    },
    author: {
      type: "text-content",
      default: "Priya Raman",
      description: "Author",
    },
    date: {
      type: "text-content",
      default: "Oct 14, 2026",
      description: "Date",
    },
    extensionName: {
      type: "text-content",
      default: "remocn",
      description: "Extension name",
    },
    collection: {
      type: "text-content",
      default: "Reading list",
      description: "Collection",
    },
    saveLabel: {
      type: "text-content",
      default: "Save to remocn",
      description: "Save label",
    },
    summaryLabel: {
      type: "text-content",
      default: "Summary",
      description: "Summary label",
    },
    readingLabel: {
      type: "text-content",
      default: "Reading page",
      description: "Reading label",
    },
    openLabel: {
      type: "text-content",
      default: "Open",
      description: "Open label",
    },
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
    highlightColor: {
      type: "color",
      default: undefined,
      description: "Highlight color",
    },
    ground: groundControl(),
    ...sceneControls({ font: "Instrument Sans" }),
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
  durationInFrames: 200,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
