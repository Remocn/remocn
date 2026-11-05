import { blog } from "@/.source/server";
import { blogSlug } from "@/lib/blog";
import { sortByDateDesc } from "@/lib/changelog";

const SITE_URL = "https://remocn.dev";
const CHANNEL_DESCRIPTION =
  "Making-of stories behind the videos we build with Remocn — the storyboard, the decisions that made each one work, and the prompt that rebuilds it.";

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export const dynamic = "force-static";

export function GET() {
  const items = sortByDateDesc(blog)
    .map((post) => {
      const url = `${SITE_URL}/blog/${blogSlug(post)}`;
      return [
        "<item>",
        `<title>${escapeXml(post.title)}</title>`,
        `<link>${url}</link>`,
        `<guid>${url}</guid>`,
        `<pubDate>${post.date.toUTCString()}</pubDate>`,
        `<description>${escapeXml(post.description ?? "")}</description>`,
        "</item>",
      ].join("");
    })
    .join("");

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0">',
    "<channel>",
    "<title>Remocn blog</title>",
    `<link>${SITE_URL}/blog</link>`,
    `<description>${escapeXml(CHANNEL_DESCRIPTION)}</description>`,
    "<language>en</language>",
    items,
    "</channel>",
    "</rss>",
  ].join("");

  return new Response(xml, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}
