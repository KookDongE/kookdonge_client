'use client';

import { useEffect, useState, type Key } from 'react';
import { useRouter } from 'next/navigation';

import { useQueryClient } from '@tanstack/react-query';
import { Button, Input, ListBox, Select, Spinner } from '@heroui/react';

import { authApi } from '@/features/auth/api';
import { authKeys } from '@/features/auth/hooks';
import { useAuthStore } from '@/features/auth/store';
import { getOrCreateDeviceId } from '@/features/device/device-id';
import { deviceApi } from '@/features/device/api';

const REGISTRATION_STORAGE_KEY = 'kookdonge-registration';

/** 학과 형식: 단과대학 학부/학과명 (백엔드 검증용) */
const DEPARTMENT_OPTIONS = [
  { value: '소프트웨어융합대학 소프트웨어학부', label: '소프트웨어융합대학 소프트웨어학부' },
  { value: '공과대학 공과대학부', label: '공과대학 공과대학부' },
  { value: '글로벌인문대학 글로벌인문대학부', label: '글로벌인문대학 글로벌인문대학부' },
  { value: '사회과학대학 사회과학대학부', label: '사회과학대학 사회과학대학부' },
  { value: '법과대학 법학부', label: '법과대학 법학부' },
  { value: '경제대학 경제학부', label: '경제대학 경제학부' },
  { value: '경영대학 경영학부', label: '경영대학 경영학부' },
  { value: '자유전공학부', label: '자유전공학부' },
  { value: '자동차융합대학 자동차융합대학부', label: '자동차융합대학 자동차융합대학부' },
  { value: '과학기술대학 과학기술대학부', label: '과학기술대학 과학기술대학부' },
  { value: '건축대학 건축학부', label: '건축대학 건축학부' },
  { value: '디자인대학 디자인대학부', label: '디자인대학 디자인대학부' },
  { value: '예술대학 예술대학부', label: '예술대학 예술대학부' },
  { value: '체육대학 체육대학부', label: '체육대학 체육대학부' },
];

function registerDeviceAfterLogin() {
  const deviceId = getOrCreateDeviceId();
  if (!deviceId) return;
  deviceApi
    .registerDevice({
      deviceId,
      fcmToken: 'web-pending',
      platform: 'WEB',
    })
    .catch(() => {});
}

export default function WelcomeRegisterPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const setTokens = useAuthStore((s) => s.setTokens);
  const [registrationToken, setRegistrationToken] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('');
  const [studentId, setStudentId] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(REGISTRATION_STORAGE_KEY);
      if (!raw) {
        router.replace('/login');
        return;
      }
      const data = JSON.parse(raw) as { registrationToken?: string; email?: string };
      if (!data?.registrationToken) {
        sessionStorage.removeItem(REGISTRATION_STORAGE_KEY);
        router.replace('/login');
        return;
      }
      setRegistrationToken(data.registrationToken);
      const defaultName = data.email ? data.email.replace(/@.*$/, '').trim() || '사용자' : '사용자';
      setName(defaultName);
    } catch {
      router.replace('/login');
    } finally {
      setLoading(false);
    }
  }, [router]);

  const handleSubmit = async () => {
    if (!registrationToken) return;
    const trimmedName = name.trim();
    const trimmedDept = department.trim();
    const trimmedStudentId = studentId.trim().replace(/\D/g, '');
    const trimmedPhone = phoneNumber.trim().replace(/\D/g, '');

    if (!trimmedName) {
      setError('이름을 입력해주세요.');
      return;
    }
    if (!trimmedDept) {
      setError('학과를 선택해주세요.');
      return;
    }
    if (trimmedStudentId.length !== 8) {
      setError('학번은 8자리 숫자로 입력해주세요.');
      return;
    }
    if (!/^01[016789]\d{7,8}$/.test(trimmedPhone)) {
      setError('올바른 전화번호 형식으로 입력해주세요. (010-1234-5678)');
      return;
    }
    const phoneFormatted =
      trimmedPhone.length === 10
        ? `${trimmedPhone.slice(0, 3)}-${trimmedPhone.slice(3, 6)}-${trimmedPhone.slice(6)}`
        : `${trimmedPhone.slice(0, 3)}-${trimmedPhone.slice(3, 7)}-${trimmedPhone.slice(7)}`;

    setError('');
    setSubmitting(true);
    try {
      const res = await authApi.completeRegistration({
        registrationToken,
        name: trimmedName,
        department: trimmedDept,
        studentId: trimmedStudentId,
        phoneNumber: phoneFormatted,
      });
      sessionStorage.removeItem(REGISTRATION_STORAGE_KEY);
      if (res.accessToken && res.refreshToken) {
        setTokens(res.accessToken, res.refreshToken);
        try {
          localStorage.setItem(
            'auth-storage',
            JSON.stringify({
              state: { accessToken: res.accessToken, refreshToken: res.refreshToken },
              version: 1,
            })
          );
        } catch {
          // ignore
        }
        queryClient.invalidateQueries({ queryKey: authKeys.profile() });
        registerDeviceAfterLogin();
        router.replace('/welcome');
      } else {
        setError('회원가입 처리에 실패했습니다.');
      }
    } catch {
      setError('회원가입 처리에 실패했습니다. 학과 형식을 확인해주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!registrationToken) return null;

  return (
    <div className="flex min-h-dvh flex-col bg-[var(--background)] px-6 py-8">
      <h1 className="mb-2 text-xl font-bold text-zinc-900 dark:text-zinc-100">
        추가 정보 입력
      </h1>
      <p className="mb-6 text-sm text-zinc-500 dark:text-zinc-400">
        회원가입을 위해 아래 정보를 입력해주세요.
      </p>

      <div className="flex flex-col gap-4">
        <div>
          <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            이름 <span className="text-red-500">*</span>
          </label>
          <Input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="이름"
            maxLength={50}
            className="w-full"
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            학과 <span className="text-red-500">*</span>
          </label>
          <Select
            placeholder="학과 선택"
            value={department || undefined}
            onChange={(value: Key | null) => setDepartment((value as string) ?? '')}
            className="w-full"
          >
            <Select.Trigger className="rounded-xl border border-zinc-200 bg-white text-sm dark:border-zinc-600 dark:bg-zinc-800">
              <Select.Value />
              <Select.Indicator />
            </Select.Trigger>
            <Select.Popover>
              <ListBox>
                {DEPARTMENT_OPTIONS.map((opt) => (
                  <ListBox.Item
                    key={opt.value}
                    id={opt.value}
                    textValue={opt.label}
                    className="!text-zinc-600 dark:!text-zinc-200"
                  >
                    {opt.label}
                  </ListBox.Item>
                ))}
              </ListBox>
            </Select.Popover>
          </Select>
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            학번 <span className="text-red-500">*</span>
          </label>
          <Input
            type="text"
            inputMode="numeric"
            value={studentId}
            onChange={(e) => setStudentId(e.target.value.replace(/\D/g, '').slice(0, 8))}
            placeholder="8자리 숫자"
            maxLength={8}
            className="w-full"
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            전화번호 <span className="text-red-500">*</span>
          </label>
          <Input
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="010-1234-5678"
            className="w-full"
          />
        </div>
        {error && (
          <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
        )}
        <Button
          variant="primary"
          onPress={handleSubmit}
          isPending={submitting}
          isDisabled={
            submitting ||
            !name.trim() ||
            !department.trim() ||
            studentId.replace(/\D/g, '').length !== 8 ||
            !phoneNumber.trim()
          }
          className="mt-2"
        >
          가입 완료
        </Button>
      </div>
    </div>
  );
}
