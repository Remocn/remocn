import Link from "next/link";
import { GITHUB_URL } from "@/config/site";
import { formatStars, getGitHubStars } from "@/lib/github";
import { GitHubIcon } from "./github-icon";

export async function GithubButton() {
  const stars = await getGitHubStars();
  return (
    <Link
      href={GITHUB_URL}
      target="_blank"
      rel="noreferrer"
      data-track="cta_clicked"
      data-cta="github_header"
      data-destination={GITHUB_URL}
      className="inline-flex h-9 items-center gap-2 rounded-full  border-border px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
    >
      <GitHubIcon className="size-4" />
      {stars !== null && (
        <span className="inline-flex items-center gap-1 tabular-nums text-foreground">
          {formatStars(stars)}
        </span>
      )}
    </Link>
  );
}
