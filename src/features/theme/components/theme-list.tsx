"use client";
import { Word } from "@/types/word";
import { useCardState } from "../hooks/useCardState";
import { Card } from "@/components/ui/card";
import { useIsHost } from "@/features/user/hooks/useIsHost";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function ThemeList(props: { words: Word[]; users: string[] }) {
  const words = props.words;
  const [users, setUsers] = useState<string[]>(props.users);
  const { isOpened, toggleCard } = useCardState(words.length);
  const isHost = useIsHost();
  const router = useRouter();

  // ユーザーリストを定期的に更新
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch("/api/user");
        if (response.ok) {
          const data = await response.json();
          console.log("Fetched users:", data);
          if (Array.isArray(data) && data.length > 0) {
            setUsers(data);
          }
        }
      } catch (error) {
        console.error("Failed to fetch users:", error);
      }
    };

    // 初回実行
    fetchUsers();

    // 5秒ごとに更新
    const intervalId = setInterval(fetchUsers, 5000);

    return () => {
      clearInterval(intervalId);
    };
  }, []);

  const handleThemeSelect = async (wordId: number) => {
    if (isHost) {
      try {
        console.log("Current users:", users);
        console.log("Selected wordId:", wordId);

        if (!users || users.length === 0) {
          console.error("No users available");
          return;
        }

        // お題の選択を通知
        await fetch("/api/game/select-theme", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            roomId: wordId,
            wordId: wordId,
          }),
        });

        // 単語の割り当てを開始
        const requestBody = {
          roomId: wordId,
          users: users,
        };
        console.log("Assign words request body:", requestBody);

        const response = await fetch("/api/game/assign-words", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error("Failed to assign words:", errorData);
          throw new Error(errorData.error || "Failed to assign words");
        }

        const responseData = await response.json();
        console.log("Assign words response:", responseData);
      } catch (error) {
        console.error("Failed to start game:", error);
      }
    }
    router.push(`/room?roomId=${wordId}`);
  };

  return (
    <div className="flex flex-1/4">
      {words.map((word, index) => (
        <Card key={word.id}>
          <button
            className="text-sm font-medium text-gray-500 hover:text-gray-700"
            onClick={() => {
              toggleCard(index);
              handleThemeSelect(word.id);
            }}
          >
            <div>
              {!isOpened[index] ? (
                <span>{index + 1}</span>
              ) : (
                <p>お題：{word.type}</p>
              )}
            </div>
          </button>
        </Card>
      ))}
    </div>
  );
}
