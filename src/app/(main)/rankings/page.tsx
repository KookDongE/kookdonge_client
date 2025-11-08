"use client"

import { api } from "@/api/client"
import type { ClubRankingRes } from "@/api/types"
import { Info } from "lucide-react"
import { useEffect, useState } from "react"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/shared/ui/tooltip"
import { ClubCard } from "@/widgets/club-card"

export default function RankingsPage() {
  const [activeTab, setActiveTab] = useState<"views" | "likes">("views")
  const [likedClubs, setLikedClubs] = useState<Set<number>>(new Set())
  const [viewsRankings, setViewsRankings] = useState<ClubRankingRes[]>([])
  const [likesRankings, setLikesRankings] = useState<ClubRankingRes[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchRankings = async () => {
      try {
        setLoading(true)
        const [viewsData, likesData] = await Promise.all([
          api.club.getTopClubsByWeeklyView({ page: 0, size: 20 }),
          api.club.getTopClubsByWeeklyLike({ page: 0, size: 20 }),
        ])
        setViewsRankings(viewsData.content)
        setLikesRankings(likesData.content)
      } catch (error) {
        console.error("Failed to fetch rankings:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchRankings()
  }, [])

  const handleLike = async (clubId: number) => {
    try {
      const isLiked = likedClubs.has(clubId)
      if (isLiked) {
        await api.club.removeLike(clubId)
        setLikedClubs((prev) => {
          const newSet = new Set(prev)
          newSet.delete(clubId)
          return newSet
        })
      } else {
        await api.club.addLike(clubId)
        setLikedClubs((prev) => new Set(prev).add(clubId))
      }
    } catch (error) {
      console.error("Failed to toggle like:", error)
    }
  }

  return (
    <div className="bg-background min-h-screen">
      {/* Header */}
      <div className="bg-background border-border sticky top-0 z-40 border-b">
        <div className="p-4">
          <div className="mb-4 flex items-center justify-between">
            <h1 className="text-2xl font-bold">랭킹</h1>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="text-muted-foreground h-5 w-5" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-sm">이번주 = 월요일 00:00 ~ 일요일 23:59 (KST)</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <Tabs
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as "views" | "likes")}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="views">이번주 관심 많음</TabsTrigger>
              <TabsTrigger value="likes">이번주 핫함</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      <div className="p-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="border-t-primary h-8 w-8 animate-spin rounded-full border-4 border-gray-200"></div>
          </div>
        ) : (
          <Tabs value={activeTab} className="w-full">
            <TabsContent value="views" className="mt-0 space-y-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-muted-foreground text-sm">조회수 기준 주간 랭킹</p>
              </div>
              {viewsRankings.map((ranking, index) => (
                <ClubCard
                  key={ranking.id}
                  club={ranking}
                  onLike={handleLike}
                  isLiked={likedClubs.has(ranking.id)}
                  rank={index + 1}
                />
              ))}
            </TabsContent>

            <TabsContent value="likes" className="mt-0 space-y-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-muted-foreground text-sm">좋아요 기준 주간 랭킹</p>
              </div>
              {likesRankings.map((ranking, index) => (
                <ClubCard
                  key={ranking.id}
                  club={ranking}
                  onLike={handleLike}
                  isLiked={likedClubs.has(ranking.id)}
                  rank={index + 1}
                />
              ))}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  )
}
