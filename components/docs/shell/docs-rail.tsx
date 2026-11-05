import { SponsorsCard } from "./sponsors-card";
import { StudioPromo } from "./studio-promo";

/**
 * Right rail (`xl`+): the Studio card and the sponsors credits, sticking to
 * the top while the article scrolls.
 */
export function DocsRail() {
  return (
    <div className="hidden w-(--docs-rail) shrink-0 xl:block">
      <div
        data-docs-rail
        className="sticky top-0 flex max-h-svh flex-col gap-7 overflow-y-auto pt-10 pb-10 pl-8"
      >
        <StudioPromo />
        <SponsorsCard />
      </div>
    </div>
  );
}

/** The rail's two cards, under the article below `xl`. */
export function RailCards() {
  return (
    <div className="flex flex-col gap-3 pt-8 xl:hidden">
      <StudioPromo />
      <SponsorsCard />
    </div>
  );
}
