"use client"

import { Bell, Home, TrendingUp, User } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@/shared/lib/utils"

const navItems = [
  { href: "/home", label: "홈", icon: Home },
  { href: "/rankings", label: "랭킹", icon: TrendingUp },
  { href: "/notifications", label: "알림", icon: Bell },
  { href: "/profile", label: "내 정보", icon: User },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="bg-card border-border safe-bottom fixed right-0 bottom-0 left-0 z-50 border-t">
      <div className="mx-auto flex h-16 max-w-lg items-center justify-around">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex h-full flex-1 flex-col items-center justify-center gap-1 transition-colors",
                "hover:bg-accent/50 active:bg-accent",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
