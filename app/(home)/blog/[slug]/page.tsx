import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { blog } from "@/.source/server";
import { GuideVideo } from "@/components/docs/guide-video";
import { blogSlug } from "@/lib/blog";
import { cn } from "@/lib/utils";
import { getMDXComponents } from "@/mdx-components";
import { landingButtonVariants } from "../../components/landing/ui/landing-button";
import { CopyTextButton } from "../../components/site-page/copy-text-button";
import { pageHeaderButton } from "../../components/site-page/page-header";
import { MorePosts } from "../components/more-posts";
import { PostIndexNav } from "../components/post-index-nav";
import { PostMeta } from "../components/post-meta";
import { ScreeningPlayer } from "../components/screening-player";
import { POST_KIND_LABEL } from "../lib/post-types";
import { getBlogPosts } from "../lib/posts";

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
      publishedTime: post.date.toISOString(),
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

const MORE_POSTS = 3;

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  const posts = await getBlogPosts();
  const index = posts.findIndex((item) => item.slug === slug);
  const summary = posts[index];
  const more = [...posts.slice(index + 1), ...posts.slice(0, index)].slice(
    0,
    MORE_POSTS,
  );
  const headings = post.toc.filter((item) => item.depth <= 3);
  const MDX = post.body;

  return (
    <>
      <article>
        <header className="landing-container flex flex-col gap-5 pt-12 pb-8 md:pt-20 md:pb-12 xl:pt-28 xl:pb-14">
          <Link
            href="/blog"
            className={cn(
              landingButtonVariants({ variant: "secondary" }),
              pageHeaderButton,
              "self-start",
            )}
          >
            <span aria-hidden="true" className="text-primary">
              ←
            </span>
            Blog
          </Link>
          <PostMeta
            iso={summary.iso}
            date={summary.dateLabel}
            tag={POST_KIND_LABEL[summary.kind]}
            className="pt-3"
          />
          <h1 className="max-w-[920px] text-[34px] leading-[38px] tracking-heading text-balance text-foreground md:text-h3">
            {post.title}
          </h1>
          <p className="max-w-[680px] text-[18px] leading-[26px] text-muted-foreground text-pretty md:text-lead">
            {post.description}
          </p>
        </header>

        <div className="landing-container xl:flex xl:gap-[120px]">
          <div className="flex min-w-0 flex-col gap-10 md:gap-14 xl:w-[820px] xl:shrink-0">
            {summary.video && (
              <ScreeningPlayer
                src={summary.video}
                poster={summary.poster}
                label={post.title}
                duration={summary.duration}
                beats={summary.beats.length}
              />
            )}
            <div className="typeset typeset-docs max-w-[680px]">
              <MDX components={postComponents} />
            </div>
          </div>

          {(headings.length > 0 || summary.prompt) && (
            <aside className="hidden w-[300px] shrink-0 flex-col gap-7 self-start xl:sticky xl:top-8 xl:flex">
              {headings.length > 0 && <PostIndexNav headings={headings} />}
              {summary.prompt && (
                <div className="flex flex-col gap-3.5 px-2">
                  <p className="text-small text-muted-foreground">
                    The brief behind this cut, ready to paste into your agent.
                  </p>
                  <CopyTextButton
                    text={summary.prompt}
                    copiedLabel="Prompt copied"
                    className={cn(
                      landingButtonVariants({ variant: "secondary" }),
                      pageHeaderButton,
                      "self-start",
                    )}
                  >
                    Copy the prompt
                  </CopyTextButton>
                </div>
              )}
            </aside>
          )}
        </div>
      </article>

      <MorePosts posts={more} />
    </>
  );
}
