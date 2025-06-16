"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { pusherClient } from "@/lib/pusher/client";
import Link from "next/link";

type ResultDisplayProps = {
  roomId: string;
  username: string;
};

type VoteData = {
  votes: Record<string, string>;
  voteCounts: Record<string, number>;
  totalVotes: number;
};

type GameData = {
  word: string;
  role: "majority" | "minority";
  type: string;
  users: string[];
};

export function ResultDisplay({ roomId, username }: ResultDisplayProps) {
  const [voteData, setVoteData] = useState<VoteData | null>(null);
  const [gameData, setGameData] = useState<GameData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        setLoading(true);

        // 投票結果を取得
        const voteResponse = await fetch(`/api/game/vote?roomId=${roomId}`);
        if (voteResponse.ok) {
          const voteData = await voteResponse.json();
          setVoteData(voteData);
          console.log("Vote data:", voteData);
        } else {
          console.error("Failed to fetch vote data");
        }

        // ゲーム状態を取得
        const gameResponse = await fetch(
          `/api/game/assign-words?roomId=${roomId}&username=${username}`,
        );
        if (gameResponse.ok) {
          const gameData = await gameResponse.json();
          setGameData(gameData);
          console.log("Game data:", gameData);
        } else {
          console.error("Failed to fetch game data");
        }
      } catch (error) {
        console.error("Failed to fetch results:", error);
        setError("結果の取得に失敗しました");
      } finally {
        setLoading(false);
      }
    };

    fetchResults();

    // Pusherのイベントをリッスン
    const channel = pusherClient.subscribe("game-channel");
    channel.bind("vote-received", (data: any) => {
      if (data.roomId === roomId) {
        fetchResults();
      }
    });

    return () => {
      channel.unbind();
    };
  }, [roomId, username]);

  const handleStartResultPhase = async () => {
    try {
      const response = await fetch("/api/game/timer", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          roomId,
          action: "start-result-phase",
        }),
      });

      if (!response.ok) {
        throw new Error("結果フェーズの開始に失敗しました");
      }
    } catch (error) {
      console.error("Failed to start result phase:", error);
      setError("結果フェーズの開始に失敗しました");
    }
  };

  const handleResetUsedThemes = async () => {
    try {
      setIsResetting(true);
      setError(null);

      const response = await fetch("/api/game/used-themes", {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "お題のリセットに失敗しました");
      }

      console.log("Used themes reset successfully");
    } catch (error) {
      console.error("Failed to reset used themes:", error);
      setError(
        error instanceof Error ? error.message : "お題のリセットに失敗しました",
      );
    } finally {
      setIsResetting(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-6 max-w-md mx-auto">
        <div className="text-center">結果を読み込み中...</div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6 max-w-md mx-auto">
        <div className="text-red-500 text-center">{error}</div>
      </Card>
    );
  }

  // 投票データがない場合は結果フェーズ開始ボタンを表示
  if (!voteData) {
    return (
      <Card className="p-6 max-w-md mx-auto">
        <div className="text-center">
          <p className="mb-4">投票が完了しました</p>
          <Button onClick={handleStartResultPhase}>結果を表示</Button>
        </div>
      </Card>
    );
  }

  // ゲームデータがない場合は読み込み中を表示
  if (!gameData) {
    return (
      <Card className="p-6 max-w-md mx-auto">
        <div className="text-center">ゲーム情報を読み込み中...</div>
      </Card>
    );
  }

  // 最多得票者を計算
  const maxVotes = Math.max(...Object.values(voteData.voteCounts));
  const mostVotedUsers = Object.entries(voteData.voteCounts)
    .filter(([_, count]) => count === maxVotes)
    .map(([user, _]) => user);

  return (
    <Card className="p-6 max-w-md mx-auto space-y-6">
      <h2 className="text-xl font-bold text-center">ゲーム結果</h2>

      {/* お題情報 */}
      <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">お題：{gameData.type}</h3>
        <div className="space-y-2">
          <div>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              あなたの単語:{" "}
            </span>
            <span className="font-medium">{gameData.word}</span>
          </div>
          <div>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              あなたの役割:{" "}
            </span>
            <span
              className={`font-medium ${gameData.role === "minority" ? "text-red-600" : "text-blue-600"}`}
            >
              {gameData.role === "minority" ? "少数派" : "多数派"}
            </span>
          </div>
        </div>
      </div>

      {/* 投票結果 */}
      <div>
        <h3 className="text-lg font-semibold mb-2">投票結果</h3>
        <div className="space-y-2">
          {Object.entries(voteData.voteCounts).map(([user, count]) => {
            const isMostVoted = mostVotedUsers.includes(user);
            return (
              <div
                key={user}
                className={`p-3 rounded-lg border ${
                  isMostVoted
                    ? "border-yellow-500 bg-yellow-50 dark:bg-yellow-950"
                    : "border-gray-200 dark:border-gray-700"
                }`}
              >
                <div className="flex justify-between items-center">
                  <div className="font-medium">
                    {user}
                    {user === username && " (あなた)"}
                    {isMostVoted && " 👑"}
                  </div>
                  <div className="text-sm text-gray-500">{count}票</div>
                </div>
                <div className="text-sm mt-1 text-gray-600 dark:text-gray-400">
                  投票先: {voteData.votes[user] || "投票なし"}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 最多得票者表示 */}
      <div className="bg-blue-100 dark:bg-blue-900 p-4 rounded-lg text-center">
        <div className="text-lg font-semibold mb-2">最多得票者</div>
        <div className="text-xl font-bold">
          {mostVotedUsers.join(", ")} ({maxVotes}票)
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <Button>
          <Link href={"/serect"}>次のお題へ</Link>
        </Button>
        <Button
          variant="outline"
          onClick={handleResetUsedThemes}
          disabled={isResetting}
          className="text-sm"
        >
          {isResetting ? "リセット中..." : "🔄 使用済みお題をリセット"}
        </Button>
      </div>
    </Card>
  );
}
