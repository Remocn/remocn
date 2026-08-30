import {
  Frame,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/components/ui/frame";

export interface PropDef {
  name: string;
  type: string;
  default?: string;
  required?: boolean;
  description: string;
}

export function PropsTable({
  rows,
  title,
}: {
  rows: PropDef[];
  title?: string;
}) {
  return (
    <Frame
      id={title ? title.toLowerCase() : undefined}
      className="not-prose my-6 max-w-4xl"
    >
      {title && (
        <FrameHeader className="flex-row items-center px-3 py-2.5">
          <FrameTitle>{title}</FrameTitle>
        </FrameHeader>
      )}
      <FramePanel className="overflow-hidden p-0">
        <div
          // biome-ignore lint/a11y/noNoninteractiveTabindex: horizontally scrollable table must be keyboard-focusable
          tabIndex={0}
          className="overflow-x-auto"
        >
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-border/60">
                <th className="px-4 py-2.5 text-left font-medium text-foreground">
                  Prop
                </th>
                <th className="px-4 py-2.5 text-left font-medium text-foreground">
                  Type
                </th>
                <th className="px-4 py-2.5 text-left font-medium text-foreground">
                  Default
                </th>
                <th className="px-4 py-2.5 text-left font-medium text-foreground">
                  Description
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr
                  key={row.name}
                  className={
                    i === rows.length - 1
                      ? "align-top transition-colors hover:bg-muted/40"
                      : "border-b border-border/40 align-top transition-colors hover:bg-muted/40"
                  }
                >
                  <td className="px-4 py-3 align-top">
                    <div className="flex items-center gap-1.5">
                      <code className="font-mono text-xs text-foreground">
                        {row.name}
                      </code>
                      {row.required && (
                        <span className="rounded bg-foreground/5 px-1.5 py-0.5 font-mono text-[10px] font-medium text-foreground/70">
                          required
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <code className="font-mono text-xs text-muted-foreground/90">
                      {row.type}
                    </code>
                  </td>
                  <td className="px-4 py-3 align-top">
                    {row.default ? (
                      <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">
                        {row.default}
                      </code>
                    ) : (
                      <span className="font-mono text-xs text-muted-foreground/60">
                        —
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {row.description}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </FramePanel>
    </Frame>
  );
}
