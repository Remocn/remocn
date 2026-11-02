/**
 * The chip row under "What makes this different": the browser-UI wiring a
 * primitive never uses, struck out, then the one thing it reads.
 */
export function RuntimeRules({ not, only }: { not: string[]; only: string }) {
  return (
    <ul
      data-not-typeset
      className="not-prose mt-5 flex flex-wrap gap-2"
      aria-label="What a primitive reads"
    >
      {not.map((name) => (
        <li
          key={name}
          className="flex h-9 items-center gap-2 rounded-[10px] bg-secondary px-3.5"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="size-3.5 shrink-0 fill-none stroke-muted-foreground stroke-2 [stroke-linecap:round]"
          >
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
          <span className="sr-only">Not</span>
          <code className="font-mono text-caption leading-4 text-foreground">
            {name}
          </code>
        </li>
      ))}
      <li className="flex h-9 items-center gap-2 rounded-[10px] bg-foreground px-3.5">
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="size-3.5 shrink-0 fill-none stroke-primary-soft stroke-2 [stroke-linecap:round] [stroke-linejoin:round] dark:stroke-primary"
        >
          <path d="m5 12.5 4.5 4.5L19 7.5" />
        </svg>
        <code className="font-mono text-caption leading-4 text-background">
          {only}
        </code>
      </li>
    </ul>
  );
}
