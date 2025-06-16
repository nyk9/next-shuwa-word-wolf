import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import GameListener from "@/features/game/components/game-listener";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "手話ゼミ ワードウルフ",
  description: "手話ゼミの学習で使うワードウルフゲーム",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className={inter.className}>
        <GameListener />
        {children}
      </body>
    </html>
  );
}
