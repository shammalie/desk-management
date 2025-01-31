"use client";

import * as React from "react";
import {
  BookOpen,
  Building2,
  Cog,
  House,
  LifeBuoy,
  MonitorCheck,
  Navigation,
  Send,
  Users,
} from "lucide-react";

import { NavMain } from "~/components/ui/navigation/nav-main";
import { NavSecondary } from "~/components/ui/navigation/nav-secondary";
import { NavUser } from "~/components/ui/navigation/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "~/components/ui/common/sidebar";
import { NavDeskBooking } from "./nav-desk-booking";
import { NavManagement } from "./nav-management.";

const data = {
  user: {
    firstName: "John",
    lastName: "Doe",
    email: "john-doe1337@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    {
      title: "Home",
      url: "#",
      icon: House,
    },
  ],
  navDeskBooking: [
    {
      title: "Locations",
      url: "/locations",
      icon: Navigation,
    },
    {
      title: "My Bookings",
      url: "#",
      icon: BookOpen,
    },
  ],
  navManagement: [
    {
      title: "Sites",
      url: "#",
      icon: Building2,
    },
    {
      title: "Teams",
      url: "#",
      icon: Users,
    },
  ],
  navSecondary: [
    {
      title: "Support",
      url: "#",
      icon: LifeBuoy,
      isHidden: false,
    },
    {
      title: "Feedback",
      url: "#",
      icon: Send,
      isHidden: false,
    },
    {
      title: "System Settings",
      url: "#",
      icon: Cog,
      isHidden: true,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar variant="floating" collapsible="none" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="#">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <MonitorCheck className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">
                    Desk Management
                  </span>
                  <span className="truncate text-xs">Enterprise</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavDeskBooking items={data.navDeskBooking} />
        <NavManagement items={data.navManagement} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  );
}
