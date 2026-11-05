import type { Metadata } from "next";
import { changelog } from "@/.source/server";
import { sitePageOgImage } from "@/config/site-pages";
import {
  changelogDateFormatter,
  changelogSlug,
  sortByDateDesc,
} from "@/lib/changelog";
import { ChangelogHeader } from "../components/changelog-header";
import { ChangelogVideoFeed } from "../components/video-feed";

const DESCRIPTION =
  "Every Remocn release as a short video — new components, transitions, shaders, and icons, newest first.";

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

const shareImage = entries[0]?.videoPoster ?? sitePageOgImage("changelog").url;

export const metadata: Metadata = {
  title: "Changelog in video",
  description: DESCRIPTION,
  alternates: { canonical: "/changelog/video" },
  openGraph: {
    type: "website",
    url: "/changelog/video",
    siteName: "Remocn",
    title: "Changelog in video · Remocn",
    description: DESCRIPTION,
    locale: "en_US",
    images: [{ url: shareImage, alt: "Changelog in video · Remocn" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Changelog in video · Remocn",
    description: DESCRIPTION,
    images: [shareImage],
  },
};

export default function ChangelogVideoPage() {
  return (
    <>
      <ChangelogHeader
        active="video"
        eyebrow={`Changelog, ${entries.length} videos`}
        continuation="Every release, in video."
      />
      <ChangelogVideoFeed entries={entries} />
    </>
  );
}
