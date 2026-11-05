import type { Metadata } from "next";
import Link from "next/link";
import { LandingButton } from "../components/landing/ui/landing-button";
import {
  pageHeaderButton,
  SitePageHeader,
} from "../components/site-page/page-header";

const STARWALL_URL = "https://starwall.radiumcoders.com/";
const AUTHOR_X_URL = "https://x.com/radiumcoders";

const TITLE = "GitHub Stars Video Generator · Remocn";
const DESCRIPTION =
  "Turn your repo's stars into a shareable animated video. Paste a GitHub repo and we animate every stargazer into a clip you can own.";

export const metadata: Metadata = {
  title: "GitHub Stars Video Generator",
  description: DESCRIPTION,
  alternates: { canonical: "/stars" },
  openGraph: {
    type: "website",
    url: "/stars",
    siteName: "Remocn",
    title: TITLE,
    description: DESCRIPTION,
    locale: "en_US",
    images: [{ url: "/hero.png", width: 1200, height: 675, alt: TITLE }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/hero.png"],
  },
};

export default function StarsPage() {
  return (
    <SitePageHeader
      eyebrow="GitHub stars video"
      title="GitHub turned off"
      continuation="the public stargazers API."
      lead={
        <>
          Reading stargazers now requires authentication, so this tool can no
          longer build your video.{" "}
          <Link
            href={STARWALL_URL}
            target="_blank"
            rel="noreferrer"
            className="-mx-1 rounded-tag px-1 text-foreground transition-colors hover:bg-muted"
          >
            Starwall
          </Link>{" "}
          by Jay does it for you.
        </>
      }
      className="pb-16 md:pb-24 xl:pb-[120px]"
    >
      <div className="flex flex-col gap-4">
        <LandingButton
          href={STARWALL_URL}
          target="_blank"
          rel="noreferrer"
          arrow="↗"
          className={`${pageHeaderButton} w-full md:w-fit`}
        >
          Open Starwall
        </LandingButton>
        <p className="text-small text-muted-foreground">
          Starwall is built entirely by{" "}
          <Link
            href={AUTHOR_X_URL}
            target="_blank"
            rel="noreferrer"
            className="-mx-1 rounded-tag px-1 text-foreground transition-colors hover:bg-muted"
          >
            @radiumcoders
          </Link>
        </p>
      </div>
    </SitePageHeader>
  );
}
