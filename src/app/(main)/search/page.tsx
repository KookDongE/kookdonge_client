"use client"

import { api } from "@/api/client"
import type { ClubCategory, ClubListRes, ClubType, RecruitmentStatus } from "@/api/types"
import { ArrowLeft, ChevronDown, ChevronUp, Search } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"

import type { Grade } from "@/entities/user"
import { categoryToKorean, clubTypeToKorean, recruitmentStatusToKorean } from "@/shared/lib/category"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { Slider } from "@/shared/ui/slider"
import { Switch } from "@/shared/ui/switch"
import { ClubCard } from "@/widgets/club-card"
import { FilterChip } from "@/widgets/filter-chip"

const categories: ClubCategory[] = [
  "PERFORMING_ARTS",
  "LIBERAL_ARTS_SERVICE",
  "EXHIBITION_ARTS",
  "RELIGION",
  "BALL_LEISURE",
  "PHYSICAL_MARTIAL_ARTS",
  "ACADEMIC",
]
const types: ClubType[] = ["CENTRAL", "DEPARTMENTAL"]
const statuses: RecruitmentStatus[] = ["RECRUITING", "SCHEDULED", "CLOSED"]
const grades: Grade[] = [1, 2, 3, 4]

type SortType = "latest" | "popular" | "deadline"

interface FilterState {
  categories: ClubCategory[]
  types: ClubType[]
  statuses: RecruitmentStatus[]
  grades: Grade[]
  allowLeaveOfAbsence: boolean
  frequency: number
  search: string
}

export default function SearchPage() {
  const router = useRouter()
  const [isFilterExpanded, setIsFilterExpanded] = useState(true)
  const [sortBy, setSortBy] = useState<SortType>("latest")
  const [filters, setFilters] = useState<FilterState>({
    categories: [],
    types: [],
    statuses: [],
    grades: [],
    allowLeaveOfAbsence: false,
    frequency: 7,
    search: "",
  })
  const [clubs, setClubs] = useState<ClubListRes[]>([])
  const [loading, setLoading] = useState(true)
  const [likedClubs, setLikedClubs] = useState<Set<number>>(new Set())

  const toggleCategory = (category: ClubCategory) => {
    setFilters((prev) => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter((c) => c !== category)
        : [...prev.categories, category],
    }))
  }

  const toggleType = (type: ClubType) => {
    setFilters((prev) => ({
      ...prev,
      types: prev.types.includes(type) ? prev.types.filter((t) => t !== type) : [...prev.types, type],
    }))
  }

  const toggleStatus = (status: RecruitmentStatus) => {
    setFilters((prev) => ({
      ...prev,
      statuses: prev.statuses.includes(status) ? prev.statuses.filter((s) => s !== status) : [...prev.statuses, status],
    }))
  }

  const toggleGrade = (grade: Grade) => {
    setFilters((prev) => ({
      ...prev,
      grades: prev.grades.includes(grade) ? prev.grades.filter((g) => g !== grade) : [...prev.grades, grade],
    }))
  }

  useEffect(() => {
    const fetchClubs = async () => {
      try {
        setLoading(true)
        const result = await api.club.getClubList({ page: 0, size: 100 })
        setClubs(result.content)
      } catch (error) {
        console.error("Failed to fetch clubs:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchClubs()
  }, [])

  const resetFilters = () => {
    setFilters({
      categories: [],
      types: [],
      statuses: [],
      grades: [],
      allowLeaveOfAbsence: false,
      frequency: 7,
      search: "",
    })
  }

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

  const filteredClubs = useMemo(() => {
    let result = [...clubs]

    if (filters.categories.length > 0) {
      result = result.filter((club) => filters.categories.includes(club.category))
    }
    if (filters.types.length > 0) {
      result = result.filter((club) => filters.types.includes(club.type))
    }
    if (filters.statuses.length > 0) {
      result = result.filter((club) => filters.statuses.includes(club.recruitmentStatus))
    }
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      result = result.filter(
        (club) => club.name.toLowerCase().includes(searchLower) || club.introduction.toLowerCase().includes(searchLower)
      )
    }

    switch (sortBy) {
      case "deadline":
        result.sort((a, b) => a.dday - b.dday)
        break
      default:
        break
    }

    return result
  }, [clubs, filters, sortBy])

  const activeFilterCount =
    filters.categories.length + filters.types.length + filters.statuses.length + (filters.allowLeaveOfAbsence ? 1 : 0)

  return (
    <div className="bg-background min-h-screen">
      {/* Header */}
      <div className="bg-background border-border border-b">
        <div className="space-y-3 p-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.back()} className="shrink-0">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="relative flex-1">
              <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
              <Input
                placeholder="동아리 이름/키워드 검색"
                value={filters.search}
                onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
                className="pl-9"
                autoFocus
              />
            </div>
          </div>

          {/* Quick Filters */}
          {activeFilterCount > 0 && (
            <div className="scrollbar-hide flex items-center gap-2 overflow-x-auto pb-2">
              {filters.categories.map((cat) => (
                <FilterChip
                  key={cat}
                  label={categoryToKorean[cat]}
                  variant="removable"
                  onRemove={() => toggleCategory(cat)}
                />
              ))}
              {filters.types.map((type) => (
                <FilterChip
                  key={type}
                  label={clubTypeToKorean[type]}
                  variant="removable"
                  onRemove={() => toggleType(type)}
                />
              ))}
              {filters.statuses.map((status) => (
                <FilterChip
                  key={status}
                  label={recruitmentStatusToKorean[status]}
                  variant="removable"
                  onRemove={() => toggleStatus(status)}
                />
              ))}
              {filters.grades.map((grade) => (
                <FilterChip
                  key={grade}
                  label={`${grade}학년`}
                  variant="removable"
                  onRemove={() => toggleGrade(grade)}
                />
              ))}

              <button
                onClick={resetFilters}
                className="bg-secondary text-secondary-foreground hover:bg-secondary/80 flex-shrink-0 shrink-0 rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors"
              >
                초기화
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Expanded Filters */}
      <div className="border-border bg-card border-b">
        <button
          onClick={() => setIsFilterExpanded(!isFilterExpanded)}
          className="hover:bg-accent/50 flex w-full items-center justify-between p-4 transition-colors"
        >
          <span className="text-sm font-medium">상세 필터</span>
          {isFilterExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </button>

        {isFilterExpanded && (
          <div className="space-y-4 p-4 pt-0">
            <div className="space-y-2">
              <Label className="text-sm font-medium">카테고리</Label>
              <div className="scrollbar-hide flex gap-2 overflow-x-auto pb-2">
                {categories.map((cat) => (
                  <FilterChip
                    key={cat}
                    label={categoryToKorean[cat]}
                    selected={filters.categories.includes(cat)}
                    onToggle={() => toggleCategory(cat)}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">형태</Label>
              <div className="scrollbar-hide flex gap-2 overflow-x-auto pb-2">
                {types.map((type) => (
                  <FilterChip
                    key={type}
                    label={clubTypeToKorean[type]}
                    selected={filters.types.includes(type)}
                    onToggle={() => toggleType(type)}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">상태</Label>
              <div className="scrollbar-hide flex gap-2 overflow-x-auto pb-2">
                {statuses.map((status) => (
                  <FilterChip
                    key={status}
                    label={recruitmentStatusToKorean[status]}
                    selected={filters.statuses.includes(status)}
                    onToggle={() => toggleStatus(status)}
                  />
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="leave-of-absence" className="text-sm font-medium">
                휴학생 가능
              </Label>
              <Switch
                id="leave-of-absence"
                checked={filters.allowLeaveOfAbsence}
                onCheckedChange={(checked) => setFilters((prev) => ({ ...prev, allowLeaveOfAbsence: checked }))}
              />
            </div>
          </div>
        )}
      </div>

      {/* Sort and Results */}
      <div className="space-y-4 p-4">
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground text-sm">
            총 <span className="text-foreground font-semibold">{filteredClubs.length}</span>개 동아리
          </p>
          <div className="flex items-center gap-1 rounded-full bg-gray-100 p-1">
            <button
              onClick={() => setSortBy("latest")}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                sortBy === "latest"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              최신순
            </button>
            <button
              onClick={() => setSortBy("popular")}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                sortBy === "popular"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              인기순
            </button>
            <button
              onClick={() => setSortBy("deadline")}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                sortBy === "deadline"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              마감순
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="border-t-primary h-8 w-8 animate-spin rounded-full border-4 border-gray-200"></div>
          </div>
        ) : filteredClubs.length > 0 ? (
          <div className="grid gap-4">
            {filteredClubs.map((club) => (
              <ClubCard key={club.id} club={club} onLike={handleLike} isLiked={likedClubs.has(club.id)} hideStats />
            ))}
          </div>
        ) : (
          <div className="space-y-3 py-12 text-center">
            <p className="text-muted-foreground">조건에 맞는 동아리를 찾지 못했어요.</p>
            <p className="text-muted-foreground text-sm">필터를 조정해 보세요.</p>
            <Button variant="outline" onClick={resetFilters}>
              필터 초기화
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
