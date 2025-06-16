"use client";

import { pusherClient } from "@/lib/pusher/client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function GameListener() {
  const router = useRouter();

  useEffect(() => {
    const channel = pusherClient.subscribe("game-channel");
    
    channel.bind("theme-selected", (data: { roomId: number }) => {
      router.push(`/room?roomId=${data.roomId}`);
    });

    return () => {
      channel.unbind();
    };
  }, [router]);

  return null;
} 