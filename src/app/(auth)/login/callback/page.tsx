"use client"

import { api } from "@/api/client"
import { useAuthStore } from "@/stores/auth.store"
import { useRouter, useSearchParams } from "next/navigation"
import { Suspense, useEffect, useState } from "react"
import { toast } from "sonner"

function CallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { setTokens } = useAuthStore()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get("code")
      const errorParam = searchParams.get("error")

      if (errorParam) {
        setError("로그인이 취소되었습니다.")
        toast.error("로그인이 취소되었습니다.")
        setTimeout(() => router.push("/login"), 2000)
        return
      }

      if (!code) {
        setError("인증 코드가 없습니다.")
        toast.error("인증 코드가 없습니다.")
        setTimeout(() => router.push("/login"), 2000)
        return
      }

      try {
        const response = await api.auth.login({ googleGrantCode: code })

        setTokens(response.accessToken, response.refreshToken)

        toast.success("로그인 성공!")
        router.push("/home")
      } catch (error) {
        console.error("Login failed:", error)
        setError("로그인에 실패했습니다.")
        setTimeout(() => router.push("/login"), 2000)
      }
    }

    handleCallback()
  }, [searchParams, router, setTokens])

  return (
    <div className="bg-background flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6 text-center">
        <div className="bg-primary mx-auto flex h-20 w-20 items-center justify-center rounded-3xl shadow-lg">
          <span className="text-4xl font-bold text-white">국</span>
        </div>

        {error ? (
          <div className="space-y-2">
            <h1 className="text-xl font-semibold text-red-600">{error}</h1>
            <p className="text-muted-foreground text-sm">로그인 페이지로 돌아갑니다...</p>
          </div>
        ) : (
          <div className="space-y-2">
            <h1 className="text-xl font-semibold">로그인 처리 중...</h1>
            <p className="text-muted-foreground text-sm">잠시만 기다려주세요</p>
            <div className="border-t-primary mx-auto h-8 w-8 animate-spin rounded-full border-4 border-gray-200"></div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function CallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="bg-background flex min-h-screen flex-col items-center justify-center p-4">
          <div className="bg-primary mx-auto flex h-20 w-20 items-center justify-center rounded-3xl shadow-lg">
            <span className="text-4xl font-bold text-white">국</span>
          </div>
        </div>
      }
    >
      <CallbackContent />
    </Suspense>
  )
}
