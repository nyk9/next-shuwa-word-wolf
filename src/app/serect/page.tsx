import ThemeList from "@/features/theme/components/theme-list";
import ShowUsername from "@/features/user/components/show-username";
import { getUsers } from "@/lib/getUsers";
import { getWords } from "@/lib/getWords";
import { Word } from "@/types/word";

export default async function SerectPage() {
  const words: Word[] = await getWords();
  const users = await getUsers();
  return (
    <div className="">
      <ShowUsername allUsers={users} />
      <ThemeList words={words} />
    </div>
  );
}
