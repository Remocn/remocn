import { PageActions } from "./page-actions";
import type { PageLinks } from "./page-links";

/**
 * Article head: the page actions ("Copy page" + agent menu) above the title
 * on desktop, the title and the description. Below `lg` the actions drop
 * under the description.
 */
export function PageHeader({
  title,
  description,
  links,
}: {
  title: string;
  description?: string;
  links?: PageLinks;
}) {
  return (
    <header className="flex flex-col gap-3 lg:gap-3.5 lg:pb-3">
      {links && (
        <div className="hidden min-h-8 justify-end lg:flex">
          <PageActions links={links} alignToHeader />
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
