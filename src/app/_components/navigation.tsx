"use client";

import {
  DoubleArrowRightIcon,
  DashboardIcon,
  HomeIcon,
  ReaderIcon,
  VercelLogoIcon,
  GridIcon,
} from "@radix-ui/react-icons";
import Link from "next/link";
import { ReactNode, useState } from "react";
import { Button } from "~/components/ui/common/button";
import { Label } from "~/components/ui/common/label";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "~/components/ui/common/navigation-menu";
import { Separator } from "~/components/ui/common/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/common/tooltip";
import { cn } from "~/lib/utils";

type ExpandableNavButtonProps = {
  children: ReactNode;
  expanded: boolean;
  label: string;
  link: string;
  tooltip: string;
};

function ExpandableNavItem({
  children,
  expanded,
  label,
  link,
  tooltip,
}: ExpandableNavButtonProps) {
  return (
    <Tooltip>
      <NavigationMenuItem className="w-full">
        <Link href={link} legacyBehavior passHref>
          <NavigationMenuLink className="w-full">
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size={expanded ? "default" : "icon"}
                className={cn(
                  "p-2",
                  expanded && "w-full items-center justify-start p-4",
                )}
              >
                {children}
                <span className={cn(!expanded && "sr-only", "ml-2 capitalize")}>
                  {label}
                </span>
              </Button>
            </TooltipTrigger>
          </NavigationMenuLink>
        </Link>
        <TooltipContent hidden={expanded} side="right" sideOffset={12}>
          {tooltip}
        </TooltipContent>
      </NavigationMenuItem>
    </Tooltip>
  );
}

export function DesktopVerticalNav() {
  const [expanded, setExpanded] = useState(false);

  return (
    <TooltipProvider>
      <div className="flex flex-col">
        <NavigationMenu suppressHydrationWarning className="items-start">
          <NavigationMenuList className="flex flex-col items-start gap-4 space-x-0">
            <ExpandableNavItem
              expanded={expanded}
              label={"dashboard"}
              link="/dashboard"
              tooltip={"Dashboard"}
            >
              <DashboardIcon />
            </ExpandableNavItem>
            <ExpandableNavItem
              expanded={expanded}
              label={"bookings"}
              link="/bookings"
              tooltip={"Bookings"}
            >
              <ReaderIcon />
            </ExpandableNavItem>
            <ExpandableNavItem
              expanded={expanded}
              label={"explore"}
              link="/explore"
              tooltip={"Explore"}
            >
              <GridIcon />
            </ExpandableNavItem>
          </NavigationMenuList>
        </NavigationMenu>
        <div className="flex-0">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setExpanded(!expanded)}
            className="rounded-full"
          >
            <DoubleArrowRightIcon
              className={cn(
                expanded ? "rotate-180" : "rotate-0",
                "origin-center transition-all",
              )}
            />
          </Button>
        </div>
      </div>
    </TooltipProvider>
  );
}
