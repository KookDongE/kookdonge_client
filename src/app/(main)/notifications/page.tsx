"use client"

import { getNotifications } from "@/entities"
import { Check } from "lucide-react"
import { useState } from "react"

import { NotificationItem } from "@/widgets/notification-item"

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState<"all" | "unread">("all")
  const [notifications, setNotifications] = useState(getNotifications())

  const unreadCount = notifications.filter((n) => !n.isRead).length
  const hasUnreadNotifications = unreadCount > 0

  const handleMarkAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)))
  }

  const handleMarkAllAsRead = () => {
    if (hasUnreadNotifications) {
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
    }
  }

  const unreadNotifications = notifications.filter((n) => !n.isRead)

  const displayedNotifications = activeTab === "all" ? notifications : unreadNotifications

  return (
    <div className="bg-background min-h-screen">
      {/* Header */}
      <div className="bg-background">
        <div className="mt-5 p-4 py-0">
          <div className="flex items-center gap-2">
            {/* Filter Tabs */}
            <div className="flex flex-1 items-center gap-2 rounded-full bg-gray-100 p-1">
              <button
                onClick={() => setActiveTab("all")}
                className={`flex-1 rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                  activeTab === "all"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                전체 {notifications.length > 0 && `(${notifications.length})`}
              </button>
              <button
                onClick={() => setActiveTab("unread")}
                className={`flex-1 rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                  activeTab === "unread"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                읽지 않음 {unreadCount > 0 && `(${unreadCount})`}
              </button>
            </div>

            <div className="rounded-full bg-gray-100 p-1">
              <button
                onClick={handleMarkAllAsRead}
                disabled={!hasUnreadNotifications}
                className={`flex shrink-0 items-center justify-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                  hasUnreadNotifications
                    ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
                    : "cursor-not-allowed text-gray-600"
                }`}
                aria-label="모두 읽음"
              >
                <Check className="h-4 w-4" />
                <span>모두 읽음</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="my-0 space-y-0 p-4 px-4 py-0">
        {displayedNotifications.length === 0 ? (
          <div className="text-muted-foreground py-12 text-center">
            <p>{activeTab === "all" ? "알림이 없습니다." : "읽지 않은 알림이 없습니다."}</p>
          </div>
        ) : (
          displayedNotifications.map((notification) => (
            <NotificationItem key={notification.id} notification={notification} onMarkAsRead={handleMarkAsRead} />
          ))
        )}
      </div>
    </div>
  )
}
