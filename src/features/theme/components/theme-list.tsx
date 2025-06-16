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
    <div className="w-full">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {words.map((word, index) => (
          <Card
            key={word.id}
            className="group hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer"
          >
            <button
              className="w-full p-10 text-center rounded-xl border-3 border-transparent group-hover:border-blue-400 group-hover:bg-gradient-to-br group-hover:from-blue-50 group-hover:to-purple-50 dark:group-hover:from-blue-950 dark:group-hover:to-purple-950 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-blue-300 focus:ring-opacity-50"
              onClick={() => {
                toggleCard(index);
                handleThemeSelect(word.id);
              }}
              disabled={!isHost}
            >
              <div className="flex flex-col items-center justify-center min-h-[160px]">
                {!isOpened[index] ? (
                  <>
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-full flex items-center justify-center mb-6 text-white text-3xl font-bold shadow-xl group-hover:shadow-2xl transition-shadow duration-300">
                      {index + 1}
                    </div>
                    <span className="text-xl font-semibold text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-gray-100 transition-colors">
                      テーマ {index + 1}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                      {isHost ? "クリックして表示" : "選択不可"}
                    </span>
                  </>
                ) : (
                  <>
                    <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mb-6 text-white text-2xl shadow-xl animate-pulse">
                      🎯
                    </div>
                    <p className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-3">
                      お題：{word.type}
                    </p>
                    <p className="text-base text-green-600 dark:text-green-400 font-medium">
                      クリックして開始
                    </p>
                  </>
                )}
              </div>
            </button>
          </Card>
        ))}
      </div>
    </div>
  );
}
