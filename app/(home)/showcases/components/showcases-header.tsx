import { SUPPORT_EMAIL } from "@/config/site";
import { cn } from "@/lib/utils";
import { formatDuration } from "@/lib/video-duration";
import { landingButtonVariants } from "../../components/landing/ui/landing-button";
import {
  pageHeaderButton,
  SitePageHeader,
} from "../../components/site-page/page-header";

export const SHOWCASES_DESCRIPTION =
  "Videos made with Remocn, real products and launches, animated with copy-paste Remotion components. Scrub the reel, see which blocks each one used.";

/** Where new showcase videos are sent until there is a submission form. */
export const SUBMIT_SHOWCASE_URL = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent("Showcase submission")}`;

const BUTTON = "max-xl:h-12 max-xl:flex-1";

export function ShowcasesHeader({
  clips,
  total,
}: {
  clips: number;
  total: number;
}) {
  return (
    <SitePageHeader
      eyebrow={`Showcases, ${clips} clips, ${formatDuration(total)} total`}
      title="Made with remocn."
      continuation="Every launch on one timeline."
      lead={SHOWCASES_DESCRIPTION}
      className="xl:pt-24 xl:pb-12"
    >
      <div className="flex gap-2.5">
        <a
          href={SUBMIT_SHOWCASE_URL}
          className={cn(
            landingButtonVariants({ variant: "ink" }),
            pageHeaderButton,
            BUTTON,
          )}
        >
          Submit your video
          <span
            aria-hidden="true"
            className="text-primary-soft dark:text-primary"
          >
            →
          </span>
        </a>
        <a
          href="/docs/getting-started/introduction"
          className={cn(
            landingButtonVariants({ variant: "secondary" }),
            pageHeaderButton,
            BUTTON,
          )}
        >
          Start building
        </a>
      </div>
    </SitePageHeader>
  );
}
