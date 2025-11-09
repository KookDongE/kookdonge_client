"use client"

import { getClubById } from "@/entities"
import { ArrowLeft, Eye, Heart, MousePointerClick, TrendingUp } from "lucide-react"
import { useRouter } from "next/navigation"
import { use } from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"

export default function AdminAnalyticsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const club = getClubById(id)

  if (!club) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">동아리를 찾을 수 없습니다.</p>
      </div>
    )
  }

  const analytics = {
    views: {
      total: 0,
      weekly: 0,
      daily: 0,
    },
    likes: {
      total: 0,
      weekly: 0,
      daily: 0,
    },
    clicks: {
      total: 0,
      weekly: 0,
      rate: 0,
    },
  }

  return (
    <div className="bg-background min-h-screen pb-6">
      {/* Header */}
      <div className="bg-background border-border sticky top-0 z-40 border-b">
        <div className="flex items-center gap-3 p-4">
          <button onClick={() => router.back()} className="hover:bg-accent rounded-lg p-2 transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold">통계</h1>
            <p className="text-muted-foreground text-sm">{club.name}</p>
          </div>
        </div>
      </div>

      <div className="space-y-4 p-4">
        {/* Views */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Eye className="h-5 w-5 text-blue-500" />
              조회수
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">총 조회수</span>
              <span className="text-2xl font-bold">{analytics.views.total.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">이번주</span>
              <span className="text-lg font-semibold text-green-600">+{analytics.views.weekly.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">오늘</span>
              <span className="text-lg font-semibold">+{analytics.views.daily.toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>

        {/* Likes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Heart className="h-5 w-5 text-red-500" />
              좋아요
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">총 좋아요</span>
              <span className="text-2xl font-bold">{analytics.likes.total.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">이번주</span>
              <span className="text-lg font-semibold text-green-600">+{analytics.likes.weekly.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">오늘</span>
              <span className="text-lg font-semibold">+{analytics.likes.daily.toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>

        {/* Application Clicks */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <MousePointerClick className="h-5 w-5 text-purple-500" />
              지원 버튼 클릭
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">총 클릭</span>
              <span className="text-2xl font-bold">{analytics.clicks.total.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">이번주</span>
              <span className="text-lg font-semibold text-green-600">+{analytics.clicks.weekly.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">클릭율 (7일)</span>
              <span className="text-primary text-lg font-semibold">{analytics.clicks.rate}%</span>
            </div>
          </CardContent>
        </Card>

        {/* Trend Info */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <TrendingUp className="text-primary mt-0.5 h-5 w-5 shrink-0" />
              <div className="space-y-1">
                <p className="text-sm font-medium">성장 추세</p>
                <p className="text-muted-foreground text-xs leading-relaxed">
                  지난주 대비 조회수 +15%, 좋아요 +22% 증가했습니다. 꾸준한 콘텐츠 업로드로 더 많은 학생들에게 다가가
                  보세요!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
