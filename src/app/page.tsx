'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { motion } from 'framer-motion';

import { useAuthStore } from '@/features/auth/store';

const SPLASH_DURATION_MS = 1800;

export default function SplashPage() {
  const router = useRouter();
  const accessToken = useAuthStore((s) => s.accessToken);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (accessToken) {
        router.replace('/home');
      } else {
        router.replace('/login');
      }
    }, SPLASH_DURATION_MS);
    return () => clearTimeout(timer);
  }, [accessToken, router]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-[var(--background)]">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="flex flex-col items-center gap-4"
      >
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-blue-500 shadow-lg dark:bg-lime-400">
          <span className="text-4xl font-black text-white dark:text-zinc-900">K</span>
        </div>
        <h1 className="text-2xl font-black tracking-tight text-blue-500 dark:text-lime-400">
          KookDongE
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          국민대학교 동아리 정보 플랫폼
        </p>
      </motion.div>
      <motion.div
        className="absolute bottom-20 left-1/2 h-1 w-16 -translate-x-1/2 rounded-full bg-zinc-200 dark:bg-zinc-700"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: SPLASH_DURATION_MS / 1000, ease: 'linear' }}
        style={{ originX: 0 }}
      />
    </div>
  );
}
