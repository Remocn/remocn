import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const springScaleInConfig: ComponentConfig = {
  componentName: "SpringScaleIn",
  importPath: "@/components/remocn/spring-scale-in",
  controls: {
    text: {
      type: "text-content",
      default: "Fast. Crisp. Fluid.",
      description: "Text",
    },
    staggerDelay: {
      type: "number",
      min: 1,
      max: 12,
      step: 1,
      default: 3,
      description: "Stagger",
      hiddenFromList: false,
    },
    scaleFrom: {
      type: "number",
      min: 0.1,
      max: 1,
      step: 0.05,
      default: 0.7,
      description: "Scale from",
      hiddenFromList: false,
    },
    fontSize: {
      type: "number",
      min: 12,
      max: 160,
      step: 1,
      default: 72,
      description: "Font size",
      hiddenFromList: false,
    },
    color: {
      type: "color",
      default: "#171717",
      description: "Color",
    },
    fontWeight: {
      type: "enum",
      default: "600",
      variants: {
        "400": {},
        "500": {},
        "600": {},
        "700": {},
      },
      description: "Font weight",
    },
  },
  durationInFrames: 60,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "#ffffff" },
};
