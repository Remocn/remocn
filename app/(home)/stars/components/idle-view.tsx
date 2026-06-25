import { FadeUp } from "../../components/fade-up";
import { RepoInputForm } from "./repo-input-form";

export function IdleView({
  inputValue,
  onInputChange,
  onSubmit,
  canGenerate,
  zeroStars,
}: {
  inputValue: string;
  onInputChange: (v: string) => void;
  onSubmit: () => void;
  canGenerate: boolean;
  zeroStars: boolean;
}) {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center text-center">
      <FadeUp delay={0.06} className="flex flex-col items-center">
        <h1 className="max-w-3xl text-balance text-3xl font-semibold leading-[1.1] tracking-tight text-foreground sm:text-4xl md:text-5xl">
          Turn your repo&rsquo;s stars into a video
        </h1>
      </FadeUp>

      <FadeUp delay={0.12}>
        <p className="mt-4 max-w-2xl text-balance text-base leading-relaxed text-muted-foreground sm:text-lg">
          Paste a GitHub repo. We fetch every stargazer and animate it into a
          shareable clip.
        </p>
      </FadeUp>

      <FadeUp delay={0.18} className="w-full">
        <RepoInputForm
          inputValue={inputValue}
          onInputChange={onInputChange}
          onSubmit={onSubmit}
          canGenerate={canGenerate}
        />
      </FadeUp>
    </div>
  );
}
