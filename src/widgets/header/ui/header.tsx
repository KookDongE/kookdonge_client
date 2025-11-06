"use client"

import { Bell, Search, User } from "lucide-react"
import Image from "next/image"
import { useRouter } from "next/navigation"

export function Header() {
  const router = useRouter()

  return (
    <header className="sticky top-2 z-50 px-4">
      <div className="border-primary mx-auto w-full rounded-[20px] border bg-white/20 px-6 py-2 shadow-sm backdrop-blur-md">
        <div className="flex items-center justify-between gap-0">
          <button onClick={() => router.push("/home")} className="flex items-center">
            <Image
              src="/kookdinge-logo.png"
              alt="KOOKDINGE"
              width={98}
              height={22}
              className="h-5 w-auto scale-100"
              priority
            />
          </button>

          <div className="flex items-center gap-1">
            <button
              onClick={() => router.push("/search")}
              className="rounded-full p-2 transition-colors hover:bg-gray-50"
              aria-label="검색"
            >
              <Search className="text-primary h-6 w-5" strokeWidth={2} />
            </button>
            <button
              onClick={() => router.push("/notifications")}
              className="rounded-full p-2 transition-colors hover:bg-gray-50"
              aria-label="알림"
            >
              <Bell className="text-primary h-6 w-5" strokeWidth={2} />
            </button>
            <button
              onClick={() => router.push("/profile")}
              className="rounded-full p-2 transition-colors hover:bg-gray-50"
              aria-label="내 정보"
            >
              <User className="text-primary h-6 w-5" strokeWidth={2} />
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
