import {
  DEFAULT_INTRODUCING_PRODUCT_PROPS,
  type IntroducingProductStudioProps,
  introducingProductSchema,
} from "./schema";

export type ProductFeature =
  IntroducingProductStudioProps["content"]["featureCards"][number];
export type EasingPreset =
  IntroducingProductStudioProps["scenes"]["hook"]["easing"];
export type IntroducingProductTimeline = Omit<
  IntroducingProductStudioProps["timeline"],
  "speed"
>;

export type DeepPartial<T> = T extends readonly unknown[]
  ? T
  : T extends object
    ? { [K in keyof T]?: DeepPartial<T[K]> }
    : T;

interface LegacyIntroducingProductProps {
  productName?: string;
  tagline?: string;
  hookLine?: string;
  contrastLine?: string;
  command?: string;
  benefit?: string;
  metric?: string;
  featureCards?: ProductFeature[];
  topics?: string[];
  accentColor?: string;
  warmColor?: string;
  logoUrl?: string;
  screenshotUrls?: string[];
  speed?: number;
  className?: string;
}

export type IntroducingProductProps =
  DeepPartial<IntroducingProductStudioProps> & LegacyIntroducingProductProps;

export type NormalizedIntroducingProductProps = IntroducingProductStudioProps;

export interface IntroducingProductSceneProps
  extends IntroducingProductStudioProps {
  sceneDuration: number;
}

export const INTRODUCING_PRODUCT_TIMELINE: IntroducingProductTimeline = {
  hook: DEFAULT_INTRODUCING_PRODUCT_PROPS.timeline.hook,
  command: DEFAULT_INTRODUCING_PRODUCT_PROPS.timeline.command,
  brand: DEFAULT_INTRODUCING_PRODUCT_PROPS.timeline.brand,
  productUi: DEFAULT_INTRODUCING_PRODUCT_PROPS.timeline.productUi,
  speedScene: DEFAULT_INTRODUCING_PRODUCT_PROPS.timeline.speedScene,
  features: DEFAULT_INTRODUCING_PRODUCT_PROPS.timeline.features,
  montage: DEFAULT_INTRODUCING_PRODUCT_PROPS.timeline.montage,
  learningLoop: DEFAULT_INTRODUCING_PRODUCT_PROPS.timeline.learningLoop,
  topics: DEFAULT_INTRODUCING_PRODUCT_PROPS.timeline.topics,
  outro: DEFAULT_INTRODUCING_PRODUCT_PROPS.timeline.outro,
};

export type IntroducingProductScene = keyof IntroducingProductTimeline;

const INTRODUCING_PRODUCT_SCENES: IntroducingProductScene[] = [
  "hook",
  "command",
  "brand",
  "productUi",
  "speedScene",
  "features",
  "montage",
  "learningLoop",
  "topics",
  "outro",
];

export function getIntroducingProductDuration(
  timeline:
    | IntroducingProductTimeline
    | IntroducingProductStudioProps["timeline"] = INTRODUCING_PRODUCT_TIMELINE,
): number {
  return INTRODUCING_PRODUCT_SCENES.reduce(
    (sum, scene) => sum + Math.max(1, Math.round(timeline[scene])),
    0,
  );
}

export const INTRODUCING_PRODUCT_DURATION = getIntroducingProductDuration();

export function getIntroducingProductSceneStart(
  scene: IntroducingProductScene,
  timeline: IntroducingProductTimeline = INTRODUCING_PRODUCT_TIMELINE,
): number {
  let start = 0;
  for (const name of INTRODUCING_PRODUCT_SCENES) {
    if (name === scene) return start;
    start += timeline[name];
  }
  return start;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function mergeDeep<T>(base: T, override: DeepPartial<T> | undefined): T {
  if (!isRecord(base) || !isRecord(override)) {
    return (override === undefined ? base : override) as T;
  }

  const result: Record<string, unknown> = { ...base };
  for (const [key, value] of Object.entries(override)) {
    if (value === undefined) continue;
    const current = result[key];
    result[key] =
      isRecord(current) && isRecord(value) ? mergeDeep(current, value) : value;
  }
  return result as T;
}

export function normalizeIntroducingProductProps(
  props: IntroducingProductProps = {},
): NormalizedIntroducingProductProps {
  const merged = mergeDeep(DEFAULT_INTRODUCING_PRODUCT_PROPS, props);
  const legacyContent = {
    productName: props.productName,
    tagline: props.tagline,
    hookLine: props.hookLine,
    contrastLine: props.contrastLine,
    command: props.command,
    benefit: props.benefit,
    metric: props.metric,
    featureCards: props.featureCards,
    topics: props.topics,
    logoUrl: props.logoUrl,
    screenshotUrls: props.screenshotUrls,
  };

  for (const [key, value] of Object.entries(legacyContent)) {
    if (value !== undefined) {
      (merged.content as Record<string, unknown>)[key] = value;
    }
  }
  if (props.accentColor !== undefined) {
    merged.theme.accentColor = props.accentColor;
  }
  if (props.warmColor !== undefined) {
    merged.theme.warmColor = props.warmColor;
  }
  if (props.speed !== undefined) merged.timeline.speed = props.speed;
  if (props.className !== undefined) merged.className = props.className;

  return introducingProductSchema.parse(merged);
}
