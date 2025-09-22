"use client";

import { GalleryVerticalEnd } from "lucide-react";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMutation } from "@tanstack/react-query";
import registerUser from "@/app/register/register-info/_api/registerUser";
import { toast } from "sonner";

export function RegisterInfoForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const code: string = searchParams.get("code") ?? "";

  const [department, setDepartment] = useState("");
  const [studentId, setStudentId] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  const successRegisterUser = () => {
    toast("환영합니다");
    router.push("/");
  };

  const registerUserMutation = useMutation({
    mutationFn: registerUser,
    onSuccess: successRegisterUser,
  });

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();

    if (code == null || code == "") {
      alert("구글 로그인에 문제가 발생했습니다.");
      return;
    } else if (department == null || department == "") {
      toast("전공을 입력해 주세요");
      return;
    } else if (studentId == null || studentId == "") {
      toast("학번을 입력해 주세요");
      return;
    } else if (phoneNumber == null || phoneNumber == "") {
      toast("전화번호를 입력해 주세요");
      return;
    }

    registerUserMutation.mutate({
      googleGrantCode: code,
      department,
      studentId,
      phoneNumber,
    });
  };

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
              <h1 className="text-xl font-bold">
                국동이에 오신것을 환영합니다.
              </h1>
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
                  value={department}
                  placeholder="컴퓨터공학과"
                  onChange={(e) => setDepartment(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="studentId">학번</Label>
                <Input
                  id="studentId"
                  type="text"
                  value={studentId}
                  placeholder="20231234"
                  onChange={(e) => setStudentId(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="phone">
                  전화번호(동아리 모집시 알림 전송을 위함)
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phoneNumber}
                  placeholder={"01012340987"}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  required
                />
              </div>
            </div>
            <Button type="submit" className="w-full" onClick={handleRegister}>
              가입하기
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
