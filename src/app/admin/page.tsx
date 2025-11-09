"use client"

import { mockClubs } from "@/entities"
import { BarChart3, ImageIcon, MessageSquare, Settings } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card"

export default function AdminDashboardPage() {
  // Mock: assume user is admin of first club
  const [managedClub] = useState(mockClubs[0])

  const stats = {
    totalViews: 0,
    totalLikes: 0,
    weeklyViews: 0,
    weeklyLikes: 0,
    clickRate: 0,
    pendingQuestions: 0,
  }

  return (
    <div className="bg-background min-h-screen">
      {/* Header */}
      <div className="bg-background border-border sticky top-0 z-40 border-b">
        <div className="p-4">
          <h1 className="text-2xl font-bold">관리자 대시보드</h1>
          <p className="text-muted-foreground mt-1 text-sm">{managedClub.name}</p>
        </div>
      </div>

      <div className="space-y-4 p-4">
        {/* Stats Overview */}
        <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardContent className="p-4">
              <div className="space-y-1">
                <p className="text-muted-foreground text-xs">총 조회수</p>
                <p className="text-2xl font-bold">{stats.totalViews.toLocaleString()}</p>
                <p className="text-xs text-green-600">+{stats.weeklyViews} 이번주</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="space-y-1">
                <p className="text-muted-foreground text-xs">총 좋아요</p>
                <p className="text-2xl font-bold">{stats.totalLikes.toLocaleString()}</p>
                <p className="text-xs text-green-600">+{stats.weeklyLikes} 이번주</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="space-y-1">
                <p className="text-muted-foreground text-xs">지원 클릭율</p>
                <p className="text-2xl font-bold">{stats.clickRate}%</p>
                <p className="text-muted-foreground text-xs">최근 7일</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="space-y-1">
                <p className="text-muted-foreground text-xs">답변 대기</p>
                <p className="text-2xl font-bold">{stats.pendingQuestions}</p>
                <p className="text-muted-foreground text-xs">질문</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">빠른 작업</CardTitle>
            <CardDescription>동아리 관리 메뉴</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href={`/admin/club/${managedClub.id}/edit`}>
              <button className="hover:bg-accent flex w-full items-center gap-3 rounded-lg p-3 text-left transition-colors">
                <Settings className="text-primary h-5 w-5" />
                <div className="flex-1">
                  <p className="font-medium">동아리 정보 수정</p>
                  <p className="text-muted-foreground text-xs">소개, 모집 일정, 기본 정보 편집</p>
                </div>
              </button>
            </Link>

            <Link href={`/admin/club/${managedClub.id}/posts`}>
              <button className="hover:bg-accent flex w-full items-center gap-3 rounded-lg p-3 text-left transition-colors">
                <ImageIcon className="text-primary h-5 w-5" />
                <div className="flex-1">
                  <p className="font-medium">피드 관리</p>
                  <p className="text-muted-foreground text-xs">포스트 업로드 및 관리</p>
                </div>
              </button>
            </Link>

            <Link href={`/admin/club/${managedClub.id}/questions`}>
              <button className="hover:bg-accent flex w-full items-center gap-3 rounded-lg p-3 text-left transition-colors">
                <MessageSquare className="text-primary h-5 w-5" />
                <div className="flex flex-1 items-center justify-between">
                  <div>
                    <p className="font-medium">Q&A 답변</p>
                    <p className="text-muted-foreground text-xs">질문에 답변하기</p>
                  </div>
                  {stats.pendingQuestions > 0 && (
                    <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-800 dark:bg-red-900/30 dark:text-red-400">
                      {stats.pendingQuestions}
                    </span>
                  )}
                </div>
              </button>
            </Link>

            <Link href={`/admin/club/${managedClub.id}/analytics`}>
              <button className="hover:bg-accent flex w-full items-center gap-3 rounded-lg p-3 text-left transition-colors">
                <BarChart3 className="text-primary h-5 w-5" />
                <div className="flex-1">
                  <p className="font-medium">통계 보기</p>
                  <p className="text-muted-foreground text-xs">조회수, 좋아요, 클릭율 추이</p>
                </div>
              </button>
            </Link>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">최근 활동</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3 text-sm">
              <div className="mt-1.5 h-2 w-2 rounded-full bg-green-500" />
              <div className="flex-1">
                <p className="font-medium">새로운 질문이 등록되었습니다</p>
                <p className="text-muted-foreground text-xs">5분 전</p>
              </div>
            </div>
            <div className="flex items-start gap-3 text-sm">
              <div className="mt-1.5 h-2 w-2 rounded-full bg-blue-500" />
              <div className="flex-1">
                <p className="font-medium">조회수 1,000회 달성</p>
                <p className="text-muted-foreground text-xs">2시간 전</p>
              </div>
            </div>
            <div className="flex items-start gap-3 text-sm">
              <div className="mt-1.5 h-2 w-2 rounded-full bg-purple-500" />
              <div className="flex-1">
                <p className="font-medium">새로운 포스트 업로드</p>
                <p className="text-muted-foreground text-xs">1일 전</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
