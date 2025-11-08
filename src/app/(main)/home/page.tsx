"use client"

import { api } from "@/api/client"
import type { ClubListRes, ClubRankingRes } from "@/api/types"
import { Eye, Heart } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

import { koreanToCategory } from "@/shared/lib/category"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select"
import { ClubCard } from "@/widgets/club-card"

type TabType = "viewed" | "liked"
type CategoryType = "전체" | "공연예술" | "교양봉사" | "전시예술" | "종교" | "구기레저" | "체육무도" | "학술"
type SortType = "latest" | "popular" | "deadline"

export default function HomePage() {
  const router = useRouter()

  const [activeTab, setActiveTab] = useState<TabType>("viewed")
  const [selectedCategory, setSelectedCategory] = useState<CategoryType>("전체")
  const [sortBy, setSortBy] = useState<SortType>("latest")
  const [topClubs, setTopClubs] = useState<ClubRankingRes[]>([])
  const [clubs, setClubs] = useState<ClubListRes[]>([])
  const [loading, setLoading] = useState(false)

  const categories: CategoryType[] = [
    "전체",
    "공연예술",
    "교양봉사",
    "전시예술",
    "종교",
    "구기레저",
    "체육무도",
    "학술",
  ]

  useEffect(() => {
    const fetchTopClubs = async () => {
      try {
        const result =
          activeTab === "viewed"
            ? await api.club.getTopClubsByWeeklyView({ page: 0, size: 5 })
            : await api.club.getTopClubsByWeeklyLike({ page: 0, size: 5 })
        setTopClubs(result.content)
      } catch (error) {
        console.error("Failed to fetch top clubs:", error)
      }
    }
    fetchTopClubs()
  }, [activeTab])

  useEffect(() => {
    const fetchClubs = async () => {
      setLoading(true)
      try {
        const result = await api.club.getClubList({
          category: selectedCategory === "전체" ? undefined : koreanToCategory[selectedCategory],
          page: 0,
          size: 20,
        })
        setClubs(result.content)
      } catch (error) {
        console.error("Failed to fetch clubs:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchClubs()
  }, [selectedCategory])

  const handleLike = async (clubId: number) => {
    const club = clubs.find((c) => c.id === clubId)
    if (!club) return

    try {
      if (club.isLikedByMe) {
        await api.club.removeLike(clubId)
      } else {
        await api.club.addLike(clubId)
      }
      setClubs((prev) => prev.map((c) => (c.id === clubId ? { ...c, isLikedByMe: !c.isLikedByMe } : c)))
    } catch (error) {
      console.error("Failed to toggle like:", error)
    }
  }

  return (
    <div className="bg-background min-h-screen">
      {/* Tabs Section */}
      <div className="my-1.5 mt-5 mb-0 px-4 pb-3">
        <div className="mx-auto flex max-w-md justify-center gap-0 rounded-full bg-gray-100 p-1">
          <button
            onClick={() => setActiveTab("viewed")}
            className={`flex flex-1 items-center justify-center gap-2 rounded-full px-6 py-2.5 transition-all ${
              activeTab === "viewed"
                ? "bg-primary text-white shadow-sm"
                : "bg-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            <Eye className="h-4 w-4" />
            <span className="text-button text-sm font-medium">Most Viewed</span>
          </button>
          <button
            onClick={() => setActiveTab("liked")}
            className={`flex flex-1 items-center justify-center gap-2 rounded-full px-6 py-2.5 transition-all ${
              activeTab === "liked"
                ? "bg-primary text-white shadow-sm"
                : "bg-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            <Heart className="h-4 w-4" />
            <span className="text-button text-sm font-medium">Most Liked</span>
          </button>
        </div>
      </div>

      {/* Description */}
      <div className="px-4 pb-3">
        <p className="text-caption1 text-muted-foreground text-center">
          이번주 가장 관심 많은 동아리와 핫한 동아리를 알 수 있습니다.
        </p>
      </div>

      {/* Horizontal Ranking Scroll */}
      <div className="px-4 pb-6">
        <div className="scrollbar-hide flex gap-3 overflow-x-auto pb-2">
          {topClubs.map((club) => (
            <div
              key={club.id}
              onClick={() => router.push(`/clubs/${club.id}`)}
              className="bg-card border-border h-auto w-36 flex-shrink-0 cursor-pointer rounded-3xl border p-3 px-3 py-3 transition-shadow hover:shadow-md"
            >
              <div className="mb-2 aspect-square overflow-hidden rounded-lg bg-gray-200">
                <img
                  src={club.logoImage || "/placeholder.svg?height=144&width=144"}
                  alt={club.name}
                  className="h-full w-full object-cover"
                />
              </div>
              <h3 className="text-body2 mb-1 truncate text-sm font-semibold">{club.name}</h3>
              <div className="text-caption2 text-muted-foreground flex items-center justify-between">
                <span className="flex items-center gap-1">
                  {activeTab === "viewed" ? <Eye className="h-3 w-3" /> : <Heart className="h-3 w-3" />}
                  {activeTab === "viewed" ? club.weeklyViewGrowth : club.weeklyLikeGrowth}
                  <span className="font-semibold text-neutral-500">D-{club.dday}</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Category Filter */}
      <div className="px-4 pb-3">
        <div className="flex items-center gap-2">
          <div className="scrollbar-hide flex-1 overflow-x-auto rounded-full bg-gray-100 p-1 px-0.5 py-0.5">
            <div className="flex flex-row gap-1">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`flex-shrink-0 rounded-full px-4 py-2 text-xs font-medium whitespace-nowrap transition-all ${
                    selectedCategory === category
                      ? "bg-primary text-white shadow-sm"
                      : "bg-transparent text-gray-600 hover:text-gray-900"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
          <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortType)}>
            <SelectTrigger className="text-caption1 h-10 w-20 flex-shrink-0 rounded-lg border-gray-200 text-xs">
              <SelectValue placeholder="정렬" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="latest">최신순</SelectItem>
              <SelectItem value="popular">인기순</SelectItem>
              <SelectItem value="deadline">마감순</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-3 px-4 pb-4">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="border-t-primary h-8 w-8 animate-spin rounded-full border-4 border-gray-200"></div>
          </div>
        ) : (
          clubs.map((club) => (
            <ClubCard key={club.id} club={club} onLike={handleLike} isLiked={club.isLikedByMe} hideStats />
          ))
        )}
      </div>
    </div>
  )
}
