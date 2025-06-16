"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { pusherClient } from "@/lib/pusher/client";

type VoteFormProps = {
  roomId: string;
  username: string;
  users: string[];
};

type VoteState = {
  votes: Record<string, string>;
  voteCounts: Record<string, number>;
  totalVotes: number;
};

export function VoteForm({ roomId, username, users }: VoteFormProps) {
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [voteState, setVoteState] = useState<VoteState | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 投票状態を取得
  const fetchVotes = async () => {
    try {
      const response = await fetch(`/api/game/vote?roomId=${roomId}`);
      if (response.ok) {
        const data = await response.json();
        setVoteState(data);
        // 自分が投票済みかチェック
        setHasVoted(data.votes[username] !== undefined);
      }
    } catch (error) {
      console.error("Failed to fetch votes:", error);
    }
  };

  useEffect(() => {
    // 初回実行
    fetchVotes();

    // Pusherのイベントをリッスン
    const channel = pusherClient.subscribe("game-channel");
    channel.bind("vote-received", (data: any) => {
      if (data.roomId === roomId) {
        fetchVotes();
      }
    });

    return () => {
      channel.unbind();
    };
  }, [roomId, username]);

  const handleVote = async () => {
    if (!selectedUser) {
      setError("投票対象を選択してください");
      return;
    }

    try {
      setError(null);
      const response = await fetch("/api/game/vote", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          roomId,
          voter: username,
          target: selectedUser,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "投票に失敗しました");
      }

      setHasVoted(true);
    } catch (error) {
      console.error("Vote error:", error);
      setError(error instanceof Error ? error.message : "投票に失敗しました");
    }
  };

  return (
    <Card className="p-6 max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-4">投票</h2>
      
      {error && (
        <div className="text-red-500 mb-4">{error}</div>
      )}

      {!hasVoted ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            {users
              .filter(user => user !== username) // 自分以外のユーザーを表示
              .map(user => (
                <Button
                  key={user}
                  variant={selectedUser === user ? "default" : "outline"}
                  onClick={() => setSelectedUser(user)}
                  className="w-full"
                >
                  {user}
                </Button>
              ))}
          </div>
          <Button
            onClick={handleVote}
            disabled={!selectedUser}
            className="w-full"
          >
            投票する
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="text-center text-green-600">
            投票が完了しました
          </div>
          {voteState && (
            <div className="space-y-2">
              <div className="text-sm text-gray-500">
                投票状況: {voteState.totalVotes} / {users.length} 票
              </div>
              <div className="space-y-1">
                {Object.entries(voteState.voteCounts).map(([user, count]) => (
                  <div key={user} className="flex justify-between text-sm">
                    <span>{user}</span>
                    <span>{count}票</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
} 