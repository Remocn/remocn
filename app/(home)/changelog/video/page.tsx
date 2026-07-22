import type { Metadata } from "next";
import { changelog } from "@/.source/server";
import { ChangelogHero } from "@/components/changelog/changelog-hero";
import { ChangelogVideoFeed } from "@/components/changelog/changelog-video-feed";
import {
  changelogDateFormatter,
  changelogSlug,
  sortByDateDesc,
} from "@/lib/changelog";

const DESCRIPTION =
  "Every remocn release as a short video — new components, transitions, shaders, and icons, newest first.";

const entries = sortByDateDesc(changelog).flatMap((entry) =>
  entry.video
    ? [
        {
          slug: changelogSlug(entry),
          title: entry.title,
          iso: entry.date.toISOString().slice(0, 10),
          formattedDate: changelogDateFormatter.format(entry.date),
          video: entry.video,
          videoPoster: entry.videoPoster,
        },
      ]
    : [],
);

const shareImage = entries[0]?.videoPoster ?? "/hero.png";

export const metadata: Metadata = {
  title: "Changelog in video",
  description: DESCRIPTION,
  openGraph: {
    type: "website",
    url: "/changelog/video",
    siteName: "Remocn",
    title: "Changelog in video · remocn",
    description: DESCRIPTION,
    locale: "en_US",
    images: [{ url: shareImage, alt: "Changelog in video · remocn" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Changelog in video · remocn",
    description: DESCRIPTION,
    images: [shareImage],
  },
};

export default function ChangelogVideoPage() {
  return (
    <>
      <ChangelogHero active="video" />
      <section className="pb-24">
        <ChangelogVideoFeed entries={entries} />
      </section>
    </>
  );
}
