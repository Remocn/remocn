export type SponsorTier = "legendary" | "featured" | "partner" | "builder";

const TIER_RANK: Record<SponsorTier, number> = {
  legendary: 0,
  featured: 1,
  partner: 2,
  builder: 3,
};

export type SponsorPlacement = "landing" | "docs";

const TIER_PLACEMENTS: Record<SponsorTier, SponsorPlacement[]> = {
  legendary: ["landing", "docs"],
  featured: ["landing", "docs"],
  partner: [],
  builder: [],
};

export type Sponsor = {
  id: string;
  name: string;
  /** Optional visible label rendered under the logo. Skipped when absent. */
  displayName?: string;
  logoUrl: string;
  website: string;
  tier: SponsorTier;
  /** Default 1. Manually tweak to fix logos that look too small or too big. */
  logoScale?: number;
  /** Optional Tailwind classes for fine-tuning a specific logo. */
  customStyles?: string;
  isPaste?: boolean; // Whether this sponsor is from our Paste integration. Used to add a "via Paste" badge on the frontend.
  placements?: SponsorPlacement[];
  layout?: "row" | "col";
  /** Past sponsors move to the wall of love and drop out of tiers and placements. */
  isFormer?: boolean;
};

export const sponsors: Sponsor[] = (
  [
    {
      id: "neon",
      name: "Neon",
      logoUrl: "/sponsors/neon.svg",
      website:
        "https://neon.com/?utm_source=remocn&utm_medium=sponsor&utm_campaign=remocn_sponsors_page",
      tier: "legendary",
      customStyles: "opacity-90 max-w-full",
      isPaste: false,
    },
    {
      id: "launchfast",
      name: "LaunchFast",
      displayName: "LaunchFast",
      logoUrl: "/sponsors/launchfast.png",
      website:
        "https://www.launchfa.st/?utm_source=remocn&utm_medium=sponsor&utm_campaign=remocn_sponsors_page",
      tier: "featured",
      customStyles: "opacity-100 grayscale-0 dark:[filter:invert(1)]",
      isPaste: false,
      layout: "row",
    },
    {
      id: "aceternity",
      name: "Aceternity UI",
      displayName: "Aceternity UI",
      logoUrl: "/sponsors/aceternity.svg",
      website:
        "https://ui.aceternity.com/?utm_source=remocn&utm_medium=sponsor&utm_campaign=remocn_sponsors_page",
      tier: "featured",
      customStyles: "opacity-90",
      isPaste: false,
      layout: "row",
    },
    {
      id: "21st",
      name: "21st.dev",
      logoUrl: "/sponsors/21st.svg",
      website:
        "https://21st.dev/?utm_source=remocn&utm_medium=sponsor&utm_campaign=remocn_sponsors_page",
      tier: "partner",
      customStyles: "opacity-90 max-w-full",
      isPaste: false,
      placements: ["landing", "docs"],
    },
    {
      id: "reactbits",
      name: "React Bits",
      logoUrl: "/sponsors/reactbits.svg",
      website:
        "https://pro.reactbits.dev/?utm_source=remocn&utm_medium=sponsor&utm_campaign=remocn_sponsors_page",
      tier: "partner",
      customStyles: "opacity-90 max-w-full",
      isPaste: false,
      placements: ["landing", "docs"],
    },
    {
      id: "reui",
      name: "ReUI",
      logoUrl: "/sponsors/reui.svg",
      website:
        "https://reui.io/?utm_source=remocn&utm_medium=sponsor&utm_campaign=remocn_sponsors_page",
      tier: "partner",
      customStyles: "opacity-90 max-w-full",
      isPaste: false,
      placements: ["landing", "docs"],
    },
    {
      id: "shadcnblocks",
      name: "Shadcnblocks.com",
      logoUrl: "/sponsors/shadcnblocks.svg",
      website:
        "https://shadcnblocks.com/?utm_source=remocn&utm_medium=sponsor&utm_campaign=remocn_sponsors_page",
      tier: "partner",
      logoScale: 1.2,
      customStyles: "opacity-90",
      isPaste: false,
      placements: ["landing", "docs"],
    },
    {
      id: "shieldcn",
      name: "shieldcn",
      displayName: "shieldcn",
      logoUrl: "/sponsors/shieldcn.svg",
      website:
        "https://shieldcn.dev/?utm_source=remocn&utm_medium=sponsor&utm_campaign=remocn_sponsors_page",
      tier: "partner",
      customStyles: "opacity-90",
      isPaste: false,
      layout: "row",
      isFormer: true,
    },
    // Paste:
    {
      id: "efferd",
      name: "Efferd",
      logoUrl: "/sponsors/efferd.svg",
      website:
        "https://efferd.com/?utm_source=remocn&utm_medium=sponsor&utm_campaign=remocn_sponsors_page",
      tier: "partner",
      logoScale: 1.2,
      customStyles: "opacity-90",
      isPaste: true,
    },
    {
      id: "shadcnstudio",
      name: "ShadcnStudio",
      logoUrl:
        "https://cdn.shadcnstudio.com/ss-assets/marketing/shadcn-studio-logos/shadcn-studio-light-full-logo.png",
      website:
        "https://shadcnstudio.com/?utm_source=remocn&utm_medium=sponsor&utm_campaign=remocn_sponsors_page",
      tier: "builder",
      logoScale: 1.2,
      customStyles: "invert opacity-90 h-8",
      isPaste: true,
    },
    {
      id: "shadcnspace",
      name: "ShadcnSpace",
      logoUrl: "https://shadcnspace.com/images/logo/shadcnspace.svg",
      website:
        "https://shadcnspace.com/?utm_source=remocn&utm_medium=sponsor&utm_campaign=remocn_sponsors_page",
      tier: "builder",
      logoScale: 1.2,
      customStyles: "grayscale invert opacity-90 h-8",
      isPaste: true,
    },
    {
      id: "ln",
      name: "ln",
      displayName: "LN",
      logoUrl: "/sponsors/ln.jpg",
      website:
        "https://pro.lndevui.com/?utm_source=remocn&utm_medium=sponsor&utm_campaign=remocn_sponsors_page",
      tier: "builder",
      customStyles:
        "rounded-full opacity-100 grayscale-0 dark:[filter:none] outline-1 -outline-offset-1 outline-black/10 dark:outline-white/10",
      isPaste: false,
      isFormer: true,
    },
    {
      id: "justin",
      name: "Justin",
      displayName: "Justin",
      logoUrl: "/sponsors/justin.jpg",
      website:
        "https://shieldcn.dev/?utm_source=remocn&utm_medium=sponsor&utm_campaign=remocn_sponsors_page",
      tier: "builder",
      customStyles:
        "rounded-full opacity-100 grayscale-0 dark:[filter:none] outline-1 -outline-offset-1 outline-black/10 dark:outline-white/10",
      isPaste: false,
      isFormer: true,
    },
    {
      id: "orcdev",
      name: "OrcDev",
      displayName: "OrcDev",
      logoUrl: "/sponsors/orcdev.jpg",
      website:
        "https://www.8bitcn.com/?utm_source=remocn&utm_medium=sponsor&utm_campaign=remocn_sponsors_page",
      tier: "builder",
      customStyles:
        "rounded-full opacity-100 grayscale-0 dark:[filter:none] outline-1 -outline-offset-1 outline-black/10 dark:outline-white/10",
      isPaste: false,
    },
    {
      id: "canadian-ai",
      name: "Canadian AI",
      displayName: "Canadian AI",
      logoUrl: "/sponsors/canadian-ai.svg",
      website:
        "https://www.canadian-ai.ca/?utm_source=remocn&utm_medium=sponsor&utm_campaign=remocn_sponsors_page",
      tier: "partner",
      customStyles: "opacity-90",
      isPaste: false,
      layout: "row",
      isFormer: true,
    },
    {
      id: "shadcnuikit",
      name: "Shadcn UI Kit",
      displayName: "Shadcn UI Kit",
      logoUrl: "/sponsors/shadcnuikit.png",
      website:
        "https://shadcnuikit.com/?utm_source=remocn&utm_medium=sponsor&utm_campaign=remocn_sponsors_page",
      tier: "partner",
      logoScale: 1,
      customStyles: "rounded-sm opacity-100 grayscale-0 dark:[filter:none]",
      isPaste: false,
      placements: ["landing", "docs"],
      layout: "row",
    },
    {
      id: "reactvideoeditor",
      name: "React Video Editor",
      logoUrl: "/sponsors/reactvideoeditor.svg",
      website:
        "https://reactvideoeditor.com/?utm_source=remocn&utm_medium=sponsor&utm_campaign=remocn_sponsors_page",
      tier: "partner",
      logoScale: 0.85,
      customStyles: "opacity-90 max-w-full",
      isPaste: false,
    },
  ] satisfies Sponsor[]
).filter((sponsor) => !sponsor.isPaste);

export const activeSponsors: Sponsor[] = sponsors.filter(
  (sponsor) => !sponsor.isFormer,
);

export const formerSponsors: Sponsor[] = sponsors.filter(
  (sponsor) => sponsor.isFormer,
);

function getSponsorsFor(placement: SponsorPlacement): Sponsor[] {
  return activeSponsors
    .filter((sponsor) =>
      (sponsor.placements ?? TIER_PLACEMENTS[sponsor.tier]).includes(placement),
    )
    .sort((a, b) => TIER_RANK[a.tier] - TIER_RANK[b.tier]);
}

export function getLandingSponsors(): Sponsor[] {
  return getSponsorsFor("landing");
}

export function getDocsSponsors(): Sponsor[] {
  return getSponsorsFor("docs");
}

export type BillingMode = "monthly" | "one-time";

export type Tier = {
  id: "builder" | "partner" | "featured";
  price: number;
  name: string;
  tagline: string;
  perks: string[];
  highlighted: boolean;
  badge?: string;
  monthlyUrl: string;
  oneTimeUrl: string;
};

export const tiers: Tier[] = [
  {
    id: "builder",
    price: 10,
    name: "Builder",
    tagline: "Start here",
    perks: [
      "Sponsor badge in our Discord",
      "Your name in the repository README",
      "Early access to release notes",
    ],
    highlighted: false,
    monthlyUrl: "https://www.creem.io/payment/prod_6fpKhXCzk9KkbA4FSUzGIU",
    oneTimeUrl: "https://www.creem.io/payment/prod_1C3cCbVoYsDPJrdlDhrhSG",
  },
  {
    id: "partner",
    price: 50,
    name: "Partner",
    tagline: "Power the project",
    perks: [
      "Everything in Builder",
      "Your logo on the Sponsors page",
      "Priority on feature requests",
      "Direct line to the maintainers",
    ],
    highlighted: false,
    monthlyUrl: "https://www.creem.io/payment/prod_6tdCLqKgSA14P0IEVZ2GaG",
    oneTimeUrl: "https://www.creem.io/payment/prod_2sb9zG2oJn232utqh5TN1S",
  },
  {
    id: "featured",
    price: 100,
    name: "Featured",
    tagline: "Own the top spot",
    perks: [
      "Everything in Partner",
      "Your logo on the remocn landing page",
      "Your logo in the docs sidebar",
    ],
    highlighted: true,
    badge: "Front page",
    monthlyUrl: "https://www.creem.io/payment/prod_1PtwNGZVHfXZgChBSCwmJA",
    oneTimeUrl: "https://www.creem.io/payment/prod_66n8fHDfCVmwSNswCHL5OH",
  },
];
