/**
 * Posts about remocn on X, shown on the landing "Loved by builders" wall.
 * Texts are trimmed to the part about remocn (leading @-replies and t.co
 * links removed); non-English posts are shown in translation.
 */
export type XPost = {
  name: string;
  /** X handle without the leading "@". Also the avatar file name. */
  handle: string;
  /** `/testimonials/<handle>.jpg` */
  avatar: string;
  /** Who they are, shown after the handle ("creator of Remotion"). */
  role?: string;
  /** ISO date (YYYY-MM-DD) the post was published. */
  date: string;
  text: string;
  url: string;
  likes?: number;
  views?: number;
  /** Original language when `text` is a translation, e.g. "Chinese". */
  translatedFrom?: string;
  /** The large first card on the wall. */
  featured?: boolean;
};

/** Every post on X that mentions remocn. */
export const X_SEARCH_URL = "https://x.com/search?q=remocn";

export const X_POSTS: XPost[] = [
  {
    name: "shadcn",
    handle: "shadcn",
    avatar: "/testimonials/shadcn.jpg",
    date: "2026-07-04",
    text: "Woah thank you for the incredible video @_remocn and @kapish_dima. Amazing project.",
    url: "https://x.com/shadcn/status/2073425845520150962",
    likes: 954,
    views: 103976,
    featured: true,
  },
  {
    name: "Bhoomika",
    handle: "bhoomikacodes",
    avatar: "/testimonials/bhoomikacodes.jpg",
    date: "2026-09-06",
    text: "they have a 2-step setup where you enter the prompt to llm and it sets up the whole thing. and that's it. setup done. this is SOOO accessible. such small product decisions can make a HUGE difference in adoption.",
    url: "https://x.com/bhoomikacodes/status/2096584954381582559",
    likes: 14,
    views: 1088,
  },
  {
    name: "Sadok",
    handle: "yesadok",
    avatar: "/testimonials/yesadok.jpg",
    date: "2026-10-01",
    text: "setting up a custom pipeline without dealing with after effects is huge",
    url: "https://x.com/yesadok/status/2105713523812909471",
    likes: 1,
    views: 397,
  },
  {
    name: "Hayden",
    handle: "haydenbleasel",
    avatar: "/testimonials/haydenbleasel.jpg",
    date: "2026-07-14",
    text: "i did indeed! remocn is fantastic",
    url: "https://x.com/haydenbleasel/status/2076891122459447495",
    likes: 3,
    views: 257,
  },
  {
    name: "Jonny Burger",
    handle: "JNYBGR",
    avatar: "/testimonials/JNYBGR.jpg",
    role: "creator of Remotion",
    date: "2026-08-27",
    text: 'I struggled a bit with the shimmer animation. Googled "remotion shimmer animation" and found this component by @_remocn! Love that the Remotion ecosystem is thriving also through the work of others 😍',
    url: "https://x.com/JNYBGR/status/2093053965055201298",
    likes: 5,
    views: 1890,
  },
  {
    name: "Ding",
    handle: "dingyi",
    avatar: "/testimonials/dingyi.jpg",
    date: "2026-08-06",
    text: "This component library is really handy. A video is basically a stack of animations, and this one lets an agent build product promo videos, with lots of great effects built in.",
    url: "https://x.com/dingyi/status/2085334350925890001",
    likes: 150,
    views: 32845,
    translatedFrom: "Chinese",
  },
  {
    name: "Marko Denic",
    handle: "denicmarko",
    avatar: "/testimonials/denicmarko.jpg",
    date: "2026-08-05",
    text: "Great tool Dima! I love it.",
    url: "https://x.com/denicmarko/status/2085019217665970582",
    likes: 3,
    views: 196,
  },
  {
    name: "Miles S.",
    handle: "milessy_bc",
    avatar: "/testimonials/milessy_bc.jpg",
    date: "2026-07-27",
    text: "editing video in code got way less painful",
    url: "https://x.com/milessy_bc/status/2081823913672085660",
    likes: 1,
    views: 22,
  },
  {
    name: "OrcDev",
    handle: "orcdev",
    avatar: "/testimonials/orcdev.jpg",
    date: "2026-08-14",
    text: "Remocn is one of my favorite projects. I'm already making all my new project introductions / demo videos with Remocn, and I've even started editing intros for my long form videos with it.",
    url: "https://x.com/orcdev/status/2088256522685972520",
    likes: 15,
    views: 2029,
  },
  {
    name: "David Haz",
    handle: "davidhaz",
    avatar: "/testimonials/davidhaz.jpg",
    role: "creator of React Bits",
    date: "2026-08-02",
    text: "Let’s go! The videos that will come out of this 🤌 Remocn takes it to the next level 🚀",
    url: "https://x.com/davidhaz/status/2084019572609368468",
    likes: 52,
    views: 6570,
  },
  {
    name: "code w/Guillaume",
    handle: "guillaume_rygn",
    avatar: "/testimonials/guillaume_rygn.jpg",
    date: "2026-09-09",
    text: "Found the shadcn of Remotion to ship a demo video without After Effects. Layout, type, UI blocks, transitions, every motion component is there and it's really clean! Let your agent do it, or direct it yourself!",
    url: "https://x.com/guillaume_rygn/status/2097581401755308460",
    likes: 349,
    views: 22165,
    translatedFrom: "French",
  },
  {
    name: "Bart",
    handle: "bzagrodzki",
    avatar: "/testimonials/bzagrodzki.jpg",
    date: "2026-10-07",
    text: "I just one-shotted launch video for my new product with remocn. btw, launching in 20 minutes 👀",
    url: "https://x.com/bzagrodzki/status/2107885759298675095",
    likes: 1,
    views: 33,
  },
];

/** Mobile spotlight: one pulled quote plus a row of the people behind it. */
export const X_SPOTLIGHT = {
  handle: "JNYBGR",
  quote:
    "Love that the Remotion ecosystem is thriving also through the work of others.",
  row: ["shadcn", "orcdev", "JNYBGR", "davidhaz", "dingyi"],
};

export function getXPost(handle: string): XPost {
  const post = X_POSTS.find((p) => p.handle === handle);
  if (!post) throw new Error(`Unknown X post handle: ${handle}`);
  return post;
}
