import { getPusherInstance } from "@/lib/pusher/server";
import { NextRequest, NextResponse } from "next/server";

const pusherServer = getPusherInstance();

export async function POST(req: NextRequest) {
  const { roomId, wordId } = await req.json();

  try {
    await pusherServer.trigger("game-channel", "theme-selected", {
      roomId,
      wordId,
      timestamp: new Date(),
    });

    return NextResponse.json({ message: "Theme selected successfully" }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Failed to select theme", error },
      { status: 500 }
    );
  }
} 