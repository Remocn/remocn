import type { Sponsor, SponsorTier } from "@/config/sponsors";
import { cn } from "@/lib/utils";
import {
  BecomeSponsorCard,
  SponsorCard,
  TIER_LABEL,
  TIER_STYLE,
} from "./sponsor-card";

const TIER_ORDER: SponsorTier[] = [
  "legendary",
  "featured",
  "partner",
  "builder",
];

const ROW_SIZES: Record<SponsorTier, number[]> = {
  legendary: [1],
  featured: [2, 3],
  partner: [3, 4, 2],
  builder: [3, 4, 2],
};

const MD_SPAN: Record<number, string> = {
  1: "md:col-span-12",
  2: "md:col-span-6",
  3: "md:col-span-4",
  4: "md:col-span-3",
};

function partition(count: number, sizes: number[]): number[] | null {
  const memo = new Map<number, number[] | null>();
  const solve = (rem: number): number[] | null => {
    if (rem === 0) return [];
    const cached = memo.get(rem);
    if (cached !== undefined) return cached;
    let result: number[] | null = null;
    for (const size of sizes) {
      if (size > rem) continue;
      const rest = solve(rem - size);
      if (rest) {
        result = [size, ...rest];
        break;
      }
    }
    memo.set(rem, result);
    return result;
  };
  return solve(count);
}

function packRows(count: number, sizes: number[]): number[] {
  return partition(count, sizes) ?? partition(count, [...sizes, 1]) ?? [count];
}

type Cell =
  | { kind: "sponsor"; sponsor: Sponsor }
  | { kind: "cta"; href: string };

function layoutCells(sponsors: Sponsor[], ctaHref: string) {
  const groups = TIER_ORDER.map((tier) => ({
    tier,
    cells: sponsors
      .filter((s) => s.tier === tier)
      .map((sponsor): Cell => ({ kind: "sponsor", sponsor })),
  })).filter((g) => g.cells.length > 0);

  const last = groups.at(-1);
  if (last) last.cells.push({ kind: "cta", href: ctaHref });
  else
    groups.push({ tier: "builder", cells: [{ kind: "cta", href: ctaHref }] });

  return groups.flatMap(({ tier, cells }) => {
    const rows = packRows(cells.length, ROW_SIZES[tier]);
    let index = 0;
    return rows.flatMap((rowSize) => {
      const row = cells.slice(index, index + rowSize);
      index += rowSize;
      return row.map((cell) => ({
        cell,
        tier,
        mdSpan: MD_SPAN[rowSize] ?? "md:col-span-12",
      }));
    });
  });
}

export function SponsorGrid({
  sponsors,
  ctaHref,
  className,
}: {
  sponsors: Sponsor[];
  ctaHref: string;
  className?: string;
}) {
  return (
    <div className={cn("grid grid-cols-2 gap-3 md:grid-cols-12", className)}>
      {layoutCells(sponsors, ctaHref).map(({ cell, tier, mdSpan }) => {
        const style = TIER_STYLE[tier];
        if (cell.kind === "cta") {
          return (
            <BecomeSponsorCard
              key="cta"
              href={cell.href}
              className={cn("col-span-2", mdSpan)}
            />
          );
        }
        return (
          <div key={cell.sponsor.id} className={cn(style.span, mdSpan)}>
            <SponsorCard
              sponsor={cell.sponsor}
              label={TIER_LABEL[tier]}
              logoArea={style.logoArea}
              maxH={style.maxH}
              treatment={style.treatment}
            />
          </div>
        );
      })}
    </div>
  );
}
