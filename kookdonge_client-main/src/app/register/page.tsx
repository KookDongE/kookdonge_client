'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { motion } from 'framer-motion';

import { useRegister } from '@/features/auth/hooks';

const WELCOME_SEEN_KEY = 'kookdonge-welcome-seen';

export default function RegisterPage() {
  const router = useRouter();
  const register = useRegister();
  const [registrationToken, setRegistrationToken] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('');
  const [studentId, setStudentId] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  useEffect(() => {
    const token = typeof window !== 'undefined' ? sessionStorage.getItem('kookdonge-registration-token') : null;
    const savedEmail = typeof window !== 'undefined' ? sessionStorage.getItem('kookdonge-registration-email') : null;
    if (!token) {
      router.replace('/login');
      return;
    }
    setRegistrationToken(token);
    if (savedEmail) setEmail(savedEmail);
  }, [router]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!registrationToken) return;
    if (!name.trim() || !department.trim() || !studentId.trim() || !phoneNumber.trim()) {
      alert('모든 항목을 입력해 주세요.');
      return;
    }
    const studentIdClean = studentId.replace(/\D/g, '');
    const phoneClean = phoneNumber.replace(/\D/g, '');
    if (studentIdClean.length !== 8) {
      alert('학번은 8자리 숫자로 입력해 주세요.');
      return;
    }
    const phone =
      phoneClean.length >= 10
        ? phoneClean.replace(/^(\d{3})(\d{3,4})(\d{4})$/, '$1-$2-$3')
        : phoneNumber.trim();
    register.mutate(
      {
        registrationToken,
        name: name.trim(),
        department: department.trim(),
        studentId: studentIdClean,
        phoneNumber: phone,
      },
      {
        onSuccess: () => {
          sessionStorage.removeItem('kookdonge-registration-token');
          sessionStorage.removeItem('kookdonge-registration-email');
          const isFirst = typeof window !== 'undefined' && !localStorage.getItem(WELCOME_SEEN_KEY);
          router.replace(isFirst ? '/welcome' : '/home');
        },
        onError: () => alert('회원가입에 실패했습니다. 다시 시도해 주세요.'),
      }
    );
  };

  if (registrationToken === null) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <p className="text-zinc-500">잠시만 기다려 주세요...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col bg-[var(--background)] px-6 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto w-full max-w-sm"
      >
        <h1 className="mb-2 text-xl font-bold text-zinc-900 dark:text-zinc-100">
          추가 정보 입력
        </h1>
        <p className="mb-6 text-sm text-zinc-500 dark:text-zinc-400">
          서비스 이용을 위해 아래 정보를 입력해 주세요.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              이름
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="홍길동"
              className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-zinc-800 placeholder-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              학과
            </label>
            <input
              type="text"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="소프트웨어융합대학 소프트웨어학부"
              className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-zinc-800 placeholder-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              학번 (8자리)
            </label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={8}
              value={studentId}
              onChange={(e) => setStudentId(e.target.value.replace(/\D/g, ''))}
              placeholder="20211234"
              className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-zinc-800 placeholder-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              전화번호
            </label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="010-1234-5678"
              className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-zinc-800 placeholder-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>
          <button
            type="submit"
            disabled={register.isPending}
            className="touch-btn w-full rounded-2xl bg-blue-500 py-4 font-semibold text-white transition-opacity hover:bg-blue-600 disabled:opacity-70 dark:bg-blue-600 dark:hover:bg-blue-700"
          >
            {register.isPending ? '가입 중...' : '가입 완료'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
