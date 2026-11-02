import Link from "next/link";
import { GITHUB_URL } from "@/config/site";
import { cn } from "@/lib/utils";
import { ArrowIcon, PencilIcon } from "./docs-icons";
import type { PageNeighbour } from "./page-context";

function NeighbourCard({
  page,
  direction,
}: {
  page: PageNeighbour;
  direction: "previous" | "next";
}) {
  const next = direction === "next";
  return (
    <Link
      href={page.url}
      className={cn(
        "flex min-w-0 flex-col gap-1.5 rounded-cta border border-hairline bg-surface px-4 py-3.5 outline-none transition-colors hover:border-divider hover:bg-surface-muted focus-visible:ring-2 focus-visible:ring-ring lg:rounded-card lg:px-5 lg:py-4",
        next && "col-start-2 items-end text-right",
      )}
    >
      <span className="flex items-center gap-1.5 text-caption text-muted-foreground">
        {!next && <ArrowIcon direction="left" className="size-3" />}
        {next ? "Next" : "Previous"}
        {next && <ArrowIcon className="size-3" />}
      </span>
      <span className="text-ui leading-[22px] font-medium text-foreground">
        {page.name}
      </span>
    </Link>
  );
}

/**
 * Article foot: previous / next within the library, then "Edit this page on
 * GitHub" with the source path. Mobile turns the edit link into a button and
 * puts the path under it.
 */
export function PageFooter({
  previous,
  next,
  sourcePath,
}: {
  previous?: PageNeighbour;
  next?: PageNeighbour;
  sourcePath: string;
}) {
  const editUrl = `${GITHUB_URL}/edit/main/${sourcePath}`;
  return (
    <footer className="flex flex-col gap-4 pt-6 lg:gap-5 lg:pt-11">
      {(previous || next) && (
        <nav
          aria-label="Pagination"
          className="grid grid-cols-2 gap-2 lg:gap-3"
        >
          {previous && <NeighbourCard page={previous} direction="previous" />}
          {next && <NeighbourCard page={next} direction="next" />}
        </nav>
      )}
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between lg:px-1">
        <a
          href={editUrl}
          target="_blank"
          rel="noreferrer"
          className="flex h-11 w-fit items-center gap-2 rounded-control-sm bg-secondary px-3.5 text-small text-foreground outline-none transition-colors hover:bg-[#dcdde0] focus-visible:ring-2 focus-visible:ring-ring dark:hover:bg-[#33363b] lg:-mx-2 lg:h-8 lg:rounded-tile lg:bg-transparent lg:px-2 lg:text-muted-foreground lg:hover:bg-capsule lg:hover:text-foreground lg:dark:hover:bg-capsule"
        >
          <PencilIcon className="size-3.5" />
          Edit this page on GitHub
        </a>
        <span className="truncate pl-1 font-mono text-mono text-subtle lg:pl-0">
          {sourcePath}
        </span>
      </div>
    </footer>
  );
}
