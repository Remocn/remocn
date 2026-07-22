import type { Metadata } from "next";
import Link from "next/link";
import { blog } from "@/.source/server";
import { blogDateFormatter, blogSlug } from "@/lib/blog";
import { sortByDateDesc } from "@/lib/changelog";
import { cn } from "@/lib/utils";

const DESCRIPTION =
  "Making-of stories behind the videos we build with remocn — the storyboard, the decisions that made each one work, and the prompt that rebuilds it.";

export const metadata: Metadata = {
  title: "Blog",
  description: DESCRIPTION,
  alternates: { canonical: "/blog" },
  openGraph: {
    type: "website",
    url: "/blog",
    siteName: "Remocn",
    title: "Blog · remocn",
    description: DESCRIPTION,
    locale: "en_US",
    images: [
      { url: "/hero.png", width: 1200, height: 675, alt: "Blog · remocn" },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Blog · remocn",
    description: DESCRIPTION,
    images: ["/hero.png"],
  },
};

export default function BlogPage() {
  const posts = sortByDateDesc(blog);

  return (
    <>
      <section className="pt-24 pb-10 sm:pt-28">
        <div className="section">
          <h1 className="text-4xl font-semibold leading-[1.05] tracking-tight text-foreground sm:text-5xl">
            Blog
          </h1>
          <p className="mt-4 max-w-2xl text-balance text-base leading-relaxed text-muted-foreground sm:text-lg">
            {DESCRIPTION}
          </p>
        </div>
      </section>

      <section className="pb-24">
        <ul className="section flex flex-col">
          {posts.map((post, index) => {
            const slug = blogSlug(post);
            const iso = post.date.toISOString().slice(0, 10);

            return (
              <li key={slug}>
                <Link
                  href={`/blog/${slug}`}
                  className={cn(
                    "group grid gap-4 py-8 md:grid-cols-[7rem_1fr_16rem] md:gap-8",
                    index > 0 && "border-t border-border",
                  )}
                >
                  <time
                    dateTime={iso}
                    className="font-mono text-xs font-medium tabular-nums text-muted-foreground md:pt-1"
                  >
                    {blogDateFormatter.format(post.date)}
                  </time>

                  <div className="flex min-w-0 flex-col gap-2">
                    <h2 className="text-xl font-semibold tracking-tight text-foreground group-hover:underline sm:text-2xl">
                      {post.title}
                    </h2>
                    <p className="text-balance text-sm leading-relaxed text-muted-foreground">
                      {post.description}
                    </p>
                  </div>

                  <div className="aspect-video overflow-hidden rounded-lg bg-muted">
                    {post.videoPoster ? (
                      <img
                        src={post.videoPoster}
                        alt=""
                        loading="lazy"
                        className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                      />
                    ) : null}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>
    </>
  );
}
