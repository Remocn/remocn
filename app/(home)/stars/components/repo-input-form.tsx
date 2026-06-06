import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function RepoInputForm({
  inputValue,
  onInputChange,
  onSubmit,
  canGenerate,
}: {
  inputValue: string;
  onInputChange: (v: string) => void;
  onSubmit: () => void;
  canGenerate: boolean;
}) {
  return (
    <form
      className="mt-7 flex flex-col items-center gap-3 sm:flex-row sm:justify-center"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <Input
        value={inputValue}
        onChange={(e) => onInputChange(e.target.value)}
        aria-label="GitHub repository"
        placeholder="github.com/owner/repo or owner/repo"
        className="h-11 w-full rounded-full px-5 sm:max-w-sm"
      />
      <Button
        type="submit"
        size="lg"
        disabled={!canGenerate}
        className="h-11 gap-2 rounded-full px-6"
      >
        Generate
        <ArrowRight className="size-4" aria-hidden="true" />
      </Button>
    </form>
  );
}
