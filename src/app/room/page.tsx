"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { pusherClient } from "@/lib/pusher/client";
import { Card } from "@/components/ui/card";
import { VoteForm } from "@/features/vote/components/vote-form";
import { ResultDisplay } from "@/features/result/components/result-display";

interface GameState {
  type: string;
  word: string;
  role: "majority" | "minority";
  roomId: string;
  users: string[];
}

type TimerState = {
  remaining: number;
  isVotingPhase: boolean;
  isResultPhase?: boolean;
};

function RoomPageContent() {
  const searchParams = useSearchParams();
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [timerState, setTimerState] = useState<TimerState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsername = async () => {
      const storedUsername = localStorage.getItem("user");
      if (!storedUsername) {
        setError("ユーザー名が設定されていません");
        return null;
      }
      setUsername(storedUsername);
      return storedUsername;
    };

    const fetchAssignedWord = async (currentUsername: string) => {
      try {
        const roomId = searchParams.get("roomId");
        if (!roomId) {
          setError("ルームIDが見つかりません");
          return;
        }

        const response = await fetch(
          `/api/game/assign-words?roomId=${roomId}&username=${currentUsername}`,
        );
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "単語の割り当てに失敗しました");
        }

        const data = await response.json();
        setGameState(data);
        console.log("fetchAssignedWord data: ", data);
      } catch (error) {
        console.error("Failed to fetch assigned word:", error);
        setError(
          error instanceof Error
            ? error.message
            : "単語の割り当てに失敗しました",
        );
      }
    };

    const startTimer = async () => {
      try {
        const roomId = searchParams.get("roomId");
        if (!roomId) return;

        const response = await fetch("/api/game/timer", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ roomId }),
        });

        if (!response.ok) {
          throw new Error("タイマーの開始に失敗しました");
        }
      } catch (error) {
        console.error("Failed to start timer:", error);
      }
    };

    const updateTimer = async () => {
      try {
        const roomId = searchParams.get("roomId");
        if (!roomId) return;

        const response = await fetch(`/api/game/timer?roomId=${roomId}`);
        if (response.ok) {
          const data = await response.json();
          setTimerState(data);
          console.log("updateTimer data: ", data);
        }
      } catch (error) {
        console.error("Failed to update timer:", error);
      }
    };

    const initializeGame = async () => {
      const user = await fetchUsername();
      if (user) {
        await fetchAssignedWord(user);
        await startTimer();
      }
    };

    initializeGame();

    // 1秒ごとに更新
    const timerInterval = setInterval(updateTimer, 1000);

    // Pusherのイベントをリッスン
    const channel = pusherClient.subscribe("game-channel");
    channel.bind("words-assigned", (data: { roomId: string }) => {
      if (data.roomId === searchParams.get("roomId") && username) {
        fetchAssignedWord(username);
      }
    });

    channel.bind("voting-phase-started", (data: { roomId: string }) => {
      if (data.roomId === searchParams.get("roomId")) {
        updateTimer();
      }
    });

    channel.bind("result-phase-started", (data: { roomId: string }) => {
      console.log("result-phase-started event received:", data);
      if (data.roomId === searchParams.get("roomId")) {
        updateTimer();
      }
    });

    return () => {
      clearInterval(timerInterval);
      channel.unbind();
    };
  }, [searchParams, username]);

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  return (
    <div className="container mx-auto p-4 space-y-4">
      {error ? (
        <Card className="p-4">
          <div className="text-red-500">{error}</div>
        </Card>
      ) : !username ? (
        <Card className="p-4">
          <div className="text-center">ユーザー名を設定してください</div>
        </Card>
      ) : !gameState ? (
        <Card className="p-4">
          <div className="text-center">読み込み中...</div>
        </Card>
      ) : (
        <>
          <Card className="p-4">
            <div className="text-center">
              {timerState?.isResultPhase ? (
                <div className="text-xl font-bold text-green-600">結果発表</div>
              ) : timerState?.isVotingPhase ? (
                <div className="text-xl font-bold text-red-600">
                  投票フェーズ
                </div>
              ) : (
                <div className="text-xl font-bold">
                  残り時間: {formatTime(timerState?.remaining || 0)}
                </div>
              )}
              <div className="text-xs text-gray-500 mt-2">
                Debug: isVoting={String(timerState?.isVotingPhase)}, isResult=
                {String(timerState?.isResultPhase)}
              </div>
            </div>
          </Card>

          {timerState?.isResultPhase ? (
            <ResultDisplay roomId={gameState.roomId} username={username} />
          ) : timerState?.isVotingPhase ? (
            <VoteForm
              roomId={gameState.roomId}
              username={username}
              users={gameState.users}
            />
          ) : (
            <Card className="p-4">
              <div className="text-center">
                <div className="text-lg font-bold mb-2">あなたの単語</div>
                <div className="text-xl">{gameState.word}</div>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

export default function RoomPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto p-4">
          <Card className="p-4">
            <div className="text-center">読み込み中...</div>
          </Card>
        </div>
      }
    >
      <RoomPageContent />
    </Suspense>
  );
}
