import { X_SEARCH_URL } from "@/config/x-posts";
import { XLogoIcon } from "../../ui/brand-icons";
import { LandingButton } from "../../ui/landing-button";

export function WallFooter() {
  return (
    <div data-reveal className="-mt-5 flex items-center gap-4">
      <LandingButton
        href={X_SEARCH_URL}
        target="_blank"
        rel="noreferrer"
        variant="secondary"
        size="md"
      >
        <XLogoIcon className="size-3.5" />
        Read all posts
      </LandingButton>
      <p className="text-[15px] text-muted-foreground leading-[18px]">
        123 builders have posted about remocn since April
      </p>
    </div>
  );
}
