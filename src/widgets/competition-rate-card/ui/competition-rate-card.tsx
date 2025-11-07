import { Info, TrendingUp } from "lucide-react"

import type { CompetitionRate } from "@/entities/club"
import { cn } from "@/shared/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/shared/ui/tooltip"

interface CompetitionRateCardProps {
  data: CompetitionRate
}

export function CompetitionRateCard({ data }: CompetitionRateCardProps) {
  const levelColors = {
    낮음: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    보통: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    높음: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <TrendingUp className="h-4 w-4" />
          경쟁률 추정
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="text-muted-foreground h-4 w-4" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="text-sm">
                  최근 7일 지원 버튼 클릭율 기준으로 추정됩니다. 동아리 외부 요인에 따라 실제 경쟁률과 차이가 있을 수
                  있어요.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground text-sm">클릭율</span>
          <span className="text-2xl font-bold">{data.clickRate}%</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground text-sm">추정 경쟁률</span>
          <span className={cn("rounded-full px-3 py-1 text-sm font-medium", levelColors[data.estimatedLevel])}>
            지원 {data.estimatedLevel}
          </span>
        </div>
        <div className="border-border text-muted-foreground border-t pt-2 text-xs">
          최근 7일: 조회 {data.viewCount}회 / 클릭 {data.clickCount}회
        </div>
      </CardContent>
    </Card>
  )
}
