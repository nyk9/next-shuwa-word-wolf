import { NextRequest, NextResponse } from "next/server";
import { getPusherInstance } from "@/lib/pusher/server";

// ゲームのタイマー状態を管理
const gameTimers = new Map<
  string,
  {
    roomId: string;
    startTime: number;
    duration: number; // ミリ秒
    isVotingPhase: boolean;
  }
>();

export async function POST(req: NextRequest) {
  try {
    const { roomId } = await req.json();
    console.log("Starting timer for room:", roomId);

    if (!roomId) {
      return NextResponse.json(
        { error: "roomId is required" },
        { status: 400 },
      );
    }

    // 4分のタイマーを設定
    const duration = 1 * 6 * 1000; // 4分（ミリ秒）
    gameTimers.set(roomId, {
      roomId,
      startTime: Date.now(),
      duration,
      isVotingPhase: false,
    });

    // Pusherで通知
    const pusherServer = getPusherInstance();
    await pusherServer.trigger("game-channel", "timer-started", {
      roomId,
      startTime: Date.now(),
      duration,
    });

    // 4分後に投票フェーズに移行
    setTimeout(async () => {
      const timer = gameTimers.get(roomId);
      if (timer) {
        timer.isVotingPhase = true;
        console.log("Voting phase started for room:", roomId);

        // 投票フェーズ開始を通知
        await pusherServer.trigger("game-channel", "voting-phase-started", {
          roomId,
        });
      }
    }, duration);

    return NextResponse.json({
      message: "Timer started successfully",
      startTime: Date.now(),
      duration,
    });
  } catch (error) {
    console.error("Error in timer POST:", error);
    return NextResponse.json(
      { error: "Failed to start timer", details: String(error) },
      { status: 500 },
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const roomId = searchParams.get("roomId");

    if (!roomId) {
      return NextResponse.json(
        { error: "roomId is required" },
        { status: 400 },
      );
    }

    const timer = gameTimers.get(roomId);
    if (!timer) {
      return NextResponse.json({ error: "Timer not found" }, { status: 404 });
    }

    const now = Date.now();
    const elapsed = now - timer.startTime;
    const remaining = Math.max(0, timer.duration - elapsed);
    const isVotingPhase = timer.isVotingPhase;

    return NextResponse.json({
      remaining: Math.floor(remaining / 1000),
      isVotingPhase,
      startTime: timer.startTime,
      duration: timer.duration,
    });
  } catch (error) {
    console.error("Error in timer GET:", error);
    return NextResponse.json(
      { error: "Failed to get timer status", details: String(error) },
      { status: 500 },
    );
  }
}
