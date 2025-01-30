"use client"

import {
  Bell,
  Lightbulb,
  User,
} from "lucide-react"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "~/components/ui/common/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/common/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "~/components/ui/common/sidebar"
import { CaretSortIcon } from "@radix-ui/react-icons"
import { useTheme } from "next-themes"

type NavUserProps = {
  firstName: string
  lastName: string
  email: string
  avatar: string
}

export function NavUser({
  user,
}: {
  user: NavUserProps
}) {
  const { isMobile } = useSidebar()
  const { theme, setTheme } = useTheme();

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <UserOverview user={user} />
              <CaretSortIcon className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <UserOverview user={user} />
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <User />
                Account
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Bell />
                Notifications
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
              <Lightbulb />
              Change Theme
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

function UserOverview({ user }: { user: NavUserProps }) {
  const { firstName, lastName, email, avatar } = user;

  return (
    <>
      <Avatar className="h-8 w-8 rounded-lg">
        <AvatarImage src={avatar} alt={firstName} />
        <AvatarFallback className="rounded-lg">{firstName ? firstName.charAt(0) : 'N'}{lastName ? lastName.charAt(0) : 'A'}</AvatarFallback>
      </Avatar>
      <div className="grid flex-1 text-left text-sm leading-tight">
        <span className="truncate font-semibold">{firstName} {lastName}</span>
        <span className="truncate text-xs">{email}</span>
      </div>
    </>
  )
}