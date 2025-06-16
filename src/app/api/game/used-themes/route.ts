import { NextRequest, NextResponse } from "next/server";
import { getPusherInstance } from "@/lib/pusher/server";

// 使用済みお題のIDを管理するSet
const usedThemes = new Set<number>();

export async function GET() {
  console.log("GET /api/game/used-themes - Used themes:", Array.from(usedThemes));
  return NextResponse.json(Array.from(usedThemes));
}

export async function POST(req: NextRequest) {
  try {
    const { themeId } = await req.json();
    console.log("POST /api/game/used-themes - Received themeId:", themeId);

    if (!themeId) {
      console.error("Theme ID is required");
      return NextResponse.json({ error: "Theme ID is required" }, { status: 400 });
    }

    // 使用済みお題に追加
    usedThemes.add(themeId);
    console.log("Added used theme:", themeId);
    console.log("Current used themes:", Array.from(usedThemes));

    // Pusherで通知（必要に応じて）
    const pusherServer = getPusherInstance();
    await pusherServer.trigger("game-channel", "theme-used", {
      themeId,
      usedThemes: Array.from(usedThemes),
    });

    return NextResponse.json({
      message: "Theme marked as used successfully",
      themeId,
      usedThemes: Array.from(usedThemes),
    });
  } catch (error) {
    console.error("Error in POST /api/game/used-themes:", error);
    return NextResponse.json(
      { error: "Failed to mark theme as used", details: String(error) },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    // 使用済みお題をすべてリセット
    usedThemes.clear();
    console.log("All used themes cleared");

    // Pusherで通知
    const pusherServer = getPusherInstance();
    await pusherServer.trigger("game-channel", "themes-reset", {
      usedThemes: Array.from(usedThemes),
    });

    return NextResponse.json({
      message: "All used themes cleared successfully",
      usedThemes: Array.from(usedThemes),
    });
  } catch (error) {
    console.error("Error in DELETE /api/game/used-themes:", error);
    return NextResponse.json(
      { error: "Failed to clear used themes", details: String(error) },
      { status: 500 }
    );
  }
}
