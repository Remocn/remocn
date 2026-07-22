import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { blog } from "@/.source/server";
import { GuideVideo } from "@/components/docs/guide-video";
import { blogDateFormatter, blogSlug } from "@/lib/blog";
import { getMDXComponents } from "@/mdx-components";

type PageProps = { params: Promise<{ slug: string }> };

function getPost(slug: string) {
  return blog.find((post) => blogSlug(post) === slug);
}

export function generateStaticParams() {
  return blog.map((post) => ({ slug: blogSlug(post) }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return {};

  const url = `/blog/${slug}`;
  const title = `${post.title} · remocn`;
  const shareImage = post.videoPoster ?? "/hero.png";

  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      url,
      siteName: "Remocn",
      title,
      description: post.description,
      locale: "en_US",
      images: [{ url: shareImage, alt: post.title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: post.description,
      images: [shareImage],
    },
  };
}

const postComponents = { ...getMDXComponents(), GuideVideo };

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  const iso = post.date.toISOString().slice(0, 10);
  const MDX = post.body;

  return (
    <section className="pt-10 pb-24 sm:pt-14">
      <div className="section flex flex-col gap-8">
        <Link
          href="/blog"
          className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Blog
        </Link>

        {post.video ? (
          <GuideVideo src={post.video} poster={post.videoPoster} />
        ) : null}

        <div className="flex flex-col gap-3">
          <h1 className="text-3xl font-semibold leading-tight tracking-tight text-foreground sm:text-4xl">
            {post.title}
          </h1>
          <time
            dateTime={iso}
            className="font-mono text-xs font-medium text-muted-foreground"
          >
            {blogDateFormatter.format(post.date)}
          </time>
        </div>

        <div className="typeset typeset-docs">
          <MDX components={postComponents} />
        </div>
      </div>
    </section>
  );
}
