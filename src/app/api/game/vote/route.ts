import { NextRequest, NextResponse } from "next/server";
import { getPusherInstance } from "@/lib/pusher/server";

// 投票状態を管理
const votes = new Map<
  string,
  {
    roomId: string;
    votes: Map<string, string>; // 投票者 -> 投票対象
    createdAt: number;
  }
>();

export async function POST(req: NextRequest) {
  try {
    const { roomId, voter, target } = await req.json();
    console.log("Vote received:", { roomId, voter, target });

    if (!roomId || !voter || !target) {
      return NextResponse.json(
        { error: "roomId, voter, and target are required" },
        { status: 400 },
      );
    }

    // 投票状態を取得または作成
    let roomVotes = votes.get(roomId);
    if (!roomVotes) {
      roomVotes = {
        roomId,
        votes: new Map(),
        createdAt: Date.now(),
      };
      votes.set(roomId, roomVotes);
    }

    // 投票を記録
    roomVotes.votes.set(voter, target);

    // Pusherで通知
    const pusherServer = getPusherInstance();
    await pusherServer.trigger("game-channel", "vote-received", {
      roomId,
      voter,
      target,
      voteCount: roomVotes.votes.size,
    });

    return NextResponse.json({
      message: "Vote recorded successfully",
      voteCount: roomVotes.votes.size,
    });
  } catch (error) {
    console.error("Error in vote POST:", error);
    return NextResponse.json(
      { error: "Failed to record vote", details: String(error) },
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

    const roomVotes = votes.get(roomId);
    if (!roomVotes) {
      return NextResponse.json(
        { error: "No votes found for this room" },
        { status: 404 },
      );
    }

    // 投票結果を集計
    const voteCounts = new Map<string, number>();
    for (const target of roomVotes.votes.values()) {
      voteCounts.set(target, (voteCounts.get(target) || 0) + 1);
    }

    return NextResponse.json({
      votes: Object.fromEntries(roomVotes.votes),
      voteCounts: Object.fromEntries(voteCounts),
      totalVotes: roomVotes.votes.size,
    });
  } catch (error) {
    console.error("Error in vote GET:", error);
    return NextResponse.json(
      { error: "Failed to get votes", details: String(error) },
      { status: 500 },
    );
  }
}
