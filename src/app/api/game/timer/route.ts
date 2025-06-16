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
    isResultPhase: boolean;
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
      isResultPhase: false,
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
    const isResultPhase = timer.isResultPhase;

    return NextResponse.json({
      remaining: Math.floor(remaining / 1000),
      isVotingPhase,
      isResultPhase,
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

export async function PUT(req: NextRequest) {
  try {
    const { roomId, action } = await req.json();
    console.log("Timer action:", { roomId, action });

    if (!roomId || !action) {
      return NextResponse.json(
        { error: "roomId and action are required" },
        { status: 400 },
      );
    }

    const timer = gameTimers.get(roomId);
    if (!timer) {
      return NextResponse.json({ error: "Timer not found" }, { status: 404 });
    }

    if (action === "start-result-phase") {
      timer.isResultPhase = true;
      timer.isVotingPhase = false;

      // Pusherで結果フェーズ開始を通知
      const pusherServer = getPusherInstance();
      await pusherServer.trigger("game-channel", "result-phase-started", {
        roomId,
      });

      return NextResponse.json({
        message: "Result phase started successfully",
        isResultPhase: true,
        isVotingPhase: false,
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Error in timer PUT:", error);
    return NextResponse.json(
      { error: "Failed to update timer", details: String(error) },
      { status: 500 },
    );
  }
}
