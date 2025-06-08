export async function getWords() {
  const words = await fetch("http://localhost:3000/api/wordList", {
    cache: "no-store",
  });
  return words.json();
}
