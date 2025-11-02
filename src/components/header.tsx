
import { SidebarTrigger } from "@/components/ui/sidebar";
import Image from "next/image";

export function Header() {
  return (
    <header className="sticky top-0 z-10 flex h-16 w-full items-center justify-between gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="flex md:hidden" />
        <SidebarTrigger className="hidden md:flex" />
        <Image src="/UT.jpeg?v=3" alt="UT Logo" width={50} height={50} className="rounded-md" />
      </div>
      <h1 className="font-headline text-xl font-semibold whitespace-nowrap">UltraTech Sieve Test Master</h1>
      <div className="flex items-center gap-4">
        <Image src="/ABG.jpeg?v=3" alt="ABG Logo" width={50} height={40} className="rounded-md" />
      </div>
    </header>
  );
}
