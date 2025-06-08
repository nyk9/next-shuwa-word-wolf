import ThemeList from "@/features/theme/components/theme-list";
import { getWords } from "@/lib/getWords";
import { Word } from "@/types/word";

export default async function SerectPage() {
  const words: Word[] = await getWords();
  return (
    <div className="">
      <ThemeList words={words} />
    </div>
  );
}
