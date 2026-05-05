import { ChevronRight, type LucideIcon } from "lucide-react"
import { useParams } from "react-router"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { Link } from "react-router"

export function NavMain({
  title,
  items,
}: {
  title?: string
  items: {
    title: string
    /** Shown when sidebar is collapsed (tooltip opens to the right). Defaults to `title`. */
    tooltip?: string
    url?: string
    onClick?: () => void
    icon?: LucideIcon
    isActive?: boolean
    items?: {
      title: string
      url?: string
      onClick?: () => void
    }[]
  }[]
}) {
  const { state, isMobile, setOpenMobile } = useSidebar()
  const { orgId } = useParams<{ orgId: string }>()

  // Helper function to build URL with orgId
  const buildUrl = (path: string) => {
    if (!orgId) return path
    // Handle empty path (home/dashboard)
    if (!path || path === '/') return `/${orgId}`
    // Remove leading slash if present, then prepend with orgId
    const cleanPath = path.startsWith('/') ? path.slice(1) : path
    return `/${orgId}/${cleanPath}`
  }

  // Function to handle navigation and close mobile sidebar
  const handleNavigation = () => {
    if (isMobile) {
      setOpenMobile(false)
    }
  }

  return (
    <SidebarGroup>
      {title && <SidebarGroupLabel className={`${state === "collapsed" ? "pointer-events-none opacity-0" : "pointer-events-auto opacity-100"} transition-all duration-200 ease-in-out`}>{title}</SidebarGroupLabel>}
      <SidebarMenu>
        {items.map((item) => {
          // If item has no subitems, render as direct navigation
          if (!item.items || item.items.length === 0) {
            // Priority: onClick > url > nothing
            if (item.onClick) {
              return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    tooltip={item.tooltip ?? item.title}
                  >
                    <button
                      onClick={() => {
                        item.onClick?.()
                        handleNavigation()
                      }}
                      className="w-full text-left"
                    >
                      {item.icon && <item.icon />}
                      <span>{item.title}</span>
                    </button>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            }

            if (item.url) {
              return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    tooltip={item.tooltip ?? item.title}
                  >
                    <Link to={buildUrl(item.url)} onClick={handleNavigation}>
                      {item.icon && <item.icon />}
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            }

            // If neither onClick nor url exists, render as disabled
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton disabled>
                  {item.icon && <item.icon />}
                  <span className="opacity-50">{item.title}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          }

          // If sidebar is collapsed, show HoverCard with subitems
          if (state === "collapsed") {
            return (
              <SidebarMenuItem key={item.title}>
                <HoverCard openDelay={0} closeDelay={100}>
                  <HoverCardTrigger asChild>
                    <SidebarMenuButton >
                      {item.icon && <item.icon />}
                      <span >{item.title}</span>
                    </SidebarMenuButton>
                  </HoverCardTrigger>
                  <HoverCardContent
                    side="right"
                    align="start"
                    className="w-48 p-2"
                    sideOffset={8}
                  >
                    <div className="space-y-1">
                      {item.items.map((subItem) => {
                        // Priority: onClick > url > nothing
                        if (subItem.onClick) {
                          return (
                            <button
                              key={subItem.title}
                              onClick={() => {
                                subItem.onClick?.()
                                handleNavigation()
                              }}
                              className="w-full text-left block rounded-md px-2 py-1.5 text-sm text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
                            >
                              {subItem.title}
                            </button>
                          )
                        }

                        if (subItem.url) {
                          return (
                            <Link
                              key={subItem.title}
                              to={buildUrl(subItem.url)}
                              onClick={handleNavigation}
                              className="block rounded-md px-2 py-1.5 text-sm text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
                            >
                              {subItem.title}
                            </Link>
                          )
                        }

                        // If neither onClick nor url exists, render as plain text
                        return (
                          <div
                            key={subItem.title}
                            className="block rounded-md px-2 py-1.5 text-sm text-sidebar-foreground/50 cursor-default"
                          >
                            {subItem.title}
                          </div>
                        )
                      })}
                    </div>
                  </HoverCardContent>
                </HoverCard>
              </SidebarMenuItem>
            )
          }

          // If sidebar is expanded, render as accordion with animation
          return (
            <SidebarMenuItem key={item.title}>
              <Accordion type="single" collapsible defaultValue={item.isActive ? item.title : undefined}>
                <AccordionItem value={item.title} className="border-none">
                  <AccordionTrigger className="p-0 hover:no-underline [&>svg]:hidden [&[data-state=open]_.chevron]:rotate-90">
                    <div className="w-full">
                      <SidebarMenuButton asChild>
                        <div>
                          {item.icon && <item.icon />}
                          <span>{item.title}</span>
                          <ChevronRight className="chevron ml-auto transition-transform duration-200" />
                        </div>
                      </SidebarMenuButton>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-0 pb-0">
                    <SidebarMenuSub>
                      {item.items?.map((subItem) => {
                        // Priority: onClick > url > nothing
                        if (subItem.onClick) {
                          return (
                            <SidebarMenuSubItem key={subItem.title}>
                              <SidebarMenuSubButton asChild>
                                <button
                                  onClick={() => {
                                    subItem.onClick?.()
                                    handleNavigation()
                                  }}
                                  className="w-full text-left"
                                >
                                  <span>{subItem.title}</span>
                                </button>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          )
                        }

                        if (subItem.url) {
                          return (
                            <SidebarMenuSubItem key={subItem.title}>
                              <SidebarMenuSubButton asChild>
                                <Link to={buildUrl(subItem.url)} onClick={handleNavigation}>
                                  <span>{subItem.title}</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          )
                        }

                        // If neither onClick nor url exists, render as plain text
                        return (
                          <SidebarMenuSubItem key={subItem.title}>
                            <SidebarMenuSubButton>
                              <span className="opacity-50">{subItem.title}</span>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        )
                      })}
                    </SidebarMenuSub>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </SidebarMenuItem>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}
