import { INSTALL_ALL_COMMAND } from "@/config/site";
import { convertNpmCommand } from "@/lib/convert-npm-command";
import { cn } from "@/lib/utils";
import { BLOCK_SPACING } from "./blocks/spacing";
import { CodeBlockCommand } from "./code-block-command";

export function InstallAll() {
  return (
    <div className={cn("not-prose", BLOCK_SPACING)}>
      <CodeBlockCommand
        component="all"
        prompt="Add every remocn component to my project."
        {...convertNpmCommand(INSTALL_ALL_COMMAND)}
      />
    </div>
  );
}
