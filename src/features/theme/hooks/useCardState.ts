"use client";

import { useState } from "react";

export function useCardState(wordLength: number) {
  const [isOpened, setIsOpened] = useState<boolean[]>(
    Array(wordLength).fill(false),
  );

  const toggleCard = (index: number) => {
    if (!isOpened[index]) {
      setIsOpened((prev) => {
        const newIsOpened = [...prev];
        newIsOpened[index] = !newIsOpened[index];
        return newIsOpened;
      });
    }
  };

  return { isOpened, toggleCard };
}
