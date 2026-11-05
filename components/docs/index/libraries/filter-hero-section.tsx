import { loadDocsSource } from "../data";
import { FilterHero } from "./filter-hero";
import { getLibraryItems } from "./library-data";

/** Server entry for {@link FilterHero}: counts the filters from the page tree. */
export async function FiltersHero({
  filterLabel,
  tags,
}: {
  filterLabel: string;
  tags?: string[];
}) {
  await loadDocsSource();
  return (
    <FilterHero
      count={getLibraryItems("/docs/filters").length}
      filterLabel={filterLabel}
      tags={tags}
    />
  );
}
