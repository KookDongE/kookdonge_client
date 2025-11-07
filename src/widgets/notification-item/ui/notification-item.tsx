"use client"

import { Bell, Info, MessageCircle } from "lucide-react"
import Link from "next/link"

import type { Notification } from "@/entities/notification"
import { cn } from "@/shared/lib/utils"
import { Card, CardContent } from "@/shared/ui/card"

interface NotificationItemProps {
  notification: Notification
  onMarkAsRead?: (id: string) => void
}

export function NotificationItem({ notification, onMarkAsRead }: NotificationItemProps) {
  const getIcon = () => {
    switch (notification.type) {
      case "waitlist":
        return <Bell className="text-primary h-5 w-5" />
      case "answer":
        return <MessageCircle className="h-5 w-5 text-green-500" />
      case "system":
        return <Info className="h-5 w-5 text-blue-500" />
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 60) return `${diffMins}분 전`
    if (diffHours < 24) return `${diffHours}시간 전`
    if (diffDays < 7) return `${diffDays}일 전`
    return date.toLocaleDateString("ko-KR", { month: "long", day: "numeric" })
  }

  const content = (
    <Card
      className={cn(
        "my-3 py-0 transition-shadow hover:shadow-md",
        !notification.isRead && "border-primary/50 bg-primary/5"
      )}
    >
      <CardContent className="p-3 px-3">
        <div className="flex gap-2.5">
          <div className="mt-0.5 shrink-0">{getIcon()}</div>
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-start justify-between gap-2">
              <h3 className="text-sm leading-tight font-semibold">{notification.title}</h3>
              {!notification.isRead && <div className="bg-primary mt-1 h-2 w-2 shrink-0 rounded-full" />}
            </div>
            <p className="text-muted-foreground mb-1.5 text-sm leading-snug">{notification.message}</p>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-xs">{formatDate(notification.createdAt)}</span>
              {notification.clubName && (
                <span className="bg-secondary text-secondary-foreground rounded-md px-2 py-0.5 text-xs">
                  {notification.clubName}
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  if (notification.clubId) {
    return (
      <Link href={`/clubs/${notification.clubId}`} onClick={() => onMarkAsRead?.(notification.id)}>
        {content}
      </Link>
    )
  }

  return <div onClick={() => onMarkAsRead?.(notification.id)}>{content}</div>
}
