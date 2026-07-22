export const changelogDateFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: "UTC",
  year: "numeric",
  month: "long",
  day: "numeric",
});

export function sortByDateDesc<T extends { date: Date }>(
  entries: readonly T[],
): T[] {
  return [...entries].sort((a, b) => b.date.getTime() - a.date.getTime());
}

export function changelogSlug(entry: { info: { path: string } }): string {
  return entry.info.path.replace(/\.mdx$/, "");
}
