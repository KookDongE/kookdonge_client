"use client"

import { CheckCircle, MessageCircle, Send } from "lucide-react"
import { useState } from "react"

import type { ClubQuestion } from "@/entities/post"
import { useToast } from "@/shared/lib/hooks/use-toast"
import { Button } from "@/shared/ui/button"
import { Card, CardContent } from "@/shared/ui/card"
import { Textarea } from "@/shared/ui/textarea"

interface AskSectionProps {
  questions: ClubQuestion[]
}

export function AskSection({ questions }: AskSectionProps) {
  const [newQuestion, setNewQuestion] = useState("")
  const { toast } = useToast()

  const handleSubmit = () => {
    if (!newQuestion.trim()) return

    if (newQuestion.length > 200) {
      toast({
        title: "질문이 너무 길어요",
        description: "200자 이내로 작성해 주세요.",
        variant: "destructive",
      })
      return
    }

    // Submit question
    toast({
      title: "질문이 등록되었어요",
      description: "관리자가 답변하면 알려드릴게요!",
    })
    setNewQuestion("")
  }

  return (
    <div className="space-y-4">
      {/* Question Input */}
      <Card className="py-0">
        <CardContent className="space-y-3 p-4">
          <Textarea
            placeholder="모집 일정/활동 난이도/활동비 등 무엇이든 물어보세요"
            value={newQuestion}
            onChange={(e) => setNewQuestion(e.target.value)}
            className="min-h-24 resize-none"
            maxLength={200}
          />
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-xs">{newQuestion.length}/200</span>
            <Button onClick={handleSubmit} size="sm" disabled={!newQuestion.trim()}>
              <Send className="mr-1 h-4 w-4" />
              질문 등록
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Questions List */}
      <div className="space-y-3">
        {questions.length === 0 ? (
          <div className="text-muted-foreground space-y-2 py-12 text-center">
            <MessageCircle className="mx-auto h-12 w-12 opacity-50" />
            <p>아직 질문이 없어요.</p>
            <p className="text-sm">첫 질문을 남겨보세요!</p>
          </div>
        ) : (
          questions.map((q) => (
            <Card className="py-0" key={q.id}>
              <CardContent className="space-y-3 p-4 py-4">
                <div className="flex items-start gap-3">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{q.userName}</span>
                      <span className="text-muted-foreground text-xs">
                        {new Date(q.createdAt).toLocaleDateString()}
                      </span>
                      {(q.answer || q.isAnswered) && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-400">
                          <CheckCircle className="h-3 w-3" />
                          답변됨
                        </span>
                      )}
                    </div>
                    <p className="text-sm leading-relaxed">{q.question}</p>
                  </div>
                </div>

                {q.answer && (
                  <div className="border-primary space-y-1 border-l-2 pl-4">
                    <div className="flex items-center gap-2">
                      <span className="text-primary text-sm font-medium">관리자 답변</span>
                      {q.answeredAt && (
                        <span className="text-muted-foreground text-xs">
                          {new Date(q.answeredAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <p className="text-muted-foreground text-sm leading-relaxed">{q.answer}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
