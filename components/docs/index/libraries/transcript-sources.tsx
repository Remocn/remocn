export type TranscriptSource = {
  title: string;
  body: string;
  /** Package or helper that produces the Caption[] from this source. */
  code: string;
};

/** Captions overview: the speech-to-text sources that feed a caption. */
export function TranscriptSources({
  title,
  note,
  sources,
}: {
  title: string;
  note?: string;
  sources: TranscriptSource[];
}) {
  return (
    <div className="not-prose mt-4 flex flex-col rounded-card border border-hairline bg-surface p-2">
      <div className="flex min-h-11 flex-wrap items-center justify-between gap-x-4 gap-y-0.5 px-3 py-2">
        <span className="text-[15px] leading-[22px] font-medium text-foreground">
          {title}
        </span>
        {note && (
          <span className="text-caption leading-4 text-muted-foreground">
            {note}
          </span>
        )}
      </div>
      <ul>
        {sources.map((source) => (
          <li
            key={source.title}
            className="flex flex-col gap-2 border-t border-hairline px-3 py-3 sm:min-h-[60px] sm:flex-row sm:items-center sm:gap-4 sm:py-2"
          >
            <span className="flex grow flex-col gap-0.5">
              <span className="text-small font-medium text-foreground">
                {source.title}
              </span>
              <span className="text-caption leading-[18px] text-muted-foreground">
                {source.body}
              </span>
            </span>
            <code className="flex h-[30px] w-fit shrink-0 items-center rounded-tile bg-surface-muted px-2.5 font-mono text-mono leading-4 text-body">
              {source.code}
            </code>
          </li>
        ))}
      </ul>
    </div>
  );
}
