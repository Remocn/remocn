import { cache } from "react";
import { blog } from "@/.source/server";
import { blogSlug } from "@/lib/blog";
import { sortByDateDesc } from "@/lib/changelog";
import { getVideoDuration } from "@/lib/video-duration";
import type { BlogPostSummary } from "./post-types";

export type { BlogPostSummary, PostKind } from "./post-types";
export { POST_KIND_LABEL } from "./post-types";

export const shortDateFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: "UTC",
  year: "numeric",
  month: "short",
  day: "numeric",
});

/** Body of the `### <heading>` section, up to the next h2/h3. */
function section(raw: string, heading: string): string | null {
  const start = raw.indexOf(`### ${heading}`);
  if (start === -1) return null;
  const rest = raw.slice(start + heading.length + 4);
  const end = rest.search(/^#{2,3} /m);
  return end === -1 ? rest : rest.slice(0, end);
}

function parseBeats(raw: string): string[] {
  const storyboard = section(raw, "The storyboard");
  if (!storyboard) return [];
  return [...storyboard.matchAll(/^\d+\.\s+\*\*(.+?)\*\*/gm)].map(
    (match) => match[1],
  );
}

function parsePrompt(raw: string): string | null {
  const body = section(raw, "The prompt");
  const fence = body?.match(/```[^\n]*\n([\s\S]*?)\n```/);
  return fence ? fence[1] : null;
}

type BlogEntry = (typeof blog)[number];

async function summarize(post: BlogEntry): Promise<BlogPostSummary> {
  const raw = await post.getText("raw");
  const beats = parseBeats(raw);
  return {
    slug: blogSlug(post),
    title: post.title,
    description: post.description,
    iso: post.date.toISOString().slice(0, 10),
    dateLabel: shortDateFormatter.format(post.date),
    kind: beats.length > 0 ? "launch" : "product",
    beats,
    prompt: parsePrompt(raw),
    video: post.video ?? null,
    poster: post.videoPoster ?? null,
    duration: post.video ? await getVideoDuration(post.video) : null,
  };
}

/** All posts, newest first, with storyboard, prompt and video length. */
export const getBlogPosts = cache(
  (): Promise<BlogPostSummary[]> =>
    Promise.all(sortByDateDesc(blog).map(summarize)),
);
