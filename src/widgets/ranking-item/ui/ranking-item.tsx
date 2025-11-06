import { Eye, Heart, Minus, TrendingDown, TrendingUp } from "lucide-react"
import Link from "next/link"

import type { ClubRanking } from "@/entities/club"
import { cn } from "@/shared/lib/utils"
import { Card, CardContent } from "@/shared/ui/card"
import { StatusBadge } from "@/widgets/status-badge"

interface RankingItemProps {
  ranking: ClubRanking
  type: "views" | "likes"
}

export function RankingItem({ ranking, type }: RankingItemProps) {
  const { id, name, logoImage, introduction, weeklyViewGrowth, weeklyLikeGrowth, recruitmentStatus } = ranking

  const growthValue = type === "views" ? weeklyViewGrowth : weeklyLikeGrowth

  const getRankChangeIcon = () => {
    if (growthValue > 0) return <TrendingUp className="h-4 w-4 text-green-500" />
    if (growthValue < 0) return <TrendingDown className="h-4 w-4 text-red-500" />
    return <Minus className="text-muted-foreground h-4 w-4" />
  }

  const getRankChangeText = () => {
    if (growthValue > 0) return `+${growthValue}`
    if (growthValue < 0) return growthValue.toString()
    return "-"
  }

  return (
    <Link href={`/clubs/${id}`}>
      <Card className="transition-shadow hover:shadow-md">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            {/* Thumbnail */}
            <div className="bg-muted h-20 w-20 shrink-0 overflow-hidden rounded-lg">
              <img src={logoImage || "/placeholder.svg"} alt={name} className="h-full w-full object-cover" />
            </div>

            {/* Club Info */}
            <div className="min-w-0 flex-1 space-y-2">
              <div className="space-y-1">
                <h3 className="truncate leading-tight font-semibold">{name}</h3>
                <p className="text-muted-foreground line-clamp-1 text-sm">{introduction}</p>
                <div className="flex flex-wrap items-center gap-1.5">
                  <StatusBadge status={recruitmentStatus} className="text-xs" />
                </div>
              </div>

              <div className="flex items-center gap-3 text-sm">
                {type === "views" ? (
                  <div className="text-muted-foreground flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    <span className="text-foreground font-semibold">{weeklyViewGrowth?.toLocaleString()}</span>
                    <span className="text-xs">증가</span>
                    {getRankChangeIcon()}
                    <span className={cn(growthValue > 0 && "text-green-500", growthValue < 0 && "text-red-500")}>
                      {getRankChangeText()}
                    </span>
                  </div>
                ) : (
                  <div className="text-muted-foreground flex items-center gap-1">
                    <Heart className="h-4 w-4" />
                    <span className="text-foreground font-semibold">{weeklyLikeGrowth?.toLocaleString()}</span>
                    <span className="text-xs">증가</span>
                    {getRankChangeIcon()}
                    <span className={cn(growthValue > 0 && "text-green-500", growthValue < 0 && "text-red-500")}>
                      {getRankChangeText()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
