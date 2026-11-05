import Link from "next/link";
import { cn } from "@/lib/utils";
import { BentoRemix } from "./bento-clip";

/**
 * The type remix spans exactly the two family tiles below it: the tile runs
 * on the outer 3-column grid with the family tiles' 28px inset, so its gap is
 * the outer gap plus both insets (10 + 56 on md, 12 + 56 on xl).
 */
export function TypographyTile({
  href,
  className,
}: {
  href: string;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex flex-col justify-between gap-[18px] overflow-clip rounded-panel bg-tile px-[22px] pt-[22px] pb-6 transition-colors outline-none hover:bg-[#E9EAEC] focus-visible:ring-3 focus-visible:ring-ring md:grid md:grid-cols-3 md:gap-x-[66px] md:gap-y-0 md:px-7 md:py-[26px] xl:gap-x-[68px] xl:rounded-shell dark:hover:bg-[#2A2D31]",
        className,
      )}
    >
      <BentoRemix className="h-[150px] min-w-0 rounded-[14px] md:col-span-2 md:h-auto md:min-h-[200px]" />
      <div className="flex flex-col gap-1 md:justify-end md:gap-1.5">
        <h3 className="text-caption text-muted-foreground lg:text-micro">
          Typography
        </h3>
        <p className="text-[15px] leading-[22px] text-paragraph">
          Words that land with weight instead of just appearing.
        </p>
      </div>
    </Link>
  );
}
