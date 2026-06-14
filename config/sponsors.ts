import { LAVENDER, MINT, PEACH } from "@/config/site";

export type SponsorTier = "partner" | "builder" | "supporter";

export type Sponsor = {
  id: string;
  name: string;
  logoUrl: string;
  website: string;
  tier: SponsorTier;
  /** Default 1. Manually tweak to fix logos that look too small or too big. */
  logoScale?: number;
  /** Optional Tailwind classes for fine-tuning a specific logo. */
  customStyles?: string;
  isPaste?: boolean; // Whether this sponsor is from our Paste integration. Used to add a "via Paste" badge on the frontend.
};

export const sponsors: Sponsor[] = [
  {
    id: "shadcnblocks",
    name: "Shadcnblocks.com",
    logoUrl: "/sponsors/shadcnblocks.svg",
    website: "https://shadcnblocks.com/?utm_source=remocn&utm_medium=sponsor&utm_campaign=remocn_sponsors_page",
    tier: "partner",
    logoScale: 1.2,
    customStyles: "opacity-90",
    isPaste: false,
  },
  // Paste:
  {
    id: "efferd",
    name: "Efferd",
    logoUrl: "/sponsors/efferd.svg",
    website: "https://efferd.com/?utm_source=remocn&utm_medium=sponsor&utm_campaign=remocn_sponsors_page",
    tier: "partner",
    logoScale: 1.2,
    customStyles: "opacity-90",
    isPaste: true,
  },
  {
    id: "shadcnstudio",
    name: "ShadcnStudio",
    logoUrl: "https://cdn.shadcnstudio.com/ss-assets/marketing/shadcn-studio-logos/shadcn-studio-light-full-logo.png",
    website: "https://shadcnstudio.com/?utm_source=remocn&utm_medium=sponsor&utm_campaign=remocn_sponsors_page",
    tier: "builder",
    logoScale: 1.2,
    customStyles: "invert opacity-90 h-8",
    isPaste: true,
  },
  {
    id: "shadcnspace",
    name: "ShadcnSpace",
    logoUrl: "https://shadcnspace.com/images/logo/shadcnspace.svg",
    website: "https://shadcnspace.com/?utm_source=remocn&utm_medium=sponsor&utm_campaign=remocn_sponsors_page",
    tier: "builder",
    logoScale: 1.2,
    customStyles: "grayscale invert opacity-90 h-8",
    isPaste: true,
  },
].filter(sponsor => !sponsor.isPaste);

/**
 * The current "gold" sponsors — our highest tier is `partner`, so gold maps to
 * the partner-tier entries. Returns an empty array when none are active, in
 * which case the banner falls back to a "Your logo here" placeholder.
 */
export function getGoldSponsors(): Sponsor[] {
  return sponsors.filter((sponsor) => sponsor.tier === "partner");
}

export type BillingMode = "monthly" | "one-time";

export type Tier = {
  id: "supporter" | "builder" | "partner";
  price: number;
  name: string;
  tagline: string;
  perks: string[];
  glow: string;
  highlighted: boolean;
  monthlyUrl: string;
  oneTimeUrl: string;
};

export const tiers: Tier[] = [
  {
    id: "supporter",
    price: 5,
    name: "Supporter",
    tagline: "Show some love",
    perks: [
      "Sponsor badge in our Discord",
      "Our endless gratitude",
      "Early access to release notes",
    ],
    glow: MINT,
    highlighted: false,
    monthlyUrl: "https://www.creem.io/payment/prod_1PtwNGZVHfXZgChBSCwmJA",
    oneTimeUrl: "https://www.creem.io/payment/prod_66n8fHDfCVmwSNswCHL5OH",
  },
  {
    id: "builder",
    price: 10,
    name: "Builder",
    tagline: "Help us build",
    perks: [
      "Everything in Supporter",
      "Your name in the repository README",
      "Priority on feature requests",
    ],
    glow: PEACH,
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
      "Your logo featured on the main remocn landing page",
      "Direct line to the maintainers",
    ],
    glow: LAVENDER,
    highlighted: true,
    monthlyUrl: "https://www.creem.io/payment/prod_6tdCLqKgSA14P0IEVZ2GaG",
    oneTimeUrl: "https://www.creem.io/payment/prod_2sb9zG2oJn232utqh5TN1S",
  },
];
