
"use client";

import { Header } from "@/components/header";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarSeparator,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { useUser } from "@/firebase";
import { LayoutDashboard, Linkedin, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect } from "react";
import Image from "next/image";

const InstagramIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push("/");
    }
  }, [user, isUserLoading, router]);

  if (isUserLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <SidebarProvider defaultOpen={false}>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2">
            <SidebarTrigger className="size-8" />
            <div className="flex items-center gap-2 group-data-[collapsible=icon]:-ml-8 group-data-[collapsible=icon]:opacity-0 transition-all duration-200">
                <div className="h-8 w-8">
                    <Image src="/UT.jpeg" alt="UT Logo" width={32} height={32} className="rounded-md" />
                </div>
                <h1 className="font-headline text-lg font-bold text-sidebar-foreground">
                    UltraTech Sieve Test Master
                </h1>
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Calculator">
                  <Link href="/dashboard/new-test">
                    <LayoutDashboard />
                    <span>Calculator</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
            <SidebarSeparator />
            <SidebarGroup>
                <div className="px-2 text-xs text-sidebar-foreground/70 group-data-[collapsible=icon]:hidden">
                    Created by TEJAS MISHRA
                </div>
                <div className="flex items-center justify-center gap-2 group-data-[collapsible=icon]:flex-col">
                    <a href="https://www.linkedin.com/in/tejasmishra-/" target="_blank" rel="noopener noreferrer" className="text-sidebar-foreground/70 hover:text-sidebar-foreground">
                        <Linkedin className="h-5 w-5" />
                    </a>
                    <a href="https://www.instagram.com/_tejasmishra_/" target="_blank" rel="noopener noreferrer" className="text-sidebar-foreground/70 hover:text-sidebar-foreground">
                        <InstagramIcon className="h-5 w-5" />
                    </a>
                </div>
            </SidebarGroup>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <Header />
        <main className="flex-1 overflow-auto p-4 sm:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
