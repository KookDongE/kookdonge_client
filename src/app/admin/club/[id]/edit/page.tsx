"use client"

import { getClubById } from "@/entities"
import { ArrowLeft, Save } from "lucide-react"
import { useRouter } from "next/navigation"
import { use, useState } from "react"

import type { ClubStatus } from "@/entities/club"
import { useToast } from "@/shared/lib/hooks/use-toast"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select"
import { Switch } from "@/shared/ui/switch"
import { Textarea } from "@/shared/ui/textarea"

export default function EditClubPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { toast } = useToast()
  const club = getClubById(id)

  const [formData, setFormData] = useState({
    name: club?.name || "",
    description: "",
    status: "모집대기" as ClubStatus,
    recruitPeriod: "",
    frequency: 1,
    allowLeaveOfAbsence: false,
  })

  if (!club) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">동아리를 찾을 수 없습니다.</p>
      </div>
    )
  }

  const handleSave = () => {
    toast({
      title: "저장되었습니다",
      description: "동아리 정보가 업데이트되었습니다.",
    })
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
            <h1 className="text-xl font-bold">동아리 정보 수정</h1>
          </div>
          <Button onClick={handleSave} size="sm">
            <Save className="mr-1 h-4 w-4" />
            저장
          </Button>
        </div>
      </div>

      <div className="space-y-4 p-4">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">기본 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">동아리명</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">소개</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="min-h-24"
              />
            </div>
          </CardContent>
        </Card>

        {/* Recruitment Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">모집 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="status">모집 상태</Label>
              <Select
                value={formData.status}
                onValueChange={(value: ClubStatus) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="모집중">모집중</SelectItem>
                  <SelectItem value="모집대기">모집대기</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="period">모집 기간</Label>
              <Input
                id="period"
                value={formData.recruitPeriod}
                onChange={(e) => setFormData({ ...formData, recruitPeriod: e.target.value })}
                placeholder="예: 2025.03.01 - 2025.03.15"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="frequency">활동 빈도 (주 {formData.frequency}회)</Label>
              <Input
                id="frequency"
                type="number"
                min="1"
                max="7"
                value={formData.frequency}
                onChange={(e) => setFormData({ ...formData, frequency: Number.parseInt(e.target.value) })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="leave">휴학생 가능</Label>
                <p className="text-muted-foreground text-xs">휴학생도 지원할 수 있습니다</p>
              </div>
              <Switch
                id="leave"
                checked={formData.allowLeaveOfAbsence}
                onCheckedChange={(checked) => setFormData({ ...formData, allowLeaveOfAbsence: checked })}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
