import type { Showcase } from "@/lib/showcases";
import { cn } from "@/lib/utils";

export function ShowcaseAuthor({
  author,
  linked = false,
  className,
}: {
  author: Showcase["author"];
  linked?: boolean;
  className?: string;
}) {
  const body = (
    <>
      <img
        src={author.avatarUrl}
        alt=""
        width={24}
        height={24}
        loading="lazy"
        referrerPolicy="no-referrer"
        className="size-6 shrink-0 rounded-full bg-muted object-cover"
      />
      <span className="truncate">{author.name}</span>
    </>
  );

  const shared = cn(
    "inline-flex min-w-0 items-center gap-2 text-sm text-muted-foreground",
    className,
  );

  if (linked && author.url) {
    return (
      <a
        href={author.url}
        target="_blank"
        rel="noreferrer"
        className={cn(shared, "transition-colors hover:text-foreground")}
      >
        {body}
      </a>
    );
  }

  return <span className={shared}>{body}</span>;
}
