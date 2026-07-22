import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getShowcase, getShowcases } from "@/lib/showcases";
import { GitHubIcon } from "../../components/github-icon";
import { ShowcaseAuthor } from "../components/showcase-author";
import { ShowcaseComponents } from "../components/showcase-components";
import { ShowcaseVideo } from "../components/showcase-video";

type PageProps = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const showcases = await getShowcases();
  return showcases.map((showcase) => ({ slug: showcase.slug }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const showcase = await getShowcase(slug);
  if (!showcase) return {};

  const title = `${showcase.title} · remocn`;

  return {
    title: showcase.title,
    alternates: { canonical: `/showcases/${showcase.slug}` },
    openGraph: {
      type: "article",
      url: `/showcases/${showcase.slug}`,
      siteName: "Remocn",
      title,
      locale: "en_US",
      images: [{ url: showcase.posterUrl, alt: showcase.title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      images: [showcase.posterUrl],
    },
  };
}

export default async function ShowcasePage({ params }: PageProps) {
  const { slug } = await params;
  const showcase = await getShowcase(slug);
  if (!showcase) notFound();

  return (
    <section className="pt-10 pb-24 sm:pt-14">
      <div className="section flex flex-col gap-8">
        <Link
          href="/showcases"
          className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Showcases
        </Link>

        <div className="flex flex-col gap-4">
          <h1 className="text-3xl font-semibold leading-tight tracking-tight text-foreground sm:text-4xl">
            {showcase.title}
          </h1>
          <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
            <ShowcaseAuthor author={showcase.author} linked />
            {showcase.githubUrl ? (
              <Button
                variant="outline"
                className="h-9 gap-2 rounded-full px-4 text-sm"
                render={
                  <Link
                    href={showcase.githubUrl}
                    target="_blank"
                    rel="noreferrer"
                  />
                }
              >
                <GitHubIcon className="size-4" />
                View source
              </Button>
            ) : null}
          </div>
        </div>

        <ShowcaseVideo src={showcase.videoUrl} poster={showcase.posterUrl} />

        <ShowcaseComponents components={showcase.components} />
      </div>
    </section>
  );
}
