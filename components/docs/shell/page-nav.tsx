import Link from "next/link";
import { cn } from "@/lib/utils";
import { ArrowIcon } from "./docs-icons";
import type { PageNeighbour } from "./page-context";

const tile = "flex size-8 items-center justify-center rounded-tile";

function NavArrow({
  page,
  direction,
}: {
  page?: PageNeighbour;
  direction: "previous" | "next";
}) {
  const next = direction === "next";
  const icon = (
    <ArrowIcon direction={next ? "right" : "left"} className="size-4" />
  );

  // The end of the library keeps its slot so the pair never changes width.
  if (!page) {
    return (
      <span aria-hidden="true" className={cn(tile, "text-muted-foreground/40")}>
        {icon}
      </span>
    );
  }

  return (
    <Link
      href={page.url}
      aria-label={`${next ? "Next" : "Previous"}: ${page.name}`}
      title={`${page.name} (${next ? "j" : "k"})`}
      aria-keyshortcuts={next ? "j" : "k"}
      className={cn(
        tile,
        "text-muted-foreground outline-none hover:bg-surface/60 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring dark:hover:bg-secondary/60",
      )}
    >
      {icon}
    </Link>
  );
}

/**
 * Previous / next arrows above the title: the same neighbours as the footer
 * cards, one click away without scrolling to the bottom of the page. Drawn
 * as the sidebar's library switcher capsule so the two rows read as one.
 */
export function PageNav({
  previous,
  next,
  className,
}: {
  previous?: PageNeighbour;
  next?: PageNeighbour;
  className?: string;
}) {
  return (
    <nav
      aria-label="Previous and next page"
      className={cn(
        "flex h-10 w-fit shrink-0 items-center gap-0.5 rounded-control-sm bg-capsule p-1",
        className,
      )}
    >
      <NavArrow page={previous} direction="previous" />
      <NavArrow page={next} direction="next" />
    </nav>
  );
}
