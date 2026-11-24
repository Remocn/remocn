import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The heading, the camera settling, each plan card rising in, then the
// featured card's beat: lift, strike, the new price rolling in, the CTA
// press and fill, the badge. Frames on the 30 fps scene timeline, after
// `delay` and `speed`. The ids are public: a saved `timing` prop refers to
// them.

export type PricingRevealElementId =
  | "head"
  | "camera"
  | `card:${number}`
  | "lift"
  | "strike"
  | "roll"
  | "press"
  | "fill"
  | "tag";

export interface PricingPlan {
  name: string;
  price: number | string;
  /** Previous price, struck through and replaced by `price` on the featured plan. */
  was?: number | string;
  period: string;
  description: string;
  features: string[];
  cta: string;
  featured?: boolean;
}

export interface PricingRevealTimingProps {
  plans?: PricingPlan[];
  stagger?: number;
}

export const DEFAULT_PLANS: PricingPlan[] = [
  {
    name: "Starter",
    price: 0,
    period: "/mo",
    description: "For side projects and your first launch video.",
    features: [
      "40 core components",
      "1080p renders",
      "Community templates",
      "MIT licensed source",
      "Discord support",
    ],
    cta: "Get started",
  },
  {
    name: "Pro",
    price: 29,
    was: 45,
    period: "/mo",
    description: "For solo builders shipping a launch every month.",
    features: [
      "Everything in Starter",
      "All 128 components",
      "4K renders, no watermark",
      "Premium launch templates",
      "Priority support",
    ],
    cta: "Start free trial",
    featured: true,
  },
  {
    name: "Team",
    price: 79,
    period: "/mo",
    description: "For small teams reviewing cuts together.",
    features: [
      "Everything in Pro",
      "Up to 5 seats",
      "Shared brand tokens",
      "Review links with comments",
      "Invoice billing",
    ],
    cta: "Talk to sales",
  },
];

const HEAD = 0;
const CARDS = 6;
const STAGGER = 3;
const FEATURES = 16;
const LIFT = 30;
const STRIKE = 36;
const ROLL = 42;
const PRESS = 58;
const FILL = 61;
const TAG = 66;

// `head` fades the heading in; the eyebrow follows from `metaAt` over `meta`.
// `camera` settles the push-in. `card:<i>` brings plan `i` in (a chain, the
// fade over its length); its features rise from `featuresAt`, `feature`
// apart. The featured card then lifts (`lift`, the others recede), strikes
// the old price (`strike`), rolls the new one in (`roll`: the row fades in
// from `fadeAt` over `fade`, the digits roll from `digitsAt`, `digit` apart,
// each over `digitRoll`), presses the CTA (`press`, released after
// `release`), fills it (`fill`) and pops the badge (`tag`). Each follows the
// one before; the lift keeps its own frame whatever the cards do.
export const pricingRevealTimeline = defineTimeline<
  PricingRevealElementId,
  PricingRevealTimingProps
>(({ plans = DEFAULT_PLANS, stagger = STAGGER }) => {
  const elements: TimelineElement<PricingRevealElementId>[] = [
    {
      id: "head",
      lane: "Heading",
      label: "Heading",
      start: HEAD,
      length: 16,
      beats: { metaAt: 6, meta: 14 },
    },
    { id: "camera", lane: "Camera", label: "Camera", start: 0, length: 100 },
  ];
  plans.forEach((plan, i) => {
    elements.push({
      id: `card:${i}`,
      lane: "Cards",
      label: plan.name,
      start: CARDS + i * stagger,
      length: 10,
      follows: i > 0 ? `card:${i - 1}` : undefined,
      beats: { featuresAt: FEATURES - CARDS, feature: 2 },
    });
  });
  elements.push(
    {
      id: "lift",
      lane: "Featured",
      label: "Lift",
      start: LIFT,
      length: STRIKE - LIFT,
    },
    {
      id: "strike",
      lane: "Featured",
      label: "Strike",
      start: STRIKE,
      length: 9,
      follows: "lift",
    },
    {
      id: "roll",
      lane: "Featured",
      label: "New price",
      start: ROLL,
      length: PRESS - ROLL,
      follows: "strike",
      beats: { fadeAt: 1, fade: 4, digitsAt: 2, digit: 2, digitRoll: 14 },
    },
    {
      id: "press",
      lane: "Featured",
      label: "Press",
      start: PRESS,
      length: FILL - PRESS,
      follows: "roll",
      beats: { release: 4 },
    },
    {
      id: "fill",
      lane: "Featured",
      label: "Fill",
      start: FILL,
      length: 8,
      follows: "press",
    },
    {
      id: "tag",
      lane: "Featured",
      label: "Badge",
      start: TAG,
      length: 12,
      follows: "fill",
    },
  );
  return elements
    .map((e, k) => ({ e, k }))
    .sort((a, b) => a.e.start - b.e.start || a.k - b.k)
    .map(({ e }) => e);
});
