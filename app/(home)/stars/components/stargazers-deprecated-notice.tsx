import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { cn } from "@/lib/utils";

const STARWALL_URL = "https://starwall.radiumcoders.com/";
const AUTHOR_X_URL = "https://x.com/radiumcoders";

export function StargazersDeprecatedNotice() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center">
      <Empty className="max-w-xl gap-6">
        <EmptyHeader className="max-w-md gap-3">
          <EmptyMedia className="mb-1">
            <GitHubIcon className="size-10 text-muted-foreground" />
          </EmptyMedia>
          <EmptyTitle className="text-2xl tracking-tight text-balance sm:text-3xl">
            GitHub turned off the public stargazers API
          </EmptyTitle>
          <EmptyDescription className="max-w-[52ch] text-base text-pretty">
            Reading stargazers now requires authentication, so this tool can no
            longer build your video.{" "}
            <Link href={STARWALL_URL} target="_blank" rel="noreferrer">
              Starwall
            </Link>{" "}
            by Jay does it for you.
          </EmptyDescription>
        </EmptyHeader>

        <EmptyContent className="gap-3">
          <Link
            href={STARWALL_URL}
            target="_blank"
            rel="noreferrer"
            className={cn(buttonVariants({ size: "lg" }), "w-full py-2 pr-3 pl-4")}
          >
            Open Starwall
            <ArrowUpRight className="size-4" />
          </Link>

          <p className="text-sm text-muted-foreground">
            Starwall is built entirely by {" "}
            <Link
              href={AUTHOR_X_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 font-medium text-foreground underline underline-offset-4 hover:text-primary"
            >
              @radiumcoders
            </Link>
          </p>
        </EmptyContent>
      </Empty>
    </div>
  );
}

const GitHubIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    className={cn("shrink-0", className)}
    fill="currentColor"
    role="img"
    aria-label="GitHub"
  >
    <title>GitHub</title>
    <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56 0-.27-.01-1-.02-1.96-3.2.69-3.87-1.54-3.87-1.54-.52-1.33-1.28-1.69-1.28-1.69-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.71 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.47.11-3.06 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.79 0c2.21-1.49 3.18-1.18 3.18-1.18.63 1.59.23 2.77.11 3.06.74.81 1.19 1.84 1.19 3.1 0 4.44-2.7 5.41-5.27 5.7.41.36.78 1.06.78 2.14 0 1.55-.01 2.8-.01 3.18 0 .31.21.68.8.56C20.21 21.39 23.5 17.08 23.5 12 23.5 5.65 18.35.5 12 .5Z" />
  </svg>
);

const XIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    className={cn("shrink-0", className)}
    fill="currentColor"
    role="img"
    aria-label="X"
  >
    <title>X</title>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);
