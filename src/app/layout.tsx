import type { Metadata } from "next";
import { ReactNode } from "react";
import "@/styles/globals.css";
import { QueryProvider } from "@/components/providers/query-provider";

export const metadata: Metadata = {
  title: "국동이",
  description: "국민대학교 동아리",
};

interface Props {
  children: Readonly<ReactNode>;
}

export default function RootLayout({ children }: Props) {
  return (
    <html lang="ko">
      <body>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
