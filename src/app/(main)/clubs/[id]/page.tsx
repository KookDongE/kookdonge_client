"use client"

import { api } from "@/api/client"
import type { ClubDetailRes, ClubFeedRes, QuestionAnswerRes } from "@/api/types"
import { Calendar, Clock, Eye, GraduationCap, Heart, MapPin, User, Users } from "lucide-react"
import { use, useEffect, useState } from "react"

import { categoryToKorean, clubTypeToKorean, recruitmentStatusToKorean } from "@/shared/lib/category"
import { useToast } from "@/shared/lib/hooks/use-toast"
import { Button } from "@/shared/ui/button"
import { Card, CardContent } from "@/shared/ui/card"
import { Checkbox } from "@/shared/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/shared/ui/dialog"
import { Label } from "@/shared/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs"
import { AskSection } from "@/widgets/ask-section"
import { PostGrid } from "@/widgets/post-grid"

export default function ClubDetailPage(props: { params: Promise<{ id: string }> }) {
  const params = use(props.params)
  const { id } = params
  const { toast } = useToast()
  const [club, setClub] = useState<ClubDetailRes | null>(null)
  const [posts, setPosts] = useState<ClubFeedRes[]>([])
  const [questions, setQuestions] = useState<QuestionAnswerRes[]>([])
  const [loading, setLoading] = useState(true)
  const [showNotificationDialog, setShowNotificationDialog] = useState(false)
  const [emailNotif, setEmailNotif] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const clubData = await api.club.getClubDetail(Number(id))
        setClub(clubData)

        try {
          const feedData = await api.feed.getFeedList(Number(id))
          setPosts(feedData.clubFeedList)
        } catch (error) {
          console.error("Failed to fetch feed data:", error)
          setPosts([])
        }

        try {
          const questionData = await api.question.getQuestions(Number(id), { page: 0, size: 20 })
          setQuestions(questionData.content)
        } catch (error) {
          console.error("Failed to fetch questions:", error)
          setQuestions([])
        }
      } catch (error) {
        console.error("Failed to fetch club data:", error)
        toast({
          title: "오류",
          description: "동아리 정보를 불러오는데 실패했습니다.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [id, toast])

  const handleLikeToggle = async () => {
    if (!club) return
    try {
      if (club.isLikedByMe) {
        await api.club.removeLike(club.id)
      } else {
        await api.club.addLike(club.id)
      }
      setClub({ ...club, isLikedByMe: !club.isLikedByMe })
    } catch (error) {
      console.error("Failed to toggle like:", error)
    }
  }

  const handleNotificationSubmit = async () => {
    if (!emailNotif) {
      toast({
        title: "알림 채널을 선택해 주세요",
        description: "이메일 알림을 선택해야 합니다.",
        variant: "destructive",
      })
      return
    }

    try {
      await api.waitingList.subscribeWaitList(Number(id))
      toast({
        title: "알림 신청이 완료되었습니다!",
        description: "이메일로 알림을 보내드립니다.",
      })
      setShowNotificationDialog(false)
    } catch (error) {
      console.error("Failed to subscribe waiting list:", error)
      toast({
        title: "오류",
        description: "알림 신청에 실패했습니다.",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="border-t-primary h-8 w-8 animate-spin rounded-full border-4 border-gray-200"></div>
      </div>
    )
  }

  if (!club) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">동아리를 찾을 수 없습니다.</p>
      </div>
    )
  }

  return (
    <div className="bg-background min-h-screen pb-6">
      <div className="space-y-4 p-4 py-5">
        {/* Club Image and Name */}
        <div className="flex items-center gap-4">
          <div className="bg-muted h-32 w-32 shrink-0 overflow-hidden rounded-lg">
            <img
              src={club.image || "/placeholder.svg?height=128&width=128"}
              alt={club.name}
              className="h-full w-full object-cover"
            />
          </div>
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between py-0">
              <h1 className="text-2xl font-bold">{club.name}</h1>
              <button
                onClick={handleLikeToggle}
                className="hover:bg-muted rounded-full p-2 px-0 py-0 transition-colors"
              >
                <Heart className={`h-6 w-6 ${club.isLikedByMe ? "fill-current text-red-500" : ""}`} />
              </button>
            </div>
            <div className="text-muted-foreground flex items-center gap-3 text-sm">
              <span className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                {club.totalViewCount}
              </span>
              <span className="flex items-center gap-1">
                <Heart className="h-4 w-4" />
                {club.totalLikeCount}
              </span>
              {club.recruitmentStatus === "RECRUITING" && <span className="text-foreground font-semibold">모집중</span>}
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="bg-primary text-primary-foreground rounded-full px-3 py-1.5 text-xs font-medium">
                {categoryToKorean[club.category]}
              </span>
              <span className="bg-primary text-primary-foreground rounded-full px-3 py-1.5 text-xs font-medium">
                {clubTypeToKorean[club.type]}
              </span>
            </div>
          </div>
        </div>

        <Card className="py-4">
          <CardContent className="space-y-4 p-6 px-6 py-0">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">모집 요강</h2>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium ${
                  club.recruitmentStatus === "RECRUITING"
                    ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                    : club.recruitmentStatus === "CLOSED"
                      ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                      : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                }`}
              >
                {recruitmentStatusToKorean[club.recruitmentStatus]}
              </span>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <Calendar className="text-muted-foreground mt-0.5 h-4 w-4 shrink-0" />
                <div className="flex-1">
                  <p className="font-medium">모집 기간</p>
                  <p className="text-muted-foreground">
                    {new Date(club.recruitmentStartDate).toLocaleDateString()} ~{" "}
                    {new Date(club.recruitmentEndDate).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <GraduationCap className="text-muted-foreground mt-0.5 h-4 w-4 shrink-0" />
                <div className="flex-1">
                  <p className="font-medium">대상 학년</p>
                  <p className="text-muted-foreground">{club.targetGraduate}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="text-muted-foreground mt-0.5 h-4 w-4 shrink-0" />
                <div className="flex-1">
                  <p className="font-medium">활동 빈도</p>
                  <p className="text-muted-foreground">주 {club.weeklyActiveFrequency}회</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Users className="text-muted-foreground mt-0.5 h-4 w-4 shrink-0" />
                <div className="flex-1">
                  <p className="font-medium">휴학생 가능</p>
                  <p className="text-muted-foreground">{club.allowLeaveOfAbsence ? "가능" : "불가능"}</p>
                </div>
              </div>
            </div>

            <Button className="w-full" size="lg" onClick={() => setShowNotificationDialog(true)}>
              알림 신청 받기
            </Button>
          </CardContent>
        </Card>

        <Tabs defaultValue="info" className="w-full gap-0">
          <TabsList className="flex w-full items-center gap-2 rounded-full bg-gray-100 p-1">
            <TabsTrigger
              value="info"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex-1 rounded-full px-3 py-1.5 text-xs font-medium text-gray-600 transition-all hover:text-gray-900 data-[state=active]:shadow-sm"
            >
              동아리 소개
            </TabsTrigger>

            <TabsTrigger
              value="feed"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex-1 rounded-full px-3 py-1.5 text-xs font-medium text-gray-600 transition-all hover:text-gray-900 data-[state=active]:shadow-sm"
            >
              활동 피드
            </TabsTrigger>

            <TabsTrigger
              value="ask"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex-1 rounded-full px-3 py-1.5 text-xs font-medium text-gray-600 transition-all hover:text-gray-900 data-[state=active]:shadow-sm"
            >
              ASK
            </TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="mt-4 space-y-4">
            <Card className="py-0">
              <CardContent className="space-y-3 p-6 py-3">
                <h3 className="text-lg font-bold">동아리 기본 정보</h3>

                <div className="space-y-3 text-sm">
                  {club.leaderName && (
                    <div className="flex items-start gap-3">
                      <User className="text-muted-foreground mt-0.5 h-4 w-4 shrink-0" />
                      <div className="flex-1">
                        <p className="font-medium">동아리 회장</p>
                        <p className="text-muted-foreground">{club.leaderName}</p>
                      </div>
                    </div>
                  )}

                  {club.location && (
                    <div className="flex items-start gap-3">
                      <MapPin className="text-muted-foreground mt-0.5 h-4 w-4 shrink-0" />
                      <div className="flex-1">
                        <p className="font-medium">동아리방</p>
                        <p className="text-muted-foreground">{club.location}</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="my-0 px-6 py-3">
              <CardContent className="space-y-3 p-6 px-0 py-0">
                <h3 className="text-lg font-bold">상세 정보</h3>
                <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-wrap">{club.description}</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="feed" className="mt-4">
            <PostGrid posts={posts} />
          </TabsContent>

          <TabsContent value="ask" className="mt-4">
            <AskSection questions={questions} />
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={showNotificationDialog} onOpenChange={setShowNotificationDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>알림 신청</DialogTitle>
            <DialogDescription>동아리 소식을 이메일로 알려드립니다.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox id="email" checked={emailNotif} onCheckedChange={(checked) => setEmailNotif(!!checked)} />
                <Label htmlFor="email" className="cursor-pointer text-sm font-normal">
                  이메일 알림
                </Label>
              </div>
            </div>
            <Button onClick={handleNotificationSubmit} className="w-full">
              신청하기
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
