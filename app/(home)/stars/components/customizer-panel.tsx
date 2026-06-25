import { ComponentCustomizer } from "@/components/docs/component-customizer";
import { CUSTOM_CONTROLS } from "../lib/constants";

/** Optional customizer panel (scalar inputProps). Hidden unless `show`. */
export function CustomizerPanel({
  show,
  values,
  onChange,
}: {
  show: boolean;
  values: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
}) {
  if (!show) return null;

  return (
    <div className="mt-4">
      <ComponentCustomizer
        controls={CUSTOM_CONTROLS}
        values={values}
        onChange={onChange}
      />
    </div>
  );
}
