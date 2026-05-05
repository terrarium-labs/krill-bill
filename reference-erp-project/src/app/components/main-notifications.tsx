"use client"

import * as React from "react"
import { Bell } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export function MainNotifications({ unreadCount = 10 }: { unreadCount?: number }) {
  const [open, setOpen] = React.useState(false)
  const showBadge = unreadCount > 0
  const label =
    unreadCount > 0
      ? `Notifications, ${unreadCount} unread`
      : "Notifications"

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-10 w-10 shrink-0 rounded-lg shadow-none"
          aria-label={label}
        >
          <Bell className="h-4 w-4" />
          {showBadge ? (
            <Badge
              variant="destructive"
              className="absolute -right-0.5 -top-0.5 h-5 min-w-4 rounded-full border-2 border-background px-0.5 py-0 text-[12px] leading-none tabular-nums"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="border-b px-4 py-3 text-sm font-medium">Notifications</div>
        <div className="p-6 text-center text-sm text-muted-foreground">
          No notifications yet.
        </div>
      </PopoverContent>
    </Popover>
  )
}

export default MainNotifications
