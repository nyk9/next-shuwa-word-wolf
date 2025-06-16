"use client";

import { useEffect, useState } from "react";
import { useIsHost } from "../hooks/useIsHost";
import { Card } from "@/components/ui/card";

export default function ShowUsername(props: { allUsers: string[] }) {
  const [user, setUser] = useState<string | null>(null);
  const users = props.allUsers;
  const isHost = useIsHost();

  useEffect(() => {
    setUser(localStorage.getItem("user"));
  }, []);

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* ユーザー情報ヘッダー */}
      <Card className="mb-6">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
              手話ゼミ ワードウルフ
            </h1>
            <div className="flex items-center space-x-2">
              {isHost && (
                <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                  👑 ホスト
                </span>
              )}
              <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-full text-sm font-medium">
                {user || "ゲスト"}
              </span>
            </div>
          </div>

          {/* 参加者一覧 */}
          <div>
            <h2 className="text-lg font-semibold mb-3 text-gray-700 dark:text-gray-300">
              参加者 ({users.length}人)
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {users.map((username, index) => {
                const isCurrentUser = username === user;
                return (
                  <div
                    key={index}
                    className={`
                      flex items-center justify-center p-3 rounded-lg border-2 transition-all
                      ${
                        isCurrentUser
                          ? "bg-blue-50 dark:bg-blue-950 border-blue-300 dark:border-blue-700"
                          : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                      }
                    `}
                  >
                    <div className="text-center">
                      <div
                        className={`
                        w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mb-1
                        ${
                          isCurrentUser
                            ? "bg-blue-500 text-white"
                            : "bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300"
                        }
                      `}
                      >
                        {username.charAt(0).toUpperCase()}
                      </div>
                      <div
                        className={`
                        text-xs font-medium truncate max-w-[60px]
                        ${
                          isCurrentUser
                            ? "text-blue-700 dark:text-blue-300"
                            : "text-gray-600 dark:text-gray-400"
                        }
                      `}
                      >
                        {username}
                        {isCurrentUser && (
                          <div className="text-xs text-blue-500 dark:text-blue-400">
                            (あなた)
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ホスト向けの説明 */}
          {isHost ? (
            <div className="mt-4 p-4 bg-purple-50 dark:bg-purple-950 border border-purple-200 dark:border-purple-800 rounded-lg">
              <p className="text-sm text-purple-700 dark:text-purple-300">
                💡
                ホストとして、下のテーマからお好きなものを選択してゲームを開始できます
              </p>
            </div>
          ) : (
            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                ⏳ ホストがテーマを選択するまでお待ちください
              </p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
