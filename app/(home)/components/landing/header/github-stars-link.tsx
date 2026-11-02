import Link from "next/link";
import { GITHUB_URL } from "@/config/site";
import { formatStars, getGitHubStars } from "@/lib/github";
import { cn } from "@/lib/utils";
import { GitHubLogoIcon } from "../ui/brand-icons";

/** "GitHub 2.1k": repo link with the live star count (hidden if the API fails). */
export async function GitHubStarsLink({
  className,
  iconClassName = "size-[18px]",
  pill,
}: {
  className?: string;
  iconClassName?: string;
  pill?: string;
}) {
  const stars = await getGitHubStars();
  return (
    <Link
      href={GITHUB_URL}
      target="_blank"
      rel="noreferrer"
      data-track="cta_clicked"
      data-cta="github_header"
      data-destination={GITHUB_URL}
      data-pill={pill}
      className={cn(
        "flex shrink-0 items-center gap-2 text-ui text-foreground-nav outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
    >
      <GitHubLogoIcon className={iconClassName} />
      GitHub
      {stars !== null && (
        <span className="text-muted-foreground tabular-nums">
          {formatStars(stars).toLowerCase()}
        </span>
      )}
    </Link>
  );
}
