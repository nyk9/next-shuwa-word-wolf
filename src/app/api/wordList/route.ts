import { WORDLIST } from "@/constants/words";
import { shuffleArray } from "@/lib/shuffleArray";
import { NextResponse } from "next/server";

// 使用済みお題のIDを管理するSet（used-themes APIと同期）
const usedThemes = new Set<number>();

export async function GET() {
  try {
    // 使用済みお題の情報を取得
    const usedThemesResponse = await fetch(
      "http://localhost:3000/api/game/used-themes",
      {
        cache: "no-store",
        method: "GET",
      },
    );

    let usedThemeIds: number[] = [];
    if (usedThemesResponse.ok) {
      usedThemeIds = await usedThemesResponse.json();
    }

    // 単語リストに使用済み状態を追加
    const wordsWithUsedStatus = WORDLIST.map((word) => ({
      ...word,
      isUsed: usedThemeIds.includes(word.id),
    }));

    return NextResponse.json(shuffleArray(wordsWithUsedStatus));
  } catch (error) {
    console.error("Error fetching word list:", error);
    // エラーの場合は使用済み状態なしで返す
    return NextResponse.json(
      shuffleArray(WORDLIST.map((word) => ({ ...word, isUsed: false }))),
    );
  }
}
