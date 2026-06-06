import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { formatStars } from "@/lib/github";

/** Inline "we sampled a subset" notice shown for very-high-star repos. */
export function TruncatedNotice({
  truncated,
  totalStars,
}: {
  truncated: boolean;
  totalStars: number;
}) {
  if (!truncated) return null;

  return (
    <Alert className="mb-4">
      <AlertTitle>Showing a sample</AlertTitle>
      <AlertDescription>
        This repo has {formatStars(totalStars)} stars — the clip animates an
        evenly sampled subset for a smooth render.
      </AlertDescription>
    </Alert>
  );
}
