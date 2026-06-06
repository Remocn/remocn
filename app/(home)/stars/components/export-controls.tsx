import { Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

/** Download MP4 button; while a server render runs it becomes a progress bar +
 *  cancel. Server renders for every browser, so there's no unsupported state. */
export function ExportControls({
  exporting,
  exportProgress,
  onDownload,
  onCancelExport,
}: {
  exporting: boolean;
  exportProgress: number;
  onDownload: () => void;
  onCancelExport: () => void;
}) {
  if (exporting) {
    return (
      <div className="flex w-full items-center gap-3 sm:w-72">
        <Progress
          value={Math.round(exportProgress * 100)}
          className="flex-1"
        />
        <Button
          variant="ghost"
          size="icon"
          onClick={onCancelExport}
          aria-label="Cancel export"
          className="rounded-full"
        >
          <X className="size-4" />
        </Button>
      </div>
    );
  }

  return (
    <Button size="lg" onClick={onDownload} className="gap-2 rounded-full">
      <Download className="size-4" aria-hidden="true" />
      Download MP4
    </Button>
  );
}
