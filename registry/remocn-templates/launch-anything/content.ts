import { launchMedia } from "./assets";
import type { ShowcaseId } from "./motion";

export const launchContent = {
  opening: "Your",
  subject: "product",
  ready: "is ready",
  next: "Now let’s",
  action: "Launch it",
  proof: "Trusted by Brands &\nEnterprises",
  industry: "Any industry",
  promise: "We Launch it all.",
  launch: "Launch",
  shoppers: "your shoppers do",
  builder: "2. Build Data apps",
  builderPrompt: "Build an ecommerce insights dashboard",
  trading: "Place Orders\nInstantly",
  loyalty: "every loyalty program",
  loyaltyPayoff: "isn’t bleeding money",
  integration: "Integrate your app with",
  integrations: ["Slack", "Amplitude", "Hubspot"],
};

export type LaunchContent = typeof launchContent;
export type LaunchMedia = typeof launchMedia;

export type LaunchAnythingProps = {
  /** Closing address. Preserved from the reference by default. */
  brandUrl?: string;
  accentColor?: string;
  opening?: string;
  subject?: string;
  content?: Partial<LaunchContent>;
  media?: Partial<LaunchMedia>;
  /** Optional custom screen images, cropped to the laptop display. */
  screenImages?: Partial<Record<ShowcaseId, string>>;
  /** Custom brand marks for the floating proof grid. */
  logos?: string[];
  logoSrc?: string;
  audioSrc?: string;
  volume?: number;
};

export function resolveLaunchProps(props: LaunchAnythingProps) {
  const integrations = props.content?.integrations?.filter((name) =>
    name.trim(),
  );
  return {
    brandUrl: props.brandUrl ?? "Launchanything.now",
    accent: props.accentColor ?? "#3730ed",
    content: {
      ...launchContent,
      ...props.content,
      ...(props.opening === undefined ? {} : { opening: props.opening }),
      ...(props.subject === undefined ? {} : { subject: props.subject }),
      integrations: integrations?.length
        ? integrations
        : launchContent.integrations,
    },
    media: { ...launchMedia, ...props.media },
    screenImages: props.screenImages ?? {},
    logos: props.logos?.filter((src) => src.trim()) ?? [],
    logoSrc: props.logoSrc,
  };
}

export type LaunchScene = ReturnType<typeof resolveLaunchProps>;
export type SceneProps = { scene: LaunchScene; t: number };
