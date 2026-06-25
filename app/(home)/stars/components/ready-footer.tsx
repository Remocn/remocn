import { BookOpen, RotateCcw } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { InstallCommand } from "../../components/install-command";
import { DOCS_HREF, INSTALL_COMMAND } from "../lib/constants";
import { ExportControls } from "./export-controls";

/** Footer row: install advert + docs link on the left, reset + export on the right. */
export function ReadyFooter({
  onReset,
  exporting,
  exportProgress,
  onDownload,
  onCancelExport,
}: {
  onReset: () => void;
  exporting: boolean;
  exportProgress: number;
  onDownload: () => void;
  onCancelExport: () => void;
}) {
  return (
    <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
        <InstallCommand command={INSTALL_COMMAND} />
        <Button
          variant="outline"
          size="lg"
          className="h-11 gap-2 rounded-full"
          render={<Link href={DOCS_HREF} />}
        >
          <BookOpen className="size-4" aria-hidden="true" />
          View component docs
        </Button>
      </div>

      <div className="flex items-center justify-end gap-2">
        <Button
          variant="ghost"
          size="lg"
          onClick={onReset}
          className="gap-2 rounded-full"
        >
          <RotateCcw className="size-4" aria-hidden="true" />
          Change repository
        </Button>
        <ExportControls
          exporting={exporting}
          exportProgress={exportProgress}
          onDownload={onDownload}
          onCancelExport={onCancelExport}
        />
      </div>
    </div>
  );
}
