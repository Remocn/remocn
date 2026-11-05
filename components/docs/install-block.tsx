import { convertNpmCommand } from "@/lib/convert-npm-command";
import { cn } from "@/lib/utils";
import { BLOCK_SPACING } from "./blocks/spacing";
import { CodeBlockCommand } from "./code-block-command";

export function InstallBlock({ name }: { name: string }) {
  const npmCommand = `npx shadcn@latest add @remocn/${name}`;
  return (
    <div
      id="installation"
      className={cn("not-prose scroll-mt-24", BLOCK_SPACING)}
    >
      <CodeBlockCommand
        title="Installation"
        component={name}
        prompt={`Add the @remocn/${name} component to my project.`}
        {...convertNpmCommand(npmCommand)}
      />
    </div>
  );
}
