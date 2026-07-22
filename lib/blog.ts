export const blogDateFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: "UTC",
  year: "numeric",
  month: "long",
  day: "numeric",
});

export function blogSlug(post: { info: { path: string } }): string {
  return post.info.path.replace(/\.mdx$/, "");
}
