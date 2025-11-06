"use client"

import { Eye, Heart } from "lucide-react"
import Link from "next/link"

import type { Club } from "@/entities/club"
import { categoryToKorean, clubTypeToKorean, recruitmentStatusToKorean } from "@/shared/lib/category"
import { Card } from "@/shared/ui/card"

interface ClubCardProps {
  club: Club
  rank?: number
  hideStats?: boolean
  onLike?: (clubId: number) => void
  isLiked?: boolean
}

export function ClubCard({ club, rank, hideStats = false, onLike, isLiked }: ClubCardProps) {
  return (
    <div className="relative">
      {rank && (
        <div className="bg-primary text-primary-foreground absolute -top-2 -left-2 z-10 flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold shadow-md">
          {rank}
        </div>
      )}
      <Link href={`/clubs/${club.id}`}>
        <Card className="cursor-pointer overflow-hidden p-3 transition-shadow hover:shadow-md">
          <div className="flex gap-3">
            <div className="bg-muted relative h-24 w-24 shrink-0 overflow-hidden rounded-xl">
              <img src={club.logoImage || "/placeholder.svg"} alt={club.name} className="h-full w-full object-cover" />
            </div>

            <div className="flex min-w-0 flex-1 flex-col justify-between">
              <div className="space-y-1">
                <h3 className="line-clamp-1 text-base leading-tight font-semibold">{club.name}</h3>
                <p className="text-muted-foreground line-clamp-2 text-sm leading-snug">{club.introduction}</p>
              </div>

              <div className="text-muted-foreground flex flex-row items-center gap-3 text-sm">
                {club.recruitmentStatus !== "SCHEDULED" && (
                  <div className="flex items-center gap-1">
                    <span className="text-primary ml-auto text-xs font-medium">D-{club.dday}</span>
                  </div>
                )}
              </div>

              <div className="mt-1 flex flex-wrap items-center gap-1.5">
                <span className="border-border rounded-md border px-2 py-0.5 text-xs">
                  {recruitmentStatusToKorean[club.recruitmentStatus]}
                </span>
                <span className="border-border rounded-md border px-2 py-0.5 text-xs">
                  {categoryToKorean[club.category]}
                </span>
                <span className="border-border rounded-md border px-2 py-0.5 text-xs">
                  {clubTypeToKorean[club.type]}
                </span>
              </div>
            </div>
          </div>
        </Card>
      </Link>
    </div>
  )
}
