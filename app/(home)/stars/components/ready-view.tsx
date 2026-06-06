import { Settings2 } from "lucide-react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { SPRING_BOUNCE } from "@/config/site";
import type { RegistryEntry } from "@/registry/__index__";
import type { GitHubStarsInputProps, Orientation } from "../lib/types";
import { CustomizerPanel } from "./customizer-panel";
import { OrientationToggle } from "./orientation-toggle";
import { PlayerFrame } from "./player-frame";
import { ReadyFooter } from "./ready-footer";
import { RepoTitle } from "./repo-title";
import { TruncatedNotice } from "./truncated-notice";

export function ReadyView({
  entry,
  inputProps,
  repo,
  totalStars,
  truncated,
  reduced,
  orientation,
  onOrientationChange,
  onReset,
  showCustomizer,
  onToggleCustomizer,
  customValues,
  onCustomChange,
  exporting,
  exportProgress,
  onDownload,
  onCancelExport,
}: {
  entry: RegistryEntry;
  inputProps: GitHubStarsInputProps;
  repo: string;
  totalStars: number;
  truncated: boolean;
  reduced: boolean;
  orientation: Orientation;
  onOrientationChange: (o: Orientation) => void;
  onReset: () => void;
  showCustomizer: boolean;
  onToggleCustomizer: () => void;
  customValues: Record<string, unknown>;
  onCustomChange: (key: string, value: unknown) => void;
  exporting: boolean;
  exportProgress: number;
  onDownload: () => void;
  onCancelExport: () => void;
}) {
  return (
    // Constant width regardless of orientation — the preview frame stays
    // put when toggling horizontal/vertical (refinement #3).
    <div className="mx-auto max-w-5xl">
      <TruncatedNotice truncated={truncated} totalStars={totalStars} />

      <motion.div
        initial={reduced ? false : { y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ ...SPRING_BOUNCE, delay: 0.05 }}
      >
        <RepoTitle repo={repo} totalStars={totalStars} />

        {/* Controls bar */}
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <OrientationToggle
            orientation={orientation}
            onOrientationChange={onOrientationChange}
          />

          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleCustomizer}
            aria-expanded={showCustomizer}
            className="gap-2 rounded-full"
          >
            <Settings2 className="size-4" aria-hidden="true" />
            Customize
          </Button>
        </div>

        <PlayerFrame
          entry={entry}
          inputProps={inputProps}
          orientation={orientation}
          reduced={reduced}
        />

        <CustomizerPanel
          show={showCustomizer}
          values={customValues}
          onChange={onCustomChange}
        />

        <ReadyFooter
          onReset={onReset}
          exporting={exporting}
          exportProgress={exportProgress}
          onDownload={onDownload}
          onCancelExport={onCancelExport}
        />
      </motion.div>
    </div>
  );
}
