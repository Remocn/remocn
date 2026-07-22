import type { Metadata } from "next";
import Link from "next/link";
import type { ComponentProps } from "react";
import { changelog } from "@/.source/server";
import { ChangelogHero } from "@/components/changelog/changelog-hero";
import { ChangelogPreview } from "@/components/changelog/changelog-preview";
import {
  changelogDateFormatter,
  changelogSlug,
  sortByDateDesc,
} from "@/lib/changelog";
import { getMDXComponents } from "@/mdx-components";

const DESCRIPTION =
  "Every release of remocn — new components, transitions, shaders, icons, and improvements, newest first.";

export const metadata: Metadata = {
  title: "Changelog",
  description: DESCRIPTION,
  alternates: { canonical: "/changelog" },
  openGraph: {
    type: "website",
    url: "/changelog",
    siteName: "Remocn",
    title: "Changelog · remocn",
    description: DESCRIPTION,
    locale: "en_US",
    images: [
      { url: "/hero.png", width: 1200, height: 675, alt: "Changelog · remocn" },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Changelog · remocn",
    description: DESCRIPTION,
    images: ["/hero.png"],
  },
};

const entryComponents = {
  ...getMDXComponents(),
  ChangelogPreview,
  h3: (props: ComponentProps<"h3">) => <h3 {...props} id={undefined} />,
  h4: (props: ComponentProps<"h4">) => <h4 {...props} id={undefined} />,
};

export default function ChangelogPage() {
  const entries = sortByDateDesc(changelog);

  return (
    <>
      <ChangelogHero active="text" />

      <section className="pb-24">
        <div className="section flex flex-col gap-16">
          {entries.map((entry) => {
            const slug = changelogSlug(entry);
            const iso = entry.date.toISOString().slice(0, 10);
            const MDX = entry.body;

            return (
              <article
                key={slug}
                id={slug}
                className="scroll-mt-24 border-t border-border pt-8 md:grid md:grid-cols-[10rem_1fr] md:gap-8"
              >
                <div className="md:sticky md:top-24 md:self-start">
                  <time
                    dateTime={iso}
                    className="font-mono text-xs font-medium text-muted-foreground"
                  >
                    {changelogDateFormatter.format(entry.date)}
                  </time>
                </div>

                <div className="mt-4 min-w-0 md:mt-0">
                  <div className="flex items-baseline justify-between gap-4">
                    <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                      <a href={`#${slug}`} className="hover:underline">
                        {entry.title}
                      </a>
                    </h2>
                    {entry.video ? (
                      <Link
                        href={`/changelog/video#${slug}`}
                        className="shrink-0 text-sm font-medium text-muted-foreground hover:text-foreground"
                      >
                        Watch
                      </Link>
                    ) : null}
                  </div>
                  <div className="typeset typeset-docs mt-6">
                    <MDX components={entryComponents} />
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </>
  );
}
