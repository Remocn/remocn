import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";
import { getSearchRevealDuration } from ".";

export const searchRevealConfig: ComponentConfig = {
  componentName: "SearchReveal",
  importPath: "@/components/remocn/search-reveal",
  controls: {
    text: {
      type: "text-content",
      default: "remocn",
      description: "Search text",
    },
    fieldWidth: {
      type: "number",
      default: 464,
      min: 320,
      max: 640,
      step: 8,
      description: "Field width",
      hiddenFromList: false,
    },
    fontSize: {
      type: "number",
      default: 34,
      min: 18,
      max: 54,
      step: 1,
      description: "Font size",
      hiddenFromList: false,
    },
    framesPerCharacter: {
      type: "number",
      default: 4,
      min: 1,
      max: 12,
      step: 1,
      description: "Frames per character",
      hiddenFromList: false,
    },
    showPanel: { type: "boolean", default: true, description: "Graphic panel" },
    showGuides: {
      type: "boolean",
      default: true,
      description: "Construction guides",
    },
    color: {
      type: "color",
      default: "#26232b",
      description: "Text and markers",
    },
    fieldColor: {
      type: "color",
      default: "#ffffff",
      description: "Search field",
    },
    ringColor: {
      type: "color",
      default: "#cbc5cf",
      description: "Circles and search icon",
    },
    panelColor: {
      type: "color",
      default: "#a800b7",
      description: "Panel color",
    },
    accentColor: {
      type: "color",
      default: "#e8f99a",
      description: "Graphic accents",
    },
    backgroundColor: {
      type: "color",
      default: "#f5f1f5",
      description: "Background",
    },
    reducedMotion: {
      type: "boolean",
      default: false,
      description: "Static final pose",
    },
  },
  durationInFrames: 108,
  getDurationInFrames: (values) => getSearchRevealDuration(values),
  snippet: (values) =>
    `import { SearchReveal } from "@/components/remocn/search-reveal";\n\n<SearchReveal\n${Object.entries(
      values,
    )
      .map(([key, value]) => `  ${key}={${JSON.stringify(value)}}`)
      .join("\n")}\n/>`,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
