import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useGenerationTicker } from "../hooks/use-generation-ticker";
import { AvatarChips } from "./avatar-chips";

export function GeneratingView({
  reduced,
  onCancel,
}: {
  reduced: boolean;
  onCancel: () => void;
}) {
  const { progress, count } = useGenerationTicker(reduced);

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center">
      <div className="surface-card mx-auto w-full max-w-xl rounded-3xl p-8">
        <AvatarChips reduced={reduced} />

        <div className="mt-6">
          <Progress value={progress} />
        </div>

        <p className="mt-4 text-center text-sm font-medium text-foreground">
          Fetching stargazers…{" "}
          <span className="tabular-nums text-muted-foreground">
            {count.toLocaleString("en-US")}
          </span>
        </p>

        <div className="mt-6 flex justify-center">
          <Button variant="ghost" onClick={onCancel} className="rounded-full">
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
