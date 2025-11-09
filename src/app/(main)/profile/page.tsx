"use client"

import { api } from "@/api/client"
import type { ClubCategory, ClubListRes, UserProfileRes } from "@/api/types"
import { Bell, Eye, Heart, LogOut, User } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

import type { Grade } from "@/entities/user"
import { categoryToKorean } from "@/shared/lib/category"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/shared/ui/dialog"
import { Label } from "@/shared/ui/label"
import { Switch } from "@/shared/ui/switch"
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
const grades: Grade[] = [1, 2, 3, 4]

export default function ProfilePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfileRes | null>(null)
  const [likedClubs, setLikedClubs] = useState<ClubListRes[]>([])
  const [loading, setLoading] = useState(true)
  const [showInterestsDialog, setShowInterestsDialog] = useState(false)
  const [showGradeDialog, setShowGradeDialog] = useState(false)
  const [tempInterests, setTempInterests] = useState<ClubCategory[]>([])
  const [tempGrade, setTempGrade] = useState<Grade>(1)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [profileData, likedClubsData] = await Promise.all([api.auth.getMyProfile(), api.auth.getMyLikedClubs()])
        setProfile(profileData)
        setLikedClubs(likedClubsData)
      } catch (error) {
        console.error("Failed to fetch profile data:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const handleLogout = () => {
    router.push("/")
  }

  const toggleInterest = (category: ClubCategory) => {
    setTempInterests((prev) => (prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]))
  }

  const saveInterests = () => {
    setShowInterestsDialog(false)
  }

  const saveGrade = () => {
    setShowGradeDialog(false)
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="border-t-primary h-8 w-8 animate-spin rounded-full border-4 border-gray-200"></div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">프로필을 불러올 수 없습니다.</p>
      </div>
    )
  }

  return (
    <div className="bg-background min-h-screen">
      <div className="space-y-4 p-4 py-5">
        <Card className="gap-0 px-0 py-2">
          <CardContent className="my-0 space-y-0">
            <div className="my-0 flex items-center gap-3">
              <div className="bg-primary/10 flex h-16 w-16 items-center justify-center rounded-full">
                <User className="text-primary h-8 w-8" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold">{profile.externalUserId}</h2>
                <p className="text-muted-foreground text-sm">{profile.department}</p>
                <p className="text-muted-foreground text-sm">{profile.email}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="gap-2 py-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Heart className="h-5 w-5" />
              관심을 누른 동아리
            </CardTitle>
          </CardHeader>
          <CardContent>
            {likedClubs.length > 0 ? (
              <div className="scrollbar-hide -mx-2 flex gap-3 overflow-x-auto px-2 pb-0">
                {likedClubs.map((club) => (
                  <div
                    key={club.id}
                    onClick={() => router.push(`/clubs/${club.id}`)}
                    className="bg-card border-border w-36 flex-shrink-0 cursor-pointer rounded-3xl border p-3 py-3 transition-shadow hover:shadow-md"
                  >
                    <div className="mb-2 aspect-square overflow-hidden rounded-lg bg-gray-200">
                      <img
                        src={club.logoImage || "/placeholder.svg?height=144&width=144"}
                        alt={club.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <h3 className="mb-1 truncate text-sm font-semibold">{club.name}</h3>
                    {club.recruitmentStatus !== "SCHEDULED" && (
                      <div className="text-muted-foreground text-xs">
                        <span className="font-semibold text-neutral-500">D-{club.dday}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground py-8 text-center text-sm">관심을 누른 동아리가 없습니다</p>
            )}
          </CardContent>
        </Card>

        {/* Logout Button */}
        <Button variant="outline" className="w-full bg-transparent" onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          로그아웃
        </Button>
      </div>

      {/* Interests Dialog */}
      <Dialog open={showInterestsDialog} onOpenChange={setShowInterestsDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>관심 카테고리 선택</DialogTitle>
            <DialogDescription>관심있는 동아리 카테고리를 선택해 주세요</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <FilterChip
                  key={cat}
                  label={categoryToKorean[cat]}
                  selected={tempInterests.includes(cat)}
                  onToggle={() => toggleInterest(cat)}
                />
              ))}
            </div>
            <Button onClick={saveInterests} className="w-full">
              저장
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Grade Dialog */}
      <Dialog open={showGradeDialog} onOpenChange={setShowGradeDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>학년 선택</DialogTitle>
            <DialogDescription>현재 학년을 선택해 주세요</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {grades.map((grade) => (
                <FilterChip
                  key={grade}
                  label={`${grade}학년`}
                  selected={tempGrade === grade}
                  onToggle={() => setTempGrade(grade)}
                />
              ))}
            </div>
            <Button onClick={saveGrade} className="w-full">
              저장
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
