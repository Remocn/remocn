import { GITHUB_URL } from "@/config/site";
import { formatStars, getGitHubStars } from "@/lib/github";
import { Star } from "lucide-react";
import Link from "next/link";

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
      className="inline-flex h-9 items-center gap-2 rounded-full border border-border px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
    >
      <GitHubIcon className="size-4" />
      <span className="hidden sm:inline">Star</span>
      {stars !== null && (
        <span className="inline-flex items-center gap-1 tabular-nums text-foreground">
          <Star className="size-3.5 fill-current" />
          {formatStars(stars)}
        </span>
      )}
    </Link>
  );
}

const GitHubIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    className={className}
    fill="currentColor"
    role="img"
    aria-label="GitHub"
  >
    <title>GitHub</title>
    <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56 0-.27-.01-1-.02-1.96-3.2.69-3.87-1.54-3.87-1.54-.52-1.33-1.28-1.69-1.28-1.69-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.71 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.47.11-3.06 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.79 0c2.21-1.49 3.18-1.18 3.18-1.18.63 1.59.23 2.77.11 3.06.74.81 1.19 1.84 1.19 3.1 0 4.44-2.7 5.41-5.27 5.7.41.36.78 1.06.78 2.14 0 1.55-.01 2.8-.01 3.18 0 .31.21.68.8.56C20.21 21.39 23.5 17.08 23.5 12 23.5 5.65 18.35.5 12 .5Z" />
  </svg>
);
