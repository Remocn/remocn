import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import Image from "next/image";
import Link from "next/link";
import { getDocsSponsors, type Sponsor } from "@/config/sponsors";
import { cn } from "@/lib/utils";
import { ArrowIcon } from "./docs-icons";

/** Wordmark heights (px) from the rail artboard; the rest sit at 16px. */
const WORDMARK_HEIGHT: Record<string, number> = {
  neon: 22,
  vidrush: 14,
};

/**
 * Width of a local logo drawn `height` px tall, from the SVG viewBox or the
 * PNG header, so the image's size attributes match what's drawn (next/image
 * warns otherwise).
 */
function widthAt(src: string, height: number): number {
  if (src.startsWith("/") && src.endsWith(".png")) {
    const png = readFileSync(path.join(process.cwd(), "public", src));
    return Math.round((height * png.readUInt32BE(16)) / png.readUInt32BE(20));
  }
  if (src.startsWith("/") && src.endsWith(".svg")) {
    const svg = readFileSync(path.join(process.cwd(), "public", src), "utf8");
    const box =
      /viewBox="[\d.-]+[\s,]+[\d.-]+[\s,]+([\d.]+)[\s,]+([\d.]+)"/.exec(svg);
    if (box) return Math.round((height * Number(box[1])) / Number(box[2]));
  }
  return height * 5;
}

/** The card is always dark: prefer a `-dark` logo, else whiten the light one. */
function darkLogo(sponsor: Sponsor): { src: string; invert: boolean } {
  const { logoUrl } = sponsor;
  if (logoUrl.startsWith("/")) {
    const ext = path.extname(logoUrl);
    const dark = `${logoUrl.slice(0, -ext.length)}-dark${ext}`;
    if (existsSync(path.join(process.cwd(), "public", dark))) {
      return { src: dark, invert: false };
    }
  }
  return { src: logoUrl, invert: true };
}

function SponsorLogo({ sponsor }: { sponsor: Sponsor }) {
  const logo = darkLogo(sponsor);
  const mark = sponsor.displayName && sponsor.layout === "row";
  const height = mark ? 15 : (WORDMARK_HEIGHT[sponsor.id] ?? 16);
  const width = mark ? 15 : widthAt(logo.src, height);
  return (
    <a
      href={sponsor.website}
      target="_blank"
      rel="noreferrer"
      className="-mx-1.5 flex h-6 items-center gap-[7px] rounded-tag px-1.5 outline-none transition-colors hover:bg-white/[0.06] focus-visible:ring-2 focus-visible:ring-white/40"
    >
      <Image
        src={logo.src}
        alt={mark ? "" : sponsor.name}
        // Tiny logos: resizing them only rounds the ratio off. The box is
        // pinned to the exact attribute size so the drawn ratio matches.
        unoptimized
        width={width}
        height={height}
        style={{ width, height }}
        className={cn(
          "shrink-0",
          mark && "rounded-[4px]",
          logo.invert && "invert",
        )}
      />
      {mark && (
        <span className="text-mono leading-[15px] font-semibold tracking-title text-[#FAFAFA]">
          {sponsor.displayName}
        </span>
      )}
    </a>
  );
}

/**
 * "End credits / Made possible by": the sponsors placed in the docs (see
 * `getDocsSponsors`) as a mini credits card, with "Roll your name in" to
 * /sponsors. Ink on light pages, the night surface on dark ones.
 */
export function SponsorsCard({ className }: { className?: string }) {
  const sponsors = getDocsSponsors();
  return (
    <aside
      aria-label="Sponsors"
      className={cn(
        "flex flex-col gap-4 rounded-capsule bg-dark-surface px-2.5 pt-[18px] pb-2.5 xl:gap-3.5 xl:pt-4 dark:border dark:border-hairline dark:bg-surface",
        className,
      )}
    >
      <div className="flex flex-col items-center gap-0.5 text-center">
        <p className="text-caption text-[#8B979C] xl:text-mono">End credits</p>
        <p className="text-ui leading-[22px] text-[#FAFAFA] xl:text-[15px] xl:leading-5">
          Made possible by
        </p>
      </div>
      {sponsors.length > 0 && (
        <ul className="flex flex-wrap items-center justify-center gap-x-[22px] gap-y-3.5 px-3 xl:flex-col xl:flex-nowrap xl:gap-3 xl:px-0 xl:py-1">
          {sponsors.map((sponsor) => (
            <li key={sponsor.id} className="flex">
              <SponsorLogo sponsor={sponsor} />
            </li>
          ))}
        </ul>
      )}
      <Link
        href="/sponsors"
        className="flex h-11 items-center justify-center gap-1.5 rounded-[10px] bg-[#FAFAFA] text-small leading-[18px] text-[#0E1012] outline-none transition-colors hover:bg-white focus-visible:ring-2 focus-visible:ring-white/40 xl:h-8 xl:rounded-tile xl:text-mono dark:bg-[#F4F4F5]"
      >
        Roll your name in
        <ArrowIcon className="size-3" />
      </Link>
    </aside>
  );
}
