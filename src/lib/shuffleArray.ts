import { Word } from "@/types/word";

export const shuffleArray = (array: Word[]) => {
  return array.toSorted(() => Math.random() - Math.random());
};
