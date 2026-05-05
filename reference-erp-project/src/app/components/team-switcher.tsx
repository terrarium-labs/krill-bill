import { ChevronsUpDown, Plus, Loader2, Check } from "lucide-react"
import { useNavigate, useParams } from "react-router"
import { useState, useCallback, useEffect } from "react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { useOrg } from "@/app/contexts/OrgContext"
import { OrgAvatar } from "@/app/components/avatars/org-avatar"
import { useTranslation } from "react-i18next"
import CustomScroller from 'react-custom-scroller';
import '@/styles/custom_scrollbar.css';
import { getMeOrgs } from "@/api/me/me";
import { Org } from "@/types/general/org";


export function TeamSwitcher() {
  const { isMobile } = useSidebar()
  const { orgId } = useParams<{ orgId: string }>()
  const { org } = useOrg()
  const { t } = useTranslation()
  const navigate = useNavigate()

  const [organizations, setOrganizations] = useState<Org[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [nextPageToken, setNextPageToken] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)

  // Fetch organizations with pagination support
  const fetchOrganizations = useCallback(async (pageToken: string | null = null) => {
    if (isLoading || (pageToken && isLoadingMore)) return

    if (pageToken) {
      setIsLoadingMore(true)
    } else {
      setIsLoading(true)
    }

    try {
      const response = await getMeOrgs("", pageToken)
      if (response.success) {
        if (pageToken) {
          // Loading more results - append to existing
          setOrganizations(prev => [...prev, ...(response.success.orgs as Org[])])
        } else {
          // Initial load - replace existing
          setOrganizations(response.success.orgs as Org[])
        }

        if (response.success.next_page_token) {
          setNextPageToken(response.success.next_page_token)
        } else {
          setNextPageToken(null)
        }
      }
    } catch (error) {
      console.error("Failed to fetch organizations:", error)
    } finally {
      if (pageToken) {
        setIsLoadingMore(false)
      } else {
        setIsLoading(false)
      }
    }
  }, [getMeOrgs, isLoading, isLoadingMore])

  // Handle loading more organizations
  const loadMore = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (nextPageToken && !isLoadingMore) {
      fetchOrganizations(nextPageToken)
    }
  }, [nextPageToken, isLoadingMore, fetchOrganizations])

  // Handle organization switch
  const handleOrgSwitch = (orgToSwitch: Org) => {
    if (orgToSwitch.id === orgId) return // Don't switch if it's the same org
    localStorage.setItem("last-org-id", orgToSwitch.id)
    window.location.href = `/${orgToSwitch.id}`
    setIsOpen(false)
  }

  // Handle creating new organization
  const handleCreateOrg = () => {
    navigate("/orgs", { replace: true })
    setIsOpen(false)
  }

  // Fetch orgs when dropdown opens
  useEffect(() => {
    if (isOpen && organizations.length === 0) {
      fetchOrganizations()
    }
  }, [isOpen, organizations.length, fetchOrganizations])

  if (!org) {
    return null
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <OrgAvatar org={org} showDescription={true} size="md" className="font-medium leading-tight" />
              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg overflow-hidden"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-muted-foreground text-xs">
              {t('orgs.title', "Organizations")}
            </DropdownMenuLabel>

            <CustomScroller className="h-full">
              <div className="max-h-[200px]">
                {isLoading ? (
                  <DropdownMenuItem disabled className="gap-2 p-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t('orgs.loadingOrganizations', "Loading Organizations")}
                  </DropdownMenuItem>
                ) : (

                  <div className="px-1">
                    {organizations.map((organization) => (
                      <DropdownMenuItem
                        key={organization.id}
                        onClick={() => handleOrgSwitch(organization)}
                        className="gap-2 p-2"
                        disabled={organization.id === orgId}
                      >
                        <OrgAvatar org={organization as Org} showMembers={true} size="md" className="font-medium" />
                        {organization.id === orgId && (
                          <Check className="ml-auto text-xs text-muted-foreground" />
                        )}
                      </DropdownMenuItem>
                    ))}
                  </div>

                )}

                {/* Load More Button */}
                {nextPageToken && (
                  <div className="flex justify-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={loadMore}
                      disabled={isLoadingMore}
                      className="text-xs my-2 h-7 p-2 cursor-pointer w-full text-muted-foreground"
                    >
                      {isLoadingMore && (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      )}
                      <span className="text-sm">
                        {isLoadingMore ? t('common.loading', "Loading") : t('common.loadMore', "Load More")}
                      </span>
                    </Button>
                  </div>
                )}
              </div>
            </CustomScroller>


            <DropdownMenuItem onClick={handleCreateOrg} className="gap-2 p-2">
              <div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
                <Plus className="size-4" />
              </div>
              <div className="text-muted-foreground font-medium">
                {t('orgs.createNewOrg', "Create New Organization")}
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu >
  )
}
