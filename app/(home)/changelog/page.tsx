import type { Metadata } from "next";
import type { ComponentProps } from "react";
import { changelog } from "@/.source/server";
import { SITE_PAGES, sitePageOgImage } from "@/config/site-pages";
import {
  changelogDateFormatter,
  changelogSlug,
  sortByDateDesc,
} from "@/lib/changelog";
import { getMDXComponents } from "@/mdx-components";
import { ChangelogEntry, EntryActionLink } from "./components/changelog-entry";
import { ChangelogHeader } from "./components/changelog-header";
import { ChangelogPreview } from "./components/changelog-preview";

const DESCRIPTION = SITE_PAGES.changelog.description;

export const metadata: Metadata = {
  title: "Changelog",
  description: DESCRIPTION,
  alternates: { canonical: "/changelog" },
  openGraph: {
    type: "website",
    url: "/changelog",
    siteName: "Remocn",
    title: "Changelog · Remocn",
    description: DESCRIPTION,
    locale: "en_US",
    images: [sitePageOgImage("changelog")],
  },
  twitter: {
    card: "summary_large_image",
    title: "Changelog · Remocn",
    description: DESCRIPTION,
    images: [sitePageOgImage("changelog").url],
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
      <ChangelogHeader
        active="text"
        eyebrow={`Changelog, ${entries.length} releases`}
        continuation="Every release, newest first."
      />

      <section className="landing-container pb-16 xl:pb-[120px]">
        {entries.map((entry) => {
          const slug = changelogSlug(entry);
          const MDX = entry.body;

          return (
            <ChangelogEntry
              key={slug}
              slug={slug}
              iso={entry.date.toISOString().slice(0, 10)}
              formattedDate={changelogDateFormatter.format(entry.date)}
              title={entry.title}
              action={
                entry.video ? (
                  <EntryActionLink
                    href={`/changelog/video#${slug}`}
                    className="mt-0.5"
                  >
                    Watch
                  </EntryActionLink>
                ) : null
              }
            >
              <div className="typeset typeset-docs mt-6">
                <MDX components={entryComponents} />
              </div>
            </ChangelogEntry>
          );
        })}
      </section>
    </>
  );
}
