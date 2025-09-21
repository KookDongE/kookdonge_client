"use client"

import { GalleryVerticalEnd } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function RegisterInfoForm({
                              className,
                              ...props
                          }: React.ComponentProps<"div">) {
    return (
        <div className={cn("flex flex-col gap-6", className)} {...props}>
            <form>
                <div className="flex flex-col gap-6">
                    <div className="flex flex-col items-center gap-2">
                        <a
                            href="#"
                            className="flex flex-col items-center gap-2 font-medium"
                        >
                            <div className="flex size-8 items-center justify-center rounded-md">
                                <GalleryVerticalEnd className="size-6" />
                            </div>
                            <span className="sr-only">Acme Inc.</span>
                        </a>
                        <div className={""}>
                            <h1 className="text-xl font-bold">국동이에 오신것을 환영합니다.</h1>
                            <h1 className="text-xl font-bold">정보를 입력해주세요.</h1>
                        </div>
                    </div>
                    <div className="flex flex-col gap-6">
                        <div className="space-y-8">
                            <div className="space-y-1">
                                <Label htmlFor="department">학과</Label>
                                <Input
                                    id="department"
                                    type="text"
                                    placeholder="컴퓨터공학과"
                                    required
                                />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="studentId">학번</Label>
                                <Input
                                    id="studentId"
                                    type="text"
                                    placeholder="20231234"
                                    required
                                />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="phone">전화번호(동아리 모집시 알림 전송을 위함)</Label>
                                <Input
                                    id="phone"
                                    type="tel"
                                    placeholder="010-1234-5678"
                                    required
                                />
                            </div>
                        </div>
                        <Button type="submit" className="w-full">
                            가입하기
                        </Button>
                    </div>
                </div>
            </form>
        </div>
    )
}
