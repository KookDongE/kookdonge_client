"use client"

import { getQuestionsByClubId } from "@/entities"
import { ArrowLeft, Send } from "lucide-react"
import { useRouter } from "next/navigation"
import { use, useState } from "react"

import { useToast } from "@/shared/lib/hooks/use-toast"
import { Button } from "@/shared/ui/button"
import { Card, CardContent } from "@/shared/ui/card"
import { Textarea } from "@/shared/ui/textarea"

export default function AdminQuestionsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { toast } = useToast()
  const [questions, setQuestions] = useState(getQuestionsByClubId(Number(id)))
  const [answers, setAnswers] = useState<Record<number, string>>({})

  const handleSubmitAnswer = (questionId: number) => {
    const answer = answers[questionId]
    if (!answer?.trim()) return

    setQuestions((prev) =>
      prev.map((q) =>
        q.id === questionId
          ? {
              ...q,
              answer,
              answeredAt: new Date().toISOString(),
              isAnswered: true,
            }
          : q
      )
    )

    setAnswers((prev) => ({ ...prev, [questionId]: "" }))

    toast({
      title: "답변이 등록되었습니다",
      description: "질문자에게 알림이 발송됩니다.",
    })
  }

  const unansweredQuestions = questions.filter((q) => !q.isAnswered)
  const answeredQuestions = questions.filter((q) => q.isAnswered)

  return (
    <div className="bg-background min-h-screen pb-6">
      {/* Header */}
      <div className="bg-background border-border sticky top-0 z-40 border-b">
        <div className="flex items-center gap-3 p-4">
          <button onClick={() => router.back()} className="hover:bg-accent rounded-lg p-2 transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold">Q&A 관리</h1>
            <p className="text-muted-foreground text-sm">답변 대기 {unansweredQuestions.length}개</p>
          </div>
        </div>
      </div>

      <div className="space-y-4 p-4">
        {/* Unanswered Questions */}
        {unansweredQuestions.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold">답변 대기</h2>
            {unansweredQuestions.map((q) => (
              <Card key={q.id} className="border-primary/50">
                <CardContent className="space-y-3 p-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{q.userName}</span>
                      <span className="text-muted-foreground text-xs">{q.createdAt}</span>
                    </div>
                    <p className="text-sm leading-relaxed">{q.question}</p>
                  </div>

                  <div className="space-y-2">
                    <Textarea
                      placeholder="답변을 입력하세요"
                      value={answers[q.id] || ""}
                      onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                      className="min-h-20"
                    />
                    <Button onClick={() => handleSubmitAnswer(q.id)} size="sm" disabled={!answers[q.id]?.trim()}>
                      <Send className="mr-1 h-4 w-4" />
                      답변 등록
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Answered Questions */}
        {answeredQuestions.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold">답변 완료</h2>
            {answeredQuestions.map((q) => (
              <Card key={q.id}>
                <CardContent className="space-y-3 p-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{q.userName}</span>
                      <span className="text-muted-foreground text-xs">{q.createdAt}</span>
                    </div>
                    <p className="text-sm leading-relaxed">{q.question}</p>
                  </div>

                  <div className="border-primary space-y-1 border-l-2 pl-4">
                    <div className="flex items-center gap-2">
                      <span className="text-primary text-sm font-medium">내 답변</span>
                      <span className="text-muted-foreground text-xs">{q.answeredAt}</span>
                    </div>
                    <p className="text-muted-foreground text-sm leading-relaxed">{q.answer}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {questions.length === 0 && (
          <div className="text-muted-foreground py-12 text-center">
            <p>아직 질문이 없습니다.</p>
          </div>
        )}
      </div>
    </div>
  )
}
