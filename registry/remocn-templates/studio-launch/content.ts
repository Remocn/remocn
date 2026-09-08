import { studioMedia } from "./assets";

export interface StudioContent {
  introduction: string;
  feedTitle: string;
  community: string;
  author: string;
  postTeaser: string;
  postTitle: string;
  gateHeadline: string;
  hostHeadline: string;
  sellHeadline: string;
  unlockLabel: string;
  courseTitles: string[];
}
export const studioContent: StudioContent = {
  introduction: "Introducing",
  feedTitle: "Studios feed",
  community: "Pathway Coaching",
  author: "Jeremy Miner",
  postTeaser: "57 Minutes of sales training that will explode...",
  postTitle: "The objection-handling script that closed $42k last month",
  gateHeadline: "Gate your best content.",
  hostHeadline: "Host",
  sellHeadline: "Sell inside your community",
  unlockLabel: "Unlock for $19.00",
  courseTitles: [
    "The 90-Day Content Engine",
    "Find Your Niche & Angle",
    "The Pathway Method",
    "Hooks That Stop the Scroll",
    "The Authority Bio System",
    "Monetize Your First 1,000 Followers",
  ],
};
export interface StudioMedia {
  landscape: string;
  post: string;
  courses: string[];
}
export interface StudioLaunchProps {
  brandName?: string;
  logoSrc?: string;
  accentColor?: string;
  content?: Partial<StudioContent>;
  media?: Partial<StudioMedia>;
  audioSrc?: string;
  volume?: number;
}
export interface SceneProps {
  t: number;
  brandName: string;
  logoSrc?: string;
  accent: string;
  content: StudioContent;
  media: StudioMedia;
}
export function resolveStudioProps(
  props: StudioLaunchProps,
  t: number,
): SceneProps {
  return {
    t,
    brandName: props.brandName?.trim() || "remocn",
    logoSrc: props.logoSrc,
    accent: props.accentColor || "#81bfff",
    content: {
      ...studioContent,
      ...props.content,
      courseTitles: studioContent.courseTitles.map(
        (title, i) => props.content?.courseTitles?.[i] || title,
      ),
    },
    media: {
      ...studioMedia,
      ...props.media,
      courses: studioMedia.courses.map(
        (src, i) => props.media?.courses?.[i] || src,
      ),
    },
  };
}
