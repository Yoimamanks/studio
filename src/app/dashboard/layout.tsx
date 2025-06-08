"use client";

import React, { type ReactNode } from "react";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/firebase/auth";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { History, LogOut, MessageSquarePlus } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Spinner } from "@/components/ui/spinner";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    try {
      await signOut();
      router.push("/login"); // Redirect to login after sign out
    } catch (error) {
      console.error("Logout failed", error);
      // Optionally show a toast message for logout failure
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Spinner className="h-10 w-10 text-primary" />
      </div>
    );
  }
  
  // AuthProvider handles redirection if !user and on dashboard page.
  // This is a fallback or ensures content isn't rendered before redirection is complete.
  if (!user) {
     return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="mr-2">Redirecting to login...</p>
        <Spinner className="h-8 w-8 text-primary" />
      </div>
    );
  }
  
  const getInitials = (email: string | null | undefined) => {
    if (!email) return "ZS";
    const namePart = email.split("@")[0];
    if (namePart.includes('.')) {
      return namePart.split('.').map(p => p[0]).slice(0,2).join("").toUpperCase();
    }
    return namePart.substring(0, 2).toUpperCase();
  }

  return (
    <SidebarProvider defaultOpen>
      <div className="flex min-h-screen bg-background">
        <Sidebar side="left" variant="sidebar" collapsible="icon" className="border-r border-sidebar-border">
          <SidebarHeader className="p-4 flex justify-center group-data-[collapsible=icon]:py-4">
            <Link href="/dashboard" className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" className="h-8 w-8 flex-shrink-0">
                    <rect width="256" height="256" fill="none"></rect>
                    <path d="M88,134.2l-32.5,65.1a8,8,0,0,0,7.1,11.3A7.7,7.7,0,0,0,68,210l40-20,40,20a7.7,7.7,0,0,0,5.4.6,8,8,0,0,0,7.1-11.3L168,134.2V48a8,8,0,0,0-16,0v80a8,8,0,0,0,8,8h0a8,8,0,0,1,0,16H80a8,8,0,0,1,0-16h0a8,8,0,0,0,8-8V48a8,8,0,0,0-16,0Z" className="fill-primary"></path>
                    <path d="M218.2,174.0l-20-40a8.2,8.2,0,0,0-7.1-4H160a8,8,0,0,0-8,8v40a8,8,0,0,0,8,8h31.1a8,8,0,0,0,7.1-4l20-40A8.1,8.1,0,0,0,218.2,174.0ZM176,172V148h15.5l-10,20Z" className="fill-accent"></path>
                 </svg>
                <h1 className="font-headline text-2xl font-semibold group-data-[collapsible=icon]:hidden">
                 ZScraper
                </h1>
            </Link>
          </SidebarHeader>
          <SidebarContent className="p-2">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === "/dashboard/new-chat"}
                  tooltip={{ children: "New Chat", side:"right", align:"center" }}
                >
                  <Link href="/dashboard/new-chat">
                    <MessageSquarePlus className="text-sidebar-foreground group-data-[active=true]:text-primary neon-icon" />
                    <span className="group-data-[collapsible=icon]:hidden">New Chat</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  asChild 
                  isActive={pathname === "/dashboard/history"}
                  tooltip={{ children: "History", side:"right", align:"center" }}
                >
                  <Link href="/dashboard/history">
                    <History className="text-sidebar-foreground group-data-[active=true]:text-primary neon-icon" />
                    <span className="group-data-[collapsible=icon]:hidden">History</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter className="p-4 border-t border-sidebar-border">
             <div className="flex items-center gap-3 mb-4 group-data-[collapsible=icon]:justify-center">
                <Avatar className="h-10 w-10 flex-shrink-0">
                  <AvatarImage src={user?.photoURL || ""} alt={user?.displayName || user?.email || "User"} />
                  <AvatarFallback className="bg-primary text-primary-foreground font-headline">
                    {getInitials(user?.email)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col overflow-hidden group-data-[collapsible=icon]:hidden">
                    <p className="text-sm font-medium truncate">{user?.displayName || user?.email}</p>
                </div>
             </div>

            <Button variant="ghost" onClick={handleLogout} className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:aspect-square">
              <LogOut className="mr-2 h-5 w-5 group-data-[collapsible=icon]:mr-0 neon-icon" />
              <span className="group-data-[collapsible=icon]:hidden">Logout</span>
            </Button>
          </SidebarFooter>
        </Sidebar>
        <SidebarInset className="flex-1 p-4 sm:p-6 md:p-8 bg-background"> {/* Changed from bg-card to bg-background */}
          {children}
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
