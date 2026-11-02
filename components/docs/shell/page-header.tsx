import { PageActions } from "./page-actions";
import type { PageNeighbour } from "./page-context";
import type { PageLinks } from "./page-links";
import { PageNav } from "./page-nav";

/**
 * Article head: the row above the title (previous / next arrows on the left,
 * the page actions — "Copy page" + agent menu — on the right from `lg`), the
 * title and the description. Below `lg` the actions drop under the
 * description. From `lg` the row is pulled up so its 40px capsules share a
 * top edge with the sidebar's library switcher.
 */
export function PageHeader({
  title,
  description,
  links,
  previous,
  next,
}: {
  title: string;
  description?: string;
  links?: PageLinks;
  previous?: PageNeighbour;
  next?: PageNeighbour;
}) {
  const hasNav = Boolean(previous || next);
  return (
    <header className="flex flex-col gap-3 lg:gap-3.5 lg:pb-3">
      {(hasNav || links) && (
        <div
          className={
            hasNav
              ? "flex items-center justify-between gap-3 lg:-mt-3"
              : "hidden justify-end lg:-mt-3 lg:flex"
          }
        >
          {hasNav && <PageNav previous={previous} next={next} />}
          {links && (
            <PageActions
              links={links}
              alignToHeader
              className="max-lg:hidden"
            />
          )}
        </div>
      )}
      <h1 className="text-[34px] leading-9 font-medium tracking-heading text-balance text-foreground lg:text-h3 lg:leading-[52px]">
        {title}
      </h1>
      {description && (
        <p className="max-w-[620px] text-lg leading-[26px] text-pretty text-muted-foreground lg:text-lead lg:leading-7">
          {description}
        </p>
      )}
      {links && <PageActions links={links} className="lg:hidden" />}
    </header>
  );
}
