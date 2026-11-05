import { existsSync } from "node:fs";
import path from "node:path";
import {
  activeSponsors,
  formerSponsors,
  type Sponsor,
  type SponsorTier,
} from "@/config/sponsors";

export type CreditLogo = {
  src: string;
  /** No `-dark` variant on disk: whiten the light logo with a filter. */
  invert: boolean;
  /** Photo avatars (builders) render round and unfiltered. */
  avatar: boolean;
};

export type CreditEntry = {
  id: string;
  name: string;
  website: string;
  /** Icon + name (row sponsors, avatars), full wordmark, or name only. */
  kind: "mark" | "wordmark" | "name";
  logo?: CreditLogo;
};

export type CreditGroup = {
  id: string;
  role: string;
  placement: string;
  entries: CreditEntry[];
};

const ROLES: { tier: SponsorTier; role: string; placement: string }[] = [
  { tier: "legendary", role: "Legendary", placement: "landing and docs" },
  { tier: "featured", role: "Featured", placement: "landing and docs" },
  { tier: "partner", role: "Partners", placement: "sponsors page" },
  { tier: "builder", role: "Builder", placement: "repository README" },
];

/** `/sponsors/neon.svg` → `/sponsors/neon-dark.svg` when that file exists. */
function darkVariant(logoUrl: string): string | null {
  if (!logoUrl.startsWith("/")) return null;
  const ext = path.extname(logoUrl);
  const dark = `${logoUrl.slice(0, -ext.length)}-dark${ext}`;
  return existsSync(path.join(process.cwd(), "public", dark)) ? dark : null;
}

function toLogo(sponsor: Sponsor): CreditLogo | undefined {
  if (!sponsor.logoUrl) return undefined;
  if (/\.jpe?g$/i.test(sponsor.logoUrl)) {
    return { src: sponsor.logoUrl, invert: false, avatar: true };
  }
  const dark = darkVariant(sponsor.logoUrl);
  return { src: dark ?? sponsor.logoUrl, invert: !dark, avatar: false };
}

function toEntry(sponsor: Sponsor): CreditEntry {
  const logo = toLogo(sponsor);
  const kind = !logo
    ? "name"
    : sponsor.displayName && (sponsor.layout === "row" || logo.avatar)
      ? "mark"
      : "wordmark";
  return {
    id: sponsor.id,
    name: sponsor.displayName ?? sponsor.name,
    website: sponsor.website,
    kind,
    logo,
  };
}

export function getCreditGroups(): CreditGroup[] {
  const groups: CreditGroup[] = ROLES.map(({ tier, role, placement }) => ({
    id: tier,
    role,
    placement,
    entries: activeSponsors.filter((s) => s.tier === tier).map(toEntry),
  }));

  groups.push({
    id: "former",
    role: "Special thanks",
    placement: "former sponsors",
    entries: formerSponsors.map((sponsor) => ({
      id: sponsor.id,
      name: sponsor.displayName ?? sponsor.name,
      website: sponsor.website,
      kind: "name",
    })),
  });

  return groups.filter((group) => group.entries.length > 0);
}
