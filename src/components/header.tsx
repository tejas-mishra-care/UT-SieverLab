
import { SidebarTrigger } from "@/components/ui/sidebar";
import { UserNav } from "./user-nav";

export function Header() {
  return (
    <header className="sticky top-0 z-10 flex h-14 w-full items-center justify-between gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="flex md:hidden" />
        <SidebarTrigger className="hidden md:flex" />
        <h1 className="font-headline text-xl font-semibold">SieveLab</h1>
      </div>
      <UserNav />
    </header>
  );
}
