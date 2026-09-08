/** Edit these defaults, pass props, or replace individual scene components. */
export const introducingContent = {
  productName: "remocn",
  website: "remocn.dev",
  hook: "You built the product.",
  hookPayoff: "Now make it move.",
  tagline: "Video components. Yours to build with.",
  installCommand: "npx shadcn@latest add @remocn/word-push",
  installLabel: "One command. All yours.",
  galleryTitle: "Start with great motion.",
  editTitle: "Make it yours.",
  initialText: "Make it move.",
  editedText: "Make it yours.",
  timelineTitle: "Put it together.",
  showcaseTitle: "Built to move.",
  showcaseWords: ["Create.", "Compose.", "Ship."],
  ownershipTitle: "Your video. Your source.",
  ownershipDetail: "Copy the components. Keep the code.",
  closingLine: "Make your next launch move.",
  featureLabels: ["Typography", "Motion", "Transitions", "Interactions"],
};

export type IntroducingContent = typeof introducingContent;

export const introducingTheme = {
  ink: "#141318",
  paper: "#F5F3EE",
  accent: "#D4B3FF",
  peach: "#FFB38E",
  mint: "#A1EEBD",
  muted: "#96939F",
};
export type IntroducingTheme = typeof introducingTheme;

export interface IntroducingProductProps {
  productName?: string;
  website?: string;
  accentColor?: string;
  /** Empty uses the remocn mark for remocn; other names get an initial mark. */
  logoSrc?: string;
  content?: Partial<IntroducingContent>;
  theme?: Partial<IntroducingTheme>;
  /** Original generated score is on by default. Set false for a silent render. */
  sound?: boolean;
  /** Optional replacement audio URL or staticFile(...) path. */
  audioSrc?: string;
  volume?: number;
}

export interface SceneProps {
  content: IntroducingContent;
  theme: IntroducingTheme;
  logoSrc?: string;
}

export function resolveIntroducingProps(
  props: IntroducingProductProps,
): SceneProps {
  const content = { ...introducingContent };
  for (const key of Object.keys(
    introducingContent,
  ) as (keyof IntroducingContent)[]) {
    const value = props.content?.[key];
    if (typeof value === "string" && value.trim()) {
      Object.assign(content, { [key]: value.trim() });
    }
  }
  for (const key of ["featureLabels", "showcaseWords"] as const) {
    content[key] = introducingContent[key].map((fallback, i) => {
      const value = props.content?.[key]?.[i];
      return typeof value === "string" && value.trim()
        ? value.trim()
        : fallback;
    });
  }
  if (props.productName?.trim()) content.productName = props.productName.trim();
  if (props.website?.trim()) content.website = props.website.trim();
  const theme = { ...introducingTheme };
  for (const key of Object.keys(theme) as (keyof IntroducingTheme)[]) {
    const value = props.theme?.[key];
    // Hex tokens also support predictable alpha suffixes in the scene source.
    if (typeof value === "string" && /^#[\da-f]{6}$/i.test(value))
      theme[key] = value;
  }
  if (props.accentColor && /^#[\da-f]{6}$/i.test(props.accentColor))
    theme.accent = props.accentColor;
  return { content, theme, logoSrc: props.logoSrc?.trim() || undefined };
}
