"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

import { Button } from "@/shared/ui/button"

export default function LoginPage() {
  const router = useRouter()

  const [isLoading, setIsLoading] = useState(false)

  const handleGoogleLogin = () => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
    const redirectUri = `${window.location.origin}/login/callback`
    const scope = "openid email profile"

    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scope)}&access_type=offline&prompt=consent`
  }

  return (
    <div className="bg-background flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="space-y-3 text-center">
          <div className="bg-primary mx-auto flex h-20 w-20 items-center justify-center rounded-3xl shadow-lg">
            <span className="text-4xl font-bold text-white">국</span>
          </div>
          <h1 className="text-3xl font-bold">국동이</h1>
          <p className="text-muted-foreground text-base">국민대학교 동아리 통합 플랫폼</p>
        </div>

        <div className="space-y-4">
          <Button
            onClick={handleGoogleLogin}
            disabled={isLoading}
            size="lg"
            className="w-full gap-3 rounded-xl bg-white py-6 text-gray-700 shadow-md transition-all hover:bg-gray-50 hover:shadow-lg"
            variant="outline"
          >
            <svg className="h-6 w-6" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <span className="text-base font-medium">{isLoading ? "로그인 중..." : "Google로 시작하기"}</span>
          </Button>

          <p className="text-muted-foreground px-4 text-center text-xs leading-relaxed">
            국민대학교 이메일로 간편하게 로그인하세요
            <br />
            로그인 시 서비스 이용약관 및 개인정보 처리방침에 동의하게 됩니다.
          </p>
        </div>

        <div className="border-border bg-card rounded-xl border p-4 shadow-sm">
          <h2 className="mb-2 text-sm font-semibold">주요 기능</h2>
          <ul className="text-muted-foreground space-y-1.5 text-xs">
            <li className="flex items-center gap-2">
              <span className="bg-primary h-1.5 w-1.5 rounded-full"></span>
              <span>동아리 통합 정보 조회</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="bg-primary h-1.5 w-1.5 rounded-full"></span>
              <span>실시간 모집 현황 확인</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="bg-primary h-1.5 w-1.5 rounded-full"></span>
              <span>질문하기 및 알림 신청</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
