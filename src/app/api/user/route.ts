// next-shuwa-word-wolf/src/app/api/user/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getPusherInstance } from "@/lib/pusher/server";

// メモリ上でユーザー一覧を管理
const users = new Set<string>();

export async function GET() {
  console.log("GET /api/user - Current users:", Array.from(users));
  return NextResponse.json(Array.from(users));
}

export async function POST(req: NextRequest) {
  try {
    const { username } = await req.json();
    console.log("POST /api/user - Received username:", username);

    if (!username) {
      console.error("Username is required");
      return NextResponse.json({ error: "Username is required" }, { status: 400 });
    }

    // 既に登録済みのユーザーかチェック
    if (users.has(username)) {
      console.log("User already exists:", username);
      return NextResponse.json({ error: "User already exists" }, { status: 400 });
    }

    // 新規ユーザーを追加
    users.add(username);
    console.log("Added new user:", username);
    console.log("Current users:", Array.from(users));

    // Pusherで通知
    const pusherServer = getPusherInstance();
    await pusherServer.trigger("game-channel", "user-added", {
      username,
      userCount: users.size,
    });

    return NextResponse.json({
      message: "User added successfully",
      users: Array.from(users),
    });
  } catch (error) {
    console.error("Error in POST /api/user:", error);
    return NextResponse.json(
      { error: "Failed to add user", details: String(error) },
      { status: 500 }
    );
  }
}
