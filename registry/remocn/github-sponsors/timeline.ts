import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The heart drawing itself and pulsing, docking up into the header, the
// sponsors' avatars blurring in one after another, then the thank-you, the
// sponsor count and the call to action. Frames on the 30 fps scene
// timeline, after `speed`. The ids are public: a saved `timing` prop refers
// to them.

export type GitHubSponsorsElementId =
  | "heart"
  | "dock"
  | `avatar:${number}`
  | "thanks"
  | "count"
  | "cta";

export interface SponsorEntry {
  login: string;
  avatarUrl: string;
}

export interface GitHubSponsorsTimingProps {
  sponsors?: readonly SponsorEntry[];
}

export const DEFAULT_SPONSORS: SponsorEntry[] = [
  {
    login: "mojombo",
    avatarUrl: "https://avatars.githubusercontent.com/u/1?v=4",
  },
  {
    login: "defunkt",
    avatarUrl: "https://avatars.githubusercontent.com/u/2?v=4",
  },
  {
    login: "pjhyett",
    avatarUrl: "https://avatars.githubusercontent.com/u/3?v=4",
  },
  {
    login: "wycats",
    avatarUrl: "https://avatars.githubusercontent.com/u/4?v=4",
  },
  {
    login: "schacon",
    avatarUrl: "https://avatars.githubusercontent.com/u/70?v=4",
  },
  {
    login: "rtomayko",
    avatarUrl: "https://avatars.githubusercontent.com/u/5?v=4",
  },
  {
    login: "bmizerany",
    avatarUrl: "https://avatars.githubusercontent.com/u/6?v=4",
  },
  {
    login: "atmos",
    avatarUrl: "https://avatars.githubusercontent.com/u/38?v=4",
  },
  {
    login: "ezmobius",
    avatarUrl: "https://avatars.githubusercontent.com/u/14?v=4",
  },
  {
    login: "macournoyer",
    avatarUrl: "https://avatars.githubusercontent.com/u/15?v=4",
  },
  {
    login: "ivey",
    avatarUrl: "https://avatars.githubusercontent.com/u/18?v=4",
  },
  {
    login: "uggedal",
    avatarUrl: "https://avatars.githubusercontent.com/u/16?v=4",
  },
  {
    login: "anotherjesse",
    avatarUrl: "https://avatars.githubusercontent.com/u/9?v=4",
  },
  {
    login: "technoweenie",
    avatarUrl: "https://avatars.githubusercontent.com/u/21?v=4",
  },
  {
    login: "takeo",
    avatarUrl: "https://avatars.githubusercontent.com/u/22?v=4",
  },
  {
    login: "evanphx",
    avatarUrl: "https://avatars.githubusercontent.com/u/25?v=4",
  },
  {
    login: "vanpelt",
    avatarUrl: "https://avatars.githubusercontent.com/u/26?v=4",
  },
  {
    login: "wayneeseguin",
    avatarUrl: "https://avatars.githubusercontent.com/u/28?v=4",
  },
  {
    login: "brynary",
    avatarUrl: "https://avatars.githubusercontent.com/u/30?v=4",
  },
  {
    login: "kevinclark",
    avatarUrl: "https://avatars.githubusercontent.com/u/31?v=4",
  },
  {
    login: "kballard",
    avatarUrl: "https://avatars.githubusercontent.com/u/7?v=4",
  },
  {
    login: "jnewland",
    avatarUrl: "https://avatars.githubusercontent.com/u/12?v=4",
  },
  {
    login: "caged",
    avatarUrl: "https://avatars.githubusercontent.com/u/13?v=4",
  },
  { login: "sr", avatarUrl: "https://avatars.githubusercontent.com/u/19?v=4" },
];

const DRAW_END = 40;
const PULSE_END = 62;
const HEART_DOCK_START = 52;
const HEART_DOCK_END = 84;
const AVATAR_START = 70;
const AVATAR_STEP = 3;
const AVATAR_DUR = 22;
/** The avatars all start within this many frames, however many there are. */
const AVATAR_WINDOW = 56;
const THANK_START = 150;
const SUB_START = 166;
const CTA_START = 182;
const CTA_DUR = 22;

// `heart` draws its outline; its fill fades in from `fillAt` to `fillEnd`
// and it pulses through `pulseAt`, `squeeze`, `bounce` and `pulseEnd`.
// `dock` carries it up into the header. `avatar:<i>` is sponsor `i`; the list
// is a chain. `thanks` and `count` start the thank-you line and the sponsor
// count; `cta` brings in the button and, `account` later, the account link.
export const gitHubSponsorsTimeline = defineTimeline<
  GitHubSponsorsElementId,
  GitHubSponsorsTimingProps
>(({ sponsors = DEFAULT_SPONSORS }) => {
  const count = sponsors.length;
  const avatarStep =
    count > 1 ? Math.min(AVATAR_STEP, AVATAR_WINDOW / (count - 1)) : 0;
  const elements: TimelineElement<GitHubSponsorsElementId>[] = [
    {
      id: "heart",
      lane: "Heart",
      label: "heart",
      start: 0,
      length: DRAW_END,
      beats: {
        fillAt: DRAW_END - 8,
        fillEnd: PULSE_END,
        pulseAt: DRAW_END - 2,
        squeeze: DRAW_END + 6,
        bounce: DRAW_END + 17,
        pulseEnd: PULSE_END,
      },
    },
    {
      id: "dock",
      lane: "Heart",
      label: "dock",
      start: HEART_DOCK_START,
      length: HEART_DOCK_END - HEART_DOCK_START,
      follows: "heart",
    },
  ];
  sponsors.forEach((sponsor, i) => {
    elements.push({
      id: `avatar:${i}`,
      lane: "Avatars",
      label: sponsor.login,
      start: AVATAR_START + i * avatarStep,
      length: AVATAR_DUR,
      follows: i > 0 ? `avatar:${i - 1}` : "heart",
    });
  });
  elements.push(
    {
      id: "thanks",
      lane: "Copy",
      label: "Thank you",
      start: THANK_START,
      length: SUB_START - THANK_START,
      follows: count > 0 ? `avatar:${count - 1}` : "dock",
    },
    {
      id: "count",
      lane: "Copy",
      label: "sponsor count",
      start: SUB_START,
      length: CTA_START - SUB_START,
      follows: "thanks",
    },
    {
      id: "cta",
      lane: "Copy",
      label: "Become a sponsor",
      start: CTA_START,
      length: CTA_DUR,
      follows: "count",
      beats: { account: 8 },
    },
  );
  return elements;
});
