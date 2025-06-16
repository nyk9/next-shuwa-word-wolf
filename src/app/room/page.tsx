"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { pusherClient } from "@/lib/pusher/client";
import { Card } from "@/components/ui/card";

interface GameState {
  type: string;
  word: string;
  role: "majority" | "minority";
}

export default function RoomPage() {
  const searchParams = useSearchParams();
  const roomId = searchParams.get("roomId");
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    // ユーザー名を取得
    const storedUsername = localStorage.getItem("user");
    if (!storedUsername) {
      setError("ユーザー名が見つかりません。ログインしてください。");
      return;
    }
    setUsername(storedUsername);

    if (!roomId) {
      setError("ルームIDが見つかりません");
      return;
    }

    // 単語の割り当てを取得
    const fetchWord = async () => {
      try {
        const response = await fetch(`/api/game/assign-words?roomId=${roomId}&username=${storedUsername}`);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "単語の取得に失敗しました");
        }
        const data = await response.json();
        setGameState(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "エラーが発生しました");
      }
    };

    fetchWord();

    // Pusherのイベントをリッスン
    const channel = pusherClient.subscribe("game-channel");
    channel.bind("words-assigned", (data: any) => {
      if (data.roomId === roomId) {
        fetchWord();
      }
    });

    return () => {
      channel.unbind();
    };
  }, [roomId]);

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <Card className="p-6 max-w-md mx-auto bg-red-50">
          <div className="text-red-500">{error}</div>
        </Card>
      </div>
    );
  }

  if (!gameState) {
    return (
      <div className="container mx-auto p-4">
        <Card className="p-6 max-w-md mx-auto">
          <div className="text-center">読み込み中...</div>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <Card className="p-6 max-w-md mx-auto">
        <h1 className="text-2xl font-bold mb-4">お題：{gameState.type}</h1>
        <div className="text-xl mb-4">
          あなたの単語：<span className="font-bold">{gameState.word}</span>
        </div>
      </Card>
    </div>
  );
}
