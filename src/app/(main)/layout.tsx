import type React from "react"

import { Header } from "@/widgets/header"

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white px-0 py-0">
      <div className="relative mx-auto w-full sm:max-w-[430px]">
        <Header />
        <main className="pt-0">{children}</main>
      </div>
    </div>
  )
}
