"use client"

import {
  ChevronsUpDown,
} from "lucide-react"

import { UserAvatar  } from "./user-avatar"
import {
  DropdownMenu,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { useAuth } from "@/auth/AuthContext"
import { toast } from "sonner"
import { useNavigate, useParams } from "react-router"
import { UserDropdownContent } from "./user-dropdown-content"
import { useUser } from "@/contexts/UserContext"

export function NavUser({ onNavigate }: { onNavigate?: () => void } = {}) {
  const { isMobile, setOpenMobile } = useSidebar()
  const { signOut } = useAuth()
  const navigate = useNavigate()
  const { orgId } = useParams<{ orgId: string }>()

  const handleNavigation = () => {
    onNavigate?.()
    if (isMobile) {
      setOpenMobile(false)
    }
  }

  const handleLogout = async () => {
    try {
      await signOut()
      handleNavigation()
    } catch (error) {
      toast.error('Failed to log out')
    }
  }

  const handleGoToProfile = () => {
    if (orgId) {
      handleNavigation()
      navigate(`/${orgId}/profile`)
    }
  }

  const handleGoToApiKeys = () => {
    if (orgId) {
      handleNavigation()
      navigate(`/${orgId}/profile/api-keys`)
    }
  }

  const handleGoToIntegrations = () => {
    if (orgId) {
      handleNavigation()
      navigate(`/${orgId}/profile/integrations`)
    }
  }

  const { user } = useUser();

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <UserAvatar
                src={user.photo_url}
                name={user.first_name + " " + user.last_name}
                size="md"
              />
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user.first_name + " " + user.last_name}</span>
                <span className="truncate text-xs text-muted-foreground">{user.email}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <UserDropdownContent
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
            onLogout={handleLogout}
            onGoToProfile={handleGoToProfile}
            onGoToApiKeys={handleGoToApiKeys}
            onGoToIntegrations={handleGoToIntegrations}
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56"
          />
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
