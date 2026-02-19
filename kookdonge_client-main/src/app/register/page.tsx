'use client';

import { useRouter } from 'next/navigation';

import { motion } from 'framer-motion';

export default function RegisterPage() {
  const router = useRouter();

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-[var(--background)] px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm text-center"
      >
        <h1 className="mb-4 text-2xl font-black text-zinc-900 dark:text-zinc-100">회원가입</h1>
        <p className="mb-8 text-sm text-zinc-500 dark:text-zinc-400">
          현재 회원가입 기능은 비활성화된 상태입니다.
          <br />
          테스트 환경에서는 로그인 없이도 서비스 이용이 가능합니다.
        </p>

        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => router.replace('/')}
          className="btn-accent touch-btn mt-2 w-full rounded-2xl"
        >
          홈으로 이동
        </motion.button>
      </motion.div>
    </div>
  );
}
