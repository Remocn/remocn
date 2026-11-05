import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cn } from "@/lib/utils";
import { formatDuration } from "@/lib/video-duration";
import { landingButtonVariants } from "../../components/landing/ui/landing-button";
import { pageHeaderButton } from "../../components/site-page/page-header";
import { ShowcaseDetails } from "../components/showcase-details";
import { ShowcaseVideo } from "../components/showcase-video";
import { getReel } from "../lib/reel";

type PageProps = { params: Promise<{ slug: string }> };

async function getClip(slug: string) {
  const { clips } = await getReel();
  const index = clips.findIndex((clip) => clip.slug === slug);
  if (index === -1) return null;
  return {
    clip: clips[index],
    index,
    count: clips.length,
    prev: clips[index - 1] ?? null,
    next: clips[index + 1] ?? null,
  };
}

export async function generateStaticParams() {
  const { clips } = await getReel();
  return clips.map((clip) => ({ slug: clip.slug }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const found = await getClip(slug);
  if (!found) return {};
  const { clip } = found;
  const title = `${clip.title} · Remocn`;

  return {
    title: clip.title,
    alternates: { canonical: `/showcases/${clip.slug}` },
    openGraph: {
      type: "article",
      url: `/showcases/${clip.slug}`,
      siteName: "Remocn",
      title,
      locale: "en_US",
      images: [{ url: clip.poster, alt: clip.title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      images: [clip.poster],
    },
  };
}

const NAV_BUTTON = cn(
  landingButtonVariants({ variant: "secondary" }),
  pageHeaderButton,
);

export default async function ShowcasePage({ params }: PageProps) {
  const { slug } = await params;
  const found = await getClip(slug);
  if (!found) notFound();
  const { clip, index, count, prev, next } = found;

  return (
    <>
      <header className="landing-container flex flex-col gap-5 pt-12 pb-8 md:pt-20 md:pb-12 xl:pt-24 xl:pb-12">
        <Link href="/showcases" className={cn(NAV_BUTTON, "self-start")}>
          <span aria-hidden="true" className="text-primary">
            ←
          </span>
          Showcases
        </Link>
        <p className="pt-3 text-small text-muted-foreground tabular-nums">
          Clip {String(index + 1).padStart(2, "0")} of {count},{" "}
          {formatDuration(clip.start)} to{" "}
          {formatDuration(clip.start + clip.duration)} on the reel
        </p>
        <h1 className="text-[40px] leading-[42px] tracking-heading text-balance text-foreground md:text-h2">
          {clip.title}
        </h1>
        <p className="flex items-center gap-2.5">
          {/* biome-ignore lint/performance/noImgElement: remote showcase avatars of arbitrary origin */}
          <img
            src={clip.author.avatarUrl}
            alt=""
            width={24}
            height={24}
            referrerPolicy="no-referrer"
            className="size-6 shrink-0 rounded-full bg-muted object-cover"
          />
          {clip.author.url ? (
            <a
              href={clip.author.url}
              target="_blank"
              rel="noreferrer"
              className="-mx-1 rounded-tag px-1 text-small text-body outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
            >
              {clip.author.name}
            </a>
          ) : (
            <span className="text-small text-body">{clip.author.name}</span>
          )}
          <time
            dateTime={clip.iso}
            className="text-caption text-muted-foreground"
          >
            {clip.dateLabel}
          </time>
        </p>
      </header>

      <div className="landing-container flex flex-col gap-6 pb-[72px] xl:flex-row xl:pb-section">
        <div className="flex min-w-0 grow flex-col gap-6">
          <div className="rounded-panel bg-dark-surface p-2.5 xl:rounded-shell dark:bg-surface dark:shadow-[0_0_0_1px_var(--hairline)]">
            <ShowcaseVideo
              src={clip.video}
              poster={clip.poster}
              label={clip.title}
            />
          </div>
          <nav aria-label="Reel" className="flex justify-between gap-3">
            {prev ? (
              <Link
                href={`/showcases/${prev.slug}`}
                className={cn(NAV_BUTTON, "min-w-0 shrink")}
              >
                <span aria-hidden="true" className="text-muted-foreground">
                  ←
                </span>
                <span className="max-w-[24ch] min-w-0 truncate">
                  {prev.title}
                </span>
              </Link>
            ) : (
              <span />
            )}
            {next && (
              <Link
                href={`/showcases/${next.slug}`}
                className={cn(NAV_BUTTON, "min-w-0 shrink")}
              >
                <span className="max-w-[24ch] min-w-0 truncate">
                  {next.title}
                </span>
                <span aria-hidden="true" className="text-muted-foreground">
                  →
                </span>
              </Link>
            )}
          </nav>
        </div>
        <ShowcaseDetails clip={clip} />
      </div>
    </>
  );
}
