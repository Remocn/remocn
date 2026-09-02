import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  getLandingSponsors,
  type Sponsor,
  type SponsorTier,
} from "../config/sponsors";

const README = join(import.meta.dirname, "..", "README.md");
const PUBLIC = join(import.meta.dirname, "..", "public");
const CDN = "https://remocn.dev";
const START = "<!-- sponsors:start -->";
const END = "<!-- sponsors:end -->";

const COLUMNS = 15;
const TABLE_WIDTH = 850;

const TIER_LAYOUT: Record<SponsorTier, { perRow: number; height: number }> = {
  legendary: { perRow: 1, height: 48 },
  featured: { perRow: 3, height: 40 },
  partner: { perRow: 5, height: 32 },
  builder: { perRow: 5, height: 32 },
};

const TIER_ORDER: SponsorTier[] = [
  "legendary",
  "featured",
  "partner",
  "builder",
];

function chunk<T>(items: T[], size: number): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < items.length; i += size)
    rows.push(items.slice(i, i + size));
  return rows;
}

function darkTwin(logoUrl: string): string | null {
  const dark = logoUrl.replace(/(\.[a-z]+)$/, "-dark$1");
  return existsSync(join(PUBLIC, dark)) ? dark : null;
}

function logo(sponsor: Sponsor, height: number): string {
  const img = `<img src="${CDN}${sponsor.logoUrl}" alt="${sponsor.name}" height="${height}" align="middle" />`;
  const dark = darkTwin(sponsor.logoUrl);
  const picture = dark
    ? `<picture><source media="(prefers-color-scheme: dark)" srcset="${CDN}${dark}" />${img}</picture>`
    : img;
  const label = sponsor.displayName ? ` <b>${sponsor.displayName}</b>` : "";
  const href = sponsor.website.split("?")[0];
  return `<a href="${href}">${picture}${label}</a>`;
}

function cell(sponsor: Sponsor, colspan: number, height: number): string {
  const width = Math.round((TABLE_WIDTH * colspan) / COLUMNS);
  return `      <td colspan="${colspan}" width="${width}" align="center">${logo(sponsor, height)}</td>`;
}

function render(sponsors: Sponsor[]): string {
  const rows = TIER_ORDER.flatMap((tier) => {
    const { perRow, height } = TIER_LAYOUT[tier];
    const base = COLUMNS / perRow;
    return chunk(
      sponsors.filter((s) => s.tier === tier),
      perRow,
    ).map((row) => {
      const colspan = COLUMNS % row.length === 0 ? COLUMNS / row.length : base;
      return [
        "    <tr>",
        ...row.map((s) => cell(s, colspan, height)),
        "    </tr>",
      ].join("\n");
    });
  });
  return [
    '<table align="center">',
    "  <tbody>",
    ...rows,
    "  </tbody>",
    "</table>",
  ].join("\n");
}

const readme = readFileSync(README, "utf8");
const start = readme.indexOf(START);
const end = readme.indexOf(END);
if (start === -1 || end === -1) {
  throw new Error(`README.md is missing the ${START} / ${END} markers`);
}

const block = `${START}\n${render(getLandingSponsors())}\n${END}`;
writeFileSync(
  README,
  readme.slice(0, start) + block + readme.slice(end + END.length),
);
console.log(
  `README sponsors block updated (${getLandingSponsors().length} sponsors)`,
);
