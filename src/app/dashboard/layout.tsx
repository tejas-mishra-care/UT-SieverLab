"use client";

import { Header } from "@/components/header";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { HardHat, LayoutDashboard, PlusCircle } from "lucide-react";
import Link from "next/link";
import React from "react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2">
            <SidebarTrigger className="size-8" />
            <div className="flex items-center gap-2 group-data-[collapsible=icon]:-ml-8 group-data-[collapsible=icon]:opacity-0 transition-all duration-200">
                <div className="p-1.5 rounded-lg bg-primary text-primary-foreground">
                    <HardHat className="h-5 w-5" />
                </div>
                <h1 className="font-headline text-xl font-bold text-sidebar-foreground">
                    SieveLab
                </h1>
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Dashboard">
                  <Link href="/dashboard">
                    <LayoutDashboard />
                    <span>Dashboard</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="New Test">
                  <Link href="/dashboard/new-test">
                    <PlusCircle />
                    <span>New Test</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <Header />
        <main className="flex-1 overflow-auto p-4 sm:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
