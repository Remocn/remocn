import { formatStars } from "@/lib/github";

/** Centered repo heading + star count. */
export function RepoTitle({
  repo,
  totalStars,
}: {
  repo: string;
  totalStars: number;
}) {
  return (
    <div className="mb-4 text-center">
      <h2 className="truncate text-xl font-semibold tracking-tight text-foreground sm:text-4xl">
        {repo}
      </h2>
      <p className="mt-0.5 text-sm text-muted-foreground">
        {formatStars(totalStars)} stars
      </p>
    </div>
  );
}
