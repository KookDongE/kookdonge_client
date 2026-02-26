'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { motion } from 'framer-motion';

import { useAuthStore } from '@/features/auth/store';

const WELCOME_SEEN_KEY = 'kookdonge-welcome-seen';

export default function WelcomePage() {
  const router = useRouter();
  const accessToken = useAuthStore((s) => s.accessToken);

  useEffect(() => {
    if (!accessToken) {
      router.replace('/');
      return;
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem(WELCOME_SEEN_KEY, 'true');
    }
  }, [accessToken, router]);

  const handleConfirm = () => {
    router.replace('/home');
  };

  if (!accessToken) return null;

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-[var(--background)] px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm text-center"
      >
        <h1 className="mb-2 text-xl font-bold text-zinc-900 dark:text-zinc-100">
          회원가입이 완료되었습니다
        </h1>
        <p className="mb-8 text-sm text-zinc-500 dark:text-zinc-400">
          KookDongE에서 국민대 동아리 정보를 확인하고
          <br />
          관심 동아리를 탐색해 보세요.
        </p>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleConfirm}
          className="touch-btn w-full rounded-2xl bg-blue-500 px-6 py-4 font-semibold text-white shadow-sm dark:bg-lime-400 dark:text-zinc-900"
        >
          확인
        </motion.button>
      </motion.div>
    </div>
  );
}

export { WELCOME_SEEN_KEY };
