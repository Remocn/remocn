import { blog } from "@/.source/server";
import { blogSlug } from "@/lib/blog";
import { ogCard } from "@/lib/og-card";

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: "UTC",
  year: "numeric",
  month: "short",
  day: "numeric",
});

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return blog.map((post) => ({ slug: blogSlug(post) }));
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const post = blog.find((p) => blogSlug(p) === slug);
  if (!post) return new Response("Not found", { status: 404 });

  return ogCard({
    title: post.title,
    description: post.description,
    label: `Blog · ${dateFormatter.format(post.date)}`,
  });
}
