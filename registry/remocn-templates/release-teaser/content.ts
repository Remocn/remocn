export interface ReleaseTeaserTheme {
  background: string;
  surface: string;
  foreground: string;
  muted: string;
  accent: string;
}

export interface ReleaseTeaserProps {
  brandName?: string;
  release?: string;
  tagline?: string;
  statements?: string[];
  accentColor?: string;
  theme?: Partial<ReleaseTeaserTheme>;
  logoSrc?: string;
  lightIntensity?: number;
  reducedMotion?: boolean;
  audioSrc?: string;
  volume?: number;
}

export const releaseTeaserTheme: ReleaseTeaserTheme = {
  background: "#050709",
  surface: "#151C22",
  foreground: "#F2F5F7",
  muted: "#A4ADB5",
  accent: "#9BC8DD",
};

export const releaseTeaserStatements = [
  "Start with an idea",
  "Make room\nfor better work",
  "Bring every detail to life",
  "Move together.\nGo further.",
  "A fresh chapter.\nNo starting over.",
] as const;

const nonempty = (value: string | undefined, fallback: string) =>
  value?.trim() || fallback;

export function resolveReleaseTeaserProps(props: ReleaseTeaserProps = {}) {
  return {
    brandName: nonempty(props.brandName, "Orvio"),
    // An explicit empty release intentionally hides the version suffix.
    release: props.release === undefined ? "2" : props.release.trim(),
    tagline: nonempty(props.tagline, "Your next chapter starts here."),
    statements: releaseTeaserStatements.map((fallback, i) =>
      nonempty(props.statements?.[i], fallback),
    ),
    theme: {
      background: nonempty(
        props.theme?.background,
        releaseTeaserTheme.background,
      ),
      surface: nonempty(props.theme?.surface, releaseTeaserTheme.surface),
      foreground: nonempty(
        props.theme?.foreground,
        releaseTeaserTheme.foreground,
      ),
      muted: nonempty(props.theme?.muted, releaseTeaserTheme.muted),
      accent: nonempty(
        props.accentColor,
        nonempty(props.theme?.accent, releaseTeaserTheme.accent),
      ),
    },
    logoSrc: props.logoSrc?.trim() || undefined,
    lightIntensity: Number.isFinite(props.lightIntensity)
      ? Math.max(0, Math.min(2, props.lightIntensity ?? 1))
      : 1,
    reducedMotion: props.reducedMotion ?? false,
  };
}

export type ReleaseTeaserScene = ReturnType<typeof resolveReleaseTeaserProps>;
