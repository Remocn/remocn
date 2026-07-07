import { Menu } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { NAV_LINKS } from "@/config/site";
import { cn } from "@/lib/utils";
import { GithubButton } from "./github-button";
import { NavMobile } from "./header-nav";
import { StarsButton } from "./stars-button";
import { ThemeToggle } from "./theme-toggle";

export function HeaderLogo() {
  return (
    <Link
      href="/"
      className="flex items-center gap-2 text-lg font-semibold tracking-tight text-foreground focus-visible:outline-none"
    >
      <Image
        src="/logo.svg"
        alt="remocn logo"
        width={24}
        height={24}
        priority
        className="rounded-md"
      />
      remocn
    </Link>
  );
}

export function HeaderActions() {
  return (
    <div className="flex items-center gap-2">
      <div className="hidden sm:block">
        <StarsButton />
      </div>
      <div className="hidden sm:block">
        <GithubButton />
      </div>
      <ThemeToggle />

      <Sheet>
        <SheetTrigger
          render={
            <Button
              variant="outline"
              size="icon"
              className="rounded-full sm:hidden"
              aria-label="Open menu"
            />
          }
        >
          <Menu className="size-4" aria-hidden="true" />
        </SheetTrigger>
        <SheetContent side="right" className="bg-background">
          <SheetHeader>
            <SheetTitle>Menu</SheetTitle>
          </SheetHeader>
          <NavMobile links={NAV_LINKS} />
          <div className="mt-4 flex flex-col gap-4 px-6 pb-6">
            <SheetClose
              render={<StarsButton className="w-full justify-center" />}
            />
            <GithubButton />
            <SheetClose
              render={
                <Link
                  href="/docs/getting-started/introduction"
                  className={cn(
                    buttonVariants({ size: "lg" }),
                    "h-11 w-full rounded-full",
                  )}
                />
              }
            >
              Get started
            </SheetClose>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
