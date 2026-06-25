import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { orientationToParam } from "../lib/dims";
import type { Orientation } from "../lib/types";

export function OrientationToggle({
  orientation,
  onOrientationChange,
}: {
  orientation: Orientation;
  onOrientationChange: (o: Orientation) => void;
}) {
  return (
    <ToggleGroup
      value={[orientationToParam(orientation)]}
      onValueChange={(value: string[]) => {
        const next = value[0];
        if (next)
          onOrientationChange(next === "v" ? "vertical" : "horizontal");
      }}
      aria-label="Video orientation"
      className="w-full sm:w-auto"
    >
      <ToggleGroupItem value="h" className="flex-1 sm:flex-none">
        Horizontal
      </ToggleGroupItem>
      <ToggleGroupItem value="v" className="flex-1 sm:flex-none">
        Vertical
      </ToggleGroupItem>
    </ToggleGroup>
  );
}
