import { WORDLIST } from "@/constants/words";
import { shuffleArray } from "@/lib/shuffleArray";
import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json(shuffleArray(WORDLIST));
}
