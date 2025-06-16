import { Word } from "@/types/word";

export async function getWords(): Promise<Word[]> {
  const words = await fetch("http://localhost:3000/api/wordList", {
    cache: "no-store",
  });
  return words.json();
}
