/** Client-safe post types (no content-collection imports). */

export type PostKind = "launch" | "product";

export const POST_KIND_LABEL: Record<PostKind, string> = {
  launch: "Launch video",
  product: "Product",
};

/** Serializable card data for one post, derived from its MDX source. */
export type BlogPostSummary = {
  slug: string;
  title: string;
  description: string;
  iso: string;
  dateLabel: string;
  kind: PostKind;
  /** Beat names from the "The storyboard" list (launch videos only). */
  beats: string[];
  /** The fenced prompt under "The prompt", copyable as-is. */
  prompt: string | null;
  video: string | null;
  poster: string | null;
  /** Seconds, read from the video file. */
  duration: number | null;
};
