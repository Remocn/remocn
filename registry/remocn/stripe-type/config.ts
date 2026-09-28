import {
  type ComponentConfig,
  enumVariants,
  FPS,
  H,
  W,
} from "@/lib/customizer-config";
import { getStripeTypeDuration, type StripeTypeSettle } from ".";

function durationOf(values: Record<string, unknown>) {
  const numeric = (key: string) => {
    const value = values[key];
    return typeof value === "number" ? value : undefined;
  };
  return getStripeTypeDuration({
    stripes: numeric("stripes"),
    hold: numeric("hold"),
    speed: numeric("speed"),
    settle: values.settle as StripeTypeSettle | undefined,
    exit: values.exit !== false,
  });
}

export const stripeTypeConfig: ComponentConfig = {
  componentName: "StripeType",
  importPath: "@/components/remocn/stripe-type",
  controls: {
    text: { type: "text-content", default: "Launch", description: "Text" },
    color: { type: "color", default: "#fafafa", description: "Text color" },
    settle: {
      type: "enum",
      default: "striped",
      variants: enumVariants(["striped", "solid"]),
      description: "Settle",
    },
    fontSize: {
      type: "number",
      default: 180,
      min: 60,
      max: 320,
      step: 2,
      description: "Font size",
      hiddenFromList: false,
    },
    fontWeight: {
      type: "number",
      default: 800,
      min: 100,
      max: 900,
      step: 50,
      description: "Weight",
      hiddenFromList: false,
    },
    stripes: {
      type: "number",
      default: 8,
      min: 2,
      max: 16,
      step: 1,
      description: "Stripes",
      hiddenFromList: false,
    },
    gap: {
      type: "number",
      default: 0.35,
      min: 0,
      max: 0.8,
      step: 0.05,
      description: "Gap",
      hiddenFromList: false,
    },
    hold: {
      type: "number",
      default: 30,
      min: 0,
      max: 120,
      step: 5,
      description: "Hold",
      hiddenFromList: false,
    },
    exit: { type: "boolean", default: true, description: "Exit" },
  },
  durationInFrames: 100,
  getDurationInFrames: durationOf,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "#2b3bff" },
};
