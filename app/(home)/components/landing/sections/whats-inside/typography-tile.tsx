import Link from "next/link";
import { cn } from "@/lib/utils";
import { BentoRemix } from "./bento-clip";

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
        "flex flex-col justify-between gap-[18px] overflow-clip rounded-panel bg-tile px-[22px] pt-[22px] pb-6 transition-colors outline-none hover:bg-[#E9EAEC] focus-visible:ring-3 focus-visible:ring-ring lg:flex-row lg:items-stretch lg:gap-6 lg:px-9 lg:py-[30px] xl:rounded-shell dark:hover:bg-[#2A2D31]",
        className,
      )}
    >
      <BentoRemix className="h-[150px] min-w-0 lg:h-auto lg:min-h-[240px] lg:flex-1" />
      <div className="flex flex-col gap-1 lg:w-[220px] lg:shrink-0 lg:justify-end lg:gap-1.5 lg:pb-2">
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
