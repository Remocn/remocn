export function blogSlug(post: { info: { path: string } }): string {
  return post.info.path.replace(/\.mdx$/, "");
}
