"use client";
import { Word } from "@/types/word";
import { useCardState } from "../hooks/useCardState";
import { Card } from "@/components/ui/card";

export default function ThemeList(props: { words: Word[] }) {
  const words = props.words;
  const { isOpened, toggleCard } = useCardState(words.length);

  return (
    <div className="flex flex-1/4">
      {words.map((word, index) => (
        <Card key={word.id}>
          <button
            className="text-sm font-medium text-gray-500 hover:text-gray-700"
            onClick={() => toggleCard(index)}
          >
            <div>
              {!isOpened[index] ? <p>???</p> : <p>お題：{word.type}</p>}
            </div>
          </button>
        </Card>
      ))}
    </div>
  );
}
