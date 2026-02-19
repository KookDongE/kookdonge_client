'use client';

import { useRouter } from 'next/navigation';

import { motion } from 'framer-motion';

export default function LoginPage() {
  const router = useRouter();

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-[var(--background)] px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm text-center"
      >
        <h1 className="mb-4 text-3xl font-black tracking-tight text-blue-500 dark:text-lime-400">
          KookDongE
        </h1>
        <p className="mb-8 text-sm text-zinc-500 dark:text-zinc-400">
          현재 Google 로그인 기능은 비활성화된 상태입니다.
          <br />
          테스트를 위해 바로 서비스를 이용하실 수 있어요.
        </p>

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => router.replace('/')}
          className="touch-btn w-full rounded-2xl bg-blue-500 px-6 py-4 font-semibold text-white shadow-sm transition-all hover:shadow-md dark:bg-lime-400 dark:text-zinc-900"
        >
          홈으로 이동
        </motion.button>
      </motion.div>
    </div>
  );
}
