import { getPusherInstance } from "@/lib/pusher/server";
import { NextRequest, NextResponse } from "next/server";
import { WORDLIST } from "@/constants/words";

const pusherServer = getPusherInstance();

// メモリ上でゲームの状態を管理
const gameStates = new Map<
  string,
  {
    wordId: number;
    assignments: Map<string, { word: string; role: "majority" | "minority" }>;
    createdAt: number;
  }
>();

// 古いゲーム状態をクリーンアップする関数
const cleanupOldGames = () => {
  const oneHourAgo = Date.now() - 60 * 60 * 1000;
  for (const [roomId, state] of gameStates.entries()) {
    if (state.createdAt < oneHourAgo) {
      gameStates.delete(roomId);
      console.log(`Cleaned up old game state for room ${roomId}`);
    }
  }
};

export async function POST(req: NextRequest) {
  try {
    cleanupOldGames();
    const { roomId, users } = await req.json();
    console.log("POST /api/game/assign-words request body:", { roomId, users });

    if (!roomId || !users) {
      console.error("Missing required parameters:", { roomId, users });
      return NextResponse.json(
        { error: "roomId and users are required" },
        { status: 400 },
      );
    }

    if (!Array.isArray(users) || users.length === 0) {
      console.error("Invalid users array:", users);
      return NextResponse.json(
        { error: "users must be a non-empty array" },
        { status: 400 },
      );
    }

    const wordId = parseInt(roomId.toString());
    const word = WORDLIST.find((w) => w.id === wordId);
    if (!word) {
      console.error("Invalid roomId:", roomId);
      return NextResponse.json({ error: "Invalid roomId" }, { status: 400 });
    }

    // 少数派の人数を決定（ユーザー数の20%以上、最低1人）
    const minorityCount = Math.max(1, Math.ceil(users.length * 0.2));
    console.log(
      `Assigning ${minorityCount} minority users out of ${users.length} total users`,
    );

    // ユーザーをシャッフル
    const shuffledUsers = [...users].sort(() => Math.random() - 0.5);

    // 単語の割り当てを作成
    const assignments = new Map();
    shuffledUsers.forEach((username, index) => {
      const isMinority = index < minorityCount;
      assignments.set(username, {
        word: isMinority ? word.minority : word.majority,
        role: isMinority ? "minority" : "majority",
      });
    });

    // ゲーム状態を保存
    const gameState = {
      wordId,
      assignments,
      createdAt: Date.now(),
    };
    gameStates.set(roomId.toString(), gameState);
    console.log("Saved game state:", {
      roomId: roomId.toString(),
      wordId,
      userCount: users.length,
      assignments: Object.fromEntries(assignments),
    });

    // Pusherで通知
    await pusherServer.trigger("game-channel", "words-assigned", {
      roomId: roomId.toString(),
      assignments: Object.fromEntries(assignments),
    });

    return NextResponse.json({
      message: "Words assigned successfully",
      assignments: Object.fromEntries(assignments),
    });
  } catch (error) {
    console.error("Error in POST /api/game/assign-words:", error);
    return NextResponse.json(
      { error: "Failed to assign words", details: String(error) },
      { status: 500 },
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    cleanupOldGames();
    const searchParams = req.nextUrl.searchParams;
    const roomId = searchParams.get("roomId");
    const username = searchParams.get("username");

    console.log("GET /api/game/assign-words params:", { roomId, username });

    if (!roomId || !username) {
      console.error("Missing required parameters:", { roomId, username });
      return NextResponse.json(
        { error: "roomId and username are required" },
        { status: 400 },
      );
    }

    const gameState = gameStates.get(roomId);
    console.log("Current game states:", {
      availableRooms: Array.from(gameStates.keys()),
      requestedRoom: roomId,
      gameState: gameState
        ? {
            wordId: gameState.wordId,
            userCount: gameState.assignments.size,
            createdAt: new Date(gameState.createdAt).toISOString(),
          }
        : null,
    });

    if (!gameState) {
      console.error("Game state not found for roomId:", roomId);
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    const assignment = gameState.assignments.get(username);
    if (!assignment) {
      console.error("Assignment not found for user:", username);
      return NextResponse.json(
        { error: "User assignment not found" },
        { status: 404 },
      );
    }

    const word = WORDLIST.find((w) => w.id === gameState.wordId);
    if (!word) {
      console.error("Word not found for id:", gameState.wordId);
      return NextResponse.json({ error: "Word not found" }, { status: 404 });
    }
    // 現在のゲーム状態からユーザー一覧を取得
    const users = Array.from(gameState.assignments.keys());

    return NextResponse.json({
      word: assignment.word,
      role: assignment.role,
      type: word.type,
      roomId: roomId,
      users: users, // ユーザー一覧を追加
    });
  } catch (error) {
    console.error("Error in GET /api/game/assign-words:", error);
    return NextResponse.json(
      { error: "Failed to get word assignment", details: String(error) },
      { status: 500 },
    );
  }
}
